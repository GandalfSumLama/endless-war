'use strict';
// ===== Дополнительные способности: поведение (данные — в конце data.js) =====

// Кровавые шипы: метка под врагом, затем из земли вырываются шипы
WB.spikes = {
  update(g, w, dt) {
    if (!ready(w, dt)) return;
    const s = w.s, p = g.player, cands = g.nearest(p.x, p.y, 12, s.range);
    if (!cands.length) { w.timer = 0.2; return; }
    w.timer = s.cd;
    for (let i = 0; i < s.amount; i++) {
      const t = cands[i % cands.length], far = i >= cands.length;
      const tx = t.x + (far ? rand(-30, 30) : 0), ty = t.y + (far ? rand(-30, 30) : 0);
      g.timed.push({ kind: 'spike', x: tx, y: ty, t: -i * 0.06, T: s.delay, r: s.radius, color: w.def.color, land: () => {
        g.hitCircle(tx, ty, s.radius, e => g.hurt(e, s.dmg, { kb: { x: 0, y: -60 }, leech: s.leech ? 0.6 : 0 }));
        if (w.id !== 'blood_forest' && Art.img.fx_f_spikes_blood) {   // алые шипы и брызги крови
          g.sfx('spikes_blood', tx, ty + s.radius * 0.3, 0.5, s.radius * 1.7 / FLARE_FX.spikes.cw, { fade: 1 });
          g.sfx('blood', tx, ty - s.radius * 0.4, 0.4, s.radius / 55);
        }
        else g.fx.push({ kind: 'spikes', x: tx, y: ty, r: s.radius, t: 0, T: 0.45, color: w.def.color, seed: Math.random() * 9, icon: w.id === 'blood_forest' ? 'icon_blood_forest' : null });
      } });
    }
  },
};

// Ядовитый след: за героем остаются ядовитые облака
WB.plague = {
  update(g, w, dt) {
    const s = w.s, p = g.player;
    if (!ready(w, dt)) return;
    w.timer = s.cd;
    if (w.lx !== undefined && (p.x - w.lx) ** 2 + (p.y - w.ly) ** 2 < 100 && Math.random() < 0.6) return;   // стоя на месте — реже
    w.lx = p.x; w.ly = p.y;
    if (g.zones.length < 110) g.zones.push({ x: p.x + rand(-6, 6), y: p.y + 10 + rand(-6, 6), r: s.radius, t: s.dur, T: s.dur, dps: s.dmg, tick: rand(0, 0.3), color: w.def.color, chill: s.slow, cloud: 1, skull: Math.random() < 0.3 ? (w.id === 'pestilence' ? 'skull_purple' : 'skull_green') : null });
  },
};

// Сюрикены: летят по раскручивающейся спирали
WB.shuriken = {
  update(g, w, dt) {
    if (!ready(w, dt)) return;
    const s = w.s, p = g.player; w.timer = s.cd;
    const off = Math.random() * TAU;
    for (let i = 0; i < s.amount; i++) {
      const a = off + i * TAU / s.amount;
      g.projs.push({ kind: 'shuriken', x: p.x, y: p.y, vx: Math.cos(a) * s.speed, vy: Math.sin(a) * s.speed, r: s.size, dmg: s.dmg, pierce: s.pierce, life: s.life,
        color: w.def.color, hit: [], w, spiralRate: 1.7, rot: 0 });
    }
    Sfx.slash();
  },
};

