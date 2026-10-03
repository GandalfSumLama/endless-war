'use strict';
// ===== English: строки интерфейса (ключ — русский текст из t('…')) и перевод игровых данных =====
// Новую строку в интерфейсе — оборачивай в t('…') и добавляй сюда перевод. Новое оружие/героя/уровень — добавь в EN_DATA.
I18N.en = {
  // меню и экраны
  '▶ ИГРАТЬ': '▶ PLAY', 'Магазин': 'Shop', 'Коллекция': 'Collection', 'Настройки': 'Settings', 'Назад': 'Back', 'Пауза': 'Pause', 'Прыжок': 'Dash',
  'Не хватает монет': 'Not enough coins', 'Возвращено 🪙 {0}': 'Refunded 🪙 {0}',
  'Стереть весь прогресс? Это нельзя отменить.': 'Erase all progress? This cannot be undone.',
  'Выбор уровня': 'Choose a Stage', 'Пройди предыдущий уровень': 'Clear the previous stage', ' · открывает: ': ' · unlocks: ',
  'Откроется после 1-го уровня': 'Unlocks after stage 1', '🏅 Рекорд: {0}': '🏅 Best: {0}',
  '🧙 Герои': '🧙 Heroes', '✨ Навыки': '✨ Skills', '⬆️ Усиления': '⬆️ Upgrades', '✓ Выбран': '✓ Selected', 'Выбрать': 'Select', 'Старт: ': 'Start: ',
  '{0} с': '{0} s', 'или пройди «{0}»': 'or clear “{0}”', 'Оружие': 'Weapons', 'Предметы': 'Items',
  '↺ Сбросить усиления (вернуть монеты)': '↺ Reset upgrades (refund coins)',
  '✅ Повержен · награда 🪙 {0} получена': '✅ Defeated · reward 🪙 {0} received', '⚔️ Ещё не побеждён': '⚔️ Not defeated yet',
  'Трофеи': 'Trophies', 'Боссов повержено': 'Bosses defeated', '♾️ Рекорд': '♾️ Best', '💀 В рекорде': '💀 In best run',
  'СОЮЗ': 'UNION', 'ЭВОЛЮЦИЯ': 'EVOLUTION', 'НОВОЕ': 'NEW', '⚗️ Эволюции': '⚗️ Evolutions',
  'Галочка ✓ — навык будет попадаться в забеге. Сними её, чтобы убрать навык из выбора при повышении уровня.':
    'Checkmark ✓ — the skill can show up in runs. Uncheck it to remove the skill from level-up choices.',
  'в забеге {0}': 'in runs {0}', 'Эволюции и союзы': 'Evolutions and unions', 'Бустеры (редкие сундуки, 🟢 {0})': 'Boosters (rare chests, 🟢 {0})',
  'Статистика': 'Statistics', 'Забегов': 'Runs', 'Убито': 'Kills', 'Монет': 'Coins',
  'Звук': 'Sound', 'Музыка': 'Music', 'Вибрация': 'Vibration', 'Цифры урона': 'Damage numbers', 'Цифры': 'Numbers',
  'Язык': 'Language', '👥 Авторы': '👥 Credits', '🗑 Сбросить прогресс': '🗑 Reset progress', 'обновлено': 'updated',
  // авторы
  'Авторы': 'Credits', 'Герои, монстры, боссы, мир и эффекты': 'Heroes, monsters, bosses, world and effects',
  'Графика из игры <b>FLARE</b> (flareteam/flare-game, flarerpg.org). Лицензия <b>CC-BY-SA 3.0</b> (creativecommons.org/licenses/by-sa/3.0). Спрайты изменены: вырезаны кадры, масштаб, перекраска, сборка героев из слоёв; изменённые спрайты распространяются под той же лицензией.':
    'Graphics from the game <b>FLARE</b> (flareteam/flare-game, flarerpg.org). License <b>CC-BY-SA 3.0</b> (creativecommons.org/licenses/by-sa/3.0). The sprites were modified: frames cut out, rescaled, recolored, heroes assembled from layers; the modified sprites are distributed under the same license.',
  'Художники FLARE': 'FLARE artists', 'Дополнительный арт FLARE': 'Additional FLARE art', 'Эффекты заклинаний': 'Spell effects',
  'Viktor Hahn — «Spell animation spritesheets», лицензия <b>CC-BY 4.0</b> (creativecommons.org/licenses/by/4.0), кадры уменьшены и прорежены. Mikodrak — «2D Spell Effects» (CC0). rubberduck — «Sparkling Fireball Effect» (CC0).':
    'Viktor Hahn — “Spell animation spritesheets”, license <b>CC-BY 4.0</b> (creativecommons.org/licenses/by/4.0), frames downscaled and thinned out. Mikodrak — “2D Spell Effects” (CC0). rubberduck — “Sparkling Fireball Effect” (CC0).',
  'Телепорт, удары, кровь, листья': 'Teleport, hits, blood, leaves',
  'rubberduck — «Teleporter effect» (CC0). Sinestesia — эффекты ударов и крови (CC0). bart — «Leaf spell», лицензия <b>CC-BY 3.0</b> (creativecommons.org/licenses/by/3.0), кадры уменьшены и прорежены. Всё — opengameart.org.':
    'rubberduck — “Teleporter effect” (CC0). Sinestesia — hit and blood effects (CC0). bart — “Leaf spell”, license <b>CC-BY 3.0</b> (creativecommons.org/licenses/by/3.0), frames downscaled and thinned out. All from opengameart.org.',
  'Мечи, щиты, оберег, дрон': 'Swords, shields, ward, drone',
  'Wenrexa — «Sprites Weapon: Swords» (CC0). Cethiel — «Angel Shield Effect» (CC0). The Higalina Vault — «Fantasy Shield Icons» (higalina.itch.io). engvee и Maksim Bugrimov — «FREE Isometric Animated Drone» (engvee.itch.io).':
    'Wenrexa — “Sprites Weapon: Swords” (CC0). Cethiel — “Angel Shield Effect” (CC0). The Higalina Vault — “Fantasy Shield Icons” (higalina.itch.io). engvee and Maksim Bugrimov — “FREE Isometric Animated Drone” (engvee.itch.io).',
  'Иконки, эффекты оружия, интерфейс': 'Icons, weapon effects, interface', 'Оригинальный арт Endless War.': 'Original Endless War art.',
  // описание навыка
  'Нужно оставить хотя бы {0} оружия': 'Keep at least {0} weapons enabled', 'Нужно оставить хотя бы {0} предметов': 'Keep at least {0} items enabled',
  'купить в магазине (вкладка «Навыки») за 🪙 {0}': 'buy it in the shop (“Skills” tab) for 🪙 {0}', 'пройти уровень «{0}»': 'clear the stage “{0}”',
  'купить героя «{0}» — он начинает с этим оружием': 'buy the hero “{0}”, who starts with this weapon', ', или ': ', or ',
  '<b>Закрыто.</b> Как открыть: {0}.': '<b>Locked.</b> How to unlock: {0}.',
  'Оружие · до {0} уровня': 'Weapon · up to level {0}', 'Предмет (пассивный) · до {0} уровня': 'Item (passive) · up to level {0}',
  'Прокачка': 'Levels', 'Ур. {0}': 'Lv. {0}', 'Эволюции': 'Evolutions', '{0} ур.': 'lv {0}', '{0} за каждый уровень.': '{0} per level.',
  'Нужен для эволюции': 'Required for evolution', 'Союз двух оружий': 'Union of two weapons', 'Эволюция оружия': 'Weapon evolution',
  'Ещё не открыта. Собери рецепт в забеге — и узнаешь, что это.': 'Not discovered yet. Complete the recipe in a run to find out what it is.',
  'Рецепт': 'Recipe', ' (вливается в эволюцию, слот освобождается)': ' (merges into the evolution, freeing its slot)',
  'Когда рецепт собран, эволюция появится среди вариантов при повышении уровня или выпадет из сундука элитного врага.':
    'Once the recipe is complete, the evolution shows up among level-up choices or drops from an elite enemy’s chest.',
  '✓ Попадается в забеге — убрать': '✓ Shows up in runs — remove', '✕ Убран из забегов — вернуть': '✕ Removed from runs — bring back',
  // окна в забеге
  'Точно сдаться?': 'Really give up?', 'Забег закончится. Собранные монеты (🪙 {0}) сохранятся, прогресс уровня — нет.': 'The run will end. Collected coins (🪙 {0}) are kept, stage progress is not.',
  'Да, сдаться': 'Yes, give up', 'Отмена': 'Cancel', 'Сдаться': 'Give up', 'ВЫ ПАЛИ': 'YOU FELL',
  'Вернуться в бой с половиной здоровья? Можно только один раз за забег.': 'Return to battle with half health? Only once per run.',
  'У тебя: ': 'You have: ', '✨ Воскреснуть за 🪙 {0}': '✨ Revive for 🪙 {0}', 'Не хватает 🪙 {0}': 'You need 🪙 {0} more',
  'РЕДКИЙ СУНДУК': 'RARE CHEST', 'Внутри — бустер на выбор из трёх: магнит на всю карту, суперскорость, двойная перезарядка и другие.':
    'Inside: pick one of three boosters — a map-wide magnet, super speed, double recharge and more.',
  'Открыть за 🟢 {0}': 'Open for 🟢 {0}', 'Не сейчас': 'Not now',
  'Зелёные монеты редко падают с врагов, чаще — с элиты и боссов и иногда лежат в сундуках. Они действуют только в текущем уровне.':
    'Green coins rarely drop from enemies, more often from elites and bosses, and sometimes lie in chests. They only work in the current stage.',
  'сразу': 'instant', 'ВЫБЕРИ БУСТЕР': 'CHOOSE A BOOSTER', 'Крутится…': 'Spinning…', 'НОВЫЙ УРОВЕНЬ': 'LEVEL UP', '🎲 Перебросить ({0})': '🎲 Reroll ({0})',
  'СУНДУК!': 'CHEST!', 'Выбери одну награду': 'Choose one reward',
  'Здоровье': 'Health', 'Урон': 'Damage', 'Перезарядка': 'Cooldown', 'Область': 'Area', 'Скорость': 'Speed', 'Броня': 'Armor',
  'Крит': 'Crit', 'Реген': 'Regen', '{0}/с': '{0}/s', 'Подбор': 'Pickup', 'Опыт': 'XP', 'Монеты': 'Coins', 'Вампиризм': 'Lifesteal',
  'ПАУЗА': 'PAUSED', '▶ Продолжить': '▶ Resume', '🏳 Сдаться': '🏳 Give up',
  '🏆 ПОБЕДА!': '🏆 VICTORY!', 'ЗАБЕГ ОКОНЧЕН': 'RUN OVER', '💀 ВЫ ПАЛИ': '💀 YOU FELL', 'Открыты навыки': 'Skills unlocked', 'Новые эволюции': 'New evolutions',
  '🏅 НОВЫЙ РЕКОРД': '🏅 NEW RECORD', '⏱ Время': '⏱ Time', '💀 Убито': '💀 Kills', '⭐ Уровень': '⭐ Level', '🪙 Собрано': '🪙 Collected',
  'Награда': 'Reward', 'Утешение': 'Consolation', '↻ Ещё раз': '↻ Play again', 'В меню': 'Main menu',
  // бой
  '⚗️ Эволюция: {0} ур. + {1} {2} ур.': '⚗️ Evolution: lv {0} + {1} lv {2}',
  '⚗️ Эволюция для {0} {1} ур. (этот предмет — {2} ур.)': '⚗️ Evolution for {0} lv {1} (this item: lv {2})',
  'Жареная курица': 'Roast Chicken', 'Восстанавливает 30% здоровья': 'Restores 30% health',
  '🎲 Удача! Урон ×2': '🎲 Lucky! Damage ×2', '👑 Чемпион: {0}': '👑 Champion: {0}', 'Блок!': 'Block!',
  '✝️ Воскрешение!': '✝️ Revived!', '✨ Воскрешение!': '✨ Revived!', 'УР. {0}': 'LV {0}', 'босс в {0}': 'boss at {0}', 'БОСС!': 'BOSS!',
};

