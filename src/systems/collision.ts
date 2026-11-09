/**
 * Lightweight 2.5D collision for a first-person walker.
 *
 * The house is made of storeys with vertical walls, so collision is solved in
 * the xz-plane per storey: the player is a circle pushed out of wall segments,
 * furniture boxes and round obstacles. Movement is sub-stepped so fast
 * movement can never tunnel through a wall.
 */
import type { Seg } from './architecture';

export interface Box {
  x0: number;
  z0: number;
  x1: number;
  z1: number;
}

export interface Circle {
  x: number;
  z: number;
  r: number;
}

export interface ColliderSet {
  segs: Seg[];
  boxes: Box[];
  circles: Circle[];
}

export const PLAYER_RADIUS = 0.32;

function closestOnSeg(px: number, pz: number, s: Seg) {
  const dx = s.bx - s.ax;
  const dz = s.bz - s.az;
  const len2 = dx * dx + dz * dz || 1e-9;
  let t = ((px - s.ax) * dx + (pz - s.az) * dz) / len2;
  t = Math.max(0, Math.min(1, t));
  return { x: s.ax + dx * t, z: s.az + dz * t };
}

/** Push a circle out of every collider it overlaps. */
export function resolve(px: number, pz: number, r: number, set: ColliderSet): { x: number; z: number } {
  let x = px;
  let z = pz;
  for (let iter = 0; iter < 4; iter++) {
    let moved = false;
    for (const s of set.segs) {
      // cheap reject
      if (x + r < Math.min(s.ax, s.bx) || x - r > Math.max(s.ax, s.bx)) continue;
      if (z + r < Math.min(s.az, s.bz) || z - r > Math.max(s.az, s.bz)) continue;
      const c = closestOnSeg(x, z, s);
      const dx = x - c.x;
      const dz = z - c.z;
      const d2 = dx * dx + dz * dz;
      if (d2 < r * r) {
        const d = Math.sqrt(d2) || 1e-6;
        const push = r - d + 1e-4;
        // degenerate: exactly on the line, push along the segment normal
        const nx = d2 > 1e-12 ? dx / d : -(s.bz - s.az);
        const nz = d2 > 1e-12 ? dz / d : s.bx - s.ax;
        const nl = Math.hypot(nx, nz) || 1;
        x += (nx / nl) * push;
        z += (nz / nl) * push;
        moved = true;
      }
    }
    for (const b of set.boxes) {
      if (x + r < b.x0 || x - r > b.x1 || z + r < b.z0 || z - r > b.z1) continue;
      const cx = Math.max(b.x0, Math.min(x, b.x1));
      const cz = Math.max(b.z0, Math.min(z, b.z1));
      const dx = x - cx;
      const dz = z - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 > 1e-12) {
        if (d2 < r * r) {
          const d = Math.sqrt(d2);
          x += (dx / d) * (r - d + 1e-4);
          z += (dz / d) * (r - d + 1e-4);
          moved = true;
        }
      } else {
        // centre inside the box: exit via the nearest face
        const exits = [x - b.x0 + r, b.x1 - x + r, z - b.z0 + r, b.z1 - z + r];
        const m = Math.min(...exits);
        if (m === exits[0]) x = b.x0 - r;
        else if (m === exits[1]) x = b.x1 + r;
        else if (m === exits[2]) z = b.z0 - r;
        else z = b.z1 + r;
        moved = true;
      }
    }
    for (const c of set.circles) {
      const dx = x - c.x;
      const dz = z - c.z;
      const rr = r + c.r;
      const d2 = dx * dx + dz * dz;
      if (d2 < rr * rr) {
        const d = Math.sqrt(d2) || 1e-6;
        x += (dx / d) * (rr - d + 1e-4);
        z += (dz / d) * (rr - d + 1e-4);
        moved = true;
      }
    }
    if (!moved) break;
  }
  return { x, z };
}

/** Move with sub-stepping so we never skip through a thin wall. */
export function move(px: number, pz: number, dx: number, dz: number, set: ColliderSet, r = PLAYER_RADIUS) {
  const dist = Math.hypot(dx, dz);
  const steps = Math.max(1, Math.ceil(dist / (r * 0.4)));
  let x = px;
  let z = pz;
  for (let i = 0; i < steps; i++) {
    const p = resolve(x + dx / steps, z + dz / steps, r, set);
    x = p.x;
    z = p.z;
  }
  return { x, z };
}

/** Does the straight line between two points cross any segment? Used for line-of-sight. */
export function segmentsIntersect(a: Seg, b: Seg): boolean {
  const rx = a.bx - a.ax;
  const rz = a.bz - a.az;
  const sx = b.bx - b.ax;
  const sz = b.bz - b.az;
  const d = rx * sz - rz * sx;
  if (Math.abs(d) < 1e-9) return false;
  const qx = b.ax - a.ax;
  const qz = b.az - a.az;
  const t = (qx * sz - qz * sx) / d; // along a
  const u = (qx * rz - qz * rx) / d; // along b
  return t > 0.001 && t < 0.999 && u > -0.001 && u < 1.001;
}

export function lineOfSight(ax: number, az: number, bx: number, bz: number, segs: Seg[]): boolean {
  const ray: Seg = { ax, az, bx, bz };
  for (const s of segs) if (segmentsIntersect(ray, s)) return false;
  return true;
}
