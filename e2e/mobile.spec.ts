import { expect, test } from '@playwright/test';
import { collectErrors, standAndLook, startNewGame, state, waitForTarget } from './helpers';

test('touch controls: joystick walks, interact button, notebook readable', async ({ page }) => {
  const errors = collectErrors(page);
  await startNewGame(page);
  await expect(page.getByTestId('touch-controls')).toBeVisible();
  const z0 = await state<number>(page, 'r.z');
  // drag the left-hand thumb-stick forward
  const vp = page.viewportSize()!;
  const sx = vp.width * 0.2;
  const sy = vp.height * 0.75;
  const surface = page.getByTestId('touch-controls').locator('div').first();
  await surface.dispatchEvent('pointerdown', { pointerId: 7, pointerType: 'touch', clientX: sx, clientY: sy, isPrimary: true });
  await surface.dispatchEvent('pointermove', { pointerId: 7, pointerType: 'touch', clientX: sx, clientY: sy - 50, isPrimary: true });
  await page.waitForTimeout(2500);
  await surface.dispatchEvent('pointerup', { pointerId: 7, pointerType: 'touch', clientX: sx, clientY: sy - 50, isPrimary: true });
  expect(await state<number>(page, 'r.z')).toBeLessThan(z0 - 0.5);

  // contextual interaction button
  await standAndLook(page, { x: 0, z: 12.2, level: 0 }, [0, 1.3, 10]);
  await waitForTarget(page, 'door:front-door');
  await page.getByTestId('touch-interact').tap();
  await expect.poll(() => state<boolean>(page, "s.doors['front-door'].open")).toBe(true);

  // notebook from the physical tab
  await page.getByRole('button', { name: 'Notebook' }).tap();
  await expect(page.getByTestId('notebook')).toBeVisible();
  const box = await page.getByTestId('notebook').locator('.paper').first().boundingBox();
  expect(box!.width).toBeGreaterThan(vp.width * 0.6);
  await page.getByTestId('close-notebook').tap();
  expect(errors).toEqual([]);
});
