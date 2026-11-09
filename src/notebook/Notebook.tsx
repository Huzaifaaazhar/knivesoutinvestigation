import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame, type NoteEntry, type Settings } from '../state/store';
import { CHARACTERS, EVENTS } from '../data/case';
import { EVIDENCE } from '../data/evidence';
import { LEVEL_NAMES, LEVELS, ROOMS, placeName } from '../data/layout';
import { portraitDataUrl } from './portraitImage';
import { manualSave, returnToTitle } from '../state/persistence';
import { audio } from '../audio/audio';

type Tab = 'case' | 'journal' | 'persons' | 'plan' | 'records';
interface Page {
  tab: Tab;
  node: ReactNode;
}

const TABS: { id: Tab; label: string; color: string }[] = [
  { id: 'case', label: 'Case', color: '#632331' },
  { id: 'journal', label: 'Journal', color: '#66684d' },
  { id: 'persons', label: 'Persons', color: '#171e2a' },
  { id: 'plan', label: 'Plan', color: '#2a4468' },
  { id: 'records', label: 'Records', color: '#b69a65' },
];

const NOTES_PER_PAGE = 6;

function useIsNarrow() {
  const [n, setN] = useState(() => window.innerWidth < 820);
  useEffect(() => {
    const f = () => setN(window.innerWidth < 820);
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);
  return n;
}

function PageTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="mb-4">
      {sub && <div className="font-mono text-[9px] uppercase tracking-[0.35em] text-ink/50">{sub}</div>}
      <h3 className="font-title text-xl text-ink">{children}</h3>
      <div className="mt-1 h-px w-24 bg-burgundy/50" />
    </div>
  );
}

function NoteLine({ n }: { n: NoteEntry }) {
  const tone = n.kind === 'evidence' ? 'text-blood' : n.kind === 'person' ? 'text-[#1d2a4a]' : n.kind === 'milestone' ? 'text-burgundy' : 'text-[#24304a]';
  return (
    <motion.li initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative pl-1">
      <div className="font-mono text-[9.5px] uppercase tracking-widest text-ink/45">
        {n.at} · {placeName(n.room)}
        {n.kind === 'evidence' && <span className="ml-2 text-blood">● logged</span>}
      </div>
      <div className={`hand text-[1.3rem] leading-[1.12] ${tone}`}>{n.text}</div>
    </motion.li>
  );
}

function enquiries(s: ReturnType<typeof useGame.getState>): string[] {
  const m = s.milestones;
  const out: string[] = [];
  if (!s.visited.includes('hall')) out.push('The house first. The front door, up the drive.');
  if (!s.hasMap && s.visited.includes('hall')) out.push('A house this size deserves a plan. Caterers always get one.');
  if (s.visited.includes('study') && !s.evidence['EV-04']) out.push('Harlan’s desk has not been searched.');
  if (m.includes('read-attorney-letter') && !m.includes('found-hidden-compartment')) out.push('“The Sleeper in the Stacks” — library, third shelf.');
  if (m.includes('tried-serv-storage') && !s.inventory.includes('storage-key')) out.push('The storage room is locked. Who in this house keeps the keys — and where would a cook hide one?');
  if (s.inventory.includes('storage-key') && !m.includes('opened-storage')) out.push('Fran’s key, tagged “STORE”. The cellars.');
  if (s.evidence['EV-07'] && !s.evidence['EV-09']) out.push('Someone came down the trellis. From which window?');
  if (s.evidence['EV-09'] && !s.evidence['EV-07']) out.push('The latch was forced from inside. What is below that window?');
  if (s.evidence['EV-05'] && !s.evidence['EV-01']) out.push('A blade is missing from the display. Where did it end up?');
  if (m.includes('tried-harlan-sitting')) {
    if (!s.doors['harlan-sitting']?.unlocked) out.push('The sitting-room door is bolted from the bedroom side.');
  }
  if (!out.length) out.push('Keep looking. Nothing is ordinary until proven so.');
  return out.slice(0, 4);
}

