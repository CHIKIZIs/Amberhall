'use strict';
/* World Generator + Biome Manager: карта, тайлы, объекты, руины, деревня, подземелья. */
(() => {
  const T = G.T = { DEEP: 0, WATER: 1, ICE: 2, SAND: 3, DIRT: 4, RED: 5, GRASS: 6, DGRASS: 7, PINK: 8, SNOW: 9, RUIN: 10, WOODF: 11, STONEF: 12, FOUND: 13, BRIDGE: 14, SBRIDGE: 15, CLIFF: 16, DFLOOR: 17, DWALL: 18, VOID: 19, ROAD: 20, LADDER: 21 };
  /* pass: 0 — нельзя, 1 — можно, 2 — вброд. pri — приоритет наложения краёв */
  const TD = G.TILE = [];
  const td = (id, set, pass, pri, step, nat) => { TD[id] = { set, pass, pri, step, nat: nat ? 1 : 0 }; };
  td(T.DEEP, 'water', 0, 0, 'water', 1); td(T.WATER, 'water', 2, 1, 'water', 1); td(T.ICE, 'ice', 1, 2, 'stone', 1); td(T.SAND, 'sand', 1, 3, 'sand', 1);
  td(T.DIRT, 'dirt', 1, 4, 'sand', 1); td(T.RED, 'red', 1, 5, 'stone', 1); td(T.GRASS, 'grass', 1, 6, 'grass', 1); td(T.DGRASS, 'dgrass', 1, 7, 'grass', 1);
  td(T.PINK, 'pink', 1, 8, 'grass', 1); td(T.SNOW, 'snow', 1, 9, 'snow', 1); td(T.RUIN, 'ruin', 1, 0, 'stone', 1); td(T.WOODF, 'woodf', 1, 0, 'wood');
  td(T.STONEF, 'stonef', 1, 0, 'stone'); td(T.FOUND, 'found', 1, 0, 'stone'); td(T.BRIDGE, 'bridge', 1, 0, 'wood'); td(T.SBRIDGE, 'sbridge', 1, 0, 'stone');
  td(T.CLIFF, 'cliff', 0, 0, 'stone'); td(T.DFLOOR, 'dfloor', 1, 5, 'stone', 1); td(T.DWALL, 'dwall', 0, 0, 'stone'); td(T.VOID, 'void', 0, 0, 'stone');
  td(T.ROAD, 'cobble', 1, 0, 'stone', 1); td(T.LADDER, 'cliff', 1, 0, 'wood');
  const BI = { ocean: 0, green: 1, pink: 2, canyon: 3, village: 4, north: 5, dungeon: 6 };
  G.BI = BI;

  class GMap {
    constructor(id, w, h) {
      this.id = id; this.w = w; this.h = h; const n = w * h;
      this.tiles = new Uint8Array(n); this.biome = new Uint8Array(n); this.roof = new Uint8Array(n); this.grid = new Int32Array(n);
      this.objs = []; this.spawns = []; this.pois = []; this.lights = []; this.dark = 0; this.theme = ''; this.wset = 'w'; this.plots = []; this.deadList = [];
    }
    inb(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
    t(x, y) { return (x >= 0 && y >= 0 && x < this.w && y < this.h) ? this.tiles[y * this.w + x] : (this.id === 'world' ? T.DEEP : T.VOID); }
    at(x, y) { if (!this.inb(x, y)) return null; const i = this.grid[y * this.w + x]; return i ? this.objs[i - 1] : null; }
    free(x, y, w, h) { for (let j = 0; j < (h || 1); j++) for (let i = 0; i < (w || 1); i++) if (!this.inb(x + i, y + j) || this.grid[(y + j) * this.w + x + i]) return false; return true; }
    add(type, x, y, props) {
      const d = G.OBJ[type]; if (!d) { console.warn('нет объекта', type); return null; }
      const sz = d.size || [1, 1]; if (!this.free(x, y, sz[0], sz[1])) return null;
      const o = Object.assign({ t: type, x, y, v: Math.floor(G.hash(x, y, 17) * 97) }, props || {});
      this.objs.push(o); o.i = this.objs.length;
      for (let j = 0; j < sz[1]; j++) for (let i = 0; i < sz[0]; i++) this.grid[(y + j) * this.w + x + i] = o.i;
      if (d.plot) this.plots.push(o);
      return o;
    }
    remove(o) {
      const d = G.OBJ[o.t], sz = d.size || [1, 1];
      for (let j = 0; j < sz[1]; j++) for (let i = 0; i < sz[0]; i++) if (this.grid[(o.y + j) * this.w + o.x + i] === o.i) this.grid[(o.y + j) * this.w + o.x + i] = 0;
      this.objs[o.i - 1] = null; if (d.plot) this.plots = this.plots.filter(p => p !== o);
    }
    /* проходимость тайла для ходьбы (без учёта объектов) */
    pass(x, y) { return TD[this.t(x, y)].pass; }
    solidObj(x, y) { const o = this.at(x, y); if (!o) return false; const d = G.OBJ[o.t]; if (!d.solid || o.open || (o.dead && !(d.res && d.res.dead === 'stump'))) return false; return true; }
    walk(x, y) { return this.pass(x, y) > 0 && !this.solidObj(x, y); }
    setTile(x, y, t) { if (this.inb(x, y)) { this.tiles[y * this.w + x] = t; G.bus.emit('tile', { map: this, x, y }); } }
  }
  G.GMap = GMap;

  const W = {}; G.World = W;

  /* ---------- Шаблоны построек ---------- */
  const TPL = {
    tower: ['~~###~~', '~#...#~', '#..c..#', '#.....#', '#..t..#', '~#...#~', '~~#.#~~'],
    camp: ['p~~~~~p', '~.....~', '~..u..~', '~.....~', 'p~~~~~p'],
    wallrow: ['##x###~~###', '~~~~~~~~~~~', '~p~~~~~~~p~'],
    archway: ['~~~~~~~', '#Aaa###', '~~~~~~~'],
    wellyard: ['#~~~~#', '~....~', '~.w..~', '~....~', '#~~t~#'],
    crypt: ['~####~####~', '##...#...##', '#..p...p..#', '#.........#', '#....S....#', '#.........#', '#..p...p..#', '##.......##', '~###.t.###~', '~~~Aaa~~~~~'],
    fortress: ['#####~~~#####', '#...#~~~#...#', '#.c.#####.u.#', '#...........#', '##.#.....#.##', '~#....G....#~', '~#.........#~', '##.#.....#.##', '#....t......#', '#.k.##x##.C.#', '#...#~~~#...#', '#####~~~#####'],
    temple: ['~~LLLLLLL~~', '~LL.....LL~', 'LL.B...B.LL', 'L....E....L', 'L.........L', 'LL.B...B.LL', '~LL..m..LL~', '~~LL...LL~~'],
    shrine1: ['p~~~p', '~...~', '~hH.~', '~...~', 'p~~~p'],
    frozen: ['###~~###', '#......#', '#.c..u.#', '~......~', '#..t...#', '##.G..##', '~##~~##~'],
    mine: ['k~~b~', '~...~', '~.t.k', 'b...~'],
    house1: ['WWW=WWW', 'W.e..fW', 'W.....W', 'W.T..kW', 'W=WdW=W'],
    house2: ['WW=WWW=WW', 'We..T..fW', 'W.......W', 'Wb.....cW', 'W=WWdWW=W'],
    house3: ['WWWWWW', 'W.e.fW', '=....W', 'W.k..W', 'W=dW=W'],
    workshop: ['WW=WW=WWW', 'WK..F..bW', 'W.......W', 'Wk..T..OW', 'W=WWdWW=W'],
    heart: ['~~p~~~~~p~~', '~.........~', 'p....Yyy..p', '~....yyy..~', '~.........~', '~~B~~~~~B~~']
  };
  const LEG = { '#': 'rwall', 'L': 'lwall', 'x': 'cracked', 'c': 'wchest', 'C': 'achest', 't': 'tablet', 'u': 'urn', 'k': 'crate', 'b': 'barrel', 's': 'rstatue', 'w': 'rwell', 'm': 'monument', 'B': 'brazier', 'S': 'stairs_d', 'W': 'wall_wood', '=': 'win_wood', 'd': 'door', 'e': 'bed', 'T': 'vtable', 'f': 'shelf', 'K': 'workbench', 'F': 'furnace', 'O': 'kitchen', 'h': 'shrine', 'A': 'arch', 'Y': 'hgate', 'p': 'pillar' };

  function stamp(m, name, x0, y0, o) {
    o = o || {}; const tpl = TPL[name], r = G.rng(x0 * 131 + y0 * 7 + 3), house = !!o.roof, out = {};
    const hh = tpl.length, ww = tpl[0].length, land = o.floor || T.RUIN;
    /* сначала расчистка */
    for (let j = -1; j <= hh; j++) for (let i = -1; i <= ww; i++) {
      const x = x0 + i, y = y0 + j; if (!m.inb(x, y)) continue; const ob = m.at(x, y); if (ob) m.remove(ob);
      const t = m.t(x, y); if (TD[t].pass !== 1 || t === T.CLIFF) m.tiles[y * m.w + x] = o.ground || T.GRASS;
    }
    for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) {
      const ch = tpl[j][i], x = x0 + i, y = y0 + j, k = y * m.w + x;
      if (ch === '~' || ch === ' ') continue;
      if (house) { if (j < hh - 1) m.roof[k] = o.roof; m.tiles[k] = T.WOODF; }
      else if (ch !== 'p' && (ch === '.' ? r() < (o.fl == null ? .8 : o.fl) : true)) m.tiles[k] = land;
      if (ch === '.' || ch === 'a' || ch === 'y' || ch === 'H') continue;
      if (ch === 'G' || ch === 'E') { m.spawns.push({ type: ch === 'E' ? 'elder' : 'guardian', x, y, id: 's' + k, boss: ch === 'E' }); if (ch === 'E') out.boss = [x, y]; continue; }
      let type = LEG[ch]; if (!type) continue;
      if (ch === '#' && !o.intact) { const q = r(); if (q < .12) continue; if (q < .34) type = 'bwall'; }
      if (ch === 'p' && r() < .4) type = 'pillar_b';
      const ob = m.add(type, x, y, {});
      if (!ob) continue;
      if (ch === 't') ob.lore = o.lore != null ? o.lore : 1 + Math.floor(r() * 3);
      if (ch === 'm') ob.lore = o.mlore != null ? o.mlore : 4;
      if (ch === 'S' || ch === 'Y') { ob.to = o.to; out.door = [x, y]; }
      if (ch === 'c' || ch === 'C') ob.loot = o.loot || (ch === 'C' ? 't3' : 't1');
      if (ch === 'B') { ob.pz = o.pz || 0; (out.braziers || (out.braziers = [])).push(ob); }
      if (ch === 'e') ob.v = Math.floor(r() * 2);
      if (ch === 'x') ob.secret = 1;
    }
    return out;
  }

  /* ---------- ВЕРХНИЙ МИР ---------- */
  W.genWorld = seed => {
    const WW = 320, HH = 256, m = new GMap('world', WW, HH), til = m.tiles, bio = m.biome, r = G.rng(seed);
    /* раскладка из сида: зеркало и плавное искривление двигают биомы и места интереса вместе */
    const flip = r() < .5, rot = Math.floor(r() * 4), ph = [r() * 6.28, r() * 6.28, r() * 6.28, r() * 6.28], amp = [.045 + r() * .04, .04 + r() * .035];
    const shape = r(), bays = 1 + Math.floor(r() * 3);
    const L = (fx, fy) => { if (flip) fx = 1 - fx; if (rot === 1) [fx, fy] = [1 - fy, fx]; else if (rot === 2) [fx, fy] = [1 - fx, 1 - fy]; else if (rot === 3) [fx, fy] = [fy, 1 - fx]; return [fx + Math.sin(fy * 5.1 + ph[0]) * amp[0] + Math.sin(fy * 9.3 + ph[1]) * amp[0] * .4, fy + Math.sin(fx * 4.7 + ph[2]) * amp[1] + Math.sin(fx * 8.9 + ph[3]) * amp[1] * .4]; };
    m.layout = { flip, rot };
    const fb = G.fbm, H = G.hash;
    const cen = [[.5, .76, BI.green], [.36, .8, BI.green], [.64, .8, BI.green], [.5, .46, BI.village], [.8, .5, BI.pink], [.78, .72, BI.pink], [.2, .5, BI.canyon], [.22, .72, BI.canyon], [.24, .2, BI.north], [.5, .18, BI.north], [.76, .2, BI.north]];
    for (const c of cen) { const q = L(c[0], c[1]); c[0] = q[0]; c[1] = q[1]; }
    const land = new Float32Array(WW * HH);
    for (let y = 0; y < HH; y++) for (let x = 0; x < WW; x++) {
      const k = y * WW + x, wx0 = (fb(x / 46, y / 46, seed + 5, 2) - .5) * .55, wy0 = (fb(x / 46, y / 46, seed + 6, 2) - .5) * .55, nx = x / WW * 2 - 1 + wx0, ny = y / HH * 2 - 1 + wy0, dRect = 1 - (1 - nx * nx) * (1 - ny * ny), dRad = Math.min(1.4, Math.hypot(nx, ny) * .92), bay = Math.max(0, Math.sin(Math.atan2(ny, nx) * bays + ph[1]) - .55) * .55 * Math.hypot(nx, ny), d = Math.min(1.5, dRect * (1 - shape) + dRad * shape + bay);
      const v = .62 + (fb(x / 30, y / 30, seed, 4) - .5) * .6 - d * d * d * 1.3; land[k] = v;
      const wx = x + (fb(x / 36, y / 36, seed + 11, 3) - .5) * 56, wy = y + (fb(x / 36, y / 36, seed + 23, 3) - .5) * 56;
      let b1 = 0, d1 = 1e9, d2 = 1e9, b2 = 0;
      for (const c of cen) { const dd = Math.hypot(wx - c[0] * WW, (wy - c[1] * HH) * 1.15); if (dd < d1) { d2 = d1; b2 = b1; d1 = dd; b1 = c[2]; } else if (dd < d2) { d2 = dd; b2 = c[2]; } }
      let t;
      if (v < .29) { t = T.DEEP; b1 = b1; }
      else if (v < .345) t = T.WATER;
      else {
        const border = b1 !== b2 ? d2 - d1 : 99;
        const ground = [T.GRASS, T.GRASS, T.PINK, T.RED, T.DGRASS, T.SNOW][b1];
        t = ground;
        if (v < .385 && b1 !== BI.north) t = T.SAND;
        const ridge = (b1 === BI.north || b2 === BI.north || b1 === BI.canyon || b2 === BI.canyon);
        if (border < 3.2) { if (ridge) { if (border < 2.6) t = T.CLIFF; } else t = border < 1.3 ? T.DEEP : T.WATER; }
        else {
          const lk = fb(x / 17, y / 17, seed + 50, 3);
          if (lk > .735) t = lk > .775 ? T.DEEP : T.WATER; else if (lk > .715 && b1 !== BI.north && b1 !== BI.canyon) t = T.SAND;
          else {
            const cl = fb(x / 11, y / 11, seed + 7, 3);
            if (b1 === BI.canyon && cl > .6) t = T.CLIFF; else if (b1 === BI.north && cl > .68) t = T.CLIFF; else if ((b1 === BI.green || b1 === BI.village || b1 === BI.pink) && cl > .78 && v > .45) t = T.CLIFF;
          }
        }
      }
      if (b1 === BI.north && t === T.WATER) t = T.ICE;
      til[k] = t; bio[k] = b1;
    }
    for (let pass = 0; pass < 2; pass++) for (let y = 1; y < HH - 1; y++) for (let x = 1; x < WW - 1; x++) {
      const k = y * WW + x, t = til[k]; if (t !== T.CLIFF) continue; let n = 0;
      for (const [i, j] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (til[k + j * WW + i] === T.CLIFF) n++;
      if (n <= 1) til[k] = [T.GRASS, T.GRASS, T.PINK, T.RED, T.DGRASS, T.SNOW][bio[k]] || T.GRASS;
    }
    /* реки */
    { const nR = 4 + Math.floor(r() * 3);
      for (let k = 0; k < nR; k++) {
        let x = 0, y = 0, ok = false;
        for (let a = 0; a < 200 && !ok; a++) { x = 20 + Math.floor(r() * (WW - 40)); y = 20 + Math.floor(r() * (HH - 40)); const kk = y * WW + x; ok = land[kk] > .5 && TD[til[kk]].pass === 1 && bio[kk] !== BI.canyon; }
        if (!ok) continue;
        let dir = r() * 6.28, len = 0, wide = r() < .5;
        while (len++ < 260) {
          const kk = y * WW + x; if (til[kk] === T.DEEP || (til[kk] === T.WATER && len > 4)) break;
          /* следующий шаг — вниз по склону с извилинами */
          let best = null, bv = 1e9; for (let a = 0; a < 8; a++) { const an = dir + (a - 3.5) * .45, nx = Math.round(x + Math.cos(an)), ny = Math.round(y + Math.sin(an)); if (nx < 2 || ny < 2 || nx >= WW - 2 || ny >= HH - 2) continue; const v = land[ny * WW + nx] + Math.abs(a - 3.5) * .006 + (r() - .5) * .02; if (v < bv) { bv = v; best = [nx, ny, an]; } }
          if (!best) break; x = best[0]; y = best[1]; dir = best[2] * .7 + dir * .3;
          const deep = wide && len > 12;
          for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const X = x + i, Y = y + j, k2 = Y * WW + X; if (X < 1 || Y < 1 || X >= WW - 1 || Y >= HH - 1) continue; const t = til[k2]; if (t === T.CLIFF) continue; const centre = !i && !j; if (centre) til[k2] = deep ? T.DEEP : T.WATER; else if (Math.abs(i) + Math.abs(j) === 1 && (deep || r() < .45) && t !== T.DEEP) til[k2] = T.WATER; else if (t !== T.WATER && t !== T.DEEP && r() < .5 && bio[k2] !== BI.north) til[k2] = T.SAND; }
        }
      }
    }
    /* старт: южный берег зелёного острова */
    /* старт: ближайший к зелёному побережью берег */
    let [sx, sy] = (() => { const q = L(.5, .9); return [Math.floor(q[0] * WW), Math.floor(q[1] * HH)]; })();
    { let best = null, bd = 1e9; const tx = sx, ty = sy;
      for (let y = 6; y < HH - 6; y++) for (let x = 6; x < WW - 6; x++) { const k = y * WW + x; if (bio[k] !== BI.green || TD[til[k]].pass !== 1 || til[k] === T.CLIFF) continue; let wet = false, dry = 0; for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) { const t = til[k + j * WW + i]; if (t === T.DEEP) wet = true; if (TD[t].pass === 1) dry++; } if (!wet || dry < 30) continue; const d = (x - tx) * (x - tx) + (y - ty) * (y - ty); if (d < bd) { bd = d; best = [x, y]; } }
      if (best) [sx, sy] = best; }
    m.start = [sx, sy];
    /* дороги: гарантируют проход между биомами */
    const fits = (x, y, w, h) => { if (x < 5 || y < 5 || x + w >= WW - 5 || y + h >= HH - 5) return false; for (let j = -1; j <= h; j++) for (let i = -1; i <= w; i++) { const t = til[(y + j) * WW + x + i]; if (t === T.DEEP || t === T.WATER || t === T.BRIDGE || t === T.SBRIDGE || t === T.RUIN || t === T.WOODF || t === T.CLIFF) return false; } return true; };
    /* место под постройку: сначала случайно рядом, потом кольцами наружу до ближайшей суши */
    const spot = (cx, cy, w, h, rad) => { for (let a = 0; a < 160; a++) { const R = Math.min(rad, 4 + a / 4), x = cx + Math.floor((r() - .5) * 2 * R), y = cy + Math.floor((r() - .5) * 2 * R); if (fits(x, y, w, h)) return [x, y]; } for (let R = 1; R < 120; R++) for (let a = 0; a < R * 6; a++) { const an = a / (R * 6) * 6.283, x = Math.round(cx + Math.cos(an) * R), y = Math.round(cy + Math.sin(an) * R); if (fits(x, y, w, h)) return [x, y]; } return [cx, cy]; };
    const road = (x0, y0, x1, y1, kind, wid, wig) => {
      [x0, y0] = spot(x0, y0, 1, 1, 2); [x1, y1] = spot(x1, y1, 1, 1, 2);
      let x = x0, y = y0, guard = 0; const pts = [];
      while ((Math.abs(x - x1) > 1 || Math.abs(y - y1) > 1) && guard++ < 3000) {
        const ang = Math.atan2(y1 - y, x1 - x) + (fb(x / 9, y / 9, seed + 300, 2) - .5) * (wig == null ? 1.5 : wig);
        x += Math.cos(ang); y += Math.sin(ang); pts.push([Math.round(x), Math.round(y)]);
      }
      for (const [px, py] of pts) for (let j = 0; j < (wid || 2); j++) for (let i = 0; i < (wid || 2); i++) {
        const X = px + i, Y = py + j; if (!m.inb(X, Y)) continue; const k = Y * WW + X, t = til[k];
        if ((t === T.DEEP || t === T.WATER) && land[k] < .26) continue;
        if (t === T.DEEP || t === T.WATER) til[k] = bio[k] === BI.pink ? T.SBRIDGE : T.BRIDGE;
        else if (t === T.ICE || t === T.BRIDGE || t === T.SBRIDGE || t === T.ROAD || t === T.RUIN) { }
        else til[k] = kind || (bio[k] === BI.north ? T.SNOW : bio[k] === BI.canyon ? T.RED : T.DIRT);
      }
    };
    const P = (fx, fy) => { const q = L(fx, fy); return [Math.floor(q[0] * WW), Math.floor(q[1] * HH)]; };
    const vil = P(.5, .47), pinkC = P(.8, .56), canC = P(.2, .56), norC = P(.5, .2), heartC = P(.5, .385);
    road(sx, sy - 2, vil[0], vil[1] + 8); road(vil[0] + 8, vil[1], pinkC[0], pinkC[1]); road(vil[0] - 8, vil[1], canC[0], canC[1]);
    road(vil[0], vil[1] - 8, heartC[0], heartC[1] + 7); road(heartC[0] + 10, heartC[1], norC[0] + 6, norC[1]); road(norC[0], norC[1], P(.26, .2)[0], P(.26, .2)[1]); road(norC[0], norC[1], P(.74, .2)[0], P(.74, .2)[1]);
    road(pinkC[0], pinkC[1], P(.79, .74)[0], P(.79, .74)[1]); road(canC[0], canC[1], P(.21, .74)[0], P(.21, .74)[1]);
    const cryptC = [sx + (flip ? -30 : 30), sy - 24]; road(sx + 2, sy - 6, cryptC[0], cryptC[1] + 8);
    /* поиск подходящего места рядом с точкой */
    const poi = (type, name, x, y, icon) => m.pois.push({ type, name, x, y, icon: icon || 'ruin', found: 0 });
    const gnd = (x, y) => [T.GRASS, T.GRASS, T.PINK, T.RED, T.DGRASS, T.SNOW][bio[y * WW + x]];

    /* --- Зелёный остров: берег, руины, склеп --- */
    { const dry = (x, y) => TD[m.t(x, y)].pass === 1; if (dry(sx - 6, sy) && dry(sx - 4, sy)) m.add('wreck', sx - 6, sy, {}); for (const [t, dx, dy] of [['crate', -2, 1], ['barrel', 3, 0], ['crate', -7, -2], ['crate', 2, -2]]) if (dry(sx + dx, sy + dy)) m.add(t, sx + dx, sy + dy, {}); }
    { for (const [dx, dy] of [[4, -3], [3, -2], [-3, -3], [2, 2], [-2, 2]]) if (TD[m.t(sx + dx, sy + dy)].pass === 1 && m.t(sx + dx, sy + dy) !== T.CLIFF) { const o = m.add('tablet', sx + dx, sy + dy, {}); if (o) { o.lore = 0; break; } } }
    { const [x, y] = spot(cryptC[0], cryptC[1], 11, 10, 6); stamp(m, 'crypt', x, y, { to: { map: 'crypt' }, lore: 4, ground: T.GRASS }); m.ret = m.ret || {}; m.ret.crypt = [x + 5, y + 10]; poi('crypt', 'Забытый склеп', x + 5, y + 5, 'dungeon'); m.spawns.push({ type: 'guardian', x: x + 5, y: y + 12, id: 'gcrypt' }); road(x + 4, y + 11, cryptC[0], cryptC[1] + 9); }
    const smallRuins = ['tower', 'camp', 'wallrow', 'archway', 'wellyard'];
    const ruinAt = (fx, fy, rad, b, lore) => { const name = r.pick(smallRuins), tp = TPL[name], [cx, cy] = P(fx, fy), [x, y] = spot(cx, cy, tp[0].length, tp.length, rad); if (bio[y * WW + x] !== b) return; stamp(m, name, x, y, { ground: gnd(x, y), lore, loot: b === BI.green ? 't1' : 't2' }); poi('ruin', 'Руины', x + (tp[0].length >> 1), y + (tp.length >> 1)); if (b !== BI.green && r() < .7) m.spawns.push({ type: 'guardian', x: x + (tp[0].length >> 1), y: y + tp.length + 1, id: 'g' + x + '_' + y }); };
    for (const [fx, fy] of [[.44, .82], [.57, .7], [.38, .72], [.62, .86], [.5, .64], [.32, .84], [.68, .76], [.45, .7]]) ruinAt(fx, fy, 12, BI.green);
    /* --- Лесная деревня --- */
    {
      const [vx, vy] = vil; poi('village', 'Лесная деревня', vx, vy, 'village');
      for (let j = -4; j <= 4; j++) for (let i = -6; i <= 6; i++) { if (i * i / 30 + j * j / 14 > 1) continue; const k = (vy + j) * WW + vx + i; til[k] = T.ROAD; const ob = m.at(vx + i, vy + j); if (ob) m.remove(ob); }
      m.add('rwell', vx, vy, {}); m.add('lamp', vx - 4, vy - 3, {}); m.add('lamp', vx + 4, vy + 3, {}); { const o = m.add('sign', vx + 3, vy - 3, {}); if (o) o.text = 'Юг — берег. Восток — Розовый лес. Запад — Каньон. Север — Врата и снега.'; }
      /* дома: цельные постройки с крыльцом; дверь ведёт в комнату */
      m.keep = m.keep || new Uint8Array(WW * HH);
      const hs = [[-17, -12, 0], [8, -13, 0], [-21, 2, 1], [12, 3, 0], [-8, 8, 0], [16, -5, 0], [-6, -17, 0]];
      hs.forEach(([dx, dy, work], hi) => {
        const x = vx + dx, y = vy + dy;
        for (let j = -6; j <= 5; j++) for (let i = -1; i <= 5; i++) { const X = x + i, Y = y + j; if (!m.inb(X, Y)) continue; const ob = m.at(X, Y); if (ob) m.remove(ob); const k = Y * WW + X; if (TD[til[k]].pass !== 1 || til[k] === T.CLIFF || til[k] === T.SAND) til[k] = T.DGRASS; m.keep[k] = 1; }
        const id = 'h_' + x + '_' + y + (work ? '_w' : '');
        const h = m.add('house', x, y, { v: hi % 4 }); const d = m.add('hdoor', x + 2, y + 3, { to: { map: id } });
        m.ret[id] = [x + 2, y + 4]; road(x + 2, y + 4, vx, vy, T.DIRT, 2, .3);
      });
      /* заброшенная ферма */
      for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) { const x = vx + 4 + i, y = vy + 12 + j; const ob = m.at(x, y); if (ob) m.remove(ob); til[y * WW + x] = T.DGRASS; if ((i + j) % 2 === 0 || r() < .5) { const pl = m.add('plot', x, y, {}); if (pl && r() < .6) { pl.crop = r.pick(['carrot', 'wheat', 'potato', 'cabbage', 'pumpkin']); pl.g = 99999; pl.wild = 1; } } }
      for (let i = -1; i <= 6; i++) { m.add('fence', vx + 4 + i, vy + 11, {}); if (i !== 2) m.add('fence', vx + 4 + i, vy + 16, {}); } for (let j = 0; j < 4; j++) { m.add('fence', vx + 3, vy + 12 + j, {}); m.add('fence', vx + 10, vy + 12 + j, {}); }
      m.add('hay', vx + 12, vy + 13, {}); m.add('hay', vx + 13, vy + 14, {}); m.add('cart', vx - 12, vy + 8, {});
      { const [x, y] = spot(vx - 26, vy - 6, 4, 3, 5); for (let j = -1; j < 4; j++) for (let i = -1; i < 5; i++) { const ob = m.at(x + i, y + j); if (ob) m.remove(ob); if (TD[m.t(x + i, y + j)].pass !== 1) til[(y + j) * WW + x + i] = T.DGRASS; } m.add('mill', x, y, {}); const tb = m.add('tablet', x + 3, y + 2, {}); if (tb) tb.lore = 5; }
      { const tp = TPL.fortress, [x, y] = spot(vx + 34, vy - 22, tp[0].length, tp.length, 6); stamp(m, 'fortress', x, y, { ground: T.DGRASS, lore: 10, loot: 't2', intact: 0 }); poi('fort', 'Разрушенная крепость', x + 6, y + 6); m.spawns.push({ type: 'guardian', x: x + 3, y: y + 13, id: 'gf2' }); m.spawns.push({ type: 'skeleton', x: x + 9, y: y + 13, id: 'gf3' }); }
      for (const [fx, fy] of [[.42, .5], [.58, .42], [.44, .4], [.6, .54]]) ruinAt(fx, fy, 8, BI.village, 2);
    }
    /* --- Врата Сердца: островок посреди озера --- */
    {
      const [hx, hy] = heartC;
      for (let j = -13; j <= 13; j++) for (let i = -15; i <= 15; i++) { const x = hx + i, y = hy + j, d = Math.hypot(i / 15, j / 13) + (fb(x / 5, y / 5, seed + 70, 2) - .5) * .25, k = y * WW + x; const ob = m.at(x, y); if (ob) m.remove(ob); if (d < .5) til[k] = T.DGRASS; else if (d < .62) til[k] = T.WATER; else if (d < .9) til[k] = T.DEEP; else if (d < 1) til[k] = T.WATER; if (d < 1) bio[k] = BI.village; }
      for (let j = 6; j <= 14; j++) for (let i = 0; i < 2; i++) { const k = (hy + j) * WW + hx + i; if (til[k] === T.DEEP || til[k] === T.WATER) til[k] = T.SBRIDGE; }
      const o = stamp(m, 'heart', hx - 5, hy - 4, { ground: T.DGRASS, to: { map: 'heart' }, fl: 1 }); m.ret.heart = [hx, hy + 2]; poi('heart', 'Врата Сердца', hx, hy, 'gate');
      const tb = m.add('tablet', hx - 3, hy + 3, {}); if (tb) tb.lore = 8;
    }
    /* --- Розовый лес --- */
    {
      const tp = TPL.temple, [cx, cy] = P(.82, .62), [x, y] = spot(cx, cy, tp[0].length, tp.length, 8);
      const o = stamp(m, 'temple', x, y, { ground: T.PINK, pz: 1, mlore: 9, fl: 1 }); poi('temple', 'Святилище духов', x + 5, y + 4, 'temple'); road(x + 5, y + 8, pinkC[0], pinkC[1]);
      m.puzzle = { braziers: (o.braziers || []).map(b => [b.x, b.y]), chest: [x + 5, y + 1] };
      for (const [fx, fy] of [[.74, .46], [.86, .5], [.76, .68], [.84, .76], [.72, .58]]) { const [sx2, sy2] = P(fx, fy), [x2, y2] = spot(sx2, sy2, 5, 5, 8); if (bio[y2 * WW + x2] !== BI.pink) continue; if (r() < .5) { stamp(m, 'shrine1', x2, y2, { ground: T.PINK, fl: 1 }); poi('shrine', 'Святилище', x2 + 2, y2 + 2, 'temple'); } else { const mo = m.add('monument', x2 + 2, y2 + 2, {}); if (mo) { mo.lore = r.pick([3, 4, 9]); poi('ruin', 'Обелиск', x2 + 2, y2 + 2); } } }
      for (const [fx, fy] of [[.8, .44], [.88, .6], [.74, .76]]) ruinAt(fx, fy, 8, BI.pink, 3);
    }
    /* --- Красный каньон --- */
    {
      const [cx, cy] = P(.17, .62), [x, y] = spot(cx, cy, 4, 4, 10);
      for (let j = -2; j < 6; j++) for (let i = -2; i < 6; i++) { const k = (y + j) * WW + x + i, ob = m.at(x + i, y + j); if (ob) m.remove(ob); til[k] = (j < 1 && i >= 0 && i < 4) ? T.CLIFF : T.RED; }
      const cv = m.add('cave_r', x + 1, y + 1, {}); if (cv) cv.to = { map: 'mines' }; m.ret.mines = [x + 2, y + 4]; poi('mines', 'Каньонные копи', x + 2, y + 2, 'dungeon'); road(x + 2, y + 5, canC[0], canC[1]);
      stamp(m, 'mine', x + 5, y + 2, { ground: T.RED, lore: 6, fl: 0 });
      for (const [fx, fy] of [[.24, .46], [.14, .52], [.26, .7], [.16, .76]]) ruinAt(fx, fy, 8, BI.canyon, 6);
    }
    /* --- Северные земли --- */
    {
      const [cx, cy] = P(.3, .17), [x, y] = spot(cx, cy, 4, 4, 10);
      for (let j = -2; j < 6; j++) for (let i = -2; i < 6; i++) { const k = (y + j) * WW + x + i, ob = m.at(x + i, y + j); if (ob) m.remove(ob); til[k] = (j < 1 && i >= 0 && i < 4) ? T.CLIFF : T.SNOW; }
      const cv = m.add('cave_i', x + 1, y + 1, {}); if (cv) cv.to = { map: 'ice' }; m.ret.ice = [x + 2, y + 4]; poi('ice', 'Ледяные пещеры', x + 2, y + 2, 'dungeon'); road(x + 2, y + 5, P(.26, .2)[0], P(.26, .2)[1]);
      for (const [fx, fy] of [[.5, .13], [.7, .17], [.4, .24], [.62, .24]]) { const tp = TPL.frozen, [sx2, sy2] = P(fx, fy), [x2, y2] = spot(sx2, sy2, tp[0].length, tp.length, 8); if (bio[y2 * WW + x2] !== BI.north) continue; stamp(m, 'frozen', x2, y2, { ground: T.SNOW, lore: 7, loot: 't3' }); poi('ruin', 'Замёрзшие руины', x2 + 4, y2 + 3); }
    }
    /* --- Растительность, камни, руды --- */
    const nearWater = (x, y) => { for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const t = m.t(x + i, y + j); if (t === T.WATER || t === T.DEEP) return true; } return false; };
    const pickW = (list, q) => { let tot = 0; for (const e of list) tot += e[1]; let v = q * tot; for (const e of list) { v -= e[1]; if (v <= 0) return e[0]; } return list[0][0]; };
    const SC = {
      [T.GRASS]: { trees: [['oak', 40], ['teal', 12], ['pine', 22], ['tpine', 8], ['birch', 14], ['dead', 4]], fd: .2, od: .012, misc: [['tgrass', 50], ['flower', 12], ['stickg', 14], ['pebble', 11], ['bush', 12], ['berry', 9], ['flog', 4], ['chanter', 2], ['amanita', 1.5], ['rock', 7], ['bigrock', 1], ['coalr', 1.3], ['copperr', 1.3], ['mush', 5], ['herbp', 4], ['fiberp', 5]], md: .14 },
      [T.DGRASS]: { trees: [['doak', 50], ['pine', 32], ['tpine', 14], ['dead', 4]], fd: .3, od: .03, misc: [['tgrass', 30], ['mush', 16], ['herbp', 7], ['berry', 9], ['bush', 12], ['flog', 6], ['chanter', 6], ['amanita', 4], ['rock', 6], ['ironr', 3.5], ['coalr', 3], ['copperr', 2], ['stickg', 14], ['pebble', 8], ['fiberp', 4], ['flower', 5]], md: .1 },
      [T.PINK]: { trees: [['pinkt', 30], ['crim', 16], ['ppine', 50], ['dead', 4]], fd: .26, od: .02, misc: [['pgrass', 50], ['pbush', 12], ['pberry', 6], ['gflower', 9], ['cryst_p', 1.6], ['goldr', 1.4], ['copperr', 2], ['rock', 8], ['herbp', 6], ['mush', 5], ['gmush', 3], ['stickg', 8], ['pebble', 8]], md: .1 },
      [T.RED]: { trees: [['dead', 1]], fd: .012, od: .012, misc: [['cactus', 12], ['dbush', 12], ['dgrass', 28], ['granite', 13], ['ironr', 6], ['coalr', 4], ['goldr', 2], ['copperr', 4], ['spire', 10], ['pebble', 12], ['bones', 3], ['stickg', 6]], md: .085 },
      [T.SNOW]: { trees: [['spine', 1]], fd: .2, od: .015, misc: [['sbush', 14], ['srock', 10], ['icer', 5], ['sironr', 5], ['sgoldr', 3], ['cryst_b', 1.8], ['stickg', 6], ['pebble', 7]], md: .04 },
      [T.SAND]: { trees: [['palm', 1]], fd: .012, od: .012, misc: [['shell', 8], ['lime', 7], ['stickg', 8], ['pebble', 6], ['rock', 3], ['dgrass', 6]], md: .035 }
    };
    for (let y = 3; y < HH - 3; y++) for (let x = 3; x < WW - 3; x++) {
      const k = y * WW + x, t = til[k], sc = SC[t]; if (!sc || m.grid[k] || m.roof[k] || (m.keep && m.keep[k])) continue;
      if (Math.abs(x - sx) < 3 && Math.abs(y - sy) < 3) continue;
      const q = H(x, y, seed + 1), f = fb(x / 9, y / 9, seed + 400, 3), nw = (t !== T.SNOW && t !== T.RED) && nearWater(x, y);
      if (nw && q < .2) { m.add(q < .15 ? 'reed' : 'claypit', x, y, {}); continue; }
      const td2 = f > .56 ? sc.fd : sc.od;
      if (q < td2) { if (til[k + WW] === t || t === T.SAND) m.add(pickW(sc.trees, H(x, y, seed + 2)), x, y, {}); continue; }
      if (q < td2 + sc.md * (f > .56 ? .7 : 1)) { const fl = fb(x / 6, y / 6, seed + 500, 2); let ty = pickW(sc.misc, H(x, y, seed + 3)); if (t === T.GRASS && fl > .68 && H(x, y, seed + 4) < .6) ty = 'flower'; m.add(ty, x, y, {}); }
    }
    /* клады и плавающие ящики */
    for (let i = 0; i < 14; i++) { const x = 20 + Math.floor(r() * (WW - 40)), y = 20 + Math.floor(r() * (HH - 40)), t = m.t(x, y); if ((t === T.SAND || t === T.GRASS || t === T.RED || t === T.SNOW || t === T.PINK) && !m.at(x, y)) m.add('xmark', x, y, {}); }
    m.wset = 'w';
    return m;
  };
  W.waterSet = (m, x, y) => { if (m.id !== 'world') return m.wset; const b = m.biome[y * m.w + x]; return b === BI.pink ? 'tq' : b === BI.north ? 'cold' : b === BI.canyon ? 'can' : 'w'; };

  /* ---------- ПОДЗЕМЕЛЬЯ ---------- */
  W.genDungeon = (id, seed) => {
    const D = G.DUNGEONS[id], [WW, HH] = D.size, m = new GMap(id, WW, HH), til = m.tiles, r = G.rng(seed + id.length * 977 + id.charCodeAt(0) * 31);
    til.fill(T.VOID); m.biome.fill(BI.dungeon); m.dark = 1; m.theme = D.theme; m.wset = D.water; m.dun = D;
    const rooms = [], fits = (x, y, w, h) => { if (x < 3 || y < 3 || x + w > WW - 3 || y + h > HH - 3) return false; for (const o of rooms) if (x < o.x + o.w + 3 && x + w + 3 > o.x && y < o.y + o.h + 3 && y + h + 3 > o.y) return false; return true; };
    const carve = (x, y, w, h) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (m.inb(x + i, y + j)) til[(y + j) * WW + x + i] = T.DFLOOR; };
    /* вход слева внизу, босс — в дальнем углу */
    const entry = { x: 5, y: HH - 13, w: 8, h: 7, kind: 'entry' }; rooms.push(entry);
    const boss = { x: WW - 21, y: 4, w: 15, h: 13, kind: 'boss' }; rooms.push(boss);
    for (let a = 0; a < 600 && rooms.length < D.rooms + 2; a++) { const w = r.int(7, 12), h = r.int(6, 10), x = r.int(3, WW - w - 3), y = r.int(3, HH - h - 3); if (fits(x, y, w, h)) rooms.push({ x, y, w, h, kind: 'room' }); }
    for (const o of rooms) { carve(o.x, o.y, o.w, o.h); o.cx = o.x + (o.w >> 1); o.cy = o.y + (o.h >> 1); }
    /* соединение: минимальное остовное дерево, босс — лист */
    const corr = (a, b, wid) => { let x = a.cx, y = a.cy; const hz = r() < .5; const stepx = () => { while (x !== b.cx) { carve(x, y, wid, wid); x += x < b.cx ? 1 : -1; } }, stepy = () => { while (y !== b.cy) { carve(x, y, wid, wid); y += y < b.cy ? 1 : -1; } }; if (hz) { stepx(); stepy(); } else { stepy(); stepx(); } carve(x, y, wid, wid); };
    const conn = [entry], rest = rooms.filter(o => o.kind === 'room');
    while (rest.length) { let bi = 0, bj = 0, bd = 1e9; for (let i = 0; i < rest.length; i++) for (let j = 0; j < conn.length; j++) { const d = Math.abs(rest[i].cx - conn[j].cx) + Math.abs(rest[i].cy - conn[j].cy); if (d < bd) { bd = d; bi = i; bj = j; } } corr(conn[bj], rest[bi], 2); rest[bi].par = conn[bj]; conn.push(rest.splice(bi, 1)[0]); }
    for (let i = 0; i < 2; i++) { const a = r.pick(conn), b = r.pick(conn); if (a !== b && a.kind === 'room' && b.kind === 'room') corr(a, b, 2); }
    /* вход к боссу: узкий коридор снизу с запертой дверью */
    { let near = null, bd = 1e9; for (const o of conn) { if (o === entry) continue; const d = Math.abs(o.cx - boss.cx) + Math.abs(o.cy - boss.cy); if (d < bd) { bd = d; near = o; } } near = near || entry;
      const dx = boss.cx, dy = boss.y + boss.h; let x = dx, y = dy; for (let i = 0; i < 4; i++) { carve(x, y, 1, 1); y++; } const ante = { cx: x, cy: y }; carve(x - 1, y, 3, 3); corr({ cx: x, cy: y + 1 }, near, 2); m.bossDoor = [dx, dy + 1]; }
    /* стены */
    for (let y = 1; y < HH - 1; y++) for (let x = 1; x < WW - 1; x++) { if (til[y * WW + x] !== T.VOID) continue; let adj = false; for (let j = -1; j <= 1 && !adj; j++) for (let i = -1; i <= 1; i++) if (til[(y + j) * WW + x + i] === T.DFLOOR) { adj = true; break; } if (adj) til[y * WW + x] = T.DWALL; }
    const fl = (x, y) => til[y * WW + x] === T.DFLOOR && !m.grid[y * WW + x];
    const put = (type, x, y, pr) => fl(x, y) ? m.add(type, x, y, pr || {}) : null;
    const rnd = o => [r.int(o.x + 1, o.x + o.w - 2), r.int(o.y + 1, o.y + o.h - 2)];
    /* пристройка за стеной: тайник / кладовая */
    const annex = (o, obj, pr) => {
      const sides = [[0, -1], [1, 0], [0, 1], [-1, 0]];
      for (let a = 0; a < 12; a++) {
        const [dx, dy] = r.pick(sides); let ox, oy;
        if (dx === 0) { ox = r.int(o.x + 2, o.x + o.w - 3); oy = dy < 0 ? o.y - 1 : o.y + o.h; } else { oy = r.int(o.y + 2, o.y + o.h - 3); ox = dx < 0 ? o.x - 1 : o.x + o.w; }
        const cx = ox + dx * 3, cy = oy + dy * 3; let ok = cx > 4 && cy > 4 && cx < WW - 5 && cy < HH - 5 && til[oy * WW + ox] === T.DWALL;
        for (let j = -3; ok && j <= 3; j++) for (let i = -3; ok && i <= 3; i++) { const X = cx + i, Y = cy + j, t = til[Y * WW + X]; if (t === T.DFLOOR && !(Math.abs(X - ox) + Math.abs(Y - oy) <= 3 && (X - ox) * dx + (Y - oy) * dy < 0)) ok = false; }
        if (!ok) continue;
        carve(cx - 1, cy - 1, 3, 3); til[(oy + dy) * WW + ox + dx] = T.DFLOOR; til[oy * WW + ox] = T.DFLOOR;
        for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) { const X = cx + i, Y = cy + j; if (til[Y * WW + X] !== T.VOID) continue; let adj = false; for (let jj = -1; jj <= 1; jj++) for (let ii = -1; ii <= 1; ii++) if (til[(Y + jj) * WW + X + ii] === T.DFLOOR) adj = true; if (adj) til[Y * WW + X] = T.DWALL; }
        const g = m.add(obj, ox, oy, pr || {}); return { cx, cy, g };
      }
      return null;
    };
    const normal = rooms.filter(o => o.kind === 'room');
    /* вход */
    { const s = m.add('stairs_u', entry.cx, entry.cy, {}); s.to = { map: 'world' }; m.entry = [entry.cx, entry.cy + 1]; const b1 = put('brazier', entry.x, entry.y, { open: 1 }), b2 = put('brazier', entry.x + entry.w - 1, entry.y, { open: 1 }); const tb = put('tablet', entry.cx + 2, entry.y, {}); if (tb) tb.lore = { crypt: 2, mines: 6, ice: 7, heart: 11 }[id]; }
    /* босс */
    { m.spawns.push({ type: D.boss, x: boss.cx, y: boss.cy - 1, id: 'boss', boss: true }); for (const [i, j] of [[2, 2], [boss.w - 3, 2], [2, boss.h - 3], [boss.w - 3, boss.h - 3]]) put('dpillar', boss.x + i, boss.y + j); put('brazier', boss.x + 1, boss.y + boss.h - 2, { open: 1 }); put('brazier', boss.x + boss.w - 2, boss.y + boss.h - 2, { open: 1 }); const ch = put('achest', boss.cx, boss.y + 1, { loot: 'boss', sealed: 1 }); put('altar', boss.cx - 2, boss.y + 1); m.add('ldoor', m.bossDoor[0], m.bossDoor[1], { key: 1 }); }
    /* комнаты */
    normal.sort((a, b) => (Math.abs(b.cx - entry.cx) + Math.abs(b.cy - entry.cy)) - (Math.abs(a.cx - entry.cx) + Math.abs(a.cy - entry.cy)));
    const kinds = ['key', 'lever', 'vault', 'mech', 'lake', 'crystal', 'trap', 'treasure', 'lake', 'crystal', 'trap', 'treasure'];
    let leverGate = null;
    normal.forEach((o, n) => {
      const kind = kinds[n % kinds.length]; o.kind2 = kind;
      if (kind === 'key') { const c = put('wchest', o.cx, o.cy, { loot: D.loot, extra: [{ id: 'key', n: 1 }] }); put('dpillar', o.x + 1, o.y + 1); put('dpillar', o.x + o.w - 2, o.y + 1); for (let i = 0; i < 3; i++) { const [x, y] = rnd(o); put('spike', x, y, { ph: i }); } }
      else if (kind === 'vault') { const a = annex(o, 'gate', { link: 'lever' }); if (a) { leverGate = a.g; m.add('achest', a.cx, a.cy, { loot: 't3' }); put('urn', a.cx - 1, a.cy - 1); put('urn', a.cx + 1, a.cy - 1); } }
      else if (kind === 'lever') { put('lever', o.cx, o.y + 1, { link: 'lever' }); put('tablet', o.cx + 2, o.y, { lore: 6 }); }
      else if (kind === 'mech') { const a = annex(o, 'gate', { link: 'mech' }); if (a) { m.add('achest', a.cx, a.cy, { loot: 't3' }); put('mech', o.cx, o.cy, { link: 'mech' }); } }
      else if (kind === 'lake') { const rx = (o.w - 3) / 2, ry = (o.h - 3) / 2; for (let j = 1; j < o.h - 1; j++) for (let i = 1; i < o.w - 1; i++) { const d = Math.hypot((i - o.w / 2 + .5) / rx, (j - o.h / 2 + .5) / ry); if (d < .55) til[(o.y + j) * WW + o.x + i] = T.DEEP; else if (d < .85) til[(o.y + j) * WW + o.x + i] = T.WATER; } for (let i = 0; i < 6; i++) { const [x, y] = rnd(o); put('gmush', x, y); } }
      else if (kind === 'crystal') { for (let i = 0; i < 4; i++) { const [x, y] = rnd(o); put(D.cry, x, y); } if (D.ores) for (let i = 0; i < 4; i++) { const [x, y] = rnd(o); put(r.pick(D.ores), x, y); } for (let i = 0; i < 3; i++) { const [x, y] = rnd(o); put('gmush', x, y); } }
      else if (kind === 'trap') { for (let j = 1; j < o.h - 1; j += 2) for (let i = 1; i < o.w - 1; i++) if ((i + j) % 3) put('spike', o.x + i, o.y + j, { ph: (i + j) % 3 }); put('wchest', o.cx, o.cy, { loot: D.loot }); }
      else { put('wchest', o.cx, o.cy, { loot: D.loot }); for (let i = 0; i < 4; i++) { const [x, y] = rnd(o); put(r.pick(['urn', 'urn', 'crate', 'barrel']), x, y); } }
      if (n % 3 === 0) { const a = annex(o, 'dcracked', { secret: 1 }); if (a) { m.add('achest', a.cx, a.cy, { loot: 't3' }); put('gmush', a.cx - 1, a.cy + 1); } }
      const nm = 1 + (n % 3) + (D.tier > 2 ? 1 : 0);
      for (let i = 0; i < nm; i++) { const [x, y] = rnd(o); if (fl(x, y) && til[y * WW + x] === T.DFLOOR) { let tot = 0; for (const e of D.mobs) tot += e[1]; let v = r() * tot, ty = D.mobs[0][0]; for (const e of D.mobs) { v -= e[1]; if (v <= 0) { ty = e[0]; break; } } m.spawns.push({ type: ty, x, y, id: 'm' + n + '_' + i }); } }
      for (let i = 0; i < 2; i++) { const [x, y] = rnd(o); if (r() < .6) put(r.pick(['bones', 'bones', 'urn', 'gmush']), x, y); }
    });
    /* светильники и мелочь в коридорах */
    for (let i = 0; i < WW * HH / 90; i++) { const x = r.int(2, WW - 3), y = r.int(2, HH - 3); if (!fl(x, y)) continue; let inRoom = false; for (const o of rooms) if (x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.h) inRoom = true; if (inRoom) continue; const q = r(); if (q < .25 && til[(y - 1) * WW + x] === T.DWALL) put('brazier', x, y, { open: 1 }); else if (q < .45) put('gmush', x, y); else if (q < .55) put('bones', x, y); else if (q < .6 && til[(y - 1) * WW + x] === T.DWALL) put(D.cry, x, y); else if (q < .68) m.spawns.push({ type: 'bat', x, y, id: 'c' + i }); }
    return m;
  };

  /* ---------- Комнаты домов ---------- */
  W.genInterior = (id, seed) => {
    const WW = 14, HH = 11, m = new GMap(id, WW, HH), til = m.tiles, r = G.rng(seed + id.length * 131 + id.charCodeAt(2) * 7 + (parseInt(id.split('_')[1]) || 0) * 17 + (parseInt(id.split('_')[2]) || 0) * 3);
    til.fill(T.VOID); m.biome.fill(BI.village); m.indoor = 1; m.theme = '_w'; m.wset = 'w';
    for (let y = 1; y < HH - 1; y++) for (let x = 1; x < WW - 1; x++) til[y * WW + x] = (y < 3 || x < 2 || x > WW - 3 || y > HH - 3) ? T.DWALL : T.WOODF;
    for (let y = 3; y < HH - 2; y++) { til[y * WW + 1] = T.DWALL; }
    const ex = 6, ey = HH - 3; til[ey * WW + ex] = T.WOODF; til[ey * WW + ex + 1] = T.WOODF;
    m.add('exitmat', ex, ey, { to: { map: 'world' } }); m.entry = [ex, ey - 1];
    const work = id.endsWith('_w');
    const put = (t, x, y, pr) => m.add(t, x, y, pr || {});
    put('fireplace', 3, 3); put('shelf', 5, 3, { loot: 'shelf' }); put('shelf', 6, 3, { loot: 'shelf' });
    if (work) { put('workbench', 9, 3); put('furnace', 10, 3); put('crate', 11, 4); put('barrel', 11, 5); put('vtable', 7, 6); }
    else { put('bed', 10, 3, { v: Math.floor(r() * 2) }); put('vtable', 7, 6); put('wchest', 11, 6, { loot: 't1' }); put('barrel', 2 + 1, 7); put('flowerpot', 9, 3); }
    m.add('rug', 7, 5, {}); put('lamp', 2, 5);
    m.ret = {}; return m;
  };

  /* ---------- Biome Manager ---------- */
  W.biomeAt = (m, tx, ty) => m.inb(tx, ty) ? m.biome[ty * m.w + tx] : 0;
})();
