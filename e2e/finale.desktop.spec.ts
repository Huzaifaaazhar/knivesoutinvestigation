import { expect, test, type Page } from '@playwright/test';
import { collectErrors, standAndLook, startNewGame, state, waitForTarget } from './helpers';

test.describe.configure({ mode: 'serial' });

async function approach(page: Page, npc: string) {
  await expect
    .poll(() => state<number>(page, `window.__KO__.npcRt['${npc}'].path.length`), { timeout: 20_000 })
    .toBe(0)
    .catch(() => {});
  const p = await state<{ x: number; z: number; level: number; yaw: number }>(page, `(() => { const n = window.__KO__.npcRt['${npc}']; return { x: n.x, z: n.z, level: n.level, yaw: n.yaw }; })()`);
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

async function finishLines(page: Page) {
  for (let i = 0; i < 25; i++) {
    const mode = await state<string | null>(page, 's.conversation ? s.conversation.mode : null');
    if (mode !== 'lines') return mode;
    await page.keyboard.press('Space');
    await page.waitForTimeout(120);
  }
  return null;
}

async function talk(page: Page, npc: string) {
  await approach(page, npc);
  await page.keyboard.press('e');
  await expect(page.getByTestId('conversation')).toBeVisible();
  await finishLines(page);
}

async function ask(page: Page, topic: string) {
  await page.getByTestId(`topic-${topic}`).click();
  await finishLines(page);
}

/** Inspect something and log it after looking at the given detail(s). */
async function inspect(page: Page, id: string, at: { x: number; z: number; level: number }, look: [number, number, number], details: string[], collect = true) {
  await standAndLook(page, at, look);
  await waitForTarget(page, id);
  await page.keyboard.press('e');
  for (const d of details) await page.locator(`[data-hotspot=${d}]`).first().click();
  if (collect) await page.getByTestId('collect').click();
  await page.getByTestId('close-inspection').click();
}

test('a whole case, played through: from the gate to the case file', async ({ page }) => {
  test.setTimeout(1_500_000);
  const errors = collectErrors(page);
  await startNewGame(page);

  // ── the study: the bag and the attorney's letter
  await inspect(page, 'medbag', { x: -7.3, z: -2.0, level: 0 }, [-6.2, 0.85, -1.3], ['labels']);
  await inspect(page, 'desk-drawer', { x: -11.6, z: -4.3, level: 0 }, [-13, 0.8, -4.3], ['copy']);
  // ── the library: the hidden compartment, then the will
  await inspect(page, 'hollow-book', { x: 12.6, z: 1.8, level: 0 }, [12.6, 1.55, 0.6], ['to']);
  await standAndLook(page, { x: 12.6, z: 1.7, level: 0 }, [12.6, 1.12, 0.65]);
  await waitForTarget(page, 'sealed-will');
  await page.keyboard.press('e');
  await expect(page.getByTestId('will-paper')).toBeVisible();
  for (const d of ['beneficiary', 'annotation', 'witness', 'family', 'alteration']) await page.locator(`[data-testid=will-paper] [data-hotspot=${d}]`).click();
  await page.getByTestId('collect-will').click();
  await page.getByTestId('will-a-W-exists-EV-20').click();
  await page.getByTestId('will-a-W-benefits-marta').click();
  await page.getByTestId('will-a-W-authentic-witness').click();
  await page.getByTestId('will-a-W-knew-ransom').click();
  for (const p of ['ransom', 'linda', 'walt']) await page.getByTestId(`will-a-W-harmed-${p}`).click();
  await page.getByTestId('close-will').click();
  // ── the fire, Fran's coat, the service drive
  await inspect(page, 'fireplace-ash', { x: -14.3, z: 5.0, level: 0 }, [-15.3, 0.5, 5], ['fragment']);
  await inspect(page, 'fran-coat', { x: 0.45, z: -11.9, level: 0 }, [0.45, 1.3, -13.15], ['morphine']);
  await inspect(page, 'tyre-marks', { x: 18.2, z: 8.2, level: 0 }, [18.2, 0.1, 6.5], ['ruts']);
  expect(Object.keys(await state<object>(page, 's.evidence')).length).toBeGreaterThanOrEqual(7);

  // ── people: Blanc, then Ransom — who lies, and is caught by the evidence
  await talk(page, 'blanc');
  await ask(page, 'board');
  await page.keyboard.press('Escape');
  await talk(page, 'ransom');
  await ask(page, 'evening');
  await ask(page, 'will');
  await page.getByTestId('present').click();
  await page.getByTestId('present-EV-15').click();
  await finishLines(page);
  expect(await state<boolean>(page, "!!s.contradictions['C-ransom-car']")).toBe(true);
  await ask(page, 'challenge-car');
  expect(await state<boolean>(page, "!!s.statements['S-ransom-stayed']")).toBe(true);
  // save in the middle of a conversation, then carry on
  await page.evaluate(() => (window as any).__KO__.saveNow());
  await page.keyboard.press('Escape');

  // ── the board in the library
  await standAndLook(page, { x: 10.5, z: 6.4, level: 0 }, [10.5, 1.45, 8.35]);
  await waitForTarget(page, 'evidence-wall');
  await page.keyboard.press('e');
  await expect(page.getByTestId('evidence-wall')).toBeVisible();
  await page.getByTestId('pin-evidence-EV-15').click();
  await page.getByTestId('tray-statement').click();
  await page.getByTestId('pin-statement-S-ransom-left').click();
  await page.getByTestId('mode-string').click();
  await page.getByTestId('card-evidence-EV-15').click();
  await page.getByTestId('card-statement-S-ransom-left').click();
  await page.getByTestId('link-type-alibi').click();
  await page.getByTestId('test-CH-connection').click();
  await expect(page.getByTestId('challenge-CH-connection').getByTestId('solved')).toBeVisible();
  // ── the cord: what has been found, in order
  await page.getByTestId('open-timeline').click();
  for (const id of ['T-party', 'T-swap', 'T-car', 'T-death', 'T-burn']) await page.getByTestId(`peg-${id}`).click();
  await expect(page.getByTestId('tl-odd')).toHaveCount(0);
  await page.getByTestId('close-timeline').click();

  // ── the gathering
  await talk(page, 'blanc');
  await ask(page, 'ready');
  await expect(page.getByTestId('confrontation')).toBeVisible();
  for (let i = 0; i < 3; i++) await page.getByTestId('confront-continue').click();
  await page.getByTestId('accuse-ransom').click();
  await page.getByTestId('next-step').click();
  await page.getByTestId('motive-ransom:inheritance').click();
  await page.getByTestId('next-step').click();
  await page.getByTestId('opportunity-EV-15').click();
  await page.getByTestId('next-step').click();
  await expect(page.getByTestId('confront-timeline')).toBeVisible();
  await page.getByTestId('next-step').click();
  for (const e of ['EV-02', 'EV-20', 'EV-19', 'EV-06']) await page.getByTestId(`evidence-${e}`).click();
  await page.getByTestId('next-step').click();
  await page.getByTestId('contra-C-ransom-car').click();
  await page.getByTestId('next-step').click();
  await page.getByTestId('theory-TH-swap').click();
  await page.getByTestId('next-step').click();
  await expect(page.getByTestId('theory-summary')).toContainText('Ransom');
  await page.getByTestId('deliver').click();

  // ── Blanc explains; the case file
  await expect(page.getByTestId('ending-title')).toHaveText('The Complete Truth');
  await expect(page.getByTestId('ending-line')).toBeVisible({ timeout: 20_000 });
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);
  }
  await page.getByTestId('skip-ending').click();
  await expect(page.getByTestId('case-report')).toBeVisible();
  await expect(page.getByTestId('report-ending')).toHaveText('The Complete Truth');
  await expect(page.getByTestId('verdict-stamp')).toHaveText('Case closed');
  await expect(page.getByTestId('rank-stamp')).toBeVisible();

  // ── a new case — confirmed, and the old one is not silently lost
  await page.getByTestId('report-new').click();
  await page.getByTestId('confirm-fresh').click();
  await expect(page.getByTestId('invitation')).toBeVisible();
  expect(await state<object>(page, 's.evidence')).toEqual({});
  expect(errors).toEqual([]);
});

