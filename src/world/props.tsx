/**
 * Visuals for interactable objects. Each is used twice: placed in the mansion,
 * and rendered large in the inspection view. Local origin is the object's base.
 */
import { useMemo, type FC } from 'react';
import * as THREE from 'three';
import { B, Cyl, M, Sph } from './kit';
import { Armchair, Car, Daybed } from './furniture';
import { portraitTexture } from './textures';
import { CHARACTER_BY_ID } from '../data/case';
import type { VisualKey } from '../data/interactables';

type P = Record<string, any>;

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

const texCache = new Map<string, THREE.Texture>();
function cached(key: string, make: () => THREE.Texture) {
  let t = texCache.get(key);
  if (!t) {
    t = make();
    texCache.set(key, t);
  }
  return t;
}

const Plane = ({ p, s, map, r, color }: { p: [number, number, number]; s: [number, number]; map?: THREE.Texture; r?: [number, number, number]; color?: string }) => (
  <mesh position={p} rotation={r}>
    <planeGeometry args={s} />
    <meshStandardMaterial map={map} color={color ?? '#ffffff'} roughness={0.9} side={THREE.DoubleSide} />
  </mesh>
);

// ─────────────────────────────────────────────────────────────

export const PlanSheet: FC<P> = () => {
  const map = cached('plan', () =>
    canvasTex(256, 192, (g) => {
      g.fillStyle = '#1d3350';
      g.fillRect(0, 0, 256, 192);
      g.strokeStyle = 'rgba(230,240,255,0.8)';
      g.lineWidth = 2;
      g.strokeRect(20, 30, 216, 130);
      g.lineWidth = 1;
      [[20, 90, 236, 90], [100, 30, 100, 160], [156, 30, 156, 160], [20, 120, 100, 120]].forEach(([a, b, c, d]) => {
        g.beginPath();
        g.moveTo(a, b);
        g.lineTo(c, d);
        g.stroke();
      });
      g.fillStyle = 'rgba(230,240,255,0.9)';
      g.font = '12px serif';
      g.fillText('THROMBEY ESTATE — GROUND', 30, 20);
    }),
  );
  return (
    <group>
      <Plane p={[0, 0.003, 0]} s={[0.42, 0.3]} map={map} r={[-Math.PI / 2, 0, 0.1]} />
      <Cyl p={[0.05, 0.03, -0.18]} r0={0.03} h={0.5} m={M.color('#2a4468', 0.9)} rot={[0, 0, Math.PI / 2]} />
    </group>
  );
};

export const Portrait: FC<P> = ({ character = 'harlan', w = 1.0, h = 1.3 }) => {
  const ch = CHARACTER_BY_ID[character];
  const map = portraitTexture(character, ch?.palette ?? ['#222', '#ccc', '#888']);
  const g = M.gold();
  const fw = 0.12;
  return (
    <group>
      <mesh position={[0, 0, 0.04]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={map} roughness={0.55} />
      </mesh>
      <B p={[0, h / 2 + fw / 2, 0.05]} s={[w + fw * 2, fw, 0.1]} m={g} />
      <B p={[0, -h / 2 - fw / 2, 0.05]} s={[w + fw * 2, fw, 0.1]} m={g} />
      <B p={[-w / 2 - fw / 2, 0, 0.05]} s={[fw, h, 0.1]} m={g} />
      <B p={[w / 2 + fw / 2, 0, 0.05]} s={[fw, h, 0.1]} m={g} />
      <B p={[0, h / 2 + 0.02, 0.1]} s={[w + 0.06, 0.03, 0.03]} m={M.brass()} />
      <B p={[0, -h / 2 - 0.02, 0.1]} s={[w + 0.06, 0.03, 0.03]} m={M.brass()} />
      <B p={[0, -h / 2 - fw / 2, 0.11]} s={[0.3, 0.06, 0.01]} m={M.brass()} />
    </group>
  );
};

export const Clock: FC<P> = () => {
  const wd = M.walnut();
  const face = cached('clockface', () =>
    canvasTex(256, 256, (g) => {
      g.fillStyle = '#efe4cc';
      g.beginPath();
      g.arc(128, 128, 126, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#1a1a1a';
      g.font = 'bold 24px serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      const R = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
      R.forEach((n, i) => {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        g.fillText(n, 128 + Math.cos(a) * 98, 128 + Math.sin(a) * 98);
      });
      // hands at 12:19
      g.strokeStyle = '#111';
      g.lineCap = 'round';
      g.lineWidth = 6;
      const ha = ((0 + 19 / 60) / 12) * Math.PI * 2 - Math.PI / 2;
      g.beginPath();
      g.moveTo(128, 128);
      g.lineTo(128 + Math.cos(ha) * 55, 128 + Math.sin(ha) * 55);
      g.stroke();
      g.lineWidth = 3;
      const ma = (19 / 60) * Math.PI * 2 - Math.PI / 2;
      g.beginPath();
      g.moveTo(128, 128);
      g.lineTo(128 + Math.cos(ma) * 85, 128 + Math.sin(ma) * 85);
      g.stroke();
    }),
  );
  return (
    <group>
      <B p={[0, 0.2, 0]} s={[0.6, 0.4, 0.45]} m={wd} />
      <B p={[0, 1.0, 0]} s={[0.46, 1.2, 0.36]} m={wd} />
      <B p={[0, 1.0, 0.185]} s={[0.26, 0.9, 0.01]} m={M.glass()} />
      <Cyl p={[0, 0.8, 0.12]} r0={0.07} h={0.02} m={M.brass()} rot={[Math.PI / 2, 0, 0]} />
      <B p={[0, 1.15, 0.12]} s={[0.015, 0.7, 0.01]} m={M.brass()} />
      <B p={[0, 1.8, 0]} s={[0.6, 0.6, 0.45]} m={wd} />
      <mesh position={[0, 1.8, 0.228]}>
        <circleGeometry args={[0.22, 32]} />
        <meshStandardMaterial map={face} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.8, 0.23]} rotation={[0, 0, 0]} material={M.brass()}>
        <ringGeometry args={[0.22, 0.25, 32]} />
      </mesh>
      <B p={[0, 2.15, 0]} s={[0.66, 0.1, 0.5]} m={M.darkwood()} />
      <mesh position={[0, 2.32, 0]} material={wd}>
        <cylinderGeometry args={[0.02, 0.33, 0.24, 4]} />
      </mesh>
      {[-0.25, 0, 0.25].map((x) => (
        <Sph key={x} p={[x, 2.5, 0]} r={0.04} m={M.brass()} />
      ))}
    </group>
  );
};

