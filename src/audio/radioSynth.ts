export type RadioStyle =
  | 'synthpop'
  | 'punkrock'
  | 'ballad'
  | 'darkwave'
  | 'chromerock'
  | 'industrial'
  | 'hyperpop'
  | 'dreamwave';

export interface RadioSynthSpec {
  style: RadioStyle;
  bpm: number;
  rootHz: number;
  durationSec: number;
  seed: number;
}

function createRadioBus(ctx: AudioContext, master: GainNode) {
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.ratio.value = 4.5;
  comp.attack.value = 0.008;
  comp.release.value = 0.16;
  comp.connect(master);
  return comp;
}

function createNoise(ctx: AudioContext, sec = 0.35): AudioBuffer {
  const len = Math.max(1, Math.floor(ctx.sampleRate * sec));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function makeDrive(amount: number): Float32Array<ArrayBuffer> {
  const n = 256;
  const curve = new Float32Array(new ArrayBuffer(n * 4));
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = Math.tanh(x * amount);
  }
  return curve;
}

function hitKick(ctx: AudioContext, dest: AudioNode, t: number, gain: number, punch = 128): void {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(punch, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.17);
  osc.connect(g);
  g.connect(dest);
  osc.start(t);
  osc.stop(t + 0.19);
}

function hitPerc(
  ctx: AudioContext,
  dest: AudioNode,
  buf: AudioBuffer,
  t: number,
  freq: number,
  q: number,
  dur: number,
  gain: number,
  kind: 'bandpass' | 'highpass',
): void {
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = kind;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f);
  f.connect(g);
  g.connect(dest);
  src.start(t);
  src.stop(t + dur + 0.02);
}

