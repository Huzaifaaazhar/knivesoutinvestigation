/**
 * Decides what the player is looking at: the nearest interactable or door
 * that is within reach, roughly centred in view, and not behind a wall.
 */
import { DOORS, LEVEL_Y, type Level } from '../data/layout';
import { INTERACTABLES, type InteractableDef } from '../data/interactables';
import { lineOfSight } from '../systems/collision';
import { staticColliders } from '../systems/colliders';

export interface Candidate {
  id: string;
  x: number;
  y: number;
  z: number;
  level: Level;
  range: number;
}

const DOOR_PREFIX = 'door:';
export const doorTarget = (id: string) => `${DOOR_PREFIX}${id}`;
export const isDoorTarget = (t: string | null) => !!t && t.startsWith(DOOR_PREFIX);
export const doorIdOf = (t: string) => t.slice(DOOR_PREFIX.length);
export const npcTarget = (id: string) => `npc:${id}`;
export const isNpcTarget = (t: string | null) => !!t && t.startsWith('npc:');
export const npcIdOf = (t: string) => t.slice(4);

let candidates: Candidate[] | null = null;
function allCandidates(): Candidate[] {
  if (candidates) return candidates;
  candidates = [
    ...INTERACTABLES.map((it: InteractableDef) => ({ id: it.id, x: it.pos[0], y: it.pos[1], z: it.pos[2], level: it.level, range: it.range ?? 2.4 })),
    ...DOORS.filter((d) => d.kind !== 'arch').map((d) => ({ id: doorTarget(d.id), x: d.x, y: LEVEL_Y[d.level] + 1.3, z: d.z, level: d.level, range: 2.3 })),
  ];
  return candidates;
}

export interface View {
  x: number;
  y: number;
  z: number;
  /** Unit forward vector. */
  fx: number;
  fy: number;
  fz: number;
  level: Level;
}

export function pickTarget(v: View, available: (id: string) => boolean, extra: Candidate[] = []): string | null {
  const segs = staticColliders()[v.level].segs;
  let best: string | null = null;
  let bestScore = Infinity;
  for (const c of [...allCandidates(), ...extra]) {
    if (c.level !== v.level) continue;
    const dx = c.x - v.x;
    const dy = c.y - v.y;
    const dz = c.z - v.z;
    const dist = Math.hypot(dx, dy, dz);
    if (dist > c.range || dist < 0.05) continue;
    const cos = (dx * v.fx + dy * v.fy + dz * v.fz) / dist;
    // allow a wider cone when close, so small objects stay easy to select
    const minCos = dist < 1.2 ? 0.8 : 0.9;
    if (cos < minCos) continue;
    if (!available(c.id)) continue;
    // walls block sight (door centres sit in the gap of their own wall, so they stay visible)
    // pull the target point slightly toward the viewer so items flush with walls aren't occluded
    const tx = c.x - (dx / dist) * 0.2;
    const tz = c.z - (dz / dist) * 0.2;
    if (!lineOfSight(v.x, v.z, tx, tz, segs)) continue;
    const score = (1 - cos) * 6 + dist * 0.25;
    if (score < bestScore) {
      bestScore = score;
      best = c.id;
    }
  }
  return best;
}
