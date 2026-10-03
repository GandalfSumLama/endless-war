'use strict';
// ===== Герои, нарисованные кодом: Пиромант, Ледяная ведьма, Счастливчик, Громовержец, Некромант =====
// Из рисунка собирается такой же лист кадров, как у героев с артом (покой / бег / атака) + портрет для меню.
// Если позже появится PNG-арт героя, он загрузится поверх этого рисунка.
const HeroArt = {
  // палитры и детали: robe — мантия, trim — отделка, skin — лицо, eye — свечение глаз, fx — цвет магии
  LOOKS: {
    pyro:  { robe: ['#5a0e08', '#a8261a', '#e0502a'], trim: '#f2c14e', cape: '#3a0a06', skin: '#e8b890', eye: '#ffcf4a', fx: '#ff7a2a', fx2: '#ffe080', head: 'hood', weapon: 'staff_fire' },
    witch: { robe: ['#10204a', '#2f4ca0', '#5a8ae0'], trim: '#bfe8ff', cape: '#0a1430', skin: '#f2dcd0', eye: '#8ae0ff', fx: '#7ad8ff', fx2: '#ffffff', head: 'witch', hair: '#e8f4ff', weapon: 'staff_ice' },
    gambler: { robe: ['#1a0c20', '#4a1a3a', '#7a2a5a'], trim: '#ffd23a', cape: '#12061a', skin: '#e8c0a0', eye: '#ffd23a', fx: '#ffd23a', fx2: '#fff4c0', head: 'tophat', weapon: 'cards' },
    storm: { robe: ['#0e1640', '#263a8a', '#4a6ad0'], trim: '#ffd84a', cape: '#0a0e28', skin: '#e8c8a8', eye: '#9ff0ff', fx: '#9fe8ff', fx2: '#fff27a', head: 'crown', hair: '#f0f4ff', weapon: 'lightning' },
    necro: { robe: ['#0e0816', '#2a1640', '#4a2a6a'], trim: '#8aff9a', cape: '#08040e', skin: '#d8d0c0', eye: '#7aff8a', fx: '#7aff8a', fx2: '#d8ffe0', head: 'skullhood', weapon: 'scythe' },
  },

  // Рисует героя (смотрит вправо, ноги в точке 0,0, рост ~120). pose: idle | run | attack, k — фаза 0..1
  draw(x, id, pose, k) {
    const L = this.LOOKS[id], t = k * Math.PI * 2;
    const run = pose === 'run', atk = pose === 'attack';
    const bob = run ? -Math.abs(Math.sin(t)) * 5 : Math.sin(t) * 1.5;
    const lean = run ? 0.12 : atk ? 0.06 : 0;
    x.save(); x.translate(0, bob); x.rotate(lean);
    x.lineJoin = 'round'; x.lineCap = 'round';
    // тень
    x.save(); x.rotate(-lean); x.translate(0, -bob); x.fillStyle = 'rgba(0,0,0,.28)'; x.beginPath(); x.ellipse(0, 1, 26, 7, 0, 0, Math.PI * 2); x.fill(); x.restore();
    // плащ за спиной (развевается при беге)
    const flap = run ? Math.sin(t * 2) * 6 - 8 : Math.sin(t) * 2;
    x.fillStyle = L.cape; x.beginPath(); x.moveTo(-6, -84); x.quadraticCurveTo(-30 + flap, -50, -34 + flap * 1.6, -14);
    for (let i = 0; i < 5; i++) x.lineTo(-30 + flap * 1.6 + i * 7, -14 + (i % 2 ? 8 : 0));
    x.lineTo(4, -20); x.closePath(); x.fill();
    // ноги
    const legSw = run ? Math.sin(t) * 13 : 0;
    this.leg(x, -6, legSw, L); this.leg(x, 6, -legSw, L);
    // мантия
    const g = x.createLinearGradient(-22, 0, 24, 0); g.addColorStop(0, L.robe[0]); g.addColorStop(0.55, L.robe[1]); g.addColorStop(1, L.robe[2]);
    x.fillStyle = g; x.beginPath(); x.moveTo(-15, -82); x.lineTo(15, -82); x.lineTo(24, -20);
    for (let i = 0; i <= 6; i++) x.lineTo(24 - i * 8, -20 + (i % 2 ? 6 : 0) + (run ? Math.sin(t + i) * 2 : 0));
    x.lineTo(-24, -20); x.closePath(); x.fill();
    x.strokeStyle = L.trim; x.lineWidth = 2; x.beginPath(); x.moveTo(3, -80); x.lineTo(6, -22); x.stroke();          // отделка
    x.fillStyle = L.trim; x.fillRect(-16, -52, 32, 4);                                                                // пояс
    x.fillStyle = L.robe[0]; x.globalAlpha = 0.35; x.beginPath(); x.moveTo(-15, -82); x.lineTo(-24, -20); x.lineTo(-8, -20); x.lineTo(-6, -82); x.fill(); x.globalAlpha = 1;
    // задняя рука
    x.strokeStyle = L.robe[0]; x.lineWidth = 8; x.beginPath(); x.moveTo(-10, -76); x.lineTo(-18 + (run ? -Math.sin(t) * 8 : 0), -54); x.stroke();
    // голова
    this.head(x, L, t);
    // передняя рука + оружие
    const ax = atk ? 30 + k * 6 : 18, ay = atk ? -72 : -58;
    x.strokeStyle = L.robe[1]; x.lineWidth = 8; x.beginPath(); x.moveTo(8, -76); x.lineTo(ax, ay); x.stroke();
    x.fillStyle = L.skin; x.beginPath(); x.arc(ax, ay, 4, 0, Math.PI * 2); x.fill();
    this.weapon(x, L, ax, ay, t, atk, k);
    x.restore();
  },
  leg(x, ox, sw, L) {
    x.strokeStyle = L.robe[0]; x.lineWidth = 8; x.beginPath(); x.moveTo(ox, -30); x.lineTo(ox + sw * 0.6, -4); x.stroke();
    x.fillStyle = '#1a1210'; x.beginPath(); x.ellipse(ox + sw * 0.6 + 4, -2, 7, 4, 0, 0, Math.PI * 2); x.fill();
  },
  head(x, L, t) {
    const hx = 3, hy = -94;
    const face = () => {                                   // тёмное лицо с горящими глазами
      x.fillStyle = L.head === 'skullhood' ? L.skin : '#1a1016'; x.beginPath(); x.ellipse(hx + 3, hy + 2, 9, 10, 0, 0, Math.PI * 2); x.fill();
      if (L.head === 'skullhood') { x.fillStyle = '#0a0a0a'; x.beginPath(); x.ellipse(hx + 1, hy + 1, 3, 3.5, 0, 0, 7); x.ellipse(hx + 8, hy + 1, 3, 3.5, 0, 0, 7); x.fill(); x.fillRect(hx + 2, hy + 8, 6, 2); }
      x.shadowColor = L.eye; x.shadowBlur = 8; x.fillStyle = L.eye;
      x.beginPath(); x.arc(hx + 1, hy + 1, 1.8, 0, 7); x.arc(hx + 8, hy + 1, 1.8, 0, 7); x.fill(); x.shadowBlur = 0;
    };
    if (L.hair) { x.fillStyle = L.hair; x.beginPath(); x.moveTo(hx - 12, hy - 4); x.quadraticCurveTo(hx - 20, hy + 20, hx - 14, hy + 30); x.lineTo(hx - 4, hy + 10); x.fill(); }
    if (L.head === 'hood' || L.head === 'skullhood') {
      x.fillStyle = L.robe[1]; x.beginPath(); x.moveTo(hx - 14, hy + 12); x.quadraticCurveTo(hx - 16, hy - 18, hx + 4, hy - 20);
      x.quadraticCurveTo(hx + 18, hy - 12, hx + 15, hy + 12); x.closePath(); x.fill();
      if (L.head === 'hood') { x.fillStyle = L.fx; x.globalAlpha = 0.8; x.beginPath(); x.moveTo(hx - 2, hy - 20); x.quadraticCurveTo(hx + 4 + Math.sin(t * 3) * 3, hy - 34, hx + 8, hy - 18); x.fill(); x.globalAlpha = 1; }
      face();
    } else {
      x.fillStyle = L.skin; x.beginPath(); x.ellipse(hx + 2, hy + 2, 10, 11, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#1a1016'; x.shadowColor = L.eye; x.shadowBlur = 6; x.fillStyle = L.eye;
      x.beginPath(); x.arc(hx + 3, hy + 1, 1.7, 0, 7); x.arc(hx + 9, hy + 1, 1.7, 0, 7); x.fill(); x.shadowBlur = 0;
      if (L.head === 'witch') {                            // остроконечная шляпа
        x.fillStyle = L.robe[0]; x.beginPath(); x.ellipse(hx + 1, hy - 8, 20, 5, -0.1, 0, Math.PI * 2); x.fill();
        x.fillStyle = L.robe[1]; x.beginPath(); x.moveTo(hx - 10, hy - 9); x.quadraticCurveTo(hx - 2, hy - 30, hx - 16 + Math.sin(t) * 2, hy - 44); x.quadraticCurveTo(hx + 4, hy - 30, hx + 12, hy - 9); x.closePath(); x.fill();
        x.strokeStyle = L.trim; x.lineWidth = 2.5; x.beginPath(); x.moveTo(hx - 10, hy - 10); x.lineTo(hx + 12, hy - 10); x.stroke();
      } else if (L.head === 'tophat') {                    // цилиндр с лентой
        x.fillStyle = '#0e0810'; x.beginPath(); x.ellipse(hx + 2, hy - 8, 17, 4, 0, 0, Math.PI * 2); x.fill();
        x.fillRect(hx - 8, hy - 32, 20, 24); x.fillStyle = L.trim; x.fillRect(hx - 8, hy - 14, 20, 4);
        x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(hx - 6, hy - 30, 4, 20);
      } else if (L.head === 'crown') {                     // корона-молнии и растрёпанные волосы
        x.fillStyle = L.hair; for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(hx - 9 + i * 5, hy - 6); x.lineTo(hx - 12 + i * 5, hy - 18 - (i % 2) * 5); x.lineTo(hx - 5 + i * 5, hy - 7); x.fill(); }
        x.fillStyle = L.trim; x.beginPath(); x.moveTo(hx - 9, hy - 7); for (let i = 0; i < 4; i++) { x.lineTo(hx - 7 + i * 5, hy - 16); x.lineTo(hx - 4 + i * 5, hy - 9); } x.lineTo(hx + 12, hy - 7); x.closePath(); x.fill();
      }
    }
  },
  weapon(x, L, ax, ay, t, atk, k) {
    const glow = (px, py, r, col) => { const g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, col); g.addColorStop(1, col.slice(0, 7) + '00'); x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); };
    if (L.weapon === 'staff_fire' || L.weapon === 'staff_ice') {
      const top = { x: ax + (atk ? 16 : 4), y: ay - 44 };
      x.strokeStyle = '#4a3020'; x.lineWidth = 3.5; x.beginPath(); x.moveTo(ax - 4, ay + 26); x.lineTo(top.x, top.y); x.stroke();
      glow(top.x, top.y, atk ? 22 : 14, L.fx + 'aa');
      if (L.weapon === 'staff_fire') { x.fillStyle = L.fx; x.beginPath(); x.moveTo(top.x - 5, top.y + 4); x.quadraticCurveTo(top.x + Math.sin(t * 3) * 4, top.y - 18, top.x + 5, top.y + 4); x.fill(); x.fillStyle = L.fx2; x.beginPath(); x.arc(top.x, top.y + 1, 3.5, 0, 7); x.fill(); }
      else { x.fillStyle = L.fx; x.beginPath(); x.moveTo(top.x, top.y - 12); x.lineTo(top.x + 5, top.y); x.lineTo(top.x, top.y + 8); x.lineTo(top.x - 5, top.y); x.closePath(); x.fill(); x.fillStyle = L.fx2; x.fillRect(top.x - 1, top.y - 6, 2, 8); }
      if (atk) { x.strokeStyle = L.fx; x.lineWidth = 3; x.globalAlpha = 1 - k; x.beginPath(); x.arc(top.x + 10, top.y, 10 + k * 18, -1, 1); x.stroke(); x.globalAlpha = 1; }
    } else if (L.weapon === 'cards') {                     // веер светящихся карт и кубик
      for (let i = 0; i < 3; i++) {
        x.save(); x.translate(ax + 4, ay - 4); x.rotate(-0.6 + i * 0.35 + (atk ? k * 0.8 : 0));
        x.fillStyle = '#f4ecd8'; x.fillRect(0, -16, 11, 16); x.strokeStyle = L.trim; x.lineWidth = 1; x.strokeRect(0, -16, 11, 16);
        x.fillStyle = i === 1 ? '#d02a3c' : '#1a1a22'; x.beginPath(); x.arc(5.5, -8, 2.5, 0, 7); x.fill(); x.restore();
      }
      glow(ax + 8, ay - 10, atk ? 20 : 12, L.fx + '88');
      if (atk) { x.fillStyle = L.fx; x.globalAlpha = 1 - k; x.fillRect(ax + 18 + k * 20, ay - 18 - k * 10, 9, 9); x.globalAlpha = 1; }
    } else if (L.weapon === 'lightning') {                 // молния в руке
      glow(ax + 6, ay - 6, atk ? 26 : 16, L.fx + 'aa');
      x.strokeStyle = L.fx2; x.lineWidth = 2.5; x.beginPath(); x.moveTo(ax + 2, ay - 2);
      const n = atk ? 5 : 3; for (let i = 1; i <= n; i++) x.lineTo(ax + 2 + i * 7, ay - 2 + (i % 2 ? -7 : 6) * (atk ? 1.3 : 1) + Math.sin(t * 8 + i) * 2);
      x.stroke(); x.strokeStyle = '#fff'; x.lineWidth = 1; x.stroke();
    } else if (L.weapon === 'scythe') {                    // коса
      const top = { x: ax + 2, y: ay - 46 };
      x.strokeStyle = '#2a2030'; x.lineWidth = 3.5; x.beginPath(); x.moveTo(ax - 6, ay + 28); x.lineTo(top.x, top.y); x.stroke();
      x.save(); x.translate(top.x, top.y); x.rotate(atk ? -0.4 + k * 1.2 : 0);
      x.fillStyle = '#c8d0d8'; x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(22, -8, 30, 10); x.quadraticCurveTo(18, 0, 0, 5); x.closePath(); x.fill();
      x.strokeStyle = L.fx; x.lineWidth = 1.5; x.stroke(); x.restore();
      glow(top.x, top.y, 10, L.fx + '88');
      for (let i = 0; i < 2; i++) { const a = t + i * 3; glow(ax - 20 + Math.cos(a) * 10, ay - 30 + Math.sin(a) * 6, 6, L.fx + 'aa'); }   // души вокруг
    }
  },

  // Собирает лист кадров и портрет и регистрирует их как арт героя
  build() {
    const CW = 120, CH = 140, rows = { idle: 2, run: 4, attack: 3 }, order = ['idle', 'run', 'attack'];
    for (const id in this.LOOKS) {
      const key = 'hero_' + id;
      if (typeof ART_META_HEROES !== 'undefined' && ART_META_HEROES[id]) continue;   // есть настоящий арт — не рисуем
      if (ART[key] && ART[key].flare) continue;                          // модель FLARE
      const sheet = document.createElement('canvas'); sheet.width = CW * 4; sheet.height = CH * 3;
      const x = sheet.getContext('2d');
      order.forEach((a, r) => { for (let f = 0; f < rows[a]; f++) { x.save(); x.translate(f * CW + CW / 2 - 4, r * CH + CH - 6); this.draw(x, id, a, f / rows[a]); x.restore(); } });
      const anims = {}; order.forEach((a, r) => anims[a] = { row: r, n: rows[a], fps: a === 'run' ? 10 : a === 'attack' ? 10 : 3 });
      anims.walk = anims.idle;
      ART[key] = { file: '', cw: CW, ch: CH, anims, drawn: 1 };
      Art.img[key] = sheet; Art.sil[key] = Art.silhouette(sheet);
      const big = document.createElement('canvas'); big.width = 300; big.height = 360;       // портрет для меню и магазина
      const b = big.getContext('2d'); b.translate(150, 350); b.scale(2.6, 2.6); this.draw(b, id, 'idle', 0.25);
      ART[key + '_big'] = { file: '', frames: 1, fps: 1, drawn: 1 }; Art.img[key + '_big'] = big;
    }
  },
};
