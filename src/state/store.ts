/**
 * Game state (Zustand). Per-frame player motion lives in `runtime` (a plain
 * mutable object) so React only re-renders on meaningful changes.
 */
import { create } from 'zustand';
import { DOORS, PLAYER_START, ROOM_BY_ID, placeName, type Level } from '../data/layout';
import { INTERACTABLE_BY_ID } from '../data/interactables';
import { EVIDENCE_BY_ID } from '../data/evidence';
import { CHARACTER_BY_ID } from '../data/case';
import { audio } from '../audio/audio';
import type { MotiveCategory } from '../systems/conditions';
import type { Line, ReactionKind } from '../systems/dialogue';

export type Phase = 'boot' | 'title' | 'intro' | 'invitation' | 'playing';
export type Overlay = 'none' | 'notebook' | 'folder' | 'map' | 'inspect' | 'pause' | 'conversation' | 'flashback' | 'relations' | 'album';

export interface Settings {
  volume: number;
  sensitivity: number;
  invertY: boolean;
  reducedMotion: boolean;
  grain: boolean;
  quality: 'high' | 'low';
  showLabels: boolean;
  fov: number;
  headBob: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  volume: 0.8,
  sensitivity: 1,
  invertY: false,
  reducedMotion: false,
  grain: true,
  quality: 'high',
  showLabels: true,
  fov: 68,
  headBob: true,
};

export type NoteKind =
  | 'arrival'
  | 'room'
  | 'observation'
  | 'detail'
  | 'evidence'
  | 'person'
  | 'milestone'
  | 'statement'
  | 'behaviour'
  | 'contradiction'
  | 'relationship'
  | 'memory'
  | 'motive'
  | 'assumption';

export interface NoteEntry {
  id: string;
  kind: NoteKind;
  text: string;
  room: string;
  at: string;
  ts: number;
  /** Character the entry is about, if any. */
  who?: string;
  /** Linked statement / contradiction / evidence ids. */
  refs?: string[];
}

export interface Stamp {
  at: string;
  ts: number;
}

export interface MotiveRecord {
  category: MotiveCategory | null;
  supporting: string[];
  contradicting: string[];
  related: string[];
  confidence: number;
  questions: string;
}

export interface Conversation {
  npc: string;
  queue: Line[];
  index: number;
  mode: 'lines' | 'hub' | 'present' | 'leaving';
  /** Where to go once the queued lines are done. */
  then: 'hub' | 'end';
  reaction?: ReactionKind;
  /** Indices of lines whose body language has been written down. */
  noted: number[];
  /** Topic most recently asked, for highlighting. */
  topic?: string;
}

export interface FlashbackState {
  id: string;
  index: number;
}

export interface EvidenceState {
  id: string;
  source: string;
  discoveredAt: string;
  discoveredTs: number;
  examinedDetails: string[];
  fullyExamined: boolean;
  presentedTo: string[];
}

export interface PlayerSnap {
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  level: Level;
  room: string;
}

export interface Toast {
  id: number;
  text: string;
  kind: 'info' | 'evidence' | 'note' | 'room' | 'locked' | 'save';
}

/** Per-frame mutable player state (not reactive). */
export const runtime = {
  x: PLAYER_START.x,
  y: 0,
  z: PLAYER_START.z,
  yaw: PLAYER_START.yaw,
  pitch: 0,
  level: PLAYER_START.level as Level,
  room: 'gate',
  speed: 0,
  /** Set by tests and the map for teleport requests. */
  teleport: null as null | { x: number; z: number; level: Level; yaw?: number },
};

export interface StorySave {
  met: string[];
  statements: Record<string, Stamp>;
  discussed: string[];
  flags: string[];
  contradictions: Record<string, Stamp & { via?: string }>;
  relationships: string[];
  relNotes: Record<string, string>;
  relMarked: string[];
  personNotes: Record<string, string>;
  motives: Record<string, MotiveRecord>;
  motiveLeads: string[];
  hintsUsed: Record<string, number>;
  memories: string[];
}

export interface SaveData extends Partial<StorySave> {
  version: 1 | 2;
  savedAt: number;
  player: PlayerSnap;
  visited: string[];
  doors: Record<string, DoorState>;
  evidence: Record<string, EvidenceState>;
  examined: string[];
  details: Record<string, string[]>;
  notes: NoteEntry[];
  milestones: string[];
  inventory: string[];
  characters: string[];
  hasMap: boolean;
  navTarget: string | null;
  playSeconds: number;
}

