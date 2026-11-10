// Звуки синтезируются на лету, файлов нет.
let ac = null, on = true, last = {};
export function setSound(v) { on = v; }
export function unlock() {
  if (!on) return;
  try { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); } catch (e) { ac = null; }
}
export function suspend() { try { if (ac) ac.suspend(); } catch (e) {} }
function tone(f, dur, type = 'sine', vol = 0.15, slide = 1, delay = 0) {
  if (!on || !ac || ac.state !== 'running') return;
  const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide !== 1) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol = 0.15, freq = 1200) {
  if (!on || !ac || ac.state !== 'running') return;
  const n = Math.floor(ac.sampleRate * dur), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter();
  s.buffer = b; f.type = 'lowpass'; f.frequency.value = freq; g.gain.value = vol; s.connect(f); f.connect(g); g.connect(ac.destination); s.start();
}
// Не чаще одного раза в gap секунд на звук, чтобы толпа врагов не превращалась в шум.
const lim = (k, gap, fn) => (...a) => { const now = performance.now(); if (now - (last[k] || 0) < gap * 1000) return; last[k] = now; fn(...a); };
export const sfx = {
  hit: lim('hit', 0.05, () => { noise(0.07, 0.16, 2400); tone(240, 0.06, 'square', 0.05, 0.6); }),
  hurt: lim('hurt', 0.12, () => { tone(160, 0.16, 'sawtooth', 0.14, 0.5); noise(0.1, 0.12, 900); try { if (on && navigator.vibrate) navigator.vibrate(18); } catch (e) {} }),
  die: lim('die', 0.06, () => tone(300, 0.18, 'triangle', 0.12, 0.3)),
  swing: lim('swing', 0.08, () => noise(0.09, 0.07, 3500)),
  slam: lim('slam', 0.1, () => { tone(90, 0.3, 'sine', 0.3, 0.4); noise(0.22, 0.2, 500); }),
  shoot: lim('shoot', 0.06, () => tone(700, 0.09, 'triangle', 0.08, 0.5)),
  cast: lim('cast', 0.08, () => tone(420, 0.2, 'sine', 0.1, 1.9)),
  dash: () => noise(0.14, 0.1, 1800),
  sup: () => { tone(330, 0.12, 'square', 0.1); tone(495, 0.12, 'square', 0.1, 1, 0.08); tone(660, 0.22, 'square', 0.1, 1, 0.16); },
  coin: () => { tone(880, 0.07, 'square', 0.07); tone(1320, 0.12, 'square', 0.07, 1, 0.06); },
  click: () => tone(520, 0.05, 'triangle', 0.1, 1.3),
  deny: () => tone(170, 0.14, 'square', 0.08, 0.8),
  chest: () => { [392, 523, 659, 784].forEach((f, i) => tone(f, 0.16, 'triangle', 0.13, 1, i * 0.08)); },
  up: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.14, 'square', 0.08, 1, i * 0.07)); },
  win: () => { [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.22, 'triangle', 0.15, 1, i * 0.11)); },
  lose: () => { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.3, 'triangle', 0.14, 0.9, i * 0.18)); },
  boss: () => { tone(70, 0.8, 'sawtooth', 0.2, 0.7); tone(105, 0.8, 'sawtooth', 0.12, 0.7, 0.1); },
};
