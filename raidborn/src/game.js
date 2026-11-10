// Бой: герой, враги, снаряды, волны, арена против бота.
import * as gfx from './gfx.js';
import { WEAPONS, ENEMY, LOCS, enemyScale, levelWaves, L } from './data.js';
import { sfx } from './sfx.js';

export const input = { mx: 0, mz: 0, dash: false, sup: false };
export let B = null;
const HERO_SPEED = 5.3, DASH_CD = 2.6;
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const angTo = (a, b) => Math.atan2(b.x - a.x, b.z - a.z);
const angDiff = (a, b) => { let d = (a - b) % 6.2832; if (d > Math.PI) d -= 6.2832; if (d < -Math.PI) d += 6.2832; return Math.abs(d); };
const later = (t, fn) => B.timers.push({ t, fn });
const text = (e, s, color, size = 15) => B.texts.push({ x: e.x + (Math.random() - 0.5) * 0.5, y: 1.9 * (e.h || 1), z: e.z, s, color, life: 0.8, size });

function mkFighter(st, team, x, z, hpMul) {
  const w = WEAPONS[st.wtype], model = gfx.heroModel(st, team === 1);
  gfx.add(model);
  return { fighter: true, team, x, z, r: 0.5, h: 1, hp: st.hp * hpMul, maxHp: st.hp * hpMul, atk: st.atk, crit: st.crit, speed: HERO_SPEED * st.speed,
    leech: st.leech, chargeMul: st.charge, w, wtype: st.wtype, face: team ? 0 : Math.PI, model, cd: 0.4, atkT: 0, atkDur: 0.2, dashCd: 0, dashT: 0, dx: 0, dz: 0,
    inv: 0, sup: 0, supMax: w.charge, whirl: 0, whirlTick: 0, stun: 0, kx: 0, kz: 0, flashT: 0, alive: true, deadT: 0, name: st.name, moving: false, busy: 0 };
}
function mkEnemy(type, x, z) {
  const d = ENEMY[type], sc = enemyScale(B.lv), boss = type === 'boss', model = gfx.enemyModel(type, B.loc);
  model.position.set(x, 0, z); gfx.add(model);
  const e = { enemy: true, type, team: 1, x, z, r: d.r, h: boss ? 2.3 : type === 'brute' ? 1.55 : type === 'runner' ? 0.6 : 0.95,
    hp: d.hp * sc.hp, maxHp: d.hp * sc.hp, dmg: d.dmg * sc.dmg, speed: d.speed, face: 0, model, state: 'chase', st: 0, cd: 0.4 + Math.random() * 0.8,
    stun: 0, kx: 0, kz: 0, flashT: 0, alive: true, deadT: 0, moving: false, atkT: 0, atkDur: 0.25, boss, skillCd: 3.5, skillI: 0, strafe: Math.random() < 0.5 ? 1 : -1,
    name: boss ? LOCS[B.loc].boss : d.name };
  B.ents.push(e); return e;
}

export function startBattle(cfg) {
  const arena = cfg.mode === 'arena';
  const loc = arena ? cfg.loc : Math.floor(cfg.lv / 5), W = arena ? 12 : 13, D = arena ? 17 : 21;
  B = { mode: cfg.mode, lv: cfg.lv || 0, loc, W, D, ents: [], projs: [], timers: [], texts: [], picks: [], wave: -1, pending: 0, state: 'intro', st: 1.0, time: arena ? 75 : 0,
    hurt: 0, onEnd: cfg.onEnd, result: null, banner: null, bannerT: 0, kills: 0 };
  B.obst = gfx.buildArena(loc, arena ? 5000 + Math.floor(Math.random() * 50) : 300 + cfg.lv * 13, W, D, arena ? 4 : 5 + (cfg.lv % 3));
  B.waves = arena ? [] : levelWaves(cfg.lv);
  B.hero = mkFighter(cfg.hero, 0, 0, D * 0.3, arena ? 3 : 1); B.ents.push(B.hero);
  if (arena) {
    B.rival = mkFighter(cfg.rival, 1, 0, -D * 0.3, 3); B.rival.ai = { strafe: 1, t: 0, skill: cfg.rival.skill }; B.ents.push(B.rival);
    banner(L('БОЙ!', 'FIGHT!'));
  }
  input.mx = input.mz = 0; input.dash = input.sup = false;
  gfx.follow(B.hero.x, B.hero.z, 0, true, W, D);
  sync(0);
}
function banner(s) { B.banner = s; B.bannerT = 1.6; }

