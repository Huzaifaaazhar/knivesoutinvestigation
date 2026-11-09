import { motion } from 'framer-motion';
import { useGame } from '../state/store';
import { manualSave, returnToTitle } from '../state/persistence';
import { placeName } from '../data/layout';
import { audio } from '../audio/audio';

function SoundPanel() {
  const st = useGame((s) => s.settings);
  const up = useGame((s) => s.updateSettings);
  const row = (label: string, key: 'volume' | 'music' | 'ambience' | 'effects') => (
    <label className="flex items-center gap-3">
      <span className="w-24 text-right font-mono text-[10px] uppercase tracking-[0.2em] text-ivory/60">{label}</span>
      <input data-testid={`sound-${key}`} type="range" min={0} max={1} step={0.05} value={st[key]} onChange={(e) => up({ [key]: Number(e.target.value) })} className="flex-1 accent-[#b69a65]" />
    </label>
  );
  return (
    <div className="mx-auto mt-6 w-full max-w-xs space-y-2 border-t border-ivory/15 pt-4" data-testid="sound-panel">
      <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-gold/60">Sound</div>
      {row('Master', 'volume')}
      {row('Music', 'music')}
      {row('Rain & house', 'ambience')}
      {row('Effects', 'effects')}
    </div>
  );
}

export function PauseMenu() {
  const overlay = useGame((s) => s.overlay);
  const room = useGame((s) => s.player.room);
  const hasMap = useGame((s) => s.hasMap);
  if (overlay !== 'pause') return null;
  const s = useGame.getState();
  const item = (label: string, onClick: () => void, testId?: string, disabled = false) => (
    <button
      data-testid={testId}
      disabled={disabled}
      onClick={() => {
        audio.play('click');
        onClick();
      }}
      className="group relative block w-full py-2 text-center font-display text-2xl text-ivory/85 transition hover:text-gold disabled:text-ivory/25"
    >
      {label}
    </button>
  );
  return (
    <motion.div
      className="fixed inset-0 z-20 flex items-center justify-center bg-shadow/70 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      data-testid="pause"
    >
      <div className="w-full max-w-sm text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.5em] text-gold/70">{placeName(room)}</div>
        <h2 className="mt-2 font-display text-5xl italic text-ivory">A moment’s thought</h2>
        <div className="gold-rule mx-auto my-6 w-48" />
        {item('Resume', () => s.closeOverlay(), 'resume')}
        {item('Notebook', () => s.openOverlay('notebook'))}
        {item('Evidence folder', () => s.openOverlay('folder'))}
        {item('Estate plan', () => s.openOverlay('map'), undefined, !hasMap)}
        {item('Save the case file', () => void manualSave(), 'pause-save')}
        {item('Settings', () => {
          s.openOverlay('notebook');
          const st = useGame.getState();
          // jump to the last spread (records & settings)
          useGame.setState({ notebookPage: 999 });
          void st;
        })}
        {item('Leave for the title', () => void returnToTitle())}
        <SoundPanel />
      </div>
    </motion.div>
  );
}
