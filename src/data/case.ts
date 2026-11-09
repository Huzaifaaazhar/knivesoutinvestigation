/** Persons of interest and the key events of the night of Harlan Thrombey's 85th birthday. */

export interface Character {
  id: string;
  name: string;
  role: string;
  /** Short note in Blanc's voice; revealed once the player studies their portrait. */
  note: string;
  /** Palette used to paint their procedural portrait. */
  palette: [string, string, string];
}

export const CHARACTERS: Character[] = [
  {
    id: 'harlan',
    name: 'Harlan Thrombey',
    role: 'Mystery novelist, patriarch. Deceased, aged 85.',
    note: 'Built an empire on puzzles. Found in his study the morning after his party, throat cut. Ruled a suicide — for now.',
    palette: ['#2b2b33', '#d9cbaf', '#b69a65'],
  },
  {
    id: 'marta',
    name: 'Marta Cabrera',
    role: "Harlan's nurse and confidante.",
    note: 'Kind. Precise with medication. Was with Harlan for his last game of Go. Cannot lie without consequences.',
    palette: ['#1f2a3a', '#c9a27e', '#66684d'],
  },
  {
    id: 'ransom',
    name: 'Hugh "Ransom" Drysdale',
    role: "Harlan's grandson.",
    note: 'Cable-knit sweater, sharp tongue. Argued with Harlan behind a closed door, then left the party early.',
    palette: ['#3a2a20', '#d9c3a0', '#982b39'],
  },
  {
    id: 'linda',
    name: 'Linda Drysdale',
    role: "Harlan's eldest daughter. Self-made in real estate.",
    note: '"Self-made," with a million-dollar loan from her father. Notices everything about her husband except what matters.',
    palette: ['#241815', '#e2c9a8', '#632331'],
  },
  {
    id: 'richard',
    name: 'Richard Drysdale',
    role: "Linda's husband.",
    note: 'Harlan had discovered his affair. Was to be exposed within the week.',
    palette: ['#171e2a', '#d4b896', '#39271f'],
  },
  {
    id: 'walt',
    name: 'Walt Thrombey',
    role: "Harlan's youngest son. Runs the publishing house.",
    note: 'Fired from Blood Like Wine Publishing on the night of the party. Wants the film rights more than he wants his father.',
    palette: ['#2a2a22', '#cfb08a', '#66684d'],
  },
  {
    id: 'joni',
    name: 'Joni Thrombey',
    role: "Widowed daughter-in-law. Lifestyle guru.",
    note: "Double-dipping Meg's tuition. Harlan cut her allowance the night he died.",
    palette: ['#3a2430', '#e8d2b5', '#b69a65'],
  },
  {
    id: 'meg',
    name: 'Meg Thrombey',
    role: "Joni's daughter. College student.",
    note: 'Friendly with Marta. Overheard more than she says.',
    palette: ['#1d2632', '#e6cdb0', '#632331'],
  },
  {
    id: 'fran',
    name: 'Fran',
    role: 'Housekeeper.',
    note: 'Sees the comings and goings. Keeps her own counsel — and, perhaps, her own copies.',
    palette: ['#2e2a24', '#d9bf9c', '#66684d'],
  },
  {
    id: 'wanetta',
    name: 'Wanetta "Great Nana" Thrombey',
    role: "Harlan's mother. Very old.",
    note: 'Saw someone climb down from the window that night. Nobody listens to her.',
    palette: ['#2b2b2b', '#ead9c2', '#39271f'],
  },
];

export const CHARACTER_BY_ID = Object.fromEntries(CHARACTERS.map((c) => [c.id, c]));

export interface CaseEvent {
  id: string;
  time: string;
  title: string;
  summary: string;
}

export const EVENTS: CaseEvent[] = [
  { id: 'party', time: '19:30', title: "Harlan's 85th birthday party", summary: 'The family gathers at the estate.' },
  { id: 'ransom-argument', time: '21:00', title: 'Argument in the study', summary: 'Harlan and Ransom quarrel behind closed doors. Ransom storms out.' },
  { id: 'go-game', time: '23:00', title: 'Last game of Go', summary: 'Marta plays Go with Harlan in his study, then prepares his medication.' },
  { id: 'medication', time: '23:30', title: 'Nightly medication', summary: 'Toradol and morphine are administered from Marta’s medical bag.' },
  { id: 'window-climb', time: '00:15', title: 'Figure on the trellis', summary: 'Someone climbs down from the upstairs window at night.' },
  { id: 'death', time: '≈ 00:30', title: 'Harlan’s death', summary: 'Harlan is found the next morning by Fran, carrying his breakfast tray.' },
  { id: 'will', time: '—', title: 'The new will', summary: 'A will Harlan revised a week before his death, not yet read to the family.' },
];

export const EVENT_BY_ID = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
