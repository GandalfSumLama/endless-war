'use strict';
// ===== Поведение оружия. Каждое: update(g, w, dt), опционально init и draw =====
const WB = {};
const ready = (w, dt) => (w.timer -= dt) <= 0;
// Свечение спрайта: размытый силуэт цвета col с отступом pad (кэш по картинке и цвету; shadowBlur работает и там, где нет ctx.filter)
const GLOW_CACHE = new Map();
function glowSprite(im, col, pad) {
  let m = GLOW_CACHE.get(im); if (!m) GLOW_CACHE.set(im, m = {});
  if (m[col]) return m[col];
  const sil = document.createElement('canvas'); sil.width = im.width; sil.height = im.height;
  const s = sil.getContext('2d'); s.drawImage(im, 0, 0); s.globalCompositeOperation = 'source-in'; s.fillStyle = col; s.fillRect(0, 0, sil.width, sil.height);
  const cv = document.createElement('canvas'); cv.width = im.width + pad * 2; cv.height = im.height + pad * 2;
  const x = cv.getContext('2d'); x.shadowColor = col; x.shadowBlur = pad * 0.8; x.shadowOffsetX = cv.width;   // силуэт за кадром, в кадре — только его тень
  x.drawImage(sil, pad - cv.width, pad); x.drawImage(sil, pad - cv.width, pad);
  return (m[col] = cv);
}
// Плавный поворот угла a к цели b
const hexCol = c => /^#[0-9a-f]{6}$/i.test(c || "") ? c : "#ffffff";   // цвет для World.glowSpr (нужен #rrggbb)
const turnTo = (a, b, k) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; else if (d < -Math.PI) d += TAU; return a + d * Math.min(1, k); };

WB.bolt = {
  update(g, w, dt) {
    if (!ready(w, dt)) return;
    const s = w.s, p = g.player;
    const ts = g.targets(p.x, p.y, s.amount, 460);
    if (!ts.length) { w.timer = 0.15; return; }
    w.timer = s.cd;
    for (let i = 0; i < s.amount; i++) {
      const t = ts[i % ts.length];
      let a = Math.atan2(t.y - p.y, t.x - p.x);
      if (i >= ts.length) a += rand(-0.3, 0.3);
      g.projs.push({ kind: 'bolt', x: p.x, y: p.y, vx: Math.cos(a) * s.speed, vy: Math.sin(a) * s.speed, r: s.size, dmg: s.dmg,
        pierce: s.pierce, life: s.life, color: w.def.color, hit: [], homing: s.homing ? t : null, delay: i * 0.05, w });
    }
    Sfx.shoot();
  },
};

WB.knife = {
  update(g, w, dt) {
    if (!ready(w, dt)) return;
    const s = w.s, p = g.player; w.timer = s.cd;
    for (let i = 0; i < s.amount; i++) {
      const off = (i - (s.amount - 1) / 2) * 9;
      const a = Math.atan2(p.fy, p.fx) + (w.evo ? rand(-0.15, 0.15) : 0);
      g.projs.push({ kind: 'knife', x: p.x, y: p.y, ox: -p.fy * off, oy: p.fx * off, vx: Math.cos(a) * s.speed, vy: Math.sin(a) * s.speed,
        r: s.size, dmg: s.dmg, pierce: s.pierce, life: s.life, color: w.def.color, hit: [], delay: i * 0.035, w, rot: a });
    }
  },
};

