#!/usr/bin/env python3
"""Текстуры Ползуна (crawler) и Улыбающегося (smile) + светящиеся слои.  Запуск из horror-mod:  python3 tools/monsters_tex.py"""
import hashlib
from PIL import Image
OUT = "src/main/resources/assets/dread/textures/entity"
def hx(s): return tuple(int(s[i:i+2], 16) for i in (0, 2, 4))
def H(*a): return int.from_bytes(hashlib.md5(repr(a).encode()).digest()[:4], "big") / 4294967296.0
def box(u, v, w, h, d):
    return {"east": (u, v + d, d, h), "north": (u + d, v + d, w, h), "west": (u + d + w, v + d, d, h), "south": (u + 2 * d + w, v + d, w, h),
            "up": (u + d, v, w, d), "down": (u + d + w, v, w, d)}
def tone(pal, nm, face, i, j, sh=0):
    t = 1 + (1 if H(nm, face, i // 2, j // 2) > .72 else -1 if H(nm, face, i // 2, j // 2) < .22 else 0) + sh
    if H(nm, face, i, j, "p") > .94: t += 1
    return pal[max(0, min(len(pal) - 1, t))]

# ---------------- Ползун: бледная кожа в лохмотьях, перевёрнутая голова со вскрытой пастью, красные точки глаз
SK = [hx(c) for c in ("6e6a64", "8a867e", "a8a49a", "c6c2b6")]; RAG = [hx(c) for c in ("0c0b0c", "151416", "1e1c20")]; BLOOD = hx("5a0a0e")
img = Image.new("RGBA", (64, 64), (0, 0, 0, 0)); gl = Image.new("RGBA", (64, 64), (0, 0, 0, 0)); T = img.load(); G = gl.load()
def put(x, y, c, glow=None):
    T[x, y] = tuple(c) + (255,)
    if glow: G[x, y] = tuple(glow) + (255,)
for fn, (x, y, w, h) in box(0, 0, 6, 4, 12).items():                           # торс 6x4x12: кожа и тряпьё
    for j in range(h):
        for i in range(w):
            c = tone(SK, "torso", fn, i, j, -1)
            if fn in ("up",) and (i + j) % 3 != 0: c = tone(RAG, "rag", fn, i, j)               # на спине чёрные лохмотья
            if fn in ("north", "south", "east", "west") and j < h // 2 and H("r", fn, i, j) > .4: c = tone(RAG, "rag", fn, i, j)
            if fn in ("east", "west") and i % 3 == 1 and j in (1, 2): c = SK[0]                 # рёбра
            put(x + i, y + j, c)
FACE = ["WWWWWW", "WkkWkk", "WkeWke", "WWWWWW", "kmmmmk", "WkkkkW"]                         # лицо 6x6: пустые глаза с красными точками, вспоротый рот
for fn, (x, y, w, h) in box(0, 16, 6, 6, 6).items():
    for j in range(h):
        for i in range(w):
            if fn == "north":
                ch = FACE[j][i]
                if ch == "e": put(x + i, y + j, hx("1a0000"), hx("ff2a1a"))
                elif ch == "k": put(x + i, y + j, hx("050304"))
                elif ch == "m": put(x + i, y + j, BLOOD if i % 2 else hx("d8d4c0"))
                else: put(x + i, y + j, tone(SK, "head", fn, i, j))
            else: put(x + i, y + j, tone(SK, "head", fn, i, j, -1))
for ux, nm in ((24, "upper"), (32, "lower")):                                      # длинные тонкие конечности, когти на концах
    for fn, (x, y, w, h) in box(ux, 16, 2, 8, 2).items():
        for j in range(h):
            for i in range(w):
                c = tone(SK, nm, fn, i, j, -1)
                if nm == "lower" and j >= h - 2 and fn not in ("up", "down"): c = hx("2a2620")
                put(x + i, y + j, c)
img.save(f"{OUT}/crawler.png"); gl.save(f"{OUT}/crawler_eyes.png")

# ---------------- Улыбающийся: болезненно-зелёный череп-шар, чёрные глаза, растянутая улыбка с мелкими зубами
SM = [hx(c) for c in ("6a7a48", "8a9a5e", "a8b878", "c6d494")]
img = Image.new("RGBA", (64, 64), (0, 0, 0, 0)); gl = Image.new("RGBA", (64, 64), (0, 0, 0, 0)); T = img.load(); G = gl.load()
for fn, (x, y, w, h) in box(0, 0, 10, 10, 10).items():
    for j in range(h):
        for i in range(w):
            if fn == "north":
                c = tone(SM, "smile", fn, i, j)
                # глаза: чёрные овалы с белой точкой, улыбка: тёмная дуга и два ряда зубов
                if (i, j) in {(1, 2), (2, 2), (1, 3), (2, 3), (1, 4), (2, 4), (7, 2), (8, 2), (7, 3), (8, 3), (7, 4), (8, 4)}:
                    put(x + i, y + j, hx("020202"), (hx("f8fff0") if (i, j) in {(1, 3), (8, 3)} else None)); continue
                if j == 6 and 1 <= i <= 8: put(x + i, y + j, hx("e8e4d0") if i % 2 else hx("1a0000")); continue        # верхние зубы
                if j == 7 and 0 <= i <= 9 and (i in (0, 9) or True): put(x + i, y + j, hx("1a0000")); continue
                if j == 8 and 1 <= i <= 8: put(x + i, y + j, hx("e8e4d0") if (i + 1) % 2 else hx("1a0000")); continue  # нижние зубы
                if j in (5,) and i in (0, 9): put(x + i, y + j, hx("1a0000")); continue                                  # уголки улыбки
                put(x + i, y + j, c)
            else: put(x + i, y + j, tone(SM, "smile", fn, i, j, -1))
img.save(f"{OUT}/smile.png"); gl.save(f"{OUT}/smile_eyes.png")
print("ok")
