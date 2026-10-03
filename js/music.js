'use strict';
// ===== Музыка: 16-битный чиптюн, генерируется на лету (WebAudio, без файлов) =====
// У каждого уровня свой трек (темп, лад, мелодия из «зерна» уровня). Напряжение растёт:
// 0 — начало (бас, барабаны, мелодия), 1 — середина (арпеджио, хэты), 2 — босс (быстрее, тяжелее, мелодия выше).
const Music = {
  ctx: null, bus: null, song: null, want: null, step: 0, nextT: 0, timer: null, level: 0, duck: 1,
  SCALES: { aeolian: [0, 2, 3, 5, 7, 8, 10], phrygian: [0, 1, 3, 5, 7, 8, 10], harmonic: [0, 2, 3, 5, 7, 8, 11], dorian: [0, 2, 3, 5, 7, 9, 10] },
  PROGS: [[0, 5, 3, 4], [0, 3, 4, 0], [0, 6, 5, 4], [0, 1, 0, 6], [0, 5, 6, 4], [0, 3, 6, 4]],

  on() { return Save.data.settings.music !== false; },

  // Вызывается после создания AudioContext (первое касание экрана)
  attach(ctx) {
    if (this.ctx || !ctx) return;
    this.ctx = ctx;
    this.bus = ctx.createGain(); this.bus.gain.value = 0;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3;
    this.bus.connect(comp); comp.connect(ctx.destination);
    const len = ctx.sampleRate * 0.5, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf;
    if (this.want) this.play(this.want.id, this.want.opts);
  },

  // Трек: id — 'menu', номер уровня или 'endless'
  play(id, opts = {}) {
    this.want = { id, opts };
    if (!this.ctx) return;
    if (this.song && this.song.id === id) { this.setVolume(); return; }
    this.song = this.make(id);
    this.level = 0; this.step = 0; this.nextT = this.ctx.currentTime + 0.1;
    this.setVolume();
    clearInterval(this.timer);
    this.timer = setInterval(() => this.tick(), 25);
  },
  stop() { clearInterval(this.timer); this.timer = null; this.song = null; this.want = null; if (this.bus) this.bus.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2); },
  setLevel(l) { this.level = l; },
  setDuck(k) { this.duck = k; this.setVolume(); },
  setVolume() {
    if (!this.bus) return;
    const v = this.on() && this.song ? (this.song.id === 'menu' ? 0.22 : 0.3) * this.duck : 0;
    this.bus.gain.setTargetAtTime(v, this.ctx.currentTime, 0.3);
  },

  // ---------- Сочинение трека по «зерну» ----------
  make(id) {
    let seed = id === 'menu' ? 7 : id === 'endless' ? 99 : (id + 1) * 1337;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }, pk = a => a[Math.floor(rnd() * a.length)];
    const MOODS = [   // настроение уровней: лад, темп, тоника (MIDI)
      { scale: 'aeolian', bpm: 132, root: 45 }, { scale: 'phrygian', bpm: 112, root: 43 }, { scale: 'harmonic', bpm: 124, root: 47 },
      { scale: 'phrygian', bpm: 150, root: 40 }, { scale: 'harmonic', bpm: 138, root: 42 }, { scale: 'phrygian', bpm: 144, root: 44 },
      { scale: 'dorian', bpm: 118, root: 41 }, { scale: 'aeolian', bpm: 146, root: 46 }, { scale: 'dorian', bpm: 140, root: 43 },
      { scale: 'harmonic', bpm: 128, root: 45 }, { scale: 'aeolian', bpm: 136, root: 42 }, { scale: 'phrygian', bpm: 152, root: 40 },
      { scale: 'harmonic', bpm: 120, root: 44 }, { scale: 'phrygian', bpm: 160, root: 41 },
    ];
    const m = id === 'menu' ? { scale: 'aeolian', bpm: 84, root: 45 } : id === 'endless' ? { scale: 'harmonic', bpm: 142, root: 43 } : MOODS[id % MOODS.length];
    const scale = this.SCALES[m.scale], prog = pk(this.PROGS);
    const deg = (d, oct = 0) => { const n = scale.length, o = Math.floor(d / n); return m.root + scale[((d % n) + n) % n] + 12 * (o + oct); };
    // бас: рисунок на 16 шагов (0 — тоника, 7 — октава, -1 — пауза)
    const BASS = [[0, -1, 0, -1, 7, -1, 0, -1, 0, -1, 0, 7, -1, 0, -1, 7], [0, 0, -1, 0, 0, -1, 7, -1, 0, 0, -1, 0, 7, -1, 7, -1], [0, -1, -1, 0, -1, -1, 7, -1, 0, -1, -1, 0, -1, 7, -1, -1], [0, 7, 0, 7, 0, 7, 0, 7, 0, 7, 0, 7, 0, 7, 0, 7]];
    const bass = id === 'menu' ? BASS[2] : pk(BASS);
    // мелодия: мотив на 2 такта (32 шага), повторяется с вариацией
    const motif = [];
    for (let i = 0; i < 32; i++) {
      const strong = i % 4 === 0, p = id === 'menu' ? (strong ? 0.5 : 0.08) : (strong ? 0.8 : 0.35);
      if (rnd() < p) motif.push({ d: pk([0, 2, 4, 4, 7, 5, 3, 1, 6]) + (rnd() < 0.2 ? 7 : 0), len: pk([1, 1, 2, 2, 3, 4]) }); else motif.push(null);
    }
    return { id, bpm: m.bpm, deg, prog, bass, motif, arpPat: pk([[0, 2, 4, 7], [0, 4, 2, 4], [0, 2, 4, 2], [7, 4, 2, 0]]) };
  },

  // ---------- Планировщик ----------
  tick() {
    const s = this.song; if (!s || !this.ctx) return;
    const boss = this.level >= 2, bpm = s.bpm * (boss ? 1.12 : 1), dur = 60 / bpm / 4;
    while (this.nextT < this.ctx.currentTime + 0.15) {
      if (this.on() && this.duck > 0) this.playStep(this.step, this.nextT, dur, s, boss);
      this.nextT += dur; this.step++;
    }
  },
  playStep(step, t, dur, s, boss) {
    const i = step % 16, bar = Math.floor(step / 16), chord = s.prog[bar % 4], lvl = this.level, menu = s.id === 'menu';
    // бас (пульсирующий квадрат)
    const b = s.bass[i];
    if (b >= 0) this.voice(t, s.deg(chord, -1) + (b === 7 ? 12 : 0), dur * 0.9, 'square', menu ? 0.05 : 0.07, 0.35);
    // мелодия
    const mi = (step % 32), note = s.motif[mi];
    if (note && (!menu || bar % 2 === 0)) {
      const up = boss ? 12 : 0, vary = bar % 4 === 3 ? 2 : 0;
      this.voice(t, s.deg(chord + note.d + vary, 1) + up, dur * note.len * 0.95, 'square', menu ? 0.035 : 0.045, 0.125, true);
    }
    // арпеджио — с середины уровня (и тихо в меню)
    if (lvl >= 1 || menu) { const a = s.arpPat[i % 4]; this.voice(t, s.deg(chord + a, 2), dur * 0.5, 'square', menu ? 0.018 : 0.022, 0.25); }
    if (menu) return;
    // барабаны
    if (i === 0 || i === 8 || (lvl >= 1 && i === 10) || (boss && (i === 4 || i === 12 || i === 14))) this.kick(t);
    if (i === 4 || i === 12 || (boss && bar % 2 === 1 && i >= 13)) this.snare(t, boss ? 0.14 : 0.1);
    if (lvl >= 1 ? (boss || i % 2 === 0) : i % 4 === 2) this.hat(t, i % 4 === 2 ? 0.05 : 0.03);
  },

  // ---------- Инструменты ----------
  voice(t, midi, len, type, vol, duty, vib) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(440 * Math.pow(2, (midi - 69) / 12), t);
    if (vib && len > 0.2) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 6; lg.gain.value = 4; l.connect(lg); lg.connect(o.frequency); l.start(t + 0.08); l.stop(t + len); }
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.005); g.gain.setValueAtTime(vol, t + Math.max(0.01, len - 0.03)); g.gain.linearRampToValueAtTime(0, t + len);
    o.connect(g); g.connect(this.bus); o.start(t); o.stop(t + len + 0.02);
  },
  kick(t) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    g.gain.setValueAtTime(0.22, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    o.connect(g); g.connect(this.bus); o.start(t); o.stop(t + 0.18);
  },
  noiseHit(t, vol, len, type, freq) {
    const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noise; f.type = type; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + len);
    s.connect(f); f.connect(g); g.connect(this.bus); s.start(t); s.stop(t + len + 0.02);
  },
  snare(t, v) { this.noiseHit(t, v, 0.14, 'bandpass', 1800); this.voice(t, 50, 0.06, 'triangle', v * 0.5, 0); },
  hat(t, v) { this.noiseHit(t, v, 0.04, 'highpass', 7000); },
};
