/** The closed case file: a manila dossier with typed findings and rubber stamps. */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../state/store';
import { returnToHouse, startFresh } from '../state/finale';
import { nameOf } from '../state/story';
import { EVIDENCE_BY_ID } from '../data/evidence';
import { CONTRADICTION_BY_ID } from '../data/testimony';
import { CHALLENGES, THEORIES } from '../data/mystery';
import { MOTIVE_LEADS } from '../data/relations';
import { RANKS } from '../systems/deduction';
import { audio } from '../audio/audio';

function Row({ k, v, testId }: { k: string; v: React.ReactNode; testId?: string }) {
  return (
    <div className="grid grid-cols-[9.5rem_1fr] gap-3 border-b border-ink/10 py-1.5" data-testid={testId}>
      <div className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-ink/55">{k}</div>
      <div className="font-display text-[15px] leading-snug text-ink">{v}</div>
    </div>
  );
}

const pct = (n: number) => `${Math.round(n * 100)}%`;

export function CaseReport() {
  const overlay = useGame((s) => s.overlay);
  const r = useGame((s) => s.lastReport);
  const phase = useGame((s) => s.phase);
  const [confirm, setConfirm] = useState<null | 'full' | 'sparse'>(null);
  if (overlay !== 'report' || !r) return null;
  const sc = r.evaluation.scores;
  const verdictStamp = { complete: 'Case closed', partial: 'Unproven', incomplete: 'Unproven', wrong: 'Wrongful accusation', unresolved: 'Open file' }[r.evaluation.verdict];
  const fresh = async (mode: 'full' | 'sparse') => {
    audio.play('seal');
    await startFresh(mode);
    useGame.setState({ overlay: 'none', lastReport: null, phase: 'invitation' });
  };
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-shadow/80 p-2 sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} data-testid="case-report">
      <motion.div initial={{ y: 50, rotate: -2, opacity: 0 }} animate={{ y: 0, rotate: -0.4, opacity: 1 }} transition={{ duration: 0.8 }} className="relative my-auto w-full max-w-3xl">
        <div className="manila absolute -top-7 left-8 rounded-t-md px-5 py-1.5 font-mono text-[10px] uppercase tracking-[0.3em]">Case No. HT-85 · Thrombey</div>
        <div className="manila relative rounded-[3px] rounded-tl-none p-3 shadow-[0_30px_90px_rgba(0,0,0,0.8)] sm:p-5">
          <div className="paper relative px-5 py-6 sm:px-9">
            {/* stamps */}
            <div className="absolute right-6 top-6 rotate-[8deg] border-[3px] border-blood px-3 py-1 font-mono text-sm uppercase tracking-[0.3em] text-blood opacity-85" data-testid="verdict-stamp">
              {verdictStamp}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-ink/55">Final report of the investigation</div>
            <h2 className="mt-1 font-title text-2xl text-ink sm:text-3xl">{r.title}</h2>
            <div className="mt-1 font-display text-lg italic text-burgundy" data-testid="report-ending">
              {r.endingTitle}
            </div>

            <div className="mt-5">
              <Row k="Investigation" v={`${r.gameMinutes} minutes of the night (${r.realMinutes} real) · closed at ${r.clockClosed}`} />
              <Row k="Rooms explored" v={`${r.rooms[0]} of ${r.rooms[1]}`} />
              <Row k="Interviewed" v={r.interviewed.map(nameOf).join(', ') || '—'} />
              <Row k="Evidence" v={`${r.evidence.length} items — ${r.evidence.join(', ') || 'none'}`} />
              <Row k="Missed" v={r.missed.length ? r.missed.join('; ') : 'Nothing essential.'} testId="report-missed" />
              <Row k="Contradictions" v={`${r.contradictions.length} of ${r.contradictionTotal}: ${r.contradictions.map((c) => CONTRADICTION_BY_ID[c].title).join('; ') || '—'}`} />
              <Row k="Timeline" v={`${r.timelinePct}% accurate`} />
              <Row k="Case questions" v={`${r.challenges.length} of ${CHALLENGES.length}: ${r.challenges.map((c) => CHALLENGES.find((x) => x.id === c)?.title).join('; ') || '—'}`} />
              <Row
                k="Accusation"
                testId="report-accusation"
                v={
                  r.accusation.suspect ? (
                    <>
                      <b>{nameOf(r.accusation.suspect)}</b>
                      {r.accusation.motive ? ` — ${MOTIVE_LEADS.find((m) => m.id === r.accusation.motive)?.text}` : ' — no motive given'}
                      <br />
                      <span className="text-ink/75">{THEORIES.find((t) => t.id === r.accusation.theory)?.text ?? 'No explanation of the final discovery.'}</span>
                      {r.accusation.evidence.length ? <div className="font-mono text-[11px] text-ink/60">Cited: {r.accusation.evidence.map((e) => EVIDENCE_BY_ID[e].name).join('; ')}</div> : null}
                    </>
                  ) : (
                    'None made.'
                  )
                }
              />
              <Row
                k="Deduction"
                v={
                  <div className="grid grid-cols-2 gap-x-4 font-mono text-[11px] sm:grid-cols-3">
                    <span>Identification {pct(sc.identification)}</span>
                    <span>Motive {pct(sc.motive)}</span>
                    <span>Timeline {pct(sc.timeline)}</span>
                    <span>Evidence {pct(sc.evidence)}</span>
                    <span>Contradictions {pct(sc.contradictions)}</span>
                    <span>Logic {pct(sc.logic)}</span>
                  </div>
                }
              />
              {r.evaluation.notes.length > 0 && <Row k="Blanc’s notes" v={<span className="hand text-xl leading-tight text-[#1d2a4a]">{r.evaluation.notes.join(' ')}</span>} />}
              <Row k="Hints" v={`${r.hintsUsed} requested${r.hintMode === 'sparse' ? ' (fewer-hints case)' : ''}`} />
            </div>

            <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-ink/55">Rating</div>
                <div className="flex gap-1">
                  {RANKS.map((rk) => (
                    <span key={rk} className={`h-1.5 w-8 ${RANKS.indexOf(rk) <= RANKS.indexOf(r.rank) ? 'bg-burgundy' : 'bg-ink/15'}`} />
                  ))}
                </div>
              </div>
              <motion.div initial={{ scale: 1.8, opacity: 0, rotate: -20 }} animate={{ scale: 1, opacity: 1, rotate: -7 }} transition={{ delay: 0.6 }} className="border-4 border-double border-burgundy px-4 py-2 text-center" data-testid="rank-stamp">
                <div className="font-mono text-[9px] uppercase tracking-[0.35em] text-burgundy">{r.score} / 100</div>
                <div className="font-title text-xl uppercase tracking-wide text-burgundy">{r.rank}</div>
              </motion.div>
            </div>
            <div className="mt-4 text-right font-hand text-3xl text-[#1d2a4a]">— B. Blanc</div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 px-2">
            {phase === 'playing' && (
              <button data-testid="report-house" onClick={returnToHouse} className="border border-ink/40 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-ink">
                Return to the house
              </button>
            )}
            {!confirm ? (
              <>
                <button data-testid="report-new" onClick={() => setConfirm('full')} className="border border-burgundy bg-burgundy px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-ivory">
                  New investigation
                </button>
                <button data-testid="report-new-sparse" onClick={() => setConfirm('sparse')} className="border border-burgundy px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-burgundy">
                  New — fewer hints
                </button>
              </>
            ) : (
              <div className="paper flex items-center gap-3 px-3 py-2 shadow">
                <span className="font-display text-[15px] text-ink">Start again? This case file is kept, and your last save is set aside safely.</span>
                <button data-testid="confirm-fresh" onClick={() => void fresh(confirm)} className="font-mono text-[10px] uppercase tracking-widest text-burgundy">
                  Begin
                </button>
                <button onClick={() => setConfirm(null)} className="font-mono text-[10px] uppercase tracking-widest text-ink/60">
                  Not yet
                </button>
              </div>
            )}
            <button
              data-testid="report-title"
              onClick={() => {
                useGame.setState({ overlay: 'none', lastReport: null, phase: 'intro', cinema: null });
              }}
              className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-ink/70"
            >
              To the title
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
