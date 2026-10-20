#!/usr/bin/env python3
"""Собирает «настоящие» страшные звуки из CC0-материалов OpenGameArt (см. CREDITS.md): слои, смена высоты, реверб, перегруз.
Запуск после make_sounds.py:  python3 tools/import_sounds.py <папка со скачанными исходниками>
(исходники: screams.ogg, creatures/*.ogg, hit/..., heartbeat_slow_reverb.wav, i_see_you_voice.mp3, ... — список в CREDITS.md)"""
import json, os, subprocess, sys, tempfile, wave
import numpy as np

SR = 44100
SRC = sys.argv[1]
OUT = "src/main/resources/assets/dread/sounds"
rng = np.random.default_rng(5)

def load(rel, start=0.0, dur=None):
    path = os.path.join(SRC, rel)
    cmd = ["ffmpeg", "-v", "error", "-ss", str(start)] + (["-t", str(dur)] if dur else []) + ["-i", path, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"]
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, dtype=np.int16).astype(np.float64) / 32768

def pitch(x, f):           # смена высоты вместе со скоростью (f<1 — ниже и медленнее)
    n = int(len(x) / f); return np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x)

def lowpass(x, hi):
    X = np.fft.rfft(x); fr = np.fft.rfftfreq(len(x), 1 / SR); X[fr > hi] = 0; return np.fft.irfft(X, len(x))

def echo(x, delays=((0.09, 0.4), (0.21, 0.28), (0.4, 0.18), (0.7, 0.1))):
    out = np.zeros(len(x) + int(0.8 * SR)); out[:len(x)] += x
    for d, g in delays: n = int(d * SR); out[n:n + len(x)] += x * g
    return out

def fade(x, a=0.01, b=0.05):
    x = x.copy(); na, nb = int(a * SR), int(b * SR)
    if na: x[:na] *= np.linspace(0, 1, na)
    if nb: x[-nb:] *= np.linspace(1, 0, nb)
    return x

def mix(layers, drive=1.0, rev=True, peak=0.95, length=None):
    """layers: (массив, усиление, задержка_сек)"""
    L = max(len(a) + int(d * SR) for a, g, d in layers)
    out = np.zeros(L)
    for a, g, d in layers: n = int(d * SR); out[n:n + len(a)] += a * g
    if drive != 1.0: out = np.tanh(out * drive) / np.tanh(drive)
    if rev: out = echo(out)
    if length: out = out[:int(length * SR)]
    return fade(out / max(1e-9, np.max(np.abs(out))) * peak, 0.004, 0.2)

def save(name, x):
    pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with tempfile.TemporaryDirectory() as d:
        w = os.path.join(d, "a.wav")
        with wave.open(w, "wb") as f: f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes(pcm.tobytes())
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", w, "-c:a", "libvorbis", "-q:a", "4", f"{OUT}/{name}.ogg"], check=True)

def own(name):   # свои синтезированные слои (make_sounds.py)
    p = f"{OUT}/{name}.ogg"
    return np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout, dtype=np.int16).astype(np.float64) / 32768

