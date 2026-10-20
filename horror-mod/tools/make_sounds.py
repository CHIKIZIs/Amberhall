#!/usr/bin/env python3
"""Синтез жутких звуков (numpy -> wav -> ogg через ffmpeg) и sounds.json.  Запуск из horror-mod:  python3 tools/make_sounds.py"""
import json, os, subprocess, tempfile, wave
import numpy as np

SR = 44100
OUT = "src/main/resources/assets/dread/sounds"
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(13)

def t_(sec): return np.arange(int(SR * sec)) / SR
def norm(x, peak=0.9): return x / max(1e-9, np.max(np.abs(x))) * peak
def env(sec, a, d, curve=2.0):
    t = t_(sec); e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d * curve); return e
def noise(sec): return rng.standard_normal(int(SR * sec))
def bandpass(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X[(f < lo) | (f > hi)] = 0; return np.fft.irfft(X, len(x))
def lowpass(x, hi): return bandpass(x, 0, hi)
def echo(x, delays=((0.11, 0.45), (0.23, 0.3), (0.41, 0.18))):
    out = np.copy(x)
    for d, g in delays:
        n = int(d * SR); out[n:] += x[:-n] * g
    return out
def saw(freq): 
    ph = np.cumsum(freq) / SR; return 2 * (ph % 1) - 1
def save(name, x):
    x = np.clip(x, -1, 1); pcm = (x * 32767).astype(np.int16)
    with tempfile.TemporaryDirectory() as d:
        w = os.path.join(d, "a.wav")
        with wave.open(w, "wb") as f:
            f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes(pcm.tobytes())
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", w, "-c:a", "libvorbis", "-q:a", "4", f"{OUT}/{name}.ogg"], check=True)

# --- крик: рассинхронные пилы с падающим тоном, вибрато, шум и жёсткий клиппинг
def scream():
    sec = 1.8; t = t_(sec)
    base = 900 * np.exp(-t * 0.55) + 250
    vib = 1 + 0.06 * np.sin(2 * np.pi * 7.5 * t) + 0.03 * np.sin(2 * np.pi * 31 * t)
    x = sum(saw(base * vib * r) * a for r, a in ((1, 1.0), (1.51, 0.7), (2.02, 0.5), (0.5, 0.6), (1.34, 0.45)))
    x += bandpass(noise(sec), 1200, 5200) * 0.9
    x *= np.minimum(1, t / 0.02) * np.exp(-np.maximum(0, t - 0.9) * 1.8)
    x = np.tanh(x * 2.2)
    return norm(echo(x, ((0.07, 0.35), (0.15, 0.2))), 0.97)

# --- удар: кластер диссонансов + металлический шум
def sting():
    sec = 1.6; t = t_(sec)
    x = sum(np.sin(2 * np.pi * f * t) * a for f, a in ((110, 1), (116.5, 1), (164.8, .8), (233, .7), (329.6, .5), (349.2, .5), (415.3, .4)))
    x *= np.exp(-t * 2.2)
    n = bandpass(noise(sec), 2500, 9000) * np.exp(-t * 14)
    x = np.tanh((x * 0.5 + n * 1.8) * 1.6) * np.minimum(1, t / 0.004)
    return norm(echo(x), 0.95)

# --- шёпот: шум 1.5–6 кГц, рубленый как слоги
def whisper(seed):
    r = np.random.default_rng(seed); sec = 3.6; t = t_(sec)
    n = bandpass(r.standard_normal(len(t)), 1500, 6500) + 0.5 * bandpass(r.standard_normal(len(t)), 500, 1400)
    e = np.zeros_like(t); pos = 0.1
    while pos < sec - 0.3:
        L = r.uniform(0.08, 0.28); a = (t >= pos) & (t < pos + L)
        e[a] = np.sin(np.pi * (t[a] - pos) / L) ** 0.7 * r.uniform(0.5, 1); pos += L + r.uniform(0.03, 0.25)
    sway = 0.7 + 0.3 * np.sin(2 * np.pi * 0.4 * t)
    return norm(echo(n * e * sway, ((0.18, 0.4), (0.37, 0.25))), 0.85)

def thud(sec, f0=85, f1=45, noise_amt=0.6):
    t = t_(sec); f = f1 + (f0 - f1) * np.exp(-t * 30)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) + noise_amt * lowpass(noise(sec), 400)) * np.exp(-t * 16)