// ---------- Урон ----------
function damage(t, amt, src, o = {}) {
  if (!t.alive || t.inv > 0 || B.state === 'done') return false;
  let crit = false;
  if (src && src.crit && Math.random() < src.crit) { amt *= 2; crit = true; }
  amt = Math.max(1, Math.round(amt * (0.93 + Math.random() * 0.14)));
  t.hp -= amt; t.flashT = 0.09;
  text(t, (crit ? '★' : '') + amt, t === B.hero ? '#ff5a5a' : crit ? '#ffd23d' : '#ffffff', crit ? 21 : 15);
  if (src && src.leech && src.alive) src.hp = Math.min(src.maxHp, src.hp + amt * src.leech);
  if (o.knock && !t.boss) { const a = o.from ? angTo(o.from, t) : 0; t.kx += Math.sin(a) * o.knock; t.kz += Math.cos(a) * o.knock; }
  if (o.stun && !t.boss) t.stun = Math.max(t.stun, o.stun);
  if (t === B.hero) { B.hurt = 1; gfx.shake(0.3); sfx.hurt(); } else sfx.hit();
  if (t.hp <= 0) kill(t);
  return true;
}
function kill(e) {
  e.alive = false; e.hp = 0; e.deadT = 0.3;
  gfx.puff(e.x, 0.8 * e.h, e.z, e.fighter ? 0xffffff : LOCS[B.loc].enemy[0], e.boss ? 26 : 9, e.boss ? 6 : 3);
  if (e.boss) { gfx.shake(0.9); gfx.burst(e.x, e.z, 5, 0xffd23d, 0.6); }
  sfx.die();
  if (e.enemy) {
    B.kills++;
    if (!e.boss && Math.random() < 0.09 && B.hero.hp < B.hero.maxHp) {
      const m = gfx.projectile('heart', 0xff4d6d); m.scale.setScalar(0.28); B.picks.push({ x: e.x, z: e.z, m, t: 0 });
    }
  }
  if (e === B.hero) finish(false);
  if (e === B.rival) finish(true);
}
function finish(win) {
  if (B.state === 'done') return;
  B.state = 'done'; banner(win ? L('ПОБЕДА!', 'VICTORY!') : L('ПОРАЖЕНИЕ', 'DEFEAT'));
  const p = B.hero.hp / B.hero.maxHp;
  B.result = { win, stars: win ? (p >= 0.6 ? 3 : p >= 0.3 ? 2 : 1) : 0, mode: B.mode, lv: B.lv };
  win ? sfx.win() : sfx.lose();
  for (const e of B.ents) if (e.enemy && e.alive && win) kill(e);
  later(1.7, () => B.onEnd(B.result));
}
function foes(f) { return B.ents.filter(e => e.alive && e.team !== f.team); }
function charge(f, n = 1) { f.sup = Math.min(f.supMax, f.sup + n * f.chargeMul); }

