/**
 * Pure derivation of architectural geometry from the layout data.
 * No Three.js imports here — this module is shared by the renderer, the
 * collision system, the floor plan and the unit tests.
 */
import {
  DOORS,
  LEVEL_Y,
  ROOMS,
  STAIRS,
  roomOccupiesLevel,
  type DoorDef,
  type Edge,
  type Level,
  type Rect,
  type RoomDef,
  type StairDef,
  type WallFinish,
} from '../data/layout';

export const WALL_T = 0.12; // interior wall face thickness (each room owns its own face)
export const FACADE_T = 0.35; // exterior masonry thickness

export interface Interval {
  a: number;
  b: number;
}

export interface EdgeInfo {
  edge: Edge;
  /** 'z' = line of constant z. */
  line: 'x' | 'z';
  at: number;
  from: number;
  to: number;
  /** Unit vector pointing into the room. */
  inward: { x: number; z: number };
}

export function roomEdges(rect: Rect): EdgeInfo[] {
  return [
    { edge: 'n', line: 'z', at: rect.z0, from: rect.x0, to: rect.x1, inward: { x: 0, z: 1 } },
    { edge: 's', line: 'z', at: rect.z1, from: rect.x0, to: rect.x1, inward: { x: 0, z: -1 } },
    { edge: 'w', line: 'x', at: rect.x0, from: rect.z0, to: rect.z1, inward: { x: 1, z: 0 } },
    { edge: 'e', line: 'x', at: rect.x1, from: rect.z0, to: rect.z1, inward: { x: -1, z: 0 } },
  ];
}

const EPS = 0.01;

/** Doors that pierce the given edge of a room. */
export function doorsOnEdge(room: RoomDef, e: EdgeInfo): DoorDef[] {
  return DOORS.filter((d) => {
    if (d.a !== room.id && d.b !== room.id) return false;
    if (d.line !== e.line) return false;
    const at = d.line === 'z' ? d.z : d.x;
    const along = d.line === 'z' ? d.x : d.z;
    return Math.abs(at - e.at) < EPS && along > e.from - EPS && along < e.to + EPS;
  });
}

export function doorInterval(d: DoorDef): Interval {
  const c = d.line === 'z' ? d.x : d.z;
  return { a: c - d.width / 2, b: c + d.width / 2 };
}

export function subtractIntervals(base: Interval, holes: Interval[]): Interval[] {
  let out: Interval[] = [{ ...base }];
  for (const h of holes) {
    const next: Interval[] = [];
    for (const s of out) {
      if (h.b <= s.a + EPS || h.a >= s.b - EPS) {
        next.push(s);
        continue;
      }
      if (h.a > s.a + EPS) next.push({ a: s.a, b: h.a });
      if (h.b < s.b - EPS) next.push({ a: h.b, b: s.b });
    }
    out = next;
  }
  return out.filter((s) => s.b - s.a > EPS);
}

export interface WallPiece {
  roomId: string;
  edge: Edge;
  finish: WallFinish;
  /** Centre position and size of a box (x, y, z / sx, sy, sz). */
  pos: [number, number, number];
  size: [number, number, number];
  /** Unit vector into the room — the decorated face. */
  inward: { x: number; z: number };
  /** Piece is a lintel above an opening. */
  lintel?: boolean;
}

export interface BalustradePiece {
  roomId: string;
  a: [number, number];
  b: [number, number];
  y: number;
}

export function edgeHeight(room: RoomDef, edge: Edge): number {
  return room.edgeHeight?.[edge] ?? room.height;
}

export function edgeFinish(room: RoomDef, edge: Edge): WallFinish {
  return room.edgeFinish?.[edge] ?? room.wall;
}

/** Build a box spanning [a,b] along an edge, with the given vertical span. */
function boxAlong(e: EdgeInfo, a: number, b: number, y0: number, y1: number, t: number, offset: number) {
  const mid = (a + b) / 2;
  const len = b - a;
  // centre of the box sits `offset` along the inward normal from the edge line
  const cx = e.line === 'z' ? mid : e.at + e.inward.x * offset;
  const cz = e.line === 'z' ? e.at + e.inward.z * offset : mid;
  const size: [number, number, number] = e.line === 'z' ? [len, y1 - y0, t] : [t, y1 - y0, len];
  return { pos: [cx, (y0 + y1) / 2, cz] as [number, number, number], size };
}

