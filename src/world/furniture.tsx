/**
 * The furniture kit. Every piece is assembled from several shaped parts —
 * legs, frames, cushions, mouldings — rather than a single primitive.
 * Local origin: floor centre of the footprint, front facing +z.
 */
import { useRef, type FC } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import { B, Cyl, M, Sph } from './kit';

type P = Record<string, any>;

function Soft({ p, s, m, r = 0.06 }: { p: [number, number, number]; s: [number, number, number]; m: THREE.Material; r?: number }) {
  return <RoundedBox args={s} radius={Math.min(r, s[0] / 2.1, s[1] / 2.1, s[2] / 2.1)} smoothness={3} position={p} material={m} />;
}

function TurnedLeg({ p, h, m, r = 0.035 }: { p: [number, number, number]; h: number; m: THREE.Material; r?: number }) {
  return (
    <group position={p}>
      <Cyl p={[0, h * 0.25, 0]} r0={r * 0.7} r1={r} h={h * 0.5} m={m} seg={8} />
      <Sph p={[0, h * 0.55, 0]} r={r * 1.25} m={m} seg={8} />
      <Cyl p={[0, h * 0.8, 0]} r0={r} r1={r * 1.2} h={h * 0.4} m={m} seg={8} />
    </group>
  );
}

const legs4 = (w: number, d: number, h: number, m: THREE.Material, inset = 0.06, r?: number) =>
  [
    [-w / 2 + inset, -d / 2 + inset],
    [w / 2 - inset, -d / 2 + inset],
    [-w / 2 + inset, d / 2 - inset],
    [w / 2 - inset, d / 2 - inset],
  ].map(([x, z], i) => <TurnedLeg key={i} p={[x, 0, z]} h={h} m={m} r={r} />);

// ───────────────────────── Seating ─────────────────────────

export const Sofa: FC<P> = ({ c = '#5a2028', w = 2.2 }) => {
  const f = M.fabric(c);
  const wood = M.darkwood();
  return (
    <group>
      {legs4(w - 0.1, 0.8, 0.14, wood, 0.08, 0.03)}
      <Soft p={[0, 0.3, 0.02]} s={[w, 0.24, 0.9]} m={f} />
      <Soft p={[0, 0.66, -0.35]} s={[w, 0.72, 0.22]} m={f} r={0.09} />
      <Soft p={[-w / 2 + 0.1, 0.52, 0.02]} s={[0.2, 0.44, 0.9]} m={f} r={0.08} />
      <Soft p={[w / 2 - 0.1, 0.52, 0.02]} s={[0.2, 0.44, 0.9]} m={f} r={0.08} />
      {[-1, 0, 1].map((i) => (
        <Soft key={i} p={[i * (w - 0.4) / 3, 0.47, 0.06]} s={[(w - 0.45) / 3, 0.14, 0.7]} m={f} r={0.06} />
      ))}
      <B p={[0, 0.12, 0.47]} s={[w - 0.1, 0.06, 0.02]} m={M.brass()} />
    </group>
  );
};

export const Armchair: FC<P> = ({ c = '#3a4a2e' }) => {
  const f = M.leather(c);
  const wood = M.darkwood();
  return (
    <group>
      {legs4(0.85, 0.8, 0.14, wood, 0.08, 0.03)}
      <Soft p={[0, 0.32, 0.03]} s={[0.92, 0.26, 0.86]} m={f} />
      <Soft p={[0, 0.78, -0.33]} s={[0.92, 0.9, 0.2]} m={f} r={0.1} />
      <Soft p={[0, 1.16, -0.28]} s={[0.6, 0.22, 0.3]} m={f} r={0.1} />
      <Soft p={[-0.41, 0.58, 0.03]} s={[0.16, 0.36, 0.86]} m={f} r={0.07} />
      <Soft p={[0.41, 0.58, 0.03]} s={[0.16, 0.36, 0.86]} m={f} r={0.07} />
      <Soft p={[0, 0.5, 0.07]} s={[0.64, 0.12, 0.66]} m={f} r={0.05} />
    </group>
  );
};

export const DiningChair: FC<P> = () => {
  const w = M.darkwood();
  const f = M.fabric('#5a1c26');
  return (
    <group>
      {legs4(0.46, 0.46, 0.46, w, 0.03, 0.022)}
      <Soft p={[0, 0.49, 0]} s={[0.5, 0.07, 0.5]} m={f} r={0.03} />
      <B p={[-0.21, 0.85, -0.22]} s={[0.04, 0.7, 0.04]} m={w} />
      <B p={[0.21, 0.85, -0.22]} s={[0.04, 0.7, 0.04]} m={w} />
      <Soft p={[0, 0.98, -0.22]} s={[0.44, 0.36, 0.04]} m={f} r={0.015} />
      <B p={[0, 1.2, -0.22]} s={[0.5, 0.06, 0.05]} m={w} />
    </group>
  );
};

export const DeskChair: FC<P> = () => {
  const l = M.leather('#3a1a12');
  const w = M.darkwood();
  return (
    <group>
      <Cyl p={[0, 0.2, 0]} r0={0.03} h={0.4} m={M.brass()} />
      {[0, 1, 2, 3, 4].map((i) => (
        <B key={i} p={[Math.sin((i * Math.PI * 2) / 5) * 0.2, 0.04, Math.cos((i * Math.PI * 2) / 5) * 0.2]} r={[0, (i * Math.PI * 2) / 5, 0]} s={[0.05, 0.04, 0.4]} m={w} />
      ))}
      <Soft p={[0, 0.48, 0]} s={[0.6, 0.12, 0.56]} m={l} />
      <Soft p={[0, 0.82, -0.25]} s={[0.6, 0.6, 0.1]} m={l} r={0.05} />
      <Soft p={[-0.3, 0.64, 0]} s={[0.07, 0.24, 0.5]} m={l} r={0.03} />
      <Soft p={[0.3, 0.64, 0]} s={[0.07, 0.24, 0.5]} m={l} r={0.03} />
    </group>
  );
};

export const WickerChair: FC<P> = () => {
  const wk = M.color('#8a6a3a', 0.9);
  const cu = M.fabric('#66684d');
  return (
    <group>
      <Cyl p={[0, 0.22, 0]} r0={0.42} r1={0.36} h={0.44} m={wk} seg={14} />
      <mesh position={[0, 0.7, -0.05]} rotation={[0.2, 0, 0]} material={wk}>
        <torusGeometry args={[0.44, 0.06, 6, 18, Math.PI]} />
      </mesh>
      <Soft p={[0, 0.48, 0.02]} s={[0.66, 0.1, 0.62]} m={cu} r={0.04} />
    </group>
  );
};

export const Bench: FC<P> = ({ w = 1.4 }) => {
  const wd = M.darkwood();
  return (
    <group>
      {legs4(w, 0.42, 0.42, wd, 0.06, 0.03)}
      <Soft p={[0, 0.46, 0]} s={[w, 0.1, 0.44]} m={M.fabric('#632331')} r={0.04} />
    </group>
  );
};

// ───────────────────────── Tables & storage ─────────────────────────

