/** Transitions between the opening, the invitation and play. */
import { useGame } from '../state/store';
import { loadSave } from '../state/save';
import { audio } from '../audio/audio';

export function fadeIn() {
  window.dispatchEvent(new CustomEvent('ko-fade'));
}

export function startInvestigation() {
  const s = useGame.getState();
  audio.play('click');
  fadeIn();
  s.setPhase('playing');
  s.enterRoom('gate');
  s.addNote('arrival', 'Arrived at the Thrombey estate a little before ten. Rain. The gate stands open; the house is lit as if someone is still awake.', 'gate');
  audio.setEnvironment('outdoor');
}

export async function continueInvestigation() {
  const save = await loadSave();
  const s = useGame.getState();
  if (!save) {
    s.setHasSave(false);
    return;
  }
  fadeIn();
  s.hydrate(save);
  s.setPhase('playing');
  s.toast('Investigation resumed.', 'save');
}
