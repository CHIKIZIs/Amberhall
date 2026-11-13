'use strict';
/* Системы: Day Night, Weather, Inventory, Progression, Survival, Crafting, Quests, Save. */
(() => {
  const IT = G.ITEMS, bus = G.bus;

  /* ================= DAY NIGHT SYSTEM ================= */
  const DAY = 1320; // секунд реального времени на игровые сутки (22 минуты)
  const KEYS = [[0, 58, 68, 132], [4.6, 58, 68, 132], [6, 214, 158, 150], [7.5, 255, 238, 222], [9, 255, 255, 255], [16.5, 255, 255, 255], [18.5, 255, 196, 142], [20, 150, 112, 152], [21.5, 58, 68, 132], [24, 58, 68, 132]];
  const Time = G.Time = {
    DAY,
    update(dt) { const t = G.time; t.total += dt; t.clock = (8 + t.total / DAY * 24) % 24; const d = Math.floor((8 + t.total / DAY * 24) / 24); if (d !== t.day) { t.day = d; bus.emit('newday', d); } },
    isNight() { const c = G.time.clock; return c >= 20.5 || c < 5; },
    phase() { const c = G.time.clock; return c < 5 ? 'Ночь' : c < 7 ? 'Рассвет' : c < 11 ? 'Утро' : c < 17 ? 'День' : c < 20 ? 'Закат' : 'Ночь'; },
    light() { const a = Time.sky(); return (a[0] + a[1] + a[2]) / 765; },
    sky() { const c = G.time.clock; let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] <= c) i++; const a = KEYS[i], b = KEYS[i + 1], t = (c - a[0]) / (b[0] - a[0]); return [a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t]; },
    ambient() {
      if (G.map.dark) return [50, 42, 76];
      if (G.map.indoor) return [236, 218, 200];
      const s = Time.sky(), w = G.Weather.dim(); let r = s[0] * w, g = s[1] * w, b = s[2] * (w + (1 - w) * .4);
      if (G.flags.bloodmoon && Time.isNight()) { r = Math.min(255, r * 1.5 + 20); g *= .8; b *= .8; }
      return [Math.round(r), Math.round(g), Math.round(b)];
    },
    clockStr() { const c = G.time.clock, h = Math.floor(c), m = Math.floor((c - h) * 6) * 10; return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m; },
    skip(hours) { G.time.total += hours / 24 * DAY; Time.update(0); }
  };

  /* ================= WEATHER SYSTEM ================= */
  const WN = { clear: 'Ясно', cloudy: 'Облачно', rain: 'Дождь', heavy: 'Ливень', fog: 'Туман', storm: 'Гроза', snow: 'Снег' };
  const drops = [];
  const Weather = G.Weather = {
    type: 'clear', t: 150, wind: 1, flash: 0, k: 0, thunder: 0,
    name() { return WN[Weather.shown()]; },
    /* то, что видит игрок: в снегах дождь превращается в снег, в каньоне — в облачность */
    shown() { const b = G.player ? G.player.biome : 1, t = Weather.type; if (G.map.dark || G.map.indoor) return 'clear'; if (b === G.BI.north) return (t === 'clear' || t === 'fog') ? (t === 'clear' && G.hash(G.time.day, 3, 1) < .5 ? 'snow' : t) : 'snow'; if (b === G.BI.canyon && (t === 'rain' || t === 'heavy' || t === 'storm')) return 'cloudy'; return t; },
    icon() { return { clear: G.Time.isNight() ? 'ui_moon' : 'ui_sun', cloudy: 'ui_cloud', rain: 'ui_rain', heavy: 'ui_rain', fog: 'ui_fog', storm: 'ui_storm', snow: 'ui_snow' }[Weather.shown()]; },
    wet() { const s = Weather.shown(); return s === 'rain' || s === 'heavy' || s === 'storm'; },
    dim() { const s = Weather.shown(); return 1 - Weather.k * ({ clear: 0, cloudy: .08, rain: .18, heavy: .3, fog: .1, storm: .36, snow: .1 }[s] || 0); },
    set(t, dur) { Weather.type = t; Weather.t = dur || G.rnd(110, 260); Weather.k = 0; bus.emit('weather', t); },
    update(dt) {
      Weather.t -= dt; Weather.k = Math.min(1, Weather.k + dt * .2);
      if (Weather.t <= 0) { const r = Math.random(); Weather.set(r < .42 ? 'clear' : r < .62 ? 'cloudy' : r < .78 ? 'rain' : r < .86 ? 'heavy' : r < .93 ? 'fog' : 'storm'); }
      const s = Weather.shown(); Weather.wind = s === 'storm' ? 2.2 : s === 'heavy' ? 1.7 : s === 'rain' || s === 'snow' ? 1.3 : 1;
      if (Weather.flash > 0) Weather.flash -= dt * 2.2;
      if (s === 'storm') { Weather.thunder -= dt; if (Weather.thunder <= 0) { Weather.thunder = G.rnd(5, 14); Weather.flash = .8; G.Audio.sfx('thunder'); } }
    },
    draw(c, R, dt) {
      const s = Weather.shown(), W = R.vw, H = R.vh;
      const want = s === 'rain' ? 70 : s === 'heavy' ? 150 : s === 'storm' ? 190 : s === 'snow' ? 80 : 0, q = (G.settings.fx || 1);
      while (drops.length < want * q) drops.push({ x: Math.random() * (W + 60), y: Math.random() * H, v: G.rnd(.8, 1.2) });
      if (drops.length > want * q) drops.length = Math.floor(want * q);
      if (s === 'snow') { c.fillStyle = '#ffffff'; for (const d of drops) { d.y += 26 * d.v * dt; d.x += Math.sin(R.time * 2 + d.v * 40) * 12 * dt - 8 * dt; if (d.y > H) { d.y = -2; d.x = Math.random() * (W + 60); } c.fillRect(d.x | 0, d.y | 0, d.v > 1 ? 2 : 1, d.v > 1 ? 2 : 1); } }
      else if (want) { c.fillStyle = 'rgba(190,225,255,.75)'; for (const d of drops) { d.y += 300 * d.v * dt; d.x -= 90 * d.v * dt; if (d.y > H) { d.y = -6; d.x = Math.random() * (W + 60); } c.fillRect(d.x | 0, d.y | 0, 1, 3); c.fillRect((d.x | 0) + 1, (d.y | 0) - 2, 1, 2); } }
      if (s === 'fog') { const A = G.Art.spr.cloud, k = Weather.k; c.globalAlpha = .5 * k; for (let i = 0; i < 6; i++) { const x = ((i * 137 + R.time * (6 + i)) % (W + 200)) - 100, y = (i * 61) % H - 20; c.drawImage(A.c, 0, 0, 96, 56, x, y, 192, 112); } c.globalAlpha = 1; c.fillStyle = 'rgba(214,226,238,' + (.26 * k) + ')'; c.fillRect(0, 0, W, H); }
      else if (!G.map.dark && (s === 'clear' || s === 'cloudy') && !Time.isNight()) { const A = G.Art.spr.cloud; for (let i = 0; i < (s === 'cloudy' ? 5 : 2); i++) { const wx = (i * 517 + R.time * 9) % 1400 - 200, wy = (i * 311) % 900; const x = ((wx - R.cam.sx * .9) % 1400 + 1400) % 1400 - 200, y = ((wy - R.cam.sy * .9) % 900 + 900) % 900 - 120; c.drawImage(A.c, 0, 0, 96, 56, x | 0, y | 0, 192, 112); } }
    }
  };

  /* ================= INVENTORY SYSTEM ================= */
  const Inv = G.Inv = {
    BASE: 24, HOT: 8,
    size() { const b = G.inv.eq.back; return Inv.BASE + (b ? IT[b.id].equip.slots : 0); },
    mk(id, n) { const it = IT[id], o = { id, n: n || 1 }; if (it.dur) o.d = it.dur; if (it.charges) o.d = 0; return o; },
    count(id) { let n = 0; for (const s of G.inv.slots) if (s && s.id === id) n += s.n; return n; },
    has(obj, mul) { for (const k in obj) if (Inv.count(k) < Math.ceil(obj[k] * (mul || 1))) return false; return true; },
    /* добавляет предметы; возвращает количество, которое не поместилось */
    add(id, n, silent) {
      const it = IT[id]; if (!it) return 0; const sl = G.inv.slots, sz = Inv.size(); let left = n, st = it.stack;
      if (st > 1) for (let i = 0; i < sz && left > 0; i++) { const s = sl[i]; if (s && s.id === id && s.n < st) { const a = Math.min(left, st - s.n); s.n += a; left -= a; } }
      for (let i = 0; i < sz && left > 0; i++) if (!sl[i]) { const a = Math.min(left, st); sl[i] = Inv.mk(id, a); left -= a; }
      const got = n - left;
      if (got > 0) { bus.emit('inv'); bus.emit('item', { id, n: got }); if (!silent) G.UI.pickup(id, got); }
      return left;
    },
    addItem(o) { const sl = G.inv.slots, sz = Inv.size(); if (IT[o.id].stack > 1) return Inv.add(o.id, o.n, 1) === 0; for (let i = 0; i < sz; i++) if (!sl[i]) { sl[i] = o; bus.emit('inv'); return true; } return false; },
    give(id, n) { const left = Inv.add(id, n); if (left > 0 && G.player) G.Ent.drop(id, left, G.player.x, G.player.y); },
    remove(id, n) { const sl = G.inv.slots; for (let i = sl.length - 1; i >= 0 && n > 0; i--) { const s = sl[i]; if (s && s.id === id) { const a = Math.min(n, s.n); s.n -= a; n -= a; if (s.n <= 0) sl[i] = null; } } bus.emit('inv'); return n === 0; },
    take(obj, mul) { for (const k in obj) Inv.remove(k, Math.ceil(obj[k] * (mul || 1))); },
    sel() { return G.inv.slots[G.inv.sel] || null; },
    selDef() { const s = Inv.sel(); return s ? IT[s.id] : null; },
    /* перенос между двумя списками ячеек (инвентарь/сундук): слияние стопок или обмен */
    move(A, i, B, j) {
      const a = A[i], b = B[j]; if (!a || (A === B && i === j)) return;
      if (b && b.id === a.id && IT[a.id].stack > 1) { const m = Math.min(a.n, IT[a.id].stack - b.n); b.n += m; a.n -= m; if (a.n <= 0) A[i] = null; }
      else { A[i] = b || null; B[j] = a; }
      bus.emit('inv');
    },
    split(A, i) { const a = A[i]; if (!a || a.n < 2) return false; const sz = A === G.inv.slots ? Inv.size() : A.length; for (let k = 0; k < sz; k++) if (!A[k]) { const h = Math.floor(a.n / 2); A[k] = { id: a.id, n: h }; a.n -= h; bus.emit('inv'); return true; } return false; },
    dropSlot(i, all) { const s = G.inv.slots[i]; if (!s) return; const n = all ? s.n : 1, p = G.player; if (IT[s.id].stack === 1) { G.Ent.drop(s.id, 1, p.x, p.y, s); G.inv.slots[i] = null; } else { G.Ent.drop(s.id, n, p.x, p.y); s.n -= n; if (s.n <= 0) G.inv.slots[i] = null; } bus.emit('inv'); G.Audio.sfx('drop'); },
    equip(i) {
      const s = G.inv.slots[i]; if (!s) return; const e = IT[s.id].equip; if (!e) return;
      const old = G.inv.eq[e.slot];
      if (e.slot === 'back' && old) { const lose = IT[old.id].equip.slots - e.slots; if (lose > 0) { const sz = Inv.size(); for (let k = sz - lose; k < sz; k++) if (G.inv.slots[k] && k !== i) { G.UI.toast('Сначала освободите ячейки рюкзака'); return; } } }
      G.inv.eq[e.slot] = s; G.inv.slots[i] = old || null; bus.emit('inv'); bus.emit('equip', s.id); G.Audio.sfx('equip');
    },
    unequip(slot) {
      const s = G.inv.eq[slot]; if (!s) return;
      if (slot === 'back') { const sz = Inv.size(), lose = IT[s.id].equip.slots; for (let k = sz - lose; k < sz; k++) if (G.inv.slots[k]) { G.UI.toast('Сначала освободите ячейки рюкзака'); return; } }
      G.inv.eq[slot] = null; if (!Inv.addItem(s)) { G.inv.eq[slot] = s; G.UI.toast('Нет места в инвентаре'); return; } bus.emit('inv'); bus.emit('equip', null); G.Audio.sfx('equip');
    },
    armor() { let a = 0; for (const k in G.inv.eq) { const s = G.inv.eq[k]; if (s) a += IT[s.id].equip.armor || 0; } return a; },
    warm() { let a = 0; for (const k in G.inv.eq) { const s = G.inv.eq[k]; if (s) a += IT[s.id].equip.warm || 0; } return a; },
    bonus(key) { let a = 0; for (const k in G.inv.eq) { const s = G.inv.eq[k]; if (s) a += IT[s.id].equip[key] || 0; } return a; },
    /* износ выбранного предмета */
    wear(n) { const s = Inv.sel(); if (!s || s.d == null || IT[s.id].charges) return; if (Math.random() < Prog.rank('dur') * .2) return; s.d -= n || 1; if (s.d <= 0) { G.inv.slots[G.inv.sel] = null; G.UI.toast(IT[s.id].name + ': сломано', s.id); G.Audio.sfx('break'); } bus.emit('inv'); }
  };

  /* ================= PROGRESSION ================= */
  const Prog = G.Prog = {
    need(l) { return 40 + l * 35; },
    rank(id) { return (G.S.skills[id] || 0); },
    xp(n) {
      if (!n) return; const S = G.S; S.xp += Math.round(n);
      while (S.xp >= Prog.need(S.lvl)) { S.xp -= Prog.need(S.lvl); S.lvl++; S.sp++; G.player.hp = Prog.maxHp(); G.UI.banner('Уровень ' + S.lvl, 'Получено очко навыка'); G.Audio.sfx('levelup'); bus.emit('level', S.lvl); }
      bus.emit('xp');
    },
    maxHp() { return 100 + Prog.rank('hp') * 20; },
    learn(id) { for (const br of G.SKILLS) for (const s of br.l) if (s.id === id) { const r = Prog.rank(id); if (r >= s.max || G.S.sp < 1) return false; G.S.skills[id] = r + 1; G.S.sp--; if (id === 'hp') G.player.hp += 20; bus.emit('skill', id); G.Audio.sfx('levelup'); return true; } return false; }
  };

  /* ================= SURVIVAL SYSTEM ================= */
  const Surv = G.Surv = {
    acc: 0, warn: 0,
    /* температура окружения в условных градусах 0..100 (50 — комфорт) */
    ambient() {
      const p = G.player, m = G.map; let t = m.indoor ? 58 : m.dun ? m.dun.temp : G.BIOMES[p.biome].temp;
      if (!m.dark && !m.indoor) { const l = Time.light(); if (p.biome === G.BI.canyon) t += (l - .7) * 40; else t += (l - .8) * 22; const s = Weather.shown(); if (s === 'rain') t -= 6; if (s === 'heavy' || s === 'storm') t -= 10; if (s === 'snow') t -= 8; if (s === 'fog') t -= 3; }
      if (p.wade) t -= 8;
      if (p.nearFire) t = Math.max(t, 50) + (t < 50 ? 6 : 0);
      if (p.underRoof) t += t < 50 ? 8 : 0;
      return t;
    },
    update(dt) {
      const p = G.player; if (p.dead) return;
      const hungerK = 1 - Prog.rank('hunger') * .12, thirstK = 1 - Prog.rank('thirst') * .12, run = p.state === 'run' ? 1.6 : 1, sleep = p.state === 'sleep' ? .35 : 1;
      p.hunger = Math.max(0, p.hunger - dt * .118 * hungerK * run * sleep);
      const hot = p.temp > 78 ? 1.9 : 1;
      p.thirst = Math.max(0, p.thirst - dt * .158 * thirstK * run * sleep * hot);
      /* температура тела тянется к окружению с поправкой на одежду */
      const amb = Surv.ambient(), warm = Inv.warm(), res = 1 - Prog.rank('warm') * .15;
      let target = amb; if (amb < 50) target = Math.min(50, amb + warm * .95); else if (amb > 60) target = 50 + (amb - 50) * (1 + warm * .004) * res;
      if (target < 50) target = 50 - (50 - target) * res;
      if (p.warmBuff > 0) { p.warmBuff -= dt; target = Math.max(target, Math.min(50, target + 22)); }
      p.temp += (target - p.temp) * Math.min(1, dt * .09);
      /* выносливость */
      if (p.stamCd > 0) p.stamCd -= dt; else { let rg = 15 * (1 + Prog.rank('stamina') * .2); if (p.hunger < 20 || p.thirst < 20) rg *= .5; if (p.temp < 28) rg *= .6; p.stam = Math.min(100, p.stam + rg * dt); }
      /* урон от истощения */
      Surv.acc += dt;
      if (Surv.acc >= 2) {
        Surv.acc = 0; let dmg = 0, why = '';
        if (p.hunger <= 0) { dmg += 2; why = 'Вы голодаете'; } if (p.thirst <= 0) { dmg += 3; why = 'Вы умираете от жажды'; }
        if (p.temp < 16) { dmg += p.temp < 8 ? 4 : 2; why = 'Вы замерзаете'; } if (p.temp > 90) { dmg += 2; why = 'Слишком жарко'; }
        if (dmg) { G.Player.hurt(dmg, null, null, true); Surv.warn -= 2; if (Surv.warn <= 0) { Surv.warn = 12; G.UI.toast(why + '!', null, 'bad'); } }
        else if (p.hunger > 55 && p.thirst > 55 && p.hp < Prog.maxHp()) p.hp = Math.min(Prog.maxHp(), p.hp + (p.state === 'sleep' ? 4 : p.nearFire ? 1.2 : .6));
      }
    },
    eat(s) {
      const it = IT[s.id], f = it.food, p = G.player; if (!f) return false;
      if (f.hunger) p.hunger = G.clamp(p.hunger + f.hunger, 0, 100); if (f.thirst) p.thirst = G.clamp(p.thirst + f.thirst, 0, 100);
      if (f.hp) { if (f.hp < 0) { G.Player.hurt(-f.hp, null, null, true); G.UI.toast('Сырая пища вредит здоровью', null, 'bad'); } else { p.hp = Math.min(Prog.maxHp(), p.hp + f.hp); G.R.text(p.x, p.y - 26, '+' + f.hp, '#86c84a'); } }
      if (f.stamina) p.stam = Math.min(100, p.stam + f.stamina); if (f.warm) p.warmBuff = 180;
      G.Audio.sfx(f.thirst > (f.hunger || 0) ? 'drink' : 'eat'); bus.emit('eat', s.id); return true;
    }
  };

  /* ================= CRAFTING SYSTEM ================= */
  const Craft = G.Craft = {
    queue: [], near: { hand: 1 }, nt: 0,
    scan() { const p = G.player, m = G.map, tx = Math.floor(p.x / 16), ty = Math.floor(p.y / 16), n = { hand: 1 }; for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) { const o = m.at(tx + i, ty + j); if (o) { const st = G.OBJ[o.t].station; if (st && !o.out) { n[st] = 1; if (st === 'kitchen') n.campfire = 1; } } } Craft.near = n; return n; },
    mul(r) { return 1; },
    check(r) { const st = !!Craft.near[r.st], mats = Inv.has(r.in), skill = !r.skill || Prog.rank('unlock') >= r.skill; return { ok: st && mats && skill, st, mats, skill }; },
    start(r, times) {
      times = times || 1; let made = 0;
      for (let i = 0; i < times; i++) { if (Craft.queue.length >= 6) { G.UI.toast('Очередь заполнена'); break; } if (!Craft.check(r).ok) break; Inv.take(r.in); Craft.queue.push({ r, t: 0 }); made++; }
      if (made) { G.Audio.sfx('craft'); bus.emit('craftq'); } return made;
    },
    busy(st) { return Craft.queue.length > 0 && Craft.queue[0].r.st === st; },
    update(dt) {
      Craft.nt -= dt; if (Craft.nt <= 0) { Craft.nt = .5; Craft.scan(); }
      const q = Craft.queue; if (!q.length) return; const c = q[0]; c.t += dt;
      if (c.t >= c.r.time) { q.shift(); const r = c.r; Inv.give(r.out, r.n); if (r.ret) for (const k in r.ret) Inv.give(k, r.ret[k]); Prog.xp(4 + Math.round(r.time * 2)); bus.emit('craft', { id: r.out, n: r.n }); bus.emit('craftq'); G.Audio.sfx('craftdone'); }
    }
  };

  /* ================= QUEST SYSTEM ================= */
  const Quest = G.Quest = {
    def(id) { return G.QUESTS.find(q => q.id === id); },
    start(id) { const S = G.S.quests; if (S.active[id] || S.done.includes(id)) return; const q = Quest.def(id); if (!q) return; S.active[id] = q.goals.map(() => 0); G.UI.toast('Новое задание: ' + q.n, 'ui_quest'); bus.emit('quest'); },
    match(g, id) { if (!g.id) return true; if (g.id === id) return true; const grp = G.QGROUPS[g.id]; if (grp) return grp.includes(id); if (g.id === '@all') return true; return false; },
    hit(type, id, n) {
      const S = G.S.quests; let ch = false;
      for (const qid in S.active) { const q = Quest.def(qid), pr = S.active[qid]; q.goals.forEach((g, i) => { if (g.t === type && pr[i] < g.n && Quest.match(g, id)) { pr[i] = Math.min(g.n, pr[i] + (n || 1)); ch = true; } }); if (q.goals.every((g, i) => pr[i] >= g.n)) Quest.complete(qid); }
      if (ch) bus.emit('quest');
    },
    complete(id) {
      const S = G.S.quests, q = Quest.def(id); delete S.active[id]; S.done.push(id);
      const r = q.rew || {}; if (r.xp) Prog.xp(r.xp); if (r.items) for (const k in r.items) Inv.give(k, r.items[k]);
      G.UI.banner('Задание выполнено', q.n); G.Audio.sfx('quest');
      if (q.story) { const i = G.QUESTS.indexOf(q), nx = G.QUESTS[i + 1]; if (nx && nx.story) setTimeout(() => Quest.start(nx.id), 1800); }
      for (const o of G.QUESTS) if (o.after === id) setTimeout(() => Quest.start(o.id), 3200);
      bus.emit('quest');
    },
    tracked() { const S = G.S.quests; for (const q of G.QUESTS) if (q.story && S.active[q.id]) return q; for (const q of G.QUESTS) if (S.active[q.id]) return q; return null; },
    init() {
      bus.on('item', e => { Quest.hit('gather', e.id, e.n); }); bus.on('craft', e => Quest.hit('craft', e.id, e.n)); bus.on('build', e => Quest.hit('build', e.id, 1));
      bus.on('kill', e => Quest.hit('kill', e.id, 1)); bus.on('biome', e => { Quest.hit('biome', e.id, 1); }); bus.on('poi', e => Quest.hit('poi', e.type, 1));
      bus.on('lore', () => Quest.hit('lore', null, 1)); bus.on('use', e => Quest.hit('use', e, 1)); bus.on('open', e => Quest.hit('open', e, 1)); bus.on('moved', e => Quest.hit('move', null, e));
    }
  };

  /* ================= SAVE SYSTEM ================= */
  const KEY = 'lostlands_save_v1', SKEY = 'lostlands_settings';
  const b64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192)); return btoa(s); };
  const unb64 = (s, n) => { const u = new Uint8Array(n); try { const b = atob(s); for (let i = 0; i < Math.min(n, b.length); i++) u[i] = b.charCodeAt(i); } catch (e) { } return u; };
  const OK = ['open', 'inv', 'dead', 'crop', 'g', 'wet', 'rot', 'hp', 'out', 'sealed', 'searched', 'v', 'last'];
  const Save = G.Save = {
    has() { try { return !!localStorage.getItem(KEY); } catch (e) { return false; } },
    clear() { try { localStorage.removeItem(KEY); } catch (e) { } },
    settings() { try { localStorage.setItem(SKEY, JSON.stringify(G.settings)); } catch (e) { } },
    loadSettings() { try { Object.assign(G.settings, JSON.parse(localStorage.getItem(SKEY) || '{}')); } catch (e) { } },
    packMap(m) {
      const st = {}, built = [];
      for (const o of m.objs) { if (!o) continue;
        if (o.b) { const r = { t: o.t, x: o.x, y: o.y }; for (const k of OK) if (o[k] != null && o[k] !== 0) r[k] = o[k]; built.push(r); }
        else if (o.dead || o.open || o.inv || o.searched || (o.crop && !o.wild) || o.out || o.unsealed || o.picked) { const r = {}; for (const k of OK) if (o[k] != null) r[k] = o[k]; if (o.crop) r.crop = o.crop; if (o.unsealed) r.unsealed = 1; st[o.y * m.w + o.x] = r; }
        else if (o.wild && !o.crop) st[o.y * m.w + o.x] = { crop: 0 };
      }
      return { st, built, gone: m.gone || [], tiles: m.tmods || {}, roofs: m.rmods || {}, killed: m.killed || {}, pois: m.pois.map(p => p.found ? 1 : 0), drops: (G.map === m ? G.Ent.packDrops() : (m.sdrops || [])), extra: m.extra || [] };
    },
    applyMap(m, d) {
      if (!d) return; m.gone = d.gone || []; m.tmods = d.tiles || {}; m.rmods = d.roofs || {}; m.killed = d.killed || {}; m.sdrops = d.drops || []; m.extra = d.extra || [];
      for (const e of m.extra) { const ex = m.at(e.x, e.y); if (ex && !ex.b) m.remove(ex); const o = m.add(e.t, e.x, e.y, {}); if (o) Object.assign(o, e.p || {}); }
      for (const k of m.gone) { const o = m.at(k % m.w, Math.floor(k / m.w)); if (o && !o.b) m.remove(o); }
      for (const k in d.st) { const o = m.at(k % m.w, Math.floor(k / m.w)); if (o) { const r = d.st[k]; Object.assign(o, r); if (r.crop === 0) { o.crop = null; o.g = 0; } if (r.crop) o.wild = 0; } }
      for (const k in m.tmods) m.tiles[k] = m.tmods[k][0];
      for (const k in m.rmods) m.roof[k] = m.rmods[k];
      for (const b of d.built || []) { const ex = m.at(b.x, b.y); if (ex) m.remove(ex); const o = m.add(b.t, b.x, b.y, { b: 1 }); if (o) Object.assign(o, b, { b: 1 }); }
      (d.pois || []).forEach((f, i) => { if (m.pois[i]) m.pois[i].found = f; });
      for (const o of m.objs) if (o && o.dead) m.deadList.push(o);
    },
    save() {
      if (!G.player || G.player.dead || !G.running || G.S.guest) return false;
      const p = G.player, S = G.S;
      S.p = { x: Math.round(p.x), y: Math.round(p.y), hp: p.hp, hunger: p.hunger, thirst: p.thirst, stam: p.stam, temp: p.temp, map: G.map.id, wx: p.wx, wy: p.wy, home: p.home };
      S.time = G.time.total; S.inv = G.inv; S.flags = G.flags; S.weather = [Weather.type, Weather.t];
      S.maps = S.maps || {}; for (const id in G.maps) S.maps[id] = Save.packMap(G.maps[id]);
      S.explored = b64(G.explored); S.v = G.VERSION;
      try { localStorage.setItem(KEY, JSON.stringify(S)); G.UI.saved(); return true; } catch (e) { console.warn('save failed', e); return false; }
    },
    load() { try { const s = JSON.parse(localStorage.getItem(KEY)); return s && s.seed != null ? s : null; } catch (e) { return null; } },
    unb64
  };
})();
