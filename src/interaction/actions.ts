/** What happens when the player interacts with the thing they are looking at. */
import { DOOR_BY_ID, placeName } from '../data/layout';
import { INTERACTABLE_BY_ID } from '../data/interactables';
import { useGame, runtime } from '../state/store';
import { audio } from '../audio/audio';
import { doorIdOf, isDoorTarget } from './targeting';

export function isAvailable(id: string): boolean {
  if (isDoorTarget(id)) return true;
  const def = INTERACTABLE_BY_ID[id];
  if (!def) return false;
  const s = useGame.getState();
  if (def.requires && !s.milestones.includes(def.requires)) return false;
  if (def.kind === 'pickup' && s.examined.includes(id)) return false;
  return true;
}

export function promptFor(id: string): { verb: string; name: string } | null {
  const s = useGame.getState();
  if (isDoorTarget(id)) {
    const d = DOOR_BY_ID[doorIdOf(id)];
    const st = s.doors[d.id];
    const name = d.label ?? 'Door';
    if (!st?.unlocked && d.lock) {
      if (d.lock.type === 'bolt' && runtime.room === d.lock.fromRoom) return { verb: 'Draw the bolt', name };
      if (d.lock.type === 'key' && d.lock.keyId && s.inventory.includes(d.lock.keyId)) return { verb: 'Unlock', name };
      return { verb: 'Try', name };
    }
    return { verb: st?.open ? 'Close' : 'Open', name };
  }
  const def = INTERACTABLE_BY_ID[id];
  if (!def) return null;
  return { verb: def.verb, name: def.name };
}

export function interact(id: string) {
  const s = useGame.getState();
  if (isDoorTarget(id)) {
    const d = DOOR_BY_ID[doorIdOf(id)];
    const st = s.doors[d.id];
    if (!st.unlocked && d.lock) {
      if (d.lock.type === 'bolt' && runtime.room === d.lock.fromRoom) {
        s.setDoor(d.id, { unlocked: true, open: true });
        audio.play('unlock');
        setTimeout(() => audio.play('door-open'), 200);
        s.toast('You draw back the bolt.', 'info');
        s.addNote('observation', `${d.label}: unbolted from ${placeName(d.lock.fromRoom!)}. Whoever bolted it was on this side.`, runtime.room);
        return;
      }
      if (d.lock.type === 'key' && d.lock.keyId && s.inventory.includes(d.lock.keyId)) {
        s.setDoor(d.id, { unlocked: true, open: true });
        audio.play('unlock');
        setTimeout(() => audio.play('door-open'), 250);
        s.toast('The brass key turns with a heavy click.', 'info');
        s.addNote('milestone', `Unlocked the ${d.label} with Fran's key.`, runtime.room);
        if (!s.milestones.includes('opened-storage')) useGame.setState({ milestones: [...useGame.getState().milestones, 'opened-storage'] });
        return;
      }
      audio.play('locked');
      s.toast(`${d.label ?? 'Door'} — ${d.lock.message}`, 'locked');
      if (!s.milestones.includes(`tried-${d.id}`)) {
        useGame.setState({ milestones: [...useGame.getState().milestones, `tried-${d.id}`] });
        s.addNote('observation', `${d.label}: ${d.lock.message}`, runtime.room);
      }
      return;
    }
    s.setDoor(d.id, { open: !st.open });
    audio.play(st.open ? 'door-close' : 'door-open');
    return;
  }
  const def = INTERACTABLE_BY_ID[id];
  if (!def || !isAvailable(id)) return;
  switch (def.kind) {
    case 'observe':
      s.examine(id);
      s.toast(def.observation, 'info');
      audio.play('click');
      break;
    case 'pickup':
      s.examine(id);
      break;
    default:
      s.examine(id);
      useGame.setState({ inspecting: id, overlay: 'inspect' });
      audio.play(def.kind === 'document' ? 'paper' : 'click');
  }
}
