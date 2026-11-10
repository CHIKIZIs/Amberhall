// Игровые данные: предметы, враги, локации, уровни, сохранение.
export const RU = /^(ru|uk|be|kk)/i.test(navigator.language || '');
export const L = (ru, en) => (RU ? ru : en);

export const RAR = [
  { name: L('Обычный', 'Common'), color: '#8fa1b3', dark: '#5b6b7c', mul: 1 },
  { name: L('Редкий', 'Rare'), color: '#3da2ff', dark: '#1c5fb8', mul: 1.35 },
  { name: L('Эпический', 'Epic'), color: '#b660ff', dark: '#6b24b8', mul: 1.8 },
  { name: L('Легендарный', 'Legendary'), color: '#ffb629', dark: '#c26a00', mul: 2.4 },
];
export const TIER = [1, 1.9, 3.4, 6];
export const TIER_NAME = [L('Лесной', 'Forest'), L('Песчаный', 'Sand'), L('Ледяной', 'Frost'), L('Пепельный', 'Ash')];

// kind: arc — взмах перед собой, slam — удар по площади, shot — стрела, orb — взрывной шар
export const WEAPONS = {
  sword: { name: L('Меч', 'Sword'), kind: 'arc', range: 2.4, arc: 2.3, cd: 0.55, dmg: 1, charge: 10,
    sup: L('Вихрь', 'Whirlwind'), desc: L('Широкий взмах по всем врагам рядом', 'Wide slash that hits everyone nearby') },
  daggers: { name: L('Кинжал', 'Daggers'), kind: 'arc', range: 1.9, arc: 1.7, cd: 0.3, dmg: 0.58, crit: 0.15, charge: 16,
    sup: L('Теневой рывок', 'Shadow chain'), desc: L('Очень быстрые удары, +15% крит', 'Very fast strikes, +15% crit') },
  hammer: { name: L('Молот', 'Hammer'), kind: 'slam', range: 2.3, radius: 2.5, cd: 1.05, dmg: 2.1, charge: 6,
    sup: L('Землетрясение', 'Earthquake'), desc: L('Медленный удар по площади, отбрасывает', 'Slow area smash with knockback') },
  bow: { name: L('Лук', 'Bow'), kind: 'shot', range: 8.5, speed: 21, cd: 0.72, dmg: 0.95, charge: 9,
    sup: L('Град стрел', 'Arrow storm'), desc: L('Бьёт издалека, стрела пробивает насквозь', 'Long range, arrows pierce') },
  staff: { name: L('Посох', 'Staff'), kind: 'orb', range: 7.5, speed: 11.5, radius: 1.9, cd: 1.05, dmg: 1.15, charge: 7,
    sup: L('Метеор', 'Meteor'), desc: L('Шар взрывается и задевает всех рядом', 'Orb explodes and hits everyone around') },
};
export const WTYPES = Object.keys(WEAPONS);
export const PERKS = {
  crit: { name: L('Крит', 'Crit'), val: 0.1, fmt: v => '+' + Math.round(v * 100) + '% ' + L('шанс крита', 'crit chance') },
  speed: { name: L('Скорость', 'Speed'), val: 0.08, fmt: v => '+' + Math.round(v * 100) + '% ' + L('скорость', 'speed') },
  leech: { name: L('Вампиризм', 'Lifesteal'), val: 0.05, fmt: v => '+' + Math.round(v * 100) + '% ' + L('вампиризм', 'lifesteal') },
  charge: { name: L('Ярость', 'Fury'), val: 0.25, fmt: v => '+' + Math.round(v * 100) + '% ' + L('заряд суперудара', 'super charge') },
};
export const SLOTS = ['weapon', 'armor', 'amulet'];
export const SLOT_NAME = { weapon: L('Оружие', 'Weapon'), armor: L('Броня', 'Armor'), amulet: L('Амулет', 'Amulet') };
export const MAX_ITEM_LVL = 10;

export function itemName(it) {
  const base = it.slot === 'weapon' ? WEAPONS[it.type].name : it.slot === 'armor' ? L('Доспех', 'Armor') : L('Амулет', 'Amulet');
  return TIER_NAME[it.tier] + (RU ? ' ' + base.toLowerCase() : ' ' + base);
}
export function itemStats(it, lvl = it.lvl) {
  const k = TIER[it.tier] * RAR[it.rar].mul * (1 + 0.1 * (lvl - 1));
  if (it.slot === 'weapon') return { atk: Math.round(8 * k), hp: 0 };
  if (it.slot === 'armor') return { atk: 0, hp: Math.round(70 * k) };
  return { atk: Math.round(2.5 * k), hp: Math.round(20 * k), perk: it.perk, perkVal: PERKS[it.perk].val * (1 + 0.3 * it.rar) };
}
export const upgradeCost = it => Math.round(35 * TIER[it.tier] * (1 + it.rar * 0.8) * it.lvl);
export const sellValue = it => Math.round(18 * TIER[it.tier] * (1 + it.rar * 1.5) * (1 + (it.lvl - 1) * 0.4));
export const itemPower = it => { const s = itemStats(it); return s.atk * 4 + s.hp * 0.5; };