// ---------- Атаки героя ----------
function shoot(f, a, kind, dmg, o = {}) {
  const w = f.w, sp = o.speed || w.speed || 10, col = f.team ? 0xff6b6b : kind === 'orb' ? 0x7fe3ff : 0xfff2a8;
  const m = gfx.projectile(kind, col);
  B.projs.push({ x: f.x + Math.sin(a) * 0.6, z: f.z + Math.cos(a) * 0.6, vx: Math.sin(a) * sp, vz: Math.cos(a) * sp, a, dmg, team: f.team, owner: f,
    kind, pierce: o.pierce || (kind === 'arrow' ? 2 : 1), hit: new Set(), life: (o.range || w.range) / sp * 1.15, radius: o.radius || w.radius || 0, m, r: 0.35, charged: false });
}
function attack(f, t) {
  const w = f.w, a = f.face, dmg = f.atk * w.dmg;
  f.cd = w.cd; f.atkDur = Math.min(0.24, w.cd * 0.7); f.atkT = f.atkDur;
  if (w.kind === 'arc') {
    let any = false;
    for (const e of foes(f)) if (dist(f, e) <= w.range + e.r && (angDiff(angTo(f, e), a) <= w.arc / 2 || dist(f, e) < e.r + 0.7)) any = damage(e, dmg, f, { knock: 2.5, from: f }) || any;
    gfx.slash(f.x, f.z, a, w.range, w.arc, f.team ? 0xff8a8a : 0xffffff); sfx.swing();
    if (any) charge(f);
  } else if (w.kind === 'slam') {
    const x = f.x + Math.sin(a) * 1.3, z = f.z + Math.cos(a) * 1.3; f.busy = 0.2;
    later(0.16, () => {
      if (!f.alive) return; let any = false;
      for (const e of foes(f)) if (Math.hypot(e.x - x, e.z - z) <= w.radius + e.r * 0.6) any = damage(e, dmg, f, { knock: 7, from: f }) || any;
      gfx.burst(x, z, w.radius, f.team ? 0xff8a8a : 0xffd23d); gfx.shake(0.2); sfx.slam(); if (any) charge(f);
    });
  } else if (w.kind === 'shot') { shoot(f, angTo(f, t), 'arrow', dmg); sfx.shoot(); }
  else { shoot(f, angTo(f, t), 'orb', dmg); sfx.cast(); }
}
function superMove(f, t) {
  f.sup = 0; sfx.sup(); banner2(f);
  const wt = f.wtype, list = foes(f);
  if (wt === 'sword') { f.whirl = 1.4; f.whirlTick = 0; }
  else if (wt === 'daggers') {
    const near = list.filter(e => dist(f, e) < 9).sort((p, q) => dist(f, p) - dist(f, q)).slice(0, 5);
    if (!near.length) { f.sup = f.supMax; return; }
    const hits = near.length === 1 ? 3 : Math.max(near.length, 4);
    f.inv = hits * 0.09 + 0.35; f.busy = hits * 0.09;
    for (let i = 0; i < hits; i++) later(i * 0.09, () => {
      const e = near[i % near.length]; if (!e.alive || !f.alive) return;
      const a = Math.random() * 6.283; gfx.puff(f.x, 0.8, f.z, 0x8a5cff, 4, 2);
      f.x = e.x + Math.sin(a) * (e.r + 0.7); f.z = e.z + Math.cos(a) * (e.r + 0.7); f.face = angTo(f, e); f.atkT = f.atkDur = 0.09;
      gfx.slash(f.x, f.z, f.face, 2.2, 2.4, 0xb98cff); damage(e, f.atk * 2.0, f);
    });
  } else if (wt === 'hammer') {
    f.busy = 0.3; f.atkT = f.atkDur = 0.3;
    later(0.25, () => {
      if (!f.alive) return; gfx.burst(f.x, f.z, 4.6, 0xffd23d, 0.5); gfx.shake(0.7); sfx.slam();
      for (const e of foes(f)) if (dist(f, e) <= 4.6 + e.r * 0.6) damage(e, f.atk * 3.6, f, { knock: 9, from: f, stun: 1.6 });
    });
  } else if (wt === 'bow') {
    const a0 = t ? angTo(f, t) : f.face;
    for (let v = 0; v < 3; v++) later(v * 0.14, () => { if (!f.alive) return; sfx.shoot(); for (let i = -3; i <= 3; i++) shoot(f, a0 + i * 0.16, 'arrow', f.atk * 0.85, { pierce: 3, range: 10 }); });
  } else {
    const x = t ? t.x : f.x + Math.sin(f.face) * 5, z = t ? t.z : f.z + Math.cos(f.face) * 5;
    gfx.telegraph(x, z, 3.4, 0.55, f.team ? 0xff3b3b : 0x4fc3ff); gfx.meteor(x, z, 0.55);
    later(0.55, () => {
      gfx.burst(x, z, 3.6, 0xff8a2a, 0.5); gfx.shake(0.8); sfx.slam();
      for (const e of foes(f)) if (Math.hypot(e.x - x, e.z - z) <= 3.4 + e.r * 0.6) damage(e, f.atk * 5, f, { knock: 6, from: { x, z } });
    });
  }
}
function banner2(f) { text(f, f.w.sup + '!', f.team ? '#ff8a8a' : '#7fe3ff', 19); }

