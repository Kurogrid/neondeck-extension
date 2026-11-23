import { ARASAKA_FAN_EMBLEM } from '../scenes/overlays';

/**
 * Corporate banner shown above the search bar on the Arasaka theme's mainframe wallpaper.
 * Original artwork: a geometric gate mark with a lock square and a block-stencil KUROGRID wordmark.
 */
type Letter = 'K' | 'U' | 'R' | 'O' | 'G' | 'I' | 'D';

// 40x48 block glyphs, drawn for NEONDECK.
const GLYPHS: Record<Letter, string> = {
  K: 'M0 0 H10 V48 H0 Z M14 24 L34 0 H44 L22 24 L44 48 H34 Z',
  U: 'M0 0 H10 V38 H30 V0 H40 V44 L36 48 H4 L0 44 Z',
  R: 'M0 0 H36 L40 4 V22 L36 26 H26 L40 48 H28 L15 26 H10 V48 H0 Z M10 9 V17 H30 V9 Z',
  O: 'M4 0 H36 L40 4 V44 L36 48 H4 L0 44 V4 Z M10 10 V38 H30 V10 Z',
  G: 'M4 0 H40 V10 H10 V38 H30 V30 H20 V21 H40 V44 L36 48 H4 L0 44 V4 Z',
  I: 'M0 0 H40 V9 H25 V39 H40 V48 H0 V39 H15 V9 H0 Z',
  D: 'M0 0 H30 L40 10 V38 L30 48 H0 Z M10 10 V38 H26 L30 34 V14 L26 10 Z',
};

const WORD: readonly Letter[] = ['K', 'U', 'R', 'O', 'G', 'R', 'I', 'D'];

/** Shared with the Arasaka search panel. */
export const ARASAKA_WORD = WORD;
export const ARASAKA_GLYPHS: Record<Letter, string[]> = Object.fromEntries(Object.entries(GLYPHS).map(([k, d]) => [k, [d]])) as Record<Letter, string[]>;
const TICKS = Array.from({ length: 41 }, (_, i) => i);

export function ArasakaBanner() {
  if (!ARASAKA_FAN_EMBLEM) return null;

  return (
    <div class="nd-arasaka-banner" aria-hidden="true">
      <svg class="nd-arasaka-banner__svg" viewBox="0 0 720 108" xmlns="http://www.w3.org/2000/svg">
        {/* Gate mark with lock square */}
        <g transform="translate(120, 46)" fill="#ff2e3b">
          <rect x="-36" y="-34" width="72" height="8" />
          <rect x="-28" y="-20" width="56" height="6" />
          <rect x="-24" y="-20" width="8" height="56" />
          <rect x="16" y="-20" width="8" height="56" />
          <rect x="-6" y="-8" width="12" height="12" />
        </g>

        {/* Block-stencil wordmark */}
        <g transform="translate(184, 22)" fill="#ff2e3b">
          {WORD.map((letter, idx) => (
            <path key={idx} transform={`translate(${idx * 56}, 0)`} d={GLYPHS[letter]} fillRule="evenodd" />
          ))}
        </g>

        {/* Telemetry Rule */}
        <g opacity="0.72">
          <line x1="84" y1="96" x2="636" y2="96" stroke="#ff2e3b" strokeWidth="1" />
          {TICKS.map((i) => {
            const tx = 84 + (i / 40) * 552;
            const tall = i % 10 === 0 ? 8 : i % 5 === 0 ? 5 : 2.5;
            return (
              <rect
                key={i}
                x={tx - 0.6}
                y={96 - tall}
                width="1.2"
                height={tall}
                fill={i % 10 === 0 ? '#ff7b1a' : '#ff2e3b'}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}
