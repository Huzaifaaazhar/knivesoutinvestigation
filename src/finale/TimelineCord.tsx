/**
 * The timeline cord: cards for the night's events, pegged to a string and
 * dragged into order. Only cards the player has evidence for exist. Cards
 * whose times are fixed by evidence can show a pencilled "?" when out of
 * order; undated ones never do — that reasoning is the player's.
 */
import { Reorder, motion } from 'framer-motion';
import { useGame } from '../state/store';
import { placeEvent, removeEvent, testChallenge, solvedFlags } from '../state/finale';
import { snapshot } from '../state/story';
import { TL_BY_ID, type TLStatus } from '../data/mystery';
import { discoveredEvents, eventStatus, inconsistentCards } from '../systems/deduction';
import { audio } from '../audio/audio';
import { useState } from 'react';

const STAMP: Record<TLStatus, string> = {
  confirmed: 'border-olive text-olive',
  reported: 'border-[#2a4468] text-[#2a4468]',
  unverified: 'border-ink/40 text-ink/55',
  contradicted: 'border-blood text-blood',
};

export function TimelineCord() {
  const overlay = useGame((s) => s.overlay);
  const order = useGame((s) => s.timeline);
  useGame((s) => s.evidence);
  useGame((s) => s.statements);
  useGame((s) => s.flags);
  const [tested, setTested] = useState<boolean | null>(null);
  if (overlay !== 'timeline') return null;
  const snap = snapshot();
  const found = discoveredEvents(snap);
  const placed = order.filter((id) => found.some((f) => f.id === id));
  const loose = found.filter((f) => !placed.includes(f.id));
  const odd = inconsistentCards(placed);
  const solved = solvedFlags().includes('CH-evening');

  return (
    <motion.div className="fixed inset-0 z-20 flex flex-col bg-[#120c09]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} data-testid="timeline">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3a2a1a] bg-[#2a1d14] px-4 py-2">
        <div>
          <div className="font-title text-lg text-ivory">The night of the party</div>
          <div className="font-mono text-[10px] text-ivory/45">Peg events to the cord · drag to reorder · earliest on the left</div>
        </div>
        <div className="flex items-center gap-3">
          {solved ? (
            <span className="rotate-[-3deg] border-2 border-gold px-2 font-mono text-[10px] uppercase tracking-widest text-gold">The Final Evening — solved</span>
          ) : (
            <button data-testid="test-timeline" onClick={() => setTested(testChallenge('CH-evening'))} className="border border-gold/50 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-gold hover:bg-gold/10">
              Test my reasoning
            </button>
          )}
          {tested === false && !solved && <span className="hand text-xl text-ivory/60">Not yet — the night doesn’t run that way, or something is missing.</span>}
          <button onClick={() => useGame.setState({ overlay: 'wall' })} className="font-mono text-[10px] uppercase tracking-[0.25em] text-ivory/60 hover:text-ivory">
            ‹ The board
          </button>
          <button data-testid="close-timeline" onClick={() => useGame.getState().closeOverlay()} className="font-mono text-[10px] uppercase tracking-[0.25em] text-ivory/60 hover:text-ivory">
            Step back · Esc
          </button>
        </div>
      </div>

      {/* the cord */}
      <div className="relative flex-1 overflow-x-auto overflow-y-hidden scroll-quiet">
        <div className="absolute inset-x-0 top-14 h-[3px] bg-gradient-to-r from-[#5a3a20] via-[#8a5a30] to-[#5a3a20] shadow-[0_2px_4px_rgba(0,0,0,0.6)]" />
        {placed.length ? (
          <Reorder.Group axis="x" values={placed} onReorder={(v) => useGame.setState({ timeline: v, dirty: useGame.getState().dirty + 1 })} className="relative flex min-w-max gap-4 px-6 pt-8" data-testid="cord">
            {placed.map((id, i) => {
              const e = TL_BY_ID[id];
              const st = eventStatus(e, snap);
              return (
                <Reorder.Item key={id} value={id} className="relative w-44 shrink-0 cursor-grab active:cursor-grabbing" data-testid={`tl-${id}`} onDragEnd={() => audio.play('click')} style={{ rotate: (i % 3) - 1 }}>
                  <span className="absolute left-1/2 top-[14px] z-10 h-6 w-2 -translate-x-1/2 rounded-sm bg-[#c9b48a] shadow" />
                  <div className="paper mt-8 px-3 py-2 shadow-[0_8px_18px_rgba(0,0,0,0.55)]">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-burgundy">{e.time ?? '— : —'}</span>
                      <span className={`border px-1 font-mono text-[8px] uppercase tracking-wider ${STAMP[st]}`}>{st}</span>
                    </div>
                    <div className="mt-1 font-display text-[15px] leading-tight text-ink">{e.label}</div>
                    <div className="mt-1 font-mono text-[8.5px] uppercase tracking-wider text-ink/45">{e.basis}</div>
                    <button
                      onPointerDown={(ev) => ev.stopPropagation()}
                      onClick={() => removeEvent(id)}
                      className="mt-1 font-mono text-[9px] uppercase tracking-widest text-ink/40 hover:text-blood"
                    >
                      Unpeg
                    </button>
                  </div>
                  {odd.has(id) && (
                    <span className="hand absolute -right-2 top-6 text-4xl text-blood" title="The times on these cards don’t sit easily together" data-testid="tl-odd">
                      ?
                    </span>
                  )}
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        ) : (
          <p className="hand absolute left-1/2 top-24 -translate-x-1/2 text-2xl text-ivory/40">Nothing pegged yet.</p>
        )}
      </div>

      {/* loose cards in the basket */}
      <div className="border-t border-[#3a2a1a] bg-[#2a1d14] px-4 pb-4 pt-2">
        <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.3em] text-ivory/50">Loose cards — only what you have found</div>
        <div className="flex flex-wrap gap-2">
          {loose.map((e) => (
            <button
              key={e.id}
              data-testid={`peg-${e.id}`}
              onClick={() => placeEvent(e.id)}
              className="paper px-3 py-1.5 text-left shadow hover:-translate-y-0.5"
            >
              <span className="mr-2 font-mono text-[10px] text-burgundy">{e.time ?? '—'}</span>
              <span className="font-display text-[14px] text-ink">{e.label}</span>
            </button>
          ))}
          {!loose.length && <span className="hand text-xl text-ivory/40">Every card you have found is on the cord.</span>}
        </div>
      </div>
    </motion.div>
  );
}
