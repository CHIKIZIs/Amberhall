'use strict';
/* Art III: «ручная» перерисовка мира. Деревья из листовых шапок, гранёные камни, попиксельные мелочи, скалы-столбы.
   Заменяет одноимённые спрайты из art.js, так что данные игры не меняются. */
(() => {
  const A = G.Art, P = A.P, OUT = '#0d0b1a', H = G.hash;
  const S = (name, p) => { A.spr[name] = { c: p.can(), w: p.w, h: p.h }; };
  /* рисование по карте символов */
  const map = (rows, pal) => { const w = Math.max(...rows.map(r => r.length)), p = P(w, rows.length); rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const c = pal[r[x]]; if (c) p.d(x, y, c); } }); return p; };
  const LEAF = {
    oak: ['#1e4a2e', '#2f6e34', '#4a9a3a', '#76c048', '#b2e468'],
    doak: ['#163a30', '#22573a', '#2f7440', '#45924a', '#6cb85a'],
    birch: ['#3a5a24', '#5a8a30', '#7fb240', '#a8d454', '#d4f07c'],
    teal: ['#123c48', '#1a5c62', '#26827c', '#38aa96', '#6edcbc'],
    pink: ['#6a1838', '#a02a4a', '#d24a62', '#f07a84', '#ffb6ac'],
    crim: ['#4c1030', '#7c1c40', '#ac2c4c', '#d84a5c', '#f8807c'],
    pine: ['#14302c', '#1c4838', '#28603e', '#38804a', '#5aa45a'],
    bpine: ['#16264e', '#20406e', '#2a5c8c', '#3a80a8', '#5aa8c4'],
    ppine: ['#3e0c2c', '#6a1640', '#962456', '#c03a66', '#e86884'],
    palm: ['#1c5030', '#2c7038', '#46963e', '#70bc4c', '#a8e06a'],
    dry: ['#4a3a1c', '#6c5426', '#907030', '#b08e40', '#d0b060']
  };
  const BARK = ['#2c1a1e', '#4a2c26', '#6a4030', '#8c5a3c', '#ae7a50'];
  const BIRCH = ['#3a3446', '#8a8494', '#d4d0d8', '#eeecf0', '#ffffff'];

  /* --- Листовая шапка: круг с «зубчатым» краем, свет сверху-слева, своя тёмная обводка --- */
  function clump(p, cx, cy, r, L, seed, opt) {
    opt = opt || {}; const q = P(p.w, p.h), R2 = r + 1.5;
    for (let y = Math.floor(cy - R2); y <= cy + R2; y++) for (let x = Math.floor(cx - R2); x <= cx + R2; x++) {
      const dx = x + .5 - cx, dy = y + .5 - cy, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
      const edge = r + (Math.floor((a + 3.1416) / 6.2832 * (6 + r)) % 2 ? .6 : -.4) * Math.min(1, r / 4);
      if (d > edge) continue;
      const lx = dx + r * .38, ly = dy + r * .42, ld = Math.hypot(lx, ly) / r;
      let c = L[2];
      if (ld < .55) c = L[3];
      if (dy > r * .35 && d > r * .55 || dx > r * .55 && d > r * .6) c = L[1];
      q.d(x, y, c);
    }
    /* листовая фактура: короткие светлые штрихи в освещённой части и тёмные в тени */
    const rr = G.rng(seed);
    for (let i = 0; i < r * 1.6; i++) { const a = rr() * 6.28, dd = rr() * r * .8, x = Math.round(cx + Math.cos(a) * dd), y = Math.round(cy + Math.sin(a) * dd); const v = q.g(x, y); if (!(v >>> 24)) continue; const lit = (x - cx) + (y - cy) < 0; q.d(x, y, lit ? L[4] : L[1]); if (q.g(x + 1, y) >>> 24) q.d(x + 1, y, lit ? L[3] : L[1]); if (!lit && q.g(x, y + 1) >>> 24) q.d(x, y + 1, L[0]); }
    q.outline(opt.line || L[0]); p.st(q, 0, 0);
  }
  /* ствол с корнями и бороздами коры */
  function trunk(p, cx, top, bot, w, B, birch) {
    for (let y = top; y <= bot; y++) { const k = (y - top) / Math.max(1, bot - top), ww = w + (k > .75 ? Math.round((k - .75) * 10) : 0); for (let i = 0; i < ww; i++) { const x = cx - (ww >> 1) + i; let c = B[2]; if (i === 0) c = B[3]; else if (i === 1 && ww > 3) c = B[3]; if (i >= ww - 2) c = B[1]; if (birch) { c = i === 0 ? B[4] : i >= ww - 1 ? B[1] : B[3]; if ((y * 7 + i * 3) % 11 === 0 && i > 0 && i < ww - 1) c = B[0]; } else if (i > 1 && i < ww - 2 && (y + i * 3) % 5 === 0) c = B[1]; p.d(x, y, c); } }
  }
  function leafTree(L, seed, o) {
    o = o || {}; const W = o.w || 38, Hh = o.h || 48, p = P(W, Hh), cx = W / 2, r = G.rng(seed * 131 + 7);
    const ct = Hh - 14; // верх ствола
    trunk(p, Math.round(cx), Math.round(ct - 8), Hh - 3, o.tw || 5, o.bark || BARK, o.birch);
    const base = o.cy || 17, R = o.r || 6.5, cl = [];
    const n = o.n || 7;
    /* задний ряд, средний ряд, передний ряд */
    for (let i = 0; i < n; i++) { const a = -Math.PI * (i / (n - 1)) - .05, rad = (o.spread || 9) * (.85 + r() * .25); cl.push([cx + Math.cos(a) * rad * 1.15, base - 2 + Math.sin(a) * rad * .8, R - .5 + r() * 1.2]); }
    cl.push([cx - 7 + r() * 2, base + 4, R]); cl.push([cx + 7 - r() * 2, base + 4.5, R - .3]); cl.push([cx, base + 1, R + 1.2]); cl.push([cx + (r() - .5) * 4, base + 7, R - .6]);
    cl.sort((a, b) => a[1] - b[1]);
    cl.forEach((c, i) => clump(p, c[0], c[1], c[2], L, seed * 17 + i));
    if (o.fruit) for (let i = 0; i < 6; i++) { const x = Math.round(cx + (r() - .5) * 22), y = Math.round(base - 4 + r() * 14); if (p.g(x, y) >>> 24 && p.g(x + 1, y + 1) >>> 24) { p.d(x, y, o.fruit); p.d(x + 1, y, o.fruit); p.d(x, y + 1, A.dark(o.fruit, .3)); p.d(x + 1, y + 1, o.fruit); p.d(x, y, A.lite(o.fruit, .5)); } }
    if (o.blossom) for (let i = 0; i < 9; i++) { const x = Math.round(cx + (r() - .5) * 26), y = Math.round(base - 6 + r() * 16); if (p.g(x, y) >>> 24) { p.d(x, y, o.blossom); } }
    return p.outline(OUT);
  }
  /* --- Ель: ярусы с висячими ветками --- */
  function pine(L, seed, o) {
    o = o || {}; const W = 30, Hh = 50, p = P(W, Hh), cx = 15, r = G.rng(seed * 37 + 3);
    trunk(p, cx, 36, 47, 4, BARK);
    const tiers = [[4, 9, 5], [10, 16, 8], [17, 24, 10.5], [24, 33, 13]];
    tiers.forEach(([top, bot, hw], ti) => {
      const q = P(W, Hh);
      for (let y = top; y <= bot + 2; y++) for (let x = 0; x < W; x++) {
        const t = (y - top) / (bot - top), half = Math.max(1, t * hw), dx = x + .5 - cx;
        /* нижний край — висячие «лапы» */
        const lap = Math.floor((x + ti * 2) / 4) % 2 === 0 ? 1.6 : 0, edgeY = bot + lap * (Math.abs(dx) / hw);
        if (Math.abs(dx) > half || y > edgeY) continue;
        const side = dx / half; let c = L[2];
        if (side < -.25) c = L[3]; if (side > .35) c = L[1]; if (y > edgeY - 1.5) c = side < 0 ? L[1] : L[0];
        if (side < -.6 && y < edgeY - 2) c = L[4];
        q.d(x, y, c);
      }
      for (let i = 0; i < hw * 1.5; i++) { const y = Math.round(top + 2 + r() * (bot - top - 1)), x = Math.round(cx + (r() - .5) * hw * 1.4); if (q.g(x, y) >>> 24) q.d(x, y, (x < cx) ? L[4] : L[1]); }
      if (o.snow) for (let x = 0; x < W; x++) for (let y = top; y <= bot; y++) { if (!(q.g(x, y) >>> 24)) continue; if (!(q.g(x, y - 1) >>> 24) || !(q.g(x, y - 2) >>> 24)) { q.d(x, y, (x < cx) ? '#ffffff' : '#d6e4f2'); if (q.g(x, y + 1) >>> 24 && (x + y) % 3) q.d(x, y + 1, '#c0d4ea'); } }
      q.outline(L[0]); p.st(q, 0, 0);
    });
    p.d(cx, 2, L[3]); p.d(cx, 3, L[2]);
    return p.outline(OUT);
  }
  function palm(seed) {
    const p = P(36, 46), L = LEAF.palm; let x = 17;
    for (let y = 44; y > 14; y--) { if (y % 8 === 0) x += seed % 2 ? 1 : -1; const seg = y % 4 === 0; p.d(x - 1, y, BARK[3]); p.d(x, y, seg ? BARK[1] : BARK[3]); p.d(x + 1, y, BARK[2]); p.d(x + 2, y, BARK[1]); }
    const frond = (ang, len) => { const q = P(36, 46); let px = x + .5, py = 14; for (let i = 0; i < len; i++) { const t = i / len; px += Math.cos(ang); py += Math.sin(ang) + t * 1.1; const w = Math.max(1, Math.round(Math.sin(t * Math.PI) * 2.6)); for (let k = -w; k <= w; k++) q.d(px, py + k * .6 + w * .3, k < 0 ? L[3] : k > 0 ? L[1] : L[2]); } q.outline(L[0]); p.st(q, 0, 0); };
    for (const [a, l] of [[-2.2, 11], [-.95, 11], [-1.57, 8], [Math.PI - .15, 14], [.15, 14], [2.6, 11], [.55, 11]]) frond(a, l);
    for (const [dx, dy] of [[-1, 16], [1, 16], [0, 17]]) { p.d(x + dx, dy, '#8a5a24'); p.d(x + dx + 1, dy, '#b07a34'); }
    return p.outline(OUT);
  }
  function deadTree(seed) {
    const p = P(28, 38), B = ['#2a2024', '#46362e', '#62503e', '#7e6a52', '#9a8668'], r = G.rng(seed + 9);
    trunk(p, 14, 12, 35, 4, B);
    const br = (x, y, dx, n, w) => { for (let i = 0; i < n; i++) { for (let k = 0; k < w; k++) p.d(x + k, y, k ? B[1] : B[3]); x += dx; y -= 1; if (r() < .3) x += dx; } return [x, y]; };
    br(13, 20, -1, 8, 2); br(15, 17, 1, 9, 2); br(14, 13, 0, 9, 2); const e = br(12, 26, -1, 5, 1); br(16, 24, 1, 5, 1); br(e[0], e[1], -1, 3, 1);
    return p.outline(OUT);
  }

  /* --- Гранёный камень --- */
  const ROCKS = {
    stone: ['#2e2a3a', '#4a4658', '#6a6878', '#8e8c9a', '#b8b6c2'],
    granite: ['#3a2430', '#5a3a40', '#7c5450', '#a07464', '#c49a80'],
    lime: ['#5e584c', '#7e786a', '#a6a08c', '#c8c2aa', '#e6e2cc'],
    snow: ['#3a4a66', '#5a6e8e', '#8aa0bc', '#c4d4e6', '#ffffff'],
    ice: ['#2a5a8a', '#3a82b4', '#62acd8', '#9ad4ee', '#e6faff'],
    star: ['#1e1838', '#342a62', '#5a46a0', '#8a6ad8', '#c8b0ff'],
    red: ['#3a1e22', '#5a2e2c', '#7c443a', '#a0604a', '#c48464']
  };
  function chunkPoly(cx, cy, w, h, r) { const pts = [], n = 6 + Math.floor(r() * 2); for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + i / n * Math.PI * 2 + (r() - .5) * .5, k = .8 + r() * .25; pts.push([cx + Math.cos(a) * w * k, cy + Math.sin(a) * h * k]); } return pts; }
  function rockChunk(p, pts, R, cx, cy, h) {
    const q = P(p.w, p.h); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const topY = y0 + (y1 - y0) * .42, splitX = cx + (x1 - x0) * .14;
    for (let y = Math.floor(y0); y <= y1; y++) for (let x = Math.floor(x0); x <= x1; x++) {
      let ins = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if (((yi > y + .5) !== (yj > y + .5)) && (x + .5 < (xj - xi) * (y + .5 - yi) / (yj - yi) + xi)) ins = !ins; }
      if (!ins) continue;
      let c; const slope = topY + (x - cx) * .18;
      if (y < slope) c = (x < cx - 1) ? R[4] : R[3];
      else if (x > splitX + (y - slope) * .25) c = R[1];
      else c = R[2];
      if (y >= y1 - 1) c = R[0];
      q.d(x, y, c);
    }
    /* грань: светлая кромка верха и тёмная трещина */
    for (let x = Math.floor(x0); x <= x1; x++) { const y = Math.round(topY + (x - cx) * .18); if (q.g(x, y) >>> 24 && q.g(x, y + 1) >>> 24) q.d(x, y + 1, R[1]); }
    q.outline(R[0]); p.st(q, 0, 0);
  }
  function rock(R, seed, o) {
    o = o || {}; const w = o.w || 20, h = o.h || 17, p = P(w, h), r = G.rng(seed * 53 + 11);
    const parts = o.big ? [[w * .36, h * .58, w * .28, h * .34], [w * .66, h * .5, w * .3, h * .4], [w * .5, h * .74, w * .3, h * .22]] : [[w * .44, h * .55, w * .34, h * .36], [w * .68, h * .68, w * .2, h * .22]];
    for (const [cx, cy, rw, rh] of parts) rockChunk(p, chunkPoly(cx, cy, rw, rh, r), R, cx, cy, rh);
    if (o.ore) for (let i = 0; i < (o.n || 6); i++) { const x = 3 + Math.floor(r() * (w - 6)), y = 3 + Math.floor(r() * (h - 7)); if (p.g(x, y) >>> 24 && p.g(x + 1, y + 1) >>> 24 && p.g(x - 1, y) >>> 24) { p.d(x, y, o.ore[3]); p.d(x + 1, y, o.ore[2]); p.d(x, y + 1, o.ore[1]); p.d(x + 1, y + 1, o.ore[0]); p.d(x, y, o.ore[4]); } }
    if (o.moss) for (let x = 1; x < w - 1; x++) for (let y = 1; y < h * .6; y++) { if (!(p.g(x, y) >>> 24) || (p.g(x, y - 1) >>> 24)) continue; const n = 1 + Math.floor(H(x, seed, 3) * 3); if (H(x, y, seed) < .6) for (let k = 0; k < n; k++) p.d(x, y + k, ['#86c84a', '#5a9a34', '#3f7a2c'][k]); }
    if (o.snow) for (let x = 1; x < w - 1; x++) for (let y = 1; y < h * .7; y++) { if (!(p.g(x, y) >>> 24) || (p.g(x, y - 1) >>> 24)) continue; p.d(x, y, '#ffffff'); p.d(x, y + 1, '#e6eef8'); if (H(x, y, seed) < .5) p.d(x, y + 2, '#c4d4e6'); }
    if (o.tufts) for (const tx of [1, w - 4]) { p.d(tx, h - 2, '#5a9a34'); p.d(tx + 1, h - 3, '#86c84a'); p.d(tx + 2, h - 2, '#3f7a2c'); }
    return p.outline(OUT);
  }
  function crystal(C, seed) {
    const p = P(20, 22), r = G.rng(seed);
    const shard = (x, top, w, h, lean) => { const q = P(20, 22); for (let y = top; y < top + h; y++) { const t = (y - top) / h, half = Math.min(w, (y - top) * 1.2 + .5), xc = x + lean * (1 - t); for (let i = -Math.ceil(half); i <= Math.ceil(half); i++) { const X = Math.round(xc + i); let c = C[2]; if (i < 0) c = C[3]; if (i > half * .3) c = C[1]; if (i === -Math.ceil(half) + 1 && y > top + 1) c = C[4]; q.d(X, y, c); } } q.outline(C[0]); p.st(q, 0, 0); };
    p.blob([[10, 19.5, 8, 2.5]], ROCKS.stone, { noise: 0, flat: 3 });
    shard(5, 9, 2, 11, 1.5); shard(15, 8, 2, 12, -1.5); shard(10, 2, 3, 18, 0); shard(12.5, 13, 1.5, 7, 0);
    p.d(9, 4, '#ffffff'); p.d(9, 5, '#ffffff');
    return p.outline(OUT);
  }

  /* --- Мелочи по карте символов --- */
  const GR = { o: '#2a5a26', a: '#3a8030', b: '#5aa83c', c: '#8cd052', d: '#c4ec7a' };
  const tuftRows = [
    ['....o....o..', '...ocb..ocb.', '...ob...ob..', '.o.ob.o.ob..', 'obooboboba.o', 'obboabbbaboc', '.abaaabaaaa.'],
    ['.....o......', '..o.ocb..o..', '.ocbob..ocb.', '.ob.ob.oob..', 'oab.abobab..', 'abbaabbaaba.', '.aaaaaaaaa..']
  ];
  const tall = ['..o..........', '.ocb...o.....', '.ob...ocb..o.', 'oob...ob..ocb', 'ob..o.ob..ob.', 'ob.ocbob.oob.', 'oabob.obbob..', 'abbobbbbab...', '.aaaaaaaaa...'];
  const flowerRows = ['..w.......', '.wyw...w..', '..w...wyw.', '..g....w..', '..g.w...g.', '..gwyw..g.', '.g..w.gg..', '..g..g....'];
  const mushRows = ['...OOOOO...', '..OrRRwrO..', '.OrRwwRrrO.', 'OrRRRRrrrrO', 'OOrrrrrrrOO', '..OOcccOO..', '...OcwcO...', '...OcccO...', '..OOcccOO..', '...OOOOO...'];
  const stumpRows = ['...OOOOOOO...', '..ObbbbbbbO..', '.ObccbbbccbO.', '.ObcbccbbcbO.', '.ObbcbbccbbO.', '.OabbbbbbbaO.', '.OahaahaaahO.', '.OhahaahahaO.', 'OOahaahaahaOO', 'OhaaOhaaOhaaO', '.OOO.OOO.OOO.'];
  const stickRows = ['..........OO.', '.........OcbO', '....OO..ObO..', '...OcbOObO...', 'OOOcbbbbO....', 'Ocbbbabb O...', '.OOOaOOO.....', '....O........'];
  const pebbleRows = ['....OOO.....', '..OOcdcO....', '.OccbbcbO.O.', '.ObbbbbaOOcO', '..OaaaaO.ObaO', '...OOOO..OOO.'];
  const shellRows = ['...OOOO..', '..OwpwpO.', '.OpwpwpwO', '.OwpwpwpO', '..OppppO.', '...OOOO..'];
  const reedRows = ['....d.....d..', '...OdO...OdO.', '...OyO...OyO.', '...ObO.O.ObO.', '.O.ObOOcOObO.', 'OcOOb.Ob..bO.', 'Ob.Ob.Ob.Ob..', 'Ob.ObOOb.Ob.O', 'OaOab.Ob.ObOc', 'OabaabaabaabO', '.aaaaaaaaaaa.'];

  A.initPretty = () => {
    /* деревья */
    for (let i = 0; i < 3; i++) {
      S('oak' + i, leafTree(LEAF.oak, i + 1, { fruit: i === 2 ? '#e8483a' : null }));
      S('doak' + i, leafTree(LEAF.doak, i + 11, { r: 7, spread: 10, n: 8 }));
      S('birch' + i, leafTree(LEAF.birch, i + 21, { bark: BIRCH, birch: 1, tw: 3, r: 5.5, spread: 7.5, w: 32 }));
      S('teal' + i, leafTree(LEAF.teal, i + 31, { tw: 4, r: 6, spread: 8 }));
      S('pinkt' + i, leafTree(LEAF.pink, i + 41, { blossom: '#ffe0e8' }));
      S('crim' + i, leafTree(LEAF.crim, i + 51, { tw: 4, r: 6, spread: 8.5 }));
    }
    for (let i = 0; i < 2; i++) { S('pine' + i, pine(LEAF.pine, i + 1)); S('tpine' + i, pine(LEAF.bpine, i + 5)); S('ppine' + i, pine(LEAF.ppine, i + 9)); S('spine' + i, pine(LEAF.pine, i + 13, { snow: 1 })); S('palm' + i, palm(i)); S('dead' + i, deadTree(i)); }
    /* кусты: несколько шапок */
    const bush = (L, seed, berries, snow) => { const p = P(22, 17), r = G.rng(seed); for (const [x, y, rr] of [[7, 9, 5], [15, 9, 5], [11, 6, 5.5], [11, 11, 5]]) clump(p, x + (r() - .5), y, rr, L, seed + x); if (berries) for (let i = 0; i < 7; i++) { const x = 4 + Math.floor(r() * 14), y = 4 + Math.floor(r() * 10); if (p.g(x, y) >>> 24 && p.g(x + 1, y + 1) >>> 24) { p.d(x, y, A.lite(berries, .5)); p.d(x + 1, y, berries); p.d(x, y + 1, berries); p.d(x + 1, y + 1, A.dark(berries, .35)); } } if (snow) for (let x = 0; x < 22; x++) for (let y = 0; y < 12; y++) if (p.g(x, y) >>> 24 && !(p.g(x, y - 1) >>> 24)) { p.d(x, y, '#ffffff'); p.d(x, y + 1, '#d6e4f2'); } return p.outline(OUT); };
    S('bush0', bush(LEAF.oak, 1)); S('bush1', bush(LEAF.doak, 2)); S('berry1', bush(LEAF.oak, 3, '#e8304a')); S('berry0', bush(LEAF.oak, 3));
    S('pbush', bush(LEAF.pink, 4)); S('pberry1', bush(LEAF.crim, 5, '#7ef0ff')); S('pberry0', bush(LEAF.crim, 5)); S('dbush', bush(LEAF.dry, 6)); S('sbush', bush(LEAF.pine, 7, null, 1));
    /* трава, цветы, грибы, ветки, камешки */
    const palsG = { green: GR, pink: { o: '#6a1836', a: '#a02a4a', b: '#d2465e', c: '#f27a86', d: '#ffb0b0' }, dry: { o: '#4a3a1c', a: '#7a6430', b: '#a08840', c: '#c8b058', d: '#e8d488' } };
    tuftRows.forEach((rows, i) => { S('tgrass' + i, map(rows, palsG.green)); S('pgrass' + i, map(rows, palsG.pink)); S('dgrass' + i, map(rows, palsG.dry)); });
    S('reed0', map(reedRows, { O: '#1c4a2a', a: '#2c6a34', b: '#46923e', c: '#72b84c', d: '#8a6034', y: '#b08040' }));
    S('reed1', map(reedRows.map(r => r.split('').reverse().join('')), { O: '#1c4a2a', a: '#2c6a34', b: '#46923e', c: '#72b84c', d: '#8a6034', y: '#b08040' }));
    [['#ff6f91', '#ffe066'], ['#ffe066', '#e5741f'], ['#8fb8ff', '#ffffff'], ['#ffffff', '#ffc23e']].forEach(([w, y], i) => S('flower' + i, map(flowerRows, { w, y, g: '#3f8a36' })));
    S('mush0', map(mushRows, { O: OUT, r: '#a85a2c', R: '#d08040', w: '#f0c080', c: '#efe6d2', s: '#c8bca2' }));
    S('mush1', map(mushRows, { O: OUT, r: '#c02830', R: '#e84a3a', w: '#ffffff', c: '#efe6d2' }));
    S('gmush', map(mushRows, { O: '#0f2a44', r: '#2a7ad0', R: '#4aa8f0', w: '#c6f4ff', c: '#d8f4ff' }));
    S('stump', map(stumpRows, { O: OUT, a: BARK[2], h: BARK[1], b: '#c8955a', c: '#e8b878' }));
    S('stump_s', map(stumpRows.map((r, i) => i < 3 ? r.replace(/[bc]/g, 'w') : r), { O: OUT, a: BARK[2], h: BARK[1], b: '#c8955a', c: '#e8b878', w: '#ffffff' }));
    S('stickg', map(stickRows, { O: OUT, a: BARK[1], b: BARK[3], c: '#c89a68' }));
    S('pebble', map(pebbleRows, { O: OUT, a: ROCKS.stone[1], b: ROCKS.stone[2], c: ROCKS.stone[3], d: ROCKS.stone[4] }));
    S('shell', map(shellRows, { O: OUT, w: '#fff0e6', p: '#f0a8a0' }));
    /* камни и руды */
    const ORE = { coal: ['#0e0c16', '#1c1a26', '#2c2a38', '#44424f', '#6a6878'], copper: ['#7a3414', '#b0521c', '#de7a30', '#f5a554', '#ffd08a'], iron: ['#5a3a30', '#8a5c48', '#b88870', '#dcb69c', '#f6e2d0'], gold: ['#8a5a14', '#c08a1e', '#ecb92e', '#ffdc58', '#fff3a8'], star: ['#5a1a8a', '#8a3ac0', '#c06af0', '#e8a6ff', '#ffe0ff'] };
    S('rock0', rock(ROCKS.stone, 1, { tufts: 1 })); S('rock1', rock(ROCKS.stone, 2, { moss: 1 })); S('rock2', rock(ROCKS.stone, 3, { w: 28, h: 22, big: 1, moss: 1 }));
    S('granite0', rock(ROCKS.granite, 4)); S('granite1', rock(ROCKS.granite, 5, { w: 26, h: 21, big: 1 }));
    S('lime0', rock(ROCKS.lime, 6, { moss: 1 })); S('lime1', rock(ROCKS.lime, 16, { w: 24, h: 17 }));
    S('coalr', rock(ROCKS.stone, 7, { ore: ORE.coal, n: 9 })); S('copperr', rock(ROCKS.stone, 8, { ore: ORE.copper, n: 7 })); S('ironr', rock(ROCKS.granite, 9, { ore: ORE.iron, n: 8 })); S('goldr', rock(ROCKS.stone, 10, { ore: ORE.gold, n: 7 }));
    S('srock', rock(ROCKS.stone, 11, { snow: 1 })); S('sironr', rock(ROCKS.stone, 12, { ore: ORE.iron, snow: 1 })); S('sgoldr', rock(ROCKS.stone, 13, { ore: ORE.gold, snow: 1 }));
    S('icer', rock(ROCKS.ice, 14, { w: 22, h: 19, big: 1 })); S('meteor', rock(ROCKS.star, 15, { ore: ORE.star, n: 8, w: 22, h: 18, big: 1 }));
    S('cryst_g', crystal(['#1f5a2a', '#3a9c30', '#6cd43a', '#b0f55a', '#eaffb0'], 1)); S('cryst_p', crystal(['#5a1a6a', '#9a3ab0', '#d06aea', '#f0a6ff', '#ffe0ff'], 2)); S('cryst_b', crystal(['#1a3a7a', '#3a7ed4', '#62b0f5', '#a6dcff', '#e6f8ff'], 3));
    { const p = P(16, 9), r = G.rng(4); rockChunk(p, chunkPoly(5, 5, 4, 3, r), ROCKS.stone, 5, 5, 3); rockChunk(p, chunkPoly(11, 5.5, 3.5, 2.6, r), ROCKS.stone, 11, 5.5, 2.6); S('rubble', p.outline(OUT)); }
    /* каменные столбы каньона */
    const spire = (R, seed) => { const p = P(20, 40), r = G.rng(seed); for (let i = 0; i < 5; i++) { const y = 33 - i * 7, w = 8 - i * .9 + r(); rockChunk(p, chunkPoly(10 + (r() - .5) * 2, y, w, 4.5, r), R, 10, y, 4.5); } return p.outline(OUT); };
    S('spire0', spire(ROCKS.red, 1)); S('spire1', spire(ROCKS.granite, 2));
    /* кактус */
    const cac = (fl) => { const C = ['#1a4a2a', '#2a6c34', '#3f9040', '#64b452', '#98d870']; const p = P(16, 24); const col = (x, y, w, h) => { const q = P(16, 24); for (let yy = y; yy < y + h; yy++) for (let i = 0; i < w; i++) q.d(x + i, yy, i === 0 ? C[3] : i === w - 1 ? C[1] : C[2]); for (let yy = y + 2; yy < y + h; yy += 3) q.d(x + (w >> 1), yy, C[4]); q.d(x + 1, y, C[3]); q.outline(C[0]); p.st(q, 0, 0); }; col(1, 8, 3, 7); col(1, 13, 5, 3); col(12, 5, 3, 8); col(10, 11, 4, 3); col(5, 2, 6, 21); if (fl) { p.d(7, 1, '#ff6f91'); p.d(8, 1, '#ffc2d4'); p.d(13, 4, '#ff6f91'); } return p.outline(OUT); };
    S('cactus0', cac(0)); S('cactus1', cac(1));
    /* грядка: ровные борозды в деревянной рамке */
    const plot = wet => { const p = P(16, 16), d = wet ? ['#3a2420', '#4e3026', '#64402e'] : ['#7a4a30', '#94603c', '#ae7848']; for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { let c = d[1]; if (y % 4 === 2) c = d[0]; if (y % 4 === 0) c = d[2]; if (x === 0 || y === 0) c = '#c8955a'; if (x === 15 || y === 15) c = '#6a4030'; p.d(x, y, c); } p.d(0, 0, '#e8b878'); return p; };
    S('plot_d', plot(0)); S('plot_w', plot(1));
  };
})();
/* Скалы и стены пещер: плотные ряды круглых каменных столбов (вид сверху), как в референсах каньона */
(() => {
  const A = G.Art, P = A.P, OUT = '#0d0b1a';
  const cliff = (pal, snow) => {
    const cv = document.createElement('canvas'); cv.width = 16 * 8; cv.height = 16; const x = cv.getContext('2d');
    for (let v = 0; v < 8; v++) {
      const p = P(16, 16), bot = v >= 4;
      p.r(0, 0, 16, 16, pal[0]);
      for (let k = 0; k < 2; k++) {
        const x0 = k * 8, yTop = [1, 8, 4, 11][(k * 3 + v) % 4];
        /* задний столб тянется сверху */
        for (let y = 0; y < 16; y++) { p.d(x0, y, OUT); p.d(x0 + 1, y, pal[2]); for (let i = 2; i < 6; i++) p.d(x0 + i, y, pal[1]); p.d(x0 + 6, y, pal[0]); p.d(x0 + 7, y, OUT); }
        /* передний столб: шапка и тело */
        for (let y = yTop + 2; y < 16; y++) { p.d(x0, y, OUT); p.d(x0 + 1, y, pal[3]); p.d(x0 + 2, y, pal[3]); p.d(x0 + 3, y, pal[2]); p.d(x0 + 4, y, pal[2]); p.d(x0 + 5, y, pal[1]); p.d(x0 + 6, y, pal[1]); p.d(x0 + 7, y, OUT); if ((y + k * 3 + v) % 6 === 0) p.d(x0 + 4, y, pal[1]); }
        const cap = snow ? ['#c4d4e6', '#ffffff', '#e6eef8'] : [pal[3], pal[4], pal[3]];
        for (let i = 1; i < 7; i++) p.d(x0 + i, yTop, OUT);
        for (let i = 0; i < 8; i++) { p.d(x0 + i, yTop + 1, i === 0 || i === 7 ? OUT : i < 4 ? cap[1] : cap[2]); p.d(x0 + i, yTop + 2, i === 0 || i === 7 ? OUT : cap[0]); }
        p.d(x0 + 2, yTop + 1, '#ffffff');
        if (yTop + 3 < 16) for (let i = 1; i < 7; i++) p.d(x0 + i, yTop + 3, pal[0]);
      }
      if (bot) { for (let y = 12; y < 16; y++) for (let i = 0; i < 16; i++) { const v0 = p.g(i, y); if (v0 >>> 24) p.d(i, y, y > 13 ? OUT : pal[0]); } }
      x.drawImage(p.can(), v * 16, 0);
    }
    return cv;
  };
  const prev = A.initPretty;
  A.initPretty = () => {
    prev();
    const T = A.tiles;
    T.cliff_r = cliff(['#2a1e30', '#4a3448', '#6a4c62', '#8c6a7e', '#b090a0']);
    T.cliff_g = cliff(['#262434', '#3e3c50', '#5c5a70', '#7e7c92', '#a6a4b8']);
    T.cliff_s = cliff(['#2a3448', '#465470', '#6a7c98', '#94a6c0', '#c4d2e4'], 1);
    T.dwall = cliff(['#221a2c', '#3a2e46', '#564666', '#766488', '#9a88ac']);
    T.dwall_r = cliff(['#2a141c', '#48242c', '#683a40', '#8a5458', '#ae7474']);
    T.dwall_i = cliff(['#14223a', '#22385a', '#34527e', '#4e74a2', '#7aa2c8'], 1);
    T.dwall_h = cliff(['#1a1230', '#2a1f48', '#3f3066', '#5b478a', '#8d76b8']);
    /* каменные столбы каньона — одиночные высокие колонны той же формы */
    const col = (pal, h) => { const p = P(14, h + 6); for (let y = 4; y < h + 4; y++) { const t = (y - 4) / h; p.d(1, y, OUT); p.d(2, y, pal[3]); p.d(3, y, pal[3]); for (let i = 4; i < 8; i++) p.d(i, y, pal[2]); p.d(8, y, pal[1]); p.d(9, y, pal[1]); p.d(10, y, pal[0]); p.d(11, y, OUT); if (y % 5 === 0) { for (let i = 2; i < 11; i++) p.d(i, y, pal[1]); } } for (let i = 1; i < 12; i++) { p.d(i, 2, OUT); p.d(i, 3, i < 6 ? pal[4] : pal[3]); } p.d(1, 3, OUT); p.d(11, 3, OUT); p.r(2, 4, 9, 1, pal[3]); p.d(3, 3, '#ffffff'); for (let i = 0; i < 13; i++) p.d(i, h + 4, i === 0 || i === 12 ? OUT : pal[0]); p.r(0, h + 5, 13, 1, OUT); return p.outline(OUT); };
    A.spr.spire0 = { c: col(['#2a1e30', '#4a3448', '#6a4c62', '#8c6a7e', '#b090a0'], 26).can(), w: 14, h: 32 };
    A.spr.spire1 = { c: col(['#3a2430', '#5a3a40', '#7c5450', '#a07464', '#c49a80'], 20).can(), w: 14, h: 26 };
  };
})();
/* Постройки: стены, окна, двери — в духе референса с деревянным домиком */
(() => {
  const A = G.Art, P = A.P, OUT = '#0d0b1a', H = G.hash;
  const WD = ['#3a2018', '#5e3624', '#84502e', '#a86e3c', '#cc9458'], ST = ['#2e2a3a', '#4a4658', '#6a6878', '#8e8c9a', '#b8b6c2'], LM = ['#5e584c', '#7e786a', '#a6a08c', '#c8c2aa', '#e6e2cc'];
  const MOSS = ['#3f7a2c', '#5a9a34', '#86c84a'];
  function topFace(p, pal, kind, v) { for (let y = 0; y < 10; y++) for (let x = 0; x < 16; x++) { let c = pal[3]; if (kind === 'wood') { c = (y % 5 === 4) ? pal[2] : pal[3]; if ((x * 3 + y * 7 + v) % 13 === 0) c = pal[2]; } else { if (y === 4 || (x + (y > 4 ? 4 : 0)) % 8 === 7) c = pal[2]; } if (y === 0) c = pal[4]; if (y === 9) c = pal[1]; p.d(x, y, c); } }
  function bricks(p, pal, y0, y1, v, moss) { for (let y = y0; y < y1; y++) { const row = Math.floor((y - y0) / 4), off = row % 2 ? 4 : 0; for (let x = 0; x < 16; x++) { const bx = (x + off) % 8, by = (y - y0) % 4; let c = pal[2]; if (H((x + off) >> 3, row, v + 3) < .35) c = pal[1]; if (by === 3 || bx === 7) c = pal[0]; else if (by === 0) c = pal[3]; else if (bx === 0) c = pal[3]; p.d(x, y, c); } } if (moss) for (let i = 0; i < 6; i++) { const x = Math.floor(H(i, v, 7) * 15), y = y0 + Math.floor(H(i, v, 8) * (y1 - y0 - 2)); p.d(x, y, MOSS[1]); p.d(x + 1, y, MOSS[2]); p.d(x, y + 1, MOSS[0]); } }
  function wall(kind, v, win) {
    const p = P(16, 26), pal = kind === 'wood' ? WD : kind === 'lime' ? LM : ST;
    topFace(p, pal, kind, v);
    if (kind === 'wood') {
      for (let y = 10; y < 22; y++) for (let x = 0; x < 16; x++) { let c = (x % 4 === 0) ? WD[1] : (x % 4 === 1 ? WD[3] : WD[2]); if (y === 15 || y === 16) c = y === 15 ? WD[3] : WD[0]; if (x === 0 || x === 15) c = WD[0]; p.d(x, y, c); }
      for (let x = 0; x < 16; x++) p.d(x, 10, WD[4]);
      bricks(p, ST, 22, 26, v);
    } else bricks(p, pal, 10, 25, v, kind === 'ruin'), p.r(0, 25, 16, 1, pal[0]);
    if (kind === 'ruin') for (let i = 0; i < 5; i++) { const x = Math.floor(H(i, v, 1) * 15); p.d(x, 0, MOSS[2]); p.d(x + 1, 0, MOSS[1]); p.d(x, 1, MOSS[1]); }
    if (win) {
      p.r(3, 11, 10, 9, OUT); p.r(4, 12, 8, 7, '#2a3a5e'); p.r(4, 12, 8, 2, '#4c78b4'); p.d(5, 13, '#a6dcff'); p.d(6, 12, '#a6dcff'); p.r(7, 12, 2, 7, WD[2]); p.r(4, 15, 8, 1, WD[2]);
      p.r(2, 19, 12, 3, OUT); p.r(3, 19, 10, 2, WD[3]); p.r(3, 19, 10, 1, WD[4]);
      for (const [x, c] of [[3, '#e8484e'], [5, '#ffd23e'], [7, '#ff8ab4'], [9, '#e8484e'], [11, '#ffffff']]) { p.d(x, 18, c); p.d(x + 1, 18, '#3f8a36'); }
    }
    return p.outline(OUT);
  }
  function door(open) {
    const p = P(16, 26); topFace(p, WD, 'wood', 1);
    p.r(0, 10, 16, 16, WD[1]); for (let y = 10; y < 26; y++) { p.d(0, y, WD[3]); p.d(15, y, WD[0]); }
    /* арка */
    for (let y = 11; y < 26; y++) for (let x = 2; x < 14; x++) { const dx = x - 7.5, dy = y - 15; if (y < 15 && dx * dx + dy * dy * 1.6 > 34) continue; p.d(x, y, open ? '#140c18' : (x % 3 === 0 ? WD[1] : WD[3])); }
    if (!open) { for (let x = 2; x < 14; x++) { p.d(x, 17, WD[1]); p.d(x, 22, WD[1]); } p.d(4, 17, '#6a6878'); p.d(11, 17, '#6a6878'); p.d(4, 22, '#6a6878'); p.d(11, 22, '#6a6878'); p.r(10, 19, 2, 2, '#f2c232'); p.d(10, 19, '#fff3a8'); }
    else { for (let y = 14; y < 26; y++) { p.d(2, y, WD[3]); p.d(3, y, WD[2]); } }
    return p.outline(OUT);
  }
  const prev = A.initPretty;
  A.initPretty = () => {
    prev();
    const S = (n, p) => { A.spr[n] = { c: p.can(), w: p.w, h: p.h }; };
    for (let v = 0; v < 2; v++) { S('wwall' + v, wall('wood', v)); S('swall' + v, wall('stone', v)); S('rwall' + v, wall('ruin', v + 3)); S('lwall' + v, wall('lime', v)); }
    S('wwin', wall('wood', 0, 1)); S('swin', wall('stone', 0, 1)); S('door_c', door(0)); S('door_o', door(1));
    /* черепица крыш: ряды плиток со светлой кромкой */
    const roof = pal => { const cv = document.createElement('canvas'); cv.width = 64; cv.height = 16; const x = cv.getContext('2d'); for (let v = 0; v < 4; v++) { const p = P(16, 16); for (let yy = 0; yy < 16; yy++) for (let xx = 0; xx < 16; xx++) { const row = yy >> 2, off = (row & 1) * 4, bx = (xx + off) % 8, by = yy % 4; let c = pal[2]; if (by === 3) c = pal[0]; else if (by === 0) c = pal[3]; else if (bx === 7) c = pal[1]; if (H((xx + off) >> 3, row, v) < .2 && by !== 3) c = pal[1]; p.d(xx, yy, c); } x.drawImage(p.can(), v * 16, 0); } return cv; };
    A.tiles.roof2 = roof(['#5a1a22', '#862a2e', '#ae4034', '#d0644a', '#ec9068']);
    A.tiles.roof3 = roof(['#1a2e4e', '#284676', '#36609a', '#4e82ba', '#7aa8d6']);
    A.tiles.roof4 = roof(['#241c3a', '#382c54', '#4c3e70', '#665690', '#8a7cb0']);
  };
})();
