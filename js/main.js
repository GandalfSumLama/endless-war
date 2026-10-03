'use strict';
// ===== Запуск =====
window.addEventListener('load', () => {
  const insets = () => { UI.updateInsets(); Game.resize(); };
  if (TG) {
    try {
      TG.ready(); TG.expand();
      if (TG.isVersionAtLeast('6.1')) { TG.setHeaderColor('#0d0a14'); TG.setBackgroundColor('#0d0a14'); }
      if (TG.isVersionAtLeast('7.7')) TG.disableVerticalSwipes();   // свайп вниз не закрывает игру
      // Telegram 8.0+: на телефонах — во весь экран и только вертикально
      if (TG.isVersionAtLeast('8.0') && (TG.platform === 'android' || TG.platform === 'ios')) {
        TG.requestFullscreen();
        TG.lockOrientation();
      }
      TG.onEvent('viewportChanged', insets);
      for (const ev of ['safeAreaChanged', 'contentSafeAreaChanged', 'fullscreenChanged']) TG.onEvent(ev, insets);
    } catch (e) { }
  }
  window.onNativeInsets = insets;                    // Android-обёртка сообщает размер выреза камеры
  Save.load();
  if (DBG.has('saver')) Save.data.settings.saver = true;   // отладка: замер режима экономии заряда
  if (DBG.has('nonum')) Save.data.settings.numbers = false;   // отладка: без цифр урона
  Game.init();
  UI.init();
  UI.updateInsets();
  HeroArt.build();                                   // герои без арта — рисунок кодом
  IconArt.build();                                   // иконки новых способностей
  Art.init();
  UI.menu();
  if (DBG.has('auto')) setTimeout(() => { Sfx.init(); const st = [...DBG].find(f => /^st\d+$/.test(f)); Game.start(st ? +st.slice(2) : 0); Game.player.invuln = 1e9;
    if (DBG.has('crowd')) { const p = Game.player, S = Game.stage, ts = [...new Set(S.waves.flatMap(w => w.types))]; Game.spawner = () => { };
      for (let i = 0; i < 150; i++) { const a = Math.random() * 6.28, d = 80 + Math.random() * 300, e = Game.spawnEnemy(ts[i % ts.length], { pos: { x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d } }); e.hp = e.maxHp = 1e9; }
      const wf = [...DBG].find(f => f.startsWith('w-'));   // w-quake-swords-ward: свой набор оружия и предметов (макс. уровень)
      (wf ? wf.split('-').slice(1) : ['bolt', 'knife', 'lightning', 'fireball']).forEach(id => { if (PASSIVES[id]) p.passives.push({ id, level: PASSIVES[id].max }); else if (WEAPONS[id] || EVOLUTIONS[id]) Game.addWeapon(id); });
      Game.recalc(); for (const w of p.weapons) { w.level = w.max; Game.calcWeapon(w); } p.xpNext = 1e9; }
  }, 1500);   // отладка: сразу в забег
  addEventListener('resize', () => UI.updateInsets());
  setTimeout(insets, 300);                           // вставки окна приходят чуть позже загрузки
  window.appPause = off => { if (off && Game.player && Game.state !== 'over' && Game.state !== 'menu') Save.save(); if (off && Game.state === 'playing') Game.pause(); if (Sfx.ctx) { if (off) Sfx.ctx.suspend(); else Sfx.ctx.resume(); } };
  document.addEventListener('visibilitychange', () => { if (document.hidden && Game.player && Game.state !== 'over' && Game.state !== 'menu') Save.save(); if (document.hidden && Game.state === 'playing') Game.pause(); if (Sfx.ctx) { if (document.hidden) Sfx.ctx.suspend(); else Sfx.ctx.resume(); } });
  window.addEventListener('pointerdown', () => Sfx.init(), { once: true });
});