function fighterUpdate(f, inp, dt) {
  f.cd -= dt; f.dashCd -= dt; if (f.atkT > 0) f.atkT -= dt; if (f.inv > 0) f.inv -= dt; if (f.busy > 0) f.busy -= dt;
  f.moving = false;
  if (f.stun > 0) { f.stun -= dt; return; }
  const list = foes(f); let t = null, best = 1e9;
  for (const e of list) { const d = dist(f, e) - e.r; if (d < best) { best = d; t = e; } }
  const ml = Math.hypot(inp.mx, inp.mz);
  if (f.dashT > 0) { f.dashT -= dt; f.x += f.dx * 17 * dt; f.z += f.dz * 17 * dt; f.moving = true; return; }
  if (inp.dash && f.dashCd <= 0 && f.busy <= 0) {
    const a = ml > 0.15 ? Math.atan2(inp.mx, inp.mz) : f.face;
    f.dx = Math.sin(a); f.dz = Math.cos(a); f.dashT = 0.2; f.dashCd = DASH_CD; f.inv = Math.max(f.inv, 0.32);
    gfx.puff(f.x, 0.3, f.z, 0xffffff, 5, 2); sfx.dash();
  }
  if (ml > 0.15 && f.busy <= 0) {
    const k = Math.min(1, ml) / ml * f.speed * (f.whirl > 0 ? 1.15 : 1);
    f.x += inp.mx * k * dt; f.z += inp.mz * k * dt; f.moving = true; f.face = Math.atan2(inp.mx, inp.mz);
  }
  if (f.whirl > 0) {
    f.whirl -= dt; f.whirlTick -= dt; f.face += dt * 22; f.atkT = f.atkDur = 0.1;
    if (f.whirlTick <= 0) {
      f.whirlTick = 0.2; gfx.slash(f.x, f.z, f.face, 3.3, 6.28, f.team ? 0xff8a8a : 0x9fe8ff);
      for (const e of list) if (dist(f, e) <= 3.3 + e.r) damage(e, f.atk * 0.95, f, { knock: 2, from: f });
    }
    return;
  }
  if (t && best <= f.w.range + 0.25) {
    f.face = angTo(f, t);
    if (f.cd <= 0 && f.busy <= 0) attack(f, t);
  }
  if (inp.sup && f.sup >= f.supMax && f.busy <= 0) superMove(f, t && best < 11 ? t : null);
}
function rivalInput(f, dt) {
  const h = B.hero, ai = f.ai, out = { mx: 0, mz: 0, dash: false, sup: false };
  if (!h.alive) return out;
  ai.t -= dt; if (ai.t <= 0) { ai.t = 0.7 + Math.random() * 1.3; ai.strafe = Math.random() < 0.5 ? 1 : -1; ai.mood = Math.random(); }
  const d = dist(f, h), a = angTo(f, h), ranged = f.w.range > 4, want = ranged ? f.w.range * 0.75 : f.w.range * 0.7;
  let fw = d > want + 0.4 ? 1 : d < want - (ranged ? 1.5 : 0.6) ? -1 : 0;
  if (!ranged && f.hp / f.maxHp < 0.25 && ai.mood < 0.4) fw = -1;
  const sx = Math.cos(a) * ai.strafe, sz = -Math.sin(a) * ai.strafe, sk = fw === 0 ? 1 : 0.55;
  out.mx = Math.sin(a) * fw + sx * sk; out.mz = Math.cos(a) * fw + sz * sk;
  if (f.dashCd <= 0 && Math.random() < dt * (0.25 + ai.skill * 0.5) && ((!ranged && d > 4.5) || (ranged && d < 3) || h.whirl > 0)) out.dash = true;
  if (f.sup >= f.supMax && d < (ranged ? 8 : 3.4) && Math.random() < dt * (1 + ai.skill * 3)) out.sup = true;
  return out;
}