export const CoffeeTable: FC<P> = ({ w = 1.2, d = 0.6 }) => {
  const wd = M.darkwood();
  return (
    <group>
      {legs4(w, d, 0.4, wd, 0.06, 0.03)}
      <B p={[0, 0.43, 0]} s={[w, 0.05, d]} m={wd} />
      <B p={[0, 0.39, 0]} s={[w - 0.08, 0.04, d - 0.08]} m={wd} />
      <B p={[0, 0.1, 0]} s={[w - 0.14, 0.02, d - 0.14]} m={wd} />
    </group>
  );
};

export const SideTable: FC<P> = ({ h = 0.6 }) => {
  const wd = M.darkwood();
  return (
    <group>
      <Cyl p={[0, h / 2, 0]} r0={0.05} r1={0.04} h={h} m={wd} seg={10} />
      <Cyl p={[0, 0.03, 0]} r0={0.2} r1={0.16} h={0.06} m={wd} seg={14} />
      <Cyl p={[0, h, 0]} r0={0.26} h={0.04} m={wd} seg={20} />
    </group>
  );
};

export const RoundTable: FC<P> = ({ r = 0.7, h = 0.8 }) => {
  const wd = M.walnut();
  return (
    <group>
      <Cyl p={[0, h / 2, 0]} r0={0.12} r1={0.08} h={h} m={wd} seg={12} />
      {[0, 1, 2].map((i) => (
        <B key={i} p={[Math.sin((i * Math.PI * 2) / 3) * 0.25, 0.06, Math.cos((i * Math.PI * 2) / 3) * 0.25]} r={[0, (i * Math.PI * 2) / 3, 0]} s={[0.08, 0.1, 0.5]} m={wd} />
      ))}
      <Cyl p={[0, h, 0]} r0={r} h={0.05} m={wd} seg={32} />
      <Cyl p={[0, h - 0.05, 0]} r0={r - 0.05} h={0.06} m={wd} seg={32} />
    </group>
  );
};

export const Console: FC<P> = ({ w = 1.2 }) => {
  const wd = M.walnut();
  return (
    <group>
      {legs4(w, 0.38, 0.8, wd, 0.05, 0.025)}
      <B p={[0, 0.84, 0]} s={[w, 0.04, 0.4]} m={wd} />
      <B p={[0, 0.74, 0]} s={[w - 0.08, 0.14, 0.34]} m={wd} />
      <Sph p={[-0.15, 0.74, 0.18]} r={0.018} m={M.brass()} />
      <Sph p={[0.15, 0.74, 0.18]} r={0.018} m={M.brass()} />
    </group>
  );
};

export const Desk: FC<P> = () => {
  const wd = M.walnut();
  const l = M.leather('#1d2a1d');
  return (
    <group>
      {/* pedestals */}
      {[-0.65, 0.65].map((x) => (
        <group key={x}>
          <B p={[x, 0.37, 0]} s={[0.46, 0.74, 0.82]} m={wd} />
          {[0.15, 0.37, 0.59].map((y) => (
            <group key={y}>
              <B p={[x, y, 0.415]} s={[0.4, 0.18, 0.02]} m={M.darkwood()} />
              <Sph p={[x, y, 0.43]} r={0.015} m={M.brass()} />
            </group>
          ))}
        </group>
      ))}
      <B p={[0, 0.66, 0.38]} s={[0.84, 0.12, 0.04]} m={M.darkwood()} />
      <B p={[0, 0.76, 0]} s={[1.84, 0.05, 0.92]} m={wd} />
      <B p={[0, 0.787, 0]} s={[1.3, 0.005, 0.6]} m={l} />
    </group>
  );
};

export const DiningTable: FC<P> = ({ l = 6, d = 1.5 }) => {
  const wd = M.walnut();
  return (
    <group>
      {[-l / 2 + 0.5, 0, l / 2 - 0.5].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <Cyl p={[0, 0.38, 0]} r0={0.07} r1={0.1} h={0.62} m={wd} seg={10} />
          <B p={[0, 0.06, 0]} s={[0.14, 0.12, d - 0.4]} m={wd} />
        </group>
      ))}
      <B p={[0, 0.74, 0]} s={[l, 0.06, d]} m={wd} />
      <B p={[0, 0.69, 0]} s={[l - 0.1, 0.06, d - 0.1]} m={M.darkwood()} />
      <B p={[0, 0.775, 0]} s={[l - 0.6, 0.006, 0.5]} m={M.fabric('#d9cbaf')} />
    </group>
  );
};

export const Sideboard: FC<P> = ({ w = 1.8 }) => {
  const wd = M.walnut();
  return (
    <group>
      {legs4(w, 0.48, 0.14, wd, 0.06, 0.03)}
      <B p={[0, 0.5, 0]} s={[w, 0.72, 0.5]} m={wd} />
      <B p={[0, 0.88, 0]} s={[w + 0.06, 0.04, 0.54]} m={M.darkwood()} />
      {[-1, 0, 1].map((i) => (
        <group key={i}>
          <B p={[(i * w) / 3, 0.48, 0.255]} s={[w / 3 - 0.08, 0.56, 0.02]} m={M.darkwood()} />
          <Sph p={[(i * w) / 3, 0.6, 0.27]} r={0.018} m={M.brass()} />
        </group>
      ))}
    </group>
  );
};

