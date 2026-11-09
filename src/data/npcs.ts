/**
 * The people in the house tonight: how they look, and where they are.
 *
 * Schedules are keyed by investigation act (which only rises with discoveries)
 * and each act lists a few posts a person drifts between as the evening wears
 * on. Nobody ever becomes unreachable: every post is in a room the player can
 * walk to, and "occupied" spells end on their own.
 */
import type { Level } from './layout';
import type { Cond } from '../systems/conditions';

export type Pose = 'stand' | 'sit' | 'lean' | 'arms-crossed' | 'hands-behind' | 'phone' | 'pace' | 'kneel';

export type HairStyle = 'short' | 'swept' | 'tousled' | 'bob' | 'long' | 'ponytail' | 'receding' | 'white';

export interface Appearance {
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  top: string;
  topStyle: 'suit' | 'cable' | 'blazer' | 'cardigan' | 'hoodie' | 'blouse' | 'sweater' | 'vest';
  accent: string;
  bottom: string;
  shoes: string;
  height: number;
  build: number;
  glasses?: boolean;
  beard?: boolean;
  scarf?: boolean;
  tie?: boolean;
}

export interface Post {
  room: string;
  x: number;
  z: number;
  /** Facing direction (radians; 0 = +z / south). */
  face: number;
  pose: Pose;
  /** What the player sees when they simply watch this person. */
  observe: string;
  /** While true the person is busy (phone, etc.) and will ask you to come back. */
  occupied?: Cond;
  /** While true the person will barely speak to you. */
  unwilling?: Cond;
}

export interface NpcDef {
  id: string;
  name: string;
  short: string;
  look: Appearance;
  /** Posts per act: act index → posts cycled through over the evening. */
  schedule: Post[][];
  voice: { pitch: number; rate: number };
}

const P = (room: string, x: number, z: number, face: number, pose: Pose, observe: string, extra: Partial<Post> = {}): Post => ({ room, x, z, face, pose, observe, ...extra });
const PI = Math.PI;

