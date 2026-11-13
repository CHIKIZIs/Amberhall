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
  /* перекраска готового холста функцией rc(hex) */
  const recolorCanvas = (cv, rc) => { const g = cv.getContext('2d'), d = g.getImageData(0, 0, cv.width, cv.height), memo = {};
    for (let i = 0; i < d.data.length; i += 4) { if (!d.data[i + 3]) continue; const k = (d.data[i] << 16) | (d.data[i + 1] << 8) | d.data[i + 2]; let v = memo[k]; if (!v) { v = memo[k] = hex2rgb(rc(rgb2hex(d.data[i], d.data[i + 1], d.data[i + 2]))); } d.data[i] = v[0]; d.data[i + 1] = v[1]; d.data[i + 2] = v[2]; }
    g.putImageData(d, 0, 0); return cv; };
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

  /* Скалы как на сцене с домиком автора: стена из каменных блоков, сверху нависает край травы.
     0–3 — середина, 4–7 — нижний ряд (тень у подножия), 8–11 — верхний ряд с краем травы/снега */
  function cliffSheet(pal, lip) {
    const cv = document.createElement('canvas'); cv.width = 16 * 12; cv.height = 16; const x = cv.getContext('2d');
    for (let v = 0; v < 12; v++) {
      const p = A.P(16, 16), seed = (v & 3) * 31 + 5, W = (xx, yy, c) => p.d(((xx % 16) + 16) % 16, yy, c);
      p.r(0, 0, 16, 16, pal[0]);
      let y0 = -((v * 3) % 5);
      for (let row = 0; y0 < 16; row++) {
        const bh = 6 + Math.floor(G.hash(row, seed, 3) * 3), off = Math.floor(G.hash(row, seed, 4) * 16);
        let bx = 0;
        while (bx < 16) {
          let bw = 7 + Math.floor(G.hash(bx, row + seed, 5) * 6); if (16 - bx - bw < 5) bw = 16 - bx;
          const tone = Math.floor(G.hash(bx, row + seed, 6) * 3), base = [2, 2, 3][tone], hb = bh - 1 - (G.hash(bx, row, seed) < .4 ? 1 : 0);
          for (let yy = 0; yy < hb; yy++) for (let xx = 0; xx < bw - 1; xx++) {
            const Y = y0 + yy; if (Y < 0 || Y > 15) continue;
            const cx = xx === 0 || xx === bw - 2, cy = yy === 0 || yy === hb - 1; if (cx && cy) continue; /* скруглённые углы */
            let c = pal[base];
            if (yy === 0 || (yy === 1 && (xx === 1 || xx === bw - 3))) c = pal[Math.min(4, base + 1)];
            else if (xx === 0 && yy < hb - 2) c = pal[Math.min(4, base + 1)];
            if (yy === hb - 1 || xx === bw - 2) c = pal[1];
            if (yy > 1 && yy < hb - 2 && G.hash(xx + bx, Y, seed + 9) < .05) c = pal[base - 1];
            W(off + bx + xx, Y, c);
          }
          bx += bw;
        }
        y0 += bh;
      }
      if (v >= 4 && v < 8) { for (let yy = 12; yy < 16; yy++) for (let xx = 0; xx < 16; xx++) if (yy >= 14 || G.hash(xx, yy, v) < .5) p.d(xx, yy, yy === 15 ? pal[0] : pal[1]); }
      if (v >= 8) {
        /* нависающий край: тёмная бахрома снизу, светлая кромка сверху */
        for (let xx = 0; xx < 16; xx++) {
          const d = 4 + Math.floor(G.hash(xx >> 1, v, 12) * 2) + (G.hash(xx, v, 13) < .3 ? 1 : 0);
          for (let yy = 0; yy < d; yy++) p.d(xx, yy, yy === 0 ? lip[3] : yy === d - 1 ? lip[0] : yy === d - 2 ? lip[1] : lip[2]);
          if (G.hash(xx, v, 14) < .2) p.d(xx, d, lip[0]);
          p.d(xx, d + (G.hash(xx, v, 14) < .2 ? 1 : 0), pal[0]);
        }
      }
      x.drawImage(p.can(), v * 16, 0);
    }
    return cv;
  }
  A.cliffSheet = cliffSheet;

  /* Ручные карты для того, на что у автора нет картинки — в том же стиле (цветной контур, 3–4 тона) */
  const MAPS = {
    cactus: { pal: { o: '#1a3418', a: '#2a5a26', b: '#3f8a34', c: '#6cb84a', d: '#a8dc6c', w: '#f6eecc', s: '#6a4a2a', S: '#8a6a40' }, rows: [
      '......oooo......',
      '.....obcddo.....',
      '.....obcwco.....',
      '.....obccco.....',
      '.oo..obcwco.....',
      'obco.obccco..oo.',
      'obwo.obccco.obco',
      'obcooobcwcoobwco',
      'obcccbbccco.obco',
      '.obbbbbcwcoobcco',
      '..oooobccbbbbbo.',
      '.....obcwcoooo..',
      '.....obccco.....',
      '.....obcwco.....',
      '.....obccco.....',
      '....oobccbbo....',
      '...osSobbbaSso..',
      '....ooooooooo...'] },
    dead: { pal: { o: '#2a1810', a: '#4a2e1e', b: '#6e4a30', c: '#946a46', d: '#b48a5e' }, rows: [
      '..o.........o.....o...',
      '.obo.......obo...obo..',
      '..obo.....obo...obo...',
      '...obo...obo...obo.o..',
      '....obo.obo...obooobo.',
      '.....obbbo...obbbbo...',
      '..o...obbo..obbo......',
      '.obo...obbooobo.......',
      '..oboo.obcbbbo........',
      '...obbbobcbo..........',
      '....ooobccbo..........',
      '.......obcbo..........',
      '.......obcdbo.........',
      '.......obcdbo.........',
      '.......obccbo.........',
      '......obbcdbo.........',
      '......obccdbbo........',
      '.....obbbcbbbbo.......',
      '....oaaobbbbaaao......',
      '....ooooooooooooo.....'] },
    palm: { pal: { o: '#14301e', G: '#1e5a32', g: '#2f8a3a', h: '#52b040', H: '#8ed84a', t: '#d8a868', T: '#a8784a', u: '#6e4a2e', y: '#7a4a24', Y: '#a86a34' }, rows: [
      '...........oooo...oooo..........',
      '........oooHHhhoooHHhhooo.......',
      '......ooHhhhggggoHhgggghhoo.....',
      '....ooHhhggooooggHgoooogghhoo...',
      '...oHhggoo....oghHgo....oogghho.',
      '..oHhgoo...ooohhggggooo...oogho.',
      '..ohgo...oohhhggGGgggghoo...ogo.',
      '..ogo...ohhggoyyoyyooGggho...o..',
      '..oo...ohggo.oYyyYyo..oGgho.....',
      '......ohgo...oyyooyo...oGgo.....',
      '......ogo.....oootTo....ogo.....',
      '......oo........otTo.....o......',
      '................otTuo...........',
      '................otTuo...........',
      '...............otTuo............',
      '...............otTuo............',
      '...............otTuo............',
      '..............otTTuo............',
      '..............otTuo.............',
      '..............otTuo.............',
      '..............otTTuo............',
      '..............otTTuo............',
      '.............otTTTuuo...........',
      '.............ooooooooo..........'] },
    shell: { pal: { o: '#6a3a30', w: '#fff2e4', p: '#f0a890', P: '#d07a68' }, rows: [
      '...oooo...',
      '..owwwwo..',
      '.owpwpwwo.',
      'owpwpwpwwo',
      'owPwPwPwPo',
      '.ooPPPPPo.',
      '...ooooo..'] }
  };
  /* ель поменьше: верх ели автора + её же ствол */
  /* убрать «усы» — тёмные пиксели, держащиеся на одном соседе */
  function dewhisker(cv) {
    const g = cv.getContext('2d'), w = cv.width, h = cv.height, d = g.getImageData(0, 0, w, h), o = d.data;
    for (let it = 0; it < 3; it++) { const kill = [];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; if (!o[i + 3] || o[i] + o[i + 1] + o[i + 2] > 200) continue;
        let n = 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < w && Y < h && o[(Y * w + X) * 4 + 3]) n++; }
        if (n <= 1) kill.push(i); }
      for (const i of kill) o[i + 3] = 0; }
    g.putImageData(d, 0, 0); return cv;
  }
  /* ель поменьше: верх ели автора (срез по стыку ярусов, где крона уже всего) + её же ствол */
  function pineCut(rc, frac, flip) {
    const full = dewhisker(A.refSprite('pine', rc, flip)), w = full.width, h = full.height, trunkH0 = 9, fd = full.getContext('2d').getImageData(0, 0, w, h).data;
    const width = y => { let a = w, b = -1; for (let x = 0; x < w; x++) if (fd[(y * w + x) * 4 + 3]) { a = Math.min(a, x); b = Math.max(b, x); } return b - a; };
    let tH = 0; while (tH < h - 1 && width(h - 1 - tH) <= 10) tH++;
    const trunkH = Math.max(5, Math.round(tH * (.35 + frac * .5)));
    let cut = Math.round((h - trunkH) * frac), best = 1e9; for (let y = cut - 4; y <= cut + 4; y++) { const v = width(y); if (v < best) { best = v; cut = y; } }
    const c = document.createElement('canvas'); c.width = w; c.height = cut + trunkH; const g = c.getContext('2d');
    g.drawImage(full, 0, h - trunkH, w, trunkH, 0, cut, w, trunkH);
    g.drawImage(full, 0, 0, w, cut, 0, 0, w, cut);
    const d = g.getImageData(0, 0, w, c.height), o = d.data, y = cut - 1;
    for (let yy = y; yy >= y - 1; yy--) for (let x = 0; x < w; x++) { const i = (yy * w + x) * 4, up = ((yy - 1) * w + x) * 4; if (o[i + 3] && !o[up + 3]) o[i + 3] = 0; }
    for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; if (o[i + 3]) { o[i] = 14; o[i + 1] = 28; o[i + 2] = 32; } }
    g.putImageData(d, 0, 0);
    const all = g.getImageData(0, 0, w, c.height).data; let a = w, b = 0; for (let yy = 0; yy < c.height; yy++) for (let x = 0; x < w; x++) if (all[(yy * w + x) * 4 + 3]) { a = Math.min(a, x); b = Math.max(b, x); }
    const out = document.createElement('canvas'); out.width = b - a + 1; out.height = c.height; out.getContext('2d').drawImage(c, -a, 0); return out;
  }

  /* масштаб по ближайшему пикселю; контур восстанавливается тёмным цветом */
  const TSIZES = [[.82, .82], [.66, .7], [.6, .82], [.86, .66], [.5, .55]];
  function nnScale(src, sx, sy) {
    const w = src.width, h = src.height, W2 = Math.round(w * sx), H2 = Math.round(h * sy), sd = src.getContext('2d').getImageData(0, 0, w, h).data;
    const c = document.createElement('canvas'); c.width = W2 + 2; c.height = H2 + 2; const g = c.getContext('2d'), d = g.createImageData(W2 + 2, H2 + 2), o = d.data;
    let dark = null, dl = 1e9;
    for (let i = 0; i < sd.length; i += 4) if (sd[i + 3]) { const l = sd[i] + sd[i + 1] + sd[i + 2]; if (l < dl) { dl = l; dark = [sd[i], sd[i + 1], sd[i + 2]]; } }
    const at = (x, y) => { const X = Math.min(w - 1, Math.floor((x + .5) / sx)), Y = Math.min(h - 1, Math.floor((y + .5) / sy)); return (Y * w + X) * 4; };
    for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) { const i = at(x, y), j = ((y + 1) * (W2 + 2) + x + 1) * 4; if (!sd[i + 3]) continue; o[j] = sd[i]; o[j + 1] = sd[i + 1]; o[j + 2] = sd[i + 2]; o[j + 3] = 255; }
    /* контур: каждый непрозрачный пиксель на краю — тёмный */
    const W3 = W2 + 2, H3 = H2 + 2, op = (x, y) => x >= 0 && y >= 0 && x < W3 && y < H3 && o[(y * W3 + x) * 4 + 3];
    const edge = []; for (let y = 0; y < H3; y++) for (let x = 0; x < W3; x++) if (op(x, y) && (!op(x - 1, y) || !op(x + 1, y) || !op(x, y - 1) || !op(x, y + 1))) edge.push((y * W3 + x) * 4);
    for (const j of edge) { o[j] = dark[0]; o[j + 1] = dark[1]; o[j + 2] = dark[2]; }
    g.putImageData(d, 0, 0); return c;
  }
  const fromMap = (k, flip) => { const m = MAPS[k], w = Math.max(...m.rows.map(r => r.length)), p = A.P(w, m.rows.length); m.rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const c = m.pal[r[x]]; if (c) p.d(flip ? w - 1 - x : x, y, c); } }); return p.can(); };

  const prev = A.initPretty;
  A.initPretty = () => {
    prev();
    if (!A.refSprite) return;
    A.tiles.cliff_g = cliffSheet(['#2e1820', '#5a2e34', '#7e4242', '#a25a4e', '#c47c5e'], ['#2f5e2c', '#3d7330', '#5a9638', '#86bc4a']);
    A.tiles.cliff_r = cliffSheet(['#33141c', '#62262c', '#8e3c38', '#b85a46', '#da8460'], ['#6a2a24', '#8e4030', '#b45e3c', '#d88a5a']);
    A.tiles.cliff_s = cliffSheet(['#1c2034', '#363c58', '#535c7c', '#76809e', '#9aa6c0'], ['#9aaccc', '#c6d4ea', '#e8f0fa', '#ffffff']);
    /* деревья: 0 — как у автора, 1 — зеркально, 2 — с плодами/цветами */
    const FRUIT = { oak: ['#5a0c16', '#d8303a', '#ff9a8a'], pinkt: ['#8a2a4a', '#fff0f4', '#ffffff'] };
    for (const k in TREES) {
      const rc = TREES[k];
      S(k + '0', R('tree', rc)); S(k + '1', R('tree', rc, true));
      const t2 = R('tree', rc, k !== 'oak');
      S(k + '2', FRUIT[k] ? dots(t2, 5, FRUIT[k], 7 + k.length, 90) : t2);
      /* другие размеры и формы: то же дерево автора, масштаб по ближайшему пикселю (без смешивания цветов) */
      const names = [k + '0', k + '1', k + '2'];
      TSIZES.forEach(([sx, sy], i) => { for (let f = 0; f < 2; f++) { let cv = nnScale(R('tree', rc, f === 1), sx, sy); if (FRUIT[k] && f === 0 && i < 2) cv = dots(cv, 3, FRUIT[k], 3 + i, 90); const n = k + '_s' + i + f; S(n, cv); names.push(n); } });
      if (G.OBJ[k]) G.OBJ[k].s = names;
    }
    for (const k in PINES) {
      const rc = PINES[k];
      const names = [];
      [[1, 0], [1, 1], [.72, 0], [.72, 1], [.5, 0], [.5, 1]].forEach(([fr, fl], i) => { let c = fr === 1 ? dewhisker(R('pine', rc, fl === 1)) : pineCut(rc, fr, fl === 1); if (k === 'spine') c = snowify(c, 2); S(k + i, c); names.push(k + i); });
      if (G.OBJ[k]) G.OBJ[k].s = names;
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
    /* камыш у воды — тот же травяной куст, желтее и выше по тону */
    { const rc = recol(LEAF, (h, s, l) => [h - 22, s * .8, l * 1.04]); S('reed0', R('clump', rc)); S('reed1', R('clump', rc, true)); }
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
    S('cactus0', fromMap('cactus')); S('cactus1', fromMap('cactus', true));
    S('dead0', fromMap('dead')); S('dead1', fromMap('dead', true));
    S('palm0', fromMap('palm')); S('palm1', fromMap('palm', true));
    S('shell', fromMap('shell'));
    /* каменные столбы каньона — высокий камень автора, перекрашенный в красный */
    { const red = recol(() => true, (h, s, l) => inHue(h, 70, 170) ? [h, s, l] : [12, Math.min(.5, s + .22), l * .95]); S('spire0', R('rk0', red)); S('spire1', R('rk0', red, true)); }
    /* упавшие брёвна автора */
    for (let i = 0; i < 4; i++) S('flog' + i, R('log' + i));
  };
})();
