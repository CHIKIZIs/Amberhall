'use strict';
/* Точка входа: состояние игры, новая игра/продолжение, переходы между картами, игровой цикл, автосохранение. */
(() => {
  const TS = 16, bus = G.bus;
  G.settings = { music: .55, sfx: .8, zoom: 0, fx: 1, fps: false };
  G.time = { total: 0, clock: 8, day: 0 }; G.flags = {}; G.maps = {}; G.dexp = {}; G.exploredVer = 0; G.running = false; G.paused = false;

  G.applySettings = () => {
    const S = G.settings; if (G.R.cv) G.R.setZoom(S.zoom); G.Audio.vol();
    const k = G.$('keys'); if (k) k.style.display = S.keys === false ? 'none' : '';
    let f = G.$('fps'); if (S.fps && !f) { f = G.el('div'); f.id = 'fps'; document.body.appendChild(f); } else if (!S.fps && f) f.remove();
  };
  const uiScale = () => { const u = G.clamp(Math.min(innerHeight / 380, innerWidth / 680), 1.3, 3.2); document.documentElement.style.setProperty('--u', u.toFixed(2) + 'px'); };

  /* ---------- карты ---------- */
  G.getMap = id => {
    let m = G.maps[id]; if (m) return m;
    m = id === 'world' ? G.World.genWorld(G.S.seed) : id.startsWith('h_') ? G.World.genInterior(id, G.S.seed) : G.World.genDungeon(id, G.S.seed);
    G.Save.applyMap(m, G.S.maps && G.S.maps[id]);
    if (id !== 'world' && !G.dexp[id]) G.dexp[id] = G.S.dexp && G.S.dexp[id] ? G.Save.unb64(G.S.dexp[id], (m.w * m.h + 7) >> 3) : new Uint8Array((m.w * m.h + 7) >> 3);
    return G.maps[id] = m;
  };
  G.setMap = id => {
    const old = G.map; if (old) old.sdrops = G.Ent.packDrops();
    const m = G.getMap(id); G.map = m; G.Ent.reset();
    for (const d of m.sdrops || []) G.Ent.drops.push({ id: d.id, n: d.n, x: d.x, y: d.y, vx: 0, vy: 0, z: 0, vz: 0, t: 1, o: d.o || null });
    m.sdrops = []; if (G.player) G.player.biome = 0; bus.emit('map', m); G.UI.mapDirty();
  };

  /* ---------- новая игра / загрузка ---------- */
  function freshState(seed, name, seedText) { return { seed, name: name || 'Мой остров', seedText: seedText == null ? String(seed) : seedText, lvl: 1, xp: 0, sp: 0, skills: {}, quests: { active: {}, done: [] }, biomes: ['green'], lore: [], dungeons: [], marks: [], maps: {}, dexp: {} }; }
  G.startGame = (isNew, opts) => {
    G.$('loading').style.display = 'flex'; G.$('loading').textContent = 'Создание мира...';
    setTimeout(() => {
      G.maps = {}; G.dexp = {}; G.map = null;
      let S = !isNew && G.Save.load();
      if (!S) { G.Save.clear(); opts = opts || {}; const sd = G.seedOf(opts.seed); S = freshState(sd, opts.name, opts.seed ? String(opts.seed).trim() : String(sd)); isNew = true; }
      S.marks = S.marks || []; S.dexp = S.dexp || {};
      G.S = S; G.time = { total: S.time || 0, clock: 8, day: 0 }; G.Time.update(0); G.flags = S.flags || {};
      G.inv = S.inv || { slots: new Array(40).fill(null), eq: { head: null, body: null, hands: null, feet: null, back: null }, sel: 0 };
      if (G.inv.slots.length < 40) G.inv.slots.length = 40; for (let i = 0; i < 40; i++) if (G.inv.slots[i] === undefined) G.inv.slots[i] = null;
      const w = G.getMap('world'); G.explored = S.explored ? G.Save.unb64(S.explored, (w.w * w.h + 7) >> 3) : new Uint8Array((w.w * w.h + 7) >> 3);
      const P = S.p, mid = P && P.map ? P.map : 'world';
      G.player = G.Player.create(w.start[0] * TS + 8, w.start[1] * TS + 10);
      G.setMap(mid);
      if (P) Object.assign(G.player, { x: P.x, y: P.y, hp: P.hp, hunger: P.hunger, thirst: P.thirst, stam: P.stam, temp: P.temp, home: P.home || null });
      if (S.weather) G.Weather.set(S.weather[0], S.weather[1]); else G.Weather.set('clear', 200);
      G.Craft.queue.length = 0;
      G.$('loading').style.display = 'none'; G.UI.close(); G.$('layer').innerHTML = ''; G.menuOpen = false; G.$('hud').classList.remove('hidden');
      G.UI.init(); G.applySettings(); G.R.follow(G.player.x, G.player.y - 8, 1, true);
      G.running = true; G.paused = false; G.player.sense && G.Player.sense();
      if (isNew) {
        G.Inv.add('berries', 3, true);
        G.paused = true; G.UI.intro(() => { G.paused = false; G.Quest.start('s1'); G.UI.banner(G.S.name, 'Сид: ' + G.S.seedText); G.Save.save(); });
      } else G.UI.toast('С возвращением! День ' + (G.time.day + 1), 'ui_sun');
      lastSave = performance.now();
    }, 60);
  };
  G.toMenu = () => { G.running = false; G.Build.exit(); G.UI.sleep(false); G.UI.menu(); };

  /* ---------- цикл ---------- */
  let last = performance.now(), lastSave = 0, acc = 0, frames = 0, fpsT = 0, dexpT = 0, menuT = 0;
  function loop(t) {
    requestAnimationFrame(loop);
    let dt = (t - last) / 1000; last = t; if (dt > .05) dt = .05; if (dt <= 0) return;
    frames++; fpsT += dt; if (fpsT >= 1) { const f = G.$('fps'); if (f) f.textContent = frames + ' FPS'; frames = 0; fpsT = 0; }
    if (!G.map) return;
    if (G.running) {
      G.Input.update();
      if (!G.paused) {
        G.Time.update(dt); G.Weather.update(dt); G.Ent.update(dt); G.Surv.update(dt); G.Craft.update(dt); G.Build.update(); G.Audio.update(dt);
        dexpT -= dt; if (dexpT <= 0 && G.map.id !== 'world') { dexpT = .3; const E = G.dexp[G.map.id], m = G.map, tx = Math.floor(G.player.x / TS), ty = Math.floor(G.player.y / TS); for (let j = -7; j <= 7; j++) for (let i = -9; i <= 9; i++) { const x = tx + i, y = ty + j; if (!m.inb(x, y)) continue; const k = y * m.w + x; E[k >> 3] |= 1 << (k & 7); } G.exploredVer++; }
        if (t - lastSave > 60000) { lastSave = t; G.saveNow(); }
      }
      const p = G.player; G.R.follow(p.x, p.y - 10, dt);
      G.R.draw(G.paused ? 0 : dt); G.UI.update(dt);
    } else {
      /* фон меню: камера медленно летит над островом */
      menuT += dt; const m = G.map, cx = m.w * TS * (.5 + Math.sin(menuT * .03) * .25), cy = m.h * TS * (.7 + Math.cos(menuT * .025) * .12);
      G.Time.update(0); G.R.follow(cx, cy, 1, true); G.R.draw(dt);
    }
  }
  G.saveNow = () => { if (G.running) { G.S.dexp = {}; for (const k in G.dexp) { let s = ''; const u = G.dexp[k]; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode.apply(null, u.subarray(i, i + 8192)); G.S.dexp[k] = btoa(s); } G.Save.save(); } };

  /* ---------- запуск ---------- */
  addEventListener('load', () => {
    uiScale(); G.Save.loadSettings();
    G.Art.init(); G.R.init(G.$('game')); G.Input.init();
    G.S = freshState(20261113); G.map = G.World.genWorld(G.S.seed); G.time = { total: 300, clock: 8, day: 0 }; G.Time.update(0); G.Weather.set('clear', 999);
    G.Quest.init();
    /* пиксельный прицел вместо системного курсора */
    { const c = document.createElement('canvas'); c.width = c.height = 22; const x = c.getContext('2d'), O = '#0d0b1a', W = '#f6eedc';
      const plus = (col, w) => { x.fillStyle = col; for (const [a, b, cw, ch] of [[10 - w, 1 - w, 2 + w * 2, 6 + w * 2], [10 - w, 15 - w, 2 + w * 2, 6 + w * 2], [1 - w, 10 - w, 6 + w * 2, 2 + w * 2], [15 - w, 10 - w, 6 + w * 2, 2 + w * 2], [10 - w, 10 - w, 2 + w * 2, 2 + w * 2]]) x.fillRect(a, b, cw, ch); };
      plus(O, 1); plus(W, 0); document.documentElement.style.setProperty('--cur', 'url(' + c.toDataURL() + ') 11 11, crosshair'); }
    G.$('loading').style.display = 'none'; G.applySettings(); G.UI.menu();
    requestAnimationFrame(loop);
    bus.on('build', () => { clearTimeout(G._bs); G._bs = setTimeout(G.saveNow, 1500); });
    bus.on('quest', () => { clearTimeout(G._qs); G._qs = setTimeout(G.saveNow, 800); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) G.saveNow(); });
    addEventListener('pagehide', G.saveNow);
    addEventListener('resize', () => { uiScale(); G.R.resize(); });
    addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('gesturestart', e => e.preventDefault());
  });
})();
