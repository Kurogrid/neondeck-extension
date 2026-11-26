import { test as base, expect, type Page } from '@playwright/test';

/** Hosts the page may reach; everything else is aborted and recorded. */
const LOCAL = /^(https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/|data:|blob:)/;

interface Fixtures {
  /** Requests that tried to leave localhost (aborted). */
  external: string[];
  /** Uncaught page errors and console errors. */
  errors: string[];
}

export const test = base.extend<Fixtures>({
  external: async ({ page }, use) => {
    const list: string[] = [];
    await page.route('**/*', (route) => {
      const url = route.request().url();
      if (LOCAL.test(url)) return route.continue();
      list.push(url);
      return route.abort();
    });
    await use(list);
  },
  errors: async ({ page }, use) => {
    const list: string[] = [];
    page.on('pageerror', (e) => list.push(e.message));
    page.on('console', (m) => {
      // Aborted external requests surface as console errors; those are checked through `external`.
      if (m.type() === 'error' && !/net::ERR_FAILED|Failed to load resource/.test(m.text())) list.push(m.text());
    });
    await use(list);
  },
});

export { expect };

/**
 * Opens a fresh page (each test gets its own empty storage). With `patch`, the saved default settings are
 * deep-merged with it (arrays replace) and the page is reloaded, so the app starts from that state.
 */
export async function open(page: Page, patch?: Record<string, unknown>): Promise<void> {
  await page.goto('/');
  await expect(page.locator('.nd-greeting')).toBeVisible();
  if (!patch) return;
  await page.evaluate(async (p) => {
    const merge = (a: any, b: any): any => {
      if (Array.isArray(b) || typeof b !== 'object' || b === null) return b;
      const out = { ...(a ?? {}) };
      for (const k of Object.keys(b)) out[k] = merge(out[k], b[k]);
      return out;
    };
    // Settings are written on the first change only, so start from the app's own defaults (served by Vite).
    const stored = localStorage.getItem('settings');
    const base = stored ? JSON.parse(stored) : (await import('/src/core/schema.ts' as string)).defaultSettings('en');
    localStorage.setItem('settings', JSON.stringify(merge(base, p)));
  }, patch);
  await page.reload();
  await expect(page.locator('.nd-greeting')).toBeVisible();
}

/** Reads the saved settings object back from storage. */
export async function saved(page: Page): Promise<Record<string, any>> {
  return page.evaluate(() => JSON.parse(localStorage.getItem('settings') ?? '{}'));
}
