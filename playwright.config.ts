import { defineConfig, devices } from '@playwright/test';
import fs from 'node:fs';

// Use a locally provided Chromium when present (CI images often pre-install one).
const localChrome = process.env.CHROME_PATH ?? (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const launchOptions = {
  ...(localChrome ? { executablePath: localChrome } : {}),
  // Software WebGL so the suite runs on machines without a GPU.
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
};

export default defineConfig({
  testDir: './e2e',
  timeout: 240_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5175',
    trace: 'off',
    actionTimeout: 30_000,
  },
  webServer: {
    command: 'npx vite --port 5175 --strictPort',
    url: 'http://localhost:5175',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1100, height: 700 }, launchOptions }, testMatch: /desktop\.spec\.ts/ },
    { name: 'mobile', use: { ...devices['Pixel 7'], launchOptions }, testMatch: /mobile\.spec\.ts/ },
  ],
});