export const Bookshelf: FC<P> = ({ w = 2, h = 3, d = 0.42 }) => {
  const wd = M.walnut();
  const shelves = Math.max(3, Math.floor((h - 0.3) / 0.42));
  const gap = (h - 0.3) / shelves;
  return (
    <group>
      <B p={[-w / 2 + 0.03, h / 2, 0]} s={[0.06, h, d]} m={wd} />
      <B p={[w / 2 - 0.03, h / 2, 0]} s={[0.06, h, d]} m={wd} />
      <B p={[0, h / 2, -d / 2 + 0.02]} s={[w, h, 0.04]} m={M.darkwood()} />
      <B p={[0, h - 0.06, 0.02]} s={[w + 0.1, 0.12, d + 0.04]} m={wd} />
      <B p={[0, 0.08, 0]} s={[w, 0.16, d]} m={wd} />
      {Array.from({ length: shelves }, (_, i) => {
        const y = 0.16 + i * gap;
        return (
          <group key={i}>
            <B p={[0, y, 0]} s={[w - 0.08, 0.03, d - 0.02]} m={wd} />
            <mesh position={[0, y + gap * 0.42, 0.03]} material={M.books()}>
              <boxGeometry args={[w - 0.12, gap * 0.82, d - 0.12]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

export const Wardrobe: FC<P> = ({ w = 1.4 }) => {
  const wd = M.walnut();
  return (
    <group>
      <B p={[0, 1.15, 0]} s={[w, 2.2, 0.62]} m={wd} />
      <B p={[0, 2.3, 0]} s={[w + 0.1, 0.1, 0.7]} m={M.darkwood()} />
      <B p={[0, 0.05, 0]} s={[w + 0.06, 0.1, 0.66]} m={M.darkwood()} />
      <B p={[-w / 4, 1.2, 0.315]} s={[w / 2 - 0.08, 1.9, 0.02]} m={M.darkwood()} />
      <B p={[w / 4, 1.2, 0.315]} s={[w / 2 - 0.08, 1.9, 0.02]} m={M.darkwood()} />
      <Sph p={[-0.05, 1.2, 0.34]} r={0.02} m={M.brass()} />
      <Sph p={[0.05, 1.2, 0.34]} r={0.02} m={M.brass()} />
    </group>
  );
};

export const Dresser: FC<P> = ({ w = 1.3 }) => {
  const wd = M.walnut();
  return (
    <group>
      {legs4(w, 0.5, 0.12, wd, 0.05, 0.03)}
      <B p={[0, 0.55, 0]} s={[w, 0.86, 0.52]} m={wd} />
      <B p={[0, 1.0, 0]} s={[w + 0.04, 0.04, 0.56]} m={M.darkwood()} />
      {[0.3, 0.55, 0.8].map((y) => (
        <group key={y}>
          <B p={[0, y, 0.265]} s={[w - 0.1, 0.2, 0.02]} m={M.darkwood()} />
          <Sph p={[-w / 4, y, 0.28]} r={0.015} m={M.brass()} />
          <Sph p={[w / 4, y, 0.28]} r={0.015} m={M.brass()} />
        </group>
      ))}
      <mesh position={[0, 1.55, -0.2]} material={M.chrome()}>
        <planeGeometry args={[w * 0.7, 0.9]} />
      </mesh>
      <B p={[0, 1.55, -0.21]} s={[w * 0.7 + 0.1, 1.0, 0.03]} m={M.gold()} />
    </group>
  );
};

export const Nightstand: FC<P> = ({ lamp = true }) => {
  const wd = M.walnut();
  return (
    <group>
      {legs4(0.48, 0.42, 0.14, wd, 0.04, 0.02)}
      <B p={[0, 0.38, 0]} s={[0.5, 0.48, 0.44]} m={wd} />
      <B p={[0, 0.61, 0]} s={[0.54, 0.03, 0.48]} m={M.darkwood()} />
      <Sph p={[0, 0.42, 0.23]} r={0.015} m={M.brass()} />
      {lamp && <TableLamp p={[-0.1, 0.63, -0.05]} />}
    </group>
  );
};

export const Bed: FC<P> = ({ c = '#632331', posts = true, w = 2.0 }) => {
  const wd = M.walnut();
  const linen = M.fabric('#e3d8c2');
  const cover = M.fabric(c);
  return (
    <group>
      <B p={[0, 0.25, 0]} s={[w, 0.3, 2.2]} m={wd} />
      <Soft p={[0, 0.48, 0.05]} s={[w - 0.1, 0.22, 2.05]} m={linen} r={0.06} />
      <Soft p={[0, 0.6, 0.3]} s={[w - 0.04, 0.06, 1.55]} m={cover} r={0.03} />
      <Soft p={[-w / 4, 0.66, -0.78]} s={[w / 2 - 0.12, 0.14, 0.4]} m={linen} r={0.07} />
      <Soft p={[w / 4, 0.66, -0.78]} s={[w / 2 - 0.12, 0.14, 0.4]} m={linen} r={0.07} />
      <B p={[0, 0.95, -1.08]} s={[w, 1.3, 0.08]} m={wd} />
      <B p={[0, 1.62, -1.08]} s={[w * 0.6, 0.14, 0.09]} m={M.darkwood()} />
      <B p={[0, 0.55, 1.08]} s={[w, 0.5, 0.06]} m={wd} />
      {posts &&
        [
          [-w / 2, -1.08],
          [w / 2, -1.08],
          [-w / 2, 1.08],
          [w / 2, 1.08],
        ].map(([x, z], i) => (
          <group key={i}>
            <Cyl p={[x, 1.25, z]} r0={0.05} h={2.5} m={wd} seg={10} />
            <Sph p={[x, 2.52, z]} r={0.07} m={wd} />
          </group>
        ))}
      {posts && (
        <>
          <B p={[0, 2.45, -1.08]} s={[w, 0.08, 0.08]} m={wd} />
          <B p={[0, 2.45, 1.08]} s={[w, 0.08, 0.08]} m={wd} />
          <B p={[-w / 2, 2.45, 0]} s={[0.08, 0.08, 2.2]} m={wd} />
          <B p={[w / 2, 2.45, 0]} s={[0.08, 0.08, 2.2]} m={wd} />
          <B p={[-w / 2 - 0.02, 1.6, -0.9]} s={[0.04, 1.6, 0.4]} m={M.fabric('#3a1218')} />
          <B p={[w / 2 + 0.02, 1.6, -0.9]} s={[0.04, 1.6, 0.4]} m={M.fabric('#3a1218')} />
        </>
      )}
    </group>
  );
};

export const Daybed: FC<P> = () => {
  const wd = M.walnut();
  const f = M.fabric('#2d3424');
  return (
    <group>
      {legs4(1.9, 0.8, 0.2, wd, 0.06, 0.035)}
      <B p={[0, 0.26, 0]} s={[2.0, 0.14, 0.86]} m={wd} />
      <Soft p={[0, 0.4, 0.02]} s={[1.9, 0.16, 0.8]} m={f} />
      <Soft p={[0, 0.72, -0.38]} s={[1.95, 0.55, 0.14]} m={f} r={0.06} />
      <Soft p={[-0.97, 0.6, 0]} s={[0.14, 0.5, 0.86]} m={f} r={0.06} />
      <Soft p={[0.97, 0.6, 0]} s={[0.14, 0.5, 0.86]} m={f} r={0.06} />
      {/* the cut cushion & stain */}
      <B p={[0.25, 0.485, 0.05]} s={[0.28, 0.012, 0.28]} m={M.blood()} />
      <B p={[0.25, 0.49, 0.05]} s={[0.2, 0.012, 0.2]} m={M.black()} />
      <Soft p={[-0.7, 0.52, 0.05]} s={[0.36, 0.1, 0.6]} m={M.fabric('#b8a88a')} r={0.04} />
      {/* police tape around */}
      <B p={[0, 0.95, 0.65]} s={[2.4, 0.06, 0.005]} m={M.tape()} />
      <B p={[1.2, 0.95, 0.15]} s={[0.005, 0.06, 1.0]} m={M.tape()} />
      <B p={[-1.2, 0.95, 0.15]} s={[0.005, 0.06, 1.0]} m={M.tape()} />
      {[-1.2, 1.2].map((x) => (
        <group key={x}>
          <Cyl p={[x, 0.48, 0.65]} r0={0.025} h={0.96} m={M.iron()} seg={6} />
          <Cyl p={[x, 0.02, 0.65]} r0={0.14} h={0.04} m={M.iron()} seg={12} />
        </group>
      ))}
    </group>
  );
};

// ───────────────────────── Hearth & lighting ─────────────────────────

function Flames() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    ref.current.children.forEach((c, i) => {
      c.scale.y = 0.75 + Math.sin(t * (6 + i) + i * 1.7) * 0.2 + Math.sin(t * 13 + i) * 0.08;
      c.scale.x = 0.9 + Math.sin(t * 5 + i) * 0.1;
    });
  });
  return (
    <group ref={ref}>
      {[-0.22, 0, 0.2].map((x, i) => (
        <mesh key={i} position={[x, 0.32, 0.05 * i]} material={M.fire()}>
          <coneGeometry args={[0.12, 0.45, 6]} />
        </mesh>
      ))}
    </group>
  );
}

export const Fireplace: FC<P> = ({ lit = true }) => {
  const st = M.limestone();
  return (
    <group>
      <B p={[0, 0.05, 0.25]} s={[2.4, 0.1, 0.9]} m={M.stone()} />
      <B p={[-0.85, 0.6, 0]} s={[0.4, 1.2, 0.5]} m={st} />
      <B p={[0.85, 0.6, 0]} s={[0.4, 1.2, 0.5]} m={st} />
      <B p={[0, 1.08, 0]} s={[1.3, 0.24, 0.5]} m={st} />
      <B p={[0, 1.27, 0.03]} s={[2.4, 0.1, 0.62]} m={st} />
      <B p={[0, 1.36, 0.03]} s={[2.5, 0.06, 0.66]} m={M.walnut()} />
      <B p={[0, 0.5, -0.18]} s={[1.3, 0.96, 0.12]} m={M.black()} />
      <B p={[0, 2.3, -0.1]} s={[2.0, 1.9, 0.3]} m={st} />
      {/* gilt over-mantel mirror */}
      <B p={[0, 2.35, 0.07]} s={[1.3, 1.25, 0.05]} m={M.gold()} />
      <mesh position={[0, 2.35, 0.1]} material={M.color('#2a2a30', 0.05, 1)}>
        <planeGeometry args={[1.1, 1.05]} />
      </mesh>
      {/* grate */}
      {[-0.3, -0.1, 0.1, 0.3].map((x) => (
        <B key={x} p={[x, 0.22, 0.05]} s={[0.025, 0.2, 0.35]} m={M.iron()} />
      ))}
      <B p={[0, 0.14, 0.05]} s={[0.8, 0.04, 0.36]} m={M.iron()} />
      <B p={[0, 0.17, 0.05]} s={[0.7, 0.06, 0.3]} m={M.ember()} />
      {lit && <Flames />}
      {/* mantel ornaments */}
      <Cyl p={[-0.8, 1.52, 0.05]} r0={0.06} r1={0.04} h={0.26} m={M.brass()} />
      <Cyl p={[0.8, 1.52, 0.05]} r0={0.06} r1={0.04} h={0.26} m={M.brass()} />
      <B p={[0, 1.55, 0.02]} s={[0.36, 0.3, 0.14]} m={M.darkwood()} />
      <mesh position={[0, 1.58, 0.095]} material={M.ivory()}>
        <circleGeometry args={[0.08, 20]} />
      </mesh>
    </group>
  );
};

export const TableLamp: FC<P> = ({ p = [0, 0, 0] }) => (
  <group position={p}>
    <Cyl p={[0, 0.02, 0]} r0={0.09} h={0.04} m={M.brass()} />
    <Cyl p={[0, 0.18, 0]} r0={0.025} h={0.3} m={M.brass()} />
    <Sph p={[0, 0.12, 0]} r={0.06} m={M.burgundy()} />
    <mesh position={[0, 0.38, 0]} material={M.lampShade()}>
      <cylinderGeometry args={[0.1, 0.17, 0.2, 16, 1, true]} />
    </mesh>
  </group>
);

export const FloorLamp: FC<P> = () => (
  <group>
    <Cyl p={[0, 0.02, 0]} r0={0.18} h={0.04} m={M.brass()} />
    <Cyl p={[0, 0.8, 0]} r0={0.02} h={1.6} m={M.brass()} />
    <mesh position={[0, 1.62, 0]} material={M.lampShade()}>
      <cylinderGeometry args={[0.16, 0.26, 0.3, 18, 1, true]} />
    </mesh>
  </group>
);

/** Hangs downward from its origin (place the origin at the ceiling). */
export const Chandelier: FC<P> = ({ r = 0.7, drop = 1.0, tiers = 1 }) => {
  const g = M.gold();
  const arms = 8;
  return (
    <group>
      <Cyl p={[0, -drop / 2, 0]} r0={0.015} h={drop} m={g} seg={6} />
      {Array.from({ length: tiers }, (_, t) => {
        const y = -drop - t * 0.35;
        const rr = r * (1 - t * 0.35);
        return (
          <group key={t} position={[0, y, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={g}>
              <torusGeometry args={[rr, 0.02, 6, 32]} />
            </mesh>
            {Array.from({ length: arms }, (_, i) => {
              const a = (i / arms) * Math.PI * 2;
              return (
                <group key={i} position={[Math.cos(a) * rr, 0, Math.sin(a) * rr]}>
                  <Cyl p={[0, 0.04, 0]} r0={0.035} h={0.04} m={g} seg={8} />
                  <Cyl p={[0, 0.12, 0]} r0={0.012} h={0.14} m={M.ivory()} seg={6} />
                  <Sph p={[0, 0.22, 0]} r={0.025} m={M.bulb()} seg={6} />
                </group>
              );
            })}
          </group>
        );
      })}
      <Sph p={[0, -drop - 0.1, 0]} r={0.09} m={g} />
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} position={[Math.cos(i) * r * 0.6, -drop - 0.2 - (i % 3) * 0.06, Math.sin(i) * r * 0.6]} material={M.glass()}>
          <octahedronGeometry args={[0.03]} />
        </mesh>
      ))}
    </group>
  );
};

export const Pendant: FC<P> = ({ drop = 0.8 }) => (
  <group>
    <Cyl p={[0, -drop / 2, 0]} r0={0.008} h={drop} m={M.black()} seg={4} />
    <mesh position={[0, -drop - 0.08, 0]} material={M.brass()}>
      <coneGeometry args={[0.18, 0.16, 16, 1, true]} />
    </mesh>
    <Sph p={[0, -drop - 0.14, 0]} r={0.05} m={M.bulb()} seg={8} />
  </group>
);

export const BareBulb: FC<P> = ({ drop = 0.5 }) => (
  <group>
    <Cyl p={[0, -drop / 2, 0]} r0={0.006} h={drop} m={M.black()} seg={4} />
    <Cyl p={[0, -drop - 0.02, 0]} r0={0.025} h={0.05} m={M.iron()} seg={8} />
    <Sph p={[0, -drop - 0.08, 0]} r={0.05} m={M.bulb()} seg={8} />
  </group>
);

// ───────────────────────── Decor ─────────────────────────

export const Rug: FC<P> = ({ w = 3, d = 2, a = '#4a1820', b = '#b69a65' }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} material={M.rug(a, b)}>
    <planeGeometry args={[w, d]} />
  </mesh>
);

export const Runner: FC<P> = ({ w = 1.4, d = 8 }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} material={M.rug('#3a1218', '#8a6a32')}>
    <planeGeometry args={[w, d]} />
  </mesh>
);

