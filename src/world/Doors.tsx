import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DOORS, LEVEL_Y, ROOM_BY_ID, type DoorDef } from '../data/layout';
import { FACADE_T, WALL_T } from '../systems/architecture';
import { useGame } from '../state/store';
import { B, M } from './kit';

/** Which way is room `a` from the door line: +1 means towards +x/+z. */
export function sideOfA(d: DoorDef) {
  const r = ROOM_BY_ID[d.a]?.rect;
  if (!r) return 1;
  return (d.line === 'x' ? (r.x0 + r.x1) / 2 - d.x : (r.z0 + r.z1) / 2 - d.z) > 0 ? 1 : -1;
}

function Leaf({ w, h, glass, flip }: { w: number; h: number; glass: boolean; flip: boolean }) {
  const wood = M.walnut();
  const dark = M.darkwood();
  const t = 0.06;
  return (
    <group position={[(flip ? -1 : 1) * (w / 2), h / 2, 0]}>
      {glass ? (
        <>
          <B p={[0, h / 2 - 0.06, 0]} s={[w, 0.12, t]} m={wood} />
          <B p={[0, -h / 2 + 0.2, 0]} s={[w, 0.4, t]} m={wood} />
          <B p={[-w / 2 + 0.05, 0, 0]} s={[0.1, h, t]} m={wood} />
          <B p={[w / 2 - 0.05, 0, 0]} s={[0.1, h, t]} m={wood} />
          <B p={[0, 0.1, 0]} s={[0.03, h - 0.5, 0.03]} m={wood} />
          {[0.6, -0.2].map((y) => (
            <B key={y} p={[0, y, 0]} s={[w - 0.2, 0.03, 0.03]} m={wood} />
          ))}
          <mesh position={[0, 0.14, 0]} material={M.glass()}>
            <boxGeometry args={[w - 0.2, h - 0.52, 0.01]} />
          </mesh>
        </>
      ) : (
        <>
          <B p={[0, 0, 0]} s={[w, h, t]} m={wood} />
          {[h * 0.22, -h * 0.22].map((y) =>
            [-1, 1].map((sd) => (
              <group key={`${y}${sd}`}>
                <B p={[(sd * w) / 4.6, y, t / 2 + 0.006]} s={[w / 2.9, h * 0.36, 0.012]} m={dark} />
                <B p={[(sd * w) / 4.6, y, -t / 2 - 0.006]} s={[w / 2.9, h * 0.36, 0.012]} m={dark} />
              </group>
            )),
          )}
        </>
      )}
      {[1, -1].map((s) => (
        <mesh key={s} position={[(flip ? -1 : 1) * (w / 2 - 0.09), -h * 0.02, (s * t) / 2 + s * 0.03]} material={M.brass()}>
          <sphereGeometry args={[0.035, 10, 8]} />
        </mesh>
      ))}
    </group>
  );
}

function Door({ d }: { d: DoorDef }) {
  const s = sideOfA(d);
  const y0 = LEVEL_Y[d.level];
  const hinge = useRef<THREE.Group>(null);
  const hinge2 = useRef<THREE.Group>(null);
  const ang = useRef(0);
  const glass = d.kind === 'glass';
  const isDouble = d.kind === 'double' || d.kind === 'garage' || (glass && d.width > 1.5);
  const leafW = isDouble ? d.width / 2 : d.width;
  const rotY = d.line === 'z' ? 0 : -Math.PI / 2;

  useFrame((_, dt) => {
    const open = useGame.getState().doors[d.id]?.open;
    const target = open ? (Math.PI / 2) * 0.93 : 0;
    ang.current = THREE.MathUtils.damp(ang.current, target, 6, dt);
    // swing toward room A; local +z maps to world +z (line z) or +x (line x)
    const a = ang.current * s;
    if (hinge.current) hinge.current.rotation.y = d.line === 'z' ? -a : a;
    if (hinge2.current) hinge2.current.rotation.y = d.line === 'z' ? a : -a;
  });

  // thicknesses on either side of the line
  const tA = ROOM_BY_ID[d.a] ? WALL_T : FACADE_T;
  const tB = ROOM_BY_ID[d.b] ? WALL_T : FACADE_T;
  const frame = d.kind === 'garage' ? M.color('#2a2420', 0.8) : M.darkwood();
  const depth = tA + tB;
  const centerOff = (tA - tB) / 2; // along +s
  const arch = d.kind === 'arch';
  return (
    <group position={[d.x, y0, d.z]} rotation={[0, rotY, 0]}>
      {/* reveal linings through the wall thickness */}
      <group position={[0, 0, (d.line === 'z' ? s : -s) * centerOff]}>
        <B p={[-d.width / 2 - 0.04, d.height / 2, 0]} s={[0.08, d.height, depth + 0.02]} m={frame} />
        <B p={[d.width / 2 + 0.04, d.height / 2, 0]} s={[0.08, d.height, depth + 0.02]} m={frame} />
        <B p={[0, d.height + 0.04, 0]} s={[d.width + 0.16, 0.08, depth + 0.02]} m={frame} />
        {/* architraves on both faces */}
        {[1, -1].map((f) => (
          <group key={f} position={[0, 0, (f * (depth + 0.04)) / 2]}>
            <B p={[-d.width / 2 - 0.12, d.height / 2, 0]} s={[0.16, d.height + 0.08, 0.04]} m={frame} />
            <B p={[d.width / 2 + 0.12, d.height / 2, 0]} s={[0.16, d.height + 0.08, 0.04]} m={frame} />
            <B p={[0, d.height + 0.12, 0]} s={[d.width + 0.4, 0.18, 0.05]} m={frame} />
            {arch && <B p={[0, d.height + 0.12, 0.02]} s={[0.3, 0.3, 0.06]} m={M.gold()} />}
          </group>
        ))}
      </group>
      {!arch && (
        <>
          <group ref={hinge} position={[-d.width / 2, 0, 0]}>
            <Leaf w={leafW} h={d.height - 0.02} glass={glass || d.kind === 'garage'} flip={false} />
          </group>
          {isDouble && (
            <group ref={hinge2} position={[d.width / 2, 0, 0]}>
              <Leaf w={leafW} h={d.height - 0.02} glass={glass} flip />
            </group>
          )}
        </>
      )}
      {d.lock && (
        <mesh position={[d.width / 2 - 0.12, 1.1, 0.06]} material={M.brass()}>
          <boxGeometry args={[0.06, 0.12, 0.02]} />
        </mesh>
      )}
    </group>
  );
}

export function Doors({ levels }: { levels: Set<number> }) {
  return (
    <>
      {DOORS.filter((d) => levels.has(d.level)).map((d) => (
        <Door key={d.id} d={d} />
      ))}
    </>
  );
}
