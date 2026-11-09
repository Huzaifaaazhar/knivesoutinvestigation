/**
 * The single source of truth for the Thrombey estate's architecture.
 *
 * Everything spatial is derived from this file: wall geometry, collision,
 * the printed floor plan, navigation assistance and room tracking. Because
 * the floor plan and the 3D mansion read the same data, they can never drift
 * apart.
 *
 * Coordinate system: metres. +x is east, +z is south (towards the main gate),
 * y is up. "North" edges are at rect.z0, "south" edges at rect.z1.
 */

export type Level = -1 | 0 | 1;

export const LEVELS: Level[] = [-1, 0, 1];

export const LEVEL_Y: Record<Level, number> = { [-1]: -3.6, 0: 0, 1: 4.4 } as Record<Level, number>;

export const LEVEL_NAMES: Record<Level, string> = {
  [-1]: 'Lower Floor',
  0: 'Ground Floor',
  1: 'Upper Floor',
} as Record<Level, string>;

export interface Rect {
  x0: number;
  z0: number;
  x1: number;
  z1: number;
}

export type Edge = 'n' | 's' | 'e' | 'w';

export type WallFinish =
  | 'damask-burgundy'
  | 'damask-olive'
  | 'damask-blue'
  | 'panel-walnut'
  | 'plaster'
  | 'brick'
  | 'tile'
  | 'glass'
  | 'stone';

export type FloorFinish = 'parquet' | 'carpet' | 'checker' | 'stone' | 'tile' | 'concrete';

export interface RoomDef {
  id: string;
  name: string;
  level: Level;
  rect: Rect;
  height: number;
  wall: WallFinish;
  floor: FloorFinish;
  /** Override finish for particular edges (e.g. glass conservatory with one brick wall). */
  edgeFinish?: Partial<Record<Edge, WallFinish>>;
  /** Override wall height for particular edges (e.g. the hall's gallery side). */
  edgeHeight?: Partial<Record<Edge, number>>;
  /** Edges rendered as a balustrade rather than a wall. */
  balustrade?: Edge[];
  /** Short description used by the floor plan and notebook. */
  blurb: string;
  /** Building the room belongs to, used for facades and rooflines. */
  building: 'mansion' | 'garage';
}

export type DoorKind = 'door' | 'double' | 'arch' | 'glass' | 'garage';

export interface DoorLock {
  /** 'key' doors need an inventory item; 'bolt' doors can be unbolted from one side. */
  type: 'key' | 'bolt';
  keyId?: string;
  /** For bolts: the room from which the bolt can be drawn back. */
  fromRoom?: string;
  message: string;
}

export interface DoorDef {
  id: string;
  /** Rooms or exterior zones on either side. */
  a: string;
  b: string;
  level: Level;
  /** 'z' = the door sits on a wall line of constant z (spans along x). */
  line: 'x' | 'z';
  x: number;
  z: number;
  width: number;
  height: number;
  kind: DoorKind;
  lock?: DoorLock;
  startsOpen?: boolean;
  /** Label used in prompts. */
  label?: string;
}

export interface StairDef {
  id: string;
  name: string;
  rect: Rect;
  /** Stairs always run along z in this house. */
  lowAt: number;
  highAt: number;
  lowLevel: Level;
  highLevel: Level;
}

export interface ZoneDef {
  id: string;
  name: string;
  rects: Rect[];
  blurb: string;
}

const r = (x0: number, z0: number, x1: number, z1: number): Rect => ({ x0, z0, x1, z1 });