export const Vase: FC<P> = ({ flowers = true }) => (
  <group>
    <mesh position={[0, 0.16, 0]} material={M.color('#1d2638', 0.25, 0.1)}>
      <latheGeometry args={[[0, 0.06, 0.1, 0.13, 0.12, 0.06, 0.07].map((r, i) => new THREE.Vector2(r, i * 0.05)), 18]} />
    </mesh>
    {flowers &&
      Array.from({ length: 9 }, (_, i) => (
        <Sph key={i} p={[Math.sin(i * 2.1) * 0.12, 0.42 + (i % 3) * 0.06, Math.cos(i * 2.1) * 0.12]} r={0.05} m={M.foliage(i % 2 ? '#982b39' : '#c9a24a')} seg={6} />
      ))}
  </group>
);

export const PlantPot: FC<P> = ({ s = 1, c = '#3d4a2a' }) => (
  <group scale={s}>
    <Cyl p={[0, 0.22, 0]} r0={0.2} r1={0.28} h={0.44} m={M.color('#7a4a32', 0.9)} seg={14} />
    {Array.from({ length: 7 }, (_, i) => (
      <mesh key={i} position={[Math.sin(i * 0.9) * 0.18, 0.75 + (i % 3) * 0.12, Math.cos(i * 0.9) * 0.18]} rotation={[Math.sin(i) * 0.5, i, Math.cos(i) * 0.5]} material={M.foliage(c)}>
        <coneGeometry args={[0.2, 0.7, 5]} />
      </mesh>
    ))}
  </group>
);

