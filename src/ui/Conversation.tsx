/**
 * The conversation layer: letterbox bars, film-style subtitles, a small
 * restrained choice panel, and the detective's evidence folder for
 * presenting. The 3D scene stays live behind it — the character is right
 * there, framed by the conversation camera.
 */
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '../state/store';
import { advance, cancelPresent, chooseTopic, hubTopics, leaveConversation, lineText, nameOf, noteTell, openPresent, present, recordObservation } from '../state/story';
import { NPC_BY_ID } from '../data/npcs';
import { EVIDENCE, CATEGORY_LABEL } from '../data/evidence';
import { TOPIC_KIND_LABEL } from '../systems/dialogue';
import { audio } from '../audio/audio';

const REACTION_LABEL: Record<string, string> = {
  acknowledge: '',
  surprise: 'Surprised',
  defensive: 'Defensive',
  denial: 'Denies it',
  explain: 'Explains',
  revise: 'Changes the account',
  refuse: 'Refuses to answer',
};

function Letterbox() {
  return (
    <>
      <motion.div className="pointer-events-none fixed inset-x-0 top-0 z-20 bg-shadow" initial={{ height: 0 }} animate={{ height: '9vh' }} exit={{ height: 0 }} transition={{ duration: 0.6 }} />
      <motion.div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 bg-shadow" initial={{ height: 0 }} animate={{ height: '9vh' }} exit={{ height: 0 }} transition={{ duration: 0.6 }} />
    </>
  );
}

