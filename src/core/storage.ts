import { ext } from './ext';
import { migrate } from './migrations';
import { defaultSettings, type Settings } from './schema';
import { sanitizeSettings } from './validate';

const KEY = 'settings';

/** True inside the extension. In `npm run dev` (plain web page) we fall back to localStorage. */
const hasChromeStorage = () => !!ext?.storage?.local;

const fromRaw = (raw: unknown): Settings => (raw ? sanitizeSettings(migrate(raw).data) : defaultSettings());

export async function loadSettings(): Promise<Settings> {
  try {
    if (hasChromeStorage()) return fromRaw((await ext!.storage.local.get(KEY))[KEY]);
    const txt = localStorage.getItem(KEY);
    return fromRaw(txt ? JSON.parse(txt) : null);
  } catch { return defaultSettings(); }
}

export async function saveSettings(s: Settings): Promise<void> {
  try {
    if (hasChromeStorage()) await ext!.storage.local.set({ [KEY]: s });
    else localStorage.setItem(KEY, JSON.stringify(s));
  } catch { /* best-effort: quota or dev mode */ }
}

/**
 * Notifies when another tab changes the settings. `rawJson` lets the caller
 * ignore echoes of its own writes.
 */
export function subscribeSettings(cb: (s: Settings, rawJson: string) => void): () => void {
  try {
    if (hasChromeStorage()) {
      const fn = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
        if (area === 'local' && changes[KEY]) cb(fromRaw(changes[KEY].newValue), JSON.stringify(changes[KEY].newValue));
      };
      ext!.storage.onChanged.addListener(fn);
      return () => ext!.storage.onChanged.removeListener(fn);
    }
    const fn = (e: StorageEvent) => {
      if (e.key === KEY && e.newValue) cb(fromRaw(JSON.parse(e.newValue)), e.newValue);
    };
    window.addEventListener('storage', fn);
    return () => window.removeEventListener('storage', fn);
  } catch { return () => {}; }
}
