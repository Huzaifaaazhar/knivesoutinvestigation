/**
 * Deduction logic for Part 3, all pure: timeline status and consistency,
 * challenge checks, accusation evaluation and the final rating. The UI never
 * decides whether the player is right — this module does, against the fixed
 * truth in data/mystery.ts.
 */
import { check, type Snapshot } from './conditions';
import {
  CHALLENGES,
  CULPRIT,
  KEY_CONTRADICTIONS,
  KEY_EVIDENCE,
  OPPORTUNITY_EVIDENCE,
  RELEVANT_CONTRADICTIONS,
  THEORIES,
  TIMELINE_EVENTS,
  TIMELINE_ORDER,
  TIMELINE_REQUIRED,
  TL_BY_ID,
  TRUE_MOTIVES,
  WILL_QUESTIONS,
  type TLStatus,
  type TimelineEventDef,
  type WillQuestion,
} from '../data/mystery';

// ───────────────────────── Timeline ─────────────────────────

export function discoveredEvents(s: Snapshot): TimelineEventDef[] {
  return TIMELINE_EVENTS.filter((e) => check(e.discovered, s));
}

export function eventStatus(e: TimelineEventDef, s: Snapshot): TLStatus {
  if (e.contradictedBy && check(e.contradictedBy, s)) return 'contradicted';
  if (e.confirmedBy && check(e.confirmedBy, s)) return 'confirmed';
  if (e.time) return 'reported';
  return 'unverified';
}

/**
 * Subtle feedback: only cards whose times the evidence actually fixes can be
 * judged out of order. Undated cards (the swap, the car) are the player's to
 * reason about — no hint is given for them.
 */
export function inconsistentCards(order: string[]): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i < order.length; i++)
    for (let j = i + 1; j < order.length; j++) {
      const a = TL_BY_ID[order[i]];
      const b = TL_BY_ID[order[j]];
      if (a?.minutes !== undefined && b?.minutes !== undefined && a.minutes > b.minutes) {
        out.add(a.id);
        out.add(b.id);
      }
    }
  return out;
}

/** Fraction of truth constraints satisfied among those whose cards are both placed. */
export function timelineAccuracy(order: string[]): { satisfied: number; applicable: number; score: number; coverage: number } {
  const pos = new Map(order.map((id, i) => [id, i]));
  let satisfied = 0;
  let applicable = 0;
  for (const [a, b] of TIMELINE_ORDER) {
    if (!pos.has(a) || !pos.has(b)) continue;
    applicable++;
    if (pos.get(a)! < pos.get(b)!) satisfied++;
  }
  const coverage = TIMELINE_REQUIRED.filter((r) => pos.has(r)).length / TIMELINE_REQUIRED.length;
  const score = applicable ? (satisfied / applicable) * coverage : 0;
  return { satisfied, applicable, score, coverage };
}

// ───────────────────────── Will ─────────────────────────

export function willAnswerCorrect(q: WillQuestion, picked: string[]): boolean {
  if (!picked.length) return false;
  if (q.wrong?.some((w) => picked.includes(w))) return false;
  if (!q.all.every((a) => picked.includes(a))) return false;
  if (q.any && picked.filter((p) => q.any!.includes(p)).length < (q.anyMin ?? 1)) return false;
  return true;
}

// ───────────────────────── Challenges ─────────────────────────

export interface CaseState {
  snap: Snapshot;
  timeline: string[];
  motives: Record<string, { category: string | null }>;
  wallLinks: { a: string; b: string; type: string }[];
  wallCards: { id: string; kind: string; ref: string }[];
  willAnswers: Record<string, string[]>;
}

export function challengeSolved(id: string, c: CaseState): boolean {
  switch (id) {
    case 'CH-evening': {
      const t = timelineAccuracy(c.timeline);
      return t.coverage === 1 && t.satisfied === t.applicable;
    }
    case 'CH-motives': {
      let right = 0;
      for (const [who, ok] of Object.entries(TRUE_MOTIVES)) {
        const cat = c.motives[who]?.category;
        if (cat && !ok.includes(cat)) return false;
        if (cat && ok.includes(cat)) right++;
      }
      return right >= 4;
    }
    case 'CH-accounts': {
      const marked = Object.keys(c.snap.contradictions);
      return marked.length >= 3 && marked.some((m) => m === 'C-ransom-car' || m === 'C-ransom-cake');
    }
    case 'CH-connection': {
      const ref = Object.fromEntries(c.wallCards.map((k) => [k.id, `${k.kind}:${k.ref}`]));
      return c.wallLinks.some((l) => {
        const pair = [ref[l.a], ref[l.b]];
        return pair.includes('evidence:EV-15') && pair.includes('statement:S-ransom-left') && (l.type === 'alibi' || l.type === 'contradicts');
      });
    }
    case 'CH-will':
      return WILL_QUESTIONS.every((q) => willAnswerCorrect(q, c.willAnswers[q.id] ?? []));
  }
  return false;
}

export function solvedChallenges(c: CaseState): string[] {
  return CHALLENGES.filter((ch) => challengeSolved(ch.id, c)).map((ch) => ch.id);
}

// ───────────────────────── Accusation ─────────────────────────

export interface Accusation {
  suspect: string | null;
  motive: string | null;
  opportunity: string[];
  evidence: string[];
  contradictions: string[];
  theory: string | null;
}

export const EMPTY_ACCUSATION: Accusation = { suspect: null, motive: null, opportunity: [], evidence: [], contradictions: [], theory: null };

