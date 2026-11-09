/**
 * Notebook pages for Part 2: testimony (with the Compare tool that marks
 * contradictions), the contradictions register, motive worksheets, and the
 * investigator's own assumptions. Physical paper, handwritten entries.
 */
import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../state/store';
import { STATEMENTS, STATEMENT_BY_ID, CONTRADICTIONS, CONTRADICTION_BY_ID, type Source } from '../data/testimony';
import { EVIDENCE, EVIDENCE_BY_ID } from '../data/evidence';
import { MEMORY_BY_ID, MOTIVE_LEADS } from '../data/relations';
import { NPC_BY_ID } from '../data/npcs';
import { flaggedStatements, statementStatus } from '../systems/contradictions';
import { MOTIVE_LABEL, type MotiveCategory } from '../systems/conditions';
import { EMPTY_MOTIVE, addAssumption, nameOf, snapshot, tryCompare, updateMotive } from '../state/story';
import { npcRt } from '../state/npcRuntime';
import { placeName } from '../data/layout';
import { audio } from '../audio/audio';

export function PageTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="mb-4">
      {sub && <div className="font-mono text-[9px] uppercase tracking-[0.35em] text-ink/50">{sub}</div>}
      <h3 className="font-title text-xl text-ink">{children}</h3>
      <div className="mt-1 h-px w-24 bg-burgundy/50" />
    </div>
  );
}

const STATUS_STYLE = {
  confirmed: 'border-olive text-olive',
  unverified: 'border-ink/40 text-ink/60',
  contradicted: 'border-blood text-blood',
};

// ───────────────────────── Testimony ─────────────────────────

