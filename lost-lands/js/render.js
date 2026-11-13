'use strict';
/* Renderer + Camera Controller: чанки земли, анимированная вода, сортировка по глубине, крыши, свет. */
(() => {
  const TS = 16, CH = 16, T = G.T, TD = G.TILE, A = G.Art;
  const R = G.R = { cam: { x: 0, y: 0, sx: 0, sy: 0, shake: 0 }, S: 4, vw: 480, vh: 216, zoom: 0, chunks: new Map(), frame: 0, time: 0, list: [], n: 0, lights: [], fx: [], roofA: 1, texts: [] };
  const WS = ['w', 'tq', 'cold', 'dw', 'can'];
  const waterish = t => t === T.DEEP || t === T.WATER || t === T.BRIDGE || t === T.SBRIDGE;

  R.init = cv => {
    R.cv = cv; R.ctx = cv.getContext('2d', { alpha: false });
    R.lm = document.createElement('canvas'); R.lx = R.lm.getContext('2d');
    G.bus.on('tile', e => { if (e.map !== G.map) return; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) R.chunks.delete(Math.floor((e.y + j) / CH) * 4096 + Math.floor((e.x + i) / CH)); });
    G.bus.on('map', () => R.chunks.clear());
    R.resize();
  };
  R.resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 3), pw = Math.round(window.innerWidth * dpr), ph = Math.round(window.innerHeight * dpr);
    let base = Math.max(1, Math.round(ph / 205)); R.S = G.clamp(base + R.zoom, Math.max(1, base - 1), base + 2);
    R.vw = Math.ceil(pw / R.S); R.vh = Math.ceil(ph / R.S);
    R.cv.width = R.vw; R.cv.height = R.vh; R.cv.style.width = (R.vw * R.S / dpr) + 'px'; R.cv.style.height = (R.vh * R.S / dpr) + 'px';
    R.lm.width = Math.ceil(R.vw / 2) + 1; R.lm.height = Math.ceil(R.vh / 2) + 1;
    R.ctx.imageSmoothingEnabled = false;
  };
  R.setZoom = z => { R.zoom = G.clamp(z, -1, 2); R.resize(); };

  function masks(pred, x, y) {
    const N = pred(x, y - 1) ? 1 : 0, E = pred(x + 1, y) ? 1 : 0, S = pred(x, y + 1) ? 1 : 0, W = pred(x - 1, y) ? 1 : 0;
    const cm = ((!N && !E && pred(x + 1, y - 1)) ? 1 : 0) | ((!E && !S && pred(x + 1, y + 1)) ? 2 : 0) | ((!S && !W && pred(x - 1, y + 1)) ? 4 : 0) | ((!W && !N && pred(x - 1, y - 1)) ? 8 : 0);
    return [N | E << 1 | S << 2 | W << 3, cm];
  }
  const setOf = (m, t) => t === T.DFLOOR ? 'dfloor' + m.theme : TD[t].set;

  function buildChunk(m, cx, cy) {
    const cv = document.createElement('canvas'); cv.width = cv.height = CH * TS; const c = cv.getContext('2d'), water = [];
    const x0 = cx * CH, y0 = cy * CH, tmp = [];
    for (let ty = 0; ty < CH; ty++) for (let tx = 0; tx < CH; tx++) {
      const x = x0 + tx, y = y0 + ty; if (!m.inb(x, y)) { if (m.id === 'world') water.push(x, y, 1, 0, 0, 0); continue; }
      const t = m.tiles[y * m.w + x], d = TD[t], px = tx * TS, py = ty * TS, hv = Math.floor(G.hash(x, y, 5) * 4);
      if (t === T.DEEP || t === T.WATER) {
        const ws = G.World.waterSet(m, x, y), wi = WS.indexOf(ws), [em, cm] = masks((a, b) => !waterish(m.t(a, b)), x, y);
        water.push(x, y, t === T.DEEP ? 1 : 0, wi, em, cm);
        if (t === T.DEEP) { const [e2, c2] = masks((a, b) => m.t(a, b) === T.WATER, x, y), img = A.tiles['shal_' + ws]; if (e2) c.drawImage(img, e2 * 16, 0, 16, 16, px, py, 16, 16); if (c2) c.drawImage(img, c2 * 16, 16, 16, 16, px, py, 16, 16); }
      } else if (t === T.VOID) { c.fillStyle = '#120d1c'; c.fillRect(px, py, 16, 16); }
      else if (t === T.CLIFF || t === T.DWALL || t === T.LADDER) {
        const b = m.biome[y * m.w + x], st = m.t(x, y + 1), bot = !(st === T.CLIFF || st === T.DWALL || st === T.VOID || st === T.LADDER);
        const img = A.tiles[t === T.DWALL ? 'dwall' + m.theme : (b === G.BI.north ? 'cliff_s' : b === G.BI.canyon ? 'cliff_r' : 'cliff_g')];
        c.drawImage(img, (hv + (bot ? 4 : 0)) * 16, 0, 16, 16, px, py, 16, 16);
        if (t === T.LADDER) { c.fillStyle = '#6b4530'; c.fillRect(px + 3, py, 2, 16); c.fillRect(px + 11, py, 2, 16); c.fillStyle = '#b38655'; for (let k = 1; k < 16; k += 4) c.fillRect(px + 3, py + k, 10, 2); }
      } else {
        const img = A.tiles[setOf(m, t)]; let v = hv;
        if (d.nat && img.width > 64 && G.fbm(x / 7, y / 7, 99, 2) > .56) v += 4;
        c.drawImage(img, v * 16, 0, 16, 16, px, py, 16, 16);
      }
      if (d.nat) {
        tmp.length = 0;
        for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { if (!i && !j) continue; const nt = m.t(x + i, y + j), nd = TD[nt]; if (nd.nat && nd.pri > d.pri && nd.pri > 1 && tmp.indexOf(nt) < 0) tmp.push(nt); }
        if (tmp.length > 1) tmp.sort((a, b) => TD[a].pri - TD[b].pri);
        for (const nt of tmp) { const img = A.tiles[setOf(m, nt) + '_e']; if (!img) continue; const [em, cm] = masks((a, b) => m.t(a, b) === nt, x, y); if (em) c.drawImage(img, em * 16, 0, 16, 16, px, py, 16, 16); if (cm) c.drawImage(img, cm * 16, 16, 16, 16, px, py, 16, 16); }
      }
      if (d.pass && t !== T.LADDER) { const nt = m.t(x, y - 1); if (nt === T.CLIFF || nt === T.DWALL) { c.fillStyle = 'rgba(20,12,34,.42)'; c.fillRect(px, py, 16, 3); c.fillStyle = 'rgba(20,12,34,.2)'; c.fillRect(px, py + 3, 16, 2); } }
    }
    return { cv, water, used: 0 };
  }
  function chunk(m, cx, cy) {
    const k = cy * 4096 + cx; let c = R.chunks.get(k);
    if (!c) { c = buildChunk(m, cx, cy); R.chunks.set(k, c); if (R.chunks.size > 60) { let old = null, ok = 0; for (const [kk, v] of R.chunks) if (!old || v.used < old.used) { old = v; ok = kk; } R.chunks.delete(ok); } }
    c.used = R.frame; return c;
  }

  /* --- объекты --- */
  const isWall = (m, x, y) => { const o = m.at(x, y); return !!(o && G.OBJ[o.t].wall); };
  const isFence = (m, x, y) => { const o = m.at(x, y); return !!(o && (G.OBJ[o.t].fence || G.OBJ[o.t].wall)); };
  R.objSprite = (m, o, d) => {
    if (o.dead) { const dd = (d.res && d.res.dead) || (d.pick && d.pick.dead); if (dd) return dd; if (d.pick && d.pick.keep) return d.s[o.v % d.s.length]; return null; }
    if (o.t === 'door') { const v = (o.rot != null ? o.rot : (isWall(m, o.x, o.y - 1) || isWall(m, o.x, o.y + 1)) ? 1 : 0); return (v ? 'doorv_' : 'door_') + (o.open ? 'o' : 'c'); }
    if (o.t === 'fence') return 'fence' + ((isFence(m, o.x, o.y - 1) ? 1 : 0) | (isFence(m, o.x + 1, o.y) ? 2 : 0) | (isFence(m, o.x, o.y + 1) ? 4 : 0) | (isFence(m, o.x - 1, o.y) ? 8 : 0));
    if (o.open && d.so) return d.so;
    if (o.t === 'plot') return (o.wet || 0) > G.time.total ? 'plot_w' : 'plot_d';
    if (o.t === 'furnace') return G.Craft && G.Craft.busy('furnace') ? 'furnace1' : 'furnace0';
    if (d.anim) return d.s[(Math.floor(R.time * 1.6 + o.x * .37 + o.y * .21)) % d.anim];
    return d.s[o.v % d.s.length];
  };
  function drawObj(c, o) {
    const m = G.map, d = G.OBJ[o.t], name = R.objSprite(m, o, d); if (!name) return;
    const s = A.spr[name]; if (!s) return;
    const sz = d.size || [1, 1], ox = R.cam.sx, oy = R.cam.sy;
    let dx = o.x * TS + ((sz[0] * TS - s.w) >> 1) - ox, dy = d.flat ? o.y * TS + ((sz[1] * TS - s.h) >> 1) - oy : (o.y + sz[1]) * TS - s.h - oy;
    if (o.shake > 0) { dx += Math.round(Math.sin(o.shake * 60) * 1.5); }
    const dead = !!o.dead;
    if (d.sh != null && !dead) { const sh = A.spr['sh' + d.sh]; c.drawImage(sh.c, o.x * TS + 8 - (sh.w >> 1) - ox, (o.y + 1) * TS - (sh.h >> 1) - 2 - oy); }
    let alpha = 1;
    if (d.tree && !dead) { const p = G.player; if (p && p.x > dx + ox + 4 && p.x < dx + ox + s.w - 4 && p.y - 8 > dy + oy && p.y < (o.y + 1) * TS - 6) alpha = .5; }
    if (o.float) dy += Math.round(Math.sin(R.time * 2 + o.x) * 1);
    if (alpha < 1) c.globalAlpha = alpha;
    if (d.sway && !dead) {
      const top = Math.floor(s.h * .62), st = Math.ceil(top / 3), ph = R.time * 1.4 + o.x * .7 + o.y * .3, wind = G.Weather ? G.Weather.wind : 1;
      for (let i = 0; i < 3; i++) { const off = Math.round(Math.sin(ph + i * .5) * (1.1 - i * .35) * wind); c.drawImage(s.c, 0, i * st, s.w, st, dx + off, dy + i * st, s.w, st); }
      c.drawImage(s.c, 0, st * 3, s.w, s.h - st * 3, dx, dy + st * 3, s.w, s.h - st * 3);
    } else c.drawImage(s.c, dx, dy);
    if (alpha < 1) c.globalAlpha = 1;
    if (dead) return;
    if (o.t === 'plot' && o.crop) { const cr = G.CROPS[o.crop], stg = Math.min(3, Math.floor((o.g || 0) / cr.time * 3)), cs = A.spr['crop_' + o.crop + stg]; c.drawImage(cs.c, dx, dy - 3); }
    if (d.fire === 1 && !o.out) { const f = A.spr['flame' + (Math.floor(R.time * 9 + o.x) & 3)]; c.drawImage(f.c, dx + 3, dy - 9); }
    else if (d.fire === 2) { const f = A.spr['flame' + (Math.floor(R.time * 9 + o.x) & 3)]; c.drawImage(f.c, 2, 4, 8, 12, dx, dy - 8, 8, 12); }
    else if (o.t === 'brazier' && o.open) { const f = A.spr['flame' + (Math.floor(R.time * 9 + o.x) & 3)]; c.drawImage(f.c, dx, dy - 10); }
    else if (d.mill) { const b = A.spr.blade; c.save(); c.translate(dx + 26, dy + 22); c.rotate(R.time * .7); c.drawImage(b.c, -23, -23); c.restore(); }
    else if (o.t === 'spike') { if (G.Traps && G.Traps.up(o)) c.drawImage(A.spr.spike1.c, dx, dy - 4); }
    if (o.hpShow > 0 && o.maxhp) { c.fillStyle = '#1b1526'; c.fillRect(dx + (s.w >> 1) - 7, dy - 4, 14, 3); c.fillStyle = '#ffd23e'; c.fillRect(dx + (s.w >> 1) - 6, dy - 3, Math.max(0, Math.round(12 * o.hp / o.maxhp)), 1); }
  }
  R.drawObj = drawObj;
  R.push = (y, fn, o) => { let e = R.list[R.n]; if (!e) e = R.list[R.n] = { y: 0, fn: null, o: null }; e.y = y; e.fn = fn; e.o = o; R.n++; };
  R.light = (x, y, r, col, a) => { R.lights.push(x, y, r, col, a == null ? 1 : a); };
  const lightSpr = {};
  function lightOf(col) { let c = lightSpr[col]; if (c) return c; c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); x.drawImage(A.spr.light.c, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, 64, 64); return lightSpr[col] = c; }

  /* плавающие числа: крошечный пиксельный шрифт */
  const DG = { '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001', '5': '111100111001111', '6': '111100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001111', '+': '000010111010000', '-': '000000111000000', '!': '010010010000010' };
  function num(c, str, x, y, col) { let w = str.length * 4 - 1; x -= w >> 1; for (let pass = 0; pass < 2; pass++) { c.fillStyle = pass ? col : '#1b1526'; let cx = x; for (const ch of str) { const g = DG[ch]; if (g) for (let i = 0; i < 15; i++) if (g[i] === '1') { const px = cx + (i % 3), py = y + Math.floor(i / 3); if (pass) c.fillRect(px, py, 1, 1); else c.fillRect(px - 1, py - 1, 3, 3); } cx += 4; } } }
  R.text = (x, y, str, col, big) => { R.texts.push({ x, y, str: String(str), col: col || '#fff', t: 0, big: big ? 1 : 0 }); if (R.texts.length > 40) R.texts.shift(); };
  R.addFx = fx => R.fx.push(fx);

  R.follow = (tx, ty, dt, snap) => {
    const m = G.map, c = R.cam, gx = tx - R.vw / 2, gy = ty - R.vh / 2, k = snap ? 1 : 1 - Math.exp(-7 * dt);
    c.x += (gx - c.x) * k; c.y += (gy - c.y) * k;
    const mw = m.w * TS, mh = m.h * TS;
    c.x = mw <= R.vw ? (mw - R.vw) / 2 : G.clamp(c.x, 0, mw - R.vw); c.y = mh <= R.vh ? (mh - R.vh) / 2 : G.clamp(c.y, 0, mh - R.vh);
    if (c.shake > 0) c.shake = Math.max(0, c.shake - dt * 14);
    c.sx = Math.round(c.x + (c.shake ? (Math.random() - .5) * c.shake : 0)); c.sy = Math.round(c.y + (c.shake ? (Math.random() - .5) * c.shake : 0));
  };

  R.draw = dt => {
    const m = G.map, c = R.ctx, cam = R.cam, ox = cam.sx, oy = cam.sy; R.frame++; R.time += dt;
    const tx0 = Math.floor(ox / TS), ty0 = Math.floor(oy / TS), tx1 = Math.floor((ox + R.vw) / TS), ty1 = Math.floor((oy + R.vh) / TS);
    const cx0 = Math.floor(tx0 / CH), cy0 = Math.floor(ty0 / CH), cx1 = Math.floor(tx1 / CH), cy1 = Math.floor(ty1 / CH);
    c.fillStyle = m.dark ? '#120d1c' : '#3b6ea8'; c.fillRect(0, 0, R.vw, R.vh);
    /* вода */
    const wf = Math.floor(R.time * 2.2) & 3, ff = Math.floor(R.time * 1.3) & 1;
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
      const ch = chunk(m, cx, cy), w = ch.water;
      for (let i = 0; i < w.length; i += 6) {
        const x = w[i], y = w[i + 1]; if (x < tx0 || x > tx1 || y < ty0 || y > ty1) continue;
        const ws = WS[w[i + 3]], px = x * TS - ox, py = y * TS - oy;
        c.drawImage(A.tiles['water_' + ws], ((wf + x + y) & 3) * 16 + (w[i + 2] ? 64 : 0), 0, 16, 16, px, py, 16, 16);
        const em = w[i + 4], cm = w[i + 5];
        if (em || cm) { const fi = A.tiles['foam_' + ws], f = (ff + ((x + y) & 1)) & 1; if (em) c.drawImage(fi, em * 16, f * 32, 16, 16, px, py, 16, 16); if (cm) c.drawImage(fi, cm * 16, 16 + f * 32, 16, 16, px, py, 16, 16); }
      }
    }
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) c.drawImage(chunk(m, cx, cy).cv, cx * CH * TS - ox, cy * CH * TS - oy);
    /* объекты */
    R.n = 0; R.lights.length = 0;
    const fr = R.frame, grid = m.grid, objs = m.objs;
    for (let y = ty0 - 1; y <= ty1 + 4; y++) { if (y < 0 || y >= m.h) continue; for (let x = tx0 - 3; x <= tx1 + 3; x++) { if (x < 0 || x >= m.w) continue; const gi = grid[y * m.w + x]; if (!gi) continue; const o = objs[gi - 1]; if (!o || o._f === fr) continue; o._f = fr; const d = G.OBJ[o.t]; if (d.hidden) continue;
      if (o.shake > 0) o.shake -= dt; if (o.hpShow > 0) o.hpShow -= dt;
      if (d.flat) drawObj(c, o); else R.push((o.y + (d.size ? d.size[1] : 1)) * TS - (d.wall ? 0 : 3), drawObj, o);
      if (d.light && !o.dead && !(o.t === 'brazier' && !o.open) && !o.out) { const L = d.light, fl = d.fire ? 1 + Math.sin(R.time * 11 + o.x) * .05 : 1; R.light(o.x * TS + 8 * (d.size ? d.size[0] : 1), o.y * TS + 6, L[0] * fl, L[1], L[2]); }
      else if (o.t === 'brazier' && o.open) R.light(o.x * TS + 8, o.y * TS + 2, 56 + Math.sin(R.time * 11 + o.x) * 3, '#ff9a3e', .95);
    } }
    if (G.Ent) G.Ent.gather(R);
    for (let i = R.fx.length - 1; i >= 0; i--) { const f = R.fx[i]; f.t += dt; if (f.t >= f.life) { R.fx.splice(i, 1); if (f.done) f.done(); continue; } if (f.flat) f.draw(c, f, ox, oy); else R.push(f.y, f.draw, f); }
    const L = R.list, n = R.n; for (let i = 1; i < n; i++) { const e = L[i]; let j = i - 1; while (j >= 0 && L[j].y > e.y) { L[j + 1] = L[j]; j--; } L[j + 1] = e; }
    for (let i = 0; i < n; i++) { const e = L[i]; e.fn(c, e.o, ox, oy); }
    /* крыши */
    const p = G.player; let under = false; if (p) { const ptx = Math.floor(p.x / TS), pty = Math.floor((p.y - 2) / TS); under = m.inb(ptx, pty) && m.roof[pty * m.w + ptx] > 0; }
    R.roofA += ((under ? .0 : 1) - R.roofA) * Math.min(1, dt * 8);
    if (R.roofA > .02) { c.globalAlpha = R.roofA; for (let y = ty0; y <= ty1 + 1; y++) { if (y < 0 || y >= m.h) continue; for (let x = tx0; x <= tx1; x++) { if (x < 0 || x >= m.w) continue; const rf = m.roof[y * m.w + x]; if (!rf) continue; const px = x * TS - ox, py = y * TS - oy - 10, img = A.tiles['roof' + rf];
      c.drawImage(img, ((x * 3 + y) & 3) * 16, 0, 16, 16, px, py, 16, 16);
      const rs = (xx, yy) => m.inb(xx, yy) && m.roof[yy * m.w + xx];
      if (!rs(x, y + 1)) { c.drawImage(img, 0, 0, 16, 5, px, py + 16, 16, 5); c.fillStyle = 'rgba(20,12,34,.45)'; c.fillRect(px, py + 16, 16, 5); c.fillStyle = '#1b1526'; c.fillRect(px, py + 21, 16, 1); }
      if (!rs(x, y - 1)) { c.fillStyle = '#1b1526'; c.fillRect(px, py - 1, 16, 1); c.fillStyle = 'rgba(255,246,220,.35)'; c.fillRect(px, py, 16, 1); }
      const bh = rs(x, y + 1) ? 16 : 22;
      if (!rs(x - 1, y)) { c.fillStyle = '#1b1526'; c.fillRect(px - 1, py, 1, bh); c.fillStyle = 'rgba(255,246,220,.25)'; c.fillRect(px, py, 1, 16); }
      if (!rs(x + 1, y)) { c.fillStyle = '#1b1526'; c.fillRect(px + 16, py, 1, bh); c.fillStyle = 'rgba(20,12,34,.3)'; c.fillRect(px + 15, py, 1, 16); }
    } } c.globalAlpha = 1; }
    if (G.Ent && G.Ent.over) G.Ent.over(c, ox, oy, dt);
    if (G.Weather) G.Weather.draw(c, R, dt);
    /* освещение: карта света умножается на сцену */
    const amb = G.Time ? G.Time.ambient() : null;
    if (amb && (amb[0] < 250 || amb[1] < 250 || amb[2] < 250)) {
      const lx = R.lx, lw = R.lm.width, lh = R.lm.height;
      lx.globalCompositeOperation = 'source-over'; lx.fillStyle = 'rgb(' + amb[0] + ',' + amb[1] + ',' + amb[2] + ')'; lx.fillRect(0, 0, lw, lh);
      lx.globalCompositeOperation = 'lighter'; const Ls = R.lights;
      for (let i = 0; i < Ls.length; i += 5) { const r = Ls[i + 2] / 2, x = (Ls[i] - ox) / 2, y = (Ls[i + 1] - oy) / 2; if (x < -r || y < -r || x > lw + r || y > lh + r) continue; lx.globalAlpha = Ls[i + 4]; lx.drawImage(lightOf(Ls[i + 3]), x - r, y - r, r * 2, r * 2); }
      lx.globalAlpha = 1;
      c.globalCompositeOperation = 'multiply'; c.drawImage(R.lm, 0, 0, lw * 2, lh * 2); c.globalCompositeOperation = 'source-over';
    }
    if (G.Weather && G.Weather.flash > 0) { c.fillStyle = 'rgba(255,255,255,' + Math.min(.7, G.Weather.flash) + ')'; c.fillRect(0, 0, R.vw, R.vh); }
    /* числа урона */
    for (let i = R.texts.length - 1; i >= 0; i--) { const t = R.texts[i]; t.t += dt; if (t.t > .9) { R.texts.splice(i, 1); continue; } const yy = Math.round(t.y - oy - t.t * 22 - (t.big ? 4 : 0)), xx = Math.round(t.x - ox); if (t.t > .65) c.globalAlpha = (0.9 - t.t) * 4; num(c, t.str, xx, yy, t.col); c.globalAlpha = 1; }
  };
})();