function PresentFolder() {
  const evidence = useGame((s) => s.evidence);
  const npc = useGame((s) => s.conversation?.npc ?? '');
  const items = EVIDENCE.filter((e) => evidence[e.id]);
  return (
    <motion.div
      initial={{ y: 60, opacity: 0, rotate: -2 }}
      animate={{ y: 0, opacity: 1, rotate: 0 }}
      exit={{ y: 60, opacity: 0 }}
      className="manila fixed bottom-[10vh] left-1/2 z-30 w-[min(94vw,760px)] -translate-x-1/2 rounded-[3px] px-5 pb-4 pt-5 shadow-[0_30px_80px_rgba(0,0,0,0.8)]"
      data-testid="present-folder"
    >
      <div className="mb-3 flex items-baseline justify-between">
        <div className="font-title text-lg text-ink">Show {nameOf(npc)}…</div>
        <button onClick={cancelPresent} className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/70 hover:text-burgundy">
          Close the folder · Esc
        </button>
      </div>
      {items.length ? (
        <div className="grid max-h-[38vh] grid-cols-2 gap-2 overflow-y-auto pr-1 scroll-quiet sm:grid-cols-3">
          {items.map((e) => {
            const st = evidence[e.id];
            const shown = st.presentedTo.includes(npc);
            return (
              <button
                key={e.id}
                data-testid={`present-${e.id}`}
                onClick={() => (audio.play('paper'), present(e.id))}
                className="paper relative px-3 py-2 text-left shadow-md transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-blood">
                  {e.id} · {CATEGORY_LABEL[e.category]}
                </div>
                <div className="font-title text-[13px] leading-tight text-ink">{e.name}</div>
                {!st.fullyExamined && <div className="mt-0.5 font-ui text-[10px] italic text-ink/50">not fully examined</div>}
                {shown && <div className="absolute right-2 top-1.5 font-mono text-[8px] uppercase text-ink/45">shown</div>}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="hand py-6 text-center text-2xl text-ink/60">Nothing in the folder yet.</p>
      )}
    </motion.div>
  );
}

export function ConversationUI() {
  const overlay = useGame((s) => s.overlay);
  const c = useGame((s) => s.conversation);
  const playSeconds = useGame((s) => Math.floor(s.playSeconds / 15));
  void playSeconds;
  useEffect(() => {
    if (!c) return;
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('button')) return;
      if (useGame.getState().conversation?.mode === 'lines') advance();
    };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, [c]);
  if (overlay !== 'conversation' || !c) return null;
  const def = NPC_BY_ID[c.npc];
  const line = c.queue[c.index];
  const speaker = line?.by === 'npc' ? def.short : 'You';
  const text = line ? lineText(line) : '';
  const topics = c.mode === 'hub' ? hubTopics(c.npc) : [];
  const ordinary = topics.filter((t) => t.topic.kind !== 'challenge');
  const challenges = topics.filter((t) => t.topic.kind === 'challenge');
  const canNote = c.mode === 'lines' && line?.tell && !c.noted.includes(c.index);

  return (
    <div className="fixed inset-0 z-20" data-testid="conversation">
      <Letterbox />
      {/* speaker card, top-left like a film credit */}
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="pointer-events-none fixed left-6 top-[11vh] z-30">
        <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-gold/80">In conversation</div>
        <div className="font-display text-3xl italic text-ivory drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">{def.name}</div>
        {c.reaction && REACTION_LABEL[c.reaction] && c.mode === 'lines' && (
          <div className="mt-1 inline-block border border-ivory/30 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.25em] text-ivory/70" data-testid="reaction">
            {REACTION_LABEL[c.reaction]}
          </div>
        )}
      </motion.div>

      {/* subtitles */}
      <AnimatePresence mode="wait">
        {c.mode === 'lines' && line && (
          <motion.div
            key={`${c.index}-${text.slice(0, 12)}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-x-0 bottom-[12vh] z-30 flex flex-col items-center px-6 text-center"
          >
            <div className={`font-mono text-[10px] uppercase tracking-[0.35em] ${line.by === 'npc' ? 'text-gold' : 'text-ivory/50'}`}>{speaker}</div>
            <p
              data-testid="subtitle"
              className={`mt-1 max-w-3xl leading-snug drop-shadow-[0_2px_10px_rgba(0,0,0,1)] ${line.by === 'npc' ? 'font-display text-[clamp(1.15rem,2.3vw,1.6rem)] text-ivory' : 'font-display text-[clamp(1rem,2vw,1.3rem)] italic text-ivory/70'}`}
            >
              {text}
            </p>
            <div className="mt-3 flex items-center gap-4">
              {canNote && (
                <button
                  data-testid="note-tell"
                  onClick={() => noteTell(c.index)}
                  className="flex items-center gap-2 border border-gold/50 bg-shadow/40 px-3 py-1 font-ui text-[11px] text-gold hover:bg-gold/15"
                  title={line.tell}
                >
                  ✎ Note their manner
                </button>
              )}
              <button data-testid="continue-line" onClick={advance} className="font-mono text-[10px] uppercase tracking-[0.3em] text-ivory/45 hover:text-ivory">
                Continue · Space
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* the choice panel */}
      <AnimatePresence>
        {c.mode === 'hub' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-[10.5vh] left-1/2 z-30 w-[min(94vw,640px)] -translate-x-1/2 bg-gradient-to-t from-shadow/85 to-shadow/50 px-4 pb-3 pt-3 backdrop-blur-[2px] sm:px-5"
            data-testid="choices"
          >
            <div className="max-h-[34vh] space-y-0.5 overflow-y-auto pr-1 scroll-quiet">
              {ordinary.map(({ topic, asked }) => (
                <button
                  key={topic.id}
                  data-testid={`topic-${topic.id}`}
                  onClick={() => chooseTopic(topic.id)}
                  className={`group flex w-full items-baseline gap-3 py-1 text-left transition ${asked ? 'text-ivory/45' : 'text-ivory'} hover:text-gold`}
                >
                  <span className="w-20 shrink-0 font-mono text-[9px] uppercase tracking-[0.2em] text-gold/60">{TOPIC_KIND_LABEL[topic.kind]}</span>
                  <span className="font-display text-[17px] leading-tight">{topic.label}</span>
                  {!asked && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />}
                </button>
              ))}
              {challenges.map(({ topic, asked }) => (
                <button
                  key={topic.id}
                  data-testid={`topic-${topic.id}`}
                  onClick={() => chooseTopic(topic.id)}
                  className={`flex w-full items-baseline gap-3 py-1 text-left ${asked ? 'text-blood/60' : 'text-[#e2848f]'} hover:text-ivory`}
                >
                  <span className="w-20 shrink-0 font-mono text-[9px] uppercase tracking-[0.2em] text-blood">Challenge</span>
                  <span className="font-display text-[17px] italic leading-tight">{topic.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-ivory/15 pt-2">
              <button data-testid="present" onClick={openPresent} className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-gold hover:text-ivory">
                <span className="manila inline-block h-3 w-4" /> Present evidence
              </button>
              <button data-testid="leave" onClick={leaveConversation} className="font-mono text-[10px] uppercase tracking-[0.25em] text-ivory/60 hover:text-ivory">
                Leave · Esc
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{c.mode === 'present' && <PresentFolder />}</AnimatePresence>
    </div>
  );
}

/** What you see when you simply watch someone (Q). */
export function ObserveCard() {
  const o = useGame((s) => s.observing);
  const overlay = useGame((s) => s.overlay);
  if (!o || overlay !== 'none') return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="pointer-events-auto fixed bottom-[24%] left-1/2 z-10 w-[min(92vw,520px)] -translate-x-1/2 bg-shadow/70 px-5 py-3 text-center backdrop-blur-[2px]"
      data-testid="observe-card"
    >
      <div className="font-mono text-[9px] uppercase tracking-[0.35em] text-gold/80">Observing {nameOf(o.npc)}</div>
      <p className="mt-1 font-display text-[17px] italic leading-snug text-ivory/90">{o.text}</p>
      <div className="mt-2 flex justify-center gap-4">
        <button
          data-testid="record-observation"
          onClick={recordObservation}
          className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold hover:text-ivory"
        >
          ✎ Write it down · Q
        </button>
        <button onClick={() => useGame.setState({ observing: null })} className="font-mono text-[10px] uppercase tracking-[0.25em] text-ivory/50 hover:text-ivory">
          Look away
        </button>
      </div>
    </motion.div>
  );
}
