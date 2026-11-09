/**
 * Placement of every furniture piece in the estate. Collision boxes are derived
 * from each piece's footprint, so what you see is what blocks you.
 * Rotation: 0 = front faces south (+z), PI = north, PI/2 = east, -PI/2 = west.
 */
import type { Level } from './layout';
import { LEVEL_Y, ROOM_BY_ID } from './layout';

export interface Placement {
  t: string;
  level: Level;
  x: number;
  z: number;
  /** Height above the storey floor. */
  y?: number;
  r?: number;
  p?: Record<string, unknown>;
  /** Set false to skip collision. */
  solid?: boolean;
}

const PI = Math.PI;
const H = PI / 2;
const F = (t: string, level: Level, x: number, z: number, r = 0, p: Record<string, unknown> = {}, y?: number, solid?: boolean): Placement => ({
  t,
  level,
  x,
  z,
  r,
  p,
  y,
  solid,
});
/** Ceiling-hung fixture in a room. */
const ceil = (t: string, room: string, x: number, z: number, p: Record<string, unknown> = {}) => {
  const rm = ROOM_BY_ID[room];
  return F(t, rm.level, x, z, 0, p, rm.height, false);
};

export const FURNISHINGS: Placement[] = [
  // ─────── Entrance hall ───────
  ceil('chandelier', 'hall', 0, 6, { r: 0.95, drop: 2.6, tiers: 2 }),
  F('rug', 0, 0, 6.2, 0, { w: 3.4, d: 5.2, a: '#3a1218', b: '#b69a65' }),
  F('roundTable', 0, 0, 5.8, 0, { r: 0.75 }),
  F('vase', 0, 0, 5.8, 0, {}, 0.83, false),
  F('console', 0, 3.66, 3.5, -H),
  F('tableLamp', 0, 3.7, 2.9, 0, {}, 0.86, false),
  F('bench', 0, 3.65, 8.3, -H, { w: 1.2 }),
  F('coatStand', 0, -3.3, 9.4),
  F('umbrellaStand', 0, -2.5, 9.6),
  F('plantPot', 0, 3.4, 9.5, 0, { s: 1.2 }),

  // ─────── Grand staircase ───────
  F('console', 0, -3.66, -2.0, H, { w: 1.0 }),
  F('vase', 0, -3.66, -2.0, 0, {}, 0.86, false),
  F('console', 0, 3.66, -2.0, -H, { w: 1.0 }),
  F('tableLamp', 0, 3.7, -2.0, 0, {}, 0.86, false),
  F('plantPot', 0, -3.3, -7.3, 0, { s: 1.3 }),
  F('plantPot', 0, 3.3, -7.3, 0, { s: 1.3 }),
  ceil('pendant', 'stairhall', -2.7, -6.5, { drop: 0.6 }),
  ceil('pendant', 'stairhall', 2.7, -6.5, { drop: 0.6 }),

  // ─────── Living room ───────
  F('fireplace', 0, -15.5, 5, H),
  F('rug', 0, -12.2, 5, 0, { w: 4.2, d: 4.4, a: '#2d3424', b: '#8a6a32' }),
  F('sofa', 0, -11.0, 5, -H, { c: '#5a2028' }),
  F('coffeeTable', 0, -12.7, 5, H, { w: 1.3, d: 0.65 }),
  F('armchair', 0, -13.6, 2.4, 0.3, { c: '#3a2a1a' }),
  F('armchair', 0, -13.6, 7.6, PI - 0.3, { c: '#3a2a1a' }),
  F('floorLamp', 0, -15.3, 2.4),
  F('floorLamp', 0, -15.3, 7.6),
  F('sideTable', 0, -11.0, 6.7),
  F('tableLamp', 0, -11.0, 6.7, 0, {}, 0.62, false),
  F('sideboard', 0, -8, 9.6, PI),
  F('piano', 0, -4.49, 2.5, -H),
  F('plantPot', 0, -4.7, 9.4, 0, { s: 1.2 }),
  F('armchair', 0, -6.6, 7.4, PI + 0.6, { c: '#632331' }),
  ceil('chandelier', 'living', -10, 5, { r: 0.7, drop: 0.9 }),

  // ─────── Harlan's study ───────
  F('desk', 0, -13, -4, -H),
  F('deskChair', 0, -14.1, -4, H),
  F('tableLamp', 0, -12.7, -4.75, 0, {}, 0.79, false),
  F('bookshelf', 0, -13.3, -0.35, PI, { w: 4.6, h: 3.4 }),
  F('bookshelf', 0, -6.7, -0.35, PI, { w: 3.6, h: 3.4 }),
  F('daybed', 0, -8, -7.41, 0),
  F('coffeeTable', 0, -9.5, -4, 0, { w: 0.75, d: 0.75 }),
  F('diningChair', 0, -9.5, -3.15, PI),
  F('diningChair', 0, -9.5, -4.85, 0),
  F('sideTable', 0, -6.2, -1.3),
  F('armchair', 0, -5.0, -2.6, -H - 0.3, { c: '#1d2a1d' }),
  F('rug', 0, -10, -4, 0, { w: 5.2, d: 3.6, a: '#1d2638', b: '#8a6a32' }),
  F('marker', 0, -6.75, -5.95, 0.4, { n: 1 }, 0, false),
  F('marker', 0, -7.6, -6.75, -0.3, { n: 2 }, 0, false),
  F('marker', 0, -9.1, -3.6, 0.2, { n: 3 }, 0.46, false),
  F('floorLamp', 0, -15.2, -7.3),
  ceil('chandelier', 'study', -10, -4, { r: 0.6, drop: 0.8 }),

  // ─────── Library ───────
  F('bookshelf', 0, 6.7, 0.35, 0, { w: 4.6, h: 3.6 }),
  F('bookshelf', 0, 13.4, 0.35, 0, { w: 4.6, h: 3.6 }),
  F('bookshelf', 0, 4.35, 2.7, H, { w: 4, h: 3.6 }),
  F('bookshelf', 0, 4.35, 8.6, H, { w: 2.4, h: 3.6 }),
  F('fireplace', 0, 15.5, 5, -H),
  F('armchair', 0, 12.4, 3.5, 1.12, { c: '#4a2a1c' }),
  F('armchair', 0, 12.4, 6.5, 2.02, { c: '#4a2a1c' }),
  F('sideTable', 0, 12.0, 5.0),
  F('tableLamp', 0, 12.0, 5.0, 0, {}, 0.62, false),
  F('rug', 0, 10.5, 5, 0, { w: 6, d: 4.6, a: '#4a1820', b: '#b69a65' }),
  F('roundTable', 0, 8.4, 6.6, 0, { r: 0.6, h: 0.76 }),
  F('diningChair', 0, 8.4, 7.45, PI),
  F('diningChair', 0, 7.55, 6.6, H),
  F('floorLamp', 0, 14.6, 8.9),
  ceil('chandelier', 'library', 10, 5, { r: 0.75, drop: 0.9 }),

  // ─────── Dining room ───────
  F('rug', 0, 10.5, -4, 0, { w: 7.4, d: 3.6, a: '#3a1218', b: '#8a6a32' }),
  F('diningTable', 0, 10.5, -4, 0, { l: 5.4, d: 1.4 }),
  ...[8.6, 9.8, 11.0, 12.2].flatMap((x) => [F('diningChair', 0, x, -5.15, 0, {}, undefined, false), F('diningChair', 0, x, -2.85, PI, {}, undefined, false)]),
  F('diningChair', 0, 7.35, -4, H, {}, undefined, false),
  F('diningChair', 0, 13.65, -4, -H, {}, undefined, false),
  F('sideboard', 0, 6.8, -7.6, 0),
  F('sideboard', 0, 13.4, -7.6, 0),
  F('tableLamp', 0, 6.2, -7.6, 0, {}, 0.9, false),
  F('tableLamp', 0, 14.0, -7.6, 0, {}, 0.9, false),
  F('vase', 0, 9.6, -4, 0, {}, 0.78, false),
  ceil('chandelier', 'dining', 10.5, -4, { r: 0.85, drop: 1.0 }),

  // ─────── Kitchen ───────
  F('counter', 0, 6.2, -13.53, 0, { l: 4, upper: false }),
  F('stove', 0, 9.9, -13.5, 0),
  F('counter', 0, 13.8, -13.53, 0, { l: 4, upper: false }),
  F('fridge', 0, 15.49, -9.0, -H),
  F('counter', 0, 10, -11, 0, { l: 2.8, upper: false }),
  ceil('panRack', 'kitchen', 10, -11),
  ceil('pendant', 'kitchen', 7.4, -11, { drop: 0.9 }),
  ceil('pendant', 'kitchen', 12.6, -11, { drop: 0.9 }),
  F('plantPot', 0, 4.6, -8.6, 0, { s: 0.8, c: '#4a5a2a' }),

  // ─────── Rear hall ───────
  F('bench', 0, 3.63, -9.4, -H, { w: 1.2 }),
  F('coatStand', 0, 0.3, -13.4),
  F('umbrellaStand', 0, -1.2, -13.6),
  ceil('pendant', 'backhall', 0.6, -11, { drop: 0.6 }),

  // ─────── Conservatory ───────
  F('plantPot', 0, -15.1, -8.9, 0, { s: 1.5 }),
  F('plantPot', 0, -4.9, -13.1, 0, { s: 1.4, c: '#2a3a1e' }),
  F('plantPot', 0, -4.9, -8.9, 0, { s: 1.2 }),
  F('plantPot', 0, -12.6, -13.2, 0, { s: 1.1, c: '#2a3a1e' }),
  F('wickerChair', 0, -7.2, -10.4, 2.4),
  F('wickerChair', 0, -7.2, -12.6, 0.8),
  F('roundTable', 0, -6.2, -11.5, 0, { r: 0.45, h: 0.7 }),
  F('floorLamp', 0, -13.0, -9.0),

  // ─────── Garage ───────
  F('car', 0, 25.5, -2, 0, { c: '#2a3a2a', vintage: true }),
  F('metalShelf', 0, 25, 3.63, PI, { l: 3 }),
  F('crates', 0, 28.6, -7.0, 0, { n: 4 }),
  ceil('bareBulb', 'garage', 25, -2, { drop: 0.6 }),

  // ─────── Upstairs landing ───────
  F('console', 1, 0, -7.66, 0, { w: 1.2 }),
  F('vase', 1, 0.3, -7.66, 0, {}, 0.86, false),
  F('floorLamp', 1, 3.5, -7.5),
  F('plantPot', 1, -3.4, 1.3, 0, { s: 1.1 }),
  ceil('chandelier', 'landing', 0, -6.2, { r: 0.5, drop: 0.6 }),

  // ─────── Family corridor ───────
  F('runner', 1, -6, 1, 0, { w: 1.4, d: 16 }),
  F('console', 1, -7.66, 1.5, H, { w: 1.2 }),
  F('vase', 1, -7.66, 1.5, 0, {}, 0.86, false),
  ceil('pendant', 'famcorr', -6, -5, { drop: 0.5 }),
  ceil('pendant', 'famcorr', -6, 1, { drop: 0.5 }),
  ceil('pendant', 'famcorr', -6, 7.5, { drop: 0.5 }),

  // ─────── Harlan's bedroom ───────
  F('bed', 1, -12, 8.73, PI, { c: '#632331' }),
  F('nightstand', 1, -10.6, 9.45, PI, { lamp: false }),
  F('tableLamp', 1, -10.45, 9.6, 0, {}, 0.625, false),
  F('nightstand', 1, -13.4, 9.45, PI),
  F('wardrobe', 1, -8.47, 3.2, -H),
  F('dresser', 1, -9.8, 2.42, 0, { w: 1.2 }),
  F('armchair', 1, -14.6, 4.4, 1.2, { c: '#3a2a1a' }),
  F('rug', 1, -12, 5.4, 0, { w: 3.6, d: 2.6, a: '#2a1a2a', b: '#b69a65' }),
  ceil('chandelier', 'harlan', -12, 5.5, { r: 0.5, drop: 0.6 }),

  // ─────── Private sitting room ───────
  F('console', 1, -9.6, 1.66, PI, { w: 1.2 }),
  F('deskChair', 1, -9.6, 0.8, PI),
  F('fireplace', 1, -15.5, -3, H, { lit: false }),
  F('sofa', 1, -12, -7.39, 0, { c: '#3a4a2e' }),
  F('coffeeTable', 1, -12, -5.7, 0),
  F('armchair', 1, -12.8, -2.0, 2.3, { c: '#632331' }),
  F('armchair', 1, -12.8, -4.2, 0.9, { c: '#632331' }),
  F('floorLamp', 1, -9.0, -7.3),
  F('rug', 1, -12, -4.6, 0, { w: 4, d: 4.4, a: '#2d3424', b: '#8a6a32' }),
  ceil('chandelier', 'sitting', -12, -3, { r: 0.55, drop: 0.6 }),

  // ─────── Guest corridor ───────
  F('runner', 1, 6, 1, 0, { w: 1.4, d: 16 }),
  F('console', 1, 7.66, 1.5, -H, { w: 1.2 }),
  F('tableLamp', 1, 7.66, 1.5, 0, {}, 0.86, false),
  ceil('pendant', 'guestcorr', 6, -5, { drop: 0.5 }),
  ceil('pendant', 'guestcorr', 6, 1, { drop: 0.5 }),
  ceil('pendant', 'guestcorr', 6, 7.5, { drop: 0.5 }),

  // ─────── Blue Room (Ransom) ───────
  F('bed', 1, 12, 8.73, PI, { c: '#1d2638', posts: false, w: 1.8 }),
  F('nightstand', 1, 10.6, 9.45, PI),
  F('nightstand', 1, 13.4, 9.45, PI, { lamp: false }),
  F('wardrobe', 1, 12, 2.45, 0),
  F('armchair', 1, 14.8, 6.0, -H, { c: '#1d2638' }),
  F('rug', 1, 12, 6, 0, { w: 3.4, d: 2.4, a: '#1d2638', b: '#8a6a32' }),
  ceil('pendant', 'guestA', 12, 6, { drop: 0.5 }),

  // ─────── Garden Room (Joni & Meg) ───────
  F('bed', 1, 10.8, -6.73, 0, { c: '#66684d', posts: false, w: 1.2 }),
  F('bed', 1, 13.6, -6.73, 0, { c: '#632331', posts: false, w: 1.2 }),
  F('nightstand', 1, 15.0, -7.55, 0, { lamp: false }),
  F('nightstand', 1, 12.2, -7.55, 0),
  F('dresser', 1, 12, 1.58, PI, { w: 1.3 }),
  F('rug', 1, 12, -3.4, 0, { w: 3.6, d: 2.4, a: '#2d3424', b: '#b69a65' }),
  ceil('pendant', 'guestB', 12, -3, { drop: 0.5 }),

  // ─────── Service corridor ───────
  F('pipes', -1, 2.9, -12, H, { l: 12 }, 2.85, false),
  F('metalShelf', -1, 3.63, -16, -H, { l: 2 }),
  F('crates', -1, -2.6, -17.1, 0, { n: 3 }),
  ceil('bareBulb', 'servcorr', 0, -16, { drop: 0.4 }),
  ceil('bareBulb', 'servcorr', 0.8, -9.5, { drop: 0.4 }),

  // ─────── Basement ───────
  F('wineRack', -1, 6.5, -6.37, PI, { l: 4 }),
  F('wineRack', -1, 11.5, -6.37, PI, { l: 4 }),
  F('wineRack', -1, 4.37, -16, H, { l: 3 }),
  F('boiler', -1, 12.6, -9.2),
  F('securityDesk', -1, 13.51, -15.4, -H),
  F('deskChair', -1, 12.6, -15.4, H),
  F('crates', -1, 7.5, -17.2, 0, { n: 5 }),
  F('pipes', -1, 9, -17.6, 0, { l: 10 }, 2.85, false),
  ceil('bareBulb', 'cellar', 7.5, -12, { drop: 0.4 }),
  ceil('bareBulb', 'cellar', 12, -14.5, { drop: 0.4 }),

  // ─────── Storage room ───────
  F('sheeted', -1, -8, -12.4, 0, { w: 2.2, h: 1.0, d: 1.0 }),
  F('sheeted', -1, -11.2, -12.8, 0.3, { w: 1.2, h: 1.7, d: 0.8 }),
  F('crates', -1, -13.2, -10.9, 0, { n: 4 }),
  F('metalShelf', -1, -9, -10.37, PI, { l: 3 }),
  F('sheeted', -1, -8.6, -16.9, 0, { w: 1.4, h: 1.3, d: 1.2 }),
  ceil('bareBulb', 'storage', -9, -14, { drop: 0.4 }),

  // ─────── Grounds ───────
  F('gatePillar', 0, -3.5, 47),
  F('gatePillar', 0, 3.5, 47),
  F('ironGate', 0, 0, 47, 0, { w: 6, open: 1.1 }, 0, false),
  // estate hedge wall
  F('hedge', 0, -25, 47.6, 0, { w: 42, h: 2.6, d: 1.4 }),
  F('hedge', 0, 25, 47.6, 0, { w: 42, h: 2.6, d: 1.4 }),
  F('hedge', 0, 0, -50.6, 0, { w: 94, h: 2.6, d: 1.4 }),
  F('hedge', 0, -46.6, -1.5, H, { w: 98, h: 2.6, d: 1.4 }),
  F('hedge', 0, 46.6, -1.5, H, { w: 98, h: 2.6, d: 1.4 }),
  // drive lamps
  ...[14, 26, 36, 44].flatMap((z) => [F('lampPost', 0, -5.4, z, 0, {}, 0), F('lampPost', 0, 5.4, z, 0, {}, 0)]),
  F('lampPost', 0, -16.5, -22.5, 0, {}, 0),
  F('lampPost', 0, 16.5, -22.5, 0, {}, 0),
  F('lampPost', 0, 19.8, 8, 0, {}, 0),
  // portico columns
  F('portico', 0, 0, 10, 0, {}, 0, false),
  // parterre hedges in the front garden
  ...[
    [-12, 16],
    [-12, 24],
    [-20, 16],
    [-20, 24],
    [12, 34],
    [20, 34],
    [-12, 34],
    [-20, 34],
  ].map(([x, z]) => F('hedge', 0, x, z, 0, { w: 5, h: 1.1, d: 5 })),
  F('urn', 0, -16, 20),
  F('urn', 0, -16, 34),
  F('cypress', 0, -17.6, 11.4, 0, {}, 0, false),
  F('cypress', 0, 17.6, 11.4, 0, {}, 0, false),
  F('cypress', 0, -7.2, 11.2, 0, {}, 0, false),
  F('cypress', 0, 7.2, 11.2, 0, {}, 0, false),
  // parked cars — note the empty bay
  F('car', 0, 12, 18.5, H, { c: '#632331' }),
  F('car', 0, 16.5, 18.5, H, { c: '#171e2a' }),
  F('car', 0, 21, 18.5, H, { c: '#d9cbaf' }),
  F('car', 0, 29, 24.5, H, { c: '#39271f' }),
  // terrace
  F('balustrade', 0, -9, -22, 0, { l: 14 }, 0),
  F('balustrade', 0, 9, -22, 0, { l: 14 }, 0),
  F('balustrade', 0, -16, -18, H, { l: 8 }, 0),
  F('balustrade', 0, 16, -18, H, { l: 8 }, 0),
  F('urn', 0, -2.6, -22),
  F('urn', 0, 2.6, -22),
  F('gardenBench', 0, -10, -15.6, 0),
  F('wickerChair', 0, 7, -17.4, 0.6),
  F('wickerChair', 0, 9.2, -17.4, -0.6),
  F('roundTable', 0, 8.1, -18.6, 0, { r: 0.5, h: 0.72 }),
  // rear garden
  F('statue', 0, 0, -34),
  F('hedge', 0, -10, -30, 0, { w: 12, h: 1.2, d: 1 }),
  F('hedge', 0, 10, -30, 0, { w: 12, h: 1.2, d: 1 }),
  F('hedge', 0, -10, -38, 0, { w: 12, h: 1.2, d: 1 }),
  F('hedge', 0, 10, -38, 0, { w: 12, h: 1.2, d: 1 }),
  F('gardenBench', 0, -5, -40, PI),
  F('gardenBench', 0, 5, -40, PI),
  F('cypress', 0, -16, -34, 0, {}, 0, false),
  F('cypress', 0, 16, -34, 0, {}, 0, false),
];

