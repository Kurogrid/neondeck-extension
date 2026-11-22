import { useEffect, useRef, useState } from 'preact/hooks';
import type { ThemeId } from '../core/schema';
import { createScene, resolveSceneId } from './registry';

interface Props {
  themeId: ThemeId;
  sceneId?: string;
  brightness: number;
  lowPower: boolean;
}

const STATIC_TIME_SEC = 12;

export function SceneCanvas({ themeId, sceneId, brightness, lowPower }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const resolvedId = resolveSceneId(themeId, sceneId);
  const isStatic = lowPower || reducedMotion;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }) ?? canvas.getContext('2d');
    if (!ctx) return;

    let dpr = 1;
    let width = Math.max(1, canvas.clientWidth || window.innerWidth);
    let height = Math.max(1, canvas.clientHeight || window.innerHeight);
    const scene = createScene(resolvedId, width, height);

    const syncSize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = Math.max(1, canvas.clientWidth || window.innerWidth);
      height = Math.max(1, canvas.clientHeight || window.innerHeight);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      scene.resize(width, height);
    };

    const drawFrame = (timeSec: number, dtSec: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scene.render(ctx, timeSec, dtSec);
      if (brightness < 100) {
        ctx.fillStyle = '#000000';
        ctx.globalAlpha = Math.min(0.9, (100 - brightness) / 100);
        ctx.fillRect(0, 0, width, height);
        ctx.globalAlpha = 1;
      } else if (brightness > 100) {
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = Math.min(0.28, (brightness - 100) / 180);
        ctx.fillRect(0, 0, width, height);
        ctx.globalAlpha = 1;
      }
    };

    let simTime = STATIC_TIME_SEC;
    syncSize();
    drawFrame(simTime, 0);

    if (isStatic) {
      const onResizeStatic = () => {
        syncSize();
        drawFrame(simTime, 0);
      };
      window.addEventListener('resize', onResizeStatic);
      return () => window.removeEventListener('resize', onResizeStatic);
    }

    let rafId = 0;
    let lastTs = 0;

    const tick = (ts: number) => {
      if (document.hidden) {
        rafId = 0;
        return;
      }
      const dt = lastTs > 0 ? Math.min((ts - lastTs) / 1000, 0.05) : 0.016;
      lastTs = ts;
      simTime += dt;
      drawFrame(simTime, dt);
      rafId = window.requestAnimationFrame(tick);
    };

    const start = () => {
      if (!document.hidden && !rafId) {
        lastTs = 0;
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const stop = () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    const onResize = () => {
      syncSize();
      drawFrame(simTime, 0);
    };

    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);
    start();

    return () => {
      stop();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [resolvedId, brightness, isStatic]);

  return (
    <div class="nd-scene-layer" aria-hidden="true">
      <canvas ref={canvasRef} class="nd-scene-canvas" />
    </div>
  );
}
