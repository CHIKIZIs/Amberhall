'use strict';
/* Мир из спрайтов автора: деревья, ели, кусты, камни, брёвна, пни и трава берутся попиксельно
   из присланных картинок (refsprites.js). Разновидности — перекраска тех же пикселей, без перерисовки. */
(() => {
  const A = G.Art;
  const hex2rgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const rgb2hex = (r, g, b) => '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const toHsl = h => {
    let [r, g, b] = hex2rgb(h).map(v => v / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let hh = 0, s = 0;
    if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); hh = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; hh *= 60; }
    return [hh, s, l];
  };
  const fromHsl = (h, s, l) => {
    h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(1, s)); l = Math.max(0, Math.min(1, l));
    const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
    const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return rgb2hex((r + m) * 255, (g + m) * 255, (b + m) * 255);
  };
  A.hsl = { toHsl, fromHsl };
  const inHue = (h, a, b) => a <= b ? h >= a && h <= b : h >= a || h <= b;
  /* перекраска части палитры: sel(h,s,l) выбирает цвета, f(h,s,l) → [h,s,l] */
  const recol = (sel, f) => c => { const [h, s, l] = toHsl(c); if (l < .1 || !sel(h, s, l)) return c; const o = f(h, s, l); return fromHsl(o[0], o[1], o[2]); };
  const chain = (...fs) => c => fs.reduce((v, f) => f(v), c);
  const S = (n, cv) => { A.spr[n] = { c: cv, w: cv.width, h: cv.height }; };
  const R = (name, rc, flip) => A.refSprite(name, rc, flip);

  /* --- операции над готовым холстом --- */
  const data = cv => cv.getContext('2d').getImageData(0, 0, cv.width, cv.height);
  const lumAt = (d, i) => d.data[i] * .3 + d.data[i + 1] * .59 + d.data[i + 2] * .11;
  /* снег на верхних гранях: первые 1–2 непрозрачных пикселя под пустотой/контуром */
  function snowify(cv, depth) {
    const x = cv.getContext('2d'), d = data(cv), w = cv.width, h = cv.height, A_ = (xx, yy) => yy < 0 || d.data[(yy * w + xx) * 4 + 3] === 0;
    const marks = [];
    for (let yy = 1; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
      const i = (yy * w + xx) * 4; if (d.data[i + 3] === 0 || lumAt(d, i) < 40) continue;
      for (let k = 1; k <= 2; k++) { const j = ((yy - k) * w + xx) * 4; if (yy - k < 0) break; const above = d.data[j + 3] === 0 || (lumAt(d, j) < 40 && A_(xx, yy - k - 1)); if (above) { if (k <= depth) marks.push([xx, yy, k]); break; } if (lumAt(d, j) >= 40) break; }
    }
    for (const [xx, yy, k] of marks) { x.fillStyle = k === 1 ? '#f2f6fc' : '#c6d4ea'; x.fillRect(xx, yy, 1, 1); }
    return cv;
  }
  /* ягоды/яблоки/цветы на светлых местах кроны */
  function dots(cv, n, col, seed, minL) {
    const x = cv.getContext('2d'), d = data(cv), w = cv.width, h = cv.height, r = G.rng(seed), cand = [];
    for (let yy = 2; yy < h * .8; yy++) for (let xx = 2; xx < w - 2; xx++) {
      let ok = true; for (let a = -1; a <= 2 && ok; a++) for (let b = -1; b <= 2; b++) { const i = ((yy + b) * w + xx + a) * 4; if (d.data[i + 3] === 0 || lumAt(d, i) < 50) { ok = false; break; } }
      if (ok && lumAt(d, (yy * w + xx) * 4) > (minL || 0)) cand.push([xx, yy]);
    }
    const [c0, c1, c2] = col, used = [];
    for (let t = 0; t < n * 30 && used.length < n && cand.length; t++) {
      const [xx, yy] = cand[Math.floor(r() * cand.length)]; if (used.some(([u, v]) => Math.abs(u - xx) < 5 && Math.abs(v - yy) < 5)) continue; used.push([xx, yy]);
      x.fillStyle = c0; x.fillRect(xx - 1, yy, 1, 2); x.fillRect(xx, yy + 2, 2, 1); x.fillRect(xx + 2, yy, 1, 2); x.fillRect(xx, yy - 1, 2, 1);
      x.fillStyle = c1; x.fillRect(xx, yy, 2, 2); x.fillStyle = c2; x.fillRect(xx, yy, 1, 1);
    }
    return cv;
  }
  /* вкрапления руды внутри камня */
  function ore(cv, n, col, seed) {
    const x = cv.getContext('2d'), d = data(cv), w = cv.width, h = cv.height, r = G.rng(seed), cand = [];
    for (let yy = 3; yy < h - 3; yy++) for (let xx = 3; xx < w - 3; xx++) {
      let ok = true; for (let a = -2; a <= 3 && ok; a++) for (let b = -2; b <= 3; b++) { const i = ((yy + b) * w + xx + a) * 4; if (d.data[i + 3] === 0 || lumAt(d, i) < 45) { ok = false; break; } }
      if (ok) cand.push([xx, yy]);
    }
    const used = [];
    for (let t = 0; t < n * 40 && used.length < n && cand.length; t++) {
      const [xx, yy] = cand[Math.floor(r() * cand.length)]; if (used.some(([u, v]) => Math.abs(u - xx) < 4 && Math.abs(v - yy) < 4)) continue; used.push([xx, yy]);
      const big = r() < .5;
      x.fillStyle = col[0]; x.fillRect(xx, yy + 1, big ? 3 : 2, 1); x.fillRect(xx + (big ? 2 : 1), yy, 1, 1);
      x.fillStyle = col[1]; x.fillRect(xx, yy, big ? 2 : 1, 1); if (big) x.fillRect(xx + 1, yy - 1, 1, 1);
      x.fillStyle = col[2]; x.fillRect(xx, yy, 1, 1);
    }
    return cv;
  }
  /* вписать в холст большего размера (для одинаковой ширины вариантов) */
  const pad = (cv, w, h) => { const c = document.createElement('canvas'); c.width = Math.max(w, cv.width); c.height = Math.max(h, cv.height); c.getContext('2d').drawImage(cv, (c.width - cv.width) >> 1, c.height - cv.height); return c; };

  /* --- перекраски --- */
  const LEAF = (h, s, l) => inHue(h, 60, 200) && s > .15, TRUNK = (h, s) => inHue(h, 270, 40) && s > .1;
  const NEEDLE = (h, s) => inHue(h, 140, 250) && s > .12, BARK = (h, s) => inHue(h, 0, 50) && s > .1;
  const hueTo = (target, k, sm, lm, la) => (h, s, l) => [target + (h - 130) * k, s * sm, l * lm + (la || 0)];
  const leaves = f => recol(LEAF, f), trunk = f => recol(TRUNK, f);
  const TREES = {
    oak: null,
    doak: leaves((h, s, l) => [h + 12, s * .95, l * .78]),
    teal: leaves(hueTo(165, .35, 1, .95, .02)),
    pinkt: chain(leaves(hueTo(338, .25, .95, 1.02, .04)), trunk((h, s, l) => [h - 10, s * .9, l * 1.05])),
    crim: chain(leaves(hueTo(350, .25, 1, .8)), trunk((h, s, l) => [h, s, l * .85])),
    birch: chain(leaves((h, s, l) => [h - 18, s * .95, l * 1.06 + .02]), trunk((h, s, l) => [28, .16, .3 + l * .75]))
  };
  const PINES = {
    tpine: null,
    pine: recol(NEEDLE, (h, s, l) => [145 + (h - 195) * .3, s * .85, l * .92]),
    spine: recol(NEEDLE, (h, s, l) => [165 + (h - 195) * .3, s * .6, l * .95]),
    ppine: recol(NEEDLE, (h, s, l) => [330 + (h - 195) * .3, s * .85, l * .95])
  };
  const BUSHC = {
    green: null,
    pink: recol(LEAF, (h, s, l) => [335 + (h - 140) * .3, s * 1.05, l * 1.02]),
    crim: recol(LEAF, (h, s, l) => [348 + (h - 140) * .3, s, l * .85]),
    dry: recol(LEAF, (h, s, l) => [42 + (h - 140) * .2, s * .7, l * 1.02]),
    snow: recol(LEAF, (h, s, l) => [175, s * .45, l * 1.02])
  };
  const GRASSC = { g: null, p: recol(LEAF, (h, s, l) => [335 + (h - 100) * .25, s * .9, l]), d: recol(LEAF, (h, s, l) => [45 + (h - 100) * .2, s * .65, l * 1.05]) };
  const ROCKC = {
    stone: null,
    gran: recol(() => true, (h, s, l) => [h > 200 || h < 20 ? 345 : 15, Math.min(.35, s + .12), l * .92]),
    lime: recol(() => true, (h, s, l) => [42, s * .55, Math.min(.92, l * 1.18 + .04)]),
    snow: recol(() => true, (h, s, l) => inHue(h, 70, 170) ? [h, s, l] : [215, s * .6 + .05, l * 1.05]),
    ice: recol(() => true, (h, s, l) => [200, Math.min(.75, s + .4), Math.min(.9, l * 1.15 + .05)]),
    star: recol(() => true, (h, s, l) => [262, Math.min(.6, s + .3), l * .7])
  };
  const ORE = { coal: ['#0e0c16', '#2c2a38', '#6a6878'], copper: ['#6a2a10', '#de7a30', '#ffd08a'], iron: ['#4a2e26', '#c89a80', '#f6e2d0'], gold: ['#6a440e', '#ecb92e', '#fff3a8'], star: ['#3a0e6a', '#c06af0', '#ffe0ff'] };

  const prev = A.initPretty;
  A.initPretty = () => {
    prev();
    if (!A.refSprite) return;
    /* деревья: 0 — как у автора, 1 — зеркально, 2 — с плодами/цветами */
    const FRUIT = { oak: ['#5a0c16', '#d8303a', '#ff9a8a'], pinkt: ['#8a2a4a', '#fff0f4', '#ffffff'] };
    for (const k in TREES) {
      const rc = TREES[k];
      S(k + '0', R('tree', rc)); S(k + '1', R('tree', rc, true));
      const t2 = R('tree', rc, k !== 'oak');
      S(k + '2', FRUIT[k] ? dots(t2, 5, FRUIT[k], 7 + k.length, 90) : t2);
    }
    for (const k in PINES) {
      const rc = PINES[k];
      for (let i = 0; i < 2; i++) { let c = R('pine', rc, i === 1); if (k === 'spine') c = snowify(c, 2); S(k + i, c); }
    }
    /* пень автора */
    S('stump', R('stump')); S('stump_s', snowify(R('stump'), 2));
    /* кусты: два гладких и два узорчатых */
    S('bush0', R('bush0')); S('bush1', R('bush1'));
    S('berry0', R('bush2')); S('berry1', dots(R('bush2'), 4, ['#4a0814', '#d8283c', '#ff9aa4'], 3, 60));
    S('pbush', R('bush0', BUSHC.pink)); S('pberry0', R('bush3', BUSHC.crim)); S('pberry1', dots(R('bush3', BUSHC.crim), 4, ['#0e2a5a', '#3a9ae0', '#d6f6ff'], 5, 40));
    S('dbush', R('bush1', BUSHC.dry)); S('sbush', snowify(R('bush3', BUSHC.snow), 2));
    /* высокая трава — травяной куст автора; второй кадр — зеркальный (лёгкое шевеление) */
    for (const [k, rc] of [['tgrass', GRASSC.g], ['pgrass', GRASSC.p], ['dgrass', GRASSC.d]]) { S(k + '0', R('clump', rc)); S(k + '1', R('clump', rc, true)); }
    /* камни */
    S('rock0', R('rk2')); S('rock1', R('rk3')); S('rock2', R('rk1'));
    S('granite0', R('rk2', ROCKC.gran, true)); S('granite1', R('rk0', ROCKC.gran));
    S('lime0', R('rk3', ROCKC.lime)); S('lime1', R('rk2', ROCKC.lime, true));
    S('coalr', ore(R('rk2'), 4, ORE.coal, 1)); S('copperr', ore(R('rk2', null, true), 4, ORE.copper, 2));
    S('ironr', ore(R('rk2', ROCKC.gran), 4, ORE.iron, 3)); S('goldr', ore(R('rk2', null, true), 4, ORE.gold, 4));
    S('srock', snowify(R('rk2', ROCKC.snow), 2)); S('sironr', snowify(ore(R('rk2', ROCKC.snow, true), 4, ORE.iron, 5), 1)); S('sgoldr', snowify(ore(R('rk2', ROCKC.snow), 4, ORE.gold, 6), 1));
    S('icer', R('rk1', ROCKC.ice)); S('meteor', ore(R('rk2', ROCKC.star), 5, ORE.star, 7));
    S('pebble', R('mrock'));
    /* большие скалы из набора автора */
    for (let i = 0; i < 7; i++) S('crag' + i, R('rs' + i));
    /* упавшие брёвна автора */
    for (let i = 0; i < 4; i++) S('flog' + i, R('log' + i));
  };
})();