export const CoatStand: FC<P> = () => (
  <group>
    <Cyl p={[0, 0.9, 0]} r0={0.03} h={1.8} m={M.darkwood()} seg={8} />
    <Cyl p={[0, 0.03, 0]} r0={0.25} h={0.06} m={M.darkwood()} />
    {[0, 1, 2, 3].map((i) => (
      <B key={i} p={[Math.sin(i * 1.57) * 0.12, 1.7, Math.cos(i * 1.57) * 0.12]} r={[Math.cos(i * 1.57) * 0.6, 0, -Math.sin(i * 1.57) * 0.6]} s={[0.025, 0.2, 0.025]} m={M.brass()} />
    ))}
    <Soft p={[0.12, 1.25, 0]} s={[0.4, 0.8, 0.18]} m={M.fabric('#2a2a22')} r={0.08} />
    <Cyl p={[-0.1, 1.82, 0.05]} r0={0.16} r1={0.1} h={0.12} m={M.color('#2a1a14')} />
  </group>
);

export const UprightPiano: FC<P> = () => {
  const b = M.color('#0d0b0a', 0.25, 0.1);
  return (
    <group>
      <B p={[0, 0.65, -0.1]} s={[1.5, 1.3, 0.4]} m={b} />
      <B p={[0, 0.72, 0.18]} s={[1.5, 0.06, 0.3]} m={b} />
      <B p={[0, 0.745, 0.2]} s={[1.3, 0.01, 0.14]} m={M.ivory()} />
      {Array.from({ length: 36 }, (_, i) =>
        [1, 3, 6, 8, 10].includes(i % 12) ? <B key={i} p={[-0.62 + i * 0.035, 0.76, 0.17]} s={[0.018, 0.02, 0.08]} m={M.black()} /> : null,
      )}
      <B p={[-0.72, 0.35, 0.18]} s={[0.06, 0.7, 0.3]} m={b} />
      <B p={[0.72, 0.35, 0.18]} s={[0.06, 0.7, 0.3]} m={b} />
      <Cyl p={[-0.4, 1.38, -0.1]} r0={0.04} r1={0.03} h={0.16} m={M.brass()} />
      <Cyl p={[0.4, 1.38, -0.1]} r0={0.04} r1={0.03} h={0.16} m={M.brass()} />
    </group>
  );
};

export const UmbrellaStand: FC<P> = () => (
  <group>
    <Cyl p={[0, 0.3, 0]} r0={0.14} h={0.6} m={M.brass()} />
    {[0, 1, 2].map((i) => (
      <Cyl key={i} p={[Math.sin(i * 2) * 0.05, 0.55, Math.cos(i * 2) * 0.05]} r0={0.015} h={0.6} m={M.black()} rot={[0.1 * i, 0, 0.1]} />
    ))}
  </group>
);

export const Statue: FC<P> = () => {
  const st = M.limestone();
  return (
    <group>
      <B p={[0, 0.5, 0]} s={[0.8, 1.0, 0.8]} m={st} />
      <B p={[0, 1.04, 0]} s={[0.9, 0.08, 0.9]} m={st} />
      <Cyl p={[0, 1.5, 0]} r0={0.22} r1={0.16} h={0.9} m={st} seg={10} />
      <Sph p={[0, 2.08, 0]} r={0.16} m={st} />
      <B p={[0.2, 1.65, 0.1]} s={[0.1, 0.5, 0.1]} r={[0, 0, 0.6]} m={st} />
    </group>
  );
};

// ───────────────────────── Kitchen ─────────────────────────

export const Counter: FC<P> = ({ l = 3, upper = true }) => {
  const cab = M.color('#3e4a3a', 0.6);
  return (
    <group>
      <B p={[0, 0.06, 0.02]} s={[l, 0.12, 0.56]} m={M.black()} />
      <B p={[0, 0.48, 0]} s={[l, 0.76, 0.62]} m={cab} />
      <B p={[0, 0.9, 0.02]} s={[l + 0.02, 0.05, 0.66]} m={M.color('#d8d0c0', 0.2)} />
      {Array.from({ length: Math.floor(l / 0.6) }, (_, i) => (
        <group key={i}>
          <B p={[-l / 2 + 0.3 + i * 0.6, 0.48, 0.315]} s={[0.54, 0.66, 0.02]} m={M.color('#46553f', 0.55)} />
          <B p={[-l / 2 + 0.3 + i * 0.6, 0.75, 0.33]} s={[0.16, 0.02, 0.02]} m={M.brass()} />
        </group>
      ))}
      {upper && (
        <>
          <B p={[0, 1.95, -0.12]} s={[l, 0.8, 0.36]} m={cab} />
          <B p={[0, 2.38, -0.1]} s={[l + 0.05, 0.06, 0.42]} m={M.darkwood()} />
        </>
      )}
    </group>
  );
};

export const Stove: FC<P> = () => (
  <group>
    <B p={[0, 0.46, 0]} s={[1.0, 0.92, 0.66]} m={M.color('#5a1c22', 0.35, 0.3)} />
    <B p={[0, 0.93, 0]} s={[1.0, 0.03, 0.66]} m={M.black()} />
    {[-0.25, 0.25].map((x) => [-0.15, 0.15].map((z) => <Cyl key={`${x}${z}`} p={[x, 0.955, z]} r0={0.09} h={0.02} m={M.iron()} />))}
    <B p={[0, 0.45, 0.335]} s={[0.8, 0.5, 0.02]} m={M.black()} />
    <B p={[0, 0.75, 0.35]} s={[0.7, 0.03, 0.03]} m={M.chrome()} />
    <B p={[0, 1.9, -0.05]} s={[1.1, 0.5, 0.5]} m={M.steel()} />
  </group>
);

export const Fridge: FC<P> = () => (
  <group>
    <B p={[0, 0.95, 0]} s={[0.9, 1.9, 0.72]} m={M.color('#d8cfbc', 0.3, 0.2)} />
    <B p={[0, 1.3, 0.365]} s={[0.86, 0.01, 0.01]} m={M.black()} />
    <B p={[0.36, 1.5, 0.38]} s={[0.03, 0.3, 0.03]} m={M.chrome()} />
    <B p={[0.36, 0.9, 0.38]} s={[0.03, 0.3, 0.03]} m={M.chrome()} />
  </group>
);

