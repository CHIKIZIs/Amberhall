#!/usr/bin/env python3
"""Биомные разновидности крипера: модели (ванильный крипер + аксессуары/пропорции), текстуры в ванильном стиле, превью.

Для каждого варианта описывает части (база: голова 8x8x8, тело 8x12x4, четыре ноги 4x6x4 + свои добавки),
рисует текстуру и генерирует Java-класс CreeperVariantModels (данные моделей).
Запуск из minecraft-mod:  python3 tools/creeper_variants.py [preview.png]"""
import hashlib, os, sys
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import beetle_gen as g

hx = g.hx
def H(*a): return int.from_bytes(hashlib.md5(repr(a).encode()).digest()[:4], "big") / 4294967296.0

def mot(pal, wts, nm, face, a, b, shift=0, blk=2):
    """ванильное пятнистое поле: взвешенный выбор тона + крупные пятна"""
    r = H(nm, face, a, b, "px") * 0.6 + H(nm, face, a // blk, b // blk, "bk") * 0.4
    t = r * sum(wts); i = 0
    for i, w in enumerate(wts):
        t -= w
        if t <= 0: break
    return pal[max(0, min(len(pal) - 1, i + shift))]

W4 = [2, 4, 4, 2]
FACE = ["........", "........", ".##..##.", ".##..##.", "...##...", "..####..", "..####..", "..#..#.."]   # классическое лицо
def face_px(a, b): return FACE[b][a] == "#" if 0 <= a < 8 and 0 <= b < 8 else False

# ---------------------------------------------------------------- описание частей
# Ориентир — сборка «Creeper Overhaul»: сутулые крепкие крипера, тело наклонено вперёд, голова крупная, лапы с «ступнями»,
# аксессуары (шляпа, грибы, цветы, кактус, трава). Текстуры слоистые: горизонтальные полосы со светлой кромкой сверху.
import random

def stance(lean=0.5, head=(8, 8, 8), body=(8, 12, 4), leg=(4, 5, 4), foot=(5, 2, 6), hip=(0, 17, 1), gap=3.5, neckdz=0.0):
    """сутулая база: тело наклонено вперёд, голова компенсирует наклон, четыре лапы расставлены, у каждой ступня"""
    bw, bh, bd = body; hw, hh, hd = head; lw, lh, ld = leg; fw, fh, fd = foot
    out = [("body", "root", hip, (lean, 0, 0), (-bw / 2, -bh, -bd / 2), body, "body"),
           ("head", "body", (0, -bh + 1, neckdz), (-lean * 0.75, 0, 0), (-hw / 2, -hh, -hd / 2), head, "head")]
    for n, x, z, pr, rr in (("leg_fl", 1, -1, -0.3, 0.12), ("leg_fr", -1, -1, -0.3, -0.12), ("leg_bl", 1, 1, 0.3, 0.1), ("leg_br", -1, 1, 0.3, -0.1)):
        px = x * (bw / 2 - lw / 2 + 0.6); pz = z * gap + 1
        out.append((n, "root", (px, 24 - lh - fh, pz), (pr, 0, rr), (-lw / 2, 0, -ld / 2), leg, "leg"))
        out.append((n + "_foot", n, (0, lh, 0), (-pr * 0.9, 0, 0), (-fw / 2, 0, -fd / 2 - 0.5), foot, "foot"))
    return out

def blades(parent, pivot_y, n, radius, rng, kind, lo=3, hi=5, w=1):
    """пучок травинок-кубоидов с наклоном — «причёска» из травы"""
    out = []
    for i in range(n):
        x = (rng.random() * 2 - 1) * radius; z = (rng.random() * 2 - 1) * radius
        L = rng.randint(lo, hi)
        out.append((f"{kind}_{i}", parent, (x, pivot_y, z), (rng.uniform(-.35, .35), rng.uniform(0, 6.28), rng.uniform(-.35, .35)), (-w / 2, -L, -w / 2), (w, L, w), kind))
    return out

R7 = random.Random(7)
V = {}
# 1. Болотный: череп-лицо, мшистое тело, широкополая шляпа с травяной «шевелюрой»
V["swamp"] = dict(parts=stance(lean=0.45, head=(8, 8, 8), body=(8, 12, 5)) + [
    ("hat_brim", "head", (0, -7, 0), (0.05, 0, 0), (-8, -1, -8), (16, 1, 16), "brim"),
    ("hat_crown", "head", (0, -8, 0), (0, 0, 0), (-4, -3, -4), (8, 3, 8), "hat"),
] + blades("head", -11, 14, 4, random.Random(3), "grass", 3, 6) + [
    ("arm_l", "body", (4.5, -10, 0), (0.3, 0, -0.1), (0, 0, -1), (2, 12, 2), "arm"),
    ("arm_r", "body", (-4.5, -10, 0), (0.3, 0, 0.1), (-2, 0, -1), (2, 12, 2), "arm"),
])
# 2. Джунглевый: ярко-салатовый, длинное тело-«лиана», плоская широкая голова
V["jungle"] = dict(parts=stance(lean=0.8, head=(10, 6, 8), body=(6, 16, 5), leg=(4, 5, 4), foot=(5, 2, 7), neckdz=-1) + [
    ("leaf_l", "head", (3, -6, 0), (0, 0, 0.6), (0, -1, -3), (5, 1, 6), "leaf"),
    ("leaf_r", "head", (-3, -6, 0), (0, 0, -0.6), (-5, -1, -3), (5, 1, 6), "leaf"),
    ("leaf_c", "head", (0, -6, 0), (-0.3, 0, 0), (-3, -1, -3), (6, 1, 6), "leaf"),
])
# 3. Грибной: огромная красная шляпка в крапинку, серо-фиолетовое «тающее» тело
V["mushroom"] = dict(parts=stance(lean=0.35, head=(8, 8, 8), body=(8, 12, 4)) + [
    ("cap", "head", (0, -7, 0), (0, 0, 0), (-8, -3, -8), (16, 3, 16), "cap"),
    ("cap_top", "head", (0, -10, 0), (0, 0, 0), (-6, -2, -6), (12, 2, 12), "cap"),
    ("cap_peak", "head", (0, -12, 0), (0, 0, 0), (-3, -1, -3), (6, 1, 6), "cap"),
])
# 4. Бесплодных земель: высокий слоистый столб терракоты с «крестом» на лице
V["badlands"] = dict(parts=stance(lean=0.25, head=(9, 10, 9), body=(8, 16, 5), leg=(4, 7, 4), foot=(5, 2, 6), hip=(0, 15, 1)) + [
    ("top", "head", (0, -10, 0), (0, 0, 0), (-3, -2, -3), (6, 2, 6), "head"),
])
# 5. Пещерный (капельник): глыба серо-зелёного камня с мхом и сталактитами
V["cave"] = dict(parts=stance(lean=0.4, head=(11, 8, 9), body=(11, 12, 7), leg=(5, 5, 5), foot=(6, 2, 7), gap=4, hip=(0, 17, 1)) + [
    ("spike_a", "head", (-3, -8, 0), (0.1, 0, -0.3), (-1, -5, -1), (2, 5, 2), "spike"),
    ("spike_b", "head", (3, -8, -1), (-0.15, 0, 0.35), (-1, -4, -1), (2, 4, 2), "spike"),
    ("spike_c", "head", (0, -8, 2), (0.3, 0, 0), (-1, -3, -1), (2, 3, 2), "spike"),
    ("moss", "head", (0, -8, 0), (0, 0, 0), (-3, -1, -3), (6, 1, 5), "mosscap"),
])
# 6. Луговой: травяная шапка, цветы, дёрн снизу
V["meadow"] = dict(parts=stance(lean=0.5, head=(9, 8, 8), body=(8, 12, 4)) + blades("head", -8, 12, 3.5, random.Random(11), "grass", 2, 4) + [
    ("stem_a", "head", (-2.5, -8, -1), (0, 0, -0.15), (-0.5, -4, -0.5), (1, 4, 1), "stem"),
    ("bloom_a", "stem_a", (0, -4, 0), (0, 0, 0), (-1.5, -1, -1.5), (3, 1, 3), "bloom_a"),
    ("stem_b", "head", (2.5, -8, 1), (0, 0, 0.2), (-0.5, -5, -0.5), (1, 5, 1), "stem"),
    ("bloom_b", "stem_b", (0, -5, 0), (0, 0, 0), (-1.5, -1, -1.5), (3, 1, 3), "bloom_b"),
    ("stem_c", "head", (0, -8, -2), (-0.2, 0, 0), (-0.5, -3, -0.5), (1, 3, 1), "stem"),
    ("bloom_c", "stem_c", (0, -3, 0), (0, 0, 0), (-1.5, -1, -1.5), (3, 1, 3), "bloom_c"),
])
# 7. Тёмного леса: пень-голова с грибами и кора, розовато-бурое тело
V["darkforest"] = dict(parts=stance(lean=0.6, head=(9, 9, 9), body=(8, 11, 5)) + [
    ("shroom_a", "head", (-2, -9, -1), (0, 0, -0.2), (-0.5, -2, -0.5), (1, 2, 1), "shroom_s"),
    ("shroom_a_cap", "shroom_a", (0, -2, 0), (0, 0, 0), (-2, -1, -2), (4, 1, 4), "shroom_r"),
    ("shroom_b", "head", (2, -9, 2), (0, 0, 0.25), (-0.5, -3, -0.5), (1, 3, 1), "shroom_s"),
    ("shroom_b_cap", "shroom_b", (0, -3, 0), (0, 0, 0), (-2, -1, -2), (4, 1, 4), "shroom_b"),
    ("shroom_c", "head", (0, -9, -3), (-0.2, 0, 0), (-0.5, -2, -0.5), (1, 2, 1), "shroom_s"),
    ("shroom_c_cap", "shroom_c", (0, -2, 0), (0, 0, 0), (-1.5, -1, -1.5), (3, 1, 3), "shroom_r"),
])

# ---------------------------------------------------------------- палитры и раскраска
def P5(*c): return [hx(x) for x in c]
BL = {
 "swamp": dict(skin=P5("172620", "20362c", "2a4638", "365a46", "466e54"), bone=P5("8a7658", "b0996a", "d2bd8c", "e8d9a8", "f4e8c4"), sock=hx("4a2e1a"),
               hat=P5("2c3818", "3e4e20", "526428", "66782e"), grass=P5("5e7020", "7c9028", "9cac38", "b8c850")),
 "jungle": dict(skin=P5("1a5c10", "266e16", "358a20", "4ea830", "72c850"), leaf=P5("1c6410", "2c841c", "40a02c", "5cc044")),
 "mushroom": dict(skin=P5("2a2236", "3a3048", "50445e", "6e5e7c", "92809a"), cap=P5("781a30", "a02440", "c43450", "e04e62"), spot=P5("e8e0ea", "fffafc"), gill=P5("b49aa8", "d0bcc4")),
 "badlands": dict(o=P5("8a4620", "a45828", "bf6c34", "d68646"), br=P5("5a3018", "6e3e20"), wh=P5("b4a086", "d0be9e"), rd=P5("7a3022", "94422e"), gold=hx("f0c030"), mark=hx("5a2e18")),
 "cave": dict(stone=P5("4a5a56", "5e6e68", "7a8a82", "98a89e", "b4c4b8"), moss=P5("3a5a2c", "4e7438", "689048"), drip=P5("6a5a4c", "86745e", "a08c74")),
 "meadow": dict(skin=P5("2a6e24", "388a2e", "4aa63c", "62be50", "86d66e"), dirt=P5("4a2e16", "5e3c1e", "764c28"), grass=P5("2e7a28", "46983a", "62b850", "88d470"), stem=P5("2c6a22", "3e8a30"),
                red=P5("c82828", "e85050"), yel=P5("e8b020", "ffe058"), blu=P5("3a58d0", "6a88f0"), wht=P5("f0f0e8", "ffffff")),
 "darkforest": dict(bark=P5("1e140c", "2e2016", "40301e", "564230", "6c563e"), flesh=P5("5a3438", "764848", "925e5c", "b07a76", "c99694"), red=P5("9a1c32", "c83450"), brn=P5("7a4a26", "a06a38"), wht=hx("f0e8dc"), cream=hx("d2c6a4"), moss=P5("3a5a28", "4e7a34")),
}
DARKF = hx("121212")

def strata(pal, nm, face, a, b, fw, fh, period=3, jitter=0.28, top_hi=True, shift=0):
    """слоистая поверхность как у «Creeper Overhaul»: горизонтальные полосы, светлая кромка сверху, тёмная снизу, блик слева"""
    n = len(pal)
    band = b // period
    t = int(H(nm, face, band, "band") * (n - 1)) * 0.6 + (n - 1) * 0.2
    t = int(t) + shift
    pos = b % period
    if top_hi and pos == 0: t += 1
    if pos == period - 1: t -= 1
    if a == 0 and face not in ("up", "down"): t += 1
    if a == fw - 1: t -= 1
    j = H(nm, face, a, b, "j")
    if j < jitter / 2: t -= 1
    elif j > 1 - jitter / 2: t += 1
    if face == "up": t += 1
    if face == "down": t -= 1
    return pal[max(0, min(n - 1, t))]

def eyes(a, b, face, hi, dark=DARKF):
    """крупные вертикальные глаза с бликом (как на референсе)"""
    if face != "north": return None
    for ex in (1, 5):
        if ex <= a <= ex + 1 and 2 <= b <= 4:
            return hi if (a == ex and b == 2) else dark
    return None

def paint_px(var, p, face, a, b, fw, fh):
    k = p["kind"]; nm = p["name"]; c = BL[var]
    if var == "swamp":
        if k == "head":
            e = None
            if face == "north":
                if (a, b) in ((2, 3), (3, 3), (2, 4), (3, 4), (5, 3), (4, 3), (5, 4), (4, 4)) and False: pass
                if 1 <= a <= 2 and 2 <= b <= 4 or 5 <= a <= 6 and 2 <= b <= 4: return c["sock"]
                if b == 6 and 2 <= a <= 5: return c["sock"] if a % 2 == 0 else c["bone"][1]       # зубы
                if (a, b) in ((3, 5), (4, 5)): return c["bone"][1]
            return strata(c["bone"], nm, face, a, b, fw, fh, period=4, jitter=.2)
        if k == "body": return strata(c["skin"], nm, face, a, b, fw, fh, period=3)
        if k == "arm": return strata(c["skin"], nm, face, a, b, fw, fh, period=3, shift=-1)
        if k in ("leg", "foot"): return strata(c["skin"], nm, face, a, b, fw, fh, period=2, shift=-1 if k == "foot" else 0)
        if k == "brim": return strata(c["hat"], nm, face, a, b, fw, fh, period=2)
        if k == "hat": return strata(c["hat"], nm, face, a, b, fw, fh, period=2, shift=-1)
        if k == "grass": return c["grass"][min(3, 1 + b * 3 // max(1, fh)) if face != "up" else 3]
    if var == "jungle":
        if k == "head":
            e = eyes(a, b, face, c["skin"][4])
            if e is not None: return e
            return strata(c["skin"], nm, face, a, b, fw, fh, period=2)
        if k in ("body", "leg", "foot"):
            # диагональные «шевроны» лианы
            t = ((a + b) % 6) // 2
            base = strata(c["skin"], nm, face, a, b, fw, fh, period=3, shift=(1 if t == 0 else 0))
            return base
        if k == "leaf": return strata(c["leaf"], nm, face, a, b, fw, fh, period=2, shift=1)
    if var == "mushroom":
        if k == "head":
            e = eyes(a, b, face, c["skin"][4])
            if e is not None: return e
            return grad(c["skin"], nm, face, a, b, fh, 0.0)
        if k in ("body", "leg", "foot"):
            return grad(c["skin"], nm, face, a, b, fh, 0.15 if k == "body" else 0.7)                 # тёмный сверху → светлый внизу
        if k == "cap":
            if face == "down": return c["gill"][(a + b) % 2]
            if H(nm, face, a // 3, b // 3, "sp") > .7 and a % 3 < 2 and b % 3 < 2: return c["spot"][(a + b) % 2 if False else 0]
            return strata(c["cap"], nm, face, a, b, fw, fh, period=4, jitter=.2)
    if var == "badlands":
        if k in ("head", "body", "leg", "foot"):
            mk = c["mark"]
            if k == "head" and face == "north":
                if (a, b) in ((2, 3), (3, 4), (2, 5), (4, 3), (3, 3), (6, 3), (5, 4), (6, 5), (5, 3), (4, 4)) and False: pass
                if (a, b) in ((2, 3), (3, 4), (2, 5), (6, 3), (5, 4), (6, 5), (4, 4)): return mk              # «Х» из пещерных глаз
                if (a, b) in ((3, 3), (5, 3), (3, 5), (5, 5)): return mk
            if H(nm, face, a, b, "g") > .985: return c["gold"]
            return band(c, nm, face, a, b, fh, off=0 if k != "foot" else 8)
        if k == "head": pass
    if var == "cave":
        if k in ("head", "body", "leg", "foot"):
            if k == "head":
                e = eyes(a, b, face, c["stone"][4])
                if e is not None: return e
            col = strata(c["stone"], nm, face, a, b, fw, fh, period=3, jitter=.34, shift=-1 if k == "foot" else 0)
            if H(nm, face, a // 2, b // 2, "ms") > .78 and (b < fh * 0.5 or k == "foot"): col = c["moss"][int(H(nm, face, a, b, "mc") * 3)]
            return col
        if k == "spike": return c["drip"][min(2, b * 3 // max(1, fh))] if face != "up" else c["drip"][2]
        if k == "mosscap": return c["moss"][(a + b) % 3]
    if var == "meadow":
        if k == "head":
            e = eyes(a, b, face, c["skin"][4])
            if e is not None: return e
            return strata(c["skin"], nm, face, a, b, fw, fh, period=3)
        if k == "body":
            if H(nm, face, a, b, "fl") > .95: return [c["red"][1], c["yel"][1], c["wht"][1], c["blu"][1]][int(H(nm, face, a, b, "fc") * 4)]
            return grad_dirt(c, nm, face, a, b, fh, 0.55)
        if k in ("leg", "foot"): return grad_dirt(c, nm, face, a, b, fh, 0.9 if k == "foot" else 0.7)
        if k == "grass": return c["grass"][min(3, 1 + b * 3 // max(1, fh))] if face != "up" else c["grass"][3]
        if k == "stem": return c["stem"][(a + b) % 2]
        if k.startswith("bloom"):
            pal = {"bloom_a": c["red"], "bloom_b": c["yel"], "bloom_c": c["blu"]}[k]
            return pal[1] if face == "up" else pal[0]
    if var == "darkforest":
        if k == "head":
            e = eyes(a, b, face, c["flesh"][3], dark=c["bark"][0]) if False else None
            if face == "north":
                if 1 <= a <= 2 and 3 <= b <= 5 or 6 <= a <= 7 and 3 <= b <= 5: return DARKF if (a, b) not in ((1, 3), (6, 3)) else c["bark"][4]
                if b == 7 and 3 <= a <= 5: return DARKF
            col = strata(c["bark"], nm, face, a, b, fw, fh, period=3, jitter=.34)
            if face == "up" and H(nm, a, b, "mo") > .6: col = c["moss"][int(H(a, b) * 2)]
            return col
        if k in ("body", "arm"): return strata(c["flesh"], nm, face, a, b, fw, fh, period=3)
        if k in ("leg", "foot"): return strata(c["bark"], nm, face, a, b, fw, fh, period=2, shift=0 if k == "leg" else -1)
        if k == "shroom_s": return c["cream"]
        if k.startswith("shroom_"):
            pal = c["red"] if k in ("shroom_r",) else c["brn"]
            return c["wht"] if face == "up" and (a + b) % 3 == 0 and k == "shroom_r" else pal[1 if face == "up" else 0]
    return hx("ff00ff")

def grad(pal, nm, face, a, b, fh, base):
    """вертикальный градиент: тёмный верх -> светлый низ (тающее грибное тело), с мелкими пятнами"""
    t = base + (b / max(1, fh - 1)) * (0.9 - base)
    i = int(t * (len(pal) - 1) + (H(nm, face, a, b, "gr") - .5) * 1.2)
    return pal[max(0, min(len(pal) - 1, i))]

def grad_dirt(c, nm, face, a, b, fh, start):
    """луг: сверху трава, ниже переходит в дёрн/землю"""
    t = b / max(1, fh - 1)
    if t < start: return strata(c["skin"], nm, face, a, b, 8, fh, period=3)
    return c["dirt"][min(2, int((t - start) / (1 - start) * 3 + H(nm, face, a, b, "d") * .8))]

def band(c, nm, face, a, b, fh, off=0):
    """горизонтальные полосы терракоты с шовными линиями"""
    y = b + off
    seq = [c["o"], c["o"], c["br"], c["o"], c["wh"], c["o"], c["rd"], c["o"]]
    pal = seq[(y // 3) % len(seq)]
    pos = y % 3
    i = 2 + (1 if pos == 0 else -1 if pos == 2 else 0) + (1 if H(nm, face, a, b, "bj") > .8 else 0)
    return pal[max(0, min(len(pal) - 1, i % len(pal) if False else min(len(pal) - 1, max(0, i - (4 - len(pal))))))]

# ---------------------------------------------------------------- сборка
def load(var):
    P = g.P; P.clear()
    for (name, parent, pivot, rot, origin, size, kind) in V[var]["parts"]:
        P.append(dict(name=name, parent=parent, pivot=pivot, rot=rot, origin=origin, size=size, kind=kind))
    g.BY.clear(); g.BY.update({p["name"]: p for p in P})
    g.TEX_W, g.TEX_H = 128, 128
    g.UV = g.pack()

def paint(var):
    img = np.zeros((g.TEX_H, g.TEX_W, 4), np.uint8)
    for p in g.P:
        w, h, d = (int(-(-s // 1)) for s in p["size"]); u0, v0 = g.UV[p["name"]]
        faces = {"east": (u0, v0 + d, d, h), "north": (u0 + d, v0 + d, w, h), "west": (u0 + d + w, v0 + d, d, h),
                 "south": (u0 + 2 * d + w, v0 + d, w, h), "up": (u0 + d, v0, w, d), "down": (u0 + d + w, v0, w, d)}
        for fname, (x, y, fw, fh) in faces.items():
            for b in range(fh):
                for a in range(fw):
                    img[y + b, x + a] = tuple(paint_px(var, p, fname, a, b, fw, fh)) + (255,)
    return img

def camel(n):
    a = n.split("_"); return a[0] + "".join(s.capitalize() for s in a[1:])
def f(v): return ("%g" % v) + "F"
def java_method(var):
    lines = []
    for p in g.P:
        w, h, d = p["size"]; u, v = g.UV[p["name"]]; ox, oy, oz = p["origin"]; px, py, pz = p["pivot"]; rx, ry, rz = p["rot"]
        tr = (f"ModelTransform.of({f(px)}, {f(py)}, {f(pz)}, {f(rx)}, {f(ry)}, {f(rz)})" if (rx or ry or rz) else f"ModelTransform.pivot({f(px)}, {f(py)}, {f(pz)})")
        par = "r" if p["parent"] == "root" else camel(p["parent"]) + "D"
        lines.append(f'\t\tModelPartData {camel(p["name"])}D = {par}.addChild("{p["name"]}", ModelPartBuilder.create().uv({u}, {v}).cuboid({f(ox)}, {f(oy)}, {f(oz)}, {f(w)}, {f(h)}, {f(d)}), {tr});')
    return f"\tprivate static TexturedModelData {var}() {{\n\t\tModelData data = new ModelData();\n\t\tModelPartData r = data.getRoot();\n" + "\n".join(lines) + "\n\t\treturn TexturedModelData.of(data, 128, 128);\n\t}\n"

def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    methods, sw, previews = [], [], {}
    for var in V:
        load(var)
        img = paint(var)
        Image.fromarray(img).save(f"{root}/src/main/resources/assets/amberhall/textures/entity/{var}_creeper.png")
        methods.append(java_method(var)); sw.append(f'\t\t\tcase "{var}" -> {var}();')
        previews[var] = img
    src = ("package com.amberhall.mod;\n\nimport net.minecraft.client.model.ModelData;\nimport net.minecraft.client.model.ModelPartBuilder;\n"
           "import net.minecraft.client.model.ModelPartData;\nimport net.minecraft.client.model.ModelTransform;\nimport net.minecraft.client.model.TexturedModelData;\n\n"
           "/** Данные моделей биомных криперов. Генерируется tools/creeper_variants.py — вручную не править. */\npublic final class CreeperVariantModels {\n"
           "\tprivate CreeperVariantModels() {\n\t}\n\n\tpublic static TexturedModelData get(String variant) {\n\t\treturn switch (variant) {\n" + "\n".join(sw) +
           '\n\t\t\tdefault -> throw new IllegalArgumentException(variant);\n\t\t};\n\t}\n\n' + "\n".join(methods) + "}\n")
    open(f"{root}/src/main/java/com/amberhall/mod/CreeperVariantModels.java", "w", encoding="utf-8").write(src)
    print("ok", list(V))
    if len(sys.argv) > 1:
        cells = []
        for var in V:
            load(var)
            cells.append(g.render(previews[var], 35, 14, 300, 7.5, center=(0, 12, 0)))
        sheet = Image.new("RGB", (300 * 4, 300 * 2))
        for i, c in enumerate(cells): sheet.paste(c, ((i % 4) * 300, (i // 4) * 300))
        sheet.save(sys.argv[1])

if __name__ == "__main__":
    main()
