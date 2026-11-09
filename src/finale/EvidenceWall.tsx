/**
 * The investigation board: a physical corkboard. Everything on it is placed
 * by the player — nothing is auto-arranged and no connection is suggested.
 */
import { useMemo, useRef, useState, type PointerEvent as RPE } from 'react';
import { motion } from 'framer-motion';
import { useGame, type CardKind, type LinkType, type WallCard } from '../state/store';
import { commitMove, editNote, linkCards, moveCard, pinCard, testChallenge, unlink, unpinCard, solvedFlags } from '../state/finale';
import { EVIDENCE, EVIDENCE_BY_ID, CATEGORY_LABEL } from '../data/evidence';
import { STATEMENT_BY_ID, CONTRADICTION_BY_ID } from '../data/testimony';
import { CHARACTERS, CHARACTER_BY_ID } from '../data/case';
import { CHALLENGES, TL_BY_ID } from '../data/mystery';
import { discoveredEvents } from '../systems/deduction';
import { snapshot, nameOf } from '../state/story';
import { portraitDataUrl } from '../notebook/portraitImage';
import { audio } from '../audio/audio';

export const LINK_STYLE: Record<LinkType, { label: string; color: string; dash?: string }> = {
  supports: { label: 'Supports', color: '#4f6b3a' },
  contradicts: { label: 'Contradicts', color: '#a01828' },
  motive: { label: 'Establishes motive', color: '#632331', dash: '10 4' },
  opportunity: { label: 'Establishes opportunity', color: '#2a4468' },
  location: { label: 'Establishes location', color: '#66684d', dash: '4 4' },
  alibi: { label: 'Disproves alibi', color: '#141414', dash: '14 5 3 5' },
  investigate: { label: 'Needs investigation', color: '#7a6a5a', dash: '2 6' },
};

const BOARD_W = 1600;
const BOARD_H = 1000;

function CardFace({ c }: { c: WallCard }) {
  switch (c.kind) {
    case 'evidence': {
      const e = EVIDENCE_BY_ID[c.ref];
      return (
        <div className="w-[150px] bg-[#f4efe4] p-1.5 pb-2 shadow-[0_6px_14px_rgba(0,0,0,0.45)]">
          <div className="flex h-[62px] items-center justify-center bg-[radial-gradient(ellipse_at_center,#5a4632,#1a120c)] font-mono text-[10px] uppercase tracking-widest text-ivory/70">{e.id}</div>
          <div className="mt-1 font-title text-[12px] leading-tight text-ink">{e.name}</div>
          <div className="font-mono text-[8px] uppercase tracking-wider text-blood">{CATEGORY_LABEL[e.category]}</div>
        </div>
      );
    }
    case 'statement': {
      const st = STATEMENT_BY_ID[c.ref];
      return (
        <div className="paper paper-ruled w-[170px] px-2.5 py-2 shadow-[0_6px_14px_rgba(0,0,0,0.45)]">
          <div className="font-mono text-[8px] uppercase tracking-wider text-ink/55">{nameOf(st.by)} said</div>
          <div className="hand text-[1.02rem] leading-[1.02] text-[#1d2a4a]">“{st.summary}”</div>
        </div>
      );
    }
    case 'person': {
      const ch = CHARACTER_BY_ID[c.ref];
      return (
        <div className="w-[96px] bg-[#f4efe4] p-1.5 pb-1 shadow-[0_6px_14px_rgba(0,0,0,0.45)]">
          <img src={portraitDataUrl(c.ref)} alt="" className="h-[96px] w-full object-cover sepia-[0.3]" draggable={false} />
          <div className="hand text-center text-[1.05rem] leading-none text-ink">{ch?.name.split(' ')[0]}</div>
        </div>
      );
    }
    case 'contradiction': {
      const k = CONTRADICTION_BY_ID[c.ref];
      return (
        <div className="paper w-[160px] border-2 border-blood px-2 py-1.5 shadow-[0_6px_14px_rgba(0,0,0,0.45)]">
          <div className="font-mono text-[8px] uppercase tracking-wider text-blood">✕ Contradiction</div>
          <div className="font-title text-[12px] leading-tight text-ink">{k.title}</div>
        </div>
      );
    }
    case 'event': {
      const e = TL_BY_ID[c.ref];
      return (
        <div className="w-[160px] bg-[#e9dcc0] px-2 py-1.5 shadow-[0_6px_14px_rgba(0,0,0,0.45)]">
          <div className="font-mono text-[9px] text-burgundy">{e.time ?? '??:??'}</div>
          <div className="font-display text-[13px] leading-tight text-ink">{e.label}</div>
        </div>
      );
    }
    case 'note':
      return null;
  }
}

