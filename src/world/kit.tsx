/**
 * Shared materials and geometry helpers for the procedural asset kit.
 * Geometry carries UVs measured in metres so tiled textures keep a constant
 * physical scale on every surface without per-mesh texture clones.
 */
import * as THREE from 'three';
import type { ReactNode } from 'react';
import { booksTexture, bumpNoise, tex } from './textures';
import type { WallFinish, FloorFinish } from '../data/layout';

// ───────────────────── Geometry with metre UVs ─────────────────────

const geoCache = new Map<string, THREE.BufferGeometry>();

export function worldBox(w: number, h: number, d: number): THREE.BufferGeometry {
  const k = `b${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}`;
  const hit = geoCache.get(k);
  if (hit) return hit;
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  // face order: +x, -x, +y, -y, +z, -z ; 4 verts each
  const dims: [number, number][] = [
    [d, h],
    [d, h],
    [w, d],
    [w, d],
    [w, h],
    [w, h],
  ];
  for (let f = 0; f < 6; f++) {
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v;
      uv.setXY(i, uv.getX(i) * dims[f][0], uv.getY(i) * dims[f][1]);
    }
  }
  uv.needsUpdate = true;
  geoCache.set(k, g);
  return g;
}

export function worldPlane(w: number, h: number): THREE.BufferGeometry {
  const k = `p${w.toFixed(3)}|${h.toFixed(3)}`;
  const hit = geoCache.get(k);
  if (hit) return hit;
  const g = new THREE.PlaneGeometry(w, h);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w, uv.getY(i) * h);
  uv.needsUpdate = true;
  geoCache.set(k, g);
  return g;
}

// ───────────────────── Materials ─────────────────────

const matCache = new Map<string, THREE.Material>();

function std(key: string, make: () => THREE.MeshStandardMaterialParameters): THREE.MeshStandardMaterial {
  const hit = matCache.get(key);
  if (hit) return hit as THREE.MeshStandardMaterial;
  const m = new THREE.MeshStandardMaterial(make());
  matCache.set(key, m);
  return m;
}

export const M = {
  walnut: () => std('walnut', () => ({ map: tex.walnut(), roughness: 0.55, metalness: 0.0, bumpMap: tex.walnut(), bumpScale: 0.6 })),
  darkwood: () => std('darkwood', () => ({ map: tex.darkwood(), roughness: 0.45 })),
  lightwood: () => std('lightwood', () => ({ map: tex.lightwood(), roughness: 0.6 })),
  parquet: () => std('parquet', () => ({ map: tex.parquet(), roughness: 0.38, bumpMap: tex.parquet(), bumpScale: 0.3 })),
  checker: () => std('checker', () => ({ map: tex.marbleChecker(), roughness: 0.18, metalness: 0.05 })),
  stone: () => std('stone', () => ({ map: tex.stone(), roughness: 0.85, bumpMap: bumpNoise(), bumpScale: 1 })),
  concrete: () => std('concrete', () => ({ map: tex.concrete(), roughness: 0.9 })),
  floorTile: () => std('floorTile', () => ({ map: tex.floorTile(), roughness: 0.3 })),
  tile: () => std('tile', () => ({ map: tex.tile(), roughness: 0.25 })),
  plaster: () => std('plaster', () => ({ map: tex.plaster(), roughness: 0.92 })),
  ceiling: () => std('ceiling', () => ({ color: '#cbbd9f', roughness: 0.95 })),
  brick: () => std('brick', () => ({ map: tex.brick(), roughness: 0.9, bumpMap: tex.brick(), bumpScale: 1.2 })),
  facade: () => std('facade', () => ({ map: tex.brick('#5a3226'), roughness: 0.92, bumpMap: tex.brick('#5a3226'), bumpScale: 1.4 })),
  limestone: () => std('limestone', () => ({ color: '#a69c86', roughness: 0.85, bumpMap: bumpNoise(), bumpScale: 0.8 })),
  slate: () => std('slate', () => ({ map: tex.roofSlate(), roughness: 0.6, metalness: 0.1 })),
  carpet: (c = '#5a1c26') => std(`carpet-${c}`, () => ({ map: tex.carpet(c), roughness: 1 })),
  rug: (a: string, b: string) => std(`rug-${a}-${b}`, () => ({ map: tex.rug(a, b), roughness: 1 })),
  damask: (bg: string, fg: string) => std(`damask-${bg}-${fg}`, () => ({ map: tex.damask(bg, fg), roughness: 0.8 })),
  gravel: () => std('gravel', () => ({ map: tex.gravel(), roughness: 1 })),
  grass: () => std('grass', () => ({ map: tex.grass(), roughness: 1 })),
  mud: () => std('mud', () => ({ map: tex.mud(), roughness: 0.6, color: '#8a7a6a' })),
  leather: (c = '#4a2a1c') => std(`leather-${c}`, () => ({ map: tex.leather(c), roughness: 0.55 })),
  fabric: (c: string) => std(`fabric-${c}`, () => ({ map: tex.fabric(c), roughness: 0.95 })),
  paper: () => std('paper', () => ({ map: tex.paper(), roughness: 0.95 })),
  gold: () => std('gold', () => ({ color: '#b69a65', roughness: 0.3, metalness: 0.9 })),
  brass: () => std('brass', () => ({ color: '#8a6a32', roughness: 0.35, metalness: 0.85 })),
  iron: () => std('iron', () => ({ color: '#1a1a1c', roughness: 0.55, metalness: 0.7 })),
  steel: () => std('steel', () => ({ color: '#9aa0a6', roughness: 0.25, metalness: 0.95 })),
  chrome: () => std('chrome', () => ({ color: '#d0d4d8', roughness: 0.12, metalness: 1 })),
  black: () => std('black', () => ({ color: '#0d0d0f', roughness: 0.6 })),
  ivory: () => std('ivory', () => ({ color: '#f1e7d3', roughness: 0.7 })),
  white: () => std('white', () => ({ color: '#e9e3d6', roughness: 0.4 })),
  burgundy: () => std('burgundy', () => ({ color: '#632331', roughness: 0.8 })),
  blood: () => std('blood', () => ({ color: '#4a0f14', roughness: 0.3 })),
  olive: () => std('olive', () => ({ color: '#66684d', roughness: 0.85 })),
  night: () => std('night', () => ({ color: '#171e2a', roughness: 0.8 })),
  foliage: (c: string) => std(`foliage-${c}`, () => ({ color: c, roughness: 0.95, flatShading: true })),
  bark: () => std('bark', () => ({ color: '#2a2018', roughness: 1, bumpMap: bumpNoise(), bumpScale: 2 })),
  water: () => std('water', () => ({ color: '#1a2430', roughness: 0.05, metalness: 0.6 })),
  carPaint: (c: string) => std(`car-${c}`, () => ({ color: c, roughness: 0.2, metalness: 0.6 })),
  glass: () => {
    const k = 'glass';
    const hit = matCache.get(k);
    if (hit) return hit as THREE.MeshStandardMaterial;
    const m = new THREE.MeshStandardMaterial({ color: '#2a3442', roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.28, depthWrite: false });
    matCache.set(k, m);
    return m;
  },
  windowNight: () => std('windowNight', () => ({ color: '#0e1622', emissive: '#18263a', emissiveIntensity: 0.6, roughness: 0.05, metalness: 0.4 })),
  windowLit: () => std('windowLit', () => ({ color: '#3a2a14', emissive: '#f0b060', emissiveIntensity: 1.5, roughness: 0.3 })),
  lampShade: () => std('lampShade', () => ({ color: '#e8cf9a', emissive: '#f2b766', emissiveIntensity: 1.4, roughness: 0.9, side: THREE.DoubleSide })),
  bulb: () => std('bulb', () => ({ color: '#fff2d0', emissive: '#ffd890', emissiveIntensity: 3 })),
  fire: () => std('fire', () => ({ color: '#ff8a30', emissive: '#ff6a10', emissiveIntensity: 3, transparent: true, opacity: 0.9 })),
  ember: () => std('ember', () => ({ color: '#300a02', emissive: '#c03a08', emissiveIntensity: 1.2, roughness: 1 })),
  tape: () => std('tape', () => ({ color: '#c9a227', roughness: 0.6 })),
  books: () => std('books', () => ({ map: booksTexture(), roughness: 0.85 })),
  color: (c: string, rough = 0.7, metal = 0) => std(`c-${c}-${rough}-${metal}`, () => ({ color: c, roughness: rough, metalness: metal })),
};