def footsteps():
    sec = 3.4; x = np.zeros(int(SR * sec))
    for pos in (0.2, 0.75, 1.25, 1.85, 2.4, 2.9):
        th = thud(0.4) * rng.uniform(0.7, 1); n = int(pos * SR); x[n:n + len(th)] += th[:len(x) - n]
    return norm(echo(x, ((0.2, 0.3),)), 0.9)

def knock():
    sec = 2.0; x = np.zeros(int(SR * sec))
    for pos in (0.15, 0.62, 1.1):
        t = t_(0.35); k = (np.sin(2 * np.pi * 190 * t) * 0.8 + bandpass(noise(0.35), 300, 2500) * 0.5) * np.exp(-t * 28)
        n = int(pos * SR); x[n:n + len(k)] += k
    return norm(echo(x, ((0.15, 0.3),)), 0.95)

def breath():
    sec = 4.2; t = t_(sec); n = bandpass(noise(sec), 300, 3500)
    cyc = np.clip(np.sin(2 * np.pi * t / 2.1 - 0.6), 0, 1) ** 1.5       # вдох-выдох
    n = n * cyc * (1 + 0.4 * bandpass(noise(sec), 5, 40))
    return norm(echo(lowpass(n, 3000), ((0.2, 0.3),)), 0.8)

def heartbeat():
    sec = 1.2; x = np.zeros(int(SR * sec))
    for pos, f, a in ((0.02, 62, 1.0), (0.3, 52, 0.8)):
        t = t_(0.3); b = np.sin(2 * np.pi * f * t) * np.exp(-t * 18) * a
        n = int(pos * SR); x[n:n + len(b)] += b
    return norm(x, 0.95)

def drone():
    sec = 8.0; t = t_(sec)
    x = saw(np.full_like(t, 41.0)) * 0.6 + saw(np.full_like(t, 43.3)) * 0.6 + np.sin(2 * np.pi * 82.1 * t) * 0.3
    x = lowpass(x, 260) + lowpass(noise(sec), 120) * 0.5
    x *= (0.75 + 0.25 * np.sin(2 * np.pi * 0.25 * t)) * np.minimum(1, t / 1.5) * np.minimum(1, (sec - t) / 1.5)
    return norm(x, 0.8)

def static():
    sec = 1.2; t = t_(sec); n = noise(sec) * (0.6 + 0.4 * (rng.random(len(t)) > 0.995))
    n = bandpass(n, 400, 14000) * (np.abs(np.sin(2 * np.pi * 11 * t)) > 0.1)
    return norm(n * np.minimum(1, t / 0.01) * np.minimum(1, (sec - t) / 0.2), 0.8)

def creak():
    sec = 2.2; t = t_(sec)
    f = 180 + 260 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.7 * t)) + 50 * np.sin(2 * np.pi * 9 * t)
    x = saw(f) * 0.5 + bandpass(noise(sec), 800, 3000) * 0.25
    x = lowpass(x, 3500) * np.minimum(1, t / 0.2) * np.minimum(1, (sec - t) / 0.6)
    return norm(echo(x, ((0.14, 0.3),)), 0.8)

def swell():
    sec = 3.5; t = t_(sec)
    x = sum(np.sin(2 * np.pi * f * t) for f in (55, 58.3, 110, 164.8)) + lowpass(noise(sec), 200)
    return norm(x * (t / sec) ** 2 * np.minimum(1, (sec - t) / 0.4), 0.85)

SOUNDS = {"scream": scream(), "sting": sting(), "whisper_1": whisper(1), "whisper_2": whisper(2), "whisper_3": whisper(3), "footsteps": footsteps(),
          "knock": knock(), "breath": breath(), "heartbeat": heartbeat(), "drone": drone(), "static": static(), "creak": creak(), "swell": swell()}
for name, data in SOUNDS.items(): save(name, data)
ev = {"scream": ["scream"], "sting": ["sting"], "whisper": ["whisper_1", "whisper_2", "whisper_3"], "footsteps": ["footsteps"], "knock": ["knock"],
      "breath": ["breath"], "heartbeat": ["heartbeat"], "drone": ["drone"], "static": ["static"], "creak": ["creak"], "swell": ["swell"]}
sj = {k: {"sounds": [f"dread:{s}" for s in v], "subtitle": f"subtitles.dread.{k}"} for k, v in ev.items()}
open("src/main/resources/assets/dread/sounds.json", "w", encoding="utf-8").write(json.dumps(sj, indent=2) + "\n")
print("ok", {k: os.path.getsize(f"{OUT}/{k}.ogg") // 1024 for k in SOUNDS})
