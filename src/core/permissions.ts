import { ext, manifest } from './ext';

export type OptionalPerm = 'favicon' | 'bookmarks';

/** What each optional feature asks Chrome for. */
const SPEC: Record<OptionalPerm, chrome.permissions.Permissions> = {
  favicon: { permissions: ['favicon'] },
  bookmarks: { permissions: ['bookmarks'] },
};

const api = () => ext?.permissions;

/** False outside the extension (e.g. `npm run dev`). */
export const permsAvailable = () => !!api();
/** Whether this build offers the permission at all (Firefox has no `favicon`). True in dev so the UI can be previewed. */
export const permSupported = (p: OptionalPerm) => {
  const m = manifest();
  return !m || (m.optional_permissions ?? []).includes(p as never);
};

export async function hasPerm(p: OptionalPerm): Promise<boolean> {
  try { return (await api()?.contains(SPEC[p])) ?? false; } catch { return false; }
}
/** MUST be called from a user gesture (click/change/submit handler), before any other await. Never throws. */
export async function requestPerm(p: OptionalPerm): Promise<boolean> {
  try { return (await api()?.request(SPEC[p])) ?? false; } catch { return false; }
}
export async function revokePerm(p: OptionalPerm): Promise<boolean> {
  try { return (await api()?.remove(SPEC[p])) ?? false; } catch { return false; }
}
/** Fires when any optional permission is granted or revoked (also from chrome://extensions). */
export function onPermsChanged(cb: () => void): () => void {
  const a = api();
  if (!a?.onAdded) return () => {};
  a.onAdded.addListener(cb);
  a.onRemoved.addListener(cb);
  return () => { a.onAdded.removeListener(cb); a.onRemoved.removeListener(cb); };
}
export function faviconUrl(pageUrl: string, size = 32): string {
  const u = new URL(ext!.runtime.getURL('/_favicon/'));
  u.searchParams.set('pageUrl', pageUrl);
  u.searchParams.set('size', String(size));
  return u.href;
}
