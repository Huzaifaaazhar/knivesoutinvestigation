/**
 * The will, laid out on the desk: the document itself (zoom with the loupe,
 * touch the clauses, seal and margins), the attorney's letter to compare it
 * with, and a sheet of questions the investigator must answer from what they
 * have found.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGame, keyHotspots } from '../state/store';
import { INTERACTABLE_BY_ID } from '../data/interactables';
import { EVIDENCE } from '../data/evidence';
import { REL_BY_ID } from '../data/relations';
import { WILL_QUESTIONS, type WillQuestion } from '../data/mystery';
import { DocumentView } from '../inspection/DocumentView';
import { setWillAnswer, testChallenge, solvedFlags } from '../state/finale';
import { nameOf } from '../state/story';
import { audio } from '../audio/audio';

const PEOPLE = ['marta', 'ransom', 'linda', 'walt', 'joni', 'meg', 'richard'];
const NONE: string[] = [];

function Picker({ q }: { q: WillQuestion }) {
  const picked = useGame((s) => s.willAnswers[q.id] ?? NONE);
  const evidence = useGame((s) => s.evidence);
  const seen = useGame((s) => s.details['sealed-will'] ?? NONE);
  const rels = useGame((s) => s.relationships);
  const will = INTERACTABLE_BY_ID['sealed-will'];
  const options: { id: string; label: string }[] =
    q.pick === 'evidence'
      ? EVIDENCE.filter((e) => evidence[e.id]).map((e) => ({ id: e.id, label: e.id }))
      : q.pick === 'person'
        ? PEOPLE.map((p) => ({ id: p, label: nameOf(p) }))
        : q.pick === 'detail'
          ? (will.hotspots ?? []).filter((h) => seen.includes(h.id)).map((h) => ({ id: h.id, label: h.label }))
          : rels.filter((r) => !REL_BY_ID[r].onTree).map((r) => ({ id: r, label: `${nameOf(REL_BY_ID[r].a)}–${nameOf(REL_BY_ID[r].b)}: ${REL_BY_ID[r].kind}` }));
  const toggle = (id: string) => {
    audio.play('pencil');
    setWillAnswer(q.id, q.multi ? (picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]) : picked[0] === id ? [] : [id]);
  };
  return (
    <div className="mb-3" data-testid={`will-q-${q.id}`}>
      <div className="hand text-[1.3rem] leading-tight text-[#1d2a4a]">{q.question}</div>
      <div className="mt-0.5 flex flex-wrap gap-1">
        {options.length ? (
          options.map((o) => (
            <button
              key={o.id}
              data-testid={`will-a-${q.id}-${o.id}`}
              onClick={() => toggle(o.id)}
              className={`border px-1.5 py-0.5 font-ui text-[11px] ${picked.includes(o.id) ? 'border-burgundy bg-burgundy/15 text-burgundy' : 'border-ink/25 text-ink/65 hover:border-ink/50'}`}
            >
              {o.label}
            </button>
          ))
        ) : (
          <span className="font-ui text-[11px] italic text-ink/45">{q.pick === 'detail' ? 'Examine the document’s details first.' : 'Nothing found yet that answers this.'}</span>
        )}
      </div>
    </div>
  );
}

export function WillViewer() {
  const overlay = useGame((s) => s.overlay);
  const seen = useGame((s) => s.details['sealed-will'] ?? NONE);
  const collected = useGame((s) => !!s.evidence['EV-20']);
  const hasLetter = useGame((s) => !!s.evidence['EV-04']);
  useGame((s) => s.flags);
  const [active, setActive] = useState<string | null>(null);
  const [compare, setCompare] = useState(false);
  const [tested, setTested] = useState<boolean | null>(null);
  if (overlay !== 'will') return null;
  const def = INTERACTABLE_BY_ID['sealed-will'];
  const letter = INTERACTABLE_BY_ID['desk-drawer'];
  const hs = def.hotspots ?? [];
  const activeHs = hs.find((h) => h.id === active) ?? (letter.hotspots ?? []).find((h) => h.id === active);
  const keySeen = keyHotspots('sealed-will').filter((k) => seen.includes(k)).length;
  const solved = solvedFlags().includes('CH-will');
  const onDetail = (id: string) => {
    setActive(id);
    useGame.getState().seeDetail('sealed-will', id);
    audio.play('pencil');
  };
  return (
    <motion.div className="fixed inset-0 z-20 flex flex-col bg-[radial-gradient(ellipse_at_center,rgba(36,24,21,0.9),rgba(13,13,15,0.98))]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} data-testid="will">
      <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-gold/70">
            The library · <span className="text-blood">EV-20 · Document</span>
          </div>
          <h2 className="font-title text-2xl text-ivory">Harlan’s Sealed Will</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hasLetter && (
            <button data-testid="compare-letter" onClick={() => setCompare((c) => !c)} className={`border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] ${compare ? 'border-gold text-gold' : 'border-ivory/30 text-ivory/70'}`}>
              {compare ? 'Put the letter away' : 'Compare with the attorney’s letter'}
            </button>
          )}
          {!collected ? (
            <button
              data-testid="collect-will"
              disabled={keySeen === 0}
              onClick={() => useGame.getState().collectEvidence('sealed-will')}
              className="border border-blood bg-burgundy px-4 py-1.5 font-title text-[11px] uppercase tracking-[0.25em] text-ivory disabled:border-ivory/15 disabled:bg-transparent disabled:text-ivory/35"
            >
              {keySeen ? 'Bag & tag as evidence' : 'Read it closely to log'}
            </button>
          ) : (
            <span className="border border-gold/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-gold">✓ In the evidence folder</span>
          )}
          <button data-testid="close-will" onClick={() => useGame.getState().closeOverlay()} className="h-9 rounded-full border border-ivory/30 px-4 text-[11px] uppercase tracking-widest text-ivory/80">
            Return
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 scroll-quiet lg:flex-row lg:overflow-hidden">
        <div className="flex min-h-0 flex-1 items-start justify-center gap-4 overflow-auto scroll-quiet">
          <DocumentView doc={def.document!} hotspots={hs} seen={seen} onDetail={onDetail} loupe />
          {compare && (
            <div className="hidden origin-top scale-[0.8] xl:block">
              <DocumentView doc={letter.document!} hotspots={letter.hotspots ?? []} seen={[]} onDetail={(id) => setActive(id)} loupe={false} />
            </div>
          )}
        </div>
        <aside className="paper paper-ruled w-full shrink-0 overflow-y-auto px-5 pb-5 pl-14 pt-4 lg:w-[360px]">
          <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-ink/55">The Will — questions</div>
          {WILL_QUESTIONS.map((q) => (
            <Picker key={q.id} q={q} />
          ))}
          {solved ? (
            <div className="mt-2 inline-block rotate-[-3deg] border-2 border-burgundy px-2 font-mono text-[10px] uppercase tracking-widest text-burgundy" data-testid="will-solved">
              Solved
            </div>
          ) : (
            <button data-testid="test-will" onClick={() => setTested(testChallenge('CH-will'))} className="mt-1 font-ui text-[10px] uppercase tracking-[0.2em] text-burgundy hover:underline">
              Test my reasoning
            </button>
          )}
          {tested === false && !solved && <p className="hand mt-1 text-xl leading-tight text-ink/55">Not quite. One of these answers doesn’t stand up.</p>}
        </aside>
      </div>
      <footer className="min-h-[3.5rem] px-5 pb-4">
        {activeHs ? (
          <>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold/80">{activeHs.label}</div>
            <p className="font-display text-lg leading-snug text-ivory/90" data-testid="will-detail">
              {activeHs.detail}
            </p>
          </>
        ) : (
          <p className="font-display text-lg italic text-ivory/60">Touch the clauses, the seal and the margins. The loupe shows the pencil.</p>
        )}
      </footer>
    </motion.div>
  );
}
