'use strict';
// ===== Интерфейс: меню, магазин, коллекция, окна в забеге =====
const UI = {
  el: null, cur: null, t: 0,

  init() {
    this.el = document.getElementById('ui');
    this.bannerEl = document.getElementById('banner');
    this.pauseBtn = document.getElementById('pauseBtn');
    this.pauseBtn.addEventListener('click', () => { Sfx.init(); Game.pause(); });
    this.dashBtn = document.getElementById("dashBtn");     // прыжок/рывок героя: срабатывает сразу при касании
    this.dashBtn.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); Sfx.init(); Game.useDash(); });
    this.pauseBtn.setAttribute('aria-label', t('Пауза')); this.dashBtn.setAttribute('aria-label', t('Прыжок'));
    this.modal = document.getElementById('modal');
    this.modal.addEventListener('click', e => {       // тап по фону или ✕ закрывает описание
      if (e.target === this.modal || e.target.closest('[data-a="closeinfo"]')) { Sfx.click(); this.closeInfo(); return; }
      const b = e.target.closest("[data-a]");               // кнопки внутри окна (например, подтверждение)
      if (b && !b.classList.contains("dis")) { Sfx.click(); this.action(b.dataset.a, b.dataset, b); }
    });
    this.el.addEventListener('click', e => {
      const b = e.target.closest('[data-a]');
      if (!b || b.classList.contains('dis')) return;
      Sfx.init(); Sfx.click();
      this.action(b.dataset.a, b.dataset, b);
    });
    let last = performance.now();
    const loop = now => { this.t += (now - last) / 1000; last = now; this.refreshSprites(); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    window.androidBack = () => this.back();       // кнопка «Назад» в APK
    if (TG && TG.BackButton) TG.BackButton.onClick(() => this.back());
  },

  // Безопасные отступы сверху/снизу (вырез камеры, кнопки Telegram в полноэкранном режиме):
  // Telegram → Android-обёртка → env(safe-area-inset-*). Результат пишем в CSS-переменные --sat/--sab.
  updateInsets() {
    if (!this.probe) {
      this.probe = document.createElement('div');
      this.probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)';
      document.body.appendChild(this.probe);
    }
    const cs = getComputedStyle(this.probe);
    let top = parseFloat(cs.paddingTop) || 0, bottom = parseFloat(cs.paddingBottom) || 0;
    if (TG && TG.safeAreaInset) {                  // Telegram 8.0+: область устройства + область под кнопками Telegram
      const s = TG.safeAreaInset, c = TG.contentSafeAreaInset || {};
      top = Math.max(top, (s.top || 0) + (c.top || 0)); bottom = Math.max(bottom, (s.bottom || 0) + (c.bottom || 0));
    }
    if (APP && APP.safeTop) { try { top = Math.max(top, +APP.safeTop() || 0); bottom = Math.max(bottom, +APP.safeBottom() || 0); } catch (e) { } }
    this.insets = { top, bottom };
    const r = document.documentElement.style;
    r.setProperty('--sat', top + 'px'); r.setProperty('--sab', bottom + 'px');
  },
  safeTop() { if (!this.insets) this.updateInsets(); return this.insets.top; },
  safeBottom() { if (!this.insets) this.updateInsets(); return this.insets.bottom; },
  H() { return Game.H; },

  show(html, name) {
    this.closeInfo(); clearInterval(this.spinT); this.spinning = false;
    this.el.innerHTML = html; this.el.classList.add('on'); this.el.scrollTop = 0;
    this.cur = name;
    if (TG && TG.BackButton) { if (['stages', 'shop', 'codex', 'settings', 'trophies'].includes(name)) TG.BackButton.show(); else TG.BackButton.hide(); }
    this.refreshSprites();
  },
  hide() { this.closeInfo(); this.el.innerHTML = ''; this.el.classList.remove('on'); this.cur = null; },
  refresh() { if (this[this.cur] && ['menu', 'stages', 'shop', 'codex', 'settings'].includes(this.cur)) this[this.cur](this.shopTab); },
  refreshSprites() { if (this.el) this.el.querySelectorAll('canvas[data-hero]').forEach(cv => Art.drawHeroCard(cv, cv.dataset.hero, this.t)); },

  back() {
    if (this.modal.classList.contains('on')) { this.closeInfo(); return true; }
    if (['stages', 'shop', 'codex', 'settings', 'trophies'].includes(this.cur)) { this.menu(); return true; }
    if (Game.state === 'playing') { Game.pause(); return true; }
    if (Game.state === 'paused') { Game.resume(); return true; }
    if (Game.state === "revive") { Game.declineRevive(); return true; }
    if (Game.state === 'rare') { Game.skipRare(); return true; }
    if (Game.state === 'levelup' || Game.state === 'chest' || Game.state === 'dying' || Game.state === 'booster') return true;
    if (this.cur === 'results') { this.menu(); return true; }
    return false;                                 // в главном меню — выход из приложения
  },

  hud(on) {
    this.pauseBtn.classList.toggle("hidden", !on); this.dashBtn.classList.toggle("hidden", !on);
    if (on) { this.hide(); const D = HERO_DASH[Save.data.hero]; this.dashBtn.querySelector(".di").textContent = D.icon; this.dashBtn.title = D.name; this.dashK = -1; }
  },
  // Перезарядка кнопки прыжка: тёмный сектор-«часы» и секунды до готовности
  updateDashBtn(p) {
    const D = HERO_DASH[p.hero], k = p.dash ? 1 : Math.min(1, p.dashCd / D.cd), kr = Math.round(k * 60) / 60;
    const txt = p.dashCd > 0 && !p.dash ? String(Math.ceil(p.dashCd)) : '', ready = !p.dash && p.dashCd <= 0;
    const key = kr + '|' + txt + '|' + ready;              // раньше ключом была только доля круга — на последних 0.1 с «1» залипала
    if (key === this.dashK) return;
    this.dashK = key;
    this.dashBtn.style.setProperty("--cd", ready ? 0 : Math.max(kr, 0.02));
    this.dashBtn.classList.toggle("ready", ready);
    this.dashBtn.querySelector(".dcd").textContent = txt;
  },

  banner(text, cls) {
    const b = this.bannerEl;
    const m = /^\s*<img[^>]*src="([^"]+)"[^>]*>\s*/.exec(text || '');
    b.textContent = m ? text.slice(m[0].length) : text;
    if (m) { const im = document.createElement('img'); im.className = 'bn-ic'; im.src = m[1]; im.alt = ''; b.prepend(im); }
    b.className = 'show ' + (cls || '');
    clearTimeout(this.bT); this.bT = setTimeout(() => { b.className = ''; }, 2200);
  },

  toast(text) { this.banner(text, 'toast'); },

  action(a, ds, el) {
    const d = Save.data;
    switch (a) {
      case 'menu': this.menu(); break;
      case 'play': this.stages(); break;
      case 'stage': Game.start(+ds.i); break;
      case 'endless': Game.start('endless'); break;
      case 'shop': this.shop(ds.tab || this.shopTab || 'heroes'); break;
      case 'codex': this.codex(); break;
      case "trophies": this.trophies(); break;
      case 'settings': this.settings(); break;
      case 'buyhero': {
        const h = HEROES[ds.id];
        if (d.coins < h.price) { this.toast(t('Не хватает монет')); break; }
        d.coins -= h.price; d.heroes.push(ds.id); d.hero = ds.id;
        if (!d.skills.includes(h.start)) d.skills.push(h.start);
        Save.save(); Sfx.coin(); Haptic.note('success'); this.shop('heroes'); break;
      }
      case 'selhero': d.hero = ds.id; Save.save(); this.shop('heroes'); break;
      case 'buyskill': {
        const price = WEAPONS[ds.id] ? SKILL_PRICE.weapon : SKILL_PRICE.passive;
        if (d.coins < price) { this.toast(t('Не хватает монет')); break; }
        d.coins -= price; d.skills.push(ds.id); Save.save(); Sfx.coin(); Haptic.note('success'); this.shop('skills'); break;
      }
      case 'buyup': {
        const lv = d.upgrades[ds.id] || 0, cost = upgradeCost(ds.id, lv);
        if (lv >= UPGRADES[ds.id].max) break;
        if (d.coins < cost) { this.toast(t('Не хватает монет')); break; }
        d.coins -= cost; d.upgrades[ds.id] = lv + 1; Save.save(); Sfx.coin(); Haptic.note('success'); this.shop('upgrades'); break;
      }
      case 'refund': {
        let sum = 0;
        for (const id in d.upgrades) for (let l = 0; l < d.upgrades[id]; l++) sum += upgradeCost(id, l);
        d.coins += sum; d.upgrades = {}; Save.save(); this.shop('upgrades'); this.toast(t('Возвращено 🪙 {0}', sum)); break;
      }
      case 'toggle': d.settings[ds.k] = !d.settings[ds.k]; Save.save(); Music.setVolume(); if (ds.k === 'saver') Game.resize();   // экономия заряда меняет плотность пикселей
        if (Game.state === 'paused') { el.querySelector('.sw').classList.toggle('on', !!d.settings[ds.k]); } else this.settings(); break;
      case 'credits': this.credits(); break;
      case 'lang': {                                   // язык: данные переводятся при загрузке, поэтому перезапускаем страницу
        const ks = Object.keys(LANGS);
        d.settings.lang = ks[(ks.indexOf(LANG) + 1) % ks.length]; Save.save(); location.reload(); break;
      }
      case 'reset':
        if (confirm(t('Стереть весь прогресс? Это нельзя отменить.'))) { localStorage.removeItem(Save.KEY); Save.data = Save.defaults(); Save.data.settings.lang = LANG; Save.save(); this.menu(); }
        break;
      case 'info': this.info(ds.id); break;
      case 'skilltoggle': this.toggleSkill(ds.id); break;
      case 'buyrare': Game.buyRare(); break;
      case 'skiprare': Game.skipRare(); break;
      case "booster": this.choose(el, () => Game.pickBooster(ds.id)); break;
      case "pick": if (this.spinning) this.skipSpin(); else this.choose(el, () => Game.pick(+ds.i)); break;
      case "chestpick": if (this.spinning) this.skipSpin(); else this.choose(el, () => Game.pickChest(+ds.i)); break;
      case 'spinskip': if (this.spinning) this.skipSpin(); break;
      case 'reroll': Game.reroll(); break;
      case 'chestok': Game.resume(); break;
      case 'resume': Game.resume(); break;
      case 'quit': this.closeInfo(); Game.end(false, true); break;
      case "askquit": this.confirmQuit(); break;
      case "revive": Game.buyRevive(); break;
      case "norevive": Game.declineRevive(); break;
      case "closeinfo": this.closeInfo(); break;
      case 'again': Game.start(Game.endless ? 'endless' : Game.stageIdx); break;
    }
  },

  // ---------- Главное меню ----------
  menu() {
    Game.state = 'menu'; Game.player = null;
    Music.setDuck(1); Music.play('menu');
    this.hud(false);
    const d = Save.data, h = HEROES[d.hero];
    this.show(`<div class="screen menu">
      <div class="topbar"><div class="pill gold">🪙 <b>${d.coins}</b></div><button class="pill trophy" data-a="trophies">🏆 ${d.cleared.length}/${STAGES.length} <svg class="chev" viewBox="0 0 24 24" width="13" height="13"><path d="M8.6 3.6a1.6 1.6 0 0 1 2.3 0l7.3 7.3a1.6 1.6 0 0 1 0 2.2l-7.3 7.3a1.6 1.6 0 0 1-2.3-2.3L14.8 12 8.6 5.9a1.6 1.6 0 0 1 0-2.3z" fill="#fff"/></svg></button></div>
      <div class="logo"><div class="l1">ENDLESS</div><div class="l2">WAR</div></div>
      <div class="hero"><div class="hero-glow" style="--c:${h.color}"></div><canvas class="spr big" width="300" height="400" data-hero="${d.hero}"></canvas></div>
      <div class="hero-name">${h.name}</div>
      <div class="hero-pass">${h.passive}</div>
      <div class="hero-pass dash">${HERO_DASH[d.hero].icon} ${HERO_DASH[d.hero].name}: ${HERO_DASH[d.hero].desc}</div>
      <div class="grow"></div>
      <button class="btn primary big" data-a="play">${t('▶ ИГРАТЬ')}</button>
      <div class="row3">
        <button class="btn tile" data-a="shop">🛒<span>${t('Магазин')}</span></button>
        <button class="btn tile" data-a="codex">📜<span>${t('Коллекция')}</span></button>
        <button class="btn tile" data-a="settings">⚙️<span>${t('Настройки')}</span></button>
      </div>
    </div>`, 'menu');
  },

  hdr(title, right) { return `<div class="hdr"><button class="back" data-a="menu" aria-label="${t('Назад')}"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M10.6 4.2a1.3 1.3 0 0 1 2.2.9V9h6.9a1.8 1.8 0 0 1 1.8 1.8v2.4a1.8 1.8 0 0 1-1.8 1.8h-6.9v3.9a1.3 1.3 0 0 1-2.2.9L3.4 12.9a1.3 1.3 0 0 1 0-1.8z" fill="#fff"/></svg></button><h2>${title}</h2>${right || ''}</div>`; },
  coinsPill() { return `<div class="pill gold">🪙 <b>${Save.data.coins}</b></div>`; },
  skillName(id) { const s = WEAPONS[id] || PASSIVES[id]; return s ? s.icon + ' ' + s.name : id; },

  // ---------- Выбор уровня ----------
  stages() {
    const d = Save.data;
    let h = '';
    STAGES.forEach((s, i) => {
      const open = i === 0 || d.cleared.includes(STAGES[i - 1].id), done = d.cleared.includes(s.id);
      const unl = s.unlocks.filter(id => !d.skills.includes(id)).map(id => this.skillName(id)).join(', ');
      h += `<div class="card stage ${open ? '' : 'locked'} ${done ? 'done' : ''}" ${open ? `data-a="stage" data-i="${i}"` : ''}>
        <div class="st-ic">${open ? s.icon : '🔒'}</div>
        <div class="st-body"><div class="st-name">${i + 1}. ${s.name}${done ? ' <span class="ok">✓</span>' : ''}</div>
        <div class="st-desc">${open ? s.desc : t('Пройди предыдущий уровень')}</div>
        <div class="st-meta">⏱ ${fmtTime(s.duration)} · 🪙 +${s.reward}${unl ? t(' · открывает: ') + unl : ''}</div></div></div>`;
    });
    const eo = d.cleared.includes('forest');
    h += `<div class="card stage endless ${eo ? '' : 'locked'}" ${eo ? 'data-a="endless"' : ''}>
      <div class="st-ic">${eo ? ENDLESS.icon : '🔒'}</div>
      <div class="st-body"><div class="st-name">${ENDLESS.name}</div>
      <div class="st-desc">${eo ? ENDLESS.desc : t('Откроется после 1-го уровня')}</div>
      <div class="st-meta">${t('🏅 Рекорд: {0}', fmtTime(d.best.time))} · 💀 ${d.best.kills}</div></div></div>`;
    this.show(`<div class="screen">${this.hdr(t('Выбор уровня'))}${h}</div>`, 'stages');
  },

  // ---------- Магазин ----------
  shop(tab) {
    this.shopTab = tab;
    const d = Save.data;
    const tabs = [['heroes', '🧙 Герои'], ['skills', '✨ Навыки'], ['upgrades', '⬆️ Усиления']]
      .map(([k, n]) => `<button class="tab ${k === tab ? 'on' : ''}" data-a="shop" data-tab="${k}">${t(n)}</button>`).join('');
    let body = '';
    if (tab === 'heroes') {
      body = Object.entries(HEROES).map(([id, h]) => {
        const own = d.heroes.includes(id), sel = d.hero === id, sw = WEAPONS[h.start];
        const btn = sel ? `<button class="btn sm" disabled>${t('✓ Выбран')}</button>`
          : own ? `<button class="btn sm primary" data-a="selhero" data-id="${id}">${t('Выбрать')}</button>`
            : `<button class="btn sm gold ${d.coins < h.price ? 'dis' : ''}" data-a="buyhero" data-id="${id}">🪙 ${h.price}</button>`;
        return `<div class="card hero-card ${sel ? 'sel' : ''}" style="--c:${h.color}">
          <canvas class="spr" width="192" height="192" data-hero="${id}"></canvas>
          <div class="hc-body"><div class="hc-name">${h.name}</div><div class="hc-pass">${h.passive}</div><div class="hc-start">${t('Старт: ')}${sw.icon} ${sw.name}</div><div class="hc-dash">${HERO_DASH[id].icon} <b>${HERO_DASH[id].name}</b> — ${HERO_DASH[id].desc} (${t('{0} с', HERO_DASH[id].cd)})</div></div>
          ${btn}</div>`;
      }).join('');
    } else if (tab === 'skills') {
      const item = (id, s, price) => {
        const own = d.skills.includes(id);
        const st = STAGES.find(x => x.unlocks.includes(id));
        return `<div class="card skill ${own ? 'own' : ''}" data-a="info" data-id="${id}"><div class="sk-ic">${s.icon}</div>
          <div class="sk-body"><div class="sk-name">${s.name}</div><div class="sk-desc">${s.desc}</div>
          ${!own && st ? `<div class="sk-hint">${t('или пройди «{0}»', st.name)}</div>` : ''}</div>
          ${own ? '<div class="sk-own">✓</div>' : `<button class="btn sm gold ${d.coins < price ? 'dis' : ''}" data-a="buyskill" data-id="${id}">🪙 ${price}</button>`}</div>`;
      };
      body = '<div class="sec">' + t('Оружие') + '</div>' + Object.entries(WEAPONS).map(([id, s]) => item(id, s, SKILL_PRICE.weapon)).join('')
        + '<div class="sec">' + t('Предметы') + '</div>' + Object.entries(PASSIVES).map(([id, s]) => item(id, s, SKILL_PRICE.passive)).join('');
    } else {
      body = Object.entries(UPGRADES).map(([id, u]) => {
        const lv = d.upgrades[id] || 0, max = lv >= u.max, cost = upgradeCost(id, lv);
        const pips = Array.from({ length: u.max }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('');
        return `<div class="card skill"><div class="sk-ic">${u.icon}</div>
          <div class="sk-body"><div class="sk-name">${u.name}</div><div class="sk-desc">${u.desc}</div><div class="pips">${pips}</div></div>
          ${max ? '<div class="sk-own">MAX</div>' : `<button class="btn sm gold ${d.coins < cost ? 'dis' : ''}" data-a="buyup" data-id="${id}">🪙 ${cost}</button>`}</div>`;
      }).join('') + '<button class="btn sm ghost" data-a="refund">' + t('↺ Сбросить усиления (вернуть монеты)') + '</button>';
    }
    this.show(`<div class="screen">${this.hdr(t('Магазин'), this.coinsPill())}<div class="tabs">${tabs}</div>${body}</div>`, 'shop');
  },

  // ---------- Трофеи: побеждённые боссы и рекорды ----------
  trophies() {
    const d = Save.data, n = d.cleared.length;
    const bossImg = B => { const m = typeof ART_META_BOSSES !== 'undefined' && ART_META_BOSSES[B.art]; return B.art ? 'art/bosses/' + B.art + (m && !m.single ? '_big' : '') + '.png' : ''; };
    const cards = STAGES.map((s, i) => {
      const done = d.cleared.includes(s.id), open = i === 0 || d.cleared.includes(STAGES[i - 1].id);
      return `<div class="card trophy-card ${done ? 'done' : ''} ${open ? '' : 'locked'}">
        <div class="tr-boss">${open ? `<img src="${bossImg(s.boss)}" alt="">` : '<span>❔</span>'}${done ? '<i>🏆</i>' : ''}</div>
        <div class="tr-body"><div class="tr-name">${open ? s.boss.name : '???'}</div>
        <div class="tr-stage">${i + 1}. ${s.icon} ${s.name}</div>
        <div class="tr-state">${done ? t('✅ Повержен · награда 🪙 {0} получена', s.reward) : open ? t('⚔️ Ещё не побеждён') : '🔒 ' + t('Пройди предыдущий уровень')}</div></div></div>`;
    }).join('');
    this.show(`<div class="screen">${this.hdr(t('Трофеи'))}
      <div class="stats-row"><div>${t('Боссов повержено')} <b>${n}/${STAGES.length}</b></div><div>${t('♾️ Рекорд')} <b>${fmtTime(d.best.time)}</b></div><div>${t('💀 В рекорде')} <b>${d.best.kills}</b></div></div>
      <div class="tr-bar"><i style="width:${Math.round(n / STAGES.length * 100)}%"></i></div>
      ${cards}</div>`, 'trophies');
  },

  // ---------- Коллекция ----------
  codex() {
    const d = Save.data;
    const all = [...Object.keys(WEAPONS), ...Object.keys(PASSIVES)];
    const nOpen = all.filter(id => d.skills.includes(id)).length, nEvo = Object.keys(EVOLUTIONS).filter(id => d.evos.includes(id)).length;
    const off = new Set(d.off || []);
    const cell = (id, s) => {
      const o = d.skills.includes(id), on = o && !off.has(id);
      const tg = o ? `<b class="cx-tg ${on ? 'on' : ''}" data-a="skilltoggle" data-id="${id}">${on ? '✓' : ''}</b>` : '';
      return `<div class="cx ${o ? '' : 'locked'} ${o && !on ? 'off' : ''}" data-a="info" data-id="${id}">${tg}<div class="cx-ic">${s.icon}${o ? '' : '<i class="lk">🔒</i>'}</div><div class="cx-n">${s.name}</div></div>`;
    };
    const inRun = ids => ids.filter(id => d.skills.includes(id) && !off.has(id)).length + '/' + ids.filter(id => d.skills.includes(id)).length;
    const evos = Object.entries(EVOLUTIONS).map(([id, e]) => {
      const o = d.evos.includes(id), a = WEAPONS[e.from], b = e.union ? WEAPONS[e.with] : PASSIVES[e.with];
      return `<div class="card evo ${o ? '' : 'locked'}" data-a="info" data-id="${id}"><div class="rec">${a.icon}<small>${maxLv(e.from)}</small> + ${b.icon}<small>${maxLv(e.with)}</small> → <b>${o ? e.icon : '❔'}</b></div>
        <div class="ev-body"><div class="ev-name">${o ? e.name : '???'}${e.union ? ' <span class="tag u">' + t('СОЮЗ') + '</span>' : ''}</div><div class="ev-desc">${o ? e.desc : a.name + ' + ' + b.name}</div></div></div>`;
    }).join('');
    this.show(`<div class="screen">${this.hdr(t('Коллекция'))}
      <div class="stats-row"><div>${t('✨ Навыки')} <b>${nOpen}/${all.length}</b></div><div>${t('⚗️ Эволюции')} <b>${nEvo}/${Object.keys(EVOLUTIONS).length}</b></div></div>
      <div class="cx-hint">${t('Галочка ✓ — навык будет попадаться в забеге. Сними её, чтобы убрать навык из выбора при повышении уровня.')}</div>
      <div class="sec">${t('Оружие')} <span class="sec-n">${t('в забеге {0}', inRun(Object.keys(WEAPONS)))}</span></div><div class="cx-grid">${Object.entries(WEAPONS).map(([id, s]) => cell(id, s)).join('')}</div>
      <div class="sec">${t('Предметы')} <span class="sec-n">${t('в забеге {0}', inRun(Object.keys(PASSIVES)))}</span></div><div class="cx-grid">${Object.entries(PASSIVES).map(([id, s]) => cell(id, s)).join('')}</div>
      <div class="sec">${t('Эволюции и союзы')}</div>${evos}
      <div class="sec">${t('Бустеры (редкие сундуки, 🟢 {0})', RARE_CHEST_COST)}</div>
      ${Object.values(BOOSTERS).map(b => `<div class="card skill"><div class="sk-ic">${b.icon}</div><div class="sk-body"><div class="sk-name">${b.name}</div><div class="sk-desc">${b.desc}</div></div></div>`).join('')}
      <div class="sec">${t('Статистика')}</div>
      <div class="stats-row"><div>${t('Забегов')} <b>${d.stats.runs}</b></div><div>${t('Убито')} <b>${d.stats.kills}</b></div><div>${t('Монет')} <b>${d.stats.coins}</b></div></div>
    </div>`, 'codex');
  },

  // ---------- Настройки ----------
  settings() {
    const s = Save.data.settings;
    const row = (k, n) => this.setRow(k, n);
    this.show(`<div class="screen">${this.hdr(t('Настройки'))}
      <div class="card set" data-a="lang"><span class="set-l">${this.setIc('lang')}${t('Язык')}</span><span class="lang-v">${LANGS[LANG]}</span></div>
      ${row('sound', 'Звук')}${row('music', 'Музыка')}${row('haptics', 'Вибрация')}${row('numbers', 'Цифры урона')}${row('saver', 'Экономия заряда')}
      <div class="grow"></div>
      <button class="btn ghost" data-a="credits">${t('👥 Авторы')}</button>
      <button class="btn danger" data-a="reset">${t('🗑 Сбросить прогресс')}</button>
      <div class="ver">Endless War · v${typeof GAME_VERSION !== 'undefined' ? GAME_VERSION : '?'} · ${t('обновлено')} ${typeof GAME_UPDATED !== 'undefined' ? GAME_UPDATED : '?'}</div></div>`, 'settings');
  },

  // Значки настроек: цветная плитка с белым рисунком (вместо эмодзи — те на телефонах выглядят тускло и по-разному)
  SET_ICONS: {
    lang: ['#2f6bff', '#5ad8ff', '<circle cx="12" cy="12" r="8.5" fill="none" stroke="#fff" stroke-width="2"/><path d="M3.5 12h17M12 3.5c3.2 3.4 3.2 13.6 0 17M12 3.5c-3.2 3.4-3.2 13.6 0 17" fill="none" stroke="#fff" stroke-width="1.7"/>'],
    sound: ['#ff6a2a', '#ffc24a', '<path d="M3 9.2h3.8L12 5v14l-5.2-4.2H3z"/><path d="M15.2 8.6a4.8 4.8 0 0 1 0 6.8M17.8 6a8.4 8.4 0 0 1 0 12" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>'],
    music: ['#b03aff', '#ff6ad2', '<path d="M19.5 3.5v11.8a2.9 2.9 0 1 1-2-2.75V7.6l-7.5 1.6v8.1a2.9 2.9 0 1 1-2-2.75V6.1z"/>'],
    haptics: ['#16b86a', '#6affb4', '<rect x="8" y="3" width="8" height="18" rx="2.2"/><rect x="9.6" y="5.2" width="4.8" height="11" rx=".8" fill="rgba(0,0,0,.28)"/><path d="M4.6 8.5v7M19.4 8.5v7M2 10.5v3M22 10.5v3" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>'],
    saver: ['#e0a800', '#ffe14a', '<rect x="3" y="7" width="16" height="10" rx="2.2" fill="none" stroke="#fff" stroke-width="2"/><rect x="19.6" y="10" width="2" height="4" rx=".8"/><path d="M12.4 8.6 8.6 12.6h2.8l-1 3.2 3.9-4.1h-2.8z"/>'],
    numbers: ['#e8263a', '#ff8a5a', '<text x="12" y="16.6" text-anchor="middle" font-size="11.5" font-family="Russo One, sans-serif" fill="#fff">123</text>'],
  },
  setIc(k) { const [a, b, g] = this.SET_ICONS[k]; return `<i class="set-ic" style="--a:${a};--b:${b}"><svg viewBox="0 0 24 24" fill="#fff">${g}</svg></i>`; },
  setRow(k, n) { return `<div class="card set" data-a="toggle" data-k="${k}"><span class="set-l">${this.setIc(k)}${t(n)}</span><span class="sw ${Save.data.settings[k] ? 'on' : ''}"><i></i></span></div>`; },

  // Авторы: лицензии чужого арта (CC-BY-SA требует указать авторов, лицензию и что арт изменён)
  credits() {
    const flareArt = ['Blarumyrran', 'Brandon Morris "Augmentality"', 'Clint Bellanger', 'Holly Daniel', 'Justin Jacobs', 'Justin Nichol', 'Jessica "Zeldyn" Cox',
      'remaxim', 'rubberduck', 'Sarah Benalene', 'Scrittl', 'Stefan Beller'];
    const flareMore = ['Aare', 'Bart K', 'Blender Foundation', 'Cori Samuel', 'D. Sharon Pruitt', 'Hythlodaeus', 'Iwan "qubodup" Gabovitch', 'Lamoot', 'Lattice',
      'Ljudbank', 'Lorc', 'MaximB', 'Michael Baradari', 'Mike Koenig', 'Mikodrak', 'Misha', 'Mumu', 'Naraphim', 'p0ss', 'Renderwahn', 'Samuel Moxham', 'Sindwiller',
      'Spookymodem', 'Stephan', 'TiZiana', 'Vwolfdog', 'Yughues', 'Zuendholz'];
    this.modal.innerHTML = `<div class="sheet"><button class="x" data-a="closeinfo">✕</button>
      <div class="sh-top"><div class="sh-ic">👥</div><div><div class="sh-name">${t('Авторы')}</div><div class="sh-kind">Endless War</div></div></div>
      <div class="sh-sec">${t('Герои, монстры, боссы, мир и эффекты')}</div>
      <div class="sh-desc">${t('Графика из игры <b>FLARE</b> (flareteam/flare-game, flarerpg.org). Лицензия <b>CC-BY-SA 3.0</b> (creativecommons.org/licenses/by-sa/3.0). Спрайты изменены: вырезаны кадры, масштаб, перекраска, сборка героев из слоёв; изменённые спрайты распространяются под той же лицензией.')}</div>
      <div class="sh-sec">${t('Художники FLARE')}</div><div class="sh-desc">${flareArt.join(', ')}</div>
      <div class="sh-sec">${t('Дополнительный арт FLARE')}</div><div class="sh-desc">${flareMore.join(', ')}</div>
      <div class="sh-sec">${t('Эффекты заклинаний')}</div><div class="sh-desc">${t('Viktor Hahn — «Spell animation spritesheets», лицензия <b>CC-BY 4.0</b> (creativecommons.org/licenses/by/4.0), кадры уменьшены и прорежены. Mikodrak — «2D Spell Effects» (CC0). rubberduck — «Sparkling Fireball Effect» (CC0).')}</div>
      <div class="sh-sec">${t('Телепорт, удары, кровь, листья')}</div><div class="sh-desc">${t('rubberduck — «Teleporter effect» (CC0). Sinestesia — эффекты ударов и крови (CC0). bart — «Leaf spell», лицензия <b>CC-BY 3.0</b> (creativecommons.org/licenses/by/3.0), кадры уменьшены и прорежены. Всё — opengameart.org.')}</div>
      <div class="sh-sec">${t('Мечи, щиты, оберег, дрон')}</div><div class="sh-desc">${t('Wenrexa — «Sprites Weapon: Swords» (CC0). Cethiel — «Angel Shield Effect» (CC0). The Higalina Vault — «Fantasy Shield Icons» (higalina.itch.io). engvee и Maksim Bugrimov — «FREE Isometric Animated Drone» (engvee.itch.io).')}</div>
      <div class="sh-sec">${t('Иконки, эффекты оружия, интерфейс')}</div><div class="sh-desc">${t('Оригинальный арт Endless War.')}</div></div>`;
    this.modal.classList.add('on');
  },

  // ---------- Описание навыка / предмета / эволюции (по тапу) ----------
  // Коллекция: включить/выключить навык для следующих забегов
  toggleSkill(id) {
    const d = Save.data, off = d.off || (d.off = []), i = off.indexOf(id);
    if (i >= 0) off.splice(i, 1);
    else {
      const isW = !!WEAPONS[id], pool = Object.keys(isW ? WEAPONS : PASSIVES).filter(k => d.skills.includes(k) && !off.includes(k)), min = isW ? MAX_WEAPONS : MAX_PASSIVES;
      if (pool.length <= min) { this.toast(t(isW ? 'Нужно оставить хотя бы {0} оружия' : 'Нужно оставить хотя бы {0} предметов', min)); Haptic.note('error'); return; }
      off.push(id);
    }
    Save.save();
    const y = this.el.scrollTop;
    this.codex(); this.el.scrollTop = y;   // остаёмся на том же месте списка
    if (this.modal.classList.contains('on')) this.info(id);
  },
  info(id) {
    const d = Save.data, W = WEAPONS[id], P = PASSIVES[id], E = EVOLUTIONS[id];
    const nm = x => x.icon + ' ' + x.name;
    let head, body = '';
    const unlockInfo = () => {
      if (d.skills.includes(id)) return '';
      const ways = [t('купить в магазине (вкладка «Навыки») за 🪙 {0}', W ? SKILL_PRICE.weapon : SKILL_PRICE.passive)];
      const st = STAGES.find(s => s.unlocks.includes(id)); if (st) ways.push(t('пройти уровень «{0}»', st.name));
      const hr = Object.values(HEROES).find(h => h.start === id); if (hr) ways.push(t('купить героя «{0}» — он начинает с этим оружием', hr.name));
      return `<div class="sh-box lock">🔒 ${t('<b>Закрыто.</b> Как открыть: {0}.', ways.join(t(', или ')))}</div>`;
    };
    const evoLine = e => { const eid = Object.keys(EVOLUTIONS).find(k => EVOLUTIONS[k] === e), seen = d.evos.includes(eid); return seen ? nm(e) : '❔ ???'; };
    if (W) {
      head = { icon: W.icon, name: W.name, kind: t('Оружие · до {0} уровня', W.ups.length + 1) };
      body += `<div class="sh-desc">${W.desc}</div>` + unlockInfo();
      body += '<div class="sh-sec">' + t('Прокачка') + '</div>' + W.ups.map((u, i) => `<div class="sh-lv"><b>${t('Ур. {0}', i + 2)}</b>${u.d}</div>`).join('');
      const evos = Object.values(EVOLUTIONS).filter(e => e.from === id || (e.union && e.with === id));
      if (evos.length) body += '<div class="sh-sec">' + t('Эволюции') + '</div>' + evos.map(e => {
        const other = e.from === id ? (e.union ? WEAPONS[e.with] : PASSIVES[e.with]) : WEAPONS[e.from];
        const ow = e.from === id ? e.with : e.from;
        return `<div class="sh-box evo">${W.icon} ${t('{0} ур.', maxLv(id))} + ${nm(other)} ${t('{0} ур.', maxLv(ow))} → <b>${evoLine(e)}</b>${e.union ? ' <span class="tag u">' + t('СОЮЗ') + '</span>' : ''}</div>`;
      }).join('');
    } else if (P) {
      head = { icon: P.icon, name: P.name, kind: t('Предмет (пассивный) · до {0} уровня', P.max) };
      body += (P.levels ? `<div class="sh-desc">${P.desc}.</div>` : `<div class="sh-desc">${t('{0} за каждый уровень.', P.desc)}</div>`) + unlockInfo();
      if (P.levels) body += '<div class="sh-sec">' + t('Прокачка') + '</div>' + P.levels.map((lv, i) => `<div class="sh-lv"><b>${t('Ур. {0}', i + 1)}</b>${lv}</div>`).join("");
      const evos = Object.values(EVOLUTIONS).filter(e => !e.union && e.with === id);
      if (evos.length) body += '<div class="sh-sec">' + t('Нужен для эволюции') + '</div>' + evos.map(e =>
        `<div class="sh-box evo">${nm(WEAPONS[e.from])} ${t('{0} ур.', maxLv(e.from))} + ${P.icon} ${t('{0} ур.', maxLv(id))} → <b>${evoLine(e)}</b></div>`).join('');
    } else if (E) {
      const seen = d.evos.includes(id), a = WEAPONS[E.from], b = E.union ? WEAPONS[E.with] : PASSIVES[E.with];
      head = { icon: seen ? E.icon : '❔', name: seen ? E.name : '???', kind: t(E.union ? 'Союз двух оружий' : 'Эволюция оружия') };
      body += `<div class="sh-desc">${seen ? E.desc : t('Ещё не открыта. Собери рецепт в забеге — и узнаешь, что это.')}</div>`;
      body += `<div class="sh-sec">${t('Рецепт')}</div><div class="sh-box evo">${nm(a)} — ${t('{0} ур.', maxLv(E.from))}<br>+ ${nm(b)} — ${t('{0} ур.', maxLv(E.with))}${E.union ? '' : t(' (вливается в эволюцию, слот освобождается)')}</div>
        <div class="sh-box">${t('Когда рецепт собран, эволюция появится среди вариантов при повышении уровня или выпадет из сундука элитного врага.')}</div>`;
    } else return;
    if ((W || P) && d.skills.includes(id)) {
      const on = !(d.off || []).includes(id);
      body += `<button class="btn ${on ? 'ghost' : 'primary'} sh-tg" data-a="skilltoggle" data-id="${id}">${t(on ? '✓ Попадается в забеге — убрать' : '✕ Убран из забегов — вернуть')}</button>`;
    }
    this.modal.innerHTML = `<div class="sheet"><button class="x" data-a="closeinfo">✕</button>
      <div class="sh-top"><div class="sh-ic">${head.icon}</div><div><div class="sh-name">${head.name}</div><div class="sh-kind">${head.kind}</div></div></div>${body}</div>`;
    this.modal.classList.add('on');
  },
  // Подтверждение «Сдаться» — отдельное окно поверх паузы
  confirmQuit() {
    this.modal.innerHTML = `<div class="sheet confirm"><div class="cf-ic">🏳</div><div class="sh-name">${t('Точно сдаться?')}</div>
      <div class="sh-desc">${t('Забег закончится. Собранные монеты (🪙 {0}) сохранятся, прогресс уровня — нет.', Game.coins)}</div>
      <button class="btn danger" data-a="quit">${t('Да, сдаться')}</button><button class="btn" data-a="closeinfo">${t('Отмена')}</button></div>`;
    this.modal.classList.add('on', 'center');
  },
  closeInfo() { this.modal.classList.remove("on", "center"); this.modal.innerHTML = ''; },

  // ---------- Воскрешение за золото (один раз за забег, 10 секунд на решение) ----------
  reviveOffer(price, have) {
    this.pauseBtn.classList.add('hidden'); this.dashBtn.classList.add('hidden');
    const can = have >= price, T = 10;
    this.show(`<div class="overlay revive"><div class="ov-title">${t('ВЫ ПАЛИ')}</div>
      <div class="rv-hero"><canvas class="spr" width="192" height="192" data-hero="${Save.data.hero}"></canvas>
        <svg class="rv-ring" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46"/><circle class="rv-left" cx="50" cy="50" r="46"/></svg>
        <div class="rv-sec" id="rvSec">${T}</div></div>
      <div class="ov-sub">${t('Вернуться в бой с половиной здоровья? Можно только один раз за забег.')}</div>
      <div class="rare-bal">${t('У тебя: ')}<b style="color:var(--gold)">🪙 ${have}</b></div>
      <button class="btn gold big ${can ? '' : 'dis'}" data-a="revive">${t('✨ Воскреснуть за 🪙 {0}', price)}</button>
      ${can ? '' : `<div class="ov-sub">${t('Не хватает 🪙 {0}', price - have)}</div>`}
      <button class="btn ghost" data-a="norevive">${t('Сдаться')}</button></div>`, 'revive');
    const t0 = performance.now(), ring = this.el.querySelector('.rv-left'), sec = document.getElementById('rvSec');
    clearInterval(this.reviveT);
    this.reviveT = setInterval(() => {
      if (Game.state !== 'revive') { clearInterval(this.reviveT); return; }
      const left = Math.max(0, T - (performance.now() - t0) / 1000);
      if (ring) ring.style.strokeDashoffset = (289 * (1 - left / T)).toFixed(1);
      if (sec) sec.textContent = Math.ceil(left);
      if (left <= 0) { clearInterval(this.reviveT); Game.declineRevive(); }
    }, 100);
  },

  // ---------- Редкий сундук и выбор бустера ----------
  rarePrompt(cost, bal) {
    this.pauseBtn.classList.add('hidden');
    const can = bal >= cost;
    this.show(`<div class="overlay rare"><div class="chest-ic rare-ic">🎁</div><div class="ov-title">${t('РЕДКИЙ СУНДУК')}</div>
      <div class="ov-sub">${t('Внутри — бустер на выбор из трёх: магнит на всю карту, суперскорость, двойная перезарядка и другие.')}</div>
      <div class="rare-bal">${t('У тебя: ')}<b>🟢 ${bal}</b></div>
      <button class="btn green ${can ? '' : 'dis'}" data-a="buyrare">${t('Открыть за 🟢 {0}', cost)}</button>
      ${can ? '' : '<div class="ov-sub">' + t('Зелёные монеты редко падают с врагов, чаще — с элиты и боссов и иногда лежат в сундуках. Они действуют только в текущем уровне.') + '</div>'}
      <button class="btn ghost" data-a="skiprare">${t('Не сейчас')}</button></div>`, 'rare');
  },
  boosterPick(ids) {
    const cards = ids.map(id => { const b = BOOSTERS[id]; return `<div class="card lv booster" data-a="booster" data-id="${id}"><div class="lv-ic">${b.icon}</div>
      <div class="lv-body"><div class="lv-top"><span class="lv-name">${b.name}</span><span class="tag">${b.dur ? t('{0} с', b.dur) : t('сразу')}</span></div><div class="lv-desc">${b.desc}</div></div></div>`; }).join('');
    this.show(`<div class="overlay rare"><div class="ov-title">${t('ВЫБЕРИ БУСТЕР')}</div><div class="cards">${cards}</div></div>`, 'booster');
  },

  // ---------- Окна в забеге ----------
  buildIcons() {
    const p = Game.player;
    const w = p.weapons.map(x => `<span data-a="info" data-id="${x.id}">${x.def.icon}<b>${x.evo ? '★' : x.level}</b></span>`).join('') + '<span class="empty"></span>'.repeat(Math.max(0, MAX_WEAPONS - p.weapons.length));
    const ps = p.passives.map(x => `<span data-a="info" data-id="${x.id}">${PASSIVES[x.id].icon}<b>${x.level}</b></span>`).join('') + '<span class="empty"></span>'.repeat(Math.max(0, MAX_PASSIVES - p.passives.length));
    return `<div class="build">${w}</div><div class="build">${ps}</div>`;
  },

  // Повышение уровня: карточки крутятся как рулетка и по очереди останавливаются на выпавших навыках.
  // Тап во время прокрутки — сразу показать результат.
  levelUp(choices) {
    this.pauseBtn.classList.add('hidden');
    const p = Game.player;
    const finals = choices.map(c => {
      const f = Game.choiceInfo(c);
      return `<div class="lv-ic">${f.icon}</div>
        <div class="lv-body"><div class="lv-top"><span class="lv-name">${f.name}</span>${f.tag ? `<span class="tag">${f.tag}</span>` : ''}</div>
        <div class="lv-desc">${f.desc}</div>${f.hint ? `<div class="lv-hint">${f.hint}</div>` : ''}</div>`;
    });
    const cards = choices.map((c, i) => `<div class="card lv spin ${c.kind}" data-a="pick" data-i="${i}"><div class="lv-ic">❔</div>
      <div class="lv-body"><div class="lv-top"><span class="lv-name">???</span></div><div class="lv-desc">${t('Крутится…')}</div></div></div>`).join('');
    this.show(`<div class="overlay" data-a="spinskip"><div class="ov-title">${t('НОВЫЙ УРОВЕНЬ')} <span>${p.level}</span></div>${this.buildIcons()}
      <div class="cards">${cards}</div>
      ${p.rerolls > 0 ? `<button class="btn sm ghost" data-a="reroll">${t('🎲 Перебросить ({0})', p.rerolls)}</button>` : ''}</div>`, 'levelup');

    this.spinReveal([...this.el.querySelectorAll('.card.lv')], finals);
  },

  // Выбранная карточка подсвечивается, остальные гаснут, и только потом окно закрывается
  choose(el, fn) {
    if (this.choosing) return;
    this.choosing = true;
    el.classList.add("chosen");
    el.parentElement.querySelectorAll(".card.lv").forEach(c => { if (c !== el) c.classList.add("faded"); });
    Haptic.imp("medium");
    setTimeout(() => { this.choosing = false; fn(); }, 260);
  },

  // Рулетка: карточки els крутят случайные навыки и по очереди открывают finals[i]
  spinReveal(els, finals, onDone) {
    const pool = [...Object.values(WEAPONS), ...Object.values(PASSIVES), ...Object.values(EVOLUTIONS)].map(s => [s.icon, s.name]);
    // медленная рулетка: 1-я карта крутится ~1.8 с, каждая следующая на 0.7 с дольше;
    // смена картинок постепенно замедляется (как барабан), перед остановкой — редкие щелчки
    const start = performance.now(), stops = els.map((_, i) => 1800 + i * 700), next = els.map(() => 0);
    const reveal = (el, i) => {
      if (el.dataset.done) return;
      el.dataset.done = 1; el.innerHTML = finals[i];
      el.classList.remove('spin'); el.classList.add('reveal');
      if (el.classList.contains('evo')) { Sfx.evo(); Haptic.note('success'); } else { Sfx.reveal(); Haptic.imp('light'); }
    };
    const finish = () => { this.spinning = false; clearInterval(this.spinT); if (onDone) onDone(); };
    this.spinning = true;
    this.skipSpin = () => { els.forEach(reveal); finish(); };
    clearInterval(this.spinT);
    this.spinT = setInterval(() => {
      const t = performance.now() - start;
      let all = true, ticked = false;
      els.forEach((el, i) => {
        if (el.dataset.done) return;
        if (t >= stops[i]) { reveal(el, i); return; }
        all = false;
        if (t < next[i]) return;
        const k = t / stops[i];                      // 0..1 — насколько близко остановка
        next[i] = t + 70 + 330 * k * k;              // интервал растёт от 70 до 400 мс
        el.classList.toggle('slow', k > 0.6);
        const r = pick(pool);
        el.querySelector('.lv-ic').innerHTML = r[0];
        el.querySelector('.lv-name').textContent = r[1];
        ticked = true;
      });
      if (all) finish(); else if (ticked) Sfx.tick();
    }, 30);
  },

  // Сундук: рулетка, затем выбор одной награды из трёх
  chest(infos, choices) {
    this.pauseBtn.classList.add('hidden');
    const finals = infos.map(f => `<div class="lv-ic">${f.icon}</div>
      <div class="lv-body"><div class="lv-top"><span class="lv-name">${f.name}</span>${f.tag ? `<span class="tag">${f.tag}</span>` : ''}</div>
      <div class="lv-desc">${f.desc}</div>${f.hint ? `<div class="lv-hint">${f.hint}</div>` : ''}</div>`);
    const cards = choices.map((c, i) => `<div class="card lv spin ${c.kind}" data-a="chestpick" data-i="${i}"><div class="lv-ic">❔</div>
      <div class="lv-body"><div class="lv-top"><span class="lv-name">???</span></div><div class="lv-desc">${t('Крутится…')}</div></div></div>`).join('');
    this.show(`<div class="overlay" data-a="spinskip"><div class="chest-ic">🎁</div><div class="ov-title">${t('СУНДУК!')}</div>
      <div class="ov-sub">${t('Выбери одну награду')}</div><div class="cards">${cards}</div></div>`, 'chest');
    this.spinReveal([...this.el.querySelectorAll('.card.lv')], finals);
  },

  pause() {
    this.pauseBtn.classList.add('hidden');
    const s = Game.player.stats, pct = v => Math.round(v * 100) + '%';
    // характеристики с иконками предметов, которые их повышают (картинки игры вместо эмодзи)
    const rows = [['heart', 'Здоровье', Math.ceil(Game.player.hp) + ' / ' + s.maxHp], ['power', 'Урон', pct(s.might)], ['tome', 'Перезарядка', pct(s.cooldown)],
      ['candle', 'Область', pct(s.area)], ['boots', 'Скорость', pct(s.speed)], ['armor', 'Броня', Math.round(s.armor * 10) / 10], ['clover', 'Крит', pct(s.crit)], ['regen', 'Реген', t('{0}/с', s.regen.toFixed(1))],
      ['magnet', 'Подбор', pct(s.magnet)], ['crown', 'Опыт', pct(s.growth)], ['greed', 'Монеты', pct(s.greed)], ['fang', 'Вампиризм', pct(s.lifesteal)]]
      .map(([id, a, b]) => `<div><span class="st-l">${PASSIVES[id] && PASSIVES[id].iconSrc ? `<img class="st-ic" src="${PASSIVES[id].iconSrc}" alt="">` : ''}${t(a)}</span><b>${b}</b></div>`).join('');
    this.show(`<div class="overlay"><div class="ov-title">${t('ПАУЗА')}</div>
      <div class="ov-sub">${Game.stage.icon} ${Game.stage.name} · ⏱ ${fmtTime(Game.time)} · 💀 ${Game.kills} · 🪙 ${Game.coins}</div>
      ${this.buildIcons()}<div class="statgrid">${rows}</div>
      <div class="pset">${[['sound', 'Звук'], ['music', 'Музыка'], ['haptics', 'Вибрация'], ['numbers', 'Цифры'], ['saver', 'Экономия заряда']].map(([k, n]) => this.setRow(k, n)).join('')}</div>
      <button class="btn primary" data-a="resume">${t('▶ Продолжить')}</button>
      <button class="btn ghost" data-a="askquit">${t('🏳 Сдаться')}</button></div>`, "pause");
  },

  results(r) {
    const title = t(r.win ? '🏆 ПОБЕДА!' : r.quit ? 'ЗАБЕГ ОКОНЧЕН' : '💀 ВЫ ПАЛИ');
    const unl = r.unlocked.length ? `<div class="sec">${t('Открыты навыки')}</div><div class="build big">${r.unlocked.map(id => `<span>${(WEAPONS[id] || PASSIVES[id]).icon}</span>`).join('')}</div>
      <div class="ov-sub">${r.unlocked.map(id => this.skillName(id)).join(', ')}</div>` : '';
    const evo = r.evos.length ? `<div class="sec">${t('Новые эволюции')}</div><div class="ov-sub">${r.evos.map(id => EVOLUTIONS[id].icon + ' ' + EVOLUTIONS[id].name).join(', ')}</div>` : '';
    this.show(`<div class="overlay results ${r.win ? 'win' : ''}"><div class="ov-title">${title}</div>
      ${r.record ? '<div class="tag rec">' + t('🏅 НОВЫЙ РЕКОРД') + '</div>' : ''}
      <div class="statgrid big"><div><span>${t('⏱ Время')}</span><b>${fmtTime(r.time)}</b></div><div><span>${t('💀 Убито')}</span><b>${r.kills}</b></div>
      <div><span>${t('⭐ Уровень')}</span><b>${r.level}</b></div><div><span>${t('🪙 Собрано')}</span><b>${r.coins}</b></div>
      ${r.reward ? `<div><span>🎁 ${t(r.win ? "Награда" : "Утешение")}</span><b>+${r.reward}</b></div>` : ''}</div>
      <div class="earned">+${r.coins + r.reward} 🪙</div>${unl}${evo}
      <button class="btn primary" data-a="again">${t('↻ Ещё раз')}</button>
      <button class="btn ghost" data-a="menu">${t('В меню')}</button></div>`, 'results');
  },
};
