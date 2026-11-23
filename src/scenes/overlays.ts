import { mulberry32 } from './rng';
import type { WallpaperOverlay } from './types';

// Shows the original gate emblem (banner + terminal) on the Arasaka theme.
export const ARASAKA_FAN_EMBLEM = false;

export interface OverlayRenderer {
  render(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void;
}

const NOOP_OVERLAY: OverlayRenderer = {
  render() {},
};

const TERMINAL_LINES = [
  '> SYS: ONLINE',
  '> NODE: LOCAL',
  '> FW: ENGAGED',
  '> ENC: AES-256',
  '> LINK: LOCKED',
  '> CORE: ACTIVE',
  '> SYNC: OK',
] as const;

/** Original gate mark with a lock square (same geometry as the Arasaka-theme banner). */
export function drawArasakaFanEmblem(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  alpha: number,
): void {
  const u = r / 36;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#ff2e3b';
  for (const [x, y, w, h] of [
    [-36, -34, 72, 8],
    [-28, -20, 56, 6],
    [-24, -20, 8, 56],
    [16, -20, 8, 56],
    [-6, -8, 12, 12],
  ] as const) ctx.fillRect(x * u, y * u, w * u, h * u);
  ctx.restore();
}

function drawBoxedTerminal(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  const bx = Math.max(18, Math.round(w * 0.018));
  const bw = Math.round(Math.min(192, Math.max(142, w * 0.145)));
  const bh = Math.round(Math.min(286, Math.max(210, h * 0.36)));
  const by = Math.round((h - bh) * 0.5);
  const ch = 12;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(bx + ch, by);
  ctx.lineTo(bx + bw, by);
  ctx.lineTo(bx + bw, by + bh - ch);
  ctx.lineTo(bx + bw - ch, by + bh);
  ctx.lineTo(bx, by + bh);
  ctx.lineTo(bx, by + ch);
  ctx.closePath();
  ctx.fillStyle = 'rgba(9, 2, 4, 0.84)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 46, 59, 0.78)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Top amber corner notch
  ctx.fillStyle = '#ff7b1a';
  ctx.fillRect(bx + ch + 5, by, 28, 2.5);

  // Diagonal crimson hazard stripe header
  ctx.save();
  ctx.beginPath();
  ctx.rect(bx + 8, by + 9, bw - 16, 13);
  ctx.clip();
  ctx.fillStyle = 'rgba(255, 46, 59, 0.62)';
  for (let sx = bx - 14; sx < bx + bw + 14; sx += 11) {
    ctx.beginPath();
    ctx.moveTo(sx, by + 22);
    ctx.lineTo(sx + 6, by + 9);
    ctx.lineTo(sx + 11, by + 9);
    ctx.lineTo(sx + 5, by + 22);
    ctx.fill();
  }
  ctx.restore();

  ctx.strokeStyle = 'rgba(255, 46, 59, 0.32)';
  ctx.beginPath();
  ctx.moveTo(bx + 8, by + 28);
  ctx.lineTo(bx + bw - 8, by + 28);
  ctx.stroke();

  ctx.font = '10px ui-monospace, Consolas, monospace';
  const rows = 6;
  for (let i = 0; i < rows; i++) {
    const idx = (i + Math.floor(t * 1.15)) % TERMINAL_LINES.length;
    ctx.fillStyle = i === 0 ? '#ff7b1a' : 'rgba(255, 102, 114, 0.9)';
    ctx.fillText(TERMINAL_LINES[idx]!, bx + 11, by + 46 + i * 19);
  }

  // Lower compartment inside boxed terminal
  const footY = by + bh - 56;
  ctx.strokeStyle = 'rgba(255, 46, 59, 0.25)';
  ctx.beginPath();
  ctx.moveTo(bx + 8, footY - 12);
  ctx.lineTo(bx + bw - 8, footY - 12);
  ctx.stroke();

  if (ARASAKA_FAN_EMBLEM) {
    drawArasakaFanEmblem(ctx, bx + bw * 0.5, footY + 20, 20, 0.9);
  } else {
    ctx.font = '600 9px ui-monospace, Consolas, monospace';
    ctx.fillStyle = 'rgba(255, 123, 26, 0.85)';
    ctx.fillText('SEC-LVL // 09', bx + 11, footY + 6);
    const barW = (bw - 22 - 14) / 8;
    const activeBars = 4 + Math.floor((Math.sin(t * 2.1) + 1) * 2);
    for (let s = 0; s < 8; s++) {
      ctx.fillStyle = s < activeBars ? (s >= 6 ? '#ff7b1a' : '#ff2e3b') : 'rgba(255, 46, 59, 0.2)';
      ctx.fillRect(bx + 11 + s * (barW + 2), footY + 14, barW, 6);
    }
  }
  ctx.restore();
}

function drawArasakaCircuits(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  const traces: readonly [number, number][][] = [
    [[w * 0.02, h * 0.16], [w * 0.1, h * 0.16], [w * 0.145, h * 0.23], [w * 0.24, h * 0.23]],
    [[w * 0.98, h * 0.18], [w * 0.89, h * 0.18], [w * 0.84, h * 0.26], [w * 0.76, h * 0.26]],
    [[w * 0.98, h * 0.76], [w * 0.89, h * 0.76], [w * 0.83, h * 0.65], [w * 0.77, h * 0.65]],
    [[w * 0.02, h * 0.82], [w * 0.11, h * 0.82], [w * 0.16, h * 0.75], [w * 0.22, h * 0.75]],
  ];
  ctx.strokeStyle = 'rgba(255, 46, 59, 0.34)';
  ctx.lineWidth = 1.1;
  ctx.strokeRect(10, 10, w - 20, h - 20);

  traces.forEach((pts, idx) => {
    const amber = idx % 2 === 1;
    ctx.strokeStyle = amber ? 'rgba(255, 123, 26, 0.48)' : 'rgba(255, 46, 59, 0.56)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.stroke();

    const prog = (t * 0.34 + idx * 0.25) % 1;
    const si = Math.min(pts.length - 2, Math.floor(prog * (pts.length - 1)));
    const lt = prog * (pts.length - 1) - si;
    const [ax, ay] = pts[si]!;
    const [bx, by] = pts[si + 1]!;
    ctx.fillStyle = amber ? '#ffd180' : '#ffb3b8';
    ctx.fillRect(ax + (bx - ax) * lt - 2, ay + (by - ay) * lt - 2, 4, 4);
  });
}

function drawEqualizer(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  seeds: readonly number[],
  primaryCol: string,
  accentCol: string,
  maxRatio: number,
): void {
  const eqW = Math.min(w * 0.62, 860);
  const startX = (w - eqW) * 0.5;
  const step = eqW / seeds.length;
  const baseY = h - 16;
  for (let i = 0; i < seeds.length; i++) {
    const s = seeds[i]!;
    const amp = 0.22 + 0.78 * (0.5 + 0.5 * Math.sin(t * (2.6 + s * 3.1) + i * 0.42));
    const bh = 3 + amp * (h * maxRatio);
    ctx.fillStyle = i % 9 === 0 ? accentCol : primaryCol;
    ctx.fillRect(startX + i * step, baseY - bh, Math.max(2, step - 3), bh);
  }
}

export function createOverlay(mode: WallpaperOverlay): OverlayRenderer {
  if (mode === 'none') return NOOP_OVERLAY;

  const rand = mulberry32(207709 + mode.length * 131);
  const eqSeeds = Array.from({ length: 52 }, () => rand());
  const drops = Array.from({ length: 90 }, () => ({
    x: rand(), y: rand(), spd: 0.72 + rand() * 0.9, len: 14 + rand() * 24, pick: rand(),
  }));
  const embers = Array.from({ length: 54 }, () => ({
    x: rand(), y: rand(), spd: 0.08 + rand() * 0.22, r: 1.2 + rand() * 2.2,
    drift: (rand() - 0.5) * 0.05,
    col: rand() < 0.58 ? '#ff6e1a' : rand() < 0.85 ? '#ff2438' : '#ffd166',
  }));
  const drips = Array.from({ length: 44 }, (_, i) => ({
    x: (i + 0.35 + rand() * 0.3) / 44, phase: rand(), spd: 0.14 + rand() * 0.22, len: 0.12 + rand() * 0.26,
  }));
  const dust = Array.from({ length: 70 }, () => ({
    x: rand(), y: rand(), r: 0.8 + rand() * 1.7, p: rand() * 6.28, spd: 0.01 + rand() * 0.025,
  }));
  const nodes = Array.from({ length: 24 }, () => ({
    x: 0.08 + rand() * 0.84, y: 0.1 + rand() * 0.8, p: rand(),
  }));
  const matrixCols = Array.from({ length: 26 }, (_, i) => ({
    x: (i + 0.5) / 26, y: rand(), spd: 0.18 + rand() * 0.24, len: 8 + Math.floor(rand() * 10), seed: Math.floor(rand() * 1000),
  }));

  const drawRain = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, colA: string, colB: string, clipXMax = 0) => {
    for (const d of drops) {
      const y = ((d.y + t * d.spd) % 1.15) * h - 24;
      const x = ((d.x - t * d.spd * 0.14 + 10) % 1) * w;
      if (clipXMax > 0 && x > clipXMax) continue;
      ctx.strokeStyle = d.pick < 0.62 ? colA : colB;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - d.len * 0.18, y + d.len);
      ctx.stroke();
    }
  };

  const drawEmbers = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    embers.forEach((e, idx) => {
      const py = (1 - ((e.y + t * e.spd) % 1)) * h;
      const px = ((e.x + Math.sin(t * 1.4 + idx) * 0.015 + e.drift * t + 10) % 1) * w;
      ctx.fillStyle = e.col;
      ctx.globalAlpha = 0.36 + 0.48 * Math.sin(t * 4 + idx);
      ctx.beginPath();
      ctx.arc(px, py, e.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  };

  return {
    render(ctx, w, h, t) {
      switch (mode) {
        case 'arasaka-mainframe':
          drawArasakaCircuits(ctx, w, h, t);
          drawBoxedTerminal(ctx, w, h, t);
          drawEqualizer(ctx, w, h, t, eqSeeds, 'rgba(255, 46, 59, 0.56)', 'rgba(255, 123, 26, 0.72)', 0.075);
          break;

        case 'arasaka-breach': {
          ctx.strokeStyle = 'rgba(255, 46, 59, 0.32)';
          ctx.lineWidth = 1.1;
          ctx.strokeRect(10, 10, w - 20, h - 20);
          for (const d of drips) {
            const prog = (d.phase + t * d.spd) % 1;
            const yEnd = prog * h * 0.54;
            const yStart = Math.max(0, yEnd - d.len * h);
            const g = ctx.createLinearGradient(0, yStart, 0, yEnd);
            g.addColorStop(0, 'rgba(255, 46, 59, 0)');
            g.addColorStop(1, 'rgba(255, 46, 59, 0.62)');
            ctx.strokeStyle = g;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(d.x * w, yStart);
            ctx.lineTo(d.x * w, yEnd);
            ctx.stroke();
          }
          const beamY = ((t * 0.12) % 1) * h;
          ctx.fillStyle = 'rgba(255, 46, 59, 0.14)';
          ctx.fillRect(0, beamY, w, 2);
          drawBoxedTerminal(ctx, w, h, t);
          break;
        }

        case 'arasaka-optic': {
          drawArasakaCircuits(ctx, w, h, t);
          const cx = w * 0.62;
          const cy = h * 0.34;
          const r = Math.min(w, h) * 0.21;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(t * 0.24);
          ctx.strokeStyle = 'rgba(255, 46, 59, 0.5)';
          ctx.lineWidth = 1.6;
          ctx.setLineDash([14, 8]);
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.rotate(-t * 0.52);
          ctx.strokeStyle = 'rgba(255, 123, 26, 0.46)';
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.72, 0.2, Math.PI * 1.45);
          ctx.stroke();
          ctx.restore();
          drawBoxedTerminal(ctx, w, h, t);
          drawEqualizer(ctx, w, h, t, eqSeeds, 'rgba(255, 46, 59, 0.5)', 'rgba(255, 123, 26, 0.66)', 0.068);
          break;
        }

        case 'samurai-ronin':
          drawEmbers(ctx, w, h, t);
          drawEqualizer(ctx, w, h, t, eqSeeds.slice(0, 28), 'rgba(0, 229, 255, 0.55)', 'rgba(255, 36, 56, 0.65)', 0.032);
          break;

        case 'samurai-overpass':
          drawRain(ctx, w, h, t, 'rgba(0, 229, 255, 0.34)', 'rgba(255, 36, 56, 0.32)');
          for (let i = 0; i < 6; i++) {
            const tx = (((t * (0.04 + i * 0.012) + i * 0.21) % 1.1) - 0.05) * w;
            const ty = h * (0.28 + (i % 3) * 0.07);
            ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 110, 26, 0.75)' : 'rgba(0, 229, 255, 0.75)';
            ctx.fillRect(tx, ty, 7, 1.8);
          }
          break;

        case 'edgerunners-rooftop':
          drawRain(ctx, w, h, t, 'rgba(0, 229, 255, 0.4)', 'rgba(253, 238, 11, 0.3)');
          break;

        case 'edgerunners-solar':
          drawEmbers(ctx, w, h, t);
          if (Math.sin(t * 7.2) > 0.72) {
            ctx.strokeStyle = 'rgba(255, 0, 85, 0.72)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(w * 0.07, 0); ctx.lineTo(w * 0.04, h * 0.32); ctx.lineTo(w * 0.08, h * 0.56); ctx.lineTo(w * 0.05, h * 0.88);
            ctx.moveTo(w * 0.93, 0); ctx.lineTo(w * 0.96, h * 0.36); ctx.lineTo(w * 0.91, h * 0.64); ctx.lineTo(w * 0.95, h * 0.92);
            ctx.stroke();
          }
          break;

        case 'edgerunners-lunar':
          dust.forEach((d, idx) => {
            const dx = ((d.x + t * d.spd * 0.5) % 1) * w;
            const dy = ((d.y - t * d.spd * 0.3 + 10) % 1) * h;
            ctx.fillStyle = idx % 4 === 0 ? '#00e5ff' : '#f4f7ff';
            ctx.globalAlpha = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * 2.1 + d.p + idx));
            ctx.fillRect(dx, dy, d.r, d.r);
          });
          ctx.globalAlpha = 1;
          break;

        case 'edgerunners-lounge':
          drawRain(ctx, w, h, t, 'rgba(0, 229, 255, 0.38)', 'rgba(253, 238, 11, 0.3)', w * 0.55);
          break;

        case 'ghost-cyberspace': {
          ctx.font = '11px ui-monospace, Consolas, monospace';
          const hex = '0123456789ABCDEF';
          for (const c of matrixCols) {
            const colX = c.x * w;
            const headY = ((c.y + t * c.spd) % 1.2) * h;
            for (let k = 0; k < c.len; k++) {
              const cy = headY - k * 14;
              if (cy < 0 || cy > h) continue;
              const ch = hex[(c.seed + k + Math.floor(t * 4)) % hex.length]!;
              ctx.fillStyle = k === 0 ? 'rgba(190, 255, 230, 0.7)' : `rgba(57, 255, 176, ${(0.4 * (1 - k / c.len)).toFixed(2)})`;
              ctx.fillText(ch, colX, cy);
            }
          }
          break;
        }

        case 'ghost-neural': {
          const pts = nodes.map((n, i) => ({
            x: ((n.x + Math.sin(t * 0.22 + i) * 0.03) % 1) * w,
            y: ((n.y + Math.cos(t * 0.19 + i) * 0.03) % 1) * h,
          }));
          for (let i = 0; i < pts.length; i++) {
            for (let j = i + 1; j < pts.length; j++) {
              const dist = Math.hypot(pts[i]!.x - pts[j]!.x, pts[i]!.y - pts[j]!.y);
              if (dist < w * 0.16) {
                ctx.strokeStyle = `rgba(0, 216, 255, ${(0.28 * (1 - dist / (w * 0.16))).toFixed(2)})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(pts[i]!.x, pts[i]!.y);
                ctx.lineTo(pts[j]!.x, pts[j]!.y);
                ctx.stroke();
              }
            }
            ctx.fillStyle = i % 2 === 0 ? 'rgba(57, 255, 176, 0.65)' : 'rgba(0, 216, 255, 0.65)';
            ctx.beginPath();
            ctx.arc(pts[i]!.x, pts[i]!.y, 2.2, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }

        case 'orchid-horizon': {
          const hy = h * 0.62;
          const gh = h - hy;
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, hy, w, gh);
          ctx.clip();
          ctx.strokeStyle = 'rgba(207, 107, 255, 0.34)';
          ctx.lineWidth = 1;
          for (let i = -8; i <= 8; i++) {
            ctx.beginPath();
            ctx.moveTo(w * 0.5 + i * w * 0.025, hy);
            ctx.lineTo(w * 0.5 + i * w * 0.22, h);
            ctx.stroke();
          }
          const rows = 9;
          for (let r = 0; r < rows; r++) {
            const p = ((r / rows) + t * 0.28) % 1;
            const y = hy + Math.pow(p, 2.2) * gh;
            ctx.strokeStyle = r % 3 === 0 ? 'rgba(134, 255, 59, 0.34)' : 'rgba(255, 79, 216, 0.3)';
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
          }
          ctx.restore();
          break;
        }

        case 'orchid-megacity':
          drawRain(ctx, w, h, t, 'rgba(207, 107, 255, 0.28)', 'rgba(134, 255, 59, 0.26)');
          dust.slice(0, 34).forEach((d, idx) => {
            const dx = ((d.x + Math.sin(t + idx) * 0.02 + 10) % 1) * w;
            const dy = (1 - ((d.y + t * d.spd) % 1)) * h;
            ctx.fillStyle = idx % 2 === 0 ? 'rgba(134, 255, 59, 0.65)' : 'rgba(255, 79, 216, 0.65)';
            ctx.beginPath();
            ctx.arc(dx, dy, d.r * 1.15, 0, Math.PI * 2);
            ctx.fill();
          });
          break;
      }
    },
  };
}
