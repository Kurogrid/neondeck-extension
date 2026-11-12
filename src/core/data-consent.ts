import { ext, manifest } from './ext';

/**
 * Firefox built-in data consent (`browser_specific_settings.gecko.data_collection_permissions`).
 * The Firefox build declares `optional: ["locationInfo"]` because the Weather widget sends the chosen
 * city and rounded coordinates to Open-Meteo. Chrome builds have no such key, so these return true.
 */
type WithDataCollection = { data_collection?: string[] };

export function needsLocationConsent(): boolean {
  const gecko = (manifest() as { browser_specific_settings?: { gecko?: { data_collection_permissions?: { optional?: string[] } } } } | null)
    ?.browser_specific_settings?.gecko;
  return !!gecko?.data_collection_permissions?.optional?.includes('locationInfo');
}

export async function hasLocationConsent(): Promise<boolean> {
  if (!needsLocationConsent()) return true;
  try {
    const all = (await ext!.permissions.getAll()) as WithDataCollection;
    return !!all.data_collection?.includes('locationInfo');
  } catch { return false; }
}

/** MUST be called synchronously inside a user gesture (no await before it). Never throws. */
export async function requestLocationConsent(): Promise<boolean> {
  if (!needsLocationConsent()) return true;
  try {
    return await ext!.permissions.request({ data_collection: ['locationInfo'] } as unknown as chrome.permissions.Permissions);
  } catch { return false; }
}
