import { mulberry32 } from './rng';
import type { SceneRenderer } from './types';

interface WindowCell {
  rx: number;
  ry: number;
  rw: number;
  rh: number;
  color: string;
  alpha: number;
}

interface Building {
  x: number;
  w: number;
  topY: number;
  fill: string;
  trimColor: string;
  hasSpire: boolean;
  beaconFreq: number;
  beaconPhase: number;
  barY: number;
  barW: number;
  windows: WindowCell[];
}

interface TrafficTrail {
  y: number;
  speed: number;
  offset: number;
  len: number;
  color: string;
  alpha: number;
}

interface RainDrop {
  x: number;
  y: number;
  speed: number;
  len: number;
  color: string;
  alpha: number;
}

const WIN_COLORS = ['#fdee0b', '#00e5ff', '#ff0055', '#eaf6ff'] as const;
const RAIN_COLORS = ['#00e5ff', '#fdee0b', '#ff0055'] as const;

export function createEdgerunnersScene(initW: number, initH: number): SceneRenderer {
  let width = 1;
  let height = 1;
  let layers: Building[][] = [];
  let trails: TrafficTrail[] = [];
  let drops: RainDrop[] = [];
  let skyGrad: CanvasGradient | null = null;
  let mistLeft: CanvasGradient | null = null;
  let mistRight: CanvasGradient | null = null;

  const build = (w: number, h: number) => {
    width = Math.max(1, w);
    height = Math.max(1, h);
    const rand = mulberry32(207711);

    layers = [];
    const layerDefs = [
      { count: 24, baseFill: '#0f1224', minH: 0.14, maxH: 0.34, winProb: 0.32, trim: 'rgba(0, 229, 255, 0.2)' },
      { count: 19, baseFill: '#0b0e1c', minH: 0.18, maxH: 0.44, winProb: 0.48, trim: 'rgba(253, 238, 11, 0.28)' },
      { count: 14, baseFill: '#080a14', minH: 0.22, maxH: 0.56, winProb: 0.62, trim: 'rgba(255, 0, 85, 0.38)' },
    ];

    for (const def of layerDefs) {
      const list: Building[] = [];
      let cx = -width * 0.04;
      const step = (width * 1.08) / def.count;
      for (let i = 0; i < def.count; i++) {
        const bw = step * (0.72 + rand() * 0.55);
        const centerNorm = (cx + bw * 0.5) / width;
        // Keep central reading deck skyline lower so clock and search stay crisp.
        const edgeBoost = Math.pow(Math.abs(centerNorm - 0.5) * 2, 1.35) * 0.18;
        const bhFrac = def.minH + rand() * (def.maxH - def.minH) + edgeBoost;
        const bh = Math.min(height * 0.72, height * bhFrac);
        const topY = height - bh;

        const windows: WindowCell[] = [];
        const cols = Math.max(2, Math.floor((bw - 10) / 11));
        const rows = Math.max(3, Math.floor((bh - 22) / 13));
        const colW = (bw - 12) / cols;
        for (let r = 0; r < rows; r++) {
          if (rand() < 0.28) continue;
          for (let c = 0; c < cols; c++) {
            if (rand() > def.winProb) continue;
            const pick = WIN_COLORS[Math.floor(rand() * WIN_COLORS.length)] ?? '#00e5ff';
            windows.push({
              rx: 6 + c * colW,
              ry: 12 + r * 13,
              rw: Math.max(2, colW - 4),
              rh: 5,
              color: pick,
              alpha: 0.14 + rand() * 0.36,
            });
          }
        }

        const pickBarColor = rand() < 0.5 ? '#00e5ff' : rand() < 0.7 ? '#fdee0b' : '#ff0055';
        list.push({
          x: cx,
          w: bw,
          topY,
          fill: def.baseFill,
          trimColor: rand() < 0.45 ? pickBarColor : def.trim,
          hasSpire: rand() < 0.34,
          beaconFreq: 1.4 + rand() * 2.4,
          beaconPhase: rand() * Math.PI * 2,
          barY: topY + 6 + rand() * 14,
          barW: bw * (0.35 + rand() * 0.45),
          windows,
        });
        cx += step * (0.86 + rand() * 0.24);
      }
      layers.push(list);
    }

    trails = [];
    for (let i = 0; i < 16; i++) {
      const dir = i % 2 === 0 ? 1 : -1;
      trails.push({
        y: height * (0.56 + rand() * 0.24),
        speed: dir * (70 + rand() * 130),
        offset: rand() * (width + 260),
        len: 36 + rand() * 88,
        color: dir > 0 ? '#00e5ff' : '#ff0055',
        alpha: 0.24 + rand() * 0.34,
      });
    }

    const dropCount = Math.min(240, Math.max(90, Math.floor((width * height) / 9500)));
    drops = [];
    for (let i = 0; i < dropCount; i++) {
      const color = rand() < 0.68 ? RAIN_COLORS[0] : rand() < 0.75 ? RAIN_COLORS[1] : RAIN_COLORS[2];
      const depth = 0.45 + rand() * 0.9;
      drops.push({
        x: rand() * (width + 180) - 90,
        y: rand() * height,
        speed: 360 + depth * 520,
        len: 14 + depth * 28,
        color,
        alpha: 0.1 + depth * 0.22,
      });
    }

    skyGrad = null;
    mistLeft = null;
    mistRight = null;
  };

  const ensureGradients = (ctx: CanvasRenderingContext2D) => {
    if (!skyGrad) {
      skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#070812');
      skyGrad.addColorStop(0.55, '#111229');
      skyGrad.addColorStop(0.86, '#141933');
      skyGrad.addColorStop(1, '#09111d');
    }
    if (!mistLeft) {
      mistLeft = ctx.createRadialGradient(width * 0.18, height * 0.72, 10, width * 0.18, height * 0.72, width * 0.42);
      mistLeft.addColorStop(0, 'rgba(0, 229, 255, 0.14)');
      mistLeft.addColorStop(1, 'rgba(0, 229, 255, 0)');
    }
    if (!mistRight) {
      mistRight = ctx.createRadialGradient(width * 0.82, height * 0.68, 10, width * 0.82, height * 0.68, width * 0.42);
      mistRight.addColorStop(0, 'rgba(255, 0, 85, 0.13)');
      mistRight.addColorStop(1, 'rgba(255, 0, 85, 0)');
    }
  };

  build(initW, initH);

  return {
    resize(w, h) {
      build(w, h);
    },
    render(ctx, timeSec, dtSec) {
      ensureGradients(ctx);
      if (skyGrad) {
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, height);
      }

      if (mistLeft) {
        ctx.fillStyle = mistLeft;
        ctx.fillRect(0, 0, width, height);
      }
      if (mistRight) {
        ctx.fillStyle = mistRight;
        ctx.fillRect(0, 0, width, height);
      }

      // Draw parallax city layers
      for (let li = 0; li < layers.length; li++) {
        const layer = layers[li];
        if (!layer) continue;
        for (const b of layer) {
          ctx.fillStyle = b.fill;
          ctx.fillRect(b.x, b.topY, b.w, height - b.topY);

          // Rooftop edge highlight
          ctx.fillStyle = b.trimColor;
          ctx.fillRect(b.x, b.topY, b.w, 1.5);

          // Neon horizontal accent stripe on upper facade
          if (b.barW > 18) {
            ctx.globalAlpha = 0.45;
            ctx.fillStyle = b.trimColor;
            ctx.fillRect(b.x + (b.w - b.barW) * 0.5, b.barY, b.barW, 2);
            ctx.globalAlpha = 1;
          }

          // Antenna spire & pulsing beacon
          if (b.hasSpire) {
            const sx = b.x + b.w * 0.5;
            ctx.fillStyle = '#1b2038';
            ctx.fillRect(sx - 1, b.topY - 22, 2, 22);
            const pulse = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(timeSec * b.beaconFreq + b.beaconPhase));
            ctx.globalAlpha = pulse;
            ctx.fillStyle = '#ff0055';
            ctx.fillRect(sx - 1.5, b.topY - 24, 3, 3);
            ctx.globalAlpha = 1;
          }

          for (const win of b.windows) {
            ctx.globalAlpha = win.alpha;
            ctx.fillStyle = win.color;
            ctx.fillRect(b.x + win.rx, b.topY + win.ry, win.rw, win.rh);
          }
          ctx.globalAlpha = 1;
        }

        // Elevated traffic corridors between mid & foreground towers
        if (li === 1) {
          const span = width + 260;
          for (const tr of trails) {
            const rawX = (tr.offset + timeSec * tr.speed) % span;
            const x = (rawX < 0 ? rawX + span : rawX) - 130;
            ctx.globalAlpha = tr.alpha;
            ctx.fillStyle = tr.color;
            ctx.fillRect(x, tr.y, tr.len, 1.6);
            ctx.globalAlpha = tr.alpha * 1.4;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(tr.speed > 0 ? x + tr.len - 4 : x, tr.y, 4, 1.6);
          }
          ctx.globalAlpha = 1;
        }
      }

      // Wet street glow band near bottom edge
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#00e5ff';
      ctx.fillRect(0, height - 3, width, 3);
      ctx.globalAlpha = 1;

      // Diagonal neon rain streaks
      const slopeX = -0.22;
      ctx.lineWidth = 1.1;
      for (const d of drops) {
        if (dtSec > 0) {
          d.y += d.speed * dtSec;
          d.x += d.speed * slopeX * dtSec;
          if (d.y - d.len > height) {
            d.y = -d.len;
            d.x = ((d.x + width + 180) % (width + 180)) - 90;
          }
          if (d.x < -100) d.x += width + 180;
        }
        ctx.globalAlpha = d.alpha;
        ctx.strokeStyle = d.color;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.len * slopeX, d.y + d.len);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    },
  };
}