export function wallMaterial(f: WallFinish): THREE.Material {
  switch (f) {
    case 'damask-burgundy':
      return M.damask('#4d1a24', '#5e2430');
    case 'damask-olive':
      return M.damask('#4a4b35', '#575940');
    case 'damask-blue':
      return M.damask('#1d2638', '#26314a');
    case 'panel-walnut':
      return M.walnut();
    case 'plaster':
      return M.plaster();
    case 'brick':
      return M.brick();
    case 'tile':
      return M.tile();
    case 'stone':
      return M.stone();
    case 'glass':
      return M.glass();
  }
}

export function floorMaterial(f: FloorFinish, roomId: string): THREE.Material {
  switch (f) {
    case 'parquet':
      return M.parquet();
    case 'checker':
      return M.checker();
    case 'carpet':
      return M.carpet(roomId === 'famcorr' || roomId === 'guestcorr' ? '#3a1a1e' : roomId === 'guestA' ? '#1e2638' : '#4a1820');
    case 'stone':
      return M.stone();
    case 'tile':
      return M.floorTile();
    case 'concrete':
      return M.concrete();
  }
}

// ───────────────────── Primitive components ─────────────────────

type V3 = [number, number, number];

/** A box with metre UVs. */
export function B({ p, s, m, r, cast = false }: { p: V3; s: V3; m: THREE.Material; r?: V3; cast?: boolean }) {
  return <mesh position={p} rotation={r} geometry={worldBox(s[0], s[1], s[2])} material={m} castShadow={cast} receiveShadow />;
}

export function Cyl({ p, r0, r1, h, m, seg = 16, rot }: { p: V3; r0: number; r1?: number; h: number; m: THREE.Material; seg?: number; rot?: V3 }) {
  return (
    <mesh position={p} rotation={rot} material={m}>
      <cylinderGeometry args={[r1 ?? r0, r0, h, seg]} />
    </mesh>
  );
}

export function Sph({ p, r, m, seg = 12, s }: { p: V3; r: number; m: THREE.Material; seg?: number; s?: V3 }) {
  return (
    <mesh position={p} material={m} scale={s}>
      <sphereGeometry args={[r, seg, Math.max(6, seg - 4)]} />
    </mesh>
  );
}

export function Group({ p, ry = 0, children, s }: { p?: V3; ry?: number; s?: number; children: ReactNode }) {
  return (
    <group position={p} rotation={[0, ry, 0]} scale={s}>
      {children}
    </group>
  );
}