export const KnifeWheel: FC<P> = () => {
  const steel = M.steel();
  const hilt = M.darkwood();
  const n = 36;
  const R = 1.35;
  return (
    <group position={[0, 1.9, 0]}>
      <Cyl p={[0, 0, 0.05]} r0={0.36} h={0.14} m={M.brass()} rot={[Math.PI / 2, 0, 0]} seg={32} />
      <Cyl p={[0, 0, 0.13]} r0={0.18} h={0.06} m={M.gold()} rot={[Math.PI / 2, 0, 0]} seg={32} />
      <mesh position={[0, 0, 0.02]} material={M.darkwood()}>
        <torusGeometry args={[0.75, 0.04, 6, 48]} />
      </mesh>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 + Math.PI / 2;
        if (i === 0) {
          // the empty slot, straight up — a clean outline in the dust
          return (
            <group key={i} rotation={[0, 0, a - Math.PI / 2]}>
              <B p={[0, 0.66, 0.06]} s={[0.06, 0.2, 0.02]} m={M.black()} />
              <mesh position={[0, R - 0.02, 0.071]}>
                <planeGeometry args={[0.07, 0.62]} />
                <meshStandardMaterial color="#6a6052" roughness={1} />
              </mesh>
            </group>
          );
        }
        const len = i % 3 === 0 ? 0.75 : i % 3 === 1 ? 0.6 : 0.68;
        return (
          <group key={i} rotation={[0, 0, a - Math.PI / 2]}>
            <B p={[0, 0.62, 0.06]} s={[0.07, 0.22, 0.04]} m={hilt} />
            <B p={[0, 0.74, 0.06]} s={[0.14, 0.03, 0.04]} m={M.brass()} />
            <mesh position={[0, 0.76 + len / 2, 0.06]} material={steel}>
              <coneGeometry args={[0.035, len, 4]} />
            </mesh>
          </group>
        );
      })}
      {/* stand */}
      <B p={[-0.5, -1.0, -0.02]} s={[0.08, 1.9, 0.08]} m={M.iron()} r={[0, 0, 0.25]} />
      <B p={[0.5, -1.0, -0.02]} s={[0.08, 1.9, 0.08]} m={M.iron()} r={[0, 0, -0.25]} />
      <B p={[0, -1.85, 0]} s={[1.6, 0.1, 0.4]} m={M.iron()} />
    </group>
  );
};

export const AshGrate: FC<P> = () => {
  const frag = cached('frag', () =>
    canvasTex(256, 192, (g) => {
      g.fillStyle = '#d8c8a4';
      g.beginPath();
      g.moveTo(10, 20);
      g.lineTo(240, 8);
      g.lineTo(220, 120);
      g.lineTo(150, 180);
      g.lineTo(40, 160);
      g.closePath();
      g.fill();
      const grd = g.createRadialGradient(128, 90, 40, 128, 90, 140);
      grd.addColorStop(0, 'rgba(0,0,0,0)');
      grd.addColorStop(0.75, 'rgba(60,30,10,0.6)');
      grd.addColorStop(1, 'rgba(10,5,0,1)');
      g.fillStyle = grd;
      g.fill();
      g.fillStyle = '#2a2016';
      g.font = 'bold 18px serif';
      g.fillText('…ty Medical Examin…', 30, 60);
      g.font = '14px serif';
      g.fillText('…toxicology…', 60, 100);
      g.fillText('…H. Thrombey…', 50, 130);
    }),
  );
  return (
    <group>
      {[-0.3, -0.1, 0.1, 0.3].map((x) => (
        <B key={x} p={[x, 0.1, 0]} s={[0.025, 0.2, 0.35]} m={M.iron()} />
      ))}
      <B p={[0, 0.02, 0]} s={[0.8, 0.04, 0.4]} m={M.iron()} />
      <mesh position={[0, 0.06, 0]} scale={[1, 0.25, 0.6]} material={M.color('#5a5650', 1)}>
        <sphereGeometry args={[0.3, 12, 8]} />
      </mesh>
      <mesh position={[0.12, 0.13, 0.08]} rotation={[-1.2, 0, 0.3]}>
        <planeGeometry args={[0.24, 0.18]} />
        <meshStandardMaterial map={frag} transparent alphaTest={0.1} roughness={1} side={THREE.DoubleSide} />
      </mesh>
      <B p={[-0.15, 0.1, -0.05]} s={[0.4, 0.06, 0.07]} r={[0, 0.5, 0]} m={M.ember()} />
    </group>
  );
};

export const Decanter: FC<P> = () => (
  <group>
    <B p={[0, 0.01, 0]} s={[0.5, 0.02, 0.32]} m={M.brass()} />
    <mesh position={[0, 0.02, 0]} material={M.glass()}>
      <latheGeometry args={[[0, 0.08, 0.1, 0.09, 0.04, 0.03, 0.035].map((r, i) => new THREE.Vector2(r, i * 0.05)), 16]} />
    </mesh>
    <mesh position={[0, 0.03, 0]} scale={[1, 0.5, 1]} material={M.color('#5a2a10', 0.1)}>
      <sphereGeometry args={[0.085, 12, 8]} />
    </mesh>
    <Sph p={[0, 0.34, 0]} r={0.03} m={M.glass()} />
    {[-0.17, 0.17].map((x) =>
      [-0.08, 0.08].map((z) => (
        <mesh key={`${x}${z}`} position={[x, 0.02, z]} material={M.glass()}>
          <cylinderGeometry args={[0.035, 0.03, 0.08, 10, 1, true]} />
        </mesh>
      )),
    )}
  </group>
);