/** Seed a mid-investigation state (what a player would have after an hour). */
async function seed(page: Page) {
  await page.evaluate(() => {
    const k = (window as any).__KO__;
    const e = (id: string) => ({ id, source: 'x', discoveredAt: '22:10', discoveredTs: Date.now(), examinedDetails: [], fullyExamined: true, presentedTo: [] });
    k.useGame.setState({
      evidence: Object.fromEntries(['EV-02', 'EV-04', 'EV-06', 'EV-13', 'EV-15', 'EV-18'].map((i) => [i, e(i)])),
      statements: { 'S-ransom-left': { at: '22:00', ts: 1 }, 'S-walt-business': { at: '22:00', ts: 2 } },
      contradictions: { 'C-walt-fired': { at: '22:05', ts: 4 } },
      met: ['blanc', 'walt', 'ransom'],
      motiveLeads: ['walt:career'],
    });
  });
}

test('the wrong accusation, the review of the case file, and reloading mid-case', async ({ page }) => {
  test.setTimeout(900_000);
  await startNewGame(page);
  await seed(page);
  await talk(page, 'blanc');
  await ask(page, 'ready');
  for (let i = 0; i < 3; i++) await page.getByTestId('confront-continue').click();
  await page.getByTestId('accuse-walt').click();
  await page.getByTestId('next-step').click();
  await page.getByTestId('motive-walt:career').click();
  for (let i = 0; i < 6; i++) await page.getByTestId('next-step').click();
  await page.getByTestId('deliver').click();
  await expect(page.getByTestId('ending-title')).toHaveText('The Wrong Accusation');
  await page.getByTestId('skip-ending').click();
  await expect(page.getByTestId('verdict-stamp')).toHaveText('Wrongful accusation');
  await page.getByTestId('report-house').click();
  await expect(page.getByTestId('case-report')).toHaveCount(0);

  // reload while exploring: the case closed and its file is kept
  await page.reload();
  await page.getByTestId('boot').click();
  await page
    .getByTestId('skip')
    .click({ timeout: 5000 })
    .catch(() => {});
  await expect(page.getByTestId('review-case')).toBeVisible();
  await page.getByTestId('review-case').click();
  await expect(page.getByTestId('report-ending')).toHaveText('The Wrong Accusation');
  await page.getByTestId('report-title').click();
  await page.getByTestId('continue').click();
  await expect.poll(() => state<string>(page, 's.finale.ending')).toBe('wrong');
});

test('leaving the case unresolved', async ({ page }) => {
  test.setTimeout(600_000);
  await startNewGame(page);
  await seed(page);
  await talk(page, 'blanc');
  await ask(page, 'close');
  await expect(page.getByTestId('ending-title')).toHaveText('The Unresolved Mystery');
  await page.getByTestId('skip-ending').click();
  await expect(page.getByTestId('verdict-stamp')).toHaveText('Open file');
});