WB.aura = {
  update(g, w, dt) {
    const s = w.s, p = g.player;
    g.hitCircle(p.x, p.y, s.radius, e => {
      if (g.time < (e.hitAt[w.uid] || 0)) return;
      e.hitAt[w.uid] = g.time + s.tick;
      const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1;
      g.hurt(e, s.dmg, { kb: { x: dx / d * s.knock * 20, y: dy / d * s.knock * 20 }, leech: s.leech ? 0.4 : 0, slow: s.slowAura ? 0.5 : 0 });
    });
  },
  under: true,
  draw(g, c, w) {
    const s = w.s, p = g.player, pulse = 1 + Math.sin(g.time * 4) * 0.03;
    const ring = w.id === 'aura' ? Art.img.fx_aura_ring : w.id === 'blood_aura' ? Art.hue('fx_aura_ring', 140) : null;   // Кровавая аура — кольцо в красном
    if (ring) {                                      // светящееся кольцо как на иконке, медленно вращается
      const R = s.radius * pulse;
      const gr = c.createRadialGradient(p.x, p.y, R * 0.25, p.x, p.y, R);
      const rgb = w.evo ? '255,40,70' : '60,130,255'; gr.addColorStop(0, 'rgba(' + rgb + ',0)'); gr.addColorStop(1, 'rgba(' + rgb + ',.2)');
      c.fillStyle = gr; c.beginPath(); c.arc(p.x, p.y, R, 0, TAU); c.fill();
      const S = R / 0.46, H = S * ring.height / ring.width, a = g.time * 0.7;   // край кольца на картинке ≈ 46% ширины от центра
      c.save(); c.translate(p.x, p.y);
      c.rotate(-a * 1.6); c.globalAlpha = 0.35; c.drawImage(ring, -S * 0.46, -H * 0.46, S * 0.92, H * 0.92);   // встречный слой — объём
      c.rotate(a * 2.6); c.globalAlpha = 0.85 + Math.sin(g.time * 3) * 0.1; c.drawImage(ring, -S / 2, -H / 2, S, H);
      c.restore(); c.globalAlpha = 1;
      return;
    }
    const gr = c.createRadialGradient(p.x, p.y, s.radius * 0.2, p.x, p.y, s.radius * pulse);
    gr.addColorStop(0, w.def.color + '00'); gr.addColorStop(0.75, w.def.color + '22'); gr.addColorStop(1, w.def.color + '55');
    c.fillStyle = gr; c.beginPath(); c.arc(p.x, p.y, s.radius * pulse, 0, TAU); c.fill();
    c.strokeStyle = w.def.color + '88'; c.lineWidth = 1.5; c.stroke();
  },
};

