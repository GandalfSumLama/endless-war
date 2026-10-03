'use strict';
// ===== Все игровые данные: оружие, предметы, эволюции, герои, враги, уровни =====

// Оружие (активные скиллы). ups[i] — прибавка при переходе на уровень i+2.
const WEAPONS = {
  // Щиты-хранители: кружат рядом с героем, сбивают вражеские снаряды (пара для «Оберега»)
  shield: { name: 'Щиты-хранители', icon: '🔰', type: 'orbit', color: '#8ae0ff', desc: 'Щиты кружат рядом с героем, сбивают вражеские снаряды и отталкивают врагов.',
    base: { dmg: 8, amount: 2, radius: 42, rot: 2.6, dur: 0, cd: 0, size: 13, perm: 1, block: 1 },
    ups: [{ amount: 1, d: '+1 щит' }, { dmg: 4, d: '+4 урона' }, { size: 3, radius: 4, d: 'Крупнее' }, { rot: 0.5, dmg: 3, d: 'Быстрее, +3 урона' }, { amount: 1, d: '+1 щит' }, { dmg: 5, d: '+5 урона' }, { size: 3, d: 'Крупнее' }, { amount: 1, d: '+1 щит' }, { dmg: 6, rot: 0.4, d: '+6 урона, быстрее' }] },
  bolt: { name: 'Магическая стрела', icon: '✨', type: 'bolt', color: '#6ab4ff', desc: 'Выпускает снаряд в ближайшего врага.',
    base: { dmg: 13, cd: 0.9, amount: 1, speed: 340, pierce: 1, size: 6, life: 2 },
    ups: [{ amount: 1, d: '+1 снаряд' }, { dmg: 5, d: '+5 урона' }, { amount: 1, cd: -0.1, d: '+1 снаряд, быстрее' }, { pierce: 1, dmg: 5, d: '+1 пробивание, +5 урона' }, { amount: 1, dmg: 5, d: '+1 снаряд, +5 урона' }, { dmg: 6, d: '+6 урона' }, { amount: 1, d: '+1 снаряд' }, { pierce: 1, cd: -0.08, d: '+1 пробивание, быстрее' }, { amount: 1, dmg: 8, d: '+1 снаряд, +8 урона' }] },
  knife: { name: 'Кинжалы', icon: '🗡️', type: 'knife', color: '#e6edf5', desc: 'Метает кинжалы в направлении движения.',
    base: { dmg: 10, cd: 0.7, amount: 1, speed: 500, pierce: 1, size: 5, life: 1.1 },
    ups: [{ amount: 1, d: '+1 кинжал' }, { dmg: 4, cd: -0.1, d: '+4 урона, быстрее' }, { amount: 1, d: '+1 кинжал' }, { pierce: 1, d: '+1 пробивание' }, { amount: 1, dmg: 5, d: '+1 кинжал, +5 урона' }, { dmg: 5, d: '+5 урона' }, { amount: 1, d: '+1 кинжал' }, { cd: -0.08, pierce: 1, d: 'Быстрее, +1 пробивание' }, { amount: 1, dmg: 6, d: '+1 кинжал, +6 урона' }] },
  aura: { name: 'Святая аура', icon: '💫', type: 'aura', color: '#6ab4ff', desc: 'Постоянно ранит врагов вокруг героя.',
    base: { dmg: 7, tick: 0.45, radius: 60, knock: 3 },
    ups: [{ radius: 10, dmg: 2, d: '+область, +2 урона' }, { tick: -0.06, d: 'Урон чаще' }, { radius: 12, d: '+область' }, { dmg: 3, d: '+3 урона' }, { radius: 15, dmg: 3, d: '+область, +3 урона' }, { dmg: 3, d: '+3 урона' }, { radius: 10, d: '+область' }, { tick: -0.04, d: 'Урон чаще' }, { radius: 12, dmg: 4, d: '+область, +4 урона' }] },
  orbit: { name: 'Кружащие сферы', icon: '🔵', type: 'orbit', color: '#ff8a2a', desc: 'Сферы вращаются вокруг героя.',
    base: { dmg: 10, amount: 2, radius: 72, rot: 3.2, dur: 3, cd: 3, size: 9 },
    ups: [{ amount: 1, d: '+1 сфера' }, { radius: 10, rot: 0.5, d: 'Шире и быстрее' }, { dur: 1, dmg: 5, d: '+1с действия, +5 урона' }, { amount: 1, d: '+1 сфера' }, { dmg: 6, dur: 1, d: '+6 урона, +1с действия' }, { dmg: 6, d: '+6 урона' }, { amount: 1, d: '+1 сфера' }, { rot: 0.6, radius: 8, d: 'Быстрее и шире' }, { amount: 1, dmg: 8, d: '+1 сфера, +8 урона' }] },
  whip: { name: 'Лунная коса', icon: '🌙', type: 'whip', color: '#6ab4ff', desc: 'Рассекает врагов по бокам.',
    base: { dmg: 16, cd: 1.15, amount: 1, w: 130, h: 36 },
    ups: [{ amount: 1, d: 'Удар в обе стороны' }, { dmg: 6, d: '+6 урона' }, { w: 30, h: 8, d: '+область' }, { cd: -0.2, d: 'Быстрее' }, { dmg: 10, w: 20, d: '+10 урона, +длина' }, { dmg: 8, d: '+8 урона' }, { w: 25, h: 6, d: '+область' }, { cd: -0.12, d: 'Быстрее' }, { amount: 1, dmg: 10, d: 'Доп. удар, +10 урона' }] },
  lightning: { name: 'Цепная молния', icon: '⚡', type: 'lightning', color: '#6ac8ff', desc: 'Бьёт случайных врагов и перескакивает.',
    base: { dmg: 18, cd: 2, amount: 1, chain: 2, range: 120 },
    ups: [{ amount: 1, d: '+1 разряд' }, { chain: 1, dmg: 6, d: '+1 цепь, +6 урона' }, { cd: -0.3, d: 'Быстрее' }, { amount: 1, d: '+1 разряд' }, { chain: 2, dmg: 8, d: '+2 цепи, +8 урона' }, { dmg: 8, d: '+8 урона' }, { amount: 1, d: '+1 разряд' }, { chain: 1, cd: -0.2, d: '+1 цепь, быстрее' }, { amount: 1, dmg: 10, d: '+1 разряд, +10 урона' }] },
  bomb: { name: 'Огненная бомба', icon: '💣', type: 'bomb', color: '#ff8a3d', desc: 'Взрывается и оставляет пламя.',
    base: { dmg: 15, cd: 2.5, amount: 1, radius: 42, dur: 2, burn: 8 },
    ups: [{ radius: 8, d: '+область' }, { amount: 1, d: '+1 бомба' }, { dmg: 8, burn: 4, d: '+8 урона, сильнее пламя' }, { dur: 1, cd: -0.3, d: 'Дольше горит, быстрее' }, { amount: 1, radius: 10, d: '+1 бомба, +область' }, { dmg: 8, d: '+8 урона' }, { radius: 8, burn: 4, d: '+область, сильнее пламя' }, { amount: 1, d: '+1 бомба' }, { cd: -0.3, dmg: 10, d: 'Быстрее, +10 урона' }] },
  boomerang: { name: 'Бумеранг', icon: '🪃', type: 'boomerang', color: '#e0b070', desc: 'Летит вперёд и возвращается.',
    base: { dmg: 12, cd: 1.6, amount: 1, speed: 340, size: 10 },
    ups: [{ dmg: 5, d: '+5 урона' }, { amount: 1, d: '+1 бумеранг' }, { speed: 60, size: 3, d: 'Быстрее и крупнее' }, { amount: 1, d: '+1 бумеранг' }, { dmg: 8, d: '+8 урона' }, { dmg: 6, d: '+6 урона' }, { amount: 1, d: '+1 бумеранг' }, { size: 3, cd: -0.15, d: 'Крупнее и быстрее' }, { amount: 1, dmg: 8, d: '+1 бумеранг, +8 урона' }] },
  frost: { name: 'Ледяная нова', icon: '❄️', type: 'nova', color: '#9fe8ff', desc: 'Волна холода ранит и замедляет.',
    base: { dmg: 12, cd: 3.5, radius: 110, slow: 1.5, freeze: 0 },
    ups: [{ radius: 20, d: '+область' }, { dmg: 6, d: '+6 урона' }, { cd: -0.5, d: 'Быстрее' }, { slow: 1, d: 'Дольше замедление' }, { radius: 25, dmg: 8, freeze: 0.5, d: 'Замораживает, +урон' }, { dmg: 8, d: '+8 урона' }, { radius: 20, d: '+область' }, { cd: -0.4, freeze: 0.3, d: 'Быстрее, дольше заморозка' }, { dmg: 12, radius: 20, d: '+12 урона, +область' }] },
  beam: { name: 'Луч света', icon: '🔆', type: 'beam', color: '#fff6c0', desc: 'Пронзающий луч в сторону врага.',
    base: { dmg: 20, cd: 2.2, amount: 1, length: 260, width: 10 },
    ups: [{ width: 4, dmg: 6, d: 'Шире, +6 урона' }, { amount: 1, d: '+1 луч' }, { length: 60, d: '+длина' }, { cd: -0.4, d: 'Быстрее' }, { amount: 1, dmg: 10, d: '+1 луч, +10 урона' }, { dmg: 10, d: '+10 урона' }, { width: 4, length: 40, d: 'Шире и длиннее' }, { amount: 1, d: '+1 луч' }, { cd: -0.3, dmg: 12, d: 'Быстрее, +12 урона' }] },
  meteor: { name: 'Метеор', icon: '☄️', type: 'meteor', color: '#b060ff', desc: 'Обрушивает метеоры на врагов.',
    base: { dmg: 30, cd: 3.5, amount: 1, radius: 45, delay: 0.7 },
    ups: [{ amount: 1, d: '+1 метеор' }, { radius: 10, d: '+область' }, { dmg: 15, d: '+15 урона' }, { cd: -0.5, d: 'Быстрее' }, { amount: 2, d: '+2 метеора' }, { dmg: 15, d: '+15 урона' }, { amount: 1, d: '+1 метеор' }, { radius: 10, cd: -0.4, d: '+область, быстрее' }, { amount: 2, dmg: 15, d: '+2 метеора, +15 урона' }] },
  drone: { name: 'Боевой дрон', icon: '🛸', type: 'drone', color: '#6ac8ff', desc: 'Дрон-помощник стреляет по врагам.',
    base: { dmg: 9, cd: 0.8, amount: 1, speed: 420, pierce: 1 },
    ups: [{ dmg: 4, d: '+4 урона' }, { amount: 1, d: '+1 дрон' }, { cd: -0.15, d: 'Быстрее стрельба' }, { dmg: 5, pierce: 1, d: '+5 урона, +1 пробивание' }, { amount: 1, d: '+1 дрон' }, { dmg: 5, d: '+5 урона' }, { cd: -0.1, d: 'Быстрее стрельба' }, { amount: 1, d: '+1 дрон' }, { dmg: 6, pierce: 1, d: '+6 урона, +1 пробивание' }] },
};

