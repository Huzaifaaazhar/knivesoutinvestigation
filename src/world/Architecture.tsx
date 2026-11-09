import { memo, useMemo, type ReactElement } from 'react';
import * as THREE from 'three';
import { LEVEL_Y, ROOMS, STAIRS, type RoomDef } from '../data/layout';
import {
  FACADE_T,
  WALL_T,
  buildFacades,
  buildRoomWalls,
  ceilingRects,
  floorRects,
  type WallPiece,
  type WindowDef,
} from '../systems/architecture';
import { B, M, floorMaterial, wallMaterial, worldBox, worldPlane } from './kit';
import { Balustrade } from './furniture';

const isPapered = (f: string) => f.startsWith('damask');

/** One wall piece plus its wainscot, skirting and cornice where appropriate. */
function Wall({ w, room }: { w: WallPiece; room: RoomDef }) {
  const mat = wallMaterial(w.finish);
  const [sx, sy, sz] = w.size;
  const along = w.inward.x === 0 ? sx : sz;
  const y0 = w.pos[1] - sy / 2;
  const trims: ReactElement[] = [];
  if (!w.lintel && w.finish !== 'glass') {
    const face = (off: number, t: number, h: number, y: number, m: THREE.Material, key: string) => {
      const cx = w.pos[0] + w.inward.x * (WALL_T / 2 + off);
      const cz = w.pos[2] + w.inward.z * (WALL_T / 2 + off);
      const size: [number, number, number] = w.inward.x === 0 ? [along, h, t] : [t, h, along];
      trims.push(<B key={key} p={[cx, y, cz]} s={size} m={m} />);
    };
    const wood = M.walnut();
    const isFine = isPapered(w.finish) || w.finish === 'panel-walnut';
    if (isFine) {
      face(0.012, 0.024, 0.16, y0 + 0.08, M.darkwood(), 'skirt');
      if (isPapered(w.finish)) {
        face(0.008, 0.016, 1.0, y0 + 0.5, wood, 'wainscot');
        face(0.02, 0.04, 0.06, y0 + 1.02, M.darkwood(), 'rail');
      } else {
        face(0.02, 0.04, 0.05, y0 + 1.1, M.darkwood(), 'rail');
      }
      const top = y0 + sy;
      face(0.03, 0.06, 0.14, top - 0.07, w.finish === 'panel-walnut' ? M.darkwood() : M.ceiling(), 'cornice');
      face(0.06, 0.04, 0.05, top - 0.17, w.finish === 'panel-walnut' ? M.darkwood() : M.ceiling(), 'cornice2');
    } else if (w.finish === 'tile' || w.finish === 'plaster') {
      face(0.01, 0.02, 0.12, y0 + 0.06, M.darkwood(), 'skirt');
    }
  }
  void room;
  return (
    <group>
      <mesh position={w.pos} geometry={boxGeo(w.size)} material={mat} receiveShadow />
      {trims}
    </group>
  );
}

function boxGeo(s: [number, number, number]) {
  return worldBox(s[0], s[1], s[2]);
}