export interface DoorState {
  open: boolean;
  unlocked: boolean;
}

interface GameState extends StorySave {
  conversation: Conversation | null;
  flashback: FlashbackState | null;
  observing: { npc: string; text: string } | null;
  phase: Phase;
  overlay: Overlay;
  inspecting: string | null;
  notebookPage: number;
  target: string | null;
  player: PlayerSnap;
  visited: string[];
  doors: Record<string, DoorState>;
  evidence: Record<string, EvidenceState>;
  examined: string[];
  details: Record<string, string[]>;
  notes: NoteEntry[];
  milestones: string[];
  inventory: string[];
  characters: string[];
  hasMap: boolean;
  navTarget: string | null;
  playSeconds: number;
  settings: Settings;
  toasts: Toast[];
  lastSaved: number | null;
  hasSave: boolean;
  dirty: number;
  roomCard: { id: string; name: string; t: number } | null;

  setPhase: (p: Phase) => void;
  openOverlay: (o: Overlay) => void;
  closeOverlay: () => void;
  setNotebookPage: (n: number) => void;
  setTarget: (id: string | null) => void;
  setPlayer: (p: PlayerSnap) => void;
  enterRoom: (id: string) => void;
  examine: (interactId: string) => void;
  seeDetail: (interactId: string, hotspotId: string) => void;
  collectEvidence: (interactId: string) => void;
  setDoor: (id: string, patch: Partial<DoorState>) => void;
  setNav: (room: string | null) => void;
  toast: (text: string, kind?: Toast['kind']) => void;
  dismissToast: (id: number) => void;
  updateSettings: (s: Partial<Settings>) => void;
  tick: (dt: number) => void;
  addNote: (kind: NoteKind, text: string, room?: string, extra?: { who?: string; refs?: string[] }) => void;
  newGame: () => void;
  hydrate: (d: SaveData) => void;
  serialize: () => SaveData;
  markSaved: () => void;
  setHasSave: (b: boolean) => void;
}

const START_MINUTES = 21 * 60 + 40;