export const PanRack: FC<P> = () => (
  <group>
    {[-0.6, 0.6].map((x) => (
      <Cyl key={x} p={[x, -0.3, 0]} r0={0.01} h={0.6} m={M.iron()} seg={4} />
    ))}
    <B p={[0, -0.6, 0]} s={[1.6, 0.04, 0.04]} m={M.iron()} />
    {[-0.6, -0.3, 0, 0.3, 0.6].map((x, i) => (
      <group key={x} position={[x, -0.75 - (i % 2) * 0.05, 0]}>
        <Cyl p={[0, -0.05, 0]} r0={0.11 + (i % 3) * 0.02} h={0.08} m={M.color('#a8622a', 0.3, 0.9)} seg={14} rot={[Math.PI / 2, 0, 0]} />
      </group>
    ))}
  </group>
);

// ───────────────────────── Cellar & storage ─────────────────────────

export const WineRack: FC<P> = ({ l = 2.4 }) => {
  const wd = M.darkwood();
  const bottle = M.color('#14200f', 0.15, 0.2);
  const cols = Math.floor(l / 0.16);
  return (
    <group>
      <B p={[0, 1.0, -0.2]} s={[l, 2.0, 0.04]} m={wd} />
      <B p={[-l / 2, 1.0, 0]} s={[0.05, 2.0, 0.45]} m={wd} />
      <B p={[l / 2, 1.0, 0]} s={[0.05, 2.0, 0.45]} m={wd} />
      {Array.from({ length: 9 }, (_, r) => (
        <group key={r}>
          <B p={[0, 0.12 + r * 0.22, 0]} s={[l, 0.02, 0.42]} m={wd} />
          {Array.from({ length: cols }, (_, c) =>
            (r * 7 + c * 3) % 11 === 0 ? null : (
              <mesh key={c} position={[-l / 2 + 0.1 + c * 0.16, 0.2 + r * 0.22, 0.05]} rotation={[Math.PI / 2, 0, 0]} material={bottle}>
                <cylinderGeometry args={[0.04, 0.04, 0.3, 8]} />
              </mesh>
            ),
          )}
        </group>
      ))}
    </group>
  );
};

export const Boiler: FC<P> = () => (
  <group>
    <Cyl p={[0, 0.95, 0]} r0={0.55} h={1.9} m={M.color('#3a3d38', 0.5, 0.6)} seg={18} />
    <Cyl p={[0, 1.95, 0]} r0={0.12} h={0.3} m={M.iron()} />
    <mesh position={[0, 1.3, 0.56]} material={M.white()}>
      <circleGeometry args={[0.1, 20]} />
    </mesh>
    <B p={[0, 0.4, 0.5]} s={[0.4, 0.3, 0.1]} m={M.iron()} />
    <B p={[0, 0.4, 0.56]} s={[0.3, 0.2, 0.02]} m={M.ember()} />
    <Cyl p={[0.3, 2.4, 0]} r0={0.06} h={1.2} m={M.color('#6a4a2a', 0.4, 0.8)} />
  </group>
);

export const Crates: FC<P> = ({ n = 3 }) => {
  const w = M.lightwood();
  return (
    <group>
      {Array.from({ length: n }, (_, i) => {
        const s = 0.5 + ((i * 37) % 5) * 0.06;
        return <B key={i} p={[(i % 2) * 0.55 - 0.25, s / 2 + Math.floor(i / 2) * 0.62, ((i * 13) % 3) * 0.05]} r={[0, i * 0.2, 0]} s={[s, s, s]} m={w} />;
      })}
    </group>
  );
};

export const Sheeted: FC<P> = ({ w = 1.6, h = 1.0, d = 0.9 }) => {
  const sheet = M.fabric('#c9bfa8');
  return (
    <group>
      <Soft p={[0, h / 2, 0]} s={[w, h, d]} m={sheet} r={0.18} />
      <B p={[0, 0.02, 0]} s={[w + 0.1, 0.04, d + 0.1]} m={sheet} />
    </group>
  );
};

export const MetalShelf: FC<P> = ({ l = 2 }) => {
  const st = M.steel();
  return (
    <group>
      {[-l / 2, l / 2].map((x) => [-0.2, 0.2].map((z) => <B key={`${x}${z}`} p={[x, 1.0, z]} s={[0.03, 2.0, 0.03]} m={st} />))}
      {[0.1, 0.6, 1.1, 1.6].map((y) => (
        <group key={y}>
          <B p={[0, y, 0]} s={[l, 0.02, 0.44]} m={st} />
          <B p={[-l / 4, y + 0.15, 0]} s={[0.4, 0.28, 0.32]} m={M.color('#8a7a5a', 0.95)} />
          <B p={[l / 4, y + 0.12, 0]} s={[0.5, 0.22, 0.3]} m={M.color('#6a5a40', 0.95)} />
        </group>
      ))}
    </group>
  );
};

export const SecurityDesk: FC<P> = () => (
  <group>
    <B p={[0, 0.74, 0]} s={[1.6, 0.05, 0.7]} m={M.color('#4a4a44', 0.6, 0.4)} />
    {[-0.75, 0.75].map((x) => (
      <B key={x} p={[x, 0.37, 0]} s={[0.05, 0.74, 0.65]} m={M.steel()} />
    ))}
    {[-0.45, 0.25].map((x, i) => (
      <group key={x} position={[x, 0.77, -0.12]}>
        <B p={[0, 0.2, 0]} s={[0.5, 0.4, 0.42]} m={M.color('#2a2824', 0.5)} />
        <mesh position={[0, 0.21, 0.212]} material={M.color('#1a2a24', 0.1)}>
          <planeGeometry args={[0.4, 0.3]} />
        </mesh>
        <mesh position={[0, 0.21, 0.214]}>
          <planeGeometry args={[0.36, 0.26]} />
          <meshBasicMaterial color={i ? '#2a3a34' : '#37483f'} />
        </mesh>
      </group>
    ))}
    <B p={[0.0, 0.81, 0.18]} s={[0.44, 0.08, 0.28]} m={M.black()} />
    <Sph p={[0.18, 0.84, 0.32]} r={0.008} m={M.color('#ff2020', 0.2)} />
  </group>
);

export const Pipes: FC<P> = ({ l = 10 }) => (
  <group>
    {[0, 0.16, 0.3].map((z, i) => (
      <Cyl key={z} p={[0, 0, z]} r0={0.04 + i * 0.015} h={l} m={M.color(i ? '#6a4a2a' : '#3a3a38', 0.5, 0.7)} seg={8} rot={[0, 0, Math.PI / 2]} />
    ))}
  </group>
);

