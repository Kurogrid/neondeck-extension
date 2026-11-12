/** Dependency-free type guards shared by core and widget logic. */
export const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
export const str = (v: unknown, max: number, fallback: string) => (typeof v === 'string' ? v.trim().slice(0, max) : fallback);
export const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);
export const num = (v: unknown, min: number, max: number, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
export function oneOf<T extends string>(v: unknown, list: readonly T[], fallback: T): T {
  return (list as readonly unknown[]).includes(v) ? (v as T) : fallback;
}
/** Lowercase slug for ids / category keys / icon names. */
export const slug = (v: string, max = 40) => v.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, max);

/** Only http(s) URLs are allowed (rejects javascript:, data:, etc.). */
export function safeUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  try {
    const u = new URL(raw.trim());
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null;
  } catch { return null; }
}

