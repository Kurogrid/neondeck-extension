export type ThemeTrackId = 'edgerunners' | 'arasaka' | 'samurai' | 'ghost' | 'orchid';

function createBus(ctx: AudioContext, master: GainNode) {
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16;
  comp.ratio.value = 4;
  comp.attack.value = 0.01;
  comp.release.value = 0.18;
  comp.connect(master);
  return comp;
}

function createNoiseBuffer(ctx: AudioContext, sec = 0.4): AudioBuffer {
  const len = Math.max(1, Math.floor(ctx.sampleRate * sec));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function playKick(ctx: AudioContext, dest: AudioNode, t: number, gain: number): void {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(118, t);
  osc.frequency.exponentialRampToValueAtTime(42, t + 0.12);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  osc.connect(g);
  g.connect(dest);
  osc.start(t);
  osc.stop(t + 0.18);
}

function playNoiseHit(
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

function playSynthNote(
  ctx: AudioContext,
  dest: AudioNode,
  t: number,
  freq: number,
  dur: number,
  gain: number,
  type: OscillatorType,
  cutHz: number,
): void {
  const osc = ctx.createOscillator();
  const f = ctx.createBiquadFilter();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  f.type = 'lowpass';
  f.frequency.setValueAtTime(cutHz, t);
  f.frequency.exponentialRampToValueAtTime(Math.max(180, cutHz * 0.38), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(f);
  f.connect(g);
  g.connect(dest);
  osc.start(t);
  osc.stop(t + dur + 0.03);
}

function makeDriveCurve(amount: number): Float32Array<ArrayBuffer> {
  const n = 256;
  const curve = new Float32Array(new ArrayBuffer(n * 4));
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = Math.tanh(x * amount);
  }
  return curve;
}

// 1. Edgerunners — Neon Drive (122 BPM)
function startEdgerunnersTheme(ctx: AudioContext, master: GainNode): () => void {
  const bus = createBus(ctx, master);
  const noise = createNoiseBuffer(ctx, 0.3);
  const roots = [92.5, 73.42, 55.0, 82.41]; // F#2, D2, A1, E2
  const arpPools = [
    [369.99, 440.0, 554.37, 659.25, 739.99],
    [293.66, 369.99, 440.0, 587.33, 659.25],
    [220.0, 277.18, 329.63, 440.0, 554.37],
    [329.63, 415.3, 493.88, 659.25, 739.99],
  ];
  let step = 0;

  const timer = window.setInterval(() => {
    if (ctx.state !== 'running') return;
    const t = ctx.currentTime;
    const bar = Math.floor(step / 16) % roots.length;
    const pos = step % 16;
    const root = roots[bar]!;

    if (pos % 4 === 0) playKick(ctx, bus, t, 0.34);
    if (pos === 4 || pos === 12) playNoiseHit(ctx, bus, noise, t, 1450, 0.9, 0.12, 0.14, 'bandpass');
    if (pos % 2 === 1) playNoiseHit(ctx, bus, noise, t, 6200, 1.2, 0.045, 0.055, 'highpass');

    // Driving 16th sawtooth bass
    playSynthNote(ctx, bus, t, pos === 14 ? root * 1.5 : root, 0.11, 0.19, 'sawtooth', 920);

    // Neon lead arp
    const pool = arpPools[bar]!;
    if (pos % 2 === 0 || pos === 15) {
      const n = pool[(step * 3 + bar) % pool.length]!;
      playSynthNote(ctx, bus, t, n, 0.19, 0.09, 'triangle', 2600);
    }
    step++;
  }, 123);

  return () => {
    window.clearInterval(timer);
    bus.disconnect();
  };
}

// 2. Arasaka — Corp Protocol (96 BPM)
function startArasakaTheme(ctx: AudioContext, master: GainNode): () => void {
  const bus = createBus(ctx, master);
  const noise = createNoiseBuffer(ctx, 0.25);

  // Dark sub-drone pad
  const droneFilter = ctx.createBiquadFilter();
  droneFilter.type = 'lowpass';
  droneFilter.frequency.value = 280;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.08;
  const lfoG = ctx.createGain();
  lfoG.gain.value = 130;
  lfo.connect(lfoG);
  lfoG.connect(droneFilter.frequency);

  const d1 = ctx.createOscillator();
  const d2 = ctx.createOscillator();
  const dG = ctx.createGain();
  d1.type = 'sawtooth';
  d2.type = 'sawtooth';
  d1.frequency.value = 65.41; // C2
  d2.frequency.value = 98.0;  // G2
  d1.detune.value = -6;
  d2.detune.value = 7;
  dG.gain.value = 0.11;
  d1.connect(dG);
  d2.connect(dG);
  dG.connect(droneFilter);
  droneFilter.connect(bus);
  d1.start();
  d2.start();
  lfo.start();

  const phrygian = [65.41, 69.3, 49.0, 51.91]; // C2, Db2, G1, Ab1
  const chimes = [783.99, 830.61, 1046.5, 622.25];
  let step = 0;

  const timer = window.setInterval(() => {
    if (ctx.state !== 'running') return;
    const t = ctx.currentTime;
    const bar = Math.floor(step / 16) % phrygian.length;
    const pos = step % 16;
    const root = phrygian[bar]!;

    if (pos === 0 || pos === 6 || pos === 10) playKick(ctx, bus, t, 0.36);
    if (pos === 8) playNoiseHit(ctx, bus, noise, t, 1850, 2.4, 0.09, 0.11, 'bandpass');
    if (pos % 4 === 2) playNoiseHit(ctx, bus, noise, t, 5400, 1.5, 0.035, 0.04, 'highpass');

    if (pos % 2 === 0) {
      playSynthNote(ctx, bus, t, root, 0.17, 0.2, 'sawtooth', 480);
    }
    if (pos === 0 || pos === 11) {
      playSynthNote(ctx, bus, t, chimes[(bar + pos) % chimes.length]!, 0.45, 0.055, 'sine', 2800);
    }
    step++;
  }, 156);

  return () => {
    window.clearInterval(timer);
    try { d1.stop(); d2.stop(); lfo.stop(); } catch {}
    d1.disconnect();
    d2.disconnect();
    dG.disconnect();
    lfo.disconnect();
    lfoG.disconnect();
    droneFilter.disconnect();
    bus.disconnect();
  };
}

// 3. Samurai — Chrome Rebel (132 BPM)
function startSamuraiTheme(ctx: AudioContext, master: GainNode): () => void {
  const bus = createBus(ctx, master);
  const noise = createNoiseBuffer(ctx, 0.25);

  const drive = ctx.createWaveShaper();
  drive.curve = makeDriveCurve(4.2);
  drive.oversample = '2x';
  const cab = ctx.createBiquadFilter();
  cab.type = 'lowpass';
  cab.frequency.value = 2300;
  cab.Q.value = 0.9;
  drive.connect(cab);
  cab.connect(bus);

  const riff = [82.41, 82.41, 98.0, 82.41, 110.0, 98.0, 123.47, 146.83]; // E minor chrome-rock
  let step = 0;

  const timer = window.setInterval(() => {
    if (ctx.state !== 'running') return;
    const t = ctx.currentTime;
    const pos = step % 16;

    if (pos % 4 === 0 || pos === 10) playKick(ctx, bus, t, 0.38);
    if (pos === 4 || pos === 12) playNoiseHit(ctx, bus, noise, t, 1700, 0.7, 0.13, 0.17, 'bandpass');
    if (pos % 2 === 0) playNoiseHit(ctx, bus, noise, t, 6800, 1.0, 0.04, 0.05, 'highpass');

    if (pos % 2 === 0) {
      const f = riff[(Math.floor(step / 2)) % riff.length]!;
      const palmMuted = pos % 4 === 2;
      const cut = palmMuted ? 1200 : 2100;
      const dur = palmMuted ? 0.11 : 0.2;
      // Power chord root + fifth through soft overdrive
      playSynthNote(ctx, drive, t, f, dur, 0.11, 'sawtooth', cut);
      playSynthNote(ctx, drive, t, f * 1.498, dur, 0.08, 'sawtooth', cut);
      // Clean sub bass beneath riff
      playSynthNote(ctx, bus, t, f, dur, 0.18, 'triangle', 420);
    }
    step++;
  }, 114);

  return () => {
    window.clearInterval(timer);
    drive.disconnect();
    cab.disconnect();
    bus.disconnect();
  };
}

// 4. Ghost — Deep Net (84 BPM)
function startGhostTheme(ctx: AudioContext, master: GainNode): () => void {
  const bus = createBus(ctx, master);
  const chords: readonly [number, number, number, number][] = [
    [164.81, 246.94, 293.66, 369.99], // Em9
    [130.81, 196.0, 246.94, 293.66],  // Cmaj9
    [110.0, 164.81, 246.94, 293.66],  // Am9
    [123.47, 185.0, 220.0, 293.66],   // Bm7
  ];
  const bells = [659.25, 739.99, 783.99, 987.77, 1174.66];

  const padLP = ctx.createBiquadFilter();
  padLP.type = 'lowpass';
  padLP.frequency.value = 640;
  padLP.connect(bus);

  const voices = chords[0]!.map((f, i) => {
    const oA = ctx.createOscillator();
    const oB = ctx.createOscillator();
    const g = ctx.createGain();
    oA.type = 'triangle';
    oB.type = 'sine';
    oA.frequency.value = f;
    oB.frequency.value = f;
    oA.detune.value = -7;
    oB.detune.value = 7;
    g.gain.value = i === 0 ? 0.13 : 0.085;
    oA.connect(g);
    oB.connect(g);
    g.connect(padLP);
    oA.start();
    oB.start();
    return { oA, oB, g };
  });

  let step = 0;
  const timer = window.setInterval(() => {
    if (ctx.state !== 'running') return;
    const t = ctx.currentTime;
    const bar = Math.floor(step / 8) % chords.length;
    const pos = step % 8;

    if (pos === 0) {
      const c = chords[bar]!;
      voices.forEach((v, idx) => {
        const nf = c[idx] ?? 220;
        v.oA.frequency.setTargetAtTime(nf, t, 0.45);
        v.oB.frequency.setTargetAtTime(nf, t, 0.45);
      });
      playSynthNote(ctx, bus, t, c[0] * 0.5, 1.4, 0.2, 'sine', 240);
    }

    if (pos % 3 === 0 || pos === 5) {
      const bf = bells[(step * 2 + bar) % bells.length]!;
      playSynthNote(ctx, bus, t, bf, 0.72, 0.048, 'sine', 3400);
    }
    step++;
  }, 357);

  return () => {
    window.clearInterval(timer);
    for (const v of voices) {
      try { v.oA.stop(); v.oB.stop(); } catch {}
      v.oA.disconnect();
      v.oB.disconnect();
      v.g.disconnect();
    }
    padLP.disconnect();
    bus.disconnect();
  };
}

// 5. Acid Orchid — Ultraviolet Retrowave (108 BPM)
function startOrchidTheme(ctx: AudioContext, master: GainNode): () => void {
  const bus = createBus(ctx, master);
  const noise = createNoiseBuffer(ctx, 0.25);
  const roots = [110.0, 87.31, 130.81, 98.0]; // Am, F, C, G
  const lead = [659.25, 587.33, 523.25, 440.0, 392.0, 440.0, 523.25, 587.33];
  let step = 0;

  const timer = window.setInterval(() => {
    if (ctx.state !== 'running') return;
    const t = ctx.currentTime;
    const bar = Math.floor(step / 16) % roots.length;
    const pos = step % 16;
    const root = roots[bar]!;

    if (pos % 4 === 0) playKick(ctx, bus, t, 0.34);
    if (pos === 4 || pos === 12) playNoiseHit(ctx, bus, noise, t, 1200, 0.65, 0.16, 0.13, 'bandpass');
    if (pos % 2 === 0) {
      const bassF = pos % 4 === 2 ? root : root * 0.5;
      playSynthNote(ctx, bus, t, bassF, 0.22, 0.2, 'sawtooth', 620);
    }
    if (pos === 0) {
      playSynthNote(ctx, bus, t, root * 2, 1.5, 0.08, 'sawtooth', 980);
      playSynthNote(ctx, bus, t, root * 3, 1.5, 0.06, 'triangle', 1100);
    }
    if (pos % 4 === 2 || pos === 14) {
      const lf = lead[(Math.floor(step / 4) + bar) % lead.length]!;
      playSynthNote(ctx, bus, t, lf, 0.34, 0.075, 'triangle', 2200);
    }
    step++;
  }, 139);

  return () => {
    window.clearInterval(timer);
    bus.disconnect();
  };
}

export function startThemeTrack(track: ThemeTrackId, ctx: AudioContext, master: GainNode): () => void {
  switch (track) {
    case 'edgerunners':
      return startEdgerunnersTheme(ctx, master);
    case 'arasaka':
      return startArasakaTheme(ctx, master);
    case 'samurai':
      return startSamuraiTheme(ctx, master);
    case 'ghost':
      return startGhostTheme(ctx, master);
    case 'orchid':
      return startOrchidTheme(ctx, master);
  }
}
