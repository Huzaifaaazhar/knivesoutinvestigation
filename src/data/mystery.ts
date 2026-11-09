/**
 * The underlying truth of the Thrombey case, and the reasoning content that
 * tests it. This never changes with player choices.
 *
 * What happened:
 *  · A week before his 85th birthday, Harlan rewrote his will: everything to
 *    Marta. At the party he told Ransom, who was cut out. They fought.
 *  · Ransom left conspicuously before the cake — then came back. While the
 *    family ate, he swapped the contents of the two vials in Marta's bag,
 *    re-stuck the labels, and took the naloxone. If Marta killed Harlan by
 *    mistake she could not inherit.
 *  · At 23:30 Marta, working by feel, actually gave the right doses — but the
 *    labels told her she had given 100 mg of morphine. With no antidote,
 *    Harlan believed he had minutes to live.
 *  · To protect her he staged her departure: out the front at 23:40 for the
 *    camera, back up the trellis, down again through his window after being
 *    "seen" upstairs. Then he took his own life with a blade from his display.
 *  · Ransom drove off only after the rain began. When the toxicology report
 *    showed no overdose, he burned it; Fran had a copy, and the gate tape.
 */
import type { Cond } from '../systems/conditions';

export type TLStatus = 'confirmed' | 'reported' | 'unverified' | 'contradicted';

export interface TimelineEventDef {
  id: string;
  label: string;
  /** Time printed on the card, only when the evidence actually fixes it. */
  time?: string;
  /** Minutes after 19:00, for internal ordering checks (only for fixed times). */
  minutes?: number;
  /** The card exists only once the player has found the basis for it. */
  discovered: Cond;
  confirmedBy?: Cond;
  contradictedBy?: Cond;
  /** What the card says it rests on. */
  basis: string;
}

export const TIMELINE_EVENTS: TimelineEventDef[] = [
  { id: 'T-party', label: 'The birthday party begins', time: '19:30', minutes: 30, discovered: {}, confirmedBy: {}, basis: 'Case file' },
  { id: 'T-seating', label: 'Harlan moves Ransom to the end of the table', time: '20:40', minutes: 100, discovered: { any: [{ evidence: 'EV-10' }, { memory: 'M-argument' }] }, confirmedBy: { evidence: 'EV-10' }, basis: 'Seating card; memory' },
  { id: 'T-argument', label: 'Harlan and Ransom shout in the study', discovered: { any: [{ heard: 'S-meg-shouting' }, { heard: 'S-ransom-argued' }] }, confirmedBy: { all: [{ heard: 'S-meg-shouting' }, { heard: 'S-ransom-argued' }] }, basis: 'Meg’s account; Ransom’s admission' },
  { id: 'T-coat', label: 'Ransom is photographed in his coat, before the cake', time: '≈21:05', minutes: 125, discovered: { evidence: 'EV-13' }, confirmedBy: { evidence: 'EV-13' }, basis: 'Joni’s Polaroid' },
  { id: 'T-swap', label: 'Someone swaps the vials and re-sticks their labels', discovered: { detail: 'medbag:labels' }, confirmedBy: { all: [{ detail: 'medbag:labels' }, { evidence: 'EV-19' }] }, basis: 'The re-stuck label; Fran’s note' },
  { id: 'T-go', label: 'Harlan and Marta play their last game of Go', time: '23:00', minutes: 240, discovered: { any: [{ heard: 'S-marta-go' }, { memory: 'M-go' }] }, confirmedBy: { evidence: 'EV-03' }, basis: 'Marta; the abandoned board' },
  { id: 'T-tape', label: 'Gate tape 23 ends; tape 24 later goes missing', time: '23:00', minutes: 240, discovered: { evidence: 'EV-12' }, confirmedBy: { evidence: 'EV-12' }, basis: 'Tape log' },
  { id: 'T-meds', label: 'Marta gives Harlan his nightly medication', time: '23:30', minutes: 270, discovered: { any: [{ heard: 'S-marta-meds' }, { heard: 'S-marta-left' }] }, confirmedBy: { evidence: 'EV-19' }, basis: 'Marta; toxicology' },
  { id: 'T-rain', label: 'The rain begins', time: '≈23:30', minutes: 271, discovered: { heard: 'S-meg-rain' }, basis: 'Meg' },
  { id: 'T-front', label: 'Marta drives away by the front gate', time: '23:40', minutes: 280, discovered: { heard: 'S-marta-left' }, contradictedBy: { contradiction: 'C-marta-door' }, basis: 'Marta’s first account' },
  { id: 'T-car', label: 'A wide-tyred car tears out of the service drive', discovered: { evidence: 'EV-15' }, confirmedBy: { all: [{ evidence: 'EV-15' }, { heard: 'S-ransom-stayed' }] }, basis: 'Tyre ruts, cut after the rain began' },
  { id: 'T-window', label: 'Someone climbs down the trellis from Harlan’s window', discovered: { any: [{ evidence: 'EV-07' }, { evidence: 'EV-09' }] }, confirmedBy: { all: [{ evidence: 'EV-07' }, { heard: 'S-marta-window' }] }, basis: 'Trellis, latch, footprint' },
  { id: 'T-death', label: 'Harlan dies in his study', time: '≈00:30', minutes: 330, discovered: {}, confirmedBy: { detail: 'grandfather-clock:face' }, basis: 'Case file; the hall clock' },
  { id: 'T-burn', label: 'The toxicology report is burned in the living-room fire', time: 'days later', minutes: 4000, discovered: { evidence: 'EV-06' }, confirmedBy: { all: [{ evidence: 'EV-06' }, { evidence: 'EV-19' }] }, basis: 'Charred fragment; Fran’s copy' },
];

