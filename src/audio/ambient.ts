import type { AmbientTrack } from '../core/schema';
import { ensureAudioContext } from './context';
import { startThemeTrack } from './themes';

export type { AmbientTrack };

export interface AmbientRuntimeState {
  playing: boolean;
  track: AmbientTrack;
}

interface Session {
  id: number;
  ctx: AudioContext;
  master: GainNode;
  cleanup: () => void;
}

const CHORDS: readonly [number, number, number, number][] = [
  [146.83, 220.0, 261.63, 329.63], // Dm9
  [116.54, 174.61, 220.0, 293.66], // Bbmaj7
  [130.81, 196.0, 220.0, 261.63],  // C6
  [110.0, 164.81, 196.0, 261.63],  // Am7
];

const targetGain = (volume: number) => {
  const v = Math.max(0, Math.min(1, volume));
  return v * v * 0.38;
};

function createPinkRainBuffer(ctx: AudioContext): AudioBuffer {
  const seconds = 4;
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  const fadeLen = Math.floor(ctx.sampleRate * 0.08);

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;

    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;
      data[i] = pink * 0.065;
    }

    // Crossfade end into start for click-free looping.
    for (let i = 0; i < fadeLen; i++) {
      const t = i / fadeLen;
      const head = data[i] ?? 0;
      const tail = data[length - fadeLen + i] ?? 0;
      const blended = tail * (1 - t) + head * t;
      data[i] = blended;
      data[length - fadeLen + i] = blended;
    }
  }
  return buffer;
}

function startRain(ctx: AudioContext, master: GainNode): () => void {
  const source = ctx.createBufferSource();
  source.buffer = createPinkRainBuffer(ctx);
  source.loop = true;

  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = 900;
  band.Q.value = 0.65;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 2600;

  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.07;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 220;
  lfo.connect(lfoGain);
  lfoGain.connect(band.frequency);

  source.connect(band);
  band.connect(lowpass);
  lowpass.connect(master);

  source.start();
  lfo.start();

  // Subtle distant raindrop texture pings
  const dropTimer = window.setInterval(() => {
    if (ctx.state !== 'running') return;
    if (Math.random() > 0.55) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const f = 1050 + Math.random() * 900;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, t);
    osc.frequency.exponentialRampToValueAtTime(f * 0.72, t + 0.09);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.035, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.095);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + 0.11);
  }, 620);

  return () => {
    window.clearInterval(dropTimer);
    try { source.stop(); } catch {}
    try { lfo.stop(); } catch {}
    source.disconnect();
    band.disconnect();
    lowpass.disconnect();
    lfo.disconnect();
    lfoGain.disconnect();
  };
}

