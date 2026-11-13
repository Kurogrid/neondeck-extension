import { describe, expect, it } from 'vitest';
// Anonymized copies of real Cyberstart exports (structure kept, names changed).
import shortExport from './__fixtures__/cyberstart-export.json?raw';
import fullExport from './__fixtures__/cyberstart-export-full.json?raw';
import { migrate } from './migrations';
import { SCHEMA_VERSION, defaultSettings } from './schema';
import { ImportError, MAX_IMPORT_BYTES, exportJson, importJson } from './transfer';

const FIXTURES: Record<string, string> = { 'cyberstart-export.json': shortExport, 'cyberstart-export-tam.json': fullExport };
const fixture = (name: string) => FIXTURES[name]!;
const errCode = (fn: () => unknown) => { try { fn(); } catch (e) { return e instanceof ImportError ? e.code : 'other'; } return 'none'; };

describe('Cyberstart import (full reference export)', () => {
  const r = importJson(fixture('cyberstart-export-tam.json'));
  const s = r.settings;

  it('is detected as cyberstart', () => expect(r.source).toBe('cyberstart'));
  it('keeps all six links with categories and icons', () => {
    expect(s.netlinks.items).toHaveLength(6);
    expect(s.netlinks.items[0]).toMatchObject({ id: '1', title: 'City News', url: 'https://github.com/', category: 'daily', icon: { kind: 'svg', name: 'news' } });
    expect(s.netlinks.items.map((l) => l.icon.name)).toContain('brain');
    expect(s.netlinks.categoryOrder.slice(0, 5)).toEqual(['daily', 'work', 'entertainment', 'social', 'other']);
  });
  it('drops the browser-default engine and falls back to the first visible one', () => {
    expect(s.search.engines.map((e) => e.id)).toEqual(['google', 'bing', 'duck', 'ai', 'ai2', 'brave', 'brave2', 'brave3']);
    expect(s.search.active).toBe('google');
    expect(s.search.engines.find((e) => e.id === 'bing')).toMatchObject({ name: 'Bing', visible: false });
    expect(s.search.engines.filter((e) => e.visible).map((e) => e.id)).toEqual(['google', 'ai', 'brave3']);
  });
  it('reports what could not be carried over', () => {
    expect(r.warnings).toContain('defaultEngineDropped');
    expect(r.warnings).toContain('remoteBackgroundDropped');
    expect(r.warnings).not.toContain('rssDropped'); // rss was disabled with no feed
    expect(s.background.kind).toBe('scene');
  });
  it('maps profile, display and theme', () => {
    expect(s.profile.userName).toBe('Runner');
    expect(s.display).toMatchObject({ timeFormat: '24h', showSearch: true, showWidgets: true });
    expect(s.theme).toMatchObject({ id: 'edgerunners', scanlines: 'default' });
    expect(s.tab).toEqual({ title: 'Night Deck', icon: 'terminal' });
  });
  it('maps widgets, keeps their order and adds NEONDECK-only widgets', () => {
    expect(s.widgets.slice(0, 4).map((w) => [w.id, w.type, w.enabled])).toEqual([
      ['weather-1', 'weather', true], ['worldclock-1', 'worldclock', true], ['scratchpad-1', 'scratchpad', false], ['tasklist-1', 'tasks', false],
    ]);
    expect(s.widgets[0]!.config).toEqual({ location: { name: 'Neon Bay', latitude: 37.7749, longitude: -122.4194 }, unit: 'c' });
    expect(new Set(s.widgets.map((w) => w.type))).toEqual(new Set(['weather', 'worldclock', 'scratchpad', 'tasks', 'pomodoro', 'ambient', 'ailinks']));
    expect(s.widgets.map((w) => w.order)).toEqual(s.widgets.map((_, i) => i));
  });
});

