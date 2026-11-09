import 'fake-indexeddb/auto';
import { describe, expect, it, beforeEach } from 'vitest';
import { evaluate, inconsistentCards, timelineAccuracy, challengeSolved, willAnswerCorrect, rate, discoveredEvents, eventStatus, type CaseState, type Accusation } from './deduction';
import { TIMELINE_EVENTS, TIMELINE_REQUIRED, THEORIES, WILL_QUESTIONS, KEY_EVIDENCE, ESSENTIAL_CLUES } from '../data/mystery';
import { INTERACTABLES } from '../data/interactables';
import { STATEMENT_BY_ID } from '../data/testimony';
import { EVIDENCE_BY_ID } from '../data/evidence';
import { SCRIPTS } from '../data/dialogue';
import type { Snapshot } from './conditions';
import { useGame } from '../state/store';
import { writeSave, loadSave } from '../state/save';
import * as finale from '../state/finale';

const snap = (over: Partial<Snapshot> = {}): Snapshot => ({
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
  ...over,
});

const ev = (...ids: string[]) => Object.fromEntries(ids.map((i) => [i, { fullyExamined: true }]));
const TRUE_ORDER = ['T-party', 'T-seating', 'T-argument', 'T-coat', 'T-swap', 'T-go', 'T-tape', 'T-meds', 'T-rain', 'T-front', 'T-car', 'T-window', 'T-death', 'T-burn'];

function solvedCase(): CaseState {
  return {
    snap: snap({
      evidence: ev('EV-02', 'EV-04', 'EV-20', 'EV-19', 'EV-06', 'EV-15', 'EV-13', 'EV-12', 'EV-07'),
      details: { medbag: ['labels'] },
      contradictions: { 'C-ransom-car': {}, 'C-ransom-cake': {}, 'C-ransom-argument': {} },
      statements: { 'S-marta-window': {} },
    }),
    timeline: TRUE_ORDER,
    motives: {},
    wallLinks: [],
    wallCards: [],
    willAnswers: {},
  };
}

const truth: Accusation = {
  suspect: 'ransom',
  motive: 'ransom:inheritance',
  opportunity: ['EV-15', 'EV-13'],
  evidence: ['EV-02', 'EV-20', 'EV-19', 'EV-06'],
  contradictions: ['C-ransom-car', 'C-ransom-cake'],
  theory: 'TH-swap',
};

describe('the accusation is judged on reasoning, not guessing', () => {
  it('a full, evidenced theory is a complete deduction', () => {
    const r = evaluate(truth, solvedCase());
    expect(r.verdict).toBe('complete');
    expect(r.total).toBeGreaterThanOrEqual(90);
  });

  it('the right name with nothing behind it is not enough', () => {
    const r = evaluate({ suspect: 'ransom', motive: null, opportunity: [], evidence: [], contradictions: [], theory: 'TH-suicide' }, { ...solvedCase(), timeline: [] });
    expect(r.verdict).toBe('incomplete');
  });

  it('the right name and motive but misunderstanding the final discovery is partial', () => {
    const r = evaluate({ ...truth, theory: 'TH-protect' }, solvedCase());
    expect(r.verdict).toBe('partial');
  });

  it('accusing Marta (or anyone else) is a wrong accusation however well argued', () => {
    expect(evaluate({ ...truth, suspect: 'marta', motive: 'marta:inheritance' }, solvedCase()).verdict).toBe('wrong');
    expect(evaluate({ ...truth, suspect: 'walt', motive: 'walt:career' }, solvedCase()).verdict).toBe('wrong');
  });

  it('declining to accuse is the unresolved mystery', () => {
    expect(evaluate(null, solvedCase()).verdict).toBe('unresolved');
  });

  it('cannot cite evidence or theories that were never discovered', () => {
    const c = solvedCase();
    c.snap.evidence = ev('EV-13', 'EV-15');
    c.snap.details = {};
    const r = evaluate(truth, c);
    expect(r.scores.logic).toBe(0); // TH-swap needs the labels detail and the toxicology report
    expect(r.verdict).not.toBe('complete');
  });
});

