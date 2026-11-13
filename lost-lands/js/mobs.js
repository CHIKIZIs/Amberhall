'use strict';
/* Существа в стиле героя: чиби-пропорции, контур #0d0b1a, плоская заливка в 3 тона, глаза с белым бликом. */
(() => {
  const A = G.Art, P = A.P, OUT = '#0d0b1a', dark = A.dark, lite = A.lite;
  const tri = c => [dark(c, .32), c, lite(c, .32)];
  const EYE = '#24121e';

  /* Деталь: рисуется на своём холсте, обводится контуром и накладывается — так линии между частями как у героя */
  class Part {
    constructor(w, h) { this.p = P(w, h); }
    /* эллипс с плоской светотенью: свет сверху-слева */
    cel(cx, cy, rx, ry, c3, o) {
      o = o || {}; const p = this.p;
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const nx = (x + .5 - cx) / rx, ny = (y + .5 - cy) / ry, d = nx * nx + ny * ny; if (d > 1) continue;
        if (o.flatBottom && y > cy + ry * o.flatBottom) continue;
        const v = -(nx * .55 + ny * .85) + (d < .35 ? .15 : 0);
        p.d(x, y, v > .5 ? c3[2] : v < -.42 || (d > .72 && ny > .25) ? c3[0] : c3[1]);
      }
      return this;
    }
    rect(x, y, w, h, c3) { const p = this.p; p.r(x, y, w, h, c3[1]); p.r(x, y, 1, h, c3[2]); p.r(x, y, w, 1, c3[2]); p.r(x + w - 1, y + 1, 1, h - 1, c3[0]); p.r(x + 1, y + h - 1, w - 1, 1, c3[0]); return this; }
    poly(pts, c) { const p = this.p; let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      for (let y = Math.floor(y0); y <= y1; y++) for (let x = Math.floor(x0); x <= x1; x++) { let ins = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if (((yi > y + .5) !== (yj > y + .5)) && (x + .5 < (xj - xi) * (y + .5 - yi) / (yj - yi) + xi)) ins = !ins; } if (ins) p.d(x, y, c); } return this; }
    px(x, y, c) { this.p.d(x, y, c); return this; }
    on(dst, x, y, noLine) { if (!noLine) this.p.outline(OUT); dst.st(this.p, x || 0, y || 0); return dst; }
  }
  const part = (w, h) => new Part(w, h);
  /* глаз героя: 2x3, белый блик в левом верхнем углу; small — 1x2 */
  const eye = (p, x, y, small, col) => { if (small) { p.d(x, y, col || EYE); p.d(x, y + 1, col || EYE); return; } p.r(x, y, 2, 3, col || EYE); p.d(x, y, '#ffffff'); };

  const DRAW = {
    slime(o) { const p = P(22, 18), c = o.pal, sq = [0, 1, 0, -1][o.f] + (o.a ? -1 : 0), h = 7 - sq, w = 9 + sq;
      part(22, 18).cel(11, 17 - h, w, h, [c[0], c[1], c[2]], { flatBottom: .62 }).on(p);
      p.r(5, 15 - h + 1, 2, 1, c[3]); p.d(5, 16 - h + 2, c[3]); p.d(7, 14 - h + 2, '#ffffff');
      eye(p, 12, 17 - h - 2); eye(p, 16, 17 - h - 2);
      if (o.a) { p.r(13, 17 - h + 2, 3, 1, OUT); p.d(14, 17 - h + 3, '#e04a5a'); }
      return p; },
    rabbit(o) { const p = P(18, 16), c = ['#b5a591', '#ece2cf', '#ffffff'], hop = [0, -1, -2, -1][o.f];
      part(18, 16).cel(7, 11 + hop, 5, 3.6, c).on(p);
      for (const ex of [10, 12]) part(18, 16).poly([[ex, 7 + hop], [ex + 1.5, -1 + hop + (ex - 10)], [ex + 3, 7 + hop]], c[1]).px(ex + 1, 3 + hop + (ex - 10), '#f2a0a8').px(ex + 1, 4 + hop + (ex - 10), '#f2a0a8').on(p);
      part(18, 16).cel(12, 8.5 + hop, 4, 3.5, c).on(p);
      eye(p, 13, 7 + hop, 1); p.d(15, 9 + hop, '#e86a7a');
      part(18, 16).cel(2.5, 10 + hop, 1.8, 1.8, ['#d9d3be', '#ffffff', '#ffffff']).on(p);
      if (!hop) { p.r(4, 14, 3, 1, OUT); p.r(9, 14, 3, 1, OUT); }
      return p; },
    fox(o) { const p = P(24, 17), c = tri('#e8732a'), l = [0, 1, 0, -1][o.f];
      part(24, 17).poly([[1, 6 + (o.f % 2)], [7, 7], [8, 11], [3, 11 + (o.f % 2)]], c[1]).px(1, 6 + (o.f % 2), '#ffffff').px(2, 7 + (o.f % 2), '#ffffff').px(2, 6 + (o.f % 2), '#ffffff').on(p);
      for (const [x, s] of [[7, l], [11, -l], [14, l]]) part(24, 17).rect(x + s, 11, 2, 4, [c[0], c[0], c[1]]).on(p);
      part(24, 17).cel(11, 9.5, 6.5, 3.4, c).on(p);
      part(24, 17).poly([[14, 5], [15, 0], [17.5, 4]], c[1]).poly([[18, 4], [20, 0], [21, 5]], c[0]).px(15, 2, OUT).px(20, 2, OUT).on(p);
      part(24, 17).cel(18, 6.5, 4, 3.6, c).poly([[19, 7], [23.5, 8], [19, 10.5]], '#ffffff').on(p);
      p.d(23, 8, OUT); eye(p, 18, 5); p.r(13, 10, 4, 2, '#ffe6c8');
      return p; },
    deer(o) { const p = P(26, 26), c = tri('#a8683e'), l = [0, 1, 0, -1][o.f];
      for (const [x, s] of [[6, l], [9, -l], [15, l], [18, -l]]) part(26, 26).rect(x + s, 16, 2, 8, [c[0], c[0], c[1]]).px(x + s, 23, OUT).px(x + s + 1, 23, OUT).on(p);
      part(26, 26).cel(12, 14, 8, 4, c).on(p);
      for (const [x, y] of [[8, 12], [11, 11], [14, 12], [10, 14]]) p.d(x, y, '#f2d8b0');
      part(26, 26).poly([[17, 13], [19, 6], [22, 7], [21, 14]], c[1]).on(p);
      part(26, 26).poly([[18, 3], [17, 0], [18, 1], [19, 0], [19, 3]], '#efe0c0').poly([[21, 3], [21, 0], [22, 1], [23, 0], [22, 3]], '#efe0c0').on(p);
      part(26, 26).cel(20.5, 5.5, 3.6, 3, c).poly([[22, 5], [25.5, 6.5], [22, 8.5]], c[2]).on(p);
      p.d(25, 6, OUT); eye(p, 20, 4, 1); p.r(3, 12, 2, 2, '#ffffff');
      return p; },
    bird(o) { const p = P(16, 14), c = tri('#4f7fc8'), up = o.f % 2;
      part(16, 14).cel(7, 8, 4.6, 3.8, c).on(p);
      part(16, 14).cel(11, 5, 3, 3, c).on(p);
      part(16, 14).poly(up ? [[3, 7], [6, 1], [9, 7]] : [[3, 7], [6, 12], [9, 7]], c[0]).on(p);
      p.r(14, 5, 2, 1, '#f2b430'); p.d(14, 6, '#d07a20'); eye(p, 11, 4, 1); p.r(5, 9, 4, 2, '#e8eef8');
      p.d(6, 12, '#d07a20'); p.d(8, 12, '#d07a20');
      return p; },
    imp(o) { const p = P(20, 20), c = tri('#5aa83a'), l = [0, 1, 0, -1][o.f];
      part(20, 20).rect(6 + l, 15, 3, 4, ['#3c6a2a', '#4f8a34', '#6aa844']).on(p); part(20, 20).rect(11 - l, 15, 3, 4, ['#3c6a2a', '#4f8a34', '#6aa844']).on(p);
      part(20, 20).cel(10, 13, 4.5, 3.5, tri('#8a5a32')).on(p);
      part(20, 20).poly([[2, 6], [5, 8], [4, 10]], c[1]).poly([[18, 6], [15, 8], [16, 10]], c[0]).on(p);
      part(20, 20).cel(10, 8, 6.5, 5.5, c).on(p);
      part(20, 20).poly([[4, 4], [10, -1], [16, 4], [10, 5]], '#e04a3a').px(9, 1, '#ff8a6a').px(10, 0, '#ff8a6a').on(p);
      eye(p, 7, 7, 0, o.a ? '#a01a2a' : EYE); eye(p, 11, 7, 0, o.a ? '#a01a2a' : EYE);
      p.r(8, 11, 4, 1, OUT); if (o.a) { p.d(8, 12, '#ffffff'); p.d(11, 12, '#ffffff'); }
      if (o.a) part(20, 20).rect(16, 9, 3, 3, c).on(p);
      return p; },
    spirit(o) { const p = P(20, 24), c = tri('#c06ae8'), b = [0, -1, 0, 1][o.f];
      part(20, 24).cel(10, 10 + b, 7, 7, c).poly([[3, 10 + b], [17, 10 + b], [16, 19 + b], [13, 17 + b], [10, 21 + b], [7, 17 + b], [4, 19 + b]], c[1]).on(p);
      p.r(4, 12 + b, 1, 4, c[2]);
      part(20, 24).poly([[9, 4 + b], [7, -1 + b], [10, 2 + b]], '#62ae3c').poly([[11, 4 + b], [14, 0 + b], [12, 3 + b]], '#86c84a').on(p);
      eye(p, 7, 8 + b, 0, o.a ? '#ffd23e' : EYE); eye(p, 11, 8 + b, 0, o.a ? '#ffd23e' : EYE);
      p.d(6, 12 + b, '#f08ab0'); p.d(13, 12 + b, '#f08ab0');
      return p; },
    golem(o) { const p = P(30, 30), c = tri('#8a8698'), l = [0, 1, 0, -1][o.f], ay = o.a ? -4 : 0;
      part(30, 30).rect(8, 21 + l, 6, 7, c).on(p); part(30, 30).rect(16, 21 - l, 6, 7, c).on(p);
      part(30, 30).rect(6, 10, 18, 13, c).on(p);
      part(30, 30).rect(1, 12 + ay, 5, 10, c).on(p); part(30, 30).rect(24, 12 + ay, 5, 10, c).on(p);
      part(30, 30).rect(9, 2, 12, 9, c).on(p);
      p.r(11, 6, 3, 2, '#ffa040'); p.r(16, 6, 3, 2, '#ffa040'); p.d(11, 6, '#fff0a0'); p.d(16, 6, '#fff0a0');
      p.r(13, 14, 4, 4, '#ffa040'); p.r(14, 15, 2, 2, '#fff0a0');
      for (const [x, y] of [[7, 10], [8, 10], [20, 10], [21, 10], [9, 2], [10, 2], [19, 2], [1, 12], [2, 12], [27, 12]]) p.d(x, y, '#6cb844');
      p.d(8, 16, c[0]); p.d(9, 17, c[0]); p.d(21, 18, c[0]);
      return p; },
    bat(o) { const p = P(20, 14), c = tri('#6a4a8a'), up = o.f % 2;
      const w1 = up ? [[8, 6], [1, 1], [3, 5], [0, 7], [8, 9]] : [[8, 6], [1, 11], [3, 8], [0, 7], [8, 9]];
      part(20, 14).poly(w1, c[0]).on(p); part(20, 14).poly(w1.map(([x, y]) => [19 - x, y]), c[0]).on(p);
      part(20, 14).cel(10, 7.5, 3.5, 3.5, c).poly([[7, 5], [7, 1], [9, 4]], c[1]).poly([[13, 5], [13, 1], [11, 4]], c[1]).on(p);
      p.d(9, 7, '#ff5a6a'); p.d(11, 7, '#ff5a6a'); if (o.a) { p.d(9, 10, '#ffffff'); p.d(11, 10, '#ffffff'); }
      return p; },
    crawler(o) { const p = P(24, 14), c = tri('#7a5a3a'), l = o.f % 2;
      for (let i = 0; i < 3; i++) { const x = 6 + i * 4; part(24, 14).poly([[x, 9], [x - 2 + l * 3, 13], [x + 1, 9]], c[0]).on(p); }
      part(24, 14).cel(10, 8, 8, 4.4, tri('#5a8a3a'), { flatBottom: .7 }).on(p);
      p.r(10, 4, 1, 7, '#2e5a24'); p.d(6, 6, '#a8d070'); p.d(7, 5, '#a8d070');
      part(24, 14).cel(19, 9, 3.5, 3, c).on(p);
      eye(p, 19, 7, 1, '#ff5a6a'); p.d(23, 10 - (o.a ? 2 : 0), '#f2e0b0'); p.d(23, 11, '#f2e0b0');
      return p; },
    skeleton(o) { const p = P(20, 26), b = ['#a8a090', '#e8e2d0', '#ffffff'], l = [0, 1, 0, -1][o.f];
      part(20, 26).rect(6 + l, 19, 3, 6, b).on(p); part(20, 26).rect(11 - l, 19, 3, 6, b).on(p);
      part(20, 26).rect(5, 12, 10, 8, b).on(p); for (let y = 14; y < 19; y += 2) p.r(7, y, 6, 1, '#a8a090');
      part(20, 26).rect(o.a ? 14 : 15, o.a ? 10 : 12, 3, 6, b).on(p);
      part(20, 26).poly(o.a ? [[16, 10], [19, 1], [20, 2], [17, 11]] : [[17, 16], [19, 6], [20, 7], [18, 17]], '#c8ccd8').on(p);
      part(20, 26).cel(10, 7, 6.5, 6, b).on(p);
      p.r(6, 6, 3, 3, OUT); p.r(11, 6, 3, 3, OUT); p.d(7, 7, '#5af0b0'); p.d(12, 7, '#5af0b0'); p.r(9, 10, 2, 1, OUT); p.r(7, 11, 6, 1, '#a8a090');
      part(20, 26).rect(4, 0, 12, 3, tri('#6a6a80')).on(p);
      return p; },
    guardian(o) { const alt = o.alt, c = tri(alt ? '#7a4aa8' : '#4f7a96'), g = tri('#e8b030'), p = P(26, 30), l = [0, 1, 0, -1][o.f], glow = alt ? '#ff4f6a' : '#7ef0ff';
      part(26, 30).rect(8 + l, 22, 4, 7, c).on(p); part(26, 30).rect(14 - l, 22, 4, 7, c).on(p);
      part(26, 30).rect(6, 12, 14, 11, c).on(p); p.r(7, 13, 12, 1, g[1]); p.r(12, 14, 2, 8, g[1]); p.r(12, 16, 2, 2, glow);
      part(26, 30).cel(3.5, 17, 3.5, 6, c).cel(3.5, 17, 1.6, 3, g).on(p);
      if (o.a) { part(26, 30).rect(19, 9, 4, 4, c).on(p); part(26, 30).poly([[21, 9], [25, 0], [26, 1], [23, 10]], '#dfe6f0').on(p); }
      else { part(26, 30).rect(20, 13, 4, 6, c).on(p); part(26, 30).poly([[21, 13], [23, 2], [24, 3], [23, 14]], '#dfe6f0').on(p); }
      part(26, 30).cel(13, 7, 7, 6, c).on(p);
      p.r(8, 6, 10, 2, OUT); p.r(9, 6, 2, 2, glow); p.r(15, 6, 2, 2, glow); p.r(12, 0, 2, 2, g[2]); p.r(8, 10, 10, 1, g[1]);
      return p; },
    wolf(o) { const p = P(28, 19), c = tri('#8aa0c0'), l = [0, 2, 0, -2][o.f];
      part(28, 19).poly([[0, 6 + (o.f % 2)], [7, 8], [8, 12], [2, 11]], c[1]).px(1, 7 + (o.f % 2), '#ffffff').on(p);
      for (const [x, s] of [[7, l], [10, -l], [16, l], [19, -l]]) part(28, 19).rect(x + s, 12, 2, 6, [c[0], c[0], c[1]]).on(p);
      part(28, 19).cel(13, 10, 8, 4, c).on(p); p.r(9, 7, 6, 1, c[2]);
      part(28, 19).poly([[18, 5], [19, 0], [21, 4]], c[1]).poly([[22, 4], [24, 0], [24, 5]], c[0]).on(p);
      part(28, 19).cel(21.5, 7.5, 4.4, 3.8, c).poly([[23, 7], [27.5, 9], [23, 11]], c[2]).on(p);
      p.d(27, 9, OUT); eye(p, 21, 6, 0, '#5ad0f0'); p.d(21, 6, '#ffffff');
      if (o.a) { p.r(23, 11, 4, 1, '#c03040'); p.d(24, 10, '#ffffff'); p.d(26, 10, '#ffffff'); }
      return p; },
    frost(o) { const p = P(24, 30), c = tri('#62b0f0'), b = [0, -1, 0, 1][o.f], ay = o.a ? -5 : 0;
      const shard = (x, y, w, h, s) => part(24, 30).poly([[x, y + h * .35], [x + w / 2, y], [x + w, y + h * .35], [x + w / 2, y + h]], s ? c[0] : c[1]).poly([[x + 1, y + h * .35], [x + w / 2, y + 1], [x + w / 2, y + h - 2]], c[2]).on(p);
      shard(7, 19 + b, 4, 9, 1); shard(13, 19 + b, 4, 9, 1);
      shard(0, 9 + b + ay, 6, 12, 1); shard(18, 9 + b + ay, 6, 12, 1);
      shard(5, 4 + b, 14, 20);
      eye(p, 9, 10 + b, 0, '#1f3f8c'); eye(p, 13, 10 + b, 0, '#1f3f8c'); p.r(11, 15 + b, 2, 2, '#ffffff');
      return p; },
    shade(o) { const p = P(20, 26), c = ['#14102a', '#241c44', '#3a2e66'], b = [0, -1, 0, 1][o.f];
      part(20, 26).cel(10, 9 + b, 7, 7, c).poly([[3, 9 + b], [17, 9 + b], [16, 22 + b], [13, 19 + b], [10, 24 + b], [7, 19 + b], [4, 22 + b]], c[1]).on(p);
      p.r(6, 7 + b, 8, 4, '#07060d'); p.r(7, 8 + b, 2, 2, '#ff4f6a'); p.r(11, 8 + b, 2, 2, '#ff4f6a'); p.d(7, 8 + b, '#ffd0d8'); p.d(11, 8 + b, '#ffd0d8');
      part(20, 26).rect(o.a ? 0 : 1, o.a ? 9 + b : 12 + b, 3, 5, c).on(p); part(20, 26).rect(o.a ? 17 : 16, o.a ? 9 + b : 12 + b, 3, 5, c).on(p);
      return p; }
  };
  const SLIME = { slime: ['#2f8a3a', '#4cb84a', '#86e070', '#d0ffc0'], pslime: ['#a8306a', '#e05a98', '#ff9ac4', '#ffe0f0'], islime: ['#3a6aa8', '#5aa0e0', '#9ad8ff', '#e6f8ff'] };

  const mcache = {};
  A.mobFrame = (def, f, atk, flip, hit) => {
    const key = def.id + '|' + f + (atk ? 'a' : '') + (flip ? 'f' : '') + (hit ? 'h' : ''); let cv = mcache[key]; if (cv) return cv;
    let p = DRAW[def.spr]({ f, a: atk, pal: SLIME[def.id] || (def.pal && def.pal.length ? def.pal : SLIME.slime), alt: def.pal === 1 });
    if (hit) for (let i = 0; i < p.b.length; i++) if (p.b[i] >>> 24) p.b[i] = 0xffffffff;
    if (flip) p = p.flip();
    let c = p.can(); const s = def.scale || 1;
    if (s !== 1) { const z = document.createElement('canvas'); z.width = Math.round(c.width * s); z.height = Math.round(c.height * s); const x = z.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(c, 0, 0, z.width, z.height); c = z; }
    return mcache[key] = c;
  };
})();
