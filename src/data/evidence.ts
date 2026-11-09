/**
 * Static evidence definitions. Dynamic state (when found, examined, presented)
 * lives in the investigation store; the folder merges the two.
 */

export type EvidenceCategory = 'object' | 'document' | 'photograph' | 'trace' | 'environment';

export const CATEGORY_LABEL: Record<EvidenceCategory, string> = {
  object: 'Physical object',
  document: 'Document',
  photograph: 'Photograph',
  trace: 'Physical trace',
  environment: 'Environmental detail',
};

export interface EvidenceDef {
  id: string;
  name: string;
  description: string;
  category: EvidenceCategory;
  /** Room/zone id where it is found. */
  location: string;
  relatedCharacters: string[];
  relatedEvents: string[];
}

export const EVIDENCE: EvidenceDef[] = [
  {
    id: 'EV-01',
    name: 'The Ornamental Dagger',
    description: 'A short ceremonial blade, the kind that sat in the living-room display. Dried blood along the edge.',
    category: 'object',
    location: 'study',
    relatedCharacters: ['harlan'],
    relatedEvents: ['death'],
  },
  {
    id: 'EV-02',
    name: "Marta's Medical Bag",
    description: 'Worn leather nursing bag. Two vials inside with identical caps — morphine and Toradol.',
    category: 'object',
    location: 'study',
    relatedCharacters: ['marta', 'harlan'],
    relatedEvents: ['medication'],
  },
  {
    id: 'EV-03',
    name: 'Unfinished Game of Go',
    description: "The stones are exactly where Marta and Harlan left them. White was winning.",
    category: 'environment',
    location: 'study',
    relatedCharacters: ['marta', 'harlan'],
    relatedEvents: ['go-game'],
  },
  {
    id: 'EV-04',
    name: 'Letter from Harlan’s Attorney',
    description: 'Letter on Stevens & Associates paper confirming the revised will has been executed and lodged.',
    category: 'document',
    location: 'study',
    relatedCharacters: ['harlan', 'ransom'],
    relatedEvents: ['will', 'ransom-argument'],
  },
  {
    id: 'EV-05',
    name: 'Empty Slot in the Knife Display',
    description: 'One blade is missing from the great wheel of knives in the living room. The dust outline is clean.',
    category: 'environment',
    location: 'living',
    relatedCharacters: ['harlan'],
    relatedEvents: ['death'],
  },
  {
    id: 'EV-06',
    name: 'Charred Paper Fragment',
    description: 'A scrap that escaped the fireplace. Letterhead of a medical examiner’s office.',
    category: 'document',
    location: 'living',
    relatedCharacters: ['fran', 'marta'],
    relatedEvents: ['medication'],
  },
  {
    id: 'EV-07',
    name: 'Broken Trellis',
    description: 'The rose trellis below Harlan’s bedroom window has snapped two rungs from the top.',
    category: 'trace',
    location: 'rear-garden',
    relatedCharacters: ['wanetta'],
    relatedEvents: ['window-climb'],
  },
  {
    id: 'EV-08',
    name: 'Muddy Footprint',
    description: 'A partial print pressed into the flowerbed beneath the trellis. Smaller than a man’s boot.',
    category: 'trace',
    location: 'rear-garden',
    relatedCharacters: ['marta'],
    relatedEvents: ['window-climb'],
  },
  {
    id: 'EV-09',
    name: 'Scratched Window Latch',
    description: 'Fresh scratches on the latch of Harlan’s bedroom window. Opened from the inside.',
    category: 'trace',
    location: 'harlan',
    relatedCharacters: ['harlan'],
    relatedEvents: ['window-climb'],
  },
  {
    id: 'EV-10',
    name: 'Birthday Seating Card',
    description: '"Ransom — next to Grandpa." Someone has crossed it out and moved him to the end of the table.',
    category: 'document',
    location: 'dining',
    relatedCharacters: ['ransom', 'harlan'],
    relatedEvents: ['party'],
  },
  {
    id: 'EV-11',
    name: 'Brass Storage-Room Key',
    description: 'A heavy brass key tagged "STORE" in Fran’s handwriting. Hidden behind the flour tin.',
    category: 'object',
    location: 'kitchen',
    relatedCharacters: ['fran'],
    relatedEvents: [],
  },
  {
    id: 'EV-12',
    name: 'Security Recorder Log',
    description: 'The gate camera logbook. Two tapes recorded the night of the party; one is missing.',
    category: 'document',
    location: 'cellar',
    relatedCharacters: ['ransom', 'marta'],
    relatedEvents: ['death', 'window-climb'],
  },
  {
    id: 'EV-13',
    name: 'Photograph from the Party',
    description: 'A Polaroid of the family around the cake. Ransom is already wearing his coat.',
    category: 'photograph',
    location: 'storage',
    relatedCharacters: ['ransom', 'linda', 'walt', 'joni', 'richard', 'meg'],
    relatedEvents: ['party', 'ransom-argument'],
  },
  {
    id: 'EV-14',
    name: 'Harlan’s Hidden Note',
    description: 'A folded note in a hollowed-out book. "The best puzzles are solved by those who refuse to stop."',
    category: 'document',
    location: 'library',
    relatedCharacters: ['harlan', 'marta'],
    relatedEvents: ['will'],
  },
  {
    id: 'EV-15',
    name: 'Tyre Marks on the Service Drive',
    description: 'Deep tyre ruts in the mud near the garage, made after the rain began. A car left in a hurry.',
    category: 'trace',
    location: 'driveway',
    relatedCharacters: ['ransom'],
    relatedEvents: ['ransom-argument'],
  },
  {
    id: 'EV-16',
    name: 'Tuition Statement',
    description: 'Meg’s school statement for the autumn term. Two payments received for the same fees — one from Harlan directly, one from Joni.',
    category: 'document',
    location: 'guestB',
    relatedCharacters: ['joni', 'meg', 'harlan'],
    relatedEvents: [],
  },
  {
    id: 'EV-17',
    name: 'Harlan’s Unsent Letter to Richard',
    description: 'A letter in Harlan’s hand, never posted: Richard must tell Linda about his affair by the end of the week, or Harlan will.',
    category: 'document',
    location: 'harlan',
    relatedCharacters: ['richard', 'linda', 'harlan'],
    relatedEvents: ['party'],
  },
  {
    id: 'EV-18',
    name: 'Dismissal Memo',
    description: 'A memo on Blood Like Wine Publishing letterhead relieving Walt Thrombey of his position. Signed by Harlan.',
    category: 'document',
    location: 'library',
    relatedCharacters: ['walt', 'harlan'],
    relatedEvents: ['party'],
  },
  {
    id: 'EV-19',
    name: 'Toxicology Report — Copy',
    description: 'A copy of the medical examiner’s toxicology results, folded in Fran’s coat. Harlan’s morphine level was normal. There was no overdose.',
    category: 'document',
    location: 'backhall',
    relatedCharacters: ['marta', 'harlan', 'ransom'],
    relatedEvents: ['medication', 'death'],
  },
  {
    id: 'EV-20',
    name: 'Harlan’s Sealed Will',
    description: 'Harlan’s personal copy of his new will, hidden in “The Sleeper in the Stacks”. Everything — the house, the fortune, the publishing house — goes to Marta Cabrera.',
    category: 'document',
    location: 'library',
    relatedCharacters: ['harlan', 'marta', 'ransom', 'linda', 'walt', 'joni'],
    relatedEvents: ['will', 'ransom-argument'],
  },
];

export const EVIDENCE_BY_ID: Record<string, EvidenceDef> = Object.fromEntries(EVIDENCE.map((e) => [e.id, e]));
