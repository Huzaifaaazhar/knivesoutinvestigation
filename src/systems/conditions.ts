/**
 * The shared condition language. Dialogue topics, evidence reactions,
 * schedules, hints, relationships and contradictions all gate on these,
 * and are evaluated against a plain snapshot of the investigation so the
 * logic stays pure and unit-testable.
 */

export interface Cond {
  all?: Cond[];
  any?: Cond[];
  not?: Cond;
  /** Evidence has been logged in the folder. */
  evidence?: string;
  /** Evidence logged *and* fully examined. */
  examined?: string;
  /** A specific inspection detail has been noticed (`interactableId:hotspotId`). */
  detail?: string;
  milestone?: string;
  /** A testimony statement has been heard. */
  heard?: string;
  flag?: string;
  /** Topic already discussed (`character:topic`). */
  discussed?: string;
  contradiction?: string;
  relationship?: string;
  memory?: string;
  visited?: string;
  item?: string;
  met?: string;
  minEvidence?: number;
  minContradictions?: number;
  act?: number;
}

export interface Snapshot {
  evidence: Record<string, { fullyExamined: boolean }>;
  details: Record<string, string[]>;
  milestones: string[];
  statements: Record<string, unknown>;
  flags: string[];
  discussed: string[];
  contradictions: Record<string, unknown>;
  relationships: string[];
  memories: string[];
  visited: string[];
  inventory: string[];
  met: string[];
  act: number;
}

export function check(c: Cond | undefined, s: Snapshot): boolean {
  if (!c) return true;
  if (c.all && !c.all.every((x) => check(x, s))) return false;
  if (c.any && !c.any.some((x) => check(x, s))) return false;
  if (c.not && check(c.not, s)) return false;
  if (c.evidence && !s.evidence[c.evidence]) return false;
  if (c.examined && !s.evidence[c.examined]?.fullyExamined) return false;
  if (c.detail) {
    const [it, h] = c.detail.split(':');
    if (!s.details[it]?.includes(h)) return false;
  }
  if (c.milestone && !s.milestones.includes(c.milestone)) return false;
  if (c.heard && !s.statements[c.heard]) return false;
  if (c.flag && !s.flags.includes(c.flag)) return false;
  if (c.discussed && !s.discussed.includes(c.discussed)) return false;
  if (c.contradiction && !s.contradictions[c.contradiction]) return false;
  if (c.relationship && !s.relationships.includes(c.relationship)) return false;
  if (c.memory && !s.memories.includes(c.memory)) return false;
  if (c.visited && !s.visited.includes(c.visited)) return false;
  if (c.item && !s.inventory.includes(c.item)) return false;
  if (c.met && !s.met.includes(c.met)) return false;
  if (c.minEvidence !== undefined && Object.keys(s.evidence).length < c.minEvidence) return false;
  if (c.minContradictions !== undefined && Object.keys(s.contradictions).length < c.minContradictions) return false;
  if (c.act !== undefined && s.act < c.act) return false;
  return true;
}

/** Things a line of dialogue, an evidence reaction or a memory can cause. */
export interface Effect {
  statement?: string;
  flag?: string;
  relationship?: string;
  motive?: { character: string; category: MotiveCategory };
  contradiction?: string;
  milestone?: string;
  /** Free notebook line in the investigator's voice. */
  note?: string;
}

export type MotiveCategory = 'inheritance' | 'money' | 'family' | 'career' | 'reputation' | 'secret' | 'loyalty' | 'business';

export const MOTIVE_LABEL: Record<MotiveCategory, string> = {
  inheritance: 'Inheritance',
  money: 'Money',
  family: 'Family conflict',
  career: 'Career',
  reputation: 'Reputation',
  secret: 'Personal secret',
  loyalty: 'Loyalty',
  business: 'Family business',
};

/**
 * Investigation "act": how far the case has progressed. Drives where people
 * are in the house. It only ever rises with discoveries, never with time, so
 * nobody can become unreachable.
 */
export function computeAct(s: Pick<Snapshot, 'evidence' | 'contradictions' | 'met' | 'milestones'>): number {
  const ev = Object.keys(s.evidence).length;
  const ct = Object.keys(s.contradictions).length;
  if (ct >= 2 || ev >= 9) return 2;
  if (ev >= 3 || s.met.includes('blanc') || s.milestones.includes('read-attorney-letter')) return 1;
  return 0;
}