/** In-world clock: the investigation begins at 21:40; one real minute is four in-game minutes. */
export function gameClock(playSeconds: number): string {
  const m = Math.floor(START_MINUTES + playSeconds / 15) % (24 * 60);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

function initialDoors(): Record<string, DoorState> {
  return Object.fromEntries(DOORS.map((d) => [d.id, { open: !!d.startsOpen || d.kind === 'arch', unlocked: !d.lock }]));
}

let toastId = 1;
let noteSeq = 1;

function freshState() {
  return {
    overlay: 'none' as Overlay,
    inspecting: null,
    notebookPage: 0,
    target: null,
    player: { x: PLAYER_START.x, y: 0, z: PLAYER_START.z, yaw: PLAYER_START.yaw, pitch: 0, level: PLAYER_START.level, room: 'gate' },
    visited: [] as string[],
    doors: initialDoors(),
    evidence: {} as Record<string, EvidenceState>,
    examined: [] as string[],
    details: {} as Record<string, string[]>,
    notes: [] as NoteEntry[],
    milestones: [] as string[],
    inventory: [] as string[],
    characters: [] as string[],
    hasMap: false,
    navTarget: null,
    playSeconds: 0,
    toasts: [] as Toast[],
    lastSaved: null,
    dirty: 0,
    roomCard: null,
    ...freshStory(),
    conversation: null,
    flashback: null,
    observing: null,
  };
}

export function freshStory(): StorySave {
  return {
    met: [],
    statements: {},
    discussed: [],
    flags: [],
    contradictions: {},
    relationships: [],
    relNotes: {},
    relMarked: [],
    personNotes: {},
    motives: {},
    motiveLeads: [],
    hintsUsed: {},
    memories: [],
  };
}

export function keyHotspots(interactId: string): string[] {
  return (INTERACTABLE_BY_ID[interactId]?.hotspots ?? []).filter((h) => h.key).map((h) => h.id);
}

export const useGame = create<GameState>((set, get) => ({
  phase: 'boot',
  settings: { ...DEFAULT_SETTINGS },
  hasSave: false,
  ...freshState(),

  setPhase: (phase) => set({ phase }),
  openOverlay: (overlay) => {
    if (overlay === 'notebook' || overlay === 'folder' || overlay === 'map') audio.play(overlay === 'map' ? 'paper' : 'page');
    set({ overlay });
  },
  closeOverlay: () => set({ overlay: 'none', inspecting: null }),
  setNotebookPage: (notebookPage) => {
    audio.play('page');
    set({ notebookPage });
  },
  setTarget: (target) => {
    if (get().target !== target) set({ target });
  },
  setPlayer: (player) => set({ player }),

  addNote: (kind, text, room, extra) => {
    const s = get();
    const entry: NoteEntry = {
      id: `n${Date.now().toString(36)}${noteSeq++}`,
      kind,
      text,
      room: room ?? s.player.room,
      at: gameClock(s.playSeconds),
      ts: Date.now(),
      ...(extra ?? {}),
    };
    set({ notes: [...s.notes, entry], dirty: s.dirty + 1 });
  },

  enterRoom: (id) => {
    const s = get();
    if (s.player.room !== id) set({ player: { ...s.player, room: id } });
    if (s.visited.includes(id)) {
      if (s.navTarget === id) {
        set({ navTarget: null });
        get().toast(`You have arrived: ${placeName(id)}.`, 'info');
      }
      return;
    }
    set({ visited: [...s.visited, id], roomCard: { id, name: placeName(id), t: Date.now() }, dirty: s.dirty + 1 });
    const rm = ROOM_BY_ID[id];
    if (id === 'hall' && !s.milestones.includes('entered-estate')) {
      set({ milestones: [...get().milestones, 'entered-estate'] });
      get().addNote('arrival', 'Entered the Thrombey house. The hall smells of wax polish and cold ashes. Every portrait follows me.', id);
      audio.play('discover');
    } else if (rm) {
      get().addNote('room', `${rm.name}. ${rm.blurb}`, id);
    }
  },

  examine: (interactId) => {
    const def = INTERACTABLE_BY_ID[interactId];
    if (!def) return;
    const s = get();
    const first = !s.examined.includes(interactId);
    const patch: Partial<GameState> = {};
    if (first) {
      patch.examined = [...s.examined, interactId];
      patch.dirty = s.dirty + 1;
    }
    set(patch);
    if (first && def.kind !== 'portrait') get().addNote('observation', `${def.name} — ${def.observation}`, def.room);
    const g = def.grants;
    if (g && first) {
      const after = get();
      const upd: Partial<GameState> = {};
      if (g.map && !after.hasMap) upd.hasMap = true;
      if (g.item && !after.inventory.includes(g.item)) upd.inventory = [...after.inventory, g.item];
      if (g.milestone && !after.milestones.includes(g.milestone)) upd.milestones = [...after.milestones, g.milestone];
      if (g.character && !after.characters.includes(g.character)) {
        upd.characters = [...after.characters, g.character];
      }
      set(upd);
      if (upd.characters) {
        const ch = CHARACTER_BY_ID[g.character!];
        get().addNote('person', `${ch.name} — ${ch.note}`, def.room);
        get().toast(`Notebook: ${ch.name} added to persons of interest`, 'note');
        audio.play('pencil');
      }
      if (upd.hasMap) {
        get().toast('You fold the estate plan into your notebook. Press M to consult it.', 'note');
        audio.play('paper');
      }
      if (g.milestone === 'read-attorney-letter') {
        get().addNote('milestone', 'The attorney mentions Harlan\'s personal copy hidden in a book in the library — "The Sleeper in the Stacks".', def.room);
      }
      if (g.milestone === 'found-hidden-compartment') {
        audio.play('discover');
        get().toast('A hidden compartment — Harlan meant for this to be found.', 'evidence');
      }
      if (g.item === 'storage-key') {
        get().toast('You pocket the brass key tagged "STORE".', 'note');
      }
    }
  },

  seeDetail: (interactId, hotspotId) => {
    const s = get();
    const seen = s.details[interactId] ?? [];
    if (seen.includes(hotspotId)) return;
    const def = INTERACTABLE_BY_ID[interactId];
    const hs = def?.hotspots?.find((h) => h.id === hotspotId);
    const details = { ...s.details, [interactId]: [...seen, hotspotId] };
    const upd: Partial<GameState> = { details, dirty: s.dirty + 1 };
    if (def?.evidence && s.evidence[def.evidence]) {
      const ev = s.evidence[def.evidence];
      const examinedDetails = details[interactId];
      const fully = keyHotspots(interactId).every((k) => examinedDetails.includes(k));
      upd.evidence = { ...s.evidence, [def.evidence]: { ...ev, examinedDetails, fullyExamined: fully } };
      if (fully && !ev.fullyExamined) {
        get().toast(`${EVIDENCE_BY_ID[def.evidence].name}: fully examined`, 'evidence');
      }
    }
    set(upd);
    if (hs?.key && def) {
      get().addNote('detail', `${def.name}: ${hs.detail}`, def.room);
      audio.play('pencil');
    }
  },

  collectEvidence: (interactId) => {
    const def = INTERACTABLE_BY_ID[interactId];
    if (!def?.evidence) return;
    const s = get();
    if (s.evidence[def.evidence]) return;
    const examinedDetails = s.details[interactId] ?? [];
    const st: EvidenceState = {
      id: def.evidence,
      source: interactId,
      discoveredAt: gameClock(s.playSeconds),
      discoveredTs: Date.now(),
      examinedDetails,
      fullyExamined: keyHotspots(interactId).every((k) => examinedDetails.includes(k)),
      presentedTo: [],
    };
    set({ evidence: { ...s.evidence, [def.evidence]: st }, dirty: s.dirty + 1 });
    const ev = EVIDENCE_BY_ID[def.evidence];
    get().addNote('evidence', `Logged ${ev.id}: ${ev.name}.`, def.room);
    get().toast(`Evidence folder: ${ev.id} · ${ev.name}`, 'evidence');
    audio.play('evidence');
  },

  setDoor: (id, patch) => {
    const s = get();
    set({ doors: { ...s.doors, [id]: { ...s.doors[id], ...patch } }, dirty: s.dirty + 1 });
  },
  setNav: (navTarget) => set({ navTarget }),
  toast: (text, kind = 'info') => {
    const id = toastId++;
    set({ toasts: [...get().toasts.slice(-2), { id, text, kind }] });
    setTimeout(() => get().dismissToast(id), kind === 'evidence' ? 5200 : 4200);
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
  updateSettings: (patch) => {
    const settings = { ...get().settings, ...patch };
    audio.setVolume(settings.volume);
    set({ settings });
  },
  tick: (dt) => set({ playSeconds: get().playSeconds + dt }),
  newGame: () => {
    Object.assign(runtime, { x: PLAYER_START.x, y: 0, z: PLAYER_START.z, yaw: PLAYER_START.yaw, pitch: 0, level: PLAYER_START.level, room: 'gate', teleport: null });
    set({ ...freshState() });
  },
  hydrate: (d) => {
    Object.assign(runtime, { x: d.player.x, y: d.player.y, z: d.player.z, yaw: d.player.yaw, pitch: d.player.pitch, level: d.player.level, room: d.player.room });
    runtime.teleport = { x: d.player.x, z: d.player.z, level: d.player.level, yaw: d.player.yaw };
    const story = freshStory();
    for (const k of Object.keys(story) as (keyof StorySave)[]) if (d[k] !== undefined) (story as any)[k] = d[k];
    set({
      ...freshState(),
      ...story,
      player: d.player,
      visited: d.visited,
      doors: { ...initialDoors(), ...d.doors },
      evidence: d.evidence,
      examined: d.examined,
      details: d.details,
      notes: d.notes,
      milestones: d.milestones,
      inventory: d.inventory,
      characters: d.characters,
      hasMap: d.hasMap,
      navTarget: d.navTarget,
      playSeconds: d.playSeconds,
      lastSaved: d.savedAt,
    });
  },
  serialize: () => {
    const s = get();
    const story = freshStory();
    for (const k of Object.keys(story) as (keyof StorySave)[]) (story as any)[k] = s[k];
    return {
      ...story,
      version: 2,
      savedAt: Date.now(),
      player: { x: runtime.x, y: runtime.y, z: runtime.z, yaw: runtime.yaw, pitch: runtime.pitch, level: runtime.level, room: runtime.room },
      visited: s.visited,
      doors: s.doors,
      evidence: s.evidence,
      examined: s.examined,
      details: s.details,
      notes: s.notes,
      milestones: s.milestones,
      inventory: s.inventory,
      characters: s.characters,
      hasMap: s.hasMap,
      navTarget: s.navTarget,
      playSeconds: s.playSeconds,
    };
  },
  markSaved: () => set({ lastSaved: Date.now(), hasSave: true }),
  setHasSave: (hasSave) => set({ hasSave }),
}));

/** True while any overlay suspends exploration. */
export function isExploring() {
  const s = useGame.getState();
  return s.phase === 'playing' && s.overlay === 'none';
}

// Debug & test hook
if (typeof window !== 'undefined') {
  (window as any).__KO__ = { useGame, runtime };
}
