import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../state/store';

/** A slow approach from the county road toward the lit house. */
export function IntroCamera() {
  const { camera } = useThree();
  const t0 = useRef<number | null>(null);
  const look = useRef(new THREE.Vector3(0, 6, 0));
  const from = new THREE.Vector3(-14, 22, 150);
  const to = new THREE.Vector3(5, 5.5, 66);
  useFrame(({ clock }) => {
    const phase = useGame.getState().phase;
    if (phase === 'playing') return;
    if (t0.current === null) t0.current = clock.elapsedTime;
    const reduced = useGame.getState().settings.reducedMotion;
    const t = clock.elapsedTime - t0.current;
    const dur = reduced ? 1 : 18;
    const k = Math.min(1, t / dur);
    const e = 1 - Math.pow(1 - k, 3);
    const p = from.clone().lerp(to, e);
    // gentle drift after arrival
    const drift = reduced ? 0 : Math.max(0, t - dur * 0.6);
    p.x += Math.sin(drift * 0.08) * 3;
    p.y += Math.sin(drift * 0.11) * 0.4;
    camera.position.copy(p);
    look.current.set(0, 5.5 + (1 - e) * 2, 4);
    camera.lookAt(look.current);
  });
  return null;
}