WB.orbit = {
  init(g, w) { w.ang = 0; w.on = true; w.t = w.s.perm ? 0 : w.s.dur; w.zapT = 0; w.pos = []; },
  update(g, w, dt) {
    const s = w.s, p = g.player;
    if (!s.perm) { w.t -= dt; if (w.t <= 0) { w.on = !w.on; w.t = w.on ? s.dur : s.cd; } } else w.on = true;
    w.pos.length = 0;
    if (!w.on) return;
    w.ang += s.rot * dt;
    if (w.fl) for (let i = 0; i < w.fl.length; i++) if (w.fl[i] > 0) w.fl[i] -= dt;
    for (let i = 0; i < s.amount; i++) {
      const a = w.ang + i * TAU / s.amount, x = p.x + Math.cos(a) * s.radius, y = p.y + Math.sin(a) * s.radius;
      w.pos.push(x, y);
      g.hitCircle(x, y, s.size, e => {
        if (g.time < (e.hitAt[w.uid] || 0)) return;
        e.hitAt[w.uid] = g.time + 0.45;
        const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1;
        g.hurt(e, s.dmg, { kb: { x: dx / d * (s.block ? 280 : 120), y: dy / d * (s.block ? 280 : 120) }, burn: s.burn ? s.dmg * 0.4 : 0, burnT: 2 });
      });
      if (s.block) for (const b of g.ebullets) {        // щиты сбивают вражеские снаряды (щит вспыхивает)
        if (!b.dead && (b.x - x) ** 2 + (b.y - y) ** 2 < (s.size + b.r + 4) ** 2) { b.dead = true; g.burst(b.x, b.y, w.def.color, 6); (w.fl || (w.fl = []))[i] = 0.2; }
      }
    }
    if (s.zap) {
      w.zapT -= dt;
      if (w.zapT <= 0) {
        w.zapT = 0.8;
        for (let i = 0; i < w.pos.length; i += 2) {
          const t = g.nearest(w.pos[i], w.pos[i + 1], 1, 170)[0];
          if (t) g.chain(w.pos[i], w.pos[i + 1], t, s.dmg * 1.2, 3, 140, w.def.color);
        }
      }
    }
  },
  draw(g, c, w) {
    const s = w.s, p = g.player;
    const sim = s.block && Art.img[w.evo ? 'fx_gshield_aegis' : 'fx_gshield'];
    if (sim) {                                       // Щиты-хранители / Эгида: рисованные щиты кружат вокруг героя, за каждым — светящийся след по орбите
      if (!w.pos.length) return;
      const H = s.size * 1.9, W = H * sim.width / sim.height, gl = glowSprite(sim, w.def.color, 10), gk = W / sim.width, dir = s.rot >= 0 ? 1 : -1;
      c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.strokeStyle = w.def.color;
      for (let i = 0; i < w.pos.length; i += 2) {
        const a = Math.atan2(w.pos[i + 1] - p.y, w.pos[i] - p.x);
        c.globalAlpha = 0.18; c.lineWidth = 7; c.beginPath(); c.arc(p.x, p.y, s.radius, a - dir * 0.9, a, dir < 0); c.stroke();
        c.globalAlpha = 0.35; c.lineWidth = 2.5; c.beginPath(); c.arc(p.x, p.y, s.radius, a - dir * 0.55, a, dir < 0); c.stroke();
      }
      c.lineCap = 'butt';
      for (let i = 0; i < w.pos.length; i += 2) {
        const x = w.pos[i], y = w.pos[i + 1] + Math.sin(g.time * 3 + i) * 1.5, fl = w.fl && w.fl[i / 2] > 0 ? w.fl[i / 2] / 0.2 : 0;
        c.save(); c.translate(x, y); c.rotate((x - p.x) / s.radius * 0.18);   // щит чуть наклонён по ходу орбиты
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 + Math.sin(g.time * 4 + i) * 0.12 + fl * 0.5;
        c.drawImage(gl, -gl.width * gk / 2, -gl.height * gk / 2, gl.width * gk, gl.height * gk);
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.drawImage(sim, -W / 2, -H / 2, W, H);
        if (fl) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = fl * 0.7; c.drawImage(sim, -W / 2, -H / 2, W, H); }   // вспышка при отбитом снаряде
        c.restore();
      }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; return;
    }
    if (s.block) {                                   // щиты: минималистичные светящиеся дуги на орбите вокруг героя
      const half = Math.min(0.9, s.size * 1.3 / s.radius, TAU * 0.3 / Math.max(1, w.pos.length / 2));   // половина ширины дуги; между щитами всегда есть зазор
      c.lineCap = 'round';
      for (let i = 0; i < w.pos.length; i += 2) {
        const a = Math.atan2(w.pos[i + 1] - p.y, w.pos[i] - p.x);
        c.strokeStyle = w.def.color + '40'; c.lineWidth = 7;
        c.beginPath(); c.arc(p.x, p.y, s.radius, a - half, a + half); c.stroke();
        c.strokeStyle = w.def.color; c.lineWidth = 2.5;
        c.beginPath(); c.arc(p.x, p.y, s.radius, a - half, a + half); c.stroke();
      }
      c.lineCap = 'butt';
      return;
    }
    const orb = w.id === 'sun_vortex' && Art.img.icon_sun_vortex ? Art.img.icon_sun_vortex : w.id === 'orbit' && Art.img.fx_fire_orb;   // Солнечный вихрь — спираль с иконки
    for (let i = 0; i < w.pos.length; i += 2) {
      const x = w.pos[i], y = w.pos[i + 1];
      if (orb) {
        const S = s.size * (w.evo ? 3.4 : 2.9);
        c.fillStyle = w.def.color + "30"; c.beginPath(); c.arc(x, y, s.size * 1.6, 0, TAU); c.fill();
        c.save(); c.translate(x, y); c.rotate(-g.time * 6 - i); c.drawImage(orb, -S / 2, -S / 2, S, S); c.restore();
        continue;
      }
      if (w.id === 'storm_orbs') {                    // Грозовые сферы: ломаная молния к соседнему шару
        const j = (i + 2) % w.pos.length, nx = w.pos[j], ny = w.pos[j + 1];
        c.strokeStyle = 'rgba(190,230,255,' + (0.5 + Math.random() * 0.4) + ')'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, y);
        for (let k = 1; k < 5; k++) c.lineTo(x + (nx - x) * k / 5 + rand(-6, 6), y + (ny - y) * k / 5 + rand(-6, 6));
        c.lineTo(nx, ny); c.stroke();
      }
      if (w.id === 'storm_orbs' && Art.img.fx_f_plasma) {   // плазменный шар FLARE
        const im = Art.img.fx_f_plasma, m = FLARE_FX.plasma, f = Math.floor(g.time * 12 + i) % m.n, S = s.size * 3 / m.cw;
        c.globalCompositeOperation = 'lighter'; c.drawImage(im, f * m.cw, 0, m.cw, m.ch, x - m.cw * S / 2, y - m.ch * S / 2, m.cw * S, m.ch * S); c.globalCompositeOperation = 'source-over';
        continue;
      }
      c.fillStyle = w.def.color + '44'; c.beginPath(); c.arc(x, y, s.size * 1.7, 0, TAU); c.fill();
      c.fillStyle = w.def.color; c.beginPath(); c.arc(x, y, s.size, 0, TAU); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(x - s.size * 0.3, y - s.size * 0.3, s.size * 0.35, 0, TAU); c.fill();
    }
  },
};