function RoomShell({ room }: { room: RoomDef }) {
  const { walls, balustrades } = useMemo(() => buildRoomWalls(room), [room]);
  const y0 = LEVEL_Y[room.level];
  const floors = useMemo(() => floorRects(room), [room]);
  const ceilings = useMemo(() => ceilingRects(room), [room]);
  const fMat = floorMaterial(room.floor, room.id);
  const cMat = room.wall === 'glass' ? M.glass() : room.building === 'garage' || room.level < 0 ? M.concrete() : M.ceiling();
  return (
    <group>
      {walls.map((w, i) => (
        <Wall key={i} w={w} room={room} />
      ))}
      {floors.map((r, i) => (
        <mesh
          key={`f${i}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[(r.x0 + r.x1) / 2, y0 + 0.005, (r.z0 + r.z1) / 2]}
          geometry={worldPlane(r.x1 - r.x0, r.z1 - r.z0)}
          material={fMat}
          receiveShadow
        />
      ))}
      {ceilings.map((r, i) => (
        <mesh
          key={`c${i}`}
          rotation={[Math.PI / 2, 0, 0]}
          position={[(r.x0 + r.x1) / 2, y0 + room.height - 0.002, (r.z0 + r.z1) / 2]}
          geometry={worldPlane(r.x1 - r.x0, r.z1 - r.z0)}
          material={cMat}
        />
      ))}
      {/* ceiling medallion / beams */}
      {room.wall !== 'glass' && room.level >= 0 && room.building === 'mansion' && (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[(room.rect.x0 + room.rect.x1) / 2, y0 + room.height - 0.01, (room.rect.z0 + room.rect.z1) / 2]} material={M.color('#9c8a64', 0.6, 0.3)}>
          <ringGeometry args={[0.25, 0.5, 24]} />
        </mesh>
      )}
      {room.wall === 'glass' && <GlassFrame room={room} />}
      {balustrades.map((b, i) => {
        const len = Math.hypot(b.b[0] - b.a[0], b.b[1] - b.a[1]);
        const ang = Math.atan2(b.b[1] - b.a[1], b.b[0] - b.a[0]);
        return (
          <group key={`b${i}`} position={[(b.a[0] + b.b[0]) / 2, b.y, (b.a[1] + b.b[1]) / 2]} rotation={[0, -ang, 0]}>
            <Balustrade l={len} h={1.0} m="wood" />
            <B p={[0, -0.2, 0]} s={[len, 0.4, 0.3]} m={M.darkwood()} />
          </group>
        );
      })}
    </group>
  );
}

/** Iron glazing bars for the conservatory's glass walls and roof. */
function GlassFrame({ room }: { room: RoomDef }) {
  const { x0, x1, z0, z1 } = room.rect;
  const y0 = LEVEL_Y[room.level];
  const h = room.height;
  const ir = M.iron();
  const bars: ReactElement[] = [];
  for (let x = x0; x <= x1 + 0.01; x += 1.5) {
    bars.push(<B key={`n${x}`} p={[x, y0 + h / 2, z0 + 0.06]} s={[0.06, h, 0.06]} m={ir} />);
    bars.push(<B key={`r${x}`} p={[x, y0 + h - 0.03, (z0 + z1) / 2]} s={[0.05, 0.05, z1 - z0]} m={ir} />);
  }
  for (let z = z0; z <= z1 + 0.01; z += 1.5) {
    bars.push(<B key={`w${z}`} p={[x0 + 0.06, y0 + h / 2, z]} s={[0.06, h, 0.06]} m={ir} />);
  }
  for (const y of [0.9, 2.6]) {
    bars.push(<B key={`hn${y}`} p={[(x0 + x1) / 2, y0 + y, z0 + 0.06]} s={[x1 - x0, 0.05, 0.05]} m={ir} />);
    bars.push(<B key={`hw${y}`} p={[x0 + 0.06, y0 + y, (z0 + z1) / 2]} s={[0.05, 0.05, z1 - z0]} m={ir} />);
  }
  bars.push(<B key="kick" p={[(x0 + x1) / 2, y0 + 0.2, z0 + 0.1]} s={[x1 - x0, 0.4, 0.12]} m={M.facade()} />);
  bars.push(<B key="kickw" p={[x0 + 0.1, y0 + 0.2, (z0 + z1) / 2]} s={[0.12, 0.4, z1 - z0]} m={M.facade()} />);
  return <group>{bars}</group>;
}

// ───────────────────────── Stairs ─────────────────────────

function Stair({ id }: { id: string }) {
  const st = STAIRS.find((s) => s.id === id)!;
  const yLow = LEVEL_Y[st.lowLevel];
  const yHigh = LEVEL_Y[st.highLevel];
  const rise = yHigh - yLow;
  const run = Math.abs(st.highAt - st.lowAt);
  const n = Math.round(rise / 0.18);
  const dir = Math.sign(st.highAt - st.lowAt);
  const w = st.rect.x1 - st.rect.x0;
  const cx = (st.rect.x0 + st.rect.x1) / 2;
  const grand = id === 'grand-stair';
  const body = grand ? M.walnut() : M.stone();
  const steps = [];
  for (let i = 0; i < n; i++) {
    const top = yLow + ((i + 1) * rise) / n;
    const z = st.lowAt + dir * ((i + 0.5) * run) / n;
    steps.push(<B key={i} p={[cx, (yLow + top) / 2, z]} s={[w, top - yLow, run / n + 0.002]} m={body} />);
    steps.push(<B key={`n${i}`} p={[cx, top - 0.02, z + dir * (run / n / 2 - 0.02)]} s={[w + 0.04, 0.04, 0.06]} m={grand ? M.darkwood() : M.concrete()} />);
    if (grand) steps.push(<B key={`r${i}`} p={[cx, top + 0.004, z]} s={[w * 0.66, 0.01, run / n]} m={M.carpet('#5a1c26')} />);
  }
  // handrails following the slope
  const slope = Math.atan2(rise, run);
  const len = Math.hypot(rise, run);
  const midZ = (st.lowAt + st.highAt) / 2;
  const rails = [st.rect.x0 + 0.05, st.rect.x1 - 0.05].map((x) => (
    <group key={x}>
      <group position={[x, (yLow + yHigh) / 2 + 0.95, midZ]} rotation={[dir * slope, 0, 0]}>
        <B p={[0, 0, 0]} s={[0.08, 0.07, len]} m={grand ? M.darkwood() : M.iron()} />
      </group>
      {Array.from({ length: n }, (_, i) => {
        const top = yLow + ((i + 1) * rise) / n;
        const z = st.lowAt + dir * ((i + 0.5) * run) / n;
        return <B key={i} p={[x, top + 0.47, z]} s={[0.035, 0.94, 0.035]} m={grand ? M.ivory() : M.iron()} />;
      })}
      <B p={[x, yLow + 0.6, st.lowAt + dir * 0.05]} s={[0.14, 1.2, 0.14]} m={grand ? M.darkwood() : M.iron()} />
      {grand && <mesh position={[x, yLow + 1.25, st.lowAt + dir * 0.05]} material={M.gold()}><sphereGeometry args={[0.08, 12, 8]} /></mesh>}
    </group>
  ));
  // railings around the stairwell on the upper storey
  const capZ = st.lowAt;
  const upper = (
    <group>
      {[st.rect.x0, st.rect.x1].map((x) => (
        <group key={x} position={[x, yHigh, midZ]} rotation={[0, Math.PI / 2, 0]}>
          <Balustrade l={run} h={1.0} m={grand ? 'wood' : 'stone'} />
        </group>
      ))}
      <group position={[cx, yHigh, capZ]}>
        <Balustrade l={w} h={1.0} m={grand ? 'wood' : 'stone'} />
      </group>
    </group>
  );
  return (
    <group>
      {steps}
      {rails}
      {upper}
    </group>
  );
}

// ───────────────────────── Windows ─────────────────────────

function hash(x: number, z: number) {
  const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

function WindowInside({ w }: { w: WindowDef }) {
  // inward = -out ; the visible face is WALL_T inside the line
  const ix = w.x - w.out.x * (WALL_T + 0.01);
  const iz = w.z - w.out.z * (WALL_T + 0.01);
  const ry = Math.atan2(-w.out.x, -w.out.z);
  const frame = M.ivory();
  return (
    <group position={[ix, w.y + w.h / 2, iz]} rotation={[0, ry, 0]}>
      <mesh material={M.windowNight()}>
        <planeGeometry args={[w.w, w.h]} />
      </mesh>
      <RainStreaks w={w.w} h={w.h} />
      <B p={[0, w.h / 2 + 0.05, 0.03]} s={[w.w + 0.2, 0.1, 0.06]} m={frame} />
      <B p={[0, -w.h / 2 - 0.05, 0.06]} s={[w.w + 0.3, 0.06, 0.16]} m={frame} />
      <B p={[-w.w / 2 - 0.05, 0, 0.03]} s={[0.1, w.h, 0.06]} m={frame} />
      <B p={[w.w / 2 + 0.05, 0, 0.03]} s={[0.1, w.h, 0.06]} m={frame} />
      <B p={[0, 0, 0.02]} s={[0.04, w.h, 0.03]} m={frame} />
      <B p={[0, w.h / 6, 0.02]} s={[w.w, 0.04, 0.03]} m={frame} />
      <B p={[0, -w.h / 6, 0.02]} s={[w.w, 0.04, 0.03]} m={frame} />
      {/* curtains */}
      <B p={[-w.w / 2 - 0.25, 0.1, 0.1]} s={[0.36, w.h + 0.5, 0.08]} m={M.fabric('#4a1820')} />
      <B p={[w.w / 2 + 0.25, 0.1, 0.1]} s={[0.36, w.h + 0.5, 0.08]} m={M.fabric('#4a1820')} />
      <B p={[0, w.h / 2 + 0.35, 0.12]} s={[w.w + 1.0, 0.05, 0.05]} m={M.brass()} />
    </group>
  );
}

const streakTex = (() => {
  let t: THREE.Texture | null = null;
  return () => {
    if (t) return t;
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 128;
    const g = c.getContext('2d')!;
    for (let i = 0; i < 40; i++) {
      g.strokeStyle = `rgba(180,200,230,${0.05 + Math.random() * 0.12})`;
      g.lineWidth = 0.5 + Math.random();
      const x = Math.random() * 64;
      g.beginPath();
      g.moveTo(x, Math.random() * 128);
      g.lineTo(x + (Math.random() - 0.5) * 3, Math.random() * 128);
      g.stroke();
    }
    t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  };
})();

function RainStreaks({ w, h }: { w: number; h: number }) {
  return (
    <mesh position={[0, 0, 0.004]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={streakTex()} transparent depthWrite={false} />
    </mesh>
  );
}

function WindowOutside({ w }: { w: WindowDef }) {
  const ox = w.x + w.out.x * (FACADE_T + 0.01);
  const oz = w.z + w.out.z * (FACADE_T + 0.01);
  const ry = Math.atan2(w.out.x, w.out.z);
  const lit = w.level < 0 ? false : hash(w.x, w.z + w.y) > 0.35;
  const st = M.limestone();
  return (
    <group position={[ox, w.y + w.h / 2, oz]} rotation={[0, ry, 0]}>
      <mesh material={lit ? M.windowLit() : M.windowNight()}>
        <planeGeometry args={[w.w, w.h]} />
      </mesh>
      <B p={[0, w.h / 2 + 0.12, 0.05]} s={[w.w + 0.4, 0.24, 0.12]} m={st} />
      <B p={[0, w.h / 2 + 0.28, 0.06]} s={[0.22, 0.14, 0.14]} m={st} />
      <B p={[0, -w.h / 2 - 0.06, 0.08]} s={[w.w + 0.35, 0.1, 0.18]} m={st} />
      <B p={[-w.w / 2 - 0.08, 0, 0.04]} s={[0.16, w.h, 0.08]} m={st} />
      <B p={[w.w / 2 + 0.08, 0, 0.04]} s={[0.16, w.h, 0.08]} m={st} />
      <B p={[0, 0, 0.02]} s={[0.04, w.h, 0.03]} m={M.iron()} />
      {[-1, 1].map((k) => (
        <B key={k} p={[0, (k * w.h) / 6, 0.02]} s={[w.w, 0.035, 0.03]} m={M.iron()} />
      ))}
      {/* shutters */}
      <B p={[-w.w / 2 - 0.5, 0, 0.05]} s={[0.6, w.h + 0.1, 0.04]} m={M.color('#1d2a24', 0.7)} />
      <B p={[w.w / 2 + 0.5, 0, 0.05]} s={[0.6, w.h + 0.1, 0.04]} m={M.color('#1d2a24', 0.7)} />
    </group>
  );
}

// ───────────────────────── Roofs ─────────────────────────

function hipRoofGeometry(w: number, d: number, h: number, alongX: boolean) {
  // ridge along the longer axis
  const hw = w / 2;
  const hd = d / 2;
  const inset = alongX ? Math.min(hd, hw) : Math.min(hw, hd);
  const r0 = alongX ? new THREE.Vector3(-hw + inset, h, 0) : new THREE.Vector3(0, h, -hd + inset);
  const r1 = alongX ? new THREE.Vector3(hw - inset, h, 0) : new THREE.Vector3(0, h, hd - inset);
  const a = new THREE.Vector3(-hw, 0, -hd);
  const b = new THREE.Vector3(hw, 0, -hd);
  const c = new THREE.Vector3(hw, 0, hd);
  const dd = new THREE.Vector3(-hw, 0, hd);
  const tris: THREE.Vector3[] = alongX
    ? [a, r0, b, b, r0, r1, b, r1, c, c, r1, dd, dd, r1, r0, dd, r0, a]
    : [a, r0, b, b, r0, c, c, r0, r1, c, r1, dd, dd, r1, a, a, r1, r0];
  const pos = new Float32Array(tris.length * 3);
  const uv = new Float32Array(tris.length * 2);
  tris.forEach((v, i) => {
    pos.set([v.x, v.y, v.z], i * 3);
    uv.set([v.x + v.z, v.y * 1.6], i * 2);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

function HipRoof({ x0, z0, x1, z1, y, h }: { x0: number; z0: number; x1: number; z1: number; y: number; h: number }) {
  const w = x1 - x0;
  const d = z1 - z0;
  const geo = useMemo(() => hipRoofGeometry(w + 0.8, d + 0.8, h, w >= d), [w, d, h]);
  const mat = useMemo(() => {
    const m = M.slate().clone();
    m.side = THREE.DoubleSide;
    return m;
  }, []);
  return (
    <group position={[(x0 + x1) / 2, y, (z0 + z1) / 2]}>
      <mesh geometry={geo} material={mat} />
      <B p={[0, -0.12, 0]} s={[w + 0.9, 0.24, d + 0.9]} m={M.limestone()} />
    </group>
  );
}

function Chimney({ x, z, y0, y1 }: { x: number; z: number; y0: number; y1: number }) {
  return (
    <group>
      <B p={[x, (y0 + y1) / 2, z]} s={[1.0, y1 - y0, 1.4]} m={M.facade()} />
      <B p={[x, y1 + 0.08, z]} s={[1.2, 0.16, 1.6]} m={M.limestone()} />
      {[-0.3, 0.3].map((dz) => (
        <mesh key={dz} position={[x, y1 + 0.4, z + dz]} material={M.color('#5a3a2a', 0.9)}>
          <cylinderGeometry args={[0.13, 0.15, 0.5, 8]} />
        </mesh>
      ))}
    </group>
  );
}

export const Exterior = memo(function Exterior() {
  const { pieces, windows, quoins } = useMemo(() => buildFacades(), []);
  return (
    <group>
      {pieces.map((p, i) => (
        <mesh key={i} position={p.pos} geometry={boxGeo(p.size)} material={p.glass ? M.glass() : M.facade()} />
      ))}
      {quoins.map((q, i) => (
        <B key={`q${i}`} p={[q.x, (q.y0 + q.y1) / 2, q.z]} s={[0.8, q.y1 - q.y0, 0.8]} m={M.limestone()} />
      ))}
      {windows.map((w, i) => (
        <WindowOutside key={`wo${i}`} w={w} />
      ))}
      {/* main block roof */}
      <HipRoof x0={-16.35} z0={-8.35} x1={16.35} z1={10.35} y={8.3} h={5.2} />
      {/* central front gable over the hall */}
      <FrontGable />
      {/* rear single-storey wing: flat roof with parapet */}
      <B p={[6, 4.45, -11.15]} s={[20.6, 0.1, 6.4]} m={M.color('#22242a', 0.8)} />
      {/* garage */}
      <HipRoof x0={19.65} z0={-8.35} x1={30.35} z1={4.35} y={4.95} h={2.4} />
      <Chimney x={-15.4} z={5} y0={8} y1={13.6} />
      <Chimney x={15.4} z={5} y0={8} y1={13.6} />
      <Chimney x={-15.4} z={-3} y0={8} y1={12.8} />
    </group>
  );
});

function FrontGable() {
  const shape = useMemo(() => new THREE.Shape([new THREE.Vector2(-5, 0), new THREE.Vector2(5, 0), new THREE.Vector2(0, 3.6)]), []);
  return (
    <group position={[0, 8.3, 10.42]}>
      <mesh material={M.facade()}>
        <extrudeGeometry args={[shape, { depth: 0.4, bevelEnabled: false }]} />
      </mesh>
      <mesh position={[0, 1.4, 0.42]} material={M.windowLit()}>
        <circleGeometry args={[0.6, 24]} />
      </mesh>
      <mesh position={[0, 1.4, 0.43]} material={M.limestone()}>
        <ringGeometry args={[0.6, 0.78, 24]} />
      </mesh>
      <B p={[0, 0.05, 0.3]} s={[10.4, 0.3, 0.4]} m={M.limestone()} />
    </group>
  );
}

/** All rooms' shells (walls, floors, ceilings), the interior faces of windows, and the stairs. */
export function RoomShells({ roomIds }: { roomIds: string[] }) {
  const windows = useMemo(() => buildFacades().windows, []);
  return (
    <>
      {roomIds.map((id) => {
        const room = ROOMS.find((r) => r.id === id)!;
        return (
          <group key={id} name={`room-${id}`}>
            <RoomShell room={room} />
            {windows
              .filter((w) => w.roomId === id)
              .map((w, i) => (
                <WindowInside key={i} w={w} />
              ))}
          </group>
        );
      })}
    </>
  );
}

export function Stairs() {
  return (
    <>
      {STAIRS.map((s) => (
        <Stair key={s.id} id={s.id} />
      ))}
    </>
  );
}
