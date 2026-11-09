/**
 * Story actions for Part 2: conversations, evidence presentation, testimony,
 * contradictions, relationships, motives, Blanc's hints and memories.
 * The decision logic lives in pure systems (dialogue, contradictions,
 * conditions); this module applies results to the store and the notebook.
 */
import { gameClock, useGame, type MotiveRecord } from './store';
import { npcRt } from './npcRuntime';
import { audio } from '../audio/audio';
import { check, computeAct, type Effect, type Snapshot } from '../systems/conditions';
import { availableTopics, greeting, react, topicLines, type Line } from '../systems/dialogue';
import { compare, exposedByPresenting, type CompareResult } from '../systems/contradictions';
import { SCRIPTS } from '../data/dialogue';
import { NPC_BY_ID, postFor } from '../data/npcs';
import { CONTRADICTION_BY_ID, STATEMENT_BY_ID, type Source } from '../data/testimony';
import { HINTS, MEMORY_BY_ID, MOTIVE_LEADS, REL_BY_ID } from '../data/relations';
import { CHARACTER_BY_ID } from '../data/case';
import { EVIDENCE_BY_ID } from '../data/evidence';
import { placeName } from '../data/layout';

export function snapshot(): Snapshot {
  const s = useGame.getState();
  const base = {
    evidence: s.evidence,
    details: s.details,
    milestones: s.milestones,
    statements: s.statements,
    flags: s.flags,
    discussed: s.discussed,
    contradictions: s.contradictions,
    relationships: s.relationships,
    memories: s.memories,
    visited: s.visited,
    inventory: s.inventory,
    met: s.met,
    act: 0,
  };
  base.act = computeAct(base);
  return base;
}

export const nameOf = (id: string) => NPC_BY_ID[id]?.short ?? CHARACTER_BY_ID[id]?.name ?? id;

function bump() {
  useGame.setState({ dirty: useGame.getState().dirty + 1 });
}

// ───────────────────────── Effects ─────────────────────────

export function applyEffects(effects: Effect[], who?: string) {
  const g = useGame.getState;
  for (const e of effects) {
    const s = g();
    const stamp = { at: gameClock(s.playSeconds), ts: Date.now() };
    if (e.statement && !s.statements[e.statement]) {
      useGame.setState({ statements: { ...s.statements, [e.statement]: stamp } });
      const st = STATEMENT_BY_ID[e.statement];
      g().addNote('statement', `${nameOf(st.by)}: “${st.quote}”`, undefined, { who: st.by, refs: [st.id, ...(st.evidence ?? [])] });
    }
    if (e.flag && !s.flags.includes(e.flag)) useGame.setState({ flags: [...s.flags, e.flag] });
    if (e.milestone && !s.milestones.includes(e.milestone)) useGame.setState({ milestones: [...s.milestones, e.milestone] });
    if (e.relationship && !s.relationships.includes(e.relationship)) {
      useGame.setState({ relationships: [...s.relationships, e.relationship] });
      const r = REL_BY_ID[e.relationship];
      if (!r.onTree) {
        g().addNote('relationship', `${nameOf(r.a)} & ${nameOf(r.b)} — ${r.label}.`, undefined, { refs: [r.id] });
        g().toast(`Relationship noted: ${nameOf(r.a)} & ${nameOf(r.b)}`, 'note');
      }
    }
    if (e.motive) {
      const id = `${e.motive.character}:${e.motive.category}`;
      if (!s.motiveLeads.includes(id)) {
        useGame.setState({ motiveLeads: [...s.motiveLeads, id] });
        const lead = MOTIVE_LEADS.find((m) => m.id === id);
        g().addNote('motive', `Possible motive — ${nameOf(e.motive.character)}: ${lead?.text ?? e.motive.category}`, undefined, { who: e.motive.character });
      }
    }
    if (e.contradiction) markContradiction(e.contradiction, 'conversation');
    if (e.note) g().addNote('observation', e.note, undefined, { who });
  }
  bump();
}

// ───────────────────────── Conversations ─────────────────────────