WB.whip = {
  update(g, w, dt) {
    if (!ready(w, dt)) return;
    const s = w.s, p = g.player; w.timer = s.cd;
    for (let i = 0; i < s.amount; i++) {
      const side = (i % 2 === 0 ? 1 : -1) * p.dirX, row = Math.floor(i / 2);
      g.timed.push({ kind: 'call', t: -(row * 0.14 + (i % 2) * 0.1), T: 0, land: () => {
        const cx = p.x + side * s.w / 2, cy = p.y - 4 - row * 16;
        g.query(cx, cy, s.w / 2, e => {
          if (Math.abs(e.x - cx) < s.w / 2 + e.r && Math.abs(e.y - cy) < s.h / 2 + e.r)
            g.hurt(e, s.dmg, { kb: { x: side * 160, y: 0 }, leech: s.leech ? 0.5 : 0 });
        });
        g.fx.push({ kind: 'slash', x: cx, y: cy, w: s.w, h: s.h, side, t: 0, T: 0.22, color: w.def.color, evo: w.evo });
        Sfx.slash();
      } });
    }
  },
};

WB.lightning = {
  update(g, w, dt) {
    if (!ready(w, dt)) return;
    const s = w.s, cands = g.inView();
    if (!cands.length) { w.timer = 0.2; return; }
    w.timer = s.cd;
    for (let i = 0; i < s.amount; i++) {
      const t = g.boss && !g.boss.dead && cands.includes(g.boss) && Math.random() < 0.3 ? g.boss : pick(cands);   // молния бьёт и по боссу
      g.chain(t.x + rand(-30, 30), t.y - 260, t, s.dmg, s.chain, s.range, w.def.color, { critBonus: s.critBonus || 0, big: w.evo });
      g.sfx('thunder', t.x, t.y + 6, 0.35, w.evo ? 0.85 : 0.65, { fade: 1 });   // удар молнии с неба
    }
    Sfx.zap();
  },
};

WB.bomb = {
  update(g, w, dt) {
    if (!ready(w, dt)) return;
    const s = w.s, p = g.player; w.timer = s.cd;
    const cands = g.nearest(p.x, p.y, 8, 320);
    for (let i = 0; i < s.amount; i++) {
      let tx, ty;
      if (cands.length) { const t = pick(cands); tx = t.x; ty = t.y; }
      else { const a = rand(0, TAU), r = rand(60, 160); tx = p.x + Math.cos(a) * r; ty = p.y + Math.sin(a) * r; }
      g.timed.push({ kind: 'lob', sx: p.x, sy: p.y, x: tx, y: ty, t: -i * 0.12, T: 0.55, color: w.def.color, land: () => {
        g.explode(tx, ty, s.radius, s.dmg, s.chill ? '#bfe8ff' : '#ff8a3d', { slow: s.chill ? 1.5 : 0 });
        g.zones.push({ x: tx, y: ty, r: s.radius * 0.9, t: s.dur, T: s.dur, dps: s.burn, tick: 0, color: s.chill ? '#9fe0ff' : '#ff6a20', chill: s.chill, fire: !s.chill });
      } });
    }
  },
};

WB.boomerang = {
  update(g, w, dt) {
    if (!ready(w, dt)) return;
    const s = w.s, p = g.player; w.timer = s.cd;
    const t = g.targets(p.x, p.y, 1, 400)[0];
    const base = t ? Math.atan2(t.y - p.y, t.x - p.x) : Math.atan2(p.fy, p.fx);
    for (let i = 0; i < s.amount; i++) {
      const a = s.spiral ? base + i * TAU / s.amount : base + (i - (s.amount - 1) / 2) * 0.35;
      g.projs.push({ kind: 'boom', id: g.nextId++, x: p.x, y: p.y, vx: Math.cos(a) * s.speed, vy: Math.sin(a) * s.speed, r: s.size, dmg: s.dmg,
        pierce: Infinity, life: 5, hitCd: 0.35, color: w.def.color, w, age: 0, spiral: s.spiral, rot: 0, delay: s.spiral ? 0 : i * 0.08 });
    }
  },
};

