import { motion } from 'framer-motion';
import { useGame } from '../state/store';
import { manualSave, returnToTitle } from '../state/persistence';
import { placeName } from '../data/layout';
import { audio } from '../audio/audio';

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
      </div>
    </motion.div>
  );
}