export const MedBag: FC<P> = () => {
  const l = M.leather('#2a1a12');
  const vial = (x: number, label: string) => (
    <group position={[x, 0, 0.22]}>
      <Cyl p={[0, 0.045, 0]} r0={0.018} h={0.09} m={M.glass()} seg={10} />
      <Cyl p={[0, 0.1, 0]} r0={0.019} h={0.02} m={M.color('#a8a8b0', 0.4, 0.6)} seg={10} />
      <mesh position={[0, 0.045, 0.0185]}>
        <planeGeometry args={[0.03, 0.04]} />
        <meshBasicMaterial color={label} />
      </mesh>
    </group>
  );
  return (
    <group>
      <mesh position={[0, 0.13, 0]} material={l}>
        <boxGeometry args={[0.42, 0.24, 0.22]} />
      </mesh>
      <mesh position={[0, 0.25, 0]} rotation={[0, 0, Math.PI / 2]} material={l} scale={[1, 1, 0.9]}>
        <cylinderGeometry args={[0.11, 0.11, 0.42, 16, 1, false, 0, Math.PI]} />
      </mesh>
      <B p={[0, 0.25, 0]} s={[0.44, 0.02, 0.02]} m={M.brass()} />
      <mesh position={[0, 0.38, 0]} rotation={[Math.PI / 2, 0, 0]} material={l}>
        <torusGeometry args={[0.08, 0.012, 6, 16, Math.PI]} />
      </mesh>
      <B p={[-0.15, 0.08, 0.112]} s={[0.08, 0.03, 0.005]} m={M.ivory()} />
      {vial(-0.03, '#e8e2d0')}
      {vial(0.03, '#eae6d8')}
    </group>
  );
};

export const GoBoard: FC<P> = () => {
  const grid = cached('goboard', () =>
    canvasTex(256, 256, (g) => {
      g.fillStyle = '#c99a5a';
      g.fillRect(0, 0, 256, 256);
      g.strokeStyle = '#2a1a0a';
      for (let i = 0; i < 19; i++) {
        const p = 12 + i * 12.889;
        g.beginPath();
        g.moveTo(12, p);
        g.lineTo(244, p);
        g.stroke();
        g.beginPath();
        g.moveTo(p, 12);
        g.lineTo(p, 244);
        g.stroke();
      }
    }),
  );
  const stones = useMemo(() => {
    const out: { x: number; z: number; w: boolean }[] = [];
    let s = 7;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 46; i++) {
      out.push({ x: Math.floor(rnd() * 19), z: Math.floor(rnd() * 19), w: i % 2 === 0 || rnd() > 0.7 });
    }
    return out;
  }, []);
  const S = 0.42;
  return (
    <group>
      <B p={[0, 0.04, 0]} s={[0.45, 0.08, 0.45]} m={M.lightwood()} />
      <mesh position={[0, 0.0805, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[S, S]} />
        <meshStandardMaterial map={grid} roughness={0.6} />
      </mesh>
      {stones.map((st, i) => (
        <mesh key={i} position={[-S / 2 + 0.01 + (st.x * (S - 0.02)) / 18, 0.088, -S / 2 + 0.01 + (st.z * (S - 0.02)) / 18]} scale={[1, 0.45, 1]} material={st.w ? M.white() : M.black()}>
          <sphereGeometry args={[0.0105, 10, 6]} />
        </mesh>
      ))}
      {[
        [0.32, 0.18, true],
        [0.32, -0.18, false],
      ].map(([x, z, w], i) => (
        <group key={i} position={[x as number, -0.02, z as number]}>
          <mesh material={M.walnut()}>
            <sphereGeometry args={[0.07, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          </mesh>
          <Cyl p={[0, 0.0, 0]} r0={0.07} h={0.005} m={w ? M.white() : M.black()} />
        </group>
      ))}
    </group>
  );
};

export const Dagger: FC<P> = () => (
  <group rotation={[0, 0, 0]}>
    <mesh position={[0.11, 0.012, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[1, 1, 0.25]} material={M.steel()}>
      <coneGeometry args={[0.022, 0.22, 4]} />
    </mesh>
    <B p={[0.1, 0.0155, 0.004]} s={[0.17, 0.002, 0.01]} m={M.blood()} />
    <B p={[-0.01, 0.012, 0]} s={[0.02, 0.02, 0.07]} m={M.brass()} />
    <Cyl p={[-0.07, 0.012, 0]} r0={0.012} h={0.1} m={M.darkwood()} rot={[0, 0, Math.PI / 2]} seg={8} />
    <Cyl p={[-0.125, 0.012, 0]} r0={0.02} h={0.01} m={M.gold()} rot={[0, 0, Math.PI / 2]} seg={12} />
  </group>
);

export const Typewriter: FC<P> = () => (
  <group>
    <B p={[0, 0.06, 0]} s={[0.36, 0.12, 0.3]} m={M.color('#141414', 0.35, 0.3)} />
    <mesh position={[0, 0.13, -0.05]} rotation={[-0.4, 0, 0]} material={M.color('#141414', 0.35, 0.3)}>
      <boxGeometry args={[0.36, 0.06, 0.18]} />
    </mesh>
    <Cyl p={[0, 0.17, -0.12]} r0={0.025} h={0.4} m={M.black()} rot={[0, 0, Math.PI / 2]} />
    <mesh position={[0, 0.25, -0.13]} rotation={[-0.15, 0, 0]} material={M.paper()}>
      <planeGeometry args={[0.2, 0.16]} />
    </mesh>
    {Array.from({ length: 4 }, (_, r) =>
      Array.from({ length: 10 }, (_, c) => <Cyl key={`${r}${c}`} p={[-0.13 + c * 0.029, 0.125 + r * 0.012, 0.09 - r * 0.028]} r0={0.009} h={0.01} m={M.ivory()} seg={8} />),
    )}
  </group>
);

export const Letter: FC<P> = () => (
  <group>
    <B p={[0, 0.001, 0]} s={[0.21, 0.002, 0.29]} m={M.paper()} />
    <B p={[0.03, 0.003, 0.03]} s={[0.24, 0.002, 0.14]} r={[0, 0.2, 0]} m={M.color('#c9b48a', 0.95)} />
  </group>
);

export const HollowBook: FC<P> = () => (
  <group>
    <B p={[0, 0, 0]} s={[0.05, 0.26, 0.2]} m={M.color('#632331', 0.8)} />
    <B p={[0, 0.07, 0.101]} s={[0.04, 0.012, 0.001]} m={M.gold()} />
    <B p={[0, -0.07, 0.101]} s={[0.04, 0.012, 0.001]} m={M.gold()} />
  </group>
);

export const Globe: FC<P> = () => {
  const map = cached('globe', () =>
    canvasTex(512, 256, (g) => {
      g.fillStyle = '#c9b48a';
      g.fillRect(0, 0, 512, 256);
      let s = 3;
      const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      g.fillStyle = '#7a5a32';
      for (let i = 0; i < 26; i++) {
        g.beginPath();
        g.ellipse(rnd() * 512, 40 + rnd() * 176, 20 + rnd() * 50, 10 + rnd() * 30, rnd() * 3, 0, Math.PI * 2);
        g.fill();
      }
      g.strokeStyle = 'rgba(40,20,10,0.4)';
      for (let i = 0; i < 12; i++) {
        g.beginPath();
        g.moveTo((i * 512) / 12, 0);
        g.lineTo((i * 512) / 12, 256);
        g.stroke();
      }
    }),
  );
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <B key={i} p={[Math.sin((i * Math.PI * 2) / 3) * 0.2, 0.3, Math.cos((i * Math.PI * 2) / 3) * 0.2]} r={[Math.cos((i * Math.PI * 2) / 3) * 0.2, 0, -Math.sin((i * Math.PI * 2) / 3) * 0.2]} s={[0.04, 0.62, 0.04]} m={M.walnut()} />
      ))}
      <mesh position={[0, 0.62, 0]} rotation={[Math.PI / 2, 0, 0]} material={M.walnut()}>
        <torusGeometry args={[0.36, 0.03, 6, 32]} />
      </mesh>
      <mesh position={[0, 0.95, 0]} rotation={[0, 0, 0.41]}>
        <sphereGeometry args={[0.32, 32, 18]} />
        <meshStandardMaterial map={map} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.95, 0]} rotation={[0, Math.PI / 2, 0.41]} material={M.brass()}>
        <torusGeometry args={[0.34, 0.012, 6, 40, Math.PI * 1.4]} />
      </mesh>
    </group>
  );
};

