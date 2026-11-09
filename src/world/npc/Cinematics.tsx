import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { LEVEL_Y, locate, type Level } from '../../data/layout';
import { HARLAN_LOOK, NPC_BY_ID, type Appearance } from '../../data/npcs';
import { MEMORY_BY_ID, type MemoryActor } from '../../data/relations';
import { resolve } from '../../systems/collision';
import { staticColliders } from '../../systems/colliders';
import { npcRt } from '../../state/npcRuntime';
import { runtime, useGame } from '../../state/store';
import { Character, type AnimState } from './Character';
import type { Mood } from '../../systems/dialogue';

/** The investigator, seen only in over-the-shoulder conversation shots. */
export const DETECTIVE_LOOK: Appearance = {
  skin: '#e2bfa2',
  hair: '#2a2220',
  hairStyle: 'short',
  top: '#8a7a5a',
  topStyle: 'suit',
  accent: '#d9cbaf',
  bottom: '#2a2a30',
  shoes: '#1a1210',
  height: 1.76,
  build: 1.0,
};

type Shot = { pos: THREE.Vector3; look: THREE.Vector3; key: string };

function freeSpot(p: THREE.Vector3, level: Level, room: string): boolean {
  const set = staticColliders()[level];
  const r = resolve(p.x, p.z, 0.18, { segs: set.segs, boxes: [], circles: [] });
  return Math.hypot(r.x - p.x, r.z - p.z) < 0.01 && locate(p.x, p.z, level) === room;
}

/** Drives the camera during conversations. */
export function ConversationCamera() {
  const { camera } = useThree();
  const cur = useRef<Shot | null>(null);
  const look = useRef(new THREE.Vector3());
  const t = useRef(0);
  useFrame((_, dt) => {
    const s = useGame.getState();
    const c = s.conversation;
    if (!c || s.overlay !== 'conversation') {
      cur.current = null;
      return;
    }
    const rt = npcRt[c.npc];
    if (!rt) return;
    const def = NPC_BY_ID[c.npc];
    const head = new THREE.Vector3(rt.x, rt.y + def.look.height - 0.12, rt.z);
    const eye = new THREE.Vector3(runtime.x, runtime.y + 1.62, runtime.z);
    const toNpc = new THREE.Vector3(head.x - eye.x, 0, head.z - eye.z).normalize();
    const side = new THREE.Vector3(-toNpc.z, 0, toNpc.x);
    const line = c.queue[c.index];
    const npcSpeaking = c.mode === 'lines' && line?.by === 'npc';
    const alt = c.index % 2 === 0 ? 1 : -1;
    let shot: Shot;
    if (npcSpeaking) {
      // close-up from roughly where the investigator stands, slightly off-axis
      let best: THREE.Vector3 | null = null;
      for (const d of [1.15, 0.95, 0.75]) {
        const p = head.clone().addScaledVector(toNpc, -d).addScaledVector(side, 0.32 * alt);
        p.y = head.y - 0.04;
        if (freeSpot(p, rt.level, rt.room)) {
          best = p;
          break;
        }
      }
      shot = { pos: best ?? head.clone().addScaledVector(toNpc, -0.8).setY(head.y), look: head.clone().add(new THREE.Vector3(0, -0.03, 0)), key: `close${alt}` };
    } else {
      // over the investigator's shoulder
      let best: THREE.Vector3 | null = null;
      for (const d of [0.8, 0.55, 0.35]) {
        const p = eye.clone().addScaledVector(toNpc, -d).addScaledVector(side, 0.42);
        p.y = eye.y + 0.08;
        if (freeSpot(p, runtime.level, runtime.room)) {
          best = p;
          break;
        }
      }
      shot = { pos: best ?? eye.clone().addScaledVector(toNpc, -0.2), look: head.clone().add(new THREE.Vector3(0, -0.1, 0)), key: 'ots' };
    }
    t.current += dt;
    if (!cur.current || cur.current.key !== shot.key) {
      // a cut
      cur.current = shot;
      t.current = 0;
      camera.position.copy(shot.pos);
      look.current.copy(shot.look);
    } else {
      // slow dolly drift within the shot
      const drift = shot.pos.clone().addScaledVector(toNpc, Math.min(0.12, t.current * 0.02));
      camera.position.lerp(drift, 1 - Math.exp(-3 * dt));
      look.current.lerp(shot.look, 1 - Math.exp(-6 * dt));
    }
    camera.lookAt(look.current);
  });
  return null;
}

