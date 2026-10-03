'use strict';
// ===== Графика: загрузка PNG-арта, временные заглушки, земля уровней =====
const Art = {
  img: {}, sil: {}, ph: {}, grounds: {},

  // Загрузка: один файл — одна картинка (варианты одного листа делят её), перекраска — одна на файл+оттенок.
  // Белые силуэты для вспышки делаем только для небольших спрайтов; большим листам FLARE вспышка рисуется осветлением.
  // Боссы и герои грузятся по требованию (need): в забеге нужен один герой и один-два босса — экономит память телефона
  lazy(key) { return /^(boss_|hero_|enemy_)/.test(key); },
  init() {
    this.files = {}; this.tints = {}; this.asked = new Set();
    for (const key in ART) if (!this.lazy(key) || key === 'hero_' + Save.data.hero) this.load(key);
  },
  need(key) { if (key && ART[key] && !this.asked.has(key)) this.load(key); },
  load(key) {
    const files = this.files, tints = this.tints; this.asked.add(key);
    {
      const a = ART[key];
      if (a.drawn || !a.file) return;   // нарисовано кодом — грузить нечего
      const done = im => {
        let out = im;
        if (a.tint) { const tk = a.file + '|' + a.tint; out = tints[tk] || (tints[tk] = this.tinted(im, a.tint)); }
        this.img[key] = out;
        if (!a.flare && out.width * out.height < 1.2e6) this.sil[key] = this.silhouette(out);
        UI.refreshSprites();
      };
      let f = files[a.file];
      if (!f) {
        f = files[a.file] = { im: new Image(), wait: [] };
        f.im.onload = () => { f.ok = 1; f.wait.forEach(cb => cb(f.im)); f.wait = null; };
        f.im.onerror = () => { f.wait = null; };           // файла нет — остаётся заглушка
        f.im.src = a.file;
      }
      if (f.ok) done(f.im); else if (f.wait) f.wait.push(done);
    }
  },
  has(key) { return !!this.img[key]; },
  // Спрайт со сдвигом оттенка (для эволюций): кешируется; без поддержки фильтров — исходник
  hue(key, deg) {
    const k = key + '_h' + deg; if (this.img[k]) return this.img[k];
    const im = this.img[key]; if (!im) return null;
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    const x = c.getContext('2d'); x.filter = 'hue-rotate(' + deg + 'deg) saturate(1.3)'; x.drawImage(im, 0, 0);
    return (this.img[k] = c);
  },

  // Цветной вариант картинки (оттенок поверх непрозрачных пикселей)
  tinted(src, col) {
    const c = document.createElement("canvas"); c.width = src.width; c.height = src.height;
    const x = c.getContext("2d"); x.drawImage(src, 0, 0);
    x.globalCompositeOperation = "source-atop"; x.globalAlpha = 0.42; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height);
    return c;
  },
  // Белый силуэт для вспышки при попадании
  silhouette(src) {
    const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
    const x = c.getContext('2d'); x.drawImage(src, 0, 0);
    x.globalCompositeOperation = 'source-in'; x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
    return c;
  },

  // Заглушка: цветной кружок с эмодзи (враги) или буквой (герои)
  placeholder(key, color, label, flash) {
    const k = key + (flash ? '_f' : '') + color;
    if (this.ph[k]) return this.ph[k];
    const S = 64, c = document.createElement('canvas'); c.width = c.height = S;
    const x = c.getContext('2d');
    x.beginPath(); x.arc(S / 2, S / 2, S / 2 - 3, 0, TAU);
    x.fillStyle = flash ? '#ffffff' : color; x.fill();
    x.lineWidth = 4; x.strokeStyle = flash ? '#ffffff' : 'rgba(0,0,0,.65)'; x.stroke();
    if (!flash) {
      x.beginPath(); x.arc(S / 2 - 8, S / 2 - 10, 10, 0, TAU); x.fillStyle = 'rgba(255,255,255,.18)'; x.fill();
      x.textAlign = 'center'; x.textBaseline = 'middle';
      const isLetter = label.length === 1 && /[А-ЯA-Z]/i.test(label);
      x.font = isLetter ? 'bold 34px "Russo One", sans-serif' : '34px sans-serif';
      if (isLetter) { x.fillStyle = 'rgba(0,0,0,.35)'; x.fillText(label, S / 2 + 2, S / 2 + 4); x.fillStyle = '#fff'; }
      else x.fillStyle = '#fff';
      x.fillText(label, S / 2, S / 2 + 2);
    }
    return (this.ph[k] = c);
  },

  // Рисует спрайт по центру (x,y) высотой size. o: {flip, flash, t, alpha, color, label}
  // o.anim — имя анимации (walk/attack/hit/death) для листов с несколькими строками,
  // o.frame — конкретный кадр вместо цикла по времени.
  draw(ctx, key, x, y, size, o) {
    const im = this.img[key];
    let src, sx = 0, sy = 0, sw, sh, flip = false, h = size, overlay = false;
    if (im) {
      const a = ART[key];
      if (a.anims) {
        const an = a.anims[o.anim] || a.anims.walk;
        sw = a.cw; sh = a.ch; sy = an.row * sh;
        const f = o.frame !== undefined
          ? clamp(Math.floor(o.frame), 0, an.n - 1)
          : o.progress !== undefined
            ? Math.floor(clamp(o.progress, 0, 1) * (an.n - 1))
            : Math.floor((o.t || 0) * an.fps) % an.n;
        sx = f * sw;
        src = im; overlay = !!o.flash;             // вспышка поверх кадра «получение урона»
      } else {
        const fr = a.frames || 1;
        sw = im.width / fr; sh = im.height;
        sx = (Math.floor((o.t || 0) * (a.fps || 8)) % fr) * sw;
        src = im; overlay = !!o.flash;
      }
      if (a.scale) h *= a.scale;
      flip = a.facesLeft ? !o.flip : !!o.flip;
    } else {
      src = this.placeholder(key, o.color || '#888', o.label || '?', o.flash);
      sw = src.width; sh = src.height;
    }
    const w = h * sw / sh, alpha = o.alpha !== undefined ? o.alpha : 1;
    // Отражение: готовая зеркальная копия листа (кадры отражены на своих местах) — рисуется так же быстро, как обычный спрайт.
    // Пока копия не готова — через ctx.scale(-1, 1) (это заметно медленнее).
    let sil = overlay ? this.sil[key] : null, tr = false;
    if (flip && im) { const m = this.mirror(key, src); if (m) { src = m; sil = null; } else tr = true; }
    else if (flip) tr = true;
    if (tr) { ctx.save(); ctx.translate(x, y); ctx.scale(-1, 1); x = 0; y = 0; }
    if (alpha < 1) ctx.globalAlpha = alpha;
    ctx.drawImage(src, sx, sy, sw, sh, x - w / 2, y - h / 2, w, h);
    if (overlay && sil) { ctx.globalAlpha = alpha * 0.55; ctx.drawImage(sil, sx, sy, sw, sh, x - w / 2, y - h / 2, w, h); }
    else if (overlay) { const op = ctx.globalCompositeOperation; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = alpha * 0.6; ctx.drawImage(src, sx, sy, sw, sh, x - w / 2, y - h / 2, w, h); ctx.globalCompositeOperation = op; }   // вспышка без силуэта
    ctx.globalAlpha = 1;
    if (tr) ctx.restore();
  },
  // Зеркальная копия листа: каждый кадр отражён на своём месте. Создаётся один раз по первому запросу
  mirror(key, src) {
    const M = this.mirrors || (this.mirrors = new Map());
    let m = M.get(src); if (m !== undefined) return m;
    M.set(src, null);                                // готовится
    const a = ART[key] || {}, cw = a.anims ? a.cw : src.width / (a.frames || 1), ch = a.anims ? a.ch : src.height;
    const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; const x = c.getContext('2d');
    const cols = Math.round(src.width / cw), rows = Math.round(src.height / ch);
    for (let r = 0; r < rows; r++) for (let i = 0; i < cols; i++) { x.setTransform(-1, 0, 0, 1, (2 * i + 1) * cw, 0); x.drawImage(src, i * cw, r * ch, cw, ch, i * cw, r * ch, cw, ch); }
    if (window.createImageBitmap) createImageBitmap(c).then(b => M.set(src, b), () => M.set(src, c)); else M.set(src, c);
    return null;
  },

  // Длительность анимации в секундах (для смерти)
  animLen(key, anim) {
    const a = ART[key];
    if (!this.img[key] || !a.anims || !a.anims[anim]) return 0;
    return a.anims[anim].n / a.anims[anim].fps;
  },

  // Отрисовка героя в DOM-канвас (меню/магазин)
  drawHeroCard(cv, id, t) {
    this.need("hero_" + id);
    const x = cv.getContext('2d'), h = HEROES[id], key = 'hero_' + id;
    if (!this.has(key) && ART[key] && ART[key].file) { x.clearRect(0, 0, cv.width, cv.height); return; }   // картинка ещё грузится — не показываем заглушку с буквой
    if (cv._card === id + cv.width + 'x' + cv.height) return;   // карточка статичная: рисуем один раз
    cv._card = id + cv.width + 'x' + cv.height;
    x.clearRect(0, 0, cv.width, cv.height);
    const big = key + '_big', box = typeof HERO_CARD_BOX !== 'undefined' && HERO_CARD_BOX[id];
    if (this.has(big)) { this.draw(x, big, cv.width / 2, cv.height / 2 + cv.height * 0.02, cv.height * 0.96, {}); return; }
    if (box && this.has(key)) {                     // герой FLARE: первый кадр покоя, фигура целиком вписана в карточку
      const k = Math.min(cv.height * 0.94 / box[3], cv.width * 0.94 / box[2]), w = box[2] * k, hh = box[3] * k;
      x.drawImage(this.img[key], box[0], box[1], box[2], box[3], (cv.width - w) / 2, cv.height * 0.97 - hh, w, hh);
      return;
    }
    this.draw(x, key, cv.width / 2, cv.height / 2, cv.height * 0.86, { frame: 0, anim: 'idle', color: h.color, label: h.name[0] });
  },

};
