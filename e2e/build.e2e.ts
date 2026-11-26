import { createServer, type Server } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

/**
 * Serves the production build (dist/) with the manifest's own extension_pages CSP as a response header,
 * then checks that the browser reports no CSP violation while the deck is used.
 * Needs `npm run build` first; skipped when dist/ is missing.
 */
const DIST = 'dist';
const built = existsSync(join(DIST, 'manifest.json'));
const TYPES: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg',
};

let server: Server;
let origin = '';
let csp = '';

test.skip(!built, 'run `npm run build` first');

test.beforeAll(async () => {
  csp = JSON.parse(readFileSync(join(DIST, 'manifest.json'), 'utf8')).content_security_policy.extension_pages;
  server = createServer((req, res) => {
    const path = normalize(decodeURIComponent((req.url ?? '/').split('?')[0]!)).replace(/^([/\\])+/, '');
    let file = join(DIST, path || 'index.html');
    if (!file.startsWith(DIST) || !existsSync(file) || statSync(file).isDirectory()) file = join(DIST, 'index.html');
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream', 'Content-Security-Policy': csp });
    res.end(readFileSync(file));
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const addr = server.address();
  origin = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}/`;
});

test.afterAll(() => new Promise<void>((r) => (server ? server.close(() => r()) : r())));

/** Records CSP violations reported by the page. */
async function watch(page: Page): Promise<string[]> {
  const list: string[] = [];
  await page.exposeFunction('__ndCsp', (v: string) => list.push(v));
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) =>
      (window as unknown as { __ndCsp: (v: string) => void }).__ndCsp(`${e.effectiveDirective} blocked ${e.blockedURI || 'inline'}`),
    );
  });
  return list;
}

test('the production build runs under its own CSP without violations', async ({ page, errors }) => {
  const violations = await watch(page);
  await page.goto(origin);
  await expect(page.locator('.nd-greeting')).toBeVisible();

  // Exercise the main surfaces: settings drawer, every theme (scenes, wallpapers, fonts), widget manager.
  await page.getByTitle('Open settings').click();
  const themes = page.getByRole('radiogroup', { name: 'Theme' }).getByRole('radio');
  for (let i = 0; i < (await themes.count()); i++) await themes.nth(i).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Manage widgets' }).click();
  await page.waitForTimeout(500);

  expect(violations).toEqual([]);
  expect(errors).toEqual([]);
});

test('the CSP blocks what it should', async ({ page }) => {
  const violations = await watch(page);
  await page.goto(origin);
  await expect(page.locator('.nd-greeting')).toBeVisible();
  await page.evaluate(() => {
    const s = document.createElement('script');
    s.textContent = 'window.__inlineRan = true';
    document.body.append(s);
    try { (0, eval)('1'); } catch { /* expected */ }
  });
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => (window as unknown as { __inlineRan?: boolean }).__inlineRan)).toBeUndefined();
  expect(violations.some((v) => v.startsWith('script-src'))).toBe(true);
});

test.describe('performance (production build)', () => {
  test('first paint and main thread stay within budget', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __ndLong: number };
      w.__ndLong = 0;
      new PerformanceObserver((l) => { for (const e of l.getEntries()) w.__ndLong += Math.max(0, e.duration - 50); })
        .observe({ type: 'longtask', buffered: true });
    });
    await page.goto(origin);
    await expect(page.locator('.nd-greeting')).toBeVisible();
    await page.waitForTimeout(1000);
    const m = await page.evaluate(() => ({
      fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? -1,
      blocking: (window as unknown as { __ndLong: number }).__ndLong,
    }));
    test.info().annotations.push({ type: 'perf', description: `FCP ${Math.round(m.fcp)} ms, blocking ${Math.round(m.blocking)} ms` });
    console.log(`FCP ${Math.round(m.fcp)} ms, total blocking ${Math.round(m.blocking)} ms`);
    // Budgets are loose on purpose (shared CI runners); a regression of several times will still trip them.
    expect(m.fcp).toBeGreaterThan(0);
    expect(m.fcp).toBeLessThan(1500);
    expect(m.blocking).toBeLessThan(300);
  });

  test('the live scene stops drawing while the tab is hidden', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __ndHidden: boolean; __ndFrames: number };
      w.__ndHidden = false;
      w.__ndFrames = 0;
      Object.defineProperty(Document.prototype, 'hidden', { configurable: true, get: () => w.__ndHidden });
      Object.defineProperty(Document.prototype, 'visibilityState', { configurable: true, get: () => (w.__ndHidden ? 'hidden' : 'visible') });
      const raf = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = (cb) => raf((t) => { w.__ndFrames++; cb(t); });
    });
    await page.goto(origin);
    await expect(page.locator('.nd-greeting')).toBeVisible();
    // Arasaka's corporate HUD is an animated canvas scene.
    await page.getByTitle('Open settings').click();
    await page.getByRole('radiogroup', { name: 'Theme' }).getByRole('radio', { name: /arasaka/i }).click();
    await page.keyboard.press('Escape');

    const frames = () => page.evaluate(() => (window as unknown as { __ndFrames: number }).__ndFrames);
    const setHidden = (h: boolean) => page.evaluate((v) => {
      (window as unknown as { __ndHidden: boolean }).__ndHidden = v;
      document.dispatchEvent(new Event('visibilitychange'));
    }, h);

    const a = await frames(); await page.waitForTimeout(1000);
    expect(await frames() - a).toBeGreaterThan(5); // animating while visible

    await setHidden(true);
    await page.waitForTimeout(100);
    const b = await frames(); await page.waitForTimeout(600);
    expect(await frames() - b).toBeLessThanOrEqual(1); // paused while hidden

    await setHidden(false);
    const c = await frames(); await page.waitForTimeout(1000);
    expect(await frames() - c).toBeGreaterThan(5); // resumes
  });
});
