/**
 * Part 3 actions: the evidence wall, the timeline cord, the will, the
 * confrontation, endings, case reports and replay. Judgement comes from the
 * pure systems in systems/deduction.ts; this module only applies results.
 */
import { useGame, gameClock, type CardKind, type LinkType, type WallCard } from './store';
import { snapshot, applyEffects, nameOf } from './story';
import { addReport, backupSave, clearSave } from './save';
import { saveNow } from './persistence';
import { audio } from '../audio/audio';
import {
  ENDING_FOR,
  ENDING_TITLE,
  EMPTY_ACCUSATION,
  evaluate,
  rate,
  solvedChallenges,
  timelineAccuracy,
  type Accusation,
  type CaseState,
  type EndingId,
  type Evaluation,
  type Rank,
} from '../systems/deduction';
import { CHALLENGES, ESSENTIAL_CLUES } from '../data/mystery';
import { EVIDENCE, EVIDENCE_BY_ID } from '../data/evidence';
import { CONTRADICTIONS } from '../data/testimony';
import { ROOMS } from '../data/layout';
import { NPCS } from '../data/npcs';

const g = () => useGame.getState();
const bump = () => useGame.setState({ dirty: g().dirty + 1 });
let seq = 1;
const uid = (p: string) => `${p}${Date.now().toString(36)}${seq++}`;

export function caseState(): CaseState {
  const s = g();
  return { snap: snapshot(), timeline: s.timeline, motives: s.motives, wallLinks: s.wall.links, wallCards: s.wall.cards, willAnswers: s.willAnswers };
}

// ───────────────────────── Evidence wall ─────────────────────────

export function pinCard(kind: CardKind, ref: string, x: number, y: number, text?: string): string {
  const s = g();
  const existing = s.wall.cards.find((c) => c.kind === kind && c.ref === ref && kind !== 'note');
  if (existing) return existing.id;
  const card: WallCard = { id: uid('c'), kind, ref, text, x, y, rot: Math.round((Math.random() - 0.5) * 6) };
  useGame.setState({ wall: { ...s.wall, cards: [...s.wall.cards, card] } });
  audio.play('click');
  bump();
  return card.id;
}

export function moveCard(id: string, x: number, y: number) {
  const s = g();
  useGame.setState({ wall: { ...s.wall, cards: s.wall.cards.map((c) => (c.id === id ? { ...c, x, y } : c)) } });
}

export function commitMove() {
  bump();
}

export function unpinCard(id: string) {
  const s = g();
  useGame.setState({ wall: { cards: s.wall.cards.filter((c) => c.id !== id), links: s.wall.links.filter((l) => l.a !== id && l.b !== id) } });
  audio.play('paper');
  bump();
}

export function editNote(id: string, text: string) {
  const s = g();
  useGame.setState({ wall: { ...s.wall, cards: s.wall.cards.map((c) => (c.id === id ? { ...c, text } : c)) } });
  bump();
}

export function linkCards(a: string, b: string, type: LinkType): string | null {
  if (a === b) return null;
  const s = g();
  const dup = s.wall.links.find((l) => (l.a === a && l.b === b) || (l.a === b && l.b === a));
  if (dup) {
    useGame.setState({ wall: { ...s.wall, links: s.wall.links.map((l) => (l.id === dup.id ? { ...l, type } : l)) } });
    bump();
    return dup.id;
  }
  const id = uid('l');
  useGame.setState({ wall: { ...s.wall, links: [...s.wall.links, { id, a, b, type }] } });
  audio.play('pencil');
  bump();
  return id;
}

export function unlink(id: string) {
  const s = g();
  useGame.setState({ wall: { ...s.wall, links: s.wall.links.filter((l) => l.id !== id) } });
  bump();
}

// ───────────────────────── Timeline cord ─────────────────────────

export function placeEvent(id: string, at?: number) {
  const t = g().timeline.filter((x) => x !== id);
  const i = at === undefined ? t.length : Math.max(0, Math.min(t.length, at));
  t.splice(i, 0, id);
  useGame.setState({ timeline: t });
  audio.play('click');
  bump();
}

export function removeEvent(id: string) {
  useGame.setState({ timeline: g().timeline.filter((x) => x !== id) });
  audio.play('paper');
  bump();
}

// ───────────────────────── Will ─────────────────────────

export function setWillAnswer(q: string, picked: string[]) {
  useGame.setState({ willAnswers: { ...g().willAnswers, [q]: picked } });
  bump();
}

export function openWill() {
  const s = g();
  if (!s.examined.includes('sealed-will')) s.examine('sealed-will');
  useGame.setState({ overlay: 'will', inspecting: 'sealed-will' });
  audio.play('seal');
}

// ───────────────────────── Challenges ─────────────────────────

/** "Test my reasoning": checks one challenge; records it when solved. */
export function testChallenge(id: string): boolean {
  const ok = solvedChallenges(caseState()).includes(id);
  const s = g();
  const key = `solved:${id}`;
  if (ok && !s.flags.includes(key)) {
    applyEffects([{ flag: key }]);
    const ch = CHALLENGES.find((c) => c.id === id)!;
    s.addNote('milestone', `Solved: ${ch.title}.`);
    audio.play('discover');
  } else if (!ok) audio.play('pencil');
  return ok;
}

export function solvedFlags(): string[] {
  return CHALLENGES.filter((c) => g().flags.includes(`solved:${c.id}`)).map((c) => c.id);
}

