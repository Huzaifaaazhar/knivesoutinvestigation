/**
 * Original procedural sound design, synthesised with the Web Audio API:
 * rain, wind, a low drone, distant thunder, a sparse piano-like motif and
 * all foley (footsteps, doors, paper, pencil). No samples are used.
 */

export type Env = 'outdoor' | 'indoor' | 'basement' | 'muted';
export type Surface = 'wood' | 'stone' | 'carpet' | 'gravel' | 'grass' | 'tile';
export type Sfx =
  | 'door-open'
  | 'door-close'
  | 'locked'
  | 'unlock'
  | 'discover'
  | 'evidence'
  | 'page'
  | 'paper'
  | 'pencil'
  | 'click'
  | 'save'
  | 'seal'
  | 'thunder';

class AudioEngine {
  ctx: AudioContext | null = null;
  master!: GainNode;
  private rainGain!: GainNode;
  private rainFilter!: BiquadFilterNode;
  private windGain!: GainNode;
  private droneGain!: GainNode;
  private musicGain!: GainNode;
  private noiseBuf!: AudioBuffer;
  private env: Env = 'muted';
  private volume = 0.8;
  private timers: number[] = [];

  get ready() {
    return !!this.ctx;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 3;
    this.master = ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(comp).connect(ctx.destination);

    // Pink-ish noise buffer shared by rain, wind and foley
    const len = ctx.sampleRate * 3;
    this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    let b0 = 0,
      b1 = 0,
      b2 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + w * 0.099046;
      b1 = 0.963 * b1 + w * 0.2965164;
      b2 = 0.57 * b2 + w * 1.0526913;
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2;
    }

    // Rain bed
    const rain = ctx.createBufferSource();
    rain.buffer = this.noiseBuf;
    rain.loop = true;
    this.rainFilter = ctx.createBiquadFilter();
    this.rainFilter.type = 'lowpass';
    this.rainFilter.frequency.value = 5000;
    const rainHp = ctx.createBiquadFilter();
    rainHp.type = 'highpass';
    rainHp.frequency.value = 300;
    this.rainGain = ctx.createGain();
    this.rainGain.gain.value = 0;
    rain.connect(rainHp).connect(this.rainFilter).connect(this.rainGain).connect(this.master);
    rain.start();

    // Wind
    const wind = ctx.createBufferSource();
    wind.buffer = this.noiseBuf;
    wind.loop = true;
    wind.playbackRate.value = 0.5;
    const wf = ctx.createBiquadFilter();
    wf.type = 'bandpass';
    wf.frequency.value = 380;
    wf.Q.value = 0.8;
    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoAmt = ctx.createGain();
    lfoAmt.gain.value = 180;
    lfo.connect(lfoAmt).connect(wf.frequency);
    lfo.start();
    wind.connect(wf).connect(this.windGain).connect(this.master);
    wind.start();

