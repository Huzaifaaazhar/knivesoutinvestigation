/**
 * Everything the player can examine. Positions are world coordinates.
 * `visual` keys are resolved by world/props/registry.tsx; the same visual is
 * rendered in the mansion and in the inspection view, so what you inspect is
 * literally the object you walked up to.
 */
import type { Level } from './layout';

export type VisualKey =
  | 'planSheet'
  | 'portrait'
  | 'clock'
  | 'knifeWheel'
  | 'ashGrate'
  | 'decanter'
  | 'medbag'
  | 'goBoard'
  | 'dagger'
  | 'daybed'
  | 'typewriter'
  | 'letter'
  | 'hollowBook'
  | 'globe'
  | 'placeCard'
  | 'cake'
  | 'flourTin'
  | 'mug'
  | 'boots'
  | 'orchid'
  | 'car'
  | 'workbench'
  | 'armchair'
  | 'pillbox'
  | 'photoFrame'
  | 'recordPlayer'
  | 'crystals'
  | 'fuseBox'
  | 'logbook'
  | 'trunk'
  | 'rockingHorse'
  | 'trellis'
  | 'footprint'
  | 'tyreMarks'
  | 'plaque'
  | 'fountain'
  | 'latch'
  | 'treeFrame'
  | 'album'
  | 'willEnvelope'
  | 'corkboard';

export interface Hotspot {
  id: string;
  label: string;
  detail: string;
  /** Local position on the visual (3D inspection) — ignored for documents. */
  at?: [number, number, number];
  /** Counts toward "fully examined". */
  key?: boolean;
}

export interface DocumentDef {
  paper: 'letter' | 'card' | 'ledger' | 'note' | 'photo' | 'burnt' | 'will';
  heading?: string;
  /** Paragraphs. Inline hotspots use the markup [[hotspotId|visible text]]. */
  body: string[];
  signature?: string;
  date?: string;
  /** Free-floating hotspots drawn over the paper (percent coordinates). */
  marks?: { id: string; x: number; y: number; w: number; h: number; kind: 'stain' | 'tear' | 'stamp' | 'fold' }[];
}

export interface InteractableDef {
  id: string;
  name: string;
  room: string;
  level: Level;
  /** Focus point used for targeting and prompt anchoring. */
  pos: [number, number, number];
  verb: string;
  kind: 'inspect' | 'document' | 'observe' | 'portrait' | 'pickup' | 'relations' | 'album' | 'will' | 'wall';
  /** Placement of a visual in the world (omit when the object is part of the furniture). */
  model?: { visual: VisualKey; pos: [number, number, number]; rotY?: number; props?: Record<string, unknown> };
  /** Visual used in the inspection view, if different from the world model. */
  inspectVisual?: { visual: VisualKey; props?: Record<string, unknown>; distance?: number };
  evidence?: string;
  /** Recorded in the notebook the first time it is examined. */
  observation: string;
  hotspots?: Hotspot[];
  document?: DocumentDef;
  /** Only interactable once this milestone has been reached. */
  requires?: string;
  grants?: { item?: string; milestone?: string; character?: string; map?: boolean };
  range?: number;
  /** Collision footprint (w, d) centred on model.pos. */
  block?: [number, number];
}

const U = 4.4; // upper floor height
const B = -3.6; // lower floor height

const portrait = (
  id: string,
  character: string,
  name: string,
  room: string,
  level: Level,
  x: number,
  y: number,
  z: number,
  rotY: number,
  observation: string,
  size: [number, number] = [1.0, 1.3],
): InteractableDef => ({
  id,
  name,
  room,
  level,
  pos: [x + Math.sin(rotY) * 0.1, y, z + Math.cos(rotY) * 0.1],
  verb: 'Study',
  kind: 'portrait',
  model: { visual: 'portrait', pos: [x, y, z], rotY, props: { character, w: size[0], h: size[1] } },
  observation,
  grants: { character },
  range: 3.2,
  hotspots: [
    { id: 'face', label: 'The face', detail: observation, at: [0, 0.15, 0.06], key: true },
    { id: 'plaque', label: 'Brass plaque', detail: `Engraved: ${name.replace('Portrait of ', '').toUpperCase()}.`, at: [0, -size[1] / 2 - 0.02, 0.08] },
  ],
});

