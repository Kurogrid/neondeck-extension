export const BROWSERS = ['chrome', 'edge', 'opera', 'firefox'] as const;
export type BrowserId = (typeof BROWSERS)[number];

/**
 * Best guess of the running browser, used only to preselect the right setup tab
 * on the welcome page (the user can switch tabs). Order matters: Opera and Edge
 * also report "Chrome" in their user agent.
 */
export function detectBrowser(ua: string, hasBrowserGlobal: boolean): BrowserId {
  if (/\bOPR\/|\bOpera\b/.test(ua)) return 'opera';
  if (/\bEdg\//.test(ua)) return 'edge';
  if (hasBrowserGlobal || /\bFirefox\//.test(ua)) return 'firefox';
  return 'chrome';
}
