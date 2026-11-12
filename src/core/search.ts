import type { SearchEngine } from './schema';
import { safeUrl } from './validate';

/** Build the navigation URL for a query. Explicit http(s) URLs are opened directly. */
export function buildSearchUrl(engine: SearchEngine, query: string): string | null {
  const q = query.trim();
  if (!q) return null;
  if (/^https?:\/\/\S+$/i.test(q)) return safeUrl(q);
  const enc = encodeURIComponent(q);
  return safeUrl(engine.url.includes('%s') ? engine.url.replace('%s', enc) : engine.url + enc);
}