// Эволюции: оружие макс. уровня + предмет (или второе оружие макс. уровня для СОЮЗА).
const EVOLUTIONS = {
  aegis: { name: 'Эгида', icon: '💠', from: 'shield', with: 'ward', type: 'orbit', color: '#b8f4ff', desc: 'Огромные щиты сбивают все снаряды; Оберег перезаряжается вдвое быстрее.',
    base: { dmg: 40, amount: 6, radius: 56, rot: 3.2, dur: 0, cd: 0, size: 20, perm: 1, block: 1, wardBoost: 1 } },
  arcane_storm: { name: 'Чародейский шторм', icon: '🌌', from: 'bolt', with: 'tome', type: 'bolt', color: '#c9a0ff', desc: 'Самонаводящиеся пробивающие снаряды.',
    base: { dmg: 48, cd: 0.55, amount: 7, speed: 380, pierce: 3, size: 8, life: 3, homing: 1 } },
  thousand_blades: { name: 'Тысяча клинков', icon: '⚔️', from: 'knife', with: 'bracer', type: 'knife', color: '#ffffff', desc: 'Непрерывный поток клинков.',
    base: { dmg: 32, cd: 0.12, amount: 2, speed: 600, pierce: 3, size: 6, life: 1.1 } },
  blood_aura: { name: 'Кровавая аура', icon: '🩸', from: 'aura', with: 'heart', type: 'aura', color: '#ff4a6a', desc: 'Огромная аура: лечит и замедляет.',
    base: { dmg: 28, tick: 0.35, radius: 150, knock: 4, leech: 1, slowAura: 1 } },
  sun_vortex: { name: 'Солнечный вихрь', icon: '🌞', from: 'orbit', with: 'duration', type: 'orbit', color: '#ffb040', desc: 'Вечные пылающие сферы.',
    base: { dmg: 48, amount: 8, radius: 96, rot: 4, dur: 0, cd: 0, size: 12, perm: 1, burn: 1 } },
  soul_reaper: { name: 'Жнец душ', icon: '💀', from: 'whip', with: 'regen', type: 'whip', color: '#b070ff', desc: 'Широкие взмахи, крадущие жизнь.',
    base: { dmg: 68, cd: 0.8, amount: 4, w: 210, h: 56, leech: 1 } },
  heaven_wrath: { name: 'Гнев небес', icon: '🌩️', from: 'lightning', with: 'clover', type: 'lightning', color: '#fffbd0', desc: 'Грозовой шквал с частыми критами.',
    base: { dmg: 84, cd: 0.9, amount: 6, chain: 8, range: 170, critBonus: 0.3 } },
  inferno: { name: 'Инферно', icon: '🔥', from: 'bomb', with: 'candle', type: 'bomb', color: '#ff5020', desc: 'Огромные огненные озёра.',
    base: { dmg: 80, cd: 1.4, amount: 5, radius: 100, dur: 4, burn: 30 } },
  cyclone: { name: 'Циклон', icon: '🌀', from: 'boomerang', with: 'amount', type: 'boomerang', color: '#ffd27a', desc: 'Вихрь бумерангов во все стороны.',
    base: { dmg: 56, cd: 1.1, amount: 7, speed: 420, size: 15, spiral: 1 } },
  absolute_zero: { name: 'Абсолютный ноль', icon: '🧊', from: 'frost', with: 'armor', type: 'nova', color: '#d8f8ff', desc: 'Замораживает всё, лёд раскалывается (x2 урон).',
    base: { dmg: 70, cd: 2.2, radius: 280, slow: 3, freeze: 2, shatter: 1 } },
  prism: { name: 'Призма', icon: '🌈', from: 'beam', with: 'power', type: 'beam', color: '#ffffff', desc: 'Веер радужных лучей.',
    base: { dmg: 90, cd: 1.0, amount: 6, length: 380, width: 18, rainbow: 1 } },
  armageddon: { name: 'Армагеддон', icon: '🌋', from: 'meteor', with: 'crown', type: 'meteor', color: '#ff3a1a', desc: 'Метеоритный дождь с огненными кратерами.',
    base: { dmg: 140, cd: 1.6, amount: 9, radius: 75, delay: 0.6, burn: 20, dur: 2 } },
  drone_swarm: { name: 'Рой дронов', icon: '🤖', from: 'drone', with: 'magnet', type: 'drone', color: '#40ffd0', desc: 'Эскадрилья скорострельных дронов.',
    base: { dmg: 40, cd: 0.35, amount: 6, speed: 520, pierce: 2 } },
  steam_burst: { name: 'Паровой взрыв', icon: '♨️', from: 'bomb', with: 'frost', union: 1, type: 'bomb', color: '#e0f0ff', desc: 'СОЮЗ: ледяное пламя замедляет всех.',
    base: { dmg: 110, cd: 1.5, amount: 5, radius: 115, dur: 3.5, burn: 26, chill: 1 } },
  storm_orbs: { name: 'Грозовые сферы', icon: '🔮', from: 'orbit', with: 'lightning', union: 1, type: 'orbit', color: '#b0f0ff', desc: 'СОЮЗ: вечные сферы, бьющие молниями.',
    base: { dmg: 44, amount: 7, radius: 92, rot: 3.6, dur: 0, cd: 0, size: 11, perm: 1, zap: 1 } },
};

// Пассивные предметы на забег
const PASSIVES = {
  power: { name: 'Сила', icon: '💪', max: 5, desc: '+10% урона', stat: { might: 0.1 } },
  tome: { name: 'Фолиант', icon: '📖', max: 5, desc: '−8% перезарядки', stat: { cooldown: -0.08 } },
  candle: { name: 'Свеча', icon: '🕯️', max: 5, desc: '+10% область атак', stat: { area: 0.1 } },
  bracer: { name: 'Наручи', icon: '🧤', max: 5, desc: '+10% скорость снарядов', stat: { projSpeed: 0.1 } },
  duration: { name: 'Песочные часы', icon: '⏳', max: 5, desc: '+12% длительность эффектов', stat: { duration: 0.12 } },
  amount: { name: 'Двойник', icon: '👥', max: 2, desc: '+1 снаряд ко всем атакам', stat: { amount: 1 } },
  heart: { name: 'Сердце', icon: '❤️', max: 5, desc: '+20 макс. здоровья', stat: { maxHp: 20 } },
  armor: { name: 'Броня', icon: '🛡️', max: 5, desc: '+1 броня (−1 входящий урон)', stat: { armor: 1 } },
  boots: { name: 'Сапоги', icon: '👢', max: 5, desc: '+8% скорость движения', stat: { speed: 0.08 } },
  magnet: { name: 'Магнит', icon: '🧲', max: 5, desc: '+30% радиус подбора', stat: { magnet: 0.3 } },
  clover: { name: 'Клевер', icon: '🍀', max: 5, desc: '+5% шанс крит. удара', stat: { crit: 0.05 } },
  regen: { name: 'Регенерация', icon: '💚', max: 5, desc: '+0.3 HP/сек', stat: { regen: 0.3 } },
  crown: { name: 'Корона', icon: '👑', max: 5, desc: '+8% получаемого опыта', stat: { growth: 0.08 } },
  greed: { name: 'Жадность', icon: '💰', max: 5, desc: '+15% шанс выпадения монет', stat: { greed: 0.15 } },
  // Оберег: блокирует одну любую атаку, потом перезаряжается (levels — описание каждого уровня)
  ward: { name: 'Оберег', icon: '🧿', max: 5, desc: 'Полностью блокирует один любой удар, затем перезаряжается', stat: { ward: 1 },
    levels: ['Блок раз в 20 с', 'Перезарядка 16 с', 'Перезарядка 12 с', 'Перезарядка 9 с', 'Перезарядка 7 с и 2 заряда'] },
};

// Открыты с самого начала; остальное — в магазине или за прохождение уровней
const DEFAULT_SKILLS = ['bolt', 'knife', 'aura', 'orbit', 'whip', 'lightning', 'bomb',
  'power', 'tome', 'candle', 'heart', 'armor', 'boots', 'magnet', 'regen', 'ward', 'shield'];
const SKILL_PRICE = { weapon: 250, passive: 150 };
// Сколько оружия (активных способностей) и предметов можно держать одновременно
const MAX_WEAPONS = 4, MAX_PASSIVES = 5;
// Оберег по уровням: перезарядка (с) и число зарядов
const WARD_CD = [0, 20, 16, 12, 9, 7], WARD_CHARGES = [0, 1, 1, 1, 1, 2];

// Монеты: шанс 2% с врага, 1–5 штук
const COIN_CHANCE = 0.02, COIN_MIN = 1, COIN_MAX = 5;
// Сердца: шанс с обычного врага (элита роняет всегда), лечат долю макс. здоровья
const HEART_CHANCE = 0.012, HEART_HEAL = 0.25;
// Зелёные монеты — третья, редкая валюта: открывают редкие сундуки с бустерами на карте
const GREEN_CHANCE = 0.004, GREEN_ELITE_CHANCE = 0.5, RARE_CHEST_COST = 3, RARE_CHEST_CHANCE = 0.07;
// Бустеры: временные (dur, сек) или мгновенные (dur: 0)
const BOOSTERS = {
  magnet: { name: 'Великий магнит', icon: '🧲', dur: 0, desc: 'Мгновенно притягивает к герою все кристаллы, монеты и сердца со всей карты' },
  speed: { name: 'Суперскорость', icon: '💨', dur: 20, desc: 'Скорость бега +80% на 20 секунд' },
  haste: { name: 'Перегрузка', icon: '⏱️', dur: 20, desc: 'Способности перезаряжаются в 2 раза быстрее (200%) на 20 секунд' },
  fury: { name: 'Ярость', icon: '🔥', dur: 20, desc: 'Весь урон ×2 на 20 секунд' },
  shield: { name: 'Божественный щит', icon: '🛡️', dur: 10, desc: 'Полная неуязвимость на 10 секунд' },
  xp2: { name: 'Мудрость веков', icon: '📚', dur: 30, desc: 'Двойной опыт на 30 секунд' },
  gold: { name: 'Золотая лихорадка', icon: '💰', dur: 30, desc: 'Монеты падают в 3 раза чаще на 30 секунд' },
  heal: { name: 'Эликсир жизни', icon: '🧪', dur: 0, desc: 'Полностью восстанавливает здоровье' },
  nuke: { name: 'Кара небес', icon: '☄️', dur: 0, desc: 'Огромный урон всем врагам на экране' },
};

// Герои. mods — пассивные особенности (складываются со статами).
const HEROES = {
  wanderer: { name: 'Странник', price: 0, start: 'bolt', color: '#5a4ac8', passive: 'Получаемый опыт +10%', mods: { growth: 0.1 } },
  scavenger: { name: 'Собиратель', price: 200, start: 'drone', color: '#c8202a', passive: 'Радиус подбора +75%, скорость +10%', mods: { magnet: 0.75, speed: 0.1 } },
  hunter: { name: 'Охотница', price: 400, start: 'boomerang', color: '#2a6ae0', passive: 'Шанс крита +15%, крит. урон +50%', mods: { crit: 0.15, critDmg: 0.5 } },
  guardian: { name: 'Страж', price: 450, start: 'aura', color: '#2ad880', passive: 'Здоровье +50%, броня +2, скорость −10%', mods: { maxHpMul: 0.5, armor: 2, speed: -0.1 } },
  pyro: { name: 'Пиромант', price: 600, start: 'bomb', color: '#c83028', passive: 'Область атак +25%, урон +10%', mods: { area: 0.25, might: 0.1 } },
  vampire: { name: 'Вампир', price: 750, start: 'whip', color: '#8a0c22', passive: 'Вампиризм: 4% нанесённого урона лечит', mods: { lifesteal: 0.04 } },
  gambler: { name: 'Счастливчик', price: 900, start: 'meteor', color: '#d82a3c', passive: 'Шанс монет ×2, +1 вариант при повышении', mods: { greed: 1, choices: 1 } },
  witch: { name: 'Ледяная ведьма', price: 1000, start: 'frost', color: '#3858c0', passive: 'Перезарядка −15%, длительность +20%', mods: { cooldown: -0.15, duration: 0.2 } },
  storm: { name: 'Громовержец', price: 1300, start: 'lightning', color: '#d8b830', passive: '+1 снаряд ко всем атакам', mods: { amount: 1 } },
  necro: { name: 'Некромант', price: 1600, start: 'orbit', color: '#6a3a9a', passive: '15% шанс: убитый враг взрывается', mods: { explode: 0.15 } },
};