// ───────────────────────── Confrontation ─────────────────────────

export function canConfront(): boolean {
  const s = g();
  return Object.keys(s.evidence).length >= 5 && s.met.length >= 3;
}

export function beginConfrontation() {
  if (document.pointerLockElement) document.exitPointerLock();
  const s = g();
  useGame.setState({
    conversation: null,
    overlay: 'confrontation',
    cinema: { scene: 'gathering', index: 0 },
    finale: { ...s.finale, accusation: { ...EMPTY_ACCUSATION } },
  });
  audio.setMood('tension');
  audio.play('door-close');
}

export function updateAccusation(patch: Partial<Accusation>) {
  const s = g();
  useGame.setState({ finale: { ...s.finale, accusation: { ...s.finale.accusation, ...patch } } });
}

export function withdraw() {
  conclude(null);
}

export function deliver() {
  conclude(g().finale.accusation);
}

function conclude(acc: Accusation | null) {
  const ev = evaluate(acc, caseState());
  const ending = ENDING_FOR[ev.verdict];
  const s = g();
  useGame.setState({
    finale: { ...s.finale, accusation: acc ?? { ...EMPTY_ACCUSATION }, verdict: ev.verdict, evaluation: ev, ending, closedTs: Date.now() },
    overlay: 'ending',
    cinema: { scene: `end-${ending}`, index: 0 },
  });
  s.addNote('milestone', acc?.suspect ? `Named ${nameOf(acc.suspect)} before the family.` : 'Closed the investigation without naming anyone.');
  audio.setMood(ending === 'truth' ? 'resolve' : 'somber');
  void saveNow();
}

export function finishEnding() {
  const report = buildReport();
  void addReport(report);
  useGame.setState({ overlay: 'report', cinema: null, lastReport: report });
  audio.play('seal');
  audio.setMood('none');
  void saveNow();
}

// ───────────────────────── Case report ─────────────────────────

export interface CaseReport {
  id: string;
  title: string;
  closedTs: number;
  gameMinutes: number;
  realMinutes: number;
  rooms: [number, number];
  interviewed: string[];
  evidence: string[];
  missed: string[];
  contradictions: string[];
  contradictionTotal: number;
  timelinePct: number;
  challenges: string[];
  accusation: Accusation;
  evaluation: Evaluation;
  ending: EndingId;
  endingTitle: string;
  score: number;
  rank: Rank;
  hintsUsed: number;
  hintMode: 'full' | 'sparse';
  clockClosed: string;
}

export function buildReport(): CaseReport {
  const s = g();
  const cs = caseState();
  const evaluation = s.finale.evaluation ?? evaluate(null, cs);
  const ending = s.finale.ending ?? 'unresolved';
  const roomsSeen = s.visited.filter((v) => ROOMS.some((r) => r.id === v)).length;
  const challenges = solvedChallenges(cs);
  const hintsUsed = Object.values(s.hintsUsed).reduce((a, b) => a + b, 0);
  const interviewed = s.met.filter((m) => NPCS.some((n) => n.id === m));
  const { score, rank } = rate({
    evaluation,
    evidencePct: Object.keys(s.evidence).length / EVIDENCE.length,
    contradictionPct: Object.keys(s.contradictions).length / CONTRADICTIONS.length,
    roomsPct: roomsSeen / ROOMS.length,
    interviewsPct: interviewed.length / NPCS.length,
    challengesPct: challenges.length / CHALLENGES.length,
    hintLevelsUsed: hintsUsed,
  });
  return {
    id: uid('r'),
    title: 'The Death of Harlan Thrombey',
    closedTs: Date.now(),
    gameMinutes: Math.round(s.playSeconds / 15),
    realMinutes: Math.round(s.playSeconds / 60),
    rooms: [roomsSeen, ROOMS.length],
    interviewed,
    evidence: EVIDENCE.filter((e) => s.evidence[e.id]).map((e) => e.id),
    missed: ESSENTIAL_CLUES.filter((e) => !s.evidence[e]).map((e) => `${e} · ${EVIDENCE_BY_ID[e].name}`),
    contradictions: Object.keys(s.contradictions),
    contradictionTotal: CONTRADICTIONS.length,
    timelinePct: Math.round(timelineAccuracy(s.timeline).score * 100),
    challenges,
    accusation: s.finale.accusation,
    evaluation,
    ending,
    endingTitle: ENDING_TITLE[ending],
    score,
    rank,
    hintsUsed,
    hintMode: s.hintMode,
    clockClosed: gameClock(s.playSeconds),
  };
}

// ───────────────────────── Replay ─────────────────────────

/** Starts a fresh case. The previous one is backed up first, never silently lost. */
export async function startFresh(hintMode: 'full' | 'sparse') {
  await saveNow();
  await backupSave();
  await clearSave();
  const s = g();
  s.newGame();
  useGame.setState({ hintMode, startedTs: Date.now(), hasSave: false });
}

/** After a finished case, keep exploring the house where you left it. */
export function returnToHouse() {
  useGame.setState({ overlay: 'none', cinema: null });
  audio.setMood('none');
}

// Debug & test hook
if (typeof window !== 'undefined') {
  const w = window as unknown as { __KO__?: Record<string, unknown> };
  w.__KO__ = { ...(w.__KO__ ?? {}), finale: { beginConfrontation, withdraw, caseState, buildReport }, saveNow };
}
