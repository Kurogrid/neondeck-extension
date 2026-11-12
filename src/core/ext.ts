/**
 * The WebExtension API object: `browser` in Firefox, `chrome` in Chromium.
 * Undefined in `npm run dev` (plain web page), where callers fall back or hide features.
 */
export const ext: typeof chrome | undefined =
  (globalThis as { browser?: typeof chrome }).browser ?? (typeof chrome !== 'undefined' && chrome.runtime?.id ? chrome : undefined);

/** The running build's manifest (Chrome and Firefox builds differ), or null outside the extension. */
export const manifest = (): chrome.runtime.Manifest | null => {
  try { return ext?.runtime?.getManifest?.() ?? null; } catch { return null; }
};