// ---------- Враги ----------
function step(e, a, sp, dt) { e.x += Math.sin(a) * sp * dt; e.z += Math.cos(a) * sp * dt; e.moving = true; }
function hitHero(x, z, radius, dmg, src) {
  const h = B.hero; if (h.alive && Math.hypot(h.x - x, h.z - z) <= radius + h.r * 0.4) damage(h, dmg, null, { knock: 4, from: src || { x, z } });
}
function enemyShot(e, a, sp = 8.5, dmg = e.dmg) {
  const m = gfx.projectile('ball', 0xff5a3d);
  B.projs.push({ x: e.x + Math.sin(a) * e.r, z: e.z + Math.cos(a) * e.r, vx: Math.sin(a) * sp, vz: Math.cos(a) * sp, a, dmg, team: 1, owner: null, kind: 'ball', pierce: 1, hit: new Set(), life: 2.6, radius: 0, m, r: 0.3 });
}
function spawn(type, x, z, delay = 0.7) {
  B.pending++; gfx.portal(x, z, delay, 0xff5ad1);
  later(delay, () => { B.pending--; if (B.state !== 'done') { mkEnemy(type, x, z); gfx.puff(x, 0.5, z, 0xff5ad1, 5, 2); } });
}
function freeSpot(minHero) {
  for (let i = 0; i < 40; i++) {
    const x = (Math.random() - 0.5) * (B.W - 2), z = (Math.random() - 0.5) * (B.D - 2) - B.D * 0.08;
    if (Math.hypot(x - B.hero.x, z - B.hero.z) < minHero) continue;
    if (B.obst.some(o => Math.hypot(o.x - x, o.z - z) < o.r + 0.8)) continue;
    return [x, z];
  }
  return [0, -B.D / 2 + 2];
}
function enemyUpdate(e, dt) {
  const h = B.hero, d = ENEMY[e.type]; e.moving = false; if (e.atkT > 0) e.atkT -= dt;
  if (e.stun > 0) { e.stun -= dt; return; }
  if (!h.alive) return;
  const ds = dist(e, h), a = angTo(e, h); e.cd -= dt;
  if (e.state === 'wind') {
    e.st -= dt;
    if (e.st <= 0) {
      e.state = 'chase'; e.cd = d.rest * (0.85 + Math.random() * 0.3); e.atkT = e.atkDur = 0.22;
      if (e.type === 'grunt' || e.type === 'runner') { if (ds <= e.r + h.r + 1.0) damage(h, e.dmg, null, { knock: 3, from: e }); sfx.swing(); }
      else if (e.type === 'archer') { enemyShot(e, e.face); sfx.shoot(); }
      else if (e.type === 'bomber') { gfx.burst(e.x, e.z, 2.4, 0xff8a2a); gfx.shake(0.4); sfx.slam(); hitHero(e.x, e.z, 2.3, e.dmg, e); e.hp = 0; kill(e); }
    }
    if (e.type === 'bomber') { e.model.userData.fuseMat.color.setHex(Math.sin(e.st * 40) > 0 ? 0xff3b3b : 0x2c2c38); e.model.scale.setScalar(1 + (0.75 - e.st) * 0.4); }
    return;
  }
  if (e.state === 'dash') { // рывок босса
    e.st -= dt; step(e, e.face, 30, dt);
    if (!e.hitDone && ds < e.r + 1.1) { e.hitDone = true; damage(h, e.dmg * 1.4, null, { knock: 9, from: e }); }
    if (e.st <= 0) e.state = 'chase';
    return;
  }
  e.face = a;
  const reach = e.r + h.r + 0.45;
  if (e.boss) {
    e.skillCd -= dt;
    if (e.skillCd <= 0) {
      const skills = LOCS[B.loc].bossSkills.filter(s => s !== 'slam'), sk = skills[e.skillI++ % skills.length];
      e.skillCd = e.hp < e.maxHp * 0.5 ? 4.2 : 5.6;
      if (sk === 'ring') {
        e.state = 'wind'; e.st = 0.9; e.cd = 1;
        for (let k = 0; k < 2; k++) later(0.5 + k * 0.45, () => { if (!e.alive) return; sfx.cast(); for (let i = 0; i < 14; i++) enemyShot(e, i / 14 * 6.283 + k * 0.22, 6.5, e.dmg * 0.6); });
      } else if (sk === 'charge') {
        e.state = 'wind'; e.st = 0.95; gfx.lineTelegraph(e.x, e.z, a, 11, 2.6, 0.95); e.face = a;
        later(0.95, () => { if (e.alive) { e.state = 'dash'; e.st = 0.36; e.hitDone = false; sfx.dash(); } });
        e.st = 5; // состояние сменит таймер выше
      } else if (sk === 'summon') {
        e.state = 'wind'; e.st = 0.7;
        for (let i = 0; i < 3; i++) { const an = i / 3 * 6.283 + Math.random(); spawn(B.lv >= 9 ? 'grunt' : 'runner', clampX(e.x + Math.sin(an) * 3), clampZ(e.z + Math.cos(an) * 3)); }
      } else {
        e.state = 'wind'; e.st = 0.8;
        for (let i = 0; i < 5; i++) {
          const x = clampX(h.x + (i ? (Math.random() - 0.5) * 7 : 0)), z = clampZ(h.z + (i ? (Math.random() - 0.5) * 7 : 0)), t = 0.9 + i * 0.12;
          gfx.telegraph(x, z, 1.8, t); later(t, () => { gfx.burst(x, z, 1.9, 0xff5ad1); hitHero(x, z, 1.8, e.dmg * 0.9); });
        }
      }
      return;
    }
  }
  if (e.type === 'archer' || e.type === 'shaman') {
    const want = e.type === 'archer' ? 6 : 7;
    if (ds > want + 1.5) step(e, a, e.speed, dt);
    else if (ds < want - 2.5) step(e, a + Math.PI, e.speed * 0.9, dt);
    else step(e, a + Math.PI / 2 * e.strafe, e.speed * 0.5, dt);
    if (e.cd <= 0 && ds < 10.5) {
      if (e.type === 'archer') { e.state = 'wind'; e.st = d.wind; }
      else {
        e.cd = d.rest; e.atkT = e.atkDur = 0.3; const x = h.x, z = h.z; sfx.cast();
        gfx.telegraph(x, z, 1.8, d.wind); later(d.wind, () => { gfx.burst(x, z, 1.9, 0xff5ad1); hitHero(x, z, 1.8, e.dmg); });
      }
    }
    return;
  }
  if (ds > reach) { step(e, a, e.speed, dt); return; }
  if (e.cd > 0) return;
  if (e.type === 'brute' || e.boss) {
    const rad = e.boss ? 3.1 : 2.1, x = e.x + Math.sin(a) * e.r * 0.8, z = e.z + Math.cos(a) * e.r * 0.8, dm = e.dmg;
    gfx.telegraph(x, z, rad, d.wind); e.state = 'wind'; e.st = d.wind;
    later(d.wind, () => { if (!e.alive) return; gfx.burst(x, z, rad, 0xff5a3d); gfx.shake(0.4); sfx.slam(); hitHero(x, z, rad, dm, e); });
  } else {
    e.state = 'wind'; e.st = d.wind;
    if (e.type === 'bomber') gfx.telegraph(e.x, e.z, 2.3, d.wind);
  }
}
const clampX = x => Math.max(-B.W / 2 + 1, Math.min(B.W / 2 - 1, x));
const clampZ = z => Math.max(-B.D / 2 + 1, Math.min(B.D / 2 - 1, z));

