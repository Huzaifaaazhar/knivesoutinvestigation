/**
 * Route finding for the floor plan's "set a course" assistance.
 * Rooms are connected by doors and stairs; all outdoor zones collapse into a
 * single "outside" node whose internal routing uses a small visibility graph
 * around the house, the garage and the walled terrace.
 */
import { DOORS, STAIRS, ROOM_BY_ID, ZONE_BY_ID, type Level } from '../data/layout';
import { segmentsIntersect } from './collision';
import type { Seg } from './architecture';

export interface Waypoint {
  x: number;
  z: number;
  level: Level;
}

const OUTSIDE = 'outside';
const node = (id: string) => (ZONE_BY_ID[id] ? OUTSIDE : id);

interface Edge {
  to: string;
  /** Points traversed, in order, going from `from` to `to`. */
  pts: Waypoint[];
}

function buildGraph(): Map<string, Edge[]> {
  const g = new Map<string, Edge[]>();
  const add = (a: string, b: string, pts: Waypoint[]) => {
    if (!g.has(a)) g.set(a, []);
    g.get(a)!.push({ to: b, pts });
  };
  for (const d of DOORS) {
    const a = node(d.a);
    const b = node(d.b);
    // step a little through the doorway on each side so the guide leads *through* it
    const nx = d.line === 'x' ? 1 : 0;
    const nz = d.line === 'z' ? 1 : 0;
    const ca = ROOM_BY_ID[d.a]?.rect;
    const sideA = ca ? Math.sign((d.line === 'x' ? (ca.x0 + ca.x1) / 2 - d.x : (ca.z0 + ca.z1) / 2 - d.z)) || 1 : 1;
    const pa: Waypoint = { x: d.x + nx * sideA * 0.8, z: d.z + nz * sideA * 0.8, level: d.level };
    const pb: Waypoint = { x: d.x - nx * sideA * 0.8, z: d.z - nz * sideA * 0.8, level: d.level };
    add(a, b, [pa, pb]);
    add(b, a, [pb, pa]);
  }
  const grand = STAIRS.find((s) => s.id === 'grand-stair')!;
  const cellar = STAIRS.find((s) => s.id === 'cellar-stair')!;
  const cx = (s: typeof grand) => (s.rect.x0 + s.rect.x1) / 2;
  const gl: Waypoint = { x: cx(grand), z: grand.lowAt + 0.8, level: 0 };
  const gh: Waypoint = { x: cx(grand), z: grand.highAt - 0.8, level: 1 };
  add('stairhall', 'landing', [gl, gh]);
  add('landing', 'stairhall', [gh, gl]);
  const cl: Waypoint = { x: cx(cellar), z: cellar.lowAt - 0.8, level: -1 };
  const ch: Waypoint = { x: cx(cellar), z: cellar.highAt + 0.6, level: 0 };
  add('backhall', 'servcorr', [ch, cl]);
  add('servcorr', 'backhall', [cl, ch]);
  return g;
}

const GRAPH = buildGraph();

/** Breadth-first search over rooms (fewest doorways). */
export function roomRoute(from: string, to: string): { rooms: string[]; edges: Edge[] } | null {
  const start = node(from);
  const goal = node(to);
  if (start === goal) return { rooms: [start], edges: [] };
  const prev = new Map<string, { from: string; edge: Edge }>();
  const q = [start];
  const seen = new Set([start]);
  while (q.length) {
    const cur = q.shift()!;
    for (const e of GRAPH.get(cur) ?? []) {
      if (seen.has(e.to)) continue;
      seen.add(e.to);
      prev.set(e.to, { from: cur, edge: e });
      if (e.to === goal) {
        const rooms = [goal];
        const edges: Edge[] = [];
        let c = goal;
        while (c !== start) {
          const p = prev.get(c)!;
          edges.unshift(p.edge);
          rooms.unshift(p.from);
          c = p.from;
        }
        return { rooms, edges };
      }
      q.push(e.to);
    }
  }
  return null;
}

// ───────── outdoor visibility routing ─────────

