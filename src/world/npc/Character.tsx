/**
 * Stylised, original character figures — deliberately not actor likenesses.
 * Built from rounded parts with a jointed skeleton animated procedurally:
 * walking, idle breathing and weight shifts, glances, seated / leaning /
 * phone / arms-crossed poses, conversational gestures, and a simple face
 * (brows, blinking eyes, mouth) driven by mood.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { Appearance, Pose } from '../../data/npcs';
import type { Gesture, Mood } from '../../systems/dialogue';
import { M } from '../kit';

export interface AnimState {
  /** Metres per second currently being walked. */
  speed: number;
  pose: Pose;
  mood: Mood;
  gesture: Gesture | null;
  /** Seconds since the gesture started. */
  gestureT: number;
  talking: boolean;
  /** Head turn relative to the body (radians). */
  lookYaw: number;
  lookPitch: number;
}

const MOOD_FACE: Record<Mood, { brow: number; browTilt: number; mouth: number; open: number; eye: number }> = {
  neutral: { brow: 0, browTilt: 0, mouth: 0, open: 0, eye: 1 },
  warm: { brow: 0.01, browTilt: -0.1, mouth: 0.6, open: 0, eye: 0.9 },
  amused: { brow: 0.015, browTilt: 0.15, mouth: 0.8, open: 0.2, eye: 0.85 },
  smug: { brow: 0.01, browTilt: 0.35, mouth: 0.5, open: 0, eye: 0.8 },
  irritated: { brow: -0.012, browTilt: -0.3, mouth: -0.3, open: 0, eye: 0.85 },
  angry: { brow: -0.02, browTilt: -0.5, mouth: -0.6, open: 0.3, eye: 1 },
  nervous: { brow: 0.02, browTilt: 0.3, mouth: -0.2, open: 0.1, eye: 1.1 },
  sad: { brow: 0.015, browTilt: 0.45, mouth: -0.5, open: 0, eye: 0.8 },
  surprised: { brow: 0.03, browTilt: 0, mouth: 0, open: 0.8, eye: 1.3 },
  defensive: { brow: -0.008, browTilt: -0.2, mouth: -0.2, open: 0, eye: 0.95 },
  sick: { brow: 0.02, browTilt: 0.4, mouth: -0.4, open: 0.2, eye: 0.75 },
  thoughtful: { brow: 0.008, browTilt: 0.2, mouth: 0.1, open: 0, eye: 0.85 },
};

function Part({ s, p, m, r = 0.05 }: { s: [number, number, number]; p?: [number, number, number]; m: THREE.Material; r?: number }) {
  return <RoundedBox args={s} radius={Math.min(r, s[0] / 2.05, s[1] / 2.05, s[2] / 2.05)} smoothness={3} position={p} material={m} />;
}

function Limb({ len, r, m }: { len: number; r: number; m: THREE.Material }) {
  return (
    <mesh position={[0, -len / 2, 0]} material={m}>
      <capsuleGeometry args={[r, Math.max(0.01, len - r * 2), 4, 10]} />
    </mesh>
  );
}

const damp = THREE.MathUtils.damp;

