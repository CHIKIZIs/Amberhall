'use strict';
/* Art IV: по референсам автора — лиственные деревья из «чешуек» листьев, кусты-купола с ягодами,
   мягкие валуны с травинками, упавшие брёвна (обычные и замшелые). */
(() => {
  const A = G.Art, P = A.P;
  const S = (n, p) => { A.spr[n] = { c: p.can(), w: p.w, h: p.h }; };
  const LINE = '#14201e';

  /* --- Крона из листьев-«чешуек»: свет сверху-слева, снизу бирюзовая тень --- */
  /* L: [тень, тёмный, средний, светлый, блик] */
  function leafy(p, cx, cy, rx, ry, L, seed, o) {
    o = o || {}; const r = G.rng(seed), q = P(p.w, p.h);
    const inside = (x, y) => { const nx = (x + .5 - cx) / rx, ny = (y + .5 - cy) / ry; return nx * nx + ny * ny; };
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) if (inside(x, y) <= .92) q.d(x, y, L[1]);
    const leaves = [];
    for (let gy = cy - ry - 1; gy <= cy + ry + 1; gy += 2.6) for (let gx = cx - rx - 1; gx <= cx + rx + 1; gx += 3.1) {
      const x = Math.round(gx + (r() - .5) * 2.2 + ((Math.round(gy) & 2) ? 1.5 : 0)), y = Math.round(gy + (r() - .5) * 1.6);
      if (inside(x + 1, y + 1) > 1.04) continue; leaves.push([x, y]);
    }
    leaves.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    for (const [x, y] of leaves) {
      const nx = (x + 1 - cx) / rx, ny = (y + 1 - cy) / ry;
      const v = -(nx * .55 + ny * .85) + (r() - .5) * .35;
      const i = v > .62 ? 4 : v > .2 ? 3 : v > -.25 ? 2 : v > -.7 ? 1 : 0;
      const c = L[i], dk = L[Math.max(0, i - 1)], hi = L[Math.min(4, i + 1)];
      /* листик смотрит вниз-вправо: 4×3 с острым концом */
      const shape = [[1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2], [2, 2], [3, 2], [3, 3]];
      for (const [dx, dy] of shape) q.d(x + dx, y + dy, c);
      q.d(x + 1, y, hi); q.d(x, y + 1, hi);
      q.d(x + 3, y + 2, dk); q.d(x + 3, y + 3, dk); q.d(x + 2, y + 2, dk);
    }
    if (o.dots) for (let i = 0; i < o.dots.n; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * .8, x = Math.round(cx + Math.cos(a) * rx * d), y = Math.round(cy + Math.sin(a) * ry * d); if (q.g(x, y) >>> 24 && q.g(x + 1, y + 1) >>> 24) { const c = o.dots.c; q.d(x, y, A.lite(c, .45)); q.d(x + 1, y, c); q.d(x, y + 1, c); q.d(x + 1, y + 1, A.dark(c, .35)); } }
    q.outline(o.line || LINE); p.st(q, 0, 0);
  }
  function trunkRoots(p, cx, top, bot, B) {
    for (let y = top; y <= bot; y++) {
      const k = (y - top) / (bot - top), w = 5 + Math.round(Math.pow(k, 2.2) * 7);
      for (let i = 0; i < w; i++) { const x = cx - (w >> 1) + i; let c = B[2]; if (i <= 1) c = B[3]; if (i >= w - 2) c = B[1]; if (i > 1 && i < w - 2 && (x + y * 2) % 7 === 0) c = B[1]; if (y === bot) c = B[0]; p.d(x, y, c); }
    }
    /* корни расходятся в стороны */
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { p.d(cx + s * (5 + i), bot - 1 + (i > 1 ? 1 : 0), B[s < 0 ? 3 : 1]); p.d(cx + s * (5 + i), bot, B[0]); }
  }
  const TRUNK = ['#3a1424', '#5e2236', '#843448', '#a84c5e', '#c87080'];
  const BIRCH = ['#3a3446', '#8a8494', '#d4d0d8', '#eeecf0', '#ffffff'];
  function bigTree(L, seed, o) {
    o = o || {}; const W = 38, Hh = 48, p = P(W, Hh), cx = 19;
    trunkRoots(p, cx, 30, 45, o.bark || TRUNK);
    leafy(p, cx - .5, 18, 16, 15.5, L, seed * 13 + 1, o);
    return p.outline(LINE);
  }

  /* --- Куст-купол: гладкий или с листовой фактурой, с ягодами --- */
  function dome(L, seed, berries, textured, snow) {
    const W = 22, Hh = 18, p = P(W, Hh), cx = 11, cy = 9.5, rx = 9.5, ry = 8.2, r = G.rng(seed);
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
      const nx = (x + .5 - cx) / rx, ny = (y + .5 - cy) / ry, d = nx * nx + ny * ny; if (d > 1 || y > cy + ry * .78) continue;
      const v = -(nx * .55 + ny * .8) + (H(x >> 1, y >> 1, seed) - .5) * .5; const i = v > .55 ? 4 : v > .15 ? 3 : v > -.3 ? 2 : v > -.7 ? 1 : 0;
      p.d(x, y, L[i]);
    }
    if (textured) for (let i = 0; i < 26; i++) { const a = r() * 6.28, dd = Math.sqrt(r()) * .78, x = Math.round(cx + Math.cos(a) * rx * dd), y = Math.round(cy + Math.sin(a) * ry * dd); if (!(p.g(x, y) >>> 24)) continue; const lit = (x - cx) * .55 + (y - cy) * .8 < 0; p.d(x, y, lit ? L[4] : L[1]); p.d(x + 1, y + 1, lit ? L[3] : L[0]); if (r() < .5) p.d(x - 1, y + 1, L[lit ? 3 : 1]); }
    else for (let i = 0; i < 10; i++) { const x = 4 + Math.floor(r() * 13), y = 3 + Math.floor(r() * 9); if (p.g(x, y) >>> 24 && (x - cx) + (y - cy) < -2) p.d(x, y, L[4]); }
    if (snow) for (let x = 0; x < W; x++) for (let y = 0; y < 11; y++) if (p.g(x, y) >>> 24 && !(p.g(x, y - 1) >>> 24)) { p.d(x, y, '#ffffff'); p.d(x, y + 1, '#e6eef8'); if ((x + y) % 2) p.d(x, y + 2, '#c4d4e6'); }
    if (berries) {
      const spots = [[6, 6], [12, 4], [15, 8], [8, 10], [13, 12], [4, 11], [17, 11], [10, 7]];
      for (const [bx, by] of spots) { if (!(p.g(bx, by) >>> 24) || !(p.g(bx + 2, by + 2) >>> 24)) continue; for (const [dx, dy] of [[0, 0], [1, 1], [-1, 1]]) { const x = bx + dx * 2, y = by + dy * 2; p.d(x, y, berries[1]); p.d(x + 1, y, berries[1]); p.d(x, y + 1, berries[1]); p.d(x + 1, y + 1, berries[0]); p.d(x, y, berries[2]); } }
    }
    return p.outline(LINE);
  }
  function H(x, y, s) { return G.hash(x, y, s); }

  /* --- Валун: округлые доли с плоскими гранями, тёмно-синий контур, травинки --- */
  const ROCK = ['#2a2238', '#4e4354', '#6e5f58', '#8f7f6c', '#ab9a82', '#c6b69a'];
  function boulder(R, seed, o) {
    o = o || {}; const W = o.w || 20, Hh = o.h || 17, p = P(W, Hh), r = G.rng(seed * 7 + 3);
    const lobes = [[W * .45, Hh * .58, W * .36, Hh * .38], [W * .66, Hh * .5, W * .26, Hh * .36], [W * .3, Hh * .7, W * .22, Hh * .24]];
    if (o.tall) lobes.push([W * .55, Hh * .3, W * .22, Hh * .32]);
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
      let best = -1, bl = null;
      for (const l of lobes) { const nx = (x + .5 - l[0]) / l[2], ny = (y + .5 - l[1]) / l[3], d = 1 - nx * nx - ny * ny; if (d > best) { best = d; bl = [nx, ny]; } }
      if (best < 0) continue;
      const v = -(bl[0] * .5 + bl[1] * .9);
      let i = v > .55 ? 5 : v > .2 ? 4 : v > -.15 ? 3 : v > -.5 ? 2 : 1;
      if (y >= Hh - 2) i = Math.min(i, 1);
      p.d(x, y, R[i]);
    }
    /* трещины и плоские грани */
    for (let k = 0; k < 2; k++) { let x = Math.floor(W * (.3 + r() * .4)), y = Math.floor(Hh * .25); for (let i = 0; i < Hh * .4; i++) { if (p.g(x, y) >>> 24 && p.g(x + 1, y) >>> 24) { p.d(x, y, R[1]); p.d(x + 1, y, R[4]); } x += r() < .5 ? 1 : 0; y++; } }
    if (o.ore) for (let i = 0; i < (o.n || 6); i++) { const x = 3 + Math.floor(r() * (W - 6)), y = 3 + Math.floor(r() * (Hh - 7)); if (p.g(x, y) >>> 24 && p.g(x + 1, y + 1) >>> 24 && p.g(x - 1, y - 1) >>> 24) { p.d(x, y, o.ore[4]); p.d(x + 1, y, o.ore[3]); p.d(x, y + 1, o.ore[2]); p.d(x + 1, y + 1, o.ore[1]); } }
    if (o.moss) for (let x = 1; x < W - 1; x++) for (let y = 1; y < Hh * .6; y++) if (p.g(x, y) >>> 24 && !(p.g(x, y - 1) >>> 24) && H(x, y, seed) < .55) { p.d(x, y, '#7cc04a'); p.d(x, y + 1, '#4f9234'); }
    if (o.snow) for (let x = 1; x < W - 1; x++) for (let y = 1; y < Hh * .7; y++) if (p.g(x, y) >>> 24 && !(p.g(x, y - 1) >>> 24)) { p.d(x, y, '#ffffff'); p.d(x, y + 1, '#e6eef8'); if (H(x, y, seed) < .5) p.d(x, y + 2, '#c4d4e6'); }
    p.outline(o.line || '#221c30');
    if (!o.snow && o.tufts !== false) for (const [tx, s] of [[1, 1], [W - 3, -1]]) { if (r() < .3) continue; const y = Hh - 2; p.d(tx, y, '#4fa03a'); p.d(tx + s, y - 1, '#7cc84a'); p.d(tx + s * 2, y - 2, '#7cc84a'); p.d(tx + s, y, '#2e6a2a'); }
    return p;
  }

  /* --- Упавшее бревно с расщеплёнными концами; mossy — с мхом --- */
  const LOG = ['#24141c', '#3e2426', '#5c3830', '#7e5240', '#a07250', '#c49470'];
  function fallenLog(seed, mossy, alt) {
    const W = 34, Hh = 18, p = P(W, Hh), r = G.rng(seed);
    const x0 = 3, x1 = 29, y0 = alt ? 12 : 11, y1 = alt ? 6 : 7, th = alt ? 5 : 6;
    for (let x = x0; x <= x1; x++) {
      const t = (x - x0) / (x1 - x0), yc = y0 + (y1 - y0) * t;
      const top = Math.round(yc - th / 2), bot = Math.round(yc + th / 2);
      for (let y = top; y <= bot; y++) { const k = (y - top) / (bot - top); let i = k < .2 ? 5 : k < .45 ? 4 : k < .7 ? 3 : k < .9 ? 2 : 1; if ((x * 3 + y * 5 + seed) % 9 === 0 && i > 2) i--; if ((y - top) === 2 && (x + seed) % 4 < 2) i = 2; p.d(x, y, LOG[i]); }
    }
    /* расщеплённый правый конец */
    for (let i = 0; i < 4; i++) { const yy = Math.round(y1 - 2 + i * 1.6), len = 2 + Math.floor(r() * 4); for (let k = 0; k < len; k++) p.d(x1 + 1 + k, yy - (k > 1 ? 1 : 0), LOG[i % 2 ? 4 : 3]); }
    /* левый конец: полое тёмное нутро */
    for (let y = Math.round(y0 - th / 2); y <= Math.round(y0 + th / 2); y++) { p.d(x0, y, LOG[0]); p.d(x0 + 1, y, LOG[1]); }
    p.d(x0 - 1, Math.round(y0 - th / 2), LOG[3]); p.d(x0 - 2, Math.round(y0 - th / 2) - 1, LOG[4]);
    /* сучок */
    const kx = 12 + Math.floor(r() * 8), ky = Math.round(y0 + (y1 - y0) * (kx - x0) / (x1 - x0) - th / 2); p.d(kx, ky - 1, LOG[3]); p.d(kx + 1, ky - 2, LOG[4]); p.d(kx + 1, ky - 1, LOG[2]);
    if (mossy) for (let x = x0 + 2; x < x1; x++) { const t = (x - x0) / (x1 - x0), top = Math.round(y0 + (y1 - y0) * t - th / 2); if (H(x, 1, seed) < .7) { const n = 1 + Math.floor(H(x, 2, seed) * 3); for (let k = 0; k < n; k++) p.d(x, top + k, ['#6a9c3a', '#4a7a34', '#2e5a2a'][k]); if (H(x, 3, seed) < .3) p.d(x, top - 1, '#86b848'); } }
    return p.outline('#160c12');
  }

  const prev = A.initPretty;
  A.initPretty = () => {
    prev();
    const LV = {
      oak: ['#1f6a5a', '#2a8a3a', '#52b030', '#8ed84a', '#c8f070'],
      doak: ['#123c3a', '#1e5e3a', '#2f7e38', '#56a844', '#88cc5c'],
      teal: ['#14404c', '#1c6466', '#289080', '#48bca0', '#86e6c4'],
      pink: ['#5a1840', '#982a52', '#d04a6a', '#f0808c', '#ffc0b8'],
      crim: ['#400c30', '#781a44', '#ac2c52', '#dc4c62', '#ff8a80'],
      birch: ['#3a6a3a', '#5a9a3a', '#86c048', '#b4e060', '#e0f890']
    };
    for (let i = 0; i < 3; i++) {
      S('oak' + i, bigTree(LV.oak, i + 1, i === 2 ? { dots: { n: 7, c: '#e8402e' } } : null));
      S('doak' + i, bigTree(LV.doak, i + 11));
      S('teal' + i, bigTree(LV.teal, i + 21));
      S('pinkt' + i, bigTree(LV.pink, i + 31, { dots: { n: 8, c: '#fff0f4' } }));
      S('crim' + i, bigTree(LV.crim, i + 41));
      S('birch' + i, bigTree(LV.birch, i + 51, { bark: BIRCH }));
    }
    const BL = { green: ['#1f4a3e', '#2f6a5a', '#4f9a7a', '#7cc49a', '#a8e0b8'], fresh: ['#1f5a32', '#2f7a3a', '#4fa046', '#7cc85c', '#b0e480'], pink: ['#4a1838', '#7a2a4e', '#b04a6a', '#e07a8a', '#ffb0b0'], crim: ['#3a0c2a', '#681a3e', '#9a2c4e', '#c84c62', '#f08080'], dry: ['#4a3a1c', '#6c5426', '#907030', '#b08e40', '#d0b060'], pine: ['#14302c', '#1c4838', '#28603e', '#38804a', '#5aa45a'] };
    const RED = ['#7a0f22', '#d02840', '#ff8a96'], BLUE = ['#1a4a8a', '#3a9ae0', '#c6f0ff'];
    S('bush0', dome(BL.green, 1)); S('bush1', dome(BL.fresh, 2, null, 1));
    S('berry1', dome(BL.fresh, 3, RED, 1)); S('berry0', dome(BL.fresh, 3, null, 1));
    S('pbush', dome(BL.pink, 4, null, 1)); S('pberry1', dome(BL.crim, 5, BLUE, 1)); S('pberry0', dome(BL.crim, 5, null, 1));
    S('dbush', dome(BL.dry, 6, null, 1)); S('sbush', dome(BL.pine, 7, null, 1, 1));
    const ORE = { coal: ['#0e0c16', '#1c1a26', '#2c2a38', '#44424f', '#6a6878'], copper: ['#7a3414', '#b0521c', '#de7a30', '#f5a554', '#ffd08a'], iron: ['#5a3a30', '#8a5c48', '#b88870', '#dcb69c', '#f6e2d0'], gold: ['#8a5a14', '#c08a1e', '#ecb92e', '#ffdc58', '#fff3a8'], star: ['#5a1a8a', '#8a3ac0', '#c06af0', '#e8a6ff', '#ffe0ff'] };
    const GRAN = ['#2a1824', '#4a2a34', '#6a3e44', '#8c5852', '#ac7466', '#c89482'], LIME = ['#3a3644', '#6e6858', '#948c76', '#b4ac92', '#cec6aa', '#e6e0c8'], SNOW = ['#22304a', '#3e4e6a', '#5e7090', '#8a9cb8', '#b4c4da', '#dce6f2'], ICE = ['#1a3a6a', '#2a5a94', '#3a82b4', '#62acd8', '#9ad4ee', '#e6faff'], STAR = ['#160e2a', '#2a1e48', '#3e2e6a', '#5a46a0', '#8a6ad8', '#c8b0ff'];
    const b = (n, R, seed, o) => S(n, boulder(R, seed, o));
    b('rock0', ROCK, 1); b('rock1', ROCK, 2, { moss: 1 }); b('rock2', ROCK, 3, { w: 28, h: 24, tall: 1 });
    b('granite0', GRAN, 4); b('granite1', GRAN, 5, { w: 26, h: 21, tall: 1 });
    b('lime0', LIME, 6, { moss: 1 }); b('lime1', LIME, 16, { w: 24, h: 16 });
    b('coalr', ROCK, 7, { ore: ORE.coal, n: 9 }); b('copperr', ROCK, 8, { ore: ORE.copper, n: 7 }); b('ironr', GRAN, 9, { ore: ORE.iron, n: 8 }); b('goldr', ROCK, 10, { ore: ORE.gold, n: 7 });
    b('srock', SNOW, 11, { snow: 1 }); b('sironr', SNOW, 12, { ore: ORE.iron, snow: 1 }); b('sgoldr', SNOW, 13, { ore: ORE.gold, snow: 1 });
    b('icer', ICE, 14, { w: 22, h: 19, tall: 1, tufts: false }); b('meteor', STAR, 15, { ore: ORE.star, n: 8, w: 22, h: 18, tufts: false });
    { const p = boulder(ROCK, 31, { w: 12, h: 9, tufts: false }); S('pebble', p); }
    for (let i = 0; i < 4; i++) S('flog' + i, fallenLog(i + 3, i >= 2, i % 2));
    /* грибы из картинки автора */
    for (let i = 0; i < 12; i++) { const c = A.userSprite('mush', i); A.spr['umush' + i] = { c, w: c.width, h: c.height }; }
    /* спелая грядка показывает сам овощ */
    const RIPE = { carrot: ['food6', 1], eggplant: ['food6', 0], radish: ['food6', 2], corn: ['food8', 2], chili: ['food8', 3], turnip: ['food8', 4], leek: ['food8', 5], pumpkin: ['food8', 7] };
    for (const id in RIPE) { const c = A.userSprite(RIPE[id][0], RIPE[id][1], true); const z = document.createElement('canvas'); z.width = 16; z.height = 18; z.getContext('2d').drawImage(c, 0, 1); A.spr['crop_' + id + '3'] = { c: z, w: 16, h: 18 }; }
  };
})();
/* Сундук по референсу автора: деревянная крышка с красной полосой, железные полосы, кольца, замок */
(() => {
  const A = G.Art;
  const map = (rows, pal) => { const w = Math.max(...rows.map(r => r.length)), p = A.P(w, rows.length); rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const c = pal[r[x]]; if (c) p.d(x, y, c); } }); return p; };
  const J = a => a.map(r => r.join(''));
  const CLOSED = J([
    ['..O', 'OOO', 'OOOOOO', 'OOO', 'O..'], ['.Oc', 'nom', 'dddddd', 'nom', 'cO.'], ['Ocb', 'nom', 'cccccc', 'nom', 'bcO'], ['Obb', 'nom', 'bbcbbb', 'nom', 'bbO'],
    ['Orr', 'nom', 'rrrrrr', 'nom', 'rrO'], ['Obb', 'nom', 'bOOOOb', 'nom', 'baO'], ['Oaa', 'nom', 'aOooOa', 'nom', 'aaO'], ['OOO', 'nom', 'OOonOO', 'nom', 'OOO'],
    ['oea', 'nom', 'eOnnOe', 'nom', 'aeo'], ['Oea', 'nom', 'eOOnOe', 'nom', 'aeO'], ['Oea', 'nom', 'eeOOee', 'nom', 'aeO'], ['Oaa', 'nom', 'aaaaaa', 'nom', 'aaO'], ['OOO', 'OOO', 'OOOOOO', 'OOO', 'OOO']]);
  const OPEN = J([
    ['..O', 'OOO', 'OOOOOO', 'OOO', 'O..'], ['.Oc', 'nom', 'dddddd', 'nom', 'cO.'], ['Ocb', 'nom', 'cccccc', 'nom', 'bcO'], ['Obb', 'nom', 'bbcbbb', 'nom', 'bbO'],
    ['Oaa', 'nom', 'aaonaa', 'nom', 'aaO'], ['OOO', 'OOO', 'OOOOOO', 'OOO', 'OOO'], ['Oaa', 'aaa', 'aaaaaa', 'aaa', 'aaO'], ['Oak', 'kkk', 'kkkkkk', 'kkk', 'kaO'],
    ['Oak', 'kkk', 'kkkkkk', 'kkk', 'kaO'], ['Oak', 'kkk', 'kkkkkk', 'kkk', 'kaO'], ['OOO', 'OOO', 'OOOOOO', 'OOO', 'OOO'], ['Oec', 'eee', 'eeooee', 'eee', 'ceO'],
    ['Oea', 'eee', 'eeOOee', 'eee', 'aeO'], ['Oea', 'eae', 'eeeeee', 'eae', 'aeO'], ['Oaa', 'aaa', 'aaaaaa', 'aaa', 'aaO'], ['OOO', 'OOO', 'OOOOOO', 'OOO', 'OOO']]);
  const WOOD = { O: '#2a1620', a: '#4a2630', e: '#5e3434', b: '#7a4a3e', c: '#9a644c', d: '#c0906a', r: '#7a1e26', n: '#4e6470', o: '#a8c0c8', m: '#7894a0', k: '#1a0c14' };
  const ANCIENT = { O: '#140d24', a: '#2a2046', e: '#3a2e60', b: '#4c3e7c', c: '#66569a', d: '#8a7cc0', r: '#7ef0ff', n: '#8a5a14', o: '#fff3a8', m: '#ecb92e', k: '#0a0614' };
  const prev = A.initPretty;
  A.initPretty = () => {
    prev();
    const S = (n, rows, pal) => { const p = map(rows, pal); A.spr[n] = { c: p.can(), w: p.w, h: p.h }; };
    S('chest_c', CLOSED, WOOD); S('chest_o', OPEN, WOOD); S('achest_c', CLOSED, ANCIENT); S('achest_o', OPEN, ANCIENT);
  };
})();
