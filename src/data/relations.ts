/** Family tree, discoverable relationships, motives, memories and Blanc's hints. */
import type { Cond, Effect, MotiveCategory } from '../systems/conditions';

// ───────────────────────── Relationships ─────────────────────────

export type RelKind = 'family' | 'marriage' | 'conflict' | 'financial' | 'affection' | 'secret' | 'professional';

export const REL_LABEL: Record<RelKind, string> = {
  family: 'Family',
  marriage: 'Marriage',
  conflict: 'Conflict',
  financial: 'Money',
  affection: 'Affection',
  secret: 'Secret',
  professional: 'Business',
};

export interface Relationship {
  id: string;
  a: string;
  b: string;
  kind: RelKind;
  label: string;
  /** Printed on the family-tree document from the start. */
  onTree?: boolean;
}

export const RELATIONSHIPS: Relationship[] = [
  { id: 'R-wanetta-harlan', a: 'wanetta', b: 'harlan', kind: 'family', label: 'Mother and son', onTree: true },
  { id: 'R-harlan-linda', a: 'harlan', b: 'linda', kind: 'family', label: 'Father and eldest daughter', onTree: true },
  { id: 'R-harlan-walt', a: 'harlan', b: 'walt', kind: 'family', label: 'Father and youngest son', onTree: true },
  { id: 'R-harlan-neil', a: 'harlan', b: 'neil', kind: 'family', label: 'Father and son (Neil, deceased)', onTree: true },
  { id: 'R-linda-richard', a: 'linda', b: 'richard', kind: 'marriage', label: 'Married', onTree: true },
  { id: 'R-neil-joni', a: 'neil', b: 'joni', kind: 'marriage', label: 'Widowed', onTree: true },
  { id: 'R-linda-ransom', a: 'linda', b: 'ransom', kind: 'family', label: 'Mother and son', onTree: true },
  { id: 'R-joni-meg', a: 'joni', b: 'meg', kind: 'family', label: 'Mother and daughter', onTree: true },
  // discovered
  { id: 'R-harlan-ransom-conflict', a: 'harlan', b: 'ransom', kind: 'conflict', label: 'A shouting match in the study on the night of the party' },
  { id: 'R-harlan-walt-business', a: 'harlan', b: 'walt', kind: 'professional', label: 'Harlan dismissed Walt from the publishing house' },
  { id: 'R-harlan-joni-money', a: 'harlan', b: 'joni', kind: 'financial', label: 'Harlan paid Joni an allowance — and stopped it' },
  { id: 'R-harlan-linda-loan', a: 'harlan', b: 'linda', kind: 'financial', label: 'A million-dollar loan behind the “self-made” company' },
  { id: 'R-richard-linda-secret', a: 'richard', b: 'linda', kind: 'secret', label: 'Richard is hiding an affair from Linda' },
  { id: 'R-harlan-richard-conflict', a: 'harlan', b: 'richard', kind: 'conflict', label: 'Harlan knew about the affair and set a deadline' },
  { id: 'R-harlan-marta-trust', a: 'harlan', b: 'marta', kind: 'affection', label: 'Close friends — Go partners, confidants' },
  { id: 'R-harlan-marta-secret', a: 'harlan', b: 'marta', kind: 'secret', label: 'Harlan asked Marta to leave by the window — why?' },
  { id: 'R-meg-marta-friend', a: 'meg', b: 'marta', kind: 'affection', label: 'Friends; Meg confides in Marta' },
  { id: 'R-joni-meg-money', a: 'joni', b: 'meg', kind: 'financial', label: 'Tuition paid twice — once by Harlan, once “by” Joni' },
  { id: 'R-linda-ransom-conflict', a: 'linda', b: 'ransom', kind: 'conflict', label: 'The black sheep: Ransom against the family' },
];

export const REL_BY_ID: Record<string, Relationship> = Object.fromEntries(RELATIONSHIPS.map((r) => [r.id, r]));

