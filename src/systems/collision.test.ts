import { describe, expect, it } from 'vitest';
import { move, PLAYER_RADIUS, resolve, lineOfSight, segmentsIntersect } from './collision';
import { collidersFor, staticColliders } from './colliders';
import { groundHeight, stairAt } from './architecture';
import { DOORS, LEVEL_Y } from '../data/layout';
import { INTERACTABLES } from '../data/interactables';

const closed = Object.fromEntries(DOORS.map((d) => [d.id, { open: d.kind === 'arch' || !!d.startsOpen }]));
const allOpen = Object.fromEntries(DOORS.map((d) => [d.id, { open: true }]));

function walk(x: number, z: number, dx: number, dz: number, steps: number, doors = closed, level: 0 | 1 | -1 = 0) {
  let p = { x, z };
  const set = collidersFor(level, doors);
  for (let i = 0; i < steps; i++) p = move(p.x, p.z, dx, dz, set);
  return p;
}

describe('collision', () => {
  it('stops the player at a solid wall', () => {
    // from the hall, walk west into the wall south of the living-room door
    const p = walk(-2, 3.5, -0.2, 0, 60);
    expect(p.x).toBeGreaterThan(-4 + PLAYER_RADIUS - 0.01);
  });

  it('never tunnels through a wall even when moving fast', () => {
    const p = walk(-2, 3.5, -3, 0, 5);
    expect(p.x).toBeGreaterThan(-4);
  });

  it('a closed front door blocks entry; an open one lets you in', () => {
    const shut = walk(0, 13, 0, -0.2, 40);
    expect(shut.z).toBeGreaterThan(10);
    const open = walk(0, 13, 0, -0.2, 40, allOpen);
    expect(open.z).toBeLessThan(10);
  });

  it('furniture blocks movement', () => {
    // round table in the hall at (0, 5.8)
    const p = walk(0, 8.6, 0, -0.1, 60);
    expect(p.z).toBeGreaterThan(5.8 + 0.75);
  });

  it('segment intersection is symmetric and exact', () => {
    const wall = { ax: 4, az: 0, bx: 4, bz: 10 };
    expect(segmentsIntersect({ ax: 0, az: 3, bx: 8, bz: 3 }, wall)).toBe(true);
    expect(segmentsIntersect({ ax: 0, az: 3, bx: 3, bz: 3 }, wall)).toBe(false);
    expect(segmentsIntersect({ ax: 0, az: 12, bx: 8, bz: 12 }, wall)).toBe(false);
  });

  it('pushes a point that starts inside a box out of it', () => {
    const r = resolve(0, 0, 0.3, { segs: [], boxes: [{ x0: -1, z0: -1, x1: 1, z1: 1 }], circles: [] });
    expect(Math.abs(r.x) >= 1.29 || Math.abs(r.z) >= 1.29).toBe(true);
  });

  it('line of sight is blocked by walls', () => {
    const segs = staticColliders()[0].segs;
    expect(lineOfSight(0, 6, 8, 6, segs)).toBe(true); // through the hall–library doorway
    expect(lineOfSight(0, 3, 8, 3, segs)).toBe(false);
    expect(lineOfSight(0, 6, 0, 4, segs)).toBe(true);
  });

  it('no interactable model is buried inside an unreachable collider', () => {
    // every interactable must be within reach of some free standing spot
    for (const it of INTERACTABLES) {
      const set = collidersFor(it.level, allOpen);
      let ok = false;
      for (let a = 0; a < 16 && !ok; a++) {
        for (const rr of [0.6, 0.9, 1.2, 1.5]) {
          const x = it.pos[0] + Math.cos((a / 16) * Math.PI * 2) * rr;
          const z = it.pos[2] + Math.sin((a / 16) * Math.PI * 2) * rr;
          const p = resolve(x, z, PLAYER_RADIUS, set);
          if (Math.hypot(p.x - x, p.z - z) < 0.01) {
            const eye = LEVEL_Y[it.level] + 1.65;
            const d = Math.hypot(it.pos[0] - x, it.pos[1] - eye, it.pos[2] - z);
            if (d <= (it.range ?? 2.4)) ok = true;
          }
        }
      }
      expect(ok, it.id).toBe(true);
    }
  });
});

describe('stairs', () => {
  it('raises the player smoothly up the grand stair', () => {
    expect(stairAt(0, 1.0, 0)?.id).toBe('grand-stair');
    const low = groundHeight(0, 1.4, 0);
    const mid = groundHeight(0, -2, 0);
    const high = groundHeight(0, -5.4, 1);
    expect(low.y).toBeLessThan(0.2);
    expect(mid.y).toBeGreaterThan(1.5);
    expect(mid.y).toBeLessThan(3);
    expect(high.y).toBeGreaterThan(4.2);
    expect(high.level).toBe(1);
  });

  it('walking up the stairs changes storey and arrives on the landing', () => {
    let p = { x: 0, z: 2.5 };
    let level: 0 | 1 = 0;
    for (let i = 0; i < 200; i++) {
      p = move(p.x, p.z, 0, -0.05, collidersFor(level, closed));
      level = groundHeight(p.x, p.z, level).level as 0 | 1;
    }
    expect(level).toBe(1);
    expect(p.z).toBeLessThan(-5.5);
  });

  it('cannot fall into the stairwell from the landing', () => {
    // standing on the landing west of the hole, walk east
    let p = { x: -3, z: -2 };
    for (let i = 0; i < 60; i++) p = move(p.x, p.z, 0.1, 0, collidersFor(1, closed));
    expect(p.x).toBeLessThan(-1.5);
  });

  it('descends to the cellars from the rear hall', () => {
    let p = { x: -2.9, z: -8.4 };
    let level: -1 | 0 = 0;
    for (let i = 0; i < 200; i++) {
      p = move(p.x, p.z, 0, -0.05, collidersFor(level, closed));
      level = groundHeight(p.x, p.z, level).level as -1 | 0;
    }
    expect(level).toBe(-1);
  });
});
