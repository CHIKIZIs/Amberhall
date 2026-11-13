'use strict';
/* Building System: сетка, предпросмотр (зелёный/красный), поворот, перенос, разбор, улучшение, смена материала. */
(() => {
  const TS = 16, T = G.T, TD = G.TILE, bus = G.bus;
  const NAT = [T.GRASS, T.DGRASS, T.PINK, T.SAND, T.DIRT, T.RED, T.SNOW, T.ICE, T.DFLOOR, T.RUIN, T.ROAD];
  const Build = G.Build = {
    on: false, sel: null, mode: 'place', tx: 0, ty: 0, rot: 0, carry: null, ok: false,
    start(id) {
      if (G.map.id !== 'world' && !(G.map.dark && ['torch', 'campfire', 'chest', 'workbench', 'tent', 'bed', 'lantern'].includes(id))) { G.UI.toast('В подземелье можно ставить только факелы, костры, сундуки и спальные места', null, 'bad'); }
      Build.on = true; Build.mode = 'place'; Build.sel = id || Build.sel || 'campfire'; Build.rot = 0; Build.carry = null; Build.aim(); G.UI.buildBar(true); bus.emit('buildmode');
    },
    exit() { if (!Build.on) return; if (Build.carry) { const c = Build.carry; G.map.add(c.t, c.x, c.y, c); Build.carry = null; } Build.on = false; G.UI.buildBar(false); bus.emit('buildmode'); },
    setMode(m) { if (Build.carry && m !== 'move') { const c = Build.carry; G.map.add(c.t, c.x, c.y, c); Build.carry = null; } Build.mode = m; bus.emit('buildmode'); },
    aim() { const p = G.player, a = p.aim; Build.tx = Math.floor((p.x + Math.cos(a) * 22) / TS); Build.ty = Math.floor((p.y - 4 + Math.sin(a) * 22) / TS); },
    /* курсор следует за персонажем, пока игрок не указал клетку пальцем */
    update() { if (!Build.on) return; if (G.Input.mag > .15 && !Build.pinned) Build.aim(); },
    tapWorld(wx, wy) { Build.tx = Math.floor(wx / TS); Build.ty = Math.floor(wy / TS); Build.pinned = 1; setTimeout(() => { Build.pinned = 0; }, 2500); },
    def() { return G.BUILD[Build.carry ? Build.carry.t : Build.sel]; },
    size() { const o = G.OBJ[Build.carry ? Build.carry.t : Build.sel]; const s = (o && o.size) || [1, 1]; return (Build.rot & 1) && s[0] !== s[1] ? [s[1], s[0]] : s; },
    mul() { return 1 - G.Prog.rank('cost') * .12; },
    cost(id) { const b = G.BUILD[id], c = {}; for (const k in b.cost) c[k] = Math.max(1, Math.ceil(b.cost[k] * Build.mul())); return c; },
    affordable(id) { return G.Inv.count(id) > 0 || G.Inv.has(Build.cost(id)); },
    locked(id) { const b = G.BUILD[id]; return b.skill && G.Prog.rank('unlock') < b.skill; },
    check() {
      const m = G.map, x = Build.tx, y = Build.ty, p = G.player;
      if (Build.mode !== 'place' && !Build.carry) { const o = Build.pick(); return !!o; }
      const id = Build.carry ? Build.carry.t : Build.sel, b = G.BUILD[id], [w, h] = Build.size();
      if (!b) return false;
      if (Math.hypot((x + w / 2) * TS - p.x, (y + h / 2) * TS - p.y) > 90) return false;
      if (!Build.carry && (Build.locked(id) || !Build.affordable(id))) return false;
      if (b.kind === 'tile') { if (!m.inb(x, y)) return false; const t = m.t(x, y); if (b.on === 'water') return (t === T.WATER || t === T.DEEP) && !m.at(x, y); if (b.on === 'cliff') return t === T.CLIFF; return NAT.includes(t) && t !== (T[b.tile]) && !(m.at(x, y) && !G.OBJ[m.at(x, y).t].flat && !m.at(x, y).b); }
      if (b.kind === 'roof') return m.inb(x, y) && !m.roof[y * m.w + x] && TD[m.t(x, y)].pass === 1;
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const X = x + i, Y = y + j; if (!m.inb(X, Y)) return false; const t = m.t(X, Y); if (TD[t].pass !== 1 || t === T.LADDER) return false; if (m.at(X, Y)) return false; const px = Math.floor(p.x / TS), py = Math.floor((p.y - 3) / TS); if (px === X && py === Y && G.OBJ[id].solid) return false; }
      return true;
    },
    pick() { const m = G.map, o = m.at(Build.tx, Build.ty); if (o && o.b) return { o }; const k = Build.ty * m.w + Build.tx; if (m.rmods && m.rmods[k]) return { roof: k }; if (m.tmods && m.tmods[k]) return { tile: k }; return null; },
    confirm() {
      if (!Build.on) return; const m = G.map;
      if (Build.mode === 'place' || Build.carry) {
        if (!Build.check()) { G.UI.toast(Build.reason(), null, 'bad', 1); G.Audio.sfx('deny'); return; }
        const id = Build.carry ? Build.carry.t : Build.sel, b = G.BUILD[id], x = Build.tx, y = Build.ty, k = y * m.w + x;
        if (Build.carry) { const c = Build.carry; c.x = x; c.y = y; c.rot = Build.rot; m.add(c.t, x, y, c); Build.carry = null; Build.mode = 'move'; G.Audio.sfx('build'); bus.emit('buildmode'); return; }
        if (G.Inv.count(id) > 0) G.Inv.remove(id, 1); else G.Inv.take(Build.cost(id));
        m.tmods = m.tmods || {}; m.rmods = m.rmods || {};
        if (b.kind === 'tile') { const old = m.tmods[k] ? m.tmods[k][1] : m.tiles[k]; m.tmods[k] = [T[b.tile], old]; m.setTile(x, y, T[b.tile]); }
        else if (b.kind === 'roof') { m.rmods[k] = b.roof; m.roof[k] = b.roof; }
        else { const o = m.add(id, x, y, { b: 1, rot: G.OBJ[id].act === 'door' || b.rot ? Build.rot : undefined }); if (id === 'bed') o.v = Build.rot & 1; if (G.OBJ[id].light || G.OBJ[id].fire || id === 'campfire') { (m.safe || (m.safe = [])).push({ x, y }); } if (id === 'bed' || id === 'tent') { G.player.home = [x * TS + 8, (y + Build.size()[1]) * TS + 10]; G.UI.toast('Точка возрождения сохранена', 'ui_zzz', null, 1); } }
        G.Audio.sfx('build'); G.Prog.xp(3); bus.emit('build', { id }); G.Ent.burst(x * TS + 8, y * TS + 12, ['#d9d3be', '#b38655'], 10, 50);
        if (!Build.affordable(id)) G.UI.toast('Материалы закончились', null, null, 1);
        return;
      }
      const t = Build.pick(); if (!t) { G.UI.toast('Здесь нет ваших построек', null, null, 1); return; }
      if (Build.mode === 'remove') {
        if (t.o) { const o = t.o; if (o.inv && o.inv.some(Boolean)) { G.UI.toast('Сначала опустошите сундук', null, 'bad'); return; } if (o.crop) { G.UI.toast('На грядке растёт урожай', null, 'bad'); return; } m.remove(o); Build.refund(o.t); }
        else if (t.roof != null) { const id = m.rmods[t.roof] === 2 ? 'roof_stone' : 'roof_wood'; m.roof[t.roof] = 0; delete m.rmods[t.roof]; Build.refund(id); }
        else { const [nw, old] = m.tmods[t.tile]; delete m.tmods[t.tile]; m.setTile(t.tile % m.w, Math.floor(t.tile / m.w), old); const id = Object.keys(G.BUILD).find(i => G.BUILD[i].tile && T[G.BUILD[i].tile] === nw); if (id) Build.refund(id); }
        G.Audio.sfx('break'); return;
      }
      if (Build.mode === 'move') { if (!t.o) { G.UI.toast('Переносить можно только предметы', null, 'bad', 1); return; } if (t.o.inv && t.o.inv.some(Boolean)) { G.UI.toast('Сначала опустошите сундук', null, 'bad'); return; } Build.carry = t.o; m.remove(t.o); Build.rot = t.o.rot || 0; G.Audio.sfx('ui'); bus.emit('buildmode'); return; }
      if (Build.mode === 'upgrade') {
        if (!t.o) return; const b = G.BUILD[t.o.t]; if (!b || !b.up) { G.UI.toast('Эту постройку нельзя улучшить', null, null, 1); return; }
        const up = b.up, c = Build.cost(up); if (!G.Inv.has(c)) { G.UI.toast('Нужно: ' + Object.keys(c).map(k => G.ITEMS[k].name + ' ×' + c[k]).join(', '), null, 'bad'); return; }
        G.Inv.take(c); const o = t.o, x = o.x, y = o.y; m.remove(o); m.add(up, x, y, { b: 1 }); G.Audio.sfx('build'); G.UI.toast('Улучшено: ' + G.BUILD[up].name, up, null, 1); bus.emit('build', { id: up });
      }
    },
    refund(id) { const b = G.BUILD[id]; if (!b) return; for (const k in b.cost) { const n = Math.floor(b.cost[k] / 2); if (n) G.Inv.give(k, n); } },
    rotate() { Build.rot = (Build.rot + 1) & 3; G.Audio.sfx('ui'); },
    swapMat() { const b = G.BUILD[Build.sel]; if (b && b.alt) { Build.sel = b.alt; bus.emit('buildmode'); G.Audio.sfx('ui'); } else G.UI.toast('У этой постройки один материал', null, null, 1); },
    reason() {
      const id = Build.carry ? Build.carry.t : Build.sel, b = G.BUILD[id];
      if (Build.locked(id)) return 'Нужен навык «Новые конструкции» ' + b.skill;
      if (!Build.carry && !Build.affordable(id)) return 'Не хватает материалов';
      if (b.on === 'water') return 'Мост ставится только на воду';
      if (b.on === 'cliff') return 'Лестница ставится на скалу';
      return 'Здесь строить нельзя';
    },
    draw(c, ox, oy) {
      if (!Build.on) return; const m = G.map, A = G.Art, [w, h] = Build.mode === 'place' || Build.carry ? Build.size() : [1, 1], x0 = Build.tx * TS - ox, y0 = Build.ty * TS - oy;
      Build.ok = Build.check();
      c.fillStyle = 'rgba(255,255,255,.14)';
      for (let j = -4; j <= 4 + h; j++) c.fillRect(x0 - 4 * TS, y0 + j * TS, (8 + w) * TS, 1);
      for (let i = -4; i <= 4 + w; i++) c.fillRect(x0 + i * TS, y0 - 4 * TS, 1, (8 + h) * TS);
      const col = Build.mode === 'remove' ? (Build.ok ? '#ff6a4a' : '#7c7888') : Build.ok ? '#62e05a' : '#ff4f5a';
      c.globalAlpha = .28; c.fillStyle = col; c.fillRect(x0, y0, w * TS, h * TS); c.globalAlpha = 1;
      c.strokeStyle = col; c.lineWidth = 1; c.strokeRect(x0 + .5, y0 + .5, w * TS - 1, h * TS - 1);
      if (Build.mode === 'place' || Build.carry) {
        const id = Build.carry ? Build.carry.t : Build.sel, b = G.BUILD[id], d = G.OBJ[id]; c.globalAlpha = .6;
        if (b.kind === 'tile') { const set = TD[T[b.tile]].set; const img = A.tiles[set === 'cliff' ? 'cliff_g' : set]; c.drawImage(img, 0, 0, 16, 16, x0, y0, 16, 16); }
        else if (b.kind === 'roof') c.drawImage(A.tiles['roof' + b.roof], 0, 0, 16, 16, x0, y0 - 10, 16, 16);
        else { const fake = { t: id, x: Build.tx, y: Build.ty, v: 0, rot: Build.rot, b: 1 }; const nm = G.R.objSprite(m, fake, d); const s = A.spr[nm]; if (s) c.drawImage(s.c, x0 + ((w * TS - s.w) >> 1), d.flat ? y0 : y0 + h * TS - s.h); }
        c.globalAlpha = 1;
      }
    }
  };
})();
