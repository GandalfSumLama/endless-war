'use strict';
// ===== Утилиты, сохранения, ввод, звук, вибрация =====
const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const pick = a => a[(Math.random() * a.length) | 0];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const fmtTime = s => { s = Math.floor(s); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
  const t = l ? clamp(((px - ax) * dx + (py - ay) * dy) / l, 0, 1) : 0;
  const x = ax + dx * t - px, y = ay + dy * t - py;
  return Math.sqrt(x * x + y * y);
}

// Telegram Mini App (null вне Telegram) и мост Android-обёртки (null вне APK)
let TG = (() => { try { const w = window.Telegram && window.Telegram.WebApp; return w && w.initData ? w : null; } catch (e) { return null; } })();
const APP = window.AndroidApp || null;
function refreshTG() {
  try { const w = window.Telegram && window.Telegram.WebApp; if (w && w.initData) TG = w; } catch (e) { }
  return TG;
}
window.addEventListener('telegram-web-app-ready', refreshTG);

// Отладочные флаги из адреса (#auto,dpr1,noground…) — для замеров производительности на телефоне
const DBG = new Set((location.hash || '').slice(1).split(',').filter(Boolean));
const Save = {
  KEY: 'endlesswar_v1',
  data: null,
  defaults() {
    return {
      coins: 0, green: 0, greenV: 2, heroes: ['wanderer'], hero: 'wanderer', skills: DEFAULT_SKILLS.slice(), upgrades: {},
      cleared: [], best: { time: 0, kills: 0 }, evos: [], off: [],
      settings: { numbers: true, haptics: true, sound: true, music: true },
      stats: { runs: 0, kills: 0, coins: 0 }, ts: 0,
    };
  },
  merge(d) {
    const def = this.defaults();
    if (!d || typeof d !== 'object') return def;
    const o = Object.assign(def, d);
    o.settings = Object.assign(this.defaults().settings, d.settings || {});
    o.best = Object.assign({ time: 0, kills: 0 }, d.best || {});
    o.stats = Object.assign({ runs: 0, kills: 0, coins: 0 }, d.stats || {});
    for (const k of ['heroes', 'skills', 'cleared', 'evos', 'off']) if (!Array.isArray(o[k])) o[k] = def[k];
    for (const s of DEFAULT_SKILLS) if (!o.skills.includes(s)) o.skills.push(s);
    if (!HEROES[o.hero] || !o.heroes.includes(o.hero)) o.hero = 'wanderer';
    if (d.greenV !== 2) { o.green = 0; o.greenV = 2; }   // одноразово: убираем стартовый подарок зелёных монет из старых версий
    return o;
  },
  cloudOk() { refreshTG(); return TG && TG.CloudStorage && TG.isVersionAtLeast && TG.isVersionAtLeast('6.9'); },
  load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(this.KEY)); } catch (e) { }
    this.data = this.merge(d);
    if (this.cloudOk()) {
      try {
        TG.CloudStorage.getItem(this.KEY, (err, val) => {
          if (err || !val) return;
          try {
            const c = JSON.parse(val);
            if (c && c.ts > (this.data.ts || 0)) { this.data = this.merge(c); try { localStorage.setItem(this.KEY, val); } catch (e) { } UI.refresh(); }
          } catch (e) { }
        });
      } catch (e) { }
    }
  },
  save() {
    this.data.ts = Date.now();
    const s = JSON.stringify(this.data);
    try { localStorage.setItem(this.KEY, s); } catch (e) { }
    if (this.cloudOk()) { try { TG.CloudStorage.setItem(this.KEY, s); } catch (e) { } }
  },
};

