import { SCHEMA_VERSION, defaultEngines } from './schema';
import { isObj } from './validate';

type Raw = Record<string, unknown>;

/**
 * Upgrade steps: `steps[n]` turns a version-n object into version n+1.
 * Add a step here whenever SCHEMA_VERSION is bumped, plus a test for it.
 */
/** Append default engines (by id) that a stored profile lacks; skips any whose address is already there. */
function addDefaultEngines(o: Raw, ids: string[]): Raw {
  if (!isObj(o.search) || !Array.isArray(o.search.engines)) return o;
  const engines = o.search.engines as unknown[];
  const key = (u: unknown) => (typeof u === 'string' ? u.trim().toLowerCase().replace(/^https?:\/\/(www\.)?/, '') : '');
  const have = new Set(engines.map((e) => (isObj(e) ? e.id : undefined)));
  const urls = new Set(engines.map((e) => (isObj(e) ? key(e.url) : '')));
  const added = defaultEngines().filter((d) => ids.includes(d.id) && !have.has(d.id) && !urls.has(key(d.url)));
  return { ...o, search: { ...o.search, engines: [...engines, ...added] } };
}

const steps: Record<number, (o: Raw) => Raw> = {
  // v2: AI search engines joined the defaults.
  1: (o) => addDefaultEngines(o, ['ai', 'ai2', 'brave2', 'brave3']),
  // v3: YouTube search (Claude / Gemini were added here too and removed again in v5).
  2: (o) => addDefaultEngines(o, ['youtube']),
  // v4 briefly moved Claude / Gemini to a content-script prefill; both sites ignored it, so it was dropped.
  3: (o) => o,
  // v5: remove the Claude / Gemini search engines NEONDECK added (any of their default addresses).
  // Engines the user created themselves (other addresses) are kept.
  4: (o) => {
    if (!isObj(o.search) || !Array.isArray(o.search.engines)) return o;
    const ours = new Set(['https://claude.ai/new?q=', 'https://claude.ai/new#nd-q=', 'https://gemini.google.com/app?q=', 'https://gemini.google.com/app#nd-q=']);
    const engines = o.search.engines.filter((e) => !(isObj(e) && typeof e.url === 'string' && ours.has(e.url)));
    return { ...o, search: { ...o.search, engines } };
  },
  // v6: neutral theme ids (old ids came from the reference extension's export format).
  5: (o) => {
    if (!isObj(o.theme)) return o;
    const renamed: Record<string, string> = { edgerunners: 'pulse', arasaka: 'protocol', ghost: 'phantom' };
    const id = typeof o.theme.id === 'string' ? renamed[o.theme.id] : undefined;
    return id ? { ...o, theme: { ...o.theme, id } } : o;
  },
  // v7: back to the original theme ids (user decision 2026-11-13; animated scenes are built per theme).
  6: (o) => {
    if (!isObj(o.theme)) return o;
    const renamed: Record<string, string> = { pulse: 'edgerunners', protocol: 'arasaka', phantom: 'ghost' };
    const id = typeof o.theme.id === 'string' ? renamed[o.theme.id] : undefined;
    return id ? { ...o, theme: { ...o.theme, id } } : o;
  },
};

export interface MigrationResult { data: unknown; fromVersion: number; newer: boolean }

/** Run stored/imported settings through all upgrade steps. Output still goes through `sanitizeSettings`. */
export function migrate(raw: unknown): MigrationResult {
  if (!isObj(raw)) return { data: raw, fromVersion: SCHEMA_VERSION, newer: false };
  const from = typeof raw.schemaVersion === 'number' && Number.isInteger(raw.schemaVersion) && raw.schemaVersion > 0 ? raw.schemaVersion : 1;
  if (from > SCHEMA_VERSION) return { data: raw, fromVersion: from, newer: true };
  let data: Raw = raw;
  for (let v = from; v < SCHEMA_VERSION; v++) {
    const step = steps[v];
    if (!step) throw new Error(`Missing migration step ${v} -> ${v + 1}`);
    data = { ...step(data), schemaVersion: v + 1 };
  }
  return { data, fromVersion: from, newer: false };
}