export const ROOMS: RoomDef[] = [
  // ───────────── Ground floor ─────────────
  {
    id: 'hall',
    name: 'Entrance Hall',
    level: 0,
    rect: r(-4, 2, 4, 10),
    height: 8,
    wall: 'panel-walnut',
    floor: 'checker',
    edgeHeight: { n: 4.4 },
    blurb: 'Double-height hall beneath the gallery. Portraits watch the door.',
    building: 'mansion',
  },
  {
    id: 'stairhall',
    name: 'Grand Staircase',
    level: 0,
    rect: r(-4, -8, 4, 2),
    height: 4,
    wall: 'damask-burgundy',
    floor: 'parquet',
    blurb: 'The main stair rises north to the upstairs landing.',
    building: 'mansion',
  },
  {
    id: 'living',
    name: 'Living Room',
    level: 0,
    rect: r(-16, 0, -4, 10),
    height: 4,
    wall: 'damask-olive',
    floor: 'parquet',
    blurb: 'Where the family gathered for the party. Home of the knife display.',
    building: 'mansion',
  },
  {
    id: 'study',
    name: "Harlan's Study",
    level: 0,
    rect: r(-16, -8, -4, 0),
    height: 4,
    wall: 'panel-walnut',
    floor: 'carpet',
    blurb: 'Where Harlan Thrombey was found. The police tape is still up.',
    building: 'mansion',
  },
  {
    id: 'library',
    name: 'Library',
    level: 0,
    rect: r(4, 0, 16, 10),
    height: 4,
    wall: 'panel-walnut',
    floor: 'parquet',
    blurb: "Forty years of mystery novels — most of them Harlan's own.",
    building: 'mansion',
  },
  {
    id: 'dining',
    name: 'Dining Room',
    level: 0,
    rect: r(4, -8, 16, 0),
    height: 4,
    wall: 'damask-burgundy',
    floor: 'parquet',
    blurb: 'The table is still laid from the eighty-fifth birthday dinner.',
    building: 'mansion',
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    level: 0,
    rect: r(4, -14, 16, -8),
    height: 4,
    wall: 'tile',
    floor: 'tile',
    blurb: "Fran's domain. Copper pans and the smell of coffee.",
    building: 'mansion',
  },
  {
    id: 'backhall',
    name: 'Rear Hall',
    level: 0,
    rect: r(-4, -14, 4, -8),
    height: 4,
    wall: 'plaster',
    floor: 'stone',
    blurb: 'Boots, coats, and the narrow stair down to the cellars.',
    building: 'mansion',
  },
  {
    id: 'conservatory',
    name: 'Conservatory',
    level: 0,
    rect: r(-16, -14, -4, -8),
    height: 4,
    wall: 'glass',
    floor: 'stone',
    edgeFinish: { s: 'brick', e: 'brick' },
    blurb: 'Glass, ferns and rain. A door opens onto the terrace.',
    building: 'mansion',
  },
  {
    id: 'garage',
    name: 'Garage',
    level: 0,
    rect: r(20, -8, 30, 4),
    height: 4.2,
    wall: 'brick',
    floor: 'concrete',
    blurb: 'Separate brick garage at the end of the service drive.',
    building: 'garage',
  },

  // ───────────── Upper floor ─────────────
  {
    id: 'landing',
    name: 'Upstairs Landing',
    level: 1,
    rect: r(-4, -8, 4, 2),
    height: 3.6,
    wall: 'damask-burgundy',
    floor: 'parquet',
    balustrade: ['s'],
    blurb: 'The gallery looks down over the entrance hall.',
    building: 'mansion',
  },
  {
    id: 'famcorr',
    name: 'Family Corridor',
    level: 1,
    rect: r(-8, -8, -4, 10),
    height: 3.6,
    wall: 'damask-blue',
    floor: 'carpet',
    blurb: "West corridor to Harlan's private rooms.",
    building: 'mansion',
  },
  {
    id: 'harlan',
    name: "Harlan's Bedroom",
    level: 1,
    rect: r(-16, 2, -8, 10),
    height: 3.6,
    wall: 'damask-burgundy',
    floor: 'carpet',
    blurb: 'A four-poster, a reading lamp, and a window over the west lawn.',
    building: 'mansion',
  },
  {
    id: 'sitting',
    name: 'Private Sitting Room',
    level: 1,
    rect: r(-16, -8, -8, 2),
    height: 3.6,
    wall: 'damask-olive',
    floor: 'carpet',
    blurb: "Harlan's retreat. The connecting door to his bedroom is bolted.",
    building: 'mansion',
  },
  {
    id: 'guestcorr',
    name: 'Guest Corridor',
    level: 1,
    rect: r(4, -8, 8, 10),
    height: 3.6,
    wall: 'damask-blue',
    floor: 'carpet',
    blurb: 'East corridor serving the guest rooms.',
    building: 'mansion',
  },
  {
    id: 'guestA',
    name: 'Guest Bedroom — Blue Room',
    level: 1,
    rect: r(8, 2, 16, 10),
    height: 3.6,
    wall: 'damask-blue',
    floor: 'carpet',
    blurb: 'Where Ransom stayed the night of the party — briefly.',
    building: 'mansion',
  },
  {
    id: 'guestB',
    name: 'Guest Bedroom — Garden Room',
    level: 1,
    rect: r(8, -8, 16, 2),
    height: 3.6,
    wall: 'damask-olive',
    floor: 'carpet',
    blurb: "Joni and Meg's room. Crystals on the nightstand.",
    building: 'mansion',
  },

  // ───────────── Lower floor ─────────────
  {
    id: 'servcorr',
    name: 'Service Corridor',
    level: -1,
    rect: r(-4, -18, 4, -6),
    height: 3.2,
    wall: 'brick',
    floor: 'stone',
    blurb: 'Bare bulbs and pipework beneath the rear hall.',
    building: 'mansion',
  },
  {
    id: 'cellar',
    name: 'Basement',
    level: -1,
    rect: r(4, -18, 14, -6),
    height: 3.2,
    wall: 'brick',
    floor: 'stone',
    blurb: 'Wine racks, the boiler, and the security recorder.',
    building: 'mansion',
  },
  {
    id: 'storage',
    name: 'Storage Room',
    level: -1,
    rect: r(-14, -18, -4, -10),
    height: 3.2,
    wall: 'brick',
    floor: 'concrete',
    blurb: 'Decades of Thrombey clutter under dust sheets.',
    building: 'mansion',
  },
];

