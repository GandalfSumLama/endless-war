'use strict';
// ===== Мир: препятствия ландшафта и сундуки, генерируются кусками (чанками) вокруг героя =====
// Все коллайдеры — круги. Герой и пешие враги обходят их, снаряды пролетают над ними.
const CHUNK = 600, OCELL = 64, OMAXR = 60;

// Наборы ландшафта по биомам: set — [тип препятствия, вес]; цвета камня, листвы, воды, берега, дерева, кристаллов
const THEMES = {
  meadow: { set: [['tree', 14], ['rock', 30], ['bush', 26], ['lake', 10], ['log', 10], ['ruins', 10]], rock: ['#7a7a70', '#9a9a8e'], leaf: ['#3a7a2e', '#4e9a3a', '#6ab84a'], water: ['#3a7ab0', '#6ab0e0'], shore: '#5a6a34' },
  snow: { set: [['pine', 42], ['rock', 30], ['lake', 10], ['log', 10], ['ruins', 8]], rock: ['#8aa0b8', '#dce8f2'], leaf: ['#244438', '#305a4a', '#3e6e5c'], water: ['#a8d8f0', '#e0f4ff'], shore: '#c8dcea', frozen: 1, snowy: 1 },
  desert: { set: [['cactus', 38], ['rock', 28], ['mesa', 16], ['ruins', 10], ['deadtree', 8]], rock: ['#b0703a', '#d89a5a'], leaf: ['#3a6a2a', '#4e8a36', '#6aa84a'], water: ['#3a8ab0', '#7ac0e0'], shore: '#c89a58', wood: '#7a5a3a' },
  forest: { set: [['tree', 45], ['rock', 18], ['log', 15], ['lake', 10], ['ruins', 12]], rock: ['#6a6a62', '#8a8a80'], leaf: ['#2a5a2a', '#3a7a34', '#4f9a44'], water: ['#2a5a7a', '#4a8ab0'], shore: '#4a4028' },
  swamp: { set: [['deadtree', 30], ['lake', 34], ['log', 14], ['bush', 22]], rock: ['#4a5040', '#646c54'], leaf: ['#2a3a24', '#3a4e2e', '#4e6638'], water: ['#2e4a38', '#4a6a4a'], shore: '#26301e', wood: '#3e3428' },
  volcano: { set: [['rock', 40], ['lake', 20], ['ruins', 20], ['deadtree', 20]], rock: ['#4e3c34', '#72584a'], leaf: ['#2a2020', '#3a2a24', '#4a3028'], water: ['#ff5a1a', '#ffb040'], shore: '#1a100c', lava: 1, wood: '#6a4a3e' },
  canyon: { set: [['mesa', 34], ['rock', 40], ['cactus', 10], ['deadtree', 16]], rock: ['#9a4a2a', '#c8744a'], leaf: ['#4a6a2a', '#5a7a34', '#6a8a44'], water: ['#3a7aa0', '#6aa8d0'], shore: '#a45632', wood: '#6a4a30' },
  coast: { set: [['rock', 40], ['lake', 30], ['log', 15], ['ruins', 15]], rock: ['#5a5a5e', '#7e7e84'], leaf: ['#3a6a3a', '#4e8a4a', '#6aa85a'], water: ['#1e6aa8', '#5ab0e0'], shore: '#e8dcb0', wood: '#a08a6a' },
  crystal_blue: { set: [['crystal', 40], ['stalagmite', 35], ['rock', 25]], rock: ['#26304e', '#3a4a72'], leaf: ['#1a2a4a', '#223458', '#2c4068'], water: ['#1a3a7a', '#4a8ae0'], shore: '#0c1220', crystal: ['#2a5ab8', '#8ac4ff', 'rgba(80,150,255,.2)'] },
  ruins: { set: [['ruins', 16], ['r_statue', 9], ['r_bstatue', 4], ['r_pillar', 12], ['r_stub', 6], ['r_pile', 5], ['r_well', 3], ['r_urn', 6], ['r_lamp', 5], ['r_crystal', 2],
      ['r_stele', 5], ['r_lectern', 3], ['r_bush', 8], ['r_tree', 7]],
    decor: [['r_rubble', 4], ['r_sword', 1]], rock: ['#7a7a70', '#a0a094'], leaf: ['#2e6a2a', '#3e8a36', '#58a84a'], water: ['#2a6a8a', '#5aa0c0'], shore: '#4a5a2e' },
  haunted: { set: [['deadtree', 34], ['tomb', 30], ['ruins', 20], ['rock', 16]], rock: ['#4a4458', '#6a6280'], leaf: ['#2a2040', '#3a2c54', '#4a3868'], water: ['#2a1e44', '#4a3a70'], shore: '#161024', wood: '#2e2438' },
  wheat: { set: [['haystack', 30], ['fence', 30], ['tree', 10], ['windmill', 6], ['rock', 12], ['bush', 12]], rock: ['#7a7064', '#9a9082'], leaf: ['#4a6a24', '#5a7e2c', '#6e9434'], water: ['#3a7ab0', '#6ab0e0'], shore: '#8a6a24', wood: '#6a4a2a' },
  crystal_purple: { set: [['crystal', 42], ['stalagmite', 28], ['rock', 18], ['ruins', 12]], rock: ['#3a3258', '#5a4e84'], leaf: ['#2a1a40', '#3a2458', '#4a2e70'], water: ['#3a1a6a', '#7a4ac8'], shore: '#140e24' },
  jungle: { set: [['bigtree', 44], ['ruins', 18], ['lake', 16], ['bush', 22]], rock: ['#5a6a50', '#7a8a6a'], leaf: ['#1e5a22', '#2a7a2e', '#3e9a3a'], water: ['#1e6a6a', '#4aa0a0'], shore: '#2a3a1e' },
  toxic: { set: [['wreck', 28], ['lake', 30], ['rock', 26], ['deadtree', 16]], rock: ['#3e4632', '#5a6446'], leaf: ['#2a3418', '#3a4620', '#4a5828'], water: ['#4aa01e', '#b0ff4a'], shore: '#1a2010', acid: 1, wood: '#3a3424' },
  moon: { set: [['rock', 42], ['crater', 36], ['monolith', 22]], rock: ['#5a5e74', '#80849a'], leaf: ['#3a3e52', '#4a4e64', '#5a5e76'], water: ['#2a2e44', '#4a4e6a'], shore: '#2e3244' },
  endless: { set: [['tree', 28], ['rock', 25], ['log', 15], ['lake', 10], ['ruins', 22]], rock: ['#5a5a58', '#7a7a74'], leaf: ['#244a2a', '#305e34', '#3e7440'], water: ['#24485e', '#3a6e8a'], shore: '#3a3428' },
};
THEMES.grave = THEMES.haunted; THEMES.ice = THEMES.snow; THEMES.lava = THEMES.volcano; THEMES.abyss = THEMES.crystal_purple;
const TALL = { tree: 1, bigtree: 1, pine: 1, deadtree: 1, tomb: 1, crystal: 1, pillar: 1, cactus: 1, windmill: 1, stalagmite: 1, monolith: 1, wreck: 1 };
// Древние руины — предметы из тайлсета руин FLARE: h — высота в мире, col — радиус столкновения (0 — декор, сквозь него ходят),
// br — отступ от соседей при расстановке, tall — сортируется по глубине вместе с врагами, glow — светящийся огонь (у первого варианта или всегда)
const RUIN_PROPS = {
  r_statue: { h: 92, col: 13, br: 26, tall: 1 }, r_bstatue: { h: 62, col: 20, br: 32, tall: 1 }, r_pillar: { h: 112, col: 17, br: 28, tall: 1 },
  r_stub: { h: 66, col: 20, br: 30, tall: 1 }, r_pile: { h: 46, col: 26, br: 40 }, r_rubble: { h: 24, col: 0, br: 24 }, r_sword: { h: 30, col: 0, br: 18 },
  r_well: { h: 92, col: 27, br: 42, tall: 1 }, r_urn: { h: 34, col: 10, br: 16, tall: 1 }, r_stele: { h: 84, col: 16, br: 26, tall: 1 },
  r_lamp: { h: 82, col: 13, br: 24, tall: 1, glow: '#b4ff7a', gy: 0.86, first: 1 }, r_crystal: { h: 90, col: 15, br: 24, tall: 1, glow: '#9aff6a', gy: 0.55 },
  r_lectern: { h: 52, col: 13, br: 20, tall: 1 }, r_bush: { h: 40, col: 10, br: 18 }, r_tree: { h: 96, col: 9, br: 24, tall: 1 },
};

