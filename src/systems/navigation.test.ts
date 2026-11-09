import { describe, expect, it } from 'vitest';
import { outdoorClear, outdoorPath, roomRoute, routeTo } from './navigation';

describe('navigation assistance', () => {
  it('routes from the gate to Harlan’s bedroom through the hall and up the stairs', () => {
    const r = roomRoute('gate', 'harlan')!;
    expect(r.rooms).toEqual(['outside', 'hall', 'stairhall', 'landing', 'famcorr', 'harlan']);
  });

  it('routes down to the storage room through the rear hall', () => {
    const r = roomRoute('library', 'storage')!;
    expect(r.rooms).toContain('backhall');
    expect(r.rooms).toContain('servcorr');
  });

  it('walks around the house rather than through it', () => {
    const a = { x: 0, z: 30, level: 0 as const };
    const b = { x: 2, z: -18, level: 0 as const };
    expect(outdoorClear(a, b)).toBe(false);
    const path = outdoorPath(a, b);
    expect(path.length).toBeGreaterThan(1);
    let prev = a;
    for (const p of path) {
      expect(outdoorClear(prev, p)).toBe(true);
      prev = p;
    }
  });

  it('produces waypoints ending in the destination room', () => {
    const wps = routeTo({ x: 0, z: 40, level: 0 }, 'gate', 'kitchen')!;
    const last = wps[wps.length - 1];
    expect(last.x).toBeCloseTo(10);
    expect(last.z).toBeCloseTo(-11);
  });
});
