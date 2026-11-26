import { writeFileSync, mkdirSync } from 'node:fs';
import { test, open } from './fixtures';
import { measureContrast, type ContrastIssue } from './contrast';

/**
 * Contrast audit over every theme with its default wallpaper (report only, never fails).
 * Run with `npm run audit:contrast`; the report lands in test-results/contrast.md.
 * Text inside aria-hidden decoration is listed separately: WCAG exempts pure decoration.
 */
const THEMES = ['edgerunners', 'arasaka', 'samurai', 'ghost', 'orchid'];
const found: ContrastIssue[] = [];

test.use({ reducedMotion: 'reduce' });
test.describe.configure({ mode: 'serial' });

for (const theme of THEMES) {
  test(theme, async ({ page }) => {
    await open(page);
    await page.evaluate(async (t) => {
      const s = (await import('/src/core/schema.ts' as string)).defaultSettings('en');
      s.theme.id = t;
      s.display.showWidgets = true;
      s.widgets = s.widgets.map((w: { enabled: boolean }) => ({ ...w, enabled: true }));
      localStorage.setItem('settings', JSON.stringify(s));
    }, theme);
    await page.reload();
    await page.waitForTimeout(1500); // wallpaper decode + first scene frame
    found.push(...(await measureContrast(page, theme)));
    await page.getByTitle('Open settings').click();
    await page.waitForTimeout(700);
    found.push(...(await measureContrast(page, `${theme} (settings)`, '[role="dialog"]')));
  });
}

test.afterAll(() => {
  const row = (r: ContrastIssue) => `| ${r.theme} | ${r.ratio} : 1 (needs ${r.need}) | \`${r.selector}\` | ${r.text} |`;
  const head = '| Theme | Ratio | Element | Text |\n|---|---|---|---|';
  const text = found.filter((r) => !r.hidden).sort((a, b) => a.ratio - b.ratio);
  const decor = found.filter((r) => r.hidden).sort((a, b) => a.ratio - b.ratio);
  const md = [
    '# Contrast audit', '',
    'Measured from rendered pixels (wallpaper, scene and overlays included), worst tenth of each text box.', '',
    `## Readable text below WCAG AA (${text.length})`, '', head, ...text.map(row), '',
    `## Decorative text, aria-hidden (${decor.length})`, '', head, ...decor.map(row), '',
  ].join('\n');
  mkdirSync('test-results', { recursive: true });
  writeFileSync('test-results/contrast.md', md);
  console.log(md);
});
