/** Fixed, non-interactive atmospheric layers: vignette, CRT scanlines, and chromatic glitch overlay. */
export function EffectsLayer({ vignette }: { vignette: boolean }) {
  return (
    <>
      <div class="nd-fx-vignette" data-vignette={vignette ? 'on' : 'off'} aria-hidden="true" />
      <div class="nd-fx-scanlines" aria-hidden="true" />
      <div class="nd-fx-glitch" aria-hidden="true" />
    </>
  );
}
