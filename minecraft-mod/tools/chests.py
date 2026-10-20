#!/usr/bin/env python3
"""Сундуки для каждого вида дерева: перекраска ванильных текстур сундука (одиночный/левый/правый) палитрой досок,
модели, блокстейты, лут, рецепты (8 досок), названия.  Запуск из minecraft-mod:  python3 tools/chests.py"""
import glob, io, json, os, zipfile
from PIL import Image

M = "amberhall"
A = "src/main/resources/assets/" + M
D = "src/main/resources/data"
jar = zipfile.ZipFile(glob.glob("/root/.gradle/caches/fabric-loom/minecraftMaven/net/minecraft/minecraft-merged/*/*.jar")[0])
def read(p): return jar.read(p)
def img(p): return Image.open(io.BytesIO(read(p))).convert("RGBA")
def write(p, data):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, "wb" if isinstance(data, bytes) else "w", **({} if isinstance(data, bytes) else {"encoding": "utf-8"})).write(data)

WOODS = {
    "oak": ("Дубовый", "Oak"), "spruce": ("Еловый", "Spruce"), "birch": ("Берёзовый", "Birch"), "jungle": ("Тропический", "Jungle"),
    "acacia": ("Акациевый", "Acacia"), "dark_oak": ("Тёмный дубовый", "Dark Oak"), "mangrove": ("Мангровый", "Mangrove"),
    "cherry": ("Вишнёвый", "Cherry"), "bamboo": ("Бамбуковый", "Bamboo"), "crimson": ("Багровый", "Crimson"), "warped": ("Искажённый", "Warped"),
}

def lum(c): return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]
def lerp(a, b, t): return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))

def ramp_from_planks(planks):
    """6 опорных цветов: от тёмной обводки до светлых бликов, по распределению яркости самих досок"""
    cols = sorted((p[:3] for p in planks.getdata() if p[3] > 0), key=lum)
    q = lambda f: cols[min(len(cols) - 1, int(f * len(cols)))]
    dark = tuple(round(v * 0.55) for v in q(0.02))
    stops = [dark, tuple(round(v * 0.8) for v in q(0.06)), q(0.3), q(0.6), q(0.9), tuple(min(255, round(v * 1.08)) for v in q(0.99))]
    mid = stops[2]                                       # усиливаем контраст зерна, чтобы сундук читался как ванильный
    return [tuple(max(0, min(255, round(mid[i] + (c[i] - mid[i]) * 1.25))) for i in range(3)) for c in stops]

def recolor(tex, ramp):
    out = tex.copy(); px = out.load()
    wood = [(x, y) for y in range(tex.height) for x in range(tex.width) if px[x, y][3] > 0 and max(px[x, y][:3]) - min(px[x, y][:3]) >= 22]   # серые пиксели = застёжка, не трогаем
    ls = [lum(px[x, y]) for x, y in wood]
    lo, hi = min(ls), max(ls)
    for (x, y), l in zip(wood, ls):
        t = (l - lo) / max(1e-6, hi - lo) * (len(ramp) - 1)
        i = min(len(ramp) - 2, int(t))
        px[x, y] = lerp(ramp[i], ramp[i + 1], t - i) + (px[x, y][3],)
    return out

# ---------------------------------------------------------------- индивидуальные узоры
import hashlib
def hx(s): return tuple(int(s[i:i+2], 16) for i in (0, 2, 4))
def H(*a): return int.from_bytes(hashlib.md5(repr(a).encode()).digest()[:4], "big") / 4294967296.0

class Face:
    """прямоугольник грани на текстуре; координаты (i, j) внутри грани, рисует только внутри"""
    def __init__(self, im, wood, name, x, y, w, h, flip=True):
        # модель сундука перевёрнута вверх ногами при рендере: у боковых граней строка 0 текстуры — это НИЗ в мире.
        # Рисуем в «мировых» координатах (j=0 — верх грани), flip переводит в строки текстуры.
        self.im, self.wood, self.name, self.x, self.y, self.w, self.h, self.flip = im, wood, name, x, y, w, h, flip
    def px(self, i, j, c):
        if 0 <= i < self.w and 0 <= j < self.h:
            self.im.putpixel((self.x + i, self.y + (self.h - 1 - j if self.flip else j)), tuple(c) + (255,))
    def inner(self, i, j): return 1 <= i <= self.w - 2 and 1 <= j <= self.h - 2          # без тёмной обводки
    def r(self, *k): return H(self.wood, self.name, *k)

def faces_of(im, wood, W):
    """видимые грани сундука: верх крышки (область «bottom» текстуры), перёд (south — с застёжкой), зад (north), бока"""
    D = 14; out = {}
    for pre, v0, h in (("lid", 0, 5), ("base", 19, 10)):
        out[pre + "_front"] = Face(im, wood, pre + "_front", 2 * D + W, v0 + D, W, h)
        out[pre + "_back"] = Face(im, wood, pre + "_back", D, v0 + D, W, h)
        out[pre + "_right"] = Face(im, wood, pre + "_right", 0, v0 + D, D, h)
        out[pre + "_left"] = Face(im, wood, pre + "_left", D + W, v0 + D, D, h)
    out["lid_top"] = Face(im, wood, "lid_top", D + W, 0, W, D, flip=False)
    return out
