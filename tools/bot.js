// Бот-игрок для проверки баланса (только для разработки, в игру не входит).
// Подключение в консоли браузера: eval(await (await fetch('tools/bot.js')).text())
// botRun(i) — пройти уровень i; botShop() — купить усиления; botStage(i, попыток) — уровень с повторами и магазином.
window.botRun = (stage, opts = {}) => {
  const dt = opts.dt || 1 / 30, maxT = opts.maxT || 1e9;
  const PASS_PRIO = ['power', 'tome', 'heart', 'armor', 'ward', 'amount', 'candle', 'regen', 'duration', 'magnet', 'boots', 'clover', 'crown', 'bracer', 'greed'];
  const choose = ch => {
    const p = Game.player, score = c => {
      if (c.kind === 'evo') return 100;
      if (c.kind === 'wup') { const w = p.weapons.find(x => x.id === c.id); return 50 + w.level; }   // как человек: качаем основное оружие
      if (c.kind === 'wnew') return p.weapons.length < 3 ? 60 : 30;
      if (c.kind === 'pnew' || c.kind === 'pup') {
        const i = PASS_PRIO.indexOf(c.id);
        return 40 - i + (Object.values(EVOLUTIONS).some(e => e.with === c.id && p.weapons.some(w => w.id === e.from)) ? 8 : 0);
      }
      return 0;
    };
    let best = 0; ch.forEach((c, i) => { if (score(c) > score(ch[best])) best = i; }); return best;
  };
  Game.start(stage);
  const p = Game.player, st = { minHp: 1e9, dmgTaken: 0, bossT: null, bossKillT: null, died: false, evoT: null, src: {} };
  const hp0 = Game.hurtPlayer.bind(Game);
  Game.hurtPlayer = function (d) {
    let who = 'снаряды/зоны', best = 1e9;
    for (const e of this.enemies) { const dd = Math.hypot(e.x - p.x, e.y - p.y) - e.r - p.r; if (dd < 4 && dd < best) { best = dd; who = e.boss ? 'босс' : e.type; } }
    const before = p.hp; hp0(d); const took = Math.max(0, before - p.hp);
    st.dmgTaken += took; st.src[who] = (st.src[who] || 0) + took;
  };
  let maxStep = 0;
  while (Game.time < maxT) {
    if (Game.state === 'levelup') { Game.pick(choose(Game.choices)); continue; }
    if (Game.state === 'chest') { Game.pickChest(choose(Game.chestChoices)); continue; }
    if (Game.state === 'rare') { if (Game.green >= RARE_CHEST_COST) Game.buyRare(); else Game.skipRare(); continue; }
    if (Game.state === 'booster') { Game.pickBooster(Game.boosterChoices[0]); continue; }
    if (Game.state === 'revive') { Game.declineRevive(); continue; }   // бот не платит за воскрешение
    if (Game.state === 'dying') { st.died = true; break; }
    if (Game.state === 'over') break;
    // движение: уходить от ближних врагов по касательной, собирать кристаллы
    let rx = 0, ry = 0, near = 0;
    for (const e of Game.enemies) { const dx = e.x - p.x, dy = e.y - p.y, d2 = dx * dx + dy * dy; if (d2 < 170 * 170) { const w = 1 / (d2 + 60); rx -= dx * w; ry -= dy * w; if (d2 < 60 * 60) near++; } }
    for (const b of Game.ebullets) { const dx = b.x - p.x, dy = b.y - p.y, d2 = dx * dx + dy * dy; if (d2 < 90 * 90) { rx -= dx / (d2 + 30) * 2; ry -= dy / (d2 + 30) * 2; } }
    let gx = 0, gy = 0, bd = 1e12;
    for (const k of Game.pickups) { if (k.kind === 'heart' && p.hp > p.stats.maxHp * 0.7) continue; const d2 = (k.x - p.x) ** 2 + (k.y - p.y) ** 2; if (d2 < bd) { bd = d2; gx = k.x - p.x; gy = k.y - p.y; } }
    if (Game.boss && !Game.boss.dead) {                // как человек: держимся на средней дистанции от босса и кружим
      const b = Game.boss, dx = b.x - p.x, dy = b.y - p.y, d = Math.hypot(dx, dy) || 1, want = 190;
      const k = (d - want) / want * 0.02; rx += dx / d * k; ry += dy / d * k;
      rx += -dy / d * 0.004; ry += dx / d * 0.004;
    }
    const rl = Math.hypot(rx, ry), gl = Math.hypot(gx, gy) || 1;
    let mx, my;
    if (rl > 1e-4) { mx = rx / rl + ry / rl * 0.6 + gx / gl * 0.35; my = ry / rl - rx / rl * 0.6 + gy / gl * 0.35; }
    else { mx = gx / gl; my = gy / gl; if (bd > 600 * 600) { mx = Math.cos(Game.time * 0.3); my = Math.sin(Game.time * 0.3); } }
    Input.keys = {};
    if (Math.abs(mx) > Math.abs(my) * 0.4) Input.keys[mx > 0 ? 'KeyD' : 'KeyA'] = true;
    if (Math.abs(my) > Math.abs(mx) * 0.4) Input.keys[my > 0 ? 'KeyS' : 'KeyW'] = true;
    if (near >= 3 && p.dashCd <= 0) Game.useDash();
    const s = performance.now(); Game.update(dt); maxStep = Math.max(maxStep, performance.now() - s);
    if (Game.boss && st.bossT === null) st.bossT = Game.time;
    if (st.bossT !== null && st.bossKillT === null && Game.victoryT > 0) st.bossKillT = Game.time;
    if (st.evoT === null && p.weapons.some(w => w.evo)) st.evoT = Math.round(Game.time);
    st.minHp = Math.min(st.minHp, p.hp / p.stats.maxHp);
  }
  Input.keys = {}; Game.hurtPlayer = hp0;
  const res = {
    win: !st.died && st.bossKillT !== null, t: Math.round(Game.time), dur: STAGES[stage] ? STAGES[stage].duration : 0,
    lvl: p.level, kills: Game.kills, minHpPct: Math.round(st.minHp * 100), dmgTaken: Math.round(st.dmgTaken),
    bossAt: st.bossT && Math.round(st.bossT), bossKilledIn: st.bossKillT && Math.round(st.bossKillT - st.bossT),
    bossHpLeft: Game.boss && !Game.boss.dead ? Math.round(Game.boss.hp / Game.boss.maxHp * 100) + '%' : '-',
    evoAt: st.evoT, src: Object.entries(st.src).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => k + ':' + Math.round(v)).join(' '),
    build: p.weapons.map(w => w.id + (w.evo ? '★' : w.level)).join(' ') + ' | ' + p.passives.map(x => x.id + x.level).join(' '), ms: maxStep.toFixed(1),
  };
  if (Game.state === 'dying') { Game.dyingT = 0; Game.frame(performance.now()); }
  return res;
};

