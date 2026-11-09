import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { NPCS, postFor } from '../data/npcs';
import { SCRIPTS } from '../data/dialogue';
import { STATEMENTS, STATEMENT_BY_ID, CONTRADICTIONS } from '../data/testimony';
import { ALBUM, MEMORIES, MOTIVE_LEADS, REL_BY_ID, HINTS } from '../data/relations';
import { INTERACTABLE_BY_ID } from '../data/interactables';
import { EVIDENCE_BY_ID } from '../data/evidence';
import { DOORS, ROOM_BY_ID, ZONE_BY_ID, inRect, LEVEL_Y } from '../data/layout';
import { check, computeAct, type Effect, type Snapshot } from './conditions';
import { availableTopics, react, type Line } from './dialogue';
import { compare, discoverable, flaggedStatements, statementStatus } from './contradictions';
import { resolve } from './collision';
import { staticColliders } from './colliders';
import { roomRoute } from './navigation';
import { useGame } from '../state/store';
import * as story from '../state/story';
import { loadSave, writeSave } from '../state/save';

const empty = (): Snapshot => ({
  evidence: {},
  details: {},
  milestones: [],
  statements: {},
  flags: [],
  discussed: [],
  contradictions: {},
  relationships: [],
  memories: [],
  visited: [],
  inventory: [],
  met: [],
  act: 0,
});

/** Every effect anywhere in the content. */
function allEffects(): Effect[] {
  const out: Effect[] = [];
  const lines = (ls: Line[]) => ls.forEach((l) => out.push(...(l.effects ?? [])));
  for (const sc of Object.values(SCRIPTS)) {
    sc.greetings.forEach((g) => lines(g.lines));
    sc.topics.forEach((t) => {
      lines(t.lines);
      t.variants?.forEach((v) => lines(v.lines));
    });
    sc.reactions.forEach((r) => lines(r.lines));
  }
  MEMORIES.forEach((m) => out.push(...m.effects));
  ALBUM.forEach((a) => out.push(...a.effects));
  return out;
}

describe('cast & schedules', () => {
  it('has every central character with their own script', () => {
    for (const id of ['blanc', 'marta', 'ransom', 'linda', 'walt', 'joni', 'meg', 'richard']) {
      expect(NPCS.find((n) => n.id === id), id).toBeTruthy();
      expect(SCRIPTS[id], id).toBeTruthy();
    }
  });

  it('every post is a free, reachable spot inside its room', () => {
    for (const npc of NPCS)
      for (const posts of npc.schedule)
        for (const p of posts) {
          const rm = ROOM_BY_ID[p.room];
          const zn = ZONE_BY_ID[p.room];
          expect(rm || zn, `${npc.id}@${p.room}`).toBeTruthy();
          if (rm) expect(inRect(rm.rect, p.x, p.z), `${npc.id}@${p.room}`).toBe(true);
          else expect(zn.rects.some((r) => inRect(r, p.x, p.z)), `${npc.id}@${p.room}`).toBe(true);
          const level = rm?.level ?? 0;
          const set = staticColliders()[level];
          const r = resolve(p.x, p.z, 0.25, { segs: set.segs, boxes: set.boxes, circles: [] });
          expect(Math.hypot(r.x - p.x, r.z - p.z), `${npc.id} post at ${p.room} is inside furniture`).toBeLessThan(0.05);
          const route = roomRoute('gate', p.room, (d) => !DOORS.find((x) => x.id === d)?.lock);
          expect(route, `${npc.id}: ${p.room} reachable`).not.toBeNull();
          expect(LEVEL_Y[level]).toBeDefined();
        }
  });

  it('people move between rooms as the evening goes on', () => {
    let moved = 0;
    for (const npc of NPCS) {
      const rooms = new Set<string>();
      for (let act = 0; act < 3; act++) for (let t = 0; t < 15 * 60 * 4; t += 60) rooms.add(postFor(npc, act, t).post.room);
      if (rooms.size > 1) moved++;
    }
    expect(moved).toBe(NPCS.length);
  });

  it('the act only rises with discoveries', () => {
    const s = empty();
    expect(computeAct(s)).toBe(0);
    s.met = ['blanc'];
    expect(computeAct(s)).toBe(1);
    s.contradictions = { a: {}, b: {} };
    expect(computeAct(s)).toBe(2);
  });

  it('nobody stays unwilling or busy forever — discoveries release them', () => {
    const s = empty();
    s.met = ['blanc'];
    s.evidence = { 'EV-10': { fullyExamined: true }, 'EV-01': { fullyExamined: true } };
    s.visited = ['study'];
    s.milestones = ['read-attorney-letter'];
    for (const npc of NPCS)
      for (const p of npc.schedule.flat()) {
        if (p.unwilling) expect(check(p.unwilling, s), npc.id).toBe(false);
        if (p.occupied) expect(check(p.occupied, s), npc.id).toBe(false);
      }
  });
});