function playTone(
  ctx: AudioContext,
  dest: AudioNode,
  t: number,
  freq: number,
  dur: number,
  gain: number,
  type: OscillatorType,
  cutHz: number,
  detuneCents = 0,
): void {
  const osc = ctx.createOscillator();
  const f = ctx.createBiquadFilter();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  osc.detune.setValueAtTime(detuneCents, t);
  f.type = 'lowpass';
  f.frequency.setValueAtTime(cutHz, t);
  f.frequency.exponentialRampToValueAtTime(Math.max(180, cutHz * 0.42), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(f);
  f.connect(g);
  g.connect(dest);
  osc.start(t);
  osc.stop(t + dur + 0.03);
}

const PROGRESSIONS: Record<RadioStyle, readonly number[]> = {
  synthpop: [0, -2, -4, -5],      // vi - V - IV - III nostalgic anime progression
  dreamwave: [0, 3, -2, -4],      // dreamy shimmer
  ballad: [0, -4, -7, -2],        // emotional wide arc
  darkwave: [0, 1, -2, 0],        // tense neon suspense
  chromerock: [0, 3, 5, 7],       // driving minor power riff
  punkrock: [0, 5, 7, 3],         // rebellious fast chords
  industrial: [0, 1, 6, 3],       // dark phrygian mechanical slam
  hyperpop: [0, 4, 7, 10],        // chaotic bright glitch Pop
};

const LEAD_SCALES: Record<RadioStyle, readonly number[]> = {
  synthpop: [1.0, 1.122, 1.25, 1.498, 1.682, 2.0],
  dreamwave: [1.0, 1.189, 1.335, 1.498, 1.782, 2.0],
  ballad: [1.0, 1.122, 1.189, 1.498, 1.587, 2.0],
  darkwave: [1.0, 1.059, 1.189, 1.498, 1.587, 1.888],
  chromerock: [1.0, 1.189, 1.335, 1.414, 1.498, 1.782],
  punkrock: [1.0, 1.189, 1.335, 1.498, 1.782, 2.0],
  industrial: [1.0, 1.059, 1.335, 1.414, 1.498, 1.587],
  hyperpop: [1.0, 1.25, 1.498, 1.682, 1.888, 2.245],
};

function semiRatio(semi: number): number {
  return Math.pow(2, semi / 12);
}

export function startRadioSynthTrack(
  spec: RadioSynthSpec,
  ctx: AudioContext,
  master: GainNode,
  startOffsetSec = 0,
): () => void {
  const bus = createRadioBus(ctx, master);
  const noise = createNoise(ctx, 0.32);

  const drive = ctx.createWaveShaper();
  drive.curve = makeDrive(spec.style === 'chromerock' || spec.style === 'punkrock' || spec.style === 'industrial' ? 4.4 : 1.6);
  drive.oversample = '2x';
  const cab = ctx.createBiquadFilter();
  cab.type = 'lowpass';
  cab.frequency.value = spec.style === 'industrial' ? 2100 : spec.style === 'ballad' ? 1600 : 2800;
  drive.connect(cab);
  cab.connect(bus);

  const stepMs = Math.max(85, Math.round((60_000 / Math.max(60, spec.bpm)) / 4));
  let step = Math.max(0, Math.floor((Math.max(0, startOffsetSec) * 1000) / stepMs));

  const prog = PROGRESSIONS[spec.style];
  const scale = LEAD_SCALES[spec.style];
  const heavyStyle = spec.style === 'chromerock' || spec.style === 'punkrock' || spec.style === 'industrial';
  const softStyle = spec.style === 'ballad' || spec.style === 'dreamwave';

  const timer = window.setInterval(() => {
    if (ctx.state !== 'running') return;
    const t = ctx.currentTime;
    const bar = Math.floor(step / 16) % prog.length;
    const phrase = Math.floor(step / 64) % 4; // 0: intro, 1: verse, 2: chorus, 3: bridge
    const pos = step % 16;
    const root = spec.rootHz * semiRatio(prog[bar]!);
    const seedPick = (step * 7 + bar * 13 + spec.seed) % scale.length;

    // Kick & Drums
    const kickHit =
      softStyle
        ? pos === 0 || pos === 10
        : spec.style === 'industrial'
          ? pos === 0 || pos === 6 || pos === 10 || (phrase === 2 && pos === 14)
          : pos % 4 === 0 || (heavyStyle && phrase === 2 && pos === 14);
    if (kickHit && !(phrase === 3 && pos >= 12)) {
      hitKick(ctx, bus, t, heavyStyle ? 0.36 : 0.29, spec.style === 'industrial' ? 148 : 124);
    }

    const snareHit = !softStyle ? pos === 4 || pos === 12 : phrase >= 1 && pos === 12;
    if (snareHit) {
      hitPerc(ctx, bus, noise, t, heavyStyle ? 1800 : 1450, 0.85, 0.13, heavyStyle ? 0.16 : 0.11, 'bandpass');
    }

    if (pos % 2 === 1 && !softStyle && phrase !== 0) {
      hitPerc(ctx, bus, noise, t, 6400, 1.1, 0.04, 0.045, 'highpass');
    }

    // Bassline
    if (softStyle) {
      if (pos === 0 || pos === 8) {
        playTone(ctx, bus, t, root * 0.5, 0.65, 0.18, 'triangle', 460);
      }
    } else if (pos % 2 === 0) {
      const oct = spec.style === 'synthpop' && pos % 4 === 2 ? 1.0 : 0.5;
      playTone(ctx, bus, t, root * oct, 0.14, 0.19, 'sawtooth', spec.style === 'darkwave' ? 680 : 940);
    }

    // Harmony / Power Riff / Synth Pad
    if (heavyStyle && pos % 2 === 0 && (phrase >= 1 || pos % 4 === 0)) {
      const muted = pos % 4 === 2;
      const dur = muted ? 0.11 : 0.22;
      const cut = muted ? 1250 : 2300;
      playTone(ctx, drive, t, root, dur, 0.1, 'sawtooth', cut, -4);
      playTone(ctx, drive, t, root * 1.498, dur, 0.075, 'sawtooth', cut, 4);
    } else if (!heavyStyle && pos === 0) {
      playTone(ctx, bus, t, root * 2, 1.35, 0.07, 'triangle', 1200, -5);
      playTone(ctx, bus, t, root * 2 * scale[2]!, 1.35, 0.055, 'sine', 1400, 5);
    }

    // Lead / Arp melody
    const leadTrigger =
      spec.style === 'hyperpop'
        ? pos % 2 === 0 || pos === 15
        : softStyle
          ? pos === 0 || pos === 6 || pos === 10
          : pos % 4 === 0 || pos === 6 || pos === 14;
    if (leadTrigger && (phrase >= 1 || pos === 0)) {
      const mul = scale[seedPick]!;
      const octave = spec.style === 'hyperpop' ? 4 : 2;
      const leadWave: OscillatorType = spec.style === 'synthpop' || spec.style === 'dreamwave' ? 'triangle' : 'sawtooth';
      const destNode = heavyStyle && phrase === 2 ? drive : bus;
      playTone(ctx, destNode, t, root * mul * octave, softStyle ? 0.62 : 0.24, softStyle ? 0.08 : 0.075, leadWave, 2700);
    }

    step++;
  }, stepMs);

  return () => {
    window.clearInterval(timer);
    drive.disconnect();
    cab.disconnect();
    bus.disconnect();
  };
}
