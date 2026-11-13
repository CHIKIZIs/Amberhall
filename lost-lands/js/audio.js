'use strict';
/* Audio Manager: все звуки и музыка синтезируются через WebAudio — без внешних файлов. */
(() => {
  let ctx = null, master, sfxG, musG, ambG, noiseBuf, rainSrc, rainG, windSrc, windG;
  const Au = G.Audio = { ok: false, mus: { t: 0, step: 0, biome: -1, fight: 0 } };
  Au.unlock = () => {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); master = ctx.createGain(); master.connect(ctx.destination);
    sfxG = ctx.createGain(); sfxG.connect(master); musG = ctx.createGain(); musG.connect(master); ambG = ctx.createGain(); ambG.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const loop = (filt, f) => { const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const fl = ctx.createBiquadFilter(); fl.type = filt; fl.frequency.value = f; const g = ctx.createGain(); g.gain.value = 0; s.connect(fl); fl.connect(g); g.connect(ambG); s.start(); return [s, g, fl]; };
    [rainSrc, rainG] = loop('highpass', 900); [windSrc, windG] = loop('lowpass', 420);
    Au.ok = true; Au.vol();
  };
  Au.vol = () => { if (!ctx) return; const S = G.settings; sfxG.gain.value = S.sfx; musG.gain.value = S.music * .55; ambG.gain.value = S.sfx * .8; };
  const now = () => ctx.currentTime;
  function tone(f, dur, type, vol, slide, delay, dest) {
    const t = now() + (delay || 0), o = ctx.createOscillator(), g = ctx.createGain(); o.type = type || 'square'; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol || .2, t + .008); g.gain.exponentialRampToValueAtTime(.001, t + dur); o.connect(g); g.connect(dest || sfxG); o.start(t); o.stop(t + dur + .02);
  }
  function noise(dur, f, q, vol, type, delay, slide) {
    const t = now() + (delay || 0), s = ctx.createBufferSource(); s.buffer = noiseBuf; const fl = ctx.createBiquadFilter(); fl.type = type || 'bandpass'; fl.frequency.setValueAtTime(f, t); if (slide) fl.frequency.exponentialRampToValueAtTime(slide, t + dur); fl.Q.value = q || 1;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol || .3, t); g.gain.exponentialRampToValueAtTime(.001, t + dur); s.connect(fl); fl.connect(g); g.connect(sfxG); s.start(t, Math.random()); s.stop(t + dur + .02);
  }
  const SFX = {
    swing: () => noise(.12, 1800, 1.5, .18, 'bandpass', 0, 600), swingh: () => noise(.2, 1200, 1.2, .25, 'bandpass', 0, 300),
    hit: () => { noise(.08, 900, 2, .35); tone(180, .08, 'square', .12, 90); }, crit: () => { noise(.1, 1400, 2, .4); tone(520, .12, 'square', .14, 260); tone(780, .1, 'triangle', .1, 0, .04); },
    hurt: () => { tone(300, .18, 'sawtooth', .18, 120); noise(.12, 600, 1, .2); }, death: () => { [392, 330, 262, 196].forEach((f, i) => tone(f, .35, 'triangle', .2, f * .9, i * .22)); },
    chop: () => { noise(.09, 700, 3, .5); tone(140, .07, 'square', .12, 90); }, mine: () => { noise(.06, 2600, 4, .35); tone(1200, .07, 'square', .08, 900); tone(1800, .05, 'triangle', .06, 0, .02); },
    treefall: () => { noise(.6, 400, .8, .4, 'lowpass', 0, 120); tone(90, .4, 'sine', .3, 40, .35); }, rockbreak: () => { noise(.3, 800, .8, .5, 'lowpass', 0, 200); },
    break: () => noise(.2, 1100, 1, .35, 'bandpass', 0, 400), thud: () => tone(110, .1, 'sine', .3, 60),
    gather: () => { noise(.12, 3000, 1, .15, 'highpass'); tone(660, .06, 'triangle', .08, 0, .05); },
    pickup: () => { tone(880, .06, 'square', .06); tone(1320, .08, 'square', .05, 0, .05); }, drop: () => tone(300, .08, 'triangle', .1, 180),
    eat: () => { for (let i = 0; i < 3; i++) noise(.05, 1500, 2, .2, 'bandpass', i * .1); }, drink: () => { for (let i = 0; i < 3; i++) tone(500 + i * 120, .08, 'sine', .12, 300, i * .1); },
    craft: () => { tone(420, .06, 'square', .08); noise(.06, 2000, 3, .2, 'bandpass', .06); }, craftdone: () => { tone(660, .08, 'square', .08); tone(990, .12, 'square', .08, 0, .08); },
    build: () => { noise(.08, 500, 2, .4); tone(160, .1, 'square', .12, 100, .02); noise(.06, 700, 2, .25, 'bandpass', .1); },
    chest: () => { tone(220, .1, 'square', .1, 330); tone(523, .15, 'triangle', .1, 0, .12); tone(659, .2, 'triangle', .1, 0, .2); },
    dooro: () => noise(.25, 300, 6, .3, 'bandpass', 0, 700), doorc: () => { noise(.15, 600, 6, .3, 'bandpass', 0, 250); tone(90, .08, 'sine', .3, 60, .14); },
    ui: () => tone(740, .04, 'square', .05), deny: () => tone(160, .14, 'square', .1, 120), equip: () => { noise(.08, 2500, 3, .15); tone(440, .06, 'square', .06, 0, .05); },
    levelup: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, .2, 'square', .08, 0, i * .09)), quest: () => [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, .25, 'triangle', .12, 0, i * .1)),
    discover: () => [659, 880, 1175].forEach((f, i) => tone(f, .25, 'triangle', .1, 0, i * .12)), secret: () => [523, 740, 988, 1319].forEach((f, i) => tone(f, .3, 'sine', .1, 0, i * .11)),
    roll: () => noise(.2, 900, .8, .2, 'lowpass', 0, 300), block: () => { tone(1400, .08, 'square', .1, 900); noise(.08, 3000, 2, .2); },
    bow: () => { tone(220, .12, 'triangle', .14, 110); noise(.1, 4000, 1, .1, 'highpass'); }, magic: () => { tone(880, .25, 'sine', .1, 1760); tone(1320, .2, 'triangle', .06, 660, .05); },
    die: () => { tone(260, .2, 'square', .1, 80); noise(.2, 800, 1, .2, 'lowpass', 0, 200); }, growl: () => { tone(90, .25, 'sawtooth', .12, 60); noise(.2, 300, 2, .1); },
    flap: () => { for (let i = 0; i < 3; i++) noise(.05, 1200, 1, .12, 'bandpass', i * .08); }, bird: () => { for (let i = 0; i < 3; i++) tone(2200 + Math.random() * 800, .07, 'sine', .04, 3000, i * .12); },
    boss: () => { tone(65, 1.2, 'sawtooth', .2, 55); tone(98, 1.2, 'square', .1, 80, .1); noise(1, 200, 1, .2, 'lowpass'); }, bossdie: () => { noise(1.2, 600, .7, .5, 'lowpass', 0, 80); [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .4, 'triangle', .1, 0, .6 + i * .12)); },
    slam: () => { tone(60, .4, 'sine', .5, 30); noise(.4, 400, .8, .5, 'lowpass', 0, 100); },
    thunder: () => { noise(2.2, 300, .6, .7, 'lowpass', 0, 60); noise(.3, 2000, .5, .3, 'bandpass'); },
    cast: () => noise(.3, 2500, 1, .12, 'highpass', 0, 600), bite: () => { tone(900, .05, 'square', .1); tone(900, .05, 'square', .1, 0, .1); }, splash: () => noise(.4, 1200, .6, .35, 'bandpass', 0, 300),
    water: () => noise(.35, 2500, .8, .15, 'highpass'), plant: () => noise(.15, 500, 1, .2, 'lowpass'), dig: () => noise(.18, 400, 1, .4, 'lowpass', 0, 150),
    unlock: () => { tone(1200, .05, 'square', .08); tone(800, .08, 'square', .08, 0, .08); }, lever: () => { noise(.2, 300, 4, .3); tone(140, .2, 'square', .08, 90); }, mech: () => { for (let i = 0; i < 6; i++) noise(.05, 1600, 6, .2, 'bandpass', i * .07); },
    fire: () => noise(.5, 800, .5, .25, 'lowpass', 0, 2000), spike: () => { tone(1800, .06, 'square', .08, 900); noise(.1, 3000, 2, .2); }, stairs: () => { for (let i = 0; i < 4; i++) noise(.06, 500, 2, .25, 'bandpass', i * .12); }
  };
  let last = {};
  Au.sfx = (n, v) => { if (!ctx || !SFX[n]) return; const t = performance.now(); if (last[n] && t - last[n] < 40) return; last[n] = t; SFX[n](); };
  const STEP = { grass: [1500, .06], sand: [2400, .08], stone: [900, .1], wood: [500, .12], snow: [3000, .1], water: [1100, .12] };
  Au.step = k => { if (!ctx) return; const s = STEP[k] || STEP.grass; noise(.06, s[0] * (.8 + Math.random() * .4), 1.5, s[1] * 1.6, k === 'grass' || k === 'snow' ? 'highpass' : 'bandpass'); };

  /* Музыка: спокойные арпеджио для каждого биома и напряжённая тема в бою */
  const SCALES = [[0, 2, 4, 7, 9], [0, 3, 5, 7, 10], [0, 2, 3, 7, 8], [0, 2, 4, 7, 9], [0, 3, 5, 7, 10], [0, 1, 3, 7, 8]];
  const ROOT = [57, 62, 52, 55, 50, 45];
  const mf = n => 440 * Math.pow(2, (n - 69) / 12);
  Au.update = dt => {
    if (!ctx || !G.player) return; const W = G.Weather, s = W.shown(), m = G.map;
    const rv = m.dark || m.indoor ? 0 : s === 'heavy' || s === 'storm' ? .5 : s === 'rain' ? .3 : 0, wv = m.dark ? .05 : s === 'snow' ? .3 : s === 'storm' ? .35 : .08 + (G.player.biome === G.BI.north ? .15 : 0);
    rainG.gain.setTargetAtTime(rv, now(), .8); windG.gain.setTargetAtTime(wv, now(), 1.2);
    const M = Au.mus, fight = G.Ent.mobs.some(q => q.aggro && !q.dead && q.def.ai !== 'flee' && Math.hypot(q.x - G.player.x, q.y - G.player.y) < 200) ? 1 : 0;
    M.fight += ((fight ? 1 : 0) - M.fight) * Math.min(1, dt * 1.5);
    M.t -= dt; if (M.t > 0) return;
    const bi = m.dark ? 5 : Math.max(0, G.player.biome - 1) % 6, sc = SCALES[bi], root = ROOT[bi], night = G.Time.isNight(), boss = !!G.Ent.bossRef;
    const tempo = boss ? .16 : M.fight > .5 ? .2 : night ? .5 : .38; M.t = tempo; M.step++;
    const st = M.step, bar = Math.floor(st / 8) % 4, chord = [0, 3, 4, 2][bar];
    if (boss || M.fight > .5) {
      if (st % 2 === 0) tone(mf(root - 12 + sc[chord % 5]), tempo * 1.8, 'sawtooth', .07, 0, 0, musG);
      if (st % 4 === 1) tone(mf(root + sc[(chord + st) % 5]), tempo * 1.5, 'square', .035, 0, 0, musG);
      if (st % 4 === 0) { const t = now(), s2 = ctx.createBufferSource(); s2.buffer = noiseBuf; const g = ctx.createGain(); g.gain.setValueAtTime(.12, t); g.gain.exponentialRampToValueAtTime(.001, t + .12); const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 180; s2.connect(f); f.connect(g); g.connect(musG); s2.start(t, Math.random()); s2.stop(t + .15); }
      return;
    }
    if (st % 8 === 0) tone(mf(root - 12 + sc[chord % 5]), tempo * 7, 'triangle', .07, 0, 0, musG);
    const pat = [0, 2, 1, 3, 2, 4, 3, 1], deg = (pat[st % 8] + chord) % 5, oct = (pat[st % 8] + chord) >= 5 ? 12 : 0;
    if (Math.random() < (night ? .55 : .8)) tone(mf(root + sc[deg] + oct), tempo * 2.2, night ? 'sine' : 'triangle', night ? .05 : .045, 0, 0, musG);
    if (st % 16 === 12 && Math.random() < .5) tone(mf(root + 12 + sc[(deg + 2) % 5]), tempo * 4, 'sine', .035, 0, 0, musG);
  };
})();