describe('dialogue content', () => {
  it('characters are not one template with names changed', () => {
    const labels = Object.values(SCRIPTS).map((sc) => sc.topics.map((t) => t.label).join('|'));
    expect(new Set(labels).size).toBe(labels.length);
    const fallbacks = Object.values(SCRIPTS).map((sc) => sc.fallback[0][0].text);
    expect(new Set(fallbacks).size).toBe(fallbacks.length);
    for (const sc of Object.values(SCRIPTS)) {
      expect(sc.topics.length, sc.id).toBeGreaterThanOrEqual(4);
      expect(sc.reactions.length, sc.id).toBeGreaterThanOrEqual(3);
    }
  });

  it('references only real statements, relationships, motives, evidence', () => {
    for (const e of allEffects()) {
      if (e.statement) expect(STATEMENT_BY_ID[e.statement], e.statement).toBeTruthy();
      if (e.relationship) expect(REL_BY_ID[e.relationship], e.relationship).toBeTruthy();
      if (e.motive) expect(MOTIVE_LEADS.find((m) => m.id === `${e.motive!.character}:${e.motive!.category}`), JSON.stringify(e.motive)).toBeTruthy();
    }
    for (const sc of Object.values(SCRIPTS)) for (const r of sc.reactions) expect(EVIDENCE_BY_ID[r.evidence], `${sc.id}:${r.evidence}`).toBeTruthy();
  });

  it('every statement can actually be heard, and every contradiction can be found', () => {
    const said = new Set(allEffects().map((e) => e.statement).filter(Boolean));
    for (const s of STATEMENTS) expect(said.has(s.id), s.id).toBe(true);
    for (const c of CONTRADICTIONS) {
      expect(said.has(c.claim), c.id).toBe(true);
      expect(SCRIPTS[c.challenge].topics.some((t) => t.kind === 'challenge' && JSON.stringify(t.requires).includes(c.id)), `${c.id} has a challenge`).toBe(true);
      for (const a of c.against) {
        if ('statement' in a) expect(said.has(a.statement), a.statement).toBe(true);
        if ('evidence' in a) expect(EVIDENCE_BY_ID[a.evidence]).toBeTruthy();
        if ('memory' in a) expect(MEMORIES.find((m) => m.id === a.memory)).toBeTruthy();
      }
    }
  });

  it('memories are triggered by real objects in the house', () => {
    for (const m of MEMORIES) {
      const viaAlbum = ALBUM.some((a) => a.memory === m.id);
      expect(INTERACTABLE_BY_ID[m.trigger] || viaAlbum, m.id).toBeTruthy();
    }
  });

  it('does not expose every question at the start', () => {
    for (const sc of Object.values(SCRIPTS)) expect(availableTopics(sc, empty()).length, sc.id).toBeLessThan(sc.topics.length);
  });

  it('unlocks questions through discoveries', () => {
    const s = empty();
    const ransomTopics = () => availableTopics(SCRIPTS.ransom, s).map((t) => t.id);
    expect(ransomTopics()).not.toContain('chat');
    s.statements['S-meg-shouting'] = {};
    expect(ransomTopics()).toContain('chat');
    expect(ransomTopics()).not.toContain('challenge-argument');
    s.contradictions['C-ransom-argument'] = {};
    expect(ransomTopics()).toContain('challenge-argument');
  });

  it('reactions to evidence are contextual and character-specific', () => {
    const s = empty();
    s.evidence['EV-16'] = { fullyExamined: true };
    const joni = react(SCRIPTS.joni, 'EV-16', s);
    const meg = react(SCRIPTS.meg, 'EV-16', s);
    expect(joni.kind).toBe('defensive');
    expect(meg.kind).toBe('surprise');
    expect(joni.lines[0].text).not.toBe(meg.lines[0].text);
    // irrelevant evidence gets the character's own deflection, not a confession
    const r = react(SCRIPTS.richard, 'EV-03', s);
    expect(r.kind).toBe('acknowledge');
    expect(SCRIPTS.richard.fallback.flat().map((l) => l.text)).toContain(r.lines[0].text);
    // a half-examined item gets a "look at it properly" response
    s.evidence['EV-02'] = { fullyExamined: false };
    expect(react(SCRIPTS.blanc, 'EV-02', s).lines).toBe(SCRIPTS.blanc.unexamined);
  });
});

