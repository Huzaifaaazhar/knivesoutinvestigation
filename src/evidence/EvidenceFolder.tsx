import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame, keyHotspots, type EvidenceState } from '../state/store';
import { EVIDENCE, EVIDENCE_BY_ID, CATEGORY_LABEL, type EvidenceDef } from '../data/evidence';
import { CHARACTER_BY_ID, EVENT_BY_ID } from '../data/case';
import { INTERACTABLE_BY_ID } from '../data/interactables';
import { placeName } from '../data/layout';
import { audio } from '../audio/audio';

/** Each category is filed as a different physical thing. */
function Item({ def, st, onOpen, i }: { def: EvidenceDef; st: EvidenceState; onOpen: () => void; i: number }) {
  const tilt = ((i * 7) % 5) - 2;
  const common = 'relative block w-full text-left transition hover:-translate-y-1 hover:shadow-2xl focus-visible:-translate-y-1';
  const stamp = st.fullyExamined && (
    <span className="absolute right-2 top-2 rotate-[8deg] border border-burgundy/70 px-1 font-mono text-[8px] uppercase tracking-widest text-burgundy/80">Examined</span>
  );
  const label = (
    <>
      <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-blood">{def.id}</div>
      <div className="font-title text-[14px] leading-tight text-ink">{def.name}</div>
    </>
  );
  if (def.category === 'photograph' || def.category === 'environment' || def.category === 'trace') {
    // a photograph clipped to the folder
    return (
      <button onClick={onOpen} className={common} style={{ transform: `rotate(${tilt}deg)` }} data-testid={`evidence-${def.id}`}>
        <div className="bg-[#f4efe4] p-2 pb-3 shadow-[0_6px_16px_rgba(0,0,0,0.35)]">
          <div className="flex aspect-[4/3] items-center justify-center bg-[radial-gradient(ellipse_at_center,#4a3a2a,#120c08)]">
            <span className="font-display text-xs italic text-ivory/60">{placeName(def.location)}</span>
          </div>
          <div className="mt-2">{label}</div>
        </div>
        <span className="absolute -top-2 left-1/2 h-4 w-8 -translate-x-1/2 rounded-sm bg-[#9aa0a6] shadow" />
        {stamp}
      </button>
    );
  }
  if (def.category === 'object') {
    // labelled evidence envelope
    return (
      <button onClick={onOpen} className={common} style={{ transform: `rotate(${tilt}deg)` }} data-testid={`evidence-${def.id}`}>
        <div className="relative bg-[#b8925a] px-3 pb-3 pt-7 shadow-[0_6px_16px_rgba(0,0,0,0.35)]" style={{ clipPath: 'polygon(0 12%, 50% 0, 100% 12%, 100% 100%, 0 100%)' }}>
          <div className="border border-ink/30 bg-[#efe4cc] p-2">
            {label}
            <div className="mt-1 font-mono text-[8px] uppercase tracking-widest text-ink/50">Evidence · do not open</div>
          </div>
        </div>
        {stamp}
      </button>
    );
  }
  // document: paper with a paperclip
  return (
    <button onClick={onOpen} className={common} style={{ transform: `rotate(${tilt}deg)` }} data-testid={`evidence-${def.id}`}>
      <div className="paper px-3 pb-3 pt-4 shadow-[0_6px_16px_rgba(0,0,0,0.35)]">
        {label}
        <div className="mt-2 space-y-1">
          {[0.9, 0.7, 0.8].map((w, k) => (
            <div key={k} className="h-px bg-ink/25" style={{ width: `${w * 100}%` }} />
          ))}
        </div>
      </div>
      <span className="absolute -top-2 left-4 h-6 w-2.5 rounded-full border-2 border-[#9aa0a6]" />
      {stamp}
    </button>
  );
}