// Игровые данные: id → [название, описание] (или поля объекта)
const EN_DATA = {
  weapons: {
    shield: ['Guardian Shields', 'Shields circle the hero, block enemy projectiles and push enemies back.'],
    bolt: ['Magic Bolt', 'Fires a projectile at the nearest enemy.'],
    knife: ['Daggers', 'Throws daggers in the direction you move.'],
    aura: ['Holy Aura', 'Constantly damages enemies around the hero.'],
    orbit: ['Orbiting Spheres', 'Spheres revolve around the hero.'],
    whip: ['Moon Scythe', 'Slashes enemies to the sides.'],
    lightning: ['Chain Lightning', 'Strikes random enemies and jumps between them.'],
    bomb: ['Fire Bomb', 'Explodes and leaves flames behind.'],
    boomerang: ['Boomerang', 'Flies forward and comes back.'],
    frost: ['Frost Nova', 'A wave of cold that damages and slows.'],
    beam: ['Light Beam', 'A piercing beam aimed at an enemy.'],
    meteor: ['Meteor', 'Calls meteors down on enemies.'],
    drone: ['Combat Drone', 'A helper drone shoots at enemies.'],
    spikes: ['Blood Spikes', 'Spikes burst from the ground beneath enemies.'],
    plague: ['Poison Trail', 'A toxic cloud trails behind the hero.'],
    shuriken: ['Shuriken', 'Spin outward in a spiral in every direction.'],
    turret: ['Guardian Totem', 'Places a totem that shoots enemies on its own.'],
    lances: ['Ice Lances', 'Fires ice lances in every direction.'],
    swords: ['Phantom Swords', 'Swords hover nearby and strike enemies on their own.'],
    quake: ['Earthquake', 'Cracks spread across the ground and stun enemies.'],
    starfall: ['Starfall', 'Stars keep falling around the hero.'],
    tornado: ['Whirlwind', 'Whirlwinds move away from the hero and pull enemies in.'],
    batswarm: ['Bat Swarm', 'Bats seek out enemies on their own.'],
    fireball: ['Fireball', 'A fireball flies at the nearest enemy and explodes, setting everyone nearby on fire.'],
    holywater: ['Holy Water', 'Throws flasks of holy water that leave blessed puddles damaging enemies.'],
    axe: ['Battle Axe', 'Tosses heavy axes that arc up and fall back down, cutting through crowds.'],
  },
  evolutions: {
    aegis: ['Aegis', 'Huge shields block all projectiles; Ward recharges twice as fast.'],
    arcane_storm: ['Arcane Storm', 'Homing piercing projectiles.'],
    thousand_blades: ['Thousand Blades', 'An endless stream of blades.'],
    blood_aura: ['Blood Aura', 'A huge aura that heals and slows.'],
    sun_vortex: ['Sun Vortex', 'Eternal blazing spheres.'],
    soul_reaper: ['Soul Reaper', 'Wide sweeps that steal life.'],
    heaven_wrath: ['Wrath of Heaven', 'A thunderstorm with frequent crits.'],
    inferno: ['Inferno', 'Huge lakes of fire.'],
    cyclone: ['Cyclone', 'A whirl of boomerangs in every direction.'],
    absolute_zero: ['Absolute Zero', 'Freezes everything; the ice shatters (x2 damage).'],
    prism: ['Prism', 'A fan of rainbow beams.'],
    armageddon: ['Armageddon', 'A meteor rain that leaves fiery craters.'],
    drone_swarm: ['Drone Swarm', 'A squadron of rapid-fire drones.'],
    steam_burst: ['Steam Burst', 'UNION: icy flames slow everyone.'],
    storm_orbs: ['Storm Orbs', 'UNION: eternal spheres that strike with lightning.'],
    blood_forest: ['Blood Forest', 'A forest of life-stealing blood spikes.'],
    pestilence: ['Pestilence', 'A thick plague cloud that damages and slows.'],
    shuriken_storm: ['Shuriken Storm', 'A tornado of endlessly piercing shuriken.'],
    fortress: ['Fortress', 'Three totems keep up nonstop fire.'],
    frost_star: ['Frost Star', 'A star of freezing lances.'],
    blade_dance: ['Blade Dance', 'A relentless whirl of phantom blades.'],
    rift: ['Rift', 'The ground splits open in every direction.'],
    meteor_shower: ['Star Shower', 'A downpour of falling stars.'],
    hurricane: ['Hurricane', 'Huge whirlwinds that suck in whole crowds.'],
    night_flock: ['Night Flock', 'A cloud of bats drinking enemy blood.'],
    phoenix: ['Phoenix', 'Volleys of huge fireballs that burn down entire crowds.'],
    holy_spring: ['Holy Spring', 'Huge holy puddles; standing in them heals the hero.'],
    death_spiral: ['Death Spiral', 'Huge axes fly in every direction, smashing through everything.'],
  },
  passives: {
    power: ['Power', '+5% damage'], tome: ['Tome', '−4% cooldown'], candle: ['Candle', '+5% attack area'], bracer: ['Bracers', '+5% projectile speed'],
    duration: ['Hourglass', '+6% effect duration'], heart: ['Heart', '+10 max health'], armor: ['Armor', '+0.5 armor (less incoming damage)'],
    boots: ['Boots', '+4% movement speed'], magnet: ['Magnet', '+15% pickup radius'], clover: ['Clover', '+2.5% critical hit chance'],
    regen: ['Regeneration', '+0.15 HP/sec'], crown: ['Crown', '+4% experience gained'], greed: ['Greed', '+7.5% coin drop chance'],
    fang: ['Vampire Fang', '+0.75% of damage dealt heals the hero'], thorns: ['Thorn Armor', 'When the hero is hit, spikes burst out around them (+12 damage per level)'],
    amount: ['Duplicator', 'Extra projectiles for all attacks',
      ['+1 projectile for all attacks', '+1 projectile and +5% damage', '+2 projectiles and +5% damage', '+2 projectiles and +10% damage', '+3 projectiles and +10% damage']],
    ward: ['Ward', 'Fully blocks any single hit, then recharges',
      ['Blocks once every 20 s', 'Recharge 18 s', 'Recharge 16 s', 'Recharge 14 s', 'Recharge 12 s', 'Recharge 10.5 s', 'Recharge 9 s', 'Recharge 8 s', 'Recharge 7.5 s', 'Recharge 7 s and 2 charges']],
  },
  boosters: {
    magnet: ['Great Magnet', 'Instantly pulls every crystal, coin and heart on the map to the hero'],
    speed: ['Super Speed', 'Running speed +80% for 20 seconds'],
    haste: ['Overdrive', 'Abilities recharge 2x faster (200%) for 20 seconds'],
    fury: ['Fury', 'All damage ×2 for 20 seconds'],
    shield: ['Divine Shield', 'Full invulnerability for 10 seconds'],
    xp2: ['Wisdom of Ages', 'Double experience for 30 seconds'],
    gold: ['Gold Rush', 'Coins drop 3x more often for 30 seconds'],
    heal: ['Elixir of Life', 'Fully restores health'],
    nuke: ['Divine Judgment', 'Massive damage to every enemy on screen'],
  },
  heroes: {   // [имя, особенность]
    wanderer: ['Wanderer', 'Experience gained +10%'], scavenger: ['Scavenger', 'Pickup radius +75%, speed +10%'],
    hunter: ['Huntress', 'Crit chance +15%, crit damage +50%'], guardian: ['Guardian', 'Health +50%, armor +2, speed −10%'],
    pyro: ['Pyromancer', 'Attack area +25%, damage +10%'], vampire: ['Vampire', 'Lifesteal: 4% of damage dealt heals'],
    gambler: ['Lucky One', 'Coin chance ×2, +1 choice on level up'], witch: ['Ice Witch', 'Cooldown −15%, duration +20%'],
    storm: ['Thunderer', '+1 projectile for all attacks'], necro: ['Necromancer', '15% chance: slain enemies explode'],
  },
  dash: {
    wanderer: ['Teleport', 'Instantly jumps forward; a damaging flash bursts at the arrival point'],
    scavenger: ['Blood Dash', 'A swift dash that leaves a bloody trail hurting enemies'],
    hunter: ['Somersault', 'Leaps over enemies (invulnerable in the air); a shockwave on landing'],
    guardian: ['Onslaught', 'Shield charge: knocks down and damages everyone in the way'],
    pyro: ['Fire Run', 'A fast run that leaves a burning trail behind'],
    vampire: ['Bat Swarm', 'Turns into a swarm of bats: flies through enemies and obstacles, invulnerable, heals at the end'],
    gambler: ['Lucky Jump', 'Teleports to a random spot nearby; 50% chance of ×2 damage for 4 seconds'],
    witch: ['Ice Slide', 'Slides across ice: the trail freezes enemies'],
    storm: ['Lightning', 'Turns into lightning and pierces enemies in the way; sparks jump to nearby foes'],
    necro: ['Spirit Flight', 'Becomes a ghost: flies through everything, invulnerable, ends with a soul blast'],
  },
  enemies: {
    crow: 'Lesser Wyvern', roach: 'Antlion Larva', skeleton: 'Skeleton', mushroom: 'Skeleton Mage', wolf: 'Goblin', gnome: 'Hobgoblin', spider: 'Weaver Ant',
    fire_golem: 'Giant Fire Ant', stone_golem: 'Antlion', water_golem: 'Water Wyvern', bat: 'Wyvern Hatchling', blast_beetle: 'Fire Ant', archer: 'Skeleton Archer',
    sporeling: 'Plague Zombie', dire_wolf: 'Goblin Veteran', diver: 'Fire Wyvern', bomber: 'Hobgoblin Thrower',
  },
  stages: {   // [название, описание, босс]
    forest: ['Dark Forest', 'Survive 5 minutes and defeat the pack leader.', 'Goblin Chief'],
    crypt: ['Forgotten Graveyard', 'Bones know no rest. 7 minutes until the Bone Lord.', 'Lich'],
    north: ['Northern Wastes', 'Cold in the blood. 8 minutes until the Ice Leader.', 'Ice Wyvern'],
    mines: ['Gnome Mines', 'Short in stature, huge in fury. 9 minutes.', 'Hobgoblin Warlord'],
    abyss: ['The Abyss', 'We see everything. 10 minutes until the Harbinger.', 'Dark Revenant'],
    desert: ['Blazing Sands', 'Heat, cacti and bones. 10 minutes until the Sand Queen.', 'Minotaur'],
    swamp: ['Rotten Swamp', 'Bogs, dead trees and spiders. 10 minutes.', 'Bog Antlion'],
    toxic: ['Toxic Wastes', 'Acid lakes and rusty towers. 11 minutes.', 'Plague Necromancer'],
    jungle: ['Lost Jungle', 'Ruins in the thicket. 11 minutes until the Jungle Beast.', 'Armored Antlion'],
    moon: ['Lunar Wasteland', 'Craters and ancient monoliths. The final trial: 12 minutes.', 'Mistress of Winds'],
    coast: ['Cursed Coast', 'The Executioner Shark rises from the waves. 12 minutes.', 'Drowned Giant'],
    canyon: ['Canyon of Shadows', 'The Shadow Reaper roams among the rocks. 12 minutes.', 'High Skeleton Mage'],
    sapphire: ['Sapphire Caves', 'The King of the Dead waits in the dark. 13 minutes.', 'Death Knight'],
    ruins: ['Ancient Ruins', 'The last battle: the Eye of the Abyss. 14 minutes.', 'Ancient Wyvern'],
  },
  endless: ['Endless War', 'Survive as long as you can. A boss every 5 minutes.'],
  upgrades: {
    might: ['Might', '+5% damage'], vitality: ['Vitality', '+10 health'], armor: ['Toughness', '+1 armor'], recovery: ['Recovery', '+0.1 HP/sec'],
    haste: ['Haste', '−3% cooldown'], area: ['Reach', '+5% attack area'], swift: ['Agility', '+4% speed'], magnet: ['Attraction', '+15% pickup radius'],
    growth: ['Wisdom', '+4% experience'], greed: ['Avarice', '+10% coin chance'], luck: ['Luck', '+3% crit chance'],
    reroll: ['Reroll', '+1 choice reroll per run'], revival: ['Revival', 'One revival per run'],
  },
  biomes: {
    meadow: 'Blooming Meadow', snow: 'Snowy Mountains', desert: 'Desert', forest: 'Dark Forest', swamp: 'Swamp', volcano: 'Volcano', canyon: 'Canyon', coast: 'Coast',
    crystal_blue: 'Blue Caves', ruins: 'Ancient Ruins', haunted: 'Cursed Forest', wheat: 'Wheat Fields', crystal_purple: 'Amethyst Caves', jungle: 'Jungle',
    toxic: 'Toxic Wastes', moon: 'Lunar Wasteland',
  },
};

