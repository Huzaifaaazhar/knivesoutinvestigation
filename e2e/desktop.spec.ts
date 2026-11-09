import { expect, test } from '@playwright/test';
import { collectErrors, standAndLook, startNewGame, state, waitForTarget } from './helpers';

test.describe.configure({ mode: 'serial' });

test('opening, invitation and arrival at the gate', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await page.getByTestId('boot').click();
  await expect(page.getByTestId('opening')).toBeVisible();
  await expect(page.getByText('KNIVES OUT')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText('The Thrombey Investigation')).toBeVisible();
  await page.getByTestId('new').click();
  await expect(page.getByTestId('invitation')).toBeVisible();
  await page.getByTestId('seal').click();
  await page.getByTestId('enter-estate').click();
  await expect.poll(() => state<string>(page, 's.phase')).toBe('playing');
  await expect(page.getByTestId('room-card')).toContainText('Main Gate');
  expect(await state<string[]>(page, 's.visited')).toContain('gate');
  expect(errors).toEqual([]);
});

test('walk up to the front door, open it, and enter the hall', async ({ page }) => {
  const errors = collectErrors(page);
  await startNewGame(page);
  await standAndLook(page, { x: 0, z: 12.2, level: 0 }, [0, 1.3, 10]);
  await waitForTarget(page, 'door:front-door');
  await expect(page.getByTestId('prompt')).toContainText('Open');
  await page.keyboard.press('e');
  await expect.poll(() => state<boolean>(page, "s.doors['front-door'].open")).toBe(true);
  await page.keyboard.down('KeyW');
  await expect.poll(() => state<string>(page, 'r.room'), { timeout: 90_000 }).toBe('hall');
  await page.keyboard.up('KeyW');
  expect(await state<string[]>(page, 's.milestones')).toContain('entered-estate');
  // collision: keep walking into the west wall and stay inside
  await standAndLook(page, { x: -2.5, z: 3.5, level: 0 }, [-10, 1.6, 3.5]);
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(2500);
  await page.keyboard.up('KeyW');
  expect(await state<number>(page, 'r.x')).toBeGreaterThan(-4);
  expect(errors).toEqual([]);
});

test('climb the grand staircase to the landing', async ({ page }) => {
  await startNewGame(page);
  await standAndLook(page, { x: 0, z: 2.4, level: 0 }, [0, 3, -10]);
  await page.keyboard.down('Shift');
  await page.keyboard.down('KeyW');
  await expect.poll(() => state<number>(page, 'r.level'), { timeout: 40_000 }).toBe(1);
  await page.keyboard.up('KeyW');
  await page.keyboard.up('Shift');
  await expect.poll(() => state<string>(page, 'r.room')).toBe('landing');
});

test('inspect the medical bag, examine details and log it as evidence', async ({ page }) => {
  const errors = collectErrors(page);
  await startNewGame(page);
  await standAndLook(page, { x: -7.3, z: -2.0, level: 0 }, [-6.2, 0.85, -1.3]);
  await waitForTarget(page, 'medbag');
  await page.keyboard.press('e');
  await expect(page.getByTestId('inspection')).toBeVisible();
  await expect(page.getByTestId('collect')).toBeDisabled();
  await page.locator('[data-hotspot=vials]').click();
  await expect(page.getByTestId('detail-text')).toContainText('MORPHINE');
  await page.locator('[data-hotspot=labels]').click();
  await expect(page.getByTestId('collect')).toBeEnabled();
  await page.getByTestId('collect').click();
  await expect(page.getByTestId('collected')).toBeVisible();
  const ev = await state<any>(page, "s.evidence['EV-02']");
  expect(ev.fullyExamined).toBe(true);
  expect(ev.discoveredAt).toMatch(/^\d\d:\d\d$/);
  await page.getByTestId('close-inspection').click();
  // evidence folder
  await page.keyboard.press('f');
  await expect(page.getByTestId('folder')).toBeVisible();
  await expect(page.getByTestId('evidence-count')).toContainText('1 of');
  await page.getByTestId('evidence-EV-02').click();
  await expect(page.getByTestId('evidence-detail')).toContainText('Fully examined');
  await expect(page.getByTestId('evidence-detail')).toContainText("Harlan's Study");
  await page.getByTestId('close-folder').click();
  expect(errors).toEqual([]);
});