export const Car: FC<P> = ({ c = '#1d2638', vintage = false }) => {
  const paint = M.carPaint(c);
  const glass = M.color('#0f141a', 0.05, 0.6);
  const tire = M.color('#111', 0.9);
  return (
    <group>
      <Soft p={[0, 0.55, 0]} s={[4.4, 0.55, 1.8]} m={paint} r={0.15} />
      <Soft p={[vintage ? 0.4 : -0.2, 1.0, 0]} s={[vintage ? 1.4 : 2.2, 0.48, 1.6]} m={vintage ? M.leather('#2a1a12') : paint} r={0.14} />
      {!vintage && (
        <>
          <mesh position={[-0.2, 1.02, 0.805]} material={glass}>
            <planeGeometry args={[2.0, 0.36]} />
          </mesh>
          <mesh position={[-0.2, 1.02, -0.805]} rotation={[0, Math.PI, 0]} material={glass}>
            <planeGeometry args={[2.0, 0.36]} />
          </mesh>
        </>
      )}
      {[-1.4, 1.4].map((x) =>
        [-0.82, 0.82].map((z) => (
          <group key={`${x}${z}`} position={[x, 0.34, z]}>
            <Cyl p={[0, 0, 0]} r0={0.34} h={0.24} m={tire} seg={16} rot={[Math.PI / 2, 0, 0]} />
            <Cyl p={[0, 0, z > 0 ? 0.11 : -0.11]} r0={0.18} h={0.04} m={M.chrome()} seg={12} rot={[Math.PI / 2, 0, 0]} />
          </group>
        )),
      )}
      <B p={[2.21, 0.55, 0]} s={[0.04, 0.25, 1.4]} m={M.chrome()} />
      <B p={[-2.21, 0.55, 0]} s={[0.04, 0.2, 1.4]} m={M.chrome()} />
      {[-0.6, 0.6].map((z) => (
        <mesh key={z} position={[2.22, 0.62, z]} rotation={[0, Math.PI / 2, 0]} material={M.bulb()}>
          <circleGeometry args={[0.1, 12]} />
        </mesh>
      ))}
    </group>
  );
};

// ───────────────────────── Grounds ─────────────────────────

export const Tree: FC<P> = ({ h = 9, c = '#7a3a1a', seed = 1 }) => {
  const leaves = [c, '#8a5a1c', '#5a2a14', '#6a5a24'];
  return (
    <group>
      <Cyl p={[0, h * 0.3, 0]} r0={0.35} r1={0.22} h={h * 0.6} m={M.bark()} seg={9} />
      {[0, 1, 2, 3].map((i) => (
        <B key={i} p={[Math.sin(i * 1.7 + seed) * 0.8, h * 0.55, Math.cos(i * 1.7 + seed) * 0.8]} r={[Math.cos(i * 1.7 + seed) * 0.7, 0, -Math.sin(i * 1.7 + seed) * 0.7]} s={[0.12, 2.2, 0.12]} m={M.bark()} />
      ))}
      {Array.from({ length: 7 }, (_, i) => {
        const a = i * 2.39 + seed;
        const rr = i === 0 ? 0 : 1.6 + (i % 3) * 0.4;
        return (
          <mesh key={i} position={[Math.cos(a) * rr, h * 0.72 + (i % 3) * 0.7, Math.sin(a) * rr]} material={M.foliage(leaves[(i + seed) % leaves.length])}>
            <icosahedronGeometry args={[2.0 - (i % 3) * 0.3, 0]} />
          </mesh>
        );
      })}
    </group>
  );
};

export const Cypress: FC<P> = ({ h = 6 }) => (
  <group>
    <Cyl p={[0, 0.4, 0]} r0={0.15} h={0.8} m={M.bark()} seg={6} />
    <mesh position={[0, h / 2 + 0.4, 0]} material={M.foliage('#1e2a1a')}>
      <coneGeometry args={[0.9, h, 8]} />
    </mesh>
  </group>
);

export const Hedge: FC<P> = ({ w = 4, h = 1.4, d = 1 }) => <B p={[0, h / 2, 0]} s={[w, h, d]} m={M.foliage('#1f2a1a')} />;

export const LampPost: FC<P> = ({ h = 3.4 }) => (
  <group>
    <Cyl p={[0, 0.2, 0]} r0={0.16} r1={0.12} h={0.4} m={M.iron()} seg={8} />
    <Cyl p={[0, h / 2, 0]} r0={0.05} h={h} m={M.iron()} seg={8} />
    <B p={[0, h + 0.2, 0]} s={[0.3, 0.4, 0.3]} m={M.windowLit()} />
    <mesh position={[0, h + 0.5, 0]} material={M.iron()}>
      <coneGeometry args={[0.28, 0.24, 4]} />
    </mesh>
    <B p={[0, h, 0]} s={[0.34, 0.04, 0.34]} m={M.iron()} />
  </group>
);

export const GatePillar: FC<P> = () => {
  const st = M.limestone();
  return (
    <group>
      <B p={[0, 1.4, 0]} s={[0.9, 2.8, 0.9]} m={M.facade()} />
      <B p={[0, 2.86, 0]} s={[1.05, 0.14, 1.05]} m={st} />
      <B p={[0, 0.1, 0]} s={[1.0, 0.2, 1.0]} m={st} />
      <Sph p={[0, 3.15, 0]} r={0.3} m={st} />
    </group>
  );
};

export const IronGate: FC<P> = ({ w = 6, open = 0.9 }) => {
  const ir = M.iron();
  const leaf = (side: 1 | -1) => (
    <group position={[side * (w / 2), 0, 0]} rotation={[0, -side * open, 0]}>
      <group position={[-side * (w / 4), 0, 0]}>
        <B p={[0, 0.3, 0]} s={[w / 2, 0.05, 0.05]} m={ir} />
        <B p={[0, 2.2, 0]} s={[w / 2, 0.05, 0.05]} m={ir} />
        {Array.from({ length: 13 }, (_, i) => {
          const x = -w / 4 + (i * (w / 2)) / 12;
          const top = 2.4 + Math.sin((i / 12) * Math.PI) * 0.5;
          return (
            <group key={i}>
              <B p={[x, top / 2, 0]} s={[0.025, top, 0.025]} m={ir} />
              <mesh position={[x, top + 0.06, 0]} material={M.gold()}>
                <coneGeometry args={[0.04, 0.14, 4]} />
              </mesh>
            </group>
          );
        })}
        <mesh position={[0, 1.25, 0]} material={ir}>
          <torusGeometry args={[0.35, 0.02, 6, 24]} />
        </mesh>
      </group>
    </group>
  );
  return (
    <group>
      {leaf(-1)}
      {leaf(1)}
    </group>
  );
};

export const GardenBench: FC<P> = () => {
  const ir = M.iron();
  const wd = M.lightwood();
  return (
    <group>
      {[-0.8, 0.8].map((x) => (
        <B key={x} p={[x, 0.4, 0]} s={[0.05, 0.8, 0.5]} m={ir} />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <B key={i} p={[0, 0.45, -0.18 + i * 0.12]} s={[1.8, 0.03, 0.09]} m={wd} />
      ))}
      {[0, 1, 2].map((i) => (
        <B key={i} p={[0, 0.65 + i * 0.12, -0.26]} s={[1.8, 0.08, 0.03]} r={[-0.15, 0, 0]} m={wd} />
      ))}
    </group>
  );
};

export const Urn: FC<P> = () => (
  <group>
    <B p={[0, 0.3, 0]} s={[0.6, 0.6, 0.6]} m={M.limestone()} />
    <mesh position={[0, 0.6, 0]} material={M.limestone()}>
      <latheGeometry args={[[0.1, 0.2, 0.28, 0.32, 0.3, 0.34].map((r, i) => new THREE.Vector2(r, i * 0.1)), 14]} />
    </mesh>
    <Sph p={[0, 1.2, 0]} r={0.32} m={M.foliage('#2a3320')} seg={6} />
  </group>
);

