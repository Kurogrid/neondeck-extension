/** Compact decorative cyber-divider with chamfered end ticks and center reticle. */
export function HudDivider() {
  return (
    <div class="nd-hud-divider" aria-hidden="true">
      <span class="nd-hud-divider__wing" />
      <span class="nd-hud-divider__tick" />
      <span class="nd-hud-divider__node" />
      <span class="nd-hud-divider__tick" />
      <span class="nd-hud-divider__wing" />
    </div>
  );
}