describe('timeline', () => {
  it('scores order against the truth', () => {
    expect(timelineAccuracy(TRUE_ORDER).score).toBe(1);
    const swapped = [...TRUE_ORDER];
    [swapped[3], swapped[11]] = [swapped[11], swapped[3]];
    expect(timelineAccuracy(swapped).score).toBeLessThan(1);
  });

  it('only flags dated cards as inconsistent — undated cards are the player’s to reason about', () => {
    expect(inconsistentCards(['T-death', 'T-party']).size).toBe(2);
    expect(inconsistentCards(['T-car', 'T-swap']).size).toBe(0);
    expect(inconsistentCards(['T-window', 'T-swap', 'T-coat']).size).toBe(0);
  });

  it('cards only exist once their basis has been discovered', () => {
    const ids = discoveredEvents(snap()).map((e) => e.id);
    expect(ids).toEqual(['T-party', 'T-death']);
    const more = discoveredEvents(snap({ evidence: ev('EV-13', 'EV-15'), details: { medbag: ['labels'] } })).map((e) => e.id);
    expect(more).toContain('T-swap');
    expect(more).toContain('T-car');
  });

  it('statuses distinguish confirmed, reported, unverified and contradicted', () => {
    const front = TIMELINE_EVENTS.find((e) => e.id === 'T-front')!;
    expect(eventStatus(front, snap())).toBe('reported');
    expect(eventStatus(front, snap({ contradictions: { 'C-marta-door': {} } }))).toBe('contradicted');
    const swap = TIMELINE_EVENTS.find((e) => e.id === 'T-swap')!;
    expect(eventStatus(swap, snap())).toBe('unverified');
    expect(eventStatus(swap, snap({ details: { medbag: ['labels'] }, evidence: ev('EV-19') }))).toBe('confirmed');
  });

  it('every required card can be discovered through the game', () => {
    const everything = snap({
      evidence: ev(...Object.keys(EVIDENCE_BY_ID)),
      details: { medbag: ['labels'], 'grandfather-clock': ['face'] },
      statements: Object.fromEntries(Object.keys(STATEMENT_BY_ID).map((k) => [k, {}])),
      memories: ['M-go', 'M-argument'],
      contradictions: { 'C-marta-door': {} },
    });
    const found = discoveredEvents(everything).map((e) => e.id);
    for (const r of TIMELINE_REQUIRED) expect(found, r).toContain(r);
    expect(found.length).toBe(TIMELINE_EVENTS.length);
  });
});

describe('challenges & the will', () => {
  it('the will questions need the right answers, and reject wrong ones', () => {
    const q = WILL_QUESTIONS.find((x) => x.id === 'W-knew')!;
    expect(willAnswerCorrect(q, ['ransom'])).toBe(true);
    expect(willAnswerCorrect(q, ['ransom', 'marta'])).toBe(false);
    const all = Object.fromEntries(WILL_QUESTIONS.map((x) => [x.id, x.id === 'W-exists' ? ['EV-20'] : x.id === 'W-authentic' ? ['witness'] : x.id === 'W-harmed' ? ['ransom', 'linda', 'walt'] : x.all]));
    expect(challengeSolved('CH-will', { ...solvedCase(), willAnswers: all })).toBe(true);
  });

  it('the missing connection needs the right string between the right cards', () => {
    const c = solvedCase();
    c.wallCards = [
      { id: 'a', kind: 'evidence', ref: 'EV-15' },
      { id: 'b', kind: 'statement', ref: 'S-ransom-left' },
    ];
    c.wallLinks = [{ a: 'a', b: 'b', type: 'supports' }];
    expect(challengeSolved('CH-connection', c)).toBe(false);
    c.wallLinks = [{ a: 'a', b: 'b', type: 'alibi' }];
    expect(challengeSolved('CH-connection', c)).toBe(true);
  });

  it('family motives need the right reasons and no wrong ones', () => {
    const c = solvedCase();
    c.motives = { ransom: { category: 'inheritance' }, walt: { category: 'career' }, joni: { category: 'money' }, richard: { category: 'secret' } };
    expect(challengeSolved('CH-motives', c)).toBe(true);
    c.motives.linda = { category: 'money' };
    expect(challengeSolved('CH-motives', c)).toBe(false);
  });
});

