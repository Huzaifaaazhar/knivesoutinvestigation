import { expect, type Page } from '@playwright/test';

export function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  return errors;
}

export async function state<T>(page: Page, fn: string): Promise<T> {
  return page.evaluate(`(() => { const s = window.__KO__.useGame.getState(); const r = window.__KO__.runtime; return (${fn}); })()`) as Promise<T>;
}

/** Boot → skip the opening → new investigation → break the seal → enter the estate. */
export async function startNewGame(page: Page) {
  await page.goto('/');
  await page.getByTestId('boot').click();
  await page.getByTestId('opening').waitFor();
  await page
    .getByTestId('skip')
    .click({ timeout: 5000 })
    .catch(() => {});
  await page.getByTestId('new').click();
  const confirm = page.getByTestId('confirm-new');
  if (await confirm.isVisible().catch(() => false)) await confirm.click();
  await page.getByTestId('seal').click();
  await page.getByTestId('enter-estate').click();
  await expect.poll(() => state<string>(page, 's.phase')).toBe('playing');
}

/** Teleport the player and aim the camera at a world point. */
export async function standAndLook(page: Page, at: { x: number; z: number; level: number }, target: [number, number, number]) {
  await page.evaluate(
    ({ at, target }) => {
      const k = (window as any).__KO__;
      const ly = at.level === 1 ? 4.4 : at.level === -1 ? -3.6 : 0;
      const dx = target[0] - at.x;
      const dz = target[2] - at.z;
      const dy = target[1] - (ly + 1.65);
      const yaw = Math.atan2(-dx, -dz);
      k.runtime.teleport = { x: at.x, z: at.z, level: at.level, yaw };
      k.runtime.pitch = Math.atan2(dy, Math.hypot(dx, dz));
    },
    { at, target },
  );
}

export async function waitForTarget(page: Page, id: string) {
  await expect.poll(() => state<string | null>(page, 's.target'), { timeout: 30_000 }).toBe(id);
}
