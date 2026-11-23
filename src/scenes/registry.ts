import type { ThemeId } from '../core/schema';
import { createArasakaScene } from './arasaka';
import { createEdgerunnersScene } from './edgerunners';
import { createGhostScene } from './ghost';
import { createOrchidScene } from './orchid';
import type { SceneId, SceneRenderer } from './types';

const SCENE_ALIASES: Record<string, SceneId> = {
  edgerunners: 'edgerunners',
  'rain-city': 'edgerunners',
  'neon-city': 'edgerunners',
  arasaka: 'arasaka',
  'corp-hud': 'arasaka',
  'tactical-hud': 'arasaka',
  ghost: 'ghost',
  'matrix-rain': 'ghost',
  'signal-rain': 'ghost',
  orchid: 'orchid',
  'acid-grid': 'orchid',
  'synth-grid': 'orchid',
  samurai: 'samurai',
};

export function resolveSceneId(themeId: ThemeId, sceneId?: string): SceneId {
  if (sceneId) {
    const mapped = SCENE_ALIASES[sceneId.toLowerCase()];
    if (mapped) return mapped;
  }
  return themeId;
}

export function createScene(id: SceneId, w: number, h: number): SceneRenderer {
  switch (id) {
    case 'arasaka':
    case 'samurai':
      return createArasakaScene(w, h);
    case 'ghost':
      return createGhostScene(w, h);
    case 'orchid':
      return createOrchidScene(w, h);
    case 'edgerunners':
    default:
      return createEdgerunnersScene(w, h);
  }
}