const rnd = arr => arr[Math.floor(Math.random() * arr.length)];
export function rollItem(S, tier, odds, slot) {
  let x = Math.random() * 100, rar = 0;
  for (let i = 0; i < 4; i++) { if (x < odds[i]) { rar = i; break; } x -= odds[i]; }
  slot = slot || rnd(['weapon', 'weapon', 'armor', 'armor', 'amulet']);
  const it = { id: S.nextId++, slot, tier, rar, lvl: 1 };
  if (slot === 'weapon') it.type = rnd(WTYPES);
  if (slot === 'amulet') it.perk = rnd(Object.keys(PERKS));
  return it;
}

export const CHESTS = [
  { id: 'wood', name: L('Деревянный сундук', 'Wooden chest'), cost: 120, odds: [74, 23, 3, 0], color: '#b9793d' },
  { id: 'gold', name: L('Золотой сундук', 'Golden chest'), cost: 450, odds: [0, 70, 26, 4], color: '#ffc531' },
  { id: 'myth', name: L('Сундук героя', 'Hero chest'), cost: 1500, odds: [0, 0, 76, 24], color: '#b660ff' },
];
export const chestCost = (c, tier) => Math.round(c.cost * [1, 2.2, 4.5, 9][tier]);
export const FREE_CHEST_MS = 3 * 3600 * 1000;

// ---------- Враги ----------
export const ENEMY = {
  grunt: { hp: 34, dmg: 9, speed: 2.7, r: 0.5, cost: 1, wind: 0.38, rest: 0.9, name: L('Громила', 'Grunt') },
  runner: { hp: 15, dmg: 6, speed: 4.6, r: 0.38, cost: 0.7, wind: 0.24, rest: 0.7, name: L('Шустрик', 'Runner') },
  archer: { hp: 22, dmg: 8, speed: 2.3, r: 0.45, cost: 1.3, wind: 0.4, rest: 1.9, name: L('Стрелок', 'Archer') },
  bomber: { hp: 20, dmg: 22, speed: 3.6, r: 0.45, cost: 1.2, wind: 0.75, rest: 0, name: L('Подрывник', 'Bomber') },
  brute: { hp: 130, dmg: 20, speed: 1.75, r: 0.8, cost: 3, wind: 0.75, rest: 1.3, name: L('Верзила', 'Brute') },
  shaman: { hp: 40, dmg: 16, speed: 2.1, r: 0.48, cost: 2, wind: 1.0, rest: 3.0, name: L('Шаман', 'Shaman') },
  boss: { hp: 470, dmg: 20, speed: 2.1, r: 1.25, cost: 0, wind: 0.8, rest: 1.2, name: 'Boss' },
};

export const LOCS = [
  { name: L('Шепчущий лес', 'Whisperwood'), sky: 0x8fd3e8, ground: 0x4c9a3c, floorA: '#7cc653', floorB: '#71ba4b', rim: 0x8a5a2b,
    enemy: [0x7a9c3a, 0xc9d86a, 0x4f6b2a], boss: L('Король корней', 'Root King'), bossSkills: ['slam', 'summon', 'charge'] },
  { name: L('Пески заката', 'Sunset Sands'), sky: 0xf7c98b, ground: 0xc79a4e, floorA: '#edc977', floorB: '#e3bd69', rim: 0xa5673a,
    enemy: [0xd0703a, 0xf0d28a, 0x8a4a2a], boss: L('Скарабей-владыка', 'Scarab Lord'), bossSkills: ['ring', 'charge', 'slam'] },
  { name: L('Ледяной перевал', 'Frost Pass'), sky: 0xbfe4f7, ground: 0xa9c9dc, floorA: '#e4f1f8', floorB: '#d5e8f3', rim: 0x6b93b3,
    enemy: [0x5e8fc4, 0xdff3ff, 0x39577d], boss: L('Ледяной исполин', 'Frost Colossus'), bossSkills: ['rain', 'ring', 'slam', 'summon'] },
  { name: L('Пепельная цитадель', 'Ashen Citadel'), sky: 0x3a1f24, ground: 0x3a2b2b, floorA: '#5a4444', floorB: '#4f3b3b', rim: 0x1f1516,
    enemy: [0xa83232, 0xff9a3d, 0x4a1c1c], boss: L('Повелитель пепла', 'Ash Overlord'), bossSkills: ['ring', 'rain', 'charge', 'summon', 'slam'] },
];
export const LEVELS = 20;
export const enemyScale = lv => ({ hp: Math.pow(1.14, lv), dmg: Math.pow(1.11, lv) });

