import { useRef, useState } from 'react';
import { useGame } from '../state/store';
import { input } from '../player/input';
import { promptFor } from '../interaction/actions';

/**
 * Mobile controls: a floating thumb-stick on the left half, swipe-to-look on
 * the right half, a wax-seal interaction button, and the detective's objects
 * (notebook, folder, plan) as small physical tabs in the top corner.
 */
export function TouchControls() {
  const overlay = useGame((s) => s.overlay);
  const target = useGame((s) => s.target);
  const hasMap = useGame((s) => s.hasMap);
  const stickId = useRef<number | null>(null);
  const lookId = useRef<number | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const last = useRef({ x: 0, y: 0 });
  const [knob, setKnob] = useState<{ ox: number; oy: number; x: number; y: number } | null>(null);
  if (overlay !== 'none') return null;
  const R = 56;

  const onDown = (e: React.PointerEvent) => {
    const left = e.clientX < window.innerWidth * 0.45;
    try {
      (e.target as Element).setPointerCapture?.(e.pointerId);
    } catch {
      /* synthetic or already-released pointers */
    }
    if (left && stickId.current === null) {
      stickId.current = e.pointerId;
      origin.current = { x: e.clientX, y: e.clientY };
      setKnob({ ox: e.clientX, oy: e.clientY, x: 0, y: 0 });
    } else if (!left && lookId.current === null) {
      lookId.current = e.pointerId;
      last.current = { x: e.clientX, y: e.clientY };
    }
  };
  const onMove = (e: React.PointerEvent) => {
    if (e.pointerId === stickId.current) {
      let dx = e.clientX - origin.current.x;
      let dy = e.clientY - origin.current.y;
      const m = Math.hypot(dx, dy);
      if (m > R) {
        dx = (dx / m) * R;
        dy = (dy / m) * R;
      }
      input.stickX = dx / R;
      input.stickY = -dy / R;
      input.stickRun = m > R * 1.35;
      setKnob((k) => (k ? { ...k, x: dx, y: dy } : k));
    } else if (e.pointerId === lookId.current) {
      input.lookDX += (e.clientX - last.current.x) * 2.0;
      input.lookDY += (e.clientY - last.current.y) * 2.0;
      last.current = { x: e.clientX, y: e.clientY };
    }
  };
  const onUp = (e: React.PointerEvent) => {
    if (e.pointerId === stickId.current) {
      stickId.current = null;
      input.stickX = input.stickY = 0;
      input.stickRun = false;
      setKnob(null);
    }
    if (e.pointerId === lookId.current) lookId.current = null;
  };
  const p = target ? promptFor(target) : null;
  const s = useGame.getState();

  return (
    <div className="fixed inset-0 z-10" data-testid="touch-controls">
      <div className="absolute inset-0 touch-none" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} />
      {knob ? (
        <div className="pointer-events-none absolute" style={{ left: knob.ox - R, top: knob.oy - R }}>
          <div className="h-28 w-28 rounded-full border border-ivory/25 bg-shadow/25" />
          <div className="absolute h-12 w-12 rounded-full border border-gold/60 bg-gold/20" style={{ left: R - 24 + knob.x, top: R - 24 + knob.y }} />
        </div>
      ) : (
        <div className="pointer-events-none absolute bottom-10 left-10 h-28 w-28 rounded-full border border-dashed border-ivory/15">
          <div className="absolute inset-0 flex items-center justify-center font-mono text-[9px] uppercase tracking-[0.3em] text-ivory/30">walk</div>
        </div>
      )}
      {p && (
        <button
          data-testid="touch-interact"
          onClick={() => (input.interactQueued = true)}
          className="absolute bottom-10 right-8 flex h-24 w-24 flex-col items-center justify-center rounded-full bg-blood text-center text-ivory shadow-[inset_0_-6px_14px_rgba(0,0,0,0.5),0_6px_18px_rgba(0,0,0,0.6)] active:scale-95"
        >
          <span className="font-title text-[13px] italic leading-tight">{p.verb}</span>
        </button>
      )}
      <div className="absolute right-3 top-3 flex gap-2" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <button aria-label="Notebook" onClick={() => s.openOverlay('notebook')} className="leather h-12 w-10 rounded-[3px]">
          <span className="block h-full w-full border-r-4 border-gold/30" />
        </button>
        <button aria-label="Evidence folder" onClick={() => s.openOverlay('folder')} className="manila h-10 w-12 rounded-[2px] shadow-lg" />
        {hasMap && <button aria-label="Estate plan" onClick={() => s.openOverlay('map')} className="blueprint h-10 w-12 rounded-[2px] border border-ivory/30 shadow-lg" />}
        <button aria-label="Pause" onClick={() => s.openOverlay('pause')} className="flex h-10 w-10 items-center justify-center rounded-full border border-ivory/30 bg-shadow/50 text-ivory/80">
          ❙❙
        </button>
      </div>
    </div>
  );
}