export const ZONES: ZoneDef[] = [
  { id: 'gate', name: 'Main Gate', rects: [r(-12, 34, 12, 48)], blurb: 'Wrought-iron gates on the county road.' },
  {
    id: 'driveway',
    name: 'Driveway',
    rects: [r(-6, 10, 6, 34), r(16, -14, 36, 10)],
    blurb: 'Gravel drive from the gate, with a service spur to the garage.',
  },
  { id: 'parking', name: 'Parking Area', rects: [r(6, 12, 32, 30)], blurb: 'Where the family left their cars.' },
  { id: 'terrace', name: 'Terrace', rects: [r(-16, -22, 16, -14)], blurb: 'Stone terrace behind the house.' },
  {
    id: 'rear-garden',
    name: 'Rear Garden',
    rects: [r(-48, -52, 48, -14), r(-48, -14, -16, 10)],
    blurb: 'Lawns, hedges and the west lawn below Harlan’s window.',
  },
  { id: 'front-garden', name: 'Front Garden', rects: [r(-48, 10, 48, 50), r(16, -14, 48, 10)], blurb: 'Clipped box hedges and dripping elms.' },
];

export const STAIRS: StairDef[] = [
  {
    id: 'grand-stair',
    name: 'Grand Staircase',
    rect: r(-1.5, -5.5, 1.5, 1.5),
    lowAt: 1.5,
    highAt: -5.5,
    lowLevel: 0,
    highLevel: 1,
  },
  {
    id: 'cellar-stair',
    name: 'Cellar Stair',
    rect: r(-3.6, -13.6, -2.2, -8.8),
    lowAt: -13.6,
    highAt: -8.8,
    lowLevel: -1,
    highLevel: 0,
  },
];

const D = (d: DoorDef) => d;

