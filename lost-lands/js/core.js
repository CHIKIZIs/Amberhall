'use strict';
/* Pixel Survival: Lost Lands — ядро: пространство имён, математика, ГСЧ, шум, шина событий. */
const G = window.G = { TS: 16, VERSION: 1 };

G.clamp = (v, a, b) => v < a ? a : v > b ? b : v;
G.lerp = (a, b, t) => a + (b - a) * t;
G.dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
G.rnd = (a, b) => a + Math.random() * (b - a);
G.rndi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
G.pick = arr => arr[Math.floor(Math.random() * arr.length)];
G.chance = p => Math.random() < p;

/* Детерминированный ГСЧ (mulberry32) */
G.rng = seed => {
  let s = seed >>> 0;
  const f = () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  f.int = (a, b) => Math.floor(a + f() * (b - a + 1));
  f.pick = arr => arr[Math.floor(f() * arr.length)];
  f.chance = p => f() < p;
  return f;
};

/* Хэш координат -> [0,1) */
G.hash = (x, y, s) => {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul((s | 0) + 1, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  h = Math.imul(h, 2246822519);
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
};

G.vnoise = (x, y, s) => {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = G.hash(xi, yi, s), b = G.hash(xi + 1, yi, s), c = G.hash(xi, yi + 1, s), d = G.hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
G.fbm = (x, y, s, oct) => {
  let a = 0, amp = 0.5, f = 1, n = 0;
  for (let i = 0; i < (oct || 4); i++) { a += G.vnoise(x * f, y * f, s + i * 131) * amp; n += amp; amp *= 0.5; f *= 2; }
  return a / n;
};

/* Шина событий: системы общаются между собой без жёстких связей */
G.bus = {
  h: {},
  on(e, fn) { (this.h[e] || (this.h[e] = [])).push(fn); },
  emit(e, d) { const l = this.h[e]; if (l) for (let i = 0; i < l.length; i++) l[i](d); }
};

G.seedOf = str => { str = String(str == null ? '' : str).trim(); if (!str) return Math.floor(Math.random() * 2147483647); if (/^-?\d{1,15}$/.test(str)) return Math.abs(Number(str)) % 2147483647; let h = 0; for (let i = 0; i < str.length; i++) h = (Math.imul(h, 31) + str.charCodeAt(i)) | 0; return Math.abs(h) % 2147483647; };
G.fmt = n => String(Math.round(n));
G.el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
G.$ = id => document.getElementById(id);