C = "creatures"
S = {}
# --- крики: несколько слоёв, опущенных по тону, с перегрузом и эхом
sc = lambda a, b: load("screams.ogg", a, b - a)
S["scream_1"] = mix([(pitch(load(f"{C}/scream_01.ogg"), 0.8), 1.0, 0), (pitch(sc(1.75, 3.0), 0.9), 0.85, 0.03), (pitch(load(f"{C}/roar_02.ogg"), 0.6), 0.8, 0.05), (own("scream"), 0.5, 0)], drive=2.4)
S["scream_2"] = mix([(pitch(load(f"{C}/monster_06.ogg"), 0.7), 1.0, 0), (pitch(load(f"{C}/scream_02.ogg"), 0.75), 0.9, 0.02), (pitch(sc(0, 1.5), 0.85), 0.8, 0.04), (pitch(load(f"{C}/howl.ogg"), 0.5), 0.7, 0.06)], drive=2.6)
S["scream_3"] = mix([(pitch(load(f"{C}/alien_04.ogg"), 0.8), 0.9, 0), (pitch(load(f"{C}/monster_03.ogg"), 0.6), 1.0, 0.02), (pitch(sc(3.25, 4.6), 0.7), 0.9, 0.03), (pitch(load(f"{C}/roar_03.ogg"), 0.55), 0.9, 0.05)], drive=2.8)
# --- удары (стинги): тяжёлые басовые хиты + высокий
H = "hit/Horror Hit Soundpack 1/Sound/Pitches"
S["sting_1"] = mix([(load(f"{H}/Very Bassy/Very Bassy 1.wav", 0, 2.8) * 3, 1.0, 0), (load(f"{H}/High/High 3.wav", 0, 2.5) * 6, 0.8, 0), (own("sting"), 0.5, 0)], drive=1.8)
S["sting_2"] = mix([(load(f"{H}/Very Bassy/Very Bassy 2.wav", 0, 2.8) * 3, 1.0, 0), (load(f"{H}/Bassy/Bassy 3.wav", 0, 2.5) * 4, 0.8, 0), (load(f"{H}/High/High 7.wav", 0, 2.0) * 6, 0.7, 0)], drive=1.8)
# --- голоса: «Я вижу тебя», «Он решит твою судьбу»
S["voice_see"] = mix([(pitch(load("i_see_you_voice.mp3"), 0.88), 1.0, 0)], drive=1.3, peak=0.9)
S["voice_fate"] = mix([(pitch(load("he_will_decide_your_fate.ogg"), 0.8), 1.0, 0)], drive=1.2, peak=0.9)
# --- хор шёпотов издалека
chant = load("chant/chant8.wav", 0, 6.0) * 6
S["chant"] = mix([(lowpass(pitch(chant, 0.75), 5000), 1.0, 0)], drive=1.0, rev=True, peak=0.8)
# --- сердцебиение
S["heartbeat"] = mix([(load("heartbeat_slow_reverb.wav") * 4, 1.0, 0)], drive=1.0, rev=False, peak=0.95)
# --- гул: настоящий амбиент + свой низкий слой
amb = load("ambient_horror.ogg", 0, 14.0); S["drone"] = mix([(fade(amb, 2.0, 2.5), 1.0, 0), (own("drone"), 0.5, 0)], rev=False, peak=0.85)
# --- скрип/хлопок двери: куски монтажа дверей + свой скрип
mt = "montage-sfx-20121116@113925.ogg"
S["creak"] = mix([(load(mt, 1.9, 1.6), 1.0, 0), (own("creak"), 0.45, 0.1)], drive=1.1, peak=0.9)
S["door_slam"] = mix([(load(mt, 5.0, 1.2) * 2, 1.0, 0)], drive=1.4, peak=0.95)
# --- шаги: короткие шаги, ниже по тону, по очереди, с эхом
steps = np.zeros(int(3.6 * SR))
for i, (t, f) in enumerate(((0.15, "01-footstep.ogg"), (0.8, "02-footstep.ogg"), (1.4, "03-footstep.ogg"), (2.05, "01-footstep.ogg"), (2.7, "02-footstep.ogg"))):
    s = pitch(load(f), 0.55 + 0.05 * (i % 2)) * 9; n = int(t * SR); steps[n:n + len(s)] += s[:len(steps) - n]
S["footsteps"] = mix([(steps, 1.0, 0), (own("footsteps"), 0.3, 0)], drive=1.2, peak=0.9)
S["footsteps_metal"] = mix([(lowpass(load("metal_steps.ogg", 0, 5.0), 3000), 1.0, 0)], drive=1.0, peak=0.85)
# --- рычание/шорохи существ
for i, name in enumerate(("monster_01", "monster_02", "monster_04", "monster_05", "troll_01", "weird_01")):
    S[f"growl_{i+1}"] = mix([(pitch(load(f"{C}/{name}.ogg"), 0.6), 1.0, 0)], drive=1.6, peak=0.9)
S["breath"] = mix([(pitch(load(f"{C}/breath.ogg") * 3, 0.5), 1.0, 0), (own("breath"), 0.6, 0.2)], rev=True, peak=0.85)
# --- странный шум
S["eerie"] = mix([(load("weirdcreepynoise.mp3", 0, 8.0) * 8, 1.0, 0)], rev=False, peak=0.85)
for n, x in S.items(): save(n, x)

ev = {"scream": ["scream_1", "scream_2", "scream_3"], "sting": ["sting_1", "sting_2"], "whisper": ["whisper_1", "whisper_2", "whisper_3"], "voice": ["voice_see", "voice_fate"],
      "chant": ["chant"], "footsteps": ["footsteps", "footsteps_metal"], "knock": ["knock"], "breath": ["breath"], "heartbeat": ["heartbeat"], "drone": ["drone"],
      "static": ["static"], "creak": ["creak"], "slam": ["door_slam"], "swell": ["swell"], "growl": [f"growl_{i}" for i in range(1, 7)], "eerie": ["eerie"]}
sj = {k: {"sounds": [f"dread:{s}" for s in v], "subtitle": f"subtitles.dread.{k}"} for k, v in ev.items()}
open("src/main/resources/assets/dread/sounds.json", "w", encoding="utf-8").write(json.dumps(sj, indent=2) + "\n")
print("ok", len(S), {n: round(len(x) / SR, 1) for n, x in S.items()})
