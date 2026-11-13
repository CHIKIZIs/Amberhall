'use strict';
/* Art: процедурный генератор Pixel Art. Все спрайты рисуются кодом при запуске и складываются в атласы. */
(() => {
  const TS = 16, H = G.hash;
  const cc = {};
  const C = hex => {
    let v = cc[hex]; if (v !== undefined) return v;
    let s = hex.slice(1); if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    const r = parseInt(s.slice(0, 2), 16), g = parseInt(s.slice(2, 4), 16), b = parseInt(s.slice(4, 6), 16);
    const a = s.length >= 8 ? parseInt(s.slice(6, 8), 16) : 255;
    return cc[hex] = ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
  };
  const h2 = n => (n < 16 ? '0' : '') + n.toString(16);
  const rgb = hex => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return '#' + h2(Math.round(A[0] + (B[0] - A[0]) * t)) + h2(Math.round(A[1] + (B[1] - A[1]) * t)) + h2(Math.round(A[2] + (B[2] - A[2]) * t)); };
  const dark = (c, t) => mix(c, '#140f26', t), lite = (c, t) => mix(c, '#fff6dc', t);
  const OUT = '#0d0b1a';

  /* Палитры: от тёмного к светлому */
  const PAL = {
    grass: ['#2c4f24', '#3d7330', '#5a9638', '#7fb446', '#a8d062'],
    dgrass: ['#22402a', '#2f5e32', '#457c38', '#649a42', '#8cbc54'],
    pink: ['#5a1630', '#8a2440', '#b43a52', '#d85e6a', '#f08a8a'],
    sand: ['#c98f5e', '#e2ae78', '#f2c894', '#fbdcae', '#fff0cc'],
    dirt: ['#6e3e2a', '#8e5236', '#a8663f', '#c07e52', '#d89a6a'],
    red: ['#5a2c2c', '#7a3e36', '#96503e', '#b0684a', '#cc8860'],
    snow: ['#9fb8d6', '#c6d9ec', '#e4eef8', '#f6fbff', '#ffffff'],
    ice: ['#5aa6d2', '#83c6e8', '#aee0f4', '#d6f3fb', '#f2fdff'],
    stone: ['#3a3446', '#5a5466', '#7c7888', '#a09ca8', '#c8c6cc'],
    granite: ['#4a2f3a', '#6e4748', '#946458', '#b98a72', '#dbb596'],
    lime: ['#7a7468', '#a09a88', '#c4bea6', '#e0dcc4', '#f6f2e0'],
    dng: ['#4a3640', '#6a4c52', '#8a6866', '#a8857a', '#c4a490'],
    col: ['#2a2238', '#40344e', '#5a4a68', '#7a6888', '#9a8aa8'],
    wood: ['#4a2d22', '#6b4530', '#8f6240', '#b38655', '#d2aa72'],
    trunk: ['#3a2428', '#5a3a30', '#7a5038', '#9a6c46', '#b88a5c'],
    oak: ['#2a5a30', '#3f8a36', '#62ae3c', '#96d04a', '#d0f070'],
    doak: ['#1c3a36', '#24523c', '#2f6e40', '#3f8a44', '#5aa64c'],
    teal: ['#1a4a5a', '#1f6a72', '#2a9090', '#3fb8a8', '#7ae0c0'],
    pine: ['#1c3a36', '#24523c', '#2f6e40', '#3f8a44', '#5aa64c'],
    tpine: ['#16343e', '#1c4a54', '#25666a', '#318880', '#52ac98'],
    ppine: ['#4a1040', '#7a1a58', '#a82868', '#d04078', '#f06a90'],
    pinkt: ['#8a1a50', '#c02a62', '#e84a78', '#ff7e96', '#ffb8b8'],
    crim: ['#5a1436', '#8c1f48', '#c0325a', '#e75f72', '#ff9f93'],
    palm: ['#1f5a3a', '#2f7d44', '#4ba24f', '#7cc85e', '#b4e67a'],
    gold: ['#8a5a14', '#c08a1e', '#ecb92e', '#ffdc58', '#fff3a8'],
    iron: ['#4b3a36', '#7a5c50', '#a88672', '#c9ad98', '#e8d8c8'],
    copper: ['#7a3414', '#b0521c', '#de7a30', '#f5a554', '#ffd08a'],
    coal: ['#0f0e16', '#1c1b26', '#2c2b38', '#44434f', '#62616e'],
    crg: ['#1f6b2a', '#3a9c30', '#6cd43a', '#b0f55a', '#eaffb0'],
    crp: ['#7a1f8a', '#b03ac0', '#e06af0', '#f5a6ff', '#ffe0ff'],
    crb: ['#1f4f9c', '#3a7ed4', '#62b0f5', '#a6dcff', '#e6f8ff'],
    star: ['#221c44', '#3b3270', '#6a52b8', '#a583f5', '#e0ccff'],
    bone: ['#8d8570', '#b9b29a', '#ddd8c4', '#f2efe2', '#ffffff'],
    fire: ['#b3261e', '#e5541f', '#ff8a24', '#ffc23e', '#fff0a0'],
    thatch: ['#7a5a26', '#a37c33', '#c9a044', '#e3c35e', '#f5e08a'],
    tile: ['#3a2a4a', '#54406a', '#6e5a8a', '#8a78a8', '#b0a0c8'],
    rtile: ['#6a1f26', '#963030', '#c0463a', '#de6a4c', '#f29a6c'],
    cloth: ['#8a8370', '#b5ae98', '#d9d3be', '#efeada', '#ffffff'],
    moss: ['#3a6a2c', '#5a9a34', '#86c84a'],
  };
  G.PAL = PAL;

  /* Painter: рисование в буфер Uint32, затем один putImageData */
  class Pnt {
    constructor(w, h) { this.w = w; this.h = h; this.b = new Uint32Array(w * h); }
    d(x, y, c) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.b[y * this.w + x] = C(c); return this; }
    g(x, y) { x |= 0; y |= 0; return (x >= 0 && y >= 0 && x < this.w && y < this.h) ? this.b[y * this.w + x] : 0; }
    r(x, y, w, h, c) { x = Math.round(x); y = Math.round(y); const v = C(c); for (let j = Math.max(0, y); j < Math.min(this.h, y + h); j++) for (let i = Math.max(0, x); i < Math.min(this.w, x + w); i++) this.b[j * this.w + i] = v; return this; }
    l(x0, y0, x1, y1, c) {
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx - dy;
      for (let n = 0; n < 400; n++) { this.d(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 > -dy) { e -= dy; x0 += sx; } if (e2 < dx) { e += dx; y0 += sy; } }
      return this;
    }
    e(cx, cy, rx, ry, c) { for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) { const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry; if (dx * dx + dy * dy <= 1) this.d(x, y, c); } return this; }
    /* Объёмная «клякса» из эллипсов с освещением сверху-слева и зернистой текстурой */
    blob(cs, pal, o) {
      o = o || {}; const seed = o.seed || 0, nz = (o.noise == null ? 0.22 : o.noise) * 0.25, flatK = o.flat || 4, lx = -0.5, ly = -0.68, lz = 0.54, n = pal.length;
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const c of cs) { const rx = c[2], ry = c[3] || c[2]; x0 = Math.min(x0, c[0] - rx); x1 = Math.max(x1, c[0] + rx); y0 = Math.min(y0, c[1] - ry); y1 = Math.max(y1, c[1] + ry); }
      for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) {
        let best = -1, bx = 0, by = 0;
        for (const c of cs) { const rx = c[2], ry = c[3] || c[2], dx = (x + .5 - c[0]) / rx, dy = (y + .5 - c[1]) / ry, hh = 1 - dx * dx - dy * dy; if (hh > best) { best = hh; bx = dx; by = dy; } }
        if (best < 0) continue;
        let v = (bx * lx + by * ly + Math.sqrt(best) * lz) * 0.5 + 0.5;
        v = Math.floor(v * flatK + .5) / flatK;
        v += (H(x, y, seed) - .5) * nz;
        this.d(x, y, pal[G.clamp(Math.floor(v * n), 0, n - 1)]);
      }
      return this;
    }
    outline(c) {
      const w = this.w, h = this.h, b = this.b, v = C(c || OUT), add = [];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (b[y * w + x] >>> 24) continue;
        if ((x > 0 && b[y * w + x - 1] >>> 24 > 200) || (x < w - 1 && b[y * w + x + 1] >>> 24 > 200) || (y > 0 && b[(y - 1) * w + x] >>> 24 > 200) || (y < h - 1 && b[(y + 1) * w + x] >>> 24 > 200)) add.push(y * w + x);
      }
      for (const i of add) b[i] = v; return this;
    }
    st(p, x, y) { for (let j = 0; j < p.h; j++) for (let i = 0; i < p.w; i++) { const v = p.b[j * p.w + i]; if (v >>> 24) { const X = x + i, Y = y + j; if (X >= 0 && Y >= 0 && X < this.w && Y < this.h) this.b[Y * this.w + X] = v; } } return this; }
    flip() { const p = new Pnt(this.w, this.h); for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) p.b[y * this.w + x] = this.b[y * this.w + this.w - 1 - x]; return p; }
    tint(c, t) { const B = rgb(c); for (let i = 0; i < this.b.length; i++) { const v = this.b[i]; if (!(v >>> 24)) continue; const r = v & 255, g = (v >> 8) & 255, b = (v >> 16) & 255; this.b[i] = ((v & 0xff000000) | (Math.round(b + (B[2] - b) * t) << 16) | (Math.round(g + (B[1] - g) * t) << 8) | Math.round(r + (B[0] - r) * t)) >>> 0; } return this; }
    can() { const c = document.createElement('canvas'); c.width = this.w; c.height = this.h; const x = c.getContext('2d'); const im = x.createImageData(this.w, this.h); new Uint32Array(im.data.buffer).set(this.b); x.putImageData(im, 0, 0); return c; }
  }
  const P = (w, h) => new Pnt(w, h);

  const A = G.Art = { spr: {}, tiles: {}, C, mix, dark, lite, Pnt, PAL, OUT };
  const S = (name, p, o) => { A.spr[name] = Object.assign({ c: p.can ? p.can() : p, w: p.w || p.width, h: p.h || p.height }, o || {}); return A.spr[name]; };

  /* ---------- ТАЙЛЫ ЗЕМЛИ ---------- */
  function tex(style, pal, seed) {
    const p = P(16, 16), h = (x, y, k) => H(x, y, seed * 7 + (k || 0)), lush = style === 'lush';
    p.r(0, 0, 16, 16, style === 'snow' ? pal[3] : pal[2]);
    const pos = i => [1 + Math.floor(h(i, 1, 9) * 12), 2 + Math.floor(h(i, 2, 9) * 11)];
    if (style === 'grass' || lush) {
      /* плотные пучки травинок (веерки) со светлыми кончиками и тенью; рисуются с переносом — тайл бесшовный */
      p.r(0, 0, 16, 16, pal[1]);
      for (let k = 0; k < 6; k++) { const x = Math.floor(h(k, 11, 3) * 16), y = Math.floor(h(k, 12, 3) * 16); p.d(x, y, pal[0]); p.d((x + 1) & 15, y, pal[0]); }
      const W = (x, y, c) => p.d(((x % 16) + 16) % 16, ((y % 16) + 16) % 16, c);
      const tuft = (x, y, big) => {
        W(x + 1, y + 4, pal[0]); W(x + 2, y + 4, pal[0]); W(x + 3, y + 4, pal[0]);
        W(x, y + 3, pal[1]); W(x + 1, y + 3, pal[2]); W(x + 2, y + 3, pal[2]); W(x + 3, y + 3, pal[2]); W(x + 4, y + 3, pal[1]);
        W(x, y + 2, pal[2]); W(x + 1, y + 2, pal[3]); W(x + 2, y + 2, pal[2]); W(x + 3, y + 2, pal[3]); W(x + 4, y + 2, pal[2]);
        W(x, y + 1, pal[3]); W(x + 2, y + 1, pal[3]); W(x + 4, y + 1, pal[3]);
        if (big) { W(x + 1, y, pal[4]); W(x + 3, y, pal[4]); W(x - 1, y + 2, pal[3]); W(x + 5, y + 2, pal[3]); } else { W(x, y, pal[4]); W(x + 4, y, pal[4]); }
      };
      const pts = [];
      for (let gy = 0; gy < 16; gy += 4) for (let gx = 0; gx < 16; gx += 5) pts.push([gx + ((gy >> 2) & 1) * 2 + Math.floor(h(gx, gy, 5) * 3) - 1, gy + Math.floor(h(gx, gy, 6) * 2)]);
      pts.sort((a, b) => a[1] - b[1]);
      for (const [x, y] of pts) tuft(x, y, h(x, y, 8) < (lush ? .6 : .35));
      if (lush && seed % 3 === 1) { const x = 3 + Math.floor(h(1, 1, 7) * 9), y = 3 + Math.floor(h(2, 2, 7) * 9); p.d(x, y, '#f4f0e0'); p.d(x + 1, y, '#f4f0e0'); p.d(x, y + 1, '#f4f0e0'); p.d(x + 1, y + 1, '#ecc23c'); }
    } else if (style === 'sand' || style === 'dirt') {
      for (let i = 0; i < 3; i++) { const [x, y] = pos(i); p.d(x, y, pal[1]); if (i === 0) p.d(x + 1, y, pal[1]); }
      { const [x, y] = pos(5); p.d(x, y, pal[3]); p.d(x + 1, y, pal[3]); if (seed % 3 === 0) { p.d(x + 5, y + 2, pal[0]); p.d(x + 6, y + 2, pal[1]); } }
    } else if (style === 'red') {
      for (let i = 0; i < 2; i++) { let [x, y] = pos(i); for (let k = 0; k < 4; k++) { p.d(x, y, pal[1]); if (h(i, k, 3) < .5) x++; else y++; } }
      { const [x, y] = pos(5); p.r(x, y, 3, 2, pal[3]); p.d(x + 3, y + 1, pal[3]); }
    } else if (style === 'snow') {
      for (let i = 0; i < 2; i++) { const [x, y] = pos(i); p.d(x, y, pal[2]); p.d(x + 1, y, pal[2]); p.d(x + 1, y + 1, pal[1]); }
      { const [x, y] = pos(5); p.d(x, y, pal[4]); }
    } else if (style === 'ice') {
      for (let i = 0; i < 2; i++) { const [x, y] = pos(i); p.l(x, y + 3, x + 3, y, pal[3]); } { const [x, y] = pos(5); p.d(x, y, pal[4]); p.d(x + 2, y + 2, pal[1]); }
    }
    return p;
  }
  /* Плиты, доски и т.п. — «рукотворные» покрытия */
  function slab(kind, pal, seed) {
    const p = P(16, 16), h = (x, y, k) => H(x, y, seed * 11 + (k || 0));
    if (kind === 'wood') {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const row = y >> 2, off = (row * 7 + seed * 3) % 16; let c = pal[2 + ((row + seed) & 1 ? 0 : 1)]; if (y % 4 === 3) c = pal[0]; else if ((x + off) % 16 === 0) c = pal[0]; else if (h(x >> 2, row) < .2 && y % 4 === 1) c = pal[1]; p.d(x, y, c); }
    } else if (kind === 'bridge') {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { let c = pal[2 + ((x >> 2) & 1)]; if (x % 4 === 3) c = pal[0]; if (y === 0 || y === 15) c = pal[1]; if (y === 1 || y === 14) c = pal[4]; p.d(x, y, c); }
    } else if (kind === 'flag' || kind === 'ruin' || kind === 'dfloor' || kind === 'cobble' || kind === 'found') {
      const base = kind === 'dfloor' ? 1 : 2;
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const row = y >> 3, off = row ? 4 : 0, bx = ((x + off) >> 3), edge = (y % 8 === 7) || ((x + off) % 8 === 7);
        let c = pal[base + (h(bx, row, 2) < .35 ? 1 : 0)];
        if (h(x, y) < .08) c = pal[base - 1 + (h(x, y, 4) < .5 ? 0 : 2)];
        if (edge) c = pal[base - 1 > 0 ? base - 2 : 0];
        else if ((y % 8 === 0 || (x + off) % 8 === 0) && kind !== 'dfloor') c = pal[base + 1];
        p.d(x, y, c);
      }
      if (kind === 'ruin') for (let i = 0; i < 9; i++) { const x = Math.floor(h(i, 1, 6) * 16), y = Math.floor(h(i, 2, 6) * 16); if (h(i, 3, 6) < .7) { p.d(x, y, PAL.moss[1]); p.d(x + 1, y, PAL.moss[0]); if (h(i, 5, 6) < .5) p.d(x, y + 1, PAL.moss[2]); } }
      if ((kind === 'dfloor' || kind === 'ruin') && seed % 3 === 0) { let x = 3 + (seed % 5), y = 2; for (let i = 0; i < 7; i++) { p.d(x, y, pal[0]); x += h(i, 1, 1) < .5 ? 1 : 0; y += 1; } }
    }
    return p;
  }
  function waterTile(pal, f, deep) {
    const p = P(16, 16); p.r(0, 0, 16, 16, pal[deep ? 0 : 1]);
    for (let i = 0; i < 2; i++) { const x = (2 + i * 9 + f * 2 + (deep ? 3 : 0)) % 14, y = 3 + i * 8 + (deep ? 2 : 0); p.r(x, y, 3 - (f % 2), 1, pal[deep ? 1 : 2]); }
    return p;
  }

  /* Наложения краёв: 16 комбинаций сторон (N=1,E=2,S=4,W=8) + 16 комбинаций внутренних углов (NE=1,SE=2,SW=4,NW=8) */
  function edgeSet(base, edgeCol, foam) {
    const cv = document.createElement('canvas'); cv.width = 16 * 16; cv.height = 32 * (foam ? 2 : 1);
    const cx = cv.getContext('2d');
    const dep = (side, i) => 2 + Math.floor(H(i >> 1, side, 5) * 3);
    for (let f = 0; f < (foam ? 2 : 1); f++) for (let k = 0; k < 2; k++) for (let m = 1; m < 16; m++) {
      const p = P(16, 16), ext = foam ? 3 + f : 0;
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        let bd = -99;
        if (!k) {
          if (m & 1) bd = Math.max(bd, dep(0, x) + ext - y);
          if (m & 2) bd = Math.max(bd, dep(1, y) + ext - (15 - x));
          if (m & 4) bd = Math.max(bd, dep(2, x) + ext - (15 - y));
          if (m & 8) bd = Math.max(bd, dep(3, y) + ext - x);
        } else {
          const R = 3.4 + ext, q = (cxx, cyy) => { bd = Math.max(bd, Math.ceil(R - Math.hypot(x + .5 - cxx, y + .5 - cyy))); };
          if (m & 1) q(16, 0); if (m & 2) q(16, 16); if (m & 4) q(0, 16); if (m & 8) q(0, 0);
        }
        if (bd <= 0) continue;
        if (foam) { if (bd >= ext) p.d(x, y, edgeCol); else if (bd > 1 || H(x + f * 3, y + f, 3) < .6) p.d(x, y, base); }
        else p.b[y * 16 + x] = bd === 1 && edgeCol ? C(edgeCol) : base.b[y * 16 + x];
      }
      cx.drawImage(p.can(), m * 16, k * 16 + f * 32);
    }
    return cv;
  }

  function buildTiles() {
    const T = A.tiles, sheet = (list) => { const cv = document.createElement('canvas'); cv.width = list.length * 16; cv.height = 16; const x = cv.getContext('2d'); list.forEach((p, i) => x.drawImage(p.can(), i * 16, 0)); return cv; };
    const nat = (name, style, pal, lush, edge) => { const l = []; for (let i = 0; i < 4; i++) l.push(tex(style, pal, i + 1)); for (let i = 0; i < 4; i++) l.push(tex(lush || style, pal, i + 11)); T[name] = sheet(l); T[name + '_e'] = edgeSet(l[0], edge === undefined ? pal[0] : edge); };
    nat('grass', 'grass', PAL.grass, 'lush'); nat('dgrass', 'grass', PAL.dgrass, 'lush'); nat('pink', 'grass', PAL.pink, 'lush');
    nat('sand', 'sand', PAL.sand, null, PAL.sand[3]); nat('dirt', 'dirt', PAL.dirt, null, PAL.dirt[1]); nat('red', 'red', PAL.red, null, PAL.red[1]); nat('snow', 'snow', PAL.snow, null, PAL.snow[1]); nat('ice', 'ice', PAL.ice, null, PAL.ice[3]);
    const man = (name, kind, pal) => { const l = []; for (let i = 0; i < 4; i++) l.push(slab(kind, pal, i + 1)); T[name] = sheet(l); };
    man('ruin', 'ruin', PAL.stone); man('woodf', 'wood', PAL.wood); man('stonef', 'flag', PAL.stone); man('found', 'found', PAL.lime); man('bridge', 'bridge', PAL.wood);
    man('sbridge', 'flag', PAL.lime); man('cobble', 'cobble', PAL.stone);
    const dfl = (name, pal) => { const l = []; for (let i = 0; i < 4; i++) { const p = tex('red', pal, i + 3); l.push(p); } T[name] = sheet(l); T[name + '_e'] = edgeSet(l[0], pal[1]); };
    dfl('dfloor', PAL.dng); dfl('dfloor_r', PAL.red); dfl('dfloor_i', ['#3a4a6a', '#506a8a', '#6a88a8', '#8aa8c4', '#b0cce0']); dfl('dfloor_h', ['#3a2a5a', '#54407a', '#6e5a98', '#8a78b4', '#b0a0d0']);
    /* Вода: глубокая плоская синева, мелководье и бирюзовая кайма прибоя */
    const wsets = { w: ['#3b6ea8', '#4a86c0', '#6aa2d6', '#45cfe0', '#b4f4f0'], tq: ['#2f8f96', '#3aa6a4', '#62c8ba', '#7ae6cc', '#d0fff0'], cold: ['#3a5a8a', '#4f78a8', '#6a94c0', '#9ad0e8', '#e6f8ff'], dw: ['#2a4a66', '#3a6080', '#4a7696', '#3fe0b8', '#b0ffe0'], can: ['#34587a', '#3f6c8e', '#5084a4', '#3fe0b8', '#b0ffe0'] };
    for (const k in wsets) { const l = []; for (let f = 0; f < 4; f++) l.push(waterTile(wsets[k], f, false)); for (let f = 0; f < 4; f++) l.push(waterTile(wsets[k], f, true)); T['water_' + k] = sheet(l); T['foam_' + k] = edgeSet(wsets[k][3], wsets[k][4], true); T['shal_' + k] = edgeSet(waterTile(wsets[k], 0, false), wsets[k][2]); }
    /* Скалы и стены пещер: плотные ряды каменных столбов со светлыми макушками. 0-3 — тело, 4-7 — нижний ряд */
    const cliff = (name, pal, snow) => {
      const cv = document.createElement('canvas'); cv.width = 16 * 8; cv.height = 16; const x = cv.getContext('2d');
      for (let v = 0; v < 8; v++) {
        const p = P(16, 16), bot = v >= 4, cols = [[0, 5], [5, 11], [11, 16]];
        cols.forEach(([x0, x1], ci) => {
          const hh = 1 + Math.floor(H(ci, v, 77) * 7), cap = snow ? PAL.snow : pal;
          for (let yy = 0; yy < 16; yy++) for (let xx = x0; xx < x1; xx++) {
            let c; const e0 = xx === x0, e1 = xx === x1 - 1;
            if (yy < hh) c = e1 ? pal[0] : pal[1];
            else if (yy === hh) c = (e0 || e1) ? pal[0] : cap[4];
            else if (yy < hh + 3) c = e1 ? pal[0] : e0 ? cap[4] : cap[3];
            else { c = pal[2]; if (e0) c = pal[3]; if (xx >= x1 - 2) c = pal[1]; if (e1) c = pal[0]; if (H(xx, yy, v + 9) < .05) c = pal[1]; }
            if (bot && yy >= 13) c = pal[0];
            p.d(xx, yy, c);
          }
        });
        x.drawImage(p.can(), v * 16, 0);
      }
      T[name] = cv;
    };
    cliff('cliff_r', PAL.col); cliff('cliff_g', PAL.stone); cliff('cliff_s', PAL.stone, true);
    cliff('dwall', PAL.col); cliff('dwall_r', ['#2a1a2a', '#44283a', '#603a4a', '#80505c', '#a47078']); cliff('dwall_i', ['#1a2a44', '#2a4266', '#3f608a', '#5c84ac', '#8ab4d4']); cliff('dwall_h', ['#1a1230', '#2a1f48', '#3f3066', '#5b478a', '#8d76b8']);
    /* Крыши */
    const roof = (name, pal, kind) => {
      const cv = document.createElement('canvas'); cv.width = 64; cv.height = 16; const x = cv.getContext('2d');
      for (let v = 0; v < 4; v++) { const p = P(16, 16); for (let yy = 0; yy < 16; yy++) for (let xx = 0; xx < 16; xx++) { let c; if (kind === 'thatch') { c = pal[2]; const r = H(xx, yy, v + 51); if ((yy + (xx >> 1)) % 4 === 0) c = pal[1]; if (r < .12) c = pal[3]; if (r > .93) c = pal[0]; } else { const row = yy >> 2, off = (row & 1) * 3; c = pal[2]; if (yy % 4 === 3) c = pal[0]; else if ((xx + off) % 6 === 5) c = pal[1]; else if (yy % 4 === 0) c = pal[3]; if (H(xx, yy, v + 61) < .05) c = pal[1]; } p.d(xx, yy, c); } x.drawImage(p.can(), v * 16, 0); }
      T[name] = cv;
    };
    roof('roof1', PAL.thatch, 'thatch'); roof('roof2', PAL.rtile, 'tile'); roof('roof3', ['#1f3a5a', '#2d5680', '#4479a8', '#68a0cc', '#9cc8e8'], 'tile'); roof('roof4', PAL.tile, 'tile');
  }

  /* ---------- РАСТИТЕЛЬНОСТЬ ---------- */
  function canopyTree(pal, seed, o) {
    o = o || {}; const p = P(36, 46), r = G.rng(seed * 977 + 13), cx = 18, tr = PAL.trunk;
    /* ствол */
    const tw = o.thin ? 3 : 5, ty = 26;
    for (let y = ty; y < 43; y++) { const w = tw + (y > 39 ? (y - 39) : 0); for (let i = 0; i < w; i++) { const x = cx - Math.floor(w / 2) + i; let c = tr[2]; if (i === 0) c = tr[3]; else if (i >= w - 2) c = tr[1]; if (H(x, y, seed) < .18) c = tr[1]; p.d(x, y, o.birch ? (H(x, y >> 1, seed) < .2 ? '#3b3f4d' : (i === 0 ? '#ffffff' : i >= w - 1 ? '#b9b29a' : '#e8e4d4')) : c); } }
    p.d(cx - 3, 42, tr[2]); p.d(cx + 3, 42, tr[1]);
    /* крона */
    const cs = [[cx, 15, 10, 9]];
    const n = 5 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + r() * .6, d = 5 + r() * 4; cs.push([cx + Math.cos(a) * d * 1.15, 15 + Math.sin(a) * d * .85, 5 + r() * 3]); }
    p.blob(cs, pal, { seed, noise: .3 });
    /* блики-листья и тени-просветы */
    for (let i = 0; i < 16; i++) { const x = 6 + Math.floor(r() * 24), y = 5 + Math.floor(r() * 20); if (!(p.g(x, y) >>> 24) || !(p.g(x + 1, y) >>> 24)) continue; if (r() < .55 && y < 17) { p.d(x, y, pal[4]); p.d(x + 1, y, pal[3]); } else if (y > 12) { p.d(x, y, pal[0]); p.d(x + 1, y + 1, pal[0]); } }
    if (o.fruit) for (let i = 0; i < 5; i++) { const x = 8 + Math.floor(r() * 20), y = 8 + Math.floor(r() * 16); if (p.g(x, y) >>> 24) p.d(x, y, o.fruit); }
    return p.outline(OUT);
  }
  function pineTree(pal, seed, snow) {
    const p = P(28, 48), cx = 14, tr = PAL.trunk, r = G.rng(seed * 31 + 7);
    for (let y = 36; y < 46; y++) for (let i = 0; i < 4; i++) p.d(cx - 2 + i, y, i === 0 ? tr[3] : i === 3 ? tr[1] : tr[2]);
    const tiers = [[3, 15, 6], [10, 15, 9], [18, 14, 11], [26, 13, 12.5]];
    for (const [top, hgt, hw] of tiers) for (let y = 0; y < hgt; y++) {
      const w = (y + 1) / hgt * hw + (y === hgt - 1 ? 0 : 0);
      for (let x = Math.floor(cx - w); x <= Math.ceil(cx + w - 1); x++) {
        const t = (x - cx) / Math.max(1, w); let c = pal[2];
        if (t < -.35) c = pal[3]; if (t > .3) c = pal[1]; if (y >= hgt - 2) c = pal[t > 0 ? 0 : 1];
        const jag = H(x, top, seed) < .35;
        if (y === hgt - 1 && jag) continue;
        if (H(x, y + top, seed + 2) < .14) c = pal[t < 0 ? 4 : 2];
        if (snow && (y < hgt * .42 - Math.abs(t) * 1.5 || (y < 3))) c = H(x, y, seed) < .2 ? PAL.snow[2] : PAL.snow[4];
        p.d(x, top + y, c);
      }
    }
    return p.outline(OUT);
  }
  function palmTree(seed) {
    const p = P(34, 42), tr = PAL.trunk, pal = PAL.palm; let x = 15;
    for (let y = 40; y > 14; y--) { if (y % 7 === 0) x += (seed % 2 ? 1 : -1); p.d(x, y, tr[3]); p.d(x + 1, y, tr[2]); p.d(x + 2, y, tr[1]); if (y % 3 === 0) p.d(x + 1, y, tr[1]); }
    const fr = (ang, len, droop) => { let px = x + 1, py = 14; for (let i = 0; i < len; i++) { px += Math.cos(ang); py += Math.sin(ang) + i * droop; p.d(px, py, pal[3]); p.d(px, py + 1, pal[2]); p.d(px, py + 2, i % 2 ? pal[1] : pal[0]); if (i % 2) p.d(px, py + 3, pal[1]); } };
    fr(-.2, 13, .09); fr(Math.PI + .2, 13, .09); fr(-.9, 10, .1); fr(Math.PI + .9, 10, .1); fr(-1.5, 7, .05); fr(.35, 10, .12); fr(Math.PI - .35, 10, .12);
    p.e(x + 1, 15, 2.2, 1.8, '#6e4c36'); p.d(x, 16, '#8a5a14'); p.d(x + 2, 16, '#8a5a14');
    return p.outline(OUT);
  }
  function deadTree(seed, pal) {
    const p = P(26, 36), tr = pal || ['#2b211f', '#43322c', '#5e463a', '#7c604c', '#9a7c62'], r = G.rng(seed + 5);
    for (let y = 14; y < 34; y++) { p.d(12, y, tr[3]); p.d(13, y, tr[2]); p.d(14, y, tr[1]); if (y > 31) { p.d(11, y, tr[2]); p.d(15, y, tr[1]); } }
    const br = (x, y, dx, dy, n) => { for (let i = 0; i < n; i++) { p.d(x, y, tr[2]); p.d(x, y + 1, tr[1]); x += dx; y += dy * (r() < .8 ? 1 : 0); if (i === (n >> 1) && n > 4) br(x, y, -dx || 1, -1, 3); } };
    br(12, 18, -1, -1, 8); br(14, 15, 1, -1, 9); br(13, 14, 0, -1, 7); br(12, 24, -1, -1, 5); br(14, 22, 1, -1, 5);
    return p.outline(OUT);
  }
  function bush(pal, seed, berries, snow) {
    const p = P(18, 15), r = G.rng(seed * 3 + 1);
    p.blob([[9, 9, 6.5, 4.6], [5, 9, 3.6], [13, 9.5, 3.6], [8, 6.5, 3.8], [11.5, 6.8, 3.2]], pal, { seed, noise: .3 });
    if (berries) for (let i = 0; i < 6; i++) { const x = 3 + Math.floor(r() * 12), y = 5 + Math.floor(r() * 7); if (p.g(x, y) >>> 24) { p.d(x, y, berries); p.d(x, y - 1, lite(berries, .5)); } }
    if (snow) for (let x = 3; x < 15; x++) for (let y = 2; y < 8; y++) if (p.g(x, y) >>> 24 && !(p.g(x, y - 2) >>> 24) && H(x, y, seed) < .9) p.d(x, y, PAL.snow[H(x, y, 3) < .3 ? 2 : 4]);
    return p.outline(OUT);
  }
  function rock(pal, seed, o) {
    o = o || {}; const w = o.w || 20, h = o.h || 17, p = P(w, h), r = G.rng(seed * 17 + 3), cx = w / 2, cy = h / 2 + 1;
    const cs = [[cx, cy + 1, w * .4, h * .34]]; for (let i = 0; i < 3; i++) cs.push([cx + (r() - .5) * w * .45, cy - r() * h * .2, w * .16 + r() * w * .12, h * .2 + r() * h * .12]);
    p.blob(cs, pal, { seed, noise: .14, flat: 5 });
    for (let i = 0; i < 2; i++) { let x = 4 + Math.floor(r() * (w - 8)), y = 4 + Math.floor(r() * (h - 9)); for (let k = 0; k < 4; k++) { if (p.g(x, y) >>> 24) p.d(x, y, pal[0]); x += r() < .5 ? 1 : 0; y += 1; } }
    if (o.speck) for (let i = 0; i < (o.n || 7); i++) { const x = 3 + Math.floor(r() * (w - 6)), y = 3 + Math.floor(r() * (h - 6)); if (p.g(x, y) >>> 24 && p.g(x + 1, y + 1) >>> 24) { p.d(x, y, o.speck[3]); p.d(x + 1, y, o.speck[2]); p.d(x, y + 1, o.speck[1]); if (r() < .5) p.d(x + 1, y + 1, o.speck[2]); } }
    if (o.snow) for (let x = 1; x < w - 1; x++) for (let y = 1; y < h * .5; y++) if (p.g(x, y) >>> 24 && !(p.g(x, y - 3) >>> 24)) p.d(x, y, PAL.snow[H(x, y, seed) < .25 ? 2 : 4]);
    if (o.moss) for (let x = 1; x < w - 1; x++) for (let y = 1; y < h * .5; y++) if (p.g(x, y) >>> 24 && !(p.g(x, y - 2) >>> 24) && H(x, y, seed) < .5) p.d(x, y, PAL.moss[H(x, y, 3) < .4 ? 2 : 1]);
    return p.outline(OUT);
  }
  function crystal(pal, seed) {
    const p = P(18, 22), r = G.rng(seed + 2);
    const sh = (x, top, w, bot) => { for (let y = top; y < bot; y++) { const ww = Math.min(w, (y - top) + 1); for (let i = -ww + 1; i < ww; i++) { let c = pal[2]; if (i < 0) c = pal[3]; if (i > 0) c = pal[1]; if (i === -ww + 1 && ww > 1) c = pal[4]; if (i === 0 && y < top + 4) c = pal[4]; p.d(x + i, y, c); } } };
    p.e(9, 19, 7, 2.5, PAL.stone[1]);
    sh(5, 9, 2, 20); sh(13, 7, 2, 20); sh(9, 2, 3, 20);
    return p.outline(OUT);
  }

  /* ---------- ПОСТРОЙКИ И РУИНЫ ---------- */
  /* Стена 16x26: верхняя грань 10px + фасад 16px. kind: wood|stone|ruin|lime */
  function wall(kind, v, win, crack) {
    const p = P(16, 26), pal = kind === 'wood' ? PAL.wood : kind === 'lime' ? PAL.lime : PAL.stone;
    for (let y = 0; y < 26; y++) for (let x = 0; x < 16; x++) {
      let c;
      if (y < 10) { c = pal[3]; if (kind === 'wood') { if (y % 5 === 4) c = pal[2]; if (H(x, y, v) < .1) c = pal[4]; } else { if ((x + (y > 4 ? 4 : 0)) % 8 === 7 || y === 4) c = pal[2]; if (H(x, y, v + 2) < .1) c = pal[4]; } if (y === 9) c = pal[1]; if (y === 0) c = pal[4]; }
      else {
        const fy = y - 10;
        if (kind === 'wood') { c = pal[2 - ((x >> 2) & 1 ? 1 : 0) + (fy < 2 ? 1 : 0)]; if (x % 4 === 3) c = pal[0]; if (H(x >> 2, fy >> 1, v) < .12) c = pal[1]; if (fy === 7 || fy === 8) c = (x % 4 === 3) ? pal[0] : pal[fy === 7 ? 3 : 1]; }
        else { const row = fy >> 2, off = (row & 1) * 4; c = pal[2 - (H((x + off) >> 3, row, v) < .4 ? 1 : 0)]; if (fy % 4 === 3 || (x + off) % 8 === 7) c = pal[0]; else if (fy % 4 === 0) c = pal[kind === 'lime' ? 4 : 3]; }
        if (fy >= 14) c = dark(pal[0], .25);
      }
      p.d(x, y, c);
    }
    if (kind === 'ruin') { for (let i = 0; i < 12; i++) { const x = Math.floor(H(i, v, 1) * 15), y = Math.floor(H(i, v, 2) * 22); p.d(x, y, PAL.moss[1]); p.d(x + 1, y, PAL.moss[y < 10 ? 2 : 0]); if (H(i, v, 4) < .4) p.d(x, y + 1, PAL.moss[0]); } }
    if (win) { p.r(4, 13, 8, 8, pal[0]); p.r(5, 14, 6, 6, '#2a4a6e'); p.r(5, 14, 6, 1, '#6aa6d6'); p.d(6, 16, '#a6dcff'); p.d(7, 15, '#a6dcff'); p.r(8, 14, 1, 6, pal[1]); p.r(5, 17, 6, 1, pal[1]); p.r(3, 21, 10, 1, pal[4]); }
    if (crack) { let x = 7, y = 11; for (let i = 0; i < 13; i++) { p.d(x, y, '#0d0b14'); if (i % 3 === 0) p.d(x + 1, y, '#0d0b14'); x += [1, -1, 0, 1, -1, 0, -1, 1][(i + v) % 8]; y++; } p.l(3, 15, 6, 18, '#0d0b14'); p.l(12, 13, 10, 17, '#0d0b14'); }
    return p;
  }
  function brokenWall(v) {
    const full = wall('ruin', v), p = P(16, 26), hgt = v % 2 ? 9 : 13;
    for (let x = 0; x < 16; x++) { const cut = 26 - hgt - Math.floor(H(x >> 1, v, 9) * 5); for (let y = cut; y < 26; y++) { const sy = y - cut < 4 ? (y - cut) + 2 : y; p.b[y * 16 + x] = full.b[Math.min(25, sy) * 16 + x]; } }
    return p.outline(OUT);
  }
  function door(open, vert, pal) {
    pal = pal || PAL.wood; const p = P(16, 26);
    if (!vert) {
      p.r(0, 2, 2, 24, pal[1]); p.r(14, 2, 2, 24, pal[1]); p.r(0, 2, 16, 3, pal[2]); p.r(0, 2, 16, 1, pal[4]);
      if (!open) { for (let y = 5; y < 26; y++) for (let x = 2; x < 14; x++) p.d(x, y, x % 4 === 1 ? pal[1] : pal[3]); p.r(2, 10, 12, 1, pal[0]); p.r(2, 20, 12, 1, pal[0]); p.r(11, 15, 2, 2, PAL.gold[3]); p.d(11, 16, PAL.gold[1]); }
      else { p.r(2, 5, 12, 21, '#0d0b14'); for (let y = 5; y < 26; y++) for (let x = 2; x < 5; x++) p.d(x, y, x === 4 ? pal[0] : pal[2]); }
    } else {
      p.r(5, 0, 6, 6, pal[2]); p.r(5, 0, 6, 1, pal[4]); p.r(5, 18, 6, 8, pal[1]); p.r(5, 18, 6, 1, pal[3]);
      if (!open) { for (let y = 6; y < 18; y++) { p.d(7, y, pal[3]); p.d(8, y, pal[2]); } for (let y = 12; y < 24; y++) { p.d(7, y, pal[3]); p.d(8, y, pal[1]); } p.d(8, 15, PAL.gold[3]); }
      else { for (let x = 8; x < 16; x++) { p.r(x, 10, 1, 12, x % 3 ? pal[3] : pal[1]); } p.r(8, 10, 8, 1, pal[4]); }
    }
    return p.outline(OUT);
  }
  function fence(m) { /* m: N=1,E=2,S=4,W=8 */
    const p = P(16, 20), w = PAL.wood;
    if (m & 8) { p.r(0, 9, 8, 2, w[3]); p.r(0, 14, 8, 2, w[2]); }
    if (m & 2) { p.r(8, 9, 8, 2, w[3]); p.r(8, 14, 8, 2, w[2]); }
    if (m & 1) { p.r(7, 0, 2, 8, w[2]); }
    if (m & 4) { p.r(7, 12, 2, 8, w[2]); p.r(7, 12, 1, 8, w[3]); }
    p.r(6, 4, 4, 15, w[2]); p.r(6, 4, 1, 15, w[4]); p.r(9, 4, 1, 15, w[1]); p.r(6, 4, 4, 1, w[4]);
    return p.outline(OUT);
  }

  function buildObjects() {
    const sd = (name, p, o) => S(name, p, o);
    /* тени */
    [[8, 4], [12, 5], [16, 7], [22, 9], [30, 11], [44, 16]].forEach(([w, h], i) => { const p = P(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const dx = (x + .5 - w / 2) / (w / 2), dy = (y + .5 - h / 2) / (h / 2), d = dx * dx + dy * dy; if (d < 1 && (d < .7 || (x + y) % 2 === 0)) p.d(x, y, '#140f2658'); } sd('sh' + i, p); });
    /* деревья */
    for (let i = 0; i < 3; i++) { sd('oak' + i, canopyTree(PAL.oak, i + 1, { fruit: i === 2 ? '#e5541f' : null })); sd('doak' + i, canopyTree(PAL.doak, i + 11)); sd('pinkt' + i, canopyTree(PAL.pinkt, i + 21, { fruit: '#fff0f6' })); sd('crim' + i, canopyTree(PAL.crim, i + 31, { thin: true })); sd('birch' + i, canopyTree(['#3a6b2f', '#55903a', '#7cb548', '#a8d65c', '#d6f08a'], i + 41, { thin: true, birch: true })); }
    for (let i = 0; i < 3; i++) sd('teal' + i, canopyTree(PAL.teal, i + 51, { thin: true }));
    for (let i = 0; i < 2; i++) { sd('tpine' + i, pineTree(PAL.tpine, i + 9)); sd('ppine' + i, pineTree(PAL.ppine, i + 13)); sd('pine' + i, pineTree(PAL.pine, i + 1)); sd('spine' + i, pineTree(PAL.pine, i + 5, true)); sd('palm' + i, palmTree(i)); sd('dead' + i, deadTree(i)); }
    const stump = (pal, snow) => { const p = P(14, 11); p.r(3, 3, 8, 7, pal[1]); p.r(3, 3, 2, 7, pal[3]); p.r(9, 3, 2, 7, pal[0]); p.e(7, 3.5, 4, 2, pal[4]); p.e(7, 3.5, 2, 1, pal[3]); p.d(2, 9, pal[1]); p.d(11, 9, pal[0]); if (snow) { p.e(7, 3, 4, 1.6, PAL.snow[4]); } return p.outline(OUT); };
    sd('stump', stump(PAL.trunk)); sd('stump_s', stump(PAL.trunk, true));
    /* кусты и травы */
    sd('bush0', bush(PAL.oak, 1)); sd('bush1', bush(PAL.doak, 2)); sd('berry1', bush(PAL.oak, 3, '#e23a5c')); sd('berry0', bush(PAL.oak, 3));
    sd('pbush', bush(PAL.pinkt, 4)); sd('pberry1', bush(PAL.crim, 5, '#7ef0ff')); sd('pberry0', bush(PAL.crim, 5));
    sd('dbush', bush(['#5a4a2c', '#7a6638', '#9a8448', '#b8a25c', '#d6c078'], 6)); sd('sbush', bush(PAL.pine, 7, null, true));
    const cactus = v => { const p = P(14, 22), c = ['#1f5a3a', '#2f7d44', '#4ba24f', '#7cc85e']; p.r(5, 3, 4, 18, c[2]); p.r(5, 3, 1, 18, c[3]); p.r(8, 3, 1, 18, c[1]); p.r(1, 8, 2, 6, c[2]); p.r(1, 12, 4, 2, c[1]); p.r(11, 6, 2, 7, c[2]); p.r(9, 11, 4, 2, c[1]); for (let y = 4; y < 20; y += 3) p.d(6 + (y % 2), y, c[0]); if (v) { p.d(6, 2, '#ff6f91'); p.d(7, 2, '#ffc2d4'); p.d(11, 5, '#ff6f91'); } return p.outline(OUT); };
    sd('cactus0', cactus(0)); sd('cactus1', cactus(1));
    const tuft = (pal, f, tall) => { const p = P(14, tall ? 16 : 11), hgt = tall ? 13 : 8; for (let i = 0; i < 6; i++) { const bx = 2 + i * 2, top = (tall ? 2 : 2) + ((i * 5) % 4), lean = (i % 3 - 1) * (f ? 1 : 0); for (let y = top; y < hgt + 2; y++) { const t = (y - top) / (hgt - top + 2); p.d(bx + Math.round(lean * (1 - t)), y, pal[i % 2 ? 3 : 2]); if (i % 2 === 0) p.d(bx + 1 + Math.round(lean * (1 - t)), y, pal[1]); } if (tall && i % 2) { p.d(bx + lean, top - 1, '#b08a5c'); p.d(bx + lean, top, '#8f6846'); } } return p.outline(OUT); };
    sd('tgrass0', tuft(PAL.grass, 0)); sd('tgrass1', tuft(PAL.grass, 1)); sd('reed0', tuft(PAL.palm, 0, true)); sd('reed1', tuft(PAL.palm, 1, true));
    sd('pgrass0', tuft(PAL.pink, 0)); sd('pgrass1', tuft(PAL.pink, 1)); sd('dgrass0', tuft(['#6a5a2c', '#8a7638', '#aa9448', '#c8b25c'], 0)); sd('dgrass1', tuft(['#6a5a2c', '#8a7638', '#aa9448', '#c8b25c'], 1));
    const flower = (c, c2) => { const p = P(8, 11); p.r(3, 5, 1, 5, '#3e8c47'); p.d(4, 7, '#56aa52'); p.d(2, 8, '#56aa52'); p.r(2, 2, 3, 3, c); p.d(3, 1, c); p.d(3, 5, c); p.d(1, 3, c); p.d(5, 3, c); p.d(3, 3, c2); return p.outline(OUT); };
    sd('flower0', flower('#ff6f91', '#ffe066')); sd('flower1', flower('#ffe066', '#e5541f')); sd('flower2', flower('#8fb8ff', '#ffffff')); sd('flower3', flower('#ffffff', '#ffc23e'));
    { const p = P(12, 16); p.r(5, 7, 1, 8, '#2a6b6b'); p.d(4, 11, '#3d9c8f'); p.d(6, 9, '#3d9c8f'); p.e(5.5, 4.5, 3.2, 3.6, '#58d6c4'); p.e(5.5, 4, 2, 2.2, '#c2fff0'); p.d(5, 4, '#ffffff'); p.d(3, 7, '#22a8a6'); p.d(7, 7, '#22a8a6'); sd('gflower', p.outline(OUT)); }
    { const p = P(12, 12); for (let i = 0; i < 5; i++) { const x = 2 + i * 2; p.r(x, 4 + (i % 2) * 2, 1, 7 - (i % 2) * 2, '#3d9c6a'); p.d(x - 1, 5 + (i % 2) * 2, '#8fe0a0'); p.d(x + 1, 6 + (i % 2), '#8fe0a0'); p.d(x, 3 + (i % 2) * 2, '#d6ffd8'); } sd('herbp', p.outline(OUT)); }
    { const p = P(12, 15); for (let i = 0; i < 4; i++) { const x = 2 + i * 2 + (i % 2); p.r(x, 5, 1, 9, '#8f9a4a'); p.d(x, 3, '#e8dfa0'); p.d(x, 4, '#c9b866'); p.d(x + 1, 4, '#e8dfa0'); } sd('fiberp', p.outline(OUT)); }
    const mush = (cap, spot, glow) => { const p = P(12, 11); p.r(5, 5, 2, 5, '#efeada'); p.d(5, 9, '#b5ae98'); p.e(6, 4, 4, 2.6, cap); p.d(4, 3, spot); p.d(7, 2, spot); p.d(8, 4, spot); p.r(2, 7, 2, 3, '#efeada'); p.e(3, 6.5, 2, 1.4, cap); p.d(3, 6, spot); return p.outline(glow ? '#0f2a44' : OUT); };
    sd('mush0', mush('#b06a36', '#d99a5c')); sd('mush1', mush('#d8353a', '#ffffff')); sd('gmush', mush('#3aa8f0', '#c6f4ff', 1));
    { const p = P(13, 7); p.l(1, 5, 11, 2, '#6e4c36'); p.l(1, 4, 11, 1, '#b08a5c'); p.l(6, 3, 8, 6, '#8f6846'); p.d(4, 2, '#8f6846'); sd('stickg', p.outline(OUT)); }
    { const p = P(11, 8); p.blob([[4, 4.5, 3, 2.4], [7.5, 5, 2.4, 2]], PAL.stone, { noise: .1, flat: 4 }); sd('pebble', p.outline(OUT)); }
    { const p = P(9, 8); p.e(4.5, 4.5, 3.4, 2.8, '#ffd6c2'); p.l(2, 5, 4, 2, '#e89a8a'); p.l(4, 6, 5, 2, '#e89a8a'); p.l(6, 6, 6, 3, '#e89a8a'); p.d(3, 3, '#ffffff'); sd('shell', p.outline(OUT)); }
    { const p = P(16, 10); p.blob([[8, 5.5, 6.5, 3.4], [5, 5, 3, 2.4]], ['#7a4636', '#9c5a40', '#b5704f', '#cf8f66', '#e6b088'], { noise: .2 }); sd('claypit', p.outline(OUT)); }
    /* камни и руды */
    sd('rock0', rock(PAL.stone, 1)); sd('rock1', rock(PAL.stone, 2, { moss: 1 })); sd('rock2', rock(PAL.stone, 3, { w: 26, h: 21 }));
    sd('granite0', rock(PAL.granite, 4)); sd('granite1', rock(PAL.granite, 5, { w: 24, h: 20 })); sd('lime0', rock(PAL.lime, 6)); sd('lime1', rock(PAL.lime, 16, { w: 22, h: 14 }));
    sd('coalr', rock(PAL.stone, 7, { speck: PAL.coal, n: 9 })); sd('copperr', rock(PAL.stone, 8, { speck: PAL.copper })); sd('ironr', rock(PAL.granite, 9, { speck: PAL.iron, n: 8 })); sd('goldr', rock(PAL.stone, 10, { speck: PAL.gold }));
    sd('srock', rock(PAL.stone, 11, { snow: 1 })); sd('sironr', rock(PAL.stone, 12, { speck: PAL.iron, snow: 1 })); sd('sgoldr', rock(PAL.stone, 13, { speck: PAL.gold, snow: 1 }));
    sd('icer', rock(PAL.ice, 14, {})); sd('meteor', rock(PAL.star, 15, { speck: PAL.crp, n: 6 }));
    sd('cryst_g', crystal(PAL.crg, 1)); sd('cryst_p', crystal(PAL.crp, 2)); sd('cryst_b', crystal(PAL.crb, 3));
    { const p = P(14, 8); p.blob([[4, 5, 3, 2], [9, 5.5, 3.4, 2], [7, 3.5, 2.2, 1.6]], PAL.stone, { noise: .1, flat: 4 }); sd('rubble', p.outline(OUT)); }
    const spire = (pal, v) => { const p = P(18, 38), r = G.rng(v + 40); const cs = []; for (let i = 0; i < 6; i++) cs.push([9 + (r() - .5) * 3, 6 + i * 5.5, 3.2 + i * .55 + r(), 4.2]); p.blob(cs, pal, { seed: v, noise: .12, flat: 5 }); for (let i = 0; i < 5; i++) { const y = 8 + i * 6; p.l(5, y, 13, y + (i % 2 ? 1 : -1), pal[1]); } return p.outline(OUT); };
    sd('spire0', spire(PAL.red, 0)); sd('spire1', spire(PAL.granite, 1));
    /* стены, двери, заборы */
    for (let v = 0; v < 2; v++) { sd('wwall' + v, wall('wood', v).outline(OUT)); sd('swall' + v, wall('stone', v).outline(OUT)); sd('rwall' + v, wall('ruin', v + 3).outline(OUT)); sd('lwall' + v, wall('lime', v).outline(OUT)); sd('bwall' + v, brokenWall(v)); }
    sd('wwin', wall('wood', 0, 1).outline(OUT)); sd('swin', wall('stone', 0, 1).outline(OUT)); sd('cracked', wall('ruin', 5, 0, 1).outline(OUT)); sd('dcracked', wall('stone', 5, 0, 1).tint('#40344e', .5).outline(OUT));
    sd('door_c', door(0, 0)); sd('door_o', door(1, 0)); sd('doorv_c', door(0, 1)); sd('doorv_o', door(1, 1));
    const sp = ['#3b3f4d', '#565c6c', '#7a8292', '#a2aab6', '#cdd4da'];
    sd('ldoor_c', door(0, 0, sp)); sd('ldoor_o', door(1, 0, sp));
    { const p = P(16, 26); p.r(0, 2, 2, 24, sp[1]); p.r(14, 2, 2, 24, sp[1]); p.r(0, 2, 16, 3, sp[2]); for (let x = 3; x < 14; x += 3) { p.r(x, 5, 1, 21, sp[3]); p.r(x + 1, 5, 1, 21, sp[0]); } p.r(2, 12, 12, 1, sp[2]); p.r(2, 20, 12, 1, sp[2]); sd('gate_c', p.outline(OUT)); const q = P(16, 26); q.r(0, 2, 2, 24, sp[1]); q.r(14, 2, 2, 24, sp[1]); q.r(0, 2, 16, 3, sp[2]); for (let x = 3; x < 14; x += 3) q.r(x, 5, 1, 3, sp[3]); sd('gate_o', q.outline(OUT)); }
    for (let m = 0; m < 16; m++) sd('fence' + m, fence(m));
    { const w = PAL.wood, p = P(16, 20); p.r(0, 5, 2, 14, w[2]); p.r(14, 5, 2, 14, w[2]); p.r(2, 8, 12, 2, w[3]); p.r(2, 14, 12, 2, w[2]); p.l(2, 9, 13, 15, w[1]); sd('fgate_c', p.outline(OUT)); const q = P(16, 20); q.r(0, 5, 2, 14, w[2]); q.r(14, 5, 2, 14, w[2]); q.r(2, 4, 2, 2, w[3]); q.r(2, 10, 2, 2, w[2]); sd('fgate_o', q.outline(OUT)); }
    /* колонны, арки, статуи */
    const pillar = (hgt, broken, pal) => { pal = pal || PAL.lime; const p = P(14, hgt + 2); p.r(2, hgt - 3, 10, 3, pal[1]); p.r(2, hgt - 3, 10, 1, pal[3]); for (let y = broken ? 3 : 4; y < hgt - 3; y++) for (let x = 4; x < 10; x++) { let c = pal[2]; if (x === 4) c = pal[4]; if (x === 5 || x === 7) c = pal[3]; if (x >= 8) c = pal[1]; if (H(x, y, hgt) < .06) c = pal[0]; p.d(x, y, c); } if (!broken) { p.r(2, 1, 10, 3, pal[2]); p.r(2, 1, 10, 1, pal[4]); } else { p.b[3 * 14 + 4] = 0; p.b[3 * 14 + 5] = 0; p.b[4 * 14 + 4] = 0; p.b[3 * 14 + 9] = 0; } for (let i = 0; i < 4; i++) { const x = 4 + Math.floor(H(i, hgt, 1) * 5), y = hgt - 6 - Math.floor(H(i, hgt, 2) * 8); p.d(x, y, PAL.moss[1]); p.d(x + 1, y + 1, PAL.moss[0]); } return p.outline(OUT); };
    sd('pillar', pillar(30)); sd('pillar_b', pillar(16, 1)); sd('dpillar', pillar(30, 0, PAL.col));
    { const p = P(48, 44), L = PAL.lime, pl = pillar(34); p.st(pl, 0, 8); p.st(pl, 34, 8); for (let y = 2; y < 12; y++) for (let x = 2; x < 46; x++) { let c = L[2]; if (y === 2) c = L[4]; if (y >= 10) c = L[1]; if (x % 8 === 7 && y > 2) c = L[1]; if (H(x, y, 3) < .05) c = L[0]; p.d(x, y, c); } for (let i = 0; i < 10; i++) { const x = 3 + Math.floor(H(i, 1, 7) * 42); p.d(x, 2, PAL.moss[2]); p.d(x, 3, PAL.moss[1]); if (i % 2) p.d(x, 12, PAL.moss[0]); } sd('arch', p.outline(OUT)); }
    { const p = P(16, 32), L = PAL.stone; p.r(2, 25, 12, 5, L[1]); p.r(2, 25, 12, 1, L[3]); p.r(4, 22, 8, 3, L[2]); p.blob([[8, 15, 3.6, 6], [8, 7, 3, 3.2]], L, { noise: .1, flat: 5 }); p.r(4, 12, 1, 7, L[2]); p.r(11, 12, 1, 7, L[1]); p.d(7, 7, L[0]); p.d(9, 7, L[0]); p.r(12, 5, 1, 17, L[3]); p.d(12, 4, L[4]); for (let i = 0; i < 5; i++) p.d(4 + i * 2, 24 - (i % 2) * 6, PAL.moss[1]); sd('statue', p.outline(OUT)); }
    { const p = P(16, 36), L = ['#2a2440', '#3d3560', '#564c84', '#7668a8', '#a394d0']; for (let y = 3; y < 33; y++) { const w = 3 + Math.floor((y - 3) / 12); for (let x = 8 - w; x < 8 + w; x++) { let c = L[2]; if (x < 8 - w + 1) c = L[4]; else if (x < 8) c = L[3]; else if (x >= 8 + w - 1) c = L[0]; else c = L[1]; p.d(x, y, c); } } p.d(7, 2, L[4]); p.d(8, 2, L[2]); p.r(3, 33, 10, 2, L[1]); for (const [x, y] of [[7, 9], [8, 10], [7, 11], [6, 15], [7, 16], [8, 15], [9, 16], [7, 21], [7, 22], [8, 23], [6, 23]]) p.d(x, y, '#7ef0ff'); sd('monument', p.outline(OUT)); }
    { const p = P(28, 30), L = PAL.lime; p.r(2, 22, 24, 6, L[1]); p.r(2, 22, 24, 1, L[3]); p.r(4, 8, 4, 14, L[2]); p.r(4, 8, 1, 14, L[4]); p.r(20, 8, 4, 14, L[2]); p.r(23, 8, 1, 14, L[1]); for (let y = 2; y < 9; y++) { const w = 3 + (y - 2) * 1.7; p.r(14 - w, y, w * 2, 1, y === 2 ? PAL.rtile[3] : PAL.rtile[y % 2 ? 2 : 1]); } p.r(11, 14, 6, 8, L[0]); p.e(14, 16, 2.4, 2.4, '#e06af0'); p.d(13, 15, '#ffe0ff'); sd('shrine', p.outline(OUT)); }
    { const p = P(22, 24), L = PAL.stone, w = PAL.wood; p.blob([[11, 17, 9, 5]], L, { noise: .12, flat: 4 }); p.e(11, 15, 6.5, 3, '#10323c'); p.e(11, 15.5, 5, 2, '#2e7fc0'); p.d(9, 15, '#a6e0f7'); p.r(2, 4, 2, 13, w[2]); p.r(18, 4, 2, 13, w[1]); p.r(1, 2, 20, 3, w[3]); p.r(1, 2, 20, 1, w[4]); p.r(10, 5, 1, 6, '#b5ae98'); p.r(9, 10, 3, 3, w[2]); p.d(9, 10, w[4]); for (let x = 3; x < 19; x += 3) p.d(x, 18 + (x % 2), L[0]); sd('well', p.outline(OUT)); }
    const chest = (open, pal, trim) => { const p = P(16, 15); p.r(1, 6, 14, 8, pal[2]); p.r(1, 6, 14, 1, pal[0]); p.r(1, 13, 14, 1, pal[0]); p.r(1, 6, 1, 8, pal[1]); p.r(14, 6, 1, 8, pal[0]); for (let x = 4; x < 14; x += 4) p.r(x, 7, 1, 6, pal[1]); if (!open) { p.r(1, 2, 14, 5, pal[3]); p.r(1, 2, 14, 1, pal[4]); p.r(1, 2, 1, 5, trim); p.r(14, 2, 1, 5, trim); p.r(7, 2, 2, 5, trim); p.r(7, 6, 2, 3, PAL.gold[3]); p.d(7, 8, PAL.gold[1]); } else { p.r(1, 0, 14, 3, pal[1]); p.r(1, 0, 14, 1, pal[3]); p.r(2, 3, 12, 3, '#0d0b14'); p.d(5, 5, PAL.gold[3]); p.d(9, 4, PAL.gold[4]); p.d(11, 5, PAL.gold[2]); } return p.outline(OUT); };
    sd('chest_c', chest(0, PAL.wood, PAL.stone[2])); sd('chest_o', chest(1, PAL.wood, PAL.stone[2])); sd('achest_c', chest(0, ['#2a2440', '#3d3560', '#564c84', '#7668a8', '#a394d0'], PAL.gold[3])); sd('achest_o', chest(1, ['#2a2440', '#3d3560', '#564c84', '#7668a8', '#a394d0'], PAL.gold[3]));
    { const w = PAL.wood, p = P(15, 16); p.r(1, 3, 13, 12, w[2]); p.r(1, 3, 13, 1, w[4]); p.r(1, 3, 1, 12, w[3]); p.r(13, 3, 1, 12, w[0]); p.r(1, 14, 13, 1, w[0]); p.l(2, 4, 12, 13, w[1]); p.l(12, 4, 2, 13, w[1]); p.r(1, 1, 13, 2, w[3]); p.r(1, 1, 13, 1, w[4]); sd('crate', p.outline(OUT)); }
    { const w = PAL.wood, p = P(14, 17); p.blob([[7, 9, 5.6, 7]], w, { noise: .1, flat: 5 }); for (let y = 3; y < 16; y++) for (let x = 3; x < 12; x += 3) p.d(x, y, w[0]); p.r(2, 5, 10, 1, PAL.stone[3]); p.r(2, 12, 10, 1, PAL.stone[2]); p.e(7, 3, 4.4, 1.4, w[4]); sd('barrel', p.outline(OUT)); }
    { const c = ['#6a3a2c', '#8f5038', '#b56a48', '#d48c60', '#f0b888'], p = P(12, 16); p.blob([[6, 10, 4.6, 5]], c, { noise: .1, flat: 5 }); p.r(4, 2, 4, 3, c[2]); p.r(3, 1, 6, 1, c[4]); p.r(3, 8, 6, 1, '#3aa8f0'); p.d(5, 10, '#3aa8f0'); sd('urn', p.outline(OUT)); }
    { const L = PAL.stone, p = P(16, 18); p.r(2, 4, 12, 13, L[2]); p.r(3, 2, 10, 2, L[2]); p.r(2, 4, 1, 13, L[4]); p.r(3, 2, 10, 1, L[4]); p.r(13, 4, 1, 13, L[0]); for (let y = 6; y < 14; y += 2) p.r(4, y, 5 + (y * 3) % 4, 1, L[0]); p.d(11, 6, '#7ef0ff'); p.d(11, 10, '#7ef0ff'); p.d(4, 15, PAL.moss[1]); p.d(5, 16, PAL.moss[0]); sd('tablet', p.outline(OUT)); }
    const stairs = (down, pal) => { const p = P(16, 16); p.r(0, 0, 16, 16, pal[0]); for (let i = 0; i < 4; i++) { const y = down ? i * 4 : 12 - i * 4, sh = down ? 3 - i : i; p.r(1 + (down ? i : 0), y, 14 - (down ? i * 2 : 0), 3, pal[1 + sh]); p.r(1 + (down ? i : 0), y, 14 - (down ? i * 2 : 0), 1, pal[Math.min(4, 2 + sh)]); } if (down) p.r(4, 12, 8, 4, '#07060d'); return p; };
    sd('stairs_d', stairs(1, PAL.stone)); sd('stairs_u', stairs(0, PAL.stone));
    { const p = P(34, 30), L = PAL.red; p.blob([[17, 17, 15, 12], [9, 20, 8, 8], [25, 20, 8, 8]], L, { noise: .14, flat: 5, seed: 4 }); p.e(17, 22, 7, 8, '#07060d'); p.e(17, 21, 5.5, 6, '#140f26'); p.r(10, 27, 14, 3, '#07060d'); sd('cave_r', p.outline(OUT)); const q = P(34, 30), I = PAL.ice; q.blob([[17, 17, 15, 12], [9, 20, 8, 8], [25, 20, 8, 8]], PAL.stone, { noise: .14, flat: 5, seed: 6 }); for (let x = 3; x < 31; x++) for (let y = 3; y < 14; y++) if (q.g(x, y) >>> 24 && !(q.g(x, y - 3) >>> 24)) q.d(x, y, PAL.snow[H(x, y, 1) < .3 ? 2 : 4]); q.e(17, 22, 7, 8, '#07060d'); q.e(17, 21, 5.5, 6, '#132034'); q.r(10, 27, 14, 3, '#07060d'); for (let x = 12; x < 23; x += 2) q.r(x, 14, 1, 2 + (x % 3), I[3]); sd('cave_i', q.outline(OUT)); }
    { const p = P(16, 16), L = PAL.stone; p.r(1, 1, 14, 14, L[1]); p.r(2, 2, 12, 12, L[0]); for (let y = 3; y < 14; y += 4) for (let x = 3; x < 14; x += 4) p.d(x + 1, y + 1, L[1]); sd('spike0', p); const q = P(16, 20); q.st(p, 0, 4); for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) { const bx = 3 + x * 4, by = 5 + y * 4; q.r(bx, by - 3, 2, 5, L[3]); q.d(bx, by - 4, L[4]); q.d(bx + 1, by - 3, L[1]); q.d(bx + 1, by + 1, L[0]); } sd('spike1', q); }
    const lever = on => { const p = P(12, 14), L = PAL.stone; p.r(2, 9, 8, 4, L[1]); p.r(2, 9, 8, 1, L[3]); p.l(6, 9, on ? 9 : 3, 3, PAL.wood[3]); p.e(on ? 9.5 : 2.5, 2.5, 1.6, 1.6, on ? '#3dd49a' : '#d8353a'); return p.outline(OUT); };
    sd('lever0', lever(0)); sd('lever1', lever(1));
    const brazier = lit => { const p = P(12, 18), L = PAL.stone; p.r(5, 9, 2, 7, L[1]); p.r(3, 15, 6, 2, L[1]); p.r(3, 15, 6, 1, L[3]); p.r(2, 6, 8, 3, L[2]); p.r(2, 6, 8, 1, L[4]); p.r(3, 9, 6, 1, L[0]); if (lit) p.r(3, 5, 6, 1, PAL.fire[1]); else p.r(3, 5, 6, 1, PAL.coal[1]); return p.outline(OUT); };
    sd('brazier0', brazier(0)); sd('brazier1', brazier(1));
    { const p = P(14, 9), b = PAL.bone; p.l(1, 6, 8, 3, b[3]); p.l(4, 2, 10, 7, b[2]); p.e(11, 3, 2, 2, b[3]); p.d(10, 3, OUT); p.d(12, 3, OUT); sd('bones', p.outline(OUT)); }
    { const p = P(22, 18), L = ['#2a2440', '#3d3560', '#564c84', '#7668a8', '#a394d0']; p.r(1, 6, 20, 11, L[1]); p.r(1, 6, 20, 1, L[3]); p.r(0, 3, 22, 3, L[2]); p.r(0, 3, 22, 1, L[4]); p.r(4, 9, 2, 6, L[0]); p.r(16, 9, 2, 6, L[0]); p.e(11, 11.5, 2.5, 2.5, '#7ef0ff'); p.d(10, 10, '#ffffff'); sd('altar', p.outline(OUT)); }
    { const p = P(48, 52), L = ['#2a2440', '#3d3560', '#564c84', '#7668a8', '#a394d0']; for (let y = 2; y < 50; y++) for (let x = 2; x < 46; x++) { const inArch = Math.hypot(x - 24, (y - 26) * .8) < 15 || (y > 26 && Math.abs(x - 24) < 15); let c = L[2]; if (x < 4) c = L[4]; if (x > 43) c = L[0]; if (y < 4) c = L[4]; if ((x + (y >> 3) * 4) % 8 === 7 || y % 8 === 7) c = L[1]; if (inArch) c = H(x, y, 9) < .5 ? '#0d0b14' : '#140f26'; p.d(x, y, c); } for (const [x, y] of [[24, 6], [10, 14], [38, 14], [7, 30], [41, 30]]) { p.e(x, y, 1.6, 1.6, '#7ef0ff'); } sd('hgate_c', p.outline(OUT)); const q = P(48, 52); q.b.set(p.b); for (let y = 8; y < 50; y++) for (let x = 9; x < 39; x++) { const inArch = Math.hypot(x - 24, (y - 26) * .8) < 15 || (y > 26 && Math.abs(x - 24) < 15); if (inArch) { const d = Math.hypot(x - 24, y - 30); q.d(x, y, d < 6 ? '#ffffff' : d < 11 ? '#c2fff0' : d < 15 ? '#58d6c4' : '#22a8a6'); } } sd('hgate_o', q); }
    { const p = P(22, 24), L = PAL.stone, g = PAL.gold; p.r(2, 14, 18, 9, L[1]); p.r(2, 14, 18, 1, L[3]); const gear = (cx, cy, r, c) => { p.e(cx, cy, r, r, c[2]); p.e(cx, cy, r * .45, r * .45, c[0]); for (let a = 0; a < 6; a++) p.d(cx - .5 + Math.cos(a * 1.047) * (r + .6), cy - .5 + Math.sin(a * 1.047) * (r + .6), c[3]); }; gear(8, 9, 5, g); gear(15.5, 13, 3.4, PAL.copper); p.d(5, 17, '#7ef0ff'); p.d(11, 19, '#7ef0ff'); p.d(16, 18, '#7ef0ff'); sd('mech', p.outline(OUT)); }
    { const p = P(44, 30), w = PAL.wood; for (let x = 4; x < 40; x++) { const top = 14 + Math.round(Math.sin(x * .16) * 3), bot = 26 - Math.round(Math.abs(x - 22) * .2); for (let y = top; y < bot; y++) { let c = w[2]; if ((y - top) % 4 === 3) c = w[0]; if (y === top) c = w[4]; if (H(x, y, 5) < .08) c = w[1]; p.d(x, y, c); } } p.r(20, 2, 2, 14, w[1]); p.l(22, 3, 33, 9, '#b5ae98'); p.l(22, 4, 31, 12, '#d9d3be'); p.r(8, 10, 2, 6, w[1]); for (let x = 6; x < 38; x += 6) p.r(x, 16 + (x % 4), 1, 6, w[0]); sd('wreck', p.outline(OUT)); }
    { const p = P(12, 12); p.l(2, 2, 9, 9, '#d8353a'); p.l(9, 2, 2, 9, '#d8353a'); p.l(3, 2, 10, 9, '#8f1d22'); sd('xmark', p); }
    /* деревня */
    { const p = P(52, 60), w = PAL.wood, L = PAL.stone; for (let y = 22; y < 58; y++) { const hw = 9 + (y - 22) * .14; for (let x = Math.round(26 - hw); x < 26 + hw; x++) { let c = y > 46 ? L[2] : w[2]; if (y > 46) { if ((x + ((y >> 2) & 1) * 3) % 6 === 5 || y % 4 === 3) c = L[0]; } else { if (x % 4 === 3) c = w[0]; if (H(x >> 2, y >> 2, 1) < .2) c = w[1]; } if (x < 26 - hw + 2) c = y > 46 ? L[4] : w[4]; if (x > 26 + hw - 3) c = y > 46 ? L[1] : w[0]; p.d(x, y, c); } } for (let y = 10; y < 24; y++) { const hw = (y - 9) * 1.05; p.r(26 - hw, y, hw * 2, 1, PAL.tile[y % 3 ? 2 : 1]); } p.r(25, 9, 2, 2, PAL.tile[4]); p.r(23, 48, 6, 10, w[0]); p.r(24, 49, 4, 9, w[1]); p.r(23, 30, 6, 6, '#2a4a6e'); p.r(23, 30, 6, 1, '#6aa6d6'); sd('mill', p.outline(OUT)); const b = P(46, 46), cl = PAL.cloth; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + .3, ca = Math.cos(a), sa = Math.sin(a); for (let i = 3; i < 22; i++) { b.d(23 + ca * i, 23 + sa * i, w[1]); if (i > 6) for (let j = 1; j < 6; j++) b.d(23 + ca * i - sa * j, 23 + sa * i + ca * j, (i + j) % 4 === 0 ? cl[1] : cl[3]); } } b.e(23, 23, 2.4, 2.4, w[4]); sd('blade', b.outline(OUT)); }
    { const p = P(18, 15), t = PAL.thatch; p.blob([[9, 8.5, 7.5, 5.5]], t, { noise: .3 }); for (let y = 4; y < 13; y += 3) p.r(2, y, 14, 1, t[0]); p.r(8, 3, 2, 11, PAL.wood[2]); sd('hay', p.outline(OUT)); }
    { const p = P(28, 20), w = PAL.wood; p.r(3, 5, 20, 8, w[2]); p.r(3, 5, 20, 1, w[4]); p.r(3, 12, 20, 1, w[0]); for (let x = 7; x < 22; x += 4) p.r(x, 6, 1, 6, w[1]); p.l(23, 9, 27, 6, w[1]); const wh = (cx) => { p.e(cx, 14, 4, 4, w[0]); p.e(cx, 14, 2.6, 2.6, w[3]); p.d(cx, 14, w[0]); }; wh(8); wh(19); sd('cart', p.outline(OUT)); }
    { const p = P(14, 18), w = PAL.wood; p.r(6, 7, 2, 10, w[1]); p.r(1, 2, 12, 6, w[3]); p.r(1, 2, 12, 1, w[4]); p.r(1, 7, 12, 1, w[0]); p.r(3, 4, 7, 1, w[0]); p.r(4, 5, 5, 1, w[1]); sd('sign', p.outline(OUT)); }
    const lamp = (pal) => { const p = P(10, 24); p.r(4, 8, 2, 15, pal[1]); p.r(3, 22, 4, 1, pal[0]); p.r(2, 2, 6, 6, pal[2]); p.r(3, 3, 4, 4, '#ffc23e'); p.d(4, 4, '#fff0a0'); p.r(2, 1, 6, 1, pal[4]); p.r(4, 0, 2, 1, pal[1]); return p.outline(OUT); };
    sd('lamp', lamp(PAL.stone)); sd('lantern', lamp(PAL.copper));
    { const p = P(22, 16), w = PAL.wood; p.r(1, 3, 20, 5, w[3]); p.r(1, 3, 20, 1, w[4]); p.r(1, 7, 20, 1, w[0]); p.r(2, 8, 2, 7, w[1]); p.r(18, 8, 2, 7, w[1]); p.e(8, 3.6, 2, 1, '#efeada'); p.d(14, 3, PAL.fire[1]); p.d(14, 2, '#3e8c47'); sd('table', p.outline(OUT)); }
    { const p = P(16, 24), w = PAL.wood; p.r(1, 1, 14, 22, w[1]); p.r(2, 2, 12, 20, w[0]); for (let y = 7; y < 22; y += 7) p.r(1, y, 14, 2, w[3]); const it = ['#d8353a', '#3aa8f0', '#ffd23e', '#3dd49a', '#efeada', '#b06a36']; for (let i = 0; i < 9; i++) p.r(3 + (i % 3) * 4, 3 + Math.floor(i / 3) * 7 + (i % 2), 2, 4 - (i % 2), it[i % 6]); sd('shelf', p.outline(OUT)); }
    const bed = (c) => { const p = P(16, 30), w = PAL.wood; p.r(1, 1, 14, 28, w[1]); p.r(1, 1, 14, 3, w[3]); p.r(1, 1, 14, 1, w[4]); p.r(2, 4, 12, 23, '#efeada'); p.r(3, 5, 10, 5, '#ffffff'); p.r(3, 9, 10, 1, '#b5ae98'); p.r(2, 12, 12, 15, c); p.r(2, 12, 12, 1, lite(c, .4)); p.r(2, 12, 1, 15, lite(c, .2)); p.r(13, 12, 1, 15, dark(c, .3)); p.r(1, 27, 14, 2, w[2]); return p.outline(OUT); };
    sd('bed', bed('#c0463a')); sd('bed2', bed('#4479a8'));
    /* постройки игрока и станки */
    { const p = P(18, 12), L = PAL.stone; for (let a = 0; a < 8; a++) { const x = 9 + Math.cos(a * .785) * 6, y = 7 + Math.sin(a * .785) * 3; p.e(x, y, 2, 1.6, L[a % 2 ? 2 : 3]); } p.e(9, 7, 4, 2, PAL.coal[1]); p.l(5, 8, 12, 5, PAL.trunk[2]); p.l(6, 5, 13, 8, PAL.trunk[3]); sd('campfire', p.outline(OUT)); }
    for (let f = 0; f < 4; f++) { const p = P(12, 16), F = PAL.fire, hh = [10, 12, 11, 13][f], sw = [0, 1, 0, -1][f]; for (let y = 0; y < hh; y++) { const t = y / hh, w = Math.max(.6, Math.sin(Math.min(1, t * 1.25) * Math.PI) * 3.6 + .4), cx = 6 + sw * (1 - t) * 1.2; for (let x = Math.round(cx - w); x < Math.round(cx + w); x++) { const d = Math.abs(x + .5 - cx) / w; let c = F[1]; if (d < .75) c = F[2]; if (d < .45 && t > .25) c = F[3]; if (d < .25 && t > .55) c = F[4]; if (t < .15) c = F[0]; p.d(x, 15 - hh + y, c); } } if (f % 2) p.d(6 + sw, 15 - hh - 2, F[2]); S('flame' + f, p); }
    { const p = P(8, 20), w = PAL.wood; p.r(3, 6, 2, 13, w[2]); p.r(3, 6, 1, 13, w[3]); p.r(2, 4, 4, 3, PAL.coal[2]); p.r(2, 18, 4, 1, w[0]); sd('torchp', p.outline(OUT)); }
    { const p = P(20, 20), w = PAL.wood; p.r(1, 6, 18, 5, w[3]); p.r(1, 6, 18, 1, w[4]); p.r(1, 10, 18, 1, w[0]); p.r(2, 11, 2, 8, w[1]); p.r(16, 11, 2, 8, w[1]); p.r(4, 14, 12, 1, w[1]); p.r(4, 3, 5, 3, PAL.stone[3]); p.r(5, 2, 1, 2, w[2]); p.l(11, 5, 16, 2, PAL.stone[4]); p.r(15, 1, 2, 2, w[3]); p.r(10, 4, 3, 2, w[2]); sd('workbench', p.outline(OUT)); }
    const furnace = lit => { const p = P(20, 26), L = PAL.stone; for (let y = 3; y < 25; y++) { const hw = y < 9 ? 4 + (y - 3) * .7 : 9; for (let x = Math.round(10 - hw); x < 10 + hw; x++) { let c = L[2]; if ((x + ((y >> 2) & 1) * 3) % 6 === 5 || y % 4 === 3) c = L[0]; else if (y % 4 === 0) c = L[3]; if (x < 10 - hw + 1) c = L[4]; p.d(x, y, c); } } p.r(7, 0, 6, 4, L[1]); p.r(7, 0, 6, 1, L[3]); p.r(6, 15, 8, 7, '#0d0b14'); if (lit) { p.r(7, 17, 6, 5, PAL.fire[1]); p.r(8, 18, 4, 4, PAL.fire[2]); p.r(9, 19, 2, 3, PAL.fire[4]); } else p.r(7, 20, 6, 2, PAL.coal[2]); return p.outline(OUT); };
    sd('furnace0', furnace(0)); sd('furnace1', furnace(1));
    { const p = P(24, 22), L = PAL.stone, I = ['#22242e', '#3a3d4c', '#5a5f72', '#8a90a4', '#c0c6d6']; p.r(1, 8, 10, 13, L[1]); p.r(1, 8, 10, 1, L[3]); p.r(3, 11, 6, 6, '#0d0b14'); p.r(4, 13, 4, 4, PAL.fire[1]); p.r(5, 14, 2, 3, PAL.fire[3]); p.r(3, 2, 3, 6, L[2]); p.r(13, 10, 10, 3, I[3]); p.r(13, 10, 10, 1, I[4]); p.r(11, 11, 3, 1, I[2]); p.r(15, 13, 6, 3, I[1]); p.r(14, 16, 8, 4, I[2]); p.r(14, 16, 8, 1, I[3]); p.l(16, 8, 21, 5, PAL.wood[3]); p.r(20, 3, 3, 3, I[2]); sd('forge', p.outline(OUT)); }
    { const p = P(18, 20), L = PAL.stone, I = ['#22242e', '#3a3d4c', '#5a5f72', '#8a90a4']; p.r(2, 2, 1, 14, PAL.wood[1]); p.r(15, 2, 1, 14, PAL.wood[1]); p.r(2, 2, 14, 1, PAL.wood[3]); p.blob([[9, 11, 5.4, 4.4]], I, { noise: .05, flat: 4 }); p.r(4, 7, 10, 1, I[3]); p.e(9, 8, 4, 1.2, '#b06a36'); p.d(8, 8, '#e07a3a'); p.d(11, 8, '#5cb055'); p.r(9, 3, 1, 4, I[2]); for (let a = 0; a < 5; a++) p.e(4 + a * 2.6, 17, 1.6, 1.3, L[a % 2 ? 2 : 3]); p.r(7, 16, 4, 1, PAL.fire[2]); sd('kitchen', p.outline(OUT)); }
    { const p = P(32, 28), c = PAL.cloth, t = ['#7a4a2a', '#a36a3a', '#c98a4c', '#e3ac68']; for (let y = 3; y < 26; y++) { const hw = (y - 2) * .62; for (let x = Math.round(16 - hw); x < 16 + hw; x++) { let cl = x < 16 ? t[2] : t[1]; if (Math.abs(x - 16) < (y - 12) * .28 && y > 12) cl = x < 16 ? '#1b1526' : '#0d0b14'; if (x === Math.round(16 - hw)) cl = t[3]; if ((x + y) % 7 === 0 && cl !== '#0d0b14' && cl !== '#1b1526') cl = t[0]; p.d(x, y, cl); } } p.r(15, 1, 2, 4, PAL.wood[2]); p.d(3, 25, PAL.wood[1]); p.d(28, 25, PAL.wood[1]); sd('tent', p.outline(OUT)); }
    { const mk = wet => { const p = P(16, 16), d = wet ? ['#2e1f1a', '#402a22', '#57382c'] : PAL.dirt; for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { let c = d[1]; if (y % 4 === 1) c = d[0]; if (y % 4 === 3) c = d[2]; if (H(x, y, 2) < .1) c = d[0]; if (x === 0 || y === 0 || x === 15 || y === 15) c = PAL.wood[x === 0 || y === 0 ? 3 : 1]; p.d(x, y, c); } return p; }; sd('plot_d', mk(0)); sd('plot_w', mk(1)); }
    { const p = P(34, 60), w = PAL.wood; p.r(4, 22, 3, 36, w[1]); p.r(27, 22, 3, 36, w[0]); p.r(4, 22, 1, 36, w[3]); p.l(6, 30, 27, 44, w[1]); p.l(27, 30, 6, 44, w[1]); p.l(6, 44, 27, 57, w[1]); p.l(27, 44, 6, 57, w[1]); p.r(2, 16, 30, 7, w[2]); p.r(2, 16, 30, 1, w[4]); p.r(2, 22, 30, 1, w[0]); for (let x = 5; x < 30; x += 4) p.r(x, 17, 1, 5, w[1]); p.r(3, 6, 2, 10, w[2]); p.r(29, 6, 2, 10, w[1]); for (let y = 0; y < 7; y++) { const hw = 3 + y * 2.4; p.r(17 - hw, y, hw * 2, 1, PAL.thatch[y % 2 ? 2 : 3]); } p.r(15, 30, 4, 28, w[2]); for (let y = 31; y < 58; y += 3) p.r(15, y, 4, 1, w[4]); sd('tower', p.outline(OUT)); }
    { const p = P(12, 14), c = ['#6a3a2c', '#8f5038', '#b56a48', '#d48c60']; p.r(2, 8, 8, 5, c[2]); p.r(2, 8, 8, 1, c[3]); p.r(3, 12, 6, 1, c[0]); p.r(5, 4, 1, 4, '#3e8c47'); p.e(4, 3, 2, 2, '#ff6f91'); p.e(8, 4, 2, 2, '#ffe066'); p.d(6, 6, '#7bc862'); p.d(4, 3, '#ffe066'); sd('flowerpot', p.outline(OUT)); }
    { const p = P(12, 28), w = PAL.wood; p.r(2, 1, 1, 26, w[2]); p.r(1, 26, 3, 1, w[0]); for (let y = 2; y < 16; y++) for (let x = 3; x < 11; x++) { if (y > 12 && Math.abs(x - 7) < (y - 12)) continue; p.d(x, y, x < 5 ? '#de6a4c' : x > 8 ? '#963030' : '#c0463a'); } p.e(7, 7, 1.8, 1.8, PAL.gold[3]); sd('banner', p.outline(OUT)); }
    { const p = P(16, 16); for (let y = 1; y < 15; y++) for (let x = 0; x < 16; x++) { let c = '#963030'; if (y === 1 || y === 14) c = PAL.gold[2]; else if (y === 2 || y === 13) c = '#6a1f26'; else if ((x + y) % 6 === 0 || (x - y + 16) % 6 === 0) c = PAL.gold[3]; else if (H(x, y, 4) < .1) c = '#c0463a'; p.d(x, y, c); } sd('rug', p); }
    { const p = P(20, 30), w = PAL.wood; p.r(9, 8, 2, 21, w[1]); p.r(2, 12, 16, 2, w[2]); p.r(5, 10, 10, 9, '#4479a8'); p.r(5, 10, 10, 1, '#68a0cc'); p.r(7, 19, 6, 2, '#2d5680'); p.e(10, 5.5, 4, 4, PAL.copper[3]); p.d(8, 5, OUT); p.d(11, 5, OUT); p.r(8, 7, 4, 1, OUT); p.r(6, 0, 8, 2, PAL.thatch[2]); p.r(4, 2, 12, 1, PAL.thatch[1]); p.d(1, 13, PAL.thatch[3]); p.d(18, 13, PAL.thatch[3]); sd('scarecrow', p.outline(OUT)); }
    /* посевы: 4 стадии */
    const crops = { carrot: ['#56aa52', '#e5741f'], potato: ['#3e8c47', '#c9a66b'], wheat: ['#b8a25c', '#f5d76a'], cabbage: ['#56aa52', '#a8e072'], berry: ['#3b8c49', '#e23a5c'], pumpkin: ['#3e8c47', '#f08a24'], herb: ['#3d9c6a', '#d6ffd8'] };
    for (const id in crops) for (let st = 0; st < 4; st++) {
      const [g, f] = crops[id], p = P(16, 18), gd = dark(g, .3), gl = lite(g, .3);
      if (st === 0) { for (const x of [4, 8, 12]) { p.d(x, 13, gl); p.d(x, 14, g); } }
      else if (id === 'wheat') { for (let i = 0; i < 5; i++) { const x = 3 + i * 2.5, top = 14 - st * 3 - (i % 2); p.r(x, top, 1, 15 - top, st === 3 ? '#c9a044' : g); if (st >= 2) { p.r(x, top - 2, 1, 3, f); p.d(x + 1, top - 1, st === 3 ? '#fff3a8' : gl); } } }
      else if (id === 'cabbage' || id === 'pumpkin') { const r = 1.5 + st * 1.4; for (let i = 0; i < 4; i++) p.d(4 + i * 3, 14 - (i % 2), g); p.blob([[8, 14 - r * .7, r + .5, r]], id === 'pumpkin' && st === 3 ? [dark(f, .4), dark(f, .15), f, lite(f, .3)] : [gd, g, gl, lite(gl, .3)], { noise: .2 }); if (id === 'pumpkin' && st === 3) { p.d(8, 14 - r * 1.7, gd); p.d(8, 15 - r * 1.7, g); } if (id === 'pumpkin' && st === 2) p.e(8, 13, 1.5, 1.5, f); }
      else { for (const bx of [4, 8, 12]) { const hh = 2 + st * 2 + (bx === 8 ? 1 : 0); p.r(bx, 15 - hh, 1, hh, g); p.d(bx - 1, 15 - hh + 1, gl); p.d(bx + 1, 15 - hh + 2, gl); if (st >= 2) { p.d(bx - 1, 15 - hh - 1 + st, g); p.d(bx + 1, 14 - hh + st, gd); } if (st === 3) { if (id === 'carrot' || id === 'potato') { p.d(bx, 15, f); p.d(bx, 16, f); p.d(bx - 1, 15, lite(f, .3)); } else { p.d(bx, 14 - hh, f); p.d(bx + 1, 15 - hh + 1, f); p.d(bx - 1, 17 - hh, f); } } } }
      S('crop_' + id + st, p.outline(OUT));
    }
    /* мелочи мира */
    { const p = P(14, 12), w = PAL.wood; p.r(1, 3, 12, 8, w[2]); p.r(1, 3, 12, 1, w[4]); p.r(1, 10, 12, 1, '#2e7fc0'); p.r(6, 3, 2, 7, w[0]); p.r(1, 6, 12, 1, w[1]); sd('flotsam', p.outline(OUT)); }
    { const p = P(10, 5); p.e(4.5, 2.5, 3.4, 1.6, '#12305a70'); p.d(8, 1, '#12305a70'); p.d(9, 2, '#12305a70'); p.d(8, 3, '#12305a70'); sd('fishsh', p); }
    { const p = P(5, 6); p.r(1, 0, 3, 3, '#d8353a'); p.r(1, 3, 3, 2, '#ffffff'); p.d(2, 0, '#ff8a8a'); sd('bobber', p.outline(OUT)); }
    for (let f = 0; f < 2; f++) { const p = P(12, 8); p.r(4, 3, 4, 2, '#3b3f4d'); p.d(8, 3, '#ffc23e'); if (f) { p.l(1, 1, 4, 3, '#565c6c'); p.l(7, 3, 10, 1, '#565c6c'); } else { p.l(1, 5, 4, 3, '#565c6c'); p.l(7, 3, 10, 5, '#565c6c'); } S('birdfly' + f, p); }
    for (let k = 0; k < 3; k++) for (let f = 0; f < 2; f++) { const c = ['#ffe066', '#ff8fb4', '#8fd8ff'][k], p = P(7, 6); p.d(3, 2, OUT); p.d(3, 3, OUT); if (f) { p.r(1, 1, 2, 3, c); p.r(4, 1, 2, 3, c); p.d(0, 1, c); p.d(6, 1, c); } else { p.r(2, 1, 1, 3, c); p.r(4, 1, 1, 3, c); } S('bfly' + k + f, p); }
    { const p = P(5, 3); p.r(0, 0, 2, 3, '#14102630'); p.r(3, 0, 2, 3, '#14102630'); S('foot', p); }
    /* мягкое пятно света с пиксельными ступенями */
    { const n = 64, p = P(n, n); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const d = Math.hypot(x + .5 - n / 2, y + .5 - n / 2) / (n / 2); if (d >= 1) continue; let a = Math.floor((1 - d) * 6) / 5; if (a > 1) a = 1; const dth = ((x + y) % 2) ? 0 : .06; a = G.clamp(a * .85 + dth * (1 - d), 0, 1); p.b[y * n + x] = ((Math.round(a * 255) << 24) | 0xffffff) >>> 0; } S('light', p); }
    { const p = P(96, 56), r = G.rng(5); const cs = []; for (let i = 0; i < 7; i++) cs.push([20 + r() * 56, 18 + r() * 20, 12 + r() * 10, 9 + r() * 6]); for (let y = 0; y < 56; y++) for (let x = 0; x < 96; x++) { let ins = false; for (const c of cs) { const dx = (x - c[0]) / c[2], dy = (y - c[1]) / c[3]; if (dx * dx + dy * dy < 1) { ins = true; break; } } if (ins) p.d(x, y, '#140f2620'); } S('cloud', p); }
  }

  A.P = P; A.S = S;
  A.init = () => { buildTiles(); buildObjects(); if (A.initPretty) A.initPretty(); if (A.initChars) A.initChars(); };
})();
