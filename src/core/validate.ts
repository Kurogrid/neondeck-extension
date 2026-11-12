import {
  CHAMFER_SIZES, LOCALES, SCANLINE_MODES, THEME_IDS, WIDGET_TYPES, defaultSettings,
  type Netlink, type SearchEngine, type Settings, type WidgetState,
} from './schema';
import { bool, isObj, num, oneOf, safeUrl, slug, str } from './guards';
import { cleanWidgetConfig } from '../widgets/configs';

export { isObj, safeUrl, slug } from './guards';

/** Search engine templates must be http(s); `%s` (query slot) is preserved. */
export function safeEngineUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const probe = safeUrl(raw.replace('%s', 'QUERY'));
  return probe ? raw.trim() : null;
}

const uniqueId = (wanted: string, used: Set<string>) => {
  let id = wanted || crypto.randomUUID();
  while (used.has(id)) id = `${wanted}-${Math.random().toString(36).slice(2, 6)}`;
  used.add(id);
  return id;
};

export function cleanNetlinks(v: unknown): Netlink[] {
  if (!Array.isArray(v)) return [];
  const out: Netlink[] = [];
  const used = new Set<string>();
  for (const n of v.slice(0, 500)) {
    if (!isObj(n)) continue;
    const url = safeUrl(n.url);
    const category = slug(str(n.category, 40, '')) || 'other';
    const rawTitle = str(n.title, 80, '');
    // Titles imported from browser bookmarks may carry a tab counter like "(5) "; strip it there only.
    const title = category === 'bookmarks' ? rawTitle.replace(/^\(\d+\+?\)\s*/, '') || rawTitle : rawTitle;
    if (!url || !title) continue;
    const icon = isObj(n.icon) ? n.icon : {};
    out.push({
      id: uniqueId(str(n.id, 64, ''), used),
      title,
      url,
      category,
      icon: icon.kind === 'favicon' ? { kind: 'favicon' } : { kind: 'svg', name: slug(str(icon.name, 40, '')) || 'link' },
    });
  }
  return out;
}

function cleanEngines(v: unknown): SearchEngine[] {
  if (!Array.isArray(v)) return [];
  const out: SearchEngine[] = [];
  const used = new Set<string>();
  for (const e of v.slice(0, 30)) {
    if (!isObj(e)) continue;
    const url = safeEngineUrl(e.url);
    const name = str(e.name, 30, '');
    if (!url || !name) continue;
    out.push({ id: uniqueId(slug(str(e.id, 40, '')) || slug(name), used), name, url, placeholder: str(e.placeholder, 80, ''), visible: bool(e.visible, true) });
  }
  return out;
}

function cleanWidgets(v: unknown, fallback: WidgetState[]): WidgetState[] {
  const out: WidgetState[] = [];
  const used = new Set<string>();
  if (Array.isArray(v)) {
    for (const w of v.slice(0, 50)) {
      if (!isObj(w) || !(WIDGET_TYPES as readonly unknown[]).includes(w.type)) continue;
      const item: WidgetState = {
        id: uniqueId(str(w.id, 40, ''), used),
        type: w.type as WidgetState['type'],
        enabled: bool(w.enabled, false),
        order: num(w.order, 0, 999, out.length),
      };
      item.config = cleanWidgetConfig(item.type, w.config);
      out.push(item);
    }
  }
  // Every widget type must exist once so the drawer can toggle it; restored ones go after existing ones.
  let next = out.reduce((m, w) => Math.max(m, w.order), -1) + 1;
  for (const d of fallback) {
    if (!out.some((w) => w.type === d.type)) out.push({ ...d, id: uniqueId(d.id, used), order: next++, config: cleanWidgetConfig(d.type, undefined) });
  }
  return out.sort((a, b) => a.order - b.order).map((w, i) => ({ ...w, order: i }));
}