WB.nova = {
  update(g, w, dt) {
    if (!ready(w, dt)) return;
    const s = w.s, p = g.player; w.timer = s.cd;
    g.fx.push({ kind: 'ring', x: p.x, y: p.y, r0: 12, r1: s.radius, t: 0, T: 0.4, color: w.def.color, follow: true });
    g.sfx('frost_burst', p.x, p.y, 0.55, s.radius * 2.2 / 140, { follow: 1, glow: 1 });   // ледяная вспышка вокруг героя
    g.hitCircle(p.x, p.y, s.radius, e => { g.hurt(e, s.dmg, { slow: s.slow, freeze: s.freeze, shatter: s.shatter, color: '#bff' }); if (w.id === 'absolute_zero') e.iceCube = 1; else if (g.fx.length < 150 && Math.random() < 0.5) g.sfx('freeze', e.x, e.y + e.r * 0.6, 0.5, 0.5 + e.r * 0.02, { fade: 1 }); });
    Sfx.nova();
  },
};

WB.beam = {
  draw(g, c, w) {                                  // Призма: кристалл с иконки парит над плечом героя
    const im = w.id === 'prism' && Art.img.icon_prism; if (!im) return;
    const p = g.player, x = p.x + 20, y = p.y - 38 + Math.sin(g.time * 2.5) * 3, S = 26;
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5; c.drawImage(im, x - S * 0.7, y - S * 0.7, S * 1.4, S * 1.4);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.drawImage(im, x - S / 2, y - S / 2, S, S);
  },
  update(g, w, dt) {
    if (!ready(w, dt)) return;
    const s = w.s, p = g.player;
    const t = g.targets(p.x, p.y, 1, s.length + 40)[0];
    if (!t) { w.timer = 0.2; return; }
    w.timer = s.cd;
    const base = Math.atan2(t.y - p.y, t.x - p.x), spread = s.rainbow ? 0.3 : 0.45;
    for (let i = 0; i < s.amount; i++) {
      const a = base + (i - (s.amount - 1) / 2) * spread;
      const ex = p.x + Math.cos(a) * s.length, ey = p.y + Math.sin(a) * s.length;
      g.query((p.x + ex) / 2, (p.y + ey) / 2, s.length / 2, e => {
        if (segDist(e.x, e.y, p.x, p.y, ex, ey) < s.width / 2 + e.r) g.hurt(e, s.dmg, {});
      });
      g.fx.push({ kind: 'beam', x: p.x, y: p.y, a, len: s.length, wd: s.width, t: 0, T: 0.3, color: s.rainbow ? 'hsl(' + (i * 60) + ',100%,75%)' : w.def.color, prism: w.id === 'prism' });
    }
    Sfx.zap();
  },
};

WB.meteor = {
  update(g, w, dt) {
    if (!ready(w, dt)) return;
    const s = w.s, p = g.player; w.timer = s.cd;
    const cands = g.inView();
    for (let i = 0; i < s.amount; i++) {
      let tx, ty;
      if (cands.length) { const t = pick(cands); tx = t.x + rand(-10, 10); ty = t.y + rand(-10, 10); }
      else { tx = p.x + rand(-150, 150); ty = p.y + rand(-250, 250); }
      g.timed.push({ kind: 'meteor', x: tx, y: ty, t: -i * 0.15, T: s.delay, r: s.radius, color: w.def.color, evo: w.evo, land: () => {
        g.explode(tx, ty, s.radius, s.dmg, '#b060ff', { burn: 6 });
        if (s.burn) g.zones.push({ x: tx, y: ty, r: s.radius * 0.8, t: s.dur, T: s.dur, dps: s.burn, tick: 0, color: '#9040e0' });
        g.shake = Math.max(g.shake, 4);
      } });
    }
  },
};

