import { mulberry32 } from './rng';
import type { SceneRenderer } from './types';

interface ArcSegment {
  radiusRatio: number;
  start: number;
  sweep: number;
  speed: number;
  color: string;
  alpha: number;
  lineWidth: number;
}

export function createArasakaScene(initW: number, initH: number): SceneRenderer {
  let width = 1;
  let height = 1;
  let arcs: ArcSegment[] = [];
  let bars: number[] = [];
  let bgGrad: CanvasGradient | null = null;

  const build = (w: number, h: number) => {
    width = Math.max(1, w);
    height = Math.max(1, h);
    const rand = mulberry32(424209);

    arcs = [];
    const ringConfigs = [
      { ratio: 0.44, count: 6, speed: 0.06, color: '#ff2e3b', lw: 1.5, alpha: 0.34 },
      { ratio: 0.35, count: 5, speed: -0.1, color: '#e2e6ec', lw: 1.1, alpha: 0.24 },
      { ratio: 0.27, count: 4, speed: 0.15, color: '#ff2e3b', lw: 1.8, alpha: 0.38 },
      { ratio: 0.19, count: 3, speed: -0.18, color: '#ff7b1a', lw: 1.2, alpha: 0.3 },
    ];
    for (const rc of ringConfigs) {
      for (let i = 0; i < rc.count; i++) {
        const base = (Math.PI * 2 * i) / rc.count + rand() * 0.25;
        arcs.push({
          radiusRatio: rc.ratio,
          start: base,
          sweep: 0.32 + rand() * 0.55,
          speed: rc.speed,
          color: rc.color,
          alpha: rc.alpha,
          lineWidth: rc.lw,
        });
      }
    }

    bars = [];
    for (let i = 0; i < 48; i++) bars.push(rand());
    bgGrad = null;
  };

  build(initW, initH);

  return {
    resize(w, h) {
      build(w, h);
    },
    render(ctx, timeSec) {
      if (!bgGrad) {
        bgGrad = ctx.createRadialGradient(width * 0.5, height * 0.44, 20, width * 0.5, height * 0.44, Math.max(width, height) * 0.72);
        bgGrad.addColorStop(0, '#18090c');
        bgGrad.addColorStop(0.55, '#0e0608');
        bgGrad.addColorStop(1, '#080405');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Architectural tactical coordinate grid + crosshair intersections
      const gridStep = 64;
      ctx.strokeStyle = 'rgba(255, 46, 59, 0.085)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = (width % gridStep) * 0.5; x < width; x += gridStep) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = (height % gridStep) * 0.5; y < height; y += gridStep) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      ctx.strokeStyle = 'rgba(226, 230, 236, 0.12)';
      ctx.beginPath();
      for (let x = (width % gridStep) * 0.5; x < width; x += gridStep * 2) {
        for (let y = (height % gridStep) * 0.5; y < height; y += gridStep * 2) {
          ctx.moveTo(x - 4, y);
          ctx.lineTo(x + 4, y);
          ctx.moveTo(x, y - 4);
          ctx.lineTo(x, y + 4);
        }
      }
      ctx.stroke();

      // Concentric tactical radar rings centered behind command deck
      const cx = width * 0.5;
      const cy = height * 0.44;
      const baseR = Math.min(width, height);

      // Faint full guide circles
      ctx.strokeStyle = 'rgba(255, 46, 59, 0.14)';
      ctx.lineWidth = 1;
      for (const ratio of [0.19, 0.27, 0.35, 0.44]) {
        ctx.beginPath();
        ctx.arc(cx, cy, baseR * ratio, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Degree calibration ticks on outer ring
      const tickR = baseR * 0.46;
      const rot = timeSec * 0.04;
      ctx.strokeStyle = 'rgba(226, 230, 236, 0.22)';
      ctx.beginPath();
      for (let deg = 0; deg < 360; deg += 6) {
        const a = (deg * Math.PI) / 180 + rot;
        const major = deg % 30 === 0;
        const inner = tickR - (major ? 10 : 4);
        ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
        ctx.lineTo(cx + Math.cos(a) * tickR, cy + Math.sin(a) * tickR);
      }
      ctx.stroke();

      // Volumetric sweeping crimson radar beam wedge (stacked fan)
      const sweepAngle = timeSec * 0.48;
      const beamR = baseR * 0.45;
      const steps = 14;
      const fanSpan = 0.65;
      for (let s = 0; s < steps; s++) {
        const a0 = sweepAngle - (s / steps) * fanSpan;
        const a1 = sweepAngle - ((s + 1) / steps) * fanSpan;
        ctx.globalAlpha = 0.12 * (1 - s / steps);
        ctx.fillStyle = '#ff2e3b';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, beamR, a1, a0);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = '#ff2e3b';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweepAngle) * beamR, cy + Math.sin(sweepAngle) * beamR);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Counter-rotating segmented tactical arcs
      for (const seg of arcs) {
        const r = baseR * seg.radiusRatio;
        const a0 = seg.start + timeSec * seg.speed;
        ctx.globalAlpha = seg.alpha;
        ctx.strokeStyle = seg.color;
        ctx.lineWidth = seg.lineWidth;
        ctx.beginPath();
        ctx.arc(cx, cy, r, a0, a0 + seg.sweep);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Side tactical brackets (outer framing)
      const bracketW = Math.min(84, width * 0.08);
      const bracketH = Math.min(180, height * 0.24);
      const bxL = Math.max(24, width * 0.05);
      const bxR = width - bxL;
      const byTop = cy - bracketH * 0.5;
      const byBot = cy + bracketH * 0.5;
      ctx.strokeStyle = 'rgba(255, 46, 59, 0.34)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(bxL + bracketW, byTop);
      ctx.lineTo(bxL + 12, byTop);
      ctx.lineTo(bxL, byTop + 12);
      ctx.lineTo(bxL, byBot - 12);
      ctx.lineTo(bxL + 12, byBot);
      ctx.lineTo(bxL + bracketW, byBot);
      ctx.moveTo(bxR - bracketW, byTop);
      ctx.lineTo(bxR - 12, byTop);
      ctx.lineTo(bxR, byTop + 12);
      ctx.lineTo(bxR, byBot - 12);
      ctx.lineTo(bxR - 12, byBot);
      ctx.lineTo(bxR - bracketW, byBot);
      ctx.stroke();

      // Slow horizontal crimson laser scan pulse
      const laserY = ((timeSec * 42) % (height + 80)) - 40;
      ctx.globalAlpha = 0.26;
      ctx.fillStyle = '#ff2e3b';
      ctx.fillRect(0, laserY, width, 1.5);
      ctx.globalAlpha = 0.06;
      ctx.fillRect(0, laserY - 12, width, 24);
      ctx.globalAlpha = 1;

      // Low-horizon live telemetry bar spectrum
      const barCount = bars.length;
      const spanW = Math.min(width * 0.64, 720);
      const startX = (width - spanW) * 0.5;
      const barStep = spanW / barCount;
      const baseY = height - 22;
      for (let i = 0; i < barCount; i++) {
        const seed = bars[i] ?? 0.5;
        const amp = 0.28 + 0.72 * (0.5 + 0.5 * Math.sin(timeSec * (1.8 + seed * 2.2) + i * 0.45));
        const bh = 6 + amp * 26;
        ctx.globalAlpha = 0.28 + amp * 0.28;
        ctx.fillStyle = i % 7 === 0 ? '#ff7b1a' : '#ff2e3b';
        ctx.fillRect(startX + i * barStep, baseY - bh, Math.max(2, barStep - 4), bh);
      }
      ctx.globalAlpha = 1;
    },
  };
}
