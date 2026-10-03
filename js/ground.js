'use strict';
// ===== Земля уровней: бесшовные текстуры 16 биомов (по образу референсов) =====

// Старые названия земли → биомы
const GROUND_ALIAS = { grave: 'haunted', ice: 'snow', lava: 'volcano', abyss: 'crystal_purple' };

// Биом: основной цвет, крупные пятна и мелкие детали [вид, цвет(а), количество]
const GROUNDS = {
  meadow: { base: '#4a8a3a', blot: ['#56a044', '#3e7a32', '#5aa84a'], deco: [['tuft', '#6ab850', 90], ['flower', ['#f0e060', '#f4f4f4', '#e080c0'], 34], ['dot', ['#3a6a2a'], 20]] },
  snow: { base: '#d6e4f0', blot: ['#eef6ff', '#c2d4e6', '#ffffff'], deco: [['sparkle', '#ffffff', 60], ['crack', 'rgba(140,170,205,.5)', 8], ['dot', ['#aabccc'], 25]] },
  desert: { base: '#d8a860', blot: ['#e2b870', '#c89850', '#ecc488'], deco: [['ripple', 'rgba(150,100,45,.35)', 24], ['dot', ['#b8864a', '#8a6034'], 30]] },
  forest: { base: '#26402a', blot: ['#2e4c30', '#1f3522', '#33532f'], deco: [['tuft', '#3f6a3a', 70], ['flower', ['#d8c05a', '#c86a9a', '#e8e8e8'], 14], ['dot', ['#4a4a42', '#3a3a34'], 20]] },
  swamp: { base: '#2c3826', blot: ['#364830', '#222e1e', '#3c4c2c'], deco: [['puddle', 'rgba(50,80,62,.7)', 12], ['tuft', '#4a6a34', 50], ['dot', ['#1c2616'], 30]] },
  volcano: { base: '#221614', blot: ['#301e1a', '#1a100e', '#3a2418'], deco: [['crack', '#ff5a1a', 9], ['crack', '#ffb040', 5], ['dot', ['#120a08', '#3a2a24'], 40]] },
  canyon: { base: '#b8643a', blot: ['#c8744a', '#a45632', '#d08050'], deco: [['crack', 'rgba(90,40,20,.45)', 14], ['dot', ['#8a4a2a', '#d89060'], 40]] },
  coast: { base: '#d8c898', blot: ['#e2d4a8', '#c8b888', '#bca878'], deco: [['ripple', 'rgba(150,130,90,.3)', 15], ['shell', ['#f4e6d8', '#e8c0b0'], 14], ['dot', ['#8a8070'], 30]] },
  crystal_blue: { base: '#131a30', blot: ['#1a2644', '#0d1326', '#223052'], deco: [['crack', 'rgba(80,140,255,.35)', 10], ['glow', 'rgba(80,160,255,.55)', 14], ['dot', ['#2a3a60'], 30]] },
  ruins: { base: '#467636', blot: ['#528640', '#3a662e'], deco: [['paving', 'rgba(150,150,138,.3)', 1], ['tuft', '#6aa850', 50], ['dot', ['#5a5a50'], 15]] },
  haunted: { base: '#221a32', blot: ['#2a203e', '#181226', '#302646'], deco: [['tuft', '#3a2e50', 40], ['dot', ['#4a3a6a', '#8a70c0'], 30], ['crack', 'rgba(0,0,0,.35)', 8]] },
  wheat: { base: '#b08a2c', blot: ['#c29a38', '#a07a22', '#d0aa46'], deco: [['stalk', '#e4c664', 260], ['stalk', '#86661c', 110]] },
  crystal_purple: { base: '#1a0f2e', blot: ['#24163e', '#120a22', '#2c1c48'], deco: [['crack', 'rgba(170,90,255,.35)', 10], ['glow', 'rgba(180,90,255,.55)', 14], ['dot', ['#3a2a5a'], 30]] },
  jungle: { base: '#1c4622', blot: ['#22562a', '#163c1c', '#2a6632'], deco: [['leaf', '#3a8a3a', 45], ['tuft', '#4aa04a', 60], ['dot', ['#10301a'], 30]] },
  toxic: { base: '#283016', blot: ['#333c1a', '#1e2610', '#3c481c'], deco: [['puddle', 'rgba(120,255,60,.3)', 9], ['crack', 'rgba(0,0,0,.4)', 10], ['dot', ['#5a7a2a', '#9aff4a'], 30]] },
  moon: { base: '#474b60', blot: ['#53576e', '#3b3f54', '#5f637a'], deco: [['crater', '', 16], ['dot', ['#787c92', '#2c3042'], 50]] },
  endless: { base: '#1b1f28', blot: ['#222734', '#161a22', '#262a36'], deco: [['paving', 'rgba(255,255,255,.03)', 1], ['dot', ['#2a3a2a', '#303646'], 30]] },
};

// Названия биомов (баннер при смене земли в бесконечном режиме)
const BIOME_NAMES = { meadow: 'Цветущий луг', snow: 'Снежные горы', desert: 'Пустыня', forest: 'Тёмный лес', swamp: 'Болото', volcano: 'Вулкан',
  canyon: 'Каньон', coast: 'Побережье', crystal_blue: 'Голубые пещеры', ruins: 'Древние руины', haunted: 'Проклятый лес', wheat: 'Пшеничные поля',
  crystal_purple: 'Аметистовые пещеры', jungle: 'Джунгли', toxic: 'Ядовитые пустоши', moon: 'Лунная пустошь' };

