/**
 * Dialogue engine: typed scripts with conditional topics and evidence
 * reactions. Pure functions over a Snapshot — presentation lives in
 * ui/Conversation.tsx, content lives in data/dialogue/*.
 */
import { check, type Cond, type Effect, type Snapshot } from './conditions';

export type Mood =
  | 'neutral'
  | 'warm'
  | 'amused'
  | 'smug'
  | 'irritated'
  | 'angry'
  | 'nervous'
  | 'sad'
  | 'surprised'
  | 'defensive'
  | 'sick'
  | 'thoughtful';

export type Gesture =
  | 'nod'
  | 'shake'
  | 'shrug'
  | 'point'
  | 'cross-arms'
  | 'hand-chest'
  | 'wave-off'
  | 'look-away'
  | 'lean-in'
  | 'hand-mouth'
  | 'spread-hands'
  | 'adjust-glasses'
  | 'step-back';

export interface Line {
  by: 'npc' | 'player';
  text: string;
  mood?: Mood;
  gesture?: Gesture;
  /** Body language the player can choose to write down. */
  tell?: string;
  effects?: Effect[];
  /** Text computed at runtime (e.g. where everyone is). */
  dynamic?: 'whereabouts' | 'hint';
}

export type TopicKind = 'harlan' | 'family' | 'evening' | 'room' | 'relationship' | 'document' | 'event' | 'challenge' | 'hint' | 'small';

export const TOPIC_KIND_LABEL: Record<TopicKind, string> = {
  harlan: 'Harlan',
  family: 'Family',
  evening: 'The evening',
  room: 'The house',
  relationship: 'Relationship',
  document: 'Document',
  event: 'Event',
  challenge: 'Challenge',
  hint: 'Advice',
  small: 'Aside',
};

export interface Topic {
  id: string;
  /** The player's line, as it appears in the choice panel. Keep it short. */
  label: string;
  kind: TopicKind;
  requires?: Cond;
  /** Hide once this holds (e.g. superseded by a better question). */
  hideWhen?: Cond;
  lines: Line[];
  /** First matching variant replaces `lines`. */
  variants?: { when: Cond; lines: Line[] }[];
  /** Short reply when asked again. */
  again?: Line[];
}

export type ReactionKind = 'acknowledge' | 'surprise' | 'defensive' | 'denial' | 'explain' | 'revise' | 'refuse';

export interface Reaction {
  evidence: string;
  when?: Cond;
  kind: ReactionKind;
  lines: Line[];
  /** Only reacts fully if the evidence has been examined in detail. */
  needsExamined?: boolean;
}

export interface Script {
  id: string;
  greetings: { when?: Cond; lines: Line[] }[];
  unwilling?: Line[];
  occupied: Line[];
  topics: Topic[];
  reactions: Reaction[];
  /** Character-specific responses to irrelevant evidence (rotated, never one stock line). */
  fallback: Line[][];
  /** When shown something the player has barely looked at. */
  unexamined: Line[];
  farewell: Line[];
}

export function greeting(script: Script, s: Snapshot): Line[] {
  for (const g of script.greetings) if (check(g.when, s)) return g.lines;
  return script.greetings[script.greetings.length - 1].lines;
}

export function availableTopics(script: Script, s: Snapshot): Topic[] {
  return script.topics.filter((t) => check(t.requires, s) && !(t.hideWhen && check(t.hideWhen, s)));
}

export function topicLines(script: Script, topic: Topic, s: Snapshot): Line[] {
  const key = `${script.id}:${topic.id}`;
  if (s.discussed.includes(key) && topic.again) return topic.again;
  for (const v of topic.variants ?? []) if (check(v.when, s)) return v.lines;
  return topic.lines;
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** How a character responds to being shown a piece of evidence. */
export function react(script: Script, evidenceId: string, s: Snapshot): { kind: ReactionKind; lines: Line[] } {
  for (const r of script.reactions) {
    if (r.evidence !== evidenceId || !check(r.when, s)) continue;
    if (r.needsExamined && !s.evidence[evidenceId]?.fullyExamined) return { kind: 'acknowledge', lines: script.unexamined };
    return { kind: r.kind, lines: r.lines };
  }
  const pool = script.fallback;
  return { kind: 'acknowledge', lines: pool[hash(evidenceId + script.id) % pool.length] };
}

/** Collects every effect in a run of lines. */
export function effectsOf(lines: Line[]): Effect[] {
  return lines.flatMap((l) => l.effects ?? []);
}
