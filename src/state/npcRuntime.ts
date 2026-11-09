/** Per-frame NPC state (mutable, not reactive) shared by the director, renderer and UI. */
import type { Level } from '../data/layout';
import type { Pose } from '../data/npcs';
import type { Gesture, Mood } from '../systems/dialogue';
import type { Waypoint } from '../systems/navigation';

export interface NpcRuntime {
  id: string;
  x: number;
  z: number;
  y: number;
  level: Level;
  /** Facing direction: forward = (sin yaw, cos yaw). */
  yaw: number;
  room: string;
  path: Waypoint[];
  speed: number;
  pose: Pose;
  mood: Mood;
  gesture: Gesture | null;
  gestureT: number;
  talking: boolean;
  /** World point to look at (head turns toward it). */
  lookAt: [number, number, number] | null;
  postKey: string;
  stuckT: number;
  /** Pace oscillation phase for 'pace' posts. */
  paceT: number;
}

export const npcRt: Record<string, NpcRuntime> = {};

export function npcList(): NpcRuntime[] {
  return Object.values(npcRt);
}