export function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

export function levelWaves(lv) {
  const loc = Math.floor(lv / 5), n = lv % 5, r = rng(1000 + lv * 77), boss = n === 4;
  const pool = ['grunt'];
  if (lv >= 1) pool.push('runner');
  if (lv >= 2) pool.push('archer');
  if (lv >= 3) pool.push('brute');
  if (lv >= 5) pool.push('bomber');
  if (lv >= 7) pool.push('shaman');
  const waves = [], count = boss ? 2 : 3;
  for (let w = 0; w < count; w++) {
    let budget = 3 + n * 0.8 + w * 1.2 + loc * 0.9;
    const list = [];
    if (boss && w === 1) { list.push('boss'); budget *= 0.45; }
    let guard = 0;
    while (budget > 0.6 && list.length < 13 && guard++ < 60) {
      const t = pool[Math.floor(r() * pool.length)];
      if (ENEMY[t].cost > budget + 0.4) continue;
      list.push(t); budget -= ENEMY[t].cost;
    }
    waves.push(list);
  }
  return waves;
}
export const levelGold = lv => Math.round(60 * Math.pow(1.135, lv));
export const levelXp = lv => Math.round(36 * Math.pow(1.125, lv));
export const xpNeed = lvl => Math.round(50 * Math.pow(1.2, lvl - 1));

// ---------- Арена ----------
export const LEAGUES = [
  { at: 0, name: L('Бронза', 'Bronze'), color: '#c98a52' }, { at: 150, name: L('Серебро', 'Silver'), color: '#c3ccd6' },
  { at: 400, name: L('Золото', 'Gold'), color: '#ffc531' }, { at: 800, name: L('Кристалл', 'Crystal'), color: '#6fe0ff' },
  { at: 1400, name: L('Мастер', 'Master'), color: '#b660ff' }, { at: 2200, name: L('Легенда', 'Legend'), color: '#ff5a5a' },
];
export const league = t => { let r = LEAGUES[0]; for (const l of LEAGUES) if (t >= l.at) r = l; return r; };
export const RIVALS = ['Kaito', 'Мира', 'Borg', 'Зефир', 'Nyx', 'Гром', 'Lumen', 'Тайга', 'Rook', 'Искра', 'Vex', 'Сокол', 'Onyx', 'Буран', 'Juno', 'Ворон', 'Pike', 'Рысь', 'Ember', 'Шторм'];

// ---------- Сохранение ----------
const KEY = 'raidborn.v1';
export function newSave() {
  const S = { v: 1, gold: 100, lvl: 1, xp: 0, trophies: 0, items: [], eq: {}, prog: [], sound: true, freeAt: 0, nextId: 1, wins: 0, tut: 0 };
  const add = (slot, type) => { const it = { id: S.nextId++, slot, tier: 0, rar: 0, lvl: 1 }; if (type) it.type = type; S.items.push(it); return it; };
  S.eq.weapon = add('weapon', 'sword').id; S.eq.armor = add('armor').id; add('weapon', 'bow');
  return S;
}
export function loadSave() {
  try { const S = JSON.parse(localStorage.getItem(KEY)); if (S && S.v === 1 && S.items) return S; } catch (e) {}
  return newSave();
}
export function store(S) { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

export const getItem = (S, id) => S.items.find(i => i.id === id);
export function heroStats(S) {
  let hp = 120 + 14 * (S.lvl - 1), atk = 6 + 1.2 * (S.lvl - 1), crit = 0.05, speed = 1, leech = 0, charge = 1, wtype = 'sword', power = 0;
  let armorTier = 0, armorRar = 0, wRar = 0;
  for (const slot of SLOTS) {
    const it = getItem(S, S.eq[slot]); if (!it) continue;
    const s = itemStats(it); hp += s.hp; atk += s.atk;
    if (slot === 'weapon') { wtype = it.type; wRar = it.rar; }
    if (slot === 'armor') { armorTier = it.tier; armorRar = it.rar; }
    if (s.perk === 'crit') crit += s.perkVal; if (s.perk === 'speed') speed += s.perkVal;
    if (s.perk === 'leech') leech += s.perkVal; if (s.perk === 'charge') charge += s.perkVal;
  }
  crit += WEAPONS[wtype].crit || 0;
  power = Math.round(atk * 4 + hp * 0.5);
  return { hp: Math.round(hp), atk: Math.round(atk), crit, speed, leech, charge, wtype, power, armorTier, armorRar, wRar, name: L('Вы', 'You') };
}
export const maxLoc = S => Math.min(3, Math.floor((S.prog.filter(x => x > 0).length) / 5));