describe('the mystery is fully discoverable', () => {
  it('every key and essential clue is held by an object in the house', () => {
    for (const e of [...KEY_EVIDENCE, ...ESSENTIAL_CLUES]) expect(INTERACTABLES.some((i) => i.evidence === e), e).toBe(true);
  });

  it('the truth can be reached: TH-swap needs only discoverable things', () => {
    const t = THEORIES.find((x) => x.id === 'TH-swap')!;
    expect(JSON.stringify(t.available)).toContain('medbag:labels');
    expect(INTERACTABLES.find((i) => i.id === 'medbag')!.hotspots!.some((h) => h.id === 'labels')).toBe(true);
  });

  it('Ransom can be pushed to admit staying, and knowing about the will', () => {
    const lines = SCRIPTS.ransom.topics.flatMap((t) => t.lines.flatMap((l) => l.effects ?? []));
    expect(lines.some((e) => e.statement === 'S-ransom-stayed')).toBe(true);
    expect(lines.some((e) => e.statement === 'S-ransom-knew')).toBe(true);
  });
});

describe('rating', () => {
  const base = { evidencePct: 1, contradictionPct: 1, roomsPct: 1, interviewsPct: 1, challengesPct: 1, hintLevelsUsed: 0 };
  it('only a complete deduction can reach the top ranks', () => {
    expect(rate({ ...base, evaluation: evaluate(truth, solvedCase()) }).rank).toBe('Benoit Blanc Level');
    expect(rate({ ...base, evaluation: evaluate({ ...truth, suspect: 'walt' }, solvedCase()) }).rank).not.toMatch(/Master|Benoit/);
    expect(rate({ ...base, evidencePct: 0, contradictionPct: 0, roomsPct: 0.1, interviewsPct: 0, challengesPct: 0, evaluation: evaluate(null, solvedCase()) }).rank).toBe('Amateur Observer');
  });

  it('hints cost a little', () => {
    const e = evaluate(truth, solvedCase());
    expect(rate({ ...base, evaluation: e, hintLevelsUsed: 6 }).score).toBeLessThan(rate({ ...base, evaluation: e }).score);
  });
});

describe('finale state, saves and replay', () => {
  beforeEach(() => {
    useGame.getState().newGame();
    useGame.setState({ phase: 'playing' });
  });

  it('the board, the cord and the will answers survive a save; old saves still load', async () => {
    const a = finale.pinCard('evidence', 'EV-15', 100, 100);
    useGame.setState({ statements: { 'S-ransom-left': { at: '22:00', ts: 1 } } });
    const b = finale.pinCard('statement', 'S-ransom-left', 300, 120);
    finale.linkCards(a, b, 'alibi');
    finale.placeEvent('T-party');
    finale.placeEvent('T-death');
    finale.setWillAnswer('W-benefits', ['marta']);
    await writeSave(useGame.getState().serialize());
    useGame.getState().newGame();
    useGame.getState().hydrate((await loadSave())!);
    const s = useGame.getState();
    expect(s.wall.cards).toHaveLength(2);
    expect(s.wall.links[0].type).toBe('alibi');
    expect(s.timeline).toEqual(['T-party', 'T-death']);
    expect(s.willAnswers['W-benefits']).toEqual(['marta']);

    // a Part 2 (version 2) save without any of this still loads, with empty defaults
    const old = { ...useGame.getState().serialize(), version: 2 as const } as any;
    delete old.wall;
    delete old.timeline;
    delete old.finale;
    useGame.getState().hydrate(old);
    expect(useGame.getState().wall.cards).toEqual([]);
    expect(useGame.getState().finale.verdict).toBeNull();
  });

  it('a case can be concluded, reported, and a fresh one started without losing the report', async () => {
    finale.withdraw();
    expect(useGame.getState().finale.ending).toBe('unresolved');
    finale.finishEnding();
    const report = useGame.getState().lastReport!;
    expect(report.endingTitle).toBe('The Unresolved Mystery');
    expect(report.rank).toBeTruthy();
    await new Promise((r) => setTimeout(r, 50));
    await finale.startFresh('sparse');
    const s = useGame.getState();
    expect(s.hintMode).toBe('sparse');
    expect(s.finale.verdict).toBeNull();
    const { loadReports } = await import('../state/save');
    expect((await loadReports()).length).toBeGreaterThan(0);
  });
});