// Боевой дрон: объёмная модель в 16 направлениях (tools/cut-weapon-art.ps1); висит в воздухе вокруг героя (тень на земле),
// разворачивается к цели и даёт очередь из пулемёта — трассеры. d.x, d.y — точка на земле под дроном, сам он выше на DRONE_ALT.
const DRONE3D = { cw: 58, ch: 64, ax: 29, ay: 32, idle: 4, fire: 8 }, DRONE_ALT = 30, DRONE_FIRE = 0.45;
WB.drone = {
  init(g, w) { w.drones = []; },
  update(g, w, dt) {
    const s = w.s, p = g.player;
    while (w.drones.length < s.amount) w.drones.push({ x: p.x, y: p.y, t: rand(0, s.cd), dir: -Math.PI / 2, aim: null, fire: 0 });
    const n = w.drones.length, sp = Math.min(0.85, 3.4 / n);
    w.drones.forEach((d, i) => {   // строй дугой за спиной и над героем — дроны не закрывают его; покачиваются
      const a = -Math.PI / 2 + (i - (n - 1) / 2) * sp + Math.sin(g.time * 0.7 + i) * 0.12, rr = 40 + n * 3 + (i % 2) * 12;
      const tx = p.x + Math.cos(a) * rr * 1.15, ty = p.y + 6 + Math.sin(a) * rr * 0.5;
      d.x += (tx - d.x) * Math.min(1, dt * 5); d.y += (ty - d.y) * Math.min(1, dt * 5);
      if (d.fire > 0) d.fire -= dt;
      const want = d.fire > 0 && d.aim !== null ? d.aim : p.moving ? Math.atan2(p.fy, p.fx) : d.dir;   // к цели, пока стреляет, иначе — по ходу героя
      d.dir = turnTo(d.dir, want, dt * 10);
      if ((d.t -= dt) > 0) return;
      const hx = d.x, hy = d.y - DRONE_ALT, t = g.targets(hx, hy, 1, 330)[0];
      if (!t) { d.t = 0.2; return; }
      d.t = s.cd; d.fire = DRONE_FIRE;
      const an = Math.atan2(t.y - hy, t.x - hx); d.aim = an; d.dir = turnTo(d.dir, an, 0.7);
      g.projs.push({ kind: 'dbolt', tracer: 1, x: hx + Math.cos(an) * 12, y: hy + 6 + Math.sin(an) * 12, vx: Math.cos(an) * s.speed, vy: Math.sin(an) * s.speed, r: 4, dmg: s.dmg, pierce: s.pierce, life: 1.2,
        color: w.evo ? w.def.color : '#ffc050', hit: [], w, fixed: true });
    });
  },
  draw(g, c, w) {
    const im = Art.img.fx_drone3d, M = DRONE3D;
    for (const d of w.drones) {
      c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(d.x, d.y, 13, 5, 0, 0, TAU); c.fill();   // тень на земле
      const hy = d.y - DRONE_ALT + Math.sin(g.time * 3 + d.x * 0.05) * 2.5;
      if (im) {
        const row = ((Math.round((d.dir + Math.PI / 2) / (Math.PI / 8)) % 16) + 16) % 16;   // строка 0 — нос вверх, дальше по часовой
        const col = d.fire > 0 ? M.idle + Math.min(M.fire - 1, Math.floor((1 - d.fire / DRONE_FIRE) * M.fire)) : Math.floor(g.time * 12 + d.x * 0.1) % M.idle;
        const S = w.evo ? 0.54 : 0.6;
        if (w.evo) { const R = 24 + Math.sin(g.time * 6 + d.x) * 2; c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55; c.drawImage(World.glowSpr(w.def.color), d.x - R, hy - R, R * 2, R * 2); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }   // Рой дронов: бирюзовое свечение вокруг корпуса
        c.drawImage(im, col * M.cw, row * M.ch, M.cw, M.ch, d.x - M.ax * S, hy - M.ay * S, M.cw * S, M.ch * S);
        continue;
      }
      c.fillStyle = '#2a3440'; c.beginPath(); c.ellipse(d.x, hy, 10, 5, 0, 0, TAU); c.fill();
      c.fillStyle = w.def.color; c.beginPath(); c.arc(d.x, hy - 2, 4, 0, TAU); c.fill();
      c.fillStyle = w.def.color + '88'; c.fillRect(d.x - 12, hy - 1, 24, 2);
    }
  },
};
