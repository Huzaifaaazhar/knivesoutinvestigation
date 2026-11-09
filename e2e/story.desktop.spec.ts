import { expect, test, type Page } from '@playwright/test';
import { collectErrors, standAndLook, startNewGame, state, waitForTarget } from './helpers';

test.describe.configure({ mode: 'serial' });

/** Walk up to a character wherever they currently are, and face them. */
async function approach(page: Page, npc: string) {
  // you can stop someone mid-walk; give them a moment to arrive first if they're close
  await expect
    .poll(() => state<number>(page, `window.__KO__.npcRt['${npc}'].path.length`), { timeout: 20_000 })
    .toBe(0)
    .catch(() => {});
  const p = await state<{ x: number; z: number; level: number; yaw: number; height: number }>(
    page,
    `(() => { const n = window.__KO__.npcRt['${npc}']; return { x: n.x, z: n.z, level: n.level, yaw: n.yaw }; })()`,
  );
  // stand 1.4 m in front of them (or behind, if that is blocked)
  for (const d of [1.4, -1.4]) {
    const at = { x: p.x + Math.sin(p.yaw) * d, z: p.z + Math.cos(p.yaw) * d, level: p.level };
    await standAndLook(page, at, [p.x, (p.level === 1 ? 4.4 : p.level === -1 ? -3.6 : 0) + 1.5, p.z]);
    const ok = await expect
      .poll(() => state<string | null>(page, 's.target'), { timeout: 15_000 })
      .toBe(`npc:${npc}`)
      .then(() => true)
      .catch(() => false);
    if (ok) return;
  }
  throw new Error(`could not target ${npc}`);
}

async function talk(page: Page, npc: string) {
  await approach(page, npc);
  await page.keyboard.press('e');
  await expect(page.getByTestId('conversation')).toBeVisible();
}

/** Click through subtitles until the choice panel (or the end). */
async function finishLines(page: Page) {
  for (let i = 0; i < 20; i++) {
    const mode = await state<string | null>(page, 's.conversation ? s.conversation.mode : null');
    if (mode !== 'lines') return mode;
    await page.keyboard.press('Space');
    await page.waitForTimeout(150);
  }
  return state<string | null>(page, 's.conversation ? s.conversation.mode : null');
}

async function ask(page: Page, topic: string) {
  await page.getByTestId(`topic-${topic}`).click();
  await finishLines(page);
}

test('meet the family: conversations, testimony, body language, an unwilling Ransom', async ({ page }) => {
  const errors = collectErrors(page);
  await startNewGame(page);
  // the house is occupied: people are spread across several rooms
  const rooms = await state<string[]>(page, 'Object.values(window.__KO__.npcRt).map((n) => n.room)');
  expect(new Set(rooms).size).toBeGreaterThanOrEqual(6);

  await talk(page, 'meg');
  await expect(page.getByTestId('subtitle')).toContainText('detective');
  expect(await finishLines(page)).toBe('hub');
  await ask(page, 'evening');
  expect(await state<boolean>(page, "!!s.statements['S-meg-shouting']")).toBe(true);
  await page.getByTestId('leave').click();
  await finishLines(page);
  await expect(page.getByTestId('conversation')).toHaveCount(0);

  // Ransom won't talk until the investigation has some weight behind it
  await talk(page, 'ransom');
  await expect(page.getByTestId('subtitle')).toContainText('help');
  await finishLines(page);
  await expect(page.getByTestId('conversation')).toHaveCount(0);
  expect(await state<string[]>(page, 's.met')).not.toContain('ransom');
  expect(errors).toEqual([]);
});

test('Blanc gives graded hints; a contradiction is marked in the notebook and unlocks a challenge', async ({ page }) => {
  await startNewGame(page);
  await talk(page, 'blanc');
  expect(await finishLines(page)).toBe('hub');
  const hint = async () => {
    await page.getByTestId('topic-hint').click();
    await page.keyboard.press('Space'); // past the investigator's question
    await expect(page.getByTestId('subtitle')).not.toHaveText('I could use a nudge.');
    const t = await page.getByTestId('subtitle').innerText();
    await finishLines(page);
    return t;
  };
  const h1 = await hint();
  const h2 = await hint();
  expect(h2).not.toBe(h1);
  // two requests on the same lead go one level deeper (the study counts as visited once you're standing in it)
  expect(await state<boolean>(page, 'Object.values(s.hintsUsed).includes(2)')).toBe(true);
  await page.getByTestId('leave').click();
  await finishLines(page);

  // Meg, then Ransom (meeting Blanc moved everyone; find them again)
  await talk(page, 'meg');
  await finishLines(page);
  await ask(page, 'evening');
  await page.keyboard.press('Escape');
  await talk(page, 'ransom');
  await finishLines(page);
  await ask(page, 'chat');
  // body language can be written down
  expect(await state<boolean>(page, "!!s.statements['S-ransom-civil']")).toBe(true);
  await page.keyboard.press('Escape');

  await page.keyboard.press('n');
  await page.getByTestId('tab-testimony').click();
  await expect(page.getByTestId('statement-S-ransom-civil').getByTestId('flag')).toBeVisible();
  await page.getByTestId('compare-S-ransom-civil').click();
  await page.getByTestId('against-s-S-meg-shouting').click();
  await expect(page.getByTestId('compare-result')).toContainText('Contradiction recorded');
  await page.getByTestId('close-compare').click();
  await page.getByTestId('tab-contradictions').click();
  await expect(page.getByTestId('contradiction-C-ransom-argument')).toBeVisible();
  await page.getByTestId('close-notebook').click();

  await talk(page, 'ransom');
  await finishLines(page);
  await expect(page.getByTestId('topic-challenge-argument')).toBeVisible();
  await ask(page, 'challenge-argument');
  expect(await state<boolean>(page, "!!s.statements['S-ransom-argued']")).toBe(true);
});