// Улучшения оружия по уровням («+4 урона, быстрее»): переводим по частям через запятую
const EN_UPS = {
  fixed: {
    '+область': '+area', '+длина': '+length', '+урон': '+damage', '+1с действия': '+1s duration', 'Быстрее': 'Faster', 'быстрее': 'faster',
    'Быстрее и крупнее': 'Faster and bigger', 'Быстрее и шире': 'Faster and wider', 'Быстрее стрельба': 'Faster fire', 'дольше заморозка': 'longer freeze',
    'Взрыв больше': 'Bigger explosion', 'Длиннее': 'Longer', 'длиннее': 'longer', 'Дольше горит': 'Burns longer', 'Дольше живут': 'Last longer',
    'Дольше замедление': 'Longer slow', 'Дольше оглушение': 'Longer stun', 'Доп. удар': 'Extra strike', 'Замораживает': 'Freezes',
    'Крупнее и быстрее': 'Bigger and faster', 'Крупнее': 'Bigger', 'крупнее': 'bigger', 'Летят дальше': 'Fly farther', 'Лужа больше': 'Bigger puddle',
    'Облако держится дольше': 'Cloud lasts longer', 'Падают чаще': 'Fall more often', 'Стреляет чаще': 'Fires more often', 'Тотем стоит дольше': 'Totem lasts longer',
    'Удар в обе стороны': 'Strikes both sides', 'Урон чаще': 'Damage more often', 'Чаще атакуют': 'Attack more often', 'Чаще': 'More often',
    'Шире и быстрее': 'Wider and faster', 'Шире и длиннее': 'Wider and longer', 'Шире облако': 'Wider cloud', 'Шире': 'Wider', 'больше': 'bigger', 'дольше': 'longer',
    'сильнее поджог': 'stronger burn', 'сильнее пламя': 'stronger flames',
  },
  nouns: {   // слово → [одно, много]
    'бомба': ['bomb', 'bombs'], 'бумеранг': ['boomerang', 'boomerangs'], 'вихрь': ['whirlwind', 'whirlwinds'], 'дрон': ['drone', 'drones'], 'звезда': ['star', 'stars'],
    'кинжал': ['dagger', 'daggers'], 'луч': ['beam', 'beams'], 'метеор': ['meteor', 'meteors'], 'метеора': ['meteor', 'meteors'], 'меч': ['sword', 'swords'],
    'мышь': ['bat', 'bats'], 'пробивание': ['pierce', 'pierce'], 'пробивания': ['pierce', 'pierce'], 'разряд': ['strike', 'strikes'], 'снаряд': ['projectile', 'projectiles'],
    'сфера': ['sphere', 'spheres'], 'сюрикен': ['shuriken', 'shuriken'], 'топор': ['axe', 'axes'], 'тотем': ['totem', 'totems'], 'трещина': ['crack', 'cracks'],
    'трещины': ['crack', 'cracks'], 'флакон': ['flask', 'flasks'], 'цепь': ['chain', 'chains'], 'цепи': ['chain', 'chains'], 'шар': ['fireball', 'fireballs'],
    'шип': ['spike', 'spikes'], 'щит': ['shield', 'shields'], 'копья': ['lance', 'lances'],
  },
  part(s) {
    if (this.fixed[s]) return this.fixed[s];
    let m = /^\+(\d+) урона в секунду$/.exec(s); if (m) return '+' + m[1] + ' damage per second';
    m = /^\+(\d+) урона$/.exec(s); if (m) return '+' + m[1] + ' damage';
    m = /^\+(\d+) (\S+)$/.exec(s); if (m && this.nouns[m[2]]) return '+' + m[1] + ' ' + this.nouns[m[2]][m[1] === '1' ? 0 : 1];
    return s;
  },
  tr(d) { return d.split(', ').map(x => this.part(x)).join(', '); },
};

