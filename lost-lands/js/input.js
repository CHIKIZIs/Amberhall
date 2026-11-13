'use strict';
/* Ввод: сенсорный джойстик и кнопки + клавиатура и мышь для компьютера. */
(() => {
  const I = G.Input = { mx: 0, my: 0, mag: 0, atk: false, block: false, atkP: false, dodgeP: false, interP: false, useP: false, swapP: false, keys: {}, joy: null, any() { return I.mag > .2 || I.atkP || I.interP || I.useP || I.dodgeP; }, clear() { I.atkP = I.dodgeP = I.interP = I.useP = I.swapP = false; } };
  let stick = null;
  I.init = () => {
    const zone = G.$('joyzone'), base = G.$('joy'), knob = G.$('joyk');
    const R = () => base.offsetWidth * .42;
    const setK = (dx, dy) => { knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; };
    zone.addEventListener('pointerdown', e => {
      if (stick || G.paused) return; e.preventDefault(); zone.setPointerCapture(e.pointerId);
      const r = zone.getBoundingClientRect(); stick = { id: e.pointerId, x: e.clientX, y: e.clientY };
      base.style.left = (e.clientX - r.left) + 'px'; base.style.top = (e.clientY - r.top) + 'px'; base.classList.add('on'); setK(0, 0);
    });
    zone.addEventListener('pointermove', e => {
      if (!stick || e.pointerId !== stick.id) return; let dx = e.clientX - stick.x, dy = e.clientY - stick.y; const r = R(), l = Math.hypot(dx, dy);
      if (l > r) { /* «плавающий» джойстик подтягивается за пальцем */ stick.x += dx * (1 - r / l) * .5; stick.y += dy * (1 - r / l) * .5; const zr = zone.getBoundingClientRect(); base.style.left = (stick.x - zr.left) + 'px'; base.style.top = (stick.y - zr.top) + 'px'; dx = e.clientX - stick.x; dy = e.clientY - stick.y; }
      const l2 = Math.hypot(dx, dy), k = Math.min(1, l2 / r); I.joy = l2 > 0 ? [dx / l2 * k, dy / l2 * k] : [0, 0]; setK(dx / Math.max(1, l2) * Math.min(l2, r), dy / Math.max(1, l2) * Math.min(l2, r));
    });
    const end = e => { if (!stick || e.pointerId !== stick.id) return; stick = null; I.joy = null; base.classList.remove('on'); setK(0, 0); };
    zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end);
    /* кнопки действий */
    const btn = (id, down, up) => { const el = G.$(id); if (!el) return; el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); el.setPointerCapture(e.pointerId); el.classList.add('pr'); G.Audio.unlock(); down(); }); const u = e => { el.classList.remove('pr'); if (up) up(); }; el.addEventListener('pointerup', u); el.addEventListener('pointercancel', u); };
    btn('b-atk', () => { if (G.Build.on) { G.Build.confirm(); return; } I.atk = true; I.atkP = true; }, () => { I.atk = false; });
    btn('b-dodge', () => { I.dodgeP = true; });
    btn('b-block', () => { I.block = true; }, () => { I.block = false; });
    btn('b-inter', () => { I.interP = true; });
    btn('b-use', () => { I.useP = true; });
    btn('b-swap', () => { I.swapP = true; });
    /* клавиатура */
    const K = I.keys;
    addEventListener('keydown', e => {
      if (e.repeat) return; const k = e.key.toLowerCase(); K[k] = true; G.Audio.unlock();
      if (G.UI.keyDown && G.UI.keyDown(k, e)) return;
      if (G.paused) return;
      if (k === ' ' || k === 'j') { if (G.Build.on) G.Build.confirm(); else { I.atk = true; I.atkP = true; } e.preventDefault(); }
      if (k === 'control' || k === 'l' || k === 'д') I.dodgeP = true;
      if (k === 'k') I.block = true;
      if (k === 'e' || k === 'enter') I.interP = true;
      if (k === 'q') I.useP = true;
      if (k === 'tab') { I.swapP = true; e.preventDefault(); }
      if (k === 'r' && G.Build.on) G.Build.rotate();
      if (k >= '1' && k <= '8') { G.inv.sel = +k - 1; G.bus.emit('inv'); }
    });
    addEventListener('keyup', e => { const k = e.key.toLowerCase(); K[k] = false; if (k === ' ' || k === 'j') I.atk = false; if (k === 'k') I.block = false; });
    addEventListener('blur', () => { for (const k in K) K[k] = false; I.atk = I.block = false; });
    /* мышь/касание по миру — для режима строительства */
    G.$('game').addEventListener('pointerdown', e => { if (!G.Build.on || G.paused) return; const R = G.R, r = R.cv.getBoundingClientRect(); const wx = (e.clientX - r.left) / r.width * R.vw + R.cam.sx, wy = (e.clientY - r.top) / r.height * R.vh + R.cam.sy; G.Build.tapWorld(wx, wy); });
  };
  I.update = () => {
    const K = I.keys; let x = 0, y = 0;
    if (K.a || K.arrowleft || K['ф']) x -= 1; if (K.d || K.arrowright || K['в']) x += 1; if (K.w || K.arrowup || K['ц']) y -= 1; if (K.s || K.arrowdown || K['ы']) y += 1;
    if (x || y) { const l = Math.hypot(x, y); I.mx = x / l; I.my = y / l; I.mag = K.shift ? 1 : .8; }
    else if (I.joy) { I.mag = Math.hypot(I.joy[0], I.joy[1]); I.mx = I.mag ? I.joy[0] / I.mag : 0; I.my = I.mag ? I.joy[1] / I.mag : 0; }
    else { I.mx = I.my = I.mag = 0; }
    if (G.paused) { I.mag = 0; I.clear(); }
  };
})();
