type AudioCtor = typeof AudioContext;

let sharedCtx: AudioContext | null = null;

function getAudioCtor(): AudioCtor | null {
  if (typeof window === 'undefined') return null;
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext ??
    null
  );
}

/**
 * Creates or resumes the shared AudioContext.
 * Must only be invoked inside an explicit user gesture or after user unlock.
 */
export function ensureAudioContext(): AudioContext | null {
  const Ctor = getAudioCtor();
  if (!Ctor) return null;
  if (!sharedCtx || sharedCtx.state === 'closed') {
    sharedCtx = new Ctor();
  }
  if (sharedCtx.state === 'suspended') {
    void sharedCtx.resume().catch(() => {});
  }
  return sharedCtx;
}

export function getExistingAudioContext(): AudioContext | null {
  return sharedCtx && sharedCtx.state !== 'closed' ? sharedCtx : null;
}

export function closeAudioContext(): void {
  if (!sharedCtx) return;
  const ctx = sharedCtx;
  sharedCtx = null;
  if (ctx.state !== 'closed') {
    void ctx.close().catch(() => {});
  }
}