const OBSTACLES = [
  { x0: -16.9, z0: -14.9, x1: 16.9, z1: 10.9 },
  { x0: 19.4, z0: -8.6, x1: 30.6, z1: 4.6 },
];
const WALLS: Seg[] = [
  { ax: -16, az: -22, bx: -2.2, bz: -22 },
  { ax: 2.2, az: -22, bx: 16, bz: -22 },
  { ax: -16, az: -22, bx: -16, bz: -14 },
  { ax: 16, az: -22, bx: 16, bz: -14 },
];
const NODES: Waypoint[] = [
  { x: -18.5, z: 12.5, level: 0 },
  { x: 18.2, z: 12.5, level: 0 },
  { x: -18.5, z: -24, level: 0 },
  { x: 18.2, z: -24, level: 0 },
  { x: 0, z: -24, level: 0 },
  { x: 0, z: -20, level: 0 },
  { x: 32, z: 6, level: 0 },
  { x: 32, z: -10, level: 0 },
];

function segHitsBox(a: Waypoint, b: Waypoint, r: { x0: number; z0: number; x1: number; z1: number }) {
  // Liang–Barsky style slab test
  let t0 = 0;
  let t1 = 1;
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const clip = (p: number, q: number) => {
    if (Math.abs(p) < 1e-9) return q >= 0;
    const t = q / p;
    if (p < 0) {
      if (t > t1) return false;
      if (t > t0) t0 = t;
    } else {
      if (t < t0) return false;
      if (t < t1) t1 = t;
    }
    return true;
  };
  if (clip(-dx, a.x - r.x0) && clip(dx, r.x1 - a.x) && clip(-dz, a.z - r.z0) && clip(dz, r.z1 - a.z)) return t0 < t1;
  return false;
}

export function outdoorClear(a: Waypoint, b: Waypoint): boolean {
  if (OBSTACLES.some((o) => segHitsBox(a, b, o))) return false;
  const s: Seg = { ax: a.x, az: a.z, bx: b.x, bz: b.z };
  return !WALLS.some((w) => segmentsIntersect(s, w));
}

export function outdoorPath(a: Waypoint, b: Waypoint): Waypoint[] {
  if (outdoorClear(a, b)) return [b];
  const pts = [a, ...NODES, b];
  const n = pts.length;
  const dist = new Array(n).fill(Infinity);
  const prev = new Array(n).fill(-1);
  const done = new Array(n).fill(false);
  dist[0] = 0;
  for (let k = 0; k < n; k++) {
    let u = -1;
    for (let i = 0; i < n; i++) if (!done[i] && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0 || dist[u] === Infinity) break;
    done[u] = true;
    for (let v = 0; v < n; v++) {
      if (done[v] || v === u) continue;
      if (!outdoorClear(pts[u], pts[v])) continue;
      const d = dist[u] + Math.hypot(pts[u].x - pts[v].x, pts[u].z - pts[v].z);
      if (d < dist[v]) {
        dist[v] = d;
        prev[v] = u;
      }
    }
  }
  if (dist[n - 1] === Infinity) return [b];
  const out: Waypoint[] = [];
  for (let c = n - 1; c > 0; c = prev[c]) out.unshift(pts[c]);
  return out;
}

/** Full waypoint list from a position in `fromRoom` to the centre of `toRoom`. */
export function routeTo(pos: Waypoint, fromRoom: string, toRoom: string): Waypoint[] | null {
  const r = roomRoute(fromRoom, toRoom);
  if (!r) return null;
  const out: Waypoint[] = [];
  let cur = pos;
  let inside = node(fromRoom);
  for (const e of r.edges) {
    const entry = e.pts[0];
    if (inside === OUTSIDE) out.push(...outdoorPath(cur, entry));
    else out.push(entry);
    out.push(...e.pts.slice(1));
    cur = e.pts[e.pts.length - 1];
    inside = e.to;
  }
  const dest = ROOM_BY_ID[toRoom];
  if (dest) out.push({ x: (dest.rect.x0 + dest.rect.x1) / 2, z: (dest.rect.z0 + dest.rect.z1) / 2, level: dest.level });
  const zone = ZONE_BY_ID[toRoom];
  if (zone) {
    const r = zone.rects[0];
    const c: Waypoint = { x: Math.max(-40, Math.min(40, (r.x0 + r.x1) / 2)), z: Math.max(-44, Math.min(44, (r.z0 + r.z1) / 2)), level: 0 };
    out.push(...outdoorPath(cur, c));
  }
  return out;
}