export function Notebook() {
  const overlay = useGame((s) => s.overlay);
  const notes = useGame((s) => s.notes);
  const characters = useGame((s) => s.characters);
  const visited = useGame((s) => s.visited);
  const evidence = useGame((s) => s.evidence);
  const hasMap = useGame((s) => s.hasMap);
  const page = useGame((s) => s.notebookPage);
  const setPage = useGame((s) => s.setNotebookPage);
  const lastSaved = useGame((s) => s.lastSaved);
  const settings = useGame((s) => s.settings);
  const narrow = useIsNarrow();
  const [dir, setDir] = useState(1);
  const [stamped, setStamped] = useState(0);
  const state = useGame.getState();

  const pages = useMemo<Page[]>(() => {
    const out: Page[] = [];
    // ── Case
    out.push({
      tab: 'case',
      node: (
        <>
          <PageTitle sub="Case file">The Thrombey Matter</PageTitle>
          <p className="hand text-[1.3rem] leading-[1.15] text-[#24304a]">
            Harlan Thrombey, 85. Found in his study the morning after his birthday party. Throat cut; a blade from his own collection. Police: suicide. B.B.: not satisfied.
          </p>
          <div className="mt-4 font-mono text-[9px] uppercase tracking-[0.3em] text-ink/50">The night of the party</div>
          <ul className="mt-2 space-y-1.5">
            {EVENTS.map((e) => (
              <li key={e.id} className="flex gap-3 text-[13px] leading-snug">
                <span className="w-12 shrink-0 font-mono text-[11px] text-burgundy">{e.time}</span>
                <span className="font-display text-ink/85">
                  <b className="font-semibold">{e.title}.</b> {e.summary}
                </span>
              </li>
            ))}
          </ul>
        </>
      ),
    });
    out.push({
      tab: 'case',
      node: (
        <>
          <PageTitle sub="Where things stand">Lines of enquiry</PageTitle>
          <ul className="space-y-2">
            {enquiries(state).map((t, i) => (
              <li key={i} className="hand text-[1.35rem] leading-[1.1] text-[#24304a]">
                — {t}
              </li>
            ))}
          </ul>
          <div className="mt-6 grid grid-cols-3 gap-2 text-center">
            {[
              ['Rooms seen', `${visited.filter((v) => ROOMS.some((r) => r.id === v)).length}/${ROOMS.length}`],
              ['Evidence', `${Object.keys(evidence).length}/${EVIDENCE.length}`],
              ['Persons', `${characters.length}/${CHARACTERS.length}`],
            ].map(([k, v]) => (
              <div key={k} className="border border-ink/15 py-2">
                <div className="font-title text-xl text-burgundy">{v}</div>
                <div className="font-mono text-[9px] uppercase tracking-widest text-ink/55">{k}</div>
              </div>
            ))}
          </div>
        </>
      ),
    });
    // ── Journal
    const chunks: NoteEntry[][] = [];
    for (let i = 0; i < Math.max(1, notes.length); i += NOTES_PER_PAGE) chunks.push(notes.slice(i, i + NOTES_PER_PAGE));
    if (chunks.length % 2) chunks.push([]);
    chunks.forEach((c, i) =>
      out.push({
        tab: 'journal',
        node: (
          <>
            {i === 0 && <PageTitle sub="Observations">Journal</PageTitle>}
            {c.length ? (
              <ul className="space-y-3" data-testid="journal-page">
                {c.map((n) => (
                  <NoteLine key={n.id} n={n} />
                ))}
              </ul>
            ) : (
              <p className="hand mt-10 text-center text-2xl text-ink/30">{i === 0 ? 'Nothing written yet.' : '—'}</p>
            )}
            <div className="absolute bottom-4 right-6 font-mono text-[9px] text-ink/40">{i + 1}</div>
          </>
        ),
      }),
    );
    // ── Persons
    const half = Math.ceil(CHARACTERS.length / 2);
    [CHARACTERS.slice(0, half), CHARACTERS.slice(half)].forEach((group, gi) =>
      out.push({
        tab: 'persons',
        node: (
          <>
            {gi === 0 && <PageTitle sub="Studied from portraits & photographs">Persons of interest</PageTitle>}
            <ul className={`space-y-3 ${gi ? 'pt-2' : ''}`}>
              {group.map((c) => {
                const known = characters.includes(c.id);
                return (
                  <li key={c.id} className="flex gap-3" data-testid={`person-${c.id}`}>
                    <div className={`h-14 w-11 shrink-0 border-[3px] border-[#f4efe4] shadow-md ${known ? '' : 'bg-ink/10'}`} style={{ transform: `rotate(${(c.id.length % 3) - 1}deg)` }}>
                      {known && <img src={portraitDataUrl(c.id)} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-title text-[15px] leading-tight text-ink">{c.name}</div>
                      <div className="font-ui text-[11px] text-ink/60">{c.role}</div>
                      <div className={`hand text-[1.1rem] leading-[1.05] ${known ? 'text-[#24304a]' : 'text-ink/30'}`}>{known ? c.note : 'Not yet studied.'}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        ),
      }),
    );
    // ── Plan
    out.push({
      tab: 'plan',
      node: (
        <>
          <PageTitle sub="Folded into the back cover">Estate plan</PageTitle>
          {hasMap ? (
            <button
              data-testid="open-map"
              onClick={() => useGame.getState().openOverlay('map')}
              className="blueprint group relative block h-44 w-full overflow-hidden rounded-[2px] border-4 border-[#f4efe4] shadow-lg"
            >
              <span className="absolute inset-0 flex items-center justify-center font-title text-sm uppercase tracking-[0.4em] text-ivory/90 group-hover:text-gold">Unfold the plan</span>
            </button>
          ) : (
            <p className="hand text-[1.35rem] leading-[1.1] text-[#24304a]">No plan of the house yet. The caterers must have had one — check the hall.</p>
          )}
          <p className="mt-4 font-ui text-[11px] text-ink/55">Shortcut: M</p>
        </>
      ),
    });
    out.push({
      tab: 'plan',
      node: (
        <>
          <PageTitle sub="Rooms walked">Itinerary</PageTitle>
          {LEVELS.slice()
            .reverse()
            .map((lv) => (
              <div key={lv} className="mb-3">
                <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-ink/50">{LEVEL_NAMES[lv]}</div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                  {ROOMS.filter((r) => r.level === lv).map((r) => (
                    <span key={r.id} className={`font-display text-[14px] ${visited.includes(r.id) ? 'text-ink' : 'text-ink/30'}`}>
                      {visited.includes(r.id) ? '✓ ' : '· '}
                      {visited.includes(r.id) ? r.name : 'unvisited'}
                    </span>
                  ))}
                </div>
              </div>
            ))}
        </>
      ),
    });
    // ── Records
    out.push({
      tab: 'records',
      node: (
        <>
          <PageTitle sub="File & seal">Records</PageTitle>
          <p className="hand text-[1.25rem] leading-[1.1] text-[#24304a]">Seal today’s pages into the case file. The house keeps its own copy as you go, but a detective trusts their own hand.</p>
          <button
            data-testid="manual-save"
            onClick={async () => {
              await manualSave();
              setStamped((v) => v + 1);
            }}
            className="relative mt-5 flex h-24 w-24 items-center justify-center rounded-full bg-blood font-title text-xs uppercase tracking-[0.2em] text-ivory shadow-[inset_0_-6px_14px_rgba(0,0,0,0.5),0_6px_16px_rgba(0,0,0,0.4)] transition active:scale-95"
          >
            Seal &amp; save
          </button>
          <AnimatePresence>
            {stamped > 0 && (
              <motion.div
                key={stamped}
                initial={{ scale: 1.6, opacity: 0, rotate: -18 }}
                animate={{ scale: 1, opacity: 1, rotate: -8 }}
                className="mt-4 inline-block border-2 border-burgundy px-3 py-1 font-mono text-[11px] uppercase tracking-[0.3em] text-burgundy"
                data-testid="saved-stamp"
              >
                Filed
              </motion.div>
            )}
          </AnimatePresence>
          <div className="mt-4 font-mono text-[10px] text-ink/55" data-testid="last-saved">
            {lastSaved ? `Last filed ${new Date(lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Not yet filed'}
          </div>
          <button onClick={() => void returnToTitle()} className="mt-6 block font-ui text-[11px] uppercase tracking-widest text-burgundy underline-offset-4 hover:underline">
            Save & return to the title
          </button>
        </>
      ),
    });
    out.push({ tab: 'records', node: <SettingsPage settings={settings} /> });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, characters, visited, evidence, hasMap, lastSaved, settings, stamped]);

  const perView = narrow ? 1 : 2;
  const maxStart = pages.length - perView;
  const start = Math.max(0, Math.min(maxStart, narrow ? page : page - (page % 2)));
  const view = pages.slice(start, start + perView);
  const go = (n: number) => {
    const next = Math.max(0, Math.min(maxStart, n));
    if (next === start) return;
    setDir(next > start ? 1 : -1);
    setPage(next);
  };
  const jump = (tab: Tab) => {
    const i = pages.findIndex((p) => p.tab === tab);
    if (tab === 'journal') {
      // open at the latest journal page
      const last = pages.map((p, k) => (p.tab === 'journal' ? k : -1)).filter((k) => k >= 0);
      const lastWithNotes = last.length ? last[Math.max(0, Math.ceil(notes.length / NOTES_PER_PAGE) - 1)] ?? last[0] : i;
      go(narrow ? lastWithNotes : lastWithNotes - (lastWithNotes % 2));
      return;
    }
    go(narrow ? i : i - (i % 2));
  };

  useEffect(() => {
    if (overlay !== 'notebook') return;
    const f = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(start + perView);
      if (e.key === 'ArrowLeft') go(start - perView);
    };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  });

  if (overlay !== 'notebook') return null;
  const curTab = view[0]?.tab;

  return (
    <motion.div
      className="fixed inset-0 z-20 flex items-center justify-center bg-shadow/50 p-2 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && useGame.getState().closeOverlay()}
      data-testid="notebook"
    >
      <motion.div
        initial={{ y: 80, rotateX: 25, scale: 0.9, opacity: 0 }}
        animate={{ y: 0, rotateX: 0, scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
        style={{ perspective: 1800 }}
        className="leather relative flex w-full max-w-[980px] rounded-[10px] p-2.5 sm:p-4"
      >
        {/* ribbons */}
        <div className="absolute -right-3 top-8 z-10 flex flex-col gap-1.5 sm:-right-5">
          {TABS.map((t) => (
            <button
              key={t.id}
              data-testid={`tab-${t.id}`}
              onClick={() => jump(t.id)}
              className={`origin-left py-1.5 pl-3 pr-2 text-left font-mono text-[9px] uppercase tracking-[0.2em] text-ivory shadow-md transition sm:pr-3 sm:text-[10px] ${curTab === t.id ? 'translate-x-1.5' : 'opacity-85 hover:translate-x-1'}`}
              style={{ background: t.color, clipPath: 'polygon(0 0, 100% 0, 90% 50%, 100% 100%, 0 100%)' }}
            >
              {t.label}
            </button>
          ))}
        </div>
        {/* elastic band */}
        <div className="absolute bottom-0 right-[18%] top-0 hidden w-2 bg-[#1a0f0b] shadow-inner sm:block" />

        <div className="relative grid min-h-[min(78vh,620px)] w-full overflow-hidden rounded-[4px]" style={{ gridTemplateColumns: `repeat(${perView}, minmax(0, 1fr))` }}>
          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            <motion.div
              key={start}
              custom={dir}
              initial={{ rotateY: dir * 35, opacity: 0, x: dir * 40 }}
              animate={{ rotateY: 0, opacity: 1, x: 0 }}
              exit={{ rotateY: dir * -35, opacity: 0, x: dir * -40 }}
              transition={{ duration: 0.45, ease: [0.3, 0.6, 0.2, 1] }}
              style={{ transformOrigin: dir > 0 ? 'left center' : 'right center', gridColumn: `1 / span ${perView}` }}
              className="grid"
            >
              <div className="grid h-full" style={{ gridTemplateColumns: `repeat(${perView}, minmax(0, 1fr))` }}>
                {view.map((p, i) => (
                  <div
                    key={i}
                    className={`paper paper-ruled relative max-h-[min(78vh,620px)] overflow-y-auto px-6 pb-10 pl-14 pt-7 scroll-quiet sm:px-8 sm:pl-16 ${
                      perView === 2 ? (i === 0 ? 'shadow-[inset_-18px_0_30px_-18px_rgba(60,30,10,0.45)]' : 'shadow-[inset_18px_0_30px_-18px_rgba(60,30,10,0.45)]') : ''
                    }`}
                  >
                    {p.node}
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* page corners */}
        <button
          aria-label="Previous page"
          data-testid="page-prev"
          disabled={start === 0}
          onClick={() => go(start - perView)}
          className="absolute bottom-3 left-3 h-12 w-12 text-2xl text-ink/50 disabled:opacity-0 sm:bottom-5 sm:left-5"
        >
          ‹
        </button>
        <button
          aria-label="Next page"
          data-testid="page-next"
          disabled={start >= maxStart}
          onClick={() => go(start + perView)}
          className="absolute bottom-3 right-3 h-12 w-12 text-2xl text-ink/50 disabled:opacity-0 sm:bottom-5 sm:right-5"
        >
          ›
        </button>
        <button
          data-testid="close-notebook"
          onClick={() => useGame.getState().closeOverlay()}
          className="absolute -top-11 right-0 font-mono text-[11px] uppercase tracking-[0.3em] text-ivory/70 hover:text-gold"
        >
          Close · N
        </button>
      </motion.div>
    </motion.div>
  );
}

function Tick({ on, label, onChange }: { on: boolean; label: string; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => (audio.play('pencil'), onChange(!on))} className="flex items-center gap-2 text-left" aria-pressed={on}>
      <span className="relative inline-block h-4 w-4 border border-ink/60">{on && <span className="hand absolute -top-2 left-0 text-2xl leading-none text-burgundy">✓</span>}</span>
      <span className="font-display text-[15px] text-ink">{label}</span>
    </button>
  );
}

function Slider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="flex justify-between font-display text-[15px] text-ink">
        {label} <span className="font-mono text-[11px] text-ink/60">{value.toFixed(step < 1 ? 1 : 0)}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 w-full accent-[#632331]" />
    </label>
  );
}

function SettingsPage({ settings }: { settings: Settings }) {
  const up = useGame((s) => s.updateSettings);
  return (
    <>
      <PageTitle sub="Preferences">Settings</PageTitle>
      <div className="space-y-3" data-testid="settings">
        <Slider label="Volume" value={settings.volume} min={0} max={1} step={0.1} onChange={(v) => up({ volume: v })} />
        <Slider label="Look sensitivity" value={settings.sensitivity} min={0.3} max={2.5} step={0.1} onChange={(v) => up({ sensitivity: v })} />
        <Slider label="Field of view" value={settings.fov} min={55} max={90} step={1} onChange={(v) => up({ fov: v })} />
        <div className="grid grid-cols-1 gap-2 pt-1">
          <Tick on={settings.invertY} label="Invert vertical look" onChange={(v) => up({ invertY: v })} />
          <Tick on={settings.headBob} label="Walking motion" onChange={(v) => up({ headBob: v })} />
          <Tick on={settings.reducedMotion} label="Reduce motion" onChange={(v) => up({ reducedMotion: v })} />
          <Tick on={settings.grain} label="Film grain" onChange={(v) => up({ grain: v })} />
          <Tick on={settings.showLabels} label="Show object names" onChange={(v) => up({ showLabels: v })} />
          <Tick on={settings.quality === 'high'} label="High detail (uncheck for older devices)" onChange={(v) => up({ quality: v ? 'high' : 'low' })} />
        </div>
      </div>
    </>
  );
}