test('read the attorney letter, then find the hidden compartment it points to', async ({ page }) => {
  await startNewGame(page);
  await standAndLook(page, { x: -11.6, z: -4.3, level: 0 }, [-13, 0.8, -4.3]);
  await waitForTarget(page, 'desk-drawer');
  await page.keyboard.press('e');
  await expect(page.getByTestId('inspection')).toBeVisible();
  await page.locator('[data-hotspot=copy]').click();
  await page.getByTestId('collect').click();
  await page.getByTestId('close-inspection').click();
  expect(await state<string[]>(page, 's.milestones')).toContain('read-attorney-letter');
  await standAndLook(page, { x: 12.6, z: 1.8, level: 0 }, [12.6, 1.55, 0.6]);
  await waitForTarget(page, 'hollow-book');
  await page.keyboard.press('e');
  await expect(page.getByTestId('inspection')).toContainText('Marta');
});

test('notebook opens, pages turn and records observations', async ({ page }) => {
  await startNewGame(page);
  await page.keyboard.press('n');
  await expect(page.getByTestId('notebook')).toBeVisible();
  await page.getByTestId('tab-journal').click();
  await expect(page.getByTestId('journal-page').first()).toContainText('Arrived at the Thrombey estate');
  await page.getByTestId('tab-persons').click();
  await expect(page.getByTestId('person-harlan')).toContainText('Not yet studied');
  await page.getByTestId('close-notebook').click();
  await expect(page.getByTestId('notebook')).toHaveCount(0);
});

test('pick up the estate plan and set a course from the floor plan', async ({ page }) => {
  await startNewGame(page);
  await page.keyboard.press('m');
  await expect(page.getByTestId('map')).toHaveCount(0);
  await standAndLook(page, { x: 2.3, z: 3.6, level: 0 }, [3.6, 0.95, 3.5]);
  await waitForTarget(page, 'estate-plan');
  await page.keyboard.press('e');
  await expect.poll(() => state<boolean>(page, 's.hasMap')).toBe(true);
  await page.keyboard.press('m');
  await expect(page.getByTestId('map')).toBeVisible();
  await expect(page.getByTestId('plan-marker')).toBeVisible();
  await page.getByTestId('sheet-grounds').click();
  await page.getByTestId('sheet-0').click();
  // the hall has been visited; travel there from the gate
  await page.getByTestId('close-map').click();
  await standAndLook(page, { x: 0, z: 40, level: 0 }, [0, 1.6, 0]);
  await expect.poll(() => state<string>(page, 'r.room')).not.toBe('hall');
  await page.keyboard.press('m');
  // outdoors, the plan opens on the Grounds sheet
  await expect(page.getByTestId('sheet-grounds')).toHaveClass(/bg-ivory/);
  await page.getByTestId('sheet-0').click();
  await page.getByTestId('plan-room-hall').click();
  await page.getByTestId('set-course').click();
  expect(await state<string>(page, 's.navTarget')).toBe('hall');
});

test('locked storage room needs the key from the kitchen', async ({ page }) => {
  await startNewGame(page);
  await standAndLook(page, { x: -2.8, z: -15, level: -1 }, [-4, -2.3, -15]);
  await waitForTarget(page, 'door:serv-storage');
  await page.keyboard.press('e');
  expect(await state<boolean>(page, "s.doors['serv-storage'].open")).toBe(false);
  await expect(page.getByTestId('toasts')).toContainText('Locked');
  await standAndLook(page, { x: 13.8, z: -12.3, level: 0 }, [13.8, 1.1, -13.45]);
  await waitForTarget(page, 'flour-tin');
  await page.keyboard.press('e');
  await page.locator('[data-hotspot=key]').click();
  await page.getByTestId('close-inspection').click();
  expect(await state<string[]>(page, 's.inventory')).toContain('storage-key');
  await standAndLook(page, { x: -2.8, z: -15, level: -1 }, [-4, -2.3, -15]);
  await waitForTarget(page, 'door:serv-storage');
  await page.keyboard.press('e');
  await expect.poll(() => state<boolean>(page, "s.doors['serv-storage'].open")).toBe(true);
});

test('manual save survives a browser refresh and resumes', async ({ page }) => {
  await startNewGame(page);
  await standAndLook(page, { x: -7.3, z: -2.0, level: 0 }, [-6.2, 0.85, -1.3]);
  await waitForTarget(page, 'medbag');
  await page.keyboard.press('e');
  await page.locator('[data-hotspot=vials]').click();
  await page.getByTestId('collect').click();
  await page.getByTestId('close-inspection').click();
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
  expect(Object.keys(await state<object>(page, 's.evidence'))).toContain('EV-02');
  expect(await state<string[]>(page, 's.visited')).toContain('study');
  expect(Math.abs((await state<number>(page, 'r.x')) + 7.3)).toBeLessThan(1);
});

test('escape pauses the investigation', async ({ page }) => {
  await startNewGame(page);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('pause')).toBeVisible();
  await page.getByTestId('resume').click();
  await expect(page.getByTestId('pause')).toHaveCount(0);
});
