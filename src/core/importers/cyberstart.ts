import { SCHEMA_VERSION, THEME_IDS, defaultWidgets, type WidgetType } from '../schema';
import { isObj, safeUrl, slug } from '../validate';
import type { ImportWarning } from '../transfer';

/**
 * Converter for the export format of the reference "Cyberstart" new tab extension
 * (fixtures: docs/referans/cyberstart-export*.json).
 *
 * Format assumptions (checked against the user's screenshots):
 * - `temperatureUnit: true` = Celsius, `timeFormat: true` = 24h.
 * - `searchEngines[].url` is a query prefix; `chrome-extension-search://` is the browser default engine,
 *   which needs the `search` permission and is therefore dropped.
 * - `background` may be a remote URL; remote media is not allowed (CSP/offline), so it falls back to a scene.
 */

export const looksLikeCyberstart = (o: Record<string, unknown>) =>
  !('schemaVersion' in o) && (Array.isArray(o.bookmarks) || Array.isArray(o.searchEngines) || typeof o.colorTheme === 'string');

const WIDGET_MAP: Record<string, WidgetType> = { weather: 'weather', worldclock: 'worldclock', scratchpad: 'scratchpad', tasklist: 'tasks', tasks: 'tasks' };
const SCANLINES: Record<string, string> = { off: 'off', none: 'off', subtle: 'subtle', light: 'subtle', default: 'default', heavy: 'heavy', strong: 'heavy' };

const location = (v: unknown) =>
  isObj(v) && typeof v.latitude === 'number' && typeof v.longitude === 'number'
    ? { name: typeof v.name === 'string' ? v.name.trim().slice(0, 60) : '', latitude: v.latitude, longitude: v.longitude }
    : undefined;

function categoryId(c: unknown): string {
  if (typeof c === 'string') return slug(c);
  if (isObj(c)) return slug(String(c.id ?? c.name ?? ''));
  return '';
}

/** Returns an object in NEONDECK's settings shape (still untrusted: caller must sanitize). */
export function convertCyberstart(o: Record<string, unknown>): { data: Record<string, unknown>; warnings: ImportWarning[] } {
  const warnings: ImportWarning[] = [];
  const bool = (v: unknown, fb: boolean) => (typeof v === 'boolean' ? v : fb);

  // Netlinks
  const bookmarks = Array.isArray(o.bookmarks) ? o.bookmarks.filter(isObj) : [];
  const items = bookmarks.map((b) => ({
    id: b.id,
    title: b.title,
    url: b.url,
    category: b.category,
    icon: { kind: 'svg', name: typeof b.icon === 'string' ? b.icon : 'link' },
  }));
  const dropped = bookmarks.filter((b) => !safeUrl(b.url) || typeof b.title !== 'string' || !b.title.trim()).length;
  if (dropped) warnings.push('linksDropped');
  const categoryOrder = [
    ...(Array.isArray(o.categoryOrder) ? o.categoryOrder.map(categoryId) : []),
    ...(Array.isArray(o.customCategories) ? o.customCategories.map(categoryId) : []),
  ].filter(Boolean);
  const collapsed = isObj(o.collapsedCategories)
    ? Object.entries(o.collapsedCategories).filter(([, v]) => v === true).map(([k]) => slug(k))
    : [];

  // Search engines
  const rawEngines = Array.isArray(o.searchEngines) ? o.searchEngines.filter(isObj) : [];
  const sorted = [...rawEngines].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
  const isBrowserDefault = (e: Record<string, unknown>) => typeof e.url === 'string' && e.url.startsWith('chrome-extension-search:');
  if (sorted.some((e) => isBrowserDefault(e) && (e.visible === true || e.id === o.activeSearchEngine))) warnings.push('defaultEngineDropped');
  const engines = sorted
    .filter((e) => !isBrowserDefault(e))
    .map((e) => ({ id: e.id, name: e.name, url: e.url, placeholder: e.placeholder, visible: bool(e.visible, true) }));

  // Background
  if (typeof o.background === 'string' && o.background.trim()) warnings.push('remoteBackgroundDropped');

  // Widgets
  const order = Array.isArray(o.widgetOrder) ? o.widgetOrder.map(String) : [];
  const rawWidgets = Array.isArray(o.widgets) ? o.widgets.filter(isObj) : [];
  const widgets: Record<string, unknown>[] = [];
  for (const w of rawWidgets) {
    const type = WIDGET_MAP[String(w.type)];
    const cfg = isObj(w.config) ? w.config : {};
    if (!type) {
      if (w.type === 'rss' && (w.enabled === true || (typeof cfg.feedUrl === 'string' && cfg.feedUrl.trim()))) warnings.push('rssDropped');
      continue;
    }
    let config: Record<string, unknown> = {};
    if (type === 'weather') config = { location: location(cfg.location) ?? location(o.weatherLocation), unit: bool(cfg.temperatureUnit ?? o.temperatureUnit, true) ? 'c' : 'f' };
    if (type === 'worldclock') config = { location: location(cfg.location), timeFormat: bool(cfg.timeFormat, true) ? '24h' : '12h', showDate: bool(cfg.showDate, true) };
    if (type === 'scratchpad') config = { content: typeof cfg.content === 'string' ? cfg.content.slice(0, 1_000_000) : '' };
    if (type === 'tasks') config = { tasks: Array.isArray(cfg.tasks) ? cfg.tasks.filter(isObj).slice(0, 500) : [] };
    const idx = order.indexOf(String(w.id));
    widgets.push({ id: w.id, type, enabled: bool(w.enabled, false), order: idx >= 0 ? idx : 100 + widgets.length, config });
  }
  // Types the reference extension lacks (pomodoro, ambient, ai links) keep NEONDECK defaults, placed after imported ones.
  for (const d of defaultWidgets()) if (!widgets.some((w) => w.type === d.type)) widgets.push({ ...d, order: 200 + d.order });

  const dp = isObj(o.displayPreferences) ? o.displayPreferences : {};
  // Cyberstart theme names -> NEONDECK theme ids.
  const CYBERSTART_THEMES: Record<string, (typeof THEME_IDS)[number]> = { edgerunners: 'pulse', arasaka: 'protocol', ghost: 'phantom' };
  const theme = typeof o.colorTheme === 'string' ? CYBERSTART_THEMES[o.colorTheme] : undefined;

  return {
    warnings: [...new Set(warnings)],
    data: {
      schemaVersion: SCHEMA_VERSION,
      profile: { userName: o.userName },
      display: {
        timeFormat: bool(o.timeFormat, true) ? '24h' : '12h',
        showGreeting: dp.showGreeting, showTime: dp.showTime, showDate: dp.showDate, showSearch: dp.showSearchBar,
        showQuotes: dp.showQuotes, showNetlinks: dp.showNetlinks, showWidgets: dp.showWidgets,
      },
      theme: { id: theme, scanlines: SCANLINES[String(o.scanLinesMode)], font: o.selectedFont },
      background: { kind: 'scene', brightness: o.backgroundBrightness, vignette: o.backgroundVignette },
      search: { engines, active: o.activeSearchEngine },
      netlinks: { items, categoryOrder, collapsed },
      widgets,
      tab: { title: o.tabTitle, icon: o.tabFavicon },
    },
  };
}