/** Is this person busy or unwilling right now? */
export function npcStatus(npc: string): 'available' | 'occupied' | 'unwilling' {
  const def = NPC_BY_ID[npc];
  const snap = snapshot();
  const { post } = postFor(def, snap.act, useGame.getState().playSeconds);
  if (post.occupied && check(post.occupied, snap)) return 'occupied';
  if (post.unwilling && check(post.unwilling, snap)) return 'unwilling';
  return 'available';
}

export function startConversation(npc: string) {
  const script = SCRIPTS[npc];
  if (!script) return;
  const s = useGame.getState();
  const status = npcStatus(npc);
  let queue: Line[];
  let then: 'hub' | 'end' = 'hub';
  if (status === 'occupied') {
    queue = script.occupied;
    then = 'end';
  } else if (status === 'unwilling' && script.unwilling) {
    queue = script.unwilling;
    then = 'end';
  } else {
    queue = greeting(script, snapshot());
  }
  if (!s.met.includes(npc) && status === 'available') {
    useGame.setState({ met: [...s.met, npc] });
    const ch = CHARACTER_BY_ID[npc];
    if (ch && !s.characters.includes(npc)) useGame.setState({ characters: [...useGame.getState().characters, npc] });
    g().addNote('person', `Met ${NPC_BY_ID[npc].name}${npcRt[npc] ? ` in the ${placeName(npcRt[npc].room)}` : ''}.`, undefined, { who: npc });
  }
  useGame.setState({ overlay: 'conversation', conversation: { npc, queue, index: 0, mode: 'lines', then, noted: [] }, observing: null });
  speakEffects(queue[0]);
  audio.play('click');
}

const g = () => useGame.getState();

function speakEffects(line: Line | undefined) {
  if (!line) return;
  if (line.effects?.length) applyEffects(line.effects, g().conversation?.npc);
  const rt = g().conversation ? npcRt[g().conversation!.npc] : undefined;
  if (rt && line.by === 'npc') {
    rt.mood = line.mood ?? 'neutral';
    rt.gesture = line.gesture ?? null;
    rt.gestureT = 0;
  }
}

/** Resolve dynamic lines (whereabouts, hints) into text. */
export function lineText(line: Line): string {
  if (line.dynamic === 'whereabouts') {
    const met = g().met.filter((m) => m !== 'blanc');
    if (!met.length) return 'Everyone is somewhere in the house, and you have not yet met any of them. Begin with whoever looks most uncomfortable.';
    return met.map((m) => `${nameOf(m)} — the ${placeName(npcRt[m]?.room ?? '?')}`).join('. ') + '.';
  }
  if (line.dynamic === 'hint') return currentHintText ?? line.text;
  return line.text;
}

let currentHintText: string | null = null;

export function advance() {
  const c = g().conversation;
  if (!c || c.mode !== 'lines') return;
  const next = c.index + 1;
  if (next < c.queue.length) {
    useGame.setState({ conversation: { ...c, index: next } });
    speakEffects(c.queue[next]);
    return;
  }
  if (c.then === 'end') return endConversation();
  useGame.setState({ conversation: { ...c, mode: 'hub', reaction: undefined } });
  const rt = npcRt[c.npc];
  if (rt) rt.gesture = null;
}

export function hubTopics(npc: string) {
  const script = SCRIPTS[npc];
  const snap = snapshot();
  return availableTopics(script, snap).map((t) => ({ topic: t, asked: snap.discussed.includes(`${npc}:${t.id}`) }));
}

export function chooseTopic(topicId: string) {
  const c = g().conversation;
  if (!c) return;
  const script = SCRIPTS[c.npc];
  const topic = script.topics.find((t) => t.id === topicId);
  if (!topic) return;
  let lines = topicLines(script, topic, snapshot());
  if (topic.kind === 'hint') {
    const h = takeHint();
    currentHintText = h;
  }
  const key = `${c.npc}:${topicId}`;
  if (!g().discussed.includes(key)) useGame.setState({ discussed: [...g().discussed, key] });
  if (lines[0]?.by !== 'player') lines = [{ by: 'player', text: topic.label }, ...lines];
  useGame.setState({ conversation: { ...c, queue: lines, index: 0, mode: 'lines', then: 'hub', topic: topicId, noted: [] } });
  speakEffects(lines[0]);
  bump();
}

