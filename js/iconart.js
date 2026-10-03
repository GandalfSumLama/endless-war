'use strict';
// ===== Иконки новых способностей, нарисованные кодом (светящийся предмет без фона, как остальные иконки) =====
const IconArt = {
  glow(x, col, r) { const g = x.createRadialGradient(64, 64, 4, 64, 64, r); g.addColorStop(0, col + 'aa'); g.addColorStop(1, col + '00'); x.fillStyle = g; x.beginPath(); x.arc(64, 64, r, 0, Math.PI * 2); x.fill(); },
  star(x, cx, cy, R, r, n, rot) { x.beginPath(); for (let i = 0; i < n * 2; i++) { const a = rot + i * Math.PI / n, rr = i % 2 ? r : R; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } x.closePath(); },
  DRAW: {
    spikes(x) {
      IconArt.glow(x, '#ff3a5a', 60);
      x.fillStyle = '#3a0a14'; x.beginPath(); x.ellipse(64, 104, 46, 12, 0, 0, 7); x.fill();
      [[34, 58], [50, 30], [66, 16], [82, 36], [98, 60]].forEach(([px, h], i) => {
        x.fillStyle = '#5a0a1a'; x.beginPath(); x.moveTo(px - 12, 104); x.lineTo(px, h); x.lineTo(px + 12, 104); x.fill();
        x.fillStyle = i % 2 ? '#ff3a5a' : '#ff7a8a'; x.beginPath(); x.moveTo(px - 4, 104); x.lineTo(px, h + 4); x.lineTo(px + 6, 104); x.fill();
      });
    },
    plague(x) {
      IconArt.glow(x, '#8aff4a', 62);
      [[48, 72, 26], [78, 66, 30], [62, 48, 24], [84, 88, 18], [40, 92, 16]].forEach(([px, py, r], i) => { x.fillStyle = ['#3a8a1a', '#5ac02a', '#8aff4a', '#4aa020', '#6ae03a'][i]; x.globalAlpha = 0.85; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); });
      x.globalAlpha = 1; x.fillStyle = '#1a3a0a'; x.beginPath(); x.arc(64, 66, 13, 0, 7); x.fill();
      x.strokeStyle = '#d8ff9a'; x.lineWidth = 4; for (let i = 0; i < 3; i++) { const a = i * 2.094 - 1.57; x.beginPath(); x.arc(64 + Math.cos(a) * 11, 66 + Math.sin(a) * 11, 8, a - 1.2, a + 1.2); x.stroke(); }
    },
    shuriken(x) {
      IconArt.glow(x, '#9ac8ff', 60);
      x.fillStyle = '#d8e4f0'; x.strokeStyle = '#1a2230'; x.lineWidth = 3; IconArt.star(x, 64, 64, 50, 14, 4, 0.4); x.fill(); x.stroke();
      x.fillStyle = '#8aa8c8'; IconArt.star(x, 64, 64, 34, 8, 4, 0.4 + Math.PI / 4); x.fill();
      x.fillStyle = '#1a2230'; x.beginPath(); x.arc(64, 64, 8, 0, 7); x.fill();
    },
    turret(x) {
      IconArt.glow(x, '#7affd8', 60);
      x.fillStyle = '#1e2830'; x.beginPath(); x.moveTo(40, 112); x.lineTo(50, 56); x.lineTo(78, 56); x.lineTo(88, 112); x.fill();
      x.fillStyle = '#44525e'; x.fillRect(52, 58, 8, 54);
      x.fillStyle = '#7affd8'; x.beginPath(); x.moveTo(64, 10); x.lineTo(80, 34); x.lineTo(64, 56); x.lineTo(48, 34); x.closePath(); x.fill();
      x.fillStyle = '#d8fff4'; x.beginPath(); x.moveTo(64, 16); x.lineTo(70, 34); x.lineTo(64, 48); x.fill();
      x.strokeStyle = '#7affd8'; x.lineWidth = 3; x.beginPath(); x.moveTo(80, 34); x.lineTo(118, 22); x.stroke();
    },
    lances(x) {
      IconArt.glow(x, '#9fe8ff', 60);
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3 + 0.3; x.save(); x.translate(64, 64); x.rotate(a);
        x.fillStyle = '#e8faff'; x.strokeStyle = '#1a4060'; x.lineWidth = 2; x.beginPath(); x.moveTo(56, 0); x.lineTo(18, -7); x.lineTo(8, 0); x.lineTo(18, 7); x.closePath(); x.fill(); x.stroke(); x.restore();
      }
      x.fillStyle = '#bff0ff'; x.beginPath(); x.arc(64, 64, 9, 0, 7); x.fill();
    },
    swords(x) {
      IconArt.glow(x, '#b8a0ff', 60);
      [-0.55, 0.55].forEach(r => {
        x.save(); x.translate(64, 64); x.rotate(r - Math.PI / 2);
        x.fillStyle = '#e8e0ff'; x.strokeStyle = '#3a2a6a'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(54, 0); x.lineTo(-10, -7); x.lineTo(-10, 7); x.closePath(); x.fill(); x.stroke();
        x.fillStyle = '#b8a0ff'; x.fillRect(-16, -15, 7, 30); x.fillRect(-40, -4, 25, 8); x.restore();
      });
    },
    quake(x) {
      IconArt.glow(x, '#d8a060', 60);
      x.fillStyle = '#5a3a20'; x.beginPath(); x.ellipse(64, 70, 54, 40, 0, 0, 7); x.fill();
      x.strokeStyle = '#1a0e08'; x.lineWidth = 9; x.lineJoin = 'round';
      const cr = [[64, 70, 20, 30, 12, 34], [64, 70, 106, 60, 116, 74], [64, 70, 70, 104, 58, 118], [64, 70, 30, 96, 16, 104]];
      cr.forEach(q => { x.beginPath(); x.moveTo(q[0], q[1]); x.lineTo(q[2], q[3]); x.lineTo(q[4], q[5]); x.stroke(); });
      x.strokeStyle = '#ffa040'; x.lineWidth = 3.5; cr.forEach(q => { x.beginPath(); x.moveTo(q[0], q[1]); x.lineTo(q[2], q[3]); x.lineTo(q[4], q[5]); x.stroke(); });
    },
    starfall(x) {
      IconArt.glow(x, '#fff0a0', 60);
      [[40, 36, 12], [92, 28, 9], [70, 66, 22], [36, 94, 10]].forEach(([px, py, r], i) => {
        x.strokeStyle = '#fff0a066'; x.lineWidth = r * 0.5; x.beginPath(); x.moveTo(px, py); x.lineTo(px - r * 1.6, py - r * 3); x.stroke();
        x.fillStyle = i === 2 ? '#fffbe0' : '#ffe070'; x.strokeStyle = '#8a6a10'; x.lineWidth = 2; IconArt.star(x, px, py, r, r * 0.42, 5, -Math.PI / 2); x.fill(); x.stroke();
      });
    },
    tornado(x) {
      IconArt.glow(x, '#bfe0ff', 60);
      for (let i = 0; i < 6; i++) { x.strokeStyle = i % 2 ? '#bfe0ff' : '#ffffff'; x.lineWidth = 8 - i; x.beginPath(); x.ellipse(64 + Math.sin(i) * 6, 26 + i * 15, 50 - i * 7, 10 - i * 0.8, 0, 0.3, 5.6); x.stroke(); }
    },
    batswarm(x) {
      IconArt.glow(x, '#ff4a6a', 60);
      const bi = Art.img.enemy_bat;
      [[64, 60, 1], [32, 36, 0.6], [96, 40, 0.6], [40, 96, 0.5], [92, 94, 0.55]].forEach(([px, py, s]) => {
        if (bi) x.drawImage(bi, 0, 0, 103, 67, px - 52 * s, py - 34 * s, 104 * s, 68 * s);
        else { x.fillStyle = '#b0203a'; x.beginPath(); x.ellipse(px, py, 30 * s, 12 * s, 0, 0, 7); x.fill(); }
      });
    },
    fang(x) {
      IconArt.glow(x, '#ff3a4a', 58);
      x.fillStyle = '#f4ece0'; x.strokeStyle = '#5a1a1a'; x.lineWidth = 3;
      x.beginPath(); x.moveTo(34, 26); x.quadraticCurveTo(64, 14, 94, 26); x.quadraticCurveTo(90, 60, 70, 110); x.quadraticCurveTo(64, 70, 58, 110); x.quadraticCurveTo(38, 60, 34, 26); x.fill(); x.stroke();
      x.fillStyle = '#d02030'; x.beginPath(); x.moveTo(66, 96); x.quadraticCurveTo(76, 112, 66, 120); x.quadraticCurveTo(56, 112, 66, 96); x.fill();
    },
    thorns(x) {
      IconArt.glow(x, '#9adf6a', 58);
      x.fillStyle = '#6a7a8a'; x.strokeStyle = '#1a2230'; x.lineWidth = 3;
      x.beginPath(); x.moveTo(30, 30); x.lineTo(98, 30); x.lineTo(92, 86); x.quadraticCurveTo(64, 116, 36, 86); x.closePath(); x.fill(); x.stroke();
      x.fillStyle = '#9aaaba'; x.fillRect(40, 38, 10, 44);
      x.fillStyle = '#9adf6a'; [[30, 30, -1, -1], [98, 30, 1, -1], [22, 64, -1, 0], [106, 64, 1, 0], [64, 110, 0, 1], [64, 20, 0, -1]].forEach(([px, py, dx, dy]) => {
        x.beginPath(); x.moveTo(px - dy * 6, py + dx * 6); x.lineTo(px + dx * 16, py + dy * 16); x.lineTo(px + dy * 6, py - dx * 6); x.fill();
      });
    },
  },
  build() {
    for (const id in this.DRAW) {
      const def = WEAPONS[id] || PASSIVES[id]; if (!def || ICON_ART[id]) continue;   // есть иконка-картинка — рисунок кодом не нужен
      const c = document.createElement('canvas'); c.width = c.height = 128;
      const x = c.getContext('2d'); x.lineCap = 'round'; x.lineJoin = 'round';
      this.DRAW[id](x);
      Art.img['icon_' + id] = c;
      def.iconSrc = c.toDataURL();
      def.icon = '<img class="ic" src="' + def.iconSrc + '" alt="">';
    }
  },
};
