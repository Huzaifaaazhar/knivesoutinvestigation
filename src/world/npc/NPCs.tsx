/**
 * NPC director and renderer. Each second it asks the schedule where everyone
 * should be (given the investigation act and the in-world clock); people then
 * walk there through real doorways and up real stairs, opening doors as they
 * go. During a conversation the speaker stops and turns to face you.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DOORS, LEVEL_Y, ROOM_BY_ID, ZONE_BY_ID, locate, type Level } from '../../data/layout';
import { NPCS, postFor, type NpcDef, type Post } from '../../data/npcs';
import { groundHeight } from '../../systems/architecture';
import { resolve } from '../../systems/collision';
import { staticColliders } from '../../systems/colliders';
import { routeTo } from '../../systems/navigation';
import { npcRt, type NpcRuntime } from '../../state/npcRuntime';
import { runtime, useGame } from '../../state/store';
import { snapshot } from '../../state/story';
import { audio } from '../../audio/audio';
import { Character, type AnimState } from './Character';
import { visibleFor } from '../Scene';

const WALK = 1.25;
const levelOf = (room: string): Level => ROOM_BY_ID[room]?.level ?? 0;

function postKey(id: string, act: number, index: number) {
  return `${id}:${act}:${index}`;
}

export function initNpc(def: NpcDef, act: number, playSeconds: number): NpcRuntime {
  const { post, index } = postFor(def, act, playSeconds);
  const level = levelOf(post.room);
  return {
    id: def.id,
    x: post.x,
    z: post.z,
    y: LEVEL_Y[level],
    level,
    yaw: post.face,
    room: post.room,
    path: [],
    speed: 0,
    pose: post.pose,
    mood: 'neutral',
    gesture: null,
    gestureT: 0,
    talking: false,
    lookAt: null,
    postKey: postKey(def.id, act, index),
    stuckT: 0,
    paceT: Math.random() * 6,
  };
}

/** Doors an NPC may route through: anything not locked (or already unlocked). */
function npcCanUse(doorId: string) {
  const d = DOORS.find((x) => x.id === doorId);
  if (!d?.lock) return true;
  return !!useGame.getState().doors[doorId]?.unlocked;
}

function planPath(rt: NpcRuntime, post: Post) {
  if (rt.room === post.room) {
    rt.path = [{ x: post.x, z: post.z, level: levelOf(post.room) }];
    return;
  }
  const route = routeTo({ x: rt.x, z: rt.z, level: rt.level }, rt.room, post.room, npcCanUse);
  if (!route) {
    // unreachable (shouldn't happen) — appear there instead of getting stuck
    Object.assign(rt, { x: post.x, z: post.z, level: levelOf(post.room), room: post.room, path: [] });
    return;
  }
  if (!ZONE_BY_ID[post.room]) route.pop();
  route.push({ x: post.x, z: post.z, level: levelOf(post.room) });
  rt.path = route;
}

