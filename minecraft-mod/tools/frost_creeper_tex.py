#!/usr/bin/env python3
"""Текстура ледяного крипера (раскладка UV ванильного крипера 64x32).
Кристаллическая «ледяная глыба»: ячейки-грани разных голубых тонов, светлые трещины-границы, снежная шапка на голове,
иней на плечах и ступнях, лицо — как у обычного крипера, но тёмно-синее.
Запуск из minecraft-mod:  python3 tools/frost_creeper_tex.py"""
import glob, hashlib, io, math, zipfile
from PIL import Image

OUT = "src/main/resources/assets/amberhall/textures/entity/frost_creeper.png"
jar = glob.glob("/root/.gradle/caches/fabric-loom/minecraftMaven/net/minecraft/minecraft-merged/*/*.jar")[0]
van = Image.open(io.BytesIO(zipfile.ZipFile(jar).read("assets/minecraft/textures/entity/creeper/creeper.png"))).convert("RGBA")

def hx(s): return tuple(int(s[i:i+2], 16) for i in (0, 2, 4))
ICE = [hx(c) for c in ("1d4a78", "2e6ea3", "4a94c8", "78c4ec", "a8dff5")]     # от глубокого льда к светлому
FROST = [hx("cfeefb"), hx("eaf9ff"), hx("ffffff")]
NAVY = hx("0a1c36"); NAVY2 = hx("16345a")

def H(*a): return int.from_bytes(hashlib.md5(repr(a).encode()).digest()[:4], "big") / 4294967296.0

# прямоугольники граней (x, y, w, h) для раскладки крипера
RECTS = []
def box(u, v, w, h, d):
    for r in ((u + d, v, w, d), (u + d + w, v, w, d), (u, v + d, d, h), (u + d, v + d, w, h), (u + d + w, v + d, d, h), (u + 2 * d + w, v + d, w, h)):
        RECTS.append(r)
box(0, 0, 8, 8, 8)            # голова
box(16, 16, 8, 12, 4)         # тело
box(0, 16, 4, 6, 4)           # ноги (одна текстура на все четыре)

img = Image.new("RGBA", (64, 32), (0, 0, 0, 0)); P = img.load()

def cells(rect, step=4):
    """случайные центры ячеек в границах грани (кристаллы-грани льда)"""
    x, y, w, h = rect
    pts = []
    for cy in range(-1, h // step + 2):
        for cx in range(-1, w // step + 2):
            pts.append((cx * step + H(rect, cx, cy, "x") * step, cy * step + H(rect, cx, cy, "y") * step, H(rect, cx, cy, "t")))
    return pts

for rect in RECTS:
    x0, y0, w, h = rect
    pts = cells(rect)
    for j in range(h):
        for i in range(w):
            d = sorted(((i + .5 - px) ** 2 + (j + .5 - py) ** 2, t) for px, py, t in pts)
            d1, t1 = math.sqrt(d[0][0]), d[0][1]
            d2 = math.sqrt(d[1][0])
            tone = 1 + int(t1 * 3.4)                                  # 1..4: тон ячейки
            tone += (1 if j < h * 0.25 else -1 if j > h * 0.8 else 0)   # сверху светлее, снизу глубже
            tone = max(0, min(4, tone))
            c = ICE[tone]
            if d2 - d1 < 0.75: c = ICE[min(4, tone + 2)] if H(rect, i, j, "c") > .2 else FROST[0]   # светлая трещина-грань
            elif H(rect, i, j, "n") > .93: c = ICE[min(4, tone + 1)]
            P[x0 + i, y0 + j] = c + (255,)

# --- голова: снежная шапка (верх целиком и неровная кромка по бокам), иней у переносицы
for (x0, y0, w, h) in RECTS[0:6]:
    pass
def paint(x, y, c): P[x, y] = c + (255,)
# верх головы (8,0,8,8): снег
for j in range(8):
    for i in range(8):
        paint(8 + i, j, FROST[2] if H("top", i, j) > .45 else FROST[1])
# верхние ряды боковых граней головы: лево (0,8), перед (8,8), право (16,8), зад (24,8)
for ux in (0, 8, 16, 24):
    for i in range(8):
        paint(ux + i, 8, FROST[1] if H(ux, i, "r0") > .3 else FROST[2])
        if H(ux, i, "r1") > .45: paint(ux + i, 9, FROST[0] if H(ux, i, "q") > .5 else FROST[1])
        if H(ux, i, "r2") > .86: paint(ux + i, 10, FROST[0])
# --- лицо: маска из ванильного (тёмные пиксели) -> глубокий тёмно-синий, вокруг — подсвеченный иней
fx, fy = 8, 8
FACE = ["........", "........", ".##..##.", ".##..##.", "...##...", "..####..", "..####..", "..#..#.."]   # классическое лицо крипера
mask = {(i, j) for j, row in enumerate(FACE) for i, ch in enumerate(row) if ch == "#"}
for j in range(8):                                   # светлый ровный фон лица, чтобы тёмные глаза и рот читались
    for i in range(8):
        if j >= 2: paint(fx + i, fy + j, ICE[4] if H("fb", i, j) > .35 else ICE[3])
for (i, j) in mask:
    paint(fx + i, fy + j, NAVY if H("f", i, j) > .15 else NAVY2)
# --- тело (16,16,8,12,4): фронт (20,20,8,12), зад (32,20,8,12), бока (16,20,4,12) и (28,20,4,12): иней на плечах и подоле
for ux, w in ((20, 8), (32, 8), (16, 4), (28, 4)):
    for i in range(w):
        if H(ux, i, "s0") > .35: paint(ux + i, 20, FROST[1])
        if H(ux, i, "s1") > .7: paint(ux + i, 21, FROST[0])
        if H(ux, i, "h") > .6: paint(ux + i, 31, FROST[0])
# трещина-узор на груди: светлая зигзаг-линия по центру фронта
for k, (i, j) in enumerate([(3, 23), (4, 24), (3, 25), (4, 26), (4, 27), (3, 28)]):
    paint(20 + i, j, FROST[0])
# --- ноги (0,16,4,6,4): низ — иней
for ux in (0, 4, 8, 12):
    for i in range(4):
        paint(ux + i, 27 - 4 + 4 - 0, FROST[0]) if False else None
for ux in (0, 4, 8, 12):          # передняя/боковые грани ног: v = 20..25, нижний ряд = 25
    for i in range(4):
        if H(ux, i, "leg") > .3: paint(ux + i, 25, FROST[0])
img.save(OUT)

# превью рядом с ванильным
sheet = Image.new("RGBA", (64 * 6 * 2 + 12, 32 * 6), (40, 40, 52, 255))
sheet.alpha_composite(van.resize((384, 192), Image.NEAREST), (0, 0)); sheet.alpha_composite(img.resize((384, 192), Image.NEAREST), (396, 0))
sheet.convert("RGB").save("/tmp/claude-0/-home-user-Amberhall/50491b7b-da0b-5e5d-9b0d-e6723e52204c/scratchpad/frost_creeper_prev.png")
print("ok")