SIDES = ("lid_front", "lid_right", "lid_left", "lid_back", "base_front", "base_right", "base_left", "base_back")

IRON = [hx(c) for c in ("2a2a30", "45454c", "62626b", "8a8a94")]
GOLD = [hx(c) for c in ("7a4e0c", "c58a16", "f0c030", "fff1a0")]
SNOW = [hx(c) for c in ("b6d6ea", "dcefff", "ffffff")]

# Ванильный принцип: сундук — это доски своего дерева с тёмной обводкой и металлической застёжкой.
# Индивидуальность — малыми средствами: редкие акценты по теме дерева + свой металл застёжки.
def sprinkle(f, names, dens, colors, tag, two=False):
    """редкие одиночные пиксели-акценты на указанных гранях"""
    for n in names:
        F = f[n]
        for j in range(1, F.h - 1):
            for i in range(1, F.w - 1):
                if F.r(i, j, tag) < dens:
                    F.px(i, j, colors[int(F.r(i, j, tag, "c") * len(colors))])
                    if two and F.r(i, j, tag, "d") > .6 and F.inner(i + 1, j): F.px(i + 1, j, colors[0])

ALL = ("lid_top", "lid_front", "lid_back", "lid_right", "lid_left", "base_front", "base_back", "base_right", "base_left")

def deco_oak(f, W): pass                                                                    # классика

def deco_spruce(f, W):                                                                      # иней на крышке
    sprinkle(f, ("lid_top",), 0.10, [SNOW[1], SNOW[2], SNOW[0]], "fr")
    for n in ("lid_front", "lid_back", "lid_right", "lid_left"):
        F = f[n]
        for i in range(1, F.w - 1):
            if F.r(i, "e") > .55: F.px(i, 1, SNOW[1])

def deco_birch(f, W):                                                                       # редкие тёмные чёрточки коры
    for n in ALL:
        F = f[n]
        for j in range(1, F.h - 1):
            for i in range(1, F.w - 3):
                if F.r(i, j, "d") > 0.975:
                    for k in range(2 + int(F.r(i, j, "l") * 2)): F.px(i + k, j, hx("2e2e2a"))

def deco_jungle(f, W):                                                                      # мох в углах крышки
    G = [hx("25601a"), hx("3a8a2a"), hx("2f7a24")]
    F = f["lid_top"]
    for j in range(1, F.h - 1):
        for i in range(1, F.w - 1):
            edge = min(i - 1, j - 1, F.w - 2 - i, F.h - 2 - j)
            if F.r(i, j, "m") > 0.62 + edge * 0.1: F.px(i, j, G[int(F.r(i, j, "t") * 3)])
    sprinkle(f, ("base_front", "base_back", "base_right", "base_left"), 0.025, G, "mo")

def deco_acacia(f, W):                                                                      # охровая полоска по краю крышки
    OC = hx("e8b030"); BR = hx("9a3418")
    for n in ("lid_front", "lid_back", "lid_right", "lid_left"):
        F = f[n]
        for i in range(1, F.w - 1): F.px(i, F.h - 2, BR if i % 2 else OC)

def deco_dark_oak(f, W):                                                                    # золотые заклёпки по углам
    for n in ("lid_front", "base_front"):
        F = f[n]
        for (i, j) in ((2, 2), (F.w - 3, 2), (2, F.h - 3), (F.w - 3, F.h - 3)): F.px(i, j, GOLD[2]); F.px(i + 1, j, GOLD[1]) if F.inner(i + 1, j) else None

def deco_mangrove(f, W):                                                                    # тёмные прожилки корней
    DK = hx("3c150f")
    for n in ALL:
        F = f[n]
        for i in range(1, F.w - 1):
            if F.r(i, "rt") > 0.82:
                for j in range(1, min(F.h - 1, 3 + int(F.r(i, "rl") * 3))): F.px(i, j, DK)

def deco_cherry(f, W):                                                                      # несколько лепестков
    sprinkle(f, ("lid_top",), 0.07, [hx("ffe0ec"), hx("f6a0c4"), hx("ffffff")], "p", two=True)
    sprinkle(f, ("lid_front", "base_front", "lid_right", "lid_left"), 0.03, [hx("f6a0c4"), hx("ffe0ec")], "p")

def deco_bamboo(f, W):                                                                      # верёвочная обвязка
    ROPE = [hx("8a6a34"), hx("c9a860"), hx("e3cc88")]
    for n in ("lid_front", "lid_back", "lid_right", "lid_left", "base_front", "base_back", "base_right", "base_left"):
        F = f[n]
        j = F.h // 2
        for i in range(1, F.w - 1): F.px(i, j, ROPE[1 if i % 2 else 2]); F.px(i, j + 1, ROPE[0]) if F.inner(i, j + 1) else None