export const DOORS: DoorDef[] = [
  // Exterior
  D({ id: 'front-door', a: 'hall', b: 'driveway', level: 0, line: 'z', x: 0, z: 10, width: 2.4, height: 3.4, kind: 'double', label: 'Front Door' }),
  D({ id: 'terrace-door', a: 'backhall', b: 'terrace', level: 0, line: 'z', x: 2, z: -14, width: 1.2, height: 2.6, kind: 'door', label: 'Back Door' }),
  D({ id: 'conservatory-door', a: 'conservatory', b: 'terrace', level: 0, line: 'z', x: -10, z: -14, width: 1.8, height: 2.8, kind: 'glass', label: 'Garden Door' }),
  D({ id: 'kitchen-door', a: 'kitchen', b: 'driveway', level: 0, line: 'x', x: 16, z: -11, width: 1.2, height: 2.6, kind: 'door', label: 'Service Door' }),
  D({ id: 'garage-door', a: 'garage', b: 'driveway', level: 0, line: 'x', x: 20, z: -2, width: 5, height: 3.2, kind: 'garage', startsOpen: true, label: 'Garage Doors' }),

  // Ground floor
  D({ id: 'hall-arch', a: 'hall', b: 'stairhall', level: 0, line: 'z', x: 0, z: 2, width: 6, height: 3.6, kind: 'arch' }),
  D({ id: 'hall-living', a: 'hall', b: 'living', level: 0, line: 'x', x: -4, z: 6, width: 2, height: 3, kind: 'double', label: 'Living Room Doors' }),
  D({ id: 'hall-library', a: 'hall', b: 'library', level: 0, line: 'x', x: 4, z: 6, width: 2, height: 3, kind: 'double', label: 'Library Doors' }),
  D({ id: 'living-study', a: 'living', b: 'study', level: 0, line: 'z', x: -10, z: 0, width: 1.2, height: 2.7, kind: 'door', label: 'Study Door' }),
  D({ id: 'stair-study', a: 'stairhall', b: 'study', level: 0, line: 'x', x: -4, z: -4, width: 1.2, height: 2.7, kind: 'door', label: 'Study Door' }),
  D({ id: 'study-conservatory', a: 'study', b: 'conservatory', level: 0, line: 'z', x: -10, z: -8, width: 1.4, height: 2.7, kind: 'glass', label: 'Conservatory Door' }),
  D({ id: 'library-dining', a: 'library', b: 'dining', level: 0, line: 'z', x: 10, z: 0, width: 2, height: 3, kind: 'double', label: 'Dining Room Doors' }),
  D({ id: 'stair-dining', a: 'stairhall', b: 'dining', level: 0, line: 'x', x: 4, z: -4, width: 1.2, height: 2.7, kind: 'door', label: 'Dining Room Door' }),
  D({ id: 'dining-kitchen', a: 'dining', b: 'kitchen', level: 0, line: 'z', x: 10, z: -8, width: 1.2, height: 2.6, kind: 'door', label: 'Kitchen Door' }),
  D({ id: 'stair-backhall', a: 'stairhall', b: 'backhall', level: 0, line: 'z', x: 0, z: -8, width: 1.4, height: 2.6, kind: 'door', label: 'Rear Hall Door' }),
  D({ id: 'backhall-kitchen', a: 'backhall', b: 'kitchen', level: 0, line: 'x', x: 4, z: -11, width: 1.2, height: 2.6, kind: 'door', label: 'Kitchen Door' }),

  // Upper floor
  D({ id: 'landing-famcorr', a: 'landing', b: 'famcorr', level: 1, line: 'x', x: -4, z: -3, width: 2, height: 2.9, kind: 'arch' }),
  D({ id: 'landing-guestcorr', a: 'landing', b: 'guestcorr', level: 1, line: 'x', x: 4, z: -3, width: 2, height: 2.9, kind: 'arch' }),
  D({ id: 'famcorr-harlan', a: 'famcorr', b: 'harlan', level: 1, line: 'x', x: -8, z: 6, width: 1.2, height: 2.6, kind: 'door', label: "Harlan's Bedroom" }),
  D({ id: 'famcorr-sitting', a: 'famcorr', b: 'sitting', level: 1, line: 'x', x: -8, z: -3, width: 1.2, height: 2.6, kind: 'door', label: 'Sitting Room Door' }),
  D({
    id: 'harlan-sitting',
    a: 'harlan',
    b: 'sitting',
    level: 1,
    line: 'z',
    x: -12,
    z: 2,
    width: 1.1,
    height: 2.5,
    kind: 'door',
    label: 'Connecting Door',
    lock: { type: 'bolt', fromRoom: 'harlan', message: 'Bolted from the bedroom side.' },
  }),
  D({ id: 'guestcorr-a', a: 'guestcorr', b: 'guestA', level: 1, line: 'x', x: 8, z: 6, width: 1.2, height: 2.6, kind: 'door', label: 'Blue Room' }),
  D({ id: 'guestcorr-b', a: 'guestcorr', b: 'guestB', level: 1, line: 'x', x: 8, z: -3, width: 1.2, height: 2.6, kind: 'door', label: 'Garden Room' }),

  // Lower floor
  D({ id: 'serv-cellar', a: 'servcorr', b: 'cellar', level: -1, line: 'x', x: 4, z: -12, width: 1.4, height: 2.4, kind: 'door', label: 'Basement Door' }),
  D({
    id: 'serv-storage',
    a: 'servcorr',
    b: 'storage',
    level: -1,
    line: 'x',
    x: -4,
    z: -15,
    width: 1.2,
    height: 2.4,
    kind: 'door',
    label: 'Storage Room',
    lock: { type: 'key', keyId: 'storage-key', message: 'Locked. A brass keyhole, recently oiled.' },
  }),
];