// Враги (по концепту: гном, злой гриб, скелет, северный волк, таракан, чёрная ворона).
// size — высота спрайта в мире, r — радиус столкновения. emoji/color — временные заглушки.
const ENEMIES = {
  crow: { name: 'Чёрная ворона', hp: 5, speed: 86, dmg: 5, r: 11, xp: 1, size: 42, color: '#3a3450', emoji: '🐦', fly: 1 },
  roach: { name: 'Таракан', hp: 8, speed: 62, dmg: 5, r: 10, xp: 1, size: 38, color: '#7a4020', emoji: '🪳' },
  skeleton: { name: 'Скелет', hp: 24, speed: 52, dmg: 8, r: 12, xp: 2, size: 46, color: '#cfc8b0', emoji: '💀' },
  mushroom: { name: 'Злой гриб', hp: 30, speed: 36, dmg: 8, r: 13, xp: 3, size: 40, color: '#b02a2a', emoji: '🍄', shoots: { cd: 6.5, speed: 120, dmg: 5, color: '#8cff4a' } },
  wolf: { name: 'Северный волк', hp: 30, speed: 70, dmg: 6, r: 13, xp: 2, size: 42, color: '#8090a8', emoji: '🐺', lunge: 1 },
  gnome: { name: 'Гном', hp: 48, speed: 40, dmg: 9, r: 14, xp: 3, size: 44, color: '#a0502a', emoji: '🧔' },
  // Паук: скрытен вдали (полупрозрачный), плюётся паутиной (замедляет), укус отравляет
  spider: { name: 'Чёрный паук', hp: 42, speed: 56, dmg: 7, r: 15, xp: 4, size: 38, color: '#3a2450', emoji: '🕷️', stealth: 1, web: { cd: 7, speed: 150 }, poison: { dps: 3, t: 2.5 } },
  // Големы — тяжёлые враги, приходят по одному (см. golems у уровней). heavy: почти не отбрасываются
  fire_golem: { name: 'Огненный голем', hp: 170, speed: 34, dmg: 14, r: 20, xp: 8, size: 72, color: '#c83a1a', emoji: '🔥', heavy: 1, lava: { every: 0.7, dps: 7, t: 3.5 }, shoots: { cd: 4, speed: 150, dmg: 10, color: '#ff7a2a' } },
  stone_golem: { name: 'Каменный голем', hp: 300, speed: 28, dmg: 18, r: 22, xp: 10, size: 72, color: '#7a7a6a', emoji: '🪨', heavy: 1, armorMul: 0.5, slam: { cd: 5, r: 85, dmg: 14, wind: 0.8 } },
  water_golem: { name: 'Водный голем', hp: 190, speed: 46, dmg: 12, r: 20, xp: 8, size: 72, color: '#2a8ae0', emoji: '💧', heavy: 1, soak: 1.5, shoots: { cd: 4.5, speed: 145, dmg: 8, color: '#5ab8ff', slow: 2 } },
  // --- Новые монстры: на новых моделях, со своим свечением, эффектами и поведением ---
  bat: { name: 'Летучая мышь', hp: 4, speed: 108, dmg: 4, r: 8, xp: 1, size: 30, color: '#b0203a', emoji: '🦇', fly: 1, pack: 5, flutter: 1, glow: '#ff3050' },
  blast_beetle: { name: 'Жук-взрывун', hp: 14, speed: 80, dmg: 4, r: 10, xp: 2, size: 38, color: '#ff7a2a', emoji: '💥', skin: 'roach_red', glow: '#ff7a2a', fx: 'fuse', explode: { r: 70, dmg: 22, fuse: 0.65 } },
  archer: { name: 'Скелет-лучник', hp: 20, speed: 50, dmg: 6, r: 12, xp: 3, size: 46, color: '#7ae0ff', emoji: '🏹', skin: 'skeleton_blue', glow: '#6ad8ff', keepDist: 190, shoots: { cd: 2.8, speed: 175, dmg: 7, color: '#bff0ff', arrow: 1 } },
  sporeling: { name: 'Споровик', hp: 36, speed: 34, dmg: 7, r: 13, xp: 3, size: 44, color: '#8aff4a', emoji: '🍄', skin: 'mushroom_purple', glow: '#8aff4a', fx: 'spores', deathCloud: { r: 62, dps: 9, t: 4 } },
  dire_wolf: { name: 'Лютый волк', hp: 36, speed: 76, dmg: 7, r: 13, xp: 3, size: 50, color: '#ff3a3a', emoji: '🐺', skin: 'wolf_red', glow: '#ff2a2a', lunge: 1, pack: 3 },
  diver: { name: 'Ворон-пикировщик', hp: 10, speed: 72, dmg: 7, r: 11, xp: 2, size: 46, color: '#b060ff', emoji: '🐦‍⬛', skin: 'crow', glow: '#b060ff', fx: 'trail', fly: 1, dive: { range: 290, mult: 3.3, dur: 0.5, cd: 4 } },
  bomber: { name: 'Гном-подрывник', hp: 44, speed: 36, dmg: 8, r: 14, xp: 4, size: 46, color: '#ffb040', emoji: '💣', skin: 'gnome_armored', glow: '#ffb040', keepDist: 220, lob: { cd: 4.5, dmg: 16, r: 55, range: 320 } },
};

