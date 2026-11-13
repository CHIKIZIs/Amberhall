'use strict';
/* Сервер-ретранслятор для сетевой игры Lost Lands.
   Запуск: npm install && npm start  (порт по умолчанию 8787, можно задать PORT=...)
   В игре: хост в «Настройках» вводит адрес ws://ВАШ_IP:8787 и открывает мир; друзья вводят тот же адрес и код комнаты.
   Сервер ничего не хранит: держит комнаты по коду и пересылает сообщения внутри комнаты. */
const http = require('http');
const { WebSocketServer } = require('ws');
const PORT = +process.env.PORT || 8787;
const rooms = new Map();
const server = http.createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' }); res.end('Lost Lands relay: комнат ' + rooms.size + '\n'); });
const wss = new WebSocketServer({ server, maxPayload: 8 * 1024 * 1024 });
wss.on('connection', ws => {
  let room = null;
  ws.on('message', raw => {
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    if (m.k === 'join') { const code = String(m.room || '').slice(0, 16); if (!code) return; room = code; if (!rooms.has(room)) rooms.set(room, new Set()); rooms.get(room).add(ws); return; }
    if (!room) return;
    const data = typeof raw === 'string' ? raw : raw.toString();
    for (const peer of rooms.get(room)) if (peer !== ws && peer.readyState === 1) peer.send(data);
  });
  ws.on('close', () => { if (!room) return; const set = rooms.get(room); if (!set) return; set.delete(ws); if (!set.size) rooms.delete(room); });
});
server.listen(PORT, () => console.log('Lost Lands relay на порту ' + PORT));