/** Grounds boundary (the estate wall / hedge line). */
export const GROUNDS: Rect = r(-46, -50, 46, 47);
export const GATE_OPENING = { x0: -3, x1: 3, z: 47 };

export const ROOM_BY_ID: Record<string, RoomDef> = Object.fromEntries(ROOMS.map((rm) => [rm.id, rm]));
export const ZONE_BY_ID: Record<string, ZoneDef> = Object.fromEntries(ZONES.map((zn) => [zn.id, zn]));
export const DOOR_BY_ID: Record<string, DoorDef> = Object.fromEntries(DOORS.map((d) => [d.id, d]));

export function placeName(id: string): string {
  return ROOM_BY_ID[id]?.name ?? ZONE_BY_ID[id]?.name ?? id;
}

export function inRect(rc: Rect, x: number, z: number, pad = 0): boolean {
  return x >= rc.x0 - pad && x <= rc.x1 + pad && z >= rc.z0 - pad && z <= rc.z1 + pad;
}

/** Which room/zone contains the point on the given level. */
export function locate(x: number, z: number, level: Level): string | null {
  for (const rm of ROOMS) if (rm.level === level && inRect(rm.rect, x, z)) return rm.id;
  if (level === 0) {
    for (const zn of ZONES) if (zn.rects.some((rc) => inRect(rc, x, z))) return zn.id;
  }
  return null;
}

/** Is a vertical slab of the given level occupied by this room (handles double-height rooms)? */
export function roomOccupiesLevel(rm: RoomDef, level: Level): boolean {
  if (rm.level === level) return true;
  return rm.level < level && LEVEL_Y[rm.level] + rm.height > LEVEL_Y[level] + 0.1;
}

export function roomCenter(rm: RoomDef): { x: number; z: number } {
  return { x: (rm.rect.x0 + rm.rect.x1) / 2, z: (rm.rect.z0 + rm.rect.z1) / 2 };
}

export const PLAYER_START = { x: 0, z: 44.5, yaw: 0, level: 0 as Level };