describe('Cyberstart import (short brief export)', () => {
  it('imports without errors', () => {
    const r = importJson(fixture('cyberstart-export.json'));
    expect(r.source).toBe('cyberstart');
    expect(r.settings.netlinks.items.length).toBeGreaterThan(0);
    expect(r.settings.search.engines.some((e) => e.url.startsWith('chrome-extension-search'))).toBe(false);
  });
  it('warns about enabled RSS and unsafe links', () => {
    const r = importJson(JSON.stringify({
      bookmarks: [{ id: 'x', title: 'bad', url: 'javascript:alert(1)' }, { id: 'y', title: 'ok', url: 'https://ok.example' }],
      widgets: [{ id: 'rss-1', type: 'rss', enabled: true, config: { feedUrl: 'https://feed.example/rss' } }],
    }));
    expect(r.settings.netlinks.items.map((l) => l.id)).toEqual(['y']);
    expect(r.warnings).toEqual(expect.arrayContaining(['linksDropped', 'rssDropped']));
  });
});

describe('NEONDECK backup', () => {
  it('round-trips export -> import', () => {
    const s = defaultSettings('tr');
    s.profile.userName = 'Ege';
    s.netlinks.items.push({ id: 'a', title: 'A', url: 'https://a.example/', category: 'work', icon: { kind: 'favicon' } });
    const r = importJson(exportJson(s));
    expect(r.source).toBe('neondeck');
    expect(r.warnings).toEqual([]);
    expect(r.settings).toEqual(s);
  });
  it('flags backups from a newer version', () => {
    const r = importJson(JSON.stringify({ app: 'neondeck', schemaVersion: SCHEMA_VERSION + 1 }));
    expect(r.warnings).toEqual(['newerVersion']);
  });
  it('rejects bad input with specific codes', () => {
    expect(errCode(() => importJson('{nope'))).toBe('invalidJson');
    expect(errCode(() => importJson('[1,2]'))).toBe('unknownFormat');
    expect(errCode(() => importJson('{"hello":1}'))).toBe('unknownFormat');
    expect(errCode(() => importJson(' '.repeat(MAX_IMPORT_BYTES + 1)))).toBe('tooLarge');
  });
});

describe('migrate', () => {
  it('theme ids survive v5 -> v6 -> v7 and v6 ids map back', () => {
    for (const [from, to] of [['edgerunners', 'edgerunners'], ['arasaka', 'arasaka'], ['ghost', 'ghost'], ['orchid', 'orchid']])
      expect(importJson(JSON.stringify({ schemaVersion: 5, theme: { id: from } })).settings.theme.id).toBe(to);
    for (const [from, to] of [['pulse', 'edgerunners'], ['protocol', 'arasaka'], ['phantom', 'ghost']])
      expect(importJson(JSON.stringify({ schemaVersion: 6, theme: { id: from } })).settings.theme.id).toBe(to);
  });
  it('v5 removes the Claude / Gemini engines NEONDECK added, keeps user ones', () => {
    const v4 = { schemaVersion: 4, search: { active: 'claude', engines: [
      { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=', visible: true },
      { id: 'claude', name: 'Claude', url: 'https://claude.ai/new#nd-q=', visible: true },
      { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com/app?q=', visible: true },
      { id: 'mine', name: 'Mine', url: 'https://claude.ai/new?q=%s&x=1', visible: true },
    ] } };
    const s = importJson(JSON.stringify(v4)).settings;
    expect(s.search.engines.map((e) => e.id)).toEqual(['google', 'mine']);
    expect(s.search.active).toBe('google');
  });
  it('v1 -> latest adds the new default engines once, keeping user engines', () => {
    const v1 = { schemaVersion: 1, search: { active: 'google', engines: [
      { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=', visible: true },
      { id: 'mine', name: 'GPT', url: 'https://www.chatgpt.com/?q=', visible: false },
    ] } };
    const s = importJson(JSON.stringify(v1)).settings;
    expect(s.schemaVersion).toBe(SCHEMA_VERSION);
    expect(s.search.engines.map((e) => [e.id, e.visible])).toEqual([['google', true], ['mine', false], ['ai2', false], ['brave2', false], ['brave3', true], ['youtube', true]]);
    expect(importJson(JSON.stringify({ ...v1, schemaVersion: 2 })).settings.search.engines.map((e) => e.id)).toEqual(['google', 'mine', 'youtube']);
  });
  it('treats a missing version as v1', () => expect(migrate({ profile: {} })).toMatchObject({ fromVersion: 1, newer: false, data: { schemaVersion: SCHEMA_VERSION } }));
  it('passes non-objects through', () => expect(migrate('x').data).toBe('x'));
});