/** Merge untrusted JSON onto defaults. Unknown fields are dropped; every value is type-checked. */
export function sanitizeSettings(input: unknown): Settings {
  const d = defaultSettings();
  if (!isObj(input)) return d;
  const s = defaultSettings(d.profile.locale);
  const g = (k: string) => (isObj(input[k]) ? (input[k] as Record<string, unknown>) : {});

  const profile = g('profile');
  s.profile = { userName: str(profile.userName, 40, ''), locale: oneOf(profile.locale, LOCALES, d.profile.locale) };

  const display = g('display');
  s.display = {
    timeFormat: oneOf(display.timeFormat, ['12h', '24h'] as const, d.display.timeFormat),
    showGreeting: bool(display.showGreeting, true), showTime: bool(display.showTime, true), showDate: bool(display.showDate, true),
    showSearch: bool(display.showSearch, true), showQuotes: bool(display.showQuotes, true), showNetlinks: bool(display.showNetlinks, true),
    showWidgets: bool(display.showWidgets, true),
  };

  const theme = g('theme');
  s.theme = {
    id: oneOf(theme.id, THEME_IDS, d.theme.id),
    scanlines: oneOf(theme.scanlines, SCANLINE_MODES, d.theme.scanlines),
    glitch: bool(theme.glitch, d.theme.glitch),
    chamfer: oneOf(theme.chamfer, CHAMFER_SIZES, d.theme.chamfer),
    font: slug(str(theme.font, 40, '')) || 'default',
    lowPower: bool(theme.lowPower, false),
  };

  const bg = g('background');
  const kind = oneOf(bg.kind, ['scene', 'image', 'video'] as const, 'scene');
  const mediaId = str(bg.mediaId, 64, '');
  s.background = { kind: kind !== 'scene' && !mediaId ? 'scene' : kind, brightness: num(bg.brightness, 10, 150, 100), vignette: bool(bg.vignette, true) };
  if (s.background.kind === 'scene') s.background.sceneId = slug(str(bg.sceneId, 40, '')) || d.background.sceneId;
  else s.background.mediaId = mediaId;

  const audio = g('audio');
  const ambient = isObj(audio.ambient) ? audio.ambient : {};
  s.audio = {
    uiSfx: bool(audio.uiSfx, false), volume: num(audio.volume, 0, 1, d.audio.volume),
    ambient: { track: oneOf(ambient.track, ['off', 'rain', 'synthwave'] as const, 'off'), volume: num(ambient.volume, 0, 1, d.audio.ambient.volume) },
  };

  const search = g('search');
  const engines = Array.isArray(search.engines) ? cleanEngines(search.engines) : d.search.engines;
  s.search.engines = engines.length ? engines : d.search.engines;
  const visible = s.search.engines.filter((e) => e.visible);
  if (!visible.length) s.search.engines[0]!.visible = true;
  const active = s.search.engines.find((e) => e.id === search.active && e.visible);
  s.search.active = active?.id ?? s.search.engines.find((e) => e.visible)!.id;

  const nl = g('netlinks');
  const items = cleanNetlinks(nl.items);
  const order = Array.isArray(nl.categoryOrder)
    ? nl.categoryOrder.filter((c): c is string => typeof c === 'string').map((c) => slug(c)).filter(Boolean)
    : [...d.netlinks.categoryOrder];
  for (const it of items) order.push(it.category);
  const categoryOrder = [...new Set(order)].slice(0, 50);
  const collapsed = Array.isArray(nl.collapsed) ? nl.collapsed.filter((c): c is string => typeof c === 'string' && categoryOrder.includes(c)) : [];
  s.netlinks = { items, categoryOrder, collapsed: [...new Set(collapsed)] };

  s.widgets = cleanWidgets(input.widgets, d.widgets);

  const tab = g('tab');
  s.tab = { title: str(tab.title, 60, '') || d.tab.title, icon: slug(str(tab.icon, 40, '')) || d.tab.icon };
  return s;
}