// Плавающий джойстик: палец в любом месте экрана + WASD/стрелки на ПК
const Input = {
  active: false, id: null, ox: 0, oy: 0, x: 0, y: 0, keys: {}, R: 52,
  init(el) {
    el.addEventListener('pointerdown', e => {
      if (Game.state !== 'playing') return;
      const r = el.getBoundingClientRect();
      this.active = true; this.id = e.pointerId;
      this.ox = this.x = e.clientX - r.left; this.oy = this.y = e.clientY - r.top;
      try { el.setPointerCapture(e.pointerId); } catch (_) { }
    });
    el.addEventListener('pointermove', e => {
      if (e.pointerId !== this.id) return;
      const r = el.getBoundingClientRect();
      this.x = e.clientX - r.left; this.y = e.clientY - r.top;
    });
    const up = e => { if (e.pointerId === this.id) { this.active = false; this.id = null; } };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    addEventListener('keydown', e => { this.keys[e.code] = true; if (e.code === 'Escape' || e.code === 'KeyP') Game.togglePause(); if (e.code === 'Space') { e.preventDefault(); Game.useDash(); } });
    addEventListener('keyup', e => { this.keys[e.code] = false; });
    addEventListener('blur', () => { this.keys = {}; this.active = false; });
  },
  reset() { this.active = false; this.id = null; },
  vec() {
    if (DBG.has('auto') && typeof Game !== 'undefined') { const t = Game.time; return { x: Math.cos(t * 0.7), y: Math.sin(t * 0.9) }; }   // отладка: герой бегает сам
    let x = 0, y = 0;
    if (this.active) {
      const dx = this.x - this.ox, dy = this.y - this.oy, d = Math.hypot(dx, dy);
      // джойстик статичный: центр остаётся там, где коснулся палец, ручка ограничена радиусом
      if (d > 4) { const m = Math.min(d, this.R) / this.R; x = dx / d * m; y = dy / d * m; }
    }
    const k = this.keys;
    const kx = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0);
    const ky = (k.KeyS || k.ArrowDown ? 1 : 0) - (k.KeyW || k.ArrowUp ? 1 : 0);
    if (kx || ky) { const l = Math.hypot(kx, ky); x = kx / l; y = ky / l; }
    return { x, y };
  },
};

// Простые синтезированные звуки (без файлов)
const Sfx = {
  ctx: null, last: {},
  init() { if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; } try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } if (typeof Music !== 'undefined') Music.attach(this.ctx); },
  tone(name, f, dur, type, vol, slide, thr) {
    if (!Save.data.settings.sound || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.last[name] && now - this.last[name] < thr) return;
    this.last[name] = now;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, now);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), now + dur);
    g.gain.setValueAtTime(vol, now); g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g); g.connect(this.ctx.destination); o.start(now); o.stop(now + dur + 0.02);
  },
  hit() { this.tone('hit', 160 + Math.random() * 60, 0.05, 'square', 0.02, -70, 0.045); },
  shoot() { this.tone('shoot', 620, 0.06, 'triangle', 0.025, -300, 0.06); },
  gem() { this.tone('gem', 900 + Math.random() * 300, 0.06, 'sine', 0.035, 400, 0.035); },
  coin() { this.tone('coin', 1250, 0.14, 'square', 0.035, 700, 0.05); },
  hurt() { this.tone('hurt', 220, 0.18, 'sawtooth', 0.05, -150, 0.15); },
  boom() { this.tone('boom', 110, 0.3, 'sawtooth', 0.05, -80, 0.08); },
  zap() { this.tone('zap', 1400, 0.12, 'sawtooth', 0.03, -1100, 0.08); },
  nova() { this.tone('nova', 500, 0.35, 'sine', 0.05, 900, 0.2); },
  slash() { this.tone('slash', 300, 0.1, 'triangle', 0.035, 500, 0.08); },
  click() { this.tone('click', 700, 0.05, 'square', 0.03, 0, 0.03); },
  tick() { this.tone('tick', 1100 + Math.random() * 500, 0.03, 'square', 0.018, 0, 0.03); },
  reveal() { this.tone('reveal', 660, 0.14, 'triangle', 0.05, 440, 0.05); },
  level() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone('lv' + i, f, 0.18, 'square', 0.04, 0, 0), i * 70)); },
  evo() { [392, 523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => this.tone('ev' + i, f, 0.22, 'triangle', 0.05, 0, 0), i * 80)); },
};

// Вибрация: Telegram → Android-мост → navigator.vibrate
const Haptic = {
  last: 0,
  imp(kind) {
    if (!Save.data.settings.haptics) return;
    const n = performance.now(); if (n - this.last < 140) return; this.last = n;
    const ms = kind === 'heavy' ? 40 : kind === 'medium' ? 20 : 10;
    try {
      if (TG && TG.HapticFeedback) TG.HapticFeedback.impactOccurred(kind || 'light');
      else if (APP && APP.vibrate) APP.vibrate(ms);
      else if (navigator.vibrate) navigator.vibrate(ms);
    } catch (e) { }
  },
  note(type) {
    if (!Save.data.settings.haptics) return;
    try {
      if (TG && TG.HapticFeedback) TG.HapticFeedback.notificationOccurred(type);
      else if (APP && APP.vibrate) APP.vibrate(type === 'error' ? 120 : 45);
      else if (navigator.vibrate) navigator.vibrate(type === 'error' ? 120 : 45);
    } catch (e) { }
  },
};
