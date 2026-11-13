'use strict';
/* UI Manager: HUD, окна (инвентарь, сундук, крафт, карта, задания, навыки, настройки), меню, уведомления. */
(() => {
  const IT = G.ITEMS, bus = G.bus, $ = G.$, el = G.el;
  const UI = G.UI = { win: null, arg: null, sel: -1, tab: 'all', rsel: null, rtab: 'tools', btab: 'base', qsel: null };
  const urls = {};
  const icon = id => { let u = urls[id]; if (!u) { const c = G.Art.iconCv[id]; u = urls[id] = c ? c.toDataURL() : ''; } return '<i class="ic" style="background-image:url(' + u + ')"></i>'; };
  UI.icon = icon;
  const nm = id => IT[id] ? IT[id].name : id;

  /* ---------- уведомления ---------- */
  const recent = {};
  UI.toast = (txt, ic, kind, quiet) => {
    const t = performance.now(); if (recent[txt] && t - recent[txt] < (quiet ? 1500 : 800)) return; recent[txt] = t;
    const box = $('toasts'); while (box.children.length > 2) box.firstChild.remove();
    const d = el('div', 'toast' + (kind ? ' ' + kind : ''), (ic ? icon(ic) : '') + '<span>' + txt + '</span>'); box.appendChild(d);
    setTimeout(() => d.remove(), quiet ? 1700 : 2800); if (kind === 'bad' && !quiet) G.Audio.sfx('deny');
  };
  const picks = {};
  UI.pickup = (id, n) => {
    const box = $('picks'); let p = picks[id];
    if (p && p.el.isConnected) { p.n += n; clearTimeout(p.t); } else { p = picks[id] = { n, el: el('div', 'pick') }; box.appendChild(p.el); while (box.children.length > 5) box.firstChild.remove(); }
    p.el.innerHTML = icon(id) + nm(id) + ' <b>+' + p.n + '</b>'; p.t = setTimeout(() => { p.el.remove(); delete picks[id]; }, 2200);
  };
  let bannerT = 0;
  UI.banner = (t, s) => { const b = $('banner'); b.innerHTML = '<h1>' + t + '</h1>' + (s ? '<p>' + s + '</p>' : ''); b.style.opacity = 1; clearTimeout(bannerT); bannerT = setTimeout(() => { b.style.opacity = 0; }, 3200); };
  UI.hurt = () => { const h = $('hurt'); h.style.transition = 'none'; h.style.opacity = .9; requestAnimationFrame(() => { h.style.transition = 'opacity .5s'; h.style.opacity = 0; }); };
  UI.saved = () => { const s = $('saved'); s.style.opacity = 1; setTimeout(() => { s.style.opacity = 0; }, 1300); };
  UI.fade = fn => { const f = $('fade'); f.classList.add('on'); setTimeout(() => { fn(); setTimeout(() => f.classList.remove('on'), 120); }, 460); };

  /* ---------- HUD ---------- */
  const BARS = [['hp', 'ui_heart', '#e8484e'], ['hunger', 'ui_food', '#e8923a'], ['thirst', 'ui_water', '#4aa8e8'], ['stam', 'ui_stam', '#f2c232'], ['temp', 'ui_temp', null]];
  UI.init = () => {
    $('bars').innerHTML = BARS.map(([k, ic, c]) => '<div class="bar" id="bar-' + k + '">' + icon(ic) + '<div class="tr' + (c ? '' : ' temp') + '">' + (c ? '<div class="fl" style="background:' + c + '"></div>' : '<div class="mk"></div>') + '</div></div>').join('') + '<div id="xpbar"><i></i></div><div id="lvl"></div>';
    const tb = [['craft', 'ui_craft', 'Крафт (C)'], ['build', 'ui_build', 'Стройка (B)'], ['inv', 'ui_bag', 'Инвентарь (I)'], ['quests', 'ui_quest', 'Задания (J)'], ['skills', 'ui_skill', 'Навыки (N)'], ['map', 'ui_map', 'Карта (M)'], ['settings', 'ui_cog', 'Настройки (Esc)']];
    $('topbtns').innerHTML = tb.map(([k, ic, t]) => '<button class="btn" id="tb-' + k + '" title="' + t + '">' + icon(ic) + '</button>').join('');
    for (const [k] of tb) $('tb-' + k).onclick = () => { G.Audio.unlock(); G.Audio.sfx('ui'); if (k === 'build') { G.Build.on ? G.Build.exit() : G.Build.start(); } else UI.open(k); };
    $('keys').innerHTML = [['ЛКМ', 'атака'], ['ПКМ', 'блок'], ['Пробел', 'рывок'], ['Shift', 'бег'], ['E', 'действие'], ['Q', 'применить']].map(([k, t]) => '<span><kbd>' + k + '</kbd>' + t + '</span>').join('');
    $('qtrack').onclick = () => $('qtrack').classList.toggle('open');
    bus.on('inv', () => { G.invVer = (G.invVer || 0) + 1; UI.hotbar(); if (UI.win === 'inv' || UI.win === 'chest') UI.refresh(); if (UI.win === 'craft') UI.refresh(); if (G.Build.on) UI.buildBar(true); });
    bus.on('quest', UI.track); bus.on('xp', UI.xp); bus.on('level', () => { UI.xp(); UI.dots(); }); bus.on('skill', UI.dots);
    bus.on('craftq', UI.cq); bus.on('target', UI.target); bus.on('buildmode', () => UI.buildBar(G.Build.on));
    UI.hotbar(); UI.xp(); UI.track(); UI.dots();
  };
  const tip = id => { const it = IT[id]; return it ? it.name : ''; };
  UI.hotbar = () => {
    const h = $('hotbar'); if (!h) return; let s = '';
    for (let i = 0; i < 8; i++) { const it = G.inv.slots[i]; s += '<div class="slot' + (i === G.inv.sel ? ' sel' : '') + '" data-i="' + i + '"><span class="k">' + (i + 1) + '</span>' + slotInner(it) + '</div>'; }
    h.innerHTML = s;
    h.querySelectorAll('.slot').forEach(e => { e.onpointerdown = ev => { ev.preventDefault(); const i = +e.dataset.i; if (G.inv.sel === i && G.inv.slots[i]) { const it = IT[G.inv.slots[i].id]; if (it.food || it.equip || it.place) { G.Act.use(); return; } } G.inv.sel = i; G.Audio.sfx('ui'); UI.hotbar(); }; });
    const cur = G.inv.slots[G.inv.sel]; $('selname').textContent = cur ? tip(cur.id) : '';
  };
  const slotInner = it => { if (!it) return ''; const d = IT[it.id]; let s = icon(it.id); if (it.n > 1) s += '<span class="n">' + it.n + '</span>'; if (d.dur && it.d != null && !d.charges) s += '<div class="du"><i style="width:' + Math.round(it.d / d.dur * 100) + '%;background:' + (it.d / d.dur < .25 ? '#e8484e' : '#7bd05a') + '"></i></div>'; if (d.charges) s += '<div class="du"><i style="width:' + Math.round((it.d || 0) / 8 * 100) + '%;background:#5aa8e8"></i></div>'; return s; };
  UI.xp = () => { const S = G.S; if (!S) return; $('xpbar').firstChild.style.width = (S.xp / G.Prog.need(S.lvl) * 100) + '%'; $('lvl').textContent = 'Ур. ' + S.lvl + (S.sp ? '  · очки навыков: ' + S.sp : ''); };
  UI.dots = () => { const b = $('tb-skills'); if (!b) return; const d = b.querySelector('.dot'); if (G.S.sp > 0 && !d) b.appendChild(el('i', 'dot')); else if (!G.S.sp && d) d.remove(); };
  UI.track = () => {
    const q = G.Quest.tracked(), box = $('qtrack'); if (!q) { box.classList.add('hidden'); return; }
    const pr = G.S.quests.active[q.id]; box.classList.remove('hidden');
    box.innerHTML = '<b>' + q.n + '</b>' + q.goals.map((g, i) => '<div class="g' + (pr[i] >= g.n ? ' ok' : '') + '"><span>' + g.txt + '</span><span>' + Math.floor(Math.min(pr[i], g.n)) + '/' + g.n + '</span></div>').join('') + (q.hint ? '<div class="hint">' + q.hint + '</div>' : '');
    if (q.story && G.S.quests.done.length < 4) box.classList.add('open');
  };
  UI.target = o => {
    const pr = $('prompt');
    if (o) { const d = G.OBJ[o.t]; let lab = d.label || (d.pick ? 'Собрать' : ''); if (o.t === 'door' || o.t === 'fgate') lab = o.open ? 'Закрыть' : 'Открыть'; if (o.t === 'plot') lab = o.crop ? (o.g >= G.CROPS[o.crop].time ? 'Собрать' : 'Грядка') : 'Посадить'; pr.innerHTML = '<kbd>E</kbd>' + lab + (d.n ? ' <small>' + d.n + '</small>' : ''); pr.classList.remove('hidden'); }
    else pr.classList.add('hidden');
  };
  UI.cq = () => { const q = G.Craft.queue, box = $('craftq'); box.innerHTML = q.map((c, i) => '<div class="slot">' + icon(c.r.out) + (c.r.n > 1 ? '<span class="n">' + c.r.n + '</span>' : '') + (i === 0 ? '<div class="pg" style="width:0"></div>' : '') + '</div>').join(''); };
  let hudT = 0;
  UI.update = dt => {
    const p = G.player; if (!p) return; hudT -= dt;
    const tg = p.target, pr = $('prompt'); if (tg && !pr.classList.contains('hidden')) { const R = G.R, r = R.cv.getBoundingClientRect(), d = G.OBJ[tg.t], sz = d.size || [1, 1], s = G.Art.spr[d.s[0]], top = (tg.y + sz[1]) * 16 - (s && !d.flat ? s.h : 16) - 4; pr.style.left = ((tg.x + sz[0] / 2) * 16 - R.cam.sx) / R.vw * r.width + 'px'; pr.style.top = (top - R.cam.sy) / R.vh * r.height + 'px'; }
    const mh = G.Prog.maxHp(), set = (k, v, max) => { const b = $('bar-' + k); b.querySelector('.fl').style.width = G.clamp(v / max * 100, 0, 100) + '%'; b.classList.toggle('low', v / max < .2); };
    set('hp', p.hp, mh); set('hunger', p.hunger, 100); set('thirst', p.thirst, 100); set('stam', p.stam, 100);
    const tb = $('bar-temp'); tb.querySelector('.mk').style.left = G.clamp(p.temp, 0, 100) + '%'; tb.classList.toggle('low', p.temp < 22 || p.temp > 85);
    const q = G.Craft.queue; if (q.length) { const pg = $('craftq').querySelector('.pg'); if (pg) pg.style.width = (q[0].t / q[0].r.time * 100) + '%'; }
    const B = G.Ent.bossRef, bb = $('bossbar'); if (B && !B.dead) { bb.classList.remove('hidden'); bb.querySelector('.nm').textContent = B.def.n; bb.querySelector('i').style.width = (B.hp / B.def.hp * 100) + '%'; } else bb.classList.add('hidden');
    if (hudT <= 0) { hudT = .5; $('clock').innerHTML = icon(G.Weather.icon()) + '<span>' + G.Time.clockStr() + '</span><small>День ' + (G.time.day + 1) + ' · ' + G.Time.phase() + ' · ' + G.Weather.name() + '</small>'; if (G.player.state === 'sleep') $('sleepo') && ($('sleepo').querySelector('span').textContent = G.Time.clockStr()); }
    if (UI.win === 'map') UI.drawMap();
  };

  /* ---------- окна ---------- */
  const layer = $('layer');
  UI.close = () => {
    if (UI.win === 'chest' && UI.arg) { UI.arg.open = 0; G.Audio.sfx('doorc'); }
    layer.innerHTML = ''; UI.win = null; UI.arg = null; G.paused = G.menuOpen || false; UI.sel = -1;
  };
  const frame = (title, body, wide) => { layer.innerHTML = '<div id="shade"></div><div class="win px"><header><h2>' + title + '</h2><button class="btn x" id="wx">' + icon('ui_x') + '</button></header><div class="body">' + body + '</div></div>'; $('wx').onclick = () => { G.Audio.sfx('ui'); UI.close(); }; $('shade').onclick = UI.close; };
  UI.open = (name, arg) => {
    if (!G.running) return; if (G.player.dead) return; if (UI.win === name && arg === UI.arg && name !== 'craft') { UI.close(); return; }
    if (G.Build.on && name !== 'map') G.Build.exit();
    if (UI.win === 'chest' && UI.arg) UI.arg.open = 0;
    UI.win = name; UI.arg = arg; G.paused = true; UI.sel = -1;
    if (name === 'inv') bus.emit('open', 'inv');
    if (name === 'craft') { UI.station = arg || null; if (arg) UI.rtab = arg === 'campfire' || arg === 'kitchen' ? 'food' : arg === 'furnace' ? 'materials' : arg === 'forge' ? 'weapons' : UI.rtab; }
    UI.refresh();
  };
  UI.openChest = o => UI.open('chest', o);
  UI.refresh = () => { const f = R[UI.win]; if (f) f(); };
  const R = {};

  /* --- Инвентарь --- */
  const EQ = [['head', 'Голова'], ['body', 'Тело'], ['hands', 'Руки'], ['feet', 'Ноги'], ['back', 'Спина']];
  const gridHTML = (slots, n, pre, filt) => { let s = ''; for (let i = 0; i < n; i++) { const it = slots[i], dim = filt && filt !== 'all' && (!it || IT[it.id].cat !== filt); s += '<div class="slot' + (pre === 'i' && i < 8 ? ' hot' : '') + (pre === 'i' && i === UI.sel ? ' sel' : '') + (pre === 'c' && i === UI.csel ? ' sel' : '') + (dim ? ' dim' : '') + '" data-g="' + pre + '" data-i="' + i + '">' + (pre === 'i' && i < 8 ? '<span class="k">' + (i + 1) + '</span>' : '') + slotInner(it) + '</div>'; } return s; };
  R.inv = () => {
    const tabs = G.CATS.map(([k, n]) => '<button class="btn' + (UI.tab === k ? ' on' : '') + '" data-t="' + k + '">' + n + '</button>').join('');
    const eq = G.inv.eq;
    const eqs = (k, t) => '<div class="slot" data-g="e" data-i="' + k + '" title="' + t + '">' + (eq[k] ? slotInner(eq[k]) : '<span class="ph">' + icon({ head: 'iron_helmet', body: 'cloth_shirt', hands: 'leather_gloves', feet: 'leather_boots', back: 'backpack' }[k]) + '</span>') + '</div>';
    frame('Инвентарь', '<div class="col" style="width:calc(var(--u)*92);flex:none"><div class="eq">' + eqs('head') + '<canvas id="heroprev" width="24" height="30"></canvas>' + eqs('back') + eqs('body') + eqs('hands') + '<div></div>' + eqs('feet') + '<div></div></div><div class="card" id="stats"></div></div><div class="col" style="flex:1;min-width:0"><div class="tabs" id="itabs">' + tabs + '</div><div class="grid scroll" id="igrid" style="flex:1">' + gridHTML(G.inv.slots, G.Inv.size(), 'i', UI.tab) + '</div></div><div class="col" style="width:calc(var(--u)*100);flex:none"><div class="card" id="idet" style="flex:1;overflow:auto"></div></div>');
    const hc = $('heroprev').getContext('2d'); hc.imageSmoothingEnabled = false; hc.drawImage(G.Art.charFrame(G.Art.lookOf(G.inv.eq), 0, 0, 0, 0, 0), 0, 0);
    const p = G.player, ar = G.Inv.armor(), wm = G.Inv.warm();
    $('stats').innerHTML = '<div class="stat"><i>Здоровье</i>' + Math.round(p.hp) + '/' + G.Prog.maxHp() + '</div><div class="stat"><i>Броня</i>' + ar + ' (−' + Math.round(ar / (ar + 26) * 100) + '% урона)</div><div class="stat"><i>Тепло одежды</i>' + wm + '</div><div class="stat"><i>Множитель урона</i>×' + G.Combat.dmgMul().toFixed(2) + '</div><div class="stat"><i>Ячеек</i>' + G.Inv.size() + '</div>';
    $('itabs').querySelectorAll('.btn').forEach(b => b.onclick = () => { UI.tab = b.dataset.t; G.Audio.sfx('ui'); R.inv(); });
    detail(); bindSlots();
  };
  function detail() {
    const box = $('idet'); if (!box) return; const isEq = typeof UI.sel === 'string', s = isEq ? G.inv.eq[UI.sel] : G.inv.slots[UI.sel];
    if (!s) { box.innerHTML = '<p>Нажмите на предмет, чтобы увидеть описание. Перетаскивайте предметы между ячейками, на снаряжение или за пределы окна, чтобы выбросить.</p><p>Первые 8 ячеек — панель быстрого доступа.</p>'; return; }
    const d = IT[s.id]; let h = '<h3>' + icon(s.id) + d.name + '</h3>';
    if (d.desc) h += '<p>' + d.desc + '</p>';
    const st = (a, b) => h += '<div class="stat"><i>' + a + '</i>' + b + '</div>';
    if (d.weapon && d.weapon.dmg) { st('Урон', d.weapon.dmg); st('Скорость', (1 / d.weapon.cd).toFixed(1) + ' уд/с'); st('Дальность', d.weapon.range); }
    if (d.tool && d.tool.power) st('Сила добычи', d.tool.power);
    if (d.dur) st('Прочность', (s.d != null ? Math.max(0, Math.round(s.d)) : d.dur) + '/' + d.dur);
    if (d.food) { const f = d.food; if (f.hunger) st('Сытость', '+' + f.hunger); if (f.thirst) st('Жажда', '+' + f.thirst); if (f.hp) st('Здоровье', (f.hp > 0 ? '+' : '') + f.hp); if (f.stamina) st('Выносливость', '+' + f.stamina); if (f.warm) st('Согревает', '3 мин'); }
    if (d.equip) { const e = d.equip; if (e.armor) st('Броня', e.armor); if (e.warm) st('Тепло', e.warm); if (e.slots) st('Доп. ячейки', e.slots); if (e.gather) st('Добыча', '+' + e.gather * 100 + '%'); if (e.dmg) st('Урон', '+' + e.dmg * 100 + '%'); }
    if (d.stack > 1) st('В стопке', s.n + '/' + d.stack);
    h += '<div class="acts">';
    if (isEq) h += '<button class="btn" data-a="uneq">Снять</button>';
    else {
      if (d.food) h += '<button class="btn grn" data-a="use">' + (d.food.thirst > (d.food.hunger || 0) ? 'Выпить' : 'Съесть') + '</button>';
      if (d.equip) h += '<button class="btn grn" data-a="eq">Надеть</button>';
      if (d.place) h += '<button class="btn grn" data-a="place">Разместить</button>';
      if (UI.sel >= 8) h += '<button class="btn" data-a="hot">На панель</button>';
      if (s.n > 1) h += '<button class="btn" data-a="split">Разделить</button>';
      h += '<button class="btn red" data-a="drop">Выбросить' + (s.n > 1 ? ' 1' : '') + '</button>';
      if (s.n > 1) h += '<button class="btn red" data-a="dropall">Всё</button>';
    }
    box.innerHTML = h + '</div>';
    box.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
      const a = b.dataset.a, i = UI.sel; G.Audio.sfx('ui');
      if (a === 'use') { const old = G.inv.sel; G.inv.sel = i; G.Act.use(); G.inv.sel = old; }
      else if (a === 'eq') G.Inv.equip(i); else if (a === 'uneq') G.Inv.unequip(i);
      else if (a === 'place') { G.inv.sel = i; UI.close(); G.Build.start(IT[G.inv.slots[i].id].place); return; }
      else if (a === 'split') G.Inv.split(G.inv.slots, i); else if (a === 'drop') G.Inv.dropSlot(i); else if (a === 'dropall') G.Inv.dropSlot(i, true);
      else if (a === 'hot') { const sl = G.inv.slots; let j = sl.findIndex((x, k) => k < 8 && !x); if (j < 0) j = G.inv.sel; G.Inv.move(sl, i, sl, j); UI.sel = j; }
      if (UI.win) UI.refresh();
    });
  }
  /* перетаскивание и выбор ячеек (инвентарь, снаряжение, сундук) */
  function lists(g, i) { if (g === 'i') return [G.inv.slots, +i]; if (g === 'c') return [UI.arg.inv, +i]; return null; }
  function bindSlots() {
    document.querySelectorAll('.win .slot[data-g]').forEach(e => {
      e.onpointerdown = ev => {
        ev.preventDefault(); const g = e.dataset.g, i = e.dataset.i, src = g === 'e' ? G.inv.eq[i] : lists(g, i)[0][+i]; if (!src) { if (g === 'i') { UI.sel = +i; R[UI.win](); } return; }
        const sx = ev.clientX, sy = ev.clientY; let ghost = null, over = null;
        const mv = m => { if (!ghost && Math.hypot(m.clientX - sx, m.clientY - sy) > 8) { ghost = el('div', '', icon(src.id)); ghost.id = 'drag'; document.body.appendChild(ghost); } if (ghost) { ghost.style.left = m.clientX + 'px'; ghost.style.top = m.clientY + 'px'; const t = document.elementFromPoint(m.clientX, m.clientY), sl = t && t.closest('.slot[data-g]'); if (over && over !== sl) over.classList.remove('drop'); over = sl; if (sl) sl.classList.add('drop'); } };
        const up = u => {
          removeEventListener('pointermove', mv); removeEventListener('pointerup', up);
          if (!ghost) { /* нажатие */
            if (UI.win === 'chest') { quick(g, i); return; }
            if (g === 'e') { UI.sel = i; } else UI.sel = +i; G.Audio.sfx('ui'); R[UI.win](); return; }
          ghost.remove(); if (over) over.classList.remove('drop');
          const t = document.elementFromPoint(u.clientX, u.clientY), sl = t && t.closest('.slot[data-g]');
          if (sl) { const g2 = sl.dataset.g, i2 = sl.dataset.i;
            if (g2 === 'e') { if (g === 'i') { const d = IT[src.id]; if (d.equip && d.equip.slot === i2) G.Inv.equip(+i); else G.UI.toast('Сюда это не надеть', null, 'bad', 1); } }
            else if (g === 'e') { const [L, j] = lists(g2, i2); if (!L[j]) { G.inv.eq[i] = null; L[j] = src; bus.emit('inv'); bus.emit('equip'); } else G.Inv.unequip(i); }
            else { const [A, a] = lists(g, i), [B, b] = lists(g2, i2); G.Inv.move(A, a, B, b); if (g2 === 'i') UI.sel = b; }
            G.Audio.sfx('ui');
          } else if (!t || !t.closest('.win')) { if (g === 'i') G.Inv.dropSlot(+i, true); else if (g === 'c') { const L = UI.arg.inv; G.Ent.drop(L[+i].id, L[+i].n, G.player.x, G.player.y); L[+i] = null; } else if (g === 'e') { G.inv.eq[i] = null; G.Ent.drop(src.id, 1, G.player.x, G.player.y, src); bus.emit('equip'); } bus.emit('inv'); }
          if (UI.win) R[UI.win]();
        };
        addEventListener('pointermove', mv); addEventListener('pointerup', up);
      };
    });
  }
  /* быстрый перенос между сундуком и сумкой по нажатию */
  function quick(g, i) {
    const ch = UI.arg.inv; if (g === 'c') { const it = ch[+i]; if (!it) return; if (IT[it.id].stack === 1) { if (G.Inv.addItem(it)) ch[+i] = null; else UI.toast('Инвентарь полон', null, 'bad'); } else { const left = G.Inv.add(it.id, it.n, true); if (left) it.n = left; else ch[+i] = null; } }
    else if (g === 'i') { const it = G.inv.slots[+i]; if (!it) return; let placed = false; if (IT[it.id].stack > 1) for (const s of ch) if (s && s.id === it.id && s.n < IT[it.id].stack) { const m = Math.min(it.n, IT[it.id].stack - s.n); s.n += m; it.n -= m; if (!it.n) { G.inv.slots[+i] = null; placed = true; break; } } if (!placed && G.inv.slots[+i]) { const j = ch.findIndex(x => !x); if (j >= 0) { ch[j] = it; G.inv.slots[+i] = null; } else UI.toast('Сундук полон', null, 'bad'); } }
    G.Audio.sfx('pickup'); bus.emit('inv');
  }
  R.chest = () => {
    const o = UI.arg; frame(G.OBJ[o.t].n, '<div class="col" style="flex:1"><div class="card" style="padding:calc(var(--u)*2)"><small style="color:var(--dim)">Нажмите на предмет — он перенесётся. Можно перетаскивать.</small></div><div class="grid scroll" style="flex:1">' + gridHTML(o.inv, o.inv.length, 'c') + '</div><div class="acts"><button class="btn gold" id="takeall">Взять всё</button></div></div><div class="col" style="flex:1.2"><h3 style="margin:0;font-weight:normal;color:var(--hi)">Сумка</h3><div class="grid scroll" style="flex:1">' + gridHTML(G.inv.slots, G.Inv.size(), 'i') + '</div><div class="acts"><button class="btn" id="putall">Сложить ресурсы</button></div></div>');
    $('takeall').onclick = () => { for (let i = 0; i < o.inv.length; i++) if (o.inv[i]) quick('c', i); };
    $('putall').onclick = () => { for (let i = 8; i < G.Inv.size(); i++) { const s = G.inv.slots[i]; if (s && ['res', 'mat'].includes(IT[s.id].cat)) quick('i', i); } };
    bindSlots();
  };

  /* --- Крафт --- */
  R.craft = () => {
    G.Craft.scan(); const st = UI.station;
    const tabs = G.RCATS.map(([k, n]) => '<button class="btn' + (UI.rtab === k ? ' on' : '') + '" data-t="' + k + '">' + n + '</button>').join('');
    const list = G.RECIPES.filter(r => r.cat === UI.rtab);
    const near = Object.keys(G.Craft.near).filter(k => k !== 'hand').map(k => G.STATIONS[k]).join(', ');
    let rows = ''; list.forEach(r => { const c = G.Craft.check(r), idx = G.RECIPES.indexOf(r); rows += '<div class="rec' + (c.ok ? '' : ' no') + (UI.rsel === idx ? ' on' : '') + '" data-r="' + idx + '">' + icon(r.out) + '<span class="nm">' + nm(r.out) + (r.n > 1 ? ' ×' + r.n : '') + (r.note ? ' <small>(' + r.note + ')</small>' : '') + '</span><small>' + (c.st ? '' : G.STATIONS[r.st]) + (c.skill ? '' : ' 🔒') + '</small></div>'; });
    frame('Создание предметов', '<div class="col" style="flex:1.3;min-width:0"><div class="tabs" id="rtabs">' + tabs + '</div><div class="card" style="padding:calc(var(--u)*2);font-size:calc(var(--u)*5.5);color:var(--dim)">Рядом: ' + (near || 'только руки') + '</div><div class="scroll" style="flex:1">' + rows + '</div></div><div class="col" style="flex:1;min-width:0"><div class="card" id="rdet" style="flex:1;overflow:auto"></div></div>');
    $('rtabs').querySelectorAll('.btn').forEach(b => b.onclick = () => { UI.rtab = b.dataset.t; UI.rsel = null; G.Audio.sfx('ui'); R.craft(); });
    document.querySelectorAll('.rec').forEach(e => e.onclick = () => { UI.rsel = +e.dataset.r; G.Audio.sfx('ui'); R.craft(); });
    const box = $('rdet'), r = G.RECIPES[UI.rsel];
    if (!r || r.cat !== UI.rtab) { box.innerHTML = '<p>Выберите рецепт. Серые рецепты требуют материалов, станка поблизости или навыка.</p><p>Станки: верстак, печь, кузница, костёр и котёл ставятся в режиме строительства.</p>'; return; }
    const c = G.Craft.check(r), d = IT[r.out];
    let h = '<h3>' + icon(r.out) + nm(r.out) + (r.n > 1 ? ' ×' + r.n : '') + '</h3>' + (d.desc ? '<p>' + d.desc + '</p>' : '');
    if (d.weapon && d.weapon.dmg) h += '<div class="stat"><i>Урон</i>' + d.weapon.dmg + '</div>';
    if (d.equip) h += '<div class="stat"><i>Броня / тепло</i>' + (d.equip.armor || 0) + ' / ' + (d.equip.warm || 0) + '</div>';
    if (d.food) h += '<div class="stat"><i>Сытость / жажда / здоровье</i>' + (d.food.hunger || 0) + ' / ' + (d.food.thirst || 0) + ' / ' + (d.food.hp || 0) + '</div>';
    h += '<p>Материалы:</p>';
    for (const k in r.in) { const have = G.Inv.count(k); h += '<div class="need ' + (have >= r.in[k] ? 'ok' : 'no') + '">' + icon(k) + nm(k) + ' — ' + have + '/' + r.in[k] + '</div>'; }
    h += '<p></p><div class="stat"><i>Где</i><span style="color:' + (c.st ? 'var(--grn)' : '#ff9a8a') + '">' + G.STATIONS[r.st] + '</span></div><div class="stat"><i>Время</i>' + r.time + ' с</div>';
    if (!c.skill) h += '<div class="stat"><i>Нужен навык</i><span style="color:#ff9a8a">Новые конструкции ' + r.skill + '</span></div>';
    h += '<div class="acts"><button class="btn gold' + (c.ok ? '' : ' off') + '" id="mk1">Создать</button><button class="btn' + (c.ok ? '' : ' off') + '" id="mk5">×5</button></div>';
    box.innerHTML = h;
    $('mk1').onclick = () => { G.Craft.start(r, 1); R.craft(); }; $('mk5').onclick = () => { G.Craft.start(r, 5); R.craft(); };
  };

  /* --- Задания --- */
  R.quests = () => {
    const S = G.S.quests, act = G.QUESTS.filter(q => S.active[q.id]), done = G.QUESTS.filter(q => S.done.includes(q.id));
    if (!UI.qsel || !G.Quest.def(UI.qsel)) UI.qsel = act[0] ? act[0].id : null;
    const item = (q, d) => '<div class="qitem' + (d ? ' done' : '') + (UI.qsel === q.id ? ' on' : '') + '" data-q="' + q.id + '">' + (q.story ? '<span class="st">★</span>' : '•') + q.n + '</div>';
    frame('Журнал заданий', '<div class="scroll col" style="flex:1">' + act.map(q => item(q)).join('') + (done.length ? '<p style="color:var(--dim);margin:calc(var(--u)*4) 0 0">Выполнено: ' + done.length + '</p>' + done.map(q => item(q, 1)).join('') : '') + '</div><div class="card scroll" id="qdet" style="flex:1.3"></div>');
    document.querySelectorAll('.qitem').forEach(e => e.onclick = () => { UI.qsel = e.dataset.q; R.quests(); });
    const q = G.Quest.def(UI.qsel), box = $('qdet'); if (!q) { box.innerHTML = '<p>Нет активных заданий.</p>'; return; }
    const pr = S.active[q.id], dn = S.done.includes(q.id);
    let h = '<h3>' + (q.story ? '★ ' : '') + q.n + '</h3><p>' + q.d + '</p>';
    q.goals.forEach((g, i) => { const v = dn ? g.n : Math.floor(Math.min(pr[i], g.n)); h += '<div class="stat"><span>' + g.txt + '</span><i>' + v + '/' + g.n + '</i></div><div class="pbar"><i style="width:' + (v / g.n * 100) + '%"></i></div>'; });
    if (q.hint && !dn) h += '<p>Подсказка: ' + q.hint + '</p>';
    const rw = q.rew || {}; h += '<p>Награда: ' + (rw.xp ? rw.xp + ' опыта' : '') + (rw.items ? ', ' + Object.keys(rw.items).map(k => nm(k) + ' ×' + rw.items[k]).join(', ') : '') + '</p>';
    if (dn) h += '<p style="color:var(--grn)">Выполнено</p>';
    box.innerHTML = h;
  };
  /* --- Навыки --- */
  R.skills = () => {
    const S = G.S; let h = '<div style="display:flex;flex-direction:column;gap:calc(var(--u)*3);flex:1;min-width:0"><div class="stat"><span>Уровень ' + S.lvl + ' · опыт ' + S.xp + '/' + G.Prog.need(S.lvl) + '</span><span style="color:var(--hi)">Свободных очков: ' + S.sp + '</span></div><div style="display:flex;gap:calc(var(--u)*4);flex:1;min-height:0">';
    for (const br of G.SKILLS) { h += '<div class="skb scroll"><h3 style="margin:0;font-weight:normal;color:' + br.c + '">' + br.n + '</h3>'; for (const s of br.l) { const r = G.Prog.rank(s.id); h += '<div class="sk card"><div>' + s.n + '</div><div class="r">' + Array.from({ length: s.max }, (_, i) => '<i class="' + (i < r ? 'on' : '') + '"></i>').join('') + '</div><p>' + s.d + '</p>' + (r < s.max ? '<button class="btn' + (S.sp ? ' gold' : ' off') + '" data-s="' + s.id + '" style="font-size:calc(var(--u)*5.5);min-height:calc(var(--u)*12);padding:var(--u) calc(var(--u)*4)">Изучить</button>' : '<small style="color:var(--grn)">Максимум</small>') + '</div>'; } h += '</div>'; }
    frame('Навыки', h + '</div></div>');
    document.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { if (G.Prog.learn(b.dataset.s)) R.skills(); });
  };
  /* --- Настройки --- */
  R.settings = () => {
    const S = G.settings, rng = (k, lab, min, max, step) => '<div class="set"><span>' + lab + '</span><input type="range" data-k="' + k + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + S[k] + '"></div>';
    frame('Настройки', '<div class="scroll" style="flex:1">' + rng('music', 'Музыка', 0, 1, .05) + rng('sfx', 'Звуки', 0, 1, .05) + rng('zoom', 'Масштаб', -1, 2, 1) + rng('fx', 'Частицы и погода', .3, 1, .1) + '<div class="set"><span>Мир</span><span>' + (G.S && G.running ? G.S.name + ' · сид <b style="color:var(--hi);user-select:text">' + G.S.seedText + '</b>' : '—') + '</span></div><div class="set"><span>Подсказки клавиш</span><button class="btn" id="keysb">' + (S.keys === false ? 'Выкл' : 'Вкл') + '</button></div><div class="set"><span>Показывать FPS</span><button class="btn" id="fpsb">' + (S.fps ? 'Вкл' : 'Выкл') + '</button></div><div class="set"><span>Управление с клавиатуры</span><small style="color:var(--dim);text-align:right">WASD — ходьба, Shift — бег, мышь — прицел, ЛКМ — атака (удерживать — сильная), ПКМ — блок, Пробел — рывок, E — взаимодействие, Q/F — применить, 1–8 и колесо — предметы, I — инвентарь, C — крафт, B — стройка, J — задания, N — навыки, M — карта, Esc — меню. В стройке: ЛКМ — поставить, ПКМ — выйти, R — повернуть, T — материал</small></div></div><div class="col" style="width:calc(var(--u)*100)"><button class="btn gold" id="svnow">Сохранить</button>' + (G.running ? '<button class="btn" id="tomenu">Выйти в меню</button>' : '') + '<button class="btn" id="fullsc">Во весь экран (F11)</button></div>');
    document.querySelectorAll('.set input').forEach(i => i.oninput = () => { S[i.dataset.k] = +i.value; G.applySettings(); G.Save.settings(); });
    $('keysb').onclick = () => { S.keys = S.keys === false; G.applySettings(); G.Save.settings(); R.settings(); };
    $('fpsb').onclick = () => { S.fps = !S.fps; G.applySettings(); G.Save.settings(); R.settings(); };
    $('svnow').onclick = () => { if (G.running && G.Save.save()) UI.toast('Игра сохранена', 'ui_ok'); };
    if ($('tomenu')) $('tomenu').onclick = () => { G.Save.save(); UI.close(); G.toMenu(); };
    $('fullsc').onclick = () => { const d = document.documentElement; try { const r = (d.requestFullscreen || d.webkitRequestFullscreen || (() => { })).call(d); if (r && r.catch) r.catch(() => G.UI.toast('Полноэкранный режим недоступен', null, null, 1)); } catch (e) { } try { screen.orientation.lock('landscape').catch(() => { }); } catch (e) { } };
  };
  /* --- Карта мира --- */
  let mapImg = null, mapFog = null, fogVer = -1, mapView = { z: 2, cx: 0, cy: 0 };
  const TCOL = { 0: '#2f5f96', 1: '#4a86c0', 2: '#aee0f4', 3: '#f2c894', 4: '#e0904e', 5: '#96503e', 6: '#62ae3c', 7: '#3a8436', 8: '#f04f72', 9: '#eef4fa', 10: '#7c7888', 11: '#b38655', 12: '#7c7888', 13: '#c4bea6', 14: '#8f6240', 15: '#c4bea6', 16: '#5a4a68', 17: '#8a6866', 18: '#40344e', 19: '#120d1c', 20: '#9a96a6', 21: '#8f6240' };
  UI.mapDirty = () => { mapImg = null; };
  function buildMapImg(m) { const c = document.createElement('canvas'); c.width = m.w; c.height = m.h; const x = c.getContext('2d'), im = x.createImageData(m.w, m.h), d = im.data; const cc = {}; for (let i = 0; i < m.w * m.h; i++) { let t = m.tiles[i]; const col = TCOL[t] || '#000'; let rgb = cc[col]; if (!rgb) rgb = cc[col] = [parseInt(col.slice(1, 3), 16), parseInt(col.slice(3, 5), 16), parseInt(col.slice(5, 7), 16)]; let k = 1; const o = m.grid[i] ? m.objs[m.grid[i] - 1] : null; if (o && G.OBJ[o.t].tree && !o.dead) k = .78; if (m.roof[i]) { rgb = [140, 80, 70]; k = 1; } d[i * 4] = rgb[0] * k; d[i * 4 + 1] = rgb[1] * k; d[i * 4 + 2] = rgb[2] * k; d[i * 4 + 3] = 255; } x.putImageData(im, 0, 0); return c; }
  R.map = () => {
    frame(G.map.id === 'world' ? 'Карта острова' : 'Карта: ' + G.DUNGEONS[G.map.id].n, '<canvas id="mapcv"></canvas><div class="col" style="width:calc(var(--u)*72)"><button class="btn" id="mz1">+ Ближе</button><button class="btn" id="mz2">− Дальше</button><button class="btn" id="mzc">К герою</button><div class="card" style="font-size:calc(var(--u)*5.5);color:var(--dim)">Нажмите на карту, чтобы поставить метку. Повторное нажатие на метку — убрать.<br><br>Открыто биомов: ' + G.S.biomes.length + '/5</div></div>');
    mapImg = null; const p = G.player; mapView.cx = p.x / 16; mapView.cy = p.y / 16; const cv = $('mapcv');
    $('mz1').onclick = () => { mapView.z = Math.min(8, mapView.z + 1); }; $('mz2').onclick = () => { mapView.z = Math.max(1, mapView.z - 1); }; $('mzc').onclick = () => { mapView.cx = G.player.x / 16; mapView.cy = G.player.y / 16; };
    let drag = null; cv.onpointerdown = e => { drag = { x: e.clientX, y: e.clientY, cx: mapView.cx, cy: mapView.cy, moved: 0 }; cv.setPointerCapture(e.pointerId); };
    cv.onpointermove = e => { if (!drag) return; const r = cv.getBoundingClientRect(), k = cv.width / r.width / mapView.z; const dx = (e.clientX - drag.x) * k, dy = (e.clientY - drag.y) * k; if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = 1; mapView.cx = drag.cx - dx; mapView.cy = drag.cy - dy; };
    cv.onpointerup = e => { if (drag && !drag.moved && G.map.id === 'world') { const r = cv.getBoundingClientRect(), k = cv.width / r.width; const mx = (e.clientX - r.left) * k, my = (e.clientY - r.top) * k; const tx = Math.round(mapView.cx + (mx - cv.width / 2) / mapView.z), ty = Math.round(mapView.cy + (my - cv.height / 2) / mapView.z); const M = G.S.marks; const i = M.findIndex(q => Math.abs(q[0] - tx) < 5 / mapView.z * 2 && Math.abs(q[1] - ty) < 5 / mapView.z * 2); if (i >= 0) M.splice(i, 1); else M.push([tx, ty]); G.Audio.sfx('ui'); } drag = null; };
    cv.onwheel = e => { mapView.z = G.clamp(mapView.z + (e.deltaY < 0 ? 1 : -1), 1, 8); };
  };
  UI.drawMap = () => {
    const cv = $('mapcv'); if (!cv) return; const m = G.map, r = cv.getBoundingClientRect(); const W = Math.round(r.width / 2), H = Math.round(r.height / 2); if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    if (!mapImg) mapImg = buildMapImg(m);
    const E = m.id === 'world' ? G.explored : G.dexp[m.id], ver = G.exploredVer;
    if (!mapFog || fogVer !== ver || mapFog.width !== m.w) { fogVer = ver; mapFog = document.createElement('canvas'); mapFog.width = m.w; mapFog.height = m.h; const x = mapFog.getContext('2d'), im = x.createImageData(m.w, m.h), d = new Uint32Array(im.data.buffer), fogc = (255 << 24) | (0x26 << 16) | (0x1c << 8) | 0x14; for (let i = 0; i < m.w * m.h; i++) if (!E || !(E[i >> 3] & (1 << (i & 7)))) d[i] = fogc >>> 0; x.putImageData(im, 0, 0); }
    const c = cv.getContext('2d'), z = mapView.z; c.imageSmoothingEnabled = false; c.fillStyle = '#141026'; c.fillRect(0, 0, W, H);
    const ox = W / 2 - mapView.cx * z, oy = H / 2 - mapView.cy * z;
    c.drawImage(mapImg, ox, oy, m.w * z, m.h * z); c.drawImage(mapFog, ox, oy, m.w * z, m.h * z);
    const dot = (x, y, ic, s) => { const cvI = G.Art.iconCv[ic]; s = s || 12; c.drawImage(cvI, Math.round(ox + x * z - s / 2), Math.round(oy + y * z - s / 2), s, s); };
    if (m.id === 'world') { for (const q of m.pois) if (q.found) dot(q.x, q.y, { dungeon: 'ui_lock', village: 'ui_build', gate: 'heart_shard', temple: 'ui_skill', ruin: 'ui_quest', shrine: 'ui_skill', fort: 'banner' }[q.icon] || 'ui_quest'); for (const q of G.S.marks) dot(q[0], q[1], 'ui_pin'); if (G.player.home) dot(G.player.home[0] / 16, G.player.home[1] / 16, 'ui_zzz'); }
    const p = G.player, px = ox + p.x / 16 * z, py = oy + p.y / 16 * z, a = p.aim; c.fillStyle = '#fff'; c.strokeStyle = '#0d0b1a'; c.lineWidth = 2; c.beginPath(); c.moveTo(px + Math.cos(a) * 6, py + Math.sin(a) * 6); c.lineTo(px + Math.cos(a + 2.5) * 5, py + Math.sin(a + 2.5) * 5); c.lineTo(px + Math.cos(a - 2.5) * 5, py + Math.sin(a - 2.5) * 5); c.closePath(); c.stroke(); c.fill();
  };

  /* ---------- строительство: панель ---------- */
  UI.buildBar = on => {
    const bb = $('buildbar'), bt = $('buildtools'), hb = $('hotbar');
    bb.classList.toggle('hidden', !on); bt.classList.toggle('hidden', !on); $('qtrack').style.visibility = on ? 'hidden' : ''; hb.classList.toggle('hidden', on); $('keys').classList.toggle('hidden', on); $('selname').classList.toggle('hidden', on);
    if (!on) { UI.hotbar(); return; }
    const B = G.Build, cats = G.BCATS.map(([k, n]) => '<button class="btn tab' + (UI.btab === k ? ' on' : '') + '" data-c="' + k + '">' + n + '</button>').join('');
    const items = G.BUILD_LIST.filter(id => G.BUILD[id].cat === UI.btab).map(id => '<div class="slot bi' + (B.sel === id ? ' sel' : '') + (B.affordable(id) && !B.locked(id) ? '' : ' no') + '" data-b="' + id + '">' + icon(id) + (G.Inv.count(id) ? '<span class="n">' + G.Inv.count(id) + '</span>' : '') + '</div>').join('');
    const b = G.BUILD[B.sel], c = B.cost(B.sel);
    const info = B.mode === 'place' ? '<b>' + b.name + '</b><span>' + (G.Inv.count(B.sel) ? 'есть готовая: ' + G.Inv.count(B.sel) : Object.keys(c).map(k => icon(k).replace('class="ic"', 'class="ic" style="width:calc(var(--u)*9);height:calc(var(--u)*9)"') + '<span style="color:' + (G.Inv.count(k) >= c[k] ? '#7bd05a' : '#ff9a8a') + '">' + G.Inv.count(k) + '/' + c[k] + '</span>').join(' ')) + (B.locked(B.sel) ? ' 🔒 навык' : '') + '</span>' : '<b>' + { move: 'Перенос: выберите свою постройку, затем новое место', remove: 'Разбор: выберите постройку — вернётся половина материалов', upgrade: 'Улучшение: дерево → камень' }[B.mode] + '</b>';
    bb.innerHTML = '<div class="row">' + cats + '</div><div class="row">' + items + '</div><div class="info">' + info + '</div>';
    bb.querySelectorAll('[data-c]').forEach(e => e.onclick = () => { UI.btab = e.dataset.c; const f = G.BUILD_LIST.find(id => G.BUILD[id].cat === UI.btab); if (f) B.sel = f; B.setMode('place'); G.Audio.sfx('ui'); UI.buildBar(true); });
    bb.querySelectorAll('[data-b]').forEach(e => e.onclick = () => { B.sel = e.dataset.b; B.setMode('place'); G.Audio.sfx('ui'); UI.buildBar(true); });
    const T = [['place', 'ui_build', 'Строить'], ['move', 'ui_move', 'Перенести'], ['remove', 'ui_trash', 'Разобрать'], ['upgrade', 'ui_up', 'Улучшить']];
    bt.innerHTML = T.map(([k, ic, n]) => '<button class="btn' + (B.mode === k ? ' on' : '') + '" data-m="' + k + '">' + icon(ic) + n + '</button>').join('') + '<button class="btn" id="brot">' + icon('ui_rot') + 'Повернуть</button><button class="btn" id="bmat">' + icon('ui_swap') + 'Материал</button><button class="btn red" id="bexit">' + icon('ui_x') + 'Выйти</button>';
    bt.querySelectorAll('[data-m]').forEach(e => e.onclick = () => { B.setMode(e.dataset.m); G.Audio.sfx('ui'); });
    $('brot').onclick = () => B.rotate(); $('bmat').onclick = () => B.swapMat(); $('bexit').onclick = () => B.exit();
  };

  /* ---------- диалоги, сон, смерть ---------- */
  UI.dialog = (t, txt, btns) => {
    const old = $('dlg'); if (old) old.remove(); const d = el('div', 'px', '<h3>' + t + '</h3><p>' + txt + '</p><div class="acts"></div>'); d.id = 'dlg'; document.body.appendChild(d);
    const a = d.querySelector('.acts'); (btns || [['Закрыть', null]]).forEach(([n, fn, cls]) => { const b = el('button', 'btn ' + (cls || ''), n); b.onclick = () => { d.remove(); G.paused = !!UI.win || G.menuOpen; if (fn) fn(); }; a.appendChild(b); });
    G.paused = true; G.Audio.sfx('ui');
  };
  UI.sleep = on => { let s = $('sleepo'); if (on) { if (!s) { s = el('div', '', '<div>Сон...</div><span></span><button class="btn">Проснуться</button>'); s.id = 'sleepo'; document.body.appendChild(s); s.querySelector('button').onclick = () => G.Player.wake(); } } else if (s) s.remove(); };
  UI.death = () => { UI.close(); UI.dialog('Вы погибли', 'Остров забрал вас... но не отпустил. Вы очнётесь у своей кровати или на берегу. Вещи останутся при вас, но часть опыта будет потеряна.', [['Очнуться', () => { G.UI.fade(() => G.Player.respawn()); }, 'gold']]); };
  UI.ending = () => UI.dialog('Сердце острова', 'Архонт пал, и кристалл в глубине затих. Вы касаетесь его — и чувствуете, как тепло расходится по корням, рекам и снегам.\n\nСердце не было злым. Оно было одиноким. Теперь у острова снова есть Хранитель — вы.\n\nСпасибо за игру! Мир остаётся открытым: стройте, исследуйте и возвращайтесь.', [['Продолжить', null, 'gold']]);

  UI.keyDown = (k, e) => {
    if (!G.running) return false;
    const map = { KeyI: 'inv', KeyC: 'craft', KeyJ: 'quests', KeyN: 'skills', KeyM: 'map', Tab: 'inv' }; k = e.code === 'Escape' ? 'escape' : e.code === 'KeyB' ? 'b' : e.code;
    if (k === 'escape') { if ($('dlg')) { $('dlg').remove(); G.paused = !!UI.win; return true; } if (UI.win) UI.close(); else if (G.Build.on) G.Build.exit(); else UI.open('settings'); return true; }
    if (k === 'b') { if (UI.win) UI.close(); G.Build.on ? G.Build.exit() : G.Build.start(); return true; }
    if (map[k]) { UI.open(map[k]); return true; }
    return !!UI.win;
  };

  /* ---------- главное меню ---------- */
  UI.menu = () => {
    G.menuOpen = true; layer.innerHTML = '<div id="menu"><canvas id="menuhero" width="24" height="30"></canvas><div class="logo"><h1>PIXEL SURVIVAL</h1><h2>LOST LANDS</h2></div><button class="btn gold" id="m-cont">Продолжить</button><button class="btn" id="m-new">Новая игра</button><button class="btn" id="m-set">Настройки</button><button class="btn" id="m-cred">Авторы</button><div class="ver">v' + G.VERSION + '.0</div></div>';
    $('hud').classList.add('hidden');
    const hc = $('menuhero').getContext('2d'); hc.imageSmoothingEnabled = false; let f = 0; const anim = () => { if (!$('menuhero')) return; hc.clearRect(0, 0, 24, 30); f++; const leg = Math.floor(f / 8) % 4; hc.drawImage(G.Art.charFrame(G.Art.lookOf(null), 3, leg, [0, 1, 0, 2][leg], leg % 2, 0), 0, 0); requestAnimationFrame(anim); }; anim();
    const has = G.Save.has(); if (!has) $('m-cont').classList.add('off'); else { try { const sv = JSON.parse(localStorage.getItem('lostlands_save_v1')); if (sv && sv.name) $('m-cont').textContent = 'Продолжить: ' + sv.name; } catch (e) { } }
    $('m-cont').onclick = () => { G.Audio.unlock(); G.startGame(false); };
    $('m-new').onclick = () => { G.Audio.unlock(); UI.newWorld(has); };
    $('m-set').onclick = () => { G.Audio.unlock(); UI.win = null; settingsFromMenu(); };
    $('m-cred').onclick = () => UI.dialog('Авторы', 'Pixel Survival: Lost Lands\n\nИдея и главный герой — автор проекта.\nКод, процедурная пиксельная графика, звук и музыка генерируются прямо в игре.\nШрифт — пиксельный шрифт проекта Эмберхолл.');
  };
  /* экран «Новый мир»: название и сид */
  UI.newWorld = has => {
    const old = $('dlg'); if (old) old.remove();
    const d = el('div', 'px', '<h3>Новый мир</h3><div class="nw"><label for="nw-name">Название мира</label><input id="nw-name" maxlength="24" value="Мой остров"><label for="nw-seed">Сид (число или любой текст; пусто — случайный)</label><div class="nwr"><input id="nw-seed" maxlength="32" placeholder="случайный"><button class="btn" id="nw-rnd">Случайный</button></div>' + (has ? '<p class="warn">Текущее сохранение будет заменено.</p>' : '') + '</div><div class="acts"><button class="btn" id="nw-cancel">Отмена</button><button class="btn gold" id="nw-go">Создать мир</button></div>');
    d.id = 'dlg'; document.body.appendChild(d); $('nw-name').focus();
    $('nw-rnd').onclick = () => { $('nw-seed').value = String(Math.floor(Math.random() * 2147483647)); G.Audio.sfx('ui'); };
    $('nw-cancel').onclick = () => d.remove();
    $('nw-go').onclick = () => { const name = $('nw-name').value.trim() || 'Мой остров', seed = $('nw-seed').value; d.remove(); G.startGame(true, { name, seed }); };
    d.querySelectorAll('input').forEach(i => i.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') $('nw-go').click(); if (e.key === 'Escape') d.remove(); });
  };
  function settingsFromMenu() { const keep = layer.innerHTML; G.running = false; R.settings(); const x = $('wx'); x.onclick = $('shade').onclick = () => { UI.menu(); }; }
  UI.intro = done => {
    const pages = ['Шторм ревел три дня. Корабль раскололся о рифы, и волны унесли всё...', '...кроме вас. Вы очнулись на тёплом песке незнакомого острова.', 'Вдалеке — руины древней цивилизации. В глубине острова что-то тихо пульсирует, как сердце.', 'Чтобы выжить, придётся добывать еду, строить убежище и раскрыть тайну этих земель.'];
    let i = 0; const show = () => { if (i >= pages.length) { done(); return; } UI.dialog(i === 0 ? 'Пролог' : '', pages[i], [[i < pages.length - 1 ? 'Далее' : 'Начать', () => { i++; show(); }, 'gold']]); }; show();
  };
})();
