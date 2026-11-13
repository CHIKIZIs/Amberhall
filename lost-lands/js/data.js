'use strict';
/* Data: предметы, рецепты, постройки, объекты мира, существа, навыки, задания, тексты. */
(() => {
  const P = G.PAL;
  /* ---------- ПРЕДМЕТЫ ---------- */
  const IT = G.ITEMS = {};
  const I = (id, name, cat, stack, ic, ex) => { IT[id] = Object.assign({ id, name, cat, stack, ic, desc: '' }, ex || {}); };
  G.CATS = [['all', 'Все'], ['res', 'Ресурсы'], ['food', 'Еда'], ['tool', 'Инструменты'], ['weapon', 'Оружие'], ['armor', 'Броня'], ['mat', 'Материалы'], ['misc', 'Разное']];
  // ресурсы
  I('wood', 'Древесина', 'res', 50, ['log', '#6e4c36', '#b08a5c']);
  I('pine_wood', 'Древесина сосны', 'res', 50, ['log', '#4f352a', '#8f6846']);
  I('pink_wood', 'Розовое дерево', 'res', 50, ['log', '#8a3b62', '#f08fb4'], { desc: 'Хранит следы древней магии.' });
  I('stick', 'Сухая ветка', 'res', 50, ['stick']);
  I('bark', 'Кора', 'res', 50, ['bark']);
  I('resin', 'Смола', 'res', 50, ['drop', '#e39a2a']);
  I('stone', 'Камень', 'res', 50, ['rock', P.stone]);
  I('granite', 'Гранит', 'res', 50, ['rock', P.granite]);
  I('limestone', 'Известняк', 'res', 50, ['rock', P.lime]);
  I('coal', 'Уголь', 'res', 50, ['rock', P.coal], { desc: 'Топливо для печи.' });
  I('iron_ore', 'Железная руда', 'res', 50, ['rock', P.granite, P.iron]);
  I('copper_ore', 'Медная руда', 'res', 50, ['rock', P.stone, P.copper]);
  I('gold_ore', 'Золотая руда', 'res', 50, ['rock', P.stone, P.gold]);
  I('crystal', 'Кристалл', 'res', 50, ['gem', P.crg], { desc: 'Светится изнутри.' });
  I('ice_shard', 'Ледяной осколок', 'res', 50, ['gem', P.crb]);
  I('star_ore', 'Звёздная руда', 'res', 50, ['rock', P.star, P.crp], { desc: 'Упала с неба.' });
  I('clay', 'Глина', 'res', 50, ['lump', '#b5704f']);
  I('grass', 'Трава', 'res', 50, ['leaf', '#56aa52']);
  I('fiber', 'Волокно', 'res', 50, ['fiber']);
  I('flower', 'Цветок', 'res', 50, ['flower', '#ff6f91']);
  I('glow_flower', 'Светоцвет', 'res', 50, ['flower', '#7ef0ff'], { desc: 'Редкий цветок Зачарованного леса.' });
  I('glow_mushroom', 'Светящийся гриб', 'res', 50, ['mush', '#3aa8f0']);
  I('leather', 'Кожа', 'res', 50, ['hide']);
  I('bone', 'Кость', 'res', 50, ['bone']);
  I('feather', 'Перо', 'res', 50, ['feather']);
  I('slime_gel', 'Слизь', 'res', 50, ['drop', '#6fd66f']);
  I('essence', 'Эссенция духа', 'res', 50, ['orb', '#e58aff']);
  I('golem_core', 'Ядро голема', 'res', 20, ['orb', '#ff9a3e']);
  I('frost_heart', 'Морозное сердце', 'res', 20, ['orb', '#9ad6ef']);
  I('gear', 'Древняя шестерня', 'res', 50, ['gear'], { desc: 'Деталь механизмов Хранителей.' });
  I('wheat', 'Пшеница', 'res', 50, ['wheat']);
  // семена
  const seed = (crop, name, c) => I('seed_' + crop, name, 'misc', 50, ['seed', c], { seed: crop, desc: 'Посадите на грядку.' });
  seed('carrot', 'Семена моркови', '#e5741f'); seed('potato', 'Клубни картофеля', '#c9a66b'); seed('wheat', 'Зёрна пшеницы', '#f5d76a'); seed('cabbage', 'Семена капусты', '#a8e072');
  seed('berry', 'Семена ягод', '#e23a5c'); seed('pumpkin', 'Семена тыквы', '#f08a24'); seed('herb', 'Семена трав', '#8fe0a0');
  // еда
  const F = (id, name, stack, ic, food, ex) => I(id, name, 'food', stack, ic, Object.assign({ food }, ex || {}));
  F('berries', 'Ягоды', 30, ['berry', '#e23a5c'], { hunger: 8, thirst: 5 });
  F('mushroom', 'Гриб', 30, ['mush', '#b06a36'], { hunger: 7 });
  F('herb', 'Лекарственная трава', 30, ['leaf', '#8fe0a0'], { hp: 10 });
  F('cactus', 'Мякоть кактуса', 30, ['lump', '#4ba24f'], { thirst: 16, hunger: 3 });
  F('raw_meat', 'Сырое мясо', 20, ['meat', '#d8556a', '#f0a0a8'], { hunger: 10, hp: -8 }, { desc: 'Лучше пожарить.' });
  F('raw_fish', 'Рыба', 20, ['fish', '#7fb7d6'], { hunger: 8, hp: -5 }, { desc: 'Лучше пожарить.' });
  F('carrot', 'Морковь', 30, ['carrot'], { hunger: 11 });
  F('potato', 'Картофель', 30, ['lump', '#c9a66b'], { hunger: 8 });
  F('cabbage', 'Капуста', 30, ['cabbage'], { hunger: 12, thirst: 4 });
  F('pumpkin', 'Тыква', 20, ['pumpkin'], { hunger: 15 });
  F('cooked_meat', 'Жареное мясо', 20, ['meat', '#a8643a', '#d99a5c'], { hunger: 36, hp: 10 });
  F('cooked_fish', 'Жареная рыба', 20, ['fish', '#c98f4f'], { hunger: 28, hp: 8 });
  F('baked_potato', 'Печёный картофель', 20, ['lump', '#b98a52'], { hunger: 24, hp: 4 });
  F('flatbread', 'Лепёшка', 20, ['bread', '#e8c98a', 1], { hunger: 26 });
  F('bread', 'Хлеб', 20, ['bread', '#d8a45a'], { hunger: 42, hp: 5 });
  F('mushroom_soup', 'Грибной суп', 10, ['bowl', '#c9a06a'], { hunger: 40, thirst: 22, hp: 12 });
  F('veg_stew', 'Овощное рагу', 10, ['bowl', '#e07a3a'], { hunger: 58, thirst: 15, hp: 18 });
  F('berry_drink', 'Ягодный напиток', 10, ['cup', '#e23a5c'], { thirst: 48, hunger: 8, stamina: 40 });
  F('herb_tea', 'Травяной чай', 10, ['cup', '#8fe0a0'], { thirst: 38, hp: 14, warm: 30 }, { desc: 'Согревает в стужу.' });
  F('pumpkin_pie', 'Тыквенный пирог', 10, ['pie'], { hunger: 72, hp: 28, stamina: 40 });
  F('feast', 'Пир охотника', 5, ['bowl', '#a8443a'], { hunger: 100, thirst: 25, hp: 45, stamina: 100 }, { desc: 'Сложное блюдо. Насыщает полностью.' });
  F('potion_heal', 'Зелье лечения', 10, ['potion', '#ff4f6a'], { hp: 65 });
  F('potion_stam', 'Тоник бодрости', 10, ['potion', '#ffd23e'], { stamina: 100, hp: 10 });
  I('flask', 'Пустая фляга', 'tool', 1, ['flask', '#00000000'], { flask: 1, desc: 'Наполните у воды клавишей Q.' });
  F('flask_dirty', 'Фляга с сырой водой', 1, ['flask', '#5a9a8a'], { thirst: 38, hp: -8 }, { ret: 'flask', desc: 'Вскипятите на костре.' });
  F('flask_clean', 'Фляга с чистой водой', 1, ['flask', '#55a9de'], { thirst: 62 }, { ret: 'flask' });
  // материалы
  I('plank', 'Доска', 'mat', 50, ['plank']);
  I('rope', 'Верёвка', 'mat', 50, ['rope']);
  I('cloth', 'Ткань', 'mat', 50, ['cloth']);
  I('brick', 'Кирпич', 'mat', 50, ['brick']);
  I('iron_ingot', 'Железный слиток', 'mat', 50, ['ingot', '#a2aab6']);
  I('copper_ingot', 'Медный слиток', 'mat', 50, ['ingot', '#de7a30']);
  I('gold_ingot', 'Золотой слиток', 'mat', 50, ['ingot', '#ffd23e']);
  I('alloy', 'Древний сплав', 'mat', 50, ['ingot', '#a583f5'], { desc: 'Технология Хранителей.' });
  // инструменты
  const T = (id, name, ic, tool, dur, weapon, ex) => I(id, name, 'tool', 1, ic, Object.assign({ tool, dur, weapon }, ex || {}));
  T('stone_axe', 'Каменный топор', ['axe', '#a2aab6'], { type: 'axe', power: 1, tier: 1 }, 70, { dmg: 6, cd: .5, range: 18 });
  T('stone_pick', 'Каменная кирка', ['pick', '#a2aab6'], { type: 'pick', power: 1, tier: 1 }, 70, { dmg: 5, cd: .5, range: 18 });
  T('iron_axe', 'Железный топор', ['axe', '#dfe6f0'], { type: 'axe', power: 2, tier: 2 }, 220, { dmg: 11, cd: .45, range: 19 });
  T('iron_pick', 'Железная кирка', ['pick', '#dfe6f0'], { type: 'pick', power: 2, tier: 2 }, 220, { dmg: 9, cd: .45, range: 19 });
  T('ancient_pick', 'Кирка Хранителей', ['pick', '#a583f5'], { type: 'pick', power: 4, tier: 3 }, 600, { dmg: 14, cd: .4, range: 20 });
  T('hammer', 'Молот', ['hammer', '#a2aab6'], { type: 'hammer', power: 2, tier: 2 }, 140, { dmg: 22, cd: .85, range: 20, kb: 2.2, stun: .7 }, { desc: 'Тяжёлый. Оглушает врагов и ломает треснувшие стены.' });
  T('shovel', 'Лопата', ['shovel', '#a2aab6'], { type: 'shovel', power: 1, tier: 1 }, 90, { dmg: 5, cd: .55, range: 18 }, { desc: 'Копайте песок и землю — вдруг повезёт.' });
  T('fishing_rod', 'Удочка', ['rod'], { type: 'rod' }, 60, null, { desc: 'Повернитесь к воде и нажмите ЛКМ.' });
  T('watering_can', 'Лейка', ['can'], { type: 'can' }, 8, null, { charges: 1, desc: 'Поливает грядки. Наполняется у воды.' });
  T('torch', 'Факел', ['torch'], { type: 'torch' }, 0, { dmg: 4, cd: .5, range: 16 }, { stack: 20, light: 1, place: 'torch', desc: 'Светит в руке. Q — воткнуть в землю.' });
  // оружие
  const W = (id, name, ic, weapon, dur, ex) => I(id, name, 'weapon', 1, ic, Object.assign({ weapon, dur }, ex || {}));
  W('wood_sword', 'Деревянный меч', ['sword', '#b08a5c', '#6e4c36'], { dmg: 9, cd: .42, range: 21 }, 60);
  W('stone_sword', 'Каменный меч', ['sword', '#a2aab6', '#6e4c36'], { dmg: 14, cd: .45, range: 21 }, 110);
  W('iron_sword', 'Железный меч', ['sword', '#dfe6f0', '#8a5a14'], { dmg: 23, cd: .42, range: 23 }, 260);
  W('dagger', 'Кинжал', ['dagger', '#dfe6f0'], { dmg: 13, cd: .25, range: 17, crit: .25 }, 200, { desc: 'Быстрый. +25% шанс крита.' });
  W('bow', 'Лук', ['bow'], { dmg: 16, cd: .7, range: 150, kind: 'bow', ammo: 'arrow' }, 150, { desc: 'Нужны стрелы. Удерживайте для сильного выстрела.' });
  W('staff', 'Посох', ['staff', '#e06af0'], { dmg: 20, cd: .6, range: 130, kind: 'staff', cost: 9 }, 180, { desc: 'Магические заряды тратят выносливость.' });
  W('ancient_blade', 'Клинок Хранителей', ['sword', '#c2a6ff', '#ffd23e'], { dmg: 38, cd: .4, range: 25, leech: .08 }, 600, { desc: 'Возвращает часть урона здоровьем.' });
  W('crystal_staff', 'Кристальный посох', ['staff', '#7ef0ff'], { dmg: 34, cd: .55, range: 150, kind: 'staff', cost: 10, splash: 22 }, 400, { desc: 'Заряд взрывается, задевая всех рядом.' });
  I('arrow', 'Стрела', 'weapon', 50, ['arrow']);
  // броня
  const E = (id, name, ic, slot, armor, warm, ex) => I(id, name, 'armor', 1, ic, { equip: Object.assign({ slot, armor, warm }, ex || {}) });
  E('cloth_shirt', 'Тканевая одежда', ['shirt', '#d9d3be'], 'body', 1, 8, { c: '#d9d3be' });
  E('leather_armor', 'Кожаная броня', ['shirt', '#96683f'], 'body', 4, 10, { c: '#96683f' });
  E('iron_armor', 'Железная броня', ['shirt', '#a2aab6'], 'body', 9, 4, { c: '#a2aab6' });
  E('warm_coat', 'Тёплая одежда', ['shirt', '#5a7ab8'], 'body', 3, 32, { c: '#5a7ab8' });
  E('ancient_armor', 'Доспех Хранителей', ['shirt', '#7668a8'], 'body', 14, 18, { c: '#7668a8' });
  E('leather_cap', 'Кожаный шлем', ['helm', '#96683f'], 'head', 2, 5, { c: '#96683f' });
  E('iron_helmet', 'Железный шлем', ['helm', '#a2aab6'], 'head', 5, 2, { c: '#a2aab6' });
  E('fur_hat', 'Меховая шапка', ['helm', '#e8e4d4'], 'head', 1, 18, { c: '#e8e4d4' });
  E('leather_boots', 'Кожаные сапоги', ['boots', '#6e4c36'], 'feet', 2, 5, { c: '#6e4c36' });
  E('iron_boots', 'Железные сапоги', ['boots', '#8a90a4'], 'feet', 4, 2, { c: '#8a90a4' });
  E('fur_boots', 'Меховые сапоги', ['boots', '#d9d3be'], 'feet', 1, 15, { c: '#d9d3be' });
  E('leather_gloves', 'Кожаные перчатки', ['gloves', '#96683f'], 'hands', 1, 5, { c: '#96683f', gather: .15 });
  E('iron_gauntlets', 'Железные рукавицы', ['gloves', '#a2aab6'], 'hands', 3, 2, { c: '#a2aab6', dmg: .08 });
  E('backpack', 'Рюкзак', ['pack', '#96683f'], 'back', 0, 0, { c: '#96683f', slots: 8 });
  E('big_backpack', 'Большой рюкзак', ['pack', '#4479a8'], 'back', 0, 3, { c: '#4479a8', slots: 16 });
  // разное
  I('key', 'Старый ключ', 'misc', 10, ['key', '#d99a5c'], { desc: 'Открывает запертую дверь в руинах.' });
  I('sigil_forest', 'Печать Леса', 'misc', 1, ['sigil', '#5cb055'], { desc: 'Одна из трёх печатей Врат Сердца.' });
  I('sigil_stone', 'Печать Камня', 'misc', 1, ['sigil', '#ff9a3e'], { desc: 'Одна из трёх печатей Врат Сердца.' });
  I('sigil_frost', 'Печать Льда', 'misc', 1, ['sigil', '#9ad6ef'], { desc: 'Одна из трёх печатей Врат Сердца.' });
  I('heart_shard', 'Осколок Сердца острова', 'misc', 1, ['gem', P.crp], { desc: 'Тёплый. Пульсирует в такт вашему сердцу.' });

  /* ---------- ПОСТРОЙКИ ---------- */
  const B = G.BUILD = {}; G.BUILD_LIST = [];
  G.BCATS = [['base', 'Основа'], ['walls', 'Стены'], ['craft', 'Станки'], ['home', 'Быт'], ['farm', 'Ферма'], ['decor', 'Декор']];
  const Bd = (id, name, cat, kind, cost, st, ex) => {
    B[id] = Object.assign({ id, name, cat, kind, cost, st: st || 'hand' }, ex || {}); G.BUILD_LIST.push(id);
    if (!IT[id]) I(id, name, 'misc', 30, ['build', id], { place: id, desc: 'Постройка. Q — разместить.' }); else IT[id].place = id;
  };
  Bd('found', 'Фундамент', 'base', 'tile', { stone: 2 }, 'hand', { tile: 'FOUND', desc: 'Ровная каменная площадка.' });
  Bd('floor_wood', 'Деревянный пол', 'base', 'tile', { plank: 1 }, 'workbench', { tile: 'WOODF', mat: 'wood', alt: 'floor_stone' });
  Bd('floor_stone', 'Каменный пол', 'base', 'tile', { stone: 2 }, 'workbench', { tile: 'STONEF', mat: 'stone', alt: 'floor_wood' });
  Bd('roof_wood', 'Соломенная крыша', 'base', 'roof', { plank: 1, grass: 2 }, 'workbench', { roof: 1, mat: 'wood', alt: 'roof_stone' });
  Bd('roof_stone', 'Черепичная крыша', 'base', 'roof', { brick: 2 }, 'workbench', { roof: 2, mat: 'stone', alt: 'roof_wood', skill: 1 });
  Bd('bridge', 'Мост', 'base', 'tile', { plank: 3, rope: 1 }, 'workbench', { tile: 'BRIDGE', on: 'water', desc: 'Ставится на воду.' });
  Bd('ladder', 'Лестница', 'base', 'tile', { stick: 4, rope: 1 }, 'workbench', { tile: 'LADDER', on: 'cliff', desc: 'Ставится на скалу и позволяет пройти.' });
  Bd('wall_wood', 'Деревянная стена', 'walls', 'obj', { wood: 2 }, 'hand', { mat: 'wood', alt: 'wall_stone', up: 'wall_stone', desc: 'Углы соединяются сами.' });
  Bd('wall_stone', 'Каменная стена', 'walls', 'obj', { stone: 3 }, 'hand', { mat: 'stone', alt: 'wall_wood' });
  Bd('win_wood', 'Деревянное окно', 'walls', 'obj', { wood: 2, resin: 1 }, 'workbench', { mat: 'wood', alt: 'win_stone', up: 'win_stone' });
  Bd('win_stone', 'Каменное окно', 'walls', 'obj', { stone: 3, resin: 1 }, 'workbench', { mat: 'stone', alt: 'win_wood' });
  Bd('door', 'Дверь', 'walls', 'obj', { plank: 3 }, 'workbench', { rot: 2 });
  Bd('fence', 'Забор', 'walls', 'obj', { stick: 3 }, 'hand');
  Bd('fgate', 'Ворота', 'walls', 'obj', { stick: 4, rope: 1 }, 'workbench');
  Bd('tower', 'Сторожевая башня', 'walls', 'obj', { wood: 20, plank: 10, rope: 4 }, 'workbench', { size: [2, 2], skill: 2, desc: 'Поднимитесь, чтобы осмотреть окрестности.' });
  Bd('campfire', 'Костёр', 'craft', 'obj', { wood: 3, stone: 4 }, 'hand', { desc: 'Свет, тепло и простая готовка.' });
  Bd('workbench', 'Верстак', 'craft', 'obj', { wood: 10, stone: 4 }, 'hand', { desc: 'Открывает сложные рецепты.' });
  Bd('furnace', 'Печь', 'craft', 'obj', { stone: 14, clay: 4 }, 'workbench', { desc: 'Плавит руду в слитки.' });
  Bd('forge', 'Кузница', 'craft', 'obj', { stone: 10, iron_ingot: 3, brick: 4 }, 'workbench', { desc: 'Железные инструменты, оружие и броня.' });
  Bd('kitchen', 'Кухонный котёл', 'craft', 'obj', { stone: 6, clay: 6, plank: 2 }, 'workbench', { desc: 'Супы, рагу, напитки и зелья.' });
  Bd('chest', 'Сундук', 'home', 'obj', { plank: 6, iron_ingot: 2 }, 'workbench', { desc: 'Хранит 20 стопок предметов.' });
  Bd('bed', 'Кровать', 'home', 'obj', { plank: 6, cloth: 2, grass: 8 }, 'workbench', { size: [1, 2], desc: 'Сон лечит и пропускает ночь. Точка возрождения.' });
  Bd('tent', 'Палатка', 'home', 'obj', { stick: 6, fiber: 6, grass: 6 }, 'hand', { size: [2, 2], desc: 'Простое убежище: можно спать.' });
  Bd('torch', 'Факел', 'home', 'obj', { stick: 1, grass: 1 }, 'hand');
  Bd('lantern', 'Фонарь', 'home', 'obj', { copper_ingot: 1, resin: 1, crystal: 1 }, 'forge', { skill: 1 });
  Bd('well', 'Колодец', 'home', 'obj', { stone: 12, plank: 4, rope: 2 }, 'workbench', { size: [1, 1], skill: 1, desc: 'Источник чистой воды.' });
  Bd('plot', 'Грядка', 'farm', 'obj', { wood: 2, grass: 2 }, 'hand', { desc: 'Сажайте семена и поливайте.' });
  Bd('scarecrow', 'Пугало', 'farm', 'obj', { stick: 4, cloth: 1, pumpkin: 1 }, 'workbench', { desc: 'Рядом с пугалом урожай растёт быстрее.' });
  Bd('table', 'Стол', 'decor', 'obj', { plank: 4 }, 'workbench');
  Bd('flowerpot', 'Цветочный горшок', 'decor', 'obj', { clay: 2, flower: 1 }, 'hand');
  Bd('banner', 'Знамя', 'decor', 'obj', { cloth: 2, stick: 2 }, 'workbench');
  Bd('rug', 'Ковёр', 'decor', 'obj', { cloth: 3 }, 'workbench', { rot: 1 });
  Bd('statue', 'Статуя', 'decor', 'obj', { limestone: 8, stone: 4 }, 'workbench', { skill: 2 });
  IT.torch.place = 'torch';

  /* ---------- РЕЦЕПТЫ ---------- */
  const R = G.RECIPES = [];
  G.RCATS = [['tools', 'Инструменты'], ['weapons', 'Оружие'], ['armor', 'Броня'], ['survival', 'Выживание'], ['build', 'Стройка'], ['materials', 'Материалы'], ['food', 'Еда']];
  G.STATIONS = { hand: 'Руками', workbench: 'Верстак', furnace: 'Печь', forge: 'Кузница', campfire: 'Костёр', kitchen: 'Котёл' };
  const Rc = (out, n, inp, st, cat, time, ex) => R.push(Object.assign({ out, n, in: inp, st, cat, time: time || 1 }, ex || {}));
  Rc('stone_axe', 1, { stick: 3, stone: 3 }, 'hand', 'tools', 1.5);
  Rc('stone_pick', 1, { stick: 3, stone: 4 }, 'hand', 'tools', 1.5);
  Rc('shovel', 1, { stick: 2, stone: 3, rope: 1 }, 'workbench', 'tools', 2);
  Rc('hammer', 1, { stick: 2, stone: 6, rope: 1 }, 'workbench', 'tools', 2);
  Rc('fishing_rod', 1, { stick: 3, rope: 2 }, 'workbench', 'tools', 2);
  Rc('watering_can', 1, { plank: 3, resin: 1 }, 'workbench', 'tools', 2);
  Rc('iron_axe', 1, { iron_ingot: 3, stick: 2 }, 'forge', 'tools', 4);
  Rc('iron_pick', 1, { iron_ingot: 3, stick: 2 }, 'forge', 'tools', 4);
  Rc('ancient_pick', 1, { alloy: 3, iron_ingot: 2, stick: 2 }, 'forge', 'tools', 6);
  Rc('wood_sword', 1, { stick: 2, wood: 3 }, 'hand', 'weapons', 1.5);
  Rc('stone_sword', 1, { stick: 2, stone: 6, rope: 1 }, 'workbench', 'weapons', 2);
  Rc('bow', 1, { stick: 3, wood: 2, rope: 2 }, 'workbench', 'weapons', 3);
  Rc('arrow', 6, { stick: 2, stone: 1, feather: 2 }, 'workbench', 'weapons', 1.5);
  Rc('staff', 1, { pink_wood: 4, crystal: 2, essence: 2 }, 'workbench', 'weapons', 4);
  Rc('iron_sword', 1, { iron_ingot: 4, leather: 1, stick: 1 }, 'forge', 'weapons', 5);
  Rc('dagger', 1, { iron_ingot: 2, leather: 1 }, 'forge', 'weapons', 3);
  Rc('ancient_blade', 1, { alloy: 4, iron_ingot: 2, golem_core: 1 }, 'forge', 'weapons', 8);
  Rc('crystal_staff', 1, { alloy: 2, pink_wood: 4, crystal: 6, essence: 4 }, 'forge', 'weapons', 8);
  Rc('cloth_shirt', 1, { cloth: 4 }, 'workbench', 'armor', 3);
  Rc('leather_armor', 1, { leather: 6, rope: 2 }, 'workbench', 'armor', 4);
  Rc('leather_cap', 1, { leather: 3 }, 'workbench', 'armor', 3);
  Rc('leather_boots', 1, { leather: 3, rope: 1 }, 'workbench', 'armor', 3);
  Rc('leather_gloves', 1, { leather: 2, fiber: 2 }, 'workbench', 'armor', 3);
  Rc('warm_coat', 1, { leather: 6, cloth: 4, feather: 6 }, 'workbench', 'armor', 5);
  Rc('fur_hat', 1, { leather: 3, feather: 4 }, 'workbench', 'armor', 3);
  Rc('fur_boots', 1, { leather: 4, cloth: 2 }, 'workbench', 'armor', 3);
  Rc('iron_armor', 1, { iron_ingot: 8, leather: 3 }, 'forge', 'armor', 6);
  Rc('iron_helmet', 1, { iron_ingot: 4, leather: 1 }, 'forge', 'armor', 4);
  Rc('iron_boots', 1, { iron_ingot: 3, leather: 2 }, 'forge', 'armor', 4);
  Rc('iron_gauntlets', 1, { iron_ingot: 3, leather: 1 }, 'forge', 'armor', 4);
  Rc('ancient_armor', 1, { alloy: 6, leather: 4, frost_heart: 1 }, 'forge', 'armor', 8);
  Rc('torch', 2, { stick: 2, grass: 2 }, 'hand', 'survival', 1);
  Rc('flask', 1, { leather: 2, fiber: 2 }, 'hand', 'survival', 2);
  Rc('backpack', 1, { leather: 4, cloth: 2, rope: 2 }, 'workbench', 'survival', 4);
  Rc('big_backpack', 1, { leather: 8, cloth: 4, copper_ingot: 2 }, 'forge', 'survival', 6);
  Rc('key', 1, { iron_ingot: 1, copper_ingot: 1 }, 'forge', 'survival', 3);
  for (const id of ['campfire', 'tent', 'chest', 'bed']) Rc(id, 1, B[id].cost, B[id].st, 'survival', 2);
  for (const id of G.BUILD_LIST) if (!['campfire', 'tent', 'chest', 'bed', 'torch'].includes(id)) Rc(id, 1, B[id].cost, B[id].st, 'build', 1.5, { skill: B[id].skill });
  Rc('rope', 1, { fiber: 3 }, 'hand', 'materials', 1);
  Rc('plank', 2, { wood: 1 }, 'workbench', 'materials', 1);
  Rc('plank', 2, { pine_wood: 1 }, 'workbench', 'materials', 1);
  Rc('cloth', 1, { fiber: 4 }, 'workbench', 'materials', 1.5);
  Rc('coal', 1, { wood: 3 }, 'furnace', 'materials', 4, { note: 'Древесный уголь' });
  Rc('brick', 2, { clay: 2, wood: 1 }, 'furnace', 'materials', 4);
  Rc('iron_ingot', 1, { iron_ore: 2, coal: 1 }, 'furnace', 'materials', 6);
  Rc('copper_ingot', 1, { copper_ore: 2, coal: 1 }, 'furnace', 'materials', 5);
  Rc('gold_ingot', 1, { gold_ore: 2, coal: 1 }, 'furnace', 'materials', 6);
  Rc('alloy', 1, { gold_ingot: 1, crystal: 2, gear: 1 }, 'forge', 'materials', 8);
  Rc('alloy', 2, { star_ore: 2, iron_ingot: 1, crystal: 1 }, 'forge', 'materials', 8, { note: 'Из звёздной руды' });
  Rc('cooked_meat', 1, { raw_meat: 1 }, 'campfire', 'food', 3);
  Rc('cooked_fish', 1, { raw_fish: 1 }, 'campfire', 'food', 3);
  Rc('baked_potato', 1, { potato: 1 }, 'campfire', 'food', 3);
  Rc('flatbread', 1, { wheat: 2 }, 'campfire', 'food', 3);
  Rc('flask_clean', 1, { flask_dirty: 1 }, 'campfire', 'food', 3, { note: 'Кипячение' });
  Rc('mushroom_soup', 1, { mushroom: 3, flask_clean: 1 }, 'kitchen', 'food', 5, { ret: { flask: 1 } });
  Rc('veg_stew', 1, { carrot: 1, potato: 1, cabbage: 1 }, 'kitchen', 'food', 6);
  Rc('berry_drink', 1, { berries: 4, flask_clean: 1 }, 'kitchen', 'food', 4, { ret: { flask: 1 } });
  Rc('herb_tea', 1, { herb: 2, flask_clean: 1 }, 'kitchen', 'food', 4, { ret: { flask: 1 } });
  Rc('bread', 1, { wheat: 3 }, 'kitchen', 'food', 6);
  Rc('pumpkin_pie', 1, { pumpkin: 1, wheat: 2, berries: 2 }, 'kitchen', 'food', 8);
  Rc('feast', 1, { cooked_meat: 2, veg_stew: 1, herb: 2 }, 'kitchen', 'food', 10);
  Rc('potion_heal', 1, { herb: 3, glow_mushroom: 1, berries: 2 }, 'kitchen', 'food', 6);
  Rc('potion_stam', 1, { herb: 2, glow_flower: 1, berries: 2 }, 'kitchen', 'food', 6);

  /* ---------- КУЛЬТУРЫ ---------- */
  G.CROPS = {
    carrot: { name: 'Морковь', time: 200, out: 'carrot', n: [2, 3] }, potato: { name: 'Картофель', time: 240, out: 'potato', n: [2, 4] },
    wheat: { name: 'Пшеница', time: 170, out: 'wheat', n: [2, 4] }, cabbage: { name: 'Капуста', time: 280, out: 'cabbage', n: [1, 2] },
    berry: { name: 'Ягоды', time: 220, out: 'berries', n: [3, 5] }, pumpkin: { name: 'Тыква', time: 360, out: 'pumpkin', n: [1, 2] },
    herb: { name: 'Лекарственные травы', time: 210, out: 'herb', n: [2, 3] }
  };

  /* ---------- ОБЪЕКТЫ МИРА ---------- */
  const O = G.OBJ = {};
  const Ob = (id, d) => { O[id] = Object.assign({ id }, d); };
  const TC = [5, 10, 6, 5];
  const tree = (id, n, s, drops, ex) => Ob(id, Object.assign({ n, s, solid: 1, col: TC, sh: 4, sway: 1, tree: 1, res: { tool: 'axe', hp: 5, drops, xp: 6, dead: 'stump', respawn: 720 } }, ex || {}));
  tree('oak', 'Дуб', ['oak0', 'oak1', 'oak2'], [['wood', 3, 5], ['stick', 0, 2], ['bark', 0, 1]]);
  tree('doak', 'Тёмный дуб', ['doak0', 'doak1', 'doak2'], [['wood', 4, 6], ['bark', 1, 2], ['resin', 0, 1]], { res: { tool: 'axe', hp: 6, drops: [['wood', 4, 6], ['bark', 1, 2], ['resin', 0, 1]], xp: 7, dead: 'stump', respawn: 720 } });
  tree('birch', 'Берёза', ['birch0', 'birch1', 'birch2'], [['wood', 2, 4], ['bark', 1, 2], ['stick', 0, 1]]);
  tree('pine', 'Сосна', ['pine0', 'pine1'], [['pine_wood', 3, 5], ['resin', 0, 2], ['stick', 0, 1]], { sh: 3 });
  tree('spine', 'Заснеженная сосна', ['spine0', 'spine1'], [['pine_wood', 3, 5], ['resin', 1, 2]], { sh: 3, res: { tool: 'axe', hp: 6, drops: [['pine_wood', 3, 5], ['resin', 1, 2]], xp: 8, dead: 'stump_s', respawn: 720 } });
  tree('pinkt', 'Розовое дерево', ['pinkt0', 'pinkt1', 'pinkt2'], [['pink_wood', 2, 4], ['flower', 0, 2]], { res: { tool: 'axe', hp: 7, drops: [['pink_wood', 2, 4], ['flower', 0, 2], ['stick', 0, 1]], xp: 10, dead: 'stump', respawn: 720 } });
  tree('crim', 'Малиновое дерево', ['crim0', 'crim1', 'crim2'], [], { res: { tool: 'axe', hp: 7, drops: [['pink_wood', 2, 3], ['resin', 0, 2], ['stick', 0, 2]], xp: 10, dead: 'stump', respawn: 720 } });
  tree('teal', 'Бирюзовое дерево', ['teal0', 'teal1', 'teal2'], [['wood', 3, 4], ['resin', 0, 1], ['stick', 0, 2]]);
  tree('tpine', 'Голубая ель', ['tpine0', 'tpine1'], [['pine_wood', 3, 5], ['resin', 0, 2]], { sh: 3 });
  tree('ppine', 'Малиновая ель', ['ppine0', 'ppine1'], [], { sh: 3, res: { tool: 'axe', hp: 7, drops: [['pink_wood', 2, 4], ['resin', 0, 2]], xp: 10, dead: 'stump', respawn: 720 } });
  tree('palm', 'Пальма', ['palm0', 'palm1'], [['wood', 2, 3], ['fiber', 1, 3]], { sh: 3 });
  tree('dead', 'Сухое дерево', ['dead0', 'dead1'], [], { sway: 0, sh: 2, res: { tool: 'axe', hp: 3, drops: [['stick', 2, 4], ['wood', 1, 2]], xp: 4, dead: 'stump', respawn: 900 } });
  const pk = (id, n, s, drops, ex) => Ob(id, Object.assign({ n, s, pick: { drops, xp: 2, respawn: 300 } }, ex || {}));
  Ob('bush', { n: 'Куст', s: ['bush0', 'bush1'], solid: 1, col: [3, 9, 10, 5], sh: 2 });
  Ob('pbush', { n: 'Розовый куст', s: ['pbush'], solid: 1, col: [3, 9, 10, 5], sh: 2 });
  Ob('sbush', { n: 'Заснеженный куст', s: ['sbush'], solid: 1, col: [3, 9, 10, 5], sh: 2 });
  pk('berry', 'Ягодный куст', ['berry1'], [['berries', 2, 4], ['seed_berry', 1, 1, .15]], { solid: 1, col: [3, 9, 10, 5], sh: 2, pick: { drops: [['berries', 2, 4], ['seed_berry', 1, 1, .15]], xp: 3, respawn: 420, dead: 'berry0' } });
  pk('pberry', 'Сияющая ягода', ['pberry1'], [], { solid: 1, col: [3, 9, 10, 5], sh: 2, pick: { drops: [['berries', 3, 5], ['glow_flower', 1, 1, .2]], xp: 4, respawn: 420, dead: 'pberry0' } });
  pk('dbush', 'Сухой куст', ['dbush'], [['stick', 1, 2], ['fiber', 0, 2]], { sh: 2 });
  pk('cactus', 'Кактус', ['cactus0', 'cactus1'], [['cactus', 1, 2], ['fiber', 0, 1]], { solid: 1, col: [5, 10, 6, 5], sh: 1, pick: { drops: [['cactus', 1, 2], ['fiber', 0, 1]], xp: 3, respawn: 500, keep: 1 } });
  const seeds = [['seed_carrot', 1, 1, .05], ['seed_wheat', 1, 1, .06], ['seed_potato', 1, 1, .04], ['seed_cabbage', 1, 1, .03], ['seed_pumpkin', 1, 1, .02]];
  pk('tgrass', 'Высокая трава', ['tgrass0', 'tgrass1'], [['grass', 1, 2], ['fiber', 0, 1]].concat(seeds), { anim: 2 });
  pk('pgrass', 'Розовая трава', ['pgrass0', 'pgrass1'], [['grass', 1, 2], ['fiber', 1, 1], ['seed_herb', 1, 1, .06]], { anim: 2 });
  pk('dgrass', 'Сухая трава', ['dgrass0', 'dgrass1'], [['grass', 1, 1], ['fiber', 1, 2]], { anim: 2 });
  pk('reed', 'Камыш', ['reed0', 'reed1'], [['fiber', 2, 3]], { anim: 2 });
  pk('flower', 'Цветы', ['flower0', 'flower1', 'flower2', 'flower3'], [['flower', 1, 1]]);
  pk('gflower', 'Светоцвет', ['gflower'], [['glow_flower', 1, 1]], { light: [28, '#58d6c4', .5], pick: { drops: [['glow_flower', 1, 1]], xp: 5, respawn: 600 } });
  pk('herbp', 'Лекарственная трава', ['herbp'], [['herb', 1, 2], ['seed_herb', 1, 1, .15]]);
  pk('fiberp', 'Дикий лён', ['fiberp'], [['fiber', 2, 4]]);
  pk('mush', 'Грибы', ['mush0', 'mush1'], [['mushroom', 1, 2]]);
  pk('gmush', 'Светящиеся грибы', ['gmush'], [['glow_mushroom', 1, 2]], { light: [26, '#3aa8f0', .55] });
  pk('stickg', 'Сухие ветки', ['stickg'], [['stick', 1, 2]], { pick: { drops: [['stick', 1, 2]], xp: 1, respawn: 360 } });
  pk('pebble', 'Камешки', ['pebble'], [['stone', 1, 2]], { pick: { drops: [['stone', 1, 2]], xp: 1, respawn: 480 } });
  pk('shell', 'Ракушка', ['shell'], [['limestone', 1, 1]]);
  pk('claypit', 'Глина', ['claypit'], [['clay', 2, 3]], { pick: { drops: [['clay', 2, 3]], xp: 3, respawn: 500 } });
  const RC = [2, 7, 12, 7];
  const rk = (id, n, s, drops, hp, tier, ex) => Ob(id, Object.assign({ n, s, solid: 1, col: RC, sh: 2, res: { tool: 'pick', hp, tier: tier || 1, drops, xp: 5 + (tier || 1) * 3, dead: 'rubble', respawn: 1100 } }, ex || {}));
  rk('rock', 'Валун', ['rock0', 'rock1'], [['stone', 3, 5]], 5);
  rk('bigrock', 'Большой валун', ['rock2'], [['stone', 6, 9], ['coal', 0, 1]], 8, 1, { sh: 3 });
  rk('granite', 'Гранит', ['granite0', 'granite1'], [['granite', 3, 5], ['stone', 1, 2]], 7);
  rk('lime', 'Известняк', ['lime0', 'lime1'], [['limestone', 3, 5], ['stone', 0, 1]], 5);
  rk('coalr', 'Угольная жила', ['coalr'], [['coal', 2, 4], ['stone', 1, 2]], 6);
  rk('copperr', 'Медная жила', ['copperr'], [['copper_ore', 2, 3], ['stone', 1, 2]], 7);
  rk('ironr', 'Железная жила', ['ironr'], [['iron_ore', 2, 3], ['granite', 0, 2]], 8);
  rk('goldr', 'Золотая жила', ['goldr'], [['gold_ore', 1, 3], ['stone', 1, 2]], 10, 2);
  rk('srock', 'Снежный валун', ['srock'], [['stone', 3, 5], ['ice_shard', 0, 1]], 6);
  rk('sironr', 'Железная жила', ['sironr'], [['iron_ore', 2, 4], ['stone', 1, 2]], 8);
  rk('sgoldr', 'Золотая жила', ['sgoldr'], [['gold_ore', 2, 3], ['stone', 1, 2]], 10, 2);
  rk('icer', 'Ледяная глыба', ['icer'], [['ice_shard', 2, 4]], 8, 2);
  rk('meteor', 'Метеорит', ['meteor'], [['star_ore', 2, 4], ['stone', 1, 3]], 12, 2, { light: [30, '#a583f5', .5], res: { tool: 'pick', hp: 12, tier: 2, drops: [['star_ore', 2, 4], ['stone', 1, 3]], xp: 30, respawn: 0 } });
  const cr = (id, s, c) => rk(id, 'Кристаллы', [s], [['crystal', 2, 3]], 8, 2, { light: [34, c, .6], col: [3, 9, 10, 6] });
  cr('cryst_g', 'cryst_g', '#3dd49a'); cr('cryst_p', 'cryst_p', '#e06af0'); cr('cryst_b', 'cryst_b', '#62b0f5');
  Ob('flog', { n: 'Упавшее бревно', s: ['flog0', 'flog1', 'flog2', 'flog3'], size: [2, 1], solid: 1, col: [3, 4, 26, 10], sh: 3, res: { tool: 'axe', hp: 3, drops: [['wood', 2, 3], ['bark', 1, 2], ['resin', 0, 1], ['mushroom', 0, 1, .3]], xp: 5, respawn: 0 } });
  Ob('spire', { n: 'Каменный столб', s: ['spire0', 'spire1'], solid: 1, col: [3, 8, 10, 7], sh: 2 });
  // руины
  const wl = (id, n, s, ex) => Ob(id, Object.assign({ n, s, solid: 1, col: [0, 0, 16, 16], wall: 1 }, ex || {}));
  wl('rwall', 'Древняя стена', ['rwall0', 'rwall1']); wl('lwall', 'Стена храма', ['lwall0', 'lwall1']);
  Ob('bwall', { n: 'Обломок стены', s: ['bwall0', 'bwall1'], solid: 1, col: [0, 4, 16, 12] });
  wl('cracked', 'Треснувшая стена', ['cracked'], { res: { tool: 'pick', alt: 'hammer', hp: 4, drops: [['stone', 2, 4]], xp: 15, respawn: 0 }, secret: 1 });
  wl('dcracked', 'Треснувшая стена', ['dcracked'], { res: { tool: 'pick', alt: 'hammer', hp: 4, drops: [['stone', 2, 4]], xp: 15, respawn: 0 }, secret: 1 });
  Ob('pillar', { n: 'Колонна', s: ['pillar'], solid: 1, col: [3, 8, 10, 7], sh: 1 });
  Ob('pillar_b', { n: 'Обломок колонны', s: ['pillar_b'], solid: 1, col: [3, 8, 10, 7], sh: 1 });
  Ob('dpillar', { n: 'Колонна', s: ['dpillar'], solid: 1, col: [3, 8, 10, 7], sh: 1 });
  Ob('arch', { n: 'Арка', s: ['arch'], size: [3, 1], solid: 1, cols: [[2, 8, 10, 7], [36, 8, 10, 7]] });
  Ob('rstatue', { n: 'Древняя статуя', s: ['statue'], solid: 1, col: [2, 8, 12, 7], sh: 2 });
  Ob('monument', { n: 'Обелиск', s: ['monument'], solid: 1, col: [3, 8, 10, 7], sh: 2, light: [36, '#7ef0ff', .5], act: 'lore', label: 'Читать' });
  Ob('shrine', { n: 'Святилище', s: ['shrine'], size: [2, 1], solid: 1, col: [2, 6, 28, 9], light: [40, '#e06af0', .5], act: 'shrine', label: 'Молиться' });
  Ob('rwell', { n: 'Древний колодец', s: ['well'], solid: 1, col: [1, 6, 14, 9], act: 'well', label: 'Колодец' });
  Ob('wchest', { n: 'Сундук', s: ['chest_c'], so: 'chest_o', solid: 1, col: [1, 7, 14, 8], act: 'chest', label: 'Открыть', loot: 't1' });
  Ob('achest', { n: 'Древний сундук', s: ['achest_c'], so: 'achest_o', solid: 1, col: [1, 7, 14, 8], act: 'chest', label: 'Открыть', loot: 't3', light: [22, '#ffd23e', .35] });
  const brk = (id, n, s, loot) => Ob(id, { n, s: [s], solid: 1, col: [2, 8, 12, 7], sh: 1, res: { tool: 'any', hp: 2, drops: [], loot, xp: 3, respawn: 0 } });
  brk('crate', 'Ящик', 'crate', 'crate'); brk('barrel', 'Бочка', 'barrel', 'crate'); brk('urn', 'Древняя ваза', 'urn', 'urn');
  Ob('tablet', { n: 'Каменная табличка', s: ['tablet'], solid: 1, col: [2, 9, 12, 6], act: 'lore', label: 'Читать' });
  Ob('stairs_d', { n: 'Спуск', s: ['stairs_d'], flat: 1, act: 'travel', label: 'Спуститься' });
  Ob('stairs_u', { n: 'Подъём', s: ['stairs_u'], flat: 1, act: 'travel', label: 'Подняться' });
  Ob('cave_r', { n: 'Вход в копи', s: ['cave_r'], size: [2, 2], solid: 1, col: [0, 6, 32, 20], act: 'travel', label: 'Войти' });
  Ob('cave_i', { n: 'Ледяная пещера', s: ['cave_i'], size: [2, 2], solid: 1, col: [0, 6, 32, 20], act: 'travel', label: 'Войти' });
  Ob('gate', { n: 'Решётка', s: ['gate_c'], so: 'gate_o', solid: 1, col: [0, 0, 16, 16], wall: 1, gate: 1 });
  Ob('ldoor', { n: 'Запертая дверь', s: ['ldoor_c'], so: 'ldoor_o', solid: 1, col: [0, 0, 16, 16], wall: 1, act: 'unlock', label: 'Отпереть' });
  Ob('lever', { n: 'Рычаг', s: ['lever0'], so: 'lever1', solid: 1, col: [3, 9, 10, 6], act: 'lever', label: 'Потянуть' });
  Ob('mech', { n: 'Древний механизм', s: ['mech'], solid: 1, col: [1, 8, 14, 8], act: 'mech', label: 'Починить' });
  Ob('spike', { n: 'Шипы', s: ['spike0'], flat: 1, trap: 1 });
  Ob('brazier', { n: 'Жаровня', s: ['brazier0'], so: 'brazier1', solid: 1, col: [4, 10, 8, 5], act: 'brazier', label: 'Зажечь' });
  Ob('bones', { n: 'Кости', s: ['bones'], flat: 1, pick: { drops: [['bone', 1, 2]], xp: 1, respawn: 0 } });
  Ob('altar', { n: 'Алтарь', s: ['altar'], solid: 1, col: [0, 6, 16, 10], light: [30, '#7ef0ff', .5], act: 'lore', label: 'Осмотреть' });
  Ob('hgate', { n: 'Врата Сердца', s: ['hgate_c'], so: 'hgate_o', size: [3, 2], solid: 1, col: [0, 8, 48, 24], act: 'hgate', label: 'Врата', light: [50, '#7ef0ff', .4] });
  Ob('wreck', { n: 'Обломки корабля', s: ['wreck'], size: [3, 1], solid: 1, col: [4, 4, 40, 11] });
  Ob('xmark', { n: 'Метка', s: ['xmark'], flat: 1, dig: 1 });
  Ob('flotsam', { n: 'Плавающий ящик', s: ['flotsam'], float: 1, pick: { drops: [], loot: 'flotsam', xp: 8, respawn: 0 }, label: 'Выловить' });
  Ob('bossmark', { n: '', s: [], flat: 1, hidden: 1 });
  // деревня
  Ob('house', { n: 'Дом', s: ['house0', 'house1', 'house2', 'house3'], size: [5, 3], oy: 13, solid: 1, col: [4, 0, 72, 46], big: 1 });
  Ob('hdoor', { n: 'Дверь дома', s: [], flat: 1, hidden: 1, act: 'travel', label: 'Войти' });
  Ob('exitmat', { n: 'Выход', s: ['rug'], flat: 1, act: 'travel', label: 'Выйти' });
  Ob('fireplace', { n: 'Камин', s: ['furnace1'], solid: 1, col: [0, 6, 16, 10], light: [70, '#ff9a3e', .9], warm: 1, station: 'campfire', act: 'station', label: 'Готовить' });
  Ob('mill', { n: 'Старая мельница', s: ['mill'], size: [3, 2], solid: 1, col: [6, 8, 36, 22], mill: 1 });
  Ob('hay', { n: 'Стог сена', s: ['hay'], solid: 1, col: [1, 8, 14, 7], sh: 2, pick: { drops: [['grass', 3, 5], ['seed_wheat', 1, 2, .5]], xp: 2, respawn: 900, keep: 1 } });
  Ob('cart', { n: 'Телега', s: ['cart'], size: [2, 1], solid: 1, col: [2, 6, 26, 9] });
  Ob('sign', { n: 'Указатель', s: ['sign'], solid: 1, col: [5, 11, 5, 4], act: 'sign', label: 'Читать' });
  Ob('lamp', { n: 'Фонарный столб', s: ['lamp'], solid: 1, col: [5, 11, 6, 4], light: [58, '#ffc23e', .8] });
  Ob('shelf', { n: 'Полка', s: ['shelf'], solid: 1, col: [0, 4, 16, 12], act: 'search', label: 'Обыскать', loot: 'shelf' });
  Ob('vtable', { n: 'Стол', s: ['table'], solid: 1, col: [0, 6, 16, 9] });
  // постройки игрока
  wl('wall_wood', 'Деревянная стена', ['wwall0', 'wwall1'], { hp: 60 }); wl('wall_stone', 'Каменная стена', ['swall0', 'swall1'], { hp: 160 });
  wl('win_wood', 'Окно', ['wwin'], { hp: 50 }); wl('win_stone', 'Окно', ['swin'], { hp: 130 });
  Ob('door', { n: 'Дверь', s: ['door_c'], solid: 1, col: [0, 0, 16, 16], wall: 1, act: 'door', label: 'Дверь', hp: 50 });
  Ob('fence', { n: 'Забор', s: ['fence0'], solid: 1, col: [0, 6, 16, 8], fence: 1, hp: 30 });
  Ob('fgate', { n: 'Ворота', s: ['fgate_c'], so: 'fgate_o', solid: 1, col: [0, 6, 16, 8], fence: 1, act: 'door', label: 'Ворота', hp: 30 });
  Ob('tower', { n: 'Сторожевая башня', s: ['tower'], size: [2, 2], solid: 1, col: [2, 14, 28, 16], act: 'tower', label: 'Осмотреться', hp: 150 });
  Ob('campfire', { n: 'Костёр', s: ['campfire'], solid: 1, col: [3, 8, 10, 6], station: 'campfire', act: 'station', label: 'Готовить', light: [80, '#ff9a3e', 1], fire: 1, warm: 1, hp: 40 });
  Ob('workbench', { n: 'Верстак', s: ['workbench'], solid: 1, col: [0, 6, 16, 9], station: 'workbench', act: 'station', label: 'Верстак', hp: 60 });
  Ob('furnace', { n: 'Печь', s: ['furnace0'], solid: 1, col: [0, 6, 16, 10], station: 'furnace', act: 'station', label: 'Печь', hp: 100, warm: 1 });
  Ob('forge', { n: 'Кузница', s: ['forge'], solid: 1, col: [0, 6, 16, 10], station: 'forge', act: 'station', label: 'Кузница', light: [34, '#ff8a24', .6], hp: 120, warm: 1 });
  Ob('kitchen', { n: 'Кухонный котёл', s: ['kitchen'], solid: 1, col: [1, 6, 14, 9], station: 'kitchen', act: 'station', label: 'Готовить', light: [26, '#ff9a3e', .5], hp: 60, warm: 1 });
  Ob('chest', { n: 'Сундук', s: ['chest_c'], so: 'chest_o', solid: 1, col: [1, 7, 14, 8], act: 'chest', label: 'Открыть', hp: 50 });
  Ob('bed', { n: 'Кровать', s: ['bed', 'bed2'], size: [1, 2], solid: 1, col: [1, 2, 14, 28], act: 'sleep', label: 'Спать', hp: 40 });
  Ob('tent', { n: 'Палатка', s: ['tent'], size: [2, 2], solid: 1, col: [3, 12, 26, 18], act: 'sleep', label: 'Спать', hp: 40 });
  Ob('torch', { n: 'Факел', s: ['torchp'], solid: 0, light: [64, '#ffb04a', .9], fire: 2, hp: 10 });
  Ob('lantern', { n: 'Фонарь', s: ['lantern'], solid: 1, col: [5, 11, 6, 4], light: [84, '#ffd88a', 1], hp: 30 });
  Ob('well', { n: 'Колодец', s: ['well'], solid: 1, col: [1, 6, 14, 9], act: 'well', label: 'Колодец', hp: 100 });
  Ob('plot', { n: 'Грядка', s: ['plot_d'], flat: 1, plot: 1, act: 'plot', label: 'Грядка', hp: 20 });
  Ob('scarecrow', { n: 'Пугало', s: ['scarecrow'], solid: 1, col: [5, 11, 6, 4], sh: 1, hp: 20 });
  Ob('table', { n: 'Стол', s: ['table'], solid: 1, col: [0, 6, 16, 9], hp: 30 });
  Ob('flowerpot', { n: 'Цветочный горшок', s: ['flowerpot'], solid: 1, col: [4, 10, 8, 5], hp: 10 });
  Ob('banner', { n: 'Знамя', s: ['banner'], solid: 1, col: [5, 12, 5, 3], hp: 10 });
  Ob('rug', { n: 'Ковёр', s: ['rug'], flat: 1, hp: 10 });
  Ob('statue', { n: 'Статуя', s: ['statue'], solid: 1, col: [2, 8, 12, 7], sh: 2, hp: 100 });

  /* ---------- ДОБЫЧА ИЗ СУНДУКОВ ---------- */
  G.LOOT = {
    crate: { n: [1, 2], l: [['stick', 1, 3, 4], ['rope', 1, 2, 3], ['cloth', 1, 2, 2], ['berries', 2, 4, 2], ['plank', 1, 3, 3], ['arrow', 2, 5, 2], ['coal', 1, 2, 2], ['seed_carrot', 1, 2, 1], ['seed_wheat', 1, 2, 1]] },
    urn: { n: [1, 2], l: [['bone', 1, 2, 3], ['crystal', 1, 1, 1], ['gear', 1, 1, 1], ['gold_ore', 1, 2, 1], ['coal', 1, 3, 3], ['key', 1, 1, .4], ['glow_mushroom', 1, 2, 2]] },
    shelf: { n: [1, 2], l: [['cloth', 1, 2, 3], ['rope', 1, 2, 3], ['bread', 1, 1, 2], ['seed_potato', 1, 3, 2], ['seed_cabbage', 1, 2, 2], ['seed_pumpkin', 1, 2, 1], ['resin', 1, 2, 2], ['torch', 1, 3, 3], ['leather', 1, 2, 2]] },
    flotsam: { n: [2, 3], l: [['plank', 2, 4, 4], ['rope', 1, 2, 3], ['cloth', 1, 2, 2], ['raw_fish', 1, 2, 2], ['copper_ingot', 1, 1, 1], ['arrow', 3, 6, 2], ['flask', 1, 1, 1]] },
    dig: { n: [1, 1], l: [['clay', 1, 2, 6], ['stone', 1, 2, 4], ['bone', 1, 1, 2], ['seed_potato', 1, 1, 1], ['copper_ore', 1, 1, 1], ['shellx', 0, 0, 0]] },
    treasure: { n: [4, 5], l: [['gold_ingot', 1, 2, 3], ['crystal', 2, 3, 3], ['iron_ingot', 2, 4, 3], ['potion_heal', 1, 2, 2], ['gear', 1, 2, 2], ['key', 1, 1, 2], ['arrow', 8, 14, 2]] },
    t1: { n: [3, 4], l: [['rope', 1, 3, 3], ['plank', 2, 5, 3], ['cloth', 1, 3, 3], ['coal', 2, 4, 2], ['copper_ore', 2, 4, 2], ['torch', 2, 4, 3], ['berries', 3, 6, 2], ['seed_carrot', 1, 3, 2], ['seed_wheat', 2, 3, 2], ['leather', 1, 3, 2], ['arrow', 4, 8, 2], ['key', 1, 1, 1]] },
    t2: { n: [4, 5], l: [['iron_ingot', 1, 3, 3], ['copper_ingot', 1, 3, 3], ['leather', 2, 4, 2], ['potion_heal', 1, 1, 2], ['crystal', 1, 2, 2], ['gear', 1, 1, 2], ['arrow', 6, 12, 2], ['bread', 1, 2, 2], ['key', 1, 1, 1.5], ['seed_pumpkin', 1, 2, 1], ['seed_cabbage', 1, 2, 1], ['gold_ore', 1, 3, 1]] },
    t3: { n: [4, 6], l: [['gold_ingot', 1, 2, 3], ['iron_ingot', 2, 4, 3], ['crystal', 2, 4, 3], ['gear', 1, 3, 3], ['potion_heal', 1, 2, 2], ['potion_stam', 1, 2, 2], ['essence', 1, 3, 2], ['star_ore', 1, 2, 1], ['alloy', 1, 1, 1]] },
    boss: { n: [5, 6], l: [['gold_ingot', 2, 3, 3], ['crystal', 3, 5, 3], ['gear', 2, 4, 3], ['potion_heal', 2, 3, 3], ['alloy', 1, 2, 2], ['star_ore', 1, 3, 2]] }
  };
  G.rollLoot = (tab, r) => {
    const t = G.LOOT[tab], out = [], rr = r || Math.random; if (!t) return out;
    const n = t.n[0] + Math.floor(rr() * (t.n[1] - t.n[0] + 1)); let tot = 0; for (const e of t.l) tot += e[3];
    for (let i = 0; i < n; i++) { let x = rr() * tot; for (const e of t.l) { x -= e[3]; if (x <= 0) { if (IT[e[0]]) out.push({ id: e[0], n: e[1] + Math.floor(rr() * (e[2] - e[1] + 1)) }); break; } } }
    return out;
  };

  /* ---------- СУЩЕСТВА ---------- */
  const M = G.MOBS = {};
  const Mb = (id, d) => { M[id] = Object.assign({ id, w: 16, h: 14, r: 5, sh: 1, xp: 5, detect: 70, atkR: 14, atkCd: 1.1, kb: 1 }, d); };
  Mb('rabbit', { n: 'Кролик', hp: 8, sp: 78, ai: 'flee', xp: 3, drops: [['raw_meat', 1, 1], ['leather', 1, 1, .35]], spr: 'rabbit', sh: 0, detect: 55 });
  Mb('deer', { n: 'Олень', hp: 24, sp: 92, ai: 'flee', xp: 8, drops: [['raw_meat', 2, 3], ['leather', 1, 2], ['bone', 0, 1]], spr: 'deer', w: 24, h: 22, r: 6, sh: 2, detect: 75 });
  Mb('fox', { n: 'Лиса', hp: 15, sp: 86, ai: 'flee', xp: 6, drops: [['raw_meat', 1, 1], ['leather', 1, 2]], spr: 'fox', w: 20, h: 14, sh: 1, detect: 60 });
  Mb('bird', { n: 'Птица', hp: 4, sp: 100, ai: 'flee', fly: 1, xp: 3, drops: [['feather', 1, 3], ['raw_meat', 0, 1]], spr: 'bird', w: 12, h: 10, r: 4, sh: 0, detect: 50 });
  Mb('imp', { n: 'Лесной бесёнок', hp: 18, dmg: 5, sp: 56, ai: 'aggro', xp: 10, drops: [['stick', 1, 2], ['fiber', 1, 2], ['berries', 0, 2], ['seed_carrot', 1, 1, .2]], spr: 'imp', w: 16, h: 16 });
  Mb('slime', { n: 'Слизень', hp: 24, dmg: 6, sp: 36, ai: 'aggro', hop: 1, xp: 9, drops: [['slime_gel', 1, 2]], spr: 'slime', pal: ['#2c7a3a', '#3fa84a', '#6fd66f', '#b4f5a0'] });
  Mb('pslime', { n: 'Розовый слизень', hp: 46, dmg: 11, sp: 42, ai: 'aggro', hop: 1, xp: 18, drops: [['slime_gel', 1, 3], ['glow_flower', 1, 1, .2]], spr: 'slime', pal: ['#9a2f7a', '#d0489a', '#f582b8', '#ffc6e0'] });
  Mb('islime', { n: 'Ледяной слизень', hp: 80, dmg: 17, sp: 40, ai: 'aggro', hop: 1, xp: 30, drops: [['slime_gel', 2, 3], ['ice_shard', 1, 2, .6]], spr: 'slime', pal: ['#2f6a9a', '#4c9ad0', '#8fd0f5', '#e0f8ff'] });
  Mb('spirit', { n: 'Лесной дух', hp: 44, dmg: 12, sp: 44, ai: 'ranged', fly: 1, xp: 24, drops: [['essence', 1, 2], ['glow_flower', 0, 1]], spr: 'spirit', w: 16, h: 20, detect: 100, atkR: 90, atkCd: 2.2, proj: 'magic' });
  Mb('golem', { n: 'Каменный голем', hp: 120, dmg: 21, sp: 30, ai: 'guard', xp: 45, drops: [['stone', 2, 4], ['granite', 1, 3], ['iron_ore', 1, 2], ['golem_core', 1, 1, .3]], spr: 'golem', w: 26, h: 26, r: 8, sh: 3, atkR: 20, atkCd: 1.6, kbRes: 1 });
  Mb('bat', { n: 'Пещерная мышь', hp: 14, dmg: 6, sp: 78, ai: 'aggro', fly: 1, erratic: 1, xp: 10, drops: [['leather', 1, 1, .4], ['bone', 1, 1, .3]], spr: 'bat', w: 16, h: 12, sh: 0 });
  Mb('crawler', { n: 'Пещерный ползун', hp: 38, dmg: 11, sp: 62, ai: 'aggro', xp: 20, drops: [['bone', 1, 2], ['fiber', 1, 2], ['glow_mushroom', 1, 1, .3]], spr: 'crawler', w: 20, h: 12 });
  Mb('skeleton', { n: 'Забытый воин', hp: 58, dmg: 14, sp: 50, ai: 'aggro', xp: 30, drops: [['bone', 2, 3], ['arrow', 2, 4, .5], ['key', 1, 1, .12], ['iron_ore', 1, 2, .4]], spr: 'skeleton', w: 16, h: 22, sh: 1 });
  Mb('guardian', { n: 'Древний страж', hp: 150, dmg: 23, sp: 46, ai: 'guard', xp: 60, drops: [['gear', 1, 2], ['crystal', 1, 2, .6], ['iron_ingot', 1, 2, .5]], spr: 'guardian', w: 22, h: 28, r: 7, sh: 2, atkR: 20, atkCd: 1.4, kbRes: .6 });
  Mb('wolf', { n: 'Морозный волк', hp: 62, dmg: 16, sp: 88, ai: 'aggro', xp: 34, drops: [['leather', 1, 3], ['raw_meat', 1, 2], ['bone', 0, 2]], spr: 'wolf', w: 24, h: 16, r: 6, sh: 2, detect: 95 });
  Mb('frost', { n: 'Ледяной элементаль', hp: 125, dmg: 22, sp: 40, ai: 'ranged', fly: 1, xp: 60, drops: [['ice_shard', 2, 4], ['frost_heart', 1, 1, .25], ['crystal', 1, 1, .4]], spr: 'frost', w: 20, h: 26, r: 6, sh: 2, detect: 110, atkR: 100, atkCd: 2, proj: 'ice' });
  Mb('shade', { n: 'Ночная тень', hp: 40, dmg: 12, sp: 60, ai: 'aggro', night: 1, xp: 22, drops: [['essence', 1, 1, .35], ['coal', 1, 2, .5]], spr: 'shade', w: 16, h: 22, detect: 100 });
  Mb('elder', { n: 'Старший дух', hp: 380, dmg: 18, sp: 50, ai: 'boss', boss: 'elder', fly: 1, xp: 250, drops: [['essence', 5, 7], ['glow_flower', 3, 5], ['crystal', 2, 4], ['pink_wood', 4, 6]], spr: 'spirit', scale: 2, w: 32, h: 40, r: 10, sh: 4, detect: 130, atkR: 110, atkCd: 1.6, proj: 'magic', kbRes: 1 });
  Mb('boss_guardian', { n: 'Страж Склепа', hp: 460, dmg: 24, sp: 52, ai: 'boss', boss: 'guardian', xp: 400, drops: [['sigil_forest', 1, 1], ['gear', 3, 5], ['iron_ingot', 3, 5], ['key', 1, 1]], spr: 'guardian', scale: 1.7, w: 38, h: 48, r: 12, sh: 5, detect: 150, atkR: 28, atkCd: 1.3, kbRes: 1 });
  Mb('boss_golem', { n: 'Каменный Колосс', hp: 980, dmg: 34, sp: 34, ai: 'boss', boss: 'golem', xp: 800, drops: [['sigil_stone', 1, 1], ['golem_core', 2, 3], ['gold_ingot', 2, 4], ['star_ore', 2, 3]], spr: 'golem', scale: 2, w: 52, h: 52, r: 16, sh: 5, detect: 160, atkR: 34, atkCd: 1.7, kbRes: 1 });
  Mb('boss_frost', { n: 'Владыка Стужи', hp: 1400, dmg: 38, sp: 46, ai: 'boss', boss: 'frost', fly: 1, xp: 1200, drops: [['sigil_frost', 1, 1], ['frost_heart', 2, 3], ['crystal', 4, 6], ['alloy', 1, 2]], spr: 'frost', scale: 2, w: 40, h: 52, r: 13, sh: 5, detect: 170, atkR: 120, atkCd: 1.5, proj: 'ice', kbRes: 1 });
  Mb('boss_heart', { n: 'Архонт Сердца', hp: 2200, dmg: 44, sp: 54, ai: 'boss', boss: 'heart', xp: 3000, drops: [['heart_shard', 1, 1], ['alloy', 3, 5], ['gold_ingot', 4, 6]], spr: 'guardian', pal: 1, scale: 2.2, w: 48, h: 62, r: 15, sh: 5, detect: 190, atkR: 32, atkCd: 1.2, proj: 'magic', kbRes: 1 });

  /* ---------- БИОМЫ ---------- */
  G.BIOMES = [
    { id: 'ocean', n: 'Море', c: '#2e7fc0', temp: 50 },
    { id: 'green', n: 'Зелёный остров', c: '#56aa52', temp: 52, tier: 1, mobs: [['slime', 5], ['imp', 4]], animals: [['rabbit', 5], ['deer', 3], ['fox', 2], ['bird', 4]], music: 0, desc: 'Тихие луга и песчаные пляжи.' },
    { id: 'pink', n: 'Розовый зачарованный лес', c: '#f08fb4', temp: 54, tier: 3, mobs: [['pslime', 4], ['spirit', 4], ['imp', 1]], animals: [['rabbit', 3], ['deer', 3], ['bird', 4]], music: 1, desc: 'Бирюзовые реки и светящиеся цветы.' },
    { id: 'canyon', n: 'Красный каньон', c: '#cf7c4c', temp: 72, tier: 4, mobs: [['golem', 3], ['crawler', 5], ['bat', 2]], animals: [['fox', 2], ['bird', 2]], music: 2, desc: 'Раскалённые скалы и узкие проходы.' },
    { id: 'village', n: 'Лесная деревня', c: '#3a8450', temp: 48, tier: 2, mobs: [['imp', 5], ['slime', 3], ['skeleton', 1]], animals: [['rabbit', 3], ['deer', 4], ['fox', 3], ['bird', 3]], music: 3, desc: 'Покинутые дома под сенью старого леса.' },
    { id: 'north', n: 'Северные земли', c: '#e4eef8', temp: 8, tier: 5, mobs: [['wolf', 5], ['islime', 3], ['frost', 2]], animals: [['rabbit', 2], ['deer', 2], ['fox', 2]], music: 4, desc: 'Вечный снег и ледяные озёра.' },
    { id: 'dungeon', n: 'Заброшенные подземелья', c: '#3d4156', temp: 40, tier: 3, mobs: [], animals: [], music: 5, desc: '' }
  ];
  G.DUNGEONS = {
    crypt: { n: 'Забытый склеп', theme: '', water: 'dw', size: [64, 52], rooms: 9, mobs: [['bat', 4], ['skeleton', 3], ['crawler', 2], ['slime', 2]], boss: 'boss_guardian', tier: 1, cry: 'cryst_g', temp: 40, loot: 't2' },
    mines: { n: 'Каньонные копи', theme: '_r', water: 'can', size: [76, 60], rooms: 11, mobs: [['crawler', 4], ['bat', 3], ['skeleton', 3], ['golem', 1]], boss: 'boss_golem', tier: 2, cry: 'cryst_p', temp: 55, loot: 't2', ores: ['ironr', 'goldr', 'coalr', 'copperr'] },
    ice: { n: 'Ледяные пещеры', theme: '_i', water: 'cold', size: [80, 64], rooms: 12, mobs: [['islime', 3], ['bat', 2], ['skeleton', 3], ['frost', 2]], boss: 'boss_frost', tier: 3, cry: 'cryst_b', temp: 12, loot: 't3', ores: ['icer', 'sgoldr', 'sironr'] },
    heart: { n: 'Сердце острова', theme: '_h', water: 'tq', size: [70, 70], rooms: 10, mobs: [['guardian', 3], ['skeleton', 3], ['spirit', 2], ['frost', 1]], boss: 'boss_heart', tier: 4, cry: 'cryst_p', temp: 45, loot: 't3' }
  };

  /* ---------- НАВЫКИ ---------- */
  G.SKILLS = [
    { id: 'surv', n: 'Выживание', c: '#5cb055', l: [
      { id: 'hunger', n: 'Крепкий желудок', d: 'Голод расходуется на 12% медленнее', max: 3 },
      { id: 'thirst', n: 'Верблюжья выдержка', d: 'Жажда расходуется на 12% медленнее', max: 3 },
      { id: 'stamina', n: 'Второе дыхание', d: 'Выносливость восстанавливается на 20% быстрее', max: 3 },
      { id: 'warm', n: 'Закалка', d: 'Холод и жара действуют на 15% слабее', max: 2 }] },
    { id: 'gath', n: 'Собирательство', c: '#ecb92e', l: [
      { id: 'yield', n: 'Щедрая добыча', d: '+20% шанс получить дополнительный ресурс', max: 3 },
      { id: 'speed', n: 'Сильные руки', d: '+25% к силе удара инструментом', max: 3 },
      { id: 'rare', n: 'Зоркий глаз', d: '+4% шанс найти редкий материал при добыче', max: 3 },
      { id: 'dur', n: 'Бережливость', d: 'Инструменты изнашиваются на 20% медленнее', max: 2 }] },
    { id: 'comb', n: 'Бой', c: '#e5541f', l: [
      { id: 'dmg', n: 'Сила удара', d: '+10% урона', max: 3 },
      { id: 'hp', n: 'Живучесть', d: '+20 к максимальному здоровью', max: 3 },
      { id: 'dodge', n: 'Ловкость', d: 'Уклонение стоит на 20% меньше выносливости и длится дольше', max: 2 },
      { id: 'crit', n: 'Точный удар', d: '+6% шанс критического удара', max: 3 }] },
    { id: 'bld', n: 'Строительство', c: '#62b0f5', l: [
      { id: 'cost', n: 'Экономный мастер', d: 'Постройки из материалов на 12% дешевле', max: 3 },
      { id: 'sturdy', n: 'Надёжная кладка', d: '+40% прочности построек', max: 2 },
      { id: 'unlock', n: 'Новые конструкции', d: '1: черепица, колодец, фонарь. 2: башня и статуя', max: 2 }] }
  ];

  /* ---------- ЗАПИСКИ ДРЕВНИХ ---------- */
  G.LORE = [
    ['Табличка у берега', 'Путник! Если море принесло тебя сюда — значит, Сердце ещё зовёт. Остров не отпускает тех, кто ему нужен.'],
    ['Летопись Хранителей I', 'Мы, Хранители, нашли в глубине острова живой кристалл. Он согревал землю и растил лес быстрее, чем мы успевали рубить.'],
    ['Летопись Хранителей II', 'Из света Сердца мы выковали стражей — без плоти и сна. Они должны были оберегать нас. Теперь они оберегают лишь камни.'],
    ['Летопись Хранителей III', 'Сердце треснуло, когда мы потребовали слишком много. Лес на востоке порозовел за одну ночь, а на севере выпал снег, который не тает.'],
    ['Надпись на обелиске', 'Три печати — Лес, Камень и Лёд — запирают Врата. Ни одна не должна покинуть свой склеп, пока Сердце не утихнет.'],
    ['Записка мельника', 'Стражи перестали нас узнавать. Уходим к морю затемно. Семена оставляю на полке — может, кому-то пригодятся.'],
    ['Дневник рудокопа', 'В копях каньона проснулся Колосс. Мы обвалили штрек, но слышим, как он ворочается за стеной. Рычаг у озера открывает кладовую.'],
    ['Ледяная стела', 'Владыка Стужи был первым из нас, кто коснулся трещины. Холод сохранил его — и его гнев.'],
    ['Слова на Вратах', 'Тот, кто принесёт три печати, войдёт. Тот, кто утешит Сердце, станет новым Хранителем.'],
    ['Молитва духов', 'Мы были лесом до людей и останемся лесом после. Зажги четыре огня — и мы откроем тебе свой тайник.'],
    ['Указ коменданта', 'Крепость не сдавать. Ключ от арсенала — у старшего стража. Если читаешь это — стражи уже не слушают приказов.'],
    ['Последняя запись', 'Сердце не зло. Оно одиноко. Не разбей его — выслушай.']
  ];

  /* ---------- ЗАДАНИЯ ---------- */
  /* цель: {t:тип, id, n, txt}. типы: move, have, gather, craft, build, kill, biome, poi, lore, use, sleep, eat, boss, equip, open */
  G.QUESTS = [
    { id: 's1', story: 1, n: 'Пробуждение', d: 'Вы очнулись на берегу незнакомого острова. Осмотритесь.', goals: [{ t: 'move', n: 25, txt: 'Пройдитесь по берегу (WASD)' }], hint: 'Ходите клавишами WASD, с Shift — бегом. Мышью выбирайте направление взгляда.', rew: { xp: 10 } },
    { id: 's2', story: 1, n: 'Что есть под рукой', d: 'Без инструментов долго не протянуть. Соберите ветки и камни.', goals: [{ t: 'gather', id: 'stick', n: 4, txt: 'Собрать сухие ветки' }, { t: 'gather', id: 'stone', n: 4, txt: 'Собрать камни' }], hint: 'Подойдите к веткам или камешкам на земле и нажмите E.', rew: { xp: 15 } },
    { id: 's3', story: 1, n: 'Первый инструмент', d: 'Свяжите камень с палкой — получится топор.', goals: [{ t: 'craft', id: 'stone_axe', n: 1, txt: 'Создать каменный топор' }], hint: 'Откройте меню крафта (клавиша C) и создайте каменный топор.', rew: { xp: 20 } },
    { id: 's4', story: 1, n: 'Лесоруб', d: 'Топор готов. Пора добыть древесину.', goals: [{ t: 'gather', id: 'wood', n: 6, txt: 'Добыть древесину' }], hint: 'Выберите топор клавишей с цифрой, наведите курсор на дерево и бейте ЛКМ. Упавшие брёвна подберутся сами.', rew: { xp: 25 } },
    { id: 's5', story: 1, n: 'Огонь', d: 'Ночью на острове холодно и опасно. Нужен костёр.', goals: [{ t: 'build', id: 'campfire', n: 1, txt: 'Построить костёр' }], hint: 'Откройте режим строительства (клавиша B), выберите «Костёр» и поставьте его ЛКМ.', rew: { xp: 30 } },
    { id: 's6', story: 1, n: 'Горячий ужин', d: 'Сырое мясо вредно. Добудьте еду и приготовьте её на костре.', goals: [{ t: 'craft', id: '@food', n: 1, txt: 'Приготовить еду на костре' }], hint: 'Охотьтесь на кроликов или ловите рыбу, затем подойдите к костру и нажмите E. Ягоды можно есть сырыми.', rew: { xp: 30, items: { berries: 6 } } },
    { id: 's7', story: 1, n: 'Каменная кирка', d: 'Валуны скрывают камень, уголь и руду.', goals: [{ t: 'craft', id: 'stone_pick', n: 1, txt: 'Создать каменную кирку' }, { t: 'gather', id: 'stone', n: 10, txt: 'Добыть камень киркой' }], hint: 'Кирка разбивает валуны и рудные жилы.', rew: { xp: 35 } },
    { id: 's8', story: 1, n: 'Крыша над головой', d: 'Поставьте убежище, где можно переждать ночь.', goals: [{ t: 'build', id: '@shelter', n: 1, txt: 'Поставить палатку или кровать' }], hint: 'Палатка делается из веток, волокна и травы. Во сне восстанавливается здоровье, а ночь проходит быстрее.', rew: { xp: 40, items: { torch: 3 } } },
    { id: 's9', story: 1, n: 'Порядок в сумке', d: 'Разберитесь с инвентарём и наденьте что-нибудь полезное.', goals: [{ t: 'open', id: 'inv', n: 1, txt: 'Открыть инвентарь' }, { t: 'build', id: 'workbench', n: 1, txt: 'Построить верстак' }], hint: 'В инвентаре предметы можно перетаскивать, делить и надевать. Верстак открывает новые рецепты.', rew: { xp: 40, items: { rope: 2 } } },
    { id: 's10', story: 1, n: 'Древние камни', d: 'На острове кто-то жил до вас. Найдите руины и прочтите табличку.', goals: [{ t: 'lore', n: 1, txt: 'Прочесть древнюю табличку' }], hint: 'Руины отмечаются на карте, когда вы подходите близко. Ищите каменные стены и колонны.', rew: { xp: 60 } },
    { id: 's11', story: 1, n: 'Лесная деревня', d: 'К северу, за рекой, виднеются крыши. Узнайте, что случилось с жителями.', goals: [{ t: 'biome', id: 'village', n: 1, txt: 'Найти Лесную деревню' }, { t: 'poi', id: 'village', n: 1, txt: 'Дойти до центра деревни' }], hint: 'Идите на север по старой дороге.', rew: { xp: 80, items: { bread: 2 } } },
    { id: 's12', story: 1, n: 'Жар и металл', d: 'В деревне осталась мастерская. Научитесь плавить руду.', goals: [{ t: 'build', id: 'furnace', n: 1, txt: 'Построить печь' }, { t: 'craft', id: 'iron_ingot', n: 2, txt: 'Выплавить железные слитки' }], hint: 'Железная руда встречается в тёмном лесу и каньоне. Для плавки нужен уголь — его можно выжечь из древесины.', rew: { xp: 100 } },
    { id: 's13', story: 1, n: 'Кузнец', d: 'Железо меняет всё.', goals: [{ t: 'build', id: 'forge', n: 1, txt: 'Построить кузницу' }, { t: 'craft', id: '@ironweapon', n: 1, txt: 'Выковать железное оружие' }], hint: 'Кузнице нужны слитки и кирпич. Кирпич обжигается из глины в печи.', rew: { xp: 120 } },
    { id: 's14', story: 1, n: 'Печать Леса', d: 'Под руинами к востоку от берега скрыт Забытый склеп. Его страж хранит первую печать.', goals: [{ t: 'poi', id: 'crypt', n: 1, txt: 'Найти Забытый склеп' }, { t: 'kill', id: 'boss_guardian', n: 1, txt: 'Победить Стража Склепа' }], hint: 'В подземельях темно: возьмите факелы, еду и зелья. Запертые двери открываются ключами.', rew: { xp: 300, items: { potion_heal: 2 } } },
    { id: 's15', story: 1, n: 'Зачарованный лес', d: 'На востоке лес розовеет. Летописи говорят, что там живут духи.', goals: [{ t: 'biome', id: 'pink', n: 1, txt: 'Войти в Розовый лес' }, { t: 'kill', id: 'elder', n: 1, txt: 'Усмирить Старшего духа' }], hint: 'Святилище духов находится в глубине леса. Зажгите четыре жаровни, чтобы открыть тайник.', rew: { xp: 350 } },
    { id: 's16', story: 1, n: 'Печать Камня', d: 'В копях Красного каньона ворочается Колосс.', goals: [{ t: 'biome', id: 'canyon', n: 1, txt: 'Добраться до Красного каньона' }, { t: 'kill', id: 'boss_golem', n: 1, txt: 'Победить Каменного Колосса' }], hint: 'В каньоне жарко — жажда растёт быстрее. Берите фляги.', rew: { xp: 600, items: { potion_heal: 3 } } },
    { id: 's17', story: 1, n: 'Печать Льда', d: 'Последняя печать — в Северных землях, у Владыки Стужи.', goals: [{ t: 'biome', id: 'north', n: 1, txt: 'Подняться в Северные земли' }, { t: 'kill', id: 'boss_frost', n: 1, txt: 'Победить Владыку Стужи' }], hint: 'Без тёплой одежды на севере не выжить. Костры и чай согревают.', rew: { xp: 900 } },
    { id: 's18', story: 1, n: 'Сердце острова', d: 'Три печати собраны. Врата Сердца ждут в центре острова.', goals: [{ t: 'kill', id: 'boss_heart', n: 1, txt: 'Войти во Врата и успокоить Сердце' }], hint: 'Врата стоят на островке посреди озера, севернее деревни.', rew: { xp: 2000 } },
    // побочные
    { id: 'q_fish', n: 'Рыбак', d: 'Море кормит терпеливых.', goals: [{ t: 'craft', id: 'fishing_rod', n: 1, txt: 'Сделать удочку' }, { t: 'gather', id: 'raw_fish', n: 3, txt: 'Поймать рыбу' }], rew: { xp: 60, items: { rope: 3 } }, after: 's5' },
    { id: 'q_farm', n: 'Свой огород', d: 'Охота ненадёжна. Вырастите урожай.', goals: [{ t: 'build', id: 'plot', n: 3, txt: 'Вскопать грядки' }, { t: 'use', id: 'harvest', n: 3, txt: 'Собрать урожай' }], rew: { xp: 90, items: { seed_pumpkin: 2, seed_cabbage: 2 } }, after: 's8' },
    { id: 'q_hunt', n: 'Гроза слизней', d: 'Слизни портят лес.', goals: [{ t: 'kill', id: 'slime', n: 6, txt: 'Победить слизней' }], rew: { xp: 70, items: { leather: 3 } }, after: 's4' },
    { id: 'q_home', n: 'Настоящий дом', d: 'Постройте дом со стенами, дверью и крышей.', goals: [{ t: 'build', id: '@wall', n: 8, txt: 'Поставить стены' }, { t: 'build', id: 'door', n: 1, txt: 'Поставить дверь' }, { t: 'build', id: '@roof', n: 4, txt: 'Настелить крышу' }, { t: 'build', id: 'chest', n: 1, txt: 'Поставить сундук' }], rew: { xp: 150, items: { banner: 1 } }, after: 's9' },
    { id: 'q_bow', n: 'Меткий стрелок', d: 'Лук достаёт туда, куда не дотянется меч.', goals: [{ t: 'craft', id: 'bow', n: 1, txt: 'Сделать лук' }, { t: 'kill', id: 'bird', n: 2, txt: 'Подстрелить птиц' }], rew: { xp: 80, items: { arrow: 12 } }, after: 's9' },
    { id: 'q_treasure', n: 'Клад', d: 'Говорят, на острове зарыты сокровища. Ищите красные метки.', goals: [{ t: 'use', id: 'treasure', n: 1, txt: 'Выкопать клад лопатой' }], rew: { xp: 120 }, after: 's9' },
    { id: 'q_cook', n: 'Повар', d: 'Котёл превращает простые продукты в пир.', goals: [{ t: 'build', id: 'kitchen', n: 1, txt: 'Построить кухонный котёл' }, { t: 'craft', id: 'veg_stew', n: 1, txt: 'Сварить овощное рагу' }], rew: { xp: 110, items: { seed_potato: 3 } }, after: 'q_farm' },
    { id: 'q_lore', n: 'Летописец', d: 'Соберите записи Хранителей.', goals: [{ t: 'lore', n: 8, txt: 'Прочесть разные записи' }], rew: { xp: 300, items: { crystal: 4 } }, after: 's10' },
    { id: 'q_star', n: 'Упавшая звезда', d: 'Иногда по ночам с неба падают камни.', goals: [{ t: 'gather', id: 'star_ore', n: 2, txt: 'Добыть звёздную руду' }], rew: { xp: 200 }, after: 's13' },
    { id: 'q_warm', n: 'Сборы на север', d: 'Подготовьтесь к морозам.', goals: [{ t: 'craft', id: 'warm_coat', n: 1, txt: 'Сшить тёплую одежду' }, { t: 'craft', id: 'herb_tea', n: 2, txt: 'Заварить травяной чай' }], rew: { xp: 150, items: { fur_hat: 1 } }, after: 's13' },
    { id: 'q_explore', n: 'Картограф', d: 'Нанесите на карту весь остров.', goals: [{ t: 'biome', id: '@all', n: 5, txt: 'Открыть все биомы' }], rew: { xp: 400, items: { gold_ingot: 2 } }, after: 's10' }
  ];
  G.QGROUPS = {
    '@food': ['cooked_meat', 'cooked_fish', 'baked_potato', 'flatbread'], '@shelter': ['tent', 'bed'], '@ironweapon': ['iron_sword', 'dagger'],
    '@wall': ['wall_wood', 'wall_stone', 'win_wood', 'win_stone'], '@roof': ['roof_wood', 'roof_stone']
  };
})();