// ---------- Общий шаг ----------
function collide() {
  const E = B.ents;
  for (let i = 0; i < E.length; i++) {
    const a = E[i]; if (!a.alive) continue;
    a.x += a.kx * 0.016; a.z += a.kz * 0.016; a.kx *= 0.86; a.kz *= 0.86;
    for (let j = i + 1; j < E.length; j++) {
      const b = E[j]; if (!b.alive || a.dashT > 0 || b.dashT > 0 || a.state === 'dash' || b.state === 'dash') continue;
      const dx = b.x - a.x, dz = b.z - a.z, m = a.r + b.r, d2 = dx * dx + dz * dz;
      if (d2 >= m * m || d2 === 0) continue;
      const d = Math.sqrt(d2), ov = m - d, wa = b.r * b.r, wb = a.r * a.r, t = wa + wb;
      a.x -= dx / d * ov * wa / t; a.z -= dz / d * ov * wa / t; b.x += dx / d * ov * wb / t; b.z += dz / d * ov * wb / t;
    }
    for (const o of B.obst) {
      const dx = a.x - o.x, dz = a.z - o.z, m = a.r + o.r, d = Math.hypot(dx, dz);
      if (d < m && d > 0) { a.x = o.x + dx / d * m; a.z = o.z + dz / d * m; }
    }
    a.x = Math.max(-B.W / 2 + a.r, Math.min(B.W / 2 - a.r, a.x)); a.z = Math.max(-B.D / 2 + a.r, Math.min(B.D / 2 - a.r, a.z));
  }
}
function projectiles(dt) {
  for (let i = B.projs.length; i--;) {
    const p = B.projs[i]; p.life -= dt; p.x += p.vx * dt; p.z += p.vz * dt;
    let dead = p.life <= 0 || Math.abs(p.x) > B.W / 2 || Math.abs(p.z) > B.D / 2 || B.obst.some(o => Math.hypot(o.x - p.x, o.z - p.z) < o.r);
    if (!dead) for (const e of B.ents) {
      if (!e.alive || e.team === p.team || p.hit.has(e) || Math.hypot(e.x - p.x, e.z - p.z) > e.r + p.r) continue;
      if (e.inv > 0) continue;
      p.hit.add(e);
      if (p.kind === 'orb') { dead = true; break; }
      damage(e, p.dmg, p.owner, { knock: 2, from: { x: p.x - p.vx, z: p.z - p.vz } });
      if (p.owner && !p.charged) { p.charged = true; charge(p.owner); }
      if (--p.pierce <= 0) { dead = true; break; }
    }
    if (dead) {
      if (p.kind === 'orb') {
        gfx.burst(p.x, p.z, p.radius, p.team ? 0xff6b6b : 0x7fe3ff); let any = false;
        for (const e of B.ents) if (e.alive && e.team !== p.team && Math.hypot(e.x - p.x, e.z - p.z) <= p.radius + e.r * 0.6) any = damage(e, p.dmg, p.owner, { knock: 3, from: p }) || any;
        if (any && p.owner) charge(p.owner);
      }
      gfx.removeProj(p.m); B.projs.splice(i, 1); continue;
    }
    p.m.position.set(p.x, 0.9, p.z); p.m.rotation.y = p.a;
  }
}
function sync(dt) {
  for (let i = B.ents.length; i--;) {
    const e = B.ents[i], m = e.model;
    if (!e.alive) {
      e.deadT -= dt; m.scale.multiplyScalar(Math.max(0, 1 - dt * 7));
      if (e.deadT <= 0 && !e.fighter) { gfx.remove(m); B.ents.splice(i, 1); }
      else if (e.deadT <= 0) m.visible = false;
      continue;
    }
    m.position.set(e.x, 0, e.z);
    let d = e.face - m.rotation.y; while (d > Math.PI) d -= 6.2832; while (d < -Math.PI) d += 6.2832;
    m.rotation.y += d * Math.min(1, dt * 18 + (dt === 0 ? 1 : 0));
    gfx.animate(m, dt, e.moving, e.atkT, e.atkDur);
    if (e.flashT > 0) { if (!e.flashOn) { gfx.flash(m, true); e.flashOn = true; } e.flashT -= dt; }
    else if (e.flashOn) { gfx.flash(m, false); e.flashOn = false; }
  }
}
export function update(dt) {
  if (!B) return;
  for (let i = B.timers.length; i--;) { const t = B.timers[i]; t.t -= dt; if (t.t <= 0) { B.timers.splice(i, 1); t.fn(); } }
  if (B.bannerT > 0) B.bannerT -= dt;
  if (B.hurt > 0) B.hurt = Math.max(0, B.hurt - dt * 2.5);
  for (let i = B.texts.length; i--;) { const t = B.texts[i]; t.life -= dt; t.y += dt * 1.6; if (t.life <= 0) B.texts.splice(i, 1); }
  if (B.state === 'intro') { B.st -= dt; if (B.st <= 0) { B.state = 'fight'; if (B.mode === 'level') nextWave(); } }
  else if (B.state === 'between') { B.st -= dt; if (B.st <= 0) { B.state = 'fight'; nextWave(); } }
  if (B.state === 'fight' || B.state === 'between') {
    const h = B.hero;
    if (h.alive) fighterUpdate(h, input, dt);
    input.dash = input.sup = false;
    if (B.rival && B.rival.alive && B.state === 'fight') fighterUpdate(B.rival, rivalInput(B.rival, dt), dt);
    for (const e of B.ents) if (e.enemy && e.alive) enemyUpdate(e, dt);
    collide(); projectiles(dt);
    for (let i = B.picks.length; i--;) {
      const p = B.picks[i]; p.t += dt; p.m.position.set(p.x, 0.5 + Math.sin(p.t * 5) * 0.12, p.z);
      if (h.alive && Math.hypot(h.x - p.x, h.z - p.z) < 1.1) {
        const v = Math.round(h.maxHp * 0.14); h.hp = Math.min(h.maxHp, h.hp + v); text(h, '+' + v, '#6dff8a', 17); sfx.coin();
        gfx.removeProj(p.m); B.picks.splice(i, 1);
      } else if (p.t > 12) { gfx.removeProj(p.m); B.picks.splice(i, 1); }
    }
    if (B.mode === 'level' && B.state === 'fight' && B.pending === 0 && B.wave >= 0 && !B.ents.some(e => e.enemy && e.alive)) {
      if (B.wave + 1 >= B.waves.length) finish(true);
      else { B.state = 'between'; B.st = 1.3; const v = Math.round(h.maxHp * 0.1); h.hp = Math.min(h.maxHp, h.hp + v); text(h, '+' + v, '#6dff8a', 17); }
    }
    if (B.mode === 'arena' && B.state === 'fight') {
      B.time -= dt;
      if (B.time <= 0) { B.time = 0; finish(B.hero.hp / B.hero.maxHp >= B.rival.hp / B.rival.maxHp); }
    }
  }
  sync(dt);
  gfx.follow(B.hero.x, B.hero.z, dt, false, B.W, B.D);
}
function nextWave() {
  B.wave++; const list = B.waves[B.wave], boss = list.includes('boss');
  banner(boss ? LOCS[B.loc].boss + '!' : L('Волна ', 'Wave ') + (B.wave + 1) + '/' + B.waves.length);
  if (boss) sfx.boss();
  list.forEach((t, i) => { const [x, z] = t === 'boss' ? [0, -B.D / 2 + 4] : freeSpot(5.5); spawn(t, x, z, 0.7 + i * 0.12); });
}
export function endBattle() { B = null; }
