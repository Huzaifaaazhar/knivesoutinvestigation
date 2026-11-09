import { describe, expect, it } from 'vitest';
import { DOORS, ROOMS, STAIRS, ZONES, ROOM_BY_ID, ZONE_BY_ID, inRect, locate, LEVEL_Y } from '../data/layout';
import { INTERACTABLES } from '../data/interactables';
import { EVIDENCE, EVIDENCE_BY_ID } from '../data/evidence';
import { CHARACTER_BY_ID, EVENT_BY_ID } from '../data/case';
import { roomEdges, doorsOnEdge, exteriorIntervals, floorRects, buildFacades } from './architecture';
import { roomRoute } from './navigation';

describe('mansion layout', () => {
  it('has every required location', () => {
    const names = ROOMS.map((r) => r.name).join('|') + '|' + ZONES.map((z) => z.name).join('|');
    for (const n of [
      'Entrance Hall',
      'Grand Staircase',
      'Living Room',
      'Study',
      'Library',
      'Dining Room',
      'Kitchen',
      'Conservatory',
      "Harlan's Bedroom",
      'Guest Bedroom',
      'Family Corridor',
      'Private Sitting Room',
      'Upstairs Landing',
      'Basement',
      'Storage Room',
      'Service Corridor',
      'Front Garden',
      'Rear Garden',
      'Terrace',
      'Garage',
      'Driveway',
      'Main Gate',
      'Parking Area',
    ]) {
      expect(names).toContain(n);
    }
  });

  it('rooms on the same storey never overlap', () => {
    for (const a of ROOMS)
      for (const b of ROOMS) {
        if (a === b || a.level !== b.level) continue;
        const ox = Math.min(a.rect.x1, b.rect.x1) - Math.max(a.rect.x0, b.rect.x0);
        const oz = Math.min(a.rect.z1, b.rect.z1) - Math.max(a.rect.z0, b.rect.z0);
        expect(ox > 0.01 && oz > 0.01, `${a.id} overlaps ${b.id}`).toBe(false);
      }
  });

  it('every interior door sits on a shared wall of the two rooms it joins', () => {
    for (const d of DOORS) {
      const a = ROOM_BY_ID[d.a];
      expect(a, d.id).toBeTruthy();
      expect(a.level).toBe(d.level);
      const onA = roomEdges(a.rect).some((e) => doorsOnEdge(a, e).includes(d));
      expect(onA, `${d.id} on ${d.a}`).toBe(true);
      const b = ROOM_BY_ID[d.b];
      if (b) {
        expect(b.level, d.id).toBe(d.level);
        expect(roomEdges(b.rect).some((e) => doorsOnEdge(b, e).includes(d)), `${d.id} on ${d.b}`).toBe(true);
      } else {
        // exterior door: must be on an exterior stretch of wall, and open onto its zone
        expect(ZONE_BY_ID[d.b], d.id).toBeTruthy();
        const edge = roomEdges(a.rect).find((e) => doorsOnEdge(a, e).includes(d))!;
        const ext = exteriorIntervals(a, edge);
        const c = d.line === 'z' ? d.x : d.z;
        expect(ext.some((iv) => c > iv.a && c < iv.b), `${d.id} exterior`).toBe(true);
      }
    }
  });

  it('every room is reachable from the main gate', () => {
    for (const r of ROOMS) expect(roomRoute('gate', r.id), r.id).not.toBeNull();
  });

  it('stairs connect the rooms above and below', () => {
    for (const s of STAIRS) {
      const cx = (s.rect.x0 + s.rect.x1) / 2;
      expect(locate(cx, s.lowAt + Math.sign(s.highAt - s.lowAt) * 0.1, s.lowLevel)).toBeTruthy();
      expect(locate(cx, s.highAt - Math.sign(s.highAt - s.lowAt) * 0.1, s.highLevel)).toBeTruthy();
      expect(LEVEL_Y[s.highLevel]).toBeGreaterThan(LEVEL_Y[s.lowLevel]);
    }
  });

  it('cuts a stairwell hole in the upper floor', () => {
    const landing = ROOM_BY_ID.landing;
    const area = floorRects(landing).reduce((a, r) => a + (r.x1 - r.x0) * (r.z1 - r.z0), 0);
    const full = (landing.rect.x1 - landing.rect.x0) * (landing.rect.z1 - landing.rect.z0);
    expect(area).toBeLessThan(full);
  });

  it('builds facades and windows on exterior walls only', () => {
    const { pieces, windows } = buildFacades();
    expect(pieces.length).toBeGreaterThan(20);
    expect(windows.length).toBeGreaterThan(20);
    for (const w of windows) expect(ROOM_BY_ID[w.roomId].level).toBeGreaterThanOrEqual(0);
  });
});

describe('interactables & evidence', () => {
  it('every interactable sits inside the room or zone it claims', () => {
    for (const it of INTERACTABLES) {
      const rm = ROOM_BY_ID[it.room];
      if (rm) {
        expect(inRect(rm.rect, it.pos[0], it.pos[2], 0.05), it.id).toBe(true);
        expect(rm.level, it.id).toBe(it.level);
      } else {
        expect(ZONE_BY_ID[it.room], it.id).toBeTruthy();
      }
    }
  });

  it('every evidence item is discoverable through exactly one object', () => {
    for (const ev of EVIDENCE) {
      const sources = INTERACTABLES.filter((i) => i.evidence === ev.id);
      expect(sources.length, ev.id).toBe(1);
      expect(sources[0].room, ev.id).toBe(ev.location);
    }
  });

  it('evidence references real characters and events', () => {
    for (const ev of EVIDENCE) {
      for (const c of ev.relatedCharacters) expect(CHARACTER_BY_ID[c], `${ev.id}:${c}`).toBeTruthy();
      for (const e of ev.relatedEvents) expect(EVENT_BY_ID[e], `${ev.id}:${e}`).toBeTruthy();
    }
  });

  it('evidence objects need inspection (key details) before they can be logged', () => {
    for (const it of INTERACTABLES.filter((i) => i.evidence)) {
      expect(['inspect', 'document', 'will'].includes(it.kind), it.id).toBe(true);
      expect((it.hotspots ?? []).some((h) => h.key), it.id).toBe(true);
      expect(EVIDENCE_BY_ID[it.evidence!]).toBeTruthy();
    }
  });

  it('includes ordinary, non-evidence objects too', () => {
    expect(INTERACTABLES.filter((i) => !i.evidence && i.kind === 'observe').length).toBeGreaterThan(10);
  });

  it('document hotspot markup refers to declared hotspots', () => {
    for (const it of INTERACTABLES.filter((i) => i.document)) {
      const ids = new Set((it.hotspots ?? []).map((h) => h.id));
      const text = [...it.document!.body, it.document!.date ?? ''].join(' ');
      for (const m of text.matchAll(/\[\[([^|\]]+)\|/g)) expect(ids.has(m[1]), `${it.id}:${m[1]}`).toBe(true);
      for (const mk of it.document!.marks ?? []) expect(ids.has(mk.id), `${it.id}:${mk.id}`).toBe(true);
    }
  });
});

import { splitCells } from '../inspection/DocumentView';
describe('document ledger rows', () => {
  it('keeps hotspot markup intact when splitting cells', () => {
    expect(splitCells('| Sep 09 | [[refund|Overpayment — refunded]] | — |')).toEqual(['Sep 09', '[[refund|Overpayment — refunded]]', '—']);
  });
});
