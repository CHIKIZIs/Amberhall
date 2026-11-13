'use strict';
/* Resource Gathering + взаимодействия с миром: сбор, добыча, сундуки, двери, сон, рыбалка, огород, головоломки, события. */
(() => {
  const TS = 16, T = G.T, TD = G.TILE, IT = G.ITEMS, bus = G.bus;
  const Traps = G.Traps = { up(o) { return ((G.R.time + (o.ph || 0) * .9) % 2.7) < 1.1; } };
  const key = (m, o) => o.y * m.w + o.x;
  const tool = () => { const d = G.Inv.selDef(); return d && d.tool ? d.tool.type : null; };
  const front = () => { const p = G.player, a = p.aim; return [Math.floor((p.x + Math.cos(a) * 14) / TS), Math.floor((p.y - 4 + Math.sin(a) * 14) / TS)]; };
  const nearTile = (pred, r) => { const p = G.player, tx = Math.floor(p.x / TS), ty = Math.floor((p.y - 4) / TS); let best = null, bd = 1e9; for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (pred(tx + i, ty + j)) { const d = i * i + j * j; if (d < bd) { bd = d; best = [tx + i, ty + j]; } } return best; };
  const isWater = (x, y) => { const t = G.map.t(x, y); return t === T.WATER || t === T.DEEP; };

  const Act = G.Act = {
    events: { t: 40 },
    /* выпадение ресурсов с бонусами навыков */
    dropList(list, x, y) {
      const yb = G.Prog.rank('yield') * .2;
      for (const d of list) { if (d[3] != null && Math.random() > d[3]) continue; let n = d[1] + Math.floor(Math.random() * (d[2] - d[1] + 1)); if (n > 0 && Math.random() < yb) n++; if (n > 0) G.Ent.drop(d[0], n, x, y); }
      if (Math.random() < G.Prog.rank('rare') * .04) G.Ent.drop(G.pick(['crystal', 'gold_ore', 'gear', 'resin']), 1, x, y);
    },
    harvest(o) {
      const m = G.map, d = G.OBJ[o.t], r = d.res, sz = d.size || [1, 1], x = (o.x + sz[0] / 2) * TS, y = (o.y + sz[1]) * TS - 4;
      o.hp = null; o.hpShow = 0;
      if (d.tree) { G.Audio.sfx('treefall'); treeFall(o, d); setTimeout(() => { if (G.map === m) Act.dropList(r.drops, x + 10, y - 2); }, 420); }
      else { Act.dropList(r.drops, x, y); G.Ent.burst(x, y - 6, ['#a09ca8', '#7c7888', '#c8c6cc', '#6b4530'], 14, 80); G.Audio.sfx(r.tool === 'pick' ? 'rockbreak' : 'break'); }
      if (r.loot) for (const it of G.rollLoot(r.loot)) G.Ent.drop(it.id, it.n, x, y);
      G.Prog.xp(r.xp || 3);
      if (d.secret) { G.UI.toast('Тайный проход!', 'ui_pin'); G.Audio.sfx('secret'); G.Prog.xp(20); }
      if (r.dead && r.respawn) { o.dead = 1; o.last = G.time.total; m.deadList.push(o); }
      else { (m.gone || (m.gone = [])).push(key(m, o)); m.remove(o); }
      bus.emit('harvest', o.t);
    },
    pickup(o) {
      const m = G.map, d = G.OBJ[o.t], pk = d.pick, x = o.x * TS + 8, y = o.y * TS + 12;
      if (pk.loot) for (const it of G.rollLoot(pk.loot)) G.Ent.drop(it.id, it.n, x, y);
      Act.dropList(pk.drops, x, y); G.Prog.xp(pk.xp || 1); G.Audio.sfx('gather');
      G.Ent.burst(x, y - 4, ['#86c84a', '#d0f070', '#ffffff'], 6, 40);
      if (pk.respawn) { o.dead = 1; o.last = G.time.total; m.deadList.push(o); } else { (m.gone || (m.gone = [])).push(key(m, o)); m.remove(o); }
    },
    gather(fn) { const p = G.player; p.state = 'gather'; p.st = 0; p.gatherFn = fn; },
    interact() {
      const p = G.player, o = p.target, m = G.map;
      if (!o) { if (isWater(...front()) || nearTile(isWater, 1)) { p.thirst = Math.min(100, p.thirst + 12); G.Player.hurt(2, null, null, true); G.Audio.sfx('drink'); G.UI.toast('Сырая вода утоляет жажду, но вредна. Вскипятите её во фляге.', 'flask_dirty', null, 1); return; } return; }
      const d = G.OBJ[o.t];
      const face = () => { const a = Math.atan2(o.y * TS + 8 - p.y, o.x * TS + 8 - p.x); p.aim = a; p.dir = Math.abs(Math.cos(a)) > Math.abs(Math.sin(a)) ? (Math.cos(a) < 0 ? 2 : 3) : (Math.sin(a) < 0 ? 1 : 0); };
      face();
      if (d.pick && !o.dead && !d.act) { Act.gather(() => { if (G.map === m && m.objs[o.i - 1] === o && !o.dead) Act.pickup(o); }); return; }
      switch (d.act) {
        case 'chest': {
          if (o.sealed && !o.unsealed) { G.UI.toast('Сундук запечатан силой стража', 'ui_lock', 'bad'); return; }
          if (!o.inv) { o.inv = new Array(20).fill(null); const items = (o.loot ? G.rollLoot(o.loot) : []).concat(o.extra || []); items.forEach((it, i) => { o.inv[i] = G.Inv.mk(it.id, it.n); }); }
          o.open = 1; G.Audio.sfx('chest'); G.UI.openChest(o); bus.emit('open', 'chest'); return; }
        case 'station': G.UI.open('craft', d.station); return;
        case 'door': { if (o.open) { const tx = Math.floor(p.x / TS), ty = Math.floor((p.y - 3) / TS); if (tx === o.x && ty === o.y) return; } o.open = o.open ? 0 : 1; G.Audio.sfx(o.open ? 'dooro' : 'doorc'); return; }
        case 'sleep': {
          p.home = [o.x * TS + 8 + ((d.size || [1])[0] - 1) * 8, (o.y + (d.size || [1, 1])[1]) * TS + 10];
          const c = G.time.clock; if (!(c >= 19 || c < 6)) { G.UI.toast('Точка возрождения сохранена. Спать можно с 19:00', 'ui_zzz'); G.Save.save(); return; }
          if (G.Ent.mobs.some(q => q.aggro && !q.dead && Math.hypot(q.x - p.x, q.y - p.y) < 160)) { G.UI.toast('Нельзя спать, когда рядом враги', null, 'bad'); return; }
          p.state = 'sleep'; p.st = 0; p.sleepDay = G.time.clock >= 19 ? G.time.day + 1 : G.time.day; p.sleptNight = 0; G.UI.sleep(true); bus.emit('use', 'sleep'); G.Save.save(); return; }
        case 'lore': case 'sign': {
          const idx = o.lore != null ? o.lore : 0, L = d.act === 'sign' ? ['Указатель', o.text || ''] : G.LORE[idx % G.LORE.length];
          G.UI.dialog(L[0], L[1]);
          if (d.act === 'lore' && !G.S.lore.includes(idx)) { G.S.lore.push(idx); G.Prog.xp(15); bus.emit('lore'); }
          return; }
        case 'well': {
          if (G.Inv.count('flask')) { G.Inv.remove('flask', 1); G.Inv.give('flask_clean', 1); G.UI.toast('Фляга наполнена чистой водой', 'flask_clean'); }
          else { p.thirst = Math.min(100, p.thirst + 35); G.UI.toast('Вы напились чистой воды', 'ui_water'); }
          G.Audio.sfx('drink'); return; }
        case 'travel': Act.travel(o); return;
        case 'unlock': { if (o.open) return; if (!G.Inv.count('key')) { G.UI.toast('Заперто. Нужен ключ', 'key', 'bad'); return; } G.Inv.remove('key', 1); o.open = 1; G.Audio.sfx('unlock'); G.UI.toast('Дверь открыта', 'key'); return; }
        case 'lever': { o.open = o.open ? 0 : 1; G.Audio.sfx('lever'); for (const g of m.objs) if (g && g.t === 'gate' && g.link === o.link) g.open = o.open; G.UI.toast(o.open ? 'Где-то поднялась решётка' : 'Решётка опустилась', 'ui_pin'); return; }
        case 'mech': { if (o.open) return; if (G.Inv.count('gear') < 2) { G.UI.toast('Механизму не хватает двух шестерней', 'gear', 'bad'); return; } G.Inv.remove('gear', 2); o.open = 1; G.Audio.sfx('mech'); for (const g of m.objs) if (g && g.t === 'gate' && g.link === o.link) g.open = 1; G.UI.toast('Механизм ожил!', 'gear'); G.Prog.xp(40); return; }
        case 'brazier': {
          if (o.open) return; const hasFire = G.Inv.count('torch') || (G.Inv.selDef() && G.Inv.selDef().light); if (!hasFire) { G.UI.toast('Нужен факел, чтобы зажечь', 'torch', 'bad'); return; }
          o.open = 1; G.Audio.sfx('fire');
          if (o.pz && m.puzzle) { const all = m.puzzle.braziers.every(([x, y]) => { const b = m.at(x, y); return b && b.open; }); if (all && !m.puzzleDone) { m.puzzleDone = 1; const [cx, cy] = m.puzzle.chest; const ob = m.at(cx, cy); if (ob && !ob.b) m.remove(ob); const ch = m.add('achest', cx, cy, { loot: 't3', extra: [{ id: 'staff', n: 1 }] }); (m.extra || (m.extra = [])).push({ t: 'achest', x: cx, y: cy, p: { loot: 't3', extra: [{ id: 'staff', n: 1 }] } }); G.UI.banner('Тайник духов открыт', 'В центре святилища появился сундук'); G.Audio.sfx('secret'); G.Prog.xp(80); } }
          return; }
        case 'shrine': { if (o.last && G.time.total - o.last < G.Time.DAY * .5) { G.UI.toast('Святилище молчит. Приходите позже', 'ui_moon'); return; } o.last = G.time.total; p.hp = G.Prog.maxHp(); p.stam = 100; p.buff = 180; G.UI.toast('Благословение: +20% урона на 3 минуты', 'ui_skill'); G.Audio.sfx('levelup'); G.Ent.burst(p.x, p.y - 12, ['#e06af0', '#ffffff', '#ffd23e'], 24, 80); return; }
        case 'hgate': {
          if (!o.open) { const need = ['sigil_forest', 'sigil_stone', 'sigil_frost'], miss = need.filter(s => !G.Inv.count(s)); if (miss.length) { G.UI.dialog('Врата Сердца', 'На вратах три углубления. Не хватает: ' + miss.map(s => IT[s].name).join(', ') + '.'); return; } need.forEach(s => G.Inv.remove(s, 1)); o.open = 1; G.Audio.sfx('secret'); G.UI.banner('Врата открыты', 'Сердце острова ждёт'); return; }
          Act.travel(o); return; }
        case 'tower': { const tx = Math.floor(p.x / TS), ty = Math.floor(p.y / TS), w = m.w, E = G.explored; for (let j = -40; j <= 40; j++) for (let i = -40; i <= 40; i++) { if (i * i + j * j > 1600) continue; const x = tx + i, y = ty + j; if (x < 0 || y < 0 || x >= w || y >= m.h) continue; const k = y * w + x; E[k >> 3] |= 1 << (k & 7); } G.exploredVer++; for (const q of m.pois) if (Math.abs(q.x - tx) < 40 && Math.abs(q.y - ty) < 40) q.found = 1; G.UI.toast('С башни видно всю округу. Карта обновлена', 'ui_map'); G.UI.open('map'); return; }
        case 'search': { if (o.searched) { G.UI.toast('Здесь пусто', null, null, 1); return; } o.searched = 1; Act.gather(() => { for (const it of G.rollLoot(o.loot || d.loot)) G.Inv.give(it.id, it.n); G.Audio.sfx('chest'); }); return; }
        case 'plot': Act.plot(o); return;
      }
    },
    plot(o) {
      const s = G.Inv.sel(), def = s ? IT[s.id] : null;
      if (o.crop) { const cr = G.CROPS[o.crop]; if ((o.g || 0) >= cr.time) { Act.gather(() => { G.Inv.give(cr.out, G.rndi(cr.n[0], cr.n[1]) + (Math.random() < G.Prog.rank('yield') * .2 ? 1 : 0)); if (Math.random() < .55) G.Inv.give('seed_' + o.crop, 1); o.crop = null; o.g = 0; o.wild = 0; G.Prog.xp(8); bus.emit('use', 'harvest'); G.Audio.sfx('gather'); }); return; }
        if (def && def.tool && def.tool.type === 'can') { Act.water(); return; }
        G.UI.toast(cr.name + ': ' + Math.floor((o.g || 0) / cr.time * 100) + '%' + ((o.wet || 0) > G.time.total ? ', полито' : ', нужен полив'), 'seed_' + o.crop, null, 1); return; }
      if (def && def.seed) { if (G.Inv.remove(s.id, 1)) { o.crop = def.seed; o.g = 0; o.wild = 0; G.Audio.sfx('plant'); G.UI.toast('Посажено: ' + G.CROPS[def.seed].name, s.id, null, 1); } return; }
      const anySeed = G.inv.slots.findIndex(x => x && IT[x.id].seed); if (anySeed >= 0) { const sd = G.inv.slots[anySeed]; const crop = IT[sd.id].seed; G.Inv.remove(sd.id, 1); o.crop = crop; o.g = 0; G.Audio.sfx('plant'); G.UI.toast('Посажено: ' + G.CROPS[crop].name, sd.id, null, 1); return; }
      G.UI.toast('Нет семян. Их можно найти в траве и сундуках', 'seed_carrot', 'bad');
    },
    travel(o) {
      const to = o.to && o.to.map; if (!to) return;
      G.UI.fade(() => {
        const from = G.map.id;
        if (to === 'world') { G.setMap('world'); const r = G.maps.world.ret[from]; G.player.x = r[0] * TS + 8; G.player.y = r[1] * TS + 14; }
        else { G.setMap(to); const e = G.map.entry; G.player.x = e[0] * TS + 8; G.player.y = e[1] * TS + 14; if (!G.S.dungeons.includes(to)) { G.S.dungeons.push(to); G.UI.banner(G.DUNGEONS[to].n, 'Подземелье'); G.Prog.xp(50); } }
        G.player.kx = G.player.ky = 0; G.R.follow(G.player.x, G.player.y - 8, 1, true); G.Audio.sfx('stairs'); G.Save.save();
      });
    },
    use() {
      const p = G.player, i = G.inv.sel, s = G.inv.slots[i]; if (!s) { G.UI.toast('Выберите предмет на панели внизу', null, null, 1); return; }
      const it = IT[s.id];
      if (it.flask && s.id === 'flask') { if (nearTile(isWater, 2)) { G.Inv.remove('flask', 1); G.Inv.give('flask_dirty', 1); G.Audio.sfx('drink'); } else G.UI.toast('Подойдите к воде', 'flask', null, 1); return; }
      if (it.tool && it.tool.type === 'can') { Act.water(); return; }
      if (it.food) { if (G.Surv.eat(s)) { s.n--; if (s.n <= 0) G.inv.slots[i] = null; if (it.ret) G.Inv.give(it.ret, 1); bus.emit('inv'); } return; }
      if (it.equip) { G.Inv.equip(i); return; }
      if (it.seed) { const pl = nearTile((x, y) => { const o = G.map.at(x, y); return o && o.t === 'plot' && !o.crop; }, 1); if (pl) { Act.plot(G.map.at(pl[0], pl[1])); return; } G.UI.toast('Подойдите к пустой грядке', s.id, null, 1); return; }
      if (it.place) { G.Build.start(it.place); return; }
      G.UI.toast('Этот предмет нельзя применить', s.id, null, 1);
    },
    water() {
      const s = G.Inv.sel(); if (!s) return;
      if (nearTile(isWater, 2)) { s.d = 8; G.Audio.sfx('drink'); G.UI.toast('Лейка наполнена (8 поливов)', 'watering_can', null, 1); G.bus.emit('inv'); return; }
      const pl = nearTile((x, y) => { const o = G.map.at(x, y); return o && o.t === 'plot'; }, 1); if (!pl) { G.UI.toast('Подойдите к грядке или к воде', 'watering_can', null, 1); return; }
      if (!(s.d > 0)) { G.UI.toast('Лейка пуста. Наполните у воды', 'watering_can', 'bad', 1); return; }
      s.d--; let n = 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const o = G.map.at(pl[0] + i, pl[1] + j); if (o && o.t === 'plot') { o.wet = G.time.total + G.Time.DAY * .6; n++; } }
      G.Ent.burst(pl[0] * TS + 8, pl[1] * TS + 6, ['#6aa2d6', '#b4f4f0'], 10, 40); G.Audio.sfx('water'); G.bus.emit('inv');
    },
    dig() {
      const [x, y] = front(), m = G.map, o = m.at(x, y), t = m.t(x, y), px = x * TS + 8, py = y * TS + 10;
      G.Inv.wear(1);
      if (o && o.t === 'xmark') { m.remove(o); (m.gone || (m.gone = [])).push(y * m.w + x); for (const it of G.rollLoot('treasure')) G.Ent.drop(it.id, it.n, px, py); G.UI.banner('Клад найден!', ''); G.Audio.sfx('secret'); G.Prog.xp(60); bus.emit('use', 'treasure'); return; }
      if (o) { G.UI.toast('Здесь не покопать', null, null, 1); return; }
      if (![T.SAND, T.DIRT, T.GRASS, T.DGRASS, T.PINK, T.RED, T.SNOW].includes(t)) { G.UI.toast('Здесь не покопать', null, null, 1); return; }
      m.dug = m.dug || {}; const k = y * m.w + x; G.Ent.burst(px, py, t === T.SAND ? ['#e2ae78', '#f2c894'] : ['#96503e', '#b8683a'], 8, 50); G.Audio.sfx('dig');
      if (m.dug[k] && G.time.total - m.dug[k] < G.Time.DAY) return; m.dug[k] = G.time.total;
      if (Math.random() < .45) for (const it of G.rollLoot('dig')) G.Ent.drop(it.id, it.n, px, py);
    },
    /* рыбалка */
    fishStart() {
      const p = G.player, a = p.aim; let spot = null;
      for (let d = 18; d <= 46; d += 4) { const x = p.x + Math.cos(a) * d, y = p.y - 6 + Math.sin(a) * d; if (isWater(Math.floor(x / TS), Math.floor(y / TS))) { spot = [x, y]; if (d > 26) break; } }
      if (!spot) { const w = nearTile(isWater, 2); if (w) spot = [w[0] * TS + 8, w[1] * TS + 8]; }
      if (!spot) { G.UI.toast('Встаньте лицом к воде', 'fishing_rod', null, 1); return; }
      p.state = 'fish'; p.st = 0; p.fish = { x: spot[0], y: spot[1], t: 2.5 + Math.random() * 6, bite: 0 }; G.Audio.sfx('cast');
      const a2 = Math.atan2(spot[1] - p.y, spot[0] - p.x); p.dir = Math.abs(Math.cos(a2)) > Math.abs(Math.sin(a2)) ? (Math.cos(a2) < 0 ? 2 : 3) : (Math.sin(a2) < 0 ? 1 : 0);
    },
    fishUpdate(dt) { const f = G.player.fish; if (!f) { G.player.state = 'idle'; return; } f.t -= dt; if (!f.bite && f.t <= 0) { f.bite = 1; f.t = 1.1; G.Audio.sfx('bite'); G.Ent.burst(f.x, f.y, ['#ffffff', '#b4f4f0'], 6, 30); G.UI.toast('Клюёт! Жмите «Атака»!', 'raw_fish', null, 1); } else if (f.bite && f.t <= 0) { f.bite = 0; f.t = 3 + Math.random() * 6; G.UI.toast('Сорвалась...', null, null, 1); } },
    fishPull() { const p = G.player, f = p.fish; if (!f) return; if (f.bite) { const r = Math.random(); if (r < .08) { for (const it of G.rollLoot('flotsam')) G.Ent.drop(it.id, it.n, p.x, p.y - 4); G.UI.toast('Вы выловили сундучок!', 'crate'); } else G.Inv.give('raw_fish', Math.random() < .2 ? 2 : 1); G.Prog.xp(6); G.Audio.sfx('splash'); G.Inv.wear(1); } else G.Audio.sfx('splash'); G.Ent.burst(f.x, f.y, ['#ffffff', '#b4f4f0'], 8, 40); p.state = 'idle'; p.fish = null; },
    damageBuilt(o, dmg) { const d = G.OBJ[o.t], mx = (d.hp || 40) * (1 + G.Prog.rank('sturdy') * .4); if (o.hp == null || o.maxhp !== mx) { o.maxhp = mx; if (o.hp == null) o.hp = mx; } o.hp -= dmg; o.hpShow = 2; o.shake = .2; G.Audio.sfx('thud'); if (o.hp <= 0) { G.map.remove(o); G.Ent.burst(o.x * TS + 8, o.y * TS + 8, ['#b38655', '#a09ca8'], 12, 60); G.UI.toast(d.n + ' разрушен(а)!', null, 'bad'); } },
    bossDown(m) {
      const mp = G.map; for (const o of mp.objs) if (o && o.sealed) o.unsealed = 1;
      if (m.def.boss === 'heart') setTimeout(() => G.UI.ending(), 2500);
    },
    /* мировые процессы: возрождение ресурсов, рост посевов, ловушки, события */
    rt: 0,
    update(dt) {
      const m = G.map, p = G.player; Act.rt -= dt;
      if (Act.rt <= 0) {
        Act.rt = 1; const now = G.time.total, dl = m.deadList;
        for (let i = dl.length - 1; i >= 0; i--) { const o = dl[i]; if (!o.dead || m.objs[o.i - 1] !== o) { dl.splice(i, 1); continue; } const d = G.OBJ[o.t], rs = (d.res || d.pick || {}).respawn || 0; if (rs && now - o.last > rs) { const near = Math.abs(o.x * TS - p.x) < 40 && Math.abs(o.y * TS - p.y) < 40; if (!near) { o.dead = 0; o.hp = null; dl.splice(i, 1); } } }
        const rain = G.Weather.wet() && !m.dark;
        for (const pl of m.plots) { if (!pl.crop || pl.wild) continue; const cr = G.CROPS[pl.crop]; if ((pl.g || 0) >= cr.time) continue; const wet = (pl.wet || 0) > now || (rain && !m.roof[pl.y * m.w + pl.x]); if (rain) pl.wet = Math.max(pl.wet || 0, now + 60); let k = wet ? 1 : .15; if (scare(m, pl)) k *= 1.5; if (p.biome === G.BI.north) k *= .6; pl.g = (pl.g || 0) + k; }
      }
      /* ловушки: шипы под игроком */
      if (!p.dead && p.state !== 'roll') { const o = m.at(Math.floor(p.x / TS), Math.floor((p.y - 3) / TS)); if (o && o.t === 'spike' && Traps.up(o) && p.inv <= 0) { G.Player.hurt(12, p.x, p.y + 10); G.Audio.sfx('spike'); } }
      /* случайные события */
      if (m.id === 'world') { const E = Act.events; E.t -= dt; if (E.t <= 0) { E.t = 90 + Math.random() * 120; randomEvent(); } }
      if (G.flags.bloodmoon && !G.Time.isNight() && G.time.clock > 6 && G.time.clock < 12) { G.flags.bloodmoon = 0; G.UI.toast('Кровавая луна зашла', 'ui_sun'); }
    }
  };
  const scare = (m, pl) => { for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) { const o = m.at(pl.x + i, pl.y + j); if (o && o.t === 'scarecrow') return true; } return false; };
  function treeFall(o, d) {
    const s = G.Art.spr[d.s[o.v % d.s.length]], dir = G.player.x < o.x * TS + 8 ? 1 : -1;
    G.R.addFx({ t: 0, life: .55, y: (o.y + 1) * TS - 3, x: o.x * TS + 8, by: (o.y + 1) * TS, s, dir, draw(c, f, ox, oy) { const k = Math.min(1, f.t / .45), a = k * k * 1.45 * f.dir; c.save(); c.translate(f.x - ox, f.by - oy - 4); c.rotate(a); if (k > .85) c.globalAlpha = (1 - k) / .15 + .2; c.drawImage(f.s.c, -f.s.w / 2, -f.s.h + 4); c.restore(); if (f.t > .42 && !f.dust) { f.dust = 1; G.Ent.burst(f.x + f.dir * 24, f.by - 4, ['#d9d3be', '#86c84a', '#62ae3c'], 18, 70); G.R.cam.shake = 3; } } });
    o.dead = 1; o.last = G.time.total;
  }
  function randomEvent() {
    const p = G.player, m = G.map, r = Math.random(), night = G.Time.isNight();
    if (night && r < .3) {
      for (let a = 0; a < 30; a++) { const x = Math.floor(p.x / TS + (Math.random() - .5) * 60), y = Math.floor(p.y / TS + (Math.random() - .5) * 40); if (m.inb(x, y) && TD[m.t(x, y)].pass === 1 && !m.at(x, y) && Math.hypot(x - p.x / TS, y - p.y / TS) > 10) { m.add('meteor', x, y, {}); (m.extra || (m.extra = [])).push({ t: 'meteor', x, y }); G.R.cam.shake = 5; G.Audio.sfx('thunder'); G.UI.toast('С неба упал метеорит! Он где-то рядом', 'star_ore'); G.Ent.burst(x * TS + 8, y * TS + 8, ['#a583f5', '#ffffff', '#ff8a24'], 30, 120); return; } }
    } else if (night && r < .42 && G.S.lvl >= 4 && !G.flags.bloodmoon) { G.flags.bloodmoon = 1; G.UI.banner('Кровавая луна', 'Этой ночью чудовища яростнее'); G.Audio.sfx('boss'); }
    else if (r < .7) {
      for (let a = 0; a < 40; a++) { const x = Math.floor(p.x / TS + (Math.random() - .5) * 50), y = Math.floor(p.y / TS + (Math.random() - .5) * 34); if (m.inb(x, y) && m.t(x, y) === T.WATER && !m.at(x, y)) { let shore = false; for (const [i, j] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (TD[m.t(x + i, y + j)].pass === 1) shore = true; if (!shore) continue; m.add('flotsam', x, y, {}); return; } }
    } else if (r < .85) { const b = G.BIOMES[p.biome]; if (b && b.animals) for (let i = 0; i < 3; i++) { const a = Math.random() * 6.283, x = p.x + Math.cos(a) * 200, y = p.y + Math.sin(a) * 140; if (!G.Ent.blocked(m, x, y - 3, 4, 3)) G.Ent.spawnMob('deer', x, y); } }
  }
})();