export function buildRoomWalls(room: RoomDef): { walls: WallPiece[]; balustrades: BalustradePiece[] } {
  const walls: WallPiece[] = [];
  const balustrades: BalustradePiece[] = [];
  const y0 = LEVEL_Y[room.level];
  for (const e of roomEdges(room.rect)) {
    if (room.balustrade?.includes(e.edge)) {
      const a: [number, number] = e.line === 'z' ? [e.from, e.at] : [e.at, e.from];
      const b: [number, number] = e.line === 'z' ? [e.to, e.at] : [e.at, e.to];
      balustrades.push({ roomId: room.id, a, b, y: y0 });
      continue;
    }
    const h = edgeHeight(room, e.edge);
    const doors = doorsOnEdge(room, e);
    const solids = subtractIntervals({ a: e.from, b: e.to }, doors.map(doorInterval));
    const finish = edgeFinish(room, e.edge);
    for (const s of solids) {
      const bx = boxAlong(e, s.a, s.b, y0, y0 + h, WALL_T, WALL_T / 2);
      walls.push({ roomId: room.id, edge: e.edge, finish, ...bx, inward: e.inward });
    }
    for (const d of doors) {
      if (d.height >= h - EPS) continue;
      const iv = doorInterval(d);
      const bx = boxAlong(e, iv.a, iv.b, y0 + d.height, y0 + h, WALL_T, WALL_T / 2);
      walls.push({ roomId: room.id, edge: e.edge, finish, ...bx, inward: e.inward, lintel: true });
    }
  }
  return { walls, balustrades };
}

// ───────────────────────── Floors & ceilings with stair holes ─────────────────────────

export function rectMinus(base: Rect, hole: Rect): Rect[] {
  const ix0 = Math.max(base.x0, hole.x0);
  const ix1 = Math.min(base.x1, hole.x1);
  const iz0 = Math.max(base.z0, hole.z0);
  const iz1 = Math.min(base.z1, hole.z1);
  if (ix0 >= ix1 || iz0 >= iz1) return [base];
  const out: Rect[] = [];
  if (base.z0 < iz0) out.push({ x0: base.x0, z0: base.z0, x1: base.x1, z1: iz0 });
  if (iz1 < base.z1) out.push({ x0: base.x0, z0: iz1, x1: base.x1, z1: base.z1 });
  if (base.x0 < ix0) out.push({ x0: base.x0, z0: iz0, x1: ix0, z1: iz1 });
  if (ix1 < base.x1) out.push({ x0: ix1, z0: iz0, x1: base.x1, z1: iz1 });
  return out;
}

function minusAll(base: Rect, holes: Rect[]): Rect[] {
  let parts = [base];
  for (const h of holes) parts = parts.flatMap((p) => rectMinus(p, h));
  return parts;
}

export function floorRects(room: RoomDef): Rect[] {
  const holes = STAIRS.filter((s) => s.highLevel === room.level).map((s) => s.rect);
  return minusAll(room.rect, holes);
}

export function ceilingRects(room: RoomDef): Rect[] {
  const holes = STAIRS.filter((s) => s.lowLevel === room.level && LEVEL_Y[room.level] + room.height < LEVEL_Y[s.highLevel] + 0.01).map(
    (s) => s.rect,
  );
  return minusAll(room.rect, holes);
}

// ───────────────────────── Facades & windows ─────────────────────────

export interface FacadePiece {
  building: RoomDef['building'];
  pos: [number, number, number];
  size: [number, number, number];
  glass: boolean;
}

export interface WindowDef {
  roomId: string;
  level: Level;
  x: number;
  z: number;
  /** Bottom of the glazing. */
  y: number;
  w: number;
  h: number;
  /** Outward normal. */
  out: { x: number; z: number };
}

export interface QuoinDef {
  x: number;
  z: number;
  y0: number;
  y1: number;
}

