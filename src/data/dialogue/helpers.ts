import type { Gesture, Line, Mood } from '../../systems/dialogue';
import type { Effect } from '../../systems/conditions';

/** A line spoken by the character. */
export const N = (text: string, mood?: Mood, gesture?: Gesture, extra: { tell?: string; effects?: Effect[] } = {}): Line => ({ by: 'npc', text, mood, gesture, ...extra });
/** A line spoken by the investigator. */
export const Y = (text: string): Line => ({ by: 'player', text });
export const says = (statement: string): Effect => ({ statement });
