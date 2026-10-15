import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 7_000 },
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:4173', viewport: { width: 1366, height: 768 }, trace: 'retain-on-failure' },
  webServer: [
    { command: 'npm run dev -- --port 4173 --strictPort', url: 'http://127.0.0.1:4173', reuseExistingServer: false },
    { command: 'npm run dev -- --mode e2e --port 4174 --strictPort', url: 'http://127.0.0.1:4174', reuseExistingServer: false },
  ],
});