export const INTERACTABLES: InteractableDef[] = [
  // ───────────── Entrance hall ─────────────
  {
    id: 'estate-plan',
    name: 'Printed Estate Plan',
    room: 'hall',
    level: 0,
    pos: [3.6, 0.95, 3.5],
    verb: 'Take',
    kind: 'pickup',
    model: { visual: 'planSheet', pos: [3.62, 0.865, 3.5], rotY: -Math.PI / 2 },
    observation: 'A floor plan printed for the party caterers. Folded into the back of the notebook — press M to consult it.',
    grants: { map: true, milestone: 'found-plan' },
  },
  portrait('portrait-harlan', 'harlan', 'Portrait of Harlan Thrombey', 'hall', 0, -3.86, 2.6, 8.4, Math.PI / 2,
    'Harlan in oils, a knowing half-smile. The painter caught the mischief in his eyes.', [1.4, 1.8]),
  portrait('portrait-wanetta', 'wanetta', 'Portrait of Wanetta Thrombey', 'hall', 0, 3.86, 2.6, 8.4, -Math.PI / 2,
    'Great Nana, painted decades ago. She still sits upstairs by the landing window.', [1.2, 1.6]),
  {
    id: 'grandfather-clock',
    name: 'Longcase Clock',
    room: 'hall',
    level: 0,
    pos: [-3.45, 1.7, 3.2],
    verb: 'Inspect',
    kind: 'inspect',
    model: { visual: 'clock', pos: [-3.62, 0, 3.2], rotY: Math.PI / 2 },
    block: [0.5, 0.7],
    observation: 'The hall clock runs eleven minutes slow. Nobody has wound it since the party.',
    hotspots: [
      { id: 'face', label: 'Clock face', detail: 'Stopped at 12:19 — but it runs eleven minutes slow. Corrected: 12:30.', at: [0.2, 1.75, 0], key: true },
      { id: 'pendulum', label: 'Pendulum', detail: 'Still. The weights are run down.', at: [0.2, 0.9, 0] },
    ],
  },

  // ───────────── Grand staircase portraits ─────────────
  portrait('portrait-linda', 'linda', 'Portrait of Linda Drysdale', 'stairhall', 0, -3.86, 2.2, -0.6, Math.PI / 2,
    'Linda, chin raised, real-estate keys at her belt in the painting. "Self-made."'),
  portrait('portrait-walt', 'walt', 'Portrait of Walt Thrombey', 'stairhall', 0, 3.86, 2.2, -0.6, -Math.PI / 2,
    'Walt, photographed beside a stack of his father\'s books. He runs the publishing house — or did.'),
  portrait('portrait-joni', 'joni', 'Portrait of Joni Thrombey', 'stairhall', 0, -3.86, 2.2, -6.6, Math.PI / 2,
    'Joni, all scarves and serenity. Harlan paid her daughter\'s tuition — twice, it turns out.'),
  portrait('portrait-richard', 'richard', 'Portrait of Richard Drysdale', 'stairhall', 0, 3.86, 2.2, -6.6, -Math.PI / 2,
    'Richard, the son-in-law. A politician\'s smile. Harlan had found out about his affair.'),

  // ───────────── Living room ─────────────
  {
    id: 'knife-wheel',
    name: 'The Knife Display',
    room: 'living',
    level: 0,
    pos: [-6.5, 1.9, 0.5],
    verb: 'Examine',
    kind: 'inspect',
    model: { visual: 'knifeWheel', pos: [-6.5, 0, 0.18] },
    block: [3.0, 0.5],
    evidence: 'EV-05',
    range: 3.4,
    observation: 'A great sunburst of blades fanned around a hub. One slot is empty — the dust outline is fresh.',
    hotspots: [
      { id: 'slot', label: 'Empty slot', detail: 'A clean outline in the dust where a short blade used to sit. Removed recently.', at: [0.0, 3.28, 0.12], key: true },
      { id: 'hub', label: 'Central hub', detail: 'Engraved: "Presented to H. Thrombey". A gift from a fan.', at: [0, 1.9, 0.18], key: true },
      { id: 'blades', label: 'Blades', detail: 'Daggers, kris, stilettos. Dusted weekly by Fran — except for the one gap.', at: [0.9, 2.7, 0.12] },
    ],
  },
  {
    id: 'fireplace-ash',
    name: 'Fireplace Grate',
    room: 'living',
    level: 0,
    pos: [-15.3, 0.5, 5],
    verb: 'Search',
    kind: 'inspect',
    inspectVisual: { visual: 'ashGrate', distance: 1.6 },
    evidence: 'EV-06',
    grants: { milestone: 'found-tox-fragment' },
    observation: 'Someone burned papers in the living room fire. One scrap survived, curled at the back of the grate.',
    hotspots: [
      { id: 'fragment', label: 'Paper fragment', detail: 'Letterhead fragment: "…ty Medical Examin…". Below it: "…toxicology…".', at: [0.12, 0.2, 0.08], key: true },
      { id: 'ash', label: 'Ash', detail: 'Fine and grey. Paper, not wood — burned within the last few days.', at: [-0.2, 0.12, 0.05], key: true },
    ],
  },
  {
    id: 'decanter',
    name: 'Brandy Decanter',
    room: 'living',
    level: 0,
    pos: [-8, 1.1, 9.55],
    verb: 'Look at',
    kind: 'observe',
    model: { visual: 'decanter', pos: [-8, 0.92, 9.55] },
    observation: 'Cut crystal, a finger of brandy left. Eight glasses on the tray — seven used.',
  },

  // ───────────── Study — the scene ─────────────
  {
    id: 'desk-drawer',
    name: "Harlan's Desk",
    room: 'study',
    level: 0,
    pos: [-13, 0.8, -4.3],
    verb: 'Open drawer',
    kind: 'document',
    model: { visual: 'letter', pos: [-12.9, 0.79, -4.35], rotY: 0.3 },
    evidence: 'EV-04',
    observation: 'In the top drawer, a letter from Harlan\'s attorney. The will was changed a week before he died.',
    grants: { milestone: 'read-attorney-letter' },
    document: {
      paper: 'letter',
      heading: 'STEVENS & ASSOCIATES · ATTORNEYS AT LAW',
      date: 'Dated [[date|the fourteenth of October]]',
      body: [
        'Dear Harlan,',
        'Further to our meeting of last Tuesday, I confirm that [[will|your revised will has been executed and witnessed]], and that the previous instrument is revoked in full. As you instructed, the family will not be informed until the formal reading.',
        'I must repeat my advice that you discuss the matter with [[ransom|your grandson]], given the scale of the change. You indicated you intended to do so at the party.',
        '[[copy|Your personal copy is filed, as you asked, inside your favourite of your own books — "The Sleeper in the Stacks", on the library\'s third shelf.]] An eccentric arrangement, but yours is an eccentric profession.',
        'Yours, as ever,',
      ],
      signature: 'A. Stevens',
      marks: [
        { id: 'ring', x: 68, y: 8, w: 22, h: 14, kind: 'stain' },
        { id: 'tear', x: 0, y: 84, w: 12, h: 16, kind: 'tear' },
      ],
    },
    hotspots: [
      { id: 'will', label: 'The revised will', detail: 'Executed one week before Harlan\'s death. Whoever it favours, it was not the family\'s expectation.', key: true },
      { id: 'ransom', label: 'Your grandson', detail: 'Ransom. The argument behind the study door at the party was about this.', key: true },
      { id: 'copy', label: 'Personal copy', detail: '"The Sleeper in the Stacks", third shelf of the library. Worth a look.', key: true },
      { id: 'date', label: 'Date', detail: 'October 14th. Eight days before the party.' },
      { id: 'ring', label: 'Coffee ring', detail: 'A coffee ring in the corner. Harlan read this more than once.' },
      { id: 'tear', label: 'Torn corner', detail: 'The corner was torn away and is nowhere in the drawer. Something written there?' },
      { id: 'signature', label: 'Signature', detail: 'Alan Stevens\' signature — firm, practised, genuine.' },
    ],
  },
  {
    id: 'typewriter',
    name: 'Typewriter',
    room: 'study',
    level: 0,
    pos: [-13.2, 0.95, -3.3],
    verb: 'Look at',
    kind: 'observe',
    model: { visual: 'typewriter', pos: [-13.2, 0.79, -3.25], rotY: Math.PI / 2 },
    observation: 'A sheet still in the roller: "CHAPTER ONE". Nothing else. Harlan never started a book he didn\'t finish.',
  },
  {
    id: 'medbag',
    name: 'Medical Bag',
    room: 'study',
    level: 0,
    pos: [-6.2, 0.85, -1.3],
    verb: 'Open',
    kind: 'inspect',
    model: { visual: 'medbag', pos: [-6.2, 0.62, -1.3], rotY: 0.4 },
    evidence: 'EV-02',
    observation: 'Marta\'s medical bag, left in the study. Two vials with identical caps and nearly identical labels.',
    hotspots: [
      { id: 'vials', label: 'The two vials', detail: 'MORPHINE 100 mg/ml and KETOROLAC (Toradol) 30 mg/ml. Same cap, same size, same glass.', at: [-0.03, 0.11, 0.22], key: true },
      { id: 'labels', label: 'Labels', detail: 'The Toradol label has been peeled and re-stuck. Recently.', at: [0.03, 0.045, 0.245], key: true },
      { id: 'tag', label: 'Name tag', detail: '"M. CABRERA, RN". Stitched by hand.', at: [-0.15, 0.08, 0.13] },
      { id: 'naloxone', label: 'Empty pocket', detail: 'The pocket marked NALOXONE — the emergency antidote for a morphine overdose — is empty.', at: [0.15, 0.13, 0.12] },
    ],
  },
  {
    id: 'go-board',
    name: 'Go Board',
    room: 'study',
    level: 0,
    pos: [-9.5, 0.55, -4],
    verb: 'Study',
    kind: 'inspect',
    model: { visual: 'goBoard', pos: [-9.5, 0.455, -4] },
    evidence: 'EV-03',
    observation: 'A game of Go abandoned mid-play. White was winning. Marta always played white.',
    hotspots: [
      { id: 'position', label: 'The position', detail: 'White has a clear lead. Harlan, as black, was losing — and he hated losing.', at: [0.1, 0.06, 0.05], key: true },
      { id: 'bowls', label: 'Stone bowls', detail: 'One captured black stone has rolled under the board. Jostled in a hurry?', at: [0.32, 0.05, 0.2], key: true },
    ],
  },
  {
    id: 'dagger',
    name: 'Ornamental Dagger',
    room: 'study',
    level: 0,
    pos: [-7.1, 0.15, -6.2],
    verb: 'Examine',
    kind: 'inspect',
    model: { visual: 'dagger', pos: [-7.1, 0.02, -6.2], rotY: 0.6 },
    inspectVisual: { visual: 'dagger', distance: 0.9 },
    evidence: 'EV-01',
    observation: 'Evidence marker 1: a short ornamental dagger on the rug beside the daybed. It matches the gap in the knife display.',
    hotspots: [
      { id: 'blade', label: 'Blade edge', detail: 'Dried blood along the edge. The police photographed and returned it to the scene for the reconstruction.', at: [0.12, 0.02, 0], key: true },
      { id: 'hilt', label: 'Hilt', detail: 'Brass hilt with a stylised sun. The same pattern as the knife display\'s hub.', at: [-0.12, 0.02, 0], key: true },
    ],
  },
  {
    id: 'daybed',
    name: 'The Daybed',
    room: 'study',
    level: 0,
    pos: [-8, 0.6, -7.0],
    verb: 'Examine',
    kind: 'inspect',
    inspectVisual: { visual: 'daybed', distance: 3.2 },
    observation: 'Where Fran found Harlan. The stain on the cushion has been cut away by the forensic team.',
    hotspots: [
      { id: 'cushion', label: 'Cut cushion', detail: 'A square of fabric removed for testing. The surrounding stain spread as he sat — not as he lay.', at: [0.2, 0.55, 0.1], key: true },
      { id: 'blanket', label: 'Folded blanket', detail: 'Folded neatly at the foot. Who tidies a bed in the middle of the night?', at: [-0.7, 0.55, 0.1], key: true },
    ],
  },

  // ───────────── Library ─────────────
  {
    id: 'library-shelves',
    name: 'Bookshelves',
    room: 'library',
    level: 0,
    pos: [7, 1.6, 0.6],
    verb: 'Browse',
    kind: 'observe',
    observation: 'Harlan\'s novels in order of publication, eighty-odd titles. Translations fill the lower shelves.',
  },
  {
    id: 'hollow-book',
    name: '"The Sleeper in the Stacks"',
    room: 'library',
    level: 0,
    pos: [12.6, 1.55, 0.6],
    verb: 'Pull out',
    kind: 'document',
    model: { visual: 'hollowBook', pos: [12.6, 1.42, 0.48] },
    requires: 'read-attorney-letter',
    evidence: 'EV-14',
    observation: 'The book is hollow. Inside, a folded note in Harlan\'s hand — a hidden compartment the attorney\'s letter pointed to.',
    grants: { milestone: 'found-hidden-compartment' },
    document: {
      paper: 'note',
      body: [
        '[[to|Marta —]]',
        'If you are reading this, the attorney did as I asked and you did as I knew you would: you kept looking.',
        '[[puzzle|The best puzzles are solved by those who refuse to stop.]] The family will make noise. Let them. [[heart|Trust your good heart]] — it has never once been wrong.',
        'The rest is a game, and you know I always win at games.',
      ],
      signature: '— H.',
      date: '[[date|Written the afternoon of the party]]',
      marks: [{ id: 'fold', x: 0, y: 48, w: 100, h: 4, kind: 'fold' }],
    },
    hotspots: [
      { id: 'to', label: 'Addressed to Marta', detail: 'Not to his children. To his nurse.', key: true },
      { id: 'heart', label: '"Trust your good heart"', detail: 'Harlan knew Marta could not lie without being sick. Did he expect her to need to?', key: true },
      { id: 'puzzle', label: 'The best puzzles', detail: 'Harlan wrote this knowing someone would have to dig for it.' },
      { id: 'date', label: 'Date', detail: 'Written hours before the party began.', key: true },
      { id: 'fold', label: 'Sharp crease', detail: 'Folded once, crisply, and never unfolded until now.' },
    ],
  },
  {
    id: 'globe',
    name: 'Antique Globe',
    room: 'library',
    level: 0,
    pos: [6.6, 1.0, 8.6],
    verb: 'Spin',
    kind: 'observe',
    model: { visual: 'globe', pos: [6.6, 0, 8.6] },
    block: [0.8, 0.8],
    observation: 'An eighteenth-century globe. Someone has pencilled a tiny dagger over Massachusetts. Harlan\'s sense of humour.',
  },

  // ───────────── Dining room ─────────────
  {
    id: 'seating-card',
    name: 'Seating Card',
    room: 'dining',
    level: 0,
    pos: [8.0, 0.85, -4],
    verb: 'Read',
    kind: 'document',
    model: { visual: 'placeCard', pos: [8.05, 0.78, -4], rotY: -Math.PI / 2 },
    evidence: 'EV-10',
    observation: 'The seating card at the head of the table: Ransom was moved away from his grandfather, in Harlan\'s hand.',
    document: {
      paper: 'card',
      heading: 'HARLAN · 85',
      body: ['[[name|~~Ransom — next to Grandpa~~]]', '[[moved|→ end of table.]] [[initials|H.T.]]'],
      marks: [{ id: 'wine', x: 70, y: 60, w: 22, h: 30, kind: 'stain' }],
    },
    hotspots: [
      { id: 'name', label: 'Crossed out', detail: 'Struck through with a fountain pen, pressed hard enough to dent the card.', key: true },
      { id: 'initials', label: 'Initials', detail: 'H.T. — Harlan himself rearranged the table. Before or after the argument?', key: true },
      { id: 'moved', label: 'The new seat', detail: 'Exiled to the far end, beside Great Nana.' },
      { id: 'wine', label: 'Wine stain', detail: 'Red wine, splashed after the card was written.' },
    ],
  },
  {
    id: 'cake',
    name: 'Birthday Cake',
    room: 'dining',
    level: 0,
    pos: [11.5, 0.95, -4],
    verb: 'Look at',
    kind: 'observe',
    model: { visual: 'cake', pos: [11.5, 0.79, -4] },
    observation: 'What remains of an eighty-fifth birthday cake. Eighty-five candles is a fire hazard; Fran used a single large "85".',
  },

  // ───────────── Kitchen ─────────────
  {
    id: 'flour-tin',
    name: 'Flour Tin',
    room: 'kitchen',
    level: 0,
    pos: [13.8, 1.1, -13.45],
    verb: 'Move',
    kind: 'inspect',
    model: { visual: 'flourTin', pos: [13.8, 0.92, -13.45] },
    evidence: 'EV-11',
    observation: 'Behind the flour tin, a heavy brass key tagged "STORE". Fran hides things where only a cook would look.',
    grants: { item: 'storage-key', milestone: 'found-storage-key' },
    hotspots: [
      { id: 'key', label: 'Brass key', detail: 'Tagged "STORE" in Fran\'s handwriting. This must open the storage room in the cellar.', at: [0.0, 0.05, -0.16], key: true },
      { id: 'flour', label: 'Flour dust', detail: 'Fingerprints in the flour on the lid. Small hands.', at: [0, 0.27, 0.05] },
    ],
  },
  {
    id: 'coffee-mug',
    name: 'Coffee Mug',
    room: 'kitchen',
    level: 0,
    pos: [9.6, 1.0, -11],
    verb: 'Look at',
    kind: 'observe',
    model: { visual: 'mug', pos: [9.6, 0.94, -11], rotY: 2.4 },
    observation: 'A mug on the island: "MY HOUSE, MY RULES, MY COFFEE". Someone\'s been drinking from it all week.',
  },

  // ───────────── Rear hall & conservatory ─────────────
  {
    id: 'boots',
    name: 'Wellington Boots',
    room: 'backhall',
    level: 0,
    pos: [3.2, 0.3, -12.6],
    verb: 'Look at',
    kind: 'observe',
    model: { visual: 'boots', pos: [3.3, 0, -12.6], rotY: -Math.PI / 2 },
    observation: 'Five pairs of boots by the back door. All clean — someone hosed them down.',
  },
  {
    id: 'orchid',
    name: 'Orchid',
    room: 'conservatory',
    level: 0,
    pos: [-14.6, 1.1, -12.9],
    verb: 'Look at',
    kind: 'observe',
    model: { visual: 'orchid', pos: [-14.6, 0, -12.9] },
    block: [0.6, 0.6],
    observation: 'A white orchid, Harlan\'s favourite, watered this week. Not everyone has stopped caring for the house.',
  },

  // ───────────── Garage ─────────────
  {
    id: 'vintage-car',
    name: "Harlan's Car",
    room: 'garage',
    level: 0,
    pos: [23.4, 1.0, -2],
    verb: 'Look at',
    kind: 'observe',
    observation: 'Harlan\'s old roadster under the bare bulb. Engine cold, tyres clean. It hasn\'t moved in months.',
  },
  {
    id: 'workbench',
    name: 'Workbench',
    room: 'garage',
    level: 0,
    pos: [28.9, 1.0, 1.8],
    verb: 'Look at',
    kind: 'observe',
    model: { visual: 'workbench', pos: [29.3, 0, 1.8], rotY: -Math.PI / 2 },
    block: [0.8, 2.2],
    observation: 'Tools on a pegboard, each outlined in marker. A pair of pliers is missing from its outline.',
  },

  // ───────────── Upstairs ─────────────
  {
    id: 'nana-chair',
    name: "Great Nana's Chair",
    room: 'landing',
    level: 1,
    pos: [2.8, U + 0.8, -6.6],
    verb: 'Look at',
    kind: 'observe',
    model: { visual: 'armchair', pos: [2.8, U, -6.9], rotY: Math.PI * 0.85 },
    block: [1, 1],
    observation: 'Wanetta\'s armchair, angled toward the window. From here she could see the west lawn — and the trellis.',
  },
  portrait('portrait-ransom', 'ransom', 'Portrait of Ransom Drysdale', 'landing', 1, 0, U + 1.9, -7.86, 0,
    'Ransom as a boy, already wearing the smirk. Someone has hung it slightly crooked.'),
  portrait('portrait-meg', 'meg', 'Portrait of Meg Thrombey', 'guestcorr', 1, 4.14, U + 1.8, 8.2, Math.PI / 2,
    'Meg at her school graduation. Harlan paid for the school. So did Joni\'s allowance.'),
  {
    id: 'window-latch',
    name: 'Window Latch',
    room: 'harlan',
    level: 1,
    pos: [-15.8, U + 1.65, 8],
    verb: 'Inspect',
    kind: 'inspect',
    model: { visual: 'latch', pos: [-15.86, U + 1.65, 8], rotY: Math.PI / 2 },
    inspectVisual: { visual: 'latch', distance: 0.7 },
    evidence: 'EV-09',
    observation: 'Fresh scratches on the brass window latch in Harlan\'s bedroom. Forced open from the inside, in a hurry.',
    hotspots: [
      { id: 'scratches', label: 'Scratches', detail: 'Bright metal under the patina. Done in the last week or two.', at: [0.0, 0.0, 0.05], key: true },
      { id: 'sill', label: 'Sill', detail: 'A smear of mud on the outer sill — from a shoe climbing out, not in.', at: [0.0, -0.12, 0.05], key: true },
    ],
  },
  {
    id: 'pillbox',
    name: 'Pill Organiser',
    room: 'harlan',
    level: 1,
    pos: [-10.6, U + 0.7, 9.45],
    verb: 'Look at',
    kind: 'observe',
    model: { visual: 'pillbox', pos: [-10.75, U + 0.625, 9.4] },
    observation: 'A weekly pill organiser on the nightstand. Marta fills it on Sundays. Saturday is still full.',
  },
  {
    id: 'photo-marta',
    name: 'Framed Photograph',
    room: 'sitting',
    level: 1,
    pos: [-9.6, U + 0.95, 1.55],
    verb: 'Look at',
    kind: 'portrait',
    model: { visual: 'photoFrame', pos: [-9.6, U + 0.86, 1.6], rotY: Math.PI, props: { character: 'marta' } },
    observation: 'Harlan and Marta laughing over a Go board. The only photograph in his private rooms.',
    grants: { character: 'marta' },
    hotspots: [
      { id: 'photo', label: 'The photograph', detail: 'Harlan and Marta laughing over a Go board. The only photograph in his private rooms.', at: [0, 0.12, 0.03], key: true },
    ],
  },
  {
    id: 'record-player',
    name: 'Record Player',
    room: 'sitting',
    level: 1,
    pos: [-14.6, U + 0.85, 1.35],
    verb: 'Look at',
    kind: 'observe',
    model: { visual: 'recordPlayer', pos: [-14.6, U, 1.35], rotY: Math.PI },
    block: [0.9, 0.6],
    observation: 'A Victrola with a stack of 78s. The top record: a recording of Harlan reading his first novel.',
  },
  {
    id: 'ransom-bed',
    name: 'Guest Bed',
    room: 'guestA',
    level: 1,
    pos: [12, U + 0.7, 8.2],
    verb: 'Look at',
    kind: 'observe',
    observation: 'Ransom\'s room for the night. The sheets haven\'t been slept in. His bag was gone by morning.',
  },
  {
    id: 'crystals',
    name: 'Healing Crystals',
    room: 'guestB',
    level: 1,
    pos: [15.0, U + 0.75, -7.55],
    verb: 'Look at',
    kind: 'observe',
    model: { visual: 'crystals', pos: [15.0, U + 0.625, -7.55] },
    observation: 'Joni\'s crystals, arranged in a circle "for clarity". One is labelled, in Meg\'s writing, "for honesty". It\'s face-down.',
  },

  // ───────────── Lower floor ─────────────
  {
    id: 'fusebox',
    name: 'Fuse Box',
    room: 'servcorr',
    level: -1,
    pos: [3.7, B + 1.5, -8],
    verb: 'Open',
    kind: 'observe',
    model: { visual: 'fuseBox', pos: [3.86, B + 1.5, -8], rotY: -Math.PI / 2 },
    observation: 'Every fuse labelled in Fran\'s neat hand. "GATE CAMERA" has been switched off and on again — the tab is crooked.',
  },
  {
    id: 'security-log',
    name: 'Security Recorder',
    room: 'cellar',
    level: -1,
    pos: [13.2, B + 0.95, -16.0],
    verb: 'Read log',
    kind: 'document',
    model: { visual: 'logbook', pos: [13.3, B + 0.77, -16.0], rotY: -Math.PI / 2 },
    evidence: 'EV-12',
    observation: 'The gate camera\'s logbook beside the recorder. The second tape from the night of the party is missing.',
    document: {
      paper: 'ledger',
      heading: 'GATE CAMERA — TAPE LOG',
      body: [
        '| TAPE | DATE | FROM | TO | INITIALS |',
        '| 21 | Oct 21 | 07:00 | 19:00 | F. |',
        '| 22 | Oct 22 | 07:00 | 19:00 | F. |',
        '| [[t23|23]] | Oct 22 | 19:00 | [[gap|23:00]] | [[init|F.]] |',
        '| [[t24|24]] | Oct 22 | 23:00 | 07:00 | [[missing|— MISSING —]] |',
      ],
      marks: [{ id: 'eraser', x: 58, y: 70, w: 30, h: 10, kind: 'stamp' }],
    },
    hotspots: [
      { id: 'missing', label: 'Tape 24', detail: 'Overnight, 23:00–07:00 on the night of the party. The cassette is not in the recorder or on the shelf.', key: true },
      { id: 'gap', label: '23:00', detail: 'Tape 23 ends at 23:00 — just as the house was settling for the night.', key: true },
      { id: 'init', label: 'F.', detail: 'Fran changed the tapes. She would know who asked about them.' },
      { id: 't23', label: 'Tape 23', detail: 'Still in the rack. Covers the party itself — arrivals and departures until eleven.' },
      { id: 't24', label: 'Tape 24', detail: 'Its slot in the rack is empty.' },
      { id: 'eraser', label: 'Erasure', detail: 'Something was written here and rubbed out with a pencil eraser.' },
    ],
  },
  {
    id: 'wine-rack',
    name: 'Wine Racks',
    room: 'cellar',
    level: -1,
    pos: [6, B + 1.3, -6.8],
    verb: 'Look at',
    kind: 'observe',
    observation: 'Bordeaux, mostly. A gap where three bottles of the \'82 used to be — opened for the party.',
  },
  {
    id: 'trunk',
    name: 'Old Steamer Trunk',
    room: 'storage',
    level: -1,
    pos: [-12.4, B + 0.7, -16.6],
    verb: 'Open',
    kind: 'document',
    model: { visual: 'trunk', pos: [-12.4, B, -16.8] },
    block: [1.2, 0.8],
    evidence: 'EV-13',
    observation: 'Under the trunk lid, among old manuscripts, a fresh Polaroid from the party.',
    document: {
      paper: 'photo',
      heading: 'Polaroid — "Dad\'s 85th!" (Joni\'s writing)',
      body: [
        '[[coat|Ransom, at the edge of the frame, already in his coat.]]',
        '[[clock|Behind the family, the hall clock: just past nine.]]',
        '[[absent|Harlan is not in the picture.]]',
      ],
    },
    hotspots: [
      { id: 'coat', label: 'Ransom\'s coat', detail: 'He was dressed to leave before the cake was cut.', key: true },
      { id: 'clock', label: 'The clock', detail: 'About 21:05 — which, on that slow clock, means 21:16.', key: true },
      { id: 'absent', label: 'Harlan absent', detail: 'He was upstairs, still in the study argument with Ransom? Or already alone?' },
    ],
  },
  {
    id: 'rocking-horse',
    name: 'Rocking Horse',
    room: 'storage',
    level: -1,
    pos: [-6.2, B + 0.8, -16.6],
    verb: 'Look at',
    kind: 'observe',
    model: { visual: 'rockingHorse', pos: [-6.2, B, -16.6], rotY: 0.5 },
    block: [1.2, 0.5],
    observation: 'A rocking horse with "R.D." carved under the saddle. Ransom\'s, once.',
  },

  // ───────────── Grounds ─────────────
  {
    id: 'gate-plaque',
    name: 'Gate Plaque',
    room: 'gate',
    level: 0,
    pos: [-3.5, 1.7, 46.4],
    verb: 'Read',
    kind: 'observe',
    model: { visual: 'plaque', pos: [-3.5, 1.7, 46.5], rotY: Math.PI },
    observation: 'A weathered bronze plaque on the gatepost: THROMBEY — PRIVATE. Below it, a camera, its red light blinking.',
  },
  {
    id: 'fountain',
    name: 'Fountain',
    room: 'driveway',
    level: 0,
    pos: [0, 1.0, 24.3],
    model: { visual: 'fountain', pos: [0, 0, 22] },
    verb: 'Look at',
    kind: 'observe',
    observation: 'A stone fountain, overflowing in the rain. Coins at the bottom — the family\'s wishes, presumably.',
  },
  {
    id: 'trellis',
    name: 'Rose Trellis',
    room: 'rear-garden',
    level: 0,
    pos: [-16.75, 2.2, 8],
    verb: 'Examine',
    kind: 'inspect',
    model: { visual: 'trellis', pos: [-16.42, 0, 8], rotY: -Math.PI / 2 },
    inspectVisual: { visual: 'trellis', distance: 6.5 },
    evidence: 'EV-07',
    observation: 'The trellis below Harlan\'s window: two rungs snapped near the top. Someone used it as a ladder.',
    hotspots: [
      { id: 'rungs', label: 'Snapped rungs', detail: 'Broken outward and down — under weight, from someone climbing down.', at: [0, 5.3, 0.06], key: true },
      { id: 'roses', label: 'Torn roses', detail: 'Thorns snagged with a thread of dark wool.', at: [0.4, 3.4, 0.1], key: true },
    ],
  },
  {
    id: 'footprint',
    name: 'Footprint in the Flowerbed',
    room: 'rear-garden',
    level: 0,
    pos: [-17.4, 0.1, 7.2],
    verb: 'Crouch',
    kind: 'inspect',
    model: { visual: 'footprint', pos: [-17.4, 0.02, 7.2], rotY: 0.3 },
    inspectVisual: { visual: 'footprint', distance: 1.0 },
    evidence: 'EV-08',
    observation: 'A partial shoe print in the flowerbed, below the trellis. Small, flat-soled — a nurse\'s shoe?',
    hotspots: [
      { id: 'tread', label: 'Tread', detail: 'Flat, rubber, with a wavy pattern. Not a dress shoe, not a boot.', at: [0, 0.01, 0.05], key: true },
      { id: 'size', label: 'Size', detail: 'Women\'s size seven, or a small man\'s.', at: [0.06, 0.01, -0.08], key: true },
    ],
  },
  {
    id: 'tyre-marks',
    name: 'Tyre Marks',
    room: 'driveway',
    level: 0,
    pos: [18.2, 0.1, 6.5],
    verb: 'Examine',
    kind: 'inspect',
    model: { visual: 'tyreMarks', pos: [18.2, 0.01, 6.5] },
    inspectVisual: { visual: 'tyreMarks', distance: 3.5 },
    evidence: 'EV-15',
    observation: 'Deep ruts gouged into the mud of the service drive. A car accelerated hard out of here after the rain started.',
    hotspots: [
      { id: 'ruts', label: 'Ruts', detail: 'Wheel-spin. Mud thrown backward in fans. Whoever drove off was angry.', at: [0, 0.02, 0], key: true },
      { id: 'width', label: 'Track width', detail: 'Wide wheelbase — a sports car, not the family saloon.', at: [0.8, 0.02, -0.8], key: true },
    ],
  },

  // ───────────── Part 2: family papers ─────────────
  {
    id: 'tuition-statement',
    name: 'School Statement',
    room: 'guestB',
    level: 1,
    pos: [12.3, U + 1.05, 1.45],
    verb: 'Read',
    kind: 'document',
    model: { visual: 'letter', pos: [12.3, U + 1.03, 1.5], rotY: 0.2 },
    evidence: 'EV-16',
    observation: 'Meg’s school statement, left on the dresser. The same fees were paid twice.',
    document: {
      paper: 'ledger',
      heading: 'HARTWELL ACADEMY — STATEMENT OF ACCOUNT · AUTUMN TERM',
      body: [
        '| DATE | DESCRIPTION | PAYER | AMOUNT |',
        '| Aug 28 | Tuition & boarding | [[harlan|H. Thrombey (direct)]] | $38,400 |',
        '| Sep 02 | Tuition & boarding | [[joni|J. Thrombey]] | $38,400 |',
        '| Sep 09 | [[refund|Overpayment — refunded to J. Thrombey]] | — | ($38,400) |',
        '| — | [[note|“Paid direct from now on, so it gets there.” — H.]] | — | — |',
      ],
    },
    hotspots: [
      { id: 'harlan', label: 'Paid by Harlan', detail: 'Harlan paid the school directly, in full.', key: true },
      { id: 'joni', label: 'Paid by Joni', detail: 'Joni paid the same fees — with money Harlan had sent her for the purpose.', key: true },
      { id: 'refund', label: 'Refund', detail: 'The school refunded the duplicate payment to Joni. She kept it.', key: true },
      { id: 'note', label: 'Harlan’s note', detail: 'Pencilled in Harlan’s hand in the margin. He knew.' },
    ],
  },
  {
    id: 'richard-letter',
    name: 'Unsent Letter',
    room: 'harlan',
    level: 1,
    pos: [-13.55, U + 0.72, 9.3],
    verb: 'Open drawer',
    kind: 'document',
    model: { visual: 'letter', pos: [-13.6, U + 0.63, 9.32], rotY: -0.3 },
    evidence: 'EV-17',
    observation: 'In Harlan’s nightstand drawer: a letter to Richard he never sent.',
    document: {
      paper: 'note',
      body: [
        '[[to|Richard —]]',
        'I have been made aware of your [[affair|arrangement in the city]]. I do not intend to discuss its particulars; I find I do not have the stomach for them.',
        '[[deadline|You will tell Linda yourself, by the end of the week. If you do not, I will.]] She deserves to hear it from a coward rather than from her father.',
        'You may consider this the kindest thing I have ever done for you.',
      ],
      signature: '— H.T.',
      date: '[[date|Dated three days before the party]]',
    },
    hotspots: [
      { id: 'to', label: 'Addressed to Richard', detail: 'Linda’s husband. Harlan’s son-in-law.' },
      { id: 'affair', label: 'An “arrangement”', detail: 'Richard has been having an affair. Harlan found out.', key: true },
      { id: 'deadline', label: 'The deadline', detail: 'The end of the week. Harlan died before it arrived.', key: true },
      { id: 'date', label: 'Date', detail: 'Three days before the party — so the deadline fell days after it.', key: true },
      { id: 'signature', label: 'Signature', detail: 'Harlan’s initials, pressed hard enough to tear the paper slightly.' },
    ],
  },
  {
    id: 'dismissal-memo',
    name: 'Publishing Memo',
    room: 'library',
    level: 0,
    pos: [8.3, 0.85, 6.5],
    verb: 'Read',
    kind: 'document',
    model: { visual: 'letter', pos: [8.25, 0.79, 6.45], rotY: 0.5 },
    evidence: 'EV-18',
    observation: 'A memo on publishing-house letterhead, left on the library table: Walt’s dismissal.',
    document: {
      paper: 'letter',
      heading: 'BLOOD LIKE WINE PUBLISHING · OFFICE OF THE FOUNDER',
      date: '[[date|To take effect on the first of next month]]',
      body: [
        'To the Board,',
        '[[fired|Effective the first of next month, Walter Thrombey is relieved of his duties as Chief Executive.]] An interim head will be appointed from within.',
        '[[rights|No adaptation rights to any title will be licensed in my lifetime, or after it.]] This is not open to discussion, Walter.',
        'This decision is mine alone and is made with love, which is not the same thing as approval.',
      ],
      signature: 'Harlan Thrombey',
    },
    hotspots: [
      { id: 'fired', label: 'Relieved of duties', detail: 'Harlan removed Walt as head of the publishing house.', key: true },
      { id: 'rights', label: 'Adaptation rights', detail: 'Walt’s television plans — vetoed permanently.', key: true },
      { id: 'date', label: 'Effective date', detail: 'Next month. Walt knew this was coming when he told everyone he was thriving.' },
      { id: 'signature', label: 'Signature', detail: 'Harlan’s full signature, in the brown ink he kept for business.' },
    ],
  },
  {
    id: 'family-tree',
    name: 'Framed Family Tree',
    room: 'dining',
    level: 0,
    pos: [7.25, 1.2, -7.45],
    verb: 'Study',
    kind: 'relations',
    model: { visual: 'treeFrame', pos: [7.25, 0.92, -7.62] },
    observation: 'A family tree drawn up for the birthday party, framed on the sideboard. Room in the margins for notes.',
    grants: { milestone: 'opened-family-tree' },
  },
  {
    id: 'photo-album',
    name: 'Photograph Album',
    room: 'living',
    level: 0,
    pos: [-12.7, 0.55, 5.1],
    verb: 'Open',
    kind: 'album',
    model: { visual: 'album', pos: [-12.7, 0.46, 5.1], rotY: 0.3 },
    observation: 'A leather photograph album on the coffee table. Harlan wrote on the back of every picture.',
    grants: { milestone: 'opened-album' },
  },

  // ───────────── Part 3: the case comes together ─────────────
  {
    id: 'fran-coat',
    name: 'Fran’s Coat',
    room: 'backhall',
    level: 0,
    pos: [0.45, 1.3, -13.15],
    verb: 'Search the pockets',
    kind: 'document',
    requires: 'found-tox-fragment',
    evidence: 'EV-19',
    observation: 'In the housekeeper’s coat pocket: a complete copy of the report someone burned in the living-room fire.',
    document: {
      paper: 'letter',
      heading: 'OFFICE OF THE COUNTY MEDICAL EXAMINER · TOXICOLOGY',
      date: 'Subject: Thrombey, Harlan · [[date|received the Monday after his death]]',
      body: [
        'Specimen: femoral blood.',
        '[[morphine|Morphine: 0.06 mg/L — consistent with the prescribed nightly dose.]]',
        '[[ketorolac|Ketorolac: present, at the prescribed level.]]',
        '[[conclusion|No drug overdose. Cause of death: exsanguination from a self-inflicted wound to the neck.]]',
        'Pinned to it, in a different hand: [[fran|“I have a copy too. I know what you did with the vials.”]]',
      ],
      marks: [{ id: 'fold', x: 0, y: 50, w: 100, h: 3, kind: 'fold' }],
    },
    hotspots: [
      { id: 'morphine', label: 'Morphine level', detail: 'A normal dose. Harlan did not receive 100 mg of morphine. Whatever Marta believes, she gave him the right medicine.', key: true },
      { id: 'conclusion', label: 'Conclusion', detail: 'No overdose. Harlan would have lived through the night — if he had not been convinced otherwise.', key: true },
      { id: 'fran', label: 'Fran’s note', detail: '“What you did with the vials.” Fran knew the vials had been tampered with — and whoever she wrote to burned the original.', key: true },
      { id: 'ketorolac', label: 'Ketorolac', detail: 'The Toradol was given too. Both doses were correct.' },
      { id: 'date', label: 'Date', detail: 'Received after the family had gathered. Someone made sure they never read it.' },
      { id: 'fold', label: 'Folded small', detail: 'Folded to pocket size and carried around. Fran meant to use it.' },
    ],
  },
  {
    id: 'sealed-will',
    name: 'Sealed Will',
    room: 'library',
    level: 0,
    pos: [12.6, 1.12, 0.65],
    verb: 'Unseal',
    kind: 'will',
    model: { visual: 'willEnvelope', pos: [12.6, 1.02, 0.6], rotY: 0 },
    requires: 'found-hidden-compartment',
    evidence: 'EV-20',
    observation: 'Behind the hollow book, a heavy envelope sealed in red wax: Harlan’s own copy of his new will.',
    document: {
      paper: 'will',
      heading: 'Last Will and Testament of Harlan Thrombey',
      body: [
        'I, HARLAN THROMBEY, of Crofton Road in the Commonwealth of Massachusetts, being of sound mind, declare this to be my Last Will and Testament, and I revoke all wills and codicils previously made by me.',
        'FIRST. [[beneficiary|I give, devise and bequeath the whole of my estate — my house and its contents, my investments, and my entire interest in Blood Like Wine Publishing — to MARTA CABRERA.]]',
        'SECOND. ~~I give my house at Crofton Road to my grandson Hugh Drysdale.~~ [[alteration|Struck through; initialled H.T. and A.S. in the margin.]]',
        'THIRD. [[family|To my children and grandchildren I leave their personal effects and my love, which they will find is worth more than they believe. It is a gift, not a punishment.]]',
        'Signed by the Testator in our presence, and by us in his. [[witness|Alan Stevens, Attorney at Law · Notary Public, Middlesex County · 14 October]]',
        '[[annotation|In pencil, in the margin, in Harlan’s hand: “Told R. at the party.”]]',
      ],
      signature: 'Harlan Thrombey',
      marks: [
        { id: 'seal', x: 76, y: 82, w: 14, h: 11, kind: 'stamp' },
        { id: 'fold', x: 0, y: 33, w: 100, h: 2, kind: 'fold' },
      ],
    },
    hotspots: [
      { id: 'beneficiary', label: 'Sole beneficiary', detail: 'Everything — the house, the fortune, Blood Like Wine Publishing — to Marta Cabrera.', key: true },
      { id: 'family', label: 'The family', detail: 'The children and grandchildren receive their personal effects and nothing else. Harlan explains: it is a gift, not a punishment.', key: true },
      { id: 'witness', label: 'Witnesses', detail: 'Signed by Harlan and witnessed by Alan Stevens and a notary, both dated October 14th. Properly executed.', key: true },
      { id: 'alteration', label: 'Struck clause', detail: 'A clause leaving the house to “my grandson Hugh” is struck through and initialled H.T. and A.S. A valid amendment, not a forgery.', key: true },
      { id: 'annotation', label: 'Pencilled note', detail: 'In the margin, in Harlan’s pencil: “Told R. at the party.” Ransom knew.', key: true },
      { id: 'seal', label: 'Wax seal', detail: 'Harlan’s own seal, unbroken until now. Nobody else has read this copy.' },
      { id: 'fold', label: 'Folds', detail: 'Folded in three to fit the book. Creases crisp — handled once.' },
    ],
  },
  {
    id: 'evidence-wall',
    name: 'Investigation Board',
    room: 'library',
    level: 0,
    pos: [10.5, 1.45, 8.35],
    verb: 'Work the case',
    kind: 'wall',
    model: { visual: 'corkboard', pos: [10.5, 0, 8.75], rotY: Math.PI },
    block: [2.7, 0.5],
    range: 3.2,
    observation: 'Blanc has set up a corkboard on an easel in the library. “For you,” says a card pinned to the corner. “Pins are in the drawer. String is cheap.”',
  },
];

export const INTERACTABLE_BY_ID: Record<string, InteractableDef> = Object.fromEntries(INTERACTABLES.map((i) => [i.id, i]));