// Тотем стража: ставится на землю и сам стреляет
WB.turret = {
  init(g, w) { w.totems = []; },
  update(g, w, dt) {
    const s = w.s, p = g.player;
    for (const t of w.totems) {
      t.t -= dt;
      if ((t.fire -= dt) <= 0) {
        const e = g.targets(t.x, t.y - 20, 1, s.range)[0];
        if (e) {
          t.fire = s.fire; const a = Math.atan2(e.y - (t.y - 24), e.x - t.x);
          g.projs.push({ kind: 'dbolt', x: t.x, y: t.y - 24, vx: Math.cos(a) * s.speed, vy: Math.sin(a) * s.speed, r: 4.5, dmg: s.dmg, pierce: s.pierce || 1, life: 1.2, color: w.def.color, hit: [], w, fixed: true });
        } else t.fire = 0.2;
      }
    }
    w.totems = w.totems.filter(t => t.t > 0);
    if (!ready(w, dt)) return;
    w.timer = s.cd;
    while (w.totems.length < s.amount) {
      const a = rand(0, TAU), d = w.totems.length ? 50 : 0, x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
      w.totems.push({ x, y, t: s.dur, T: s.dur, fire: 0.3, ph: Math.random() * 9 });
      g.fx.push({ kind: 'ring', x, y, r0: 30, r1: 6, t: 0, T: 0.3, color: w.def.color });
    }
  },
  under: true,
  draw(g, c, w) {
    for (const t of w.totems) {
      const fade = Math.min(1, t.t / 0.6), bob = Math.sin(g.time * 3 + t.ph) * 2, top = t.y - 30 + bob;
      c.globalAlpha = fade;
      const fi = w.id === 'fortress' && Art.img.icon_fortress;
      if (fi) {                                    // Крепость: замок с иконки
        const S = 54; c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(t.x, t.y + 2, 20, 6, 0, 0, TAU); c.fill();
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = fade * 0.4; c.drawImage(fi, t.x - S * 0.65, t.y - 24 + bob - S * 0.65, S * 1.3, S * 1.3);
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = fade; c.drawImage(fi, t.x - S / 2, t.y - 24 + bob - S / 2, S, S); c.globalAlpha = 1; continue;
      }
      c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(t.x, t.y + 2, 13, 5, 0, 0, TAU); c.fill();
      c.fillStyle = '#2a3440'; c.beginPath(); c.moveTo(t.x - 9, t.y); c.lineTo(t.x - 6, t.y - 22); c.lineTo(t.x + 6, t.y - 22); c.lineTo(t.x + 9, t.y); c.fill();
      c.fillStyle = '#44525e'; c.fillRect(t.x - 6, t.y - 22, 4, 22);
      const gr = c.createRadialGradient(t.x, top, 0, t.x, top, 14); gr.addColorStop(0, w.def.color); gr.addColorStop(1, w.def.color + '00');
      c.fillStyle = gr; c.beginPath(); c.arc(t.x, top, 14, 0, TAU); c.fill();
      c.fillStyle = w.def.color; c.beginPath(); c.moveTo(t.x, top - 8); c.lineTo(t.x + 5, top); c.lineTo(t.x, top + 8); c.lineTo(t.x - 5, top); c.fill();
      c.globalAlpha = 1;
    }
  },
};

// Ледяные копья: залп во все стороны
WB.radial = {
  update(g, w, dt) {
    if (!ready(w, dt)) return;
    const s = w.s, p = g.player; w.timer = s.cd;
    const off = Math.random() * TAU;
    for (let i = 0; i < s.amount; i++) {
      const a = off + i * TAU / s.amount;
      g.projs.push({ kind: 'lance', x: p.x, y: p.y, vx: Math.cos(a) * s.speed, vy: Math.sin(a) * s.speed, r: s.size, dmg: s.dmg, pierce: s.pierce, life: s.life,
        color: w.def.color, hit: [], w, rot: a, freeze: s.freeze || 0, slowHit: 1.2 });
    }
    Sfx.zap();
  },
};

