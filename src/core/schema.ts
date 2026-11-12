import { cleanWidgetConfig } from '../widgets/configs';

export const SCHEMA_VERSION = 5;

export const THEME_IDS = ['edgerunners', 'arasaka', 'ghost', 'orchid'] as const;
export type ThemeId = (typeof THEME_IDS)[number];
export const LOCALES = ['en', 'tr'] as const;
export type Locale = (typeof LOCALES)[number];
export const SCANLINE_MODES = ['off', 'subtle', 'default', 'heavy'] as const;
export const CHAMFER_SIZES = ['off', 'sm', 'md', 'lg'] as const;
export const WIDGET_TYPES = ['weather', 'worldclock', 'scratchpad', 'tasks', 'pomodoro', 'ambient', 'ailinks'] as const;
export type WidgetType = (typeof WIDGET_TYPES)[number];
export const DEFAULT_CATEGORIES = ['daily', 'work', 'entertainment', 'social', 'other'] as const;

export interface Netlink {
  id: string;
  title: string;
  url: string;
  category: string;
  icon: { kind: 'svg' | 'favicon'; name?: string };
}
/** `url` is either a prefix the encoded query is appended to, or contains `%s` as the query slot. */
export interface SearchEngine { id: string; name: string; url: string; placeholder: string; visible: boolean }
export interface WidgetState { id: string; type: WidgetType; enabled: boolean; order: number; config?: unknown }

export interface Settings {
  schemaVersion: number;
  profile: { userName: string; locale: Locale };
  display: { timeFormat: '12h' | '24h'; showGreeting: boolean; showTime: boolean; showDate: boolean; showSearch: boolean; showQuotes: boolean; showNetlinks: boolean; showWidgets: boolean };
  theme: { id: ThemeId; scanlines: (typeof SCANLINE_MODES)[number]; glitch: boolean; chamfer: (typeof CHAMFER_SIZES)[number]; font: string; lowPower: boolean };
  background: { kind: 'scene' | 'image' | 'video'; sceneId?: string; mediaId?: string; brightness: number; vignette: boolean };
  audio: { uiSfx: boolean; volume: number; ambient: { track: 'off' | 'rain' | 'synthwave'; volume: number } };
  search: { engines: SearchEngine[]; active: string };
  netlinks: { items: Netlink[]; categoryOrder: string[]; collapsed: string[] };
  widgets: WidgetState[];
  tab: { title: string; icon: string };
}

export const defaultEngines = (): SearchEngine[] => [
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=', placeholder: '', visible: true },
  { id: 'duck', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=', placeholder: '', visible: true },
  { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=', placeholder: '', visible: false },
  { id: 'brave', name: 'Brave', url: 'https://search.brave.com/search?q=', placeholder: '', visible: false },
  // AI search (same ids as the Cyberstart export, so imports and defaults line up).
  { id: 'ai', name: 'ChatGPT', url: 'https://chatgpt.com/?q=', placeholder: '', visible: true },
  { id: 'ai2', name: 'Perplexity', url: 'https://www.perplexity.ai/search?q=', placeholder: '', visible: false },
  { id: 'brave2', name: 'Brave AI', url: 'https://search.brave.com/ask?q=', placeholder: '', visible: false },
  { id: 'brave3', name: 'Research', url: 'https://search.brave.com/ask?enable_research=true&q=', placeholder: '', visible: true },
  { id: 'youtube', name: 'YouTube', url: 'https://www.youtube.com/results?search_query=', placeholder: '', visible: true },
];

export const defaultWidgets = (): WidgetState[] => [
  { id: 'weather-1', type: 'weather', enabled: false, order: 0, config: cleanWidgetConfig('weather', undefined) },
  { id: 'worldclock-1', type: 'worldclock', enabled: false, order: 1, config: cleanWidgetConfig('worldclock', undefined) },
  { id: 'scratchpad-1', type: 'scratchpad', enabled: false, order: 2, config: cleanWidgetConfig('scratchpad', undefined) },
  { id: 'tasks-1', type: 'tasks', enabled: false, order: 3, config: cleanWidgetConfig('tasks', undefined) },
  { id: 'pomodoro-1', type: 'pomodoro', enabled: false, order: 4, config: cleanWidgetConfig('pomodoro', undefined) },
  { id: 'ambient-1', type: 'ambient', enabled: false, order: 5, config: cleanWidgetConfig('ambient', undefined) },
  { id: 'ai-1', type: 'ailinks', enabled: false, order: 6, config: cleanWidgetConfig('ailinks', undefined) },
];

export function browserLocale(): Locale {
  const lang = typeof navigator !== 'undefined' ? navigator.language ?? '' : '';
  return lang.toLowerCase().startsWith('tr') ? 'tr' : 'en';
}

export const defaultSettings = (locale: Locale = browserLocale()): Settings => ({
  schemaVersion: SCHEMA_VERSION,
  profile: { userName: '', locale },
  display: { timeFormat: '24h', showGreeting: true, showTime: true, showDate: true, showSearch: true, showQuotes: true, showNetlinks: true, showWidgets: true },
  theme: { id: 'edgerunners', scanlines: 'default', glitch: true, chamfer: 'md', font: 'default', lowPower: false },
  background: { kind: 'scene', sceneId: 'neon-grid', brightness: 100, vignette: true },
  audio: { uiSfx: false, volume: 0.4, ambient: { track: 'off', volume: 0.3 } },
  search: { engines: defaultEngines(), active: 'google' },
  netlinks: { items: [], categoryOrder: [...DEFAULT_CATEGORIES], collapsed: [] },
  widgets: defaultWidgets(),
  tab: { title: 'New Tab', icon: 'terminal' },
});