Art.ground = function (ctx, type) {
  type = GROUND_ALIAS[type] || type;
  if (this.grounds[type]) return this.grounds[type];
  const fg = typeof FLARE_GROUND !== 'undefined' && FLARE_GROUND[type], fi = fg && this.img['ground_' + fg];
  if (fi) {                                        // земля из тайлсетов FLARE: узор из холста (узор прямо из JPG на телефоне очень медленный)
    const cv = document.createElement('canvas'); cv.width = fi.width; cv.height = fi.height; cv.getContext('2d').drawImage(fi, 0, 0);
    return (this.grounds[type] = ctx.createPattern(cv, 'repeat'));
  }
  const S = 256, R = 2, G = GROUNDS[type] || GROUNDS.forest;
  const c = document.createElement('canvas'); c.width = c.height = S * R;
  const x = c.getContext('2d'); x.scale(R, R);
  let seed = 1337 + type.length * 97;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const pk = a => a[(rnd() * a.length) | 0];
  const wrap = fn => { for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { x.save(); x.translate(ox, oy); fn(); x.restore(); } };
  x.fillStyle = G.base; x.fillRect(0, 0, S, S);
  for (let i = 0; i < 18; i++) {                   // крупные пятна цвета
    const bx = rnd() * S, by = rnd() * S, r = 12 + rnd() * 34, col = G.blot[i % G.blot.length], rot = rnd() * 3;
    wrap(() => { x.globalAlpha = 0.55; x.fillStyle = col; x.beginPath(); x.ellipse(bx, by, r, r * 0.7, rot, 0, TAU); x.fill(); x.globalAlpha = 1; });
  }
  for (const [kind, col, n] of G.deco) for (let i = 0; i < n; i++) {
    const px = rnd() * S, py = rnd() * S, cl = Array.isArray(col) ? pk(col) : col, s = rnd(), a = rnd() * TAU;
    const pts = [];
    if (kind === 'crack') { let ang = a; pts.push([px, py]); for (let j = 0; j < 4; j++) { ang += (rnd() - 0.5) * 1.6; const l = pts[j]; pts.push([l[0] + Math.cos(ang) * 9, l[1] + Math.sin(ang) * 9]); } }
    const draw = () => {
      x.fillStyle = cl; x.strokeStyle = cl;
      switch (kind) {
        case 'tuft': x.lineWidth = 1.2; x.beginPath(); x.moveTo(px - 3, py - 4); x.lineTo(px, py); x.lineTo(px + 3, py - 5); x.stroke(); break;
        case 'flower': x.beginPath(); x.arc(px, py, 1.6, 0, TAU); x.fill(); x.fillStyle = '#fff6a0'; x.fillRect(px - 0.5, py - 0.5, 1, 1); break;
        case 'dot': { const d = 1.5 + s * 3; x.fillRect(px, py, d, d); break; }
        case 'sparkle': x.fillRect(px - 1.5, py - 0.3, 3, 0.6); x.fillRect(px - 0.3, py - 1.5, 0.6, 3); break;
        case 'crack': x.lineWidth = 1.1; x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (const q of pts) x.lineTo(q[0], q[1]); x.stroke(); break;
        case 'ripple': x.lineWidth = 1.2; x.beginPath(); x.moveTo(px - 14, py); x.quadraticCurveTo(px - 7, py - 3, px, py); x.quadraticCurveTo(px + 7, py + 3, px + 14, py); x.stroke(); break;
        case 'puddle': x.beginPath(); x.ellipse(px, py, 8 + s * 10, (8 + s * 10) * 0.55, a, 0, TAU); x.fill(); break;
        case 'shell': x.lineWidth = 1.4; x.beginPath(); x.arc(px, py, 2.2, Math.PI, 0); x.stroke(); break;
        case 'glow': { const g = x.createRadialGradient(px, py, 0, px, py, 7); g.addColorStop(0, cl); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(px - 7, py - 7, 14, 14); break; }
        case 'stalk': x.lineWidth = 1; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (s - 0.5) * 3, py - 6 - s * 4); x.stroke(); break;
        case 'leaf': x.beginPath(); x.ellipse(px, py, 3.5, 1.6, a, 0, TAU); x.fill(); break;
        case 'crater': {
          const r = 5 + s * 9;
          x.fillStyle = 'rgba(0,0,0,.22)'; x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill();
          x.strokeStyle = 'rgba(255,255,255,.16)'; x.lineWidth = 1.5; x.beginPath(); x.arc(px, py, r, 0.2, 1.9); x.stroke(); break;
        }
      }
    };
    if (kind === 'paving') {                         // каменная плитка (руины)
      x.fillStyle = cl;
      for (let gx = 0; gx < S; gx += 32) for (let gy = 0; gy < S; gy += 32) if (((gx * 7 + gy * 13) % 5) > 1) x.fillRect(gx + 2, gy + 2, 28, 28);
    } else wrap(draw);
  }
  const pat = ctx.createPattern(c, 'repeat');
  if (pat.setTransform) pat.setTransform(new DOMMatrix().scale(1 / R));
  if (fg) return pat;                               // текстура FLARE ещё грузится — старую землю не запоминаем
  return (this.grounds[type] = pat);
};
// Светлые биомы: снаряды на них рисуются с тёмным ореолом
const BRIGHT_GROUNDS = ['snow', 'desert', 'coast', 'wheat', 'canyon'];
