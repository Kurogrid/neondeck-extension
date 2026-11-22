export type SceneId = 'edgerunners' | 'arasaka' | 'ghost' | 'orchid';

export interface SceneRenderer {
  resize(w: number, h: number): void;
  render(ctx: CanvasRenderingContext2D, timeSec: number, dtSec: number): void;
}
