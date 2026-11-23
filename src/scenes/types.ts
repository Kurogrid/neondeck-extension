export type SceneId = 'edgerunners' | 'arasaka' | 'ghost' | 'orchid' | 'samurai';

export type WallpaperOverlay =
  | 'none'
  | 'arasaka-mainframe'
  | 'arasaka-breach'
  | 'arasaka-optic'
  | 'samurai-ronin'
  | 'samurai-overpass'
  | 'edgerunners-rooftop'
  | 'edgerunners-solar'
  | 'edgerunners-lunar'
  | 'edgerunners-lounge'
  | 'ghost-cyberspace'
  | 'ghost-neural'
  | 'orchid-horizon'
  | 'orchid-megacity';

export interface WallpaperDef {
  id: string;
  themeId: SceneId;
  image: string;
  thumb?: string;
  live: boolean;
  overlay: WallpaperOverlay;
  position?: 'center' | 'top';
  label: { en: string; tr: string };
}

export interface SceneRenderer {
  resize(w: number, h: number): void;
  render(ctx: CanvasRenderingContext2D, timeSec: number, dtSec: number): void;
}