describe('contradiction engine', () => {
  it('needs both halves before anything is flagged', () => {
    const s = empty();
    s.statements['S-ransom-civil'] = {};
    expect(discoverable(s)).toHaveLength(0);
    s.statements['S-meg-shouting'] = {};
    expect(discoverable(s).map((c) => c.id)).toContain('C-ransom-argument');
    expect(flaggedStatements(s).has('S-ransom-civil')).toBe(true);
  });

  it('only the right pairing marks a contradiction, in either direction', () => {
    const s = empty();
    s.statements['S-ransom-civil'] = {};
    s.statements['S-meg-shouting'] = {};
    s.evidence['EV-03'] = { fullyExamined: true };
    expect(compare('S-ransom-civil', { evidence: 'EV-03' }, s)).toEqual({ ok: false, reason: 'no-conflict' });
    expect(compare('S-ransom-civil', { statement: 'S-meg-shouting' }, s)).toEqual({ ok: true, id: 'C-ransom-argument' });
    expect(compare('S-meg-shouting', { statement: 'S-ransom-civil' }, s)).toEqual({ ok: true, id: 'C-ransom-argument' });
    expect(compare('S-ransom-civil', { evidence: 'EV-13' }, s)).toEqual({ ok: false, reason: 'unknown' });
  });

  it('tracks confirmed / unverified / contradicted', () => {
    const s = empty();
    s.statements['S-marta-go'] = {};
    s.statements['S-ransom-civil'] = {};
    expect(statementStatus('S-marta-go', s)).toBe('unverified');
    s.evidence['EV-03'] = { fullyExamined: false };
    expect(statementStatus('S-marta-go', s)).toBe('confirmed');
    s.contradictions['C-ransom-argument'] = {};
    expect(statementStatus('S-ransom-civil', s)).toBe('contradicted');
  });
});

describe('Blanc’s hints', () => {
  it('start with the study, move on as the player progresses, and deepen on request', () => {
    expect(HINTS[0].id).toBe('H-study');
    const s = empty();
    const first = HINTS.find((h) => check(h.when, s) && !check(h.done, s));
    expect(first?.id).toBe('H-study');
    s.visited = ['study'];
    expect(HINTS.find((h) => check(h.when, s) && !check(h.done, s))?.id).toBe('H-letter');
  });
});

describe('story actions against the store', () => {
  beforeEach(() => {
    useGame.getState().newGame();
    useGame.setState({ phase: 'playing' });
  });

  it('a conversation meets the character, records testimony in the notebook', () => {
    story.startConversation('meg');
    expect(useGame.getState().met).toContain('meg');
    expect(useGame.getState().overlay).toBe('conversation');
    story.chooseTopic('evening');
    // walk through the lines
    for (let i = 0; i < 6; i++) story.advance();
    const s = useGame.getState();
    expect(s.statements['S-meg-shouting']).toBeTruthy();
    expect(s.notes.some((n) => n.kind === 'statement' && n.who === 'meg')).toBe(true);
    expect(s.discussed).toContain('meg:evening');
    story.endConversation();
    expect(useGame.getState().conversation).toBeNull();
  });

  it('cannot present evidence you have not found', () => {
    story.startConversation('joni');
    story.present('EV-16');
    expect(useGame.getState().conversation?.reaction).toBeUndefined();
  });

  it('presenting the right evidence after a lie exposes the contradiction', () => {
    useGame.setState({ evidence: { 'EV-16': { id: 'EV-16', source: 'tuition-statement', discoveredAt: '22:00', discoveredTs: 1, examinedDetails: [], fullyExamined: true, presentedTo: [] } } });
    story.startConversation('joni');
    story.chooseTopic('meg');
    for (let i = 0; i < 4; i++) story.advance();
    expect(useGame.getState().statements['S-joni-tuition']).toBeTruthy();
    story.present('EV-16');
    const s = useGame.getState();
    expect(s.conversation?.reaction).toBe('defensive');
    expect(s.contradictions['C-joni-tuition']).toBeTruthy();
    expect(s.evidence['EV-16'].presentedTo).toContain('joni');
    expect(story.hubTopics('joni').map((t) => t.topic.id)).toContain('challenge-tuition');
  });

  it('Blanc’s hint goes one level deeper each time', () => {
    const a = story.takeHint();
    const b = story.takeHint();
    const c = story.takeHint();
    expect(new Set([a, b, c]).size).toBe(3);
    expect(c.startsWith('All right. Plainly')).toBe(true);
  });

  it('memories play, then leave their trace', () => {
    story.startMemory('M-go');
    expect(useGame.getState().overlay).toBe('flashback');
    for (let i = 0; i < 10; i++) story.advanceMemory();
    const s = useGame.getState();
    expect(s.memories).toContain('M-go');
    expect(s.relationships).toContain('R-harlan-marta-trust');
    expect(s.overlay).toBe('none');
  });

  it('the family tree, annotations and motives persist through a save', async () => {
    story.openFamilyTree();
    story.setRelNote('R-harlan-linda', 'complicated');
    story.toggleRelMark('R-harlan-linda');
    story.updateMotive('walt', { category: 'career', confidence: 3, questions: 'Did he know before the party?' });
    story.addAssumption('Ransom came back that night.');
    story.markContradiction('C-walt-fired');
    expect(await writeSave(useGame.getState().serialize())).toBe(true);
    useGame.getState().newGame();
    expect(useGame.getState().relationships).toHaveLength(0);
    useGame.getState().hydrate((await loadSave())!);
    const s = useGame.getState();
    expect(s.relationships).toContain('R-harlan-linda');
    expect(s.relNotes['R-harlan-linda']).toBe('complicated');
    expect(s.relMarked).toContain('R-harlan-linda');
    expect(s.motives.walt.confidence).toBe(3);
    expect(s.contradictions['C-walt-fired']).toBeTruthy();
    expect(s.notes.some((n) => n.kind === 'assumption')).toBe(true);
  });
});
