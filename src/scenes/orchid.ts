import { mulberry32 } from './rng';
import type { SceneRenderer } from './types';

interface Spore {
  x: number;
  y: number;
  r: number;
  speedY: number;
  drift: number;
  phase: number;
  color: string;
  alpha: number;
}

interface GridPulse {
  lane: number;
  phase: number;
  speed: number;
  color: string;
}

export function createOrchidScene(initW: number, initH: number): SceneRenderer {
  let width = 1;
  let height = 1;
  let spores: Spore[] = [];
  let pulses: GridPulse[] = [];
  let ridgeHeights: number[] = [];
  let skyGrad: CanvasGradient | null = null;
  let orbGrad: CanvasGradient | null = null;

  const build = (w: number, h: number) => {
    width = Math.max(1, w);
    height = Math.max(1, h);
    const rand = mulberry32(733155);

    spores = [];
    const sporeCount = Math.min(75, Math.max(28, Math.floor((width * height) / 28000)));
    for (let i = 0; i < sporeCount; i++) {
      spores.push({
        x: rand() * width,
        y: rand() * height * 0.62,
        r: 0.9 + rand() * 1.8,
        speedY: 4 + rand() * 10,
        drift: 6 + rand() * 14,
        phase: rand() * Math.PI * 2,
        color: rand() < 0.45 ? '#86ff3b' : '#cf6bff',
        alpha: 0.25 + rand() * 0.55,
      });
    }

    pulses = [];
    for (let i = 0; i < 10; i++) {
      pulses.push({
        lane: Math.floor((rand() - 0.5) * 14),
        phase: rand(),
        speed: 0.26 + rand() * 0.34,
        color: i % 2 === 0 ? '#86ff3b' : '#ff4fd8',
      });
    }

    ridgeHeights = [];
    const pts = 26;
    for (let i = 0; i <= pts; i++) {
      const t = i / pts;
      const centerDip = 0.25 + 0.75 * Math.min(1, Math.abs(t - 0.5) * 2.3);
      ridgeHeights.push((14 + rand() * 58) * centerDip);
    }

    skyGrad = null;
    orbGrad = null;
  };

  build(initW, initH);

  return {
    resize(w, h) {
      build(w, h);
    },
    render(ctx, timeSec) {
      const horizonY = Math.round(height * 0.58);
      const cx = width * 0.5;
      const orbR = Math.min(width, height) * 0.2;

      if (!skyGrad) {
        skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
        skyGrad.addColorStop(0, '#07030e');
        skyGrad.addColorStop(0.55, '#130726');
        skyGrad.addColorStop(1, '#260d42');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, horizonY);

      ctx.fillStyle = '#080410';
      ctx.fillRect(0, horizonY, width, height - horizonY);

      // Drifting bioluminescent spores & stars in upper sky
      for (const s of spores) {
        const sy = ((s.y - timeSec * s.speedY) % horizonY + horizonY) % horizonY;
        const sx = s.x + Math.sin(timeSec * 0.7 + s.phase) * s.drift;
        const twinkle = 0.65 + 0.35 * Math.sin(timeSec * 2.1 + s.phase);
        ctx.globalAlpha = s.alpha * twinkle;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Segmented holographic orb above the horizon
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, width, horizonY);
      ctx.clip();

      if (!orbGrad) {
        orbGrad = ctx.createLinearGradient(0, horizonY - orbR * 1.15, 0, horizonY);
        orbGrad.addColorStop(0, '#86ff3b');
        orbGrad.addColorStop(0.32, '#cf6bff');
        orbGrad.addColorStop(0.75, '#ff4fd8');
        orbGrad.addColorStop(1, '#3b1263');
      }
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = '#cf6bff';
      ctx.beginPath();
      ctx.arc(cx, horizonY - orbR * 0.14, orbR * 1.32, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.74;
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(cx, horizonY - orbR * 0.14, orbR, 0, Math.PI * 2);
      ctx.fill();

      // Horizontal synth cutout bands across lower orb
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#18082b';
      for (let i = 0; i < 5; i++) {
        const bandY = horizonY - orbR * (0.1 + i * 0.14);
        const bandH = 2 + (4 - i) * 1.3;
        ctx.fillRect(cx - orbR - 4, bandY, orbR * 2 + 8, bandH);
      }
      ctx.restore();

      // Low-poly wireframe horizon ridges
      const stepX = width / Math.max(1, ridgeHeights.length - 1);
      ctx.fillStyle = '#0c0517';
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      for (let i = 0; i < ridgeHeights.length; i++) {
        const rh = ridgeHeights[i] ?? 0;
        ctx.lineTo(i * stepX, horizonY - rh);
      }
      ctx.lineTo(width, horizonY);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(207, 107, 255, 0.55)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (let i = 0; i < ridgeHeights.length; i++) {
        const x = i * stepX;
        const y = horizonY - (ridgeHeights[i] ?? 0);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Facet ribs on mountain peaks
      ctx.strokeStyle = 'rgba(134, 255, 59, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 1; i < ridgeHeights.length - 1; i += 2) {
        const x = i * stepX;
        const y = horizonY - (ridgeHeights[i] ?? 0);
        ctx.moveTo(x, y);
        ctx.lineTo(x + stepX * 0.4, horizonY);
      }
      ctx.stroke();

      // Horizon acid-lime laser seam
      ctx.fillStyle = '#86ff3b';
      ctx.globalAlpha = 0.72;
      ctx.fillRect(0, horizonY - 1, width, 2);
      ctx.globalAlpha = 1;

      // 3D perspective scrolling synth grid floor
      const floorH = Math.max(1, height - horizonY);
      const laneCount = 16;
      const spread = width * 1.45;
      ctx.strokeStyle = 'rgba(207, 107, 255, 0.34)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = -laneCount; i <= laneCount; i++) {
        const ratio = i / laneCount;
        ctx.moveTo(cx + ratio * width * 0.08, horizonY);
        ctx.lineTo(cx + ratio * spread, height);
      }
      ctx.stroke();

      // Exponentially spaced scrolling depth rows
      const rowCount = 14;
      const scroll = (timeSec * 0.45) % 1;
      ctx.beginPath();
      for (let r = 0; r < rowCount; r++) {
        const u = (r + scroll) / rowCount;
        const depth = Math.pow(u, 2.35);
        const y = horizonY + depth * floorH;
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.strokeStyle = 'rgba(134, 255, 59, 0.28)';
      ctx.stroke();

      // Acid-lime & magenta pulses racing along perspective grid lanes
      for (const p of pulses) {
        const u = (p.phase + timeSec * p.speed) % 1;
        const d0 = Math.pow(u, 2.35);
        const d1 = Math.pow(Math.min(1, u + 0.08), 2.35);
        const ratio = p.lane / laneCount;
        const xTop = cx + ratio * width * 0.08;
        const xBot = cx + ratio * spread;
        const x0 = xTop + (xBot - xTop) * d0;
        const x1 = xTop + (xBot - xTop) * d1;
        const y0 = horizonY + d0 * floorH;
        const y1 = horizonY + d1 * floorH;

        ctx.globalAlpha = 0.25 + d0 * 0.7;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.6 + d0 * 1.5;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    },
  };
}