// Уровни. waves: с секунды t спавнятся типы types со скоростью rate врагов/сек.
const STAGES = [
  { id: 'forest', name: 'Тёмный лес', icon: '🌲', desc: 'Выживи 5 минут и победи вожака стаи.', duration: 300, hp: 1.00, dmgMul: 1.0, ground: 'forest', reward: 200,
    unlocks: ['boomerang', 'duration'],
    boss: { type: 'gnome', art: 'ancient_guardian', name: 'Древний страж', hp: 2600, size: 130, r: 38, speed: 46, dmg: 20, color: '#6ad84a' },
    waves: [{ t: 0, types: ['crow', 'roach'], rate: 1.1 }, { t: 45, types: ['crow', 'roach', 'mushroom'], rate: 1.6 }, { t: 110, types: ['roach', 'mushroom', 'wolf'], rate: 2.1 },
      { t: 170, types: ['wolf', 'mushroom', 'crow'], rate: 2.7 }, { t: 235, types: ['wolf', 'crow', 'roach', 'mushroom'], rate: 3.3 }] },
  { id: 'crypt', name: 'Забытое кладбище', icon: '🪦', desc: 'Кости не знают покоя. 7 минут до Костяного лорда.', duration: 420, hp: 1.35, dmgMul: 1.1, ground: 'haunted', reward: 220,
    unlocks: ['frost', 'clover'],
    boss: { type: 'skeleton', art: 'lich', name: 'Лич', hp: 3700, size: 130, r: 34, speed: 50, dmg: 24, color: '#5affa0' },
    waves: [{ t: 0, types: ['skeleton', 'crow'], rate: 1.8 }, { t: 60, types: ['skeleton', 'crow', 'roach'], rate: 2.6 }, { t: 150, types: ['skeleton', 'mushroom', 'crow'], rate: 3.4 },
      { t: 240, types: ['skeleton', 'spider', 'mushroom'], rate: 4.4 }, { t: 330, types: ['skeleton', 'crow', 'spider', 'wolf', 'mushroom'], rate: 5.6 }] },
  { id: 'north', name: 'Северные пустоши', icon: '🏔️', desc: 'Холод в крови. 8 минут до Ледяного вожака.', duration: 480, hp: 1.70, dmgMul: 1.2, ground: 'snow', reward: 250,
    unlocks: ['beam', 'bracer'],
    boss: { type: 'wolf', art: 'ice_dragon', name: 'Ледяной дракон', hp: 5200, size: 150, r: 44, speed: 52, dmg: 28, color: '#6ac8ff' },
    waves: [{ t: 0, types: ['wolf', 'crow'], rate: 2 }, { t: 80, types: ['wolf', 'skeleton', 'crow'], rate: 3 }, { t: 180, types: ['wolf', 'skeleton', 'gnome'], rate: 3.8 },
      { t: 300, types: ['wolf', 'gnome', 'crow', 'skeleton'], rate: 5 }, { t: 400, types: ['wolf', 'gnome', 'skeleton'], rate: 6 }] },
  { id: 'mines', name: 'Гномьи копи', icon: '⛏️', desc: 'Короткий рост — большая ярость. 9 минут.', duration: 540, hp: 2.05, dmgMul: 1.3, ground: 'volcano', reward: 270,
    unlocks: ['meteor', 'amount'],
    boss: { type: 'gnome', art: 'flame_golem', name: 'Пламенный голем', hp: 7400, size: 145, r: 44, speed: 44, dmg: 32, color: '#ff8a3a' },
    waves: [{ t: 0, types: ['roach', 'crow'], rate: 2.2 }, { t: 70, types: ['gnome', 'roach', 'crow'], rate: 2.8 }, { t: 140, types: ['gnome', 'roach', 'mushroom'], rate: 3.2 }, { t: 200, types: ['gnome', 'roach', 'skeleton'], rate: 4.2 },
      { t: 320, types: ['gnome', 'spider', 'roach', 'mushroom'], rate: 5.4 }, { t: 440, types: ['gnome', 'wolf', 'spider', 'skeleton', 'roach'], rate: 6.5 }] },
  { id: 'abyss', name: 'Бездна', icon: '🌑', desc: 'Мы видим всё. 10 минут до Предвестника.', duration: 600, hp: 2.40, dmgMul: 1.4, ground: 'crystal_purple', reward: 290,
    unlocks: ['drone', 'crown', 'greed'],
    boss: { type: 'gnome', art: 'crystal_beast', name: 'Кристальный зверь', hp: 10600, size: 140, r: 44, speed: 58, dmg: 36, color: '#b050ff' },
    waves: [{ t: 0, types: ['crow', 'roach', 'mushroom'], rate: 2.6 }, { t: 100, types: ['crow', 'spider', 'wolf', 'mushroom'], rate: 3.6 }, { t: 220, types: ['gnome', 'wolf', 'crow', 'mushroom'], rate: 4.6 },
      { t: 360, types: ['gnome', 'spider', 'skeleton', 'roach', 'mushroom'], rate: 5.8 }, { t: 480, types: ['gnome', 'wolf', 'skeleton', 'crow', 'mushroom'], rate: 7 }] },
  { id: 'desert', name: 'Пылающие пески', icon: '🏜️', desc: 'Жара, кактусы и кости. 10 минут до Королевы песков.', duration: 600, hp: 2.75, dmgMul: 1.5, ground: 'desert', reward: 320,
    unlocks: [],
    boss: { type: 'gnome', art: 'minotaur', name: 'Минотавр', hp: 15000, size: 150, r: 44, speed: 62, dmg: 40, color: '#e04030' },
    waves: [{ t: 0, types: ['roach', 'crow'], rate: 2.8 }, { t: 100, types: ['roach', 'skeleton', 'crow'], rate: 3.8 }, { t: 220, types: ['roach', 'wolf', 'skeleton'], rate: 4.8 },
      { t: 360, types: ['roach', 'wolf', 'skeleton', 'spider'], rate: 6 }, { t: 480, types: ['roach', 'wolf', 'skeleton', 'crow', 'spider'], rate: 7.2 }] },
  { id: 'swamp', name: 'Гнилое болото', icon: '🐸', desc: 'Топи, мёртвые деревья и пауки. 10 минут.', duration: 600, hp: 3.10, dmgMul: 1.6, ground: 'swamp', reward: 340,
    unlocks: [],
    boss: { type: 'gnome', art: 'hydra', name: 'Гидра', hp: 21300, size: 150, r: 46, speed: 54, dmg: 44, color: '#a060ff' },
    waves: [{ t: 0, types: ['spider', 'mushroom'], rate: 3 }, { t: 100, types: ['spider', 'mushroom', 'roach'], rate: 4 }, { t: 220, types: ['spider', 'skeleton', 'mushroom'], rate: 5 },
      { t: 360, types: ['spider', 'skeleton', 'roach', 'mushroom'], rate: 6.2 }, { t: 480, types: ['spider', 'skeleton', 'wolf', 'mushroom', 'roach'], rate: 7.5 }] },
  { id: 'toxic', name: 'Ядовитые пустоши', icon: '☣️', desc: 'Кислотные озёра и ржавые вышки. 11 минут.', duration: 660, hp: 3.45, dmgMul: 1.7, ground: 'toxic', reward: 360,
    unlocks: [],
    boss: { type: 'gnome', art: 'void_lord', name: 'Повелитель пустоты', hp: 30300, size: 145, r: 44, speed: 56, dmg: 48, color: '#ff5030' },
    waves: [{ t: 0, types: ['roach', 'mushroom'], rate: 3.2 }, { t: 110, types: ['roach', 'mushroom', 'skeleton'], rate: 4.2 }, { t: 240, types: ['spider', 'mushroom', 'skeleton'], rate: 5.2 },
      { t: 390, types: ['roach', 'spider', 'skeleton', 'mushroom'], rate: 6.5 }, { t: 520, types: ['roach', 'spider', 'skeleton', 'mushroom', 'gnome'], rate: 7.8 }] },
  { id: 'jungle', name: 'Затерянные джунгли', icon: '🌴', desc: 'Руины в чаще. 11 минут до Зверя джунглей.', duration: 660, hp: 3.80, dmgMul: 1.8, ground: 'jungle', reward: 380,
    unlocks: [],
    boss: { type: 'gnome', art: 'spider_lord', name: 'Паук-владыка', hp: 43000, size: 150, r: 46, speed: 66, dmg: 52, color: '#b050ff' },
    waves: [{ t: 0, types: ['wolf', 'spider'], rate: 2.9 }, { t: 110, types: ['wolf', 'spider', 'gnome'], rate: 3.7 }, { t: 240, types: ['wolf', 'gnome', 'mushroom'], rate: 4.6 },
      { t: 390, types: ['wolf', 'spider', 'gnome', 'crow'], rate: 5.8 }, { t: 520, types: ['wolf', 'spider', 'gnome', 'crow', 'mushroom'], rate: 6.8 }] },
  { id: 'moon', name: 'Лунная пустошь', icon: '🌕', desc: 'Кратеры и древние монолиты. Финальное испытание — 12 минут.', duration: 720, hp: 4.15, dmgMul: 1.9, ground: 'moon', reward: 410,
    unlocks: [],
    boss: { type: 'gnome', art: 'sky_knight', name: 'Небесный рыцарь', hp: 61000, size: 145, r: 40, speed: 64, dmg: 56, color: '#5aa0ff' },
    waves: [{ t: 0, types: ['skeleton', 'wolf'], rate: 3.6 }, { t: 120, types: ['skeleton', 'wolf', 'spider'], rate: 4.6 }, { t: 260, types: ['skeleton', 'wolf', 'spider', 'mushroom'], rate: 5.8 },
      { t: 420, types: ['skeleton', 'wolf', 'spider', 'gnome', 'crow'], rate: 7 }, { t: 560, types: ['skeleton', 'wolf', 'spider', 'gnome', 'crow', 'mushroom'], rate: 8.5 }] },
  { id: 'coast', name: 'Проклятое побережье', icon: '🌊', desc: 'Из волн выходит Акула-палач. 12 минут.', duration: 720, hp: 4.50, dmgMul: 2.0, ground: 'coast', reward: 430,
    unlocks: [],
    boss: { type: 'gnome', art: 'shark', name: 'Акула-палач', hp: 86700, size: 160, r: 46, speed: 70, dmg: 60, color: '#3ab0d0' },
    waves: [{ t: 0, types: ['crow', 'roach'], rate: 3.8 }, { t: 120, types: ['crow', 'roach', 'skeleton'], rate: 4.8 }, { t: 260, types: ['skeleton', 'wolf', 'roach'], rate: 6 },
      { t: 420, types: ['skeleton', 'wolf', 'spider', 'crow'], rate: 7.2 }, { t: 560, types: ['skeleton', 'wolf', 'spider', 'gnome', 'crow'], rate: 8.8 }] },
  { id: 'canyon', name: 'Каньон теней', icon: '🏜️', desc: 'Среди скал бродит Теневой жнец. 12 минут.', duration: 720, hp: 4.85, dmgMul: 2.1, ground: 'canyon', reward: 450,
    unlocks: [],
    boss: { type: 'gnome', art: 'shadow_reaper', name: 'Теневой жнец', hp: 123100, size: 150, r: 40, speed: 72, dmg: 64, color: '#9a50ff' },
    waves: [{ t: 0, types: ['wolf', 'roach'], rate: 4 }, { t: 120, types: ['wolf', 'skeleton', 'roach'], rate: 5 }, { t: 260, types: ['wolf', 'skeleton', 'gnome'], rate: 6.2 },
      { t: 420, types: ['wolf', 'skeleton', 'gnome', 'spider'], rate: 7.5 }, { t: 560, types: ['wolf', 'skeleton', 'gnome', 'spider', 'mushroom'], rate: 9 }] },
  { id: 'sapphire', name: 'Сапфировые пещеры', icon: '💎', desc: 'Король мёртвых ждёт во тьме. 13 минут.', duration: 780, hp: 5.20, dmgMul: 2.2, ground: 'crystal_blue', reward: 480,
    unlocks: [],
    boss: { type: 'gnome', art: 'deathknight', name: 'Король мёртвых', hp: 174800, size: 160, r: 44, speed: 66, dmg: 68, color: '#4a8aff' },
    waves: [{ t: 0, types: ['skeleton', 'spider'], rate: 4.2 }, { t: 130, types: ['skeleton', 'spider', 'mushroom'], rate: 5.2 }, { t: 280, types: ['skeleton', 'gnome', 'mushroom'], rate: 6.4 },
      { t: 450, types: ['skeleton', 'gnome', 'spider', 'wolf'], rate: 7.8 }, { t: 600, types: ['skeleton', 'gnome', 'spider', 'wolf', 'mushroom'], rate: 9.5 }] },
  { id: 'ruins', name: 'Древние руины', icon: '🏛️', desc: 'Последний бой: Око Бездны. 14 минут.', duration: 840, hp: 5.55, dmgMul: 2.3, ground: 'ruins', reward: 500,
    unlocks: [],
    boss: { type: 'gnome', art: 'void', name: 'Око Бездны', hp: 248200, size: 170, r: 50, speed: 60, dmg: 72, color: '#b040ff' },
    waves: [{ t: 0, types: ['skeleton', 'wolf', 'crow'], rate: 4.5 }, { t: 140, types: ['skeleton', 'wolf', 'spider', 'crow'], rate: 5.6 }, { t: 300, types: ['gnome', 'wolf', 'spider', 'mushroom'], rate: 7 },
      { t: 480, types: ['gnome', 'wolf', 'spider', 'skeleton', 'crow'], rate: 8.5 }, { t: 640, types: ['gnome', 'wolf', 'spider', 'skeleton', 'crow', 'mushroom'], rate: 10 }] },
];

// Големы по уровням: тип, с какой секунды и как часто (по одному)
const STAGE_GOLEMS = {
  forest: [{ type: 'stone_golem', t: 150, every: 30 }],
  crypt: [{ type: 'stone_golem', t: 100, every: 25 }, { type: 'water_golem', t: 260, every: 40 }],
  north: [{ type: 'water_golem', t: 80, every: 22 }, { type: 'stone_golem', t: 240, every: 40 }],
  mines: [{ type: 'fire_golem', t: 80, every: 20 }, { type: 'stone_golem', t: 200, every: 35 }],
  abyss: [{ type: 'fire_golem', t: 60, every: 25 }, { type: 'water_golem', t: 120, every: 25 }, { type: 'stone_golem', t: 180, every: 30 }],
  desert: [{ type: 'fire_golem', t: 60, every: 22 }, { type: 'stone_golem', t: 240, every: 35 }],
  swamp: [{ type: 'water_golem', t: 60, every: 22 }, { type: 'stone_golem', t: 200, every: 30 }],
  toxic: [{ type: 'fire_golem', t: 60, every: 20 }, { type: 'water_golem', t: 180, every: 28 }],
  jungle: [{ type: 'stone_golem', t: 60, every: 20 }, { type: 'water_golem', t: 200, every: 30 }],
  moon: [{ type: 'stone_golem', t: 60, every: 22 }, { type: 'water_golem', t: 150, every: 26 }, { type: 'fire_golem', t: 240, every: 26 }],
  coast: [{ type: 'water_golem', t: 60, every: 18 }, { type: 'stone_golem', t: 200, every: 28 }],
  canyon: [{ type: 'stone_golem', t: 60, every: 18 }, { type: 'fire_golem', t: 200, every: 26 }],
  sapphire: [{ type: 'water_golem', t: 60, every: 18 }, { type: 'stone_golem', t: 180, every: 24 }, { type: 'fire_golem', t: 300, every: 30 }],
  ruins: [{ type: 'stone_golem', t: 60, every: 16 }, { type: 'water_golem', t: 150, every: 22 }, { type: 'fire_golem', t: 240, every: 22 }],
  endless: [{ type: 'stone_golem', t: 150, every: 30 }, { type: 'water_golem', t: 240, every: 30 }, { type: 'fire_golem', t: 330, every: 30 }],
};

const ENDLESS = { id: 'endless', name: 'Бесконечная война', icon: '♾️', desc: 'Выживай сколько сможешь. Босс каждые 5 минут.', ground: 'endless',
  pool: ['crow', 'roach', 'skeleton', 'bat', 'mushroom', 'wolf', 'diver', 'spider', 'blast_beetle', 'archer', 'gnome', 'sporeling', 'dire_wolf', 'bomber'] };