/** Portions of a room edge that face the outside world on that room's storey. */
export function exteriorIntervals(room: RoomDef, e: EdgeInfo): Interval[] {
  const covered: Interval[] = [];
  for (const other of ROOMS) {
    if (other.id === room.id) continue;
    if (!roomOccupiesLevel(other, room.level) && !roomOccupiesLevel(room, other.level)) continue;
    // Vertical overlap check: both must share some height range
    const a0 = LEVEL_Y[room.level];
    const a1 = a0 + room.height;
    const b0 = LEVEL_Y[other.level];
    const b1 = b0 + other.height;
    if (Math.min(a1, b1) - Math.max(a0, b0) < 0.5) continue;
    for (const oe of roomEdges(other.rect)) {
      if (oe.line !== e.line || Math.abs(oe.at - e.at) > EPS) continue;
      // must be on the opposite side
      if (oe.inward.x === e.inward.x && oe.inward.z === e.inward.z) continue;
      covered.push({ a: oe.from, b: oe.to });
    }
  }
  return subtractIntervals({ a: e.from, b: e.to }, covered);
}

function facadeTop(room: RoomDef): number {
  const top = LEVEL_Y[room.level] + room.height;
  if (room.building === 'garage') return top + 0.5;
  if (room.level === 0 && room.height < 5) {
    // single storey wing gets a parapet unless an upper room sits above it
    const above = ROOMS.some(
      (o) => o.level === 1 && o.rect.x0 < room.rect.x1 && o.rect.x1 > room.rect.x0 && o.rect.z0 < room.rect.z1 && o.rect.z1 > room.rect.z0,
    );
    return above ? LEVEL_Y[1] : top + 0.7;
  }
  return top + 0.25;
}

export function buildFacades() {
  const pieces: FacadePiece[] = [];
  const windows: WindowDef[] = [];
  const quoins = new Map<string, QuoinDef>();
  for (const room of ROOMS) {
    if (room.level < 0) continue;
    const y0 = LEVEL_Y[room.level] - (room.level === 0 ? 0.3 : 0);
    const top = facadeTop(room);
    for (const e of roomEdges(room.rect)) {
      const ext = exteriorIntervals(room, e);
      if (!ext.length) continue;
      const finish = edgeFinish(room, e.edge);
      const glass = finish === 'glass';
      const out = { x: -e.inward.x, z: -e.inward.z };
      const doors = doorsOnEdge(room, e).filter((d) => {
        const iv = doorInterval(d);
        return ext.some((x) => iv.a >= x.a - EPS && iv.b <= x.b + EPS);
      });
      for (const iv of ext) {
        const solids = subtractIntervals(iv, doors.map(doorInterval));
        for (const s of solids) {
          const bx = boxAlong(e, s.a, s.b, y0, top, FACADE_T, -FACADE_T / 2);
          pieces.push({ building: room.building, ...bx, glass });
        }
        for (const d of doors) {
          const di = doorInterval(d);
          if (di.a < iv.a - EPS || di.b > iv.b + EPS) continue;
          const bx = boxAlong(e, di.a, di.b, LEVEL_Y[room.level] + d.height, top, FACADE_T, -FACADE_T / 2);
          pieces.push({ building: room.building, ...bx, glass });
        }
        for (const end of [iv.a, iv.b]) {
          const qx = e.line === 'z' ? end : e.at + out.x * (FACADE_T / 2);
          const qz = e.line === 'z' ? e.at + out.z * (FACADE_T / 2) : end;
          const key = `${qx.toFixed(2)},${qz.toFixed(2)}`;
          const prev = quoins.get(key);
          quoins.set(key, { x: qx, z: qz, y0: Math.min(prev?.y0 ?? y0, y0), y1: Math.max(prev?.y1 ?? top, top) });
        }
        if (glass) continue;
        // windows, evenly spaced, avoiding doors and corners
        const len = iv.b - iv.a;
        const count = Math.floor((len - 1.2) / 3.4);
        if (count <= 0) continue;
        const spacing = len / count;
        const isHall = room.height > 5;
        for (let i = 0; i < count; i++) {
          const c = iv.a + spacing * (i + 0.5);
          if (doors.some((d) => Math.abs((d.line === 'z' ? d.x : d.z) - c) < d.width / 2 + 1.0)) continue;
          const wx = e.line === 'z' ? c : e.at;
          const wz = e.line === 'z' ? e.at : c;
          const base = LEVEL_Y[room.level];
          if (isHall) {
            windows.push({ roomId: room.id, level: room.level, x: wx, z: wz, y: base + 4.9, w: 1.3, h: 2.2, out });
            windows.push({ roomId: room.id, level: room.level, x: wx, z: wz, y: base + 0.9, w: 1.3, h: 2.4, out });
          } else {
            const h = Math.min(2.3, room.height - 1.5);
            windows.push({ roomId: room.id, level: room.level, x: wx, z: wz, y: base + 0.9, w: 1.3, h, out });
          }
        }
      }
    }
  }
  return { pieces, windows, quoins: [...quoins.values()] };
}