export function Character({ look, drive, ghost = false }: { look: Appearance; drive: () => AnimState; ghost?: boolean }) {
  const mats = useMemo(() => {
    const mk = (c: string, rough = 0.85, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
      new THREE.MeshStandardMaterial({ color: c, roughness: rough, transparent: ghost, opacity: ghost ? 0.92 : 1, ...extra });
    return {
      skin: mk(look.skin, 0.6),
      hair: mk(look.hair, 0.7),
      top: look.topStyle === 'cable' ? mk(look.top, 1, { bumpMap: cableBump(), bumpScale: 2.5 }) : mk(look.top, look.topStyle === 'suit' || look.topStyle === 'blazer' ? 0.55 : 0.95),
      accent: mk(look.accent, 0.6),
      bottom: mk(look.bottom, 0.8),
      shoes: mk(look.shoes, 0.4),
      eye: new THREE.MeshBasicMaterial({ color: '#1a120e' }),
      white: new THREE.MeshBasicMaterial({ color: '#efe8dc' }),
      mouth: new THREE.MeshBasicMaterial({ color: '#5a2a24' }),
      brow: mk(look.hair === '#ece8e0' ? '#d8d2c8' : look.hair, 0.9),
      glass: M.chrome(),
    };
  }, [look, ghost]);

  const H = look.height;
  const k = H / 1.75;
  const hip = 0.92 * k;
  const torsoLen = 0.52 * k;
  const w = 0.36 * look.build;

  const root = useRef<THREE.Group>(null);
  const pelvis = useRef<THREE.Group>(null);
  const chest = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const foreL = useRef<THREE.Group>(null);
  const foreR = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const shinL = useRef<THREE.Group>(null);
  const shinR = useRef<THREE.Group>(null);
  const browL = useRef<THREE.Mesh>(null);
  const browR = useRef<THREE.Mesh>(null);
  const eyeL = useRef<THREE.Group>(null);
  const eyeR = useRef<THREE.Group>(null);
  const mouth = useRef<THREE.Mesh>(null);
  const mouthCorner = useRef<THREE.Group>(null);
  const phase = useRef(Math.random() * 10);
  const blink = useRef(0);
  const nextBlink = useRef(2 + Math.random() * 3);
  const glance = useRef({ yaw: 0, t: 3 + Math.random() * 4 });

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const a = drive();
    const t = clock.elapsedTime + phase.current;
    const walking = a.speed > 0.15;
    phase.current += a.speed * dt * 3.4;
    const cyc = phase.current;
    const swing = walking ? Math.min(1, a.speed / 1.3) : 0;
    const sit = a.pose === 'sit';

    // ── legs
    const lt = (target: number, g: THREE.Group | null, l = 10) => g && (g.rotation.x = damp(g.rotation.x, target, l, dt));
    if (sit) {
      lt(-1.5, legL.current);
      lt(-1.5, legR.current);
      lt(1.5, shinL.current);
      lt(1.5, shinR.current);
    } else {
      lt(Math.sin(cyc) * 0.55 * swing, legL.current);
      lt(-Math.sin(cyc) * 0.55 * swing, legR.current);
      lt(Math.max(0, -Math.cos(cyc)) * 0.8 * swing + (a.pose === 'lean' ? 0.05 : 0), shinL.current);
      lt(Math.max(0, Math.cos(cyc)) * 0.8 * swing, shinR.current);
    }
    if (pelvis.current) {
      const bob = walking ? Math.abs(Math.sin(cyc)) * 0.03 : Math.sin(t * 0.9) * 0.004;
      pelvis.current.position.y = damp(pelvis.current.position.y, sit ? hip - 0.45 * k : hip + bob, 8, dt);
      pelvis.current.position.z = damp(pelvis.current.position.z, sit ? -0.12 : 0, 8, dt);
      const shift = !walking && !sit ? Math.sin(t * 0.35) * 0.03 : 0;
      pelvis.current.rotation.z = damp(pelvis.current.rotation.z, shift + (a.pose === 'lean' ? 0.06 : 0), 3, dt);
    }

    // ── torso & breathing
    if (chest.current) {
      const breath = Math.sin(t * 1.6) * 0.012;
      const moodLean = a.mood === 'defensive' || a.gesture === 'step-back' ? -0.08 : a.gesture === 'lean-in' ? 0.14 : a.mood === 'sad' || a.mood === 'sick' ? 0.1 : 0;
      chest.current.rotation.x = damp(chest.current.rotation.x, breath + moodLean + (walking ? 0.05 : 0), 6, dt);
      chest.current.rotation.y = damp(chest.current.rotation.y, walking ? Math.sin(cyc) * 0.08 : 0, 6, dt);
      chest.current.scale.setScalar(1 + Math.sin(t * 1.6) * 0.006);
    }

    // ── arms
    const g = a.gesture;
    const gt = a.gestureT;
    const gAmt = g ? Math.min(1, gt * 4) * Math.max(0, Math.min(1, (2.6 - gt) * 2)) : 0;
    let lA = { x: Math.sin(cyc + Math.PI) * 0.5 * swing, z: -0.08, f: 0.15 + swing * 0.2 };
    let rA = { x: Math.sin(cyc) * 0.5 * swing, z: 0.08, f: 0.15 + swing * 0.2 };
    const crossed = a.pose === 'arms-crossed' || g === 'cross-arms' || (a.mood === 'defensive' && !walking);
    if (crossed) {
      lA = { x: -0.7, z: 0.35, f: 1.9 };
      rA = { x: -0.8, z: -0.35, f: 1.95 };
    } else if (a.pose === 'hands-behind') {
      lA = { x: 0.35, z: 0.25, f: 0.9 };
      rA = { x: 0.35, z: -0.25, f: 0.9 };
    } else if (a.pose === 'phone') {
      rA = { x: -0.4, z: -0.9, f: 2.4 };
      lA = { x: 0.05, z: 0.12, f: 0.25 };
    } else if (a.pose === 'lean') {
      rA = { x: -1.3, z: 0.5, f: 0.4 };
    } else if (sit) {
      lA = { x: -0.7, z: 0.15, f: 0.6 };
      rA = { x: -0.7, z: -0.15, f: 0.6 };
    }
    if (g && gAmt > 0) {
      const mix = (from: typeof lA, to: typeof lA) => ({ x: from.x + (to.x - from.x) * gAmt, z: from.z + (to.z - from.z) * gAmt, f: from.f + (to.f - from.f) * gAmt });
      switch (g) {
        case 'point':
          rA = mix(rA, { x: -1.4, z: -0.15, f: 0.15 });
          break;
        case 'spread-hands':
          lA = mix(lA, { x: -0.6, z: -0.55, f: 1.1 });
          rA = mix(rA, { x: -0.6, z: 0.55, f: 1.1 });
          break;
        case 'shrug':
          lA = mix(lA, { x: -0.3, z: -0.5, f: 1.3 });
          rA = mix(rA, { x: -0.3, z: 0.5, f: 1.3 });
          break;
        case 'hand-chest':
          rA = mix(rA, { x: -0.5, z: -0.35, f: 2.0 });
          break;
        case 'hand-mouth':
          rA = mix(rA, { x: -1.0, z: -0.25, f: 2.5 });
          break;
        case 'wave-off':
          rA = mix(rA, { x: -0.9 + Math.sin(gt * 9) * 0.15, z: -0.2, f: 1.4 });
          break;
        case 'adjust-glasses':
          rA = mix(rA, { x: -1.1, z: -0.2, f: 2.6 });
          break;
      }
    }
    if (a.talking && !g && !crossed && a.pose !== 'phone') {
      rA.x += Math.sin(t * 3.1) * 0.12 - 0.25;
      rA.f += 0.5 + Math.sin(t * 2.3) * 0.2;
    }
    const setArm = (arm: THREE.Group | null, fore: THREE.Group | null, v: typeof lA) => {
      if (arm) {
        arm.rotation.x = damp(arm.rotation.x, v.x, 9, dt);
        arm.rotation.z = damp(arm.rotation.z, v.z, 9, dt);
      }
      if (fore) fore.rotation.x = damp(fore.rotation.x, -v.f, 9, dt);
    };
    setArm(armL.current, foreL.current, lA);
    setArm(armR.current, foreR.current, rA);

    // ── head: look target, glances, nods
    glance.current.t -= dt;
    if (glance.current.t < 0) {
      glance.current.t = 2.5 + Math.random() * 5;
      glance.current.yaw = a.talking ? (Math.random() - 0.5) * 0.3 : (Math.random() - 0.5) * 1.2;
    }
    if (head.current) {
      let yaw = a.lookYaw + (walking ? 0 : glance.current.yaw * (a.talking ? 0.3 : 1));
      let pitch = a.lookPitch;
      if (g === 'look-away' && gAmt > 0) yaw += 0.7 * gAmt;
      if (g === 'nod' && gAmt > 0) pitch += Math.sin(gt * 10) * 0.18 * gAmt;
      if (g === 'shake' && gAmt > 0) yaw += Math.sin(gt * 12) * 0.25 * gAmt;
      if (a.mood === 'sad' || a.mood === 'sick') pitch += 0.15;
      if (a.mood === 'smug') pitch -= 0.08;
      if (a.mood === 'nervous' && !a.talking) yaw += Math.sin(t * 1.7) * 0.25;
      if (a.talking) pitch += Math.sin(t * 5.3) * 0.03;
      head.current.rotation.y = damp(head.current.rotation.y, THREE.MathUtils.clamp(yaw, -1.1, 1.1), 6, dt);
      head.current.rotation.x = damp(head.current.rotation.x, pitch, 6, dt);
    }

    // ── face
    const f = MOOD_FACE[a.mood] ?? MOOD_FACE.neutral;
    nextBlink.current -= dt;
    if (nextBlink.current < 0) {
      blink.current = 0.14;
      nextBlink.current = 2 + Math.random() * 4;
    }
    blink.current = Math.max(0, blink.current - dt);
    const eyeS = blink.current > 0 ? 0.1 : f.eye;
    for (const e of [eyeL.current, eyeR.current]) if (e) e.scale.y = damp(e.scale.y, eyeS, 30, dt);
    if (browL.current && browR.current) {
      browL.current.position.y = damp(browL.current.position.y, 0.055 + f.brow, 10, dt);
      browR.current.position.y = damp(browR.current.position.y, 0.055 + f.brow + (a.mood === 'smug' ? 0.012 : 0), 10, dt);
      browL.current.rotation.z = damp(browL.current.rotation.z, -f.browTilt * 0.6, 10, dt);
      browR.current.rotation.z = damp(browR.current.rotation.z, f.browTilt * 0.6, 10, dt);
    }
    if (mouth.current) {
      const talk = a.talking ? Math.abs(Math.sin(t * 13)) * 0.7 + 0.1 : 0;
      mouth.current.scale.y = damp(mouth.current.scale.y, 0.5 + (f.open + talk) * 1.1, 18, dt);
      mouth.current.scale.x = damp(mouth.current.scale.x, 1 + f.mouth * 0.25, 10, dt);
    }
    if (mouthCorner.current) mouthCorner.current.rotation.z = damp(mouthCorner.current.rotation.z, 0, 10, dt);
    if (mouthCorner.current) mouthCorner.current.position.y = damp(mouthCorner.current.position.y, -0.055 + f.mouth * 0.006, 10, dt);
    // sick: green tinge
    if (mats.skin) mats.skin.color.lerp(new THREE.Color(a.mood === 'sick' ? '#b7b48a' : look.skin), Math.min(1, dt * 2));
    if (root.current && sit) root.current.position.y = 0;
  });

  const shoulderY = torsoLen * 0.92;
  const armLen = 0.3 * k;
  const foreLen = 0.28 * k;
  const thigh = 0.46 * k;
  const shin = 0.44 * k;
  const longCoat = look.topStyle === 'suit' || look.topStyle === 'blazer';

  return (
    <group ref={root}>
      <group ref={pelvis} position={[0, hip, 0]}>
        <Part s={[w, 0.2, 0.22]} p={[0, 0, 0]} m={mats.bottom} r={0.07} />
        {/* legs */}
        {[
          [legL, shinL, -w * 0.27],
          [legR, shinR, w * 0.27],
        ].map(([leg, sh, x], i) => (
          <group key={i} ref={leg as React.RefObject<THREE.Group>} position={[x as number, -0.05, 0]}>
            <Limb len={thigh} r={0.075 * look.build} m={mats.bottom} />
            <group ref={sh as React.RefObject<THREE.Group>} position={[0, -thigh, 0]}>
              <Limb len={shin} r={0.06 * look.build} m={mats.bottom} />
              <Part s={[0.11, 0.07, 0.26]} p={[0, -shin - 0.01, 0.05]} m={mats.shoes} r={0.03} />
            </group>
          </group>
        ))}
        {/* torso */}
        <group ref={chest} position={[0, 0.06, 0]}>
          <Part s={[w * 1.02, torsoLen, 0.25 * look.build]} p={[0, torsoLen / 2, 0]} m={mats.top} r={0.09} />
          {longCoat && <Part s={[w * 1.05, 0.22, 0.27 * look.build]} p={[0, -0.04, 0]} m={mats.top} r={0.06} />}
          {/* lapels / collar / tie / scarf */}
          {(look.topStyle === 'suit' || look.topStyle === 'blazer') && (
            <>
              <mesh position={[0, torsoLen * 0.78, 0.126 * look.build]} rotation={[0, 0, Math.PI]} material={mats.accent}>
                <coneGeometry args={[0.07, 0.2, 3]} />
              </mesh>
              {look.tie && <Part s={[0.04, 0.24, 0.02]} p={[0, torsoLen * 0.58, 0.13 * look.build]} m={M.color('#5a1a24', 0.5)} r={0.01} />}
            </>
          )}
          {look.topStyle === 'cardigan' && <Part s={[0.05, torsoLen * 0.9, 0.02]} p={[0, torsoLen * 0.48, 0.128 * look.build]} m={mats.accent} r={0.01} />}
          {look.topStyle === 'hoodie' && <Part s={[w * 0.8, 0.1, 0.18]} p={[0, torsoLen + 0.02, -0.08]} m={mats.top} r={0.05} />}
          {look.topStyle === 'cable' && <Part s={[w * 0.55, 0.06, 0.24]} p={[0, torsoLen - 0.01, 0.01]} m={mats.top} r={0.03} />}
          {look.scarf && (
            <>
              <mesh position={[0, torsoLen + 0.01, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.accent}>
                <torusGeometry args={[0.1, 0.035, 8, 16]} />
              </mesh>
              <Part s={[0.07, 0.3, 0.03]} p={[0.06, torsoLen * 0.65, 0.13]} m={mats.accent} r={0.015} />
            </>
          )}
          {/* neck & head */}
          <mesh position={[0, torsoLen + 0.04, 0]} material={mats.skin}>
            <cylinderGeometry args={[0.05, 0.055, 0.1, 10]} />
          </mesh>
          <group ref={head} position={[0, torsoLen + 0.17 * k, 0]}>
            <mesh material={mats.skin} scale={[0.95, 1.12, 1]}>
              <sphereGeometry args={[0.11 * k, 20, 16]} />
            </mesh>
            <mesh position={[0, -0.01, 0.105 * k]} material={mats.skin}>
              <sphereGeometry args={[0.022, 8, 6]} />
            </mesh>
            <mesh position={[-0.105 * k, 0, 0]} material={mats.skin} scale={[0.4, 1, 0.7]}>
              <sphereGeometry args={[0.03, 8, 6]} />
            </mesh>
            <mesh position={[0.105 * k, 0, 0]} material={mats.skin} scale={[0.4, 1, 0.7]}>
              <sphereGeometry args={[0.03, 8, 6]} />
            </mesh>
            {/* eyes */}
            {[
              [eyeL, -0.038],
              [eyeR, 0.038],
            ].map(([ref, x], i) => (
              <group key={i} ref={ref as React.RefObject<THREE.Group>} position={[(x as number) * k, 0.025, 0.094 * k]}>
                <mesh material={mats.white} scale={[1.3, 0.85, 0.5]}>
                  <sphereGeometry args={[0.016, 10, 8]} />
                </mesh>
                <mesh position={[0, 0, 0.006]} material={mats.eye}>
                  <sphereGeometry args={[0.009, 8, 6]} />
                </mesh>
              </group>
            ))}
            <mesh ref={browL} position={[-0.04 * k, 0.055, 0.1 * k]} material={mats.brow}>
              <boxGeometry args={[0.04, 0.009, 0.012]} />
            </mesh>
            <mesh ref={browR} position={[0.04 * k, 0.055, 0.1 * k]} material={mats.brow}>
              <boxGeometry args={[0.04, 0.009, 0.012]} />
            </mesh>
            <group ref={mouthCorner} position={[0, -0.055, 0.1 * k]}>
              <mesh ref={mouth} material={mats.mouth}>
                <boxGeometry args={[0.042, 0.008, 0.01]} />
              </mesh>
            </group>
            {look.glasses && (
              <group position={[0, 0.025, 0.105 * k]}>
                {[-0.038, 0.038].map((x) => (
                  <mesh key={x} position={[x * k, 0, 0]} material={mats.glass}>
                    <torusGeometry args={[0.02, 0.003, 4, 14]} />
                  </mesh>
                ))}
                <mesh material={mats.glass}>
                  <boxGeometry args={[0.03, 0.003, 0.003]} />
                </mesh>
              </group>
            )}
            {look.beard && (
              <mesh position={[0, -0.06, 0.06 * k]} material={mats.hair} scale={[1, 0.8, 0.7]}>
                <sphereGeometry args={[0.075 * k, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
              </mesh>
            )}
            <Hair style={look.hairStyle} m={mats.hair} k={k} />
          </group>
          {/* arms */}
          {[
            [armL, foreL, -1],
            [armR, foreR, 1],
          ].map(([arm, fore, side], i) => (
            <group key={i} ref={arm as React.RefObject<THREE.Group>} position={[(side as number) * (w * 0.55), shoulderY, 0]}>
              <Limb len={armLen} r={0.05 * look.build} m={mats.top} />
              <group ref={fore as React.RefObject<THREE.Group>} position={[0, -armLen, 0]}>
                <Limb len={foreLen} r={0.042 * look.build} m={mats.top} />
                <mesh position={[0, -foreLen - 0.03, 0]} material={mats.skin} scale={[0.8, 1.1, 0.6]}>
                  <sphereGeometry args={[0.04, 10, 8]} />
                </mesh>
              </group>
            </group>
          ))}
        </group>
      </group>
    </group>
  );
}

function Hair({ style, m, k }: { style: Appearance['hairStyle']; m: THREE.Material; k: number }) {
  const R = 0.115 * k;
  const cap = (
    <mesh position={[0, 0.05, -0.012]} material={m} scale={[1.0, 1.0, 1.05]}>
      <sphereGeometry args={[R, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.42]} />
    </mesh>
  );
  switch (style) {
    case 'white':
      return (
        <group>
          <mesh position={[0, 0.03, -0.01]} material={m} scale={[1.05, 0.95, 1.08]}>
            <sphereGeometry args={[R, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.42]} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.1 * k, 0.0, -0.03]} material={m} scale={[0.5, 0.9, 0.9]}>
              <sphereGeometry args={[0.05, 10, 8]} />
            </mesh>
          ))}
        </group>
      );
    case 'receding':
      return (
        <mesh position={[0, 0.01, -0.03]} material={m} scale={[1.02, 1.0, 1.0]}>
          <sphereGeometry args={[R, 18, 12, Math.PI * 0.8, Math.PI * 1.4, 0.35, Math.PI * 0.4]} />
        </mesh>
      );
    case 'tousled':
      return (
        <group>
          {cap}
          {Array.from({ length: 7 }, (_, i) => (
            <mesh key={i} position={[Math.cos(i * 0.9) * 0.06, 0.1 * k, 0.02 + Math.sin(i * 0.9) * 0.05]} rotation={[0.4, i, 0.3]} material={m}>
              <coneGeometry args={[0.035, 0.07, 5]} />
            </mesh>
          ))}
        </group>
      );
    case 'swept':
      return (
        <group>
          {cap}
          <mesh position={[0.02, 0.09 * k, 0.04]} rotation={[0.3, 0, -0.4]} material={m} scale={[1.4, 0.5, 1]}>
            <sphereGeometry args={[0.06, 10, 8]} />
          </mesh>
        </group>
      );
    case 'bob':
      return (
        <group>
          {cap}
          <mesh position={[0, -0.03, -0.02]} material={m} scale={[1.08, 0.9, 1.05]}>
            <cylinderGeometry args={[R, R * 1.05, 0.14, 18, 1, true, Math.PI * 0.6, Math.PI * 1.8]} />
          </mesh>
        </group>
      );
    case 'long':
      return (
        <group>
          {cap}
          <RoundedBox args={[0.24 * k, 0.34, 0.08]} radius={0.035} position={[0, -0.12, -0.08]} material={m} />
          {[-1, 1].map((s) => (
            <RoundedBox key={s} args={[0.05, 0.26, 0.08]} radius={0.02} position={[s * 0.1 * k, -0.08, 0.0]} material={m} />
          ))}
        </group>
      );
    case 'ponytail':
      return (
        <group>
          {cap}
          <mesh position={[0, 0.02, -0.12 * k]} rotation={[0.5, 0, 0]} material={m}>
            <capsuleGeometry args={[0.03, 0.16, 4, 8]} />
          </mesh>
        </group>
      );
    default:
      return cap;
  }
}

let _cable: THREE.Texture | null = null;
function cableBump() {
  if (_cable) return _cable;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#808080';
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = '#fff';
  g.lineWidth = 5;
  for (let x = 8; x < 128; x += 32) {
    for (let y = 0; y < 128; y += 16) {
      g.beginPath();
      g.moveTo(x, y);
      g.bezierCurveTo(x + 12, y + 4, x + 12, y + 12, x, y + 16);
      g.stroke();
    }
  }
  _cable = new THREE.CanvasTexture(c);
  _cable.wrapS = _cable.wrapT = THREE.RepeatWrapping;
  _cable.repeat.set(3, 3);
  return _cable;
}
