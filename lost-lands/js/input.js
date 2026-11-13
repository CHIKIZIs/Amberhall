'use strict';
/* Ввод для ПК: WASD — движение, мышь — прицел, ЛКМ — атака (удержание — сильная), ПКМ — блок,
   Пробел — рывок, Shift — бег, E — взаимодействие, Q/F — применить, 1-8 и колесо — панель. */
(() => {
  const I = G.Input = { mx: 0, my: 0, mag: 0, run: false, atk: false, block: false, atkP: false, dodgeP: false, interP: false, useP: false, swapP: false, keys: {},
    sx: -1, sy: -1, wx: 0, wy: 0, onCanvas: false,
    any() { return I.mag > .2 || I.atkP || I.interP || I.useP || I.dodgeP; }, clear() { I.atkP = I.dodgeP = I.interP = I.useP = I.swapP = false; } };
  /* экранные координаты курсора → мировые */
  I.toWorld = () => { const R = G.R; if (!R.cv) return; const r = R.cv.getBoundingClientRect(); I.wx = (I.sx - r.left) / r.width * R.vw + R.cam.sx; I.wy = (I.sy - r.top) / r.height * R.vh + R.cam.sy; };
  /* угол от героя к курсору */
  I.aim = () => { const p = G.player; I.toWorld(); return Math.atan2(I.wy - (p.y - 10), I.wx - p.x); };
  I.init = () => {
    const cv = G.$('game');
    addEventListener('mousemove', e => { I.sx = e.clientX; I.sy = e.clientY; I.onCanvas = e.target === cv; });
    cv.addEventListener('mousedown', e => {
      G.Audio.unlock(); if (G.paused || !G.running) return; e.preventDefault();
      if (G.Build.on) { if (e.button === 0) G.Build.confirm(); else if (e.button === 2) G.Build.exit(); return; }
      if (e.button === 0) { I.atk = true; I.atkP = true; } else if (e.button === 2) I.block = true;
    });
    addEventListener('mouseup', e => { if (e.button === 0) I.atk = false; if (e.button === 2) I.block = false; });
    cv.addEventListener('wheel', e => { if (G.paused || !G.running) return; e.preventDefault(); if (G.Build.on && e.shiftKey) { G.Build.rotate(); return; } G.inv.sel = (G.inv.sel + (e.deltaY > 0 ? 1 : 7)) % 8; G.bus.emit('inv'); G.Audio.sfx('ui'); }, { passive: false });
    const K = I.keys;
    addEventListener('keydown', e => {
      const k = e.key.toLowerCase(), code = e.code; G.Audio.unlock();
      if (/INPUT|TEXTAREA/.test(e.target.tagName)) return;
      if (['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) e.preventDefault();
      if (e.repeat) return; K[code] = true;
      if (G.UI.keyDown && G.UI.keyDown(k, e)) return;
      if (G.paused || !G.running) return;
      if (code === 'Space') I.dodgeP = true;
      if (code === 'KeyE') I.interP = true;
      if (code === 'KeyQ' || code === 'KeyF') I.useP = true;
      if (code === 'KeyR' && G.Build.on) G.Build.rotate();
      if (code === 'KeyT' && G.Build.on) G.Build.swapMat();
      if (/^Digit[1-8]$/.test(code)) { G.inv.sel = +code[5] - 1; G.bus.emit('inv'); G.Audio.sfx('ui'); }
    });
    addEventListener('keyup', e => { K[e.code] = false; });
    addEventListener('blur', () => { for (const k in K) K[k] = false; I.atk = I.block = false; });
    addEventListener('contextmenu', e => e.preventDefault());
  };
  I.update = () => {
    const K = I.keys; let x = 0, y = 0;
    if (K.KeyA || K.ArrowLeft) x -= 1; if (K.KeyD || K.ArrowRight) x += 1; if (K.KeyW || K.ArrowUp) y -= 1; if (K.KeyS || K.ArrowDown) y += 1;
    if (x || y) { const l = Math.hypot(x, y); I.mx = x / l; I.my = y / l; I.mag = 1; } else { I.mx = I.my = I.mag = 0; }
    I.run = !!(K.ShiftLeft || K.ShiftRight);
    if (G.paused) { I.mag = 0; I.clear(); I.atk = false; }
  };
})();
