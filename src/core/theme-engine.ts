import type { Settings } from './schema';

export interface RootLike { dataset: Record<string, string | undefined>; lang: string }

/**
 * Exposes the visual settings as data-* attributes on <html>.
 * Styling hooks for the theme layer: [data-theme], [data-scanlines], [data-chamfer], [data-glitch], [data-power], [data-font].
 */
export function applyTheme(root: RootLike, s: Settings): void {
  root.dataset.theme = s.theme.id;
  root.dataset.scanlines = s.theme.scanlines;
  root.dataset.chamfer = s.theme.chamfer;
  root.dataset.glitch = s.theme.glitch ? 'on' : 'off';
  root.dataset.power = s.theme.lowPower ? 'low' : 'normal';
  root.dataset.font = s.theme.font;
  root.lang = s.profile.locale;
}
