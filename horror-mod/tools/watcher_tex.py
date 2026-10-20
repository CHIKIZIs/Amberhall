#!/usr/bin/env python3
"""Текстура Наблюдателя 64x64 + светящийся слой глаз.  Запуск из horror-mod:  python3 tools/watcher_tex.py"""
import hashlib
from PIL import Image
OUT = "src/main/resources/assets/dread/textures/entity"
def hx(s): return tuple(int(s[i:i+2], 16) for i in (0, 2, 4))
def H(*a): return int.from_bytes(hashlib.md5(repr(a).encode()).digest()[:4], "big") / 4294967296.0
SKIN = [hx(c) for c in ("8c8880", "a8a49c", "c4c0b8", "dedad2")]
BLK = [hx(c) for c in ("050506", "0b0b0d", "121216", "1a1a20")]
tex = Image.new("RGBA", (64, 64), (0, 0, 0, 0)); gl = Image.new("RGBA", (64, 64), (0, 0, 0, 0)); T = tex.load(); G = gl.load()
def box(u, v, w, h, d):
    return {"east": (u, v + d, d, h), "north": (u + d, v + d, w, h), "west": (u + d + w, v + d, d, h), "south": (u + 2 * d + w, v + d, w, h),
            "up": (u + d, v, w, d), "down": (u + d + w, v, w, d)}
def fill(rect, f):
    x, y, w, h = rect
    for j in range(h):
        for i in range(w): T[x + i, y + j] = f(i, j) + (255,)
def skin(nm, face, i, j, sh=0):
    t = 1 + (1 if H(nm, face, i // 2, j // 2) > .7 else -1 if H(nm, face, i // 2, j // 2) < .25 else 0) + sh
    return SKIN[max(0, min(3, t))]
def blk(nm, face, i, j):
    t = 1 + (1 if H(nm, face, i, j) > .85 else 0) + (-1 if H(nm, face, i, j) < .2 else 0)
    return BLK[max(0, min(3, t))]
# --- голова 6x8x6: вытянутое бледное лицо
FACE = {"W": None, "k": BLK[0], "e": "eye", "t": SKIN[3], "s": SKIN[0], "m": hx("2a0a0c")}
face = ["WWWWWW", "WWWWWW", "kkWWkk", "kekkek", "WWssWW", "kmmmmk", "tmtmtm", "WWWWWW"]
for fn, (x, y, w, h) in box(0, 0, 6, 8, 6).items():
    for j in range(h):
        for i in range(w):
            if fn == "north":
                ch = face[j][i]
                if ch == "e": T[x + i, y + j] = hx("0a0a0a") + (255,); G[x + i, y + j] = hx("f4fbff") + (255,)
                elif ch == "W": T[x + i, y + j] = skin("head", fn, i, j) + (255,)
                else: T[x + i, y + j] = FACE[ch] + (255,)
            elif fn == "up": T[x + i, y + j] = skin("head", fn, i, j, -1) + (255,)
            else: T[x + i, y + j] = skin("head", fn, i, j, 0 if fn != "south" else -1) + (255,)
# --- тело 6x14x3: чёрный костюм, белая рубашка и тёмный галстук
for fn, (x, y, w, h) in box(24, 0, 6, 14, 3).items():
    for j in range(h):
        for i in range(w):
            c = blk("body", fn, i, j)
            if fn == "north":
                if 2 <= i <= 3 and j < 9: c = SKIN[3] if not (i == 2 and j >= 2 or i == 3 and j >= 2) else hx("5a0a10")   # рубашка и красный галстук
                if j >= 12: c = BLK[0]
            T[x + i, y + j] = c + (255,)
# --- руки 2x22x2 (две), кисти бледные
for ux in (0, 8):
    for fn, (x, y, w, h) in box(ux, 16, 2, 22, 2).items():
        for j in range(h):
            for i in range(w):
                c = blk("arm", fn, i, j)
                if j >= h - 7 and fn not in ("up", "down"): c = skin("hand", fn, i, j, -1 if j < h - 3 else 0)       # длинные бледные пальцы
                T[x + i, y + j] = c + (255,)
# --- ноги 3x14x3
for ux in (16, 28):
    for fn, (x, y, w, h) in box(ux, 20, 3, 14, 3).items():
        for j in range(h):
            for i in range(w): T[x + i, y + j] = blk("leg", fn, i, j) + (255,)
tex.save(f"{OUT}/watcher.png"); gl.save(f"{OUT}/watcher_eyes.png"); print("ok")
