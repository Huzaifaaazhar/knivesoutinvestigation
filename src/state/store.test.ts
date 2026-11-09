import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { useGame, gameClock } from './store';
import { loadSave, writeSave, clearSave, isValidSave } from './save';

const g = () => useGame.getState();

describe('investigation state', () => {
  beforeEach(() => {
    g().newGame();
    useGame.setState({ phase: 'playing' });
  });

  it('records visited rooms and a notebook entry on first entry only', () => {
    g().enterRoom('study');
    g().enterRoom('study');
    expect(g().visited).toEqual(['study']);
    expect(g().notes.filter((n) => n.room === 'study')).toHaveLength(1);
  });

  it('entering a room does not grant evidence', () => {
    for (const r of ['study', 'living', 'library', 'kitchen', 'cellar']) g().enterRoom(r);
    expect(Object.keys(g().evidence)).toHaveLength(0);
  });

  it('examining the estate plan grants the map', () => {
    expect(g().hasMap).toBe(false);
    g().examine('estate-plan');
    expect(g().hasMap).toBe(true);
  });

  it('evidence is only logged after inspection, and tracks full examination', () => {
    g().examine('medbag');
    g().collectEvidence('medbag');
    const ev = g().evidence['EV-02'];
    expect(ev).toBeTruthy();
    expect(ev.fullyExamined).toBe(false);
    g().seeDetail('medbag', 'vials');
    expect(g().evidence['EV-02'].fullyExamined).toBe(false);
    g().seeDetail('medbag', 'labels');
    expect(g().evidence['EV-02'].fullyExamined).toBe(true);
    expect(g().evidence['EV-02'].examinedDetails).toEqual(['vials', 'labels']);
    expect(g().evidence['EV-02'].presentedTo).toEqual([]);
    expect(g().notes.some((n) => n.kind === 'evidence')).toBe(true);
  });

  it('reading the attorney letter unlocks the hidden compartment', () => {
    expect(g().milestones).not.toContain('read-attorney-letter');
    g().examine('desk-drawer');
    expect(g().milestones).toContain('read-attorney-letter');
  });

  it('the flour tin yields the storage key', () => {
    g().examine('flour-tin');
    expect(g().inventory).toContain('storage-key');
  });

  it('portraits add persons of interest', () => {
    g().examine('portrait-harlan');
    expect(g().characters).toContain('harlan');
  });

  it('formats the in-world clock', () => {
    expect(gameClock(0)).toBe('21:40');
    expect(gameClock(15 * 25)).toBe('22:05');
  });
});

describe('save & resume (IndexedDB)', () => {
  it('round-trips the whole investigation', async () => {
    g().newGame();
    useGame.setState({ phase: 'playing' });
    g().enterRoom('hall');
    g().examine('estate-plan');
    g().examine('medbag');
    g().seeDetail('medbag', 'vials');
    g().collectEvidence('medbag');
    g().setDoor('front-door', { open: true });
    const data = g().serialize();
    expect(isValidSave(data)).toBe(true);
    expect(await writeSave(data)).toBe(true);

    g().newGame();
    expect(g().visited).toHaveLength(0);

    const loaded = await loadSave();
    expect(loaded).not.toBeNull();
    g().hydrate(loaded!);
    expect(g().visited).toContain('hall');
    expect(g().hasMap).toBe(true);
    expect(g().evidence['EV-02'].examinedDetails).toContain('vials');
    expect(g().doors['front-door'].open).toBe(true);
    expect(g().notes.length).toBeGreaterThan(0);

    await clearSave();
    expect(await loadSave()).toBeNull();
  });

  it('rejects malformed saves', () => {
    expect(isValidSave(null)).toBe(false);
    expect(isValidSave({ version: 2 })).toBe(false);
  });
});
