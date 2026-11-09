/**
 * The gathering in the living room. The accusation is built in seven beats,
 * each answered on camera by the people in the room. Nothing is pre-filled:
 * every option comes from what the investigator has actually found, and the
 * evaluation happens only once the theory is delivered.
 */
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '../state/store';
import { deliver, updateAccusation, withdraw } from '../state/finale';
import { nameOf, snapshot } from '../state/story';
import { direct } from '../world/npc/CinemaStage';
import { ACCUSED_REACTION, OPENING_BEATS, type Beat } from '../data/scenes';
import { EVIDENCE, EVIDENCE_BY_ID } from '../data/evidence';
import { CONTRADICTION_BY_ID } from '../data/testimony';
import { MOTIVE_LEADS } from '../data/relations';
import { THEORIES, TL_BY_ID } from '../data/mystery';
import { MOTIVE_LABEL, check, type MotiveCategory } from '../systems/conditions';
import { portraitDataUrl } from '../notebook/portraitImage';
import { audio } from '../audio/audio';

const SUSPECTS = ['ransom', 'linda', 'richard', 'walt', 'joni', 'meg', 'marta'];
const STEPS = ['suspect', 'motive', 'opportunity', 'timeline', 'evidence', 'contradictions', 'theory', 'deliver'] as const;
type Step = (typeof STEPS)[number];
const STEP_TITLE: Record<Step, string> = {
  suspect: 'I. Who is responsible?',
  motive: 'II. Why?',
  opportunity: 'III. How could they?',
  timeline: 'IV. How the night went',
  evidence: 'V. What proves it',
  contradictions: 'VI. Where their story breaks',
  theory: 'VII. What really happened to Harlan',
  deliver: 'The theory, entire',
};

