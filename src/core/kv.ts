import { ext } from './ext';
/**
 * Small key/value store for data that must NOT go into settings/backups (e.g. network caches).
 * chrome.storage.local in the extension, localStorage in `npm run dev`.
 */
const hasChromeStorage = () => !!ext?.storage?.local;
const PREFIX = 'kv:';

export async function kvGet<T>(key: string): Promise<T | null> {
  try {
    if (hasChromeStorage()) return ((await ext!.storage.local.get(PREFIX + key))[PREFIX + key] as T | undefined) ?? null;
    const txt = localStorage.getItem(PREFIX + key);
    return txt ? (JSON.parse(txt) as T) : null;
  } catch { return null; }
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  try {
    if (hasChromeStorage()) await ext!.storage.local.set({ [PREFIX + key]: value });
    else localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch { /* best-effort cache */ }
}
