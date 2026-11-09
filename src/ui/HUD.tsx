import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ScreenAnchors } from './ScreenAnchors';
import { gameClock, useGame } from '../state/store';
import { promptFor } from '../interaction/actions';
import { doorIdOf, isDoorTarget } from '../interaction/targeting';
import { DOOR_BY_ID, LEVEL_NAMES, LEVEL_Y, ROOM_BY_ID, ZONE_BY_ID } from '../data/layout';
import { INTERACTABLE_BY_ID } from '../data/interactables';
import { input } from '../player/input';

/** World position of the current target (null when nothing is targeted). */
function targetPoint(target: string | null): [number, number, number] | null {
  if (!target) return null;
  if (isDoorTarget(target)) {
    const d = DOOR_BY_ID[doorIdOf(target)];
    return [d.x, LEVEL_Y[d.level] + 1.15, d.z];
  }
  return INTERACTABLE_BY_ID[target]?.pos ?? null;
}

const markerPoint = { current: [null] as ([number, number, number] | null)[] };
const markerEl = { current: [null] as (HTMLElement | null)[] };

/** Inside the Canvas: keeps the marker glued to the targeted object. */
export function TargetAnchor() {
  const target = useGame((s) => s.target);
  markerPoint.current[0] = targetPoint(target);
  return <ScreenAnchors points={markerPoint} els={markerEl} />;
}

/** In-world indicator: a small gold diamond hovering at the targeted object. */
export function TargetMarker() {
  const target = useGame((s) => s.target);
  const overlay = useGame((s) => s.overlay);
  const examined = useGame((s) => s.examined);
  const fresh = !!target && !isDoorTarget(target) && !examined.includes(target);
  const show = !!target && overlay === 'none';
  return (
    <div className="pointer-events-none fixed inset-0" style={{ visibility: show ? 'visible' : 'hidden' }}>
      <div ref={(e) => {
          markerEl.current[0] = e;
        }} className="absolute left-0 top-0" data-testid="target-marker">
        <div className="relative flex h-6 w-6 items-center justify-center">
          {fresh && <span className="pulse-ring absolute h-4 w-4 rotate-45 border border-gold/70" />}
          <span className="h-2 w-2 rotate-45 border border-gold bg-gold/40 shadow-[0_0_10px_rgba(182,154,101,0.9)]" />
        </div>
      </div>
    </div>
  );
}

function Key({ k }: { k: string }) {
  return <span className="mx-0.5 inline-flex min-w-[1.4em] items-center justify-center rounded-[3px] border border-ivory/35 px-1 py-px font-mono text-[10px] text-ivory/80">{k}</span>;
}

export function InteractionPrompt() {
  const target = useGame((s) => s.target);
  const overlay = useGame((s) => s.overlay);
  const showLabels = useGame((s) => s.settings.showLabels);
  const doors = useGame((s) => s.doors);
  const inventory = useGame((s) => s.inventory);
  void doors;
  void inventory;
  if (!target || overlay !== 'none') return null;
  const p = promptFor(target);
  if (!p) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[16%] flex justify-center px-4" data-testid="prompt">
      <motion.div
        key={target}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 rounded-sm bg-shadow/55 px-4 py-2 backdrop-blur-[2px]"
      >
        {!input.touch && <Key k="E" />}
        <span className="font-ui text-[13px] text-ivory/90">{p.verb}</span>
        {showLabels && (
          <>
            <span className="h-3 w-px bg-gold/50" />
            <span className="font-title text-[13px] italic text-gold">{p.name}</span>
          </>
        )}
        {p.observe && !input.touch && (
          <>
            <span className="h-3 w-px bg-ivory/20" />
            <Key k="Q" />
            <span className="font-ui text-[12px] text-ivory/60">Observe</span>
          </>
        )}
      </motion.div>
    </div>
  );
}

export function Crosshair() {
  const target = useGame((s) => s.target);
  const overlay = useGame((s) => s.overlay);
  if (overlay !== 'none') return null;
  return (
    <div className="pointer-events-none fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      <div className={`h-1 w-1 rounded-full transition ${target ? 'scale-150 bg-gold' : 'bg-ivory/45'}`} />
    </div>
  );
}