/** Round obstacles (tree trunks, posts, fountain). */
export const CIRCLES: { level: Level; x: number; z: number; r: number }[] = [
  { level: 0, x: 0, z: 22, r: 2.5 },
  { level: 0, x: -2.6, z: 12.3, r: 0.3 },
  { level: 0, x: 2.6, z: 12.3, r: 0.3 },
];

export const TREES: { x: number; z: number; h: number; c: string; seed: number }[] = [
  { x: -14, z: 41, h: 10, c: '#7a3a1a', seed: 1 },
  { x: -28, z: 30, h: 11, c: '#8a5a1c', seed: 2 },
  { x: -34, z: 14, h: 9, c: '#5a2a14', seed: 3 },
  { x: 14, z: 41, h: 10, c: '#8a3a1a', seed: 4 },
  { x: 30, z: 38, h: 12, c: '#6a5a24', seed: 5 },
  { x: 36, z: 12, h: 10, c: '#7a3a1a', seed: 6 },
  { x: -36, z: -4, h: 11, c: '#8a5a1c', seed: 7 },
  { x: -28, z: -24, h: 10, c: '#5a2a14', seed: 8 },
  { x: 24, z: -30, h: 11, c: '#7a3a1a', seed: 9 },
  { x: -12, z: -44, h: 12, c: '#6a5a24', seed: 10 },
  { x: 14, z: -44, h: 10, c: '#8a3a1a', seed: 11 },
  { x: 38, z: -20, h: 9, c: '#5a2a14', seed: 12 },
  { x: -38, z: -38, h: 12, c: '#7a3a1a', seed: 13 },
  { x: 36, z: -42, h: 11, c: '#8a5a1c', seed: 14 },
  { x: -24, z: 4, h: 9, c: '#8a3a1a', seed: 15 },
];

/** Gravel and paving drawn on the grounds (also used by the floor plan). */
export const PATHS: { x0: number; z0: number; x1: number; z1: number; kind: 'gravel' | 'stone' | 'mud' }[] = [
  { x0: -4.5, z0: 10, x1: 4.5, z1: 48, kind: 'gravel' },
  { x0: 4.5, z0: 15, x1: 31, z1: 28, kind: 'gravel' },
  { x0: 4.5, z0: 10.5, x1: 19.5, z1: 13.5, kind: 'gravel' },
  { x0: 16.5, z0: -6, x1: 20, z1: 13.5, kind: 'gravel' },
  { x0: 16, z0: -12.5, x1: 18, z1: -6, kind: 'gravel' },
  { x0: -16, z0: -22, x1: 16, z1: -14, kind: 'stone' },
  { x0: -2, z0: -40, x1: 2, z1: -22, kind: 'stone' },
  { x0: -18.4, z0: 5.6, x1: -16.35, z1: 10, kind: 'mud' },
];

export function placementY(p: Placement) {
  return LEVEL_Y[p.level] + (p.y ?? 0);
}
