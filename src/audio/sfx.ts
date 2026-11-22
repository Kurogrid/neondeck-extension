import { ensureAudioContext, getExistingAudioContext } from './context';

export type SfxKind = 'click' | 'toggle' | 'open' | 'close' | 'complete';

function triggerTone(
  ctx: AudioContext,
  type: OscillatorType,
  startTime: number,
  freqStart: number,
  freqEnd: number,
  duration: number,
  peak: number,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, startTime);
  if (freqEnd !== freqStart) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), startTime + duration);
  }
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(peak, startTime + Math.min(0.006, duration * 0.2));
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
}

/**
 * Procedural UI micro-sound synthesis.
 * Never creates or plays audio when disabled or muted.
 */
export function playSfx(kind: SfxKind, enabled: boolean, volume: number): void {
  if (!enabled) return;
  const v = Math.max(0, Math.min(1, volume));
  const peak = v * v * 0.25;
  if (peak <= 0.0005) return;

  const ctx = kind === 'complete' ? getExistingAudioContext() ?? ensureAudioContext() : ensureAudioContext();
  if (!ctx || ctx.state === 'closed') return;
  if (kind === 'complete' && ctx.state === 'suspended') {
    // Avoid noisy autoplay warnings if Pomodoro ends before any gesture unlocked audio.
    return;
  }

  const t0 = ctx.currentTime;
  switch (kind) {
    case 'click':
      triggerTone(ctx, 'triangle', t0, 920, 520, 0.042, peak * 0.85);
      break;
    case 'toggle':
      triggerTone(ctx, 'sine', t0, 580, 740, 0.032, peak * 0.8);
      triggerTone(ctx, 'triangle', t0 + 0.028, 760, 880, 0.04, peak * 0.75);
      break;
    case 'open':
      triggerTone(ctx, 'sine', t0, 420, 760, 0.105, peak * 0.7);
      triggerTone(ctx, 'triangle', t0 + 0.02, 840, 1140, 0.08, peak * 0.35);
      break;
    case 'close':
      triggerTone(ctx, 'sine', t0, 660, 340, 0.085, peak * 0.65);
      break;
    case 'complete':
      triggerTone(ctx, 'triangle', t0, 523.25, 523.25, 0.16, peak * 0.75);
      triggerTone(ctx, 'triangle', t0 + 0.09, 659.25, 659.25, 0.18, peak * 0.75);
      triggerTone(ctx, 'sine', t0 + 0.18, 783.99, 783.99, 0.22, peak * 0.85);
      break;
  }
}
