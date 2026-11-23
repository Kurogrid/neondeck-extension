/**
 * Custom cyberpunk HUD stroke icon set (24x24).
 * Existing keys and ICON_ALIASES remain stable so saved netlinks continue to resolve.
 */
const PATHS: Record<string, string> = {
  // Core netlink & system HUD icons
  link: 'M10 14a4 4 0 0 0 5.66 0l2.8-2.8a3.8 3.8 0 0 0-5.38-5.38l-1.1 1.1M14 10a4 4 0 0 0-5.66 0l-2.8 2.8a3.8 3.8 0 0 0 5.38 5.38l1.1-1.1',
  news: 'M5 4h11l2 2v13H6a2 2 0 0 1-2-2V5zM18 9h2v8a2 2 0 0 1-2 2M7 8h8M7 12h8M7 16h5',
  work: 'M3 9l2-2h14l2 2v9l-2 2H5l-2-2zM8 7V5l1-1h6l1 1v2M3 13h18M10 13v2h4v-2',
  chat: 'M4 5h16v10l-3 3h-8l-5 3zM8 9h8M8 13h5',
  play: 'M4 5l2-1h12l2 1v12l-2 2H6l-2-2zM10 8.5l6 3.5-6 3.5z',
  code: 'M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14',
  mail: 'M3 6h18v12H3zM3 7l9 6 9-6M3 18l5.5-5.5M21 18l-5.5-5.5',
  globe: 'M12 3l6.4 2.6L21 12l-2.6 6.4L12 21l-6.4-2.6L3 12l2.6-6.4zM3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18',
  star: 'M12 3l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6-4.4-4.2 6-.8z',
  terminal: 'M3 5l2-1h14l2 1v14l-2 1H5l-2-1zM7 9.5l3 2.5-3 2.5M12 15h5',
  chip: 'M7 7h10v10H7zM10 10h4v4h-4zM9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4',
  lock: 'M5 11h14v9l-1 1H6l-1-1zM8 11V7a4 4 0 0 1 8 0v4M12 14.5v2.5',
  skull: 'M12 3l5 2 3 5-1.5 4.5-2.5 1.8V20H8v-3.7L5.5 14.5 4 10l3-5zM9 11h.01M15 11h.01M10 20v-2M14 20v-2',

  // Expanded Netlink HUD icons
  search: 'M10.5 4a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13zM15.4 15.4L20.5 20.5',
  home: 'M3 11l9-8 9 8M5 10v10h5v-5h4v5h5V10',
  folder: 'M3 6l2-2h5l2 2h7l2 2v10l-2 2H5l-2-2zM3 10h18',
  book: 'M4 5l3-1h12v15H7l-3 1zM7 4v15M10 8h6M10 12h5',
  music: 'M9 17V6l10-2v11M9 17a2.5 2.5 0 1 1-5 0a2.5 2.5 0 1 1 5 0zM19 15a2.5 2.5 0 1 1-5 0a2.5 2.5 0 1 1 5 0z',
  headphones: 'M4 13v-2a8 8 0 0 1 16 0v2M4 13h3v6H5l-1-1zM20 13h-3v6h2l1-1z',
  gamepad: 'M6 8h12l3 4-1.5 6-3-1.5-2-2H9.5l-2 2-3 1.5L3 12zM8 11v4M6 13h4M15.5 12h.01M17.5 14h.01',
  tv: 'M3 7l2-2h14l2 2v10l-2 2H5l-2-2zM8 21h8M9 5l3-2 3 2',
  camera: 'M4 8l2-2h3l1.5-2h3L15 6h3l2 2v10l-2 2H6l-2-2zM12 10a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7z',
  image: 'M3 5l2-1h14l2 1v14l-2 1H5l-2-1zM4 17l4.5-4.5 3.5 3.5 4-4 4 4M8.5 9h.01',
  cart: 'M3 5h3l2.2 10h10.3l2-7H7.2M9 19.5h.01M17.5 19.5h.01',
  wallet: 'M3 6h16l2 2v10l-2 2H5l-2-2zM15 12h6M17.5 12h.01M4 6l12-2v2',
  bank: 'M3 9l9-5 9 5zM5 9v9M9.5 9v9M14.5 9v9M19 9v9M3 18h18M2 21h20',
  chart: 'M4 20h16M6 17v-5M10.5 17V9M15 17v-3M19 17V6',
  calendar: 'M4 6h16v14H4zM8 3v4M16 3v4M4 10h16M8 14h.01M12 14h.01M16 14h.01',
  compass: 'M12 3l6.4 2.6L21 12l-2.6 6.4L12 21l-6.4-2.6L3 12l2.6-6.4zM15 9l-2 5-4 1 2-5z',
  map: 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14',
  bolt: 'M13 3L5 13h6l-1 8 9-11h-6z',
  flame: 'M12 3c2 3 5 5.2 5 9a5 5 0 1 1-10 0c0-2.1 1-4.1 2.4-5.6.3 1.7 1.3 2.6 2.3 2.6.8-1.9.8-3.8.3-6z',
  eye: 'M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6zM12 9.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5z',
  cpu: 'M6 6h12v12H6zM9.5 9.5h5v5h-5zM9 2v4M12 2v4M15 2v4M9 18v4M12 18v4M15 18v4M2 9h4M2 12h4M2 15h4M18 9h4M18 12h4M18 15h4',
  server: 'M4 4h16v6H4zM4 14h16v6H4zM7 7h.01M7 17h.01M12 7h5M12 17h5',
  database: 'M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zM5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6',
  wifi: 'M4 9.5a12 12 0 0 1 16 0M7 13a7.8 7.8 0 0 1 10 0M10 16.5a3.5 3.5 0 0 1 4 0M12 20h.01',
  radio: 'M12 12a1.5 1.5 0 1 0 0 3a1.5 1.5 0 1 0 0-3zM12 15v6M8 10a5.5 5.5 0 0 1 8 0M5 7.5a9.5 9.5 0 0 1 14 0',
  rocket: 'M14 4c3 0 6 1.2 6 4 0 4.5-3.8 8.3-7.5 10l-3.5-3.5C10.7 10.8 14.5 7 14 4zM9 14.5l-4 1.5 1.5-4M6.5 17.5L4 20M14 9h.01',
  bot: 'M5 8l2-2h10l2 2v10l-2 2H7l-2-2zM12 3v3M9 12h.01M15 12h.01M9 16h6M2 12h3M19 12h3',
  git: 'M6 4v12M6 8a2 2 0 1 0 0-4a2 2 0 1 0 0 4zM6 20a2 2 0 1 0 0-4a2 2 0 1 0 0 4zM18 10a2 2 0 1 0 0-4a2 2 0 1 0 0 4zM18 10c0 4-3 5-12 6',
  key: 'M8 15a4.5 4.5 0 1 1 3.7-7H21v3h-2.5v2.5H16v-2.5h-4.3A4.5 4.5 0 0 1 8 15zM7.5 11h.01',

  // UI controls & widget icons
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
  prev: 'M19 5l-10 7 10 7zM7 5v14',
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
  mute: 'M4 10h4l5-4v12l-5-4H4zM16 9l5 6M21 9l-5 6',
  wave: 'M3 12h3l2-5 3 10 3-8 2 3h5',
};