export const PlaceCard: FC<P> = () => (
  <group>
    <mesh position={[0, 0.035, 0.012]} rotation={[-0.35, 0, 0]} material={M.ivory()}>
      <boxGeometry args={[0.12, 0.075, 0.002]} />
    </mesh>
    <mesh position={[0, 0.035, -0.012]} rotation={[0.35, 0, 0]} material={M.ivory()}>
      <boxGeometry args={[0.12, 0.075, 0.002]} />
    </mesh>
    <mesh position={[0, 0.04, 0.026]} rotation={[-0.35, 0, 0]}>
      <planeGeometry args={[0.09, 0.012]} />
      <meshBasicMaterial color="#2a1a14" />
    </mesh>
  </group>
);

export const Cake: FC<P> = () => {
  const icing = M.color('#efe4cc', 0.6);
  return (
    <group>
      <Cyl p={[0, 0.01, 0]} r0={0.24} h={0.02} m={M.chrome()} seg={24} />
      <mesh position={[0, 0.08, 0]} material={icing}>
        <cylinderGeometry args={[0.18, 0.18, 0.12, 24, 1, false, 0.6, Math.PI * 2 - 0.9]} />
      </mesh>
      <mesh position={[0, 0.18, 0]} material={icing}>
        <cylinderGeometry args={[0.11, 0.11, 0.09, 20, 1, false, 0.6, Math.PI * 2 - 0.9]} />
      </mesh>
      <mesh position={[0, 0.08, 0]} material={M.color('#4a2014', 0.9)}>
        <cylinderGeometry args={[0.175, 0.175, 0.118, 24, 1, false, 0.6 + Math.PI * 2 - 0.9, 0.9]} />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => (
        <Sph key={i} p={[Math.cos(i * 0.52) * 0.18, 0.14, Math.sin(i * 0.52) * 0.18]} r={0.012} m={M.burgundy()} seg={6} />
      ))}
      <B p={[-0.03, 0.27, 0]} s={[0.04, 0.08, 0.012]} m={M.gold()} />
      <B p={[0.03, 0.27, 0]} s={[0.04, 0.08, 0.012]} m={M.gold()} />
    </group>
  );
};

export const FlourTin: FC<P> = () => {
  const label = cached('flour', () =>
    canvasTex(256, 64, (g) => {
      g.fillStyle = '#f1e7d3';
      g.fillRect(0, 0, 256, 64);
      g.fillStyle = '#632331';
      g.font = 'bold 34px serif';
      g.textAlign = 'center';
      g.fillText('FLOUR', 128, 45);
    }),
  );
  return (
    <group>
      <Cyl p={[0, 0.12, 0]} r0={0.11} h={0.24} m={M.color('#3a4a3a', 0.4, 0.5)} seg={20} />
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.112, 0.112, 0.08, 20, 1, true, -0.8, 1.6]} />
        <meshStandardMaterial map={label} roughness={0.7} />
      </mesh>
      <Cyl p={[0, 0.25, 0]} r0={0.115} h={0.025} m={M.brass()} seg={20} />
      <Sph p={[0, 0.27, 0]} r={0.02} m={M.brass()} />
      {/* the key behind */}
      <group position={[0, 0.01, -0.16]} rotation={[-Math.PI / 2, 0, 0.4]}>
        <mesh material={M.brass()}>
          <torusGeometry args={[0.022, 0.006, 6, 14]} />
        </mesh>
        <B p={[0.07, 0, 0]} s={[0.1, 0.008, 0.006]} m={M.brass()} />
        <B p={[0.11, -0.012, 0]} s={[0.012, 0.02, 0.006]} m={M.brass()} />
        <B p={[-0.04, 0.02, 0]} s={[0.03, 0.025, 0.002]} m={M.ivory()} />
      </group>
    </group>
  );
};