// Магазин: жадно покупаем самые дешёвые усиления
window.botShop = () => {
  const d = Save.data, bought = [];
  for (;;) {
    let best = null, bc = 1e9;
    for (const id in UPGRADES) { const lv = d.upgrades[id] || 0; if (lv >= UPGRADES[id].max || id === 'reroll') continue; const c = upgradeCost(id, lv); if (c < bc) { bc = c; best = id; } }
    if (!best || bc > d.coins) break;
    d.coins -= bc; d.upgrades[best] = (d.upgrades[best] || 0) + 1; bought.push(best);
  }
  Save.save(); return bought.length ? bought.join(',') : '—';
};

window.campaignLog = window.campaignLog || [];
window.botStage = (i, tries = 3) => {
  const out = [];
  for (let a = 1; a <= tries; a++) {
    const coins0 = Save.data.coins, r = botRun(i), earned = Save.data.coins - coins0, shop = botShop();
    const line = `${i + 1}.${STAGES[i].name} #${a}: ${r.win ? 'ПОБЕДА' : 'смерть'} ${r.t}/${r.dur}с ур.${r.lvl} убито ${r.kills} | босс: ${r.bossAt ? (r.bossKilledIn !== null ? 'убит за ' + r.bossKilledIn + 'с' : 'осталось ' + r.bossHpLeft) : 'не дошёл'} | minHP ${r.minHpPct}% | урон: ${r.src} | эволюция: ${r.evoAt ?? '-'} | +${earned}🪙 купил: ${shop} | ${r.build}`;
    out.push(line); campaignLog.push(line);
    if (r.win) break;
  }
  return out.join('\n');
};
'bot loaded';
