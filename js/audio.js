// ============ 簡易音效合成器（無需音檔） ============
const Sfx = {
  ctx: null,
  enabled: true,
  ensure() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { this.ctx = null; }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  tone(freq, dur, type, vol, slideTo) {
    if (!this.enabled) return;
    this.ensure();
    if (!this.ctx) return;
    type = type || 'square'; vol = vol || 0.12;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g); g.connect(this.ctx.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  },
  noise(dur, vol) {
    if (!this.enabled) return;
    this.ensure();
    if (!this.ctx) return;
    dur = dur || 0.1; vol = vol || 0.2;
    const t0 = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(g); g.connect(this.ctx.destination);
    src.start(t0);
  },
  hoe()     { this.noise(0.09, 0.3); this.tone(80, 0.09, 'sine', 0.35, 50); },
  water()   { this.tone(700, 0.18, 'sine', 0.10, 250); this.noise(0.12, 0.06); },
  plant()   { this.tone(500, 0.07, 'square', 0.12, 700); },
  scythe()  { this.noise(0.14, 0.15); this.tone(900, 0.1, 'sawtooth', 0.05, 300); },
  harvest() { this.tone(400, 0.08, 'square', 0.14, 800); this.tone(800, 0.1, 'square', 0.10, 1200); },
  coin()    { this.tone(900, 0.07, 'square', 0.12); setTimeout(() => Sfx.tone(1350, 0.12, 'square', 0.12), 70); },
  error()   { this.tone(160, 0.15, 'sawtooth', 0.12, 110); },
  pop()     { this.tone(300, 0.06, 'square', 0.12, 500); },
  pet()     { this.tone(660, 0.09, 'sine', 0.12, 880); },
  bark()    { this.tone(320, 0.07, 'square', 0.16, 170); setTimeout(() => Sfx.tone(300, 0.09, 'square', 0.16, 150), 100); },
  meow()    { this.tone(640, 0.12, 'sine', 0.13, 920); setTimeout(() => Sfx.tone(880, 0.2, 'sine', 0.13, 420), 110); },
  sleep()   { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => Sfx.tone(f, 0.18, 'sine', 0.12), i * 110)); },
};