def deco_crimson(f, W):                                                                     # красные «наросты»
    sprinkle(f, ALL, 0.03, [hx("8e1424"), hx("bc2234"), hx("5a0810")], "w", two=True)

def deco_warped(f, W):                                                                      # бирюзовые «наросты»
    sprinkle(f, ALL, 0.03, [hx("159484"), hx("22bfa8"), hx("0b5a52")], "w", two=True)

DECO = {"oak": deco_oak, "spruce": deco_spruce, "birch": deco_birch, "jungle": deco_jungle, "acacia": deco_acacia, "dark_oak": deco_dark_oak,
        "mangrove": deco_mangrove, "cherry": deco_cherry, "bamboo": deco_bamboo, "crimson": deco_crimson, "warped": deco_warped}

# застёжка: свой металл у отдельных сундуков (серые пиксели области защёлки 0..6 x 0..5)
LATCH = {"dark_oak": GOLD, "acacia": [hx(c) for c in ("5a2a14", "9a4a24", "d07a3a", "f0b070")], "spruce": [hx(c) for c in ("2a5078", "4a88b8", "9ad0ec", "e8f8ff")],
         "crimson": [hx(c) for c in ("5a0a18", "9a1a30", "d03a50", "f09070")], "warped": [hx(c) for c in ("0a5a50", "16a090", "52e0c8", "d0fff0")],
         "mangrove": [hx(c) for c in ("3c150f", "7a3022", "b0604a", "d8a088")], "bamboo": [hx(c) for c in ("6a5020", "a08a40", "d8c070", "f4e8a8")],
         "cherry": [hx(c) for c in ("8a3a5a", "d06a90", "f6a0c4", "ffe0ec")], "jungle": [hx(c) for c in ("1f4a18", "36702a", "5a9a40", "9ad070")]}

def tint_latch(im, ramp):
    px = im.load()
    for y in range(0, 6):
        for x in range(0, 7):
            c = px[x, y]
            if c[3] and max(c[:3]) - min(c[:3]) < 22:
                t = (lum(c) - 60) / 170; t = max(0, min(1, t)) * (len(ramp) - 1)
                i = min(len(ramp) - 2, int(t)); px[x, y] = lerp(ramp[i], ramp[i + 1], t - i) + (c[3],)

lang = {"ru_ru": {}, "en_us": {}}
for wood, (ru, en) in WOODS.items():
    planks = img(f"assets/minecraft/textures/block/{wood}_planks.png")
    ramp = ramp_from_planks(planks)
    for suffix, src in (("", "normal"), ("_left", "normal_left"), ("_right", "normal_right")):
        tex = recolor(img(f"assets/minecraft/textures/entity/chest/{src}.png"), ramp)
        DECO[wood](faces_of(tex, wood, 14 if suffix == "" else 15), 14 if suffix == "" else 15)
        if wood in LATCH: tint_latch(tex, LATCH[wood])
        buf = io.BytesIO(); tex.save(buf, "PNG")
        write(f"{A}/textures/entity/chest/{wood}{suffix}.png", buf.getvalue())
    name = f"{wood}_chest"
    write(f"{A}/blockstates/{name}.json", json.dumps({"variants": {"": {"model": f"{M}:block/{name}"}}}, indent=2) + "\n")
    write(f"{A}/models/block/{name}.json", json.dumps({"textures": {"particle": f"minecraft:block/{wood}_planks"}}, indent=2) + "\n")
    write(f"{A}/models/item/{name}.json", read("assets/minecraft/models/item/chest.json").decode())
    write(f"{D}/{M}/loot_table/blocks/{name}.json", read("data/minecraft/loot_table/blocks/chest.json").decode().replace("minecraft:chest", f"{M}:{name}"))
    write(f"{D}/{M}/recipe/{name}.json", json.dumps({
        "type": "minecraft:crafting_shaped", "category": "misc", "key": {"#": {"item": f"minecraft:{wood}_planks"}},
        "pattern": ["###", "# #", "###"], "result": {"count": 1, "id": f"{M}:{name}"}}, indent=2) + "\n")
    lang["ru_ru"][f"block.{M}.{name}"] = f"{ru} сундук"
    lang["en_us"][f"block.{M}.{name}"] = f"{en} Chest"
write(f"{D}/minecraft/tags/block/mineable/axe.json", json.dumps({"values": [f"{M}:{w}_chest" for w in WOODS]}, indent=2) + "\n")
for l, names in lang.items():
    p = f"{A}/lang/{l}.json"; d = json.load(open(p, encoding="utf-8")); d.update(names)
    write(p, json.dumps(d, ensure_ascii=False, indent=2) + "\n")
print("ok", len(WOODS))