// Постоянные усиления (магазин). Цена уровня L (0..) = cost * (1 + 0.8L)
const UPGRADES = {
  might: { name: 'Мощь', icon: '💪', max: 5, cost: 80, desc: '+5% урона', stat: { might: 0.05 } },
  vitality: { name: 'Живучесть', icon: '❤️', max: 5, cost: 60, desc: '+10 здоровья', stat: { maxHp: 10 } },
  armor: { name: 'Закалка', icon: '🛡️', max: 3, cost: 120, desc: '+1 броня', stat: { armor: 1 } },
  recovery: { name: 'Восстановление', icon: '💚', max: 5, cost: 70, desc: '+0.1 HP/сек', stat: { regen: 0.1 } },
  haste: { name: 'Спешка', icon: '📖', max: 5, cost: 100, desc: '−3% перезарядки', stat: { cooldown: -0.03 } },
  area: { name: 'Размах', icon: '🕯️', max: 5, cost: 90, desc: '+5% область атак', stat: { area: 0.05 } },
  swift: { name: 'Проворство', icon: '👢', max: 5, cost: 60, desc: '+4% скорость', stat: { speed: 0.04 } },
  magnet: { name: 'Притяжение', icon: '🧲', max: 5, cost: 50, desc: '+15% радиус подбора', stat: { magnet: 0.15 } },
  growth: { name: 'Мудрость', icon: '👑', max: 5, cost: 90, desc: '+4% опыта', stat: { growth: 0.04 } },
  greed: { name: 'Алчность', icon: '💰', max: 5, cost: 120, desc: '+10% шанс монет', stat: { greed: 0.1 } },
  luck: { name: 'Удача', icon: '🍀', max: 3, cost: 100, desc: '+3% шанс крита', stat: { crit: 0.03 } },
  reroll: { name: 'Переброс', icon: '🎲', max: 3, cost: 150, desc: '+1 переброс выбора за забег', stat: { rerolls: 1 } },
  revival: { name: 'Воскрешение', icon: '✝️', max: 1, cost: 800, desc: 'Одно воскрешение за забег', stat: { revives: 1 } },
};
const upgradeCost = (id, lvl) => Math.round(UPGRADES[id].cost * (1 + lvl * 0.8));

// ===== Арт =====
// Положи PNG в art/heroes/<id>.png и art/enemies/<id>.png — игра подхватит их сама.
// frames — сколько кадров в горизонтальной ленте, fps — скорость анимации,
// facesLeft — если на картинке персонаж смотрит влево. Пока файлов нет — рисуются заглушки.
const ART = {};
// Враги: нарезанные листы из tools/cut-mobs.ps1 (размеры кадров — в js/art-meta.js).
// Строки листа: ходьба, атака, получение урона, смерть. <id>_big.png — крупный арт для элиты и боссов.
const FACES_LEFT = ['skeleton'];
for (const id in ENEMIES) {
  const m = typeof ART_META !== 'undefined' && ART_META.enemies[id];
  const left = FACES_LEFT.includes(id);
  if (!m) { ART['enemy_' + id] = { file: 'art/enemies/' + id + '.png', frames: 1, fps: 8, facesLeft: left }; continue; }
  ART['enemy_' + id] = { file: 'art/enemies/' + id + '.png', cw: m.cw, ch: m.ch, facesLeft: left, anims: {
    walk: { row: 0, n: m.walk, fps: 8 }, attack: { row: 1, n: m.attack, fps: 7 }, hit: { row: 2, n: m.hit, fps: 10 }, death: { row: 3, n: m.death, fps: 5 } } };
  if (m.jump) ART['enemy_' + id].anims.jump = { row: 4, n: m.jump, fps: 6 };
  ART['enemy_' + id + '_big'] = { file: 'art/enemies/' + id + '_big.png', frames: 1, fps: 8, facesLeft: left, scale: 0.85 };
}
// Герои: нарезка tools/cut-hero.ps1 (кадры — в js/art-meta-heroes.js), <id>_big.png — портрет для меню
for (const id in HEROES) {
  const m = typeof ART_META_HEROES !== 'undefined' && ART_META_HEROES[id];
  if (!m) { ART['hero_' + id] = { file: 'art/heroes/' + id + '.png', frames: 1, fps: 8 }; continue; }
  const fps = { idle: 5, run: m.run <= 3 ? 6 : 10, attack: 10, death: 6 }, anims = {};   // отдельные позы бега — медленнее
  let row = 0;
  for (const k of ['idle', 'run', 'attack', 'death']) if (m[k]) anims[k] = { row: row++, n: m[k], fps: fps[k] };
  anims.walk = anims.idle;
  ART['hero_' + id] = { file: 'art/heroes/' + id + '.png', cw: m.cw, ch: m.ch, anims };
  ART['hero_' + id + '_big'] = { file: 'art/heroes/' + id + '_big.png', frames: 1, fps: 8 };
}
// Обновлённые модели мобов (tools/cut-mobs2.ps1): заменяют старые спрайты, у каждого типа — цветовые варианты.
// Строки листа: ходьба, атака; <skin>_big.png — крупная фигура для элиты и боссов.
if (typeof ART_META2 !== 'undefined') for (const skin in ART_META2) {
  const m = ART_META2[skin], left = !!m.facesLeft;
  ART['enemy_' + skin] = { file: 'art/enemies2/' + skin + '.png', cw: m.cw, ch: m.ch, facesLeft: left, anims: {
    walk: { row: 0, n: m.walk, fps: m.walk >= 4 ? 10 : 5 }, attack: { row: 1, n: m.attack, fps: 6 } } };
  ART['enemy_' + skin + '_big'] = { file: 'art/enemies2/' + skin + '_big.png', frames: 1, fps: 8, facesLeft: left, scale: 0.85 };
}
// Какой цветовой вариант моба на каком уровне (в бесконечном режиме — случайный)
const STAGE_SKINS = {
  crypt: { skeleton: 'skeleton_green', mushroom: 'mushroom_purple', spider: 'spider_white' },
  north: { wolf: 'wolf_blue', skeleton: 'skeleton_blue', mushroom: 'mushroom_blue', spider: 'spider_white' },
  mines: { gnome: 'gnome_armored', roach: 'roach_red', wolf: 'wolf_red' },
  abyss: { spider: 'spider_purple', mushroom: 'mushroom_purple', roach: 'roach_green', skeleton: 'skeleton_green', wolf: 'wolf_red' },
  desert: { roach: 'roach_red', wolf: 'wolf_red' },
  swamp: { roach: 'roach_green', skeleton: 'skeleton_green' },
  toxic: { roach: 'roach_green', skeleton: 'skeleton_green', mushroom: 'mushroom_purple', spider: 'spider_purple' },
  moon: { wolf: 'wolf_blue', skeleton: 'skeleton_blue', spider: 'spider_white', mushroom: 'mushroom_blue' },
  coast: { roach: 'roach_green', crow: 'crow' },
  canyon: { wolf: 'wolf_red', roach: 'roach_red', skeleton: 'skeleton' },
  sapphire: { skeleton: 'skeleton_blue', spider: 'spider_white', mushroom: 'mushroom_blue', wolf: 'wolf_blue' },
  ruins: { skeleton: 'skeleton_green', spider: 'spider_purple', wolf: 'wolf_red', mushroom: 'mushroom_purple' },
};
const SKINS_OF = type => typeof ART_META2 === 'undefined' ? [] : Object.keys(ART_META2).filter(s => s === type || s.startsWith(type + '_') && !ENEMIES[s]);
// Спрайты оружия (tools/cut-hero.ps1 → art/fx): если файла нет, снаряд рисуется простой графикой
ART.fx_boomerang = { file: 'art/fx/boomerang.png', frames: 1, fps: 1 };
// Иконки-картинки навыков (tools/cut-icons.ps1 → art/icons) вместо эмодзи
const ICON_ART = {};
for (const id of ['aura', 'bolt', 'drone', 'whip', 'orbit', 'bomb', 'meteor', 'shield', 'boomerang', 'lightning',
  'power', 'tome', 'candle', 'bracer', 'duration', 'amount', 'heart', 'armor', 'boots', 'magnet', 'clover', 'regen', 'crown', 'greed', 'ward']) ICON_ART[id] = 'art/icons/' + id + '.png';
for (const id in ICON_ART) {
  const s = WEAPONS[id] || PASSIVES[id] || EVOLUTIONS[id];
  if (!s) continue;
  s.iconSrc = ICON_ART[id];
  s.icon = '<img class="ic" src="' + ICON_ART[id] + '" alt="">';
  ART['icon_' + id] = { file: ICON_ART[id], frames: 1, fps: 1 };
}
ART.fx_aura_ring = { file: 'art/fx/aura_ring.png', frames: 1, fps: 1 };   // кольцо «Святой ауры» в бою

// ===== Прыжки / рывки героев (кнопка справа внизу, на ПК — пробел) =====
// kind: blink — телепорт; dash — рывок по прямой (trail — след с уроном); leap — прыжок по дуге с приземлением;
// charge — таран с отбрасыванием; sprint — быстрый бег; fly — полёт сквозь всё (неуязвим); bolt — молния с цепными разрядами
const HERO_DASH = {
  wanderer: { name: 'Телепорт', icon: '🌀', kind: 'blink', cd: 10, dist: 170, dmg: 30, color: '#8ab4ff', desc: 'Мгновенно переносится вперёд; в точке появления — вспышка урона' },
  scavenger: { name: 'Кровавый рывок', icon: '🩸', kind: 'dash', cd: 10, dur: 0.3, speed: 620, trail: { dps: 40, t: 2.5, color: '#ff3050' }, desc: 'Стремительный рывок, оставляет кровавый след, ранящий врагов' },
  hunter: { name: 'Сальто', icon: '🤸', kind: 'leap', cd: 12, dur: 0.55, dist: 190, dmg: 40, r: 90, desc: 'Прыжок через врагов (в воздухе неуязвима), при приземлении — ударная волна' },
  guardian: { name: 'Натиск', icon: '🛡️', kind: 'charge', cd: 12, dur: 0.4, speed: 480, dmg: 50, desc: 'Таран щитом: сбивает с ног и ранит всех на пути' },
  pyro: { name: 'Огненный бег', icon: '🔥', kind: 'sprint', cd: 15, dur: 2.2, mult: 1.9, trail: { dps: 30, t: 2.5, color: '#ff6a20' }, desc: 'Быстрый бег, за спиной остаётся горящий след' },
  vampire: { name: 'Стая мышей', icon: '🦇', kind: 'fly', cd: 15, dur: 1.4, mult: 1.7, heal: 0.12, color: '#b0306a', desc: 'Рассыпается стаей летучих мышей: летит сквозь врагов и препятствия, неуязвим, в конце лечится' },
  gambler: { name: 'Прыжок удачи', icon: '🎲', kind: 'blink', cd: 10, random: 1, luck: 1, color: '#ffd23a', desc: 'Телепорт в случайную точку рядом; с шансом 50% — урон ×2 на 4 секунды' },
  witch: { name: 'Ледяное скольжение', icon: '❄️', kind: 'dash', cd: 10, dur: 0.4, speed: 520, trail: { dps: 10, t: 3, color: '#9fe8ff', freeze: 1.2 }, desc: 'Скольжение по льду: след замораживает врагов' },
  storm: { name: 'Молния', icon: '⚡', kind: 'bolt', cd: 12, dur: 0.25, speed: 800, dmg: 45, desc: 'Превращается в молнию и пронзает врагов на пути; разряды перескакивают на соседних' },
  necro: { name: 'Полёт духа', icon: '👻', kind: 'fly', cd: 15, dur: 1.6, mult: 1.5, burst: { dmg: 60, r: 100 }, color: '#8aff9a', desc: 'Становится призраком: летит сквозь всё, неуязвим, в конце — взрыв душ' },
};
// Боссы (tools/cut-bosses.ps1 → art/bosses). Строки листа: вперёд, влево, вправо, атака, смерть; single — одна картинка
if (typeof ART_META_BOSSES !== 'undefined') for (const id in ART_META_BOSSES) {
  const m = ART_META_BOSSES[id];
  if (m.single) { ART['boss_' + id] = { file: 'art/bosses/' + id + '.png', frames: 1, fps: 1 }; continue; }
  ART['boss_' + id] = { file: 'art/bosses/' + id + '.png', cw: m.cw, ch: m.ch, boss: 1, anims: {
    walk: { row: 0, n: 1, fps: 1 }, fwd: { row: 0, n: 1, fps: 1 }, left: { row: 1, n: 1, fps: 1 }, right: { row: 2, n: 1, fps: 1 },
    attack: { row: 3, n: m.attack, fps: 4 }, hit: { row: 0, n: 1, fps: 1 }, death: { row: 4, n: m.death, fps: 2 } } };
  ART['boss_' + id + '_big'] = { file: 'art/bosses/' + id + '_big.png', frames: 1, fps: 1 };
}
// Спрайты оружия в бою (tools/cut-weapons.ps1 → art/fx), в стиле иконок
for (const n of ['arrow', 'scythe', 'fire_orb', 'bomb', 'meteor']) ART['fx_' + n] = { file: 'art/fx/' + n + '.png', frames: 1, fps: 1 };
// Призрачные мечи, Щиты-хранители, руны Оберега, боевой дрон (16 направлений) — tools/cut-weapon-art.ps1
for (const n of ['sword_ghost', 'sword_dance', 'gshield', 'gshield_aegis', 'ward_runes', 'drone3d']) ART['fx_' + n] = { file: 'art/fx/' + n + '.png', frames: 1, fps: 1 };
ART.enemy_bat = { file: 'art/enemies2/bat.png', cw: 103, ch: 67, anims: { walk: { row: 0, n: 2, fps: 12 }, attack: { row: 1, n: 1, fps: 1 } } };
// Где встречаются новые монстры (добавляются к волнам со второй трети уровня); в бесконечном режиме — все
const STAGE_EXTRA = {
  forest: ['diver'], crypt: ['bat', 'archer'], north: ['archer', 'dire_wolf'], mines: ['blast_beetle', 'bomber'], abyss: ['bat', 'sporeling'],
  desert: ['blast_beetle', 'bomber'], swamp: ['sporeling', 'bat'], toxic: ['sporeling', 'blast_beetle'], jungle: ['dire_wolf', 'sporeling'],
  moon: ['diver', 'archer'], coast: ['diver', 'blast_beetle'], canyon: ['bomber', 'dire_wolf'], sapphire: ['archer', 'bat'], ruins: ['bat', 'archer', 'bomber', 'diver'],
};

