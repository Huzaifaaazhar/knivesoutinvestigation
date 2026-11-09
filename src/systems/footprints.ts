/**
 * Collision footprints for furniture types (w, d in local space).
 * Kept separate from the React components so collision can be computed
 * (and unit-tested) without loading Three.js materials.
 */
type P = Record<string, any>;

export const FURNITURE_FOOTPRINTS: Record<string, (p: P) => [number, number]> = {
  sofa: (p) => [p.w ?? 2.2, 0.95],
  armchair: () => [0.95, 0.95],
  wickerChair: () => [0.8, 0.8],
  bench: (p) => [p.w ?? 1.4, 0.45],
  coffeeTable: (p) => [p.w ?? 1.2, p.d ?? 0.6],
  sideTable: () => [0.5, 0.5],
  roundTable: (p) => [(p.r ?? 0.7) * 2, (p.r ?? 0.7) * 2],
  console: (p) => [p.w ?? 1.2, 0.4],
  desk: () => [1.85, 0.92],
  diningTable: (p) => [p.l ?? 6, p.d ?? 1.5],
  sideboard: (p) => [p.w ?? 1.8, 0.52],
  bookshelf: (p) => [p.w ?? 2, p.d ?? 0.42],
  wardrobe: (p) => [p.w ?? 1.4, 0.66],
  dresser: (p) => [p.w ?? 1.3, 0.55],
  nightstand: () => [0.5, 0.45],
  bed: (p) => [p.w ?? 2.0, 2.25],
  daybed: () => [2.05, 0.9],
  fireplace: () => [2.4, 0.7],
  floorLamp: () => [0.35, 0.35],
  plantPot: (p) => [0.55 * (p.s ?? 1), 0.55 * (p.s ?? 1)],
  coatStand: () => [0.45, 0.45],
  piano: () => [1.55, 0.7],
  umbrellaStand: () => [0.3, 0.3],
  statue: () => [0.9, 0.9],
  counter: (p) => [p.l ?? 3, 0.66],
  stove: () => [1.0, 0.68],
  fridge: () => [0.9, 0.74],
  wineRack: (p) => [p.l ?? 2.4, 0.46],
  boiler: () => [1.15, 1.15],
  crates: () => [1.2, 0.8],
  sheeted: (p) => [p.w ?? 1.6, p.d ?? 0.9],
  metalShelf: (p) => [p.l ?? 2, 0.46],
  securityDesk: () => [1.6, 0.7],
  car: () => [4.45, 1.85],
  hedge: (p) => [p.w ?? 4, p.d ?? 1],
  lampPost: () => [0.3, 0.3],
  gatePillar: () => [0.95, 0.95],
  gardenBench: () => [1.8, 0.55],
  urn: () => [0.6, 0.6],
  balustrade: (p) => [p.l ?? 4, 0.24],
};
