import { useEffect, useRef, useState } from 'preact/hooks';
import type { Settings, ThemeId } from '../core/schema';
import { resolveWallpaper } from './catalog';
import { getCustomWallpaper } from './mediaDb';
import { createOverlay } from './overlays';
import { createScene, resolveSceneId } from './registry';

interface Props {
  themeId: ThemeId;
  background: Settings['background'];
  lowPower: boolean;
}

const STATIC_TIME_SEC = 12;

export function SceneCanvas({ themeId, background, lowPower }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wall = resolveWallpaper(themeId, background.sceneId);
  const mediaId = background.kind === 'image' ? background.mediaId : undefined;
  const sceneId = background.sceneId;
  const brightness = background.brightness;

  const [imgSrc, setImgSrc] = useState(mediaId ? '' : wall.image);
  const [isCustom, setIsCustom] = useState(false);
  const [imgReady, setImgReady] = useState(false);
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

  useEffect(() => {
    let cancelled = false;
    let objectUrl = '';

    setImgReady(false);

    if (!mediaId) {
      setIsCustom(false);
      setImgSrc(wall.image);
      return;
    }

    void getCustomWallpaper(mediaId)
      .then((item) => {
        if (cancelled) return;
        if (!item) {
          setIsCustom(false);
          setImgSrc(wall.image);
          return;
        }
        objectUrl = URL.createObjectURL(item.blob);
        setIsCustom(true);
        setImgSrc(objectUrl);
      })
      .catch(() => {
        if (cancelled) return;
        setIsCustom(false);
        setImgSrc(wall.image);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [mediaId, wall.image]);

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setImgReady(true);
    }
  }, [imgSrc]);

  const isStaticEnv = lowPower || reducedMotion;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true }) ?? canvas.getContext('2d');
    if (!ctx) return;

    const activeWall = resolveWallpaper(themeId, sceneId);
    const fallbackScene = createScene(
      resolveSceneId(themeId, sceneId),
      Math.max(1, canvas.clientWidth || window.innerWidth),
      Math.max(1, canvas.clientHeight || window.innerHeight),
    );
    const overlay = createOverlay(activeWall.overlay);
    const animateLoop = !isStaticEnv && !isCustom && activeWall.live;

    let dpr = 1;
    let width = Math.max(1, canvas.clientWidth || window.innerWidth);
    let height = Math.max(1, canvas.clientHeight || window.innerHeight);
    let simTime = STATIC_TIME_SEC;
    let disposed = false;
    let rafId = 0;
    let lastTs = 0;

    const syncSize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 3);
      width = Math.max(1, canvas.clientWidth || window.innerWidth);
      height = Math.max(1, canvas.clientHeight || window.innerHeight);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      fallbackScene.resize(width, height);
    };

    const drawFrame = (timeSec: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      if (!imgReady) {
        fallbackScene.render(ctx, timeSec, 0.016);
      }

      const veilAlpha =
        brightness < 100
          ? Math.min(0.86, ((100 - brightness) / 100) * 0.85)
          : 0;

      if (veilAlpha > 0) {
        ctx.fillStyle = '#050408';
        ctx.globalAlpha = veilAlpha;
        ctx.fillRect(0, 0, width, height);
        ctx.globalAlpha = 1;
      }

      if (brightness > 100) {
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = Math.min(0.14, ((brightness - 100) / 100) * 0.25);
        ctx.fillRect(0, 0, width, height);
        ctx.globalAlpha = 1;
      }

      if (!isCustom && activeWall.live) {
        overlay.render(ctx, width, height, timeSec);
      }
    };

    const tick = (ts: number) => {
      if (disposed || document.hidden || !animateLoop) {
        rafId = 0;
        return;
      }
      const dt = lastTs > 0 ? Math.min((ts - lastTs) / 1000, 0.05) : 0.016;
      lastTs = ts;
      simTime += dt;
      drawFrame(simTime);
      rafId = window.requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (!disposed && animateLoop && !document.hidden && !rafId) {
        lastTs = 0;
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const stopLoop = () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    const onVisibility = () => {
      if (document.hidden) stopLoop();
      else startLoop();
    };

    const onResize = () => {
      syncSize();
      drawFrame(simTime);
    };

    syncSize();
    drawFrame(simTime);
    startLoop();

    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      disposed = true;
      stopLoop();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [themeId, sceneId, brightness, isStaticEnv, isCustom, imgReady]);

  return (
    <div class="nd-scene-layer" aria-hidden="true">
      {imgSrc && (
        <img
          ref={imgRef}
          key={imgSrc}
          class="nd-scene-img"
          data-pos={!isCustom && wall.position === 'top' ? 'top' : undefined}
          src={imgSrc}
          alt=""
          decoding="async"
          onLoad={() => setImgReady(true)}
          onError={() => {
            setImgReady(false);
            if (isCustom) {
              setIsCustom(false);
              setImgSrc(wall.image);
            }
          }}
        />
      )}
      <canvas ref={canvasRef} class="nd-scene-canvas" />
    </div>
  );
}