// ===== Дополнительные способности (иконки и вид — в js/iconart.js и weapons.js) =====
Object.assign(WEAPONS, {
  spikes: { name: 'Кровавые шипы', icon: '🔺', type: 'spikes', color: '#ff3a5a', desc: 'Шипы вырываются из-под земли под врагами.',
    base: { dmg: 18, cd: 1.8, amount: 2, radius: 28, delay: 0.45, range: 260 },
    ups: [{ amount: 1, d: '+1 шип' }, { dmg: 6, d: '+6 урона' }, { radius: 6, d: '+область' }, { cd: -0.2, d: 'Быстрее' }, { amount: 1, d: '+1 шип' },
      { dmg: 8, d: '+8 урона' }, { radius: 6, d: '+область' }, { amount: 1, d: '+1 шип' }, { dmg: 10, cd: -0.2, d: '+10 урона, быстрее' }] },
  plague: { name: 'Ядовитый след', icon: '☣️', type: 'plague', color: '#8aff4a', desc: 'За героем тянется ядовитое облако.',
    base: { dmg: 7, cd: 0.25, radius: 22, dur: 2.2 },
    ups: [{ dmg: 2, d: '+2 урона в секунду' }, { radius: 4, d: 'Шире облако' }, { dur: 0.6, d: 'Облако держится дольше' }, { dmg: 2, d: '+2 урона в секунду' }, { radius: 5, d: 'Шире облако' },
      { dur: 0.6, d: 'Облако держится дольше' }, { dmg: 3, d: '+3 урона в секунду' }, { radius: 5, d: 'Шире облако' }, { dmg: 4, d: '+4 урона в секунду' }] },
  shuriken: { name: 'Сюрикены', icon: '✴️', type: 'shuriken', color: '#c8e4ff', desc: 'Разлетаются по спирали во все стороны.',
    base: { dmg: 11, cd: 1.6, amount: 3, speed: 170, size: 8, life: 2.2, pierce: 3 },
    ups: [{ amount: 1, d: '+1 сюрикен' }, { dmg: 4, d: '+4 урона' }, { pierce: 1, d: '+1 пробивание' }, { amount: 1, d: '+1 сюрикен' }, { cd: -0.2, d: 'Быстрее' },
      { dmg: 5, d: '+5 урона' }, { amount: 1, d: '+1 сюрикен' }, { speed: 30, size: 2, d: 'Быстрее и крупнее' }, { dmg: 6, amount: 1, d: '+6 урона, +1 сюрикен' }] },
  turret: { name: 'Тотем стража', icon: '🗼', type: 'turret', color: '#7affd8', desc: 'Ставит тотем, который сам стреляет по врагам.',
    base: { dmg: 10, cd: 6, dur: 6, fire: 0.6, amount: 1, range: 260, speed: 380 },
    ups: [{ dmg: 4, d: '+4 урона' }, { dur: 2, d: 'Тотем стоит дольше' }, { fire: -0.1, d: 'Стреляет чаще' }, { amount: 1, d: '+1 тотем' }, { dmg: 5, d: '+5 урона' },
      { dur: 2, d: 'Тотем стоит дольше' }, { fire: -0.1, d: 'Стреляет чаще' }, { amount: 1, d: '+1 тотем' }, { dmg: 6, d: '+6 урона' }] },
  lances: { name: 'Ледяные копья', icon: '🔷', type: 'radial', color: '#9fe8ff', desc: 'Выпускает ледяные копья во все стороны.',
    base: { dmg: 14, cd: 2.4, amount: 4, speed: 360, size: 7, life: 1, pierce: 2 },
    ups: [{ amount: 2, d: '+2 копья' }, { dmg: 5, d: '+5 урона' }, { pierce: 1, d: '+1 пробивание' }, { cd: -0.3, d: 'Быстрее' }, { amount: 2, d: '+2 копья' },
      { dmg: 6, d: '+6 урона' }, { speed: 60, d: 'Летят дальше' }, { amount: 2, d: '+2 копья' }, { dmg: 8, d: '+8 урона' }] },
});
Object.assign(EVOLUTIONS, {
  blood_forest: { name: 'Кровавый лес', icon: '🌹', from: 'spikes', with: 'heart', type: 'spikes', color: '#ff2050', desc: 'Лес кровавых шипов, крадущих жизнь.',
    base: { dmg: 45, cd: 0.9, amount: 7, radius: 40, delay: 0.35, range: 300, leech: 1 } },
  pestilence: { name: 'Чума', icon: '🦠', from: 'plague', with: 'boots', type: 'plague', color: '#b0ff3a', desc: 'Густое облако чумы: ранит и замедляет.',
    base: { dmg: 22, cd: 0.18, radius: 42, dur: 3.5, slow: 1 } },
  shuriken_storm: { name: 'Буря сюрикенов', icon: '🌪️', from: 'shuriken', with: 'bracer', type: 'shuriken', color: '#e0f0ff', desc: 'Смерч из бесконечно пробивающих сюрикенов.',
    base: { dmg: 26, cd: 0.9, amount: 10, speed: 220, size: 11, life: 2.6, pierce: 99 } },
  fortress: { name: 'Крепость', icon: '🏰', from: 'turret', with: 'candle', type: 'turret', color: '#5affc8', desc: 'Три тотема ведут непрерывный огонь.',
    base: { dmg: 24, cd: 5, dur: 10, fire: 0.25, amount: 3, range: 320, speed: 460, pierce: 2 } },
  frost_star: { name: 'Ледяная звезда', icon: '🌟', from: 'lances', with: 'clover', type: 'radial', color: '#dff8ff', desc: 'Звезда из замораживающих копий.',
    base: { dmg: 34, cd: 1.2, amount: 16, speed: 420, size: 9, life: 1.2, pierce: 6, freeze: 0.6 } },
});
Object.assign(PASSIVES, {
  fang: { name: 'Вампирский клык', icon: '🦷', max: 5, desc: '+1.5% нанесённого урона лечит героя', stat: { lifesteal: 0.015 } },
  thorns: { name: 'Шипастая броня', icon: '🌵', max: 5, desc: 'Когда героя бьют, вокруг вырываются шипы (+25 урона за уровень)', stat: { thorns: 1 } },
});
DEFAULT_SKILLS.push('spikes', 'shuriken', 'plague', 'fang');
for (const [st, ids] of [['desert', ['turret']], ['swamp', ['lances']], ['toxic', ['thorns']]]) { const s = STAGES.find(x => x.id === st); if (s) s.unlocks.push(...ids); }
// Тараканы: старая анимированная модель (первый лист мобов) — у неё усы, лапы, атака и смерть.
// Цветные варианты уровней — та же модель с оттенком.
if (typeof ART_META !== 'undefined' && ART_META.enemies.roach) {
  const m = ART_META.enemies.roach, anims = { walk: { row: 0, n: m.walk, fps: 9 }, attack: { row: 1, n: m.attack, fps: 8 }, hit: { row: 2, n: m.hit, fps: 10 }, death: { row: 3, n: m.death, fps: 5 } };
  for (const [skin, tint] of [['roach', null], ['roach_red', '#ff2a10'], ['roach_green', '#6aff2a']]) {
    ART['enemy_' + skin] = { file: 'art/enemies/roach.png', cw: m.cw, ch: m.ch, anims, tint };
    ART['enemy_' + skin + '_big'] = { file: 'art/enemies/roach_big.png', frames: 1, fps: 1, tint, scale: 0.85 };
  }
}
Object.assign(WEAPONS, {
  swords: { name: 'Призрачные мечи', icon: '🗡', type: 'swords', color: '#b8a0ff', desc: 'Мечи парят рядом и сами бросаются на врагов.',
    base: { dmg: 13, cd: 1.2, amount: 2, speed: 520, size: 9 },
    ups: [{ dmg: 4, d: '+4 урона' }, { amount: 1, d: '+1 меч' }, { cd: -0.15, d: 'Чаще атакуют' }, { dmg: 5, d: '+5 урона' }, { amount: 1, d: '+1 меч' },
      { size: 3, d: 'Крупнее' }, { cd: -0.15, d: 'Чаще атакуют' }, { amount: 1, d: '+1 меч' }, { dmg: 8, d: '+8 урона' }] },
  quake: { name: 'Землетрясение', icon: '🌋', type: 'quake', color: '#d8a060', desc: 'Трещины расходятся по земле и оглушают врагов.',
    base: { dmg: 16, cd: 3.2, amount: 3, length: 180, stun: 0.6 },
    ups: [{ amount: 1, d: '+1 трещина' }, { dmg: 6, d: '+6 урона' }, { length: 40, d: 'Длиннее' }, { cd: -0.4, d: 'Быстрее' }, { amount: 1, d: '+1 трещина' },
      { stun: 0.3, d: 'Дольше оглушение' }, { dmg: 8, d: '+8 урона' }, { amount: 2, d: '+2 трещины' }, { dmg: 10, length: 40, d: '+10 урона, длиннее' }] },
  starfall: { name: 'Звездопад', icon: '🌠', type: 'starfall', color: '#fff0a0', desc: 'Вокруг героя непрерывно падают звёзды.',
    base: { dmg: 22, cd: 1.1, amount: 1, radius: 34, range: 230 },   // реже, но каждая звезда сильнее
    ups: [{ dmg: 6, d: '+6 урона' }, { cd: -0.12, d: 'Падают чаще' }, { radius: 6, d: '+область' }, { amount: 1, d: '+1 звезда' }, { dmg: 8, d: '+8 урона' },
      { cd: -0.12, d: 'Падают чаще' }, { radius: 6, d: '+область' }, { amount: 1, d: '+1 звезда' }, { dmg: 12, d: '+12 урона' }] },
  tornado: { name: 'Вихрь', icon: '🌪', type: 'tornado', color: '#bfe0ff', desc: 'Вихри уходят от героя и затягивают врагов.',
    base: { dmg: 8, cd: 3, amount: 1, speed: 90, size: 26, life: 3.5 },
    ups: [{ dmg: 3, d: '+3 урона' }, { size: 6, d: 'Крупнее' }, { amount: 1, d: '+1 вихрь' }, { life: 1, d: 'Дольше живут' }, { dmg: 4, d: '+4 урона' },
      { cd: -0.4, d: 'Чаще' }, { amount: 1, d: '+1 вихрь' }, { size: 8, d: 'Крупнее' }, { dmg: 6, d: '+6 урона' }] },
  batswarm: { name: 'Стая мышей', icon: '🦇', type: 'batswarm', color: '#ff4a6a', desc: 'Летучие мыши сами находят врагов.',
    base: { dmg: 9, cd: 1.4, amount: 2, speed: 230, life: 3, pierce: 2 },
    ups: [{ amount: 1, d: '+1 мышь' }, { dmg: 3, d: '+3 урона' }, { pierce: 1, d: '+1 пробивание' }, { amount: 1, d: '+1 мышь' }, { cd: -0.2, d: 'Чаще' },
      { dmg: 4, d: '+4 урона' }, { amount: 1, d: '+1 мышь' }, { speed: 50, d: 'Быстрее' }, { dmg: 6, amount: 1, d: '+6 урона, +1 мышь' }] },
});
Object.assign(EVOLUTIONS, {
  blade_dance: { name: 'Танец клинков', icon: '⚔️', from: 'swords', with: 'power', type: 'swords', color: '#d8c8ff', desc: 'Вихрь призрачных клинков без передышки.',
    base: { dmg: 34, cd: 0.45, amount: 6, speed: 640, size: 12 } },
  rift: { name: 'Разлом', icon: '💢', from: 'quake', with: 'armor', type: 'quake', color: '#ff9a40', desc: 'Земля раскалывается во все стороны.',
    base: { dmg: 40, cd: 1.8, amount: 8, length: 280, stun: 1.2 } },
  meteor_shower: { name: 'Звёздный дождь', icon: '💫', from: 'starfall', with: 'crown', type: 'starfall', color: '#ffe060', desc: 'Ливень падающих звёзд.',
    base: { dmg: 45, cd: 0.55, amount: 4, radius: 48, range: 280 } },
  hurricane: { name: 'Ураган', icon: '🌀', from: 'tornado', with: 'duration', type: 'tornado', color: '#e0f4ff', desc: 'Огромные вихри, втягивающие толпы.',
    base: { dmg: 20, cd: 2, amount: 3, speed: 80, size: 46, life: 6 } },
  night_flock: { name: 'Ночная стая', icon: '🌑', from: 'batswarm', with: 'fang', type: 'batswarm', color: '#ff2a4a', desc: 'Туча мышей, пьющих кровь врагов.',
    base: { dmg: 22, cd: 0.6, amount: 6, speed: 280, life: 3.5, pierce: 4, leech: 1 } },
});
DEFAULT_SKILLS.push('swords', 'starfall', 'tornado');
for (const [st, ids] of [['jungle', ['quake']], ['moon', ['batswarm']]]) { const s = STAGES.find(x => x.id === st); if (s) s.unlocks.push(...ids); }
// ---------- Огненный шар, Святая вода, Боевой топор (иконки — tools/cut-icons2.ps1) ----------
Object.assign(WEAPONS, {
  fireball: { name: 'Огненный шар', icon: '🔥', type: 'fireball', color: '#ff7a2a', desc: 'Огненный шар летит в ближайшего врага и взрывается, поджигая всех вокруг.',
    base: { dmg: 16, cd: 1.5, amount: 1, speed: 290, size: 8, life: 2.2, radius: 44, burn: 6 },
    ups: [{ dmg: 5, d: '+5 урона' }, { radius: 10, d: 'Взрыв больше' }, { amount: 1, d: '+1 шар' }, { cd: -0.2, d: 'Быстрее' }, { dmg: 6, burn: 4, d: '+6 урона, сильнее поджог' },
      { radius: 10, d: 'Взрыв больше' }, { amount: 1, d: '+1 шар' }, { cd: -0.2, dmg: 5, d: 'Быстрее, +5 урона' }, { amount: 1, dmg: 8, d: '+1 шар, +8 урона' }] },
  holywater: { name: 'Святая вода', icon: '💧', type: 'holywater', color: '#8ad8ff', desc: 'Бросает флаконы святой воды — на земле остаются освящённые лужи, ранящие врагов.',
    base: { dmg: 14, cd: 3, amount: 1, radius: 40, dur: 2.6 },
    ups: [{ amount: 1, d: '+1 флакон' }, { radius: 8, d: 'Лужа больше' }, { dmg: 5, d: '+5 урона' }, { dur: 0.8, d: 'Дольше горит' }, { amount: 1, d: '+1 флакон' },
      { cd: -0.4, d: 'Чаще' }, { dmg: 6, radius: 6, d: '+6 урона, больше' }, { amount: 1, d: '+1 флакон' }, { dmg: 8, dur: 0.8, d: '+8 урона, дольше' }] },
  axe: { name: 'Боевой топор', icon: '🪓', type: 'axe', color: '#9fd8ff', desc: 'Подбрасывает тяжёлые топоры: они летят дугой вверх и падают, пробивая толпу.',
    base: { dmg: 24, cd: 1.7, amount: 1, speed: 430, size: 12, life: 2.4, pierce: 3 },
    ups: [{ dmg: 8, d: '+8 урона' }, { amount: 1, d: '+1 топор' }, { pierce: 2, d: '+2 пробивания' }, { size: 3, d: 'Крупнее' }, { dmg: 10, d: '+10 урона' },
      { amount: 1, d: '+1 топор' }, { cd: -0.25, d: 'Быстрее' }, { pierce: 3, size: 3, d: '+3 пробивания, крупнее' }, { amount: 1, dmg: 12, d: '+1 топор, +12 урона' }] },
});
Object.assign(EVOLUTIONS, {
  phoenix: { name: 'Феникс', icon: '☄️', from: 'fireball', with: 'amount', type: 'fireball', color: '#ffb02a', desc: 'Залпы огромных огненных шаров, выжигающих целые толпы.',
    base: { dmg: 40, cd: 0.8, amount: 4, speed: 340, size: 12, life: 2.4, radius: 84, burn: 22 } },
  holy_spring: { name: 'Святой источник', icon: '⛲', from: 'holywater', with: 'regen', type: 'holywater', color: '#c8f0ff', desc: 'Огромные святые лужи; стоя в них, герой лечится.',
    base: { dmg: 34, cd: 1.6, amount: 4, radius: 66, dur: 4.5, heal: 1 } },
  death_spiral: { name: 'Смертоворот', icon: '⚜️', from: 'axe', with: 'tome', type: 'axe', color: '#c8ecff', desc: 'Огромные топоры разлетаются во все стороны и крушат всё насквозь.',
    base: { dmg: 70, cd: 1.1, amount: 6, speed: 480, size: 20, life: 2.6, pierce: 99, spread: 1 } },
});
DEFAULT_SKILLS.push('fireball', 'axe');
for (const [st, ids] of [['crypt', ['holywater']]]) { const s = STAGES.find(x => x.id === st); if (s) s.unlocks.push(...ids); }
// + иконки из листа «иконки 2» (tools/cut-icons3.ps1): заменяют эмодзи и нарисованные кодом
for (const id of ['knife', 'fireball', 'holywater', 'axe', 'beam', 'frost', 'swords', 'lances', 'turret', 'starfall', 'tornado', 'batswarm', 'plague', 'shuriken', 'spikes', 'drone_swarm',
  'aegis', 'arcane_storm', 'thousand_blades', 'blood_aura', 'sun_vortex', 'soul_reaper', 'heaven_wrath', 'inferno', 'cyclone', 'absolute_zero', 'prism', 'armageddon',
  'steam_burst', 'storm_orbs', 'blood_forest', 'pestilence', 'shuriken_storm', 'fortress', 'frost_star', 'blade_dance', 'rift', 'meteor_shower', 'hurricane', 'night_flock',
  'quake']) {   // Землетрясение: трещины Разлома в цвете лавы и каменный шип FLARE (tools/cut-weapon-art.ps1)
  const s = WEAPONS[id] || EVOLUTIONS[id]; ICON_ART[id] = 'art/icons/' + id + '.png';
  s.iconSrc = ICON_ART[id]; s.icon = '<img class="ic" src="' + ICON_ART[id] + '" alt="">';
  ART['icon_' + id] = { file: ICON_ART[id], frames: 1, fps: 1 };
}
ART.fx_axe = { file: 'art/fx/axe.png', frames: 1, fps: 1 };
ART.fx_holywater = { file: 'art/fx/holywater.png', frames: 1, fps: 1 };
ART.fx_fireball = { file: 'art/fx/fireball.png', frames: 1, fps: 1 };      // голова справа, хвост влево
ART.fx_fire_ring = { file: 'art/fx/fire_ring.png', frames: 1, fps: 1 };    // 6 кадров 160×122 в ряд (tools/cut-fire.ps1)
// Подбираемое, сундуки, снаряды врагов (tools/cut-pickups.ps1)
for (const id of ['gem_blue', 'gem_gold', 'gem_red', 'heart', 'magnet', 'chest', 'chest_rare', 'web', 'ebolt_fire', 'ebolt_fire2', 'ebolt_flame',
  'earrow', 'earrow_red', 'earrow_fire', 'ebolt_purple', 'ebolt_green', 'ebolt_blue']) ART['fx_' + id] = { file: 'art/fx/' + id + '.png', frames: 1, fps: 1 };
