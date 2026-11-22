function Corner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  return (
    <svg class={`nd-hud-corner nd-hud-corner--${pos}`} viewBox="0 0 44 44" width={44} height={44} focusable="false">
      <path class="nd-hud-corner__arm" d="M2 30V10L10 2H30" />
      <path class="nd-hud-corner__tick" d="M2 36V40M36 2H40M10 10H18" />
      <rect class="nd-hud-corner__node" x="1" y="1" width="3" height="3" />
    </svg>
  );
}

/** Decorative peripheral HUD reticle frame with corner brackets, tick rails, and telemetry strips. */
export function HudFrame() {
  return (
    <div class="nd-hud-frame" aria-hidden="true">
      <Corner pos="tl" />
      <Corner pos="tr" />
      <Corner pos="bl" />
      <Corner pos="br" />

      <div class="nd-hud-strip nd-hud-strip--top">
        <span class="nd-hud-strip__tag">SYS.HUD</span>
        <span class="nd-hud-strip__line" />
        <span class="nd-hud-strip__ticks" />
      </div>

      <div class="nd-hud-rail nd-hud-rail--left">
        <span class="nd-hud-rail__ticks" />
        <span class="nd-hud-rail__pip" />
      </div>

      <div class="nd-hud-rail nd-hud-rail--right">
        <span class="nd-hud-rail__ticks" />
        <span class="nd-hud-rail__pip" />
      </div>

      <div class="nd-hud-strip nd-hud-strip--bottom">
        <span class="nd-hud-strip__tag">ND//V1</span>
        <span class="nd-hud-strip__line" />
        <span class="nd-hud-strip__tag">LINK.OK</span>
      </div>
    </div>
  );
}