export const Balustrade: FC<P> = ({ l = 4, h = 1.0, m = 'stone' }) => {
  const mat = m === 'stone' ? M.limestone() : M.walnut();
  const n = Math.max(2, Math.floor(l / 0.24));
  return (
    <group>
      <B p={[0, h - 0.04, 0]} s={[l, 0.08, 0.2]} m={mat} />
      <B p={[0, 0.05, 0]} s={[l, 0.1, 0.18]} m={mat} />
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} position={[-l / 2 + ((i + 0.5) * l) / n, h / 2, 0]} material={mat}>
          <cylinderGeometry args={[0.035, 0.05, h - 0.16, 8]} />
        </mesh>
      ))}
    </group>
  );
};

export const Marker: FC<P> = ({ n = 1 }) => (
  <group>
    <mesh position={[0, 0.07, 0]} rotation={[0, 0, 0]} material={M.color('#d9a920', 0.5)}>
      <coneGeometry args={[0.09, 0.14, 3]} />
    </mesh>
    <mesh position={[0, 0.075, 0.042]} rotation={[-0.32, 0, 0]}>
      <planeGeometry args={[0.06, 0.06]} />
      <meshBasicMaterial color="#111" transparent opacity={0.85} />
    </mesh>
    <mesh position={[0, 0.075, 0.044]} rotation={[-0.32, 0, 0]} scale={[0.25 + (n % 3) * 0.1, 0.6, 1]}>
      <planeGeometry args={[0.05, 0.05]} />
      <meshBasicMaterial color="#d9a920" />
    </mesh>
  </group>
);

/** Front portico: paired columns and a pediment over the main door. */
export const Portico: FC<P> = () => {
  const st = M.limestone();
  return (
    <group>
      {[-2.6, 2.6].map((x) => (
        <group key={x} position={[x, 0, 2.3]}>
          <B p={[0, 0.15, 0]} s={[0.7, 0.3, 0.7]} m={st} />
          <Cyl p={[0, 2.0, 0]} r0={0.24} r1={0.2} h={3.4} m={st} seg={16} />
          <B p={[0, 3.8, 0]} s={[0.66, 0.2, 0.66]} m={st} />
        </group>
      ))}
      <B p={[0, 4.05, 1.25]} s={[6.4, 0.3, 2.6]} m={st} />
      <mesh position={[0, 4.2, 2.55]} material={st} scale={[3.3, 1.0, 1]}>
        <shapeGeometry args={[new THREE.Shape([new THREE.Vector2(-1, 0), new THREE.Vector2(1, 0), new THREE.Vector2(0, 0.9)])]} />
      </mesh>
      <B p={[0, 0.06, 1.25]} s={[6.4, 0.12, 2.6]} m={M.stone()} />
    </group>
  );
};

/** Name → component and collision footprint (w, d) in local space. */
export const FURNITURE: Record<string, { C: FC<P>; fp?: (p: P) => [number, number] }> = {
  sofa: { C: Sofa, fp: (p) => [p.w ?? 2.2, 0.95] },
  armchair: { C: Armchair, fp: () => [0.95, 0.95] },
  diningChair: { C: DiningChair },
  deskChair: { C: DeskChair },
  wickerChair: { C: WickerChair, fp: () => [0.8, 0.8] },
  bench: { C: Bench, fp: (p) => [p.w ?? 1.4, 0.45] },
  coffeeTable: { C: CoffeeTable, fp: (p) => [p.w ?? 1.2, p.d ?? 0.6] },
  sideTable: { C: SideTable, fp: () => [0.5, 0.5] },
  roundTable: { C: RoundTable, fp: (p) => [(p.r ?? 0.7) * 2, (p.r ?? 0.7) * 2] },
  console: { C: Console, fp: (p) => [p.w ?? 1.2, 0.4] },
  desk: { C: Desk, fp: () => [1.85, 0.92] },
  diningTable: { C: DiningTable, fp: (p) => [p.l ?? 6, p.d ?? 1.5] },
  sideboard: { C: Sideboard, fp: (p) => [p.w ?? 1.8, 0.52] },
  bookshelf: { C: Bookshelf, fp: (p) => [p.w ?? 2, p.d ?? 0.42] },
  wardrobe: { C: Wardrobe, fp: (p) => [p.w ?? 1.4, 0.66] },
  dresser: { C: Dresser, fp: (p) => [p.w ?? 1.3, 0.55] },
  nightstand: { C: Nightstand, fp: () => [0.5, 0.45] },
  bed: { C: Bed, fp: (p) => [p.w ?? 2.0, 2.25] },
  daybed: { C: Daybed, fp: () => [2.05, 0.9] },
  fireplace: { C: Fireplace, fp: () => [2.4, 0.7] },
  tableLamp: { C: TableLamp },
  floorLamp: { C: FloorLamp, fp: () => [0.35, 0.35] },
  chandelier: { C: Chandelier },
  pendant: { C: Pendant },
  bareBulb: { C: BareBulb },
  rug: { C: Rug },
  runner: { C: Runner },
  vase: { C: Vase },
  plantPot: { C: PlantPot, fp: (p) => [0.55 * (p.s ?? 1), 0.55 * (p.s ?? 1)] },
  coatStand: { C: CoatStand, fp: () => [0.45, 0.45] },
  piano: { C: UprightPiano, fp: () => [1.55, 0.7] },
  umbrellaStand: { C: UmbrellaStand, fp: () => [0.3, 0.3] },
  statue: { C: Statue, fp: () => [0.9, 0.9] },
  counter: { C: Counter, fp: (p) => [p.l ?? 3, 0.66] },
  stove: { C: Stove, fp: () => [1.0, 0.68] },
  fridge: { C: Fridge, fp: () => [0.9, 0.74] },
  panRack: { C: PanRack },
  wineRack: { C: WineRack, fp: (p) => [p.l ?? 2.4, 0.46] },
  boiler: { C: Boiler, fp: () => [1.15, 1.15] },
  crates: { C: Crates, fp: () => [1.2, 0.8] },
  sheeted: { C: Sheeted, fp: (p) => [p.w ?? 1.6, p.d ?? 0.9] },
  metalShelf: { C: MetalShelf, fp: (p) => [p.l ?? 2, 0.46] },
  securityDesk: { C: SecurityDesk, fp: () => [1.6, 0.7] },
  pipes: { C: Pipes },
  car: { C: Car, fp: () => [4.45, 1.85] },
  tree: { C: Tree },
  cypress: { C: Cypress },
  hedge: { C: Hedge, fp: (p) => [p.w ?? 4, p.d ?? 1] },
  lampPost: { C: LampPost, fp: () => [0.3, 0.3] },
  marker: { C: Marker },
  portico: { C: Portico },
  gatePillar: { C: GatePillar, fp: () => [0.95, 0.95] },
  ironGate: { C: IronGate },
  gardenBench: { C: GardenBench, fp: () => [1.8, 0.55] },
  urn: { C: Urn, fp: () => [0.6, 0.6] },
  balustrade: { C: Balustrade, fp: (p) => [p.l ?? 4, 0.24] },
};
