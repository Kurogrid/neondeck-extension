import { readFileSync, writeFileSync } from 'node:fs';
import { expect, open, saved, test } from './fixtures';

test.describe('first load', () => {
  test('renders the deck without errors or outside requests', async ({ page, external, errors }) => {
    await open(page);
    await expect(page.locator('.nd-greeting')).toContainText(/^(good (morning|afternoon|evening)|night shift), /i);
    await expect(page.getByRole('search').first()).toBeVisible();
    await page.waitForTimeout(1000);
    expect(errors).toEqual([]);
    expect(external).toEqual([]);
  });

  test('writes nothing to storage until the user changes something', async ({ page }) => {
    await open(page);
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => localStorage.getItem('settings'))).toBeNull();
  });

  test('screen readers get the greeting and clock once, not the glitch copies', async ({ page }) => {
    await open(page, { profile: { userName: 'Kai' } });
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(/^(good (morning|afternoon|evening)|night shift), kai$/i);
    const clock = await page.locator('.nd-clock').evaluate((el) => el.textContent);
    expect(clock).toMatch(/^\d{2}:?\d{2}/);
    const snapshot = await page.locator('.nd-chrono').ariaSnapshot();
    expect(snapshot.match(/kai/gi)?.length).toBe(1);
  });

  test('"/" focuses the search box', async ({ page }) => {
    await open(page);
    await page.locator('body').click({ position: { x: 5, y: 400 } });
    await page.keyboard.press('/');
    await expect(page.getByRole('searchbox', { name: 'Search query' })).toBeFocused();
  });
});

test.describe('netlinks', () => {
  test('adds a link that survives a reload', async ({ page }) => {
    await open(page);
    await page.getByRole('button', { name: 'Add link' }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Title').fill('Docs');
    await dialog.getByLabel('URL').fill('https://developer.mozilla.org/');
    await dialog.getByRole('button', { name: 'SAVE' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator('.nd-netlinks')).toContainText('Docs');
    await page.reload();
    await expect(page.locator('.nd-netlinks')).toContainText('Docs');
  });

  test('rejects non-http(s) addresses', async ({ page }) => {
    await open(page);
    await page.getByRole('button', { name: 'Add link' }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Title').fill('Bad');
    await dialog.getByLabel('URL').evaluate((el: HTMLInputElement) => { el.type = 'text'; });
    await dialog.getByLabel('URL').fill('javascript:alert(1)');
    await dialog.getByRole('button', { name: 'SAVE' }).click();
    await expect(dialog).toContainText('Enter a valid http(s) address.');
    expect((await saved(page)).netlinks?.items ?? []).toEqual([]);
  });
});

test.describe('settings', () => {
  test('switches theme and keeps it after a reload', async ({ page }) => {
    await open(page);
    await page.getByTitle('Open settings').click();
    await page.getByRole('radiogroup', { name: 'Theme' }).getByRole('radio', { name: 'Samurai' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'samurai');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'samurai');
  });

  test('closes the drawer with Escape', async ({ page }) => {
    await open(page);
    await page.getByTitle('Open settings').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('exports and imports a JSON backup', async ({ page }, info) => {
    await open(page, { profile: { userName: 'Kai' } });
    await page.getByTitle('Open settings').click();
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export JSON' }).click()]);
    const file = info.outputPath('backup.json');
    await download.saveAs(file);
    const backup = JSON.parse(readFileSync(file, 'utf8'));
    expect(JSON.stringify(backup)).toContain('Kai');

    // Change the name inside the backup and import it back.
    const edited = info.outputPath('edited.json');
    writeFileSync(edited, JSON.stringify(backup).replace('"Kai"', '"Tester"'));
    page.once('dialog', (d) => d.accept());
    await page.locator('input[type=file][accept*="json"]').setInputFiles(edited);
    await expect(page.getByRole('dialog')).toContainText('Settings imported.');
    await expect(page.locator('.nd-greeting')).toContainText(/tester/i);
  });

  test('refuses a file that is not a backup', async ({ page }, info) => {
    await open(page);
    await page.getByTitle('Open settings').click();
    const junk = info.outputPath('junk.json');
    writeFileSync(junk, '{"hello": "world"}');
    page.once('dialog', (d) => d.accept());
    await page.locator('input[type=file][accept*="json"]').setInputFiles(junk);
    await expect(page.getByRole('dialog')).toContainText('Unrecognized file format.');
  });
});

test.describe('widgets', () => {
  test('reorders widgets from the manager', async ({ page }) => {
    await open(page, {
      widgets: [
        { id: 'pomodoro-1', type: 'pomodoro', enabled: true, order: 0 },
        { id: 'ai-1', type: 'ailinks', enabled: true, order: 1 },
        { id: 'tasks-1', type: 'tasks', enabled: true, order: 2 },
      ],
    });
    const titles = page.locator('.nd-widget .nd-widget__title');
    const before = await titles.allInnerTexts();
    expect(before.length).toBeGreaterThan(1);
    const first = before[0]!.trim();
    await page.getByRole('button', { name: 'Manage widgets' }).click();
    await page.locator('.nd-wm').getByRole('button', { name: new RegExp(`^Move ${first} down$`, 'i') }).click();
    await page.getByRole('button', { name: 'Manage widgets' }).click();
    const after = (await titles.allInnerTexts()).map((s) => s.trim());
    expect(after[0]).not.toBe(first);
    expect(after).toContain(first);
  });
});

test.describe('privacy', () => {
  test('loads Spotify only after the user opens the radio', async ({ page, external }) => {
    await open(page, {
      widgets: [{ id: 'ambient-1', type: 'ambient', enabled: true, order: 0, config: {} }],
    });
    await page.waitForTimeout(1500);
    await expect(page.locator('iframe[src*="open.spotify.com"]')).toHaveCount(0);
    expect(external.filter((u) => u.includes('spotify'))).toEqual([]);

    await page.locator('.nd-widget--ambient').getByRole('tab', { name: 'Radio' }).click();
    await expect(page.locator('iframe[src*="open.spotify.com"]')).toHaveCount(1);
  });

  test('weather sends nothing until a city is chosen', async ({ page, external }) => {
    await open(page, {
      widgets: [{ id: 'weather-1', type: 'weather', enabled: true, order: 0, config: { location: null, unit: 'c' } }],
    });
    await page.waitForTimeout(1500);
    expect(external).toEqual([]);
  });
});

test.describe('motion', () => {
  test('honours reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page);
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    const a = await canvas.screenshot();
    await page.waitForTimeout(800);
    const b = await canvas.screenshot();
    expect(Buffer.compare(a, b)).toBe(0);
  });
});