/** Positions on the family-tree document (percent of the sheet). */
export const TREE_NODES: Record<string, { x: number; y: number; name: string; note?: string }> = {
  wanetta: { x: 50, y: 8, name: 'Wanetta' },
  harlan: { x: 50, y: 28, name: 'Harlan' },
  linda: { x: 20, y: 50, name: 'Linda' },
  richard: { x: 6, y: 50, name: 'Richard' },
  walt: { x: 50, y: 50, name: 'Walt' },
  neil: { x: 76, y: 50, name: 'Neil', note: 'd.' },
  joni: { x: 92, y: 50, name: 'Joni' },
  ransom: { x: 13, y: 76, name: 'Ransom' },
  meg: { x: 84, y: 76, name: 'Meg' },
  marta: { x: 68, y: 88, name: 'Marta', note: 'nurse' },
};

// ───────────────────────── Motives ─────────────────────────

export interface MotiveLead {
  id: string;
  character: string;
  category: MotiveCategory;
  text: string;
}

export const MOTIVE_LEADS: MotiveLead[] = [
  { id: 'ransom:inheritance', character: 'ransom', category: 'inheritance', text: 'If the new will cut Ransom out, he stood to lose everything he’d been counting on.' },
  { id: 'ransom:family', character: 'ransom', category: 'family', text: 'The family’s black sheep; he and his grandfather fought on the night.' },
  { id: 'linda:reputation', character: 'linda', category: 'reputation', text: 'Her “self-made” story rests on a loan from her father.' },
  { id: 'linda:inheritance', character: 'linda', category: 'inheritance', text: 'Eldest daughter, expecting the house.' },
  { id: 'walt:career', character: 'walt', category: 'career', text: 'Dismissed from the publishing house he has run for twenty years.' },
  { id: 'walt:business', character: 'walt', category: 'business', text: 'Wanted the film and TV rights to his father’s books; Harlan refused.' },
  { id: 'joni:money', character: 'joni', category: 'money', text: 'Her allowance was stopped the night Harlan died.' },
  { id: 'meg:money', character: 'meg', category: 'money', text: 'Her schooling depends on the family money — and on her mother’s honesty.' },
  { id: 'meg:loyalty', character: 'meg', category: 'loyalty', text: 'Fiercely protective of Marta.' },
  { id: 'richard:secret', character: 'richard', category: 'secret', text: 'Harlan knew about Richard’s affair and gave him a deadline to confess.' },
  { id: 'richard:reputation', character: 'richard', category: 'reputation', text: 'A marriage — and the comfortable life that comes with it — at risk.' },
  { id: 'marta:loyalty', character: 'marta', category: 'loyalty', text: 'Devoted to Harlan; would do what he asked, even something strange.' },
  { id: 'marta:inheritance', character: 'marta', category: 'inheritance', text: 'Harlan’s hidden note was addressed to her, not to his children. Why?' },
];

// ───────────────────────── Memories ─────────────────────────

export interface MemoryActor {
  who: 'harlan' | string;
  x: number;
  z: number;
  level: 0 | 1 | -1;
  face: number;
  pose: 'stand' | 'sit' | 'arms-crossed' | 'hands-behind' | 'lean';
}

export interface MemoryLine {
  who: string;
  text: string;
  mood?: 'neutral' | 'warm' | 'amused' | 'angry' | 'sad' | 'defensive' | 'irritated' | 'thoughtful' | 'surprised' | 'smug';
}

export interface Memory {
  id: string;
  title: string;
  when: string;
  /** The interactable that can stir this memory. */
  trigger: string;
  actors: MemoryActor[];
  camera: { pos: [number, number, number]; look: [number, number, number] };
  lines: MemoryLine[];
  effects: Effect[];
}

const PI = Math.PI;

