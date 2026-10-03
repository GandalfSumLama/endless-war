'use strict';
// ===== Игровой движок =====
const CELL = 48, MAXR = 60, MAX_EN = 320, MAX_GEMS = 260;

const Game = {
  state: 'menu', player: null, time: 0, menuT: 0,

  init() {
    this.cv = document.getElementById('game');
    this.ctx = this.cv.getContext('2d');
    this.resize();
    addEventListener('resize', () => this.resize());
    if (document.fonts) document.fonts.addEventListener('loadingdone', () => { this.txtCache = null; this.hudKey = null; this.dirty = true; });   // надписи в кэше — уже нужным шрифтом
    Input.init(this.cv);
    this.last = performance.now();
    requestAnimationFrame(t => this.frame(t));
  },

  resize() {
    const r = this.cv.getBoundingClientRect();
    this.W = r.width || innerWidth; this.H = r.height || innerHeight;
    // плотность пикселей: не больше 2 (на iPhone 3 — это в 2.25 раза больше работы), в режиме экономии заряда — 1.25
    const cap = DBG.has('dpr1') ? 1 : DBG.has('dpr15') ? 1.5 : Save.data && Save.data.settings.saver ? 1.25 : 2;
    this.dpr = Math.min(devicePixelRatio || 1, cap);
    this.cv.width = Math.round(this.W * this.dpr); this.cv.height = Math.round(this.H * this.dpr);
    this.zoom = clamp(this.W / 400, 0.75, 1.6);          // css-пикселей на единицу мира
    this.viewW = this.W / this.zoom; this.viewH = this.H / this.zoom;
    this.farDist = Math.hypot(this.viewW, this.viewH) * 0.8;
    this.dirty = true; this.txtCache = null; this.hudKey = null;
  },

  // Кадр. Ради батареи: не чаще 60 раз в секунду (на экранах 120 Гц — каждый второй кадр), в режиме экономии — 30;
  // в забеге рисуем каждый кадр, фон меню — ~15 раз в секунду, а на паузе, в окнах выбора и на итогах картинка стоит — рисуем один раз
  frame(now) {
    requestAnimationFrame(t => this.frame(t));
    if (now - this.last < (Save.data.settings.saver ? 30 : 13)) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    if (this.state === 'playing') { if (!DBG.has('noupd')) this.update(dt); if (this.player) UI.updateDashBtn(this.player); }   // noupd, nodraw — отладка: замер логики и отрисовки по отдельности
    else if (this.state === 'dying') {            // проигрываем анимацию смерти героя
      this.updateFx(dt); this.cleanup();
      if ((this.dyingT -= dt) <= 0) { this.state = 'playing'; this.end(false); }
    }
    this.menuT += dt;
    const live = this.state === 'playing' || this.state === 'dying', menu = !this.player || this.state === 'menu';
    if (live && DBG.has('nodraw')) return;
    if (!live && (menu ? now - (this.menuDrawn || 0) < 66 : this.drawnState === this.state && !this.dirty)) return;
    this.drawnState = this.state; this.dirty = false; this.menuDrawn = now;
    const d0 = performance.now(); this.draw(); this.perfStat(now, performance.now() - d0);
  },

  // Замер производительности: раз в 5 с в консоль (в APK видно в logcat): кадры/с, среднее и худшее время отрисовки
  perfStat(now, drawMs) {
    const P = this.perf || (this.perf = { t0: now, n: 0, sum: 0, max: 0, slow: 0 });
    P.n++; P.sum += drawMs; P.max = Math.max(P.max, drawMs); if (now - (P.last || now) > 25) P.slow++; P.last = now;
    if (now - P.t0 >= 5000) {
      if (this.state === 'playing') console.log('[perf] fps ' + (P.n * 1000 / (now - P.t0)).toFixed(1) + ' draw ' + (P.sum / P.n).toFixed(1) + 'ms max ' + P.max.toFixed(1) + ' slow ' + P.slow + ' en ' + this.enemies.length + ' fx ' + this.fx.length + ' parts ' + this.parts.length);
      this.perf = { t0: now, n: 0, sum: 0, max: 0, slow: 0 };
    }
  },

  // ---------- Забег ----------
  start(mode) {
    const endless = mode === 'endless';
    this.endless = endless;
    this.stageIdx = endless ? -1 : mode;
    this.bestAtStart = Save.data.best.time; this.recSaveT = 0;   // рекорд до начала забега (для «НОВЫЙ РЕКОРД»)
    Music.setDuck(1); Music.play(endless ? 'endless' : mode);
    this.stage = endless ? ENDLESS : STAGES[mode];
    Object.assign(this, {
      time: 0, kills: 0, coins: 0, enemies: [], projs: [], zones: [], fx: [], parts: [], texts: [], pickups: [], ebullets: [], timed: [],
      explQ: [], webs: [], corpses: [], lava: [], golemNext: [], champion: null, nextChamp: 0, grid: new Map(), nextId: 1, spawnAcc: 0, nextElite: 60, nextRing: 95, nextBoss: endless ? 300 : this.stage.duration,
      boss: null, bossCount: 0, boosts: {}, magnetT: 0, critFxAt: 0, reviveUsed: false, cdBoost: 1, green: 0, rareChest: null, victoryT: -1, shake: 0, healPool: 0, pendingLv: 0, gemCount: 0, hpMul: 1, newEvos: [],
    });
    // бесконечный режим: биомы по очереди в случайном порядке, смена каждые 3 минуты
    this.biomes = endless ? Object.keys(BIOME_NAMES).sort(() => Math.random() - 0.5) : [this.stage.ground];
    this.biomeIdx = 0; this.nextBiomeT = 180; this.biomeFlash = 0;
    this.groundPat = Art.ground(this.ctx, this.biomes[0]);
    this.bright = BRIGHT_GROUNDS.includes(GROUND_ALIAS[this.biomes[0]] || this.biomes[0]);   // светлая земля — снарядам нужна тёмная обводка
    World.init(this.biomes[0]);
    const hid = Save.data.hero;
    Art.need('hero_' + hid); Art.need('boss_' + (endless ? STAGES[0] : this.stage).boss.art);   // догрузка героя и босса уровня
    this.champNext = null; this.pickChampion();
    if (endless) { for (const k in ART) if (k.startsWith('enemy_')) Art.need(k); }   // монстры уровня — заранее (в бесконечном все)
    else { const S = this.stage, ts = new Set([...S.waves.flatMap(w => w.types), ...(STAGE_EXTRA[S.id] || []), ...(STAGE_GOLEMS[S.id] || []).map(g => g.type), 'gnome']);
      for (const t of ts) { const d = ENEMIES[t]; Art.need('enemy_' + (d.skin || (STAGE_SKINS[S.id] || {})[t] || t)); Art.need('enemy_' + t); } }
    const p = this.player = { x: 0, y: 0, r: 12, hp: 1, fx: 1, fy: 0, dirX: 1, moving: false, anim: 0, level: 1, xp: 0, xpNext: this.xpReq(1),
      weapons: [], passives: [], hero: hid, hurtT: 0, evolved: new Set(), stats: null, dash: null, dashCd: 0, invuln: 0, ghosts: [] };
    this.recalc();
    p.hp = p.stats.maxHp; p.rerolls = p.stats.rerolls; p.revives = p.stats.revives;
    this.addWeapon(HEROES[hid].start);
    Input.reset();
    this.state = 'playing';
    UI.hud(true);
  },

  xpReq(l) { return Math.floor((3 + l * 3 + Math.pow(l, 1.33)) * 0.82); },   // опыт до уровня (−18% к прежнему)

  recalc() {
    const p = this.player;
    const s = { maxHp: 120, maxHpMul: 1, armor: 0, speed: 1, might: 1, area: 1, cooldown: 1, projSpeed: 1, duration: 1, amount: 0, magnet: 1,
      crit: 0.05, critDmg: 1.5, regen: 0, growth: 1, greed: 1, lifesteal: 0, choices: 3, rerolls: 0, revives: 0, explode: 0, ward: 0, thorns: 0 };
    const add = (st, m) => { for (const k in st) s[k] += st[k] * m; };
    for (const id in Save.data.upgrades) if (UPGRADES[id]) add(UPGRADES[id].stat, Save.data.upgrades[id]);
    add(HEROES[p.hero].mods, 1);
    for (const ps of p.passives) add(PASSIVES[ps.id].stat, ps.level);
    for (const ps of p.absorbed || []) add(PASSIVES[ps.id].stat, ps.level);   // пассивки, влитые в эволюции, продолжают действовать
    for (const ps of [...p.passives, ...(p.absorbed || [])]) if (ps.id === 'amount') { const l = Math.min(5, ps.level); s.amount += AMOUNT_BY_LEVEL[l]; s.might += AMOUNT_MIGHT[l]; }   // Двойник: снаряды по таблице уровней
    s.cooldown = Math.max(0.35, s.cooldown);
    s.maxHp = Math.round(s.maxHp * s.maxHpMul);
    const old = p.stats; p.stats = s;
    if (old && s.maxHp > old.maxHp) p.hp += s.maxHp - old.maxHp;
    p.hp = Math.min(p.hp, s.maxHp);
    // Оберег: число зарядов и перезарядка от уровня предмета
    const wl = Math.min(PASSIVE_MAX, Math.round(s.ward));
    if (wl !== (p.wardLvl || 0)) {
      const was = WARD_CHARGES[p.wardLvl || 0];
      p.wardMax = WARD_CHARGES[wl]; p.wardCd = WARD_CD[wl];
      p.wardCharges = Math.min(p.wardMax, (p.wardCharges || 0) + Math.max(0, p.wardMax - was));   // новые заряды — сразу готовы
      p.wardT = p.wardCd; p.wardLvl = wl;
    }
    for (const w of p.weapons) this.calcWeapon(w);
  },

  calcWeapon(w) {
    const d = w.def, s = Object.assign({}, d.base);
    if (d.ups) for (let i = 0; i < w.level - 1; i++) { const u = d.ups[i]; for (const k in u) if (k !== 'd') s[k] = (s[k] || 0) + u[k]; }
    const st = this.player.stats;
    s.dmg *= st.might;
    const cb = this.cdBoost || 1;                  // бустер «Перегрузка» ускоряет перезарядку
    if (s.cd) s.cd = Math.max(0.06, s.cd * st.cooldown * cb);
    if (s.tick) s.tick = Math.max(0.1, s.tick * (0.5 + 0.5 * st.cooldown) * cb);
    for (const k of ['radius', 'size', 'width', 'length', 'w', 'h']) if (s[k]) s[k] *= st.area;
    if (s.speed) s.speed *= st.projSpeed;
    for (const k of ['dur', 'life', 'slow', 'freeze']) if (s[k]) s[k] *= st.duration;
    if (s.amount) s.amount += Math.floor(st.amount + 1e-6);   // Двойник и бонусы героев: только целые снаряды
    w.s = s;
  },

  addWeapon(id) {
    const def = WEAPONS[id] || EVOLUTIONS[id];
    const w = { id, def, level: 1, timer: 0.4, uid: this.nextId++, evo: !!EVOLUTIONS[id], max: def.ups ? def.ups.length + 1 : 1 };
    this.player.weapons.push(w);
    this.calcWeapon(w);
    if (WB[def.type].init) WB[def.type].init(this, w);
  },

  evolve(eid) {
    const e = EVOLUTIONS[eid], p = this.player;
    const i = p.weapons.findIndex(w => w.id === e.from);
    if (i >= 0) p.weapons.splice(i, 1);
    p.evolved.add(e.from);
    if (e.union) { const j = p.weapons.findIndex(w => w.id === e.with); if (j >= 0) p.weapons.splice(j, 1); p.evolved.add(e.with); }
    else {                                          // пассивка вливается в эволюцию: слот свободен, бонус сохраняется
      const j = p.passives.findIndex(x => x.id === e.with);
      if (j >= 0) { (p.absorbed = p.absorbed || []).push(p.passives[j]); p.passives.splice(j, 1); p.evolved.add(e.with); this.recalc(); }
    }
    this.addWeapon(eid);
    if (!Save.data.evos.includes(eid)) { Save.data.evos.push(eid); this.newEvos.push(eid); Save.save(); }
    UI.banner(e.icon + ' ' + e.name, 'evo');
    Sfx.evo(); Haptic.note('success');
  },

  availableEvos() {
    const p = this.player, res = [];
    for (const id in EVOLUTIONS) {
      const e = EVOLUTIONS[id];
      if (p.weapons.some(w => w.id === id)) continue;
      const b = p.weapons.find(w => w.id === e.from);
      if (!b || b.level < b.max) continue;
      if (e.union) { const o = p.weapons.find(w => w.id === e.with); if (!o || o.level < o.max) continue; }
      else { const ps = p.passives.find(x => x.id === e.with); if (!ps || ps.level < PASSIVES[e.with].max) continue; }   // пассивка тоже на макс. уровне
      res.push(id);
    }
    return res;
  },

  // Варианты при повышении уровня
  makeChoices(allowNew = true) {
    const p = this.player, pool = [], off = new Set(Save.data.off || []);
    const unlocked = new Set(Save.data.skills.filter(id => !off.has(id)));   // выключенные в коллекции навыки в забеге не выпадают
    for (const w of p.weapons) if (w.level < w.max) pool.push({ kind: 'wup', id: w.id, wt: 1.1 });
    for (const ps of p.passives) if (ps.level < PASSIVES[ps.id].max) pool.push({ kind: 'pup', id: ps.id, wt: 1 });
    if (allowNew && p.weapons.length < MAX_WEAPONS)
      for (const id in WEAPONS) if (unlocked.has(id) && !p.weapons.some(w => w.id === id) && !p.evolved.has(id)) pool.push({ kind: 'wnew', id, wt: 0.8 });
    if (allowNew && p.passives.length < MAX_PASSIVES)
      for (const id in PASSIVES) if (unlocked.has(id) && !p.passives.some(x => x.id === id) && !p.evolved.has(id)) pool.push({ kind: 'pnew', id, wt: 0.7 });
    const n = p.stats.choices;
    const out = this.availableEvos().sort(() => Math.random() - 0.5).slice(0, n).map(id => ({ kind: 'evo', id }));
    while (out.length < n && pool.length) {
      let sum = 0; for (const o of pool) sum += o.wt;
      let r = Math.random() * sum, k = 0;
      for (; k < pool.length - 1; k++) { r -= pool[k].wt; if (r <= 0) break; }
      out.push(pool.splice(k, 1)[0]);
    }
    if (!out.length) out.push({ kind: 'heal' });
    return out;
  },

  choiceInfo(c) {
    const p = this.player;
    const hint = (id, isWeapon) => {
      for (const eid in EVOLUTIONS) {
        const e = EVOLUTIONS[eid];
        if (isWeapon && e.from === id && !e.union) { const o = PASSIVES[e.with]; return t('⚗️ Эволюция: {0} ур. + {1} {2} ур.', maxLv(id), o.icon + ' ' + o.name, maxLv(e.with)); }
        if (!isWeapon && e.with === id) { const o = WEAPONS[e.from]; return t('⚗️ Эволюция для {0} {1} ур. (этот предмет — {2} ур.)', o.icon + ' ' + o.name, maxLv(e.from), maxLv(id)); }
      }
      return '';
    };
    switch (c.kind) {
      case 'evo': { const e = EVOLUTIONS[c.id]; return { icon: e.icon, name: e.name, tag: t(e.union ? 'СОЮЗ' : 'ЭВОЛЮЦИЯ'), desc: e.desc }; }
      case 'wnew': { const d = WEAPONS[c.id]; return { icon: d.icon, name: d.name, tag: t('НОВОЕ'), desc: d.desc, hint: hint(c.id, true) }; }
      case 'wup': { const w = p.weapons.find(x => x.id === c.id); return { icon: w.def.icon, name: w.def.name, tag: t('Ур. {0}', w.level + 1), desc: w.def.ups[w.level - 1].d }; }
      case 'pnew': { const d = PASSIVES[c.id]; return { icon: d.icon, name: d.name, tag: t('НОВОЕ'), desc: d.levels ? d.desc + '. ' + d.levels[0] : d.desc, hint: hint(c.id, false) }; }
      case 'pup': { const d = PASSIVES[c.id], x = p.passives.find(q => q.id === c.id); return { icon: d.icon, name: d.name, tag: t('Ур. {0}', x.level + 1), desc: d.levels ? d.levels[x.level] : d.desc }; }
      default: return { icon: '🍗', name: t('Жареная курица'), tag: '', desc: t('Восстанавливает 30% здоровья') };
    }
  },

  applyChoice(c) {
    const p = this.player;
    switch (c.kind) {
      case 'wnew': this.addWeapon(c.id); break;
      case 'wup': { const w = p.weapons.find(x => x.id === c.id); w.level++; this.calcWeapon(w); break; }
      case 'pnew': p.passives.push({ id: c.id, level: 1 }); this.recalc(); break;
      case 'pup': p.passives.find(x => x.id === c.id).level++; this.recalc(); break;
      case 'evo': this.evolve(c.id); break;
      default: p.hp = Math.min(p.stats.maxHp, p.hp + p.stats.maxHp * 0.3);
    }
  },

  openLevelUp() {
    this.state = 'levelup';
    this.choices = this.makeChoices();
    Sfx.level(); Haptic.note('success');
    UI.levelUp(this.choices);
  },
  pick(i) {
    if (this.state !== 'levelup') return;
    this.applyChoice(this.choices[i]);
    this.pendingLv--;
    this.resume();
  },
  reroll() {
    if (this.player.rerolls <= 0) return;
    this.player.rerolls--;
    this.choices = this.makeChoices();
    UI.levelUp(this.choices);
  },

  // Сундук: выбор 1 из 3 (эволюции, если доступны, всегда среди вариантов)
  openChest() {
    this.state = 'chest';
    this.chestChoices = this.makeChoices();
    Sfx.level(); Haptic.note('success');
    UI.chest(this.chestChoices.map(c => this.choiceInfo(c)), this.chestChoices);
  },
  pickChest(i) {
    if (this.state !== 'chest') return;
    this.applyChoice(this.chestChoices[i]);
    this.resume();
  },

  resume() {
    if (this.state === 'over' || this.state === 'menu') return;
    Music.setDuck(1);
    if (this.pendingLv > 0) { this.openLevelUp(); return; }
    this.state = 'playing'; Input.reset(); UI.hud(true);
  },
  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused'; UI.pause(); Music.setDuck(0.35);
  },
  togglePause() {
    if (this.state === 'playing') this.pause();
    else if (this.state === 'paused') this.resume();
  },

  // ---------- Обновление ----------
  update(dt) {
    this.time += dt;
    if (this.endless) this.trackRecord(dt);
    const p = this.player, st = p.stats;
    const mv = Input.vec();
    const dashing = this.updateDash(dt);             // рывок/прыжок сам двигает героя
    const D = HERO_DASH[p.hero], dashMul = p.dash && (p.dash.kind === 'sprint' || p.dash.kind === 'fly') ? D.mult : 1;
    p.moving = !!(mv.x || mv.y) && !dashing;
    if (dashing) p.anim += dt;
    if (p.moving) {
      const l = Math.hypot(mv.x, mv.y), sp = 110 * st.speed * (p.slowT > 0 ? 0.55 : 1) * (this.boosts.speed ? 1.8 : 1) * dashMul;
      p.x += mv.x * sp * dt; p.y += mv.y * sp * dt;
      p.fx = mv.x / l; p.fy = mv.y / l;
      if (Math.abs(mv.x) > 0.15) p.dirX = Math.sign(mv.x);
      p.anim += dt;
    }
    if (this.endless && this.time >= this.nextBiomeT) {   // смена биома
      this.nextBiomeT += 180; this.biomeIdx = (this.biomeIdx + 1) % this.biomes.length;
      const b = this.biomes[this.biomeIdx];
      World.init(b, p.x, p.y); this.groundPat = Art.ground(this.ctx, b); this.bright = BRIGHT_GROUNDS.includes(b);
      this.biomeFlash = 1; UI.banner("🌍 " + BIOME_NAMES[b], "evo");
    }
    this.biomeFlash = Math.max(0, this.biomeFlash - dt * 1.2);
    World.update(p);
    if (!(p.dash && (p.dash.kind === "fly" || p.dash.kind === "leap"))) World.resolve(p, p.r);   // герой обходит деревья, камни, озёра (в полёте — нет)
    World.checkChests(p, ch => ch.rare ? this.offerRare(ch) : (this.openMapChest(ch), true));
    if (st.regen) p.hp = Math.min(st.maxHp, p.hp + st.regen * dt);
    if (this.healPool > 0) {
      const h = Math.min(this.healPool, st.maxHp * 0.1 * dt);
      this.healPool -= h; p.hp = Math.min(st.maxHp, p.hp + h);
    }
    p.hurtT = Math.max(0, p.hurtT - dt);
    p.hitIframe = Math.max(0, (p.hitIframe || 0) - dt);
    if (p.wardMax && p.wardCharges < p.wardMax) {   // перезарядка Оберега
      if (p.weapons.some(w => w.s && w.s.wardBoost)) p.wardT -= dt;   // «Эгида»: Оберег заряжается вдвое быстрее
      if ((p.wardT -= dt) <= 0) { p.wardCharges++; p.wardT = p.wardCd; this.fx.push({ kind: "ring", x: p.x, y: p.y, r0: 40, r1: 24, t: 0, T: 0.3, color: "#6ae8ff", follow: true }); }
    } else p.wardT = p.wardCd;
    if (p.poisonT > 0) { p.poisonT -= dt; p.hp -= p.poisonDps * dt; if (p.poisonT <= 0) p.poisonDps = 0; }
    p.slowT = Math.max(0, (p.slowT || 0) - dt);
    for (const w of this.webs) {                 // паутина на земле замедляет
      if ((w.t -= dt) <= 0) w.dead = true;
      else if ((w.x - p.x) ** 2 + (w.y - p.y) ** 2 < w.r * w.r) p.slowT = Math.max(p.slowT, 0.15);
    }
    for (const l of this.lava) {                 // лавовый след огненного голема жжёт
      if ((l.t -= dt) <= 0) l.dead = true;
      else if (!this.boosts.shield && !(p.invuln > 0) && (l.x - p.x) ** 2 + (l.y - p.y) ** 2 < (l.r + p.r * 0.5) ** 2) { p.hp -= l.dps * dt; p.hurtT = Math.max(p.hurtT, 0.05); }
    }
    for (const c of this.corpses) if ((c.t += dt) >= c.T) c.dead = true;
    this.shake = Math.max(0, this.shake - dt * 25);
    for (const k in this.boosts) if ((this.boosts[k] -= dt) <= 0) { delete this.boosts[k]; if (k === "haste") { this.cdBoost = 1; for (const w of p.weapons) this.calcWeapon(w); } }

    this.spawner(dt);
    this.updateEnemies(dt);
    this.buildGrid();
    this.separate();
    const fired = this.projs.length + this.timed.length + this.fx.length;
    for (const w of p.weapons) WB[w.def.type].update(this, w, dt);
    p.castT = Math.max(0, (p.castT || 0) - dt);
    if (this.projs.length + this.timed.length + this.fx.length > fired && p.castT <= 0) p.castT = 0.3;   // анимация атаки
    this.updateProjs(dt);
    this.updateZones(dt);
    this.updateTimed(dt);
    this.updateEBullets(dt);
    this.updatePickups(dt);
    this.updateFx(dt);
    if (this.explQ.length) {
      const q = this.explQ; this.explQ = [];
      for (const x of q) this.explode(x.x, x.y, x.r, x.dmg, '#b070ff', {});
    }
    this.cleanup();

    if (this.victoryT > 0 && (this.victoryT -= dt) <= 0) { this.end(true); return; }
    if (p.hp <= 0) { this.die(); if (this.state !== 'playing') return; }
    if (this.pendingLv > 0 && this.state === 'playing') this.openLevelUp();
  },

  cleanup() {
    const f = a => { let j = 0; for (let i = 0; i < a.length; i++) if (!a[i].dead) a[j++] = a[i]; a.length = j; };
    f(this.enemies); f(this.projs); f(this.zones); f(this.fx); f(this.parts); f(this.texts); f(this.pickups); f(this.ebullets); f(this.timed); f(this.webs); f(this.corpses); f(this.lava);
  },

  // ---------- Пространственная сетка ----------
  key(cx, cy) { return ((cx + 32768) << 16) | ((cy + 32768) & 0xffff); },
  buildGrid() {
    const g = this.grid;
    if (g.size > 3000) g.clear();
    for (const a of g.values()) a.length = 0;
    for (const e of this.enemies) {
      if (e.dead) continue;
      const k = this.key(Math.floor(e.x / CELL), Math.floor(e.y / CELL));
      let a = g.get(k); if (!a) g.set(k, a = []);
      a.push(e);
    }
  },
  query(x, y, r, fn) {
    r += MAXR;
    const x0 = Math.floor((x - r) / CELL), x1 = Math.floor((x + r) / CELL), y0 = Math.floor((y - r) / CELL), y1 = Math.floor((y + r) / CELL);
    for (let cx = x0; cx <= x1; cx++) for (let cy = y0; cy <= y1; cy++) {
      const a = this.grid.get(this.key(cx, cy));
      if (a) for (let i = 0; i < a.length; i++) if (!a[i].dead) fn(a[i]);
    }
  },
  hitCircle(x, y, r, fn) {
    this.query(x, y, r, e => { const dx = e.x - x, dy = e.y - y, rr = r + e.r; if (dx * dx + dy * dy < rr * rr) fn(e); });
  },
  separate() {
    for (const a of this.grid.values()) {
      const n = a.length; if (n < 2) continue;
      for (let i = 0; i < n; i++) {
        const e = a[i];
        for (let j = i + 1; j < n; j++) {
          const o = a[j], dx = o.x - e.x, dy = o.y - e.y, rr = (e.r + o.r) * 0.85, d2 = dx * dx + dy * dy;
          if (d2 < rr * rr && d2 > 0.01) {
            const d = Math.sqrt(d2), push = (rr - d) * 0.5 / d;
            const we = e.boss ? 0 : o.boss ? 1 : 0.5, wo = 1 - we;
            e.x -= dx * push * we * 2; e.y -= dy * push * we * 2; o.x += dx * push * wo * 2; o.y += dy * push * wo * 2;
          }
        }
      }
    }
  },
  nearest(x, y, n, maxD) {
    const md = maxD * maxD, best = [];
    for (const e of this.enemies) {
      if (e.dead) continue;
      const d = (e.x - x) * (e.x - x) + (e.y - y) * (e.y - y);
      if (d > md) continue;
      if (best.length < n) { best.push([d, e]); best.sort((a, b) => a[0] - b[0]); }
      else if (d < best[n - 1][0]) { best[n - 1] = [d, e]; best.sort((a, b) => a[0] - b[0]); }
    }
    return best.map(b => b[1]);
  },
  // Цели для самонаводящегося оружия: босс в радиусе — первым, остальные — ближайшие
  targets(x, y, n, maxD) {
    const b = this.boss;
    const p = this.player, onScreen = b && Math.abs(b.x - p.x) < this.viewW / 2 - 10 && Math.abs(b.y - p.y) < this.viewH / 2 - 10;   // только когда босса видно
    if (b && !b.dead && onScreen && Math.random() < 0.5 && (b.x - x) ** 2 + (b.y - y) ** 2 < (maxD + b.r) ** 2) return [b, ...this.nearest(x, y, n, maxD).filter(e => e !== b)].slice(0, Math.max(1, n));
    return this.nearest(x, y, n, maxD);
  },
  inView() {
    const p = this.player, hw = this.viewW / 2, hh = this.viewH / 2;
    return this.enemies.filter(e => !e.dead && Math.abs(e.x - p.x) < hw && Math.abs(e.y - p.y) < hh);
  },

  // ---------- Спавн ----------
  spawnPos(m = 40) {
    for (let i = 0; i < 4; i++) { const q = this.edgePos(m); if (!World.blocked(q.x, q.y, 16)) return q; }
    return this.edgePos(m);
  },
  edgePos(m) {
    const p = this.player, hw = this.viewW / 2 + m, hh = this.viewH / 2 + m;
    let s = Math.random() * 2 * (2 * hw + 2 * hh);
    if (s < 2 * hw) return { x: p.x - hw + s, y: p.y - hh }; s -= 2 * hw;
    if (s < 2 * hw) return { x: p.x - hw + s, y: p.y + hh }; s -= 2 * hw;
    if (s < 2 * hh) return { x: p.x - hw, y: p.y - hh + s }; s -= 2 * hh;
    return { x: p.x + hw, y: p.y - hh + s };
  },
  spawner(dt) {
    const t = this.time, S = this.stage;
    Music.setLevel(this.boss ? 2 : t > (this.endless ? 120 : S.duration * 0.4) ? 1 : 0);   // музыка нагнетается по ходу уровня
    let rate, types;
    if (this.endless) {
      const m = t / 60;
      rate = Math.min(1.5 + m * 0.9, 22);
      types = S.pool.slice(0, Math.min(S.pool.length, 2 + Math.floor(m / 1.2)));
      this.hpMul = 1 + m * 0.3 + m * m * 0.02;
      this.dmgMul = 1 + m * 0.08;
    } else {
      let w = S.waves[0]; for (const x of S.waves) if (x.t <= t) w = x;
      rate = w.rate * (this.boss ? 0.45 : 1) * (this.stageIdx > 0 ? 0.82 : 1); types = w.types;   // во время босса толпа реже, чтобы оружие било и по нему
      if (t < 90) rate = Math.min(rate, 1.3 + t / 90 * 0.7);    // первые полторы минуты любого уровня — разминка
      if (t < 60) { const weak = types.filter(x => ['crow', 'roach', 'skeleton'].includes(x)); types = weak.length ? weak : ['crow', 'roach']; }   // первая минута — только слабые враги
      // «тяжесть» уровня (S.hp, S.dmgMul) нарастает к боссу, а не действует с первой секунды
      const ramp = Math.min(1, t / S.duration);
      this.hpMul = (1 + (S.hp - 1) * ramp) * (1 + t / 300 * 0.5);
      if (t > S.duration * 0.3 && STAGE_EXTRA[S.id]) types = types.concat(STAGE_EXTRA[S.id]);   // новые монстры — со второй трети уровня
      this.dmgMul = (1 + (S.dmgMul - 1) * ramp) * (1 + t / 900);
    }
    this.curTypes = types;
    this.spawnAcc += rate * dt;
    while (this.spawnAcc >= 1) {
      this.spawnAcc--;
      if (this.enemies.length >= MAX_EN) continue;
      const ty = pick(types), first = this.spawnEnemy(ty), n = (ENEMIES[ty].pack || 1) - 1;   // стайные (мыши, лютые волки) — группой
      for (let i = 0; i < n && this.enemies.length < MAX_EN; i++) this.spawnEnemy(ty, { pos: { x: first.x + rand(-40, 40), y: first.y + rand(-40, 40) } });
    }
    if (!this.endless && !this.champion && t >= S.duration * 0.5) this.spawnChampion();   // чемпион в середине уровня
    if (this.endless && t >= (this.nextChamp || 150)) { this.nextChamp = (this.nextChamp || 150) + 300; this.spawnChampion(); }
    if (t >= this.nextElite) { this.nextElite += 60; this.spawnEnemy(pick(types), { elite: true }); }
    if (t >= this.nextRing) { this.nextRing += 100; this.ring(types[0]); }
    (STAGE_GOLEMS[S.id] || []).forEach((g, i) => {   // големы приходят по одному по расписанию
      const nt = this.golemNext[i] !== undefined ? this.golemNext[i] : g.t;
      if (t < nt) return;
      this.golemNext[i] = nt + g.every * (this.endless ? Math.max(0.35, 1 - t / 1500) : 1);
      if (this.enemies.length < MAX_EN + 20) this.spawnEnemy(g.type);
    });
    if (t >= this.nextBoss) { this.nextBoss = this.endless ? this.nextBoss + 300 : Infinity; this.spawnBoss(); }
  },
  spawnEnemy(type, o = {}) {
    const def = ENEMIES[type], pos = o.pos || this.spawnPos();
    const k = o.elite ? 1.8 : 1;
    const e = { id: this.nextId++, type, def, x: pos.x, y: pos.y, hp: def.hp * this.hpMul * (o.elite ? 12 : 1), r: def.r * k, size: def.size * k,
      speed: def.speed * rand(0.9, 1.1) * (o.elite ? 0.85 : 1), dmg: def.dmg * this.dmgMul * (o.elite ? 1.5 : 1), xp: def.xp * (o.elite ? 10 : 1),
      flash: 0, slow: 0, frozen: 0, burnT: 0, burnTick: 0, burnDps: 0, kbx: 0, kby: 0, contactAt: 0, hitAt: {}, shootT: rand(1, 3), webT: rand(2, 5), slamT: rand(1, 3), slamW: 0, lavaT: 0, animT: Math.random() * 3, near: false, lungeT: rand(1, 3), lunge: 0,
      elite: !!o.elite, boss: false, color: def.color, dead: false, ph: Math.random() * 10, flip: false };
    // цветовой вариант модели: по уровню, в бесконечном режиме — случайный из доступных
    const skins = SKINS_OF(type);
    e.skin = def.skin || (this.endless ? (skins.length ? pick(skins) : type) : ((STAGE_SKINS[this.stage.id] || {})[type] || type));
    Art.need('enemy_' + e.skin);
    e.diveT = rand(2, 4); e.lobT = rand(2, 4); e.fuse = 0;
    e.maxHp = e.hp;
    this.enemies.push(e);
    return e;
  },
  ring(type) {
    const p = this.player, n = 26, R = Math.max(this.viewW, this.viewH) * 0.42;
    for (let i = 0; i < n; i++) {
      const a = i * TAU / n;
      if (this.enemies.length < MAX_EN + 40) this.spawnEnemy(type, { pos: { x: p.x + Math.cos(a) * R, y: p.y + Math.sin(a) * R } });
    }
  },
  spawnBoss() {
    const B = this.endless ? STAGES[this.bossCount % STAGES.length].boss : this.stage.boss;
    this.bossCount++;
    if (this.endless) Art.need('boss_' + STAGES[this.bossCount % STAGES.length].boss.art);   // следующий босс бесконечного режима — заранее
    const e = this.spawnEnemy(B.type, { pos: this.spawnPos(80) });
    const def = ENEMIES[B.type];
    Object.assign(e, { boss: true, name: B.name, color: B.color, r: B.r || def.r * B.scale * 0.8, size: B.size || def.size * B.scale, speed: B.speed, bossArt: B.art ? "boss_" + B.art : null,
      dmg: B.dmg * (this.endless ? this.dmgMul : 1), hp: B.hp * (this.endless ? Math.pow(1 + this.time / 300, 1.6) * 0.5 : 1), xp: 150,
      ai: { mode: 'chase', t: 0, dash: 3, ring: 5 } });
    e.maxHp = e.hp;
    this.boss = e;
    UI.banner('⚠️ ' + B.name, 'boss');
    Haptic.imp('heavy'); this.shake = 8;
  },

  // ---------- Враги ----------
  updateEnemies(dt) {
    const p = this.player, kbDecay = Math.exp(-9 * dt);
    for (const e of this.enemies) {
      if (e.dead) continue;
      e.flash -= dt;
      if (e.burnT > 0) {
        e.burnT -= dt; e.burnTick -= dt;
        if (this.parts.length < 250 && Math.random() < dt * 5) this.parts.push({ x: e.x + rand(-e.r, e.r), y: e.y - rand(0, e.r), vx: rand(-15, 15), vy: rand(-70, -35), t: 0, T: rand(0.35, 0.6), color: pick(['#ffb040', '#ff6a1a']), size: rand(1.5, 2.8) });   // искры от горящего врага
        if (e.burnTick <= 0) { e.burnTick = 0.5; this.hurt(e, e.burnDps * 0.5, { noCrit: 1, color: '#ffa050' }); if (e.dead) continue; }
      }
      let sp = e.speed;
      if (e.frozen > 0) { e.frozen -= dt; sp = 0; } else if (e.slow > 0) { e.slow -= dt; sp *= 0.45; }
      e.animT += dt * (sp / e.speed);
      const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
      if (e.boss || e.champion) this.bossAI(e, dt, dx, dy, d, sp);
      else {
        if (!this.monsterAI(e, dt, dx, dy, d, sp)) continue;   // новые монстры: взрыв, дистанция, пике, броски
        sp = e.curSp !== undefined ? e.curSp : sp;
        if (e.def.slam && e.frozen <= 0) {          // каменный голем: прыжок и удар о землю
          if (e.slamW > 0) { sp = 0; if ((e.slamW -= dt) <= 0) this.golemSlam(e); }
          else if ((e.slamT -= dt) <= 0 && d < e.def.slam.r + 15) { e.slamW = e.def.slam.wind; e.slamT = e.def.slam.cd; }
        }
        if (e.def.lava && (e.lavaT -= dt) <= 0 && this.lava.length < 40) {
          e.lavaT = e.def.lava.every;
          this.lava.push({ x: e.x + rand(-6, 6), y: e.y + e.size * 0.32, r: 20, t: e.def.lava.t, T: e.def.lava.t, dps: e.def.lava.dps * this.dmgMul, ph: Math.random() * 9 });
        }
        if (e.def.lunge && sp > 0) {            // волк: рывок к игроку
          if (e.lunge > 0) { e.lunge -= dt; sp *= 2.1; }
          else if ((e.lungeT -= dt) <= 0 && d < 140) { e.lunge = 0.4; e.lungeT = rand(3.5, 5.5); }
        }
        const dir = e.moveDir || 1;                    // -1 — отступает (держит дистанцию)
        let mvx = dx / d * dir, mvy = dy / d * dir;
        if (e.def.flutter) { const a = Math.sin(this.time * 6 + e.ph) * 0.9; const c = Math.cos(a), s = Math.sin(a); const x = mvx; mvx = x * c - mvy * s; mvy = x * s + mvy * c; }   // мыши петляют
        e.x += mvx * sp * dt; e.y += mvy * sp * dt;
      }
      if (e.kbx || e.kby) { e.x += e.kbx * dt; e.y += e.kby * dt; e.kbx *= kbDecay; e.kby *= kbDecay; if (Math.abs(e.kbx) + Math.abs(e.kby) < 2) e.kbx = e.kby = 0; }
      if (!e.boss && !e.def.fly) World.resolveEnemy(e, dx / d, dy / d, sp, dt);   // пешие обходят препятствия
      if (Math.abs(dx) > 2) e.flip = dx < 0;
      if (e.def.shoots && !e.boss && d < (e.def.keepDist ? 320 : 260) && e.frozen <= 0 && (e.shootT -= dt) <= 0 && this.ebullets.length < 20) {   // не больше ~20 вражеских снарядов разом
        const sh = e.def.shoots; e.shootT = sh.cd;
        this.ebullets.push({ x: e.x, y: e.y, vx: dx / d * sh.speed, vy: dy / d * sh.speed, r: (sh.arrow ? 4 : 5), dmg: sh.dmg * this.dmgMul, life: 4, color: sh.color, slow: sh.slow, arrow: sh.arrow, elite: e.elite, champ: e === this.champion });
      }
      if (e.def.web && !e.boss && d < 260 && e.frozen <= 0 && (e.webT -= dt) <= 0) {   // паук: плевок паутиной
        e.webT = e.def.web.cd * rand(0.8, 1.2);
        this.ebullets.push({ x: e.x, y: e.y, vx: dx / d * e.def.web.speed, vy: dy / d * e.def.web.speed, r: 7, dmg: 0, life: d / e.def.web.speed, color: '#d8d0ff', web: true });
      }
      e.near = d < e.r + p.r + 14;
      if (d < e.r + p.r && this.time >= e.contactAt) {
        e.contactAt = this.time + 0.7; this.hurtPlayer(e.dmg);
        if (e.def.soak) p.slowT = Math.max(p.slowT, e.def.soak);   // водный голем замедляет
        if (e.def.poison) { p.poisonT = e.def.poison.t; p.poisonDps = Math.max(p.poisonDps || 0, e.def.poison.dps * this.dmgMul); }
      }
      if (d > this.farDist && !e.boss && !e.champion) { const q = this.spawnPos(); e.x = q.x; e.y = q.y; }
    }
  },
  bossAI(e, dt, dx, dy, d, sp) {
    const a = e.ai;
    a.dash -= dt; a.ring -= dt;
    if (a.mode === 'chase') {
      e.x += dx / d * sp * dt; e.y += dy / d * sp * dt;
      if (a.dash <= 0) { a.mode = 'wind'; a.t = 0.8; a.dx = dx / d; a.dy = dy / d; }
    } else if (a.mode === 'wind') {
      a.dx = dx / d; a.dy = dy / d;
      if ((a.t -= dt) <= 0) { a.mode = 'dash'; a.t = 0.55; }
    } else {
      e.x += a.dx * e.speed * 5 * dt; e.y += a.dy * e.speed * 5 * dt;
      if ((a.t -= dt) <= 0) { a.mode = 'chase'; a.dash = rand(4, 6); }
    }
    if (a.ring <= 0) {
      a.ring = rand(7, 9.5);                          // кольца пуль реже и медленнее — к боссу можно подойти
      const n = 14, off = Math.random() * TAU;
      for (let i = 0; i < n; i++) { const an = off + i * TAU / n; this.ebullets.push({ x: e.x, y: e.y, vx: Math.cos(an) * 100, vy: Math.sin(an) * 100, r: 7, dmg: e.dmg * 0.5, life: 6, color: e.color }); }
    }
  },

  // ---------- Прыжки / рывки героев ----------
  useDash() {
    const p = this.player;
    if (this.state !== 'playing' || !p || p.dash || p.dashCd > 0) return;
    const D = HERO_DASH[p.hero], st = p.stats;
    p.dashCd = D.cd;                                // перезарядка фиксированная: 10–15 с
    const ang = D.random ? rand(0, TAU) : Math.atan2(p.fy, p.fx), cx = Math.cos(ang), cy = Math.sin(ang);
    Haptic.imp('medium');
    switch (D.kind) {
      case 'blink': {                                // телепорт (Странник, Счастливчик)
        const dist = D.random ? rand(120, 220) : D.dist, col = D.color, hue = D.luck ? 200 : 0;   // столб телепорта; у Счастливчика — золотой
        this.fx.push({ kind: 'ring', x: p.x, y: p.y, r0: 30, r1: 4, t: 0, T: 0.3, color: col });
        this.burst(p.x, p.y, col, 14);
        this.sfx('teleport', p.x, p.y + 14, 0.45, 0.85, { glow: 1, fade: 1, hue });
        p.x += cx * dist; p.y += cy * dist; World.resolve(p, p.r);
        this.sfx('teleport', p.x, p.y + 14, 0.6, 1, { follow: 1, glow: 1, fade: 1, hue });
        this.fx.push({ kind: 'ring', x: p.x, y: p.y, r0: 6, r1: 75, t: 0, T: 0.35, color: col });
        this.burst(p.x, p.y, col, 18);
        if (D.dmg) this.hitCircle(p.x, p.y, 75, e => { const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1; this.hurt(e, D.dmg * st.might, { kb: { x: dx / d * 260, y: dy / d * 260 } }); });
        if (D.luck && Math.random() < 0.5) { this.boosts.fury = Math.max(this.boosts.fury || 0, 4); UI.banner(t('🎲 Удача! Урон ×2'), 'evo'); }
        p.invuln = 0.3; Sfx.nova();
        break;
      }
      case 'leap':
        p.dash = { kind: 'leap', t: D.dur, T: D.dur, vx: cx * D.dist / D.dur, vy: cy * D.dist / D.dur };
        p.invuln = D.dur + 0.1; Sfx.slash(); break;
      case 'dash': case 'charge': case 'bolt':
        if (D.trail && D.trail.color === '#ff3050') this.sfx('blood', p.x, p.y - 6, 0.45, 0.7);   // кровавый рывок: брызги на старте
        p.dash = { kind: D.kind, t: D.dur, T: D.dur, vx: cx * D.speed, vy: cy * D.speed };
        p.invuln = D.dur + 0.05; if (D.kind === 'bolt') Sfx.zap(); else Sfx.slash(); break;
      case 'sprint': p.dash = { kind: 'sprint', t: D.dur, T: D.dur }; Sfx.nova(); break;
      case 'fly': p.dash = { kind: 'fly', t: D.dur, T: D.dur }; p.invuln = D.dur + 0.1; this.burst(p.x, p.y, D.color, 20); Sfx.nova(); break;
    }
    if (Math.abs(cx) > 0.15) p.dirX = Math.sign(cx);
  },

  // Идёт ли рывок, который сам двигает героя (true — управление джойстиком на это время отключено)
  updateDash(dt) {
    const p = this.player, D = HERO_DASH[p.hero], d = p.dash, st = p.stats;
    p.dashCd = Math.max(0, p.dashCd - dt); p.invuln = Math.max(0, p.invuln - dt);
    for (const g of p.ghosts) g.t -= dt;
    while (p.ghosts.length && p.ghosts[0].t <= 0) p.ghosts.shift();
    if (!d) return false;
    d.t -= dt;
    if (d.kind !== 'fly' && (d.gT = (d.gT || 0) - dt) <= 0) { d.gT = 0.045; p.ghosts.push({ x: p.x, y: p.y, t: 0.3, lift: d.kind === 'leap' ? this.leapLift(d) : 0 }); }
    if (D.trail && (d.zT = (d.zT || 0) - dt) <= 0 && this.zones.length < 90) {   // след с уроном
      d.zT = d.kind === 'sprint' ? 0.09 : 0.05;
      this.zones.push({ x: p.x, y: p.y + 12, r: 18 * st.area, t: D.trail.t, T: D.trail.t, dps: D.trail.dps * st.might, tick: 0, color: D.trail.color, chill: D.trail.freeze ? 1 : 0, freeze: D.trail.freeze || 0 });
    }
    if (d.kind === 'fly' && Math.random() < 0.7 && this.parts.length < 300) {   // летучие мыши / души вокруг
      const a = rand(0, TAU), s = rand(40, 110);
      this.parts.push({ x: p.x + Math.cos(a) * 14, y: p.y + Math.sin(a) * 14, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 30, t: 0, T: rand(0.3, 0.6), color: D.color, size: rand(3, 5) });
    }
    let moves = false;
    if (d.kind === 'dash' || d.kind === 'charge' || d.kind === 'bolt' || d.kind === 'leap') { p.x += d.vx * dt; p.y += d.vy * dt; moves = true; }
    if (d.kind === 'charge' || d.kind === 'bolt') {
      const n = Math.hypot(d.vx, d.vy) || 1;
      this.hitCircle(p.x, p.y, p.r + 20, e => {
        if (this.time < (e.hitAt.dash || 0)) return;
        e.hitAt.dash = this.time + 0.5;
        const kb = d.kind === 'charge' ? 460 : 120;
        this.hurt(e, D.dmg * st.might, { kb: { x: d.vx / n * kb, y: d.vy / n * kb } });
        if (d.kind === 'bolt') { const t = this.nearest(e.x, e.y, 2, 150).find(o => o !== e); if (t) this.chain(e.x, e.y, t, D.dmg * 0.6 * st.might, 2, 130, '#fff27a'); }
      });
      if (d.kind === 'bolt' && this.fx.length < 120) this.fx.push({ kind: 'bolt', pts: [p.x - d.vx * dt * 3, p.y - d.vy * dt * 3, p.x + rand(-6, 6), p.y + rand(-6, 6), p.x, p.y], t: 0, T: 0.2, color: '#fff27a' });
    }
    if (d.t <= 0) { p.dash = null; this.endDash(d, D); }
    return moves;
  },
  leapLift(d) { return -Math.sin((1 - Math.max(0, d.t) / d.T) * Math.PI) * 46; },

  endDash(d, D) {
    const p = this.player, st = p.stats;
    if (d.kind === 'leap') {                         // приземление: ударная волна
      World.resolve(p, p.r);
      this.fx.push({ kind: 'ring', x: p.x, y: p.y + 10, r0: 10, r1: D.r * st.area, t: 0, T: 0.35, color: '#7ac0ff' });
      this.hitCircle(p.x, p.y, D.r * st.area, e => { const dx = e.x - p.x, dy = e.y - p.y, dd = Math.hypot(dx, dy) || 1; this.hurt(e, D.dmg * st.might, { kb: { x: dx / dd * 320, y: dy / dd * 320 } }); });
      this.shake = Math.max(this.shake, 5); Sfx.boom();
    } else if (d.kind === 'fly') {
      World.resolve(p, p.r);
      if (D.heal) { const h = Math.min(st.maxHp - p.hp, st.maxHp * D.heal); p.hp += h; if (h > 1) this.texts.push({ x: p.x, y: p.y - 34, s: '+' + Math.round(h) + ' ❤', color: '#5aff8a', big: true, t: 0, T: 0.9 }); }
      if (D.burst) this.explode(p.x, p.y, D.burst.r * st.area, D.burst.dmg * st.might, D.color, {});
      this.burst(p.x, p.y, D.color, 16);
      p.invuln = 0.3;
    } else if (d.kind === 'charge') this.fx.push({ kind: 'ring', x: p.x, y: p.y, r0: 8, r1: 50, t: 0, T: 0.25, color: '#c8d0e0' });
  },
  burst(x, y, color, n) {
    for (let i = 0; i < n && this.parts.length < 300; i++) { const a = rand(0, TAU), s = rand(50, 160); this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, T: rand(0.3, 0.55), color, size: rand(2, 4) }); }
  },

  // ---------- Поведение новых монстров. false — монстр исчез (взорвался) ----------
  monsterAI(e, dt, dx, dy, d, sp) {
    const D = e.def, p = this.player;
    e.curSp = sp; e.moveDir = 1;
    if (D.explode) {                                // жук-взрывун: подбегает, мигает и взрывается
      if (e.fuse > 0) {
        e.curSp = 0;
        if ((e.fuse -= dt) <= 0) {
          const X = D.explode;
          this.fx.push({ kind: 'boom', x: e.x, y: e.y, r: X.r, t: 0, T: 0.35, color: '#ff7a2a' });
          this.burst(e.x, e.y, '#ffb040', 14); this.shake = Math.max(this.shake, 4); Sfx.boom();
          if (Math.hypot(p.x - e.x, p.y - e.y) < X.r + p.r) this.hurtPlayer(X.dmg * this.dmgMul);
          e.dead = true; this.kills++; this.dropGem(e.x, e.y, e.xp);
          return false;
        }
      } else if (d < 55 && e.frozen <= 0) e.fuse = D.explode.fuse;
    }
    if (D.keepDist) {                               // лучник, подрывник: держат дистанцию
      if (d < D.keepDist - 30) e.moveDir = -1; else if (d < D.keepDist + 30) e.curSp = sp * 0.15;
    }
    if (D.dive && sp > 0) {                         // ворон: пикирует на героя
      if (e.diving > 0) { e.diving -= dt; e.curSp = sp * D.dive.mult; }
      else if ((e.diveT -= dt) <= 0 && d < D.dive.range) { e.diving = D.dive.dur; e.diveT = D.dive.cd * rand(0.8, 1.2); }
      else if (d < D.dive.range * 0.8) { e.curSp = sp * 0.6; }   // кружит перед пике
    }
    if (D.lob && d < D.lob.range && e.frozen <= 0 && (e.lobT -= dt) <= 0) {   // гном: бросает бомбу с меткой
      e.lobT = D.lob.cd * rand(0.85, 1.15);
      const tx = p.x + rand(-20, 20), ty = p.y + rand(-20, 20), L = D.lob, dm = L.dmg * this.dmgMul;
      this.timed.push({ kind: 'elob', sx: e.x, sy: e.y, x: tx, y: ty, t: 0, T: 0.9, r: L.r, land: () => {
        this.fx.push({ kind: 'boom', x: tx, y: ty, r: L.r, t: 0, T: 0.3, color: '#ffb040' }); Sfx.boom();
        if (Math.hypot(p.x - tx, p.y - ty) < L.r + p.r * 0.5) this.hurtPlayer(dm);
      } });
    }
    return true;
  },

  pickChampion() {
    const pool = STAGES.map(s => s.boss).filter(B => B.art && B !== this.stage.boss);
    this.champNext = pick(pool); Art.need('boss_' + this.champNext.art); return this.champNext;
  },
  // Чемпион: другой босс в уменьшенном виде посреди уровня; сильный, роняет сундук
  spawnChampion() {
    const B = this.champNext || this.pickChampion();
    this.pickChampion();                              // следующего чемпиона выбираем и догружаем заранее
    const e = this.spawnEnemy('gnome', { pos: this.spawnPos(60), elite: true });
    const hp = (this.endless ? B.hp * 0.5 * Math.pow(1 + this.time / 300, 1.4) : this.stage.boss.hp * 0.35);
    Object.assign(e, { champion: true, name: B.name, color: B.color, bossArt: 'boss_' + B.art, r: B.r * 0.7, size: B.size * 0.72, speed: B.speed * 0.9,
      dmg: B.dmg * 0.7 * (this.endless ? this.dmgMul : 1), hp, maxHp: hp, xp: 60, ai: { mode: 'chase', t: 0, dash: 4, ring: 99 } });
    this.champion = e;
    UI.banner(t('👑 Чемпион: {0}', B.name), 'boss');
  },

  // Каменный голем приземляется: удар по площади
  golemSlam(e) {
    const s = e.def.slam, p = this.player;
    this.fx.push({ kind: 'ring', x: e.x, y: e.y + e.size * 0.3, r0: 10, r1: s.r, t: 0, T: 0.35, color: '#b8a888' });
    for (let i = 0; i < 14 && this.parts.length < 300; i++) {
      const a = rand(0, TAU), v = rand(60, 180);
      this.parts.push({ x: e.x, y: e.y + e.size * 0.3, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, T: rand(0.4, 0.7), color: pick(['#7a7a6a', '#5a5a4a', '#6a8a4a']), size: rand(3, 6) });
    }
    if (Math.hypot(p.x - e.x, p.y - e.y) < s.r + p.r) this.hurtPlayer(s.dmg * this.dmgMul);
    this.shake = Math.max(this.shake, 6); Sfx.boom();
  },

  hurt(e, dmg, o) {
    if (e.dead) return;
    const st = this.player.stats;
    const crit = !o.noCrit && Math.random() < st.crit + (o.critBonus || 0);
    let d = dmg * (crit ? st.critDmg : 1) * rand(0.92, 1.08);
    if (o.shatter && e.frozen > 0 && !e.stun) d *= 2;
    if (this.boosts.fury) d *= 2;
    if (e.def.armorMul) d *= e.def.armorMul;      // каменный голем получает меньше урона
    e.hp -= d; e.flash = 0.1;
    if (st.lifesteal) this.healPool += d * st.lifesteal;
    if (o.leech) this.healPool += o.leech;
    this.healPool = Math.min(this.healPool, st.maxHp * 0.2);
    if (o.kb && !e.boss) { const kf = e.elite || e.def.heavy ? 0.25 : 1; e.kbx += o.kb.x * kf; e.kby += o.kb.y * kf; }
    if (o.slow) e.slow = Math.max(e.slow, o.slow);
    if (o.freeze) { e.frozen = Math.max(e.frozen, e.boss ? Math.min(o.freeze, 0.3) : o.freeze); e.stun = 0; }
    else if (o.stun && !(e.frozen > 0 && !e.stun)) { e.frozen = Math.max(e.frozen, e.boss ? Math.min(o.stun, 0.3) : o.stun); e.stun = 1; }   // оглушение (Землетрясение): стоит как замороженный, но над головой звёзды, а не лёд
    if (o.burn) { e.burnT = Math.max(e.burnT, o.burnT || 2); e.burnDps = Math.max(e.burnDps, o.burn); }
    if (crit && this.time >= this.critFxAt && Art.img.fx_f_crit_slash) {   // крит: красный крест-разрез (не чаще ~14 раз в секунду)
      this.critFxAt = this.time + 0.07;
      this.sfx('crit_slash', e.x, e.y - e.size * 0.3, 0.3, clamp(e.size / 75, 0.6, 1.3), { rot: rand(-0.5, 0.5) });
    }
    if (Save.data.settings.numbers && (crit || this.texts.length < 45))   // больше 45 цифр разом всё равно не прочитать, а каждая — операция отрисовки
      this.texts.push({ x: e.x + rand(-6, 6), y: e.y - e.r, s: Math.round(d), color: crit ? '#ffd23a' : (o.color || '#fff'), big: crit, t: 0, T: 0.7 });
    Sfx.hit();
    if (e.hp <= 0) this.kill(e);
  },

  kill(e) {
    if (e.dead) return;
    e.dead = true; this.kills++;
    const st = this.player.stats;
    // труп с анимацией смерти (если есть арт), потом тает
    const ck = this.enemyKey(e), dl = Art.animLen(ck, 'death');
    if (Art.has(ck) && this.corpses.length < 50) {
      if (e.boss || e.elite) Art.need(ck);
      this.corpses.push({ key: ck, x: e.x, y: e.y, size: e.size, flip: e.flip, t: 0, dl, T: dl + (e.boss ? 2.4 : 0.6), boss: e.boss || e.elite });
    }
    if (e.elite || e.boss) this.sfx('blood_slash', e.x, e.y - e.size * 0.3, 0.7, clamp(e.size / 80, 0.7, 1.8));   // добили элиту/чемпиона/босса
    this.dropGem(e.x, e.y, e.xp);
    if (Math.random() < COIN_CHANCE * st.greed * (this.boosts.gold ? 3 : 1))
      this.pickups.push({ kind: 'coin', x: e.x + rand(-8, 8), y: e.y + rand(-8, 8), v: randi(COIN_MIN, COIN_MAX) });
    if (e.elite || Math.random() < HEART_CHANCE) this.pickups.push({ kind: 'heart', x: e.x + rand(-6, 6), y: e.y + rand(-6, 6) });
    if (Math.random() < 0.0015) this.pickups.push({ kind: 'magnet', x: e.x, y: e.y });
    // зелёные монеты: редко с обычных, часто с элиты, пачка с босса
    const gv = e.boss ? 5 : e.elite ? (Math.random() < GREEN_ELITE_CHANCE ? 1 : 0) : (Math.random() < GREEN_CHANCE ? 1 : 0);
    if (gv) this.pickups.push({ kind: 'green', x: e.x + rand(-8, 8), y: e.y + rand(-8, 8), v: gv });
    if (e.elite || e.boss) this.pickups.push({ kind: 'chest', x: e.x, y: e.y });
    if (e.boss) {
      this.boss = null; this.shake = 12; Haptic.note('success');
      if (!this.endless) { this.victoryT = 2.5; UI.banner(t('🏆 ПОБЕДА!'), 'win'); }
    }
    if (e.def.deathCloud && this.lava.length < 40) { const C = e.def.deathCloud; this.lava.push({ x: e.x, y: e.y, r: C.r, t: C.t, T: C.t, dps: C.dps * this.dmgMul, ph: Math.random() * 9, spore: 1 }); }   // споровик: ядовитое облако
    if (e === this.champion) this.shake = 8;
    if (st.explode && Math.random() < st.explode) this.explQ.push({ x: e.x, y: e.y, r: 55 * st.area, dmg: 12 * st.might + e.maxHp * 0.3 });
    for (let i = 0; i < 5 && this.parts.length < 300; i++) {
      const a = rand(0, TAU), s = rand(40, 120);
      this.parts.push({ x: e.x, y: e.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, T: rand(0.3, 0.55), color: e.color, size: rand(2, 4) });
    }
  },

  dropGem(x, y, v) {
    // Слишком много кристаллов: самый дальний от героя исчезает, а его опыт переходит в новый —
    // так кристалл всегда падает там, где умер моб, и опыт не теряется
    if (this.gemCount >= MAX_GEMS) {
      const p = this.player; let far = null, fd = -1;
      for (const k of this.pickups) if (k.kind === 'gem' && !k.dead && !k.pull) { const d = (k.x - p.x) ** 2 + (k.y - p.y) ** 2; if (d > fd) { fd = d; far = k; } }
      if (far) { far.dead = true; this.gemCount--; v += far.v; }
    }
    const g = { kind: 'gem', x: x + rand(-4, 4), y: y + rand(-4, 4), v };
    World.resolve(g, 6);                             // не оставляем кристалл внутри камня или озера
    this.pickups.push(g);
    this.gemCount++;
  },

  // Сундук на карте: монеты, лечение или улучшение
  openMapChest(ch) {
    const p = this.player, r = Math.random();
    this.fx.push({ kind: 'ring', x: ch.x, y: ch.y, r0: 8, r1: 60, t: 0, T: 0.4, color: '#ffd23a' });
    for (let i = 0; i < 12 && this.parts.length < 300; i++) { const a = rand(0, TAU), s = rand(60, 160); this.parts.push({ x: ch.x, y: ch.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, T: rand(0.4, 0.7), color: '#ffd23a', size: rand(2, 4) }); }
    if (r < 0.35) { this.openChest(); return; }
    if (r < 0.6 && p.hp < p.stats.maxHp * 0.8) {
      const before = p.hp;
      p.hp = Math.min(p.stats.maxHp, p.hp + p.stats.maxHp * 0.5);
      const h = p.hp - before;
      this.texts.push({ x: ch.x, y: ch.y - 20, s: '+' + Math.round(h) + ' ❤', color: '#5aff8a', big: true, t: 0, T: 1.2 });
    } else if (r >= 0.6 && r < 0.7) {
      const v = randi(1, 2);                        // иногда в обычном сундуке — зелёные монеты
      this.green += v;
      this.texts.push({ x: ch.x, y: ch.y - 20, s: '+' + v, ic: 'fx_green_spin', color: '#5aff9a', big: true, t: 0, T: 1.2 });
    } else {
      const v = randi(4, 12);
      this.coins += v;
      this.texts.push({ x: ch.x, y: ch.y - 20, s: '+' + v, ic: 'fx_coin_spin', color: '#ffd23a', big: true, t: 0, T: 1.2 });
    }
    Sfx.coin(); Haptic.imp('medium');
  },

  // ---------- Редкие сундуки и бустеры ----------
  offerRare(ch) {
    this.rareChest = ch; this.state = 'rare';
    Input.reset(); UI.rarePrompt(RARE_CHEST_COST, this.green);
    return false;                                   // открыт будет только после оплаты
  },
  buyRare() {
    if (this.state !== "rare" || this.green < RARE_CHEST_COST) return;
    this.green -= RARE_CHEST_COST;
    const ch = this.rareChest; World.markOpened(ch);
    this.fx.push({ kind: 'ring', x: ch.x, y: ch.y, r0: 8, r1: 80, t: 0, T: 0.5, color: '#5aff9a' });
    const ids = Object.keys(BOOSTERS).sort(() => Math.random() - 0.5).slice(0, 3);
    this.state = 'booster'; this.boosterChoices = ids;
    Sfx.evo(); Haptic.note('success');
    UI.boosterPick(ids);
  },
  skipRare() { if (this.state === 'rare') this.resume(); },
  pickBooster(id) {
    if (this.state !== 'booster') return;
    this.applyBooster(id);
    this.resume();
  },
  applyBooster(id) {
    const p = this.player, b = BOOSTERS[id];
    UI.banner(b.icon + ' ' + b.name, 'evo');
    if (id === 'magnet') { for (const k of this.pickups) if (k.kind !== 'chest' && (k.kind !== 'heart' || p.hp < p.stats.maxHp)) k.pull = true; this.magnetT = 2.5; return; }
    if (id === 'heal') { p.hp = p.stats.maxHp; p.poisonT = 0; return; }
    if (id === 'nuke') {
      this.fx.push({ kind: 'ring', x: p.x, y: p.y, r0: 20, r1: Math.max(this.viewW, this.viewH) * 0.7, t: 0, T: 0.6, color: '#ffe080', follow: true });
      for (const e of this.inView()) this.hurt(e, e.boss ? Math.min(e.maxHp * 0.08, 3000) : 600 * p.stats.might, { noCrit: 1, color: '#ffe080' });
      this.shake = 14; Sfx.boom(); return;
    }
    this.boosts[id] = (this.boosts[id] || 0) + b.dur;
    if (id === 'haste') { this.cdBoost = 0.5; for (const w of p.weapons) this.calcWeapon(w); }
  },

  explode(x, y, r, dmg, color, o) {
    this.hitCircle(x, y, r, e => {
      const dx = e.x - x, dy = e.y - y, d = Math.hypot(dx, dy) || 1;
      this.hurt(e, dmg, Object.assign({ kb: { x: dx / d * 200, y: dy / d * 200 } }, o));
    });
    if (typeof FLARE_FX !== 'undefined' && Art.img.fx_f_blast && !(o && o.slow)) this.sfx('blast', x, y + r * 0.1, 0.45, r * 2.1 / FLARE_FX.blast.cw, { fade: 1 });   // огненный взрыв
    else this.fx.push({ kind: 'boom', x, y, r, t: 0, T: 0.35, color });
    for (let i = 0; i < 10 && this.parts.length < 300; i++) {
      const a = rand(0, TAU), s = rand(60, 200);
      this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, T: rand(0.3, 0.6), color, size: rand(2, 5) });
    }
    Sfx.boom();
  },

  chain(sx, sy, t, dmg, n, range, color, o = {}) {
    const hit = new Set(), pts = [sx, sy];
    let cur = t;
    for (let i = 0; i <= n && cur; i++) {
      hit.add(cur); pts.push(cur.x, cur.y);
      this.hurt(cur, dmg, o);
      let best = null, bd = range * range;
      const c = cur;
      this.query(c.x, c.y, range, e => {
        if (hit.has(e)) return;
        const d = (e.x - c.x) * (e.x - c.x) + (e.y - c.y) * (e.y - c.y);
        if (d < bd) { bd = d; best = e; }
      });
      cur = best;
    }
    const jag = [];                              // заранее ломаем линию молнии
    for (let i = 0; i < pts.length - 2; i += 2) {
      const ax = pts[i], ay = pts[i + 1], bx = pts[i + 2], by = pts[i + 3];
      for (let k = 0; k < 5; k++) { const f = k / 5; jag.push(ax + (bx - ax) * f + (k ? rand(-8, 8) : 0), ay + (by - ay) * f + (k ? rand(-8, 8) : 0)); }
    }
    jag.push(pts[pts.length - 2], pts[pts.length - 1]);
    this.fx.push({ kind: 'bolt', pts: jag, t: 0, T: o.big ? 0.35 : 0.25, color, big: o.big });
  },

  hurtPlayer(dmg) {
    const p = this.player;
    if (this.boosts.shield || p.invuln > 0) return;   // божественный щит или неуязвимость во время прыжка
    if (p.hitIframe > 0) return;                    // короткая неуязвимость после удара: толпа не «сжигает» за секунду
    if (p.wardCharges > 0) {                        // Оберег поглощает удар целиком
      p.wardCharges--; p.invuln = 0.25;
      this.fx.push({ kind: "ring", x: p.x, y: p.y, r0: 20, r1: 46, t: 0, T: 0.3, color: "#6ae8ff", follow: true });
      this.sfx('ward_wings', p.x, p.y, 0.55, 0.62, { follow: 1, glow: 1, fade: 1 });   // перед героем раскрывается крылатый щит
      this.texts.push({ x: p.x, y: p.y - 36, s: t("Блок!"), color: "#8af0ff", big: true, t: 0, T: 0.7 });
      Sfx.nova(); Haptic.imp("medium");
      return;
    }
    const d = Math.max(1, dmg - p.stats.armor);
    p.hp -= d; p.hurtT = 0.18; p.hitIframe = 0.4;
    this.sfx('blood', p.x, p.y - 10, 0.4, 0.5, { follow: 1 });   // брызги при ударе по герою (не чаще раза в 0.4 с)
    if (p.stats.thorns) {                            // шипастая броня: ответный взрыв шипов
      const td = 25 * p.stats.thorns * p.stats.might;
      this.hitCircle(p.x, p.y, 70 * p.stats.area, e => { const dx = e.x - p.x, dy = e.y - p.y, dd = Math.hypot(dx, dy) || 1; this.hurt(e, td, { kb: { x: dx / dd * 220, y: dy / dd * 220 }, noCrit: 1 }); });
      this.fx.push({ kind: "spikes", x: p.x, y: p.y, r: 60 * p.stats.area, t: 0, T: 0.35, color: "#9adf6a", seed: Math.random() * 9 });
    }
    this.shake = Math.max(this.shake, 3);
    Sfx.hurt(); Haptic.imp('light');
  },

  // ---------- Снаряды, зоны, отложенные эффекты ----------
  updateProjs(dt) {
    const pl = this.player;
    for (const p of this.projs) {
      if (p.dead) continue;
      if (p.delay > 0) { p.delay -= dt; if (!p.fixed) { p.x = pl.x + (p.ox || 0); p.y = pl.y + (p.oy || 0); } continue; }
      if (p.kind === 'boom') {
        p.age += dt; p.rot += dt * 18;
        if (p.age < 0.6) {
          const f = (1 - p.age / 0.6) * 1.6;
          p.x += p.vx * f * dt; p.y += p.vy * f * dt;
          if (p.spiral) { const c = Math.cos(2.5 * dt), s = Math.sin(2.5 * dt), vx = p.vx; p.vx = vx * c - p.vy * s; p.vy = vx * s + p.vy * c; }
        } else {
          const dx = pl.x - p.x, dy = pl.y - p.y, d = Math.hypot(dx, dy) || 1;
          const sp = Math.hypot(p.vx, p.vy) * (1 + (p.age - 0.6) * 1.5);
          p.x += dx / d * sp * dt; p.y += dy / d * sp * dt;
          if (d < 18) { p.dead = true; continue; }
        }
        if ((p.life -= dt) <= 0) { p.dead = true; continue; }
      } else {
        if (p.homing !== undefined && p.homing !== null) {
          if (p.homing.dead) p.homing = this.nearest(p.x, p.y, 1, 300)[0] || null;
          const t = p.homing;
          if (t) {
            const a = Math.atan2(p.vy, p.vx), ta = Math.atan2(t.y - p.y, t.x - p.x);
            const da = ((ta - a + Math.PI * 3) % TAU) - Math.PI, na = a + clamp(da, -(p.turn || 7) * dt, (p.turn || 7) * dt), sp = Math.hypot(p.vx, p.vy);
            p.vx = Math.cos(na) * sp; p.vy = Math.sin(na) * sp;
          }
        }
        if (p.spiralRate) { const c = Math.cos(p.spiralRate * dt), s = Math.sin(p.spiralRate * dt), vx = p.vx; p.vx = vx * c - p.vy * s; p.vy = vx * s + p.vy * c; p.rot = (p.rot || 0) + dt * 16; }   // сюрикены: спираль
        if (p.w && p.w.evo && this.parts.length < 280 && Math.random() < dt * 12) this.parts.push({ x: p.x + rand(-3, 3), y: p.y + rand(-3, 3), vx: rand(-20, 20), vy: rand(-20, 20), t: 0, T: rand(0.25, 0.4), color: p.color || '#fff', size: rand(1.5, 2.8) });   // искры эволюций
        if (p.kind === 'fireball' && this.parts.length < 300 && Math.random() < dt * 25) this.parts.push({ x: p.x + rand(-3, 3), y: p.y + rand(-3, 3), vx: -p.vx * 0.15 + rand(-25, 25), vy: -p.vy * 0.15 + rand(-25, 25) - 20, t: 0, T: rand(0.25, 0.45), color: pick(['#ffb040', '#ff6a1a', '#ffe080']), size: rand(1.5, 3) });   // искры за огненным шаром
        if (p.grav) { p.vy += p.grav * dt; p.rot = (p.rot || 0) + dt * 13 * (p.vx < 0 ? -1 : 1); }   // топор: дуга и вращение
        if (p.kind === "tornado") { const n = Math.hypot(p.vx, p.vy) || 1, wv = Math.sin(this.time * 3 + p.wobble) * 70; p.x += -p.vy / n * wv * dt; p.y += p.vx / n * wv * dt; }   // вихрь петляет
        p.x += p.vx * dt; p.y += p.vy * dt;
        if ((p.life -= dt) <= 0) { p.dead = true; if (p.onEnd) p.onEnd(p); continue; }
      }
      this.hitCircle(p.x, p.y, p.r, e => {
        if (p.dead) return;
        if (p.hitCd) { if (this.time < (e.hitAt[p.id] || 0)) return; e.hitAt[p.id] = this.time + p.hitCd; }
        else { if (p.hit.includes(e.id)) return; p.hit.push(e.id); }
        const sp = Math.hypot(p.vx, p.vy) || 1;
        if (p.pull && !e.boss) { e.kbx += (p.x - e.x) * 4; e.kby += (p.y - e.y) * 4; }   // вихрь затягивает
        this.hurt(e, p.dmg, { kb: p.pull ? null : { x: p.vx / sp * 90, y: p.vy / sp * 90 }, critBonus: p.w.s.critBonus || 0, freeze: p.freeze || 0, slow: p.slowHit || 0, leech: p.leechHit || 0 });
        if (--p.pierce <= 0) { p.dead = true; if (p.onEnd) p.onEnd(p); }
      });
    }
  },
  updateZones(dt) {
    for (const z of this.zones) {
      z.t -= dt; z.tick -= dt;
      if (z.heal && (this.player.x - z.x) ** 2 + (this.player.y - z.y) ** 2 < z.r * z.r) { const st = this.player.stats; this.player.hp = Math.min(st.maxHp, this.player.hp + st.maxHp * 0.03 * dt); }   // святой источник лечит
      if (z.tick <= 0) { z.tick = 0.4; this.hitCircle(z.x, z.y, z.r, e => this.hurt(e, z.dps * 0.4, { noCrit: 1, color: z.chill ? '#cef' : '#ffb060', slow: z.chill ? 0.6 : 0, freeze: z.freeze || 0 })); }
      if (z.t <= 0) z.dead = true;
    }
  },
  updateTimed(dt) {
    for (const x of this.timed) { x.t += dt; if (x.t >= x.T) { x.dead = true; x.land(); } }
  },
  updateEBullets(dt) {
    const p = this.player;
    for (const b of this.ebullets) {
      b.x += b.vx * dt; b.y += b.vy * dt;
      if ((b.life -= dt) <= 0) {
        b.dead = true;
        if (b.web && this.webs.length < 12) this.webs.push({ x: b.x, y: b.y, r: 42, t: 6, T: 6, rot: Math.random() * TAU });
        continue;
      }
      const dx = b.x - p.x, dy = b.y - p.y;
      if (dx * dx + dy * dy < (b.r + p.r) * (b.r + p.r)) {
        b.dead = true;
        if (b.web) { p.slowT = Math.max(p.slowT, 2.5); if (this.webs.length < 12) this.webs.push({ x: b.x, y: b.y, r: 42, t: 6, T: 6, rot: Math.random() * TAU }); }
        else { this.hurtPlayer(b.dmg); if (b.slow) p.slowT = Math.max(p.slowT, b.slow); }
      }
    }
  },
  updatePickups(dt) {
    const p = this.player, mr = p.stats.magnet * 70;
    if (this.magnetT > 0) this.magnetT -= dt;          // окно глобального магнита: новые монеты тоже летят к герою
    for (const k of this.pickups) {
      if (k.dead) continue;
      const dx = p.x - k.x, dy = p.y - k.y, d2 = dx * dx + dy * dy;
      if (k.kind === 'heart' && p.hp >= p.stats.maxHp) { k.pull = false; k.sp = 0; continue; }   // при полном HP сердце ждёт на земле
      if (!k.pull && k.kind !== 'chest' && (d2 < mr * mr || this.magnetT > 0)) k.pull = true;
      if (k.pull) {
        k.sp = (k.sp || 60) + 700 * dt;
        const d = Math.sqrt(d2) || 1;
        k.x += dx / d * k.sp * dt; k.y += dy / d * k.sp * dt;
      }
      if (d2 < (p.r + 12) * (p.r + 12)) { k.dead = true; this.collect(k); }
    }
  },
  collect(k) {
    const p = this.player;
    switch (k.kind) {
      case 'gem':
        this.gemCount--;
        p.xp += k.v * p.stats.growth * (this.boosts.xp2 ? 2 : 1);
        while (p.xp >= p.xpNext) { p.xp -= p.xpNext; p.level++; p.xpNext = this.xpReq(p.level); this.pendingLv++; }
        Sfx.gem(); break;
      case "green":
        this.green += k.v;
        this.texts.push({ x: p.x, y: p.y - 30, s: "+" + k.v, ic: "fx_green_spin", color: "#5aff9a", big: true, t: 0, T: 1 });
        Sfx.coin(); Haptic.imp("light"); break;
      case "coin":
        this.coins += k.v;
        this.texts.push({ x: p.x, y: p.y - 30, s: '+' + k.v, ic: 'fx_coin_spin', color: '#ffd23a', big: true, t: 0, T: 0.9 });
        Sfx.coin(); break;
      case 'heart': this.sfx('heal', p.x, p.y + 10, 0.6, 0.8, { follow: 1, glow: 1 }); {
        const h = Math.min(p.stats.maxHp - p.hp, p.stats.maxHp * HEART_HEAL);
        p.hp += h;
        this.texts.push({ x: p.x, y: p.y - 34, s: '+' + Math.round(h) + ' ❤', color: '#5aff8a', big: true, t: 0, T: 0.9 });
        Sfx.gem(); Haptic.imp('light'); break;
      }
      case 'magnet': for (const q of this.pickups) if (q.kind !== 'chest' && q.kind !== 'magnet' && (q.kind !== 'heart' || p.hp < p.stats.maxHp)) q.pull = true; this.magnetT = 2.5; Sfx.nova(); break;
      case 'chest': this.openChest(); break;
    }
  },
  updateFx(dt) {
    for (const f of this.fx) if ((f.t += dt) >= f.T) f.dead = true;
    for (const q of this.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.9; q.vy *= 0.9; if ((q.t += dt) >= q.T) q.dead = true; }
    for (const t of this.texts) { t.y -= 30 * dt; if ((t.t += dt) >= t.T) t.dead = true; }
  },

  // ---------- Конец забега ----------
  die() {
    const p = this.player;
    if (p.revives > 0) {
      p.revives--; p.hp = p.stats.maxHp * 0.5;
      this.hitCircle(p.x, p.y, 260, e => { const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1; this.hurt(e, 200 * p.stats.might, { kb: { x: dx / d * 500, y: dy / d * 500 }, noCrit: 1 }); });
      this.fx.push({ kind: 'ring', x: p.x, y: p.y, r0: 10, r1: 260, t: 0, T: 0.6, color: '#ffffff', follow: true });
      this.sfx('teleport', p.x, p.y + 16, 0.9, 1.4, { follow: 1, glow: 1, fade: 1, hue: 200 });
      UI.banner(t('✝️ Воскрешение!'), 'evo');
      return;
    }
    if (!this.reviveUsed) {                          // один раз за забег можно воскреснуть за золото
      this.reviveUsed = true; this.state = "revive"; Input.reset(); Haptic.note("error");
      UI.reviveOffer(this.revivePrice(), this.coins + Save.data.coins); Music.setDuck(0.3);
      return;
    }
    this.finishDeath();
  },
  // Рекорд бесконечного режима обновляется прямо во время забега и периодически сохраняется —
  // чтобы он не терялся, если игру закрыли или система выгрузила её посреди забега
  trackRecord(dt) {
    const b = Save.data.best;
    if (this.time > b.time) { b.time = Math.floor(this.time); b.kills = this.kills; }
    if ((this.recSaveT = (this.recSaveT || 0) + dt) > 10) { this.recSaveT = 0; Save.save(); }
  },
  // Цена воскрешения: ~45% награды уровня (100–230), в бесконечном — 150 + 50 за каждые 5 минут
  revivePrice() { return 75; },   // воскрешение за золото — одна цена везде
  buyRevive() {
    if (this.state !== "revive") return;
    const price = this.revivePrice();
    if (this.coins + Save.data.coins < price) return;
    const fromRun = Math.min(this.coins, price);   // сначала тратим монеты забега, потом накопленные
    this.coins -= fromRun; Save.data.coins -= price - fromRun; Save.save();
    const p = this.player; p.hp = p.stats.maxHp * 0.5; p.invuln = 2; p.poisonT = 0;
    this.hitCircle(p.x, p.y, 260, e => { const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1; this.hurt(e, 150 * p.stats.might, { kb: { x: dx / d * 520, y: dy / d * 520 }, noCrit: 1 }); });
    for (const b of this.ebullets) b.dead = true;
    this.fx.push({ kind: "ring", x: p.x, y: p.y, r0: 10, r1: 260, t: 0, T: 0.6, color: "#ffd23a", follow: true });
    this.burst(p.x, p.y, "#ffd23a", 24); Sfx.evo(); Haptic.note("success");
    this.sfx('teleport', p.x, p.y + 16, 0.9, 1.4, { follow: 1, glow: 1, fade: 1, hue: 200 });   // золотой столб света
    this.state = "playing"; UI.hud(true); UI.banner(t("✨ Воскрешение!"), "evo"); Music.setDuck(1);
  },
  declineRevive() { if (this.state === "revive") this.finishDeath(); },
  finishDeath() {
    const p = this.player;
    Haptic.note('error');
    const dl = Art.animLen('hero_' + p.hero, 'death') || (Art.has('hero_' + p.hero) ? 0.8 : 0);   // без анимации смерти — просто растворяется
    if (dl) { this.state = 'dying'; this.dyingLen = this.dyingT = dl + 0.7; UI.hud(false); Input.reset(); return; }
    this.end(false);
  },
  end(win, quit) {
    if (this.state === 'over') return;
    this.state = 'over';
    Music.stop();
    const d = Save.data, S = this.stage;
    // победа — полная награда; поражение — утешительные монеты: до 25% награды пропорционально продержанному времени
    const reward = this.endless ? 0 : win ? S.reward : Math.round(S.reward * 0.25 * Math.min(1, this.time / S.duration));
    const unlocked = [];
    if (win && !this.endless) {
      if (!d.cleared.includes(S.id)) d.cleared.push(S.id);
      for (const id of S.unlocks) if (!d.skills.includes(id)) { d.skills.push(id); unlocked.push(id); }
    }
    let record = false;
    if (this.endless && this.time > this.bestAtStart) { if (this.time >= d.best.time) d.best = { time: Math.floor(this.time), kills: this.kills }; record = true; }
    d.coins += this.coins + reward;
    d.stats.runs++; d.stats.kills += this.kills; d.stats.coins += this.coins + reward;
    Save.save();
    UI.hud(false);
    UI.results({ win, quit, time: this.time, kills: this.kills, level: this.player.level, coins: this.coins, reward, unlocked, record, evos: this.newEvos });
  },

  // ---------- Отрисовка ----------
  draw() {
    const c = this.ctx, W = this.cv.width, H = this.cv.height;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.imageSmoothingEnabled = true;
    if (!this.player || this.state === 'menu') { this.drawMenuBg(c, W, H); return; }
    const p = this.player, z = this.zoom * this.dpr;
    let cx = p.x, cy = p.y;
    if (this.shake > 0) { cx += rand(-1, 1) * this.shake; cy += rand(-1, 1) * this.shake; }
    c.setTransform(z, 0, 0, z, W / 2 - cx * z, H / 2 - cy * z);
    const vw = this.viewW, vh = this.viewH, L = cx - vw / 2, T = cy - vh / 2;
    c.fillStyle = DBG.has('noground') ? '#3a4a2a' : this.groundPat; c.fillRect(L - 4, T - 4, vw + 8, vh + 8);
    const vis = World.visible(L, T, vw, vh);
    World.drawLow(c, vis.low, this.time);            // озёра, камни, брёвна, стены руин
    World.drawChests(c, this.time, L, T, vw, vh);

    // зоны огня/льда
    for (const zn of this.zones) {
      const a = Math.min(1, zn.t / 0.5) * (0.28 + Math.sin(this.time * 12 + zn.x) * 0.06);
      if (zn.fire && Art.img.fx_fire_ring) {         // огненная зона: кольцо пламени (анимация) и огонь внутри
        const im = Art.img.fx_fire_ring, fw = im.width / 6, fh = im.height, fade = Math.min(1, zn.t / 0.5, (zn.T - zn.t) / 0.2 + 0.3);
        const PP = [0, 1, 2, 3, 4, 3, 2, 1], ph = this.time * 11 + zn.x * 0.37, fr = n => zn.t < 0.35 ? 5 : PP[((Math.floor(ph + n) % 8) + 8) % 8];
        c.globalAlpha = fade * 0.9; c.drawImage(World.glowSpr('#ff9a3a'), zn.x - zn.r, zn.y - zn.r * 0.8, zn.r * 2, zn.r * 1.6);   // жар внутри (готовый спрайт вместо градиента на каждый кадр)
        for (const [k, n, al] of [[1.25, 0, 1], [0.8, 3, 0.9], [0.42, 5, 0.85]]) {
          const w = zn.r * 2 * k, h = w * fh / fw; c.globalAlpha = fade * al;
          c.drawImage(im, fr(n) * fw, 0, fw, fh, zn.x - w / 2, zn.y - h / 2, w, h);
        }
        continue;
      }
      if (zn.holy) {                                  // святая лужа: мягкое сияние, по воде расходятся круги, вверх летят искры
        const f = Math.min(1, zn.t / 0.5, (zn.T - zn.t) / 0.25), R = zn.r;
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = f * 0.8; c.drawImage(World.glowSpr(hexCol(zn.color)), zn.x - R * 1.15, zn.y - R * 0.92, R * 2.3, R * 1.84);
        c.strokeStyle = '#e8f8ff'; c.lineWidth = 1.5;
        for (let i = 0; i < 2; i++) { const ph = (this.time * 0.9 + i * 0.5 + zn.x * 0.013) % 1, rr = R * (0.2 + ph * 0.8); c.globalAlpha = f * (1 - ph) * 0.8; c.beginPath(); c.ellipse(zn.x, zn.y, rr, rr * 0.8, 0, 0, TAU); c.stroke(); }
        const st = Art.img.fx_f_star;
        if (st) for (let i = 0; i < 3; i++) { const an = i * 2.1 + zn.y, ph = (this.time * 0.8 + i * 0.33) % 1, S = 10 * (1 - ph * 0.5); c.globalAlpha = f * (1 - ph); c.drawImage(st, 5 * FLARE_FX.star.cw, 0, FLARE_FX.star.cw, FLARE_FX.star.ch, zn.x + Math.cos(an) * R * 0.5 - S / 2, zn.y + Math.sin(an) * R * 0.4 - ph * 26 - S / 2, S, S); }
        c.globalCompositeOperation = 'source-over';
        c.globalAlpha = f * 0.45; c.strokeStyle = zn.color; c.beginPath(); c.ellipse(zn.x, zn.y, R, R * 0.8, 0, 0, TAU); c.stroke();   // граница лужи
        continue;
      }
      if (zn.cloud) {                                 // ядовитое облако следа: несколько клубов
        const puff = World.glowSpr(hexCol(zn.color));   // клубы газа: мягкие пятна без краёв, медленно кружат
        for (let i = 0; i < 3; i++) { const an = zn.x * 0.1 + i * 2.1 + this.time * 0.8, R = zn.r * (1.05 - i * 0.15); c.globalAlpha = Math.min(1, a * (2.6 - i * 0.5)); c.drawImage(puff, zn.x + Math.cos(an) * zn.r * 0.35 - R, zn.y + Math.sin(an) * zn.r * 0.25 - R * 0.85, R * 2, R * 1.7); }
        const sk = zn.skull && Art.img['fx_f_' + zn.skull];
        if (sk) { const m = FLARE_FX[zn.skull], i = Math.min(m.n - 1, Math.floor((1 - zn.t / zn.T) * m.n)), S = zn.r * 1.9 / m.ch; c.globalAlpha = 0.85; c.drawImage(sk, i * m.cw, 0, m.cw, m.ch, zn.x - m.cw * S / 2, zn.y - m.ch * S * 0.75, m.cw * S, m.ch * S); c.globalAlpha = 1; }
        else if (zn.icon && Art.img[zn.icon]) { const S = zn.r * 1.7; c.globalAlpha = Math.min(1, a * 2.2); c.drawImage(Art.img[zn.icon], zn.x - S / 2, zn.y - S / 2 - 4, S, S); }   // Чума: череп в облаке
        continue;
      }
      c.globalAlpha = Math.min(1, a * 2.4); c.drawImage(World.glowSpr(hexCol(zn.color)), zn.x - zn.r * 1.1, zn.y - zn.r * 0.9, zn.r * 2.2, zn.r * 1.8);   // зона: мягкое пятно и тонкая граница
      c.globalAlpha = a * 1.3; c.strokeStyle = zn.color; c.lineWidth = 1.5; c.beginPath(); c.ellipse(zn.x, zn.y, zn.r, zn.r * 0.8, 0, 0, TAU); c.stroke();
    }
    c.globalAlpha = 1;
    for (const w of p.weapons) { const b = WB[w.def.type]; if (b.under && b.draw) b.draw(this, c, w); }

    // метки метеоров
    for (const x of this.timed) if (x.kind === 'meteor' && x.t >= 0) {
      const k = x.t / x.T;
      c.strokeStyle = 'rgba(180,90,255,' + (0.3 + k * 0.5) + ')'; c.lineWidth = 2;
      c.beginPath(); c.arc(x.x, x.y, x.r * k, 0, TAU); c.stroke();
    }

    // подбираемое
    for (const k of this.pickups) {
      if (k.x < L - 20 || k.x > L + vw + 20 || k.y < T - 20 || k.y > T + vh + 20) continue;
      if (this.drawPickupArt(c, k)) continue;
      if (k.kind === 'gem') {
        const col = k.v < 3 ? '#5ab4ff' : k.v < 10 ? '#5aff8a' : '#ff5a7a', s = k.v < 3 ? 4 : k.v < 10 ? 5.5 : 7;
        c.fillStyle = col; c.beginPath(); c.moveTo(k.x, k.y - s * 1.3); c.lineTo(k.x + s, k.y); c.lineTo(k.x, k.y + s * 1.3); c.lineTo(k.x - s, k.y); c.fill();
        c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(k.x - s * 0.35, k.y - s * 0.6, s * 0.4, s * 0.4);
      } else if (k.kind === 'coin') {
        const sq = Math.abs(Math.cos(this.time * 4 + k.x));
        c.fillStyle = '#b8860b'; c.beginPath(); c.ellipse(k.x, k.y, 6 * sq + 1, 6, 0, 0, TAU); c.fill();
        c.fillStyle = '#ffd23a'; c.beginPath(); c.ellipse(k.x, k.y, 4.5 * sq + 0.5, 4.5, 0, 0, TAU); c.fill();
      } else if (k.kind === 'chest') {
        const b = Math.sin(this.time * 5) * 2;
        c.fillStyle = 'rgba(255,210,60,.25)'; c.beginPath(); c.arc(k.x, k.y, 20 + b, 0, TAU); c.fill();
        c.fillStyle = '#7a4a1e'; c.fillRect(k.x - 11, k.y - 8 + b, 22, 16);
        c.fillStyle = '#9a6028'; c.fillRect(k.x - 11, k.y - 8 + b, 22, 6);
        c.fillStyle = '#ffd23a'; c.fillRect(k.x - 11, k.y - 3 + b, 22, 2); c.fillRect(k.x - 2, k.y - 5 + b, 4, 6);
      } else if (k.kind === 'green') {
        const sq = Math.abs(Math.cos(this.time * 4 + k.y));
        c.fillStyle = 'rgba(80,255,150,.25)'; c.beginPath(); c.arc(k.x, k.y, 11, 0, TAU); c.fill();
        c.fillStyle = '#138a48'; c.beginPath(); c.ellipse(k.x, k.y, 7 * sq + 1, 7, 0, 0, TAU); c.fill();
        c.fillStyle = '#3cff8c'; c.beginPath(); c.ellipse(k.x, k.y, 5.2 * sq + 0.5, 5.2, 0, 0, TAU); c.fill();
        c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(k.x - 2 * sq, k.y - 3, 1.5, 2.5);
      } else if (k.kind === 'heart') {
        const b = Math.sin(this.time * 4 + k.x) * 2, s = 1 + Math.sin(this.time * 6) * 0.08, y = k.y + b;
        c.fillStyle = 'rgba(255,60,90,.22)'; c.beginPath(); c.arc(k.x, y, 16 * s, 0, TAU); c.fill();
        const heart = (r, col) => {
          c.fillStyle = col; c.beginPath();
          c.moveTo(k.x, y + r * 0.9);
          c.bezierCurveTo(k.x - r * 1.3, y, k.x - r * 0.9, y - r * 1.1, k.x, y - r * 0.45);
          c.bezierCurveTo(k.x + r * 0.9, y - r * 1.1, k.x + r * 1.3, y, k.x, y + r * 0.9);
          c.fill();
        };
        heart(9 * s, '#5a0a18'); heart(7.5 * s, '#ff3a5a');
        c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.arc(k.x - 3 * s, y - 3.5 * s, 1.8 * s, 0, TAU); c.fill();
      } else {
        c.font = '18px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('🧲', k.x, k.y);
      }
    }

    // лавовый след
    for (const l of this.lava) {
      const a = Math.min(1, l.t / 0.8) * (0.55 + Math.sin(this.time * 7 + l.ph) * 0.12);
      if (l.spore) {                                 // ядовитое облако споровика
        c.globalAlpha = a * 0.7; c.fillStyle = "#5a9a2a"; c.beginPath(); c.arc(l.x, l.y, l.r, 0, TAU); c.fill();
        c.fillStyle = "#9aff5a"; for (let i = 0; i < 5; i++) { const an = l.ph + i * 1.3 + this.time * 0.6, rr = l.r * (0.3 + 0.12 * i); c.globalAlpha = a * 0.45; c.beginPath(); c.arc(l.x + Math.cos(an) * rr, l.y + Math.sin(an) * rr * 0.7, l.r * 0.28, 0, TAU); c.fill(); }
        c.globalAlpha = 1; continue;
      }
      c.globalAlpha = a; c.fillStyle = '#7a1a08'; c.beginPath(); c.ellipse(l.x, l.y, l.r, l.r * 0.6, 0, 0, TAU); c.fill();
      c.fillStyle = '#ff6a1a'; c.beginPath(); c.ellipse(l.x, l.y, l.r * 0.7, l.r * 0.4, 0, 0, TAU); c.fill();
      c.fillStyle = '#ffd060'; c.beginPath(); c.ellipse(l.x - 3, l.y - 1, l.r * 0.3, l.r * 0.16, 0, 0, TAU); c.fill();
      c.globalAlpha = 1;
    }
    // паутина
    for (const w of this.webs) {
      if (Art.img.fx_web) {                          // паутина из арта
        const im = Art.img.fx_web, s = w.r * 2.2; c.globalAlpha = Math.min(1, w.t / 1) * 0.85;
        c.save(); c.translate(w.x, w.y); c.rotate(w.rot); c.scale(1, 0.85); c.drawImage(im, -s / 2, -s / 2, s, s); c.restore(); c.globalAlpha = 1; continue;
      }
      c.globalAlpha = Math.min(1, w.t / 1) * 0.7; c.strokeStyle = '#e8e0ff'; c.lineWidth = 1;
      c.beginPath();
      for (let i = 0; i < 8; i++) { const a = w.rot + i * TAU / 8; c.moveTo(w.x, w.y); c.lineTo(w.x + Math.cos(a) * w.r, w.y + Math.sin(a) * w.r * 0.8); }
      for (let k = 1; k <= 3; k++) c.ellipse(w.x, w.y, w.r * k / 3, w.r * k / 3 * 0.8, 0, 0, TAU);
      c.stroke(); c.globalAlpha = 1;
    }
    // трупы: анимация смерти, затем растворение
    for (const q of this.corpses) {
      const fade = q.t < q.dl ? 1 : 1 - (q.t - q.dl) / (q.T - q.dl);
      const deathArt = ART[q.key] && ART[q.key].anims && ART[q.key].anims.death;
      if (deathArt) Art.draw(c, q.key, q.x, q.y, q.size, { flip: q.flip, anim: 'death', progress: q.dl ? Math.min(1, q.t / q.dl) : 1, alpha: fade });
      else if (q.boss) Art.draw(c, q.key, q.x, q.y + q.size * 0.1 * (1 - fade), q.size * (0.6 + 0.4 * fade), { flip: q.flip, alpha: fade });
      else Art.draw(c, q.key, q.x, q.y, q.size, { flip: q.flip, anim: 'walk', alpha: fade });
    }

    // враги, герой и высокие объекты (деревья, колонны...) — одна сортировка по глубине (по линии ног)
    const HS = Art.has('hero_' + p.hero) && ART['hero_' + p.hero].anims ? 54 : 42;
    const depth = [{ y: p.y + HS * 0.45, k: 0, o: p }];
    for (const e of this.enemies) {
      if (e.x < L - e.size || e.x > L + vw + e.size || e.y < T - e.size || e.y > T + vh + e.size) continue;
      depth.push({ y: e.y + e.size * 0.42, k: 1, o: e });
    }
    for (const o of vis.tall) depth.push({ y: o.y, k: 2, o });
    depth.sort((a, b) => a.y - b.y);
    // тени врагов — одним путём и одной заливкой, до спрайтов (тень лежит на земле): 150 отдельных заливок заметно грузили отрисовку
    if (!DBG.has('noenemy')) {
      c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath();
      for (const it of depth) if (it.k === 1) { const e = it.o, rx = e.r * (Art.has(this.enemyKey(e)) ? 0.8 : 1.05), sy = e.y + e.size * 0.42; c.moveTo(e.x + rx, sy); c.ellipse(e.x, sy, rx, e.r * 0.3, 0, 0, TAU); }
      c.fill();
    }
    for (const it of depth) {
      if (it.k === 1) { if (!DBG.has('noenemy')) this.drawEnemy(c, it.o, p); }
      else if (it.k === 2) World.drawTall(c, it.o, p);
      else this.drawPlayer(c, p, HS);
    }

    // снаряды
    for (const q of this.projs) {
      if (q.delay > 0) continue;
      if (q.w && q.w.evo && !(q.w.id === 'cyclone' || q.w.id === 'frost_star' || q.w.id === 'hurricane')) this.drawEvoGlow(c, q);   // у снарядов-иконок своё свечение
      if (q.w && this.drawEvoSprite(c, q)) continue;
      if (q.kind === 'knife' && Art.img.fx_f_knife) {       // метательный нож: 8 кадров вращения
        const im = Art.img.fx_f_knife, m = FLARE_FX.knife, i = Math.floor((this.time * 24 + q.x * 0.1) % m.n), S = 0.75 + q.r * 0.05;
        c.drawImage(im, Math.abs(i) * m.cw, 0, m.cw, m.ch, q.x - m.cw * S / 2, q.y - m.ch * S / 2, m.cw * S, m.ch * S);
      } else if (q.kind === 'knife') {
        c.save(); c.translate(q.x, q.y); c.rotate(q.rot);
        c.fillStyle = q.color; c.beginPath(); c.moveTo(q.r * 2.2, 0); c.lineTo(-q.r, -q.r * 0.6); c.lineTo(-q.r, q.r * 0.6); c.fill(); c.strokeStyle = "rgba(20,25,40,.8)"; c.lineWidth = 1.2; c.stroke();
        c.fillStyle = '#7a5a3a'; c.fillRect(-q.r * 1.8, -q.r * 0.35, q.r * 0.9, q.r * 0.7);
        c.restore();
      } else if (q.kind === 'boom') {
        c.save(); c.translate(q.x, q.y); c.rotate(q.rot);
        const bi = Art.img.fx_boomerang;
        if (bi) {                                      // арт бумеранга (светится, крутится)
          const s = q.r * 2.8, w = s * bi.width / bi.height;
          c.drawImage(bi, -w / 2, -s / 2, w, s);
        } else {
          c.strokeStyle = q.color; c.lineWidth = q.r * 0.45; c.lineCap = 'round';
          c.beginPath(); c.moveTo(-q.r, -q.r * 0.3); c.lineTo(0, q.r * 0.4); c.lineTo(q.r, -q.r * 0.3); c.stroke();
        }
        c.restore(); c.lineCap = 'butt';
      } else if (q.kind === 'axe') {                      // боевой топор: крутится в полёте
        const ai = Art.img.fx_axe, S = q.r * 3.4;
        c.save(); c.translate(q.x, q.y); c.rotate(q.rot || 0);
        if (ai) c.drawImage(ai, -S / 2, -S / 2, S, S * ai.height / ai.width);
        else { c.fillStyle = '#6a4a2a'; c.fillRect(-2, -q.r, 4, q.r * 2); c.fillStyle = q.color; c.beginPath(); c.moveTo(0, -q.r); c.quadraticCurveTo(q.r * 1.2, -q.r * 0.6, q.r * 0.6, 0); c.lineTo(0, -q.r * 0.3); c.fill(); }
        c.restore();
      } else if (q.kind === 'fireball' && Art.img.fx_fireball) {   // огненный шар из арта: пульсирует и трепещет
        if (q.w && q.w.evo && Art.img.fx_f_spark_fireball) {   // Феникс: искрящееся пламя вокруг шара
          const si = Art.img.fx_f_spark_fireball, sm = FLARE_FX.spark_fireball, fi = Math.floor(this.time * 20 + q.x * 0.03) % sm.n, S2 = q.r * 5 / sm.ch;
          c.globalCompositeOperation = 'lighter'; c.drawImage(si, Math.abs(fi) * sm.cw, 0, sm.cw, sm.ch, q.x - sm.cw * S2 / 2, q.y - sm.ch * S2 / 2, sm.cw * S2, sm.ch * S2); c.globalCompositeOperation = 'source-over';
        }
        const im = Art.img.fx_fireball, H = q.r * 3.4 * (1 + Math.sin(this.time * 31 + q.x) * 0.07), W = H * im.width / im.height;
        const g = c.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.r * 2.4); g.addColorStop(0, 'rgba(255,190,60,.55)'); g.addColorStop(1, 'rgba(255,90,0,0)');
        c.fillStyle = g; c.beginPath(); c.arc(q.x, q.y, q.r * 2.4, 0, TAU); c.fill();
        c.save(); c.translate(q.x, q.y); c.rotate(Math.atan2(q.vy, q.vx)); c.scale(1 + Math.sin(this.time * 19 + q.y) * 0.08, 1 + Math.sin(this.time * 27 + q.x) * 0.1);
        c.drawImage(im, -(W - H * 0.5), -H / 2, W, H); c.restore();
      } else if (q.kind === 'fireball') {                 // огненный шар: ядро, пламя и хвост
        const R = q.r, sp = Math.hypot(q.vx, q.vy) || 1, ux = q.vx / sp, uy = q.vy / sp;
        for (let i = 4; i >= 1; i--) { c.globalAlpha = 0.18 * (5 - i) / 4; c.fillStyle = i > 2 ? '#ff4a10' : '#ff9a2a'; c.beginPath(); c.arc(q.x - ux * R * i * 0.9, q.y - uy * R * i * 0.9, R * (1.1 - i * 0.15), 0, TAU); c.fill(); }
        c.globalAlpha = 0.35; c.fillStyle = '#ff6a1a'; c.beginPath(); c.arc(q.x, q.y, R * 1.8, 0, TAU); c.fill();
        c.globalAlpha = 1; c.fillStyle = '#ff8a2a'; c.beginPath(); c.arc(q.x, q.y, R, 0, TAU); c.fill();
        c.fillStyle = '#fff2b0'; c.beginPath(); c.arc(q.x + ux * R * 0.2, q.y + uy * R * 0.2, R * 0.55, 0, TAU); c.fill();
      } else if (q.kind === 'shuriken') {                 // сюрикен: стальная звезда (рисуется один раз в спрайт) и размытый след вращения
        const R = q.r * 1.35, sp = this.shurikenSpr();
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35; c.drawImage(World.glowSpr(hexCol(q.color)), q.x - R * 1.5, q.y - R * 1.5, R * 3, R * 3); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
        c.save(); c.translate(q.x, q.y); c.rotate(q.rot || 0); c.drawImage(sp, -R, -R, R * 2, R * 2); c.restore();
      } else if (q.kind === 'lance' && Art.img.fx_f_icicle) {   // ледяное копьё: сосулька из FLARE
        const im = Art.img.fx_f_icicle, m = FLARE_FX.icicle, i = Math.floor(this.time * 12) % m.n, S = 0.9 + q.r * 0.06;
        c.save(); c.translate(q.x, q.y); c.rotate(Math.atan2(q.vy, q.vx));
        c.drawImage(im, i * m.cw, 0, m.cw, m.ch, -m.cw * S * 0.6, -m.ch * S / 2, m.cw * S, m.ch * S); c.restore();
      } else if (q.kind === 'lance') {                    // ледяное копьё
        c.save(); c.translate(q.x, q.y); c.rotate(q.rot); const L = q.r * 3;
        c.fillStyle = q.color + '44'; c.beginPath(); c.ellipse(-L * 0.3, 0, L, q.r * 0.9, 0, 0, TAU); c.fill();
        c.fillStyle = '#e8faff'; c.strokeStyle = '#1a4060'; c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(L, 0); c.lineTo(0, -q.r * 0.6); c.lineTo(-L, 0); c.lineTo(0, q.r * 0.6); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = q.color; c.beginPath(); c.moveTo(L, 0); c.lineTo(L * 0.3, -q.r * 0.35); c.lineTo(L * 0.3, q.r * 0.35); c.fill(); c.restore();
      } else if (q.kind === 'tornado') {                  // вихрь: закрученные дуги
        if (Art.img.fx_f_leaves) {                        // кружащиеся листья (кадры туда-обратно, чтобы цикл не дёргался)
          const im = Art.img.fx_f_leaves, m = FLARE_FX.leaves, n2 = m.n * 2 - 2, j = Math.floor(this.time * 16 + (q.wobble || 0) * 7) % n2, i = j < m.n ? j : n2 - j, S = q.r * 3.2 / m.cw;
          c.drawImage(im, i * m.cw, 0, m.cw, m.ch, q.x - m.cw * S / 2, q.y - m.ch * S * 0.62, m.cw * S, m.ch * S);
        }
        const R = q.r, a0 = this.time * 9;
        for (let i = 0; i < 4; i++) {                     // потоки ветра вокруг листьев — тонкие и полупрозрачные
          c.strokeStyle = i % 2 ? q.color : '#ffffff'; c.globalAlpha = 0.45 - i * 0.08; c.lineWidth = 2 - i * 0.3;
          c.beginPath(); c.ellipse(q.x, q.y - i * R * 0.18, R * (1 - i * 0.18), R * 0.5 * (1 - i * 0.15), 0, a0 + i, a0 + i + 4.2); c.stroke();
        }
        c.globalAlpha = 1;
      } else if (q.kind === 'bat') {                      // летучая мышь из стаи
        const bs = Art.img[q.w && q.w.evo ? 'fx_bats_glow' : 'fx_bats'];
        if (bs) {                                   // мышь из арта: 4 кадра полёта, смотрит по ходу движения
          const fw = bs.width / 4, f = Math.floor(this.time * 10 + (q.id || q.x) * 0.37) % 4, W = q.w && q.w.evo ? 46 : 40, H = W * bs.height / fw;
          c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5; c.drawImage(World.glowSpr(q.w && q.w.evo ? '#ff3a5a' : '#a05aff'), q.x - W * 0.5, q.y - W * 0.45, W, W * 0.9); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;   // мягкое свечение вместо плоского круга
          const mb = q.vx < 0 && Art.mirror('fx_bats', bs);   // мышь смотрит по ходу полёта
          c.drawImage(mb || bs, Math.abs(f) * fw, 0, fw, bs.height, q.x - W / 2, q.y - H / 2, W, H);
          continue;
        }
        const bi = Art.img.enemy_bat, fl = Math.floor(this.time * 14 + q.x) % 2;
        c.save(); c.translate(q.x, q.y); if (q.vx < 0) c.scale(-1, 1);
        c.fillStyle = q.color + '40'; c.beginPath(); c.arc(0, 0, 11, 0, TAU); c.fill();
        if (bi) c.drawImage(bi, fl * 103, 0, 103, 67, -14, -9, 28, 18);
        else { c.fillStyle = q.color; c.beginPath(); c.ellipse(0, 0, 10, 4, 0, 0, TAU); c.fill(); }
        c.restore();
      } else if (q.kind === 'bolt' && Art.img.fx_arrow) {   // магическая стрела: летит остриём вперёд
        const im = Art.img.fx_arrow, s = 20 + q.r * 2.2;
        c.save(); c.translate(q.x, q.y); c.rotate(Math.atan2(q.vy, q.vx) + Math.PI / 4);   // на картинке остриё смотрит вправо-вверх
        c.drawImage(im, -s / 2, -s / 2, s, s * im.height / im.width);
        c.restore();
      } else if (q.kind === 'dbolt' && q.tracer) {   // пуля боевого дрона: светящийся трассер
        const sp = Math.hypot(q.vx, q.vy) || 1, tx = q.x - q.vx / sp * 18, ty = q.y - q.vy / sp * 18;
        c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
        c.strokeStyle = q.color; c.globalAlpha = 0.45; c.lineWidth = 5; c.beginPath(); c.moveTo(tx, ty); c.lineTo(q.x, q.y); c.stroke();
        c.strokeStyle = '#fff4d0'; c.globalAlpha = 1; c.lineWidth = 2; c.stroke();
        c.globalCompositeOperation = 'source-over'; c.lineCap = 'butt';
      } else if (q.kind === 'dbolt' && Art.img.fx_f_lball) {   // пуля тотема: шаровая молния
        const im = Art.img.fx_f_lball, m = FLARE_FX.lball, i = Math.floor(this.time * 30 + q.x * 0.05) % m.n, S = (q.r * 5) / m.ch;
        c.globalCompositeOperation = 'lighter'; c.drawImage(im, Math.abs(i) * m.cw, 0, m.cw, m.ch, q.x - m.cw * S / 2, q.y - m.ch * S / 2, m.cw * S, m.ch * S); c.globalCompositeOperation = 'source-over';
      } else {
        c.fillStyle = q.color + '55'; c.beginPath(); c.arc(q.x, q.y, q.r * 1.8, 0, TAU); c.fill();
        c.fillStyle = q.color; c.beginPath(); c.arc(q.x, q.y, q.r, 0, TAU); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(q.x, q.y, q.r * 0.45, 0, TAU); c.fill();
      }
    }
    c.shadowBlur = 0;
    for (const w of p.weapons) { const b = WB[w.def.type]; if (!b.under && b.draw) b.draw(this, c, w); }

    // бомбы в полёте и падающие метеоры
    for (const x of this.timed) {
      if (x.t < 0) continue;
      const k = x.t / x.T;
      if (x.kind === "spike") {                         // метка кровавых шипов
        c.strokeStyle = x.color; c.globalAlpha = 0.4 + k * 0.5; c.lineWidth = 2; c.beginPath(); c.arc(x.x, x.y, x.r * k, 0, TAU); c.stroke();
        c.fillStyle = x.color; c.globalAlpha = k * 0.2; c.fill(); c.globalAlpha = 1;
      } else if (x.kind === "star") {                   // падающая звезда
        const sy = x.y - (1 - k) * 260, sx = x.x - (1 - k) * 60;
        if (x.evo) { const gg = c.createRadialGradient(sx, sy, 0, sx, sy, 22); gg.addColorStop(0, x.color); gg.addColorStop(1, x.color + '00'); c.globalCompositeOperation = 'lighter'; c.fillStyle = gg; c.beginPath(); c.arc(sx, sy, 22, 0, TAU); c.fill(); c.globalCompositeOperation = 'source-over'; }   // Звёздный дождь: свечение
        const tg = c.createLinearGradient(sx, sy, sx - 18, sy - 60); tg.addColorStop(0, hexCol(x.color) + 'cc'); tg.addColorStop(1, hexCol(x.color) + '00');   // хвост звезды тает к концу
        c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.strokeStyle = tg; c.lineWidth = 4; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx - 18, sy - 60); c.stroke(); c.globalCompositeOperation = 'source-over'; c.lineCap = 'butt';
        if (Art.img.fx_f_star) { const im = Art.img.fx_f_star, m = FLARE_FX.star, i = 3 + Math.floor(this.time * 16 + x.x) % 5, S = x.evo ? 0.75 : 0.55;   // сверкающая звезда
          c.globalCompositeOperation = 'lighter'; c.drawImage(im, Math.abs(i) * m.cw, 0, m.cw, m.ch, sx - m.cw * S / 2, sy - m.ch * S / 2, m.cw * S, m.ch * S); c.globalCompositeOperation = 'source-over'; }
        else { c.fillStyle = "#ffffff"; c.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? 3 : 8; c.lineTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr); } c.closePath(); c.fill();
        c.strokeStyle = x.color; c.lineWidth = 1.5; c.stroke(); }
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.12 + k * 0.4; c.drawImage(World.glowSpr(hexCol(x.color)), x.x - x.r, x.y - x.r * 0.8, x.r * 2, x.r * 1.6); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;   // место падения светлеет
      } else       if (x.kind === 'elob') {                          // бомба гнома-подрывника: метка на земле + летящая бомба
        c.strokeStyle = 'rgba(255,170,60,' + (0.35 + k * 0.5) + ')'; c.lineWidth = 2;
        c.beginPath(); c.arc(x.x, x.y, x.r, 0, TAU); c.stroke();
        c.fillStyle = 'rgba(255,120,30,' + k * 0.2 + ')'; c.fill();
        const bx = x.sx + (x.x - x.sx) * k, by = x.sy + (x.y - x.sy) * k - Math.sin(Math.PI * k) * 90, bi = Art.img.fx_bomb;
        if (bi) { const s = 22; c.save(); c.translate(bx, by); c.rotate(-k * 8); c.drawImage(bi, -s / 2, -s / 2, s, s); c.restore(); }
        else { c.fillStyle = '#222'; c.beginPath(); c.arc(bx, by, 6, 0, TAU); c.fill(); }
      } else if (x.kind === 'lob') {
        const bx = x.sx + (x.x - x.sx) * k, by = x.sy + (x.y - x.sy) * k - Math.sin(Math.PI * k) * 60, bi = Art.img[x.sprite || 'fx_bomb'];
        c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(x.sx + (x.x - x.sx) * k, x.sy + (x.y - x.sy) * k + 6, 7, 3, 0, 0, TAU); c.fill();
        if (bi) { const s = x.sprite ? 14 : 24; c.save(); c.translate(bx, by); c.rotate(k * 7); c.drawImage(bi, -s / 2, -s / 2, s, s * bi.height / bi.width); c.restore(); }   // огненная бомба крутится в полёте
        else { c.fillStyle = '#222'; c.beginPath(); c.arc(bx, by, 6, 0, TAU); c.fill(); c.fillStyle = x.color; c.beginPath(); c.arc(bx + 3, by - 5, 2.5, 0, TAU); c.fill(); }
      } else if (x.kind === 'meteor') {
        const my = x.y - (1 - k) * 320, mx = x.x + (1 - k) * 90, mi = Art.img.fx_meteor;
        if (mi) {                                         // фиолетовый метеор: камень внизу слева картинки, хвост вверх-вправо
          if (x.evo) { const gg = c.createRadialGradient(mx, my, 0, mx, my, 40); gg.addColorStop(0, 'rgba(255,90,40,.55)'); gg.addColorStop(1, 'rgba(255,60,20,0)'); c.fillStyle = gg; c.beginPath(); c.arc(mx, my, 40, 0, TAU); c.fill(); }   // Армагеддон: крупнее и в огне
          const s = x.evo ? 92 : 70; c.save(); c.translate(mx, my); c.rotate(-0.17);
          c.drawImage(mi, -s * 0.3, -s * 0.72, s, s * mi.height / mi.width); c.restore();
        } else {
          c.strokeStyle = 'rgba(255,140,40,.5)'; c.lineWidth = 8; c.beginPath(); c.moveTo(mx, my); c.lineTo(mx + 40, my - 120); c.stroke();
          c.fillStyle = '#ff7a2a'; c.beginPath(); c.arc(mx, my, 10, 0, TAU); c.fill();
        }
      }
    }

    // вражеские снаряды
    if (this.bright) { c.shadowColor = "rgba(8,12,30,.9)"; c.shadowBlur = 5; }
    for (const b of this.ebullets) {
      if (this.drawEBulletArt(c, b)) continue;
      if (b.arrow) {                                 // стрела скелета-лучника
        const a = Math.atan2(b.vy, b.vx); c.save(); c.translate(b.x, b.y); c.rotate(a);
        const tr = c.createLinearGradient(-30, 0, 0, 0); tr.addColorStop(0, "rgba(255,40,40,0)"); tr.addColorStop(1, "rgba(255,50,40,.6)");   // красный шлейф
        c.strokeStyle = tr; c.lineWidth = 6; c.beginPath(); c.moveTo(-30, 0); c.lineTo(0, 0); c.stroke();
        c.strokeStyle = "#140a08"; c.lineWidth = 4; c.beginPath(); c.moveTo(-15, 0); c.lineTo(7, 0); c.stroke();      // тёмный контур древка
        c.strokeStyle = "#8a5a30"; c.lineWidth = 2; c.beginPath(); c.moveTo(-14, 0); c.lineTo(6, 0); c.stroke();
        c.fillStyle = "#ff3a3a"; c.strokeStyle = "#140a08"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(13, 0); c.lineTo(4, -5); c.lineTo(4, 5); c.closePath(); c.fill(); c.stroke();   // красный наконечник
        c.fillStyle = "#e8e0d0"; c.beginPath(); c.moveTo(-15, 0); c.lineTo(-19, -4); c.lineTo(-12, 0); c.lineTo(-19, 4); c.fill();   // оперение
        c.restore(); continue;
      }
      c.fillStyle = b.color + '66'; c.beginPath(); c.arc(b.x, b.y, b.r * 1.7, 0, TAU); c.fill();
      c.fillStyle = b.color; c.beginPath(); c.arc(b.x, b.y, b.r, 0, TAU); c.fill();
    }

    c.shadowBlur = 0;
    // эффекты
    for (const f of this.fx) {
      const k = f.t / f.T;
      if (f.dead || k >= 1) continue;               // отжившие эффекты (во время анимации смерти их ещё не убрали)
      if (f.kind === 'sfx') { this.drawSfx(c, f, k, p); continue; }
      if (f.kind === 'bolt') {
        c.globalAlpha = 1 - k;
        if (f.big) { c.globalCompositeOperation = 'lighter'; c.strokeStyle = f.color; c.globalAlpha = (1 - k) * 0.35; c.lineWidth = 14; c.beginPath(); c.moveTo(f.pts[0], f.pts[1]); for (let i = 2; i < f.pts.length; i += 2) c.lineTo(f.pts[i], f.pts[i + 1]); c.stroke(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1 - k; }
        c.strokeStyle = f.color; c.lineWidth = 4; c.beginPath(); c.moveTo(f.pts[0], f.pts[1]); for (let i = 2; i < f.pts.length; i += 2) c.lineTo(f.pts[i], f.pts[i + 1]); c.stroke();
        c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.stroke();
      } else if (f.kind === 'ring') {
        const x = f.follow ? p.x : f.x, y = f.follow ? p.y : f.y;
        c.globalAlpha = 1 - k; c.strokeStyle = f.color; c.lineWidth = 8 * (1 - k) + 1;
        c.beginPath(); c.arc(x, y, f.r0 + (f.r1 - f.r0) * Math.sqrt(k), 0, TAU); c.stroke();
        c.globalAlpha = (1 - k) * 0.15; c.fillStyle = f.color; c.fill();
      } else if (f.kind === 'beam') {                   // луч: мягкая полоса света с белым ядром (текстура на цвет — один раз), вспышка у руки
        const wd = f.wd * (1 - k * 0.5) * (f.prism ? 2.4 : 2), tx = this.beamTex(f.color);
        c.save(); c.translate(f.x, f.y); c.rotate(f.a); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 1 - k;
        c.drawImage(tx, 0, -wd / 2, f.len, wd);
        const fl = f.wd * 2.6; c.drawImage(World.glowSpr('#fff4d0'), -fl / 2, -fl / 2, fl, fl);
        c.restore(); c.globalCompositeOperation = 'source-over';
      } else if (f.kind === 'slash') {
        c.globalAlpha = (1 - k) * 0.8; c.strokeStyle = f.color; c.lineWidth = f.h * 0.28 * (1 - k * 0.5);
        c.beginPath(); c.ellipse(f.x - f.side * f.w * 0.1, f.y, f.w / 2, f.h / 2, 0, f.side > 0 ? -1.3 : Math.PI - 1.3 + 0.0, f.side > 0 ? 1.3 : Math.PI + 1.3); c.stroke();
        c.strokeStyle = '#dff4ff'; c.lineWidth = 1.5; c.stroke();
        const si = Art.img.fx_scythe;
        if (si && k < 0.85) {                             // лунная коса описывает дугу взмаха
          const L = Math.min(110, f.w * 0.75), sw = -1.6 + Math.min(1, k / 0.7) * 2.6;   // от «над головой» до «вниз-вперёд»
          c.globalAlpha = 1 - Math.max(0, k - 0.55) / 0.3;
          c.save(); c.translate(p.x, p.y - 6); c.scale(f.side, 1); c.rotate(sw);
          if (f.evo) {   // Жнец душ: коса светится цветом эволюции (готовый спрайт свечения вместо дорогого shadowBlur)
            const gl = glowSprite(si, hexCol(f.color), 14), gk = L / si.height; c.globalCompositeOperation = 'lighter';
            c.drawImage(gl, -L * 0.18 - 14 * gk, -L * 0.95 - 14 * gk, gl.width * gk, gl.height * gk); c.globalCompositeOperation = 'source-over';
          }
          c.drawImage(si, -L * 0.18, -L * 0.95, L * si.width / si.height, L);
          if (f.evo) { c.globalCompositeOperation = 'lighter'; c.globalAlpha *= 0.5; c.drawImage(si, -L * 0.18, -L * 0.95, L * si.width / si.height, L); c.globalCompositeOperation = 'source-over'; c.shadowBlur = 0; }
          c.restore();
        }
      } else if (f.kind === "spikes") {                  // шипы вырываются из земли
        const up = k < 0.3 ? k / 0.3 : 1, fade = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4; c.globalAlpha = fade;
        const si = f.icon && Art.img[f.icon];
        if (si) { const H = f.r * 2.2 * (0.3 + up * 0.7); c.drawImage(si, f.x - H / 2, f.y + f.r * 0.3 - H, H, H); c.globalAlpha = 1; continue; }   // Кровавый лес: шипы с иконки
        for (let i = 0; i < 7; i++) {
          const a = f.seed + i * 0.9, d = f.r * (0.15 + ((i * 37) % 10) / 14), bx = f.x + Math.cos(a) * d, by = f.y + Math.sin(a) * d * 0.6, h = (14 + (i % 3) * 7) * up;
          c.fillStyle = "#3a0a14"; c.beginPath(); c.moveTo(bx - 5, by); c.lineTo(bx, by - h); c.lineTo(bx + 5, by); c.fill();
          c.fillStyle = f.color; c.beginPath(); c.moveTo(bx - 2, by); c.lineTo(bx, by - h); c.lineTo(bx + 3, by); c.fill();
        }
      } else if (f.kind === 'boom') {                   // вспышка взрыва: мягкое свечение, яркое ядро и ударная волна (без плоских кругов)
        const R = f.r * (0.55 + 0.6 * Math.sqrt(k)), gs = World.glowSpr(hexCol(f.color)), rr = f.r * (0.45 + 0.75 * k);
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = (1 - k) * 0.95; c.drawImage(gs, f.x - R * 1.25, f.y - R, R * 2.5, R * 2);
        c.globalAlpha = (1 - k) * (1 - k); c.drawImage(World.glowSpr('#fff4c0'), f.x - R * 0.55, f.y - R * 0.45, R * 1.1, R * 0.9);
        c.globalCompositeOperation = 'source-over';
        c.globalAlpha = (1 - k) * 0.6; c.strokeStyle = f.color; c.lineWidth = 2.5 * (1 - k) + 0.5; c.beginPath(); c.ellipse(f.x, f.y, rr, rr * 0.8, 0, 0, TAU); c.stroke();
      }
      c.globalAlpha = 1;
    }
    if (this.parts.length) {                         // частицы: группами по цвету и прозрачности (4 ступени) — одна заливка на группу вместо сотни fillRect
      const G = this.partG || (this.partG = new Map()); G.clear();
      for (const q of this.parts) { const a = Math.ceil((1 - q.t / q.T) * 4); if (a <= 0) continue; const k = q.color + a; let g = G.get(k); if (!g) G.set(k, g = [q.color, a / 4]); g.push(q); }
      for (const g of G.values()) { c.globalAlpha = g[1]; c.fillStyle = g[0]; c.beginPath(); for (let i = 2; i < g.length; i++) { const q = g[i]; c.rect(q.x - q.size / 2, q.y - q.size / 2, q.size, q.size); } c.fill(); }
    }
    c.globalAlpha = 1;

    // цифры урона: каждая надпись рисуется один раз в маленький холст и дальше только копируется (fillText в каждом кадре — дорого)
    c.textAlign = 'center'; c.textBaseline = 'middle';
    const TS = this.zoom * this.dpr;
    for (const t of this.texts) {
      c.globalAlpha = Math.min(1, (1 - t.t / t.T) * 2);
      const ts = this.textSpr(String(t.s), t.color, t.big), tw = ts.tw;
      c.drawImage(ts, t.x - ts.width / TS / 2, t.y - ts.height / TS / 2, ts.width / TS, ts.height / TS);
      if (t.ic) {                                   // монета-картинка после числа («+3 🟢»)
        const im = Art.img[t.ic], sz = t.big ? 15 : 11;
        if (im) c.drawImage(im, 0, 0, im.width / 3, im.height, t.x + tw / 2 + 2, t.y - sz / 2 - 1, sz, sz);
        else c.fillText(t.ic === 'fx_green_spin' ? '🟢' : '🪙', t.x + tw / 2 + 9, t.y);
      }
    }
    c.globalAlpha = 1;

    // стрелки за край экрана: босс (красная) и ближние сундуки (золотые)
    const arrow = (x, y, col, size) => {
      const dx = x - p.x, dy = y - p.y;
      if (Math.abs(dx) <= vw / 2 && Math.abs(dy) <= vh / 2) return;
      const s = Math.min((vw / 2 - 24) / Math.abs(dx), (vh / 2 - 60) / Math.abs(dy));
      const ax = p.x + dx * s, ay = p.y + dy * s, an = Math.atan2(dy, dx);
      c.fillStyle = col;
      c.beginPath(); c.moveTo(ax + Math.cos(an) * size, ay + Math.sin(an) * size); c.lineTo(ax + Math.cos(an + 2.5) * size * 0.8, ay + Math.sin(an + 2.5) * size * 0.8); c.lineTo(ax + Math.cos(an - 2.5) * size * 0.8, ay + Math.sin(an - 2.5) * size * 0.8); c.fill();
    };
    for (const ch of World.chestList()) {
      const d2 = (ch.x - p.x) ** 2 + (ch.y - p.y) ** 2;
      if (ch.rare && d2 < 1400 * 1400) arrow(ch.x, ch.y, 'rgba(80,255,150,.9)', 12);
      else if (!ch.rare && d2 < 900 * 900) arrow(ch.x, ch.y, 'rgba(255,210,60,.85)', 10);
    }
    if (this.boss && !this.boss.dead) arrow(this.boss.x, this.boss.y, '#ff4a5a', 14);

    if (!DBG.has('nohud')) this.drawHud(c);
  },

  drawEnemy(c, e, p) {
    const key = this.enemyKey(e), art = Art.has(key);
    if (e.elite || e.boss) {
      c.strokeStyle = e.boss ? e.color : '#ffd23a'; c.lineWidth = 2.5; c.globalAlpha = 0.6 + Math.sin(this.time * 6) * 0.3;
      c.beginPath(); c.arc(e.x, e.y, e.size * 0.55, 0, TAU); c.stroke(); c.globalAlpha = 1;
    }
    if (e.boss && e.ai.mode === 'wind') {
      c.strokeStyle = 'rgba(255,40,40,.55)'; c.lineWidth = e.r; c.beginPath(); c.moveTo(e.x, e.y); c.lineTo(e.x + e.ai.dx * 320, e.y + e.ai.dy * 320); c.stroke();
    }
    const animated = art && ART[key].anims;
    const single = animated && ART[key].anims.walk.n === 1;        // одна поза ходьбы (големы) — тяжёлая «поступь»
    const bob = !animated ? Math.sin(e.animT * 9 + e.ph) * e.size * 0.04 : single ? -Math.abs(Math.sin(e.animT * 5 + e.ph)) * e.size * 0.05 : 0;
    let alpha = 1;
    if (e.def.stealth) { const d = Math.hypot(e.x - p.x, e.y - p.y); alpha = clamp(1 - (d - 110) / 90, 0.22, 1); }
    if (e.slamW > 0) {                                               // предупреждение об ударе о землю
      const k = 1 - e.slamW / e.def.slam.wind;
      c.strokeStyle = 'rgba(255,60,40,' + (0.3 + k * 0.5) + ')'; c.lineWidth = 2;
      c.beginPath(); c.ellipse(e.x, e.y + e.size * 0.3, e.def.slam.r, e.def.slam.r * 0.7, 0, 0, TAU); c.stroke();
      c.fillStyle = 'rgba(255,60,40,' + k * 0.18 + ')'; c.fill();
    }
    const lift = e.slamW > 0 ? -Math.sin((1 - e.slamW / e.def.slam.wind) * Math.PI) * e.size * 0.25 : 0;
    if (e.bossArt && art) { this.drawBoss(c, e, key, p); if (e.champion) this.bar(c, e.x - 24, e.y - e.size * 0.55, 48, 5, e.hp / e.maxHp, '#ffd23a'); return; }
    if (e.def.glow) this.drawMonsterFx(c, e);         // свечение и эффекты новых монстров
    Art.draw(c, key, e.x, e.y + bob + lift, e.size, { flip: e.flip, flash: e.flash > 0, t: e.animT, alpha,
      anim: e.slamW > 0 ? 'jump' : e.flash > 0 ? 'hit' : e.near ? 'attack' : 'walk', color: e.color, label: e.def.emoji });
    if (e.frozen > 0 && e.stun) this.drawStun(c, e);
    else if (e.frozen > 0) {
      const cube = e.iceCube && Art.img.icon_absolute_zero, ice = Art.img.fx_f_freeze;
      if (cube) { const S = e.size * 1.05; c.globalAlpha = 0.85; c.drawImage(cube, e.x - S / 2, e.y - S / 2, S, S); c.globalAlpha = 1; }   // Абсолютный ноль: враг во льду
      else if (ice) {                                  // заморожен: голубой отлив и ледяные кристаллы у ног (тают в последние 0.3 с)
        const m = FLARE_FX.freeze, S = Math.min(1.2, e.size * 0.8 / m.cw), f = e.frozen > 0.3 ? 0 : Math.min(m.n - 1, Math.floor((1 - e.frozen / 0.3) * m.n)), R = e.size * 0.5;
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5; c.drawImage(World.glowSpr('#9fe8ff'), e.x - R, e.y - R * 1.1, R * 2, R * 2); c.globalCompositeOperation = 'source-over';
        c.globalAlpha = 0.9; c.drawImage(ice, f * m.cw, 0, m.cw, m.ch, e.x - m.ax * S, e.y + e.size * 0.38 - m.ay * S, m.cw * S, m.ch * S); c.globalAlpha = 1;
      }
      else { c.fillStyle = 'rgba(160,230,255,.45)'; c.beginPath(); c.arc(e.x, e.y, e.r * 1.1, 0, TAU); c.fill(); }
    }
    else if (e.burnT > 0) this.drawBurn(c, e);
    if (e.elite && e.hp < e.maxHp) this.bar(c, e.x - 16, e.y - e.size * 0.62, 32, 4, e.hp / e.maxHp, '#ffd23a');
  },

  // Оглушённый враг: над головой кружат три звёздочки
  drawStun(c, e) {
    const hy = e.y - e.size * 0.52, rx = Math.max(8, e.size * 0.2), a0 = this.time * 5 + e.id;
    c.fillStyle = '#ffd84a'; c.strokeStyle = 'rgba(60,30,0,.7)'; c.lineWidth = 1; c.beginPath();
    for (let i = 0; i < 3; i++) {                     // жёлтые четырёхлучевые звёздочки, ближняя — крупнее
      const a = a0 + i * TAU / 3, x = e.x + Math.cos(a) * rx, y = hy + Math.sin(a) * rx * 0.35, r = 3.6 + Math.sin(a) * 1.1;
      c.moveTo(x, y - r); c.lineTo(x + r * 0.32, y - r * 0.32); c.lineTo(x + r, y); c.lineTo(x + r * 0.32, y + r * 0.32);
      c.lineTo(x, y + r); c.lineTo(x - r * 0.32, y + r * 0.32); c.lineTo(x - r, y); c.lineTo(x - r * 0.32, y - r * 0.32); c.closePath();
    }
    c.stroke(); c.fill();
  },
  // Горящий враг: огненное кольцо из арта вокруг тела и у ног (анимация), без арта — оранжевое пятно
  drawBurn(c, e) {
    const im = Art.img.fx_fire_ring;
    if (!im) { c.fillStyle = 'rgba(255,120,30,.3)'; c.beginPath(); c.arc(e.x, e.y - e.r * 0.5, e.r * 0.7, 0, TAU); c.fill(); return; }
    const fw = im.width / 6, fh = im.height, PP = [0, 1, 2, 3, 4, 3, 2, 1], ph = Math.abs(Math.floor(this.time * 12 + e.id * 1.7)), fade = Math.min(1, e.burnT / 0.4);
    const w1 = e.size * 1.05, w2 = e.size * 0.8;
    c.globalAlpha = 0.85 * fade; c.drawImage(im, PP[ph % 8] * fw, 0, fw, fh, e.x - w1 / 2, e.y + e.size * 0.28 - w1 * 0.22, w1, w1 * 0.44);   // у ног (сплюснутое)
    c.globalAlpha = 0.7 * fade; c.drawImage(im, PP[(ph + 4) % 8] * fw, 0, fw, fh, e.x - w2 / 2, e.y - w2 * fh / fw / 2, w2, w2 * fh / fw);   // вокруг тела
    c.globalAlpha = 1;
  },

  // Новые монстры узнаются по свечению своего цвета и эффекту (в стиле игры, на тех же моделях)
  drawMonsterFx(c, e) {
    const D = e.def, g = D.glow, t = this.time + e.ph, R = e.size * 0.5;
    const pulse = 0.75 + Math.sin(t * 4) * 0.25;
    const gr = c.createRadialGradient(e.x, e.y, R * 0.2, e.x, e.y, R * 1.15);
    gr.addColorStop(0, g + '00'); gr.addColorStop(0.6, g + '38'); gr.addColorStop(1, g + '00');
    c.globalAlpha = pulse; c.fillStyle = gr; c.beginPath(); c.arc(e.x, e.y, R * 1.15, 0, TAU); c.fill(); c.globalAlpha = 1;
    if (D.fx === 'fuse' && e.fuse > 0) {             // жук вот-вот взорвётся: красный круг и мигание
      const k = 1 - e.fuse / D.explode.fuse;
      c.strokeStyle = 'rgba(255,60,30,' + (0.4 + k * 0.5) + ')'; c.lineWidth = 2; c.beginPath(); c.arc(e.x, e.y, D.explode.r, 0, TAU); c.stroke();
      c.fillStyle = 'rgba(255,90,30,' + (Math.sin(t * 40) * 0.2 + 0.25) + ')'; c.fill();
    } else if (D.fx === 'fuse') {                    // искры фитиля
      c.fillStyle = '#ffd060'; c.fillRect(e.x - 1 + Math.sin(t * 20) * 3, e.y - R * 0.8, 2.5, 2.5);
    }
    if (D.fx === 'spores' && Math.random() < 0.12 && this.parts.length < 280)
      this.parts.push({ x: e.x + rand(-R, R) * 0.6, y: e.y - R * 0.4, vx: rand(-12, 12), vy: rand(-30, -12), t: 0, T: rand(0.6, 1), color: '#9aff5a', size: rand(2, 3.5) });
    if (D.fx === 'trail' && e.diving > 0 && this.parts.length < 290)     // шлейф пикирующего ворона
      this.parts.push({ x: e.x, y: e.y, vx: 0, vy: 0, t: 0, T: 0.35, color: '#b060ff', size: 5 });
    if (D.lob) { const bi = Art.img.fx_bomb; if (bi) c.drawImage(bi, e.x + R * 0.35, e.y - R * 0.2, 14, 14); }   // бомба в руке у подрывника
    if (D.shoots && D.shoots.arrow) { c.strokeStyle = g; c.lineWidth = 1.5; c.beginPath(); c.arc(e.x + (e.flip ? -R * 0.45 : R * 0.45), e.y, R * 0.35, -1.2, 1.2); c.stroke(); }   // лук
  },

  // Боссы со своим артом: вид вперёд/влево/вправо по направлению движения, атака во время рывка,
  // тяжёлая поступь; у боссов из одной картинки — «дыхание» и покачивание (Око Бездны — парит)
  drawBoss(c, e, key, p) {
    const A = ART[key], dx = p.x - e.x, dy = p.y - e.y, S = e.size, t = this.time + e.ph;
    const attacking = e.ai.mode === 'wind' || e.ai.mode === 'dash';
    c.save(); c.translate(e.x, e.y);
    if (e.ai.mode === 'wind') c.translate(rand(-2, 2), rand(-2, 2));            // дрожь перед рывком
    if (A.flare) {                                    // модель FLARE: ходьба / атака, смотрит на героя
      Art.draw(c, key, 0, 0, S, { flash: e.flash > 0, anim: attacking ? 'attack' : 'walk', t: e.animT, flip: dx < 0 });
      c.restore(); return;
    }
    if (A.anims) {
      let anim = 'fwd';
      if (attacking) anim = 'attack';
      else if (Math.abs(dx) > Math.abs(dy) * 0.8) anim = dx < 0 ? 'left' : 'right';
      const step = -Math.abs(Math.sin(e.animT * 4 + e.ph)) * S * 0.035, sq = Math.sin(e.animT * 8 + e.ph) * 0.025;
      c.scale(1 + sq, 1 - sq);
      Art.draw(c, key, 0, step, S, { flash: e.flash > 0, anim, t: attacking ? (0.8 - e.ai.t) : 0 });
    } else {
      const float = e.bossArt === 'boss_void';
      const b = float ? Math.sin(t * 1.8) * S * 0.05 : -Math.abs(Math.sin(e.animT * 3.5 + e.ph)) * S * 0.03;
      const br = Math.sin(t * (float ? 1.6 : 2.4)) * 0.03;
      c.rotate(float ? Math.sin(t * 1.1) * 0.06 : Math.sin(e.animT * 3.5 + e.ph) * 0.04);
      c.scale(1 + br, 1 - br * 0.7);
      if (attacking) c.scale(1.08, 1.08);
      Art.draw(c, key, 0, b, S, { flip: dx < 0, flash: e.flash > 0 });
    }
    c.restore();
  },

  // Эффект из кадров FLARE: name — лист fx_<name>, s — масштаб, follow — за героем, glow — светящееся наложение
  sfx(name, x, y, T, s, o) { if (typeof FLARE_FX === 'undefined' || !FLARE_FX[name] || this.fx.length > 220) return; this.fx.push(Object.assign({ kind: 'sfx', name, x, y, t: 0, T, s: s || 1 }, o)); },
  // hue — сдвиг оттенка (кэшируется в Art.hue), rot — поворот вокруг точки привязки
  drawSfx(c, f, k, p) {
    let im = Art.img['fx_f_' + f.name]; const m = FLARE_FX[f.name]; if (!im) return;
    if (f.hue) im = Art.hue('fx_f_' + f.name, f.hue) || im;
    const i = Math.min(m.n - 1, Math.floor(k * m.n)), s = f.s, x = f.follow ? p.x : f.x, y = f.follow ? p.y : f.y;
    if (f.glow) c.globalCompositeOperation = 'lighter';
    c.globalAlpha = f.fade ? Math.min(1, (1 - k) * 2.5) : 1;
    if (f.rot) { c.save(); c.translate(x, y); c.rotate(f.rot); c.drawImage(im, i * m.cw, 0, m.cw, m.ch, -m.ax * s, -m.ay * s, m.cw * s, m.ch * s); c.restore(); }
    else c.drawImage(im, i * m.cw, 0, m.cw, m.ch, x - m.ax * s, y - m.ay * s, m.cw * s, m.ch * s);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  },

  // Снаряд эволюции: мягкое свечение цвета эволюции и светящийся шлейф (готовый спрайт свечения — без плоских кругов и без градиента на каждый кадр)
  drawEvoGlow(c, q) {
    const gs = World.glowSpr(hexCol(q.color || q.w.def.color)), R = Math.min(20, Math.max(7, q.r * 1.9)), sp = Math.hypot(q.vx || 0, q.vy || 0) || 1, ux = (q.vx || 0) / sp, uy = (q.vy || 0) / sp;
    c.globalCompositeOperation = 'lighter';
    for (let i = 3; i >= 1; i--) { const r = R * (1.15 - i * 0.2); c.globalAlpha = 0.14 * (4 - i); c.drawImage(gs, q.x - ux * R * i * 0.6 - r, q.y - uy * R * i * 0.6 - r, r * 2, r * 2); }
    c.globalAlpha = 0.5; c.drawImage(gs, q.x - R * 1.2, q.y - R * 1.2, R * 2.4, R * 2.4);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  },
  // Спрайт сюрикена 64×64: у каждого луча светлая и тёмная грань, тёмный контур, кольцо с отверстием в центре
  shurikenSpr() {
    if (this._shur) return this._shur;
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const x = cv.getContext('2d'); x.translate(32, 32);
    const P = [];
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 - Math.PI / 2, r = i % 2 ? 9 : 30; P.push([Math.cos(a) * r, Math.sin(a) * r]); }
    x.lineJoin = 'round'; x.strokeStyle = '#141a26'; x.lineWidth = 3; x.beginPath(); P.forEach(([px, py], i) => i ? x.lineTo(px, py) : x.moveTo(px, py)); x.closePath(); x.stroke();
    for (let i = 0; i < 8; i += 2) {
      const t = P[i], l = P[(i + 7) % 8], r = P[i + 1];
      x.fillStyle = '#eef3fa'; x.beginPath(); x.moveTo(0, 0); x.lineTo(l[0], l[1]); x.lineTo(t[0], t[1]); x.closePath(); x.fill();   // светлая грань
      x.fillStyle = '#7f8ea6'; x.beginPath(); x.moveTo(0, 0); x.lineTo(t[0], t[1]); x.lineTo(r[0], r[1]); x.closePath(); x.fill();   // тёмная грань
    }
    x.fillStyle = '#2a3446'; x.beginPath(); x.arc(0, 0, 7, 0, TAU); x.fill();
    x.strokeStyle = '#c8d4e4'; x.lineWidth = 1.5; x.beginPath(); x.arc(0, 0, 6, 0, TAU); x.stroke();
    x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.arc(0, 0, 3, 0, TAU); x.fill();
    return (this._shur = cv);
  },
  // Текстура луча на цвет: поперёк — прозрачный край, цвет, белое ядро; вдоль — мягкое начало и угасающий конец
  beamTex(col) {
    const B = this._beam || (this._beam = {}); if (B[col]) return B[col];
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 32; const x = cv.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 32), ca = a => /^#[0-9a-f]{6}$/i.test(col) ? col + Math.round(a * 255).toString(16).padStart(2, '0') : col.replace('hsl(', 'hsla(').replace(')', ',' + a + ')');
    g.addColorStop(0, ca(0)); g.addColorStop(0.22, ca(0.35)); g.addColorStop(0.4, ca(0.9)); g.addColorStop(0.5, '#ffffff'); g.addColorStop(0.6, ca(0.9)); g.addColorStop(0.78, ca(0.35)); g.addColorStop(1, ca(0));
    x.fillStyle = g; x.fillRect(0, 0, 128, 32);
    const h = x.createLinearGradient(0, 0, 128, 0); h.addColorStop(0, 'rgba(0,0,0,.3)'); h.addColorStop(0.06, '#000'); h.addColorStop(0.8, '#000'); h.addColorStop(1, 'rgba(0,0,0,0)');
    x.globalCompositeOperation = 'destination-in'; x.fillStyle = h; x.fillRect(0, 0, 128, 32);
    return (B[col] = cv);
  },
  // Снаряды эволюций, нарисованные иконкой (Циклон, Ледяная звезда, Ураган)
  drawEvoSprite(c, q) {
    const id = q.w.id, im = (id === 'cyclone' || id === 'frost_star' || id === 'hurricane') && Art.img['icon_' + id]; if (!im) return false;
    const S = id === 'hurricane' ? Math.min(96, q.r * 2.2) : q.r * (id === 'cyclone' ? 3.6 : 4.2), rot = id === 'hurricane' ? Math.sin(this.time * 5 + q.x * 0.02) * 0.15 : (q.rot || 0) + this.time * (id === 'cyclone' ? 10 : 4);
    if (id === 'hurricane') { c.fillStyle = 'rgba(80,220,200,.18)'; c.beginPath(); c.ellipse(q.x, q.y + S * 0.35, S * 0.45, S * 0.14, 0, 0, TAU); c.fill(); }
    c.save(); c.translate(q.x, q.y); c.rotate(rot);
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = id === 'hurricane' ? 0.15 : 0.3; c.drawImage(im, -S * 0.6, -S * 0.6, S * 1.2, S * 1.2);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.drawImage(im, -S / 2, -S / 2, S, S); c.restore();
    return true;
  },

  // Снаряды врагов из арта: стрелы (обычная / элита / чемпион), остальное — по цвету снаряда
  drawEBulletArt(c, b) {
    if (!b.spr) {
      if (b.web) b.spr = 'fx_web';
      else if (b.arrow) b.spr = b.champ ? 'fx_earrow_fire' : b.elite ? 'fx_earrow_red' : 'fx_earrow';
      else {
        const h = String(b.color || '#a060ff'), r = parseInt(h.substr(1, 2), 16), g = parseInt(h.substr(3, 2), 16), bl = parseInt(h.substr(5, 2), 16);
        const mx = Math.max(r, g, bl), mn = Math.min(r, g, bl), d = mx - mn || 1;
        let hue = mx === r ? ((g - bl) / d) % 6 : mx === g ? (bl - r) / d + 2 : (r - g) / d + 4; hue = (hue * 60 + 360) % 360;
        b.spr = mx - mn < 40 ? 'fx_ebolt_blue' : hue < 70 || hue >= 330 ? 'fx_ebolt_fire' : hue < 170 ? 'fx_ebolt_green' : hue < 250 ? 'fx_ebolt_blue' : 'fx_ebolt_purple';
      }
    }
    const im = Art.img[b.spr]; if (!im) return false;
    const a = Math.atan2(b.vy, b.vx);
    c.save(); c.translate(b.x, b.y);
    if (b.web) { c.rotate(this.time * 4); const s = b.r * 3.2; c.drawImage(im, -s / 2, -s / 2, s, s); }
    else if (b.spr === 'fx_ebolt_fire') { c.rotate(a + Math.PI); const h = b.r * 4.6, w = h * im.width / im.height; c.drawImage(im, -h * 0.55, -h / 2, w, h); }   // голова шара слева
    else { c.rotate(a); const w = b.arrow ? 42 : b.r * 6.5, h = w * im.height / im.width; c.drawImage(im, -w * 0.72, -h / 2, w, h); }   // остриё справа
    c.restore(); return true;
  },

  // Подбираемое из арта (кристаллы, монеты, сердце, магнит, сундук); false — нарисовать по-старому
  drawPickupArt(c, k) {
    const I = Art.img, t = this.time, img = (im, x, y, h) => { const w = h * im.width / im.height; c.drawImage(im, x - w / 2, y - h / 2, w, h); };
    if (k.kind === 'gem') {
      const im = I[k.v < 3 ? 'fx_gem_blue' : k.v < 10 ? 'fx_gem_gold' : 'fx_gem_red']; if (!im) return false;
      img(im, k.x, k.y + Math.sin(t * 3 + k.x) * 1.2, k.v < 3 ? 12 : k.v < 10 ? 15 : 19); return true;
    }
    if (k.kind === 'coin' || k.kind === 'green') {         // монета крутится: анфас → 3/4 → ребро (вторая половина оборота — зеркально)
      const im = I[k.kind === 'coin' ? 'fx_coin_spin' : 'fx_green_spin']; if (!im) return false;
      const cs = Math.cos(t * 5 + k.x + k.y), a = Math.abs(cs), f = a > 0.72 ? 0 : a > 0.3 ? 1 : 2, fw = im.width / 3, h = k.kind === 'coin' ? 14 : 16;
      if (k.kind === 'green') { c.fillStyle = 'rgba(80,255,150,.22)'; c.beginPath(); c.arc(k.x, k.y, 12, 0, TAU); c.fill(); }
      c.drawImage(im, f * fw, 0, fw, im.height, k.x - h / 2, k.y - h / 2, h, h); return true;
    }
    if (k.kind === 'heart' && I.fx_heart) {
      const b = Math.sin(t * 4 + k.x) * 2, s = 1 + Math.sin(t * 6) * 0.08;
      c.fillStyle = 'rgba(255,60,90,.2)'; c.beginPath(); c.arc(k.x, k.y + b, 15 * s, 0, TAU); c.fill();
      img(I.fx_heart, k.x, k.y + b, 18 * s); return true;
    }
    if (k.kind === 'magnet' && I.fx_magnet) { img(I.fx_magnet, k.x, k.y + Math.sin(t * 4) * 2, 20); return true; }
    if (k.kind === 'chest' && I.fx_chest) {
      const b = Math.sin(t * 5) * 2;
      c.fillStyle = 'rgba(255,210,60,.25)'; c.beginPath(); c.arc(k.x, k.y, 22 + b, 0, TAU); c.fill();
      img(I.fx_chest, k.x, k.y + b, 26); return true;
    }
    return false;
  },

  drawPlayer(c, p, HS) {
    const h = HEROES[p.hero], hk = 'hero_' + p.hero, heroArt = Art.has(hk) && ART[hk].anims;
    c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(p.x, p.y + HS * 0.45, 13, 5, 0, 0, TAU); c.fill();
    if (p.wardCharges > 0 && Art.img.fx_ward_runes) {   // Оберег заряжен: под ногами героя светится и крутится голубой круг рун (два заряда — два круга)
      const im = Art.img.fx_ward_runes, fw = im.width / 4, fh = im.height, fy = p.y + HS * 0.45, f = Math.floor(this.time * 8) % 4;
      c.globalCompositeOperation = 'lighter';
      for (let k = 0; k < Math.min(2, p.wardCharges); k++) {
        const W = k ? 92 : 66, H = W * fh / fw;
        c.globalAlpha = (k ? 0.6 : 0.85) + Math.sin(this.time * 3 + k * 2) * 0.15;
        c.drawImage(im, ((f + k * 2) % 4) * fw, 0, fw, fh, p.x - W / 2, fy - H / 2, W, H);
      }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    }
    const D = HERO_DASH[p.hero], dsh = p.dash;
    const lift = dsh && dsh.kind === 'leap' ? this.leapLift(dsh) : 0;           // прыжок по дуге (тень остаётся на земле)
    const flyA = dsh && dsh.kind === 'fly' ? 0.4 + Math.sin(this.time * 20) * 0.1 : 1;   // полёт — полупрозрачный
    for (const g of p.ghosts) {                                                 // шлейф-призраки рывка
      Art.draw(c, hk, g.x, g.y + g.lift, HS, { flip: p.dirX < 0, anim: 'run', t: 0, alpha: g.t / 0.3 * 0.35, color: h.color, label: h.name[0] });
    }
    if (dsh && dsh.kind === 'bolt') { c.fillStyle = 'rgba(255,240,120,.35)'; c.beginPath(); c.arc(p.x, p.y, 26, 0, TAU); c.fill(); }
    if ((p.invuln > 0 || p.hitIframe > 0) && !dsh) c.globalAlpha = 0.6 + Math.sin(this.time * 40) * 0.3;   // мигание во время неуязвимости
    c.save(); c.translate(0, lift);
    if (flyA < 1) c.globalAlpha = flyA;
    if (heroArt) {
      // анимации: смерть → бег → атака (когда стоит и стреляет) → покой
      let anim = 'idle', t = this.time, frame;
      let alpha = 1, sink = 0;
      if (this.state === 'dying') {
        const k = 1 - this.dyingT / this.dyingLen;
        if (ART[hk].anims.death) { anim = 'death'; frame = Math.floor(k * 99); } else { alpha = Math.max(0, 1 - k * 1.3); sink = k * 10; }
      }
      else if (p.moving) { anim = 'run'; t = p.anim; }
      else if (p.castT > 0) { anim = 'attack'; t = 0.3 - p.castT; }
      else if (anim === 'idle' && ART[hk].anims.idle.n === 1) sink = Math.sin(this.time * 2.2) * 0.8;   // одна поза покоя — лёгкое «дыхание»
      Art.draw(c, hk, p.x, p.y + sink, HS, { flip: p.dirX < 0, flash: p.hurtT > 0, anim, t, frame, alpha });
    } else {
      const pb = p.moving ? Math.abs(Math.sin(p.anim * 10)) * -3 : Math.sin(this.time * 2.5) * 1;
      Art.draw(c, hk, p.x, p.y + pb, HS, { flip: p.dirX < 0, flash: p.hurtT > 0, t: p.moving ? p.anim : 0, color: h.color, label: h.name[0] });
      c.fillStyle = 'rgba(255,255,255,.85)';          // стрелка направления у заглушки
      const ax = p.x + p.fx * 26, ay = p.y + p.fy * 26, an = Math.atan2(p.fy, p.fx);
      c.beginPath(); c.moveTo(ax + Math.cos(an) * 6, ay + Math.sin(an) * 6); c.lineTo(ax + Math.cos(an + 2.4) * 5, ay + Math.sin(an + 2.4) * 5); c.lineTo(ax + Math.cos(an - 2.4) * 5, ay + Math.sin(an - 2.4) * 5); c.fill();
    }
    c.restore(); c.globalAlpha = 1;
    if (this.boosts.shield) {                       // пузырь божественного щита
      const a = 0.35 + Math.sin(this.time * 8) * 0.1;
      c.strokeStyle = 'rgba(255,230,120,' + (a + 0.3) + ')'; c.lineWidth = 2.5; c.beginPath(); c.arc(p.x, p.y + 2, 32, 0, TAU); c.stroke();
      c.fillStyle = 'rgba(255,230,120,' + a * 0.35 + ')'; c.fill();
    }
    if (this.boosts.speed && p.moving) {            // шлейф суперскорости
      c.fillStyle = 'rgba(160,220,255,.35)';
      for (let i = 1; i <= 3; i++) { c.beginPath(); c.ellipse(p.x - p.fx * i * 9, p.y + 12 - p.fy * i * 9, 8 - i * 2, 4 - i, 0, 0, TAU); c.fill(); }
    }
    if (!Art.img.fx_ward_runes) for (let k = 0; k < (p.wardCharges || 0); k++) {   // заряды Оберега без арта — светящиеся шестиугольники
      const R = 30 + k * 6, a0 = this.time * (k ? -1.2 : 1.5);
      c.strokeStyle = "rgba(110,230,255," + (0.45 + Math.sin(this.time * 4 + k) * 0.15) + ")"; c.lineWidth = 2; c.beginPath();
      for (let i = 0; i <= 6; i++) { const an = a0 + i * Math.PI / 3, x = p.x + Math.cos(an) * R, y = p.y + 2 + Math.sin(an) * R * 0.9; if (i) c.lineTo(x, y); else c.moveTo(x, y); }
      c.stroke();
    }
    this.bar(c, p.x - 20, p.y + 26, 40, 5, p.hp / p.stats.maxHp, p.poisonT > 0 ? '#7ad84a' : '#ff4a5a');
    if (p.slowT > 0 || p.poisonT > 0) {
      c.font = '12px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText((p.poisonT > 0 ? '☠️' : '') + (p.slowT > 0 ? '🕸️' : ''), p.x, p.y - 30);
    }
  },

  // Элита и боссы рисуются крупным артом, если он есть
  enemyKey(e) {
    if (e.bossArt && Art.has(e.bossArt)) return e.bossArt;   // собственный арт босса
    const k = 'enemy_' + (e.skin || e.type);
    return (e.elite || e.boss) && Art.has(k + '_big') ? k + '_big' : k;
  },

  bar(c, x, y, w, h, k, col) {
    c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(x - 1, y - 1, w + 2, h + 2);
    c.fillStyle = col; c.fillRect(x, y, w * clamp(k, 0, 1), h);
  },

  drawHud(c) {
    const d = this.dpr, W = this.W, p = this.player, top = UI.safeTop();
    c.setTransform(d, 0, 0, d, 0, 0);
    if (this.biomeFlash > 0) { c.fillStyle = "rgba(255,255,255," + this.biomeFlash * 0.85 + ")"; c.fillRect(0, 0, W, this.H); }
    // верх HUD (опыт, таймер, убийства, монеты, иконки навыков) рисуется в отдельный холст, только когда что-то изменилось:
    // десятки fillText в каждом кадре заметно грели телефон. Убийства на экране обновляются не чаще 4 раз в секунду.
    if (this.time - (this.hudKT || 0) > 0.25 || this.time < (this.hudKT || 0)) { this.hudKills = this.kills; this.hudKT = this.time; }
    const key = [W, top, d, p.level, Math.round(clamp(p.xp / p.xpNext, 0, 1) * 120), fmtTime(this.time), this.endless || this.time < this.stage.duration, this.hudKills, this.coins, this.green,
      p.weapons.map(w => w.id + (w.evo ? '*' : w.level)).join(), p.passives.map(x => x.id + x.level).join(), Art.img.fx_coin_spin ? 1 : 0].join('|');
    if (key !== this.hudKey) {
      this.hudKey = key;
      const hc = this.hudCv || (this.hudCv = document.createElement('canvas')), hw = Math.ceil(W * d), hh = Math.ceil((top + 104) * d);
      if (hc.width !== hw || hc.height !== hh) { hc.width = hw; hc.height = hh; }
      const x = hc.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, hw, hh); x.setTransform(d, 0, 0, d, 0, 0);
      this.drawHudTop(x, W, p, top);
    }
    c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(this.hudCv, 0, 0); c.setTransform(d, 0, 0, d, 0, 0);
    let x;
    // активные бустеры с таймером
    x = 18;
    for (const k in this.boosts) {
      const b = BOOSTERS[k], left = this.boosts[k], y = top + 116;
      c.fillStyle = 'rgba(0,0,0,.55)'; c.beginPath(); c.arc(x, y, 13, 0, TAU); c.fill();
      c.strokeStyle = '#5aff9a'; c.lineWidth = 2.5; c.beginPath(); c.arc(x, y, 13, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, left / b.dur)); c.stroke();
      c.font = '14px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff'; c.fillText(b.icon, x, y);
      this.lvlBadge(c, x + 9, y + 11, Math.ceil(left));
      x += 32;
    }
    // полоска босса
    if (this.boss && !this.boss.dead) {
      const b = this.boss, y = UI.H() - 44 - UI.safeBottom();
      c.font = 'bold 12px "Russo One", sans-serif'; c.textAlign = 'center'; c.fillStyle = '#fff';
      c.fillText(b.name, W / 2, y - 10);
      this.bar(c, 20, y, W - 40, 10, b.hp / b.maxHp, '#e0304a');
    }
    // джойстик
    if (Input.active) {
      c.globalAlpha = 0.35; c.fillStyle = '#fff';
      c.beginPath(); c.arc(Input.ox, Input.oy, Input.R, 0, TAU); c.fill();
      c.globalAlpha = 0.7;
      const dx = Input.x - Input.ox, dy = Input.y - Input.oy, dd = Math.hypot(dx, dy), m = Math.min(dd, Input.R) / (dd || 1);
      c.beginPath(); c.arc(Input.ox + dx * m, Input.oy + dy * m, 22, 0, TAU); c.fill();
      c.globalAlpha = 1;
    }
  },
  drawHudTop(c, W, p, top) {
    // полоска опыта
    const bw = W - 64;
    c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(8, top + 8, bw, 14);
    const g = c.createLinearGradient(8, 0, 8 + bw, 0); g.addColorStop(0, '#3a7bff'); g.addColorStop(1, '#6ae0ff');
    c.fillStyle = g; c.fillRect(9, top + 9, (bw - 2) * clamp(p.xp / p.xpNext, 0, 1), 12);
    c.font = 'bold 11px "Russo One", sans-serif'; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillStyle = '#fff'; c.fillText(t('УР. {0}', p.level), 14, top + 15.5);
    // таймер, убийства, монеты
    c.textAlign = 'center'; c.font = 'bold 22px "Russo One", sans-serif';
    const tm = fmtTime(this.time);
    c.fillStyle = 'rgba(0,0,0,.6)'; c.fillText(tm, W / 2 + 1, top + 40);
    c.fillStyle = '#fff'; c.fillText(tm, W / 2, top + 39);
    if (!this.endless) {
      c.font = '11px "Russo One", sans-serif'; c.fillStyle = '#b8a8d8';
      c.fillText(this.time < this.stage.duration ? t('босс в {0}', fmtTime(this.stage.duration)) : t('БОСС!'), W / 2, top + 58);
    }
    c.font = 'bold 14px "Russo One", sans-serif';
    c.textAlign = 'left'; c.fillStyle = '#fff'; c.fillText('💀 ' + this.hudKills, 10, top + 40);
    // монеты: число справа, слева от него — монета из арта (анфас); без арта — эмодзи
    c.textAlign = 'right';
    for (const [n, col, key, emo, y] of [[this.coins, '#ffd23a', 'fx_coin_spin', '🪙', top + 52], [this.green, '#5aff9a', 'fx_green_spin', '🟢', top + 72]]) {   // зелёные — только внутри забега
      const im = Art.img[key], s = String(n); c.fillStyle = col;
      if (!im) { c.fillText(emo + ' ' + s, W - 10, y); continue; }
      c.fillText(s, W - 10, y); const tw = c.measureText(s).width, fw = im.width / 3;
      c.drawImage(im, 0, 0, fw, im.height, W - 10 - tw - 21, y - 9, 17, 17);
    }
    // иконки скиллов
    c.font = '15px sans-serif'; c.textAlign = 'center';
    let x = 18;
    for (const w of p.weapons) { this.hudIcon(c, w.def, "icon_" + w.id, x, top + 64); this.lvlBadge(c, x + 8, top + 71, w.evo ? '★' : w.level); x += 26; }
    x = 18;
    for (const ps of p.passives) { this.hudIcon(c, PASSIVES[ps.id], 'icon_' + ps.id, x, top + 88); this.lvlBadge(c, x + 8, top + 95, ps.level); x += 26; }
  },
  // Надпись в кэше: тёмная тень и цветной текст в холсте под текущий масштаб (кэш сбрасывается при смене размера и после загрузки шрифта)
  textSpr(s, color, big) {
    const S = this.zoom * this.dpr, key = s + '|' + color + (big ? '|b' : '');
    let m = this.txtCache; if (!m) m = this.txtCache = new Map();
    let cv = m.get(key); if (cv) return cv;
    if (m.size > 400) m.clear();
    const px = (big ? 15 : 11) * S, font = 'bold ' + px.toFixed(1) + 'px "Russo One", sans-serif';
    cv = document.createElement('canvas'); let x = cv.getContext('2d'); x.font = font;
    const w = x.measureText(s).width; cv.width = Math.ceil(w + S * 2 + 4); cv.height = Math.ceil(px * 1.35 + S + 2);
    x = cv.getContext('2d'); x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = 'rgba(0,0,0,.7)'; x.fillText(s, cv.width / 2 + S, cv.height / 2 + S);
    x.fillStyle = color; x.fillText(s, cv.width / 2, cv.height / 2);
    cv.tw = w / S; m.set(key, cv); return cv;
  },
  // Иконка навыка в HUD: картинка (если есть) или эмодзи
  hudIcon(c, def, key, x, y) {
    const im = def.iconSrc && Art.img[key];
    if (im) c.drawImage(im, x - 9, y - 9, 18, 18);
    else if (!def.iconSrc) { c.font = "15px sans-serif"; c.fillText(def.icon, x, y); }
  },
  lvlBadge(c, x, y, v) {
    c.font = 'bold 9px "Russo One", sans-serif';
    c.fillStyle = 'rgba(0,0,0,.75)'; c.fillText(v, x + 0.5, y + 0.5);
    c.fillStyle = '#ffe38a'; c.fillText(v, x, y);
  },

  drawMenuBg(c, W, H) {
    const pat = Art.ground(c, 'forest'), z = this.dpr * 1.2;
    c.setTransform(z, 0, 0, z, -(this.menuT * 12) % 256 * z, -(this.menuT * 6) % 256 * z);
    c.fillStyle = pat; c.fillRect(0, 0, W / z + 512, H / z + 512);
    c.setTransform(1, 0, 0, 1, 0, 0);
    if (!this.menuVig || this.menuVig.w !== W || this.menuVig.h !== H) {   // затемнение по краям — один градиент на размер экрана
      const g = c.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H * 0.4, Math.max(W, H) * 0.8);
      g.addColorStop(0, 'rgba(13,10,20,.35)'); g.addColorStop(1, 'rgba(13,10,20,.95)'); this.menuVig = { w: W, h: H, g };
    }
    c.fillStyle = this.menuVig.g; c.fillRect(0, 0, W, H);
  },
};
