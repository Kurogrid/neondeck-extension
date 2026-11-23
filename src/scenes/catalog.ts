import type { Locale, ThemeId } from '../core/schema';
import type { WallpaperDef } from './types';

export const WALLPAPERS: readonly WallpaperDef[] = [
  // Edgerunners
  {
    id: 'edgerunners-rooftop',
    themeId: 'edgerunners',
    image: 'wallpapers/edgerunners-rooftop.webp',
    live: true,
    overlay: 'edgerunners-rooftop',
    label: { en: 'Neon Rooftop', tr: 'Neon Çatı' },
  },
  {
    id: 'edgerunners-solar',
    themeId: 'edgerunners',
    image: 'wallpapers/edgerunners-solar.webp',
    live: true,
    overlay: 'edgerunners-solar',
    label: { en: 'Solar Burst', tr: 'Solar Patlama' },
  },
  {
    id: 'edgerunners-lunar',
    themeId: 'edgerunners',
    image: 'wallpapers/edgerunners-lunar.webp',
    live: true,
    overlay: 'edgerunners-lunar',
    label: { en: 'Lunar Horizon', tr: 'Ay Ufku' },
  },
  {
    id: 'edgerunners-lounge',
    themeId: 'edgerunners',
    image: 'wallpapers/edgerunners-lounge.webp',
    live: true,
    overlay: 'edgerunners-lounge',
    label: { en: 'Pixel Lounge', tr: 'Pixel Bar' },
  },

  // Arasaka: the animated 0.2.0 corporate HUD scene (procedural, no image)
  {
    id: 'arasaka',
    themeId: 'arasaka',
    image: '',
    live: true,
    overlay: 'none',
    label: { en: 'Corporate HUD', tr: 'Kurumsal HUD' },
  },

  // Samurai
  {
    id: 'samurai-ronin',
    themeId: 'samurai',
    image: 'wallpapers/samurai-ronin.webp',
    live: true,
    overlay: 'samurai-ronin',
    label: { en: 'Cyber Ronin', tr: 'Siber Ronin' },
  },
  {
    id: 'samurai-overpass',
    themeId: 'samurai',
    image: 'wallpapers/samurai-overpass.webp',
    live: true,
    overlay: 'samurai-overpass',
    label: { en: 'Night Overpass', tr: 'Gece Viyadüğü' },
  },
  {
    id: 'samurai-stage',
    themeId: 'samurai',
    image: 'wallpapers/samurai-stage.webp',
    live: false,
    overlay: 'none',
    label: { en: 'Chrome Stage', tr: 'Krom Sahne' },
  },

  // Ghost
  {
    id: 'ghost-cyberspace',
    themeId: 'ghost',
    image: 'wallpapers/ghost-cyberspace.webp',
    live: true,
    overlay: 'ghost-cyberspace',
    label: { en: 'Cyberspace Vault', tr: 'Siber Sığınak' },
  },
  {
    id: 'ghost-neural',
    themeId: 'ghost',
    image: 'wallpapers/ghost-neural.webp',
    live: true,
    overlay: 'ghost-neural',
    label: { en: 'Fiber Cathedral', tr: 'Fiber Katedral' },
  },
  {
    id: 'ghost-alley',
    themeId: 'ghost',
    image: 'wallpapers/ghost-alley.webp',
    live: false,
    overlay: 'none',
    label: { en: 'Rain Alley', tr: 'Yağmurlu Sokak' },
  },

  // Acid Orchid
  {
    id: 'orchid-horizon',
    themeId: 'orchid',
    image: 'wallpapers/orchid-horizon.webp',
    live: true,
    overlay: 'orchid-horizon',
    label: { en: 'Synth Horizon', tr: 'Synth Ufku' },
  },
  {
    id: 'orchid-megacity',
    themeId: 'orchid',
    image: 'wallpapers/orchid-megacity.webp',
    live: true,
    overlay: 'orchid-megacity',
    label: { en: 'Bio Megacity', tr: 'Biyo-Metropol' },
  },
  {
    id: 'orchid-crystal',
    themeId: 'orchid',
    image: 'wallpapers/orchid-crystal.webp',
    live: false,
    overlay: 'none',
    label: { en: 'Crystal Rift', tr: 'Kristal Yarık' },
  },
];

export function wallpapersForTheme(themeId: ThemeId): readonly WallpaperDef[] {
  return WALLPAPERS.filter((w) => w.themeId === themeId);
}

export function defaultWallpaperForTheme(themeId: ThemeId): WallpaperDef {
  return wallpapersForTheme(themeId)[0] ?? WALLPAPERS[0]!;
}

export function resolveWallpaper(themeId: ThemeId, sceneId?: string): WallpaperDef {
  if (sceneId) {
    const key = sceneId.toLowerCase();
    const hit = WALLPAPERS.find((w) => w.id === key);
    if (hit) return hit;
  }
  return defaultWallpaperForTheme(themeId);
}

export function wallpaperLabel(wall: WallpaperDef, locale: Locale): string {
  return wall.label[locale] ?? wall.label.en;
}
