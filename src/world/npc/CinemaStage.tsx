/**
 * Stages the confrontation and the endings inside the real mansion: the
 * family gathered in the living room, re-enactment figures in sepia in other
 * rooms, and a camera that cuts between close-ups, wides and room shots.
 * The DOM layer (finale/Confrontation, finale/Ending) sets `cine` to direct it.
 */
import { useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { LEVEL_Y } from '../../data/layout';
import { HARLAN_LOOK, NPC_BY_ID } from '../../data/npcs';
import { GATHERING, GATHERING_CENTRE, PODIUM, type SceneActor, type Shot } from '../../data/scenes';
import { useGame } from '../../state/store';
import { Character, type AnimState } from './Character';
import type { Mood } from '../../systems/dialogue';

/** Mutable direction state written by the DOM layer. */
export const cine: { shot: Shot; speaker: string | null; mood: Mood; stage: SceneActor[]; key: number } = {
  shot: { wide: true },
  speaker: null,
  mood: 'neutral',
  stage: [],
  key: 0,
};

export function direct(shot: Shot, speaker: string | null = null, mood: Mood = 'neutral', stage: SceneActor[] = []) {
  cine.shot = shot;
  cine.speaker = speaker;
  cine.mood = mood;
  cine.stage = stage;
  cine.key++;
}

const faceCentre = (a: SceneActor) => a.face ?? Math.atan2(GATHERING_CENTRE.x - a.x, GATHERING_CENTRE.z - a.z) * 0.5 + Math.atan2(PODIUM.x - a.x, PODIUM.z - a.z) * 0.5;

function StageActor({ a }: { a: SceneActor }) {
  const look = a.who === 'harlan' ? HARLAN_LOOK : NPC_BY_ID[a.who]?.look;
  const anim = useMemo<AnimState>(() => ({ speed: 0, pose: a.pose, mood: 'neutral', gesture: null, gestureT: 0, talking: false, lookYaw: 0, lookPitch: 0 }), [a]);
  useFrame((_, dt) => {
    const speaking = cine.speaker === a.who;
    anim.talking = speaking;
    anim.mood = speaking ? cine.mood : a.ghost ? 'neutral' : cine.speaker === 'blanc' && a.who === 'ransom' ? 'defensive' : 'neutral';
    anim.gestureT += dt;
    if (speaking && anim.gestureT > 3.2) {
      anim.gesture = (['spread-hands', 'point', 'nod', 'hand-chest'] as const)[Math.floor(Math.random() * 4)];
      anim.gestureT = 0;
    }
    // everyone else turns their head toward whoever is speaking
    if (!speaking && cine.speaker && !a.ghost) {
      const sp = GATHERING.find((g) => g.who === cine.speaker);
      if (sp) {
        let rel = Math.atan2(sp.x - a.x, sp.z - a.z) - faceCentre(a);
        while (rel > Math.PI) rel -= Math.PI * 2;
        while (rel < -Math.PI) rel += Math.PI * 2;
        anim.lookYaw = Math.abs(rel) < 1.4 ? rel : 0;
      }
    } else anim.lookYaw = 0;
  });
  if (!look) return null;
  return (
    <group position={[a.x, LEVEL_Y[a.level], a.z]} rotation={[0, faceCentre(a), 0]}>
      <Character look={look} drive={() => anim} ghost={a.ghost} />
    </group>
  );
}

function shotCamera(shot: Shot, actors: SceneActor[]): { pos: THREE.Vector3; look: THREE.Vector3 } {
  if ('pos' in shot) return { pos: new THREE.Vector3(...shot.pos), look: new THREE.Vector3(...shot.look) };
  if ('wide' in shot) return { pos: new THREE.Vector3(-6.0, 2.3, 5.4), look: new THREE.Vector3(-11.2, 1.25, 5.0) };
  const a = actors.find((x) => x.who === shot.on) ?? actors[0];
  const h = (a.who === 'harlan' ? HARLAN_LOOK.height : NPC_BY_ID[a.who]?.look.height ?? 1.75) - 0.12;
  const head = new THREE.Vector3(a.x, LEVEL_Y[a.level] + h, a.z);
  const f = faceCentre(a);
  const fwd = new THREE.Vector3(Math.sin(f), 0, Math.cos(f));
  const side = new THREE.Vector3(fwd.z, 0, -fwd.x);
  const pos = head.clone().addScaledVector(fwd, 1.25).addScaledVector(side, 0.3);
  pos.y = head.y - 0.02;
  return { pos, look: head.clone().add(new THREE.Vector3(0, -0.05, 0)) };
}

export function CinemaStage() {
  const scene = useGame((s) => s.cinema?.scene);
  const { camera } = useThree();
  const last = useRef(-1);
  const look = useRef(new THREE.Vector3());
  const t = useRef(0);
  const actors = scene === 'end-unresolved' ? [{ who: 'blanc', x: 4.6, z: -16.6, level: 0 as const, face: Math.PI, pose: 'hands-behind' as const }] : GATHERING;
  useFrame((_, dt) => {
    if (!scene) return;
    t.current += dt;
    const target = shotCamera(cine.shot, actors);
    if (last.current !== cine.key) {
      last.current = cine.key;
      t.current = 0;
      camera.position.copy(target.pos);
      look.current.copy(target.look);
    } else {
      // a slow push-in within each shot
      const push = target.pos.clone().lerp(target.look, Math.min(0.12, t.current * 0.012));
      camera.position.lerp(push, 1 - Math.exp(-2 * dt));
      look.current.lerp(target.look, 1 - Math.exp(-4 * dt));
    }
    camera.lookAt(look.current);
  });
  if (!scene) return null;
  return (
    <group>
      {actors.map((a) => (
        <StageActor key={a.who} a={a} />
      ))}
      <Ghosts />
    </group>
  );
}

/** Re-enactment figures for the current beat (re-rendered whenever the shot changes). */
function Ghosts() {
  const keyRef = useRef(-1);
  const [, setTick] = useState(0);
  useFrame(() => {
    if (keyRef.current !== cine.key) {
      keyRef.current = cine.key;
      setTick(cine.key);
    }
  });
  return (
    <group>
      {cine.stage.map((a, i) => (
        <StageActor key={`${cine.key}-${i}`} a={a} />
      ))}
    </group>
  );
}
