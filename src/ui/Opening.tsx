import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '../state/store';
import { audio } from '../audio/audio';
import { clearSave, loadSave } from '../state/save';
import { startInvestigation, continueInvestigation } from './flow';

type Stage = 'black' | 'reveal' | 'title' | 'menu';

/** Boot gate: the browser needs one gesture before sound can play. */
export function BootScreen() {
  const phase = useGame((s) => s.phase);
  if (phase !== 'boot') return null;
  const begin = async () => {
    audio.init();
    audio.setVolume(useGame.getState().settings.volume);
    audio.rainOnly(0.35);
    const save = await loadSave();
    useGame.getState().setHasSave(!!save);
    useGame.getState().setPhase('intro');
  };
  return (
    <button
      data-testid="boot"
      onClick={begin}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-shadow text-ivory/70"
    >
      <div className="font-mono text-[10px] uppercase tracking-[0.5em] text-gold/60">A Thrombey Estate Investigation</div>
      <div className="mt-6 font-display text-2xl italic text-ivory/80">Click anywhere to begin</div>
      <div className="mt-3 font-ui text-xs text-ivory/40">Sound on — headphones recommended</div>
    </button>
  );
}

export function Opening() {
  const phase = useGame((s) => s.phase);
  const hasSave = useGame((s) => s.hasSave);
  const reduced = useGame((s) => s.settings.reducedMotion);
  const [stage, setStage] = useState<Stage>('black');
  const [confirmNew, setConfirmNew] = useState(false);

  useEffect(() => {
    if (phase !== 'intro') return;
    setStage('black');
    const k = reduced ? 0.4 : 1;
    const t = [
      setTimeout(() => setStage('reveal'), 2400 * k),
      setTimeout(() => setStage('title'), 7200 * k),
      setTimeout(() => setStage('menu'), 11000 * k),
    ];
    return () => t.forEach(clearTimeout);
  }, [phase, reduced]);

  if (phase !== 'intro') return null;
  const skip = () => setStage('menu');
  const showTitle = stage === 'title' || stage === 'menu';

  return (
    <div className="fixed inset-0 z-40" data-testid="opening">
      {/* black curtain */}
      <motion.div
        className="pointer-events-none absolute inset-0 bg-shadow"
        initial={{ opacity: 1 }}
        animate={{ opacity: stage === 'black' ? 1 : stage === 'reveal' ? 0.15 : 0.35 }}
        transition={{ duration: stage === 'reveal' ? 4.5 : 1.5, ease: 'easeInOut' }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-shadow via-transparent to-shadow/60" />

      <AnimatePresence>
        {showTitle && (
          <motion.div
            key="title"
            className="absolute inset-x-0 top-[22%] flex flex-col items-center px-4 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.2 }}
          >
            <motion.h1
              initial={{ letterSpacing: '0.6em', opacity: 0, filter: 'blur(8px)' }}
              animate={{ letterSpacing: '0.18em', opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 3.2, ease: [0.2, 0.7, 0.2, 1] }}
              className="whitespace-nowrap font-display font-semibold text-ivory drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]"
              style={{ fontSize: 'clamp(3rem, 11vw, 9.5rem)', lineHeight: 0.9 }}
            >
              KNIVES OUT
            </motion.h1>
            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1.2, duration: 1.6 }} className="gold-rule mt-6 w-[min(520px,70vw)]" />
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6, duration: 1.8 }}
              className="mt-5 font-title text-[clamp(0.8rem,2.2vw,1.25rem)] uppercase tracking-[0.55em] text-gold"
            >
              The Thrombey Investigation
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {stage === 'menu' && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, delay: 0.4 }}
            className="absolute inset-x-0 bottom-[14%] flex flex-col items-center gap-3 px-4"
          >
            {!confirmNew ? (
              <>
                {hasSave && (
                  <MenuButton testId="continue" primary onClick={() => void continueInvestigation()}>
                    Continue the investigation
                  </MenuButton>
                )}
                <MenuButton testId="new" primary={!hasSave} onClick={() => (hasSave ? setConfirmNew(true) : startNew())}>
                  New investigation
                </MenuButton>
              </>
            ) : (
              <div className="paper max-w-sm rounded-sm px-6 py-5 text-center shadow-2xl">
                <p className="font-title text-lg">Begin a new case file?</p>
                <p className="mt-2 text-sm text-ink/75">Your current notes and evidence will be burned. (Settings are kept.)</p>
                <div className="mt-4 flex justify-center gap-3">
                  <button data-testid="confirm-new" onClick={startNew} className="border border-burgundy bg-burgundy px-4 py-2 font-ui text-xs uppercase tracking-widest text-ivory">
                    Begin anew
                  </button>
                  <button onClick={() => setConfirmNew(false)} className="border border-ink/40 px-4 py-2 font-ui text-xs uppercase tracking-widest">
                    Keep my file
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {stage !== 'menu' && (
        <button data-testid="skip" onClick={skip} className="absolute bottom-6 right-6 font-mono text-[11px] uppercase tracking-[0.3em] text-ivory/45 transition hover:text-gold">
          Skip ›
        </button>
      )}
    </div>
  );

  async function startNew() {
    audio.play('click');
    await clearSave();
    useGame.getState().newGame();
    useGame.getState().setHasSave(false);
    useGame.getState().setPhase('invitation');
  }
}