export type Verdict = 'complete' | 'partial' | 'incomplete' | 'wrong' | 'unresolved';

export interface Evaluation {
  verdict: Verdict;
  scores: { identification: number; motive: number; timeline: number; evidence: number; contradictions: number; logic: number };
  total: number;
  /** Plain-language notes for the case report (never shown before the ending). */
  notes: string[];
}

const clamp = (n: number) => Math.max(0, Math.min(1, n));

export function evaluate(acc: Accusation | null, c: CaseState): Evaluation {
  const zero = { identification: 0, motive: 0, timeline: 0, evidence: 0, contradictions: 0, logic: 0 };
  if (!acc || !acc.suspect) return { verdict: 'unresolved', scores: zero, total: 0, notes: ['No accusation was made.'] };
  const notes: string[] = [];
  const identification = acc.suspect === CULPRIT ? 1 : 0;
  if (!identification) notes.push(acc.suspect === 'marta' ? 'Marta was accused — of the one crime that never happened.' : 'The wrong person was accused.');

  let motive = 0;
  if (identification) {
    if (acc.motive === 'ransom:inheritance') motive = 1;
    else if (acc.motive === 'ransom:family') {
      motive = 0.5;
      notes.push('The motive was family resentment, not the will itself.');
    } else notes.push('No sound motive was established.');
  }

  const t = timelineAccuracy(c.timeline);
  const timeline = t.score;
  if (t.coverage < 1) notes.push('Key events of the night were missing from the timeline.');
  else if (t.satisfied < t.applicable) notes.push('The timeline had events out of order.');

  const chosen = [...new Set([...acc.evidence, ...acc.opportunity])].filter((e) => c.snap.evidence[e]);
  const relevant = chosen.filter((e) => KEY_EVIDENCE.includes(e)).length;
  const irrelevant = chosen.length - relevant;
  let evidence = clamp(relevant / 4 - irrelevant * 0.1);
  const hasOpportunity = acc.opportunity.some((e) => OPPORTUNITY_EVIDENCE.includes(e) && c.snap.evidence[e]);
  if (!hasOpportunity) {
    evidence *= 0.6;
    notes.push('Opportunity was never shown: nothing placed the accused where it mattered.');
  }
  if (!c.snap.evidence['EV-19']) notes.push('The toxicology report was never found.');

  const marked = acc.contradictions.filter((x) => c.snap.contradictions[x]);
  const keyN = marked.filter((x) => KEY_CONTRADICTIONS.includes(x)).length;
  const badN = marked.filter((x) => !RELEVANT_CONTRADICTIONS.includes(x)).length;
  const contradictions = clamp(keyN / 2 - badN * 0.15);
  if (!keyN && identification) notes.push('None of the accused’s own contradictions were put to them.');

  const th = THEORIES.find((x) => x.id === acc.theory);
  let logic = th && check(th.available, c.snap) ? th.value : 0;
  if (identification && acc.theory === 'TH-overdose') logic = 0;
  if (logic < 1) notes.push(logic === 0.5 ? 'Harlan’s sacrifice was understood — but not the swap that caused it.' : 'The final discovery was misunderstood.');

  const scores = { identification, motive, timeline, evidence, contradictions, logic };
  const total = Math.round(25 * identification + 15 * motive + 15 * timeline + 15 * evidence + 10 * contradictions + 20 * logic);
  let verdict: Verdict;
  if (!identification) verdict = 'wrong';
  else if (total >= 75 && logic === 1 && motive >= 0.5 && evidence >= 0.5) verdict = 'complete';
  else if (total >= 50) verdict = 'partial';
  else verdict = 'incomplete';
  return { verdict, scores, total, notes };
}

export type EndingId = 'truth' | 'unfinished' | 'wrong' | 'unresolved';

export const ENDING_FOR: Record<Verdict, EndingId> = {
  complete: 'truth',
  partial: 'unfinished',
  incomplete: 'unfinished',
  wrong: 'wrong',
  unresolved: 'unresolved',
};

export const ENDING_TITLE: Record<EndingId, string> = {
  truth: 'The Complete Truth',
  unfinished: 'The Unfinished Case',
  wrong: 'The Wrong Accusation',
  unresolved: 'The Unresolved Mystery',
};

// ───────────────────────── Rating ─────────────────────────

export const RANKS = ['Amateur Observer', 'Curious Investigator', 'Skilled Detective', 'Master Investigator', 'Benoit Blanc Level'] as const;
export type Rank = (typeof RANKS)[number];

export interface RatingInput {
  evaluation: Evaluation;
  evidencePct: number;
  contradictionPct: number;
  roomsPct: number;
  interviewsPct: number;
  challengesPct: number;
  hintLevelsUsed: number;
}

export function rate(r: RatingInput): { score: number; rank: Rank } {
  const raw =
    0.45 * r.evaluation.total + 20 * r.evidencePct + 10 * r.contradictionPct + 8 * r.roomsPct + 7 * r.interviewsPct + 10 * r.challengesPct - Math.min(10, r.hintLevelsUsed * 1.5);
  const score = Math.max(0, Math.min(100, Math.round(raw)));
  let rank: Rank;
  if (r.evaluation.verdict === 'complete' && score >= 85 && r.hintLevelsUsed <= 3) rank = 'Benoit Blanc Level';
  else if (score >= 72 && r.evaluation.verdict === 'complete') rank = 'Master Investigator';
  else if (score >= 52) rank = 'Skilled Detective';
  else if (score >= 32) rank = 'Curious Investigator';
  else rank = 'Amateur Observer';
  return { score, rank };
}
