/**
 * The framed family tree, taken out of its frame: a parchment document on
 * which the printed family lines are joined, as the investigation goes on, by
 * the investigator's own coloured-pencil lines — conflicts, money, secrets.
 * Click a line to annotate it or mark it important; click a name to keep
 * notes on that person. Undiscovered connections between people you've met
 * appear as faint pencilled question marks.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../state/store';
import { RELATIONSHIPS, REL_BY_ID, REL_LABEL, TREE_NODES, type RelKind } from '../data/relations';
import { setPersonNote, setRelNote, toggleRelMark, nameOf } from '../state/story';
import { portraitDataUrl } from '../notebook/portraitImage';
import { CHARACTER_BY_ID } from '../data/case';

export const REL_COLOR: Record<RelKind, string> = {
  family: '#2a1d16',
  marriage: '#2a1d16',
  conflict: '#982b39',
  financial: '#4f6b3a',
  affection: '#b07a2a',
  secret: '#5a3a7a',
  professional: '#2a4468',
};

const DASH: Partial<Record<RelKind, string>> = { conflict: '1.6 0.8', financial: '0.6 0.6', secret: '0.4 0.9', professional: '2 0.6' };

export function FamilyTree() {
  const overlay = useGame((s) => s.overlay);
  const rels = useGame((s) => s.relationships);
  const notes = useGame((s) => s.relNotes);
  const marked = useGame((s) => s.relMarked);
  const met = useGame((s) => s.met);
  const characters = useGame((s) => s.characters);
  const personNotes = useGame((s) => s.personNotes);
  const [sel, setSel] = useState<{ kind: 'rel' | 'person'; id: string } | null>(null);
  if (overlay !== 'relations') return null;
  const known = RELATIONSHIPS.filter((r) => rels.includes(r.id));
  const knownPairs = new Set(known.map((r) => [r.a, r.b].sort().join('|')));
  const hidden = RELATIONSHIPS.filter(
    (r) => !rels.includes(r.id) && !r.onTree && (met.includes(r.a) || r.a === 'harlan') && (met.includes(r.b) || r.b === 'harlan') && !knownPairs.has([r.a, r.b].sort().join('|')),
  );
  // offset parallel lines between the same pair
  const pairCount = new Map<string, number>();
  const offsetOf = (a: string, b: string) => {
    const k = [a, b].sort().join('|');
    const n = pairCount.get(k) ?? 0;
    pairCount.set(k, n + 1);
    return n;
  };
  const selRel = sel?.kind === 'rel' ? REL_BY_ID[sel.id] : null;

  return (
    <motion.div
      className="fixed inset-0 z-20 flex items-center justify-center bg-shadow/60 p-2 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && useGame.getState().closeOverlay()}
      data-testid="family-tree"
    >
      <motion.div initial={{ y: 40, rotate: -1.5, opacity: 0 }} animate={{ y: 0, rotate: 0, opacity: 1 }} className="paper relative flex max-h-[92vh] w-full max-w-[1100px] flex-col overflow-hidden rounded-[2px] shadow-[0_30px_90px_rgba(0,0,0,0.85)] lg:flex-row">
        <div className="relative min-h-0 flex-1 p-4 sm:p-6">
          <div className="text-center font-title text-xs uppercase tracking-[0.5em] text-burgundy">The Thrombey Family</div>
          <div className="text-center font-hand text-xl text-ink/60">drawn up for Harlan’s 85th — with the associate’s annotations</div>
          <svg viewBox="0 0 100 100" className="mt-2 h-[min(58vh,560px)] w-full" preserveAspectRatio="xMidYMid meet">
            {known.map((r) => {
              const A = TREE_NODES[r.a];
              const B = TREE_NODES[r.b];
              if (!A || !B) return null;
              const off = offsetOf(r.a, r.b) * 1.6;
              const dx = B.x - A.x;
              const dy = B.y - A.y;
              const len = Math.hypot(dx, dy) || 1;
              const nx = (-dy / len) * off;
              const ny = (dx / len) * off;
              const printed = r.onTree;
              const isSel = selRel?.id === r.id;
              const imp = marked.includes(r.id);
              return (
                <g key={r.id} onClick={() => !printed && setSel({ kind: 'rel', id: r.id })} className={printed ? '' : 'cursor-pointer'} data-testid={`rel-${r.id}`}>
                  <line x1={A.x + nx} y1={A.y + ny} x2={B.x + nx} y2={B.y + ny} stroke="transparent" strokeWidth={3} />
                  <line
                    x1={A.x + nx}
                    y1={A.y + ny}
                    x2={B.x + nx}
                    y2={B.y + ny}
                    stroke={REL_COLOR[r.kind]}
                    strokeWidth={printed ? 0.35 : imp || isSel ? 0.9 : 0.55}
                    strokeDasharray={printed ? (r.kind === 'marriage' ? '0.3 0.4' : undefined) : DASH[r.kind]}
                    strokeLinecap="round"
                    opacity={printed ? 0.7 : 0.9}
                  />
                  {imp && (
                    <text x={(A.x + B.x) / 2 + nx} y={(A.y + B.y) / 2 + ny} fontSize={3} fill="#982b39" textAnchor="middle" fontFamily="Caveat, cursive">
                      !
                    </text>
                  )}
                </g>
              );
            })}
            {hidden.map((r) => {
              const A = TREE_NODES[r.a];
              const B = TREE_NODES[r.b];
              if (!A || !B) return null;
              return (
                <g key={r.id} opacity={0.35}>
                  <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="#6a5a4a" strokeWidth={0.25} strokeDasharray="0.4 0.8" />
                  <text x={(A.x + B.x) / 2} y={(A.y + B.y) / 2} fontSize={2.6} fill="#6a5a4a" textAnchor="middle" fontFamily="Caveat, cursive">
                    ?
                  </text>
                </g>
              );
            })}
            {Object.entries(TREE_NODES).map(([id, n]) => {
              const studied = characters.includes(id);
              const img = studied && CHARACTER_BY_ID[id] ? portraitDataUrl(id) : null;
              return (
                <g key={id} onClick={() => setSel({ kind: 'person', id })} className="cursor-pointer" data-testid={`node-${id}`}>
                  <rect x={n.x - 5.5} y={n.y - 5} width={11} height={10} fill="#efe4cc" stroke={sel?.id === id ? '#982b39' : '#3a2a1a'} strokeWidth={0.3} />
                  {img ? <image href={img} x={n.x - 3} y={n.y - 4.4} width={6} height={6} preserveAspectRatio="xMidYMid slice" /> : <rect x={n.x - 3} y={n.y - 4.4} width={6} height={6} fill="#d9cbaf" />}
                  <text x={n.x} y={n.y + 3.8} fontSize={1.9} textAnchor="middle" fill="#2a1d16" fontFamily="Playfair Display, serif">
                    {n.name}
                    {n.note ? ` (${n.note})` : ''}
                  </text>
                  {personNotes[id] && (
                    <text x={n.x + 5} y={n.y - 4} fontSize={2.4} fill="#1d2a4a" fontFamily="Caveat, cursive">
                      ✎
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          <div className="flex flex-wrap justify-center gap-3 font-mono text-[9px] uppercase tracking-[0.2em] text-ink/70">
            {(Object.keys(REL_LABEL) as RelKind[]).map((k) => (
              <span key={k} className="flex items-center gap-1">
                <span className="inline-block h-0.5 w-4" style={{ background: REL_COLOR[k] }} />
                {REL_LABEL[k]}
              </span>
            ))}
            <span className="flex items-center gap-1">? unknown connection</span>
          </div>
        </div>

        <aside className="w-full shrink-0 border-t border-ink/15 bg-[#e9dcc0]/60 p-4 sm:p-5 lg:w-80 lg:border-l lg:border-t-0">
          {selRel ? (
            <>
              <div className="font-mono text-[9px] uppercase tracking-[0.3em]" style={{ color: REL_COLOR[selRel.kind] }}>
                {REL_LABEL[selRel.kind]}
              </div>
              <div className="font-title text-lg text-ink">
                {nameOf(selRel.a)} &amp; {nameOf(selRel.b)}
              </div>
              <p className="mt-1 font-display text-[15px] text-ink/85">{selRel.label}</p>
              <button
                data-testid="mark-rel"
                onClick={() => toggleRelMark(selRel.id)}
                className={`mt-3 border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] ${marked.includes(selRel.id) ? 'border-blood bg-blood text-ivory' : 'border-ink/40 text-ink'}`}
              >
                {marked.includes(selRel.id) ? '✓ Marked as important' : 'Mark as important'}
              </button>
              <label className="mt-4 block font-mono text-[9px] uppercase tracking-[0.3em] text-ink/60">Annotation</label>
              <textarea
                data-testid="rel-note"
                value={notes[selRel.id] ?? ''}
                onChange={(e) => setRelNote(selRel.id, e.target.value)}
                placeholder="Write in the margin…"
                className="hand mt-1 h-28 w-full resize-none border-b border-ink/30 bg-transparent text-xl leading-tight text-[#1d2a4a] outline-none placeholder:text-ink/30"
              />
            </>
          ) : sel?.kind === 'person' ? (
            <>
              <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-ink/60">Person</div>
              <div className="font-title text-lg text-ink">{CHARACTER_BY_ID[sel.id]?.name ?? TREE_NODES[sel.id].name}</div>
              <p className="mt-1 font-display text-[14px] text-ink/75">{CHARACTER_BY_ID[sel.id]?.role ?? (sel.id === 'neil' ? 'Harlan’s son, Joni’s late husband.' : '')}</p>
              <div className="mt-3 space-y-1">
                {known
                  .filter((r) => (r.a === sel.id || r.b === sel.id) && !r.onTree)
                  .map((r) => (
                    <button key={r.id} onClick={() => setSel({ kind: 'rel', id: r.id })} className="block text-left font-display text-[14px] text-ink hover:text-burgundy">
                      <span style={{ color: REL_COLOR[r.kind] }}>●</span> {r.label}
                    </button>
                  ))}
              </div>
              <label className="mt-4 block font-mono text-[9px] uppercase tracking-[0.3em] text-ink/60">My notes</label>
              <textarea
                data-testid="person-note"
                value={personNotes[sel.id] ?? ''}
                onChange={(e) => setPersonNote(sel.id, e.target.value)}
                placeholder="Impressions, doubts…"
                className="hand mt-1 h-28 w-full resize-none border-b border-ink/30 bg-transparent text-xl leading-tight text-[#1d2a4a] outline-none placeholder:text-ink/30"
              />
            </>
          ) : (
            <p className="hand text-2xl leading-tight text-ink/60">Click a coloured line to annotate a connection, or a name to keep notes on that person. New lines appear as you learn more.</p>
          )}
          <button data-testid="close-tree" onClick={() => useGame.getState().closeOverlay()} className="mt-6 block font-mono text-[10px] uppercase tracking-[0.3em] text-ink/70 hover:text-burgundy">
            Put it back · Esc
          </button>
        </aside>
      </motion.div>
    </motion.div>
  );
}