function MenuButton({ children, onClick, primary, testId }: { children: React.ReactNode; onClick: () => void; primary?: boolean; testId?: string }) {
  return (
    <button
      data-testid={testId}
      onClick={() => {
        audio.play('click');
        onClick();
      }}
      className={`group relative min-w-[18rem] px-8 py-3 font-display text-xl tracking-wide transition ${
        primary ? 'text-ivory' : 'text-ivory/70'
      } hover:text-gold`}
    >
      <span className="absolute inset-x-6 bottom-1 h-px bg-gold/30 transition group-hover:bg-gold" />
      {children}
    </button>
  );
}

/** The case envelope from Benoit Blanc: the transition into the estate. */
export function Invitation() {
  const phase = useGame((s) => s.phase);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (phase === 'invitation') setOpen(false);
  }, [phase]);
  if (phase !== 'invitation') return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-shadow/70 p-4" data-testid="invitation">
      <div className="relative" style={{ perspective: 1400 }}>
        <motion.div
          initial={{ y: 60, rotate: -4, opacity: 0 }}
          animate={{ y: open ? 160 : 0, rotate: open ? 0 : -2, opacity: 1 }}
          transition={{ duration: 1.1, ease: [0.2, 0.7, 0.2, 1] }}
          className="manila relative h-[min(56vw,300px)] w-[min(88vw,460px)] rounded-[3px] shadow-[0_30px_80px_rgba(0,0,0,0.8)]"
        >
          <div className="absolute left-6 top-6 font-mono text-[10px] uppercase tracking-[0.25em] text-ink/70">Case file · Thrombey, H.</div>
          <div className="absolute bottom-6 left-6 font-hand text-2xl text-ink/80">For the associate — by hand</div>
          <div className="absolute bottom-7 right-6 rotate-[-8deg] border-2 border-burgundy/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-burgundy/80">Confidential</div>
          {/* flap */}
          <motion.div
            className="manila absolute inset-x-0 top-0 h-1/2 origin-top"
            style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)', filter: 'brightness(0.92)' }}
            animate={{ rotateX: open ? 180 : 0 }}
            transition={{ duration: 0.8 }}
          />
          {!open && (
            <button
              data-testid="seal"
              onClick={() => {
                audio.play('seal');
                setTimeout(() => audio.play('paper'), 300);
                setOpen(true);
              }}
              aria-label="Break the seal"
              className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-blood font-title text-lg italic text-ivory/90 shadow-[inset_0_-4px_10px_rgba(0,0,0,0.5),0_4px_14px_rgba(0,0,0,0.6)] transition hover:scale-105"
            >
              BB
            </button>
          )}
        </motion.div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.92 }}
              animate={{ y: -40, opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 1.0, ease: [0.2, 0.7, 0.2, 1] }}
              className="paper absolute left-1/2 top-1/2 max-h-[86vh] w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[2px] px-8 py-8 shadow-[0_30px_90px_rgba(0,0,0,0.85)] scroll-quiet"
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/60">Thursday · late · Crofton Road, Massachusetts</div>
              <h2 className="mt-3 font-title text-2xl">My dear associate,</h2>
              <div className="mt-4 space-y-3 font-display text-[1.15rem] leading-snug text-ink/90">
                <p>A week ago, Harlan Thrombey — novelist, patriarch, a man who adored a good puzzle — was found in his study with his throat cut. The police are content to call it suicide. I am not content.</p>
                <p>The family have gone home to sharpen their stories. The house, however, is still talking. Tonight it is ours alone. Walk its rooms, look closely, and write down everything. Nothing is ordinary until proven so.</p>
                <p>Enclosed: a notebook, and a folder for whatever you find. The gate has been left open for you.</p>
              </div>
              <div className="mt-4 font-hand text-3xl text-ink">— B. Blanc</div>
              <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-ink/15 pt-5 text-xs text-ink/75">
                <span className="flex items-center gap-2">
                  <span className="leather inline-block h-6 w-5 rounded-[2px]" /> Leather notebook
                </span>
                <span className="flex items-center gap-2">
                  <span className="manila inline-block h-5 w-7 rounded-[1px]" /> Evidence folder
                </span>
              </div>
              <button
                data-testid="enter-estate"
                onClick={() => startInvestigation()}
                className="mt-6 w-full border border-burgundy bg-burgundy py-3 font-title text-sm uppercase tracking-[0.4em] text-ivory transition hover:bg-blood"
              >
                Enter the estate
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