export const Mug: FC<P> = () => {
  const label = cached('mug', () =>
    canvasTex(256, 96, (g) => {
      g.fillStyle = '#f1e7d3';
      g.fillRect(0, 0, 256, 96);
      g.fillStyle = '#171e2a';
      g.font = 'bold 16px sans-serif';
      g.textAlign = 'center';
      g.fillText('MY HOUSE', 128, 30);
      g.fillText('MY RULES', 128, 52);
      g.fillText('MY COFFEE', 128, 74);
    }),
  );
  return (
    <group>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.042, 0.04, 0.1, 18]} />
        <meshStandardMaterial map={label} roughness={0.3} />
      </mesh>
      <mesh position={[0.045, 0.05, 0]} material={M.ivory()}>
        <torusGeometry args={[0.025, 0.007, 6, 12]} />
      </mesh>
      <Cyl p={[0, 0.095, 0]} r0={0.036} h={0.005} m={M.color('#2a1408', 0.1)} />
    </group>
  );
};

export const Boots: FC<P> = () => (
  <group>
    {Array.from({ length: 5 }, (_, i) =>
      [-0.06, 0.06].map((dz) => (
        <group key={`${i}${dz}`} position={[0, 0, (i - 2) * 0.3 + dz]}>
          <Cyl p={[0, 0.2, 0]} r0={0.05} r1={0.055} h={0.38} m={M.color(i % 2 ? '#1e2a1e' : '#1a1a1a', 0.4)} seg={10} />
          <B p={[0.06, 0.03, 0]} s={[0.2, 0.06, 0.09]} m={M.color('#141414', 0.5)} />
        </group>
      )),
    )}
  </group>
);

export const Orchid: FC<P> = () => (
  <group>
    <Cyl p={[0, 0.45, 0]} r0={0.25} r1={0.2} h={0.9} m={M.limestone()} seg={12} />
    <Cyl p={[0, 1.0, 0]} r0={0.1} r1={0.13} h={0.2} m={M.color('#e9e3d6', 0.2)} />
    {[-0.5, 0.4, 2].map((a, i) => (
      <mesh key={i} position={[Math.cos(a) * 0.08, 1.12, Math.sin(a) * 0.08]} rotation={[0, a, 1.2]} scale={[1, 0.2, 0.5]} material={M.foliage('#2a3a1e')}>
        <sphereGeometry args={[0.12, 8, 6]} />
      </mesh>
    ))}
    <Cyl p={[0, 1.35, 0]} r0={0.006} h={0.5} m={M.foliage('#2a3a1e')} rot={[0, 0, 0.1]} seg={4} />
    {Array.from({ length: 6 }, (_, i) => (
      <Sph key={i} p={[0.02 + i * 0.025, 1.48 + Math.sin(i) * 0.04, Math.cos(i * 2) * 0.03]} r={0.03} s={[1, 0.6, 1]} m={M.white()} seg={8} />
    ))}
  </group>
);

export const Workbench: FC<P> = () => {
  const wd = M.lightwood();
  return (
    <group>
      {[-0.95, 0.95].map((x) => [-0.3, 0.3].map((z) => <B key={`${x}${z}`} p={[x, 0.45, z]} s={[0.08, 0.9, 0.08]} m={wd} />))}
      <B p={[0, 0.92, 0]} s={[2.1, 0.06, 0.75]} m={wd} />
      <B p={[0, 0.3, 0]} s={[2.0, 0.03, 0.7]} m={wd} />
      <B p={[0, 1.7, -0.36]} s={[2.1, 1.4, 0.03]} m={M.color('#8a7454', 0.95)} />
      {[
        [-0.7, 1.9, 0.3, 0.05],
        [-0.3, 1.8, 0.04, 0.4],
        [0.1, 1.95, 0.25, 0.06],
        [0.5, 1.7, 0.05, 0.3],
        [0.8, 1.6, 0.18, 0.05],
      ].map(([x, y, w, h], i) => (
        <B key={i} p={[x, y, -0.33]} s={[w, h, 0.03]} m={i % 2 ? M.steel() : M.color('#7a2a24', 0.6)} />
      ))}
      <B p={[0.2, 1.4, -0.343]} s={[0.25, 0.08, 0.005]} m={M.black()} />
      <B p={[-0.5, 1.0, 0.1]} s={[0.4, 0.1, 0.25]} m={M.color('#5a1c22', 0.4, 0.3)} />
    </group>
  );
};

export const Pillbox: FC<P> = () => (
  <group>
    <B p={[0, 0.015, 0]} s={[0.21, 0.03, 0.05]} m={M.color('#d9cbaf', 0.3)} />
    {Array.from({ length: 7 }, (_, i) => (
      <B key={i} p={[-0.09 + i * 0.03, 0.032, 0]} s={[0.026, 0.004, 0.046]} m={M.color(i === 6 ? '#632331' : '#66684d', 0.4)} />
    ))}
    <Sph p={[0.09, 0.04, 0]} r={0.006} m={M.white()} />
  </group>
);

export const PhotoFrame: FC<P> = ({ character = 'marta' }) => {
  const ch = CHARACTER_BY_ID[character];
  const map = portraitTexture(`${character}-photo`, ch?.palette ?? ['#222', '#ccc', '#888']);
  return (
    <group rotation={[-0.15, 0, 0]}>
      <B p={[0, 0.12, 0]} s={[0.2, 0.25, 0.015]} m={M.gold()} />
      <mesh position={[0, 0.12, 0.009]}>
        <planeGeometry args={[0.16, 0.21]} />
        <meshStandardMaterial map={map} roughness={0.3} />
      </mesh>
      <B p={[0, 0.08, -0.06]} s={[0.02, 0.15, 0.01]} r={[0.6, 0, 0]} m={M.darkwood()} />
    </group>
  );
};

