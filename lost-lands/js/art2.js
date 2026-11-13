'use strict';
/* Art II: персонаж (бумажная кукла с экипировкой), существа, иконки предметов и интерфейса. */
(() => {
  const A = G.Art, P = A.P, dark = A.dark, lite = A.lite, OUT = A.OUT, PAL = A.PAL, H = G.hash;
  const pal5 = c => [dark(c, .55), dark(c, .28), c, lite(c, .35), lite(c, .7)];

  /* ---------- ПЕРСОНАЖ ---------- */
  const cache = {};
  /* pose: d — направление (0 вниз,1 вверх,2 влево,3 вправо), leg 0..3, arm 0..5, bob, crouch */
  A.charFrame = (look, d, leg, arm, bob, crouch) => {
    const key = look.k + '|' + d + leg + arm + bob + crouch; let cv = cache[key]; if (cv) return cv;
    const p = P(24, 30), sk = look.skin, skd = dark(sk, .22), hr = look.hair, hrl = lite(hr, .3), sh = look.body, shd = dark(sh, .3), shl = lite(sh, .3), pn = look.pants, bt = look.boots, gl = look.gloves || sk, pk = look.pack, hm = look.helm;
    const by = (bob ? 1 : 0) + (crouch ? 2 : 0), side = d >= 2;
    const legs = () => {
      if (!side) { const l = [[9, 0], [13, 0]]; if (leg === 1) l[0][1] = -2; if (leg === 3) l[1][1] = -2; if (crouch) { l[0][1] = -1; l[1][1] = -1; }
        for (const [x, o] of l) { p.r(x, 23 + (crouch ? 1 : 0), 2, 3 + o, pn); p.r(x, 26 + o + (crouch ? 0 : 0), 2, 2, bt); p.d(x, 27 + o, dark(bt, .3)); } }
      else { const off = [0, 2, 0, -2][leg], o2 = -off; p.r(11 + o2, 23, 2, 3, dark(pn, .25)); p.r(11 + o2 - (o2 ? 0 : 0), 26, 3, 2, dark(bt, .25)); p.r(11 + off, 23, 2, 3, pn); p.r(10 + off, 26, 3, 2, bt); if (leg === 1 || leg === 3) { p.b[27 * 24 + 11 + o2] = 0; p.b[27 * 24 + 12 + o2] = 0; p.b[27 * 24 + 13 + o2] = 0; } }
    };
    const armAt = (x, y, len, hz) => { if (hz) { p.r(x, y, len, 2, sh); p.r(x, y, 2, 2, gl); p.d(x + len - 1, y + 1, shd); } else { p.r(x, y, 2, len, sh); p.r(x, y + len - 2, 2, 2, gl); p.d(x + 1, y, shd); } };
    const body = () => {
      if (!side) { p.r(8, 16 + by, 8, 7 - (crouch ? 1 : 0), sh); p.r(8, 16 + by, 1, 6, shl); p.r(15, 16 + by, 1, 6, shd); p.r(8, 22 + by - (crouch ? 1 : 0), 8, 1, dark(pn, .3)); if (look.armor) { p.r(10, 17 + by, 4, 1, shl); p.r(11, 19 + by, 2, 2, shd); } if (d === 0 && pk) { p.r(9, 16 + by, 1, 5, pk); p.r(14, 16 + by, 1, 5, pk); } if (d === 1 && pk) { p.r(9, 16 + by, 6, 6, pk); p.r(9, 16 + by, 6, 1, lite(pk, .3)); p.r(9, 19 + by, 6, 1, dark(pk, .3)); p.d(12, 20 + by, PAL.gold[3]); } }
      else { if (pk) { p.r(14, 16 + by, 3, 6, pk); p.r(14, 16 + by, 3, 1, lite(pk, .3)); p.r(16, 17 + by, 1, 5, dark(pk, .3)); } p.r(9, 16 + by, 6, 7, sh); p.r(9, 16 + by, 1, 6, shl); p.r(14, 16 + by, 1, 6, shd); p.r(9, 22 + by, 6, 1, dark(pn, .3)); }
    };
    const arms = () => {
      const y = 16 + by;
      if (!side) {
        if (arm === 3) { armAt(6, 10 + by, 6); armAt(16, 10 + by, 6); p.r(6, 10 + by, 2, 2, gl); p.r(16, 10 + by, 2, 2, gl); p.r(6, 14 + by, 2, 2, sh); p.r(16, 14 + by, 2, 2, sh); }
        else if (arm === 4) { if (d === 0) { armAt(9, y + 2, 5); armAt(13, y + 2, 5); } else { p.r(6, y, 2, 3, sh); p.r(16, y, 2, 3, sh); } }
        else { const a = arm === 1 ? -1 : arm === 2 ? 1 : 0; armAt(6, y + a, 6); armAt(16, y - a, 6); }
      } else {
        if (arm === 3) { armAt(9, 10 + by, 6); p.r(9, 10 + by, 2, 2, gl); p.r(9, 14 + by, 2, 2, sh); }
        else if (arm === 4) armAt(4, y + 1, 7, 1);
        else if (arm === 5) armAt(8, y + 2, 6);
        else armAt(11 + (arm === 1 ? -2 : arm === 2 ? 2 : 0), y, 6);
      }
    };
    const head = () => {
      const y = 6 + by + (crouch ? 1 : 0);
      if (!side) {
        p.r(7, y + 1, 10, 9, sk); p.r(8, y, 8, 1, sk); p.r(8, y + 10, 8, 0, sk);
        p.b[(y + 9) * 24 + 7] = 0; p.b[(y + 9) * 24 + 16] = 0;
        if (d === 0) { p.r(7, y, 10, 4, hr); p.r(8, y - 1, 8, 1, hr); p.r(7, y + 4, 1, 3, hr); p.r(16, y + 4, 1, 3, hr); p.r(9, y + 1, 4, 1, hrl); p.d(9, y + 4, hr); p.d(14, y + 4, hr); p.r(9, y + 5, 2, 2, '#241a2c'); p.r(13, y + 5, 2, 2, '#241a2c'); p.d(9, y + 5, '#ffffff'); p.d(13, y + 5, '#ffffff'); p.d(8, y + 7, '#f09a8a'); p.d(15, y + 7, '#f09a8a'); p.r(11, y + 8, 2, 1, skd); }
        else { p.r(7, y, 10, 9, hr); p.r(8, y - 1, 8, 1, hr); p.r(9, y + 1, 4, 1, hrl); p.r(8, y + 9, 8, 1, dark(hr, .25)); }
        if (hm) { p.r(7, y - 1, 10, 4, hm); p.r(8, y - 2, 8, 1, hm); p.r(8, y - 1, 5, 1, lite(hm, .5)); p.r(7, y + 2, 10, 1, dark(hm, .3)); if (d === 0) { p.r(7, y + 3, 1, 3, hm); p.r(16, y + 3, 1, 3, dark(hm, .3)); } else p.r(7, y + 3, 10, 2, hm); }
      } else {
        p.r(8, y + 1, 9, 9, sk); p.r(9, y, 7, 1, sk); p.b[(y + 9) * 24 + 8] = 0; p.b[(y + 9) * 24 + 16] = 0;
        p.r(8, y, 9, 3, hr); p.r(9, y - 1, 7, 1, hr); p.r(12, y + 3, 5, 4, hr); p.r(14, y + 7, 3, 2, hr); p.r(10, y + 1, 4, 1, hrl); p.r(9, y + 5, 2, 2, '#241a2c'); p.d(9, y + 5, '#ffffff'); p.d(8, y + 7, '#f09a8a'); p.d(8, y + 6, skd);
        if (hm) { p.r(8, y - 1, 9, 4, hm); p.r(9, y - 2, 7, 1, hm); p.r(9, y - 1, 4, 1, lite(hm, .5)); p.r(8, y + 2, 9, 1, dark(hm, .3)); p.r(12, y + 3, 5, 3, hm); }
      }
    };
    legs(); if (d === 1) { arms(); body(); head(); } else if (side && (arm === 2)) { arms(); body(); head(); } else { body(); head(); arms(); }
    let q = p.outline(OUT); if (d === 3) q = q.flip();
    return cache[key] = q.can();
  };
  A.lookOf = eq => {
    const g = s => eq && eq[s] ? G.ITEMS[eq[s].id].equip : null, b = g('body'), h = g('head'), f = g('feet'), ha = g('hands'), bk = g('back');
    const L = { skin: '#f6c8a0', hair: '#6a3f2a', body: b ? b.c : '#e06a4a', armor: b && b.armor >= 4 ? 1 : 0, pants: '#3f4a72', boots: f ? f.c : '#5a3a30', gloves: ha ? ha.c : null, pack: bk ? bk.c : null, helm: h ? h.c : null };
    L.k = [L.body, L.boots, L.gloves, L.pack, L.helm].join(','); return L;
  };

  /* ---------- СУЩЕСТВА ---------- */
  /* Каждая функция рисует существо лицом вправо. s — масштаб, f — кадр 0..3, a — атака */
  const MOB = {
    rabbit(p, s, f, a) { const c = ['#8a7a6a', '#b5a591', '#d9cdb8', '#f2eadb', '#ffffff'], hop = [0, -1, -2, -1][f]; p.blob([[7, 9 + hop, 4.4, 3.2], [11, 7.5 + hop, 2.6, 2.4]], c, { noise: .1 }); p.r(10, 2 + hop, 1, 4, c[2]); p.r(12, 3 + hop, 1, 3, c[3]); p.d(10, 3 + hop, '#f0a0a8'); p.d(12, 7 + hop, OUT); p.d(3, 8 + hop, c[4]); p.r(5, 12, 2, 1 + (f % 2), c[1]); p.r(10, 12, 2, 1 + ((f + 1) % 2), c[1]); },
    deer(p, s, f, a) { const c = ['#5a3626', '#7e4f33', '#a56e45', '#c9905e', '#e8c08e'], l = [0, 1, 0, -1][f]; p.r(6 + l, 13, 2, 7, c[1]); p.r(9 - l, 13, 2, 7, c[0]); p.r(14 + l, 13, 2, 7, c[1]); p.r(16 - l, 13, 2, 7, c[0]); p.blob([[11, 11, 6.5, 3.6], [17.5, 7, 2.6, 3.4]], c, { noise: .1 }); p.blob([[19.5, 5, 2.6, 2.2]], c, { noise: .1 }); p.d(21, 5, OUT); p.d(22, 6, '#241a2c'); p.l(18, 3, 17, 0, c[4]); p.l(19, 3, 21, 0, c[4]); p.d(16, 1, c[4]); p.d(22, 1, c[4]); p.d(4, 9, c[4]); p.d(9, 9, c[4]); p.d(12, 10, c[4]); },
    fox(p, s, f, a) { const c = ['#7a2f14', '#b84a1c', '#e0702a', '#f59a4a', '#ffd08a'], l = [0, 1, 0, -1][f]; p.r(6 + l, 10, 2, 3, c[0]); p.r(13 - l, 10, 2, 3, c[0]); p.blob([[9, 8, 5, 2.8], [14.5, 6.5, 2.8, 2.6]], c, { noise: .1 }); p.blob([[3, 7 + (f % 2), 2.8, 2]], c, { noise: .1 }); p.d(1, 7 + (f % 2), '#ffffff'); p.d(0, 7 + (f % 2), '#ffffff'); p.d(13, 3, c[1]); p.d(16, 3, c[1]); p.d(13, 4, c[2]); p.d(16, 4, c[2]); p.d(16, 6, OUT); p.d(18, 7, OUT); p.d(17, 7, '#ffffff'); p.d(16, 8, '#ffffff'); },
    bird(p, s, f, a) { const c = ['#2a3a5a', '#3f5a8a', '#5a82b8', '#8ab0dc', '#d0e6f8']; p.blob([[5.5, 6, 3.4, 2.6], [8.5, 4, 2, 2]], c, { noise: .1 }); p.d(10, 4, '#ffc23e'); p.d(11, 4, '#e5541f'); p.d(8, 3, OUT); if (f % 2) { p.l(3, 5, 1, 2, c[1]); p.l(4, 5, 2, 2, c[2]); } else p.l(2, 6, 0, 7, c[1]); p.d(5, 9, '#e5541f'); p.d(7, 9, '#e5541f'); },
    imp(p, s, f, a) { const c = ['#2a4a1c', '#44702a', '#629a3a', '#8ac44e', '#c0e87a'], l = [0, 1, 0, -1][f]; p.r(5 + l, 12, 2, 3, c[0]); p.r(9 - l, 12, 2, 3, c[0]); p.blob([[8, 9.5, 3.4, 3], [8, 5, 4.2, 3.8]], c, { noise: .12 }); p.l(3, 4, 1, 2, c[2]); p.l(12, 4, 14, 2, c[2]); p.r(6, 4, 2, 2, '#fff0a0'); p.r(10, 4, 2, 2, '#fff0a0'); p.d(7, 5, OUT); p.d(11, 5, OUT); p.r(7, 7, 4, 1, a ? '#d8353a' : OUT); if (a) { p.d(8, 8, '#ffffff'); p.d(10, 8, '#ffffff'); } p.r(12, 9 - (a ? 2 : 0), 3, 1, c[1]); p.r(1, 9, 3, 1, c[1]); p.l(8, 1, 9, 0, '#8ac44e'); },
    slime(p, s, f, a, c) { const sq = [0, 1, 0, -1][f] * s, w = 6 * s + sq, h = 5 * s - sq, cx = p.w / 2, by = p.h - 2; p.blob([[cx, by - h, w, h], [cx, by - h * .5, w * 1.08, h * .55]], c, { noise: .06 }); for (let x = Math.floor(cx - w * 1.1); x <= cx + w * 1.1; x++) for (let y = by - Math.ceil(h * .25); y <= by + 1; y++) if (p.g(x, y) >>> 24 && y > by - 1) p.b[y * p.w + x] = 0; p.r(cx - 2.5 * s, by - h * 1.1, 1.5 * s, 2 * s, OUT); p.r(cx + 1.5 * s, by - h * 1.1, 1.5 * s, 2 * s, OUT); p.d(cx - 2.5 * s, by - h * 1.1, '#ffffff'); p.d(cx + 1.5 * s, by - h * 1.1, '#ffffff'); p.d(cx - 3.5 * s, by - h * 1.6, c[3]); p.d(cx - 2.5 * s, by - h * 1.75, c[3]); if (a) p.r(cx - 1, by - h * .6, 3, 1, OUT); },
    spirit(p, s, f, a) { const c = ['#6a2a8a', '#a04ac0', '#d07af0', '#f0b0ff', '#fff0ff'], bob = [0, -1, 0, 1][f] * s, cx = p.w / 2; p.blob([[cx, 7 * s + bob, 5 * s, 5 * s], [cx, 12 * s + bob, 4 * s, 5 * s]], c, { noise: .12 }); for (let i = -1; i <= 1; i++) { const x = cx + i * 3 * s, len = (3 + ((i + f + 4) % 2) * 2) * s; p.r(x - s * .5, 15 * s + bob, Math.max(1, s), len, c[i ? 1 : 2]); } p.r(cx - 2.5 * s, 6 * s + bob, 1.5 * s, 2.2 * s, a ? '#fff0a0' : '#ffffff'); p.r(cx + 1 * s, 6 * s + bob, 1.5 * s, 2.2 * s, a ? '#fff0a0' : '#ffffff'); p.d(cx - 2 * s, 7 * s + bob, '#3a1a5a'); p.d(cx + 1.5 * s, 7 * s + bob, '#3a1a5a'); p.l(cx - 4 * s, 3 * s + bob, cx - 6 * s, 0 + bob, '#62ae3c'); p.l(cx + 4 * s, 3 * s + bob, cx + 6 * s, 0 + bob, '#62ae3c'); p.d(cx - 6 * s, bob, '#ff7e96'); p.d(cx + 6 * s, bob, '#ff7e96'); },
    golem(p, s, f, a) { const c = PAL.stone, l = [0, 1, 0, -1][f] * s, cx = p.w / 2; p.blob([[cx - 4 * s, 21 * s + l, 3.2 * s, 3.4 * s], [cx + 4 * s, 21 * s - l, 3.2 * s, 3.4 * s]], c, { noise: .1, flat: 4 }); p.blob([[cx, 13 * s, 8 * s, 6.5 * s], [cx, 6 * s, 4.4 * s, 4 * s]], c, { noise: .12, flat: 5, seed: 3 }); p.blob([[cx - 10 * s, (a ? 9 : 14) * s, 3 * s, 4.6 * s], [cx + 10 * s, (a ? 9 : 14) * s, 3 * s, 4.6 * s]], c, { noise: .1, flat: 4, seed: 5 }); p.r(cx - 2.6 * s, 5 * s, 1.6 * s, 1.6 * s, '#ff9a3e'); p.r(cx + 1 * s, 5 * s, 1.6 * s, 1.6 * s, '#ff9a3e'); p.e(cx, 13 * s, 2 * s, 2 * s, '#ff9a3e'); p.d(cx - .5, 12.5 * s, '#fff0a0'); for (let i = 0; i < 5 * s; i++) { const x = cx + (H(i, 1, 4) - .5) * 14 * s, y = (8 + H(i, 2, 4) * 6) * s; if (p.g(x, y) >>> 24) { p.d(x, y, PAL.moss[1]); p.d(x + 1, y, PAL.moss[2]); } } },
    bat(p, s, f, a) { const c = ['#2a1a3a', '#44305a', '#62487e', '#8a6aa8'], up = f % 2; p.blob([[8, 6, 2.6, 2.8]], c, { noise: .1 }); if (up) { p.l(6, 5, 1, 1, c[1]); p.l(10, 5, 15, 1, c[1]); p.l(5, 6, 1, 3, c[2]); p.l(11, 6, 15, 3, c[2]); p.l(4, 6, 3, 4, c[1]); p.l(12, 6, 13, 4, c[1]); } else { p.l(6, 6, 1, 9, c[1]); p.l(10, 6, 15, 9, c[1]); p.l(5, 6, 2, 7, c[2]); p.l(11, 6, 14, 7, c[2]); } p.d(7, 3, c[2]); p.d(9, 3, c[2]); p.d(7, 5, '#ff4f6a'); p.d(9, 5, '#ff4f6a'); if (a) { p.d(7, 8, '#ffffff'); p.d(9, 8, '#ffffff'); } },
    crawler(p, s, f, a) { const c = ['#3a2a1c', '#5a4428', '#806238', '#a8864e', '#d0b070'], l = f % 2; p.blob([[8, 6.5, 6, 3.4], [15, 7, 3.2, 2.8]], c, { noise: .12 }); for (let i = 0; i < 4; i++) { const x = 4 + i * 3; p.l(x, 9, x - 1 + ((i + l) % 2) * 2, 11, c[0]); } p.d(16, 6, '#ff4f6a'); p.d(17, 7, '#ff4f6a'); p.l(18, 7, 19, 9 - (a ? 2 : 0), c[4]); p.l(18, 8, 19, 10, c[4]); for (let i = 0; i < 3; i++) p.d(5 + i * 3, 4, c[4]); },
    skeleton(p, s, f, a) { const b = PAL.bone, l = [0, 1, 0, -1][f]; p.r(6 + l, 15, 2, 6, b[1]); p.r(9 - l, 15, 2, 6, b[2]); p.r(6, 9, 5, 6, b[1]); for (let y = 10; y < 15; y += 2) p.r(6, y, 5, 1, b[3]); p.r(8, 9, 1, 6, b[0]); p.blob([[8.5, 5, 3.6, 3.6]], b, { noise: .08 }); p.r(7, 4, 1, 2, OUT); p.r(10, 4, 1, 2, OUT); p.d(7, 4, '#3dd49a'); p.d(10, 4, '#3dd49a'); p.r(8, 7, 2, 1, OUT); p.r(4, 10, 2, 5, b[2]); if (a) { p.r(11, 8, 5, 1, b[2]); p.l(13, 9, 15, 1, '#a09ca8'); } else { p.r(11, 10, 2, 4, b[2]); p.l(12, 13, 15, 5, '#a09ca8'); } p.r(4, 2, 9, 1, '#5a5466'); p.r(5, 1, 7, 1, '#7c7888'); },
    guardian(p, s, f, a, _c, alt) { const c = alt ? ['#3a1a4a', '#5a2a72', '#7e44a0', '#a868cc', '#d8a8f0'] : ['#2a3a4a', '#40586a', '#5c7c8c', '#82a4ae', '#b8d4d8'], g = PAL.gold, l = [0, 1, 0, -1][f] * s, cx = p.w / 2, eye = alt ? '#ff4f6a' : '#7ef0ff'; p.r(cx - 4 * s, 20 * s + l, 3 * s, 6 * s, c[1]); p.r(cx + 1 * s, 20 * s - l, 3 * s, 6 * s, c[0]); p.r(cx - 4 * s, 25 * s + l, 3 * s, s, g[2]); p.r(cx + 1 * s, 25 * s - l, 3 * s, s, g[1]); p.blob([[cx, 14 * s, 6 * s, 7 * s]], c, { noise: .08, flat: 5 }); p.r(cx - 5 * s, 9 * s, 10 * s, s, g[3]); p.r(cx - 1 * s, 10 * s, 2 * s, 9 * s, g[2]); p.e(cx, 14 * s, 1.8 * s, 1.8 * s, eye); p.blob([[cx, 5 * s, 4 * s, 4.4 * s]], c, { noise: .08, flat: 5, seed: 2 }); p.r(cx - 3 * s, 4.5 * s, 6 * s, 1.4 * s, '#140f26'); p.r(cx - 2.4 * s, 4.7 * s, 1.4 * s, s, eye); p.r(cx + 1 * s, 4.7 * s, 1.4 * s, s, eye); p.r(cx - .5 * s, 0, s, 2 * s, g[3]); p.blob([[cx - 8 * s, 13 * s, 2.4 * s, 5 * s]], c, { noise: .05, flat: 4 }); p.e(cx - 8.5 * s, 14 * s, 3 * s, 4 * s, c[2]); p.e(cx - 8.5 * s, 14 * s, 1.5 * s, 2 * s, g[2]); if (a) { p.r(cx + 6 * s, 10 * s, 5 * s, 2 * s, c[2]); for (let i = 0; i < 9 * s; i++) { p.d(cx + 10 * s + i * .4, 10 * s - i, '#e8eef4'); p.d(cx + 10 * s + i * .4 + 1, 10 * s - i, '#a09ca8'); } } else { p.r(cx + 6 * s, 11 * s, 2.4 * s, 6 * s, c[2]); for (let i = 0; i < 12 * s; i++) { p.d(cx + 7 * s + i * .15, 16 * s - i, '#e8eef4'); p.d(cx + 7 * s + i * .15 + 1, 16 * s - i, '#a09ca8'); } } },
    wolf(p, s, f, a) { const c = ['#4a5a78', '#6a7e9c', '#94a8c0', '#c4d4e4', '#f2f8ff'], l = [0, 2, 0, -2][f]; p.r(5 + l, 11, 2, 4, c[0]); p.r(8 - l, 11, 2, 4, c[1]); p.r(15 + l, 11, 2, 4, c[0]); p.r(17 - l, 11, 2, 4, c[1]); p.blob([[11, 8.5, 7, 3.4], [17.5, 6.5, 3.2, 3]], c, { noise: .14 }); p.blob([[3, 7 + (f % 2), 2.6, 1.8]], c, { noise: .1 }); p.blob([[21, 7.5, 2.4, 1.6]], c, { noise: .05 }); p.d(16, 2, c[2]); p.d(19, 2, c[2]); p.d(16, 3, c[3]); p.d(19, 3, c[3]); p.d(19, 6, '#7ef0ff'); p.d(23, 7, OUT); if (a) { p.r(20, 9, 3, 1, '#d8353a'); p.d(21, 8, '#ffffff'); p.d(22, 10, '#ffffff'); } },
    frost(p, s, f, a) { const c = PAL.crb, bob = [0, -1, 0, 1][f] * s, cx = p.w / 2; const sh = (x, top, w, bot) => { for (let y = top; y < bot; y++) { const ww = Math.min(w, Math.min(y - top, bot - 1 - y) + 1); for (let i = -ww + 1; i < ww; i++) { let cc = c[2]; if (i < 0) cc = c[3]; if (i > 0) cc = c[1]; if (i === -ww + 1 && ww > 1) cc = c[4]; p.d(x + i, y + bob, cc); } } }; sh(cx, 2 * s, 5 * s, 22 * s); sh(cx - 6 * s, (a ? 4 : 9) * s, 2.4 * s, (a ? 14 : 19) * s); sh(cx + 6 * s, (a ? 4 : 9) * s, 2.4 * s, (a ? 14 : 19) * s); sh(cx - 3 * s, 19 * s, 2 * s, 25 * s); sh(cx + 3 * s, 19 * s, 2 * s, 25 * s); p.r(cx - 2.5 * s, 8 * s + bob, 1.6 * s, 1.6 * s, '#ffffff'); p.r(cx + 1 * s, 8 * s + bob, 1.6 * s, 1.6 * s, '#ffffff'); p.e(cx, 13 * s + bob, 1.6 * s, 1.6 * s, '#e6f8ff'); },
    shade(p, s, f, a) { const c = ['#0d0a18', '#1c1630', '#2e2650', '#463c74'], bob = [0, -1, 0, 1][f]; p.blob([[8, 7 + bob, 4.6, 5], [8, 14 + bob, 3.6, 6]], c, { noise: .2 }); for (let i = -1; i <= 1; i++) p.r(8 + i * 3, 18 + bob, 1, 2 + ((i + f + 4) % 2), c[1]); p.r(5.5, 6 + bob, 2, 2, '#ff4f6a'); p.r(9.5, 6 + bob, 2, 2, '#ff4f6a'); p.d(6, 6 + bob, '#ffd0d8'); p.d(10, 6 + bob, '#ffd0d8'); p.r(2, 10 + bob - (a ? 3 : 0), 3, 1, c[2]); p.r(12, 10 + bob - (a ? 3 : 0), 3, 1, c[2]); }
  };
  const mcache = {};
  A.mobFrame = (def, f, atk, flip, hit) => {
    const key = def.id + '|' + f + (atk ? 'a' : '') + (flip ? 'f' : '') + (hit ? 'h' : ''); let cv = mcache[key]; if (cv) return cv;
    const s = def.scale || 1; let p = P(def.w + 4, def.h + 4), q = P(def.w + 4, def.h + 4);
    const inner = P(def.w + 2, def.h + 2); MOB[def.spr](inner, s, f, atk, def.pal && def.pal.length ? def.pal : null, def.pal === 1);
    p.st(inner, 1, 1); p.outline(def.spr === 'shade' ? '#000000' : def.spr === 'frost' ? '#1f4f9c' : OUT);
    if (hit) for (let i = 0; i < p.b.length; i++) if (p.b[i] >>> 24) p.b[i] = 0xffffffff;
    if (flip) p = p.flip();
    return mcache[key] = p.can();
  };

  /* ---------- ИКОНКИ ---------- */
  const SH = { // точечные формы инструментов: h/H — рукоять, a-d — металл от тёмного к светлому, g — золото, w — белый, s — тетива, f/F — огонь
    axe: ['................', '..........bc....', '.........bccd...', '........bcccdd..', '.......abcccdh..', '.......abccdhH..', '........abbhH...', '.........ahH....', '........hH......', '.......hH.......', '......hH........', '.....hH.........', '....hH..........', '...hH...........', '..hH............', '................'],
    pick: ['................', '....bcccd.......', '...bccccccd.....', '...ab...hccd....', '..ab...hHbccd...', '.......hH..bcd..', '......hH....bc..', '.....hH.....ab..', '....hH.......a..', '...hH...........', '..hH............', '.hH.............', '................', '................', '................', '................'],
    hammer: ['................', '..........bcd...', '.........bcccd..', '........bccccd..', '.......bccccdc..', '......abcccdhb..', '......aabcdhHa..', '.......aabhH....', '........ahH.....', '.......hH.......', '......hH........', '.....hH.........', '....hH..........', '...hH...........', '..hH............', '................'],
    shovel: ['................', '...........cd...', '..........bccd..', '.........bcccd..', '.........abccc..', '..........abb...', '.........hHa....', '........hH......', '.......hH.......', '......hH........', '.....hH.........', '....hH..........', '...hHh..........', '..hH.H..........', '...hH...........', '................'],
    sword: ['................', '.............dd.', '............dcb.', '...........dcb..', '..........dcb...', '.........dcb....', '........dcb.....', '.......dcb......', '..g...dcb.......', '..gg.dcb........', '...ggcb.........', '....gg..........', '...hHgg.........', '..hH..g.........', '.gH.............', '................'],
    dagger: ['................', '................', '................', '..........dd....', '.........dcb....', '........dcb.....', '.......dcb......', '..g...dcb.......', '..gg.dcb........', '...ggcb.........', '....gg..........', '...hHgg.........', '..hH............', '................', '................', '................'],
    bow: ['................', '.....hhhh.......', '....H...shh.....', '...H.....s.hh...', '..H.......s..h..', '..H........s.h..', '..H.........sh..', '..H..........h..', '...H........sh..', '...H.......s.h..', '....H.....s.h...', '.....H...s.hh...', '......HHshh.....', '........H.......', '................', '................'],
    staff: ['................', '...........cd...', '..........cddc..', '..........bccb..', '.........h.bb...', '........hHh.....', '.......hH.......', '......hH........', '.....hH.........', '....hH..........', '...hH...........', '..hH............', '.hH.............', '................', '................', '................'],
    rod: ['................', '..............h.', '.............h.s', '............h..s', '...........h...s', '..........h....s', '.........h.....s', '........h......s', '.......h.......s', '......hH......ww', '.....hH.......dw', '....hHg.........', '...hH.g.........', '..hH............', '.hH.............', '................'],
    torch: ['................', '..........f.....', '.........fFf....', '........fFFf....', '........fFwFf...', '.........FFf....', '........aHa.....', '.......hHa......', '......hH........', '.....hH.........', '....hH..........', '...hH...........', '..hH............', '................', '................', '................'],
    arrow: ['................', '...........ddd..', '............cd..', '...........h.d..', '..........h.....', '.........h......', '........h.......', '.......h........', '......h.........', '.....h..........', '..w.h...........', '..wwh...........', '...ww...........', '................', '................', '................'],
    key: ['................', '................', '.........ccd....', '........c..cd...', '........c...c...', '........bc.cc...', '.......bcccc....', '......bc........', '.....bc.........', '....bcb.........', '...bc.bc........', '..bcb...........', '...b.b..........', '................', '................', '................']
  };
  const shape = (p, name, c) => { const m = pal5(c), map = { h: '#a8743e', H: '#6a4426', a: m[0], b: m[1], c: m[2], d: m[4], g: PAL.gold[3], w: '#ffffff', s: '#e8e4d4', f: PAL.fire[1], F: PAL.fire[3] }, rows = SH[name]; for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const ch = rows[y][x]; if (ch !== '.') p.d(x, y, map[ch]); } };
  const IC = {
    log(p, c1, c2) { const m = pal5(c1); for (let i = 0; i < 9; i++) { const x = 3 + i, y = 10 - i * .6; p.r(x, y - 2, 1, 5, m[2]); p.d(x, y - 2, m[3]); p.d(x, y + 2, m[0]); if (i % 3 === 1) p.d(x, y, m[1]); } p.e(12.5, 5.5, 2.4, 3, c2); p.e(12.5, 5.5, 1.2, 1.6, dark(c2, .2)); p.d(12, 5, lite(c2, .4)); p.d(4, 6, '#62ae3c'); p.d(5, 5, '#86c84a'); },
    stick(p) { p.l(3, 12, 12, 4, '#7a5038'); p.l(3, 11, 12, 3, '#b88a5c'); p.l(8, 7, 7, 4, '#9a6c46'); p.l(9, 9, 12, 10, '#7a5038'); },
    bark(p) { const m = PAL.trunk; p.blob([[8, 8, 5.5, 4]], m, { noise: .25, flat: 4 }); p.l(5, 6, 6, 10, m[0]); p.l(9, 5, 10, 10, m[0]); p.l(7, 9, 8, 11, m[4]); },
    drop(p, c) { const m = pal5(c); p.blob([[8, 10, 3.8, 3.8]], m, { noise: 0 }); p.r(7, 4, 2, 4, m[2]); p.d(8, 3, m[2]); p.d(7, 5, m[3]); p.d(6, 9, m[4]); p.d(7, 8, m[4]); },
    rock(p, pal, sp) { p.blob([[7, 9.5, 5, 3.8], [10, 8, 3.6, 3.4], [6, 7, 3, 2.6]], pal, { noise: .1, flat: 5, seed: pal[2].charCodeAt(2) }); p.l(6, 8, 8, 11, pal[0]); if (sp) for (const [x, y] of [[5, 9], [9, 7], [10, 10], [7, 11], [11, 8]]) { p.d(x, y, sp[3]); p.d(x + 1, y, sp[2]); p.d(x, y + 1, sp[1]); } },
    gem(p, pal) { const s = (x, t, w, b) => { for (let y = t; y < b; y++) { const ww = Math.min(w, y - t + 1, b - y); for (let i = -ww + 1; i < ww; i++) p.d(x + i, y, i < 0 ? pal[3] : i > 0 ? pal[1] : pal[2]); p.d(x - ww + 1, y, pal[4]); } }; s(5, 6, 2, 14); s(11, 5, 2, 14); s(8, 2, 3, 14); },
    lump(p, c) { const m = pal5(c); p.blob([[8, 9.5, 5, 3.6], [6.5, 7.5, 3, 2.6], [10.5, 8, 2.6, 2.4]], m, { noise: .12 }); },
    leaf(p, c) { const m = pal5(c); for (let i = 0; i < 4; i++) { const bx = 5 + i * 2; p.l(8, 13, bx, 4 + Math.abs(i - 1.5) * 1.5, m[2]); p.l(8, 13, bx + 1, 5 + Math.abs(i - 1.5) * 1.5, m[i % 2 ? 1 : 3]); } p.r(7, 11, 3, 1, '#b88a5c'); },
    fiber(p) { for (let i = 0; i < 5; i++) { p.l(4 + i * 2, 3 + (i % 2), 5 + i, 13, i % 2 ? '#e8dfa0' : '#c9b866'); } p.r(5, 8, 6, 2, '#7a5038'); p.r(5, 8, 6, 1, '#b88a5c'); },
    flower(p, c) { p.l(8, 8, 7, 14, '#3f8a36'); p.d(9, 11, '#62ae3c'); p.d(10, 10, '#62ae3c'); p.d(6, 12, '#62ae3c'); const m = pal5(c); for (const [x, y] of [[8, 3], [5, 5], [11, 5], [6, 8], [10, 8]]) p.e(x, y, 1.8, 1.8, m[2]); p.d(7, 2, m[4]); p.d(4, 4, m[4]); p.e(8, 5.5, 1.4, 1.4, '#ffe066'); },
    mush(p, c) { const m = pal5(c); p.r(7, 8, 3, 6, '#efeada'); p.r(9, 8, 1, 6, '#b5ae98'); p.blob([[8.5, 6, 5.4, 3.6]], m, { noise: 0 }); p.r(4, 8, 9, 1, m[0]); p.d(6, 4, '#ffffff'); p.d(10, 5, '#ffffff'); p.d(8, 3, '#ffffff'); p.d(11, 7, '#ffffff'); },
    hide(p) { const m = pal5('#a8703e'); p.blob([[8, 8, 4.4, 5]], m, { noise: .12 }); p.r(3, 3, 3, 2, m[2]); p.r(11, 3, 3, 2, m[1]); p.r(3, 11, 3, 2, m[1]); p.r(11, 11, 3, 2, m[0]); p.d(7, 6, m[4]); },
    bone(p) { const b = PAL.bone; p.l(5, 11, 11, 5, b[3]); p.l(5, 10, 10, 5, b[4]); p.l(6, 11, 11, 6, b[1]); p.e(4, 11.5, 1.6, 1.6, b[3]); p.e(5.5, 13, 1.4, 1.4, b[2]); p.e(11.5, 4, 1.6, 1.6, b[4]); p.e(13, 5.5, 1.4, 1.4, b[3]); },
    feather(p) { p.l(4, 13, 12, 3, '#efeada'); for (let i = 0; i < 7; i++) { p.d(6 + i, 10 - i, '#ffffff'); p.d(7 + i, 10 - i, '#d9d3be'); p.d(6 + i, 11 - i, '#b5ae98'); p.d(5 + i, 9 - i, '#ffffff'); } p.d(4, 13, '#8a8370'); p.d(5, 12, '#8a8370'); },
    orb(p, c) { const m = pal5(c); p.blob([[8, 8, 5, 5]], m, { noise: 0 }); p.d(6, 6, '#ffffff'); p.d(7, 5, '#ffffff'); p.d(6, 5, m[4]); p.e(9.5, 9.5, 1.5, 1.5, m[3]); },
    gear(p) { const g = PAL.gold; for (let a = 0; a < 8; a++) p.r(7.2 + Math.cos(a * .785) * 5, 7.2 + Math.sin(a * .785) * 5, 2, 2, g[1]); p.e(8, 8, 4.6, 4.6, g[2]); p.e(8, 8, 3.4, 3.4, g[3]); p.e(8, 8, 1.6, 1.6, g[0]); p.d(6, 6, g[4]); },
    wheat(p) { for (let i = 0; i < 3; i++) { const x = 5 + i * 3; p.l(x, 14, x + (i - 1), 6, '#c9a044'); for (let k = 0; k < 4; k++) { p.d(x + (i - 1) - 1, 3 + k * 1.5, '#f5d76a'); p.d(x + (i - 1) + 1, 4 + k * 1.5, '#ecb92e'); p.d(x + (i - 1), 2 + k * 1.5, '#fff3a8'); } } p.r(5, 11, 6, 1, '#7a5038'); },
    seed(p, c) { const m = pal5('#c9a66b'); p.blob([[8, 10, 4.6, 4.2]], m, { noise: .1 }); p.r(6, 4, 4, 2, m[2]); p.r(5, 6, 6, 1, '#7a5038'); p.e(8, 10.5, 1.8, 1.8, c); p.d(7, 10, lite(c, .5)); },
    berry(p, c) { const m = pal5(c); for (const [x, y] of [[6, 9], [10, 9], [8, 12], [8, 7]]) { p.blob([[x, y, 2.4, 2.4]], m, { noise: 0 }); p.d(x - 1, y - 1, '#ffffff'); } p.l(8, 5, 10, 2, '#3f8a36'); p.d(11, 3, '#86c84a'); p.d(12, 3, '#62ae3c'); },
    meat(p, c, c2) { const m = pal5(c); p.blob([[9, 7, 4.6, 4.2], [7, 9, 3.4, 3]], m, { noise: .1 }); p.l(5, 11, 3, 13, '#efeada'); p.e(3, 13.5, 1.4, 1.4, '#ffffff'); p.e(9.5, 7, 1.6, 1.4, c2 || m[4]); },
    fish(p, c) { const m = pal5(c); p.blob([[8, 8, 5, 2.8]], m, { noise: .08 }); p.l(2, 5, 4, 8, m[1]); p.l(2, 11, 4, 8, m[1]); p.d(2, 6, m[2]); p.d(2, 10, m[2]); p.d(11, 7, OUT); p.l(7, 5, 9, 4, m[1]); p.d(6, 8, m[4]); p.d(8, 9, m[4]); },
    carrot(p) { for (let i = 0; i < 8; i++) { const x = 4 + i, y = 12 - i, w = 1 + Math.floor(i / 2.6); p.r(x, y - w + 1, 1, w * 2 - 1, '#e5741f'); p.d(x, y - w + 1, '#ffa24a'); p.d(x, y + w - 1, '#b0521c'); } p.l(12, 4, 14, 1, '#3f8a36'); p.l(12, 4, 11, 1, '#62ae3c'); p.l(12, 5, 15, 4, '#86c84a'); },
    cabbage(p) { const m = pal5('#86c84a'); p.blob([[8, 8.5, 5.4, 5]], m, { noise: .1 }); p.l(5, 7, 8, 11, m[1]); p.l(11, 6, 8, 11, m[1]); p.l(8, 4, 8, 11, m[3]); },
    pumpkin(p) { const m = pal5('#f08a24'); p.blob([[8, 9.5, 5.6, 4.4]], m, { noise: .05 }); p.l(6, 6, 5, 13, m[1]); p.l(10, 6, 11, 13, m[1]); p.r(8, 3, 1, 3, '#3f8a36'); p.d(9, 3, '#62ae3c'); },
    bread(p, c, flat) { const m = pal5(c); if (flat) { p.blob([[8, 9, 5.6, 3]], m, { noise: .15 }); p.d(6, 8, m[0]); p.d(10, 9, m[0]); } else { p.blob([[8, 9, 5.6, 3.8]], m, { noise: .1 }); p.l(5, 7, 6, 9, m[4]); p.l(8, 6, 9, 8, m[4]); p.l(11, 7, 12, 9, m[4]); } },
    bowl(p, c) { const w = pal5('#a8743e'); p.blob([[8, 10, 5.6, 3.6]], w, { noise: .05 }); p.e(8, 8, 5, 2, c); p.e(8, 8, 3, 1, lite(c, .35)); p.d(6, 7, '#ffffff'); p.l(9, 2, 8, 4, '#ffffffaa'); p.l(11, 3, 10, 5, '#ffffffaa'); },
    cup(p, c) { const w = pal5('#b5ae98'); p.r(5, 5, 6, 8, w[2]); p.r(5, 5, 1, 8, w[4]); p.r(10, 5, 1, 8, w[1]); p.r(5, 12, 6, 1, w[0]); p.r(5, 5, 6, 2, c); p.r(6, 5, 2, 1, lite(c, .5)); p.r(11, 7, 2, 1, w[2]); p.r(12, 8, 1, 2, w[2]); p.r(11, 10, 2, 1, w[1]); },
    pie(p) { const m = pal5('#e08a3a'); p.blob([[8, 10, 6, 3]], pal5('#d8a45a'), { noise: .1 }); p.e(8, 8.5, 4.6, 2, m[2]); p.e(8, 8, 3, 1.2, m[3]); p.e(8, 6.5, 1.8, 1.6, '#ffffff'); p.d(8, 5, '#efeada'); },
    potion(p, c) { const m = pal5(c); p.blob([[8, 10, 4.4, 4.2]], ['#6a8aa8', '#9ab8d0', '#c6e0f0', '#e6f6ff', '#ffffff'], { noise: 0 }); p.e(8, 11, 3.4, 2.8, m[2]); p.r(5, 9, 6, 1, m[3]); p.r(7, 4, 2, 3, '#c6e0f0'); p.r(6, 2, 4, 2, '#a8743e'); p.d(6, 2, '#d2aa72'); p.d(6, 8, '#ffffff'); },
    flask(p, c) { const m = pal5('#a8703e'); p.blob([[8, 10, 4.4, 4.4]], m, { noise: .08 }); p.r(7, 3, 2, 4, m[2]); p.r(6, 2, 4, 2, PAL.stone[3]); p.l(4, 7, 12, 7, m[0]); if (c !== '#00000000') { p.e(8, 10.5, 2, 2, c); p.d(7, 10, lite(c, .5)); } },
    plank(p) { const w = PAL.wood; for (let i = 0; i < 2; i++) { const y = 4 + i * 5; p.r(2, y, 12, 4, w[3 - i]); p.r(2, y, 12, 1, w[4]); p.r(2, y + 3, 12, 1, w[1]); p.d(4, y + 1, w[1]); p.d(12, y + 2, w[1]); p.l(6, y + 2, 9, y + 2, w[2 - i]); } },
    rope(p) { const c = ['#8a6a3a', '#b8925a', '#dab87e']; for (let a = 0; a < 20; a++) { const x = 8 + Math.cos(a * .314) * 4.6, y = 8 + Math.sin(a * .314) * 4; p.d(x, y, c[a % 3]); p.d(x, y + 1, c[0]); } p.e(8, 8, 1.6, 1.4, '#00000000'); p.l(11, 11, 14, 14, c[1]); p.l(11, 12, 13, 14, c[0]); },
    cloth(p) { const c = PAL.cloth; p.r(3, 4, 10, 9, c[2]); p.r(3, 4, 10, 1, c[4]); p.r(3, 12, 10, 1, c[0]); p.r(12, 4, 1, 9, c[1]); for (let y = 6; y < 12; y += 2) p.r(4, y, 8, 1, c[3]); p.l(3, 13, 5, 11, c[1]); },
    brick(p) { const c = pal5('#c0563a'); p.r(2, 5, 8, 4, c[2]); p.r(2, 5, 8, 1, c[4]); p.r(2, 8, 8, 1, c[0]); p.r(6, 9, 8, 4, c[1]); p.r(6, 9, 8, 1, c[3]); p.r(6, 12, 8, 1, c[0]); },
    ingot(p, c) { const m = pal5(c); for (let y = 0; y < 5; y++) { p.r(3 - (y > 1 ? 1 : 0) + 1, 6 + y, 10 + (y > 1 ? 2 : 0) - 1, 1, y < 2 ? m[3] : m[2]); } p.r(4, 6, 8, 1, m[4]); p.r(3, 11, 11, 1, m[0]); p.r(12, 8, 2, 3, m[1]); p.d(5, 7, '#ffffff'); },
    axe: (p, c) => shape(p, 'axe', c), pick: (p, c) => shape(p, 'pick', c), hammer: (p, c) => shape(p, 'hammer', c), shovel: (p, c) => shape(p, 'shovel', c),
    sword(p, c, h) { shape(p, 'sword', c); }, dagger: (p, c) => shape(p, 'dagger', c), bow: p => shape(p, 'bow', '#a8743e'), staff: (p, c) => shape(p, 'staff', c), rod: p => shape(p, 'rod', '#d8353a'), torch: p => shape(p, 'torch', '#565c6c'), arrow: p => shape(p, 'arrow', '#a09ca8'), key: (p, c) => shape(p, 'key', c),
    can(p) { const w = PAL.wood; p.r(4, 6, 7, 7, w[2]); p.r(4, 6, 7, 1, w[4]); p.r(4, 12, 7, 1, w[0]); p.r(10, 6, 1, 7, w[1]); p.r(4, 9, 7, 1, PAL.stone[2]); p.l(11, 8, 14, 5, w[3]); p.r(13, 4, 2, 2, w[2]); p.l(5, 5, 9, 3, w[1]); p.d(14, 7, '#6aa2d6'); p.d(15, 9, '#6aa2d6'); },
    shirt(p, c) { const m = pal5(c); p.r(5, 4, 6, 10, m[2]); p.r(2, 4, 3, 4, m[2]); p.r(11, 4, 3, 4, m[1]); p.r(5, 4, 1, 10, m[3]); p.r(10, 5, 1, 9, m[1]); p.r(5, 13, 6, 1, m[0]); p.r(7, 4, 2, 2, m[0]); p.r(2, 4, 3, 1, m[4]); p.d(8, 8, m[4]); p.d(8, 10, m[4]); },
    helm(p, c) { const m = pal5(c); p.blob([[8, 8, 5.4, 5]], m, { noise: .04, flat: 5 }); p.r(3, 9, 10, 4, 0 ? c : '#00000000'); p.r(3, 9, 2, 4, m[2]); p.r(11, 9, 2, 4, m[1]); p.r(3, 8, 10, 1, m[0]); p.d(6, 5, '#ffffff'); p.d(7, 4, m[4]); },
    boots(p, c) { const m = pal5(c); for (const x of [3, 9]) { p.r(x, 4, 3, 7, m[2]); p.r(x, 4, 1, 7, m[3]); p.r(x, 10, 5, 3, m[2]); p.r(x, 12, 5, 1, m[0]); p.r(x, 4, 3, 1, m[4]); p.d(x + 4, 10, m[1]); } },
    gloves(p, c) { const m = pal5(c); for (const x of [2, 9]) { p.r(x + 1, 6, 4, 6, m[2]); p.r(x + 1, 3, 1, 3, m[2]); p.r(x + 2, 2, 1, 4, m[3]); p.r(x + 3, 3, 1, 3, m[2]); p.r(x + 4, 4, 1, 2, m[1]); p.r(x, 8, 1, 2, m[2]); p.r(x + 1, 11, 4, 2, m[0]); p.r(x + 1, 11, 4, 1, m[4]); } },
    pack(p, c) { const m = pal5(c); p.blob([[8, 9, 5, 5]], m, { noise: .06, flat: 5 }); p.r(5, 4, 6, 3, m[3]); p.r(5, 6, 6, 1, m[0]); p.r(7, 6, 2, 2, PAL.gold[3]); p.r(4, 10, 8, 1, m[1]); p.r(6, 2, 1, 2, m[1]); p.r(9, 2, 1, 2, m[1]); p.r(6, 1, 4, 1, m[2]); },
    sigil(p, c) { const m = pal5(c), s = PAL.stone; p.e(8, 8, 6, 6, s[1]); p.e(8, 8, 5, 5, s[3]); p.e(8, 8, 3.4, 3.4, m[2]); p.e(8, 8, 1.6, 1.6, m[4]); p.d(8, 3, m[3]); p.d(8, 12, m[3]); p.d(3, 8, m[3]); p.d(12, 8, m[3]); p.d(5, 5, '#ffffff'); },
    build(p, id) { const d = G.OBJ[id], b = G.BUILD[id]; let src = null; if (b.kind === 'tile') src = [A.tiles[G.TILE[G.T[b.tile]].set === 'cliff' ? 'cliff_g' : G.TILE[G.T[b.tile]].set], 0, 0, 16, 16]; else if (b.kind === 'roof') src = [A.tiles['roof' + b.roof], 0, 0, 16, 16]; else { const s = A.spr[d.s[0]]; src = [s.c, 0, 0, s.w, s.h]; } p._img = src; }
  };
  /* иконки интерфейса */
  const UI = {
    ui_heart(p) { const m = pal5('#e8353f'); p.blob([[5.5, 6, 3.4, 3.4], [10.5, 6, 3.4, 3.4], [8, 9, 4, 3.6]], m, { noise: 0 }); for (let i = 0; i < 4; i++) p.r(5 + i, 11 + i, 6 - i * 2, 1, m[i < 2 ? 2 : 1]); p.d(5, 5, '#ffffff'); p.d(4, 6, m[4]); },
    ui_food(p) { IC.meat(p, '#c9783e', '#f0c08a'); },
    ui_water(p) { IC.drop(p, '#45aee0'); },
    ui_stam(p) { const c = '#ffd23e'; for (const [x, y, w] of [[8, 2, 4], [7, 4, 4], [6, 6, 6], [8, 8, 4], [7, 10, 3], [6, 12, 2]]) p.r(x, y, w, 2, c); p.r(9, 2, 1, 4, '#fff3a8'); p.r(6, 13, 1, 1, '#c08a1e'); },
    ui_temp(p) { p.r(7, 2, 3, 9, '#efeada'); p.e(8.5, 12, 2.8, 2.8, '#e8353f'); p.r(8, 6, 1, 6, '#e8353f'); p.d(7, 3, '#ffffff'); p.d(11, 4, '#b5ae98'); p.d(11, 6, '#b5ae98'); p.d(11, 8, '#b5ae98'); },
    ui_map(p) { const c = ['#c9a66b', '#ead79c', '#f6e8b8']; p.r(2, 4, 12, 9, c[1]); p.r(6, 3, 4, 9, c[2]); p.r(2, 4, 4, 1, c[2]); p.r(2, 12, 12, 1, c[0]); p.r(6, 3, 1, 10, c[0]); p.r(10, 4, 1, 9, c[0]); p.l(4, 10, 8, 7, '#d8353a'); p.d(12, 6, '#d8353a'); p.d(11, 7, '#3f8a36'); p.d(3, 6, '#3b6ea8'); },
    ui_bag(p) { IC.pack(p, '#a8703e'); },
    ui_cog(p) { const s = PAL.stone; for (let a = 0; a < 8; a++) p.r(7.2 + Math.cos(a * .785) * 5, 7.2 + Math.sin(a * .785) * 5, 2, 2, s[3]); p.e(8, 8, 4.6, 4.6, s[3]); p.e(8, 8, 3.2, 3.2, s[4]); p.e(8, 8, 1.6, 1.6, s[0]); },
    ui_craft(p) { shape(p, 'hammer', '#a09ca8'); },
    ui_build(p) { const w = PAL.wood; for (let y = 2; y < 8; y++) p.r(8 - (y - 1), y, (y - 1) * 2, 1, y % 2 ? PAL.rtile[2] : PAL.rtile[3]); p.r(4, 8, 8, 6, w[3]); p.r(4, 8, 8, 1, w[1]); p.r(7, 10, 2, 4, w[0]); p.r(10, 9, 1, 2, '#6aa2d6'); },
    ui_quest(p) { const c = ['#c9a66b', '#ead79c', '#f6e8b8']; p.r(4, 3, 9, 11, c[1]); p.r(3, 3, 2, 2, c[0]); p.r(4, 13, 9, 1, c[0]); p.r(12, 12, 2, 2, c[2]); for (let y = 5; y < 12; y += 2) p.r(6, y, 5, 1, '#7a5038'); p.e(11, 11, 1.6, 1.6, '#d8353a'); },
    ui_skill(p) { const g = PAL.gold; for (let a = 0; a < 5; a++) { const an = -Math.PI / 2 + a * 1.2566; p.l(8, 8, 8 + Math.cos(an) * 6, 8 + Math.sin(an) * 6, g[3]); p.l(8, 9, 8 + Math.cos(an) * 5, 9 + Math.sin(an) * 5, g[2]); } p.e(8, 8.5, 3, 3, g[3]); p.d(7, 7, '#ffffff'); },
    ui_atk(p) { shape(p, 'sword', '#e8eef4'); },
    ui_hand(p) { const c = '#f6c8a0', d = '#d49a78'; p.r(5, 7, 7, 6, c); p.r(5, 3, 1, 5, c); p.r(7, 2, 1, 6, c); p.r(9, 2, 1, 6, c); p.r(11, 3, 1, 5, c); p.r(3, 8, 2, 3, c); p.r(6, 13, 5, 1, d); p.r(11, 8, 1, 5, d); },
    ui_roll(p) { const c = '#e8eef4'; for (let a = 0; a < 14; a++) { const an = a * .4 - 1; p.d(8 + Math.cos(an) * 5, 8 + Math.sin(an) * 5, c); p.d(8 + Math.cos(an) * 4, 8 + Math.sin(an) * 4, '#a6dcff'); } p.r(11, 2, 3, 1, c); p.r(13, 2, 1, 3, c); p.r(3, 9, 5, 1, '#a6dcff'); p.r(2, 11, 4, 1, '#a6dcff'); },
    ui_block(p) { const m = pal5('#5a82b8'); for (let y = 2; y < 14; y++) { const w = y < 8 ? 5 : 5 - (y - 8) * .8; p.r(8 - w, y, w * 2, 1, m[2]); p.d(8 - w, y, m[4]); p.d(8 + w - 1, y, m[0]); } p.r(7, 3, 2, 9, PAL.gold[3]); p.r(4, 6, 8, 2, PAL.gold[3]); },
    ui_use(p) { IC.berry(p, '#e23a5c'); },
    ui_swap(p) { const c = '#e8eef4'; p.r(3, 5, 9, 2, c); p.l(10, 2, 13, 5, c); p.l(10, 8, 13, 6, c); p.r(4, 10, 9, 2, c); p.l(5, 7, 2, 10, c); p.l(5, 14, 2, 11, c); },
    ui_sun(p) { const g = PAL.gold; p.e(8, 8, 3.6, 3.6, g[3]); p.d(7, 7, '#ffffff'); for (let a = 0; a < 8; a++) p.r(7.5 + Math.cos(a * .785) * 6, 7.5 + Math.sin(a * .785) * 6, 1, 1, g[2]); },
    ui_moon(p) { p.e(8, 8, 5, 5, '#e6eeff'); p.e(10.5, 6.5, 4, 4, '#00000000'); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (Math.hypot(x + .5 - 10.5, y + .5 - 6.5) < 4) p.b[y * 16 + x] = 0; p.d(13, 3, '#ffffff'); p.d(3, 3, '#ffffff'); },
    ui_cloud(p) { p.blob([[6, 9, 3.6, 3], [10, 8, 4, 3.6], [8, 10, 5.6, 2.6]], ['#8a9ab8', '#b8c6dc', '#dce6f4', '#ffffff'], { noise: 0 }); },
    ui_rain(p) { UI.ui_cloud(p); for (const x of [5, 8, 11]) { p.d(x, 13, '#45aee0'); p.d(x - 1, 14, '#45aee0'); } },
    ui_storm(p) { p.blob([[6, 7, 3.6, 3], [10, 6, 4, 3.6], [8, 8, 5.6, 2.6]], ['#3a4460', '#566284', '#7884a8', '#a0acc8'], { noise: 0 }); p.l(9, 10, 7, 12, '#ffd23e'); p.l(7, 12, 9, 12, '#ffd23e'); p.l(9, 12, 7, 15, '#fff3a8'); },
    ui_snow(p) { UI.ui_cloud(p); for (const x of [4, 8, 12]) { p.d(x, 13, '#ffffff'); p.d(x + 1, 15, '#ffffff'); } },
    ui_fog(p) { for (let y = 4; y < 13; y += 3) p.r(2 + (y % 2) * 2, y, 11, 2, y % 2 ? '#dce6f4' : '#b8c6dc'); },
    ui_x(p) { p.l(4, 4, 11, 11, '#ffffff'); p.l(11, 4, 4, 11, '#ffffff'); p.l(5, 4, 12, 11, '#ffffff'); p.l(12, 4, 5, 11, '#ffffff'); },
    ui_lock(p) { const g = PAL.stone; p.r(4, 7, 8, 7, g[3]); p.r(4, 7, 8, 1, g[4]); p.r(4, 13, 8, 1, g[1]); p.r(5, 3, 1, 4, g[2]); p.r(10, 3, 1, 4, g[2]); p.r(6, 2, 4, 1, g[2]); p.r(7, 9, 2, 3, g[0]); },
    ui_ok(p) { p.l(3, 8, 6, 11, '#86c84a'); p.l(6, 11, 13, 4, '#86c84a'); p.l(3, 9, 6, 12, '#3f8a36'); p.l(6, 12, 13, 5, '#3f8a36'); },
    ui_rot(p) { const c = '#e8eef4'; for (let a = 0; a < 15; a++) { const an = a * .36; p.d(8 + Math.cos(an) * 5, 8 + Math.sin(an) * 5, c); } p.r(12, 4, 1, 4, c); p.r(10, 7, 3, 1, c); },
    ui_trash(p) { const c = PAL.stone; p.r(4, 5, 8, 9, c[2]); p.r(3, 3, 10, 2, c[3]); p.r(6, 2, 4, 1, c[3]); for (const x of [6, 8, 10]) p.r(x, 7, 1, 5, c[0]); },
    ui_up(p) { p.l(8, 2, 3, 7, '#86c84a'); p.l(8, 2, 13, 7, '#86c84a'); p.r(7, 3, 2, 11, '#86c84a'); p.l(8, 3, 4, 7, '#b8e25e'); },
    ui_move(p) { const c = '#e8eef4'; p.r(7, 2, 2, 12, c); p.r(2, 7, 12, 2, c); p.d(6, 3, c); p.d(9, 3, c); p.d(6, 12, c); p.d(9, 12, c); p.d(3, 6, c); p.d(3, 9, c); p.d(12, 6, c); p.d(12, 9, c); },
    ui_pin(p) { p.e(8, 6, 3.6, 3.6, '#e8353f'); p.e(8, 6, 1.4, 1.4, '#ffffff'); p.l(6, 9, 8, 14, '#e8353f'); p.l(10, 9, 8, 14, '#b3261e'); p.r(8, 9, 1, 4, '#e8353f'); },
    ui_zzz(p) { const c = '#a6dcff'; p.r(3, 3, 5, 1, c); p.l(7, 3, 3, 7, c); p.r(3, 7, 5, 1, c); p.r(9, 8, 4, 1, c); p.l(12, 8, 9, 12, c); p.r(9, 12, 4, 1, c); }
  };

  /* светотень как у героя: светлая кромка сверху-слева, тень снизу-справа */
  const rim = p => { const w = p.w, h = p.h, b = p.b, src = b.slice(), on = (x, y) => x >= 0 && y >= 0 && x < w && y < h && (src[y * w + x] >>> 24) > 200;
    const mixc = (v, t, tw) => { const r = v & 255, g = (v >> 8) & 255, bl = (v >> 16) & 255; return ((v & 0xff000000) | (Math.round(bl + (tw[2] - bl) * t) << 16) | (Math.round(g + (tw[1] - g) * t) << 8) | Math.round(r + (tw[0] - r) * t)) >>> 0; };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (!on(x, y)) continue; const i = y * w + x;
      if (!on(x + 1, y) || !on(x, y + 1)) b[i] = mixc(src[i], .3, [20, 12, 38]);
      else if (!on(x - 1, y) || !on(x, y - 1)) b[i] = mixc(src[i], .28, [255, 250, 230]); } };
  A.initChars = () => {
    const ids = Object.keys(G.ITEMS), uis = Object.keys(UI), total = ids.length + uis.length, cols = 16, rows = Math.ceil(total / cols);
    const cv = document.createElement('canvas'); cv.width = cols * 16; cv.height = rows * 16; const cx = cv.getContext('2d'); cx.imageSmoothingEnabled = false;
    A.iconPos = {}; A.iconCols = cols; A.iconRows = rows; A.iconCv = {};
    let n = 0;
    const put = (id, p) => {
      let c;
      if (p._img) { const [img, sx, sy, sw, sh] = p._img, k = Math.min(14 / sw, 14 / sh, 1), dw = Math.max(1, Math.round(sw * k)), dh = Math.max(1, Math.round(sh * k)); c = document.createElement('canvas'); c.width = c.height = 16; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(img, sx, sy, sw, sh, (16 - dw) >> 1, (16 - dh) >> 1, dw, dh); }
      else { rim(p); c = p.outline(OUT).can(); }
      A.iconPos[id] = [n % cols, Math.floor(n / cols)]; A.iconCv[id] = c; cx.drawImage(c, (n % cols) * 16, Math.floor(n / cols) * 16); n++;
    };
    for (const id of ids) { const it = G.ITEMS[id], p = P(16, 16), fn = IC[it.ic[0]]; if (fn) fn(p, it.ic[1], it.ic[2]); else p.r(4, 4, 8, 8, '#ff00ff'); put(id, p); }
    for (const id of uis) { const p = P(16, 16); UI[id](p); put(id, p); }
    A.iconAtlas = cv;
  };
})();
