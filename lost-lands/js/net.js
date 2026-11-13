'use strict';
/* Сеть: основа мультиплеера.
   Хост — тот, чей мир; гости получают сид и состояние мира от хоста и дальше обмениваются:
   • 'p'   — положение и вид игрока (10 раз в секунду);
   • 'op'  — изменения мира (объект изменён/добавлен/удалён, клетка, крыша);
   • 'hello'/'welcome'/'bye' — вход и выход.
   Транспорт подменяемый: LocalBus (вкладки одного браузера, для проверки) или WebSocket (relay-сервер server/relay.js). */
(() => {
  const bus = G.bus, TS = 16;
  const STATE_KEYS = ['dead', 'last', 'open', 'inv', 'crop', 'g', 'wet', 'searched', 'unsealed', 'hp', 'out', 'rot', 'v', 'b'];
  const Net = G.Net = { mode: 'off', id: Math.random().toString(36).slice(2, 9), name: 'Игрок', room: '', peers: new Map(), pending: {}, applying: false, sendT: 0, t: null };

  /* ---------- транспорты ---------- */
  function LocalBus(room) { const ch = new BroadcastChannel('lostlands-' + room); const t = { send: m => ch.postMessage(m), close: () => ch.close(), onmsg: null }; ch.onmessage = e => t.onmsg && t.onmsg(e.data); setTimeout(() => t.onopen && t.onopen(), 0); return t; }
  function Ws(url, room) {
    const ws = new WebSocket(url); const t = { send: m => { if (ws.readyState === 1) ws.send(JSON.stringify(m)); }, close: () => ws.close(), onmsg: null };
    ws.onopen = () => { ws.send(JSON.stringify({ k: 'join', room })); t.onopen && t.onopen(); };
    ws.onmessage = e => { try { t.onmsg && t.onmsg(JSON.parse(e.data)); } catch (er) { } };
    ws.onclose = () => { if (Net.mode !== 'off') { G.UI.toast('Соединение с сервером потеряно', null, 'bad'); Net.stop(); } };
    ws.onerror = () => G.UI.toast('Не удалось подключиться к серверу', null, 'bad');
    return t;
  }
  const open = (room, url) => url ? Ws(url, room) : LocalBus(room);
  Net.send = (k, d) => { if (Net.t) Net.t.send(Object.assign({ k, from: Net.id }, d)); };

  /* ---------- хост и гость ---------- */
  Net.host = (room, url) => {
    if (!G.running) return; Net.stop(); Net.mode = 'host'; Net.room = room; Net.t = open(room, url);
    Net.t.onmsg = onMsg; Net.t.onopen = () => G.UI.toast('Мир открыт для друзей. Код комнаты: ' + room, 'ui_ok');
  };
  Net.join = (room, url, name, onReady) => {
    Net.stop(); Net.mode = 'client'; Net.room = room; Net.name = name || Net.name; Net.onReady = onReady; Net.t = open(room, url);
    Net.t.onmsg = onMsg; Net.t.onopen = () => { Net.send('hello', { name: Net.name }); Net.helloT = setTimeout(() => { if (Net.mode === 'client' && !Net.ready) { G.UI.toast('Комната «' + room + '» не отвечает', null, 'bad'); Net.stop(); onReady && onReady(null); } }, 5000); };
  };
  Net.stop = () => { if (Net.t) { Net.send('bye', {}); Net.t.close(); } Net.t = null; Net.mode = 'off'; Net.peers.clear(); Net.ready = false; clearTimeout(Net.helloT); };
  Net.on = () => Net.mode !== 'off';

  /* снимок мира для нового гостя: сид и изменения всех загруженных карт */
  const snapshot = () => { const maps = {}; for (const id in G.maps) maps[id] = G.Save.packMap(G.maps[id]); return { seed: G.S.seed, seedText: G.S.seedText, name: G.S.name, time: G.time.total, maps, weather: [G.Weather.type, G.Weather.t], pos: G.map.id === 'world' ? [Math.round(G.player.x), Math.round(G.player.y)] : null }; };

  function onMsg(m) {
    if (!m || m.from === Net.id) return;
    if (m.to && m.to !== Net.id) return;
    switch (m.k) {
      case 'hello': if (Net.mode === 'host') { Net.send('welcome', Object.assign({ to: m.from, host: Net.name }, snapshot())); G.UI.toast(m.name + ' присоединился', 'ui_ok'); } break;
      case 'welcome': if (Net.mode === 'client' && !Net.ready) { Net.ready = true; clearTimeout(Net.helloT); Net.onReady && Net.onReady(m); G.UI.toast('Вы в мире игрока ' + m.host, 'ui_ok'); } break;
      case 'p': { let pe = Net.peers.get(m.from); if (!pe) { pe = { id: m.from, x: m.x, y: m.y }; Net.peers.set(m.from, pe); } Object.assign(pe, m, { seen: performance.now() }); if (Net.mode === 'client' && m.time != null && Math.abs(G.time.total - m.time) > 5) G.time.total = m.time; break; }
      case 'bye': { const pe = Net.peers.get(m.from); if (pe) G.UI.toast((pe.name || 'Игрок') + ' вышел', null, null, 1); Net.peers.delete(m.from); break; }
      case 'op': applyOp(m.op); break;
    }
  }

  /* ---------- операции над миром ---------- */
  Net.op = op => { if (!Net.on() || Net.applying) return; Net.send('op', { op }); };
  const stateOf = o => { const s = {}; for (const k of STATE_KEYS) if (o[k] !== undefined) s[k] = o[k]; return s; };
  Net.obj = (m, o) => Net.op({ t: 'obj', map: m.id, x: o.x, y: o.y, ot: o.t, s: stateOf(o) });
  Net.add = (m, o) => Net.op({ t: 'add', map: m.id, x: o.x, y: o.y, ot: o.t, s: stateOf(o) });
  Net.del = (m, x, y) => Net.op({ t: 'del', map: m.id, x, y });
  Net.tile = (m, x, y, tile, old) => Net.op({ t: 'tile', map: m.id, x, y, tile, old });
  Net.roof = (m, k, v) => Net.op({ t: 'roof', map: m.id, k, v });
  function applyOp(op) {
    const m = G.maps[op.map]; if (!m) { (Net.pending[op.map] || (Net.pending[op.map] = [])).push(op); return; }
    Net.applying = true;
    try {
      if (op.t === 'obj') { const o = m.at(op.x, op.y); if (o && o.t === op.ot) { Object.assign(o, op.s); if (o.dead && !m.deadList.includes(o)) m.deadList.push(o); } }
      else if (op.t === 'add') { const ex = m.at(op.x, op.y); if (ex) m.remove(ex); const o = m.add(op.ot, op.x, op.y, op.s || {}); if (o && o.b) G.Ent.burst(op.x * TS + 8, op.y * TS + 10, ['#d9d3be', '#b38655'], 6, 40); }
      else if (op.t === 'del') { const o = m.at(op.x, op.y); if (o) { m.remove(o); if (!o.b) (m.gone || (m.gone = [])).push(op.y * m.w + op.x); } }
      else if (op.t === 'tile') { m.tmods = m.tmods || {}; const k = op.y * m.w + op.x; if (op.old == null) delete m.tmods[k]; else m.tmods[k] = [op.tile, op.old]; m.setTile(op.x, op.y, op.tile); }
      else if (op.t === 'roof') { m.rmods = m.rmods || {}; if (op.v) m.rmods[op.k] = op.v; else delete m.rmods[op.k]; m.roof[op.k] = op.v || 0; }
    } finally { Net.applying = false; }
  }
  Net.flushPending = m => { const q = Net.pending[m.id]; if (!q) return; delete Net.pending[m.id]; for (const op of q) applyOp(op); };

  /* ---------- отправка своего состояния и отрисовка других ---------- */
  Net.update = dt => {
    if (!Net.on() || !G.player) return; Net.sendT -= dt;
    if (Net.sendT <= 0) { Net.sendT = .1; const p = G.player, L = G.Art.lookOf(G.inv.eq); Net.send('p', { name: Net.name, map: G.map.id, x: Math.round(p.x), y: Math.round(p.y), dir: p.dir, st: p.state, look: L, hp: Math.round(p.hp), time: Net.mode === 'host' ? G.time.total : null }); }
    const now = performance.now(); for (const [id, pe] of Net.peers) { if (now - pe.seen > 8000) Net.peers.delete(id); pe.rx = pe.rx == null ? pe.x : pe.rx + (pe.x - pe.rx) * Math.min(1, dt * 12); pe.ry = pe.ry == null ? pe.y : pe.ry + (pe.y - pe.ry) * Math.min(1, dt * 12); pe.anim = (pe.anim || 0) + dt; }
  };
  function drawPeer(c, pe, ox, oy) {
    const x = Math.round(pe.rx - ox), y = Math.round(pe.ry - oy), walk = pe.st === 'walk' || pe.st === 'run', leg = walk ? Math.floor(pe.anim * (pe.st === 'run' ? 13 : 8)) % 4 : 0;
    const look = pe.look && pe.look.k ? pe.look : G.Art.lookOf(null);
    c.drawImage(G.Art.spr.sh1.c, x - 6, y - 3);
    c.drawImage(G.Art.charFrame(look, pe.dir || 0, leg, walk ? [0, 1, 0, 2][leg] : 0, leg % 2, 0), x - 12, y - 29);
    const nm = pe.name || 'Игрок'; c.font = '8px PX, monospace'; const w = Math.ceil(c.measureText(nm).width) + 6;
    c.fillStyle = 'rgba(13,11,26,.75)'; c.fillRect(x - (w >> 1), y - 41, w, 10); c.fillStyle = '#fbe27a'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(nm, x, y - 36); c.textAlign = 'left';
  }
  Net.gather = R => { if (!Net.on()) return; for (const pe of Net.peers.values()) if (pe.map === G.map.id && pe.rx != null) R.push(pe.ry, drawPeer, pe); };
  Net.count = () => Net.peers.size + 1;
})();