function Subtitle({ beat }: { beat: Beat | null }) {
  return (
    <AnimatePresence mode="wait">
      {beat && (
        <motion.div key={beat.text} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pointer-events-none fixed inset-x-0 top-[11vh] z-30 flex flex-col items-center px-6 text-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-gold">{nameOf(beat.who)}</div>
          <p className="mt-1 max-w-3xl font-display text-[clamp(1.1rem,2.2vw,1.5rem)] leading-snug text-ivory drop-shadow-[0_2px_10px_rgba(0,0,0,1)]" data-testid="confront-line">
            {beat.text}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Chip({ on, onClick, children, testId }: { on: boolean; onClick: () => void; children: React.ReactNode; testId?: string }) {
  return (
    <button
      data-testid={testId}
      onClick={() => (audio.play('paper'), onClick())}
      className={`paper px-2.5 py-1.5 text-left shadow transition ${on ? 'ring-2 ring-blood' : 'opacity-85 hover:opacity-100'}`}
    >
      {children}
    </button>
  );
}

export function Confrontation() {
  const overlay = useGame((s) => s.overlay);
  const acc = useGame((s) => s.finale.accusation);
  const evidence = useGame((s) => s.evidence);
  const contradictions = useGame((s) => s.contradictions);
  const motiveLeads = useGame((s) => s.motiveLeads);
  const timeline = useGame((s) => s.timeline);
  const [opening, setOpening] = useState(0);
  const [step, setStep] = useState(0);
  const [beat, setBeat] = useState<Beat | null>(OPENING_BEATS[0]);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const snap = useMemo(() => snapshot(), [evidence, contradictions]);

  // the room opens on Blanc
  useEffect(() => {
    if (overlay !== 'confrontation') return;
    const b = OPENING_BEATS[opening];
    if (b) {
      setBeat(b);
      direct(b.shot, b.who, b.mood);
    }
  }, [overlay, opening]);

  if (overlay !== 'confrontation') return null;
  const inOpening = opening < OPENING_BEATS.length;
  const cur: Step = STEPS[step];
  const say = (lines: { who: string; text: string; mood?: Beat['mood'] }[]) => {
    let i = 0;
    const next = () => {
      const l = lines[i++];
      if (!l) return;
      const b: Beat = { who: l.who, text: l.text, mood: l.mood, shot: { on: l.who } };
      setBeat(b);
      direct(b.shot, b.who, b.mood);
      if (i < lines.length) setTimeout(next, 2600);
    };
    next();
  };
  const advance = () => {
    audio.play('click');
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
    direct({ wide: true }, null);
    setBeat(null);
  };
  const toggle = (list: string[], v: string, max: number) => (list.includes(v) ? list.filter((x) => x !== v) : list.length >= max ? list : [...list, v]);
  const haveEvidence = EVIDENCE.filter((e) => evidence[e.id]);
  const leadsFor = acc.suspect ? motiveLeads.filter((l) => l.startsWith(`${acc.suspect}:`)) : [];
  const theories = THEORIES.filter((t) => check(t.available, snap));

  return (
    <div className="fixed inset-0 z-20" data-testid="confrontation">
      <motion.div className="pointer-events-none fixed inset-x-0 top-0 z-20 bg-shadow" initial={{ height: 0 }} animate={{ height: '9vh' }} />
      <motion.div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 bg-shadow" initial={{ height: 0 }} animate={{ height: '6vh' }} />
      <Subtitle beat={beat} />

      {inOpening ? (
        <button data-testid="confront-continue" onClick={() => setOpening((o) => o + 1)} className="fixed bottom-[8vh] left-1/2 z-30 -translate-x-1/2 font-mono text-[11px] uppercase tracking-[0.3em] text-ivory/70 hover:text-ivory">
          Continue ›
        </button>
      ) : (
        <motion.div
          key={cur}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-[6.5vh] left-1/2 z-30 max-h-[46vh] w-[min(96vw,900px)] -translate-x-1/2 overflow-y-auto bg-gradient-to-t from-shadow/95 to-shadow/75 px-4 pb-3 pt-3 backdrop-blur-[2px] scroll-quiet sm:px-6"
          data-testid={`step-${cur}`}
        >
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <div className="font-display text-xl italic text-ivory">{STEP_TITLE[cur]}</div>
            <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-ivory/40">
              {step + 1} / {STEPS.length}
            </div>
          </div>

          {cur === 'suspect' && (
            <div className="flex flex-wrap gap-2">
              {SUSPECTS.map((p) => (
                <button
                  key={p}
                  data-testid={`accuse-${p}`}
                  onMouseEnter={() => direct({ on: p }, null)}
                  onClick={() => {
                    updateAccusation({ suspect: p, motive: null });
                    say(ACCUSED_REACTION[p] ?? []);
                  }}
                  className={`w-[88px] bg-[#f4efe4] p-1 pb-0.5 shadow transition ${acc.suspect === p ? 'ring-4 ring-blood' : 'opacity-80 hover:opacity-100'}`}
                >
                  <img src={portraitDataUrl(p)} alt="" className="h-20 w-full object-cover" />
                  <div className="hand text-center text-lg leading-none text-ink">{nameOf(p)}</div>
                </button>
              ))}
            </div>
          )}

          {cur === 'motive' && (
            <div className="flex flex-wrap gap-2">
              {leadsFor.map((l) => {
                const lead = MOTIVE_LEADS.find((m) => m.id === l);
                return (
                  <Chip
                    key={l}
                    testId={`motive-${l}`}
                    on={acc.motive === l}
                    onClick={() => {
                      updateAccusation({ motive: l });
                      say([{ who: acc.suspect!, text: acc.suspect === 'ransom' ? 'Oh, money. Everyone’s favourite motive. Very original.' : 'You think I needed a reason like that?', mood: 'defensive' }]);
                    }}
                  >
                    <div className="font-mono text-[9px] uppercase tracking-wider text-blood">{MOTIVE_LABEL[l.split(':')[1] as MotiveCategory]}</div>
                    <div className="font-display text-[14px] leading-tight text-ink">{lead?.text}</div>
                  </Chip>
                );
              })}
              {!leadsFor.length && <p className="hand text-xl text-ivory/60">You have uncovered no motive for {acc.suspect ? nameOf(acc.suspect) : 'them'}.</p>}
            </div>
          )}

          {(cur === 'opportunity' || cur === 'evidence') && (
            <div className="flex flex-wrap gap-1.5">
              {haveEvidence.map((e) => {
                const list = cur === 'opportunity' ? acc.opportunity : acc.evidence;
                return (
                  <Chip
                    key={e.id}
                    testId={`${cur}-${e.id}`}
                    on={list.includes(e.id)}
                    onClick={() => updateAccusation(cur === 'opportunity' ? { opportunity: toggle(acc.opportunity, e.id, 3) } : { evidence: toggle(acc.evidence, e.id, 6) })}
                  >
                    <span className="font-mono text-[9px] text-blood">{e.id}</span> <span className="font-display text-[13px] text-ink">{e.name}</span>
                  </Chip>
                );
              })}
              <p className="w-full font-mono text-[9px] uppercase tracking-[0.2em] text-ivory/40">{cur === 'opportunity' ? 'Up to three items that put them where it mattered' : 'Up to six items that support the theory'}</p>
            </div>
          )}

          {cur === 'timeline' && (
            <div>
              {timeline.length ? (
                <ol className="flex flex-wrap gap-1.5" data-testid="confront-timeline">
                  {timeline.map((id, i) => (
                    <li key={id} className="paper px-2 py-1 shadow">
                      <span className="mr-1 font-mono text-[9px] text-burgundy">{i + 1}.</span>
                      <span className="font-display text-[13px] text-ink">{TL_BY_ID[id].label}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="hand text-xl text-ivory/60">Your timeline cord is empty. You will have to tell it from memory.</p>
              )}
            </div>
          )}

          {cur === 'contradictions' && (
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(contradictions).map((id) => (
                <Chip key={id} testId={`contra-${id}`} on={acc.contradictions.includes(id)} onClick={() => updateAccusation({ contradictions: toggle(acc.contradictions, id, 5) })}>
                  <div className="font-mono text-[9px] uppercase text-blood">✕ {nameOf(CONTRADICTION_BY_ID[id].challenge)}</div>
                  <div className="font-display text-[13px] text-ink">{CONTRADICTION_BY_ID[id].title}</div>
                </Chip>
              ))}
              {!Object.keys(contradictions).length && <p className="hand text-xl text-ivory/60">You marked no contradictions.</p>}
            </div>
          )}

          {cur === 'theory' && (
            <div className="space-y-1.5">
              {theories.map((t) => (
                <Chip
                  key={t.id}
                  testId={`theory-${t.id}`}
                  on={acc.theory === t.id}
                  onClick={() => {
                    updateAccusation({ theory: t.id });
                    if (t.id === 'TH-swap') say([{ who: 'marta', text: 'Swapped…? Then I —', mood: 'surprised' }]);
                    if (t.id === 'TH-overdose') say([{ who: 'marta', text: 'Please — I know. I know what I did.', mood: 'sick' }]);
                  }}
                >
                  <span className="font-display text-[15px] leading-snug text-ink">{t.text}</span>
                </Chip>
              ))}
            </div>
          )}

          {cur === 'deliver' && (
            <div className="paper px-4 py-3 text-ink" data-testid="theory-summary">
              <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-ink/55">My theory</div>
              <ul className="mt-1 space-y-0.5 font-display text-[15px] leading-snug">
                <li>
                  <b>Responsible:</b> {acc.suspect ? nameOf(acc.suspect) : '—'}
                </li>
                <li>
                  <b>Motive:</b> {acc.motive ? MOTIVE_LEADS.find((m) => m.id === acc.motive)?.text : '—'}
                </li>
                <li>
                  <b>Opportunity:</b> {acc.opportunity.map((e) => EVIDENCE_BY_ID[e].name).join('; ') || '—'}
                </li>
                <li>
                  <b>The night:</b> {timeline.length} events on the cord
                </li>
                <li>
                  <b>Evidence:</b> {acc.evidence.map((e) => e).join(', ') || '—'}
                </li>
                <li>
                  <b>Contradictions:</b> {acc.contradictions.map((c) => CONTRADICTION_BY_ID[c].title).join('; ') || '—'}
                </li>
                <li>
                  <b>What happened:</b> {THEORIES.find((t) => t.id === acc.theory)?.text ?? '—'}
                </li>
              </ul>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between border-t border-ivory/15 pt-2">
            <div className="flex items-center gap-3">
              {step > 0 && (
                <button onClick={() => setStep(step - 1)} className="font-mono text-[10px] uppercase tracking-[0.25em] text-ivory/60 hover:text-ivory">
                  ‹ Back
                </button>
              )}
              {!confirmWithdraw ? (
                <button data-testid="withdraw" onClick={() => setConfirmWithdraw(true)} className="font-mono text-[10px] uppercase tracking-[0.25em] text-ivory/40 hover:text-ivory">
                  Withdraw without naming anyone
                </button>
              ) : (
                <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ivory/70">
                  End the case unresolved?
                  <button data-testid="confirm-withdraw" onClick={withdraw} className="text-blood">
                    Yes
                  </button>
                  <button onClick={() => setConfirmWithdraw(false)}>No</button>
                </span>
              )}
            </div>
            {cur === 'deliver' ? (
              <button
                data-testid="deliver"
                disabled={!acc.suspect}
                onClick={() => (audio.play('seal'), deliver())}
                className="border border-blood bg-burgundy px-5 py-2 font-title text-xs uppercase tracking-[0.3em] text-ivory disabled:opacity-40"
              >
                Deliver my theory
              </button>
            ) : (
              <button data-testid="next-step" disabled={cur === 'suspect' && !acc.suspect} onClick={advance} className="border border-gold/60 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-gold disabled:opacity-40">
                Go on ›
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
