import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests run the new tab page from the Vite dev server in Chromium.
 * The page runs outside the extension, so storage falls back to localStorage.
 * Every request that leaves localhost is blocked in the tests (see e2e/fixtures.ts).
 */
const PORT = 5174;

export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/`,
    locale: 'en-US',
    timezoneId: 'Europe/Istanbul',
    viewport: { width: 1280, height: 800 },
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } }],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