export function TestimonyPage({ ids, first, onCompare }: { ids: string[]; first: boolean; onCompare: (id: string) => void }) {
  const statements = useGame((s) => s.statements);
  useGame((s) => s.contradictions);
  const snap = snapshot();
  const flagged = flaggedStatements(snap);
  return (
    <>
      {first && <PageTitle sub="What people have told me">Testimony</PageTitle>}
      {first && (
        <div className="mb-3 flex flex-wrap gap-2 font-mono text-[8.5px] uppercase tracking-[0.2em]">
          {(['confirmed', 'unverified', 'contradicted'] as const).map((k) => (
            <span key={k} className={`border px-1.5 py-0.5 ${STATUS_STYLE[k]}`}>
              {k}
            </span>
          ))}
          <span className="text-blood">? = deserves a second look</span>
        </div>
      )}
      {ids.length ? (
        <ul className="space-y-3" data-testid="testimony">
          {ids.map((id) => {
            const st = STATEMENT_BY_ID[id];
            const status = statementStatus(id, snap);
            return (
              <li key={id} className="relative" data-testid={`statement-${id}`}>
                {flagged.has(id) && (
                  <span className="hand absolute -left-8 top-0 text-3xl leading-none text-blood" title="Something about this doesn’t sit right" data-testid="flag">
                    ?
                  </span>
                )}
                <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-ink/50">
                  <span>{statements[id]?.at}</span>
                  <span>· {NPC_BY_ID[st.by]?.short}</span>
                  <span className={`border px-1 ${STATUS_STYLE[status]}`}>{status}</span>
                </div>
                <div className={`hand text-[1.25rem] leading-[1.08] ${status === 'contradicted' ? 'text-blood line-through decoration-1' : 'text-[#1d2a4a]'}`}>“{st.quote}”</div>
                {st.evidence?.length ? <div className="font-mono text-[9px] text-ink/45">re: {st.evidence.filter((e) => EVIDENCE_BY_ID[e]).join(', ')}</div> : null}
                <button data-testid={`compare-${id}`} onClick={() => onCompare(id)} className="mt-0.5 font-ui text-[10px] uppercase tracking-[0.2em] text-burgundy hover:underline">
                  Compare…
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="hand mt-8 text-center text-2xl text-ink/30">{first ? 'Nobody has told me anything yet.' : '—'}</p>
      )}
    </>
  );
}

export function testimonyIds(heard: Record<string, unknown>): string[] {
  // grouped by speaker, in roster order
  const order = Object.keys(NPC_BY_ID);
  return STATEMENTS.filter((s) => heard[s.id]).sort((a, b) => order.indexOf(a.by) - order.indexOf(b.by)).map((s) => s.id);
}

/** A slip of paper for setting one account against another. */
export function CompareSlip({ statementId, onClose }: { statementId: string; onClose: () => void }) {
  const s = useGame.getState();
  const [result, setResult] = useState<string | null>(null);
  const st = STATEMENT_BY_ID[statementId];
  const options: { key: string; label: string; src: Source }[] = [
    ...Object.keys(s.statements)
      .filter((id) => id !== statementId)
      .map((id) => ({ key: `s-${id}`, label: `${nameOf(STATEMENT_BY_ID[id].by)}: “${STATEMENT_BY_ID[id].summary}”`, src: { statement: id } as Source })),
    ...EVIDENCE.filter((e) => s.evidence[e.id]).map((e) => ({ key: `e-${e.id}`, label: `${e.id} · ${e.name}`, src: { evidence: e.id } as Source })),
    ...s.memories.map((m) => ({ key: `m-${m}`, label: `Memory: ${MEMORY_BY_ID[m].title}`, src: { memory: m } as Source })),
  ];
  const pick = (src: Source) => {
    const r = tryCompare(statementId, src);
    if (r.ok) setResult(`ok:${CONTRADICTION_BY_ID[r.id].title}`);
    else if (r.reason === 'already') setResult('These are already marked as a contradiction.');
    else setResult('Set side by side, these don’t conflict — not directly. Perhaps something else does.');
  };
  return (
    <motion.div initial={{ opacity: 0, y: 20, rotate: 2 }} animate={{ opacity: 1, y: 0, rotate: 0.5 }} className="paper absolute inset-x-4 top-8 z-20 max-h-[80%] overflow-y-auto p-5 shadow-2xl scroll-quiet sm:inset-x-12" data-testid="compare-slip">
      <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-ink/55">Set against…</div>
      <div className="hand text-[1.35rem] leading-tight text-[#1d2a4a]">
        {nameOf(st.by)}: “{st.quote}”
      </div>
      {result?.startsWith('ok:') ? (
        <div className="mt-4 border-2 border-blood px-3 py-2 text-center" data-testid="compare-result">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-blood">Contradiction recorded</div>
          <div className="font-title text-lg text-ink">{result.slice(3)}</div>
        </div>
      ) : (
        <>
          {result && (
            <p className="hand mt-2 text-xl text-ink/60" data-testid="compare-result">
              {result}
            </p>
          )}
          <ul className="mt-3 space-y-1">
            {options.map((o) => (
              <li key={o.key}>
                <button data-testid={`against-${o.key}`} onClick={() => pick(o.src)} className="w-full text-left font-display text-[15px] leading-tight text-ink hover:text-burgundy">
                  → {o.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <button onClick={onClose} className="mt-4 font-mono text-[10px] uppercase tracking-[0.25em] text-ink/60 hover:text-burgundy" data-testid="close-compare">
        Put the slip away
      </button>
    </motion.div>
  );
}

// ───────────────────────── Contradictions ─────────────────────────

function sourceText(src: Source): string {
  if ('statement' in src) {
    const st = STATEMENT_BY_ID[src.statement];
    return `${nameOf(st.by)}: “${st.quote}”`;
  }
  if ('evidence' in src) return `${src.evidence} · ${EVIDENCE_BY_ID[src.evidence].name} — ${EVIDENCE_BY_ID[src.evidence].description}`;
  return `Memory — ${MEMORY_BY_ID[src.memory].title}`;
}

export function ContradictionPage({ ids, first, onRevisit }: { ids: string[]; first: boolean; onRevisit: (npc: string) => void }) {
  const snap = snapshot();
  const open = flaggedStatements(snap).size;
  return (
    <>
      {first && <PageTitle sub="Two things that cannot both be true">Contradictions</PageTitle>}
      {first && (
        <p className="mb-3 font-ui text-[11px] text-ink/60">
          {open ? `${open} statement${open > 1 ? 's' : ''} in the testimony deserve${open > 1 ? '' : 's'} a second look (marked “?”).` : 'No unexamined tensions at the moment.'}
        </p>
      )}
      {ids.length ? (
        <ul className="space-y-5" data-testid="contradictions">
          {ids.map((id) => {
            const c = CONTRADICTION_BY_ID[id];
            const claim = STATEMENT_BY_ID[c.claim];
            const known = c.against.filter((a) => ('statement' in a ? snap.statements[a.statement] : 'evidence' in a ? snap.evidence[a.evidence] : snap.memories.includes(a.memory)));
            return (
              <li key={id} data-testid={`contradiction-${id}`}>
                <div className="font-mono text-[9px] uppercase tracking-widest text-blood">
                  {String((snap.contradictions[id] as { at?: string } | undefined)?.at ?? '')} · {c.title}
                </div>
                <div className="mt-1 grid grid-cols-[auto_1fr] gap-x-2 text-[13px] leading-snug">
                  <span className="font-mono text-[10px] text-ink/50">A</span>
                  <span className="hand text-[1.15rem] leading-tight text-[#1d2a4a]">
                    {nameOf(claim.by)}: “{claim.quote}”
                  </span>
                  {known.map((k, i) => (
                    <FragmentRow key={i} label={i === 0 ? 'B' : '+'} text={sourceText(k)} />
                  ))}
                </div>
                <p className="mt-1 font-display text-[14px] italic text-ink/75">{c.tension}</p>
                <button onClick={() => onRevisit(c.challenge)} className="mt-1 font-ui text-[10px] uppercase tracking-[0.2em] text-burgundy hover:underline" data-testid={`revisit-${id}`}>
                  Revisit {nameOf(c.challenge)} →
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="hand mt-8 text-center text-2xl text-ink/30">{first ? 'Nothing contradicts anything — yet.' : '—'}</p>
      )}
    </>
  );
}

function FragmentRow({ label, text }: { label: string; text: string }) {
  return (
    <>
      <span className="font-mono text-[10px] text-ink/50">{label}</span>
      <span className="font-display text-[14px] leading-tight text-ink/85">{text}</span>
    </>
  );
}

export const contradictionIds = (c: Record<string, { ts: number }>) => CONTRADICTIONS.filter((x) => c[x.id]).sort((a, b) => c[a.id].ts - c[b.id].ts).map((x) => x.id);

// ───────────────────────── Motives ─────────────────────────

export const SUSPECTS = ['ransom', 'linda', 'walt', 'joni', 'richard', 'meg', 'marta'];

function Chip({ on, children, onClick, testId }: { on: boolean; children: ReactNode; onClick: () => void; testId?: string }) {
  return (
    <button
      data-testid={testId}
      onClick={() => (audio.play('pencil'), onClick())}
      className={`mb-1 mr-1 border px-1.5 py-0.5 font-ui text-[10.5px] leading-tight transition ${on ? 'border-burgundy bg-burgundy/10 text-burgundy' : 'border-ink/25 text-ink/60 hover:border-ink/50'}`}
    >
      {children}
    </button>
  );
}

export function MotivePage({ who, first }: { who: string; first: boolean }) {
  const rec = useGame((s) => s.motives[who]) ?? EMPTY_MOTIVE;
  const leads = useGame((s) => s.motiveLeads).filter((l) => l.startsWith(`${who}:`));
  const evidence = useGame((s) => s.evidence);
  const met = useGame((s) => s.met);
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const evList = EVIDENCE.filter((e) => evidence[e.id]);
  return (
    <div data-testid={`motive-${who}`}>
      {first && <PageTitle sub="Reasons are not proof">Motives</PageTitle>}
      <div className="font-title text-lg text-ink">{NPC_BY_ID[who].name}</div>
      <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.25em] text-ink/50">Possible motives found</div>
      {leads.length ? (
        <div className="mt-1">
          {leads.map((l) => {
            const cat = l.split(':')[1] as MotiveCategory;
            const lead = MOTIVE_LEADS.find((m) => m.id === l);
            return (
              <div key={l} className="flex items-start gap-2">
                <Chip on={rec.category === cat} onClick={() => updateMotive(who, { category: rec.category === cat ? null : cat })} testId={`motive-cat-${who}-${cat}`}>
                  {MOTIVE_LABEL[cat]}
                </Chip>
                <span className="hand text-[1.05rem] leading-tight text-[#1d2a4a]">{lead?.text}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="hand text-lg text-ink/35">No motive found yet.</p>
      )}
      <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.25em] text-ink/50">Supports it</div>
      <div>
        {evList.length ? evList.map((e) => (
          <Chip key={e.id} on={rec.supporting.includes(e.id)} onClick={() => updateMotive(who, { supporting: toggle(rec.supporting, e.id), contradicting: rec.contradicting.filter((x) => x !== e.id) })}>
            {e.id}
          </Chip>
        )) : <span className="font-ui text-[11px] text-ink/40">No evidence yet.</span>}
      </div>
      <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.25em] text-ink/50">Argues against it</div>
      <div>
        {evList.map((e) => (
          <Chip key={e.id} on={rec.contradicting.includes(e.id)} onClick={() => updateMotive(who, { contradicting: toggle(rec.contradicting, e.id), supporting: rec.supporting.filter((x) => x !== e.id) })}>
            {e.id}
          </Chip>
        ))}
      </div>
      <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.25em] text-ink/50">Related people</div>
      <div>
        {SUSPECTS.filter((x) => x !== who && met.includes(x)).map((x) => (
          <Chip key={x} on={rec.related.includes(x)} onClick={() => updateMotive(who, { related: toggle(rec.related, x) })}>
            {nameOf(x)}
          </Chip>
        ))}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-ink/50">Confidence</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} data-testid={`confidence-${who}-${n}`} onClick={() => updateMotive(who, { confidence: rec.confidence === n ? 0 : n })} className={`hand text-2xl leading-none ${n <= rec.confidence ? 'text-burgundy' : 'text-ink/20'}`}>
            ✕
          </button>
        ))}
      </div>
      <textarea
        data-testid={`questions-${who}`}
        value={rec.questions}
        onChange={(e) => updateMotive(who, { questions: e.target.value })}
        placeholder="Unresolved questions…"
        className="hand mt-1 h-16 w-full resize-none border-b border-ink/25 bg-transparent text-[1.2rem] leading-tight text-[#1d2a4a] outline-none placeholder:text-ink/30"
      />
    </div>
  );
}

// ───────────────────────── Assumptions & whereabouts ─────────────────────────

export function AssumptionInput() {
  const [text, setText] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        addAssumption(text);
        setText('');
      }}
      className="mb-4 flex items-end gap-2"
    >
      <input
        data-testid="assumption-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.stopPropagation()}
        placeholder="A thought of my own…"
        className="hand min-w-0 flex-1 border-b border-ink/30 bg-transparent text-[1.25rem] text-[#5a5550] outline-none placeholder:text-ink/30"
      />
      <button className="font-ui text-[10px] uppercase tracking-[0.2em] text-burgundy">Pencil it in</button>
    </form>
  );
}

export function whereabouts(id: string): string | null {
  const rt = npcRt[id];
  return rt ? placeName(rt.room) : null;
}

export const NoteLegend = () => (
  <div className="mb-3 flex flex-wrap gap-x-3 font-mono text-[8.5px] uppercase tracking-[0.18em] text-ink/50">
    <span className="text-[#24304a]">ink — observed</span>
    <span className="text-[#1d2a4a]">blue — told to me</span>
    <span className="text-blood">red — contradiction / evidence</span>
    <span className="text-[#6a6560]">pencil — my assumption</span>
  </div>
);

export { AnimatePresence };
