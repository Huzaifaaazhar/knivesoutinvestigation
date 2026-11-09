/**
 * Contradiction engine. Compares a witness statement against another
 * statement, a piece of evidence or a recovered memory. It never volunteers
 * who is lying: the player must pick the two things that clash. It only
 * hints that a statement *deserves* a second look once both halves are known.
 */
import { check, type Snapshot } from './conditions';
import { CONTRADICTIONS, STATEMENT_BY_ID, type ContradictionDef, type Source } from '../data/testimony';

export function sourceKey(s: Source): string {
  if ('statement' in s) return `statement:${s.statement}`;
  if ('evidence' in s) return `evidence:${s.evidence}`;
  return `memory:${s.memory}`;
}

export function sourceKnown(s: Source, snap: Snapshot): boolean {
  if ('statement' in s) return !!snap.statements[s.statement];
  if ('evidence' in s) return !!snap.evidence[s.evidence];
  return snap.memories.includes(s.memory);
}

/** Contradictions whose two halves the player already holds but hasn't marked. */
export function discoverable(snap: Snapshot): ContradictionDef[] {
  return CONTRADICTIONS.filter((c) => !snap.contradictions[c.id] && snap.statements[c.claim] && c.against.some((a) => sourceKnown(a, snap)));
}

/** Statements that deserve a red margin mark in the notebook (without saying why). */
export function flaggedStatements(snap: Snapshot): Set<string> {
  const out = new Set<string>();
  for (const c of discoverable(snap)) out.add(c.claim);
  return out;
}

export type CompareResult = { ok: true; id: string } | { ok: false; reason: 'unknown' | 'no-conflict' | 'already' };

/** The player sets a statement against another source. */
export function compare(statementId: string, against: Source, snap: Snapshot): CompareResult {
  if (!snap.statements[statementId] || !sourceKnown(against, snap)) return { ok: false, reason: 'unknown' };
  const key = sourceKey(against);
  // either orientation counts: claim vs source, or source-statement vs claim
  const hit = CONTRADICTIONS.find(
    (c) =>
      (c.claim === statementId && c.against.some((a) => sourceKey(a) === key)) ||
      ('statement' in against && c.claim === against.statement && c.against.some((a) => sourceKey(a) === `statement:${statementId}`)),
  );
  if (!hit) return { ok: false, reason: 'no-conflict' };
  if (snap.contradictions[hit.id]) return { ok: false, reason: 'already' };
  return { ok: true, id: hit.id };
}

/** Contradictions that showing this evidence to this person brings into the open. */
export function exposedByPresenting(npc: string, evidenceId: string, snap: Snapshot): ContradictionDef[] {
  return CONTRADICTIONS.filter(
    (c) => !snap.contradictions[c.id] && STATEMENT_BY_ID[c.claim]?.by === npc && snap.statements[c.claim] && c.against.some((a) => 'evidence' in a && a.evidence === evidenceId),
  );
}

export type StatementStatus = 'confirmed' | 'unverified' | 'contradicted';

export function statementStatus(id: string, snap: Snapshot): StatementStatus {
  if (CONTRADICTIONS.some((c) => c.claim === id && snap.contradictions[c.id])) return 'contradicted';
  const st = STATEMENT_BY_ID[id];
  if (st?.confirmedBy && check(st.confirmedBy, snap)) return 'confirmed';
  return 'unverified';
}
