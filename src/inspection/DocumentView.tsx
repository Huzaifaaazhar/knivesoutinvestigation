import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { DocumentDef, Hotspot } from '../data/interactables';

interface Props {
  doc: DocumentDef;
  hotspots: Hotspot[];
  seen: string[];
  onDetail: (id: string) => void;
  loupe: boolean;
}

/** Inline markup: [[id|text]] hotspots, ~~struck~~ text. */
function renderInline(text: string, hs: Props): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\[\[([^|\]]+)\|([^\]]+)\]\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(...strike(text.slice(last, m.index), i++));
    const id = m[1];
    const seen = hs.seen.includes(id);
    out.push(
      <span
        key={`h${i++}`}
        role="button"
        tabIndex={0}
        data-hotspot={id}
        onClick={() => hs.onDetail(id)}
        onKeyDown={(e) => e.key === 'Enter' && hs.onDetail(id)}
        className={`cursor-zoom-in rounded-[2px] decoration-dotted underline-offset-4 transition ${
          seen ? 'bg-gold/25 underline decoration-burgundy/60' : 'underline decoration-ink/25 hover:bg-gold/20'
        }`}
      >
        {strike(m[2], i++)}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(...strike(text.slice(last), i++));
  return out;
}

function strike(t: string, k: number): ReactNode[] {
  const parts = t.split(/~~/);
  return parts.map((p, j) => (j % 2 ? <span key={`${k}s${j}`} className="ink-strike">{p}</span> : <span key={`${k}t${j}`}>{p}</span>));
}

function Mark({ m, seen, onClick }: { m: NonNullable<DocumentDef['marks']>[number]; seen: boolean; onClick: () => void }) {
  const style: React.CSSProperties = { left: `${m.x}%`, top: `${m.y}%`, width: `${m.w}%`, height: `${m.h}%` };
  const look =
    m.kind === 'stain'
      ? 'rounded-full border-[3px] border-[rgba(110,60,25,0.35)] bg-[radial-gradient(circle,rgba(120,70,30,0.08),rgba(120,70,30,0.18))]'
      : m.kind === 'tear'
        ? 'bg-shadow/90 [clip-path:polygon(0_100%,0_10%,30%_30%,45%_60%,80%_75%,100%_100%)]'
        : m.kind === 'fold'
          ? 'bg-gradient-to-b from-transparent via-ink/15 to-transparent'
          : 'rounded-sm bg-ink/10 blur-[1px]';
  return (
    <button
      aria-label="Examine mark"
      data-hotspot={m.id}
      onClick={onClick}
      className={`absolute cursor-zoom-in ${look} ${seen ? 'outline outline-1 outline-burgundy/40' : 'hover:outline hover:outline-1 hover:outline-gold/60'}`}
      style={style}
    />
  );
}

