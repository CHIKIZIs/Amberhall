'use strict';
/* Player Controller, Combat System, Enemy AI, предметы на земле, снаряды, частицы, живность. */
(() => {
  const TS = 16, T = G.T, TD = G.TILE, A = G.Art, IT = G.ITEMS, bus = G.bus;
  const Ent = G.Ent = { mobs: [], drops: [], proj: [], parts: [], amb: [], foot: [], spawnT: 0, bossRef: null };

  /* ---------- Физика ---------- */
  const blocked = Ent.blocked = (m, x, y, hw, hh, fly) => {
    const x0 = Math.floor((x - hw) / TS), x1 = Math.floor((x + hw) / TS), y0 = Math.floor((y - hh) / TS), y1 = Math.floor((y + hh) / TS);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const t = m.t(tx, ty), ps = TD[t].pass; if (ps === 0 && !(fly && t === T.DEEP)) return true;
      if (!m.inb(tx, ty)) continue; const gi = m.grid[ty * m.w + tx]; if (!gi) continue; const o = m.objs[gi - 1]; if (!o) continue; const d = G.OBJ[o.t];
      if (!d.solid || o.open || (fly && !d.wall)) continue; if (o.dead && !(d.tree)) continue;
      const cs = d.cols || [d.col];
      for (const c of cs) { const ax = o.x * TS + c[0], ay = o.y * TS + c[1]; if (x + hw > ax && x - hw < ax + c[2] && y + hh > ay && y - hh < ay + c[3]) return true; }
    }
    return false;
  };
  const move = Ent.move = (e, dx, dy) => {
    const m = G.map, hw = e.hw || 4, hh = 3, fly = e.fly; let moved = 0;
    if (blocked(m, e.x, e.y - 3, hw, hh, fly)) { e.x += dx; e.y += dy; return 1; } // застряли — даём выйти
    if (dx && !blocked(m, e.x + dx, e.y - 3, hw, hh, fly)) { e.x += dx; moved += Math.abs(dx); }
    if (dy && !blocked(m, e.x, e.y + dy - 3, hw, hh, fly)) { e.y += dy; moved += Math.abs(dy); }
    return moved;
  };

  /* ---------- Частицы (пул) ---------- */
  Ent.part = (x, y, vx, vy, col, life, o) => { if (Ent.parts.length > 260) return; const p = { x, y, vx, vy, col, life, t: 0, g: 0, s: 1, z: 0 }; if (o) Object.assign(p, o); Ent.parts.push(p); };
  Ent.burst = (x, y, cols, n, sp, o) => { n = Math.ceil(n * (G.settings.fx || 1)); for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, v = (sp || 40) * (.4 + Math.random() * .8); Ent.part(x, y, Math.cos(a) * v, Math.sin(a) * v - 20, Array.isArray(cols) ? G.pick(cols) : cols, .35 + Math.random() * .3, Object.assign({ g: 160 }, o || {})); } };

  /* ---------- Предметы на земле ---------- */
  Ent.drop = (id, n, x, y, obj) => { if (!IT[id] || n <= 0) return; if (Ent.drops.length > 120) Ent.drops.shift(); const a = Math.random() * 6.283, v = 18 + Math.random() * 26; Ent.drops.push({ id, n, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .6, z: 4, vz: 60, t: 0, o: obj || null }); };
  Ent.packDrops = () => Ent.drops.slice(-60).map(d => ({ id: d.id, n: d.n, x: Math.round(d.x), y: Math.round(d.y), o: d.o }));
  function drawDrop(c, d, ox, oy) { const cv = A.iconCv[d.id], bob = d.z > 0 ? 0 : Math.sin(G.R.time * 3 + d.x) * 1.2, sh = A.spr.sh0; c.drawImage(sh.c, Math.round(d.x - ox - 4), Math.round(d.y - oy - 2)); c.drawImage(cv, Math.round(d.x - ox - 6), Math.round(d.y - oy - 11 - d.z - bob), 12, 12); }

  /* ---------- Игрок ---------- */
  const DIRV = [[0, 1], [0, -1], [-1, 0], [1, 0]];
  const Player = G.Player = {
    create(x, y) { return { x, y, dir: 0, aim: Math.PI / 2, state: 'idle', st: 0, anim: 0, hp: 100, hunger: 85, thirst: 85, stam: 100, temp: 50, stamCd: 0, inv: 0, flash: 0, biome: 1, hw: 4, cd: 0, rollCd: 0, kx: 0, ky: 0, probe: 0, stepT: 0, movedAcc: 0, warmBuff: 0, buff: 0, home: null }; },
    look() { const p = G.player; if (!p._look || p._lookV !== G.invVer) { p._look = A.lookOf(G.inv.eq); p._lookV = G.invVer; } return p._look; },
    busy() { const s = G.player.state; return s === 'attack' || s === 'roll' || s === 'gather' || s === 'dead' || s === 'sleep'; },
    hurt(dmg, sx, sy, raw) {
      const p = G.player; if (p.dead || G.paused) return; if (!raw) { if (p.inv > 0 || p.state === 'roll' && p.st < .3) return; const ar = G.Inv.armor(); dmg *= 1 - ar / (ar + 26);
        if (p.state === 'block') { dmg *= .28; p.stam = Math.max(0, p.stam - 12); p.stamCd = 1; G.Audio.sfx('block'); Ent.burst(p.x, p.y - 10, ['#ffffff', '#a6dcff'], 5, 50); if (p.stam <= 0) p.state = 'idle'; }
        p.inv = .55; if (sx != null) { const a = Math.atan2(p.y - sy, p.x - sx); p.kx = Math.cos(a) * 130; p.ky = Math.sin(a) * 130; } G.R.cam.shake = Math.min(6, 2 + dmg * .15); G.Audio.sfx('hurt'); if (p.state === 'sleep') Player.wake(); if (p.state === 'fish') p.state = 'idle'; }
      dmg = Math.max(1, Math.round(dmg)); p.hp -= dmg; p.flash = .25; G.R.text(p.x, p.y - 26, '-' + dmg, '#ff4f6a'); G.UI.hurt();
      if (p.hp <= 0) { p.hp = 0; p.dead = 1; p.state = 'dead'; p.st = 0; G.Audio.sfx('death'); G.Build.exit(); setTimeout(() => G.UI.death(), 1800); }
    },
    respawn() {
      const p = G.player; let hx, hy, mp = 'world';
      if (p.home) { hx = p.home[0]; hy = p.home[1]; } else { hx = G.maps.world.start[0] * TS + 8; hy = G.maps.world.start[1] * TS + 8; }
      if (G.map.id !== mp) G.setMap(mp);
      Object.assign(p, { x: hx, y: hy, hp: G.Prog.maxHp() * .6, hunger: Math.max(p.hunger, 45), thirst: Math.max(p.thirst, 45), stam: 100, temp: 50, dead: 0, state: 'idle', inv: 2, kx: 0, ky: 0 });
      G.S.xp = Math.floor(G.S.xp * .8); Ent.mobs.length = 0; G.R.follow(p.x, p.y - 8, 1, true); bus.emit('xp');
    },
    face(a) { const p = G.player; p.aim = a; const cx = Math.cos(a), cy = Math.sin(a); p.dir = Math.abs(cx) > Math.abs(cy) * 1.15 ? (cx < 0 ? 2 : 3) : (cy < 0 ? 1 : 0); },
    wake() { const p = G.player; if (p.state === 'sleep') { p.state = 'idle'; G.UI.sleep(false); } },
    selItem() { return G.Inv.sel(); },
    update(dt) {
      const p = G.player, m = G.map, I = G.Input, Inv = G.Inv;
      p.st += dt; p.anim += dt; if (p.inv > 0) p.inv -= dt; if (p.flash > 0) p.flash -= dt; if (p.cd > 0) p.cd -= dt; if (p.rollCd > 0) p.rollCd -= dt; if (p.buff > 0) p.buff -= dt;
      if (p.kx || p.ky) { move(p, p.kx * dt, p.ky * dt); const k = Math.pow(.002, dt); p.kx *= k; p.ky *= k; if (Math.abs(p.kx) + Math.abs(p.ky) < 4) p.kx = p.ky = 0; }
      if (p.dead) return;
      p.probe -= dt; if (p.probe <= 0) { p.probe = .2; Player.sense(); }
      const s = Inv.sel(), def = s ? IT[s.id] : null;
      if (p.state === 'sleep') { G.time.total += dt * 45; G.Time.update(0); if (I.any() || (p.sleepDay !== G.time.day && G.time.clock >= 6.5 && G.time.clock < 12) || (!G.Time.isNight() && p.st > 2 && p.hp >= G.Prog.maxHp() && G.time.clock > 6.5 && p.sleptNight)) Player.wake(); if (G.Time.isNight()) p.sleptNight = 1; return; }
      if (p.state === 'roll') { const k = p.st / p.rollDur; move(p, p.rx * dt * (1.25 - k * .5), p.ry * dt * (1.25 - k * .5)); if (p.st >= p.rollDur) { p.state = 'idle'; } return; }
      if (p.state === 'gather') { if (p.st >= .38) { p.state = 'idle'; if (p.gatherFn) { const f = p.gatherFn; p.gatherFn = null; f(); } } return; }
      if (p.state === 'attack') { const a = p.atk; if (!a.done && p.st >= a.dur * .42) { a.done = 1; G.Combat.swing(a); } if (p.st >= a.dur) p.state = 'idle'; else { const mv = I.mag > .2 ? 18 : 0; if (mv) move(p, I.mx * mv * dt, I.my * mv * dt); return; } }
      if (p.state === 'fish') { G.Act.fishUpdate(dt); if (I.mag > .3) { p.state = 'idle'; p.fish = null; } else { if (I.atkP) G.Act.fishPull(); I.clear(); return; } }
      /* движение */
      let sp = 58 + G.Inv.bonus('speed'); const mag = I.mag; let st = 'idle';
      p.wade = TD[m.t(Math.floor(p.x / TS), Math.floor((p.y - 2) / TS))].pass === 2;
      if (I.block && p.stam > 0 && !p.charging) { st = 'block'; sp = 24; }
      else if (mag > .12) { st = 'walk'; if (I.run && p.stam > 1 && !p.wade && !p.charging && !p.tired) { st = 'run'; sp = 98; p.stam -= 8.5 * dt; p.stamCd = .7; if (p.stam <= 1) p.tired = 1; } else sp *= Math.min(1, .45 + mag * .7); }
      if (p.tired && p.stam > 25) p.tired = 0;
      if (p.wade) sp *= .55; if (p.charging) sp *= .6; if (p.hunger < 12 || p.temp < 20) sp *= .85;
      if (mag > .12) {
        const mvd = move(p, I.mx * sp * dt, I.my * sp * dt);
        if (!p.charging && st !== 'block') { p.aim = Math.atan2(I.my, I.mx); p.dir = Math.abs(I.mx) > Math.abs(I.my) ? (I.mx < 0 ? 2 : 3) : (I.my < 0 ? 1 : 0); }
        p.movedAcc += mvd; if (p.movedAcc > 16) { bus.emit('moved', p.movedAcc / 16); p.movedAcc = 0; }
        p.stepT -= dt * (st === 'run' ? 1.6 : 1); if (p.stepT <= 0 && mvd > 0) { p.stepT = .32; const tt = m.t(Math.floor(p.x / TS), Math.floor((p.y - 2) / TS)), step = TD[tt].step; G.Audio.step(step); if (step === 'sand' || step === 'snow') Ent.foot.push({ x: p.x, y: p.y, t: 0, h: Math.abs(I.mx) > Math.abs(I.my) }); if (p.wade) Ent.burst(p.x, p.y - 2, ['#b4f4f0', '#ffffff'], 3, 26, { g: 120 }); else if (st === 'run' && step !== 'stone' && step !== 'wood') Ent.part(p.x, p.y - 1, -I.mx * 14, -8, step === 'snow' ? '#ffffff' : step === 'sand' ? '#e2ae78' : '#86c84a', .3, { g: 60 }); }
      }
      if (G.Input.sx >= 0 && (mag <= .12 || p.charging || st === 'block')) Player.face(G.Input.aim());
      if (st !== 'block' || p.state !== 'block') { if (p.state !== st) { p.state = st; if (st === 'idle') p.st = 0; } }
      /* действия */
      if (I.dodgeP && p.rollCd <= 0) { const cost = 22 * (1 - G.Prog.rank('dodge') * .2); if (p.stam >= cost) { p.stam -= cost; p.stamCd = .8; let dx = I.mx, dy = I.my; if (mag < .15) { dx = Math.cos(p.aim); dy = Math.sin(p.aim); } const l = Math.hypot(dx, dy) || 1; p.rx = dx / l * 175; p.ry = dy / l * 175; p.rollDur = .34 + G.Prog.rank('dodge') * .04; p.state = 'roll'; p.st = 0; p.rollCd = .55; p.charging = 0; G.Audio.sfx('roll'); Ent.burst(p.x, p.y - 2, ['#ffffff', '#d9d3be'], 4, 24, { g: 20 }); I.clear(); return; } else G.UI.toast('Нет сил для уклонения', null, 'bad', 1); }
      if (G.Build.on) { I.clear(); return; }
      if (I.atkP && p.cd <= 0) {
        const tool = def && def.tool ? def.tool.type : null;
        if (tool === 'rod') G.Act.fishStart(); else if (tool === 'can') G.Act.water(); else if (tool === 'shovel') Player.startAttack(false, 'dig');
        else { p.charging = 1; p.charge = 0; }
      }
      if (p.charging) { p.charge += dt; if (!I.atk) { p.charging = 0; Player.startAttack(p.charge >= .5); } }
      if (I.interP) G.Act.interact();
      if (I.useP) G.Act.use();
      if (false) { const sl = G.inv.slots; for (let k = 1; k <= 8; k++) { const i = (G.inv.sel + k) % 8; if (sl[i]) { G.inv.sel = i; bus.emit('inv'); G.Audio.sfx('ui'); break; } } }
      I.clear();
    },
    startAttack(heavy, kind) {
      const p = G.player, s = G.Inv.sel(), def = s ? IT[s.id] : null, w = def && def.weapon ? def.weapon : { dmg: 2, cd: .36, range: 14 };
      if (heavy) { if (p.stam < 14) { heavy = false; } else { p.stam -= 14; p.stamCd = .8; } }
      /* автоприцел: ближайший враг или подходящий ресурс перед игроком */
      if (G.Input.sx >= 0) Player.face(G.Input.aim());
      const tg = G.Combat.autoAim(w); if (tg != null) Player.face(tg);
      const dur = (w.cd || .4) * (heavy ? 1.35 : 1);
      p.atk = { dur, heavy, done: 0, w, kind: kind || w.kind || 'melee', id: s ? s.id : null }; p.state = 'attack'; p.st = 0; p.cd = dur + .04;
      if (p.atk.kind === 'melee' || p.atk.kind === 'dig') G.Audio.sfx(heavy ? 'swingh' : 'swing');
    },
    /* периодический опрос окружения: биом, огонь, крыша, туман войны, точки интереса, цель взаимодействия */
    sense() {
      const p = G.player, m = G.map, tx = Math.floor(p.x / TS), ty = Math.floor((p.y - 2) / TS);
      const b = m.biome[ty * m.w + tx] || (m.dark ? 6 : 1);
      if (b !== p.biome && b) { p.biome = b; if (b !== 6) { const id = G.BIOMES[b].id; if (!G.S.biomes.includes(id)) { G.S.biomes.push(id); G.UI.banner(G.BIOMES[b].n, G.BIOMES[b].desc); G.Prog.xp(40); bus.emit('biome', { id }); } } bus.emit('biomechange', b); }
      p.underRoof = m.roof[ty * m.w + tx] > 0; let fire = false, best = null, bd = 26;
      for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) { const o = m.at(tx + i, ty + j); if (!o) continue; const d = G.OBJ[o.t]; if (d.warm && !o.out && Math.abs(i) < 3 && Math.abs(j) < 3) fire = true;
        if (Math.abs(i) > 2 || Math.abs(j) > 2) continue; if (!(d.act || (d.pick && !o.dead))) continue; if (o.t === 'bones' && o.dead) continue;
        const sz = d.size || [1, 1], cx = (o.x + sz[0] / 2) * TS, cy = (o.y + sz[1] / 2) * TS, dd = Math.hypot(Math.max(Math.abs(cx - p.x) - sz[0] * 8 + 8, 0), Math.max(Math.abs(cy - (p.y - 4)) - sz[1] * 8 + 8, 0)) - (d.act ? 3 : 0);
        if (dd < bd) { bd = dd; best = o; } }
      p.nearFire = fire; if (best !== p.target) { p.target = best; bus.emit('target', best); }
      if (m.id === 'world') { const E = G.explored, w = m.w, R = 9; let ch = false; for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) { if (i * i + j * j > R * R) continue; const x = tx + i, y = ty + j; if (x < 0 || y < 0 || x >= w || y >= m.h) continue; const k = y * w + x; if (!(E[k >> 3] & (1 << (k & 7)))) { E[k >> 3] |= 1 << (k & 7); ch = true; } } if (ch) G.exploredVer++; p.wx = p.x; p.wy = p.y; }
      for (const q of m.pois) if (!q.found && Math.abs(q.x - tx) < 11 && Math.abs(q.y - ty) < 9) { q.found = 1; G.UI.toast('Найдено: ' + q.name, 'ui_pin'); G.Prog.xp(25); bus.emit('poi', { type: q.type }); G.Audio.sfx('discover'); }
    },
    draw(c, p, ox, oy) {
      const x = Math.round(p.x - ox), y = Math.round(p.y - oy), s = G.Inv.sel(), def = s ? IT[s.id] : null, look = Player.look();
      if (p.state === 'sleep' && p.hide) return;
      let leg = 0, arm = 0, bob = 0, cr = 0, d = p.dir, rot = 0, wAng = null, wFront = d !== 1;
      const st = p.state;
      if (st === 'idle') { bob = Math.floor(p.anim * 2) % 2; if (G.Craft.queue.length && !G.Build.on) arm = Math.floor(p.anim * 5) % 2 ? 3 : 0; }
      else if (st === 'walk' || st === 'run' || st === 'block') { leg = Math.floor(p.anim * (st === 'run' ? 13 : 8)) % 4; arm = [0, 1, 0, 2][leg]; bob = leg % 2; if (G.Input.mag < .12) leg = arm = 0; if (st === 'block') arm = 4; }
      else if (st === 'attack') { const k = p.st / p.atk.dur; arm = k < .3 ? 3 : k < .75 ? 4 : 0; const sw = p.atk.kind === 'bow' || p.atk.kind === 'staff' ? 0 : 1; wAng = sw ? p.aim - 1.9 + Math.min(1, k / .7) * 2.9 : p.aim; }
      else if (st === 'gather') { cr = 1; arm = 5; }
      else if (st === 'fish') { arm = 4; }
      else if (st === 'roll') rot = (p.st / p.rollDur) * 6.283 * (p.rx < 0 ? -1 : 1);
      else if (st === 'dead') rot = Math.min(1, p.st * 3) * 1.57;
      else if (st === 'sleep') rot = 1.57;
      if (p.charging && p.charge > .15) arm = 3;
      const sh = A.spr.sh1; if (st !== 'roll') c.drawImage(sh.c, x - 6, y - 3);
      if (p.wade && st !== 'dead') { c.save(); c.beginPath(); c.rect(x - 14, y - 34, 28, 30); c.clip(); }
      const cv = A.charFrame(look, d, leg, arm, bob, cr);
      const hand = () => {
        if (!def || st === 'roll' || st === 'dead' || st === 'sleep' || st === 'gather') return; if (!(def.weapon || def.tool)) return;
        const ic = A.iconCv[s.id]; let ang = wAng; const hx = x + [3, -3, -5, 5][d], hy = y - 10 + (bob ? 1 : 0);
        if (ang == null) { if (p.charging && p.charge > .15) ang = (def.weapon && (def.weapon.kind === 'bow' || def.weapon.kind === 'staff')) ? p.aim : p.aim - 2.1; else if (st === 'block') ang = -1.57 + (d === 2 ? -.5 : .5); else if (st === 'fish') ang = Math.atan2(p.fish.y - p.y, p.fish.x - p.x) - .5; else ang = [-1.1, -2.0, -2.2, -.95][d]; }
        c.save(); c.translate(hx, hy); c.rotate(ang + .785); c.drawImage(ic, -3, -13); c.restore();
      };
      if (!wFront) hand();
      if (rot) { c.save(); c.translate(x, y - 12); c.rotate(rot); if (st === 'roll') c.scale(.85, .85); c.drawImage(cv, -12, -17); c.restore(); }
      else if (p.inv > 0 && !p.dead && Math.floor(p.inv * 14) % 2) { c.globalAlpha = .45; c.drawImage(cv, x - 12, y - 29); c.globalAlpha = 1; }
      else c.drawImage(cv, x - 12, y - 29);
      if (wFront) hand();
      if (p.wade && st !== 'dead') c.restore();
      if (st === 'fish' && p.fish) { const f = p.fish, bx = Math.round(f.x - ox), by2 = Math.round(f.y - oy + (f.bite ? 2 : Math.sin(G.R.time * 3) * 1)); c.strokeStyle = '#e8e4d4'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + [3, -3, -9, 9][d], y - 22); c.lineTo(bx + .5, by2); c.stroke(); c.drawImage(A.spr.bobber.c, bx - 2, by2 - 3); }
      if (p.charging && p.charge > .15) { const k = Math.min(1, p.charge / .5); c.fillStyle = '#1b1526'; c.fillRect(x - 8, y - 35, 16, 3); c.fillStyle = k >= 1 ? '#ffd23e' : '#e8eef4'; c.fillRect(x - 7, y - 34, Math.round(14 * k), 1); }
      if (st === 'sleep') { const z = A.iconCv.ui_zzz; c.drawImage(z, x + 4, y - 30 - Math.round((G.R.time * 6) % 6), 10, 10); }
      if (def && def.light && st !== 'dead') G.R.light(p.x, p.y - 12, 76 + Math.sin(G.R.time * 12) * 3, '#ffb04a', .95);
    }
  };

  /* ---------- COMBAT SYSTEM ---------- */
  const Combat = G.Combat = {
    dmgMul() { return 1 + G.Prog.rank('dmg') * .1 + G.Inv.bonus('dmg') + (G.player.buff > 0 ? .2 : 0); },
    autoAim(w) {
      const p = G.player, rng = (w.kind ? w.range : (w.range || 16) + 14), cx = p.x, cy = p.y - 8; let best = null, bd = 1e9; const cur = p.aim;
      for (const m of Ent.mobs) { if (m.dead) continue; const d = Math.hypot(m.x - cx, m.y - m.def.h * .4 - cy) - m.def.r; if (d > rng) continue; const a = Math.atan2(m.y - m.def.h * .4 - cy, m.x - cx); let da = Math.abs(((a - cur + 9.42) % 6.283) - 3.1416); const sc = d + da * (w.kind ? 40 : 14); if (da > (w.kind ? .35 : .8)) continue; if (sc < bd) { bd = sc; best = a; } }
      if (best != null || w.kind) return best;
      const o = Combat.findRes(cur, true); if (o) { const d = G.OBJ[o.t], sz = d.size || [1, 1]; return Math.atan2((o.y + sz[1] * .5) * TS + 2 - cy - 4, (o.x + sz[0] * .5) * TS - cx); }
      return null;
    },
    findRes(aim, loose) {
      const p = G.player, m = G.map, tx = Math.floor(p.x / TS), ty = Math.floor((p.y - 4) / TS); let best = null, bd = 1e9;
      for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const o = m.at(tx + i, ty + j); if (!o || o.dead) continue; const d = G.OBJ[o.t]; if (!d.res) continue; const sz = d.size || [1, 1], cx = (o.x + sz[0] * .5) * TS, cy = (o.y + sz[1] * .5) * TS + 2, dx = cx - p.x, dy = cy - (p.y - 4), dist = Math.hypot(dx, dy); if (dist > 27) continue; const a = Math.atan2(dy, dx), da = Math.abs(((a - aim + 9.42) % 6.283) - 3.1416); if (da > (loose ? 1.5 : 1.25)) continue; const sc = dist + da * 12; if (sc < bd) { bd = sc; best = o; } }
      return best;
    },
    swing(a) {
      const p = G.player, w = a.w, s = G.Inv.sel(), def = s && s.id === a.id ? IT[s.id] : null, cx = p.x, cy = p.y - 8;
      if (a.kind === 'dig') { G.Act.dig(); return; }
      if (a.kind === 'bow') { if (!G.Inv.count('arrow')) { G.UI.toast('Нет стрел', 'arrow', 'bad', 1); return; } G.Inv.remove('arrow', 1); Ent.shoot(cx, cy, p.aim, a.heavy ? 300 : 240, w.dmg * Combat.dmgMul() * (a.heavy ? 1.8 : 1), 'arrow', 1, w.range * (a.heavy ? 1.3 : 1)); G.Audio.sfx('bow'); G.Inv.wear(1); return; }
      if (a.kind === 'staff') { const cost = w.cost || 8; if (p.stam < cost) { G.UI.toast('Нет сил для заклинания', null, 'bad', 1); return; } p.stam -= cost; p.stamCd = .6; Ent.shoot(cx, cy, p.aim, 200, w.dmg * Combat.dmgMul() * (a.heavy ? 1.7 : 1), 'magic', 1, w.range, w.splash ? w.splash * (a.heavy ? 1.4 : 1) : 0); G.Audio.sfx('magic'); G.Inv.wear(1); return; }
      const rng = (w.range || 14) + (a.heavy ? 4 : 0), arc = a.heavy ? 1.5 : 1.15; let hitAny = false;
      G.R.addFx({ t: 0, life: .16, y: p.y + 20, x: cx, cy, a: p.aim, r: rng, heavy: a.heavy, draw: slashFx });
      for (const m of Ent.mobs) { if (m.dead) continue; const mx = m.x, my = m.y - m.def.h * .4, d = Math.hypot(mx - cx, my - cy) - m.def.r; if (d > rng) continue; const ang = Math.atan2(my - cy, mx - cx), da = Math.abs(((ang - p.aim + 9.42) % 6.283) - 3.1416); if (da > arc && d > 4) continue;
        let dmg = (w.dmg || 2) * Combat.dmgMul() * (a.heavy ? 1.9 : 1) * (.9 + Math.random() * .2); const crit = Math.random() < .05 + G.Prog.rank('crit') * .06 + (w.crit || 0); if (crit) dmg *= 1.9;
        Ent.hitMob(m, dmg, Math.cos(ang) * (w.kb || 1) * (a.heavy ? 1.6 : 1), Math.sin(ang) * (w.kb || 1) * (a.heavy ? 1.6 : 1), crit); if (w.stun) m.stun = Math.max(m.stun || 0, w.stun * (m.def.kbRes ? .3 : 1)); if (w.leech) p.hp = Math.min(G.Prog.maxHp(), p.hp + dmg * w.leech); hitAny = true; }
      if (hitAny) { G.Inv.wear(1); return; }
      const o = Combat.findRes(p.aim); if (!o) return;
      const d = G.OBJ[o.t], r = d.res, tool = def && def.tool ? def.tool : null;
      if (r.tool !== 'any') { const okType = tool && (tool.type === r.tool || tool.type === r.alt); if (!okType) { G.UI.toast(r.tool === 'axe' ? 'Нужен топор' : 'Нужна кирка', r.tool === 'axe' ? 'stone_axe' : 'stone_pick', 'bad', 1); G.Audio.sfx('thud'); o.shake = .15; return; } if ((r.tier || 1) > tool.tier) { G.UI.toast('Нужен инструмент получше', 'iron_pick', 'bad', 1); G.Audio.sfx('thud'); o.shake = .15; return; } }
      const pow = (tool ? tool.power : 1) * (1 + G.Prog.rank('speed') * .25 + G.Inv.bonus('gather')) * (a.heavy ? 2 : 1);
      if (o.hp == null) { o.hp = r.hp; } o.maxhp = r.hp; o.hp -= pow; o.shake = .25; o.hpShow = 2;
      const ox = (o.x + .5) * TS, oy = (o.y + .5) * TS;
      if (d.tree) { G.Audio.sfx('chop'); Ent.burst(ox, oy - 6, ['#b88a5c', '#7a5038', '#d2aa72'], 6, 50); Ent.burst(ox, oy - 26, [A.PAL.oak[2], A.PAL.oak[3]], 3, 30, { g: 40 }); }
      else if (r.tool === 'pick') { G.Audio.sfx('mine'); Ent.burst(ox, oy - 4, ['#a09ca8', '#7c7888', '#c8c6cc'], 7, 60); }
      else { G.Audio.sfx('thud'); Ent.burst(ox, oy - 4, ['#b38655', '#8f6240'], 6, 50); }
      G.Inv.wear(1); G.R.cam.shake = Math.max(G.R.cam.shake, a.heavy ? 2.5 : 1.2);
      if (o.hp <= 0) G.Act.harvest(o);
    }
  };
  function slashFx(c, f, ox, oy) { const k = f.t / f.life, r = f.r + 2; c.fillStyle = f.heavy ? '#ffe9a0' : '#ffffff'; c.globalAlpha = 1 - k * .8; const a0 = f.a - 1.1 + k * .5, a1 = f.a + 1.1 * Math.min(1, k * 2.5); for (let a = a0; a < a1; a += .09) { const w = 1 + Math.round((1 - Math.abs((a - a0) / (a1 - a0) - .6)) * (f.heavy ? 3 : 2)); c.fillRect(Math.round(f.x - ox + Math.cos(a) * r - w / 2), Math.round(f.cy - oy + Math.sin(a) * r - w / 2), w, w); } c.globalAlpha = 1; }

  /* ---------- Снаряды ---------- */
  Ent.shoot = (x, y, ang, sp, dmg, kind, fromP, range, splash) => { Ent.proj.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, dmg, kind, p: fromP, life: (range || 150) / sp, a: ang, splash: splash || 0 }); };
  const PCOL = { arrow: '#e8e4d4', magic: '#e06af0', ice: '#a6dcff', rock: '#7c7888' };
  function drawProj(c, q, ox, oy) { const x = Math.round(q.x - ox), y = Math.round(q.y - oy); if (q.kind === 'arrow') { c.save(); c.translate(x, y); c.rotate(q.a); c.fillStyle = '#8f6240'; c.fillRect(-6, 0, 9, 1); c.fillStyle = '#e8eef4'; c.fillRect(3, -1, 2, 3); c.fillStyle = '#ffffff'; c.fillRect(-7, -1, 2, 3); c.restore(); } else if (q.kind === 'rock') { c.fillStyle = '#3a3446'; c.fillRect(x - 3, y - 3, 6, 6); c.fillStyle = '#a09ca8'; c.fillRect(x - 2, y - 2, 4, 3); } else { const col = PCOL[q.kind]; c.fillStyle = col; c.fillRect(x - 2, y - 2, 4, 4); c.fillStyle = '#ffffff'; c.fillRect(x - 1, y - 1, 2, 2); G.R.light(q.x, q.y, 26, col, .7); } }

  /* ---------- Существа ---------- */
  Ent.spawnMob = (type, x, y, o) => { const def = G.MOBS[type]; if (!def) return null; const m = Object.assign({ def, x, y, hp: def.hp, st: 'idle', t: Math.random() * 2, anim: Math.random(), face: 1, hit: 0, cd: 1, hx: x, hy: y, kx: 0, ky: 0, fly: def.fly, hw: Math.min(6, def.r - 1), z: 0, wt: 0 }, o || {}); Ent.mobs.push(m); return m; };
  Ent.hitMob = (m, dmg, kx, ky, crit) => {
    if (m.dead) return; dmg = Math.max(1, Math.round(dmg)); m.hp -= dmg; m.hit = .12; m.aggro = 1; m.sleep = 0; m.fleeT = 3; const res = m.def.kbRes || 0; m.kx += kx * 120 * (1 - res); m.ky += ky * 120 * (1 - res);
    G.R.text(m.x, m.y - m.def.h, (crit ? '!' : '') + dmg, crit ? '#ffd23e' : '#ffffff', crit); G.Audio.sfx(crit ? 'crit' : 'hit'); Ent.burst(m.x, m.y - m.def.h * .5, ['#ffffff', '#ffd23e'], crit ? 8 : 4, 60);
    if (m.def.boss) Ent.bossRef = m;
    if (m.hp <= 0) Ent.killMob(m);
  };
  Ent.killMob = m => {
    m.dead = 1; const d = m.def; G.Audio.sfx(d.boss ? 'bossdie' : 'die'); Ent.burst(m.x, m.y - d.h * .5, ['#ffffff', '#d9d3be', '#a09ca8'], d.boss ? 40 : 10, d.boss ? 110 : 60);
    for (const dr of d.drops) { if (dr[3] != null && Math.random() > dr[3]) continue; const n = dr[1] + Math.floor(Math.random() * (dr[2] - dr[1] + 1)); if (n > 0) Ent.drop(dr[0], n, m.x, m.y - 2); }
    G.Prog.xp(d.xp); bus.emit('kill', { id: d.id });
    if (m.sid) { const mp = G.map; mp.killed = mp.killed || {}; mp.killed[m.sid] = d.boss ? -1 : G.time.total; }
    if (d.boss) { if (Ent.bossRef === m) Ent.bossRef = null; G.R.cam.shake = 8; G.UI.banner(d.n + ' повержен', 'Путь свободен'); G.Act.bossDown(m); }
  };
  const steer = (m, tx, ty, sp, dt) => {
    let dx = tx - m.x, dy = ty - m.y; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    if (m.sideT > 0) { m.sideT -= dt; const sx = -dy * m.side, sy = dx * m.side; dx = dx * .3 + sx; dy = dy * .3 + sy; }
    const want = sp * dt, got = move(m, dx * want, dy * want);
    if (got < want * .35) { m.stuck = (m.stuck || 0) + dt; if (m.stuck > .25 && !(m.sideT > 0)) { m.side = Math.random() < .5 ? 1 : -1; m.sideT = .5 + Math.random() * .4; } } else m.stuck = 0;
    if (Math.abs(dx) > .15) m.face = dx < 0 ? -1 : 1; m.moving = 1;
  };
  const wander = (m, dt, sp) => { m.wt -= dt; if (m.wt <= 0) { m.wt = 1.5 + Math.random() * 4; if (Math.random() < .6) { m.wx = m.hx + (Math.random() - .5) * 90; m.wy = m.hy + (Math.random() - .5) * 70; } else m.wx = null; } if (m.wx != null && Math.hypot(m.wx - m.x, m.wy - m.y) > 4) steer(m, m.wx, m.wy, sp, dt); };
  const ring = (x, y, r, life, fn) => G.R.addFx({ flat: 1, t: 0, life, x, y, r, done: fn, draw(c, f, ox, oy) { const k = f.t / f.life, cx = f.x - ox, cy = f.y - oy; c.fillStyle = 'rgba(232,53,63,' + (.12 + k * .25) + ')'; c.beginPath(); c.ellipse(cx, cy, f.r * k, f.r * k * .7, 0, 0, 6.283); c.fill(); c.strokeStyle = '#ff4f6a'; c.lineWidth = 1; c.beginPath(); c.ellipse(cx, cy, f.r, f.r * .7, 0, 0, 6.283); c.stroke(); } });
  const KIT = { guardian: { charge: 7, slam: [10, 46] }, golem: { slam: [7, 62], rocks: 9, summon: ['crawler', 3, [.5]] }, frost: { ranged: 1, volley: [5.5, 10, 'ice'], blink: 7, summon: ['wolf', 2, [.6, .3]] }, elder: { ranged: 1, spread: 1, blink: 6, summon: ['pslime', 2, [.5]] }, heart: { charge: 6, slam: [8, 56], volley: [6, 12, 'magic'], summon: ['guardian', 1, [.5]] } };
  function bossAI(m, dt, dist, dx, dy) {
    const d = m.def, k = KIT[d.boss], p = G.player, rage = m.hp < d.hp * .5 ? 1.3 : 1;
    if (!m.aggro) { if (dist < d.detect) { m.aggro = 1; Ent.bossRef = m; G.Audio.sfx('boss'); G.UI.banner(d.n, 'Древний хранитель пробудился'); m.c1 = 3; m.c2 = 5; m.c3 = 4; m.c4 = 6; } else return; }
    Ent.bossRef = m; if (dist > 330) { m.aggro = 0; m.hp = Math.min(d.hp, m.hp + d.hp * .25); Ent.bossRef = null; m.x = m.hx; m.y = m.hy; return; }
    if (m.act) { const a = m.act; a.t += dt;
      if (a.k === 'charge') { if (a.t < .6) { m.atkPose = 1; } else if (a.t < 1.3) { const got = move(m, a.dx * 250 * dt, a.dy * 250 * dt); m.moving = 1; if (Math.hypot(p.x - m.x, p.y - m.y) < d.r + 10) { Player.hurt(d.dmg * 1.3, m.x, m.y); a.t = 2; } if (got < 1) a.t = 2; if (Math.random() < .5) Ent.part(m.x, m.y - 2, 0, -10, '#d9d3be', .4); } else { m.act = null; m.atkPose = 0; } }
      else if (a.k === 'slam') { m.atkPose = 1; if (a.t >= .85 && !a.done) { a.done = 1; G.R.cam.shake = 6; G.Audio.sfx('slam'); Ent.burst(m.x, m.y, ['#a09ca8', '#d9d3be'], 22, 120); if (Math.hypot(p.x - m.x, (p.y - m.y) / .7) < a.r) Player.hurt(d.dmg * 1.4, m.x, m.y); } if (a.t > 1.2) { m.act = null; m.atkPose = 0; } }
      return; }
    m.c1 -= dt * rage; m.c2 -= dt * rage; m.c3 -= dt * rage; m.c4 -= dt * rage;
    if (k.summon && m.sumI == null) m.sumI = 0;
    if (k.summon && m.sumI < k.summon[2].length && m.hp < d.hp * k.summon[2][m.sumI]) { m.sumI++; for (let i = 0; i < k.summon[1]; i++) { const a = Math.random() * 6.283; const s = Ent.spawnMob(k.summon[0], m.x + Math.cos(a) * 40, m.y + Math.sin(a) * 30, { aggro: 1 }); if (s && blocked(G.map, s.x, s.y - 3, 4, 3, s.fly)) { s.x = m.x; s.y = m.y + 10; } } G.Audio.sfx('boss'); Ent.burst(m.x, m.y - 10, ['#e06af0', '#ffffff'], 16, 90); }
    if (k.charge && m.c1 <= 0 && dist > 50) { m.c1 = k.charge; m.act = { k: 'charge', t: 0, dx: dx / dist, dy: dy / dist }; G.Audio.sfx('growl'); return; }
    if (k.slam && m.c2 <= 0 && dist < k.slam[1] + 20) { m.c2 = k.slam[0]; m.act = { k: 'slam', t: 0, r: k.slam[1] }; ring(m.x, m.y, k.slam[1], .85); return; }
    if (k.volley && m.c3 <= 0) { m.c3 = k.volley[0]; const n = k.volley[1]; for (let i = 0; i < n; i++) Ent.shoot(m.x, m.y - d.h * .4, i / n * 6.283 + m.anim, 105, d.dmg * .6, k.volley[2], 0, 230); G.Audio.sfx('magic'); }
    if (k.rocks && m.c3 <= 0) { m.c3 = k.rocks; const a = Math.atan2(dy, dx); for (let i = -1; i <= 1; i++) Ent.shoot(m.x, m.y - d.h * .5, a + i * .28, 150, d.dmg * .7, 'rock', 0, 260); G.Audio.sfx('swingh'); }
    if (k.blink && m.c4 <= 0) { m.c4 = k.blink; for (let t = 0; t < 12; t++) { const a = Math.random() * 6.283, nx = p.x + Math.cos(a) * 80, ny = p.y + Math.sin(a) * 60; if (!blocked(G.map, nx, ny - 3, 6, 3, 0) && Math.hypot(nx - m.hx, ny - m.hy) < 150) { Ent.burst(m.x, m.y - 14, ['#a6dcff', '#ffffff'], 14, 80); m.x = nx; m.y = ny; Ent.burst(m.x, m.y - 14, ['#a6dcff', '#ffffff'], 14, 80); G.Audio.sfx('magic'); break; } } }
    if (k.ranged) { if (dist < 60) steer(m, m.x - dx, m.y - dy, d.sp, dt); else if (dist > d.atkR) steer(m, p.x, p.y, d.sp, dt); if (m.cd <= 0) { m.cd = d.atkCd / rage; const a = Math.atan2(p.y - 8 - (m.y - d.h * .4), dx); if (k.spread) for (let i = -1; i <= 1; i++) Ent.shoot(m.x, m.y - d.h * .4, a + i * .3, 130, d.dmg, d.proj, 0, 220); else Ent.shoot(m.x, m.y - d.h * .4, a, 150, d.dmg, d.proj, 0, 240); G.Audio.sfx('magic'); } }
    else meleeAI(m, dt, dist, rage);
  }
  function meleeAI(m, dt, dist, rage) {
    const d = m.def, p = G.player;
    if (m.atkT > 0) { m.atkT -= dt; m.atkPose = 1; if (m.atkT <= 0) { m.atkPose = 0; m.cd = d.atkCd / (rage || 1); if (Math.hypot(p.x - m.x, p.y - m.y) < d.atkR + d.r + 4) Player.hurt(d.dmg, m.x, m.y); else if (m.target) { const o = m.target; m.target = null; if (o.b && G.map.objs[o.i - 1] === o) G.Act.damageBuilt(o, d.dmg); } } return; }
    if (dist < d.atkR + d.r - 2) { if (m.cd <= 0) { m.atkT = .36; G.Audio.sfx('growl', .4); } return; }
    if (d.hop) { m.hopT = (m.hopT || 0) - dt; if (m.hopT > .35) return; if (m.hopT <= 0) m.hopT = .8; steer(m, p.x, p.y, d.sp * 2.2 * (rage || 1), dt); }
    else if (d.erratic) steer(m, p.x + Math.sin(m.anim * 5) * 30, p.y + Math.cos(m.anim * 4) * 24, d.sp, dt);
    else steer(m, p.x, p.y, d.sp * (rage || 1), dt);
    /* преграда из построек игрока: ломаем */
    if (m.stuck > .7 && m.cd <= 0) { const tx = Math.floor((m.x + Math.sign(p.x - m.x) * 10) / TS), ty = Math.floor((m.y - 3 + Math.sign(p.y - m.y) * 10) / TS); for (const [ax, ay] of [[tx, Math.floor((m.y - 3) / TS)], [Math.floor(m.x / TS), ty], [tx, ty]]) { const o = G.map.at(ax, ay); if (o && o.b && G.OBJ[o.t].solid && !o.open) { m.target = o; m.atkT = .36; m.stuck = 0; break; } } }
  }
  function mobUpdate(m, dt) {
    const d = m.def, p = G.player, dx = p.x - m.x, dy = p.y - m.y, dist = Math.hypot(dx, dy);
    m.anim += dt; m.moving = 0; if (m.hit > 0) m.hit -= dt; if (m.cd > 0) m.cd -= dt;
    if (m.kx || m.ky) { move(m, m.kx * dt, m.ky * dt); const k = Math.pow(.001, dt); m.kx *= k; m.ky *= k; if (Math.abs(m.kx) + Math.abs(m.ky) < 3) m.kx = m.ky = 0; }
    if (m.stun > 0) { m.stun -= dt; return; }
    if (p.dead) { wander(m, dt, d.sp * .3); return; }
    const night = G.Time.isNight() && !G.map.dark;
    if (d.ai === 'flee') {
      if (night && !d.fly && !m.fleeT) { m.sleep = dist > 30; if (m.sleep) return; }
      if (m.away) { m.z += 50 * dt; m.x += m.face * 90 * dt; m.y -= 30 * dt; m.moving = 1; if (m.z > 90) m.gone = 1; return; }
      if (dist < d.detect || m.fleeT > 0) { if (dist < d.detect) m.fleeT = 1.6; m.fleeT -= dt; if (d.fly) { m.away = 1; m.face = dx > 0 ? -1 : 1; G.Audio.sfx('flap', .5); return; } steer(m, m.x - dx, m.y - dy, d.sp, dt); m.hx = m.x; m.hy = m.y; }
      else wander(m, dt, d.sp * .3);
      return;
    }
    if (d.ai === 'boss') { bossAI(m, dt, dist, dx, dy); return; }
    if (d.night && !night && !G.map.dark) { m.hp -= dt * 30; if (Math.random() < .3) Ent.part(m.x, m.y - 10, 0, -20, '#463c74', .5); if (m.hp <= 0) { m.dead = 1; Ent.burst(m.x, m.y - 10, ['#2e2650', '#463c74'], 8, 40); } return; }
    if (!m.aggro) {
      const det = d.detect * (night ? 1.25 : 1);
      if (d.ai === 'guard') { if (Math.hypot(p.x - m.hx, p.y - m.hy) < det && dist < det * 1.4) { m.aggro = 1; G.Audio.sfx('growl'); } else { if (Math.hypot(m.x - m.hx, m.y - m.hy) > 8) steer(m, m.hx, m.hy, d.sp, dt); return; } }
      else if (dist < det) { m.aggro = 1; G.Audio.sfx('growl', .6); } else { wander(m, dt, d.sp * .35); return; }
    }
    if (dist > d.detect * 2.2 || (d.ai === 'guard' && Math.hypot(m.x - m.hx, m.y - m.hy) > 190)) { m.aggro = 0; return; }
    if (d.ai === 'ranged') { if (dist < 54) steer(m, m.x - dx, m.y - dy, d.sp, dt); else if (dist > d.atkR) steer(m, p.x, p.y, d.sp, dt); else steer(m, m.x - dy, m.y + dx, d.sp * .4, dt); m.face = dx < 0 ? -1 : 1; if (m.cd <= 0 && dist < d.atkR + 20) { m.cd = d.atkCd; m.atkPose = 1; setTimeout(() => { m.atkPose = 0; }, 300); Ent.shoot(m.x, m.y - d.h * .5, Math.atan2(p.y - 8 - (m.y - d.h * .5), dx), 120, d.dmg, d.proj, 0, 200); G.Audio.sfx('magic', .6); } return; }
    meleeAI(m, dt, dist);
  }
  function drawMob(c, m, ox, oy) {
    const d = m.def, f = m.moving || d.fly || d.hop ? Math.floor(m.anim * (d.hop ? 5 : 7)) % 4 : 0, cv = A.mobFrame(d, f, !!m.atkPose, m.face < 0, m.hit > 0);
    const x = Math.round(m.x - ox), y = Math.round(m.y - oy), sh = A.spr['sh' + d.sh], lift = (d.fly ? 6 : 0) + m.z;
    if (m.z < 50) c.drawImage(sh.c, x - (sh.w >> 1), y - (sh.h >> 1));
    c.drawImage(cv, x - (cv.width >> 1), y - cv.height + 3 - Math.round(lift));
    if (m.sleep) c.drawImage(A.iconCv.ui_zzz, x + 2, y - d.h - 8 - Math.round((G.R.time * 5) % 5), 8, 8);
    if (m.stun > 0) { c.fillStyle = '#ffd23e'; const a = G.R.time * 8; c.fillRect(x + Math.round(Math.cos(a) * 6), y - d.h - 4 + Math.round(Math.sin(a) * 2), 2, 2); c.fillRect(x - Math.round(Math.cos(a) * 6), y - d.h - 4 - Math.round(Math.sin(a) * 2), 2, 2); }
    if (m.hp < d.hp && !d.boss) { const w = Math.max(10, d.w * .7) | 0; c.fillStyle = '#1b1526'; c.fillRect(x - (w >> 1) - 1, y - cv.height - 3 - lift, w + 2, 3); c.fillStyle = '#e8353f'; c.fillRect(x - (w >> 1), y - cv.height - 2 - lift, Math.max(0, Math.round(w * m.hp / d.hp)), 1); }
    if (d.spr === 'spirit' || d.spr === 'frost') G.R.light(m.x, m.y - d.h * .5, d.h * 1.6, d.spr === 'frost' ? '#62b0f5' : '#e06af0', .5);
  }

  /* ---------- Появление существ ---------- */
  function spawner() {
    const p = G.player, m = G.map, mobs = Ent.mobs, tx = Math.floor(p.x / TS), ty = Math.floor(p.y / TS);
    for (let i = mobs.length - 1; i >= 0; i--) { const q = mobs[i]; if (q.dead || q.gone || (!q.sid && !q.def.boss && Math.hypot(q.x - p.x, q.y - p.y) > 520)) mobs.splice(i, 1); else if (q.sid && !q.aggro && Math.hypot(q.x - p.x, q.y - p.y) > 620) { mobs.splice(i, 1); q.sp.live = 0; } }
    /* фиксированные точки: стражи руин, обитатели подземелий, боссы */
    const killed = m.killed || {};
    for (const s of m.spawns) { if (s.live) { if (s.ref.dead || mobs.indexOf(s.ref) < 0) s.live = 0; else continue; } const k = killed[s.id]; if (k === -1 || (k != null && G.time.total - k < G.Time.DAY)) continue; if (Math.abs(s.x - tx) > 17 || Math.abs(s.y - ty) > 13) continue; if (!s.boss && Math.abs(s.x - tx) < 7 && Math.abs(s.y - ty) < 5 && m.id === 'world') continue; const q = Ent.spawnMob(s.type, s.x * TS + 8, s.y * TS + 12, { sid: s.id, sp: s }); if (q) { s.live = 1; s.ref = q; } }
    if (m.dark || mobs.length > 26) return;
    const night = G.Time.isNight(), b = G.BIOMES[p.biome]; if (!b || !b.tier) return;
    let hostile = 0, passive = 0; for (const q of mobs) { if (q.sid) continue; if (q.def.ai === 'flee') passive++; else hostile++; }
    const capH = (night ? 5 : 2) + (G.flags.bloodmoon && night ? 4 : 0) + (b.tier > 2 ? 1 : 0), capP = night ? 2 : 6;
    const tryAt = (list, fly) => { for (let a = 0; a < 6; a++) { const ang = Math.random() * 6.283, dist = 15 + Math.random() * 7, x = Math.floor(tx + Math.cos(ang) * dist * 1.3), y = Math.floor(ty + Math.sin(ang) * dist * .9); if (!m.inb(x, y) || TD[m.t(x, y)].pass !== 1 || m.at(x, y) || m.roof[y * m.w + x]) continue; if (m.biome[y * m.w + x] !== p.biome) continue; let tot = 0; for (const e of list) tot += e[1]; let v = Math.random() * tot, type = list[0][0]; for (const e of list) { v -= e[1]; if (v <= 0) { type = e[0]; break; } } return [type, x, y]; } return null; };
    if (passive < capP && Math.random() < .5) { const r = tryAt(b.animals); if (r) Ent.spawnMob(r[0], r[1] * TS + 8, r[2] * TS + 12); }
    if (hostile < capH && Math.random() < (night ? .6 : .22)) {
      const list = night ? b.mobs.concat([['shade', 3 + b.tier]]) : b.mobs, r = tryAt(list);
      if (r) { let safe = false; for (const o of (m.safe || [])) if (Math.abs(o.x - r[1]) < 9 && Math.abs(o.y - r[2]) < 9) { safe = true; break; } if (!safe) { const q = Ent.spawnMob(r[0], r[1] * TS + 8, r[2] * TS + 12); if (q && G.flags.bloodmoon && night) q.aggro = 1; } }
    }
  }

  /* ---------- Мелкая живность и атмосфера ---------- */
  function ambient(dt) {
    const R = G.R, m = G.map, amb = Ent.amb, night = G.Time.isNight(), p = G.player;
    if (amb.length < 10 && Math.random() < dt * 1.2 && !m.dark) {
      const x = R.cam.sx + Math.random() * R.vw, y = R.cam.sy + Math.random() * R.vh, tx = Math.floor(x / TS), ty = Math.floor(y / TS), t = m.t(tx, ty), wet = G.Weather.wet();
      if (night && TD[t].pass === 1 && !wet) amb.push({ k: 'fly', x, y, t: 0, life: 6 + Math.random() * 5, ph: Math.random() * 9 });
      else if (!night && !wet && (t === T.GRASS || t === T.PINK || t === T.DGRASS)) amb.push({ k: 'bfly', x, y, t: 0, life: 7 + Math.random() * 6, ph: Math.random() * 9, c: Math.floor(Math.random() * 3) });
      else if ((t === T.WATER || t === T.DEEP) && Math.random() < .7) amb.push({ k: 'fish', x, y, t: 0, life: 5 + Math.random() * 4, a: Math.random() * 6.283 });
      else if (!night && Math.random() < .12 && !wet) { const yy = R.cam.sy + Math.random() * R.vh * .7; for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) amb.push({ k: 'bird', x: R.cam.sx - 20 - i * 14, y: yy + i * 8 * (i % 2 ? 1 : -1), t: 0, life: 14, ph: i }); G.Audio.sfx('bird', .5); }
    }
    if (p.biome === G.BI.pink && Math.random() < dt * 3) Ent.part(R.cam.sx + Math.random() * R.vw, R.cam.sy - 4, -8 - Math.random() * 10, 16 + Math.random() * 10, Math.random() < .5 ? '#ffb8b8' : '#ff7e96', 5, { flat: 1 });
    for (let i = amb.length - 1; i >= 0; i--) { const a = amb[i]; a.t += dt; if (a.t > a.life) { amb.splice(i, 1); continue; }
      if (a.k === 'bfly') { a.x += Math.sin(a.t * 1.7 + a.ph) * 14 * dt; a.y += Math.cos(a.t * 2.3 + a.ph) * 10 * dt; }
      else if (a.k === 'fly') { a.x += Math.sin(a.t * .9 + a.ph) * 8 * dt; a.y += Math.cos(a.t * 1.3 + a.ph) * 6 * dt; }
      else if (a.k === 'fish') { a.a += Math.sin(a.t * 2) * dt; const nx = a.x + Math.cos(a.a) * 14 * dt, ny = a.y + Math.sin(a.a) * 14 * dt, t = m.t(Math.floor(nx / TS), Math.floor(ny / TS)); if (t === T.WATER || t === T.DEEP) { a.x = nx; a.y = ny; } else a.a += 2; }
      else if (a.k === 'bird') { a.x += 62 * dt; a.y -= 6 * dt; } }
    for (let i = Ent.foot.length - 1; i >= 0; i--) { Ent.foot[i].t += dt; if (Ent.foot[i].t > 7) Ent.foot.splice(i, 1); } if (Ent.foot.length > 40) Ent.foot.shift();
  }

  /* ---------- Общий цикл ---------- */
  Ent.update = dt => {
    const p = G.player, m = G.map;
    Player.update(dt);
    Ent.spawnT -= dt; if (Ent.spawnT <= 0) { Ent.spawnT = 1.4; spawner(); }
    for (const q of Ent.mobs) if (!q.dead && !q.gone) mobUpdate(q, dt);
    /* предметы */
    const drs = Ent.drops;
    for (let i = drs.length - 1; i >= 0; i--) { const d = drs[i]; d.t += dt; if (d.z > 0 || d.vz > 0) { d.z += d.vz * dt; d.vz -= 300 * dt; d.x += d.vx * dt; d.y += d.vy * dt; if (d.z <= 0) { d.z = 0; d.vz = 0; } } if (d.t > .45 && !p.dead) { const dx = p.x - d.x, dy = p.y - 6 - d.y, dist = Math.hypot(dx, dy); if (dist < 30) { d.x += dx / dist * 110 * dt; d.y += dy / dist * 110 * dt; } if (dist < 9) { let left; if (d.o) left = G.Inv.addItem(d.o) ? 0 : 1; else left = G.Inv.add(d.id, d.n); if (d.o && !left) G.UI.pickup(d.id, 1); if (left === 0) { drs.splice(i, 1); G.Audio.sfx('pickup'); } else { d.n = d.o ? 1 : left; d.t = -1.5; G.UI.toast('Инвентарь полон', 'ui_bag', 'bad', 1); } } } }
    /* снаряды */
    const pr = Ent.proj;
    for (let i = pr.length - 1; i >= 0; i--) { const q = pr[i]; q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; let hit = q.life <= 0;
      const t = m.t(Math.floor(q.x / TS), Math.floor(q.y / TS)); if (t === T.CLIFF || t === T.DWALL || t === T.VOID) hit = true; const ob = m.at(Math.floor(q.x / TS), Math.floor((q.y + 6) / TS)); if (ob && G.OBJ[ob.t].wall && !ob.open) hit = true;
      if (!hit && q.p) { for (const mb of Ent.mobs) { if (mb.dead) continue; if (Math.hypot(mb.x - q.x, mb.y - mb.def.h * .4 - q.y) < mb.def.r + 4) { const crit = Math.random() < .05 + G.Prog.rank('crit') * .06; Ent.hitMob(mb, q.dmg * (crit ? 1.9 : 1), q.vx / 200, q.vy / 200, crit); hit = true; break; } } }
      else if (!hit && !p.dead && Math.hypot(p.x - q.x, p.y - 9 - q.y) < 7) { Player.hurt(q.dmg, q.x - q.vx, q.y - q.vy); hit = true; }
      if (hit) { if (q.splash && q.p) { for (const mb of Ent.mobs) if (!mb.dead && Math.hypot(mb.x - q.x, mb.y - q.y) < q.splash + mb.def.r) Ent.hitMob(mb, q.dmg * .6, 0, 0, false); Ent.burst(q.x, q.y, ['#7ef0ff', '#ffffff'], 18, 90); } Ent.burst(q.x, q.y, PCOL[q.kind], 4, 40); pr.splice(i, 1); } else if (q.kind !== 'arrow' && Math.random() < .4) Ent.part(q.x, q.y, 0, 0, PCOL[q.kind], .25); }
    /* частицы */
    const ps = Ent.parts; for (let i = ps.length - 1; i >= 0; i--) { const q = ps[i]; q.t += dt; if (q.t >= q.life) { ps[i] = ps[ps.length - 1]; ps.pop(); continue; } q.vy += q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; }
    ambient(dt); G.Act.update(dt);
  };
  Ent.gather = R => {
    const p = G.player, x0 = R.cam.sx - 40, y0 = R.cam.sy - 40, x1 = x0 + R.vw + 80, y1 = y0 + R.vh + 100;
    if (!G.running || !p) return;
    R.push(p.y, Player.draw, p);
    if (!p.dead && (G.map.dark || G.Time.light() < .75)) R.light(p.x, p.y - 10, 34, '#8a94c8', .55);
    for (const m of Ent.mobs) if (!m.dead && !m.gone && m.x > x0 && m.x < x1 && m.y > y0 && m.y < y1) R.push(m.y + (m.def.fly ? 4 : 0), drawMob, m);
    for (const d of Ent.drops) if (d.x > x0 && d.x < x1 && d.y > y0 && d.y < y1) R.push(d.y, drawDrop, d);
    for (const q of Ent.proj) R.push(q.y + 8, drawProj, q);
  };
  Ent.over = (c, ox, oy, dt) => {
    const R = G.R; if (!G.running) return;
    /* следы — под всем остальным уже не нарисовать, поэтому рисуем полупрозрачно */
    for (const f of Ent.foot) { c.globalAlpha = Math.max(0, 1 - f.t / 7) * .8; const s = A.spr.foot; if (f.h) c.drawImage(s.c, 0, 0, 2, 3, Math.round(f.x - ox), Math.round(f.y - oy - 1), 3, 2); else c.drawImage(s.c, Math.round(f.x - ox - 2), Math.round(f.y - oy - 1)); } c.globalAlpha = 1;
    for (const q of Ent.parts) { const k = q.t / q.life; if (k > .7) c.globalAlpha = (1 - k) / .3; c.fillStyle = q.col; c.fillRect(Math.round(q.x - ox), Math.round(q.y - oy), q.s, q.s); c.globalAlpha = 1; }
    for (const a of Ent.amb) { const x = Math.round(a.x - ox), y = Math.round(a.y - oy), fade = Math.min(1, a.t * 2, (a.life - a.t) * 2);
      if (a.k === 'bfly') { c.globalAlpha = fade; c.drawImage(A.spr['bfly' + a.c + (Math.floor(a.t * 9) % 2)].c, x, y); c.globalAlpha = 1; }
      else if (a.k === 'fly') { const on = Math.sin(a.t * 3 + a.ph) > -.2; if (on) { c.fillStyle = '#e8ff8a'; c.fillRect(x, y, 1, 1); R.light(a.x, a.y, 14, '#d0f070', .6 * fade); } }
      else if (a.k === 'fish') { c.globalAlpha = fade * .8; c.save(); c.translate(x, y); c.rotate(a.a); c.drawImage(A.spr.fishsh.c, -5, -2); c.restore(); c.globalAlpha = 1; }
      else if (a.k === 'bird') { c.drawImage(A.spr.sh0.c, x, y + 50); c.drawImage(A.spr['birdfly' + (Math.floor(a.t * 7 + a.ph) % 2)].c, x, y); } }
    G.Build.draw(c, ox, oy);
  };
  Ent.reset = () => { Ent.mobs.length = 0; Ent.drops.length = 0; Ent.proj.length = 0; Ent.parts.length = 0; Ent.amb.length = 0; Ent.foot.length = 0; Ent.bossRef = null; for (const s of G.map.spawns) s.live = 0; };
})();