// Призрачные мечи: рисованные клинки (Wenrexa, CC0) парят у плеч героя остриём вверх, по очереди бросаются на врагов
// и возвращаются; в полёте за мечом тянется призрачный след из его отражений
WB.swords = {
  init(g, w) { w.blades = []; },
  update(g, w, dt) {
    const s = w.s, p = g.player;
    while (w.blades.length < s.amount) w.blades.push({ x: p.x, y: p.y, st: 'idle', t: rand(0, s.cd), ang: -Math.PI / 2, tr: [] });
    const n = w.blades.length;
    w.blades.forEach((b, i) => {
      const hx = p.x + Math.cos(g.time * 1.2 + i * TAU / n) * 34, hy = p.y - 20 + Math.sin(g.time * 1.2 + i * TAU / n) * 16;
      let want = -Math.PI / 2;
      if (b.st === 'idle') {
        b.x += (hx - b.x) * Math.min(1, dt * 8); b.y += (hy - b.y) * Math.min(1, dt * 8);
        if ((b.t -= dt) <= 0) { const e = g.targets(b.x, b.y, 1, 280)[0]; if (e) { b.st = 'dash'; b.tg = e; b.hit = []; b.t = 0.45; } else b.t = 0.2; }
      } else if (b.st === 'dash') {
        const e = b.tg, alive = e && !e.dead, tx = alive ? e.x : b.x, ty = alive ? e.y - e.size * 0.2 : b.y, dx = tx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy) || 1;
        want = Math.atan2(dy, dx); b.x += dx / d * s.speed * dt; b.y += dy / d * s.speed * dt;
        g.hitCircle(b.x, b.y, s.size, en => { if (b.hit.includes(en.id)) return; b.hit.push(en.id); g.hurt(en, s.dmg, { kb: { x: dx / d * 120, y: dy / d * 120 } }); g.burst(b.x, b.y, w.def.color, 3); });
        if ((b.t -= dt) <= 0 || d < 8) { b.st = 'back'; b.t = 0.4; }
      } else {
        const dx = hx - b.x, dy = hy - b.y, d = Math.hypot(dx, dy) || 1;
        want = Math.atan2(dy, dx); b.x += dx / d * s.speed * 0.8 * dt; b.y += dy / d * s.speed * 0.8 * dt;
        if (d < 12 || (b.t -= dt) <= 0) { b.st = 'idle'; b.t = s.cd * rand(0.8, 1.2); }
      }
      b.ang = turnTo(b.ang, want, dt * (b.st === 'dash' ? 30 : 12));   // разворот плавный, к цели — почти мгновенный
      if (b.st !== 'idle') { b.tr.unshift(b.x, b.y, b.ang); if (b.tr.length > 15) b.tr.length = 15; } else if (b.tr.length) b.tr.length = Math.max(0, b.tr.length - 3);
    });
  },
  draw(g, c, w) {
    const s = w.s, im = Art.img[w.evo ? 'fx_sword_dance' : 'fx_sword_ghost'];
    if (!im) return;
    const L = 26 + s.size * 2, H = L * im.height / im.width, gl = glowSprite(im, w.def.color, 10), gk = L / im.width, ox = -L * 0.42;   // ox — меч вращается вокруг середины, ближе к рукояти
    for (const b of w.blades) {
      const bob = b.st === 'idle' ? Math.sin(g.time * 3 + b.x * 0.05) * 2 : 0;
      c.globalCompositeOperation = 'lighter';
      for (let i = 3; i < b.tr.length; i += 3) {     // призрачный след
        c.globalAlpha = 0.35 * (1 - i / 15);
        c.save(); c.translate(b.tr[i], b.tr[i + 1]); c.rotate(b.tr[i + 2]); c.drawImage(gl, ox - 10 * gk, -gl.height * gk / 2, gl.width * gk, gl.height * gk); c.restore();
      }
      c.save(); c.translate(b.x, b.y + bob); c.rotate(b.ang);
      c.globalAlpha = 0.85 + Math.sin(g.time * 5 + b.x) * 0.15; c.drawImage(gl, ox - 10 * gk, -gl.height * gk / 2, gl.width * gk, gl.height * gk);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.9; c.drawImage(im, ox, -H / 2, L, H);
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.4; c.drawImage(im, ox, -H / 2, L, H);   // клинок светится изнутри
      c.restore();
    }
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;   // restore вернул «lighter» из следа
  },
};