ART.fx_coin_spin = { file: 'art/fx/coin_spin.png', frames: 3, fps: 1 };     // анфас, 3/4, ребро
ART.fx_green_spin = { file: 'art/fx/green_spin.png', frames: 3, fps: 1 };
// ---------- Пассивки прокачиваются до 10 уровня (прибавка за уровень вдвое меньше — итог на 10 ур. как раньше на 5) ----------
// Эволюция требует и оружие, и пассивку 10 уровня; при эволюции пассивка вливается в новое оружие (слот освобождается, бонус остаётся).
const PASSIVE_MAX = 10;
{
  const DESC = { power: '+5% урона', tome: '−4% перезарядки', candle: '+5% область атак', bracer: '+5% скорость снарядов', duration: '+6% длительность эффектов',
    heart: '+10 макс. здоровья', armor: '+0.5 брони (входящий урон меньше)', boots: '+4% скорость движения', magnet: '+15% радиус подбора', clover: '+2.5% шанс крит. удара',
    regen: '+0.15 HP/сек', crown: '+4% получаемого опыта', greed: '+7.5% шанс выпадения монет', fang: '+0.75% нанесённого урона лечит героя',
    thorns: 'Когда героя бьют, вокруг вырываются шипы (+12 урона за уровень)', amount: '+1 снаряд ко всем атакам на 5 и 10 уровне' };
  for (const id in PASSIVES) {
    const P = PASSIVES[id], k = (P.max || 5) / PASSIVE_MAX;
    if (id === 'ward') continue;
    for (const s in P.stat) P.stat[s] *= k;
    P.max = PASSIVE_MAX; if (DESC[id]) P.desc = DESC[id];
  }
  PASSIVES.ward.max = PASSIVE_MAX;
  PASSIVES.ward.levels = ['Блок раз в 20 с', 'Перезарядка 18 с', 'Перезарядка 16 с', 'Перезарядка 14 с', 'Перезарядка 12 с',
    'Перезарядка 10.5 с', 'Перезарядка 9 с', 'Перезарядка 8 с', 'Перезарядка 7.5 с', 'Перезарядка 7 с и 2 заряда'];
  WARD_CD.splice(0, WARD_CD.length, 0, 20, 18, 16, 14, 12, 10.5, 9, 8, 7.5, 7);
  WARD_CHARGES.splice(0, WARD_CHARGES.length, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2);
}
// Стая мышей: 4 кадра полёта 110×70 (обычные / со свечением для Ночной стаи) — tools: bats.webp
ART.fx_bats = { file: 'art/fx/bats.png', frames: 4, fps: 10 };
ART.fx_bats_glow = { file: 'art/fx/bats_glow.png', frames: 4, fps: 10 };
// Двойник: 5 уровней, снаряды растут ступеньками (всего на каждом уровне, не прибавка)
const AMOUNT_BY_LEVEL = [0, 1, 1, 2, 2, 3];
PASSIVES.amount.max = 5; PASSIVES.amount.stat = {};
PASSIVES.amount.desc = 'Дополнительные снаряды ко всем атакам';
PASSIVES.amount.levels = ['+1 снаряд ко всем атакам', '+1 снаряд и +5% урона', '+2 снаряда и +5% урона', '+2 снаряда и +10% урона', '+3 снаряда и +10% урона'];
const AMOUNT_MIGHT = [0, 0, 0.05, 0.05, 0.1, 0.1];

