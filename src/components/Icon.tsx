/**
 * Placeholder icon set (stroke icons, 24x24). [antigravity] replaces these with the final
 * ~40-icon HUD set in Faz 2; keep the `name` keys (or extend ICON_ALIASES) so stored links keep working.
 */
const PATHS: Record<string, string> = {
  link: 'M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1',
  news: 'M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M7 9h7M7 13h7M7 16h4',
  work: 'M3 8h18v11H3zM8 8V5h8v3M3 13h18',
  chat: 'M4 5h16v11H9l-5 4z',
  play: 'M4 5h16v14H4zM10 9l5 3-5 3z',
  code: 'M8 8l-4 4 4 4M16 8l4 4-4 4M13 5l-2 14',
  mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
  globe: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  star: 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6-4.5-4.2 6.1-.7z',
  terminal: 'M3 5h18v14H3zM7 10l3 2-3 2M12 15h5',
  chip: 'M7 7h10v10H7zM10 10h4v4h-4zM9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4M12 15v2',
  skull: 'M12 3a8 8 0 0 0-8 8c0 3 1.5 4.5 3 5.5V20h10v-3.5c1.5-1 3-2.5 3-5.5a8 8 0 0 0-8-8zM9 11h.01M15 11h.01M10 20v-2M14 20v-2',
  settings: 'M12 2l8.66 5v10L12 22l-8.66-5V7zM12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6z',
  plus: 'M12 5v14M5 12h14',
  edit: 'M4 20h4L19 9l-4-4L4 16z',
  check: 'M5 12l5 5 9-10',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  close: 'M6 6l12 12M18 6L6 18',
  chevron: 'M6 9l6 6 6-6',
  download: 'M12 4v12M7 11l5 5 5-5M4 20h16',
  upload: 'M12 16V4M7 9l5-5 5 5M4 20h16',
  up: 'M6 15l6-6 6 6',
  grip: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
  down: 'M6 9l6 6 6-6',
  widgets: 'M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z',
  play2: 'M7 5l12 7-12 7z',
  pause: 'M7 5h4v14H7zM13 5h4v14h-4z',
  reset: 'M4 12a8 8 0 1 0 2.4-5.7M4 4v5h5',
  skip: 'M5 5l10 7-10 7zM17 5v14',
  sun: 'M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z',
  cloud: 'M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9.5 4.3 4.3 0 0 0 7 18z',
  rain: 'M7 15h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 6.5 4.3 4.3 0 0 0 7 15zM8 18l-1 3M12 18l-1 3M16 18l-1 3',
  snow: 'M7 15h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 6.5 4.3 4.3 0 0 0 7 15zM8 19h.01M12 21h.01M16 19h.01',
  storm: 'M7 15h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 6.5 4.3 4.3 0 0 0 7 15zM13 15l-2 4h3l-2 4',
  fog: 'M4 9h16M6 13h12M4 17h16',
  clock: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 7v5l3 2',
  note: 'M5 3h10l4 4v14H5zM15 3v4h4M8 12h8M8 16h6',
  list: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
  sound: 'M4 10h4l5-4v12l-5-4H4zM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12',
};

/** Icon names used by imported data (e.g. Cyberstart "Brain", "Security"). */
const ICON_ALIASES: Record<string, string> = { brain: 'chip', security: 'lock', video: 'play', entertainment: 'play', social: 'chat', game: 'play' };

/** Icons offered in the netlink editor. */
export const PICKABLE_ICONS = ['link', 'news', 'work', 'chat', 'play', 'code', 'mail', 'globe', 'star', 'terminal', 'chip', 'shield', 'lock', 'skull'];

export const resolveIcon = (name: string | undefined) => {
  const n = (name ?? 'link').toLowerCase();
  return PATHS[n] ? n : PATHS[ICON_ALIASES[n] ?? ''] ? ICON_ALIASES[n]! : 'link';
};

export function Icon({ name, size = 20, label }: { name?: string; size?: number; label?: string }) {
  return (
    <svg class="nd-icon" viewBox="0 0 24 24" width={size} height={size} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : 'true'} focusable="false">
      <path d={PATHS[resolveIcon(name)]} />
    </svg>
  );
}