// Землетрясение: от героя лучами бежит волна — земля трескается, и вдоль трещины один за другим
// вырываются каменные шипы с лавой (FLARE rupture); каждый шип ранит и оглушает врагов рядом (враг — один раз за удар)
const QUAKE_V = 560, QUAKE_STEP = 18;   // скорость волны (пикс/с) и шаг точек трещины
WB.quake = {
  under: true,         // трещины рисуются на земле под врагами, шипы — эффектами поверх
  init(g, w) { w.cracks = []; },
  update(g, w, dt) {
    const cr = w.cracks || (w.cracks = []);
    for (const k of cr) k.t += dt;
    while (cr.length && cr[0].t >= cr[0].T) cr.shift();
    if (!ready(w, dt)) return;
    const s = w.s, p = g.player, evo = w.evo, hit = new Set(), R = evo ? 30 : 26;
    w.timer = s.cd;
    g.sfx('quake', p.x, p.y + 8, 0.6, Math.min(1.1, s.length / 220), { fade: 1 });   // пыльное кольцо у ног
    const off = Math.random() * TAU;
    for (let i = 0; i < s.amount; i++) {
      const a = off + (i + rand(-0.15, 0.15)) * TAU / s.amount, ux = Math.cos(a), uy = Math.sin(a), pts = [];
      let j = 0, dr = rand(-1, 1);
      for (let d = QUAKE_STEP; d <= s.length; d += QUAKE_STEP) {   // ломаная трещина: плавно уходит в сторону и мелко дрожит
        j = clamp(j + dr * 4 + rand(-5, 5), -26, 26); if (Math.abs(j) > 20) dr = -dr;
        const x = p.x + ux * d - uy * j, y = p.y + uy * d + ux * j;
        pts.push(x, y);
        if (d < 48 || (d / QUAKE_STEP) % 2) continue;                // шипы — через точку и не вплотную к герою
        const sc = (evo ? 0.95 : 0.75) * (1 - d / s.length * 0.35);   // к концу шипы мельче
        g.timed.push({ kind: 'quake', t: -d / QUAKE_V, T: 0.01, land: () => {
          g.hitCircle(x, y, R, e => { if (hit.has(e.id)) return; hit.add(e.id); g.hurt(e, s.dmg, { stun: s.stun }); });
          g.sfx(Math.random() < 0.5 ? 'rupture' : 'rupture2', x, y + 6, 0.5, sc);
        } });
      }
      cr.push({ pts, t: 0, T: s.length / QUAKE_V + 0.7 });
    }
    g.hitCircle(p.x, p.y, 44, e => { hit.add(e.id); g.hurt(e, s.dmg, { stun: s.stun }); });   // и тех, кто вплотную к герою (шипы начинаются дальше)
    g.shake = Math.max(g.shake, 4); Sfx.boom();
  },
  // трещина: тёмный разлом, внутри светится лава; раскрывается вслед за волной и остывает
  draw(g, c, w) {
    if (!w.cracks || !w.cracks.length) return;
    const lava = w.evo ? '#ff6a1a' : '#ff8a2a';
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (const k of w.cracks) {
      const n = Math.min(k.pts.length, Math.floor(k.t * QUAKE_V / QUAKE_STEP) * 2), a = Math.min(1, (k.T - k.t) / 0.5);
      if (n < 4) continue;
      c.beginPath(); c.moveTo(k.pts[0], k.pts[1]); for (let i = 2; i < n; i += 2) c.lineTo(k.pts[i], k.pts[i + 1]);
      c.globalAlpha = a * 0.7; c.strokeStyle = '#140904'; c.lineWidth = w.evo ? 7 : 5; c.stroke();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = a * 0.16; c.strokeStyle = lava; c.lineWidth = w.evo ? 12 : 9; c.stroke();     // мягкое свечение вокруг
      c.globalAlpha = a * 0.85; c.lineWidth = w.evo ? 2.4 : 1.7; c.stroke();                          // лава внутри
      c.globalCompositeOperation = 'source-over';
    }
    c.globalAlpha = 1; c.lineCap = 'butt'; c.lineJoin = 'miter';
  },
};

// Звездопад: звёзды непрерывно падают на врагов рядом с героем
WB.starfall = {
  update(g, w, dt) {
    if (!ready(w, dt)) return;
    const s = w.s, p = g.player; w.timer = s.cd;
    const cands = g.nearest(p.x, p.y, 10, s.range);
    for (let i = 0; i < s.amount; i++) {
      const t = cands.length ? pick(cands) : null;
      const tx = t ? t.x + rand(-10, 10) : p.x + rand(-1, 1) * s.range * 0.6, ty = t ? t.y + rand(-10, 10) : p.y + rand(-1, 1) * s.range * 0.6;
      g.timed.push({ kind: 'star', x: tx, y: ty, t: -i * 0.08, T: 0.4, r: s.radius, color: w.def.color, evo: w.evo, land: () => {
        g.hitCircle(tx, ty, s.radius, e => g.hurt(e, s.dmg, {}));
        g.fx.push({ kind: 'boom', x: tx, y: ty, r: s.radius, t: 0, T: 0.25, color: w.def.color });
      } });
    }
  },
};

// Вихрь: уходит от героя, петляя, и затягивает врагов к центру
WB.tornado = {
  update(g, w, dt) {
    if (!ready(w, dt)) return;
    const s = w.s, p = g.player; w.timer = s.cd;
    for (let i = 0; i < s.amount; i++) {
      const a = Math.atan2(p.fy, p.fx) + (i - (s.amount - 1) / 2) * 0.8 + rand(-0.3, 0.3);
      g.projs.push({ kind: 'tornado', id: g.nextId++, x: p.x, y: p.y, vx: Math.cos(a) * s.speed, vy: Math.sin(a) * s.speed, r: s.size, dmg: s.dmg, pierce: Infinity, life: s.life,
        hitCd: 0.3, color: w.def.color, w, pull: 1, wobble: Math.random() * 9 });
    }
  },
};