    // Drone: low fifth with slow beating
    this.droneGain = ctx.createGain();
    this.droneGain.gain.value = 0;
    const dl = ctx.createBiquadFilter();
    dl.type = 'lowpass';
    dl.frequency.value = 260;
    this.droneGain.connect(dl).connect(this.master);
    for (const [f, type] of [
      [55, 'sine'],
      [55.4, 'triangle'],
      [82.4, 'sine'],
      [110.2, 'sine'],
    ] as [number, OscillatorType][]) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = f > 100 ? 0.25 : 0.5;
      o.connect(g).connect(this.droneGain);
      o.start();
    }

    // Music bus with a feedback delay for space
    this.musicGain = ctx.createGain();
    this.musicGain.gain.value = 0.22;
    const delay = ctx.createDelay();
    delay.delayTime.value = 0.42;
    const fb = ctx.createGain();
    fb.gain.value = 0.38;
    const wet = ctx.createGain();
    wet.gain.value = 0.35;
    this.musicGain.connect(this.master);
    this.musicGain.connect(delay);
    delay.connect(fb).connect(delay);
    delay.connect(wet).connect(this.master);

    this.schedule();
  }

  setVolume(v: number) {
    this.volume = v;
    if (this.ctx) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1);
  }

  setEnvironment(env: Env) {
    if (!this.ctx || env === this.env) return;
    this.env = env;
    const t = this.ctx.currentTime;
    const ramp = (p: AudioParam, v: number, tc = 0.6) => p.setTargetAtTime(v, t, tc);
    switch (env) {
      case 'outdoor':
        ramp(this.rainGain.gain, 0.55);
        ramp(this.rainFilter.frequency, 6500);
        ramp(this.windGain.gain, 0.22);
        ramp(this.droneGain.gain, 0.05);
        break;
      case 'indoor':
        ramp(this.rainGain.gain, 0.28);
        ramp(this.rainFilter.frequency, 900);
        ramp(this.windGain.gain, 0.06);
        ramp(this.droneGain.gain, 0.09);
        break;
      case 'basement':
        ramp(this.rainGain.gain, 0.08);
        ramp(this.rainFilter.frequency, 320);
        ramp(this.windGain.gain, 0.0);
        ramp(this.droneGain.gain, 0.16);
        break;
      case 'muted':
        ramp(this.rainGain.gain, 0);
        ramp(this.windGain.gain, 0);
        ramp(this.droneGain.gain, 0);
        break;
    }
  }

  /** Rain only, for the black opening frames. */
  rainOnly(level = 0.35) {
    if (!this.ctx) return;
    this.env = 'outdoor';
    const t = this.ctx.currentTime;
    this.rainGain.gain.setTargetAtTime(level, t, 1.5);
    this.rainFilter.frequency.setTargetAtTime(5200, t, 0.5);
    this.windGain.gain.setTargetAtTime(0.12, t, 2);
    this.droneGain.gain.setTargetAtTime(0.03, t, 3);
  }

  private schedule() {
    const loop = (fn: () => void, min: number, max: number) => {
      const go = () => {
        fn();
        this.timers.push(window.setTimeout(go, (min + Math.random() * (max - min)) * 1000));
      };
      this.timers.push(window.setTimeout(go, (min + Math.random() * (max - min)) * 1000));
    };
    loop(() => {
      if (this.env === 'outdoor' || this.env === 'indoor') this.play('thunder');
    }, 24, 55);
    loop(() => {
      if (this.env !== 'muted') this.motif();
    }, 28, 48);
  }

  private noise(dur: number, filterType: BiquadFilterType, freq: number, gain: number, q = 1, when = 0, rate = 1) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + when;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.playbackRate.value = rate;
    const f = ctx.createBiquadFilter();
    f.type = filterType;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + Math.min(0.01, dur / 4));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t, Math.random() * 2);
    src.stop(t + dur + 0.05);
    return { f, g, t };
  }

  private tone(freq: number, dur: number, gain: number, type: OscillatorType = 'sine', when = 0, dest?: AudioNode) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(dest ?? this.master);
    o.start(t);
    o.stop(t + dur + 0.05);
    return o;
  }

  /** A short, original minor-key figure, like someone idly touching piano keys in another room. */
  private motif() {
    if (!this.ctx) return;
    const scale = [146.83, 174.61, 196.0, 220.0, 233.08, 261.63, 293.66, 349.23];
    const shapes = [
      [0, 2, 4, 3],
      [4, 3, 1, 0],
      [7, 4, 5, 2],
      [0, 4, 6, 5, 3],
    ];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    shape.forEach((n, i) => {
      const f = scale[n];
      this.tone(f, 2.6, 0.18, 'triangle', i * 0.62, this.musicGain);
      this.tone(f * 2, 1.4, 0.05, 'sine', i * 0.62, this.musicGain);
    });
  }

  footstep(surface: Surface) {
    if (!this.ctx) return;
    const v = 0.85 + Math.random() * 0.3;
    switch (surface) {
      case 'wood':
        this.noise(0.09, 'bandpass', 700 * v, 0.35, 1.2);
        this.tone(90 * v, 0.07, 0.12, 'sine');
        break;
      case 'stone':
      case 'tile':
        this.noise(0.06, 'bandpass', 2400 * v, 0.28, 1.5);
        this.tone(140 * v, 0.04, 0.06, 'sine');
        break;
      case 'carpet':
        this.noise(0.12, 'lowpass', 500 * v, 0.22, 0.7);
        break;
      case 'gravel':
        this.noise(0.18, 'highpass', 1600 * v, 0.3, 0.6);
        this.noise(0.12, 'bandpass', 3200 * v, 0.15, 2, 0.03);
        break;
      case 'grass':
        this.noise(0.16, 'bandpass', 900 * v, 0.14, 0.6);
        break;
    }
  }

  play(s: Sfx) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    switch (s) {
      case 'door-open': {
        const t = ctx.currentTime;
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(220, t);
        o.frequency.linearRampToValueAtTime(140, t + 0.5);
        o.frequency.linearRampToValueAtTime(190, t + 0.75);
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = 900;
        f.Q.value = 6;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.06, t + 0.05);
        g.gain.linearRampToValueAtTime(0.03, t + 0.4);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
        o.connect(f).connect(g).connect(this.master);
        o.start(t);
        o.stop(t + 0.9);
        this.noise(0.05, 'bandpass', 1800, 0.2, 2);
        break;
      }
      case 'door-close':
        this.tone(70, 0.25, 0.35, 'sine');
        this.noise(0.12, 'lowpass', 400, 0.4, 0.7);
        this.noise(0.04, 'bandpass', 2600, 0.15, 3, 0.03);
        break;
      case 'locked':
        for (let i = 0; i < 3; i++) this.noise(0.05, 'bandpass', 2200 + i * 200, 0.3, 4, i * 0.09);
        this.tone(180, 0.08, 0.06, 'square', 0.02);
        break;
      case 'unlock':
        this.noise(0.04, 'bandpass', 3000, 0.3, 4);
        this.noise(0.06, 'bandpass', 1500, 0.35, 3, 0.12);
        this.tone(320, 0.1, 0.06, 'triangle', 0.12);
        break;
      case 'discover':
        this.tone(587.33, 2.2, 0.08, 'sine');
        this.tone(880, 2.0, 0.06, 'sine', 0.12);
        this.tone(1174.66, 1.6, 0.03, 'sine', 0.24);
        break;
      case 'evidence':
        this.tone(293.66, 1.8, 0.12, 'triangle');
        this.tone(440, 1.8, 0.08, 'sine', 0.18);
        this.tone(587.33, 2.4, 0.05, 'sine', 0.36);
        this.noise(0.3, 'highpass', 2500, 0.08, 0.5, 0.05);
        break;
      case 'page': {
        const n = this.noise(0.32, 'bandpass', 1800, 0.22, 0.6);
        n?.f.frequency.linearRampToValueAtTime(4200, n.t + 0.3);
        break;
      }
      case 'paper':
        this.noise(0.25, 'highpass', 2200, 0.18, 0.5);
        this.noise(0.2, 'highpass', 3200, 0.12, 0.5, 0.12);
        break;
      case 'pencil':
        for (let i = 0; i < 4; i++) this.noise(0.07, 'bandpass', 5000 + Math.random() * 1500, 0.07, 3, i * 0.08);
        break;
      case 'click':
        this.noise(0.03, 'bandpass', 2400, 0.12, 3);
        break;
      case 'save':
      case 'seal':
        this.tone(60, 0.3, 0.4, 'sine');
        this.noise(0.1, 'lowpass', 600, 0.4, 0.8);
        this.tone(440, 1.2, 0.04, 'sine', 0.15);
        break;
      case 'thunder': {
        const near = this.env === 'outdoor';
        const n = this.noise(near ? 6 : 5, 'lowpass', near ? 900 : 260, near ? 0.6 : 0.3, 0.5, 0, 0.6);
        n?.f.frequency.exponentialRampToValueAtTime(120, n.t + 4);
        this.noise(near ? 4 : 3, 'lowpass', 160, near ? 0.5 : 0.3, 0.5, 0.25, 0.4);
        window.dispatchEvent(new CustomEvent('ko-lightning', { detail: { near } }));
        break;
      }
    }
  }
}

export const audio = new AudioEngine();