export function RoomCard() {
  const card = useGame((s) => s.roomCard);
  const overlay = useGame((s) => s.overlay);
  const [show, setShow] = useState<typeof card>(null);
  useEffect(() => {
    if (!card) return;
    setShow(card);
    const t = setTimeout(() => setShow(null), 3600);
    return () => clearTimeout(t);
  }, [card]);
  const rm = show ? ROOM_BY_ID[show.id] : null;
  const zone = show ? ZONE_BY_ID[show.id] : null;
  return (
    <AnimatePresence>
      {show && overlay === 'none' && (
        <motion.div
          key={show.t}
          data-testid="room-card"
          initial={{ opacity: 0, y: -8, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, filter: 'blur(6px)' }}
          transition={{ duration: 1.2 }}
          className="pointer-events-none fixed inset-x-0 top-[14%] flex flex-col items-center px-4 text-center"
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.5em] text-gold/80">{rm ? LEVEL_NAMES[rm.level] : 'The Grounds'}</div>
          <div className="mt-2 font-display text-[clamp(2rem,5vw,3.4rem)] font-medium leading-none text-ivory drop-shadow-[0_2px_20px_rgba(0,0,0,0.9)]">{show.name}</div>
          <div className="gold-rule mt-3 w-40" />
          {(rm?.blurb || zone?.blurb) && <div className="mt-3 max-w-md font-display text-base italic text-ivory/70">{rm?.blurb ?? zone?.blurb}</div>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Toasts() {
  const toasts = useGame((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed bottom-24 left-4 right-4 flex flex-col items-start gap-2 sm:bottom-8 sm:left-6 sm:right-auto sm:max-w-sm" data-testid="toasts">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: -14, rotate: -1 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.45 }}
            className={`paper relative max-w-sm rounded-[2px] py-2 pl-4 pr-4 text-[13px] leading-snug shadow-[0_8px_24px_rgba(0,0,0,0.5)] ${
              t.kind === 'evidence' ? 'border-l-4 border-blood' : t.kind === 'locked' ? 'border-l-4 border-olive' : 'border-l-4 border-gold'
            }`}
          >
            {t.kind === 'evidence' && <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-blood">Evidence</div>}
            {t.kind === 'note' && <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-ink/60">Notebook</div>}
            <div className="font-display text-[15px] text-ink">{t.text}</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function CornerHint() {
  const playSeconds = useGame((s) => Math.floor(s.playSeconds / 15));
  const hasMap = useGame((s) => s.hasMap);
  const overlay = useGame((s) => s.overlay);
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    const f = () => setLocked(!!document.pointerLockElement);
    document.addEventListener('pointerlockchange', f);
    return () => document.removeEventListener('pointerlockchange', f);
  }, []);
  if (overlay !== 'none' || input.touch) return null;
  return (
    <>
      <div className="pointer-events-none fixed bottom-5 right-6 flex items-center gap-3 text-[11px] text-ivory/45" data-testid="corner-hint">
        <span className="font-mono text-gold/60">{gameClock(playSeconds * 15)}</span>
        <span className="h-3 w-px bg-ivory/20" />
        <span>
          <Key k="N" /> notebook
        </span>
        <span>
          <Key k="F" /> evidence
        </span>
        {hasMap && (
          <span>
            <Key k="M" /> plan
          </span>
        )}
      </div>
      {!locked && (
        <div className="pointer-events-none fixed inset-x-0 top-1/2 mt-8 text-center font-display text-sm italic text-ivory/55">Click to look around</div>
      )}
    </>
  );
}

export function FirstSteps() {
  const overlay = useGame((s) => s.overlay);
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 9000);
    return () => clearTimeout(t);
  }, []);
  return (
    <AnimatePresence>
      {show && overlay === 'none' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 1.5, duration: 1.2 }}
          className="pointer-events-none fixed inset-x-0 bottom-[30%] flex justify-center px-4 text-center"
        >
          <div className="font-ui text-[12px] tracking-wide text-ivory/60">
            {input.touch ? (
              <>Left thumb to walk · drag to look · tap the seal to interact</>
            ) : (
              <>
                <Key k="W" />
                <Key k="A" />
                <Key k="S" />
                <Key k="D" /> walk · <Key k="Shift" /> hurry · mouse to look · <Key k="E" /> or click to interact · <Key k="Esc" /> pause
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function FadeCurtain() {
  const [k, setK] = useState(0);
  useEffect(() => {
    const f = () => setK((v) => v + 1);
    window.addEventListener('ko-fade', f);
    return () => window.removeEventListener('ko-fade', f);
  }, []);
  return (
    <AnimatePresence>
      {k > 0 && (
        <motion.div
          key={k}
          className="pointer-events-none fixed inset-0 z-30 bg-shadow"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.8, ease: 'easeOut' }}
        />
      )}
    </AnimatePresence>
  );
}