test('presenting evidence gets a contextual reaction and can expose a lie', async ({ page }) => {
  await startNewGame(page);
  await standAndLook(page, { x: 12.3, z: 0.3, level: 1 }, [12.3, 5.45, 1.45]);
  await waitForTarget(page, 'tuition-statement');
  await page.keyboard.press('e');
  await page.locator('[data-hotspot=refund]').click();
  await page.getByTestId('collect').click();
  await page.getByTestId('close-inspection').click();

  await talk(page, 'joni');
  await finishLines(page);
  await ask(page, 'meg');
  await page.getByTestId('present').click();
  await expect(page.getByTestId('present-folder')).toBeVisible();
  await page.getByTestId('present-EV-16').click();
  await expect(page.getByTestId('reaction')).toContainText('Defensive');
  await finishLines(page);
  expect(await state<boolean>(page, "!!s.contradictions['C-joni-tuition']")).toBe(true);
  expect(await state<string[]>(page, "s.evidence['EV-16'].presentedTo")).toContain('joni');
  await expect(page.getByTestId('topic-challenge-tuition')).toBeVisible();
});

test('a memory surfaces from the Go board, and the family tree records relationships', async ({ page }) => {
  await startNewGame(page);
  await standAndLook(page, { x: -8.3, z: -4.0, level: 0 }, [-9.5, 0.55, -4]);
  await waitForTarget(page, 'go-board');
  await page.keyboard.press('e');
  await page.getByTestId('remember').click();
  await expect(page.getByTestId('flashback')).toBeVisible();
  await expect(page.getByTestId('memory-line')).toBeVisible({ timeout: 15_000 });
  for (let i = 0; i < 8 && (await state<string>(page, 's.overlay')) === 'flashback'; i++) {
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);
  }
  expect(await state<string[]>(page, 's.memories')).toContain('M-go');
  expect(await state<string[]>(page, 's.relationships')).toContain('R-harlan-marta-trust');

  await standAndLook(page, { x: 7.25, z: -6.2, level: 0 }, [7.25, 1.2, -7.45]);
  await waitForTarget(page, 'family-tree');
  await page.keyboard.press('e');
  await expect(page.getByTestId('family-tree')).toBeVisible();
  await page.getByTestId('rel-R-harlan-marta-trust').click();
  await page.getByTestId('mark-rel').click();
  await page.getByTestId('rel-note').fill('More than nurse and patient.');
  await page.getByTestId('close-tree').click();
  expect(await state<string>(page, "s.relNotes['R-harlan-marta-trust']")).toBe('More than nurse and patient.');

  await standAndLook(page, { x: -12.7, z: 6.3, level: 0 }, [-12.7, 0.55, 5.1]);
  await waitForTarget(page, 'photo-album');
  await page.keyboard.press('e');
  await page.getByTestId('photo-A-go').click();
  await expect(page.getByTestId('photo-back-A-go')).toContainText('worthy opponent');
  await page.getByTestId('close-album').click();
});

test('people move between rooms, and conversations survive a save', async ({ page }) => {
  await startNewGame(page);
  await talk(page, 'walt'); // busy on the phone at first
  await finishLines(page);
  await talk(page, 'blanc');
  await finishLines(page);
  await ask(page, 'family');
  await page.keyboard.press('Escape');
  // meeting Blanc moves the investigation on: people head elsewhere
  await expect.poll(() => state<number>(page, "Object.values(window.__KO__.npcRt).filter((n) => n.path.length > 0).length"), { timeout: 30_000 }).toBeGreaterThan(0);
  // let the evening wear on
  await page.evaluate(() => (window as any).__KO__.useGame.getState().tick(15 * 30));
  await expect.poll(() => state<number>(page, "Object.values(window.__KO__.npcRt).filter((n) => n.path.length > 0).length"), { timeout: 30_000 }).toBeGreaterThan(0);

  await page.keyboard.press('n');
  await page.getByTestId('tab-records').click();
  await page.getByTestId('manual-save').click();
  await expect(page.getByTestId('saved-stamp')).toBeVisible();
  await page.reload();
  await page.getByTestId('boot').click();
  await page
    .getByTestId('skip')
    .click({ timeout: 5000 })
    .catch(() => {});
  await page.getByTestId('continue').click();
  await expect.poll(() => state<string>(page, 's.phase')).toBe('playing');
  expect(await state<string[]>(page, 's.met')).toContain('blanc');
  expect(await state<string[]>(page, 's.discussed')).toContain('blanc:family');
});