export function openPresent() {
  const c = g().conversation;
  if (c) useGame.setState({ conversation: { ...c, mode: 'present' } });
  audio.play('paper');
}

export function cancelPresent() {
  const c = g().conversation;
  if (c) useGame.setState({ conversation: { ...c, mode: 'hub' } });
}

export function present(evidenceId: string) {
  const c = g().conversation;
  if (!c) return;
  const s = g();
  if (!s.evidence[evidenceId]) return; // can't present what you haven't found
  const script = SCRIPTS[c.npc];
  const snap = snapshot();
  const exposed = exposedByPresenting(c.npc, evidenceId, snap);
  const r = react(script, evidenceId, snap);
  const ev = EVIDENCE_BY_ID[evidenceId];
  const lines: Line[] = [{ by: 'player', text: `Take a look at this. ${ev.name}.` }, ...r.lines];
  // record that it was shown
  const st = s.evidence[evidenceId];
  if (!st.presentedTo.includes(c.npc)) useGame.setState({ evidence: { ...s.evidence, [evidenceId]: { ...st, presentedTo: [...st.presentedTo, c.npc] } } });
  useGame.setState({ conversation: { ...c, queue: lines, index: 0, mode: 'lines', then: 'hub', reaction: r.kind, noted: [] } });
  speakEffects(lines[0]);
  for (const x of exposed) markContradiction(x.id, `presenting ${ev.id} to ${nameOf(c.npc)}`);
  bump();
}

export function noteTell(idx: number) {
  const c = g().conversation;
  if (!c) return;
  const line = c.queue[idx];
  if (!line?.tell || c.noted.includes(idx)) return;
  g().addNote('behaviour', line.tell, undefined, { who: c.npc });
  useGame.setState({ conversation: { ...c, noted: [...c.noted, idx] } });
  audio.play('pencil');
}

export function endConversation() {
  const c = g().conversation;
  if (c) {
    const rt = npcRt[c.npc];
    if (rt) {
      rt.talking = false;
      rt.gesture = null;
      rt.mood = 'neutral';
    }
  }
  useGame.setState({ conversation: null, overlay: 'none' });
}

/** Say goodbye properly (plays the character's farewell line first). */
export function leaveConversation() {
  const c = g().conversation;
  if (!c) return;
  const fw = SCRIPTS[c.npc].farewell;
  useGame.setState({ conversation: { ...c, queue: [{ by: 'player', text: 'That’s all for now.' }, ...fw], index: 0, mode: 'lines', then: 'end', noted: [] } });
  speakEffects(fw[0]);
}

// ───────────────────────── Observation ─────────────────────────

export function observe(npc: string) {
  const def = NPC_BY_ID[npc];
  const { post } = postFor(def, snapshot().act, g().playSeconds);
  const rt = npcRt[npc];
  const text = rt && rt.path.length ? `${def.short} is walking somewhere with purpose, not looking at anyone.` : post.observe;
  useGame.setState({ observing: { npc, text } });
}

export function recordObservation() {
  const o = g().observing;
  if (!o) return;
  g().addNote('behaviour', o.text, undefined, { who: o.npc });
  g().toast(`Notebook: observation of ${nameOf(o.npc)}`, 'note');
  audio.play('pencil');
  useGame.setState({ observing: null });
}

// ───────────────────────── Contradictions ─────────────────────────

export function markContradiction(id: string, via?: string): boolean {
  const s = g();
  if (s.contradictions[id]) return false;
  const def = CONTRADICTION_BY_ID[id];
  useGame.setState({ contradictions: { ...s.contradictions, [id]: { at: gameClock(s.playSeconds), ts: Date.now(), via } } });
  const claim = STATEMENT_BY_ID[def.claim];
  g().addNote('contradiction', `Contradiction — “${def.title}”. ${def.tension}`, undefined, { who: claim.by, refs: [id, claim.id] });
  g().toast(`Contradiction recorded: ${def.title} — you can now challenge ${nameOf(def.challenge)}.`, 'evidence');
  audio.play('discover');
  bump();
  return true;
}