function Detail({ id, onBack }: { id: string; onBack: () => void }) {
  const def = EVIDENCE_BY_ID[id];
  const st = useGame((s) => s.evidence[id]);
  const src = INTERACTABLE_BY_ID[st.source];
  const hs = src?.hotspots ?? [];
  const keys = keyHotspots(st.source);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="paper relative mx-auto max-w-2xl px-6 py-6 shadow-2xl sm:px-9" data-testid="evidence-detail">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-blood">
            {def.id} · {CATEGORY_LABEL[def.category]}
          </div>
          <h3 className="mt-1 font-title text-2xl text-ink">{def.name}</h3>
        </div>
        {st.fullyExamined ? (
          <span className="rotate-[6deg] border-2 border-burgundy px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.25em] text-burgundy">Fully examined</span>
        ) : (
          <span className="rotate-[6deg] border-2 border-ink/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.25em] text-ink/50">Partly examined</span>
        )}
      </div>
      <p className="mt-3 font-display text-lg leading-snug text-ink/90">{def.description}</p>
      <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 border-y border-ink/15 py-3 text-[13px] sm:grid-cols-2">
        <div>
          <dt className="font-mono text-[9px] uppercase tracking-[0.25em] text-ink/50">Found</dt>
          <dd className="font-display text-[15px]">{placeName(def.location)}</dd>
        </div>
        <div>
          <dt className="font-mono text-[9px] uppercase tracking-[0.25em] text-ink/50">Logged</dt>
          <dd className="font-mono text-[12px]">{st.discoveredAt} · {new Date(st.discoveredTs).toLocaleDateString()}</dd>
        </div>
        <div>
          <dt className="font-mono text-[9px] uppercase tracking-[0.25em] text-ink/50">Related persons</dt>
          <dd className="font-display text-[15px]">{def.relatedCharacters.map((c) => CHARACTER_BY_ID[c]?.name).join(', ') || '—'}</dd>
        </div>
        <div>
          <dt className="font-mono text-[9px] uppercase tracking-[0.25em] text-ink/50">Related events</dt>
          <dd className="font-display text-[15px]">{def.relatedEvents.map((e) => EVENT_BY_ID[e]?.title).join('; ') || '—'}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-mono text-[9px] uppercase tracking-[0.25em] text-ink/50">Presented to</dt>
          <dd className="font-display text-[15px] italic text-ink/70">{st.presentedTo.length ? st.presentedTo.map((c) => CHARACTER_BY_ID[c]?.name).join(', ') : 'Not yet shown to anyone.'}</dd>
        </div>
      </dl>
      <div className="mt-3 font-mono text-[9px] uppercase tracking-[0.25em] text-ink/50">Inspection notes</div>
      <ul className="mt-1 space-y-1.5">
        {hs.map((h) =>
          st.examinedDetails.includes(h.id) ? (
            <li key={h.id} className="hand text-[1.25rem] leading-[1.1] text-[#24304a]">
              <b className="font-semibold">{h.label}:</b> {h.detail}
            </li>
          ) : keys.includes(h.id) ? (
            <li key={h.id} className="hand text-[1.2rem] text-ink/35">— a detail not yet examined —</li>
          ) : null,
        )}
      </ul>
      <div className="mt-5 flex flex-wrap gap-3">
        <button onClick={onBack} className="border border-ink/40 px-4 py-2 font-ui text-[11px] uppercase tracking-widest">
          ‹ Back to folder
        </button>
        <button
          data-testid="reexamine"
          onClick={() => useGame.setState({ overlay: 'inspect', inspecting: st.source })}
          className="border border-burgundy bg-burgundy px-4 py-2 font-ui text-[11px] uppercase tracking-widest text-ivory"
        >
          Examine again
        </button>
      </div>
    </motion.div>
  );
}

export function EvidenceFolder() {
  const overlay = useGame((s) => s.overlay);
  const evidence = useGame((s) => s.evidence);
  const [open, setOpen] = useState<string | null>(null);
  if (overlay !== 'folder') return null;
  const list = EVIDENCE.filter((e) => evidence[e.id]).sort((a, b) => evidence[a.id].discoveredTs - evidence[b.id].discoveredTs);
  return (
    <motion.div
      className="fixed inset-0 z-20 flex items-center justify-center bg-shadow/55 p-2 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && useGame.getState().closeOverlay()}
      data-testid="folder"
    >
      <div className="relative w-full max-w-[1000px]" style={{ perspective: 1600 }}>
        {/* tab */}
        <div className="manila absolute -top-7 left-8 rounded-t-md px-5 py-1.5 font-mono text-[10px] uppercase tracking-[0.3em]">Thrombey, H. — Evidence</div>
        <div className="manila relative max-h-[86vh] overflow-y-auto rounded-[3px] rounded-tl-none px-4 py-6 shadow-[0_30px_90px_rgba(0,0,0,0.75)] scroll-quiet sm:px-8">
          {/* front cover swinging open */}
          <motion.div
            className="manila pointer-events-none absolute inset-0 z-10 origin-left rounded-[3px] shadow-xl"
            initial={{ rotateY: 0 }}
            animate={{ rotateY: -110, opacity: 0 }}
            transition={{ duration: 0.75, ease: [0.3, 0.6, 0.2, 1] }}
            style={{ filter: 'brightness(0.95)' }}
          />
          <div className="mb-5 flex items-baseline justify-between gap-3 border-b border-ink/25 pb-3">
            <h2 className="font-title text-2xl text-ink">Evidence</h2>
            <div className="font-mono text-[11px] text-ink/60" data-testid="evidence-count">
              {list.length} of {EVIDENCE.length} logged
            </div>
          </div>
          <AnimatePresence mode="wait">
            {open && evidence[open] ? (
              <Detail key="d" id={open} onBack={() => (audio.play('paper'), setOpen(null))} />
            ) : list.length ? (
              <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 lg:grid-cols-4">
                {list.map((def, i) => (
                  <Item key={def.id} def={def} st={evidence[def.id]} i={i} onOpen={() => (audio.play('paper'), setOpen(def.id))} />
                ))}
              </motion.div>
            ) : (
              <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hand py-16 text-center text-3xl text-ink/50">
                Empty. Look closely — and bag what matters.
              </motion.p>
            )}
          </AnimatePresence>
          <button
            data-testid="close-folder"
            onClick={() => useGame.getState().closeOverlay()}
            className="mt-6 font-mono text-[11px] uppercase tracking-[0.3em] text-ink/70 hover:text-burgundy"
          >
            Close folder · F
          </button>
        </div>
      </div>
    </motion.div>
  );
}
