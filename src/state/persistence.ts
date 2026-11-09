/** Autosave, manual save and settings persistence. */
import { useEffect } from 'react';
import { useGame, DEFAULT_SETTINGS } from './store';
import { loadSettings, writeSave, writeSettings } from './save';
import { audio } from '../audio/audio';
import { setTextureQuality } from '../world/textures';

export async function saveNow(): Promise<boolean> {
  const s = useGame.getState();
  if (s.phase !== 'playing') return false;
  const ok = await writeSave(s.serialize());
  if (ok) s.markSaved();
  return ok;
}

export async function manualSave() {
  const ok = await saveNow();
  audio.play('save');
  useGame.getState().toast(ok ? 'Pages sealed into the case file.' : 'Could not write the case file (storage unavailable).', 'save');
}

export async function returnToTitle() {
  await saveNow();
  const s = useGame.getState();
  s.closeOverlay();
  if (document.pointerLockElement) document.exitPointerLock();
  s.setPhase('intro');
}

/** Loads settings once at boot, then keeps the case file and settings saved. */
export function usePersistence() {
  useEffect(() => {
    void loadSettings().then((st) => {
      if (st) {
        const merged = { ...DEFAULT_SETTINGS, ...st };
        setTextureQuality(merged.quality);
        useGame.getState().updateSettings(merged);
      }
    });
    let lastDirty = useGame.getState().dirty;
    let debounce: number | undefined;
    const unsub = useGame.subscribe((s, prev) => {
      if (s.settings !== prev.settings) void writeSettings(s.settings);
      if (s.phase === 'playing' && s.dirty !== prev.dirty) {
        // important discoveries are saved promptly
        window.clearTimeout(debounce);
        debounce = window.setTimeout(() => {
          lastDirty = useGame.getState().dirty;
          void saveNow();
        }, 1500);
      }
    });
    const interval = window.setInterval(() => {
      const s = useGame.getState();
      // periodic autosave captures position even without new discoveries
      if (s.phase === 'playing') {
        lastDirty = s.dirty;
        void saveNow();
      }
    }, 20000);
    const onHide = () => {
      if (document.visibilityState === 'hidden') void saveNow();
    };
    document.addEventListener('visibilitychange', onHide);
    const onPageHide = () => void saveNow();
    window.addEventListener('pagehide', onPageHide);
    void lastDirty;
    return () => {
      unsub();
      window.clearInterval(interval);
      window.clearTimeout(debounce);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, []);
}
