'use strict';
// Каталог арта с кадрами «в игре»: подключается к копии index.html (см. tools/build-catalog.sh).
// Для каждого оружия и эволюции запускает тестовую сцену, прогоняет симуляцию и снимает кадр вокруг героя.
(() => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

  // ---------- кадр оружия в игре ----------
  function shotOf(id) {
    const G = Game;
    G.start(0); G.state = 'paused';
    const p = G.player; p.weapons.length = 0; p.passives.length = 0;
    G.addWeapon(id);
    const w = p.weapons[0]; if (w.max > 1) { w.level = w.max; G.calcWeapon(w); }
    p.invuln = 1e9; p.xpNext = 1e9; p.hp = p.stats.maxHp;
    G.pickups.length = 0; World.chests && (World.chests.length = 0);
    for (let i = 0; i < 16; i++) {                  // неподвижные враги вокруг героя
      const a = i * TAU / 16 + 0.2, r = i % 2 ? 118 : 72;
      const e = G.spawnEnemy(pick(['skeleton', 'wolf', 'gnome']), { pos: { x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r * 0.9 } });
      e.speed = 0; e.hp = e.maxHp = 1e9; e.shootT = 1e9; e.lungeT = 1e9; e.webT = 1e9; e.slamT = 1e9;
    }
    p.fx = 1; p.fy = 0; p.dirX = 1;
    const cv = G.cv, S = Math.min(cv.width, cv.height) * 0.68;
    let best = null, bestScore = -1;
    for (let step = 1; step <= 210; step++) {
      G.update(1 / 60);
      for (const e of G.enemies) { e.hp = e.maxHp; e.kbx = e.kby = 0; }
      G.texts.length = 0;
      if (step >= 45 && step % 15 === 0) {
        const score = G.projs.length * 3 + G.fx.length * 2 + G.zones.length * 2 + G.timed.length * 2 + G.parts.length * 0.05 + (w.totems ? w.totems.length * 3 : 0) + (w.drones ? 3 : 0) + (step === 60 ? 1 : 0);
        if (score > bestScore) {
          bestScore = score; G.draw();
          const t = document.createElement('canvas'); t.width = t.height = 300;
          t.getContext('2d').drawImage(cv, (cv.width - S) / 2, (cv.height - S) / 2, S, S, 0, 0, 300, 300);
          best = t.toDataURL('image/jpeg', 0.82);
        }
      }
    }
    return best;
  }

  // ---------- миниатюры арта ----------
  const thumb = (key, whole) => {
    const im = Art.img[key]; if (!im) return null;
    const a = ART[key] || {};
    let sy = 0, sw = im.width, sh = im.height;
    if (!whole) {
      if (a.anims) { const an = a.anims.idle || a.anims.walk || Object.values(a.anims)[0]; sw = a.cw; sh = a.ch; sy = an.row * sh; }
      else if (a.frames > 1) sw = im.width / a.frames;
      else if (key === 'fx_fire_ring') sw = im.width / 6;
    }
    const M = whole ? 520 : 180, k = Math.min(1, M / Math.max(sw, sh));
    const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(sw * k)); c.height = Math.max(1, Math.round(sh * k));
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(im, 0, sy, sw, sh, 0, 0, c.width, c.height);
    return c.toDataURL('image/webp', whole ? 0.8 : 0.9);
  };
  const cnt = { ok: 0, code: 0, no: 0 };
  const tag = (kind, text) => { cnt[kind]++; return `<span class="t ${kind}">${text}</span>`; };
  const sheetInfo = key => {
    const a = ART[key]; if (!a || !Art.img[key]) return '';
    let info;
    if (a.anims) info = `Лист, кадр ${a.cw}×${a.ch}: ` + Object.entries(a.anims).filter(([n]) => n !== 'walk' || !a.anims.idle).map(([n, v]) => `${n} ${v.n}`).join(', ');
    else if (a.frames > 1) info = `Лента из ${a.frames} кадров`;
    else info = `${Art.img[key].width}×${Art.img[key].height}`;
    const full = (a.anims || a.frames > 1 || key === 'fx_fire_ring') ? `<details class="sheet"><summary>весь лист</summary><img src="${thumb(key, true)}"></details>` : '';
    return `<div class="d">${info}</div>${full}`;
  };
  const emo = s => (String(s || '').match(/^[^<]+$/) ? s : '');
  const card = ({ key, emoji, name, id, desc, noArtText, shot, extra }) => {
    const a = ART[key], has = key && Art.img[key];
    const src = has ? thumb(key) : null;
    let st;
    if (has && a && a.drawn) st = tag('code', '✏️ нарисовано кодом');
    else if (has) st = tag('ok', '🖼 ' + a.file.replace(/^art\//, ''));
    else st = tag('no', noArtText || ('⚠️ нет арта' + (a && a.file ? ' → ' + a.file.replace(/^art\//, '') : '')));
    const shotHtml = shot ? `<div class="shot"><img src="${shot}"><span>в игре</span></div>` : '';
    return `<div class="c${shot ? ' big' : ''}"><div class="row"><div class="th">${src ? `<img src="${src}">` : `<span class="em">${emoji || '❔'}</span>`}</div>${shotHtml}</div>
      <div class="n">${esc(name)}</div><div class="id">${esc(id)}</div>${st}${has ? sheetInfo(key) : ''}${extra || ''}${desc ? `<div class="d">${esc(desc)}</div>` : ''}</div>`;
  };
  const section = (title, sub, cards, cls) => `<section class="${cls || ''}"><h2>${title} <small>(${cards.length})</small></h2>${sub ? `<div class="sub">${sub}</div>` : ''}<div class="grid">${cards.join('')}</div></section>`;

  // что рисует оружие в бою: спрайт из файла или код
  const FX_OF = { bolt: 'fx_arrow', drone: 'fx_drone', whip: 'fx_scythe', orbit: 'fx_fire_orb', bomb: 'fx_bomb', meteor: 'fx_meteor', boomerang: 'fx_boomerang', aura: 'fx_aura_ring',
    fireball: 'fx_fireball', axe: 'fx_axe', holywater: 'fx_holywater', sun_vortex: 'fx_fire_orb', inferno: 'fx_bomb', armageddon: 'fx_meteor', drone_swarm: 'fx_drone', batswarm: 'enemy_bat', night_flock: 'enemy_bat' };
  const fxNote = id => {
    const W = WEAPONS[id] || EVOLUTIONS[id], k = W.base && W.base.block ? null : FX_OF[id] || FX_OF[W.type];   // щиты — дуги кодом
    const zone = ['bomb', 'inferno'].includes(id) ? ' + огонь на земле: fx/fire_ring.png' : '';
    if (k && Art.img[k]) return `<div class="d fxline">🎯 В бою: <b>${(ART[k].file || k).replace(/^art\//, '')}</b>${zone}</div>`;
    return `<div class="d fxline warn">🎯 В бою: эффект нарисован кодом${zone}</div>`;
  };

  async function run() {
    for (const k in ART) if (Art.lazy(k)) Art.need(k);   // боссы и герои грузятся по требованию
    await wait(2500);                                      // арт догружается
    Save.data.settings.numbers = false; Save.data.settings.sound = false; Save.data.settings.music = false; Save.data.settings.haptics = false;
    for (const id in IconArt.DRAW) if (!ART['icon_' + id]) ART['icon_' + id] = { drawn: 1 };   // иконки, нарисованные кодом
    const spawner = Game.spawner; Game.spawner = () => { };
    const shots = {};
    for (const id of [...Object.keys(WEAPONS), ...Object.keys(EVOLUTIONS)]) { try { shots[id] = shotOf(id); } catch (e) { console.warn(id, e); } }
    Game.spawner = spawner; Game.state = 'menu';

    const S = [];
    const evoOf = id => Object.entries(EVOLUTIONS).find(([, e]) => e.from === id);
    const icon = (id, def, desc) => card({ key: Art.img['icon_' + id] ? 'icon_' + id : null, emoji: emo(def.icon), name: def.name, id, desc,
      noArtText: '⚠️ эмодзи — нужна иконка', shot: shots[id], extra: shots[id] ? fxNote(id) : '' });
    S.push(section('⚔️ Оружие', 'Слева — иконка, справа — как оружие выглядит в бою (максимальный уровень, тестовая сцена).',
      Object.entries(WEAPONS).map(([id, w]) => { const e = evoOf(id); return icon(id, w, (e ? `Эволюция → ${e[1].name} (+ ${(PASSIVES[e[1].with] || WEAPONS[e[1].with] || {}).name || e[1].with}). ` : '') + w.desc); }), 'wide'));
    S.push(section('✨ Эволюции', '', Object.entries(EVOLUTIONS).map(([id, e]) => icon(id, e, `${(WEAPONS[e.from] || {}).name} + ${(PASSIVES[e.with] || WEAPONS[e.with] || {}).name}. ${e.desc}`)), 'wide'));
    S.push(section('🛡 Пассивные способности', '', Object.entries(PASSIVES).map(([id, p]) => card({ key: Art.img['icon_' + id] ? 'icon_' + id : null, emoji: emo(p.icon), name: p.name, id, desc: p.desc, noArtText: '⚠️ эмодзи — нужна иконка' }))));
    S.push(section('🧪 Бустеры', '', Object.entries(BOOSTERS).map(([id, b]) => card({ emoji: b.icon, name: b.name, id, desc: b.desc, noArtText: '⚠️ эмодзи' }))));
    S.push(section('🧙 Герои', '', Object.entries(HEROES).map(([id, h]) => card({ key: Art.img['hero_' + id + '_big'] ? 'hero_' + id + '_big' : 'hero_' + id, name: h.name, id, emoji: '🧙',
      desc: `${h.price ? h.price + ' 🪙' : 'бесплатно'} · ${h.passive}` + (HERO_DASH[id] ? ` · рывок: ${HERO_DASH[id].name} (эффект рывка — кодом)` : '') })), 'mid'));
    S.push(section('👾 Враги', '', Object.keys(ART).filter(k => k.startsWith('enemy_') && !k.endsWith('_big')).map(k => {
      const id = k.slice(6), base = ENEMIES[id] || ENEMIES[id.split('_')[0]] || {};
      return card({ key: k, name: base.name ? base.name + (ENEMIES[id] ? '' : ' (' + id.split('_').slice(1).join(' ') + ')') : id, id, emoji: base.emoji,
        desc: ENEMIES[id] ? `HP ${base.hp} · урон ${base.dmg}` + (base.shoot || base.lob ? ' · стреляет (снаряд — кодом)' : '') : '' }); }), 'mid'));
    const bossName = {}; STAGES.forEach(s => { if (s.boss.art) bossName['boss_' + s.boss.art] = s.boss.name + ' — ' + s.name; });
    S.push(section('💀 Боссы', 'Атаки боссов (кольца, рывки, снаряды) рисуются кодом.', Object.keys(ART).filter(k => k.startsWith('boss_') && !k.endsWith('_big')).map(k => card({ key: k, name: bossName[k] || k.slice(5), id: k.slice(5), emoji: '💀' })), 'mid'));
    S.push(section('💥 Спрайты эффектов (есть)', '', Object.keys(ART).filter(k => k.startsWith('fx_')).map(k => card({ key: k, name: k.slice(3), id: k }))));
    const codeFx = [['💎', 'Кристаллы опыта', 'gem'], ['🪙', 'Монеты', 'coin'], ['🟢', 'Зелёные монеты', 'green'], ['❤️', 'Сердце (лечение)', 'heart'], ['🧲', 'Магнит', 'magnet'],
      ['📦', 'Сундук (обычный)', 'chest'], ['🎁', 'Редкий сундук', 'rare_chest'], ['🏹', 'Стрелы/снаряды врагов', 'enemy_bullet'], ['🕸', 'Паутина', 'web'], ['🌋', 'Лава / ядовитые облака', 'lava'],
      ['💥', 'Взрыв (вспышка)', 'boom'], ['⭕', 'Кольцо-волна', 'ring'], ['⚡', 'Молния', 'lightning'], ['👤', 'Рывки героев (след, телепорт…)', 'dash'], ['🛡', 'Оберег (блок удара)', 'ward']];
    S.push(section('✏️ Что ещё нарисовано кодом', 'Сюда тоже можно прислать арт.', codeFx.map(([e, n, id]) => card({ emoji: e, name: n, id, noArtText: '✏️ кодом' }))));
    const groundImg = type => { const c = document.createElement('canvas'); c.width = 220; c.height = 140; const x = c.getContext('2d'); x.fillStyle = Art.ground(x, type); x.fillRect(0, 0, 220, 140); return c.toDataURL('image/jpeg', 0.8); };
    S.push(section('🗺 Уровни', '', STAGES.map((s, i) => `<div class="c"><div class="th"><img src="${groundImg(s.ground)}"></div><div class="n">${i + 1}. ${esc(s.icon + ' ' + s.name)}</div>
      <div class="id">${s.id} · земля: ${s.ground}</div><span class="t code">✏️ земля кодом</span><div class="d">Босс: ${esc(s.boss.name)} · ${Math.round(s.duration / 60)} мин · ${s.reward} 🪙</div></div>`), 'mid'));

    const css = await (await fetch('tools/catalog.css')).text();
    document.head.innerHTML = `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Endless War — каталог арта</title><style>${css}</style>`;
    document.body.className = 'cat';
    document.body.innerHTML = `<h1>Endless War — каталог арта</h1>
      <div class="sub">Всё, что сейчас есть в игре. Собрано ${new Date().toLocaleDateString('ru-RU')}.</div>
      <div class="stat"><span>🖼 из файлов: <b>${cnt.ok}</b></span><span>✏️ кодом: <b>${cnt.code}</b></span><span>⚠️ без арта / эмодзи: <b>${cnt.no}</b></span></div>
      <div class="help"><ul>
        <li><span class="t ok">🖼 файл</span> — арт из твоих картинок. <span class="t code">✏️ кодом</span> — нарисовал сам, можно заменить. <span class="t no">⚠️</span> — эмодзи/заглушка.</li>
        <li>У оружия и эволюций справа — <b>кадр из боя</b>, а строка «🎯 В бою» говорит, спрайт там или графика кодом.</li>
        <li>Присылать можно как раньше: лист иконок на чёрном/прозрачном фоне, снаряды отдельно, анимации — кадры в ряд.</li></ul></div>
      ${S.join('')}`;
    document.body.setAttribute('data-done', '1');
  }
  addEventListener('load', () => run().catch(e => { document.body.setAttribute('data-err', e.stack); console.error(e); }));
})();