/** Icon names used by imported data and common shortcuts. */
const ICON_ALIASES: Record<string, string> = {
  brain: 'chip',
  security: 'lock',
  video: 'play',
  entertainment: 'play',
  social: 'chat',
  game: 'play',
  ai: 'bot',
  dev: 'code',
  shop: 'cart',
  finance: 'wallet',
  media: 'tv',
  audio: 'headphones',
  docs: 'book',
  cloud2: 'server',
};

/** 44 icons offered in the netlink editor. */
export const PICKABLE_ICONS = [
  'link', 'globe', 'home', 'search', 'news', 'work', 'code', 'terminal', 'git', 'cpu', 'chip',
  'server', 'database', 'bot', 'chat', 'mail', 'play', 'music', 'headphones', 'gamepad', 'tv', 'camera',
  'image', 'book', 'folder', 'calendar', 'clock', 'chart', 'wallet', 'bank', 'cart', 'compass', 'map',
  'bolt', 'flame', 'star', 'eye', 'wifi', 'radio', 'shield', 'lock', 'key', 'rocket', 'skull',
];

export const resolveIcon = (name: string | undefined): string => {
  const n = (name ?? 'link').toLowerCase();
  if (PATHS[n]) return n;
  const alias = ICON_ALIASES[n];
  return alias && PATHS[alias] ? alias : 'link';
};

export function Icon({ name, size = 20, label }: { name?: string; size?: number; label?: string }) {
  const d = PATHS[resolveIcon(name)] ?? PATHS.link;
  return (
    <svg
      class="nd-icon"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : 'true'}
      focusable="false"
    >
      <path d={d} />
    </svg>
  );
}