/** The investigator's own figure, visible in over-the-shoulder shots. */
export function PlayerAvatar() {
  const group = useRef<THREE.Group>(null);
  const anim = useMemo<AnimState>(() => ({ speed: 0, pose: 'stand', mood: 'neutral', gesture: null, gestureT: 0, talking: false, lookYaw: 0, lookPitch: 0 }), []);
  useFrame(() => {
    const s = useGame.getState();
    const g = group.current;
    if (!g) return;
    const c = s.conversation;
    g.visible = !!c && s.overlay === 'conversation';
    if (!c) return;
    const rt = npcRt[c.npc];
    g.position.set(runtime.x, runtime.y, runtime.z);
    if (rt) g.rotation.y = Math.atan2(rt.x - runtime.x, rt.z - runtime.z);
    const line = c.queue[c.index];
    anim.talking = c.mode === 'lines' && line?.by === 'player';
    anim.pose = c.mode === 'present' ? 'stand' : 'hands-behind';
  });
  return (
    <group ref={group} visible={false}>
      <Character look={DETECTIVE_LOOK} drive={() => anim} />
    </group>
  );
}

function Actor({ a, memoryId }: { a: MemoryActor; memoryId: string }) {
  const look = a.who === 'harlan' ? HARLAN_LOOK : NPC_BY_ID[a.who].look;
  const anim = useMemo<AnimState>(() => ({ speed: 0, pose: a.pose, mood: 'neutral', gesture: null, gestureT: 0, talking: false, lookYaw: 0, lookPitch: 0 }), [a]);
  useFrame((_, dt) => {
    const f = useGame.getState().flashback;
    if (!f) return;
    const m = MEMORY_BY_ID[memoryId];
    const line = m.lines[f.index];
    anim.talking = !!line && line.who === a.who;
    anim.mood = (line && line.who === a.who ? line.mood : 'neutral') as Mood;
    anim.gestureT += dt;
    if (anim.talking && anim.gestureT > 3) {
      anim.gesture = (['spread-hands', 'nod', 'point', 'hand-chest'] as const)[f.index % 4];
      anim.gestureT = 0;
    }
  });
  return (
    <group position={[a.x, LEVEL_Y[a.level] + (a.pose === 'sit' ? 0.02 : 0), a.z]} rotation={[0, a.face, 0]}>
      <Character look={look} drive={() => anim} />
    </group>
  );
}

/** Stages a memory in the real room, with the camera on a slow push-in. */
export function FlashbackStage() {
  const id = useGame((s) => s.flashback?.id);
  const { camera } = useThree();
  const t = useRef(0);
  useFrame((_, dt) => {
    const f = useGame.getState().flashback;
    if (!f) {
      t.current = 0;
      return;
    }
    const m = MEMORY_BY_ID[f.id];
    t.current += dt;
    const p = new THREE.Vector3(...m.camera.pos);
    const l = new THREE.Vector3(...m.camera.look);
    const push = Math.min(0.6, t.current * 0.025);
    p.lerp(l, push * 0.4);
    camera.position.copy(p);
    camera.lookAt(l);
  });
  if (!id) return null;
  const m = MEMORY_BY_ID[id];
  return (
    <group>
      {m.actors.map((a, i) => (
        <Actor key={`${id}${i}`} a={a} memoryId={id} />
      ))}
    </group>
  );
}
