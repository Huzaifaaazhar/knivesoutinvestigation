/** Builds the per-storey collision sets from the layout, furniture and facades. */
import { DOORS, LEVELS, type Level, type DoorDef } from '../data/layout';
import { CIRCLES, FURNISHINGS, TREES } from '../data/furnishings';
import { INTERACTABLES } from '../data/interactables';
import { FURNITURE_FOOTPRINTS } from './footprints';
import { buildFacades, doorSegment, wallSegments, type Seg } from './architecture';
import type { Box, Circle, ColliderSet } from './collision';

function rotatedBox(x: number, z: number, w: number, d: number, r: number): Box {
  const c = Math.abs(Math.cos(r));
  const s = Math.abs(Math.sin(r));
  const hw = (w * c + d * s) / 2;
  const hd = (w * s + d * c) / 2;
  return { x0: x - hw, z0: z - hd, x1: x + hw, z1: z + hd };
}

let cache: Record<number, ColliderSet> | null = null;

export function staticColliders(): Record<number, ColliderSet> {
  if (cache) return cache;
  const out: Record<number, ColliderSet> = {};
  for (const lv of LEVELS) out[lv] = { segs: wallSegments(lv), boxes: [], circles: [] };

  for (const p of FURNISHINGS) {
    if (p.solid === false) continue;
    const fp = FURNITURE_FOOTPRINTS[p.t]?.(p.p ?? {});
    if (!fp) continue;
    out[p.level].boxes.push(rotatedBox(p.x, p.z, fp[0], fp[1], p.r ?? 0));
  }
  for (const it of INTERACTABLES) {
    if (!it.block || !it.model) continue;
    out[it.level].boxes.push(rotatedBox(it.model.pos[0], it.model.pos[2], it.block[0], it.block[1], it.model.rotY ?? 0));
  }
  // exterior masonry (keeps the camera off the facade)
  const { pieces, quoins } = buildFacades();
  for (const pc of pieces) {
    const y0 = pc.pos[1] - pc.size[1] / 2;
    if (y0 > 1.5) continue;
    out[0].boxes.push({ x0: pc.pos[0] - pc.size[0] / 2, z0: pc.pos[2] - pc.size[2] / 2, x1: pc.pos[0] + pc.size[0] / 2, z1: pc.pos[2] + pc.size[2] / 2 });
  }
  for (const q of quoins) if (q.y0 < 1.5) out[0].boxes.push({ x0: q.x - 0.4, z0: q.z - 0.4, x1: q.x + 0.4, z1: q.z + 0.4 });
  for (const c of CIRCLES) out[c.level].circles.push({ x: c.x, z: c.z, r: c.r } as Circle);
  for (const t of TREES) out[0].circles.push({ x: t.x, z: t.z, r: 0.45 });
  // the open gateway: the drive continues to the county road, but the investigation stays on the estate
  out[0].segs.push({ ax: -4.2, az: 48.3, bx: 4.2, bz: 48.3 });
  cache = out;
  return out;
}

/** Door segments that currently block movement on a level. */
export function doorBlockers(level: Level, doors: Record<string, { open: boolean }>): Seg[] {
  const segs: Seg[] = [];
  for (const d of DOORS as DoorDef[]) {
    if (d.level !== level) continue;
    if (d.kind === 'arch') continue;
    if (doors[d.id]?.open) continue;
    segs.push(doorSegment(d));
  }
  return segs;
}

export function collidersFor(level: Level, doors: Record<string, { open: boolean }>): ColliderSet {
  const s = staticColliders()[level];
  return { segs: [...s.segs, ...doorBlockers(level, doors)], boxes: s.boxes, circles: s.circles };
}