export const MEMORIES: Memory[] = [
  {
    id: 'M-go',
    title: 'The last game',
    when: 'The night of the party · 23:05 · The study',
    trigger: 'go-board',
    actors: [
      { who: 'harlan', x: -9.5, z: -4.85, level: 0, face: 0, pose: 'sit' },
      { who: 'marta', x: -9.5, z: -3.15, level: 0, face: PI, pose: 'sit' },
    ],
    camera: { pos: [-7.3, 1.55, -5.2], look: [-9.5, 0.95, -4.0] },
    lines: [
      { who: 'harlan', text: 'You’re hesitating. You never hesitate.', mood: 'amused' },
      { who: 'marta', text: 'I’m being kind. You’ve already lost the corner.', mood: 'warm' },
      { who: 'harlan', text: 'Kindness is a terrible strategy, my dear. Which is why it so often wins.', mood: 'warm' },
      { who: 'harlan', text: 'Promise me something. Whatever the family says after I’m gone — you don’t let them make you small.', mood: 'thoughtful' },
      { who: 'marta', text: 'Don’t talk like that. Play.', mood: 'sad' },
    ],
    effects: [{ relationship: 'R-harlan-marta-trust' }, { note: 'Memory — the last game of Go. Harlan spoke as if he expected trouble from the family once he was gone.' }],
  },
  {
    id: 'M-record',
    title: 'Dictation',
    when: 'A week before the party · The sitting room',
    trigger: 'record-player',
    actors: [{ who: 'harlan', x: -9.6, z: 0.9, level: 1, face: 0, pose: 'sit' }],
    camera: { pos: [-11.8, 6.0, -1.2], look: [-9.6, 5.3, 1.1] },
    lines: [
      { who: 'harlan', text: 'Note for the publisher. Recording. Ahem.', mood: 'thoughtful' },
      { who: 'harlan', text: 'Walter. Effective the first of the month you are relieved as head of the house. It isn’t a punishment. It’s a parachute.', mood: 'neutral' },
      { who: 'harlan', text: 'You have spent twenty years selling my books. It’s time you went and wrote your own life.', mood: 'warm' },
      { who: 'harlan', text: '…And no, you may not have the television rights. End recording.', mood: 'amused' },
    ],
    effects: [{ relationship: 'R-harlan-walt-business' }, { motive: { character: 'walt', category: 'career' } }, { note: 'Memory — Harlan recorded Walt’s dismissal a week before the party.' }],
  },
  {
    id: 'M-argument',
    title: 'The seating plan',
    when: 'The night of the party · 20:40 · The dining room',
    trigger: 'seating-card',
    actors: [
      { who: 'harlan', x: 7.6, z: -5.7, level: 0, face: PI / 2, pose: 'stand' },
      { who: 'ransom', x: 9.3, z: -6.3, level: 0, face: -PI / 2 - 0.3, pose: 'arms-crossed' },
    ],
    camera: { pos: [11.4, 1.65, -6.2], look: [8.3, 1.45, -5.9] },
    lines: [
      { who: 'ransom', text: 'You’ve moved me to the kids’ end. Subtle, Grandpa.', mood: 'smug' },
      { who: 'harlan', text: 'I’ve moved you to where I can’t see your face while I eat. We will speak in the study. Now.', mood: 'angry' },
      { who: 'ransom', text: 'Whatever this is, you can say it here.', mood: 'irritated' },
      { who: 'harlan', text: 'Not in front of your mother. Some kindnesses I still owe her.', mood: 'angry' },
    ],
    effects: [{ relationship: 'R-harlan-ransom-conflict' }, { motive: { character: 'ransom', category: 'family' } }, { note: 'Memory — before dinner Harlan summoned Ransom to the study, furious.' }],
  },
  {
    id: 'M-loan',
    title: 'The cheque',
    when: 'Many years ago · The study',
    trigger: 'photo-album',
    actors: [
      { who: 'harlan', x: -14.1, z: -4, level: 0, face: PI / 2, pose: 'sit' },
      { who: 'linda', x: -11.8, z: -4.3, level: 0, face: -PI / 2, pose: 'stand' },
    ],
    camera: { pos: [-11.2, 1.6, -1.6], look: [-13.0, 1.2, -4.1] },
    lines: [
      { who: 'harlan', text: 'One million dollars. Spell your company’s name for me; I always get it wrong.', mood: 'amused' },
      { who: 'linda', text: 'It’s a loan, Dad. I’m paying back every cent.', mood: 'defensive' },
      { who: 'harlan', text: 'I know you will. I also know you’ll tell everyone you started with nothing. Both can be true for a while.', mood: 'warm' },
    ],
    effects: [{ relationship: 'R-harlan-linda-loan' }, { motive: { character: 'linda', category: 'reputation' } }, { note: 'Memory — Harlan lent Linda a million dollars to start her company.' }],
  },
  {
    id: 'M-letter',
    title: 'A deadline',
    when: 'Three days before the party · The hall',
    trigger: 'richard-letter',
    actors: [
      { who: 'harlan', x: -1.4, z: 7.4, level: 0, face: PI / 2, pose: 'hands-behind' },
      { who: 'richard', x: 0.9, z: 7.1, level: 0, face: -PI / 2, pose: 'stand' },
    ],
    camera: { pos: [-0.2, 1.65, 9.6], look: [-0.2, 1.45, 7.2] },
    lines: [
      { who: 'richard', text: 'Harlan, it was nothing. A mistake. It’s over.', mood: 'defensive' },
      { who: 'harlan', text: 'Then it will be easy to say to Linda. You have until the end of the week.', mood: 'neutral' },
      { who: 'richard', text: 'And if I don’t?', mood: 'irritated' },
      { who: 'harlan', text: 'Then I will. And I write better than you talk.', mood: 'angry' },
    ],
    effects: [{ relationship: 'R-harlan-richard-conflict' }, { relationship: 'R-richard-linda-secret' }, { motive: { character: 'richard', category: 'secret' } }, { note: 'Memory — Harlan gave Richard until the end of the week to confess to Linda.' }],
  },
];