export const RecordPlayer: FC<P> = () => (
  <group>
    <B p={[0, 0.4, 0]} s={[0.8, 0.8, 0.55]} m={M.walnut()} />
    <B p={[0, 0.81, 0]} s={[0.82, 0.03, 0.57]} m={M.darkwood()} />
    <Cyl p={[0, 0.835, 0]} r0={0.17} h={0.01} m={M.black()} seg={28} />
    <Cyl p={[0, 0.842, 0]} r0={0.04} h={0.003} m={M.burgundy()} />
    <mesh position={[0.25, 1.15, -0.12]} rotation={[0.2, 0, -0.5]} material={M.brass()}>
      <coneGeometry args={[0.24, 0.55, 20, 1, true]} />
    </mesh>
    <B p={[0.12, 0.88, -0.05]} s={[0.22, 0.015, 0.015]} r={[0, 0.4, 0]} m={M.brass()} />
    {[0.3, 0.5].map((y) => (
      <B key={y} p={[0, y, 0.276]} s={[0.7, 0.16, 0.01]} m={M.darkwood()} />
    ))}
  </group>
);

export const Crystals: FC<P> = () => (
  <group>
    {Array.from({ length: 7 }, (_, i) => (
      <mesh key={i} position={[Math.cos(i * 0.9) * 0.1, 0.03, Math.sin(i * 0.9) * 0.1]} rotation={[0, i, i === 3 ? Math.PI / 2 : 0]} material={M.color(['#9a7ab0', '#e0d8f0', '#c96a8a', '#80b0a0'][i % 4], 0.1, 0.1)}>
        <octahedronGeometry args={[0.03 + (i % 3) * 0.008]} />
      </mesh>
    ))}
    <B p={[0, 0.001, 0]} s={[0.3, 0.002, 0.3]} m={M.fabric('#632331')} />
  </group>
);

export const FuseBox: FC<P> = () => (
  <group>
    <B p={[0, 0, 0.06]} s={[0.5, 0.6, 0.12]} m={M.color('#4a4a44', 0.6, 0.6)} />
    <B p={[-0.38, 0, 0.12]} s={[0.26, 0.6, 0.02]} r={[0, 1.0, 0]} m={M.color('#5a5a54', 0.6, 0.6)} />
    {Array.from({ length: 4 }, (_, r) =>
      Array.from({ length: 5 }, (_, c) => (
        <group key={`${r}${c}`}>
          <B p={[-0.16 + c * 0.08, 0.18 - r * 0.12, 0.125]} s={[0.04, 0.07, 0.02]} m={M.black()} />
          <B p={[-0.16 + c * 0.08, 0.13 - r * 0.12, 0.122]} s={[0.06, 0.02, 0.005]} m={M.ivory()} r={r === 2 && c === 3 ? [0, 0, 0.3] : undefined} />
        </group>
      )),
    )}
  </group>
);

export const Logbook: FC<P> = () => (
  <group>
    <B p={[0, 0.01, 0]} s={[0.42, 0.02, 0.3]} m={M.color('#2a3a2a', 0.8)} />
    <B p={[-0.1, 0.022, 0]} s={[0.19, 0.006, 0.28]} m={M.paper()} />
    <B p={[0.1, 0.022, 0]} s={[0.19, 0.006, 0.28]} m={M.paper()} />
    {Array.from({ length: 8 }, (_, i) => (
      <B key={i} p={[0.1, 0.026, -0.11 + i * 0.03]} s={[0.17, 0.001, 0.003]} m={M.color('#5a6a8a', 1)} />
    ))}
    <Cyl p={[0.25, 0.01, 0.05]} r0={0.004} h={0.14} m={M.color('#c9a227')} rot={[Math.PI / 2, 0, 0.3]} seg={6} />
  </group>
);

export const Trunk: FC<P> = () => {
  const c = M.color('#3a2a1a', 0.7);
  return (
    <group>
      <B p={[0, 0.3, 0]} s={[1.1, 0.6, 0.65]} m={c} />
      <group position={[0, 0.6, -0.325]} rotation={[-1.1, 0, 0]}>
        <B p={[0, 0.05, 0.325]} s={[1.1, 0.1, 0.65]} m={c} />
      </group>
      {[-0.35, 0.35].map((x) => (
        <B key={x} p={[x, 0.3, 0]} s={[0.06, 0.61, 0.66]} m={M.leather('#5a3a1c')} />
      ))}
      {[-0.54, 0.54].map((x) =>
        [-0.31, 0.31].map((z) => <B key={`${x}${z}`} p={[x, 0.3, z]} s={[0.04, 0.62, 0.04]} m={M.brass()} />),
      )}
      <B p={[0, 0.57, 0.05]} s={[0.9, 0.05, 0.5]} m={M.paper()} />
      <B p={[0.15, 0.6, 0.1]} s={[0.09, 0.005, 0.11]} r={[0, 0.3, 0]} m={M.white()} />
    </group>
  );
};

export const RockingHorse: FC<P> = () => {
  const wd = M.lightwood();
  return (
    <group>
      {[-0.15, 0.15].map((z) => (
        <mesh key={z} position={[0, 0.9, z]} rotation={[0, 0, Math.PI]} material={M.darkwood()}>
          <torusGeometry args={[0.9, 0.025, 6, 24, 1.3]} />
        </mesh>
      ))}
      {[-0.3, 0.3].map((x) => [-0.12, 0.12].map((z) => <B key={`${x}${z}`} p={[x, 0.3, z]} r={[z * 1.5, 0, 0]} s={[0.05, 0.4, 0.05]} m={wd} />))}
      <B p={[0, 0.58, 0]} s={[0.75, 0.24, 0.24]} m={M.color('#d9cbaf', 0.7)} />
      <B p={[0.42, 0.82, 0]} s={[0.12, 0.4, 0.14]} r={[0, 0, -0.4]} m={M.color('#d9cbaf', 0.7)} />
      <B p={[0.52, 0.98, 0]} s={[0.28, 0.14, 0.14]} r={[0, 0, -0.3]} m={M.color('#d9cbaf', 0.7)} />
      <B p={[0.36, 0.95, 0]} s={[0.22, 0.3, 0.03]} r={[0, 0, -0.4]} m={M.color('#2a1a14', 1)} />
      <B p={[0, 0.72, 0]} s={[0.24, 0.04, 0.26]} m={M.burgundy()} />
    </group>
  );
};