// Стая мышей: самонаводящиеся летучие мыши
WB.batswarm = {
  update(g, w, dt) {
    if (!ready(w, dt)) return;
    const s = w.s, p = g.player, ts = g.targets(p.x, p.y, s.amount, 420);
    if (!ts.length) { w.timer = 0.2; return; }
    w.timer = s.cd;
    for (let i = 0; i < s.amount; i++) {
      const a = rand(0, TAU);
      g.projs.push({ kind: 'bat', x: p.x, y: p.y, vx: Math.cos(a) * s.speed, vy: Math.sin(a) * s.speed, r: 8, dmg: s.dmg, pierce: s.pierce, life: s.life,
        color: w.def.color, hit: [], w, homing: ts[i % ts.length], leechHit: s.leech ? 0.5 : 0, delay: i * 0.05, turn: 5 });
    }
  },
};

// Огненный шар: летит в ближайшего врага и взрывается, поджигая всех вокруг
WB.fireball = {
  update(g, w, dt) {
    if (!ready(w, dt)) return;
    const s = w.s, p = g.player, ts = g.targets(p.x, p.y, s.amount, 380);
    if (!ts.length) { w.timer = 0.2; return; }
    w.timer = s.cd;
    for (let i = 0; i < s.amount; i++) {
      const t = ts[i % ts.length], a = Math.atan2(t.y - p.y, t.x - p.x) + (i >= ts.length ? rand(-0.3, 0.3) : 0);
      g.projs.push({ kind: 'fireball', x: p.x, y: p.y, vx: Math.cos(a) * s.speed, vy: Math.sin(a) * s.speed, r: s.size, dmg: s.dmg, pierce: 1, life: s.life,
        color: w.def.color, hit: [], w, delay: i * 0.1, fixed: false,
        onEnd: q => g.explode(q.x, q.y, s.radius, s.dmg * 0.7, '#ff8a3d', { burn: s.burn, burnT: 2.5 }) });
    }
    Sfx.shoot();
  },
};

// Святая вода: флаконы разбиваются, оставляя освящённые лужи
WB.holywater = {
  update(g, w, dt) {
    if (!ready(w, dt)) return;
    const s = w.s, p = g.player; w.timer = s.cd;
    const cands = g.nearest(p.x, p.y, 10, 260);
    for (let i = 0; i < s.amount; i++) {
      let tx, ty;
      if (cands.length && Math.random() < 0.7) { const t = pick(cands); tx = t.x + rand(-20, 20); ty = t.y + rand(-20, 20); }
      else { const a = rand(0, TAU), r = rand(50, 170); tx = p.x + Math.cos(a) * r; ty = p.y + Math.sin(a) * r; }
      g.timed.push({ kind: 'lob', sprite: 'fx_holywater', sx: p.x, sy: p.y, x: tx, y: ty, t: -i * 0.15, T: 0.5, color: w.def.color, land: () => {
        g.zones.push({ x: tx, y: ty, r: s.radius, t: s.dur, T: s.dur, dps: s.dmg, tick: 0, color: w.def.color, holy: 1, heal: s.heal || 0 });
        g.fx.push({ kind: 'ring', x: tx, y: ty, r0: 4, r1: s.radius * 1.1, t: 0, T: 0.35, color: '#e8f8ff' });
        for (let k = 0; k < 8 && g.parts.length < 300; k++) { const a = rand(0, TAU), v = rand(50, 140); g.parts.push({ x: tx, y: ty, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, t: 0, T: rand(0.3, 0.5), color: '#bfeaff', size: rand(2, 4) }); }
      } });
    }
  },
};

// Боевой топор: подбрасывается вверх, летит дугой и падает, пробивая толпу
WB.axe = {
  update(g, w, dt) {
    if (!ready(w, dt)) return;
    const s = w.s, p = g.player; w.timer = s.cd;
    const dir = p.dirX || 1;
    for (let i = 0; i < s.amount; i++) {
      let vx, vy, grav = 900;
      if (s.spread) { const a = -Math.PI / 2 + (i - (s.amount - 1) / 2) * (TAU / s.amount); vx = Math.cos(a) * s.speed * 0.7; vy = Math.sin(a) * s.speed * 0.7 - s.speed * 0.35; grav = 620; }
      else { vx = dir * (70 + i * 55) * (i % 2 ? -1 : 1) * (i === 0 ? 1 : 1.2) + rand(-20, 20); vy = -s.speed * rand(0.92, 1.05); }
      g.projs.push({ kind: 'axe', x: p.x, y: p.y - 6, vx, vy, grav, r: s.size, dmg: s.dmg, pierce: s.pierce, life: s.life, color: w.def.color, hit: [], w, rot: 0, delay: i * 0.08 });
    }
    Sfx.slash();
  },
};
