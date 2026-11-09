/** Harlan's photograph album: turn each print over to read what he wrote on the back. */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../state/store';
import { ALBUM } from '../data/relations';
import { applyEffects, nameOf, startMemory } from '../state/story';
import { portraitDataUrl } from '../notebook/portraitImage';
import { CHARACTER_BY_ID } from '../data/case';
import { audio } from '../audio/audio';

export function Album() {
  const overlay = useGame((s) => s.overlay);
  const flags = useGame((s) => s.flags);
  const memories = useGame((s) => s.memories);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  if (overlay !== 'album') return null;
  const perPage = 3;
  const pages = Math.ceil(ALBUM.length / perPage);
  const photos = ALBUM.slice(page * perPage, page * perPage + perPage);
  const flip = (id: string) => {
    audio.play('paper');
    setFlipped((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
    const seenKey = `album:${id}`;
    if (!useGame.getState().flags.includes(seenKey)) {
      const ph = ALBUM.find((p) => p.id === id)!;
      applyEffects([{ flag: seenKey }, ...ph.effects]);
    }
  };
  return (
    <motion.div
      className="fixed inset-0 z-20 flex items-center justify-center bg-shadow/60 p-2 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && useGame.getState().closeOverlay()}
      data-testid="album"
    >
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="leather relative w-full max-w-[980px] rounded-[8px] p-3 sm:p-5">
        <div className="relative rounded-[3px] bg-[#1d1714] px-4 py-6 shadow-inner sm:px-8">
          <div className="mb-4 text-center font-title text-xs uppercase tracking-[0.5em] text-gold/80">Family photographs</div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {photos.map((ph) => {
              const isFlipped = flipped.includes(ph.id);
              return (
                <div key={ph.id} style={{ perspective: 900 }} className="mx-auto w-full max-w-[260px]">
                  <motion.button
                    data-testid={`photo-${ph.id}`}
                    onClick={() => flip(ph.id)}
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.6 }}
                    style={{ transformStyle: 'preserve-3d' }}
                    className="relative block aspect-[4/5] w-full"
                  >
                    {/* front */}
                    <div className="absolute inset-0 bg-[#f4efe4] p-2 pb-8 shadow-xl" style={{ backfaceVisibility: 'hidden' }}>
                      <div className="flex h-full w-full overflow-hidden bg-[#3a2a20] sepia-[0.6]">
                        {ph.people.map((p) => (
                          <img key={p} src={CHARACTER_BY_ID[p] ? portraitDataUrl(p) : undefined} alt={nameOf(p)} className="h-full min-w-0 flex-1 object-cover" />
                        ))}
                      </div>
                      <div className="absolute inset-x-2 bottom-1.5 font-hand text-[17px] leading-tight text-ink/80">{ph.caption}</div>
                    </div>
                    {/* back */}
                    <div className="paper absolute inset-0 flex items-center justify-center p-4 shadow-xl" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                      <p className="hand text-center text-2xl leading-tight text-[#1d2a4a]" data-testid={`photo-back-${ph.id}`}>
                        {ph.back}
                      </p>
                    </div>
                  </motion.button>
                  {ph.memory && flags.includes(`album:${ph.id}`) && !memories.includes(ph.memory) && (
                    <button
                      data-testid={`remember-${ph.id}`}
                      onClick={() => startMemory(ph.memory!)}
                      className="mt-2 w-full border border-gold/50 py-1.5 font-display text-sm italic text-gold hover:bg-gold/10"
                    >
                      Let the memory surface…
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-5 flex items-center justify-between">
            <button disabled={page === 0} onClick={() => (audio.play('page'), setPage(page - 1))} className="font-mono text-[11px] uppercase tracking-[0.3em] text-ivory/70 disabled:opacity-0">
              ‹ Previous
            </button>
            <span className="font-mono text-[10px] text-ivory/40">
              {page + 1} / {pages} · click a photograph to turn it over
            </span>
            <button disabled={page >= pages - 1} onClick={() => (audio.play('page'), setPage(page + 1))} className="font-mono text-[11px] uppercase tracking-[0.3em] text-ivory/70 disabled:opacity-0" data-testid="album-next">
              Next ›
            </button>
          </div>
        </div>
        <button data-testid="close-album" onClick={() => useGame.getState().closeOverlay()} className="absolute -top-9 right-0 font-mono text-[11px] uppercase tracking-[0.3em] text-ivory/70 hover:text-gold">
          Close the album · Esc
        </button>
      </motion.div>
    </motion.div>
  );
}