function NoteCard({ c }: { c: WallCard }) {
  return (
    <div className="w-[150px] bg-[#e8d98a] px-2 py-2 shadow-[0_6px_14px_rgba(0,0,0,0.45)]">
      <textarea
        data-testid="wall-note-text"
        value={c.text ?? ''}
        onChange={(e) => editNote(c.id, e.target.value)}
        onPointerDown={(e) => e.stopPropagation()}
        placeholder="Write…"
        className="hand h-[64px] w-full resize-none bg-transparent text-[1.1rem] leading-[1.05] text-[#1d2a4a] outline-none placeholder:text-ink/35"
      />
    </div>
  );
}

const CARD_W: Record<CardKind, number> = { evidence: 150, statement: 170, person: 96, contradiction: 160, event: 160, note: 150 };

type TrayTab = 'evidence' | 'statement' | 'person' | 'contradiction' | 'event';

export function EvidenceWall() {
  const overlay = useGame((s) => s.overlay);
  const wall = useGame((s) => s.wall);
  const evidence = useGame((s) => s.evidence);
  const statements = useGame((s) => s.statements);
  const contradictions = useGame((s) => s.contradictions);
  const characters = useGame((s) => s.characters);
  useGame((s) => s.flags);
  const [view, setView] = useState({ x: 0, y: 0, z: 0.7 });
  const [mode, setMode] = useState<'move' | 'string'>('move');
  const [from, setFrom] = useState<string | null>(null);
  const [pending, setPending] = useState<{ a: string; b: string } | null>(null);
  const [selLink, setSelLink] = useState<string | null>(null);
  const [tab, setTab] = useState<TrayTab>('evidence');
  const [test, setTest] = useState<Record<string, boolean | null>>({});
  const drag = useRef<{ id?: string; ox: number; oy: number; sx: number; sy: number; vx: number; vy: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const tray = useMemo(() => {
    const pinned = new Set(wall.cards.map((c) => `${c.kind}:${c.ref}`));
    const snap = snapshot();
    const items: Record<TrayTab, { ref: string; label: string }[]> = {
      evidence: EVIDENCE.filter((e) => evidence[e.id]).map((e) => ({ ref: e.id, label: `${e.id} · ${e.name}` })),
      statement: Object.keys(statements).map((id) => ({ ref: id, label: `${nameOf(STATEMENT_BY_ID[id].by)}: ${STATEMENT_BY_ID[id].summary}` })),
      person: CHARACTERS.filter((c) => characters.includes(c.id)).map((c) => ({ ref: c.id, label: c.name })),
      contradiction: Object.keys(contradictions).map((id) => ({ ref: id, label: CONTRADICTION_BY_ID[id].title })),
      event: discoveredEvents(snap).map((e) => ({ ref: e.id, label: `${e.time ?? '??'} — ${e.label}` })),
    };
    for (const k of Object.keys(items) as TrayTab[]) items[k] = items[k].filter((i) => !pinned.has(`${k}:${i.ref}`));
    return items;
  }, [wall.cards, evidence, statements, contradictions, characters]);

  if (overlay !== 'wall') return null;

  const toBoard = (clientX: number, clientY: number) => {
    const r = boardRef.current!.getBoundingClientRect();
    return { x: (clientX - r.left - view.x) / view.z, y: (clientY - r.top - view.y) / view.z };
  };
  /** The nearest free patch of cork to the middle of the view, so new pins never bury old ones. */
  const center = () => {
    const r = boardRef.current!.getBoundingClientRect();
    const p = toBoard(r.left + r.width / 2, r.top + r.height / 2);
    const free = (x: number, y: number) => wall.cards.every((c) => Math.abs(c.x - x) > 185 || Math.abs(c.y - y) > 150);
    const clampX = (x: number) => Math.max(10, Math.min(BOARD_W - 190, x));
    const clampY = (y: number) => Math.max(10, Math.min(BOARD_H - 150, y));
    for (let ring = 0; ring < 8; ring++)
      for (let dx = -ring; dx <= ring; dx++)
        for (let dy = -ring; dy <= ring; dy++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
          const x = clampX(p.x - 90 + dx * 190);
          const y = clampY(p.y - 60 + dy * 155);
          if (free(x, y)) return { x, y };
        }
    return { x: clampX(p.x - 90 + (Math.random() - 0.5) * 200), y: clampY(p.y - 60 + (Math.random() - 0.5) * 160) };
  };
  const byId = Object.fromEntries(wall.cards.map((c) => [c.id, c]));
  const anchor = (c: WallCard) => ({ x: c.x + CARD_W[c.kind] / 2, y: c.y + 8 });

  const onCardDown = (e: RPE, c: WallCard) => {
    e.stopPropagation();
    if (mode === 'string') {
      if (!from) setFrom(c.id);
      else if (from !== c.id) {
        setPending({ a: from, b: c.id });
        setFrom(null);
      }
      return;
    }
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    const p = toBoard(e.clientX, e.clientY);
    drag.current = { id: c.id, ox: p.x - c.x, oy: p.y - c.y, sx: 0, sy: 0, vx: 0, vy: 0 };
  };
  const onBoardDown = (e: RPE) => {
    setSelLink(null);
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    drag.current = { ox: 0, oy: 0, sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y };
  };
  const onMove = (e: RPE) => {
    const d = drag.current;
    if (!d) return;
    if (d.id) {
      const p = toBoard(e.clientX, e.clientY);
      moveCard(d.id, Math.max(-40, Math.min(BOARD_W - 60, p.x - d.ox)), Math.max(-20, Math.min(BOARD_H - 40, p.y - d.oy)));
    } else setView((v) => ({ ...v, x: d.vx + e.clientX - d.sx, y: d.vy + e.clientY - d.sy }));
  };
  const onUp = () => {
    if (drag.current?.id) commitMove();
    drag.current = null;
  };
  const zoom = (f: number) => setView((v) => ({ ...v, z: Math.max(0.35, Math.min(1.8, v.z * f)) }));
  const solved = solvedFlags();

  return (
    <motion.div className="fixed inset-0 z-20 flex flex-col bg-[#120c09]" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} data-testid="evidence-wall">
      {/* top strip: tools on the easel's ledge */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3a2a1a] bg-[#2a1d14] px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="font-title text-lg text-ivory">The board</span>
          <button
            data-testid="mode-move"
            onClick={() => (setMode('move'), setFrom(null))}
            className={`border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em] ${mode === 'move' ? 'border-gold bg-gold/20 text-ivory' : 'border-ivory/25 text-ivory/60'}`}
          >
            ✥ Arrange
          </button>
          <button
            data-testid="mode-string"
            onClick={() => (setMode('string'), setFrom(null))}
            className={`border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em] ${mode === 'string' ? 'border-blood bg-blood/30 text-ivory' : 'border-ivory/25 text-ivory/60'}`}
          >
            ⟿ Red string
          </button>
          <button
            data-testid="add-note"
            onClick={() => {
              const p = center();
              pinCard('note', `n${Date.now()}`, p.x, p.y, '');
            }}
            className="border border-ivory/25 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ivory/70 hover:text-ivory"
          >
            ✎ Note
          </button>
          <span className="hidden font-mono text-[10px] text-ivory/40 sm:inline">{mode === 'string' ? (from ? 'Now choose the card to tie it to…' : 'Choose the first card…') : 'Drag cards · drag the cork to pan'}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => zoom(1.2)} className="h-7 w-7 border border-ivory/25 text-ivory/80" aria-label="Zoom in">
            +
          </button>
          <button onClick={() => zoom(1 / 1.2)} className="h-7 w-7 border border-ivory/25 text-ivory/80" aria-label="Zoom out">
            −
          </button>
          <button data-testid="open-timeline" onClick={() => (audio.play('paper'), useGame.setState({ overlay: 'timeline' }))} className="border border-gold/50 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-gold hover:bg-gold/10">
            The timeline cord
          </button>
          <button data-testid="close-wall" onClick={() => useGame.getState().closeOverlay()} className="px-2 font-mono text-[10px] uppercase tracking-[0.25em] text-ivory/60 hover:text-ivory">
            Step back · Esc
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1">
        {/* the cork */}
        <div
          ref={boardRef}
          className="relative min-h-0 flex-1 cursor-grab touch-none overflow-hidden active:cursor-grabbing"
          onPointerDown={onBoardDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onWheel={(e) => zoom(e.deltaY < 0 ? 1.08 : 1 / 1.08)}
          data-testid="board"
        >
          <div
            className="absolute left-0 top-0 origin-top-left"
            style={{
              width: BOARD_W,
              height: BOARD_H,
              transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})`,
              background:
                "radial-gradient(ellipse at 30% 30%, rgba(255,230,190,0.12), transparent 60%), url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/><feColorMatrix values='0 0 0 0 0.45  0 0 0 0 0.32  0 0 0 0 0.18  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' fill='%23a07e50'/><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
              boxShadow: 'inset 0 0 0 14px #3a2416, inset 0 0 60px rgba(0,0,0,0.5)',
            }}
          >
            <svg className="pointer-events-none absolute inset-0" width={BOARD_W} height={BOARD_H}>
              {wall.links.map((l) => {
                const a = byId[l.a];
                const b = byId[l.b];
                if (!a || !b) return null;
                const p = anchor(a);
                const q = anchor(b);
                const st = LINK_STYLE[l.type];
                const mx = (p.x + q.x) / 2;
                const my = (p.y + q.y) / 2 + 18;
                return (
                  <g key={l.id} data-testid={`link-${l.type}`}>
                    <path d={`M${p.x},${p.y} Q${mx},${my + 20} ${q.x},${q.y}`} fill="none" stroke={st.color} strokeWidth={selLink === l.id ? 5 : 3} strokeDasharray={st.dash} strokeLinecap="round" opacity={0.9} />
                  </g>
                );
              })}
            </svg>
            {wall.links.map((l) => {
              const a = byId[l.a];
              const b = byId[l.b];
              if (!a || !b) return null;
              const p = anchor(a);
              const q = anchor(b);
              return (
                <button
                  key={l.id}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => setSelLink(selLink === l.id ? null : l.id)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 border bg-[#f4efe4] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider shadow"
                  style={{ left: (p.x + q.x) / 2, top: (p.y + q.y) / 2 + 28, color: LINK_STYLE[l.type].color, borderColor: LINK_STYLE[l.type].color }}
                  data-testid={`link-tag-${l.id}`}
                >
                  {LINK_STYLE[l.type].label}
                </button>
              );
            })}
            {wall.cards.map((c) => (
              <div
                key={c.id}
                data-testid={`card-${c.kind}-${c.ref}`}
                onPointerDown={(e) => onCardDown(e, c)}
                onPointerMove={onMove}
                onPointerUp={onUp}
                className={`group absolute select-none ${mode === 'string' ? 'cursor-crosshair' : 'cursor-move'} ${from === c.id ? 'ring-4 ring-blood' : ''}`}
                style={{ left: c.x, top: c.y, transform: `rotate(${c.rot}deg)` }}
              >
                <span className="absolute -top-1.5 left-1/2 z-10 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-blood shadow-[0_2px_3px_rgba(0,0,0,0.6)]" />
                {c.kind === 'note' ? <NoteCard c={c} /> : <CardFace c={c} />}
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => unpinCard(c.id)}
                  className="absolute -right-2 -top-2 hidden h-5 w-5 rounded-full bg-shadow text-[11px] text-ivory group-hover:block"
                  aria-label="Unpin"
                  data-testid="unpin"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {pending && (
            <div className="absolute left-1/2 top-6 z-20 w-[min(92vw,360px)] -translate-x-1/2 bg-[#f4efe4] p-3 shadow-2xl" data-testid="link-type-picker">
              <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.25em] text-ink/60">How does this connect?</div>
              {(Object.keys(LINK_STYLE) as LinkType[]).map((t) => (
                <button
                  key={t}
                  data-testid={`link-type-${t}`}
                  onClick={() => {
                    linkCards(pending.a, pending.b, t);
                    setPending(null);
                  }}
                  className="flex w-full items-center gap-2 py-1 text-left font-display text-[15px] text-ink hover:text-burgundy"
                >
                  <span className="inline-block h-0.5 w-6" style={{ background: LINK_STYLE[t].color }} />
                  {LINK_STYLE[t].label}
                </button>
              ))}
              <button onClick={() => setPending(null)} className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink/50">
                Cancel
              </button>
            </div>
          )}
          {selLink && (
            <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 flex-wrap items-center gap-1 bg-[#f4efe4] p-2 shadow-2xl">
              {(Object.keys(LINK_STYLE) as LinkType[]).map((t) => {
                const l = wall.links.find((x) => x.id === selLink)!;
                return (
                  <button key={t} onClick={() => linkCards(l.a, l.b, t)} className="border px-1.5 py-0.5 font-mono text-[9px] uppercase" style={{ color: LINK_STYLE[t].color, borderColor: LINK_STYLE[t].color }}>
                    {LINK_STYLE[t].label}
                  </button>
                );
              })}
              <button onClick={() => (unlink(selLink), setSelLink(null))} className="ml-2 font-mono text-[10px] uppercase text-blood">
                Cut the string
              </button>
            </div>
          )}
        </div>

        {/* case questions, pinned down the side */}
        <aside className="hidden w-64 shrink-0 space-y-3 overflow-y-auto border-l border-[#3a2a1a] bg-[#1d1510] p-3 scroll-quiet lg:block">
          <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-gold/70">Case questions</div>
          {CHALLENGES.map((ch) => (
            <div key={ch.id} className="paper relative px-3 py-2 shadow-md" data-testid={`challenge-${ch.id}`}>
              <div className="font-title text-[14px] text-ink">{ch.title}</div>
              <p className="font-display text-[13px] leading-snug text-ink/75">{ch.brief}</p>
              {solved.includes(ch.id) ? (
                <div className="mt-1 inline-block rotate-[-4deg] border-2 border-burgundy px-1.5 font-mono text-[9px] uppercase tracking-widest text-burgundy" data-testid="solved">
                  Solved
                </div>
              ) : (
                <button
                  data-testid={`test-${ch.id}`}
                  onClick={() => setTest({ ...test, [ch.id]: testChallenge(ch.id) })}
                  className="mt-1 font-ui text-[10px] uppercase tracking-[0.2em] text-burgundy hover:underline"
                >
                  Test my reasoning
                </button>
              )}
              {test[ch.id] === false && !solved.includes(ch.id) && <p className="hand mt-0.5 text-lg leading-tight text-ink/55">Not yet. Something here doesn’t hold.</p>}
            </div>
          ))}
        </aside>
      </div>

      {/* the drawer of things to pin */}
      <div className="border-t border-[#3a2a1a] bg-[#2a1d14] px-3 pb-3 pt-2">
        <div className="mb-1.5 flex flex-wrap gap-1">
          {(['evidence', 'statement', 'person', 'contradiction', 'event'] as TrayTab[]).map((t) => (
            <button
              key={t}
              data-testid={`tray-${t}`}
              onClick={() => setTab(t)}
              className={`px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] ${tab === t ? 'bg-ivory/15 text-ivory' : 'text-ivory/50 hover:text-ivory'}`}
            >
              {{ evidence: 'Evidence', statement: 'Testimony', person: 'People', contradiction: 'Contradictions', event: 'Events' }[t]} ({tray[t].length})
            </button>
          ))}
        </div>
        <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto scroll-quiet">
          {tray[tab].length ? (
            tray[tab].map((i) => (
              <button
                key={i.ref}
                data-testid={`pin-${tab}-${i.ref}`}
                onClick={() => {
                  const p = center();
                  pinCard(tab, i.ref, p.x, p.y);
                }}
                className="paper max-w-[260px] truncate px-2 py-1 text-left font-display text-[13px] text-ink shadow hover:-translate-y-0.5"
              >
                📌 {i.label}
              </button>
            ))
          ) : (
            <span className="hand text-xl text-ivory/40">Nothing left in this drawer.</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