/** Keeps every NPC moving according to the schedule. */
function useDirector() {
  const timer = useRef(0);
  const s0 = useGame.getState();
  const act0 = snapshot().act;
  for (const def of NPCS) if (!npcRt[def.id]) npcRt[def.id] = initNpc(def, act0, s0.playSeconds);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const s = useGame.getState();
    if (s.phase !== 'playing') return;
    const convoWith = s.conversation?.npc;

    timer.current -= dt;
    if (timer.current <= 0) {
      timer.current = 1;
      const act = snapshot().act;
      for (const def of NPCS) {
        const rt = npcRt[def.id];
        const { post, index } = postFor(def, act, s.playSeconds);
        const key = postKey(def.id, act, index);
        if (key !== rt.postKey && convoWith !== def.id) {
          rt.postKey = key;
          rt.pose = 'stand';
          planPath(rt, post);
        }
      }
    }

    for (const def of NPCS) {
      const rt = npcRt[def.id];
      rt.gestureT += dt;
      const { post } = postFor(def, snapshot().act, s.playSeconds);
      // ── in conversation: stop, face the investigator
      if (convoWith === def.id) {
        rt.speed = THREE.MathUtils.damp(rt.speed, 0, 10, dt);
        const want = Math.atan2(runtime.x - rt.x, runtime.z - rt.z);
        rt.yaw = dampAngle(rt.yaw, want, 6, dt);
        if (rt.pose === 'sit' || rt.pose === 'phone' || rt.pose === 'lean' || rt.pose === 'pace') rt.pose = 'stand';
        const c = s.conversation!;
        const line = c.queue[c.index];
        rt.talking = c.mode === 'lines' && line?.by === 'npc';
        rt.lookAt = [runtime.x, runtime.y + 1.6, runtime.z];
        continue;
      }
      rt.talking = false;
      // ── walking a path
      if (rt.path.length) {
        const wp = rt.path[0];
        const dx = wp.x - rt.x;
        const dz = wp.z - rt.z;
        const dist = Math.hypot(dx, dz);
        // wait politely if the investigator is standing right in the way
        const blocked = Math.hypot(runtime.x - rt.x, runtime.z - rt.z) < 0.9 && runtime.level === rt.level && (runtime.x - rt.x) * dx + (runtime.z - rt.z) * dz > 0;
        if (dist < 0.25) {
          rt.path.shift();
          rt.stuckT = 0;
          if (!rt.path.length) {
            rt.pose = post.pose;
          }
        } else if (!blocked) {
          const step = Math.min(dist, WALK * dt);
          const nx = rt.x + (dx / dist) * step;
          const nz = rt.z + (dz / dist) * step;
          const set = staticColliders()[rt.level];
          const p = resolve(nx, nz, 0.26, { segs: set.segs, boxes: set.boxes, circles: [] });
          const moved = Math.hypot(p.x - rt.x, p.z - rt.z);
          rt.stuckT = moved < step * 0.3 ? rt.stuckT + dt : 0;
          if (rt.stuckT > 1.5) {
            // squeeze past whatever is in the way
            rt.x = wp.x;
            rt.z = wp.z;
            rt.stuckT = 0;
          } else {
            rt.x = p.x;
            rt.z = p.z;
          }
          rt.yaw = dampAngle(rt.yaw, Math.atan2(dx, dz), 8, dt);
          rt.speed = THREE.MathUtils.damp(rt.speed, WALK, 6, dt);
          openDoorsNear(rt);
        } else {
          rt.speed = THREE.MathUtils.damp(rt.speed, 0, 8, dt);
        }
        const gh = groundHeight(rt.x, rt.z, rt.level);
        rt.level = gh.level as Level;
        rt.y = THREE.MathUtils.damp(rt.y, gh.y, 12, dt);
        rt.room = locate(rt.x, rt.z, rt.level) ?? rt.room;
        rt.lookAt = null;
        continue;
      }
      // ── at post: idle, or pace back and forth
      if (post.pose === 'pace' && rt.room === post.room) {
        rt.paceT += dt;
        const off = Math.sin(rt.paceT * 0.5) * 1.3;
        const tx = post.x + Math.sin(post.face + Math.PI / 2) * off;
        const tz = post.z + Math.cos(post.face + Math.PI / 2) * off;
        const vx = (tx - rt.x) / Math.max(dt, 1e-3);
        const vz = (tz - rt.z) / Math.max(dt, 1e-3);
        rt.speed = Math.min(1, Math.hypot(vx, vz));
        if (rt.speed > 0.05) rt.yaw = dampAngle(rt.yaw, Math.atan2(vx, vz), 5, dt);
        rt.x = tx;
        rt.z = tz;
      } else {
        rt.speed = THREE.MathUtils.damp(rt.speed, 0, 6, dt);
        rt.yaw = dampAngle(rt.yaw, post.face, 3, dt);
      }
      rt.y = THREE.MathUtils.damp(rt.y, groundHeight(rt.x, rt.z, rt.level).y, 12, dt);
      // react to the investigator nearby: a glance
      const near = Math.hypot(runtime.x - rt.x, runtime.z - rt.z) < 3.5 && runtime.level === rt.level;
      rt.lookAt = near ? [runtime.x, runtime.y + 1.6, runtime.z] : null;
      if (!rt.gesture || rt.gestureT > 3) {
        rt.gesture = null;
        rt.mood = near && def.id === 'ransom' ? 'smug' : near && def.id === 'marta' ? 'nervous' : 'neutral';
      }
    }
  });
}

function openDoorsNear(rt: NpcRuntime) {
  const s = useGame.getState();
  for (const d of DOORS) {
    if (d.level !== rt.level || d.kind === 'arch') continue;
    if (Math.hypot(d.x - rt.x, d.z - rt.z) > 1.3) continue;
    const st = s.doors[d.id];
    if (st && !st.open && (!d.lock || st.unlocked)) {
      s.setDoor(d.id, { open: true });
      if (Math.hypot(d.x - runtime.x, d.z - runtime.z) < 12) audio.play('door-open');
    }
  }
}

function dampAngle(a: number, b: number, l: number, dt: number) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * (1 - Math.exp(-l * dt));
}

const _v = new THREE.Vector3();

function NpcFigure({ def }: { def: NpcDef }) {
  const group = useRef<THREE.Group>(null);
  const anim = useMemo<AnimState>(() => ({ speed: 0, pose: 'stand', mood: 'neutral', gesture: null, gestureT: 0, talking: false, lookYaw: 0, lookPitch: 0 }), []);
  useFrame(() => {
    const rt = npcRt[def.id];
    const gr = group.current;
    if (!rt || !gr) return;
    const s = useGame.getState();
    const vis = visibleFor(s.flashback ? 'hall' : runtime.room);
    const show = !s.flashback && (ZONE_BY_ID[rt.room] ? vis.exterior : vis.levels.has(rt.level));
    gr.visible = show && s.phase === 'playing';
    if (!gr.visible) return;
    gr.position.set(rt.x, rt.y, rt.z);
    gr.rotation.y = rt.yaw;
    anim.speed = rt.speed;
    anim.pose = rt.path.length ? 'stand' : rt.pose;
    anim.mood = rt.mood;
    anim.gesture = rt.gesture;
    anim.gestureT = rt.gestureT;
    anim.talking = rt.talking;
    if (rt.lookAt) {
      _v.set(rt.lookAt[0] - rt.x, rt.lookAt[1] - (rt.y + def.look.height - 0.1), rt.lookAt[2] - rt.z);
      let rel = Math.atan2(_v.x, _v.z) - rt.yaw;
      while (rel > Math.PI) rel -= Math.PI * 2;
      while (rel < -Math.PI) rel += Math.PI * 2;
      anim.lookYaw = Math.abs(rel) < 1.6 ? rel : 0;
      anim.lookPitch = -Math.atan2(_v.y, Math.hypot(_v.x, _v.z)) * 0.6;
    } else {
      anim.lookYaw = 0;
      anim.lookPitch = 0;
    }
  });
  return (
    <group ref={group} name={`npc-${def.id}`}>
      <Character look={def.look} drive={() => anim} />
    </group>
  );
}

export function NPCs() {
  useDirector();
  return (
    <>
      {NPCS.map((d) => (
        <NpcFigure key={d.id} def={d} />
      ))}
    </>
  );
}
