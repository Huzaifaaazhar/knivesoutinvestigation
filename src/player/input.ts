/** Shared input state written by keyboard/mouse/touch handlers and read by the controller. */
export const input = {
  keys: new Set<string>(),
  lookDX: 0,
  lookDY: 0,
  /** Touch joystick, -1..1 each axis (x = strafe, y = forward). */
  stickX: 0,
  stickY: 0,
  stickRun: false,
  interactQueued: false,
  pointerLocked: false,
  touch: false,
};

export function consumeLook() {
  const dx = input.lookDX;
  const dy = input.lookDY;
  input.lookDX = 0;
  input.lookDY = 0;
  return { dx, dy };
}

export const isTouchDevice = () =>
  typeof window !== 'undefined' && (window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window);