export const TL_BY_ID: Record<string, TimelineEventDef> = Object.fromEntries(TIMELINE_EVENTS.map((e) => [e.id, e]));

/** "a happened before b" — the truth the reconstruction is checked against. */
export const TIMELINE_ORDER: [string, string][] = [
  ['T-party', 'T-seating'],
  ['T-seating', 'T-argument'],
  ['T-argument', 'T-coat'],
  ['T-coat', 'T-swap'],
  ['T-swap', 'T-meds'],
  ['T-go', 'T-meds'],
  ['T-meds', 'T-front'],
  ['T-rain', 'T-car'],
  ['T-meds', 'T-window'],
  ['T-front', 'T-window'],
  ['T-window', 'T-death'],
  ['T-car', 'T-burn'],
  ['T-death', 'T-burn'],
];

/** Cards that must be placed (and correctly ordered) to solve "The Final Evening". */
export const TIMELINE_REQUIRED = ['T-argument', 'T-coat', 'T-swap', 'T-meds', 'T-window', 'T-death'];

// ───────────────────────── The final discovery ─────────────────────────

export interface TheoryCard {
  id: string;
  text: string;
  available: Cond;
  /** 1 = the truth, 0.5 = true but incomplete, 0 = wrong. */
  value: number;
}

export const THEORIES: TheoryCard[] = [
  { id: 'TH-overdose', text: 'Marta confused the vials and gave Harlan a fatal overdose of morphine.', available: {}, value: 0 },
  { id: 'TH-suicide', text: 'Harlan simply took his own life. Nobody else had any part in it.', available: {}, value: 0 },
  { id: 'TH-intruder', text: 'Someone climbed in through Harlan’s window and killed him.', available: { any: [{ evidence: 'EV-07' }, { evidence: 'EV-09' }] }, value: 0 },
  {
    id: 'TH-protect',
    text: 'Believing Marta had overdosed him, Harlan staged her exit through his window to protect her, then took his own life.',
    available: { any: [{ heard: 'S-marta-window' }, { contradiction: 'C-marta-door' }] },
    value: 0.5,
  },
  {
    id: 'TH-swap',
    text: 'The vials were swapped beforehand so Marta would be blamed. She gave the right dose by instinct — but the labels convinced them both she hadn’t, and Harlan died protecting her from a crime that never happened.',
    available: { all: [{ detail: 'medbag:labels' }, { evidence: 'EV-19' }] },
    value: 1,
  },
];