export const Trellis: FC<P> = () => {
  const wd = M.color('#d9cbaf', 0.8);
  const H = 6.2;
  const W = 1.6;
  const rungs = Array.from({ length: 14 }, (_, i) => 0.4 + i * 0.42);
  return (
    <group>
      {[-W / 2, -W / 6, W / 6, W / 2].map((x) => (
        <B key={x} p={[x, H / 2, 0.04]} s={[0.05, H, 0.04]} m={wd} />
      ))}
      {rungs.map((y, i) => {
        if (i === 11) {
          // snapped rung — two splintered stubs hanging down
          return (
            <group key={y}>
              <B p={[-0.55, y - 0.05, 0.06]} s={[0.5, 0.04, 0.03]} r={[0, 0, -0.5]} m={wd} />
              <B p={[0.55, y - 0.05, 0.06]} s={[0.5, 0.04, 0.03]} r={[0, 0, 0.5]} m={wd} />
            </group>
          );
        }
        if (i === 12) {
          return <B key={y} p={[0.3, y - 0.12, 0.06]} s={[0.9, 0.04, 0.03]} r={[0, 0, 0.35]} m={wd} />;
        }
        return <B key={y} p={[0, y, 0.06]} s={[W, 0.04, 0.03]} m={wd} />;
      })}
      {Array.from({ length: 34 }, (_, i) => {
        const y = 0.3 + ((i * 37) % 47) / 10;
        const x = (((i * 53) % 15) / 15 - 0.5) * W;
        return <Sph key={i} p={[x, y, 0.12]} r={0.09 + (i % 3) * 0.03} m={M.foliage(i % 4 === 0 ? '#7a1420' : '#1f2a1a')} seg={5} />;
      })}
    </group>
  );
};

export const Footprint: FC<P> = () => {
  const m = M.color('#120c08', 0.4);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0.04]} scale={[0.42, 1, 1]} material={m}>
        <circleGeometry args={[0.09, 20]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, -0.09]} scale={[0.5, 0.8, 1]} material={m}>
        <circleGeometry args={[0.06, 20]} />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => (
        <B key={i} p={[0, 0.003, 0.1 - i * 0.03]} s={[0.05, 0.001, 0.008]} r={[0, Math.sin(i) * 0.4, 0]} m={M.color('#2d241b', 0.6)} />
      ))}
    </group>
  );
};

export const TyreMarks: FC<P> = () => {
  const m = M.color('#160f0a', 0.35);
  return (
    <group>
      {[-0.8, 0.8].map((x) =>
        Array.from({ length: 10 }, (_, i) => (
          <B key={`${x}${i}`} p={[x + Math.sin(i * 0.4) * 0.3, 0.004, -2 + i * 0.5]} r={[0, Math.cos(i * 0.4) * 0.15, 0]} s={[0.22, 0.008, 0.52]} m={m} />
        )),
      )}
      {Array.from({ length: 12 }, (_, i) => (
        <Sph key={i} p={[(i % 2 ? 0.8 : -0.8) + Math.sin(i) * 0.4, 0.02, 2.4 + (i % 4) * 0.25]} r={0.06} s={[1.4, 0.3, 1]} m={M.mud()} seg={5} />
      ))}
    </group>
  );
};

export const Plaque: FC<P> = () => {
  const map = cached('plaque', () =>
    canvasTex(256, 128, (g) => {
      g.fillStyle = '#5a4a2a';
      g.fillRect(0, 0, 256, 128);
      g.fillStyle = '#c9b48a';
      g.font = 'bold 34px serif';
      g.textAlign = 'center';
      g.fillText('THROMBEY', 128, 58);
      g.font = '20px serif';
      g.fillText('— PRIVATE —', 128, 92);
    }),
  );
  return (
    <group>
      <B p={[0, 0, 0]} s={[0.5, 0.26, 0.03]} m={M.brass()} />
      <mesh position={[0, 0, 0.016]}>
        <planeGeometry args={[0.46, 0.22]} />
        <meshStandardMaterial map={map} metalness={0.6} roughness={0.4} />
      </mesh>
      <B p={[0, 0.4, 0.03]} s={[0.12, 0.1, 0.16]} m={M.black()} />
      <Sph p={[0.04, 0.4, 0.115]} r={0.012} m={M.color('#ff2020', 0.2)} />
    </group>
  );
};

export const Fountain: FC<P> = () => {
  const st = M.limestone();
  return (
    <group>
      <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]} material={st}>
        <torusGeometry args={[2.3, 0.22, 8, 40]} />
      </mesh>
      <Cyl p={[0, 0.15, 0]} r0={2.3} h={0.3} m={st} seg={40} />
      <Cyl p={[0, 0.42, 0]} r0={2.2} h={0.02} m={M.water()} seg={40} />
      <Cyl p={[0, 1.0, 0]} r0={0.25} r1={0.18} h={1.4} m={st} seg={12} />
      <Cyl p={[0, 1.75, 0]} r0={0.6} r1={0.9} h={0.2} m={st} seg={24} />
      <Cyl p={[0, 1.86, 0]} r0={0.82} h={0.02} m={M.water()} seg={24} />
      <Cyl p={[0, 2.3, 0]} r0={0.1} h={0.8} m={st} seg={10} />
      <Sph p={[0, 2.8, 0]} r={0.2} m={st} />
    </group>
  );
};

export const Latch: FC<P> = () => (
  <group>
    <B p={[0, 0, 0.01]} s={[0.08, 0.16, 0.01]} m={M.brass()} />
    <B p={[0.03, 0.02, 0.03]} s={[0.1, 0.02, 0.02]} r={[0, 0, -0.4]} m={M.brass()} />
    {[0, 1, 2].map((i) => (
      <B key={i} p={[-0.01 + i * 0.01, -0.03, 0.016]} s={[0.003, 0.05, 0.002]} r={[0, 0, 0.3 * i]} m={M.chrome()} />
    ))}
    <B p={[0, -0.12, 0.03]} s={[0.4, 0.04, 0.08]} m={M.color('#d9cbaf', 0.8)} />
    <B p={[0.05, -0.098, 0.04]} s={[0.12, 0.004, 0.05]} m={M.mud()} />
  </group>
);

