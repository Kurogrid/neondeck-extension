import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { test, expect, open } from './fixtures';

const THEMES = ['edgerunners', 'arasaka', 'samurai', 'ghost', 'orchid'] as const;

/** Turns on every widget from the app's own default list, so the scan covers all of them. */
async function allWidgets(page: Page, theme: string): Promise<void> {
  await page.evaluate(async (themeId) => {
    const stored = localStorage.getItem('settings');
    const s = stored ? JSON.parse(stored) : (await import('/src/core/schema.ts' as string)).defaultSettings('en');
    s.theme.id = themeId;
    s.display.showWidgets = true;
    s.widgets = s.widgets.map((w: { enabled: boolean }) => ({ ...w, enabled: true }));
    localStorage.setItem('settings', JSON.stringify(s));
  }, theme);
  await page.reload();
  await expect(page.locator('.nd-greeting')).toBeVisible();
}

/** Runs axe (WCAG 2.1 A/AA) and returns one readable line per violating node. */
async function scan(page: Page, include?: string): Promise<string[]> {
  let builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);
  if (include) builder = builder.include(include);
  const { violations } = await builder.analyze();
  return violations.flatMap((v) =>
    v.nodes.map((n) => `${v.id}: ${n.target.join(' ')} — ${n.failureSummary?.split('\n').slice(1).join(' ').trim()}`),
  );
}

test.describe('accessibility (axe, WCAG 2.1 AA)', () => {
  // Animated glitch copies and canvas scenes change between frames; scan a still page.
  test.use({ reducedMotion: 'reduce' });

  for (const theme of THEMES) {
    test(`${theme}: deck with every widget`, async ({ page }) => {
      await open(page);
      await allWidgets(page, theme);
      expect(await scan(page)).toEqual([]);
    });

    test(`${theme}: settings drawer`, async ({ page }) => {
      await open(page);
      await allWidgets(page, theme);
      await page.getByTitle('Open settings').click();
      await expect(page.getByRole('dialog')).toBeVisible();
      expect(await scan(page, '[role="dialog"]')).toEqual([]);
    });
  }
});

test.describe('keyboard', () => {
  test('every control reached by Tab shows a visible focus ring', async ({ page }) => {
    await open(page);
    await allWidgets(page, 'edgerunners');
    const missing: string[] = [];
    for (let i = 0; i < 60; i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        const ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none';
        const label = el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent?.trim().slice(0, 30) || el.tagName;
        return { ring, label: `${el.tagName.toLowerCase()} "${label}"` };
      });
      if (!info) break;
      if (!info.ring) missing.push(info.label);
    }
    expect([...new Set(missing)]).toEqual([]);
  });

  test('the settings drawer keeps focus inside and returns it on close', async ({ page }) => {
    await open(page);
    const opener = page.getByTitle('Open settings');
    await opener.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    for (let i = 0; i < 80; i++) {
      await page.keyboard.press('Tab');
      expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });
});