function startSynthwave(ctx: AudioContext, master: GainNode): () => void {
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 580;
  filter.Q.value = 1.4;

  const padGain = ctx.createGain();
  padGain.gain.value = 0.24;

  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.1;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 160;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);

  filter.connect(padGain);
  padGain.connect(master);
  lfo.start();

  let chordIdx = 0;
  const initial = CHORDS[0]!;
  const voices: { oscA: OscillatorNode; oscB: OscillatorNode; gain: GainNode }[] = [];

  for (let i = 0; i < 4; i++) {
    const freq = initial[i] ?? 220;
    const oscA = ctx.createOscillator();
    const oscB = ctx.createOscillator();
    const vGain = ctx.createGain();
    oscA.type = 'sawtooth';
    oscB.type = 'triangle';
    oscA.frequency.value = freq;
    oscB.frequency.value = freq;
    oscA.detune.value = -5;
    oscB.detune.value = 5;
    vGain.gain.value = i === 0 ? 0.22 : 0.14;
    oscA.connect(vGain);
    oscB.connect(vGain);
    vGain.connect(filter);
    oscA.start();
    oscB.start();
    voices.push({ oscA, oscB, gain: vGain });
  }

  // Deep sub-bass root
  const subOsc = ctx.createOscillator();
  const subGain = ctx.createGain();
  subOsc.type = 'sine';
  subOsc.frequency.value = initial[0] * 0.5;
  subGain.gain.value = 0.28;
  subOsc.connect(subGain);
  subGain.connect(master);
  subOsc.start();

  const chordTimer = window.setInterval(() => {
    if (ctx.state !== 'running') return;
    chordIdx = (chordIdx + 1) % CHORDS.length;
    const chord = CHORDS[chordIdx];
    if (!chord) return;
    const t = ctx.currentTime;
    for (let i = 0; i < voices.length; i++) {
      const v = voices[i];
      const f = chord[i];
      if (!v || f === undefined) continue;
      v.oscA.frequency.setTargetAtTime(f, t, 0.35);
      v.oscB.frequency.setTargetAtTime(f, t, 0.35);
    }
    subOsc.frequency.setTargetAtTime(chord[0] * 0.5, t, 0.35);
  }, 4000);

  let arpStep = 0;
  const arpTimer = window.setInterval(() => {
    if (ctx.state !== 'running') return;
    const chord = CHORDS[chordIdx];
    if (!chord) return;
    const note = chord[arpStep % chord.length] ?? 220;
    arpStep++;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(note * 2, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.032, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + 0.4);
  }, 480);

  return () => {
    window.clearInterval(chordTimer);
    window.clearInterval(arpTimer);
    for (const v of voices) {
      try { v.oscA.stop(); } catch {}
      try { v.oscB.stop(); } catch {}
      v.oscA.disconnect();
      v.oscB.disconnect();
      v.gain.disconnect();
    }
    try { subOsc.stop(); } catch {}
    try { lfo.stop(); } catch {}
    subOsc.disconnect();
    subGain.disconnect();
    lfo.disconnect();
    lfoGain.disconnect();
    filter.disconnect();
    padGain.disconnect();
  };
}

class AmbientEngine {
  private session: Session | null = null;
  private nextId = 1;
  private state: AmbientRuntimeState = { playing: false, track: 'off' };
  private listeners = new Set<() => void>();
  private beforeStartHooks = new Set<() => void>();

  private notify(): void {
    for (const fn of this.listeners) fn();
  }

  onBeforeStart(fn: () => void): () => void {
    this.beforeStartHooks.add(fn);
    return () => this.beforeStartHooks.delete(fn);
  }

  private tearDownSession(s: Session, fadeSec: number): void {
    const t = s.ctx.currentTime;
    try {
      s.master.gain.cancelScheduledValues(t);
      s.master.gain.setValueAtTime(Math.max(0.0001, s.master.gain.value), t);
      s.master.gain.linearRampToValueAtTime(0, t + fadeSec);
    } catch {}
    window.setTimeout(() => {
      s.cleanup();
      s.master.disconnect();
    }, Math.round(fadeSec * 1000) + 40);
  }

  start(track: Exclude<AmbientTrack, 'off'>, volume: number): boolean {
    for (const hook of this.beforeStartHooks) hook();
    const ctx = ensureAudioContext();
    if (!ctx) return false;

    if (this.session) {
      this.tearDownSession(this.session, 0.12);
      this.session = null;
    }

    const master = ctx.createGain();
    const t = ctx.currentTime;
    master.gain.setValueAtTime(0.0001, t);
    master.gain.linearRampToValueAtTime(targetGain(volume), t + 0.4);
    master.connect(ctx.destination);

    const cleanup =
      track === 'rain'
        ? startRain(ctx, master)
        : track === 'synthwave'
          ? startSynthwave(ctx, master)
          : startThemeTrack(track, ctx, master);
    this.session = { id: this.nextId++, ctx, master, cleanup };
    this.state = { playing: true, track };
    this.notify();
    return true;
  }

  stop(): void {
    if (!this.session && !this.state.playing) return;
    if (this.session) {
      this.tearDownSession(this.session, 0.25);
      this.session = null;
    }
    this.state = { playing: false, track: 'off' };
    this.notify();
  }

  setVolume(volume: number): void {
    const s = this.session;
    if (!s || s.ctx.state === 'closed') return;
    const t = s.ctx.currentTime;
    s.master.gain.setTargetAtTime(targetGain(volume), t, 0.06);
  }

  getState(): AmbientRuntimeState {
    return this.state;
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}

export const ambientEngine = new AmbientEngine();
