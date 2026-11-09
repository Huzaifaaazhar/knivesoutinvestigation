/**
 * Plays the ending: a title card, then Blanc's account (or the room's
 * verdict) beat by beat — cutting to the rooms where things happened, with
 * evidence held up to the camera and sepia re-enactments.
 */
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '../state/store';
import { finishEnding } from '../state/finale';
import { nameOf } from '../state/story';
import { endingBeats } from '../data/scenes';
import { ENDING_TITLE } from '../systems/deduction';
import { EVIDENCE_BY_ID, CATEGORY_LABEL } from '../data/evidence';
import { direct } from '../world/npc/CinemaStage';
import { audio } from '../audio/audio';

export function Ending() {
  const overlay = useGame((s) => s.overlay);
  const finale = useGame((s) => s.finale);
  const [i, setI] = useState(-1);
  const beats = useMemo(() => (finale.ending && finale.evaluation ? endingBeats(finale.ending, finale.evaluation, finale.accusation.suspect) : []), [finale.ending, finale.evaluation, finale.accusation.suspect]);
  useEffect(() => {
    if (overlay !== 'ending') return;
    if (i === -1) {
      direct(finale.ending === 'unresolved' ? beats[0]?.shot ?? { wide: true } : { wide: true }, null);
      const t = setTimeout(() => setI(0), 3200);
      return () => clearTimeout(t);
    }
    const b = beats[i];
    if (b) {
      direct(b.shot, b.who, b.mood, b.stage ?? []);
      if (b.evidence) audio.play('paper');
    }
  }, [overlay, i, beats, finale.ending]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });
  if (overlay !== 'ending' || !finale.ending) return null;
  const b = i >= 0 ? beats[i] : null;
  function next() {
    if (i >= beats.length - 1) finishEnding();
    else setI((v) => v + 1);
  }
  const reenact = !!b?.stage?.length;
  const ev = b?.evidence ? EVIDENCE_BY_ID[b.evidence] : null;
  return (
    <div className="fixed inset-0 z-20" onClick={next} data-testid="ending">
      <motion.div className="pointer-events-none fixed inset-x-0 top-0 z-20 bg-shadow" initial={{ height: 0 }} animate={{ height: '10vh' }} />
      <motion.div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 bg-shadow" initial={{ height: 0 }} animate={{ height: '10vh' }} />
      {reenact && <div className="pointer-events-none fixed inset-0 z-10 bg-[#704214]/25 mix-blend-color" />}
      <AnimatePresence>
        {i === -1 && (
          <motion.div key="title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2 }} className="absolute inset-x-0 top-[36%] z-30 text-center">
            <div className="font-mono text-[10px] uppercase tracking-[0.5em] text-gold/80">The Thrombey Investigation</div>
            <div className="mt-2 font-display text-[clamp(2.2rem,6vw,4.5rem)] italic text-ivory drop-shadow-[0_2px_20px_rgba(0,0,0,0.9)]" data-testid="ending-title">
              {ENDING_TITLE[finale.ending]}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {ev && (
          <motion.div key={ev.id + i} initial={{ opacity: 0, x: 30, rotate: 4 }} animate={{ opacity: 1, x: 0, rotate: 2 }} exit={{ opacity: 0 }} className="pointer-events-none fixed right-[4vw] top-[14vh] z-30 w-56 bg-[#f4efe4] p-2 pb-3 shadow-[0_20px_40px_rgba(0,0,0,0.7)]">
            <div className="flex h-24 items-center justify-center bg-[radial-gradient(ellipse_at_center,#5a4632,#1a120c)] font-mono text-xs uppercase tracking-widest text-ivory/70">{ev.id}</div>
            <div className="mt-1 font-title text-[13px] leading-tight text-ink">{ev.name}</div>
            <div className="font-mono text-[8px] uppercase tracking-wider text-blood">{CATEGORY_LABEL[ev.category]}</div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {b && (
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-x-0 bottom-[12vh] z-30 flex flex-col items-center px-6 text-center">
            <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-gold">{nameOf(b.who)}</div>
            <p className="mt-1 max-w-3xl font-display text-[clamp(1.1rem,2.2vw,1.55rem)] leading-snug text-ivory drop-shadow-[0_2px_10px_rgba(0,0,0,1)]" data-testid="ending-line">
              {b.text}
            </p>
            <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.3em] text-ivory/40">
              {i + 1} / {beats.length} · click to continue
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        data-testid="skip-ending"
        onClick={(e) => {
          e.stopPropagation();
          finishEnding();
        }}
        className="fixed right-5 top-[11vh] z-30 font-mono text-[10px] uppercase tracking-[0.3em] text-ivory/45 hover:text-ivory"
      >
        To the case file ›
      </button>
    </div>
  );
}
