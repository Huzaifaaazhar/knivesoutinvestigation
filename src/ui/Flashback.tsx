import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '../state/store';
import { MEMORY_BY_ID } from '../data/relations';
import { advanceMemory, endMemory } from '../state/story';
import { NPC_BY_ID } from '../data/npcs';

/** Title card, subtitles and film burn for a memory staged in the real room. */
export function FlashbackUI() {
  const f = useGame((s) => s.flashback);
  const overlay = useGame((s) => s.overlay);
  useEffect(() => {
    if (!f) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        advanceMemory();
      }
    };
    window.addEventListener('keydown', k);
    // the title card holds for a moment, then the first line
    const t = f.index === -1 ? setTimeout(advanceMemory, 3200) : undefined;
    return () => {
      window.removeEventListener('keydown', k);
      if (t) clearTimeout(t);
    };
  }, [f]);
  if (overlay !== 'flashback' || !f) return null;
  const m = MEMORY_BY_ID[f.id];
  const line = f.index >= 0 ? m.lines[f.index] : null;
  const who = line ? (line.who === 'harlan' ? 'Harlan' : NPC_BY_ID[line.who]?.short ?? line.who) : '';
  return (
    <div className="fixed inset-0 z-20" onClick={advanceMemory} data-testid="flashback">
      {/* film burn edges */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0.85 }}
        style={{ background: 'radial-gradient(ellipse at center, transparent 45%, rgba(60,30,10,0.55) 80%, rgba(10,5,0,0.95) 100%)' }}
      />
      <motion.div className="pointer-events-none absolute inset-0 bg-[#f1e7d3]" initial={{ opacity: 0.9 }} animate={{ opacity: 0 }} transition={{ duration: 1.4 }} />
      <AnimatePresence>
        {f.index === -1 && (
          <motion.div key="title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }} className="absolute inset-x-0 top-[38%] text-center">
            <div className="font-mono text-[10px] uppercase tracking-[0.5em] text-[#f1e2c0]/80">{m.when}</div>
            <div className="mt-2 font-display text-5xl italic text-[#f6ead0] drop-shadow-[0_2px_20px_rgba(0,0,0,0.9)]">{m.title}</div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {line && (
          <motion.div key={f.index} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-x-0 bottom-[10%] flex flex-col items-center px-6 text-center">
            <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#e9cf9a]">{who}</div>
            <p className="mt-1 max-w-3xl font-display text-[clamp(1.15rem,2.3vw,1.6rem)] italic leading-snug text-[#f6ead0] drop-shadow-[0_2px_10px_rgba(0,0,0,1)]" data-testid="memory-line">
              {line.text}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={(e) => {
          e.stopPropagation();
          endMemory();
        }}
        className="absolute right-6 top-6 font-mono text-[10px] uppercase tracking-[0.3em] text-[#f1e2c0]/60 hover:text-[#f1e2c0]"
        data-testid="end-memory"
      >
        Return to the present ›
      </button>
    </div>
  );
}