// ===================== Модели FLARE (flare-game, CC-BY-SA 3.0) вместо прежних мобов и боссов =====================
// Листы: art/flare/<model>.png, строки: ходьба, атака, урон, смерть (tools/cut-flare.ps1, мета — js/art-meta-flare.js).
// Ключ = прежний тип/вариант моба; [модель, оттенок, масштаб (фигура занимает часть кадра)]
const FLARE_SKINS = {
  crow: ['wyvern_air', null, 1.7], bat: ['wyvern', null, 1.7], diver: ['wyvern_fire', null, 1.7],
  roach: ['antlion_small', null, 1.5], roach_green: ['antlion_small', '#7aff4a', 1.5], roach_red: ['antlion_small', '#ff4a2a', 1.5],
  skeleton: ['skeleton_weak', null, 1.35], skeleton_green: ['skeleton_weak', '#6aff6a', 1.35], skeleton_blue: ['skeleton_weak', '#6ab8ff', 1.35],
  archer: ['skeleton_archer', null, 1.35],
  mushroom: ['skeleton_mage', null, 1.35], mushroom_purple: ['skeleton_mage', '#c06aff', 1.35], mushroom_blue: ['skeleton_mage', '#6ac8ff', 1.35],
  sporeling: ['zombie', '#8aff4a', 1.35],
  wolf: ['goblin', null, 1.4], wolf_blue: ['goblin', '#8ab8ff', 1.4], wolf_red: ['goblin_elite', null, 1.35],
  gnome: ['hobgoblin', null, 1.35], gnome_armored: ['hobgoblin_archer', null, 1.35],
  spider: ['ice_ant', '#4a2a7a', 1.45], spider_purple: ['ice_ant', '#b04aff', 1.45], spider_white: ['ice_ant', null, 1.45],
  blast: ['fire_ant', null, 1.45],
  fire_golem: ['fire_ant', '#ff6a2a', 1.4], stone_golem: ['antlion', null, 1.35], water_golem: ['wyvern_water', null, 1.6],
};
if (typeof ART_FLARE !== 'undefined') {
  const flareArt = (model, tint, scale) => { const m = ART_FLARE[model], r = m.rows;
    return { file: 'art/flare/' + model + '.png', cw: m.cw, ch: m.ch, tint: tint || undefined, scale: scale || 1, flare: 1, anims: {
      walk: { row: 0, n: r[0], fps: 10 }, attack: { row: 1, n: r[1], fps: 10 }, hit: { row: 2, n: r[2], fps: 10 }, death: { row: 3, n: r[3], fps: 8 } } }; };
  for (const k in FLARE_SKINS) { const [m, t, s] = FLARE_SKINS[k]; ART['enemy_' + k] = flareArt(m, t, s); delete ART['enemy_' + k + '_big']; }
  Object.assign(ENEMIES.blast_beetle, { skin: 'blast', name: 'Огненный муравей' });
  Object.assign(ENEMIES.archer, { skin: 'archer' }); Object.assign(ENEMIES.sporeling, { skin: 'sporeling', name: 'Чумной зомби' });
  Object.assign(ENEMIES.diver, { skin: 'diver', name: 'Огненная виверна' });
  const NAMES = { crow: 'Малая виверна', roach: 'Личинка муравьиного льва', skeleton: 'Скелет', mushroom: 'Скелет-маг', wolf: 'Гоблин', gnome: 'Хобгоблин',
    spider: 'Муравей-ткач', fire_golem: 'Огненный муравей-гигант', stone_golem: 'Муравьиный лев', water_golem: 'Водяная виверна', bat: 'Вивернёныш',
    dire_wolf: 'Гоблин-ветеран', bomber: 'Хобгоблин-метатель' };
  for (const k in NAMES) if (ENEMIES[k]) ENEMIES[k].name = NAMES[k];
  // Боссы: [модель, оттенок, масштаб, имя] по ключу арта босса
  const FLARE_BOSSES = {
    ancient_guardian: ['goblin_elite', null, 1.35, 'Вождь гоблинов'], lich: ['skeleton_mage_boss', null, 1.3, 'Лич'],
    ice_dragon: ['wyvern_water', '#bfe8ff', 1.6, 'Ледяная виверна'], flame_golem: ['hobgoblin', '#ff7a3a', 1.35, 'Хобгоблин-вожак'],
    crystal_beast: ['zombie_dark', null, 1.3, 'Тёмный мертвец'], minotaur: ['minotaur', null, 1.3, 'Минотавр'],
    hydra: ['antlion', '#7aa04a', 1.35, 'Трясинный муравьиный лев'], void_lord: ['skeleton_mage', '#8aff6a', 1.35, 'Чумной некромант'],
    spider_lord: ['antlion_armored', null, 1.3, 'Бронированный муравьиный лев'], sky_knight: ['wyvern_air_boss', null, 1.5, 'Повелительница ветров'],
    shark: ['zombie', '#5ab8ff', 1.35, 'Утопленник-великан'], shadow_reaper: ['skeleton_mage_high_boss', null, 1.3, 'Высший маг-скелет'],
    deathknight: ['skeleton_knight_boss', null, 1.3, 'Рыцарь смерти'], void: ['wyvern_fire', '#ff9a4a', 1.6, 'Древняя виверна'],
  };
  for (const k in FLARE_BOSSES) { const [m, t, s] = FLARE_BOSSES[k]; ART['boss_' + k] = flareArt(m, t, s); delete ART['boss_' + k + '_big']; }
  for (const S of STAGES) { const f = S.boss.art && FLARE_BOSSES[S.boss.art]; if (f) S.boss.name = f[3]; }
}
// Герои FLARE: собраны из слоёв (tools/cut-flare-heroes.ps1), строки: стойка, бег, атака, смерть
if (typeof ART_FLARE_HEROES !== 'undefined') for (const id in ART_FLARE_HEROES) {
  if (!HEROES[id]) continue;
  const m = ART_FLARE_HEROES[id], r = m.rows;
  const idle = { row: 0, n: r[0], fps: 5 };
  ART['hero_' + id] = { file: 'art/flare/hero_' + id + '.png', cw: m.cw, ch: m.ch, scale: 1.45, flare: 1, anims: {
    idle, walk: idle, run: { row: 1, n: r[1], fps: 12 }, attack: { row: 2, n: r[2], fps: 12 }, death: { row: 3, n: r[3], fps: 8 } } };
  delete ART['hero_' + id + '_big'];
}
// Мир FLARE: текстуры земли и препятствия (tools/cut-flare-world.ps1)
const FLARE_GROUND = { meadow: 'grass', forest: 'grass', wheat: 'grass', endless: 'grass', jungle: 'jungle', swamp: 'swamp', toxic: 'toxic', ruins: 'ruins',
  snow: 'snow', moon: 'moon', desert: 'desert', canyon: 'canyon', coast: 'coast', volcano: 'volcano', haunted: 'haunted', crystal_blue: 'crystal_blue', crystal_purple: 'crystal_purple' };
for (const n of new Set(Object.values(FLARE_GROUND))) ART['ground_' + n] = { file: 'art/flare/ground_' + n + '.jpg', frames: 1, fps: 1 };
if (typeof FLARE_PROPS !== 'undefined') for (const k in FLARE_PROPS) ART['prop_' + k] = { file: 'art/flare/props/' + k + '.png', frames: 1, fps: 1 };
// Эффекты способностей FLARE (tools/cut-flare-fx.ps1): кадры в ряд
// Эффекты заклинаний (tools/cut-spells.ps1): точка привязки — центр кадра
if (typeof FLARE_FX !== 'undefined' && typeof SPELL_FX !== 'undefined') for (const k in SPELL_FX) FLARE_FX[k] = Object.assign({ ax: SPELL_FX[k].cw / 2, ay: SPELL_FX[k].ch / 2 }, SPELL_FX[k]);
// Оберег отбил удар: крылатый щит (Cethiel, «Angel Shield Effect», CC0; tools/cut-weapon-art.ps1) раскрывается перед героем
if (typeof FLARE_FX !== 'undefined') FLARE_FX.ward_wings = { cw: 150, ch: 120, ax: 75, ay: 70, n: 4 };
if (typeof FLARE_FX !== 'undefined' && FLARE_FX.spikes) FLARE_FX.spikes_blood = Object.assign({}, FLARE_FX.spikes);   // Кровавые шипы: те же шипы, перекрашенные в алый
if (typeof FLARE_FX !== 'undefined') for (const k in FLARE_FX) ART['fx_f_' + k] = { file: 'art/flare/fx_' + k + '.png', frames: FLARE_FX[k].n, fps: 12 };
// Мобы, которые рисуются чужой моделью (skin), своих картинок не имеют — убираем пустые записи, чтобы не грузить 404
for (const id in ENEMIES) { const s = ENEMIES[id].skin; if (s && s !== id && !(typeof FLARE_SKINS !== 'undefined' && FLARE_SKINS[id])) { delete ART['enemy_' + id]; delete ART['enemy_' + id + '_big']; } }
// Максимальный уровень оружия или предмета — для текстов рецептов эволюций (не держим «10» в тексте)
const maxLv = id => WEAPONS[id] ? (WEAPONS[id].ups ? WEAPONS[id].ups.length + 1 : 1) : PASSIVES[id] ? PASSIVES[id].max : 1;
