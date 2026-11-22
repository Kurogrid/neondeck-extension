import { mulberry32 } from './rng';
import type { SceneRenderer } from './types';

interface MatrixColumn {
  x: number;
  offsetY: number;
  speed: number;
  length: number;
  cellSize: number;
  seed: number;
  depth: number;
  centerFade: number;
}

interface CircuitTrace {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  x3: number;
  y3: number;
  speed: number;
  phase: number;
}

const GLYPHS = '0123456789ABCDEF<>+-/:;[]*';

export function createGhostScene(initW: number, initH: number): SceneRenderer {
  let width = 1;
  let height = 1;
  let columns: MatrixColumn[] = [];
  let traces: CircuitTrace[] = [];
  let bgGrad: CanvasGradient | null = null;

  const build = (w: number, h: number) => {
    width = Math.max(1, w);
    height = Math.max(1, h);
    const rand = mulberry32(900177);

    columns = [];
    const colSpacing = 22;
    const count = Math.max(18, Math.floor(width / colSpacing));
    for (let i = 0; i < count; i++) {
      const depth = rand() < 0.45 ? 0 : 1;
      const cellSize = depth === 0 ? 12 : 15;
      const x = i * colSpacing + (colSpacing - cellSize) * 0.5 + (rand() - 0.5) * 4;
      const normX = x / width;
      // Attenuate slightly in central reading zone to preserve clock and search clarity.
      const distCenter = Math.abs(normX - 0.5) * 2;
      const centerFade = 0.42 + 0.58 * Math.min(1, distCenter / 0.65);

      columns.push({
        x,
        offsetY: rand() * (height + 420),
        speed: (depth === 0 ? 55 : 95) + rand() * 85,
        length: 8 + Math.floor(rand() * 14),
        cellSize,
        seed: Math.floor(rand() * 1000),
        depth,
        centerFade,
      });
    }

    traces = [];
    const sideW = Math.min(200, width * 0.22);
    for (let i = 0; i < 8; i++) {
      const left = i % 2 === 0;
      const y1 = height * (0.14 + (i * 0.1) % 0.72);
      const y2 = y1 + (i % 3 === 0 ? 34 : -28);
      const xStart = left ? 0 : width;
      const xBend = left ? sideW * (0.45 + rand() * 0.4) : width - sideW * (0.45 + rand() * 0.4);
      const xEnd = left ? sideW : width - sideW;
      traces.push({
        x1: xStart,
        y1,
        x2: xBend,
        y2: y1,
        x3: xEnd,
        y3: y2,
        speed: 0.22 + rand() * 0.24,
        phase: rand(),
      });
    }

    bgGrad = null;
  };

  build(initW, initH);

  return {
    resize(w, h) {
      build(w, h);
    },
    render(ctx, timeSec) {
      if (!bgGrad) {
        bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#030a08');
        bgGrad.addColorStop(0.55, '#04120d');
        bgGrad.addColorStop(1, '#061a14');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle vertical fiber-optic atmosphere beams
      ctx.fillStyle = 'rgba(0, 216, 255, 0.035)';
      ctx.fillRect(width * 0.14, 0, 2, height);
      ctx.fillRect(width * 0.86, 0, 2, height);
      ctx.fillStyle = 'rgba(57, 255, 176, 0.025)';
      ctx.fillRect(width * 0.28, 0, 1, height);
      ctx.fillRect(width * 0.72, 0, 1, height);

      // Expanding subtle sonar signal rings near lower outer quadrants
      for (let i = 0; i < 3; i++) {
        const phase = (timeSec * 0.18 + i * 0.33) % 1;
        const r = phase * Math.min(width, height) * 0.34;
        ctx.globalAlpha = (1 - phase) * 0.16;
        ctx.strokeStyle = i % 2 === 0 ? '#39ffb0' : '#00d8ff';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(width * 0.5, height * 0.72, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Outer circuit traces & gliding signal packets
      ctx.lineWidth = 1;
      for (const tr of traces) {
        ctx.globalAlpha = 0.22;
        ctx.strokeStyle = '#39ffb0';
        ctx.beginPath();
        ctx.moveTo(tr.x1, tr.y1);
        ctx.lineTo(tr.x2, tr.y2);
        ctx.lineTo(tr.x3, tr.y3);
        ctx.stroke();

        ctx.globalAlpha = 0.45;
        ctx.fillStyle = '#00d8ff';
        ctx.fillRect(tr.x3 - 2, tr.y3 - 2, 4, 4);

        const p = (tr.phase + timeSec * tr.speed) % 1;
        const px = p < 0.6 ? tr.x1 + (tr.x2 - tr.x1) * (p / 0.6) : tr.x2 + (tr.x3 - tr.x2) * ((p - 0.6) / 0.4);
        const py = p < 0.6 ? tr.y1 : tr.y2 + (tr.y3 - tr.y2) * ((p - 0.6) / 0.4);
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = '#dffcf3';
        ctx.fillRect(px - 2, py - 2, 4, 4);
      }
      ctx.globalAlpha = 1;

      // Falling hex & circuit matrix streams
      ctx.textBaseline = 'top';
      let lastFontSize = 0;
      for (const col of columns) {
        if (col.cellSize !== lastFontSize) {
          ctx.font = `${col.cellSize}px ui-monospace, Consolas, monospace`;
          lastFontSize = col.cellSize;
        }
        const totalSpan = height + col.length * col.cellSize + 80;
        const headY = ((col.offsetY + timeSec * col.speed) % totalSpan) - 40;
        const baseAlpha = (col.depth === 0 ? 0.45 : 0.78) * col.centerFade;
        const tick = Math.floor(timeSec * 5);

        for (let k = 0; k < col.length; k++) {
          const gy = headY - k * (col.cellSize + 2);
          if (gy < -col.cellSize || gy > height) continue;

          const glyphIdx = (col.seed + k * 7 + (k === 0 ? tick : Math.floor((tick + k) / 4))) % GLYPHS.length;
          const ch = GLYPHS.charAt(glyphIdx < 0 ? 0 : glyphIdx);
          const fade = 1 - k / col.length;

          if (k === 0) {
            ctx.globalAlpha = Math.min(0.95, baseAlpha * 1.25);
            ctx.fillStyle = '#dffcf3';
          } else if (k === 1) {
            ctx.globalAlpha = baseAlpha * 0.92;
            ctx.fillStyle = '#00d8ff';
          } else {
            ctx.globalAlpha = baseAlpha * fade * 0.72;
            ctx.fillStyle = '#39ffb0';
          }
          ctx.fillText(ch, col.x, gy);
        }
      }
      ctx.globalAlpha = 1;
    },
  };
}