// ───────────────────────── The will ─────────────────────────

export type WillPick = 'evidence' | 'person' | 'detail' | 'relationship';

export interface WillQuestion {
  id: string;
  question: string;
  pick: WillPick;
  multi?: boolean;
  /** Correct when every one of `all` is chosen (and none of `wrong`). */
  all: string[];
  wrong?: string[];
  /** For multi answers: how many of `any` must be present. */
  any?: string[];
  anyMin?: number;
}

export const WILL_QUESTIONS: WillQuestion[] = [
  { id: 'W-exists', question: 'What proves a new will exists?', pick: 'evidence', multi: true, all: [], any: ['EV-04', 'EV-20'], anyMin: 1, wrong: ['EV-18', 'EV-17', 'EV-16'] },
  { id: 'W-benefits', question: 'Who benefits?', pick: 'person', all: ['marta'], wrong: ['linda', 'walt', 'joni', 'ransom', 'richard', 'meg'] },
  { id: 'W-authentic', question: 'Why should it be believed genuine?', pick: 'detail', multi: true, all: [], any: ['witness', 'alteration', 'seal'], anyMin: 1, wrong: ['fold'] },
  { id: 'W-knew', question: 'Who knew its contents before Harlan died?', pick: 'person', multi: true, all: ['ransom'], wrong: ['linda', 'walt', 'joni', 'richard', 'meg', 'marta'] },
  { id: 'W-harmed', question: 'Who loses by it?', pick: 'person', multi: true, all: ['ransom'], any: ['linda', 'walt', 'joni', 'richard', 'meg'], anyMin: 2, wrong: ['marta'] },
  { id: 'W-matters', question: 'Which relationship does it explain?', pick: 'relationship', all: ['R-harlan-ransom-conflict'] },
];

// ───────────────────────── Challenges ─────────────────────────

export interface ChallengeDef {
  id: string;
  title: string;
  brief: string;
}

export const CHALLENGES: ChallengeDef[] = [
  { id: 'CH-evening', title: 'The Final Evening', brief: 'Put the events of the night in order on the timeline cord. Every card you need is something you have found.' },
  { id: 'CH-motives', title: 'The Family Motives', brief: 'In the notebook, set out what each member of the family stood to gain or lose.' },
  { id: 'CH-accounts', title: 'The Contradictory Accounts', brief: 'Find the statements that cannot all be true — especially about who was where, and when.' },
  { id: 'CH-connection', title: 'The Missing Connection', brief: 'On the board, connect a physical clue to the account it breaks.' },
  { id: 'CH-will', title: 'The Will', brief: 'Unseal Harlan’s will and establish why his final decision matters.' },
];

/** Correct motive per suspect for "The Family Motives" (alternatives accepted). */
export const TRUE_MOTIVES: Record<string, string[]> = {
  ransom: ['inheritance'],
  linda: ['reputation', 'inheritance'],
  walt: ['career', 'business'],
  joni: ['money'],
  richard: ['secret', 'reputation'],
};

// ───────────────────────── The accusation ─────────────────────────

export const CULPRIT = 'ransom';
export const KEY_EVIDENCE = ['EV-02', 'EV-04', 'EV-20', 'EV-19', 'EV-06', 'EV-15', 'EV-13', 'EV-12'];
/** At least one of these shows opportunity. */
export const OPPORTUNITY_EVIDENCE = ['EV-15', 'EV-13', 'EV-02'];
export const KEY_CONTRADICTIONS = ['C-ransom-car', 'C-ransom-cake', 'C-ransom-argument'];
export const RELEVANT_CONTRADICTIONS = [...KEY_CONTRADICTIONS, 'C-marta-door'];
/** Clues the report lists as missed if they weren't found. */
export const ESSENTIAL_CLUES = ['EV-02', 'EV-20', 'EV-19', 'EV-15', 'EV-13', 'EV-07', 'EV-06'];