const World = {
  // clearX/clearY — центр свободной поляны (старт забега или место смены биома)
  init(theme, clearX = 0, clearY = 0) {
    this.theme = THEMES[theme] || THEMES.forest; this.cx0 = clearX; this.cy0 = clearY; this.tname = theme;
    this.seed = 9973 + theme.length * 131;
    this.chunks = new Map(); this.opened = new Set(); this.grid = new Map();
    this.pcx = null; this.pcy = null;
  },

  rng(cx, cy) {
    let s = (cx * 73856093) ^ (cy * 19349663) ^ this.seed;
    return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  },

  // Подгружаем чанки вокруг героя, дальние выгружаем
  update(p) {
    const cx = Math.floor(p.x / CHUNK), cy = Math.floor(p.y / CHUNK);
    if (cx === this.pcx && cy === this.pcy) return;
    this.pcx = cx; this.pcy = cy;
    for (let x = cx - 2; x <= cx + 2; x++) for (let y = cy - 2; y <= cy + 2; y++) {
      const k = x + ',' + y;
      if (!this.chunks.has(k)) this.chunks.set(k, this.gen(x, y));
    }
    for (const [k, ch] of this.chunks) if (Math.abs(ch.cx - cx) > 3 || Math.abs(ch.cy - cy) > 3) this.chunks.delete(k);
    this.grid.clear();
    for (const ch of this.chunks.values()) for (const o of ch.obs) for (const c of o.cols) {
      const x0 = Math.floor((c.x - c.r) / OCELL), x1 = Math.floor((c.x + c.r) / OCELL), y0 = Math.floor((c.y - c.r) / OCELL), y1 = Math.floor((c.y + c.r) / OCELL);
      for (let gx = x0; gx <= x1; gx++) for (let gy = y0; gy <= y1; gy++) {
        const gk = gx * 100003 + gy; let a = this.grid.get(gk); if (!a) this.grid.set(gk, a = []); a.push(c);
      }
    }
  },

  // ---------- Генерация чанка ----------
  gen(cx, cy) {
    const R = this.rng(cx, cy), T = this.theme, obs = [], chests = [];
    const ox = cx * CHUNK, oy = cy * CHUNK;
    const free = (x, y, r) => {
      if ((x - this.cx0) ** 2 + (y - this.cy0) ** 2 < (170 + r) ** 2) return false;   // стартовая поляна чистая
      for (const o of obs) if ((o.x - x) ** 2 + (o.y - y) ** 2 < (o.r + r + 30) ** 2) return false;
      for (const c of chests) if ((c.x - x) ** 2 + (c.y - y) ** 2 < (r + 40) ** 2) return false;
      return true;
    };
    // сундук на карте (примерно в каждом 10-м чанке)
    const id = cx + ',' + cy;
    if (R() < 0.1 && !this.opened.has(id)) {
      for (let i = 0; i < 10; i++) { const x = ox + 60 + R() * (CHUNK - 120), y = oy + 60 + R() * (CHUNK - 120); if (free(x, y, 20)) { chests.push({ x, y, id }); break; } }
    }
    // редкий сундук с бустерами (открывается за зелёные монеты)
    if (R() < RARE_CHEST_CHANCE && !this.opened.has('r' + id)) {
      for (let i = 0; i < 10; i++) { const x = ox + 60 + R() * (CHUNK - 120), y = oy + 60 + R() * (CHUNK - 120); if (free(x, y, 22)) { chests.push({ x, y, id: 'r' + id, rare: true }); break; } }
    }
    const total = T.set.reduce((s, e) => s + e[1], 0), n = 5 + Math.floor(R() * 4);
    for (let i = 0; i < n; i++) {
      let r = R() * total, type = T.set[0][0];
      for (const [t, w] of T.set) { r -= w; if (r <= 0) { type = t; break; } }
      const br = { tree: 34, bigtree: 48, pine: 30, deadtree: 26, tomb: 14, crystal: 22, rock: 26, log: 75, lake: 110, ruins: 115,
        cactus: 16, mesa: 70, bush: 16, fence: 80, haystack: 20, windmill: 36, stalagmite: 16, monolith: 16, wreck: 26, crater: 50 }[type] || (RUIN_PROPS[type] ? RUIN_PROPS[type].br : 30);
      for (let tries = 0; tries < 8; tries++) {
        const x = ox + br + R() * (CHUNK - br * 2), y = oy + br + R() * (CHUNK - br * 2);
        if (!free(x, y, br)) continue;
        const o = this.make(type, x, y, R);
        obs.push(o); break;
      }
    }
    if (T.decor && typeof FLARE_PROPS !== 'undefined') {   // мелкий декор без столкновений (обломки, мечи в камне)
      const dt = T.decor.reduce((s, e) => s + e[1], 0), dn = 3 + Math.floor(R() * 3);
      for (let i = 0; i < dn; i++) {
        let r = R() * dt, type = T.decor[0][0];
        for (const [tp, w] of T.decor) { r -= w; if (r <= 0) { type = tp; break; } }
        const x = ox + 30 + R() * (CHUNK - 60), y = oy + 30 + R() * (CHUNK - 60);
        if (free(x, y, 14)) obs.push(this.make(type, x, y, R));
      }
    }
    return { cx, cy, obs, chests };
  },

  make(type, x, y, R) {
    const o = { type, x, y, r: 20, cols: [], tall: !!TALL[type], v: R() };
    const rp = RUIN_PROPS[type];
    if (rp) { o.r = rp.br; o.tall = !!rp.tall; if (rp.col) o.cols.push({ x, y, r: rp.col }); return o; }
    switch (type) {
      case 'tree': {
        o.r = 36; o.cols.push({ x, y, r: 11 });
        o.blobs = []; for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + R(), d = i ? 10 + R() * 10 : 0; o.blobs.push([Math.cos(a) * d, -38 + Math.sin(a) * d * 0.7, 15 + R() * 9]); }
        break;
      }
      case 'bigtree': {                               // джунгли: огромная крона
        o.r = 52; o.cols.push({ x, y, r: 14 });
        o.blobs = []; for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + R(), d = i ? 14 + R() * 16 : 0; o.blobs.push([Math.cos(a) * d, -50 + Math.sin(a) * d * 0.7, 20 + R() * 12]); }
        break;
      }
      case 'cactus': o.r = 16; o.cols.push({ x, y, r: 9 }); o.h = 34 + R() * 16; o.arms = [R() < 0.8 ? 0.35 + R() * 0.3 : 0, R() < 0.8 ? 0.4 + R() * 0.3 : 0]; break;
      case 'mesa': {                                   // скала-столовая гора (пустыня/каньон)
        o.blobs = []; let md = 0;
        for (let i = 0; i < 4; i++) { const a = R() * TAU, d = i ? 14 + R() * 22 : 0, r = 22 + R() * 16; const bx = x + Math.cos(a) * d, by = y + Math.sin(a) * d * 0.7; o.blobs.push([bx, by, r]); o.cols.push({ x: bx, y: by, r: r * 0.9 }); md = Math.max(md, d + r); }
        o.r = md + 20; o.hgt = 16 + R() * 12;
        break;
      }
      case 'bush': o.r = 16; o.cols.push({ x, y, r: 11 }); o.blobs = []; for (let i = 0; i < 5; i++) o.blobs.push([(R() - 0.5) * 16, (R() - 0.5) * 8 - 4, 7 + R() * 5]); o.berry = R() < 0.4; break;
      case 'fence': {
        const len = 90 + R() * 70, a = R() < 0.5 ? 0 : Math.PI / 2 * (R() < 0.5 ? 1 : 0.15); o.len = len; o.ang = a; o.r = len / 2 + 10;
        for (let d = -len / 2; d <= len / 2; d += 12) o.cols.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, r: 6 });
        break;
      }
      case 'haystack': o.r = 20; o.cols.push({ x, y, r: 15 }); break;
      case 'windmill': o.r = 40; o.cols.push({ x, y, r: 20 }); o.spin = 0.6 + R() * 0.6; break;
      case 'stalagmite': o.r = 16; o.cols.push({ x, y, r: 10 }); o.h = 30 + R() * 24; o.w = 9 + R() * 4; break;
      case 'monolith': o.r = 16; o.cols.push({ x, y, r: 11 }); o.h = 50 + R() * 30; o.tilt = (R() - 0.5) * 0.4; break;
      case 'wreck': o.r = 26; o.cols.push({ x, y, r: 15 }); o.h = 60 + R() * 30; o.lean = (R() - 0.5) * 0.35; break;
      case 'crater': o.r = 30 + R() * 22; o.cr = o.r - 6; break;   // только декор, не мешает ходить
      case 'pine': o.r = 30; o.cols.push({ x, y, r: 10 }); o.h = 60 + R() * 25; break;
      case 'deadtree': {
        o.r = 28; o.cols.push({ x, y, r: 9 });
        o.br = []; for (let i = 0; i < 5; i++) o.br.push([-0.5 * Math.PI + (R() - 0.5) * 2.2, 14 + R() * 18, 18 + R() * 26]);
        break;
      }
      case 'tomb': o.r = 14; o.cols.push({ x, y, r: 10 }); o.cross = R() < 0.5; break;
      case 'crystal': {
        o.r = 24; o.cols.push({ x, y, r: 13 });
        o.shards = []; for (let i = 0; i < 4; i++) o.shards.push([(R() - 0.5) * 22, 26 + R() * 30, (R() - 0.5) * 0.7, 5 + R() * 4]);
        break;
      }
      case 'rock': {
        const r = 12 + R() * 14; o.r = r + 4; o.cols.push({ x, y, r: r * 0.95 });
        o.pts = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, d = r * (0.8 + R() * 0.35); o.pts.push([Math.cos(a) * d, Math.sin(a) * d * 0.8]); }
        break;
      }
      case 'log': {
        if (typeof FLARE_PROPS !== 'undefined') { o.r = 40; o.cols.push({ x, y, r: 20 }); o.pile = 1; break; }   // поленница из тайлсета
        const len = 90 + R() * 60, a = R() * Math.PI; o.r = len / 2 + 12; o.len = len; o.ang = a; o.th = 10 + R() * 3;
        for (let d = -len / 2; d <= len / 2; d += 12) o.cols.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, r: o.th });
        break;
      }
      case 'lake': {
        o.blobs = []; let maxd = 0;
        const k = 3 + Math.floor(R() * 3);
        for (let i = 0; i < k; i++) {
          const a = R() * TAU, d = i ? 20 + R() * 35 : 0, r = 30 + R() * 25;
          const bx = x + Math.cos(a) * d, by = y + Math.sin(a) * d * 0.7;
          o.blobs.push([bx, by, r]); o.cols.push({ x: bx, y: by, r: r * 0.85 }); maxd = Math.max(maxd, d + r);
        }
        o.r = maxd + 8;
        break;
      }
      case 'ruins': {
        const w = 150 + R() * 60, h = 110 + R() * 40, B = 22;
        o.r = Math.hypot(w, h) / 2 + 12; o.w = w; o.h = h; o.blocks = []; o.pillars = [];
        const edge = (x0, y0, x1, y1) => {
          const len = Math.hypot(x1 - x0, y1 - y0), n = Math.round(len / B);
          for (let i = 0; i <= n; i++) {
            if (R() < 0.3 && i > 0 && i < n) continue;           // проломы в стенах
            const bx = x0 + (x1 - x0) * i / n, by = y0 + (y1 - y0) * i / n, hh = R() < 0.25 ? 0.5 : 1;
            o.blocks.push([bx, by, hh]); o.cols.push({ x: bx, y: by, r: 12 });
          }
        };
        const L = x - w / 2, Tp = y - h / 2, Rr = x + w / 2, Bt = y + h / 2;
        edge(L, Tp, Rr, Tp); edge(L, Bt, Rr, Bt); edge(L, Tp + B, L, Bt - B); edge(Rr, Tp + B, Rr, Bt - B);
        if (R() < 0.6) o.pillars.push([L, Tp]); if (R() < 0.6) o.pillars.push([Rr, Bt]);
        break;
      }
    }
    return o;
  },

  // ---------- Столкновения ----------
  near(x, y, r, fn) {
    const x0 = Math.floor((x - r) / OCELL), x1 = Math.floor((x + r) / OCELL), y0 = Math.floor((y - r) / OCELL), y1 = Math.floor((y + r) / OCELL);
    for (let gx = x0; gx <= x1; gx++) for (let gy = y0; gy <= y1; gy++) {
      const a = this.grid.get(gx * 100003 + gy);
      if (a) for (let i = 0; i < a.length; i++) fn(a[i]);
    }
  },
  // Выталкивает сущность из препятствий. Возвращает нормаль последнего столкновения (или null)
  resolve(e, r) {
    let hit = null;
    this.near(e.x, e.y, r, c => {
      const dx = e.x - c.x, dy = e.y - c.y, rr = c.r + r, d2 = dx * dx + dy * dy;
      if (d2 >= rr * rr) return;
      const d = Math.sqrt(d2) || 0.01, push = rr - d;
      e.x += dx / d * push; e.y += dy / d * push; hit = { nx: dx / d, ny: dy / d };
    });
    return hit;
  },
  // Враг упёрся — скользит вдоль препятствия в сторону героя
  resolveEnemy(e, dirx, diry, sp, dt) {
    const h = this.resolve(e, e.r * 0.8);
    if (!h) return;
    let tx = -h.ny, ty = h.nx;
    if (tx * dirx + ty * diry < 0) { tx = -tx; ty = -ty; }
    e.x += tx * sp * dt * 0.9; e.y += ty * sp * dt * 0.9;
  },
  blocked(x, y, r) { let b = false; this.near(x, y, r, c => { if (!b && (x - c.x) ** 2 + (y - c.y) ** 2 < (c.r + r) ** 2) b = true; }); return b; },

  // Сундуки на карте: срабатывают, когда герой подходит (повторно — только если отошёл и вернулся).
  // open(c) возвращает true, если сундук открыт (редкий открывается только после оплаты — см. markOpened)
  checkChests(p, open) {
    for (const ch of this.chunks.values()) for (const c of ch.chests) {
      if (c.opened) continue;
      const inside = (c.x - p.x) ** 2 + (c.y - p.y) ** 2 < (p.r + 20) ** 2;
      if (inside && !c.inside && open(c)) this.markOpened(c);
      c.inside = inside;
    }
  },
  markOpened(c) { c.opened = true; this.opened.add(c.id); },
  chestList() { const a = []; for (const ch of this.chunks.values()) for (const c of ch.chests) if (!c.opened) a.push(c); return a; },

  // ---------- Отрисовка ----------
  visible(L, T, w, h) {
    const low = [], tall = [];
    for (const ch of this.chunks.values()) for (const o of ch.obs) {
      if (o.x + o.r < L || o.x - o.r > L + w || o.y + o.r < T - 60 || o.y - o.r > T + h + 20) continue;
      (o.tall ? tall : low).push(o);
    }
    tall.sort((a, b) => a.y - b.y);
    // у руин колонны — высокие объекты
    for (const o of low) if (o.type === 'ruins') for (const pl of o.pillars) tall.push({ type: 'pillar', x: pl[0], y: pl[1], tall: 1, v: Math.abs(pl[0] * 0.0137 + pl[1] * 0.0071) % 1 });
    tall.sort((a, b) => a.y - b.y);
    return { low, tall };
  },

  drawLow(c, list, time) {
    const T = this.theme;
    for (const o of list) {
      if (o.type === 'ruins' && this.drawRuins(c, o)) continue;
      if (this.drawProp(c, o, null)) continue;
      if (o.type === 'lake') {
        c.fillStyle = T.shore;
        for (const b of o.blobs) { c.beginPath(); c.ellipse(b[0], b[1], b[2] + 6, (b[2] + 6) * 0.85, 0, 0, TAU); c.fill(); }
        c.fillStyle = T.water[0];
        for (const b of o.blobs) { c.beginPath(); c.ellipse(b[0], b[1], b[2], b[2] * 0.85, 0, 0, TAU); c.fill(); }
        c.fillStyle = T.water[1]; c.globalAlpha = T.lava ? 0.55 + Math.sin(time * 3 + o.x) * 0.15 : 0.35;
        for (const b of o.blobs) { c.beginPath(); c.ellipse(b[0] - b[2] * 0.2, b[1] - b[2] * 0.2, b[2] * 0.55, b[2] * 0.35, 0, 0, TAU); c.fill(); }
        c.globalAlpha = 1;
        if (T.acid) {                                  // пузыри кислоты
          for (let i = 0; i < 4; i++) { const b = o.blobs[i % o.blobs.length], ph = (time * 0.8 + i * 0.27 + o.v) % 1; c.fillStyle = "rgba(200,255,120," + (1 - ph) + ")"; c.beginPath(); c.arc(b[0] + Math.cos(i * 2 + o.v * 9) * b[2] * 0.4, b[1] + Math.sin(i * 3) * b[2] * 0.3, 2 + ph * 3, 0, TAU); c.fill(); }
        } else if (!T.frozen && !T.lava) {                    // рябь
          c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 1.2;
          for (let i = 0; i < 3; i++) { const b = o.blobs[i % o.blobs.length], ph = (time * 0.6 + i * 0.33 + o.v) % 1; c.globalAlpha = 1 - ph; c.beginPath(); c.ellipse(b[0], b[1], 6 + ph * 18, (6 + ph * 18) * 0.6, 0, 0, TAU); c.stroke(); }
          c.globalAlpha = 1;
        } else if (T.frozen) {
          c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1;
          c.beginPath(); c.moveTo(o.x - 25, o.y - 5); c.lineTo(o.x, o.y + 4); c.lineTo(o.x + 20, o.y - 8); c.moveTo(o.x, o.y + 4); c.lineTo(o.x + 6, o.y + 20); c.stroke();
        }
      } else if (o.type === 'rock') {
        c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(o.x + 3, o.y + 6, o.cols[0].r * 1.05, o.cols[0].r * 0.6, 0, 0, TAU); c.fill();
        c.fillStyle = T.rock[0]; c.beginPath(); o.pts.forEach((q, i) => i ? c.lineTo(o.x + q[0], o.y + q[1]) : c.moveTo(o.x + q[0], o.y + q[1])); c.closePath(); c.fill();
        c.fillStyle = T.rock[1]; c.beginPath(); o.pts.forEach((q, i) => i ? c.lineTo(o.x + q[0] * 0.75 - 2, o.y + q[1] * 0.7 - 4) : c.moveTo(o.x + q[0] * 0.75 - 2, o.y + q[1] * 0.7 - 4)); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1.5; c.beginPath(); o.pts.forEach((q, i) => i ? c.lineTo(o.x + q[0], o.y + q[1]) : c.moveTo(o.x + q[0], o.y + q[1])); c.closePath(); c.stroke();
        if (T.snowy) { c.fillStyle = "rgba(245,250,255,.9)"; c.beginPath(); c.ellipse(o.x - 2, o.y - o.cols[0].r * 0.45, o.cols[0].r * 0.7, o.cols[0].r * 0.35, 0, 0, TAU); c.fill(); }
      } else if (o.type === 'log') {
        c.save(); c.translate(o.x, o.y); c.rotate(o.ang);
        const L = o.len, th = o.th;
        c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(-L / 2 + 4, -th + 6, L, th * 2);
        c.fillStyle = '#5a3a20'; c.fillRect(-L / 2, -th, L, th * 2);
        c.fillStyle = '#7a5230'; c.fillRect(-L / 2, -th, L, th * 0.7);
        c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 1;
        for (let i = 0; i < 4; i++) { const px = -L / 2 + L * (0.15 + i * 0.22); c.beginPath(); c.moveTo(px, -th + 2); c.lineTo(px + 8, th - 3); c.stroke(); }
        for (const s of [-1, 1]) {
          c.fillStyle = '#c8a070'; c.beginPath(); c.ellipse(s * L / 2, 0, 4, th, 0, 0, TAU); c.fill();
          c.strokeStyle = '#8a6a40'; c.beginPath(); c.ellipse(s * L / 2, 0, 2, th * 0.55, 0, 0, TAU); c.stroke();
        }
        if (this.theme === THEMES.ice) { c.fillStyle = 'rgba(240,250,255,.8)'; c.fillRect(-L / 2, -th, L, 3); }
        c.restore();
      } else if (o.type === 'mesa') {                  // слоистая скала с плоской вершиной
        const H = o.hgt;
        c.fillStyle = 'rgba(0,0,0,.28)'; for (const b of o.blobs) { c.beginPath(); c.ellipse(b[0] + 8, b[1] + 8, b[2], b[2] * 0.7, 0, 0, TAU); c.fill(); }
        c.fillStyle = T.rock[0]; for (const b of o.blobs) { c.beginPath(); c.ellipse(b[0], b[1], b[2], b[2] * 0.7, 0, 0, TAU); c.fill(); c.fillRect(b[0] - b[2], b[1] - H, b[2] * 2, H); }
        c.fillStyle = 'rgba(0,0,0,.18)'; for (const b of o.blobs) for (let k = 1; k < 3; k++) c.fillRect(b[0] - b[2], b[1] - H + H * k / 3, b[2] * 2, 1.5);
        c.fillStyle = T.rock[1]; for (const b of o.blobs) { c.beginPath(); c.ellipse(b[0], b[1] - H, b[2], b[2] * 0.7, 0, 0, TAU); c.fill(); }
        if (T.snowy) { c.fillStyle = 'rgba(245,250,255,.9)'; for (const b of o.blobs) { c.beginPath(); c.ellipse(b[0], b[1] - H - 1, b[2] * 0.8, b[2] * 0.5, 0, 0, TAU); c.fill(); } }
      } else if (o.type === 'bush') {
        c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(o.x + 3, o.y + 4, 16, 6, 0, 0, TAU); c.fill();
        for (const b of o.blobs) { c.fillStyle = T.leaf[0]; c.beginPath(); c.arc(o.x + b[0], o.y + b[1] + 2, b[2], 0, TAU); c.fill(); }
        for (const b of o.blobs) { c.fillStyle = T.leaf[1]; c.beginPath(); c.arc(o.x + b[0] - 1, o.y + b[1], b[2] * 0.75, 0, TAU); c.fill(); }
        if (o.berry) { c.fillStyle = '#e0304a'; for (const b of o.blobs) c.fillRect(o.x + b[0] + 2, o.y + b[1] - 2, 2.5, 2.5); }
        if (T.snowy) { c.fillStyle = 'rgba(245,250,255,.85)'; for (const b of o.blobs) { c.beginPath(); c.arc(o.x + b[0] - 1, o.y + b[1] - b[2] * 0.4, b[2] * 0.5, Math.PI, 0); c.fill(); } }
      } else if (o.type === 'fence') {
        c.save(); c.translate(o.x, o.y); c.rotate(o.ang);
        const L = o.len, wood = T.wood || '#6a4a2a';
        c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(-L / 2 + 3, 3, L, 4);
        c.fillStyle = wood; c.fillRect(-L / 2, -9, L, 3); c.fillRect(-L / 2, -3, L, 3);
        for (let d = -L / 2; d <= L / 2 + 0.1; d += 18) { c.fillStyle = wood; c.fillRect(d - 2, -14, 5, 17); c.fillStyle = 'rgba(255,255,255,.15)'; c.fillRect(d - 2, -14, 2, 17); }
        c.restore();
      } else if (o.type === 'haystack') {
        c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(o.x + 4, o.y + 5, 19, 7, 0, 0, TAU); c.fill();
        c.fillStyle = '#b08a2a'; c.beginPath(); c.ellipse(o.x, o.y - 6, 18, 16, 0, 0, TAU); c.fill();
        c.fillStyle = '#d8b44a'; c.beginPath(); c.ellipse(o.x - 3, o.y - 10, 13, 10, 0, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(120,90,20,.6)'; c.lineWidth = 1; c.beginPath();
        for (let i = -2; i <= 2; i++) { c.moveTo(o.x + i * 6, o.y - 18); c.lineTo(o.x + i * 7, o.y + 6); } c.stroke();
      } else if (o.type === 'crater') {
        c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(o.x, o.y, o.cr, o.cr * 0.7, 0, 0, TAU); c.fill();
        c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(o.x + 3, o.y + 3, o.cr * 0.7, o.cr * 0.45, 0, 0, TAU); c.fill();
        c.strokeStyle = T.rock[1]; c.lineWidth = 3; c.beginPath(); c.ellipse(o.x, o.y, o.cr, o.cr * 0.7, 0, 0.1, Math.PI * 0.9); c.stroke();
      } else if (o.type === 'ruins') {
        c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(o.x - o.w / 2 + 10, o.y - o.h / 2 + 10, o.w - 20, o.h - 20);   // пол
        c.strokeStyle = 'rgba(255,255,255,.05)'; c.lineWidth = 1;
        for (let gx = o.x - o.w / 2 + 30; gx < o.x + o.w / 2 - 10; gx += 26) { c.beginPath(); c.moveTo(gx, o.y - o.h / 2 + 12); c.lineTo(gx, o.y + o.h / 2 - 12); c.stroke(); }
        for (const b of o.blocks) {
          const hh = 10 * b[2];
          c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(b[0] - 11 + 3, b[1] - 8 + 5, 22, 18);
          c.fillStyle = T.rock[0]; c.fillRect(b[0] - 11, b[1] - 8 - hh + 10, 22, 16 + hh - 10 + 8);
          c.fillStyle = T.rock[1]; c.fillRect(b[0] - 11, b[1] - 8 - hh + 10, 22, 12);
          c.strokeStyle = 'rgba(0,0,0,.35)'; c.strokeRect(b[0] - 11, b[1] - 8 - hh + 10, 22, 16 + hh - 10 + 8);
        }
      }
    }
  },

  // ---------- Препятствия из тайлсетов FLARE ----------
  // Группа спрайтов и высота (в единицах мира) по биому и типу препятствия; null — рисуем по-старому
  propFor(o) {
    const t = this.tname, snow = t === 'snow' || t === 'ice', cave = t === 'volcano' || t === 'lava' || t === 'crystal_blue' || t === 'crystal_purple' || t === 'abyss',
      dun = t === 'haunted' || t === 'grave', moon = t === 'moon';
    const rp = RUIN_PROPS[o.type]; if (rp) return [o.type, rp.h];
    switch (o.type) {
      case 'tree': return [o.v < 0.5 ? 'g_oak' : 'g_birch', 150];
      case 'bigtree': return ['g_oak', 205];
      case 'pine': return ['g_pine', 150];
      case 'deadtree': return [snow ? 's_dead' : 'g_dead', 140];
      case 'rock': return [snow || moon ? 's_rock' : cave || dun ? 'c_rock' : 'g_rock', o.r * 2.4];
      case 'log': return o.pile ? [snow ? 's_log' : 'g_log', 52] : null;
      case 'bush': return [snow ? 's_bush' : 'g_bush', 44];
      case 'tomb': return [dun && o.v < 0.35 ? 'd_tomb' : snow ? 's_tomb' : 'g_tomb', 58];
      case 'pillar': return t === 'ruins' ? ['r_pillar', 112] : [cave || dun ? 'd_pillar' : snow ? 's_pillar' : 'g_pillar', 105];
      case 'stalagmite': return ['c_stalag', 40 + o.h * 1.2];
      case 'monolith': return [moon ? 's_pillar' : 'd_statue', 100];
    }
    return null;
  },
  propImg(grp, v) {
    if (!this.propN) { this.propN = {}; for (const k in FLARE_PROPS) { const g = k.replace(/_\d+$/, ''); this.propN[g] = (this.propN[g] || 0) + 1; } }
    const n = this.propN[grp]; if (!n) return null;
    const key = grp + '_' + Math.min(n - 1, Math.floor(v * n)), im = Art.img['prop_' + key];
    return im ? [im, FLARE_PROPS[key]] : null;
  },
  drawProp(c, o, p) {
    if (DBG.has('noprops')) return true;
    if (typeof FLARE_PROPS === 'undefined') return false;
    const f = this.propFor(o), pi = f && this.propImg(f[0], o.v); if (!pi) return false;
    const [im, m] = pi, s = f[1] / m[1], flip = (o.v * 7) % 1 > 0.5;
    const behind = p && o.tall && Math.abs(p.x - o.x) < m[0] * s * 0.35 && p.y < o.y - 4 && p.y > o.y - f[1] * 0.8;   // герой за объектом — просвечиваем
    if (behind) c.globalAlpha = 0.5;
    c.drawImage(im, o.x - m[2] * s, o.y - m[3] * s, m[0] * s, m[1] * s); c.globalAlpha = 1;
    return true;
  },
  // Руины: каменные блоки из тайлсета вместо нарисованных кодом
  drawRuins(c, o) {
    if (typeof FLARE_PROPS === 'undefined') return false;
    const t = this.tname, rz = t === 'ruins', grp = rz ? 'r_block' : t === 'snow' || t === 'ice' || t === 'moon' ? 's_rock' : t === 'volcano' || t === 'haunted' || t === 'crystal_blue' || t === 'crystal_purple' ? 'c_rock' : 'g_rock';
    if (!this.propImg(grp, 0)) return false;
    c.fillStyle = 'rgba(0,0,0,.14)'; c.fillRect(o.x - o.w / 2 + 10, o.y - o.h / 2 + 10, o.w - 20, o.h - 20);   // пол
    o.blocks.forEach((b, i) => {
      const v = (i * 0.618 + o.v) % 1, rub = rz && v < 0.22;          // в руинах — каменная кладка, местами обломки
      const [im, m] = this.propImg(rub ? 'r_rubble' : grp, rub ? v / 0.22 : v), s = (rub ? 20 : rz ? (b[2] < 1 ? 20 : 27) : (b[2] < 1 ? 22 : 32)) / m[1];
      c.drawImage(im, b[0] - m[2] * s, b[1] - m[3] * s + 6, m[0] * s, m[1] * s);
      if (rz && !rub && b[2] >= 1) c.drawImage(im, b[0] - m[2] * s * 0.9, b[1] - m[3] * s * 1.7 + 6, m[0] * s * 0.9, m[1] * s * 0.9);   // второй ряд кладки
    });
    return true;
  },

  // Высокие объекты рисуются в общей сортировке по глубине вместе с врагами
  // Светящийся огонь светильника руин: мягкое пульсирующее пятно (спрайт свечения кэшируется по цвету)
  glowSpr(col) {
    const k = 'glow' + col; if (this[k]) return this[k];
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const x = cv.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, col + 'cc'); g.addColorStop(0.35, col + '55'); g.addColorStop(1, col + '00'); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return (this[k] = cv);
  },
  drawTall(c, o, p) {
    const T = this.theme;
    if (this.drawProp(c, o, p)) {
      const rp = RUIN_PROPS[o.type];
      if (rp && rp.glow && !(rp.first && o.v >= 0.5)) {
        const R = rp.h * (0.42 + Math.sin(Date.now() / 380 + o.v * 20) * 0.05);
        c.globalCompositeOperation = 'lighter'; c.drawImage(this.glowSpr(rp.glow), o.x - R, o.y - rp.h * rp.gy - R, R * 2, R * 2); c.globalCompositeOperation = 'source-over';
      }
      return;
    }
    const behind = p && Math.abs(p.x - o.x) < 34 && p.y < o.y - 4 && p.y > o.y - 95;   // герой за объектом — просвечиваем
    if (o.type === "tree" || o.type === "bigtree") {
      const k = o.type === "bigtree" ? 1.5 : 1;
      c.fillStyle = "rgba(0,0,0,.3)"; c.beginPath(); c.ellipse(o.x + 6 * k, o.y + 4, 28 * k, 10 * k, 0, 0, TAU); c.fill();
      c.fillStyle = "#4a3020"; c.fillRect(o.x - 5 * k, o.y - 26 * k, 10 * k, 28 * k);
      c.fillStyle = "#3a2418"; c.fillRect(o.x + k, o.y - 26 * k, 4 * k, 28 * k);
      if (behind) c.globalAlpha = 0.45;
      for (const b of o.blobs) { c.fillStyle = T.leaf[0]; c.beginPath(); c.arc(o.x + b[0], o.y + b[1] + 3, b[2], 0, TAU); c.fill(); }
      for (const b of o.blobs) { c.fillStyle = T.leaf[1]; c.beginPath(); c.arc(o.x + b[0] - 2, o.y + b[1] - 1, b[2] * 0.85, 0, TAU); c.fill(); }
      for (const b of o.blobs) { c.fillStyle = T.leaf[2]; c.beginPath(); c.arc(o.x + b[0] - 5, o.y + b[1] - 5, b[2] * 0.45, 0, TAU); c.fill(); }
    } else if (o.type === 'pine') {
      c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(o.x + 6, o.y + 3, 22, 8, 0, 0, TAU); c.fill();
      c.fillStyle = '#4a3020'; c.fillRect(o.x - 4, o.y - 12, 8, 14);
      if (behind) c.globalAlpha = 0.45;
      const H = o.h;
      for (let i = 0; i < 3; i++) {
        const w = 26 - i * 6, top = o.y - 10 - H * (0.35 + i * 0.3), base = o.y - 8 - H * i * 0.28;
        c.fillStyle = T.leaf[i]; c.beginPath(); c.moveTo(o.x, top); c.lineTo(o.x + w, base); c.lineTo(o.x - w, base); c.fill();
        c.fillStyle = 'rgba(240,250,255,.85)'; c.beginPath(); c.moveTo(o.x, top); c.lineTo(o.x + w * 0.35, top + (base - top) * 0.35); c.lineTo(o.x - w * 0.35, top + (base - top) * 0.35); c.fill();
      }
    } else if (o.type === 'deadtree') {
      c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(o.x + 5, o.y + 3, 20, 7, 0, 0, TAU); c.fill();
      c.strokeStyle = T.wood || '#3a2a22'; c.lineCap = 'round';
      c.lineWidth = 7; c.beginPath(); c.moveTo(o.x, o.y); c.lineTo(o.x, o.y - 40); c.stroke();
      if (behind) c.globalAlpha = 0.5;
      c.lineWidth = 3;
      for (const b of o.br) { const sx = o.x, sy = o.y - b[1] - 10; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + Math.cos(b[0]) * b[2], sy + Math.sin(b[0]) * b[2]); c.stroke(); }
      c.lineCap = 'butt';
    } else if (o.type === 'tomb') {
      c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(o.x + 3, o.y + 3, 13, 5, 0, 0, TAU); c.fill();
      c.fillStyle = T.rock[0]; c.beginPath(); c.moveTo(o.x - 10, o.y); c.lineTo(o.x - 10, o.y - 20); c.arc(o.x, o.y - 20, 10, Math.PI, 0); c.lineTo(o.x + 10, o.y); c.fill();
      c.fillStyle = T.rock[1]; c.fillRect(o.x - 10, o.y - 22, 3, 22);
      c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 2; c.beginPath();
      if (o.cross) { c.moveTo(o.x, o.y - 26); c.lineTo(o.x, o.y - 10); c.moveTo(o.x - 5, o.y - 21); c.lineTo(o.x + 5, o.y - 21); }
      else { c.moveTo(o.x - 5, o.y - 20); c.lineTo(o.x + 5, o.y - 20); c.moveTo(o.x - 5, o.y - 15); c.lineTo(o.x + 4, o.y - 15); }
      c.stroke();
    } else if (o.type === 'crystal') {
      c.fillStyle = (T.crystal ? T.crystal[2] : "rgba(160,80,255,.18)"); c.beginPath(); c.arc(o.x, o.y - 18, 30 + Math.sin(Date.now() / 400 + o.v * 9) * 3, 0, TAU); c.fill();
      if (behind) c.globalAlpha = 0.5;
      for (const s of o.shards) {
        c.save(); c.translate(o.x + s[0], o.y); c.rotate(s[2]);
        c.fillStyle = T.crystal ? T.crystal[0] : "#6a3ab8"; c.beginPath(); c.moveTo(-s[3], 0); c.lineTo(-s[3], -s[1] * 0.75); c.lineTo(0, -s[1]); c.lineTo(s[3], -s[1] * 0.75); c.lineTo(s[3], 0); c.fill();
        c.fillStyle = T.crystal ? T.crystal[1] : "#b890ff"; c.beginPath(); c.moveTo(-s[3], 0); c.lineTo(-s[3], -s[1] * 0.75); c.lineTo(0, -s[1]); c.lineTo(0, 0); c.fill();
        c.restore();
      }
    } else if (o.type === 'cactus') {
      c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(o.x + 5, o.y + 3, 14, 5, 0, 0, TAU); c.fill();
      if (behind) c.globalAlpha = 0.5;
      const H = o.h, col = '#3e7a34', hi = '#5a9a44';
      const stem = (x0, y0, w, h) => { c.fillStyle = col; c.beginPath(); c.moveTo(x0 - w, y0); c.lineTo(x0 - w, y0 - h + w); c.arc(x0, y0 - h + w, w, Math.PI, 0); c.lineTo(x0 + w, y0); c.fill(); c.fillStyle = hi; c.fillRect(x0 - w * 0.5, y0 - h + w, w * 0.35, h - w); };
      if (o.arms[0]) { stem(o.x - 11, o.y - H * o.arms[0], 3.5, H * 0.35); c.fillStyle = col; c.fillRect(o.x - 11, o.y - H * o.arms[0] - 3, 8, 6); }
      if (o.arms[1]) { stem(o.x + 11, o.y - H * o.arms[1], 3.5, H * 0.3); c.fillStyle = col; c.fillRect(o.x + 3, o.y - H * o.arms[1] - 3, 8, 6); }
      stem(o.x, o.y, 6, H);
      c.fillStyle = 'rgba(255,255,230,.6)'; for (let i = 0; i < 5; i++) c.fillRect(o.x - 4 + (i % 2) * 7, o.y - H * (0.2 + i * 0.15), 1.2, 1.2);
    } else if (o.type === 'windmill') {
      c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(o.x + 8, o.y + 4, 30, 10, 0, 0, TAU); c.fill();
      if (behind) c.globalAlpha = 0.5;
      c.fillStyle = '#8a6a4a'; c.beginPath(); c.moveTo(o.x - 18, o.y); c.lineTo(o.x - 11, o.y - 70); c.lineTo(o.x + 11, o.y - 70); c.lineTo(o.x + 18, o.y); c.fill();
      c.fillStyle = '#6a4e36'; c.beginPath(); c.moveTo(o.x + 4, o.y); c.lineTo(o.x + 5, o.y - 70); c.lineTo(o.x + 11, o.y - 70); c.lineTo(o.x + 18, o.y); c.fill();
      c.fillStyle = '#7a3a28'; c.beginPath(); c.moveTo(o.x - 15, o.y - 68); c.lineTo(o.x, o.y - 86); c.lineTo(o.x + 15, o.y - 68); c.fill();
      c.fillStyle = '#3a2a1e'; c.fillRect(o.x - 4, o.y - 14, 8, 14);
      const hx = o.x, hy = o.y - 64, a0 = Date.now() / 1000 * o.spin;
      c.strokeStyle = '#5a4430'; c.lineWidth = 3;
      for (let i = 0; i < 4; i++) {
        const a = a0 + i * Math.PI / 2, ex = hx + Math.cos(a) * 34, ey = hy + Math.sin(a) * 34;
        c.beginPath(); c.moveTo(hx, hy); c.lineTo(ex, ey); c.stroke();
        c.fillStyle = 'rgba(230,220,190,.85)'; c.save(); c.translate(hx, hy); c.rotate(a); c.fillRect(10, 1, 24, 7); c.restore();
      }
      c.fillStyle = '#3a2a1e'; c.beginPath(); c.arc(hx, hy, 3.5, 0, TAU); c.fill();
    } else if (o.type === 'stalagmite') {
      const col = T.crystal ? T.crystal : [T.rock[0], T.rock[1]];
      c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(o.x + 4, o.y + 3, o.w * 1.3, 5, 0, 0, TAU); c.fill();
      if (behind) c.globalAlpha = 0.5;
      c.fillStyle = T.rock[0]; c.beginPath(); c.moveTo(o.x - o.w, o.y); c.lineTo(o.x - 2, o.y - o.h); c.lineTo(o.x + 1, o.y - o.h); c.lineTo(o.x + o.w, o.y); c.fill();
      c.fillStyle = T.rock[1]; c.beginPath(); c.moveTo(o.x - o.w, o.y); c.lineTo(o.x - 2, o.y - o.h); c.lineTo(o.x - 1, o.y); c.fill();
      if (T.crystal) { c.fillStyle = col[1]; c.globalAlpha *= 0.8; c.beginPath(); c.moveTo(o.x + 2, o.y - 4); c.lineTo(o.x + 5, o.y - 14); c.lineTo(o.x + 8, o.y - 4); c.fill(); }
    } else if (o.type === 'monolith') {
      c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(o.x + 6, o.y + 3, 16, 6, 0, 0, TAU); c.fill();
      if (behind) c.globalAlpha = 0.5;
      c.save(); c.translate(o.x, o.y); c.rotate(o.tilt);
      c.fillStyle = '#3a3448'; c.beginPath(); c.moveTo(-10, 0); c.lineTo(-7, -o.h); c.lineTo(8, -o.h - 6); c.lineTo(11, 0); c.fill();
      c.fillStyle = '#5a5470'; c.beginPath(); c.moveTo(-10, 0); c.lineTo(-7, -o.h); c.lineTo(0, -o.h - 3); c.lineTo(-2, 0); c.fill();
      c.fillStyle = 'rgba(120,180,255,' + (0.4 + Math.sin(Date.now() / 500 + o.v * 7) * 0.25) + ')';
      c.fillRect(-1, -o.h * 0.7, 3, 3); c.fillRect(1, -o.h * 0.5, 2, 5); c.fillRect(-2, -o.h * 0.3, 4, 2);
      c.restore();
    } else if (o.type === 'wreck') {                   // ржавая металлическая вышка (ядовитые пустоши)
      c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(o.x + 8, o.y + 4, 24, 8, 0, 0, TAU); c.fill();
      if (behind) c.globalAlpha = 0.5;
      c.save(); c.translate(o.x, o.y); c.rotate(o.lean);
      c.strokeStyle = '#4a3a2a'; c.lineWidth = 3; c.beginPath();
      c.moveTo(-14, 0); c.lineTo(-5, -o.h); c.moveTo(14, 0); c.lineTo(5, -o.h);
      for (let k = 0; k < 5; k++) { const y1 = -o.h * k / 5, y2 = -o.h * (k + 1) / 5, w1 = 14 - 9 * k / 5, w2 = 14 - 9 * (k + 1) / 5; c.moveTo(-w1, y1); c.lineTo(w2, y2); c.moveTo(w1, y1); c.lineTo(-w2, y2); }
      c.stroke();
      c.fillStyle = '#5a4630'; c.fillRect(-9, -o.h - 8, 18, 9);
      c.fillStyle = 'rgba(150,255,80,' + (0.5 + Math.sin(Date.now() / 300 + o.v * 5) * 0.3) + ')'; c.beginPath(); c.arc(0, -o.h - 4, 3, 0, TAU); c.fill();
      c.restore();
    } else if (o.type === 'pillar') {
      c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(o.x + 5, o.y + 4, 15, 6, 0, 0, TAU); c.fill();
      if (behind) c.globalAlpha = 0.5;
      c.fillStyle = T.rock[0]; c.fillRect(o.x - 10, o.y - 52, 20, 54);
      c.fillStyle = T.rock[1]; c.fillRect(o.x - 10, o.y - 52, 7, 54); c.fillRect(o.x - 13, o.y - 58, 26, 8);
      c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 1; c.strokeRect(o.x - 10, o.y - 52, 20, 54);
    }
    c.globalAlpha = 1;
  },

  // Редкий сундук: тёмный с изумрудной окантовкой, зелёное свечение и цена над ним
  drawRareChest(c, k, time, b) {
    const g = 0.25 + Math.sin(time * 5) * 0.1;
    c.fillStyle = 'rgba(60,255,140,' + g + ')'; c.beginPath(); c.arc(k.x, k.y, 32, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(120,255,170,' + (g + 0.2) + ')'; c.lineWidth = 2; c.beginPath(); c.arc(k.x, k.y, 24 + Math.sin(time * 3) * 3, 0, TAU); c.stroke();
    c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(k.x, k.y + 13, 19, 5, 0, 0, TAU); c.fill();
    const ri = Art.img.fx_chest_rare;
    if (ri) { const h = 40, w = h * ri.width / ri.height; c.drawImage(ri, k.x - w / 2, k.y - h / 2 - 2 + b, w, h); }   // редкий сундук из арта
    else {
    c.fillStyle = '#2a1a44'; c.fillRect(k.x - 17, k.y - 8 + b, 34, 20);
    c.fillStyle = '#3e2866'; c.fillRect(k.x - 17, k.y - 16 + b, 34, 10);
    c.fillStyle = '#3cff8c'; c.fillRect(k.x - 17, k.y - 7 + b, 34, 3); c.fillRect(k.x - 14, k.y - 16 + b, 3, 28); c.fillRect(k.x + 11, k.y - 16 + b, 3, 28);
    c.fillStyle = '#b8ffd8'; c.beginPath(); c.moveTo(k.x, k.y - 11 + b); c.lineTo(k.x + 5, k.y - 5 + b); c.lineTo(k.x, k.y + 1 + b); c.lineTo(k.x - 5, k.y - 5 + b); c.fill();
    }
    for (let i = 0; i < 3; i++) {                 // зелёные искры
      const sp = (time * 0.9 + i * 0.33 + k.x * 0.001) % 1;
      c.fillStyle = 'rgba(140,255,190,' + (1 - sp) + ')'; c.fillRect(k.x - 16 + ((i * 13 + sp * 20) % 32), k.y - 18 - sp * 18 + b, 2.5, 2.5);
    }
    c.font = 'bold 11px "Russo One", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const gi = Art.img.fx_green_spin, txt = String(RARE_CHEST_COST), ty = k.y - 38 + b;   // цена: зелёная монета + число
    if (gi) {
      const tw = c.measureText(txt).width, x0 = k.x - (tw + 16) / 2;
      c.drawImage(gi, 0, 0, gi.width / 3, gi.height, x0, ty - 7, 14, 14);
      c.textAlign = 'left'; c.fillStyle = 'rgba(0,0,0,.6)'; c.fillText(txt, x0 + 17, ty + 1); c.fillStyle = '#8cffb8'; c.fillText(txt, x0 + 16, ty); c.textAlign = 'center';
    } else {
      c.fillStyle = 'rgba(0,0,0,.6)'; c.fillText('🟢 ' + txt, k.x + 1, ty + 1);
      c.fillStyle = '#8cffb8'; c.fillText('🟢 ' + txt, k.x, ty);
    }
  },

  drawChests(c, time, L, T, w, h) {
    for (const ch of this.chunks.values()) for (const k of ch.chests) {
      if (k.opened || k.x < L - 40 || k.x > L + w + 40 || k.y < T - 40 || k.y > T + h + 40) continue;
      const b = Math.sin(time * 3 + k.x) * 1.5;
      if (k.rare) { this.drawRareChest(c, k, time, b); continue; }
      if (Art.img.fx_chest) {                        // сундук из арта
        const im = Art.img.fx_chest, h = 34, w = h * im.width / im.height;
        c.fillStyle = 'rgba(255,210,60,' + (0.18 + Math.sin(time * 4) * 0.08) + ')'; c.beginPath(); c.arc(k.x, k.y, 28, 0, TAU); c.fill();
        c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(k.x, k.y + 14, 18, 5, 0, 0, TAU); c.fill();
        c.drawImage(im, k.x - w / 2, k.y - h / 2 - 2 + b, w, h); continue;
      }
      c.fillStyle = 'rgba(255,210,60,' + (0.18 + Math.sin(time * 4) * 0.08) + ')'; c.beginPath(); c.arc(k.x, k.y, 26, 0, TAU); c.fill();
      c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(k.x, k.y + 11, 17, 5, 0, 0, TAU); c.fill();
      c.fillStyle = '#6a3e18'; c.fillRect(k.x - 15, k.y - 8 + b, 30, 18);
      c.fillStyle = '#8a5424'; c.fillRect(k.x - 15, k.y - 14 + b, 30, 9);
      c.fillStyle = '#c8962a'; c.fillRect(k.x - 15, k.y - 6 + b, 30, 3); c.fillRect(k.x - 12, k.y - 14 + b, 3, 24); c.fillRect(k.x + 9, k.y - 14 + b, 3, 24);
      c.fillStyle = '#ffd23a'; c.fillRect(k.x - 3, k.y - 7 + b, 6, 7);
      const sp = (time * 1.3 + k.y * 0.01) % 1;                    // искорка
      c.fillStyle = 'rgba(255,240,160,' + (1 - sp) + ')'; c.fillRect(k.x - 12 + sp * 24, k.y - 20 - sp * 10 + b, 2, 2);
    }
  },
};