export const TreeFrame: FC<P> = () => {
  const map = cached('tree', () =>
    canvasTex(256, 192, (g) => {
      g.fillStyle = '#e4d6b8';
      g.fillRect(0, 0, 256, 192);
      g.strokeStyle = '#3a2a1a';
      g.lineWidth = 1.5;
      const nodes: [number, number][] = [[128, 22], [128, 60], [50, 104], [128, 104], [200, 104], [36, 152], [216, 152]];
      [[0, 1], [1, 2], [1, 3], [1, 4], [2, 5], [4, 6]].forEach(([a, b]) => {
        g.beginPath();
        g.moveTo(nodes[a][0], nodes[a][1]);
        g.lineTo(nodes[b][0], nodes[b][1]);
        g.stroke();
      });
      g.fillStyle = '#632331';
      nodes.forEach(([x, y]) => g.fillRect(x - 16, y - 7, 32, 14));
      g.fillStyle = '#2a1a12';
      g.font = 'italic 14px serif';
      g.fillText('The Thrombeys', 82, 186);
    }),
  );
  return (
    <group rotation={[-0.12, 0, 0]}>
      <B p={[0, 0.2, 0]} s={[0.46, 0.38, 0.02]} m={M.gold()} />
      <mesh position={[0, 0.2, 0.012]}>
        <planeGeometry args={[0.4, 0.32]} />
        <meshStandardMaterial map={map} roughness={0.9} />
      </mesh>
      <B p={[0, 0.12, -0.08]} s={[0.03, 0.25, 0.01]} r={[0.5, 0, 0]} m={M.darkwood()} />
    </group>
  );
};

export const Album: FC<P> = () => (
  <group>
    <B p={[0, 0.03, 0]} s={[0.36, 0.06, 0.28]} m={M.leather('#3a1a12')} />
    <B p={[0.005, 0.03, 0.002]} s={[0.35, 0.05, 0.27]} m={M.ivory()} />
    <B p={[0, 0.061, 0]} s={[0.36, 0.004, 0.28]} m={M.leather('#4a2016')} />
    <B p={[0, 0.064, 0]} s={[0.12, 0.002, 0.04]} m={M.gold()} />
  </group>
);

const ArmchairProp: FC<P> = () => <Armchair c="#4a3a2a" />;
const CarProp: FC<P> = () => <Car c="#2a3a2a" vintage />;
const DaybedProp: FC<P> = () => <Daybed />;

export interface VisualEntry {
  C: FC<P>;
  /** Approximate bounding sphere for inspection framing. */
  center: [number, number, number];
  radius: number;
}

export const VISUALS: Record<VisualKey, VisualEntry> = {
  planSheet: { C: PlanSheet, center: [0, 0, 0], radius: 0.3 },
  portrait: { C: Portrait, center: [0, 0, 0], radius: 1.0 },
  clock: { C: Clock, center: [0, 1.3, 0], radius: 1.3 },
  knifeWheel: { C: KnifeWheel, center: [0, 1.9, 0], radius: 2.0 },
  ashGrate: { C: AshGrate, center: [0, 0.1, 0], radius: 0.45 },
  decanter: { C: Decanter, center: [0, 0.15, 0], radius: 0.3 },
  medbag: { C: MedBag, center: [0, 0.18, 0.05], radius: 0.32 },
  goBoard: { C: GoBoard, center: [0, 0.05, 0], radius: 0.38 },
  dagger: { C: Dagger, center: [0, 0.01, 0], radius: 0.18 },
  daybed: { C: DaybedProp, center: [0, 0.5, 0], radius: 1.3 },
  typewriter: { C: Typewriter, center: [0, 0.12, 0], radius: 0.28 },
  letter: { C: Letter, center: [0, 0, 0], radius: 0.2 },
  hollowBook: { C: HollowBook, center: [0, 0, 0], radius: 0.18 },
  globe: { C: Globe, center: [0, 0.7, 0], radius: 0.7 },
  placeCard: { C: PlaceCard, center: [0, 0.04, 0], radius: 0.1 },
  cake: { C: Cake, center: [0, 0.12, 0], radius: 0.3 },
  flourTin: { C: FlourTin, center: [0, 0.13, -0.05], radius: 0.25 },
  mug: { C: Mug, center: [0, 0.05, 0], radius: 0.09 },
  boots: { C: Boots, center: [0, 0.2, 0], radius: 0.8 },
  orchid: { C: Orchid, center: [0, 0.9, 0], radius: 0.9 },
  car: { C: CarProp, center: [0, 0.7, 0], radius: 2.5 },
  workbench: { C: Workbench, center: [0, 1.2, 0], radius: 1.4 },
  armchair: { C: ArmchairProp, center: [0, 0.6, 0], radius: 0.8 },
  pillbox: { C: Pillbox, center: [0, 0.02, 0], radius: 0.13 },
  photoFrame: { C: PhotoFrame, center: [0, 0.12, 0], radius: 0.18 },
  recordPlayer: { C: RecordPlayer, center: [0, 0.7, 0], radius: 0.7 },
  crystals: { C: Crystals, center: [0, 0.03, 0], radius: 0.18 },
  fuseBox: { C: FuseBox, center: [0, 0, 0.06], radius: 0.42 },
  logbook: { C: Logbook, center: [0, 0.02, 0], radius: 0.28 },
  trunk: { C: Trunk, center: [0, 0.4, 0], radius: 0.75 },
  rockingHorse: { C: RockingHorse, center: [0, 0.6, 0], radius: 0.8 },
  trellis: { C: Trellis, center: [0, 3.1, 0], radius: 3.3 },
  footprint: { C: Footprint, center: [0, 0, 0], radius: 0.18 },
  tyreMarks: { C: TyreMarks, center: [0, 0, 0], radius: 2.5 },
  plaque: { C: Plaque, center: [0, 0.1, 0], radius: 0.4 },
  fountain: { C: Fountain, center: [0, 1.2, 0], radius: 2.6 },
  latch: { C: Latch, center: [0, -0.05, 0], radius: 0.22 },
  treeFrame: { C: TreeFrame, center: [0, 0.2, 0], radius: 0.3 },
  album: { C: Album, center: [0, 0.03, 0], radius: 0.25 },
};