export const MEMORY_BY_ID: Record<string, Memory> = Object.fromEntries(MEMORIES.map((m) => [m.id, m]));
export const MEMORY_BY_TRIGGER: Record<string, Memory> = Object.fromEntries(MEMORIES.map((m) => [m.trigger, m]));

// ───────────────────────── Blanc's hints ─────────────────────────

export interface Hint {
  id: string;
  /** Relevant now. */
  when: Cond;
  /** Already resolved. */
  done: Cond;
  levels: [string, string, string];
}

export const HINTS: Hint[] = [
  {
    id: 'H-study',
    when: {},
    done: { visited: 'study' },
    levels: [
      'Every house has a heart, and this one stopped beating in a particular room.',
      'Harlan’s study is on the ground floor, off the living room and the staircase. I have not touched a thing in there for you.',
      'Go to the study. Begin with the desk drawer, then look at what lies on the rug beside the daybed.',
    ],
  },
  {
    id: 'H-letter',
    when: { visited: 'study' },
    done: { milestone: 'read-attorney-letter' },
    levels: [
      'A man who writes mysteries keeps his secrets on paper. And paper wants a drawer.',
      'Harlan’s desk in the study. Correspondence, my friend — legal correspondence.',
      'Open the drawer of Harlan’s desk and read the letter from his attorney. Read the last paragraph twice.',
    ],
  },
  {
    id: 'H-talk',
    when: {},
    done: { any: [{ heard: 'S-meg-shouting' }, { heard: 'S-ransom-civil' }] },
    levels: [
      'Houses talk, but families talk louder. You will learn more from the living than from the furniture tonight.',
      'The young ones notice things the adults would rather they didn’t. Meg was upstairs, near the landing.',
      'Ask Meg about the evening, and ask Ransom about his conversation with his grandfather. Then put the two side by side.',
    ],
  },
  {
    id: 'H-compare',
    when: { any: [{ heard: 'S-ransom-civil' }, { heard: 'S-walt-business' }, { heard: 'S-joni-tuition' }, { heard: 'S-richard-close' }] },
    done: { minContradictions: 1 },
    levels: [
      'People are generous with their accounts. Generosity is not the same thing as accuracy.',
      'Your notebook has a page of testimony. A red mark in the margin means a statement deserves a second look.',
      'Open the notebook’s Testimony pages, choose “Compare”, and set a statement against the evidence or account that cannot coexist with it.',
    ],
  },
  {
    id: 'H-hollow',
    when: { milestone: 'read-attorney-letter' },
    done: { milestone: 'found-hidden-compartment' },
    levels: [
      'Our attorney friend was remarkably specific about a book.',
      '“The Sleeper in the Stacks.” The library. Third shelf.',
      'In the library, on the north wall shelves, one volume is shelved upside down. Pull it out.',
    ],
  },
  {
    id: 'H-relations',
    when: { minEvidence: 2 },
    done: { milestone: 'opened-family-tree' },
    levels: [
      'To understand the knives, first understand the family that keeps them.',
      'Somebody had the family tree drawn up for the party. Look for it in the dining room.',
      'There is a framed family tree on the dining-room sideboard, and a photograph album on the living-room coffee table.',
    ],
  },
  {
    id: 'H-walt',
    when: { heard: 'S-walt-business' },
    done: { any: [{ evidence: 'EV-18' }, { memory: 'M-record' }] },
    levels: [
      'Walt speaks of the business in the present tense. Is that confidence, or habit?',
      'Harlan kept business papers where he read — the library — and recorded his letters upstairs.',
      'Look at the papers on the library’s round table, and play the record in Harlan’s private sitting room.',
    ],
  },
  {
    id: 'H-joni',
    when: { heard: 'S-joni-tuition' },
    done: { any: [{ evidence: 'EV-16' }, { heard: 'S-meg-tuition' }] },
    levels: [
      'Joni is very proud of paying for things. Pride like that usually has a receipt.',
      'Meg’s school will have sent statements. She and her mother share the Garden Room upstairs.',
      'Check the dresser in the Garden Room for a tuition statement — or ask Meg who pays her school.',
    ],
  },
  {
    id: 'H-richard',
    when: { heard: 'S-richard-close' },
    done: { evidence: 'EV-17' },
    levels: [
      '“No friction whatsoever.” Nobody has no friction with Harlan Thrombey.',
      'A man who intends to say a hard thing often writes it first. Harlan kept private letters near his bed.',
      'Search the nightstand in Harlan’s bedroom for a letter he never sent.',
    ],
  },
  {
    id: 'H-window',
    when: { any: [{ heard: 'S-marta-left' }, { heard: 'S-linda-quiet' }] },
    done: { all: [{ evidence: 'EV-07' }, { evidence: 'EV-09' }] },
    levels: [
      'Great Nana says she saw someone climbing in the night. Old women and children are so rarely believed.',
      'Look at Harlan’s bedroom window from the inside — and from the lawn beneath it.',
      'Inspect the latch on the west window of Harlan’s bedroom, then go outside to the west lawn and look at the trellis and the flowerbed.',
    ],
  },
  {
    id: 'H-storage',
    when: { milestone: 'tried-serv-storage' },
    done: { item: 'storage-key' },
    levels: ['A locked door in a house like this is an invitation, not a refusal.', 'Who keeps the keys in a great house? Not the family.', 'Fran hides things in her kitchen. Move the flour tin.'],
  },
  {
    id: 'H-done',
    when: {},
    done: { flag: 'never' },
    levels: [
      'You are doing splendidly. Keep pulling threads. Every story tonight has a hollow in the middle, and we are walking its edge.',
      'Revisit the people whose stories have changed tonight. A revised account is a door left ajar.',
      'Check your notebook’s Motives pages. Set out, for each of them, what they stood to gain — and what contradicts it.',
    ],
  },
];