export const NPCS: NpcDef[] = [
  {
    id: 'blanc',
    name: 'Benoit Blanc',
    short: 'Blanc',
    voice: { pitch: 0.85, rate: 0.9 },
    look: { skin: '#e6c4a8', hair: '#8a8a88', hairStyle: 'swept', top: '#5e6068', topStyle: 'suit', accent: '#7a1f2a', bottom: '#4d4f56', shoes: '#2a1a12', height: 1.86, build: 1.0, tie: true },
    schedule: [
      [P('study', -10.6, -6.1, PI * 0.85, 'hands-behind', 'Blanc stands over the daybed, very still, as though listening to it. Now and then he tilts his head at something on the rug.')],
      [
        P('study', -10.6, -6.1, PI * 0.85, 'hands-behind', 'Blanc circles the daybed slowly, humming something tuneless.'),
        P('library', 9.9, 2.4, PI, 'hands-behind', 'Blanc runs a finger along the spines of Harlan’s novels, reading titles under his breath and smiling at some of them.'),
      ],
      [
        P('terrace', 4.6, -16.6, PI, 'stand', 'Blanc watches the rain over the garden, turning a coin over his knuckles. He seems to be arranging something in his head.'),
        P('hall', 1.8, 8.3, -PI / 2, 'hands-behind', 'Blanc studies Harlan’s portrait in the hall with an expression of almost personal fondness.'),
      ],
    ],
  },
  {
    id: 'marta',
    name: 'Marta Cabrera',
    short: 'Marta',
    voice: { pitch: 1.12, rate: 0.95 },
    look: { skin: '#c99a76', hair: '#1e1612', hairStyle: 'ponytail', top: '#46607a', topStyle: 'sweater', accent: '#d9cbaf', bottom: '#2a2f3a', shoes: '#e9e3d6', height: 1.62, build: 0.9 },
    schedule: [
      [P('kitchen', 7.5, -9.6, PI * 0.75, 'stand', 'Marta rinses the same mug twice. She keeps glancing toward the door to the dining room, then away.')],
      [
        P('kitchen', 7.5, -9.6, PI * 0.75, 'stand', 'Marta dries her hands, folds the towel, unfolds it again. Her eyes are red-rimmed.'),
        P('conservatory', -10, -11.4, 0, 'arms-crossed', 'Marta stands among the plants with her arms wrapped around herself, watching the rain run down the glass.'),
      ],
      [
        P('sitting', -10.2, -3.4, PI, 'stand', 'Marta is in Harlan’s sitting room, looking at the photograph on the desk. She doesn’t touch it.'),
        P('kitchen', 12.8, -12.3, PI, 'stand', 'Marta pours two cups of coffee, then remembers there is no one to bring the second one to.'),
      ],
    ],
  },
  {
    id: 'ransom',
    name: 'Hugh “Ransom” Drysdale',
    short: 'Ransom',
    voice: { pitch: 0.95, rate: 1.05 },
    look: { skin: '#e8c6a6', hair: '#6a4a2a', hairStyle: 'tousled', top: '#e4d8bf', topStyle: 'cable', accent: '#c9b994', bottom: '#2a2d36', shoes: '#4a2a1a', height: 1.85, build: 1.0 },
    schedule: [
      [
        P('living', -14.3, 5.0, PI / 2, 'lean', 'Ransom leans on the mantel as if he owns it, swirling a brandy he isn’t drinking. He watches you the way a cat watches a new piece of furniture.', {
          unwilling: { not: { any: [{ milestone: 'read-attorney-letter' }, { evidence: 'EV-10' }, { met: 'blanc' }] } },
        }),
      ],
      [
        P('guestA', 11.5, 5.2, PI, 'arms-crossed', 'Ransom stands in the Blue Room with his coat over his arm, as though he might leave at any moment. He hasn’t.'),
        P('garage', 22.3, -5.0, PI / 2, 'lean', 'Ransom leans against the garage wall, peering at his grandfather’s old car with something like envy.'),
      ],
      [
        P('parking', 14.3, 22.2, -PI / 2, 'stand', 'Ransom stands in the rain by the parking area, staring at the empty bay where his car was parked that night.'),
        P('living', -8.2, 3.3, -PI / 2, 'arms-crossed', 'Ransom has claimed an armchair’s worth of space near the knife display and is ignoring it pointedly.'),
      ],
    ],
  },
  {
    id: 'linda',
    name: 'Linda Drysdale',
    short: 'Linda',
    voice: { pitch: 1.0, rate: 1.0 },
    look: { skin: '#ecc9ac', hair: '#cfb07a', hairStyle: 'bob', top: '#632331', topStyle: 'blazer', accent: '#e9e3d6', bottom: '#1d1d22', shoes: '#141414', height: 1.7, build: 0.95 },
    schedule: [
      [P('living', -8.3, 3.2, PI * 0.7, 'arms-crossed', 'Linda stands rather than sits, arms folded, scanning the room as if checking it against an inventory.')],
      [
        P('dining', 9.0, -6.4, PI / 2, 'stand', 'Linda straightens the place settings on the abandoned table with quick, precise movements.'),
        P('hall', -1.8, 4.0, PI, 'arms-crossed', 'Linda waits in the hall, checking her watch as if the house were running late.'),
      ],
      [
        P('harlan', -10.6, 5.2, -PI / 2, 'stand', 'Linda is in her father’s bedroom, holding the edge of the bedspread. She lets go the moment she sees you.'),
        P('dining', 9.0, -6.4, PI / 2, 'arms-crossed', 'Linda sits at the head of the table — her father’s seat — then stands up again quickly.'),
      ],
    ],
  },
  {
    id: 'walt',
    name: 'Walt Thrombey',
    short: 'Walt',
    voice: { pitch: 0.92, rate: 1.08 },
    look: { skin: '#e2bea0', hair: '#4a3a2a', hairStyle: 'receding', top: '#2a3448', topStyle: 'cardigan', accent: '#b8a888', bottom: '#5a4a3a', shoes: '#2a1a12', height: 1.72, build: 1.05, glasses: true },
    schedule: [
      [
        P('library', 7.0, 4.6, PI / 2, 'phone', 'Walt paces between the shelves with his phone pressed to his ear. “No — no, nothing’s changed. Nothing’s signed.” He lowers his voice when he sees you.', {
          occupied: { not: { any: [{ met: 'blanc' }, { minEvidence: 2 }, { visited: 'study' }] } },
        }),
      ],
      [
        P('stairhall', 2.6, -1.0, -PI / 2, 'stand', 'Walt studies his father’s portraits on the stair, adjusting his glasses as if the paintings might have changed.'),
        P('library', 7.0, 4.6, PI / 2, 'phone', 'Walt is back on the phone, rubbing the bridge of his nose. “I said I’ll handle it.”'),
      ],
      [
        P('front-garden', -8.0, 20.2, PI, 'pace', 'Walt walks circles on the wet gravel under an umbrella he keeps forgetting to hold upright.'),
        P('library', 7.0, 4.6, PI / 2, 'stand', 'Walt has pulled a first edition from the shelf and is reading the dedication, lips moving.'),
      ],
    ],
  },
  {
    id: 'joni',
    name: 'Joni Thrombey',
    short: 'Joni',
    voice: { pitch: 1.18, rate: 1.0 },
    look: { skin: '#f0d0b4', hair: '#e2c98a', hairStyle: 'long', top: '#b8a8c8', topStyle: 'blouse', accent: '#d98aa0', bottom: '#e9e3d6', shoes: '#c9a96e', height: 1.68, build: 0.9, scarf: true },
    schedule: [
      [P('conservatory', -12.2, -10.0, PI / 2, 'stand', 'Joni stands with her eyes closed and palms upturned among the ferns, breathing very deliberately. One eye opens to see who has come in.')],
      [
        P('living', -8.6, 6.4, PI, 'stand', 'Joni rearranges the flowers on the sideboard and photographs the result with her phone.'),
        P('guestB', 12.0, -3.2, PI, 'stand', 'Joni folds a silk scarf into a perfect square, then shakes it out and starts again.'),
      ],
      [
        P('guestB', 12.0, -3.2, PI, 'arms-crossed', 'Joni is on the edge of the bed with an open laptop, scrolling something she closes the moment you appear.'),
        P('famcorr', -6.0, 3.0, 0, 'stand', 'Joni drifts down the family corridor, touching each door frame lightly, as if blessing them.'),
      ],
    ],
  },
  {
    id: 'meg',
    name: 'Meg Thrombey',
    short: 'Meg',
    voice: { pitch: 1.24, rate: 1.1 },
    look: { skin: '#f0cfb2', hair: '#3a2a20', hairStyle: 'long', top: '#3a4a3a', topStyle: 'hoodie', accent: '#982b39', bottom: '#2a2a33', shoes: '#e9e3d6', height: 1.64, build: 0.85 },
    schedule: [
      [P('landing', -2.8, -6.4, PI * 0.25, 'stand', 'Meg sits on the arm of Great Nana’s chair, scrolling her phone without reading it. She looks up quickly whenever someone climbs the stairs.')],
      [
        P('guestB', 10.0, -1.0, PI / 2, 'arms-crossed', 'Meg lies back across the end of the bed, earbuds in, staring at the ceiling.'),
        P('famcorr', -6.0, 3.2, PI, 'stand', 'Meg lingers outside her grandfather’s bedroom door without going in.'),
      ],
      [
        P('rear-garden', 0, -28, PI, 'stand', 'Meg stands on the lawn in the rain without an umbrella, like she wants to feel something.'),
        P('kitchen', 12.6, -12.2, -PI / 2, 'stand', 'Meg hovers near Marta in the kitchen, saying nothing, just keeping her company.'),
      ],
    ],
  },
  {
    id: 'richard',
    name: 'Richard Drysdale',
    short: 'Richard',
    voice: { pitch: 0.88, rate: 0.98 },
    look: { skin: '#e6bea0', hair: '#2a2420', hairStyle: 'short', top: '#5a4632', topStyle: 'blazer', accent: '#e9e3d6', bottom: '#2a2a2e', shoes: '#2a1a12', height: 1.8, build: 1.05, tie: true },
    schedule: [
      [P('dining', 14.2, -1.7, PI * 1.2, 'stand', 'Richard stands by the dining-room window, practising a smile in the reflection.')],
      [
        P('hall', -1.8, 4.0, 0, 'hands-behind', 'Richard greets the empty hall with a politician’s nod, then looks embarrassed to have done so.'),
        P('terrace', -5.0, -16.6, PI, 'stand', 'Richard stands on the terrace with his collar up, checking his phone and deleting something.'),
      ],
      [
        P('guestcorr', 6.0, 8.0, PI, 'pace', 'Richard paces the guest corridor with a drink, rehearsing a conversation under his breath.'),
        P('dining', 14.2, -1.7, PI * 1.2, 'arms-crossed', 'Richard stands at the dining window, jaw tight, watching the drive.'),
      ],
    ],
  },
];

/** Harlan appears only in memories. */
export const HARLAN_LOOK: Appearance = {
  skin: '#e8c4a8',
  hair: '#ece8e0',
  hairStyle: 'white',
  top: '#3a2a22',
  topStyle: 'cardigan',
  accent: '#7a1f2a',
  bottom: '#3a3a40',
  shoes: '#2a1a12',
  height: 1.76,
  build: 1.0,
  beard: true,
};

export const NPC_BY_ID: Record<string, NpcDef> = Object.fromEntries(NPCS.map((n) => [n.id, n]));

/** How long (in-game minutes) someone stays at one post before drifting to the next. */
export const POST_MINUTES = 24;

export function postFor(npc: NpcDef, act: number, playSeconds: number): { post: Post; index: number } {
  const posts = npc.schedule[Math.min(act, npc.schedule.length - 1)];
  const minutes = playSeconds / 15;
  // stagger people so the whole house doesn't move at once
  const offset = (npc.id.charCodeAt(0) * 7) % POST_MINUTES;
  const index = Math.floor((minutes + offset) / POST_MINUTES) % posts.length;
  return { post: posts[index], index };
}

export function levelOfPost(p: Post, roomLevel: (room: string) => Level): Level {
  return roomLevel(p.room);
}
