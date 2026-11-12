import { convertCyberstart, looksLikeCyberstart } from './importers/cyberstart';
import { migrate } from './migrations';
import type { Settings } from './schema';
import { isObj, sanitizeSettings } from './validate';

export const MAX_IMPORT_BYTES = 2_000_000;
export const EXPORT_APP_ID = 'neondeck';

export type ImportWarning = 'linksDropped' | 'defaultEngineDropped' | 'remoteBackgroundDropped' | 'rssDropped' | 'newerVersion';
export type ImportErrorCode = 'tooLarge' | 'invalidJson' | 'unknownFormat';

export class ImportError extends Error {
  constructor(public code: ImportErrorCode) { super(code); }
}

export interface ImportResult { settings: Settings; source: 'neondeck' | 'cyberstart'; warnings: ImportWarning[] }

/** Settings backup as pretty JSON. Media (IndexedDB) is intentionally not included. */
export function exportJson(s: Settings, now = new Date()): string {
  return JSON.stringify({ app: EXPORT_APP_ID, exportedAt: now.toISOString(), ...s }, null, 2);
}

export const exportFileName = (now = new Date()) => `neondeck-backup-${now.toISOString().slice(0, 10)}.json`;

/** Parse a NEONDECK backup or a reference-extension export. Throws `ImportError`. */
export function importJson(text: string): ImportResult {
  if (text.length > MAX_IMPORT_BYTES) throw new ImportError('tooLarge');
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { throw new ImportError('invalidJson'); }
  if (!isObj(raw)) throw new ImportError('unknownFormat');

  if (raw.app === EXPORT_APP_ID || typeof raw.schemaVersion === 'number') {
    const m = migrate(raw);
    return { settings: sanitizeSettings(m.data), source: 'neondeck', warnings: m.newer ? ['newerVersion'] : [] };
  }
  if (looksLikeCyberstart(raw)) {
    const { data, warnings } = convertCyberstart(raw);
    return { settings: sanitizeSettings(data), source: 'cyberstart', warnings };
  }
  throw new ImportError('unknownFormat');
}