// ───────────────────────── Collision geometry ─────────────────────────

export interface Seg {
  ax: number;
  az: number;
  bx: number;
  bz: number;
}

/** Static wall segments for a given storey (door openings left open). */
export function wallSegments(level: Level): Seg[] {
  const segs: Seg[] = [];
  for (const room of ROOMS) {
    if (room.level !== level) continue;
    for (const e of roomEdges(room.rect)) {
      const doors = room.balustrade?.includes(e.edge) ? [] : doorsOnEdge(room, e);
      for (const s of subtractIntervals({ a: e.from, b: e.to }, doors.map(doorInterval))) {
        segs.push(e.line === 'z' ? { ax: s.a, az: e.at, bx: s.b, bz: e.at } : { ax: e.at, az: s.a, bx: e.at, bz: s.b });
      }
    }
  }
  segs.push(...stairRails(level));
  return segs;
}

/** Rails around stairwells so players can only enter at the ends. */
export function stairRails(level: Level): Seg[] {
  const segs: Seg[] = [];
  for (const st of STAIRS) {
    if (st.lowLevel !== level && st.highLevel !== level) continue;
    const { x0, x1 } = st.rect;
    segs.push({ ax: x0, az: st.rect.z0, bx: x0, bz: st.rect.z1 });
    segs.push({ ax: x1, az: st.rect.z0, bx: x1, bz: st.rect.z1 });
    // upper storey: close the low end (the drop); lower storey: close the high end (under the stair)
    const capZ = level === st.highLevel ? st.lowAt : st.highAt;
    segs.push({ ax: x0, az: capZ, bx: x1, bz: capZ });
  }
  return segs;
}

/** The segment that blocks a doorway while the door is shut. */
export function doorSegment(d: DoorDef): Seg {
  const iv = doorInterval(d);
  return d.line === 'z' ? { ax: iv.a, az: d.z, bx: iv.b, bz: d.z } : { ax: d.x, az: iv.a, bx: d.x, bz: iv.b };
}

// ───────────────────────── Stairs ─────────────────────────

export function stairAt(x: number, z: number, level: Level): StairDef | null {
  for (const st of STAIRS) {
    if (st.lowLevel !== level && st.highLevel !== level) continue;
    const r = st.rect;
    if (x > r.x0 && x < r.x1 && z > Math.min(r.z0, r.z1) && z < Math.max(r.z0, r.z1)) return st;
  }
  return null;
}

/** 0 at the low end, 1 at the high end. */
export function stairProgress(st: StairDef, z: number): number {
  const t = (z - st.lowAt) / (st.highAt - st.lowAt);
  return Math.min(1, Math.max(0, t));
}

export function groundHeight(x: number, z: number, level: Level): { y: number; level: Level } {
  const st = stairAt(x, z, level);
  if (!st) return { y: LEVEL_Y[level], level };
  const t = stairProgress(st, z);
  const y = LEVEL_Y[st.lowLevel] + (LEVEL_Y[st.highLevel] - LEVEL_Y[st.lowLevel]) * t;
  return { y, level: t > 0.5 ? st.highLevel : st.lowLevel };
}