// ───────────────────────── The photograph album ─────────────────────────

export interface AlbumPhoto {
  id: string;
  /** Characters whose painted likeness appears in the print. */
  people: string[];
  caption: string;
  /** What Harlan wrote on the back. */
  back: string;
  effects: Effect[];
  memory?: string;
}

export const ALBUM: AlbumPhoto[] = [
  { id: 'A-go', people: ['harlan', 'marta'], caption: 'The study, a winter afternoon', back: '“My only worthy opponent. Don’t tell the children.” — H.', effects: [{ relationship: 'R-harlan-marta-trust' }] },
  { id: 'A-office', people: ['linda', 'harlan'], caption: 'Linda’s first office — ribbon cutting', back: '“Paid for, partly. Proud of, entirely.” — H.', effects: [{ flag: 'album-loan' }], memory: 'M-loan' },
  { id: 'A-press', people: ['walt', 'harlan'], caption: 'Blood Like Wine Publishing, 20th anniversary', back: '“Twenty years. Long enough, I think.” — H.', effects: [{ motive: { character: 'walt', category: 'career' } }] },
  { id: 'A-boy', people: ['ransom', 'harlan'], caption: 'Ransom, aged eight, on Harlan’s shoulders', back: '“The sweetest boy. What happened to us?” — H.', effects: [{ note: 'Album — Harlan doted on Ransom as a boy. Something soured between them.' }] },
  { id: 'A-grad', people: ['meg', 'joni', 'harlan'], caption: 'Meg’s school prize-giving', back: '“Paying the school direct from now on, so it actually gets there.” — H.', effects: [{ flag: 'album-tuition' }, { relationship: 'R-joni-meg-money' }] },
  { id: 'A-wedding', people: ['linda', 'richard'], caption: 'Linda & Richard — the wedding', back: 'Older ink: “Congratulations.” Newer ink, pressed hard: “?”', effects: [{ note: 'Album — on the back of Linda and Richard’s wedding photo, Harlan recently added a question mark.' }] },
];