function PolaroidImage({ onDetail, seen }: { onDetail: (id: string) => void; seen: string[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const g = c.getContext('2d')!;
    const W = c.width;
    const H = c.height;
    const bg = g.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#3a2418');
    bg.addColorStop(1, '#120a08');
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);
    // flash falloff
    const fl = g.createRadialGradient(W * 0.45, H * 0.55, 10, W * 0.45, H * 0.55, W * 0.7);
    fl.addColorStop(0, 'rgba(255,220,170,0.35)');
    fl.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = fl;
    g.fillRect(0, 0, W, H);
    // clock on wall
    g.fillStyle = '#d9cbaf';
    g.beginPath();
    g.arc(W * 0.16, H * 0.2, 18, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#111';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(W * 0.16, H * 0.2);
    g.lineTo(W * 0.16 + 10, H * 0.2 + 1);
    g.moveTo(W * 0.16, H * 0.2);
    g.lineTo(W * 0.16 + 1, H * 0.2 - 14);
    g.stroke();
    // table and cake
    g.fillStyle = '#2a1a12';
    g.fillRect(W * 0.08, H * 0.72, W * 0.75, H * 0.3);
    g.fillStyle = '#efe4cc';
    g.fillRect(W * 0.38, H * 0.62, W * 0.14, H * 0.1);
    g.fillStyle = '#ffcf70';
    g.beginPath();
    g.arc(W * 0.45, H * 0.58, 4, 0, Math.PI * 2);
    g.fill();
    // family silhouettes
    const person = (x: number, h: number, col: string, coat = false) => {
      g.fillStyle = col;
      g.beginPath();
      g.arc(x, H * (0.72 - h) - 14, 13, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.moveTo(x - (coat ? 26 : 20), H);
      g.lineTo(x - 16, H * (0.72 - h) + 4);
      g.lineTo(x + 16, H * (0.72 - h) + 4);
      g.lineTo(x + (coat ? 26 : 20), H);
      g.fill();
      g.fillStyle = 'rgba(230,200,160,0.35)';
      g.beginPath();
      g.arc(x - 3, H * (0.72 - h) - 17, 6, 0, Math.PI * 2);
      g.fill();
    };
    person(W * 0.18, 0.2, '#3a2a30');
    person(W * 0.3, 0.26, '#2a3a2a');
    person(W * 0.6, 0.28, '#3a2430');
    person(W * 0.72, 0.22, '#1d2632');
    person(W * 0.9, 0.3, '#1a1612', true);
    // grain
    for (let i = 0; i < 3000; i++) {
      g.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
      g.fillRect(Math.random() * W, Math.random() * H, 1, 1);
    }
  }, []);
  const region = (id: string, x: number, y: number, w: number, h: number) => (
    <button
      aria-label="Examine region"
      data-hotspot={id}
      onClick={() => onDetail(id)}
      className={`absolute cursor-zoom-in ${seen.includes(id) ? 'outline outline-1 outline-gold/70' : 'hover:outline hover:outline-1 hover:outline-gold/50'}`}
      style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` }}
    />
  );
  return (
    <div className="relative">
      <canvas ref={ref} width={420} height={360} className="block w-full" />
      {region('clock', 8, 8, 16, 22)}
      {region('coat', 80, 30, 20, 70)}
    </div>
  );
}

function Paper({ doc, ...p }: Props & { doc: DocumentDef }) {
  const inline = (t: string) => renderInline(t, { doc, ...p });
  const marks = doc.marks?.map((m) => <Mark key={m.id} m={m} seen={p.seen.includes(m.id)} onClick={() => p.onDetail(m.id)} />);
  const sig = doc.signature && (
    <div
      role="button"
      data-hotspot="signature"
      onClick={() => p.onDetail('signature')}
      className={`mt-2 inline-block cursor-zoom-in font-hand text-4xl text-[#1d2a4a] ${p.seen.includes('signature') ? 'bg-gold/20' : ''}`}
    >
      {doc.signature}
    </div>
  );

  if (doc.paper === 'photo') {
    return (
      <div className="relative w-[min(78vw,380px)] bg-[#f4efe4] p-4 pb-6 shadow-[0_30px_80px_rgba(0,0,0,0.8)]" style={{ transform: 'rotate(-1.5deg)' }}>
        <PolaroidImage onDetail={p.onDetail} seen={p.seen} />
        <div className="mt-3 font-hand text-xl leading-tight text-ink/85">{doc.heading}</div>
        <div className="mt-2 space-y-1 font-display text-[15px] text-ink/80">
          {doc.body.map((b, i) => (
            <div key={i}>{inline(b)}</div>
          ))}
        </div>
      </div>
    );
  }
  if (doc.paper === 'card') {
    return (
      <div className="paper relative w-[min(80vw,380px)] rounded-[3px] px-8 py-10 text-center shadow-[0_30px_80px_rgba(0,0,0,0.8)]" style={{ transform: 'rotate(1deg)' }}>
        <div className="mb-4 font-title text-xs uppercase tracking-[0.5em] text-burgundy">{doc.heading}</div>
        <div className="space-y-3 font-hand text-3xl leading-tight text-[#1d2a4a]">
          {doc.body.map((b, i) => (
            <div key={i}>{inline(b)}</div>
          ))}
        </div>
        {marks}
      </div>
    );
  }
  if (doc.paper === 'ledger') {
    const rows = doc.body.map((r) =>
      r
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim()),
    );
    return (
      <div className="paper relative w-[min(92vw,620px)] rounded-[2px] px-6 py-8 shadow-[0_30px_80px_rgba(0,0,0,0.8)] sm:px-10">
        <div className="mb-5 border-b-2 border-ink/50 pb-2 font-mono text-xs uppercase tracking-[0.3em]">{doc.heading}</div>
        <table className="w-full border-collapse text-left">
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={i === 0 ? 'font-mono text-[10px] uppercase tracking-widest text-ink/60' : 'border-t border-[rgba(60,80,120,0.25)] font-hand text-2xl text-[#1d2a4a]'}>
                {r.map((c, j) => (
                  <td key={j} className="py-1.5 pr-3">
                    {inline(c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {marks}
      </div>
    );
  }
  if (doc.paper === 'note') {
    return (
      <div className="paper relative w-[min(88vw,460px)] px-8 py-9 shadow-[0_30px_80px_rgba(0,0,0,0.8)]" style={{ transform: 'rotate(-0.8deg)' }}>
        <div className="space-y-3 font-hand text-[1.7rem] leading-[1.15] text-[#1d2a4a]">
          {doc.body.map((b, i) => (
            <p key={i}>{inline(b)}</p>
          ))}
        </div>
        <div className="mt-3 text-right">{sig}</div>
        {doc.date && <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-ink/55">{inline(doc.date)}</div>}
        {marks}
      </div>
    );
  }
  // letter
  return (
    <div className="paper relative w-[min(92vw,600px)] rounded-[1px] px-7 py-9 shadow-[0_30px_80px_rgba(0,0,0,0.8)] sm:px-12 sm:py-12">
      <div className="text-center font-title text-[11px] uppercase tracking-[0.45em] text-burgundy">{doc.heading}</div>
      <div className="mx-auto mt-2 h-px w-40 bg-burgundy/40" />
      {doc.date && <div className="mt-5 text-right font-mono text-[11px] text-ink/70">{inline(doc.date)}</div>}
      <div className="mt-4 space-y-3 font-mono text-[12.5px] leading-[1.7] text-ink/90 sm:text-[13px]">
        {doc.body.map((b, i) => (
          <p key={i}>{inline(b)}</p>
        ))}
      </div>
      {sig}
      {marks}
    </div>
  );
}

export function DocumentView(props: Props) {
  const [lens, setLens] = useState<{ x: number; y: number } | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const paper = useMemo(() => <Paper {...props} />, [props]);
  const onMove = (e: React.PointerEvent) => {
    if (!props.loupe || !wrap.current || e.pointerType === 'touch') return;
    const r = wrap.current.getBoundingClientRect();
    setLens({ x: e.clientX - r.left, y: e.clientY - r.top });
  };
  const Z = 2.2;
  const L = 170;
  return (
    <div ref={wrap} className="relative" onPointerMove={onMove} onPointerLeave={() => setLens(null)}>
      {paper}
      {props.loupe && lens && (
        <div
          className="pointer-events-none absolute overflow-hidden rounded-full border-[6px] border-[#3a2a18] shadow-[0_10px_40px_rgba(0,0,0,0.7),inset_0_0_30px_rgba(0,0,0,0.25)]"
          style={{ width: L, height: L, left: lens.x - L / 2, top: lens.y - L / 2 }}
        >
          <div style={{ transform: `translate(${L / 2 - lens.x * Z}px, ${L / 2 - lens.y * Z}px) scale(${Z})`, transformOrigin: '0 0' }}>{paper}</div>
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.18),transparent_45%)]" />
        </div>
      )}
    </div>
  );
}
