import { describe, expect, it } from 'vitest';
import { flattenBookmarks } from './bookmarks';
import { clockParts, dayPart } from './clock';
import { categoryLabel, t } from './i18n';
import { groupNetlinks, shortcutLinks } from './netlinks';
import { THEME_IDS, defaultSettings, type Netlink } from './schema';
import { buildSearchUrl } from './search';
import { applyTheme } from './theme-engine';
import { sanitizeSettings } from './validate';

const link = (id: string, category: string): Netlink => ({ id, title: id, url: `https://${id}.example/`, category, icon: { kind: 'svg', name: 'link' } });

describe('sanitizeSettings (full)', () => {
  it('rejects unsafe or broken search engines and repairs active', () => {
    const s = sanitizeSettings({ search: { engines: [
      { id: 'evil', name: 'Evil', url: 'javascript:alert(%s)', visible: true },
      { id: 'x', name: 'X', url: 'https://x.example/?q=%s', visible: false },
    ], active: 'evil' } });
    expect(s.search.engines).toHaveLength(1);
    expect(s.search.engines[0]).toMatchObject({ id: 'x', visible: true });
    expect(s.search.active).toBe('x');
  });
  it('restores missing widget types and normalizes order', () => {
    const s = sanitizeSettings({ widgets: [{ id: 'p', type: 'pomodoro', enabled: true, order: 9 }, { type: 'bogus' }] });
    expect(s.widgets[0]).toMatchObject({ id: 'p', type: 'pomodoro', order: 0 });
    expect(s.widgets).toHaveLength(7);
  });
  it('keeps link categories in categoryOrder and filters stale collapsed entries', () => {
    const s = sanitizeSettings({ netlinks: { items: [link('a', 'Side Projects')], categoryOrder: ['work'], collapsed: ['work', 'ghost-cat'] } });
    expect(s.netlinks.items[0]!.category).toBe('side-projects');
    expect(s.netlinks.categoryOrder).toEqual(['work', 'side-projects']);
    expect(s.netlinks.collapsed).toEqual(['work']);
  });
  it('dedupes link ids and clamps numbers', () => {
    const s = sanitizeSettings({ netlinks: { items: [link('a', 'work'), link('a', 'work')] }, background: { kind: 'image', brightness: 9999 } });
    expect(new Set(s.netlinks.items.map((l) => l.id)).size).toBe(2);
    expect(s.background).toMatchObject({ kind: 'scene', brightness: 150 });
  });
  it('is idempotent on its own output', () => {
    const s = sanitizeSettings({ netlinks: { items: [link('a', 'work')] } });
    expect(sanitizeSettings(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });
});

describe('buildSearchUrl', () => {
  const eng = { id: 'g', name: 'G', url: 'https://g.example/search?q=', placeholder: '', visible: true };
  it('appends the encoded query', () => expect(buildSearchUrl(eng, ' a&b ')).toBe('https://g.example/search?q=a%26b'));
  it('fills %s templates', () => expect(buildSearchUrl({ ...eng, url: 'https://x.example/%s/r' }, 'ç ö')).toBe('https://x.example/%C3%A7%20%C3%B6/r'));
  it('opens explicit URLs directly', () => expect(buildSearchUrl(eng, 'https://github.com')).toBe('https://github.com/'));
  it('never navigates to javascript:', () => expect(buildSearchUrl(eng, 'javascript:alert(1)')).toBe('https://g.example/search?q=javascript%3Aalert(1)'));
  it('ignores empty queries', () => expect(buildSearchUrl(eng, '   ')).toBeNull());
});

describe('clock', () => {
  it('splits the day', () => expect([4, 5, 12, 17, 22].map(dayPart)).toEqual(['night', 'morning', 'afternoon', 'evening', 'night']));
  it('formats 24h and 12h', () => {
    const d = new Date(2026, 10, 12, 16, 5);
    expect(clockParts(d, 'tr', '24h')).toEqual({ hours: '16', minutes: '05', period: '' });
    expect(clockParts(d, 'en', '12h')).toMatchObject({ hours: '04', minutes: '05', period: 'PM' });
  });
});

describe('netlinks', () => {
  const items = [link('a', 'work'), link('b', 'daily'), link('c', 'custom'), link('d', 'daily')];
  const groups = groupNetlinks(items, ['daily', 'work', 'social']);
  it('groups by category order, appends unknown, skips empty', () =>
    expect(groups.map((g) => [g.category, g.items.map((i) => i.id)])).toEqual([['daily', ['b', 'd']], ['work', ['a']], ['custom', ['c']]]));
  it('maps shortcuts 1-9 to visible links in display order', () => {
    expect(shortcutLinks(groups, []).map((l) => l.id)).toEqual(['b', 'd', 'a', 'c']);
    expect(shortcutLinks(groups, ['daily']).map((l) => l.id)).toEqual(['a', 'c']);
  });
});

describe('flattenBookmarks', () => {
  it('walks folders, keeps http(s), skips duplicates', () => {
    const tree = [{ children: [{ title: 'Bar', children: [{ title: 'A', url: 'https://a.example' }, { title: 'JS', url: 'javascript:void 0' }] }, { title: '', url: 'https://b.example/x' }, { title: 'dup', url: 'https://c.example' }] }];
    const out = flattenBookmarks(tree, new Set(['https://c.example/']));
    expect(out.map((l) => [l.title, l.url, l.category])).toEqual([['A', 'https://a.example/', 'bookmarks'], ['b.example', 'https://b.example/x', 'bookmarks']]);
  });
  it('strips tab unread counters from bookmark titles', () => {
    const out = flattenBookmarks([{ title: '(5) Pinterest', url: 'https://p.example' }, { title: '(99+) Mail', url: 'https://m.example' }, { title: '(12)', url: 'https://n.example' }], new Set());
    expect(out.map((l) => l.title)).toEqual(['Pinterest', 'Mail', 'n.example']);
  });
  it('cleans counters already saved in the bookmarks category only', () => {
    const s = sanitizeSettings({ netlinks: { items: [
      { id: 'a', title: '(5) Pinterest', url: 'https://p.example', category: 'bookmarks' },
      { id: 'b', title: '(1) Plan', url: 'https://q.example', category: 'work' },
    ] } });
    expect(s.netlinks.items.map((l) => l.title)).toEqual(['Pinterest', '(1) Plan']);
  });
});

describe('theme engine', () => {
  it('writes data attributes and lang', () => {
    const root = { dataset: {} as Record<string, string | undefined>, lang: '' };
    const s = defaultSettings('tr');
    s.theme.lowPower = true;
    applyTheme(root, s);
    expect(root).toEqual({ lang: 'tr', dataset: { theme: 'edgerunners', scanlines: 'default', chamfer: 'md', glitch: 'on', power: 'low', font: 'default' } });
  });
});

describe('i18n', () => {
  it('interpolates and labels categories', () => {
    expect(t('tr', 'bookmarksImported', { count: 3 })).toContain('3');
    expect(categoryLabel('tr', 'daily')).toBe('Günlük');
    expect(categoryLabel('en', 'side-projects')).toBe('side projects');
  });
  it('never shows a brand name as a visible theme label', () => {
    for (const l of ['en', 'tr'] as const) for (const id of THEME_IDS) {
      expect(t(l, `theme_${id}`)).not.toMatch(/edgerunner|arasaka|ghost in the shell|cyberpunk/i);
    }
  });
});