export function tryCompare(statementId: string, against: Source): CompareResult {
  const r = compare(statementId, against, snapshot());
  if (r.ok) markContradiction(r.id, 'the notebook');
  else audio.play('pencil');
  return r;
}

// ───────────────────────── Hints ─────────────────────────

export function currentHint() {
  const snap = snapshot();
  return HINTS.find((h) => check(h.when, snap) && !check(h.done, snap)) ?? HINTS[HINTS.length - 1];
}

/** Each request goes one level deeper on the current lead. */
export function takeHint(): string {
  const h = currentHint();
  const used = g().hintsUsed[h.id] ?? 0;
  const level = Math.min(2, used);
  useGame.setState({ hintsUsed: { ...g().hintsUsed, [h.id]: Math.min(3, used + 1) } });
  const prefix = level === 0 ? '' : level === 1 ? 'Very well — a little more. ' : 'All right. Plainly, then. ';
  return prefix + h.levels[level];
}

// ───────────────────────── Memories ─────────────────────────

export function startMemory(id: string) {
  if (!MEMORY_BY_ID[id]) return;
  if (document.pointerLockElement) document.exitPointerLock();
  useGame.setState({ flashback: { id, index: -1 }, overlay: 'flashback', inspecting: null });
  audio.play('discover');
}

export function advanceMemory() {
  const f = g().flashback;
  if (!f) return;
  const m = MEMORY_BY_ID[f.id];
  if (f.index + 1 < m.lines.length) {
    useGame.setState({ flashback: { ...f, index: f.index + 1 } });
    return;
  }
  endMemory();
}

export function endMemory() {
  const f = g().flashback;
  if (!f) return;
  const m = MEMORY_BY_ID[f.id];
  if (!g().memories.includes(m.id)) {
    useGame.setState({ memories: [...g().memories, m.id] });
    g().addNote('memory', `Memory — “${m.title}” (${m.when}).`, undefined, { refs: [m.id] });
    applyEffects(m.effects);
  }
  useGame.setState({ flashback: null, overlay: 'none' });
}

// ───────────────────────── Notebook annotations ─────────────────────────

export function setRelNote(id: string, text: string) {
  useGame.setState({ relNotes: { ...g().relNotes, [id]: text } });
  bump();
}

export function toggleRelMark(id: string) {
  const m = g().relMarked;
  useGame.setState({ relMarked: m.includes(id) ? m.filter((x) => x !== id) : [...m, id] });
  bump();
}

export function setPersonNote(id: string, text: string) {
  useGame.setState({ personNotes: { ...g().personNotes, [id]: text } });
  bump();
}

export const EMPTY_MOTIVE: MotiveRecord = { category: null, supporting: [], contradicting: [], related: [], confidence: 0, questions: '' };

export function updateMotive(id: string, patch: Partial<MotiveRecord>) {
  const cur = g().motives[id] ?? EMPTY_MOTIVE;
  useGame.setState({ motives: { ...g().motives, [id]: { ...cur, ...patch } } });
  bump();
}

export function addAssumption(text: string) {
  if (!text.trim()) return;
  g().addNote('assumption', text.trim());
  audio.play('pencil');
}

/** Opening the family tree reveals what is written on it. */
export function openFamilyTree() {
  const s = g();
  const tree = Object.values(REL_BY_ID).filter((r) => r.onTree && !s.relationships.includes(r.id)).map((r) => r.id);
  if (tree.length) useGame.setState({ relationships: [...s.relationships, ...tree] });
  useGame.setState({ overlay: 'relations' });
  bump();
}

// Debug & test hook
if (typeof window !== 'undefined') {
  const w = window as unknown as { __KO__?: Record<string, unknown> };
  w.__KO__ = { ...(w.__KO__ ?? {}), npcRt, story: { snapshot, takeHint, markContradiction } };
}