if (LANG === 'en') {
  const set = (obj, map, fields) => { for (const id in map) if (obj[id]) { const v = Array.isArray(map[id]) ? map[id] : [map[id]]; fields.forEach((f, i) => { if (v[i] !== undefined) obj[id][f] = v[i]; }); } };
  set(WEAPONS, EN_DATA.weapons, ['name', 'desc']);
  set(EVOLUTIONS, EN_DATA.evolutions, ['name', 'desc']);
  set(PASSIVES, EN_DATA.passives, ['name', 'desc', 'levels']);
  set(BOOSTERS, EN_DATA.boosters, ['name', 'desc']);
  set(HEROES, EN_DATA.heroes, ['name', 'passive']);
  set(HERO_DASH, EN_DATA.dash, ['name', 'desc']);
  set(ENEMIES, EN_DATA.enemies, ['name']);
  set(UPGRADES, EN_DATA.upgrades, ['name', 'desc']);
  for (const id in EN_DATA.biomes) if (BIOME_NAMES[id]) BIOME_NAMES[id] = EN_DATA.biomes[id];
  for (const S of STAGES) { const v = EN_DATA.stages[S.id]; if (v) { S.name = v[0]; S.desc = v[1]; S.boss.name = v[2]; } }
  ENDLESS.name = EN_DATA.endless[0]; ENDLESS.desc = EN_DATA.endless[1];
  for (const id in WEAPONS) if (WEAPONS[id].ups) for (const u of WEAPONS[id].ups) u.d = EN_UPS.tr(u.d);
}
