import { defineConfig, devices } from '@playwright/test';

const environment = (globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
}).process?.env ?? {};

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 6_000 },
  fullyParallel: false,
  retries: environment.CI ? 2 : 0,
  reporter: environment.CI ? [['html', { open: 'never' }], ['list']] : 'line',
  use: {
    baseURL: 'http://127.0.0.1:4173/DeeplearningApp/',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: environment.PW_EXTERNAL_SERVER ? undefined : {
    command: 'npm run preview -- --host 127.0.0.1',
    url: 'http://127.0.0.1:4173/DeeplearningApp/',
    reuseExistingServer: !environment.CI,
    timeout: 30_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
