'use strict';
/* Главный герой: пиксельные карты, извлечённые из рисунка автора (4 направления). Анимации строятся из них. */
(() => {
  const A = G.Art, P = A.P, dark = A.dark, lite = A.lite;
  const PAL = {"O": "#0d0b1a", "H": "#f0c549", "h": "#e9b63e", "d": "#be7827", "D": "#a35a1f", "s": "#f0b295", "S": "#be796b", "w": "#fbf9f6", "r": "#ad3335", "R": "#d0504a", "q": "#792435", "b": "#693627", "g": "#f0b830", "p": "#475f96", "P": "#454567", "f": "#552c26"};
  const MAPS = {
 "down": [
  ".......OOOOOOO......",
  ".....OODHHHHHDOO....",
  "....ODHHhHhhhHhDO...",
  "...OHhHhhhhhhhhHDO..",
  "..ODhHHhhhhhhhhhhDO.",
  ".OOHhhhhhhhhhhhhhHO.",
  "OODhhhhhhhhhhhhhhhDO",
  "OhhhhDhhhhhhhhhhDhDO",
  ".OhhDHhhhDhhhDDhhDDO",
  "OOODhhhhDHhhDODhDDOO",
  "OOhhhhhOOhhOOSODDOsO",
  "OHhhhDOSOOOSSSSObSSO",
  ".OOOOOOOSSSSOOSODSO.",
  "..ODOSwOSSSSOwSOhO..",
  "..ODOswOssssOwsODO..",
  "...OOSssssssssSOO...",
  "....OOSssssssSOO....",
  ".....OOqqSSqqOO.....",
  ".....OrrrqqrrrO.....",
  "....OrfqrrrrqfrO....",
  "...OsSObbhdbbOSsO...",
  "...OssOrrrrrqOssO...",
  "....OOOppOOppOOO....",
  "......ObfOObbO......",
  "......OOO..OOO......"
 ],
 "up": [
  "......OOOOOO........",
  "....OODHHHhDOO......",
  "...ODHHHHHhHHDO.....",
  "..ODHhhhhhhhhhHO....",
  ".ODhhHhhhhhhhhhDO...",
  ".OhhhhhhhhhhhhhhOO..",
  "ODhhhhhhhhhhhhhhhOOO",
  "ODhDHhhhhhhhhhhhhHhO",
  "ODDDhhhhhhhhhhhDhhO.",
  "ODDDDhhhhhhhhhDDDOOO",
  "ODODDDDhhhhhDDDDDbDO",
  ".OODDDDDDDDDDDDDDDO.",
  ".ODODDDDDDDDDDDDOO..",
  "..OODDDDDDDDDDDDO...",
  "...ODDDDDDDDDDDO....",
  "....ODDDDDDDDDOO....",
  "....OOOODDDDOOO.....",
  ".....OOqOOOOqO......",
  ".....OrqqqqqqqO.....",
  "....OrOqrrrrqOqO....",
  "...OsSObbbbbbOSSO...",
  "...OssOrrrrrqOSSO...",
  "....OOOppOOppOOO....",
  "......ObbOObbO......",
  "......OOO..OOO......"
 ],
 "left": [
  ".......OOOOOOO......",
  "......ODHhhHHDOO....",
  ".....bhHhhhhhHhDO...",
  "....SHhhhhhhhhhHDO..",
  "...fhhhhhhhhhhhhhDO.",
  "..ODhhhhhhhhhhhhhHO.",
  "OObHhhhhhhhhhhhhhhDO",
  "fhhhdhhhhhhhDhhhDhDO",
  ".fHdhhhhhhhDhhhhDDDO",
  "OOfdhhhDhhDOHhhDDDDO",
  "fhhhhhOhhOOODhhOOODO",
  ".bhhdfOOOSSSODbssOO.",
  "..OOOPSOOOSSODDSODO.",
  "....OPSSOwSsOhDOOO..",
  "....OSssOwsssODDO...",
  "....SssssssssODO....",
  ".....sssssssSOOO....",
  "......OOOSSqqOO.....",
  ".......OqqrrrrO.....",
  "......OOrrrrqrrO....",
  "......ObrrrqOrrO....",
  "......ObgdbbOssO....",
  ".......OrrqqOssO....",
  ".......OqqfPPPb.....",
  ".......OPPOppO......",
  ".......OffOPPO......",
  ".......OOOObbO......",
  "...........OOO......"
 ],
 "right": [
  "......OOOOOO........",
  "....OODHhHHHOO......",
  "...ODhhhhhhhhDO.....",
  "..ODHhhhhhhhhhhO....",
  ".ODhhhhhhhhhhhhDO...",
  ".OhhhhhhhhhhhhhhOO..",
  "ODhhhhhhhhhhhhhhHOOO",
  "ODhDhhhDhhhhhhDHhhHO",
  "ODDDhhhhDhhhhhHDhHO.",
  "ODDDDhhhODhhDHHhDOOO",
  "ODOOOhhDOOOhhOhhhhhO",
  ".OOssbDOSSSOOODhhhO.",
  ".ODOSDDOSSOOSSOOOO..",
  "..OOODhOsSwOSSOO....",
  "...ODDOssswOssOO....",
  "....ODOssssssssO....",
  "....OOOSssssssO.....",
  ".....OOqqSSOOO......",
  ".....OrrrrqqO.......",
  "....OrrqrrrrOO......",
  "....OrrOqrrrbO......",
  "....OssObbdgbO......",
  "....OssOqqrDO.......",
  ".....bbPPfqqO.......",
  "......OppOPPO.......",
  "......OPPOffO.......",
  "......ObbOOOO.......",
  "......OOO..........."
 ]
};

  const SHIRT = 'rRq', HAIR = 'HhdD', SKIN = 'sS';
  const VIEW = ['down', 'up', 'left', 'right'];
  /* граница ног: первая строка, где начинаются штаны/обувь */
  const legTop = {}; for (const k in MAPS) { const m = MAPS[k]; let y = m.length - 1; for (let i = 0; i < m.length; i++) if (/[pP]/.test(m[i])) { y = i; break; } legTop[k] = y; }
  const cache = {};
  /* d: 0 вниз, 1 вверх, 2 влево, 3 вправо; leg 0..3 — фаза шага; arm: 0 покой, 1/2 мах, 3 руки вверх, 4 вперёд, 5 присел */
  A.charFrame = (look, d, leg, arm, bob, crouch) => {
    const key = look.k + '|' + d + leg + arm + bob + crouch; let cv = cache[key]; if (cv) return cv;
    const name = VIEW[d], map = MAPS[name], h = map.length, w = map[0].length, lt = legTop[name], side = d >= 2;
    const pal = Object.assign({}, PAL);
    if (look.body) { pal.r = look.body; pal.R = lite(look.body, .25); pal.q = dark(look.body, .35); }
    if (look.boots) { pal.f = look.boots; pal.P = dark(look.boots, .2); }
    const p = P(24, 30), ox = 2 + ((20 - w) >> 1), oy = 28 - h;
    const by = (bob ? 1 : 0) + (crouch ? 1 : 0);
    for (let y = 0; y < h; y++) {
      const row = map[y];
      for (let x = 0; x < w; x++) {
        let ch = row[x]; if (ch === '.') continue;
        let c = pal[ch];
        /* перчатки: кожа рук по краям туловища */
        if (look.gloves && SKIN.includes(ch) && y > lt - 6 && y < lt + 2 && (x < 6 || x > w - 7)) c = ch === 's' ? look.gloves : dark(look.gloves, .3);
        /* шлем вместо верхней части причёски */
        if (look.helm && HAIR.includes(ch) && y < 9) c = y < 3 ? lite(look.helm, .3) : y > 6 ? dark(look.helm, .3) : look.helm;
        let dx = 0, dy = 0;
        if (y >= lt) {
          /* шаг: поднимаем одну ногу (спереди/сзади) или разводим ноги (сбоку) */
          if (!side) { const left = x < w / 2; if ((leg === 1 && left) || (leg === 3 && !left)) dy = -1; }
          else if (y >= h - 3) { const front = d === 3 ? x >= w / 2 - 1 : x < w / 2 + 1; if (leg === 1) dx = front ? 1 : -1; if (leg === 3) dx = front ? -1 : 1; }
          if (crouch) dy -= 1;
        } else dy = by;
        p.d(ox + x + dx, oy + y + dy, c);
      }
    }
    /* руки вверх (замах) — две ладони у плеч */
    const hand = look.gloves || PAL.s;
    if (arm === 3) { const xs = side ? [ox + w / 2] : [ox + 2, ox + w - 4]; for (const hx of xs) { p.r(hx - 1, oy + lt - 9 + by, 4, 4, PAL.O); p.r(hx, oy + lt - 8 + by, 2, 2, hand); } }
    if (arm === 4 && side) { const hx = d === 3 ? ox + w - 4 : ox + 1, hy = oy + lt - 4 + by; p.r(hx - 1, hy - 1, 4, 4, PAL.O); p.r(hx, hy, 2, 2, hand); }
    /* рюкзак */
    if (look.pack) {
      const c = look.pack, cl = lite(c, .3), cd = dark(c, .35), ty = oy + lt - 7 + by;
      if (d === 1) { const x0 = ox + (w >> 1) - 4; p.r(x0, ty, 8, 7, PAL.O); p.r(x0 + 1, ty + 1, 6, 5, c); p.r(x0 + 1, ty + 1, 6, 1, cl); p.r(x0 + 1, ty + 3, 6, 1, cd); p.r(x0 + 3, ty + 4, 2, 1, PAL.g); }
      else if (side) { const x0 = d === 3 ? ox + 1 : ox + w - 5; p.r(x0, ty, 4, 7, PAL.O); p.r(x0 + 1, ty + 1, 2, 5, c); p.d(x0 + 1, ty + 1, cl); }
    }
    return cache[key] = p.can();
  };

  A.lookOf = eq => {
    const g = s => eq && eq[s] ? G.ITEMS[eq[s].id].equip : null, b = g('body'), h = g('head'), f = g('feet'), ha = g('hands'), bk = g('back');
    const L = { body: b ? b.c : null, boots: f ? f.c : null, gloves: ha ? ha.c : null, pack: bk ? bk.c : null, helm: h ? h.c : null };
    L.k = [L.body, L.boots, L.gloves, L.pack, L.helm].join(','); return L;
  };
  A.heroPal = PAL; A.heroMaps = MAPS;
})();
