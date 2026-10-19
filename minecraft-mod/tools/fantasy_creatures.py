#!/usr/bin/env python3
"""Выдуманные подводные существа: яркие насыщенные цвета и проработанные текстуры (чешуя, пятна, кристаллы, лава, присоски).

Только превью для выбора. Запуск из папки minecraft-mod:  python3 tools/fantasy_creatures.py out_prefix
"""
import math, os, random, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
import beetle_gen as g
from PIL import Image, ImageDraw

g.TEX_W, g.TEX_H = 128, 128
P = g.P

def hx(s): return g.hx(s)
def ramp(*c): return [hx(x) for x in c]
# насыщенные 4-тоновые рампы: тёмный → светлый
PAL = {
    "TURQ":   ramp("07627a", "0fa0bb", "2cd8ea", "9ff6ff"),
    "MAG":    ramp("7a0f6c", "c01a9c", "f23ccb", "ffa0ec"),
    "GOLD":   ramp("a85c00", "e49a00", "ffd000", "fff29a"),
    "CORAL":  ramp("c0183e", "f03a5c", "ff7088", "ffc2cc"),
    "LIME":   ramp("2a7a10", "4cb824", "86e83a", "d8ff84"),
    "VIOLET": ramp("40148c", "6e2ed2", "a054ff", "e2bcff"),
    "ORANGE": ramp("b02400", "f05a00", "ff9420", "ffd47a"),
    "NAVY":   ramp("08185a", "1634a8", "2e68f2", "7cb2ff"),
    "NIGHT":  ramp("0a0a18", "181834", "28284e", "42426c"),
    "BONE":   ramp("b8a878", "e8dcb0", "fff6d4", "ffffff"),
    "AQUA":   ramp("0a5a9a", "1496dc", "40c8ff", "a8ecff"),
}

def part(name, parent, pivot, rot, origin, size, style):
    P.append(dict(name=name, parent=parent, pivot=pivot, rot=rot, origin=origin, size=size, style=style))

def clamp(v, lo, hi): return max(lo, min(hi, v))
def H(*a): return (hash(a) & 0xffffff) / float(0x1000000)

# ---------------------------------------------------------------- узоры (возвращают цвет RGB)
def pat(style, p, face, a, b, fw, fh, rnd):
    kind, pal = style[0], style[1]
    R = PAL[pal]
    n = rnd.random()
    if kind == "flat":
        i = style[2] if len(style) > 2 else 1
        return R[clamp(i + (-1 if n < .12 else (1 if n > .9 else 0)), 0, 3)]
    if kind == "scales":
        # ряды чешуй со смещением: тёмный контур, светлый блик в углу
        sx = (a + ((b // 3) % 2) * 2) % 4
        sy = b % 3
        if sy == 0: c = R[0]
        elif sx == 0: c = R[1]
        elif sx == 1 and sy == 1: c = R[3]
        elif sx <= 2: c = R[2]
        else: c = R[1]
        if face == "down": c = g.shade(c, .8)
        return c
    if kind == "spots":
        spot = PAL[style[2]]
        cs = 4
        ca, cb = (a + (b // cs % 2) * 2) // cs, b // cs
        if H(p["name"], face, ca, cb) < .45:
            cx, cy = ca * cs + 1 + int(H(ca, cb, 1) * 2), cb * cs + 1 + int(H(ca, cb, 2) * 2)
            d = abs(a - cx) + abs(b - cy)
            if d <= 1: return spot[3] if d == 0 else spot[2]
            if d == 2 and n > .5: return spot[1]
        return R[1 if n > .15 else 0] if n < .85 else R[2]
    if kind == "rings":
        if b % 3 == 0: return R[0]
        if b % 3 == 1: return R[2] if face in ("up",) else R[1]
        # присоски: светлые точки на передней грани
        if face in ("north", "south") and a == fw // 2: return R[3]
        return R[1]
    if kind == "crystal":
        d = (a + b) % 4
        c = [R[3], R[2], R[1], R[2]][d]
        if a in (0, fw - 1) or b == fh - 1: c = R[1]
        if n > .93: c = hx("ffffff")
        return c
    if kind == "lava":
        # тёмная корка с горящими трещинами
        crack = ((a * 2 + b * 3 + int(H(p["name"], a // 4, b // 4) * 5)) % 9 in (0, 1)) or ((a + 2 * b) % 11 == 0)
        if crack: return ORANGE_GLOW[min(3, int(H(p["name"], a, b) * 4))]
        return PAL["NIGHT"][1 if n < .7 else 2]
    if kind == "coral":
        base = R[1]
        if (a + b * 2) % 5 == 0: base = R[2]
        if H(p["name"], a // 2, b // 2) < .2: base = R[0]
        if H(p["name"], a, b, 9) > .93: base = R[3]
        return base
    if kind == "lightning":
        zig = (b + (a // 2) * 2) % 8
        if zig in (0, 1): return PAL["AQUA"][3] if zig == 0 else PAL["AQUA"][2]
        return R[1 if n < .6 else 2]
    if kind == "stripes":
        w = style[2] if len(style) > 2 else 2
        s = ((a if face in ("east", "west") else b) // w) % 2
        return R[2] if s else R[0]
    if kind == "gradient":
        t = b / max(1, fh - 1) if face not in ("up", "down") else .5
        R2 = PAL[style[2]]
        return g.mix(R[2], R2[2], t)
    if kind == "glow":
        t = 0.2 + 0.8 * (1 - abs((a - fw / 2 + .5) / max(1, fw / 2)))
        return g.mix(R[2], R[3], t)
    if kind == "iris":
        # большой светящийся глаз: радужка цвета pal, чёрный вертикальный зрачок, блик
        cx = (fw - 1) / 2
        if face in ("east", "west", "north", "south") and fw >= 2 and fh >= 2:
            if abs(a - cx) < .6 and fh >= 3 and 0 < b < fh - 1: return hx("0a0a10")
            if (a, b) == (0, 0): return hx("ffffff")
            return R[3] if (a + b) % 2 == 0 else R[2]
        return R[1]
    if kind == "tooth":
        c = PAL["BONE"][2]
        if b >= fh - 1: c = PAL["BONE"][0]
        return c
    return hx("ff00ff")

ORANGE_GLOW = ramp("ff3c00", "ff7a00", "ffb400", "fff08a")

def paint():
    img = np.zeros((g.TEX_H, g.TEX_W, 4), np.uint8)
    for p in P:
        w, h, d = (g.ceil(s) for s in p["size"])
        u0, v0 = g.UV[p["name"]]
        rnd = random.Random(hash(p["name"]) & 0xffff)
        faces = {"east": (u0, v0 + d, d, h), "north": (u0 + d, v0 + d, w, h), "west": (u0 + d + w, v0 + d, d, h),
                 "south": (u0 + 2 * d + w, v0 + d, w, h), "up": (u0 + d, v0, w, d), "down": (u0 + d + w, v0, w, d)}
        for fname, (x, y, fw, fh) in faces.items():
            for b in range(fh):
                for a in range(fw):
                    c = pat(p["style"], p, fname, a, b, fw, fh, rnd)
                    img[y + b, x + a] = tuple(c[:3]) + (255,)
    return img

def finish():
    g.BY.clear(); g.BY.update({p["name"]: p for p in P})
    g.UV = g.pack()

# ================================================================ существа
def tentacles(prefix, n, cx, cy, cz, r, length1, length2, pal, tip, tilt=.35):
    for k in range(n):
        ang = 2 * math.pi * k / n
        dx, dz = math.sin(ang), math.cos(ang)
        part(f"{prefix}{k}", "root", (cx + dx * r, cy, cz + dz * r), (tilt * dz, 0, -tilt * dx), (-1, 0, -1), (2, length1, 2), ("rings", pal))
        part(f"{prefix}{k}b", f"{prefix}{k}", (0, length1, 0), (0.3 * dz, 0, -0.3 * dx), (-0.75, 0, -0.75), (1.5, length2, 1.5), ("rings", pal))
        part(f"{prefix}{k}t", f"{prefix}{k}b", (0, length2, 0), (0, 0, 0), (-1, 0, -1), (2, 2, 2), ("glow", tip))

def kraken():
    """Спектральный кракен: фиолетовая мантия с пурпурными пятнами, огромные светящиеся глаза, 8 щупалец с присосками"""
    P.clear()
    part("mantle", "root", (0, 8, 0), (0, 0, 0), (-5, -5, -5), (10, 9, 10), ("spots", "VIOLET", "MAG"))
    part("crown", "root", (0, 3, 0), (0, 0, 0), (-3, -3, -3), (6, 3, 6), ("spots", "VIOLET", "MAG"))
    part("crest", "root", (0, 0.5, 0), (0, 0, 0), (-1.5, -2, -4), (3, 3, 8), ("crystal", "MAG"))
    part("eye_l", "root", (0, 10, -4), (0, 0, 0), (4.5, -2, -2), (2, 5, 5), ("iris", "GOLD"))
    part("eye_r", "root", (0, 10, -4), (0, 0, 0), (-6.5, -2, -2), (2, 5, 5), ("iris", "GOLD"))
    part("beak", "root", (0, 17, -4), (0, 0, 0), (-2, -1, -2), (4, 3, 3), ("flat", "GOLD", 2))
    tentacles("tent", 8, 0, 16, 0, 3.6, 6, 6, "VIOLET", "TURQ")
    finish()

def wyrm():
    """Кристальный змей: бирюзовая чешуя, пурпурные кристаллы на спине, золотой рог и плавники"""
    P.clear()
    part("head", "root", (0, 14, -14), (0, 0, 0), (-4, -3.5, -8), (8, 7, 9), ("scales", "TURQ"))
    part("snout", "root", (0, 15, -22), (0, 0, 0), (-3, -2, -4), (6, 4, 5), ("scales", "TURQ"))
    part("jaw", "root", (0, 17.5, -14), (0.3, 0, 0), (-3.5, -1, -10), (7, 2, 10), ("scales", "AQUA"))
    for i in range(4):
        part(f"fang{i}", "snout", (0, 0, 0), (0, 0, 0), (-2.5 + i * 1.5, 1.6, -4.1), (0.8, 2.5, 0.8), ("tooth", "BONE"))
    part("horn", "root", (0, 10.5, -17), (-0.5, 0, 0), (-1, -7, -1), (2, 7, 2), ("crystal", "GOLD"))
    part("eye_l", "root", (0, 12, -17), (0, 0, 0), (4, -1, -1), (1, 3, 3), ("iris", "MAG"))
    part("eye_r", "root", (0, 12, -17), (0, 0, 0), (-5, -1, -1), (1, 3, 3), ("iris", "MAG"))
    z = -6
    for i in range(5):
        w = [10, 9, 8, 6, 4][i]
        part(f"seg{i}", "root", (0, 14, z), (0, 0, 0), (-w / 2, -w / 2, 0), (w, w, 8), ("scales", "TURQ"))
        part(f"cryA{i}", "root", (-1.2, 14 - w / 2, z + 3), (0, 0, -0.35), (-1, -5 + i * .6, -1), (2, 5 - i * .6, 2), ("crystal", "MAG"))
        part(f"cryB{i}", "root", (1.2, 14 - w / 2, z + 5), (0, 0, 0.35), (-1, -4 + i * .5, -1), (2, 4 - i * .5, 2), ("crystal", "MAG"))
        z += 8
    part("fin_l", "root", (5, 17, -9), (0, 0, 0.6), (0, -0.5, -3), (9, 1, 7), ("scales", "GOLD"))
    part("fin_r", "root", (-5, 17, -9), (0, 0, -0.6), (-9, -0.5, -3), (9, 1, 7), ("scales", "GOLD"))
    part("tail_fin", "root", (0, 14, 34), (0, 0, 0), (-0.5, -8, 0), (1, 16, 8), ("scales", "GOLD"))
    finish()

def eel():
    """Магмовая мурена: чёрная корка с горящими трещинами лавы, раскалённые глаза, огненные плавники"""
    P.clear()
    part("head", "root", (0, 14, -22), (0, 0, 0), (-4, -3.5, -8), (8, 7, 8), ("lava", "NIGHT"))
    part("jaw", "root", (0, 17, -18), (0.45, 0, 0), (-3.5, -1, -9), (7, 2, 9), ("lava", "NIGHT"))
    for i in range(5):
        part(f"fang_u{i}", "head", (0, 0, 0), (0, 0, 0), (-3.4 + i * 1.5, 2.6, -8.2), (0.8, 2.4, 0.8), ("tooth", "BONE"))
    for i in range(4):
        part(f"fang_l{i}", "jaw", (0, 0, 0), (0, 0, 0), (-2.7 + i * 1.8, -3.4, -8.8), (0.8, 2.4, 0.8), ("tooth", "BONE"))
    part("eye_l", "head", (0, 0, 0), (0, 0, 0), (4, -2.5, -5.5), (1, 3, 3), ("iris", "ORANGE"))
    part("eye_r", "head", (0, 0, 0), (0, 0, 0), (-5, -2.5, -5.5), (1, 3, 3), ("iris", "ORANGE"))
    z = -14
    for i in range(6):
        w = [7, 7, 6, 5, 4, 3][i]
        part(f"seg{i}", "root", (0, 14, z), (0, 0, 0), (-w / 2, -w / 2, 0), (w, w, 8), ("lava", "NIGHT"))
        part(f"flame{i}", "root", (0, 14 - w / 2, z + 1), (0, 0, 0), (-0.5, -3 - (i % 2) * 2, 0), (1, 3 + (i % 2) * 2, 5), ("glow", "ORANGE"))
        z += 8
    part("tail_fin", "root", (0, 14, 34), (0, 0, 0), (-0.5, -5, 0), (1, 10, 7), ("glow", "ORANGE"))
    finish()

def crab():
    """Коралловый краб-голем: розовый коралловый панцирь, лаймовые коралловые ветви, бирюзовые светящиеся глаза"""
    P.clear()
    part("body", "root", (0, 18, 0), (0, 0, 0), (-7, -3, -5), (14, 6, 10), ("coral", "CORAL"))
    part("shell", "root", (0, 15.5, 0), (0, 0, 0), (-6, -2, -4), (12, 3, 8), ("coral", "CORAL"))
    for i, (x, z, h) in enumerate(((-4, -2, 6), (0, 1, 8), (4, -1, 5), (-2, 3, 5), (3, 3, 6))):
        part(f"branch{i}", "root", (x, 14, z), (0.1 * (i - 2), 0, 0.15 * (i - 2)), (-1, -h, -1), (2, h, 2), ("coral", "LIME"))
        part(f"tip{i}", f"branch{i}", (0, -h, 0), (0, 0, 0), (-1.5, -2, -1.5), (3, 2, 3), ("glow", "GOLD"))
    part("head", "root", (0, 17, -5), (0, 0, 0), (-3, -2, -2), (6, 4, 3), ("coral", "CORAL"))
    part("eye_l", "head", (0, 0, 0), (0, 0, 0), (1.5, -5, -1), (2, 3, 2), ("iris", "TURQ"))
    part("eye_r", "head", (0, 0, 0), (0, 0, 0), (-3.5, -5, -1), (2, 3, 2), ("iris", "TURQ"))
    part("arm_l", "root", (7, 18, -4), (0, -0.5, 0), (0, -1, -5), (3, 3, 6), ("scales", "VIOLET"))
    part("claw_l", "arm_l", (0, 0, -5), (0, 0, 0), (-1, -2.5, -6), (5, 5, 6), ("spots", "VIOLET", "MAG"))
    part("arm_r", "root", (-7, 18, -4), (0, 0.5, 0), (-3, -1, -5), (3, 3, 6), ("scales", "VIOLET"))
    part("claw_r", "arm_r", (0, 0, -5), (0, 0, 0), (-4, -2.5, -6), (5, 5, 6), ("spots", "VIOLET", "MAG"))
    for i, z in enumerate((-3, 0, 3)):
        part(f"leg_l{i}", "root", (7, 19, z), (0, 0, -0.5), (0, -0.5, -0.5), (6, 1, 1), ("stripes", "CORAL", 1))
        part(f"leg_r{i}", "root", (-7, 19, z), (0, 0, 0.5), (-6, -0.5, -0.5), (6, 1, 1), ("stripes", "CORAL", 1))
    finish()

def puffer():
    """Шипастый шар-дракон: лаймовое тело в фиолетовых пятнах, оранжевые шипы, огромные жёлтые глаза"""
    P.clear()
    part("body", "root", (0, 14, 0), (0, 0, 0), (-6, -6, -6), (12, 12, 12), ("spots", "LIME", "VIOLET"))
    for k, (x, y, z) in enumerate(((0, -6, 0), (0, 6, 0), (6, 0, 0), (-6, 0, 0), (0, 0, 6), (-4, -5, -4), (4, -5, -4), (-4, -5, 4), (4, -5, 4),
                                    (-4, 5, -4), (4, 5, -4), (-4, 5, 4), (4, 5, 4), (6, -4, 3), (-6, -4, 3), (6, 4, -3), (-6, 4, -3))):
        sx, sy, sz = (1, 3, 1)
        ox, oy, oz = x - .5, y - (3 if y < 0 else (0 if y > 0 else 1.5)), z - .5
        if abs(x) == 6: ox, sx, sy = (x - (0 if x > 0 else 3)), 3, 1; oy = y - .5
        if z == 6 and abs(x) != 6: oz, sz, sy = z, 3, 1; oy = y - .5
        part(f"spike{k}", "body", (0, 0, 0), (0, 0, 0), (ox, oy, oz), (sx, sy, sz), ("crystal", "ORANGE"))
    part("eye_l", "body", (0, 0, 0), (0, 0, 0), (6, -3, -5), (1, 4, 4), ("iris", "GOLD"))
    part("eye_r", "body", (0, 0, 0), (0, 0, 0), (-7, -3, -5), (1, 4, 4), ("iris", "GOLD"))
    part("mouth", "body", (0, 0, 0), (0, 0, 0), (-3, 1, -6.6), (6, 3, 1), ("flat", "CORAL", 0))
    for i in range(4):
        part(f"tooth{i}", "body", (0, 0, 0), (0, 0, 0), (-2.4 + i * 1.6, 1, -7.3), (0.8, 1.5, 0.8), ("tooth", "BONE"))
    part("tail", "root", (0, 14, 6), (0, 0, 0), (-2, -2, 0), (4, 4, 4), ("spots", "LIME", "VIOLET"))
    part("tail_fin", "tail", (0, 0, 4), (0, 0, 0), (-0.5, -5, 0), (1, 10, 5), ("scales", "MAG"))
    part("fin_l", "root", (6, 15, -1), (0, 0, 0.7), (0, -0.5, -2), (5, 1, 4), ("scales", "MAG"))
    part("fin_r", "root", (-6, 15, -1), (0, 0, -0.7), (-5, -0.5, -2), (5, 1, 4), ("scales", "MAG"))
    finish()

def seahorse():
    """Морской конёк-дракон: золотая чешуя с бирюзовым брюхом, свиток-хвост, светящийся плавник-корона"""
    P.clear()
    part("snout", "root", (0, 4, -6), (0.3, 0, 0), (-1.5, -1.5, -6), (3, 3, 6), ("scales", "GOLD"))
    part("head", "root", (0, 5, -2), (0.2, 0, 0), (-3, -3, -3), (6, 6, 6), ("scales", "GOLD"))
    part("eye_l", "head", (0, 0, 0), (0, 0, 0), (3, -2, -2), (1, 3, 3), ("iris", "TURQ"))
    part("eye_r", "head", (0, 0, 0), (0, 0, 0), (-4, -2, -2), (1, 3, 3), ("iris", "TURQ"))
    for i in range(3):
        part(f"crown{i}", "head", (0, -3, 0.5 + i * 1.2 - 1.5), (-0.2, 0, 0), (-0.5, -4 + i * .5, -0.5), (1, 4 - i * .5, 1), ("crystal", "MAG"))
    part("neck", "root", (0, 9, 1), (-0.3, 0, 0), (-3, -1, -3), (6, 8, 6), ("scales", "GOLD"))
    part("chest", "root", (0, 17, 1), (-0.15, 0, 0), (-4, -2, -3.5), (8, 7, 7), ("scales", "TURQ"))
    part("belly", "root", (0, 24, 0), (0, 0, 0), (-3.5, -2, -3), (7, 6, 6), ("scales", "TURQ"))
    part("tail1", "root", (0, 30, 0), (0.15, 0, 0), (-2.5, -1, -2.5), (5, 6, 5), ("scales", "GOLD"))
    part("tail2", "tail1", (0, 6, 0), (0.5, 0, 0), (-2, 0, -2), (4, 5, 4), ("scales", "GOLD"))
    part("tail3", "tail2", (0, 5, 0), (0.7, 0, 0), (-1.5, 0, -1.5), (3, 4, 3), ("scales", "GOLD"))
    part("dorsal", "root", (0, 16, 4), (0, 0, 0), (-0.5, -2, 0), (1, 10, 5), ("glow", "MAG"))
    part("fin_l", "root", (4, 16, 0), (0, 0, 0.6), (0, -0.5, -2), (6, 1, 4), ("glow", "MAG"))
    part("fin_r", "root", (-4, 16, 0), (0, 0, -0.6), (-6, -0.5, -2), (6, 1, 4), ("glow", "MAG"))
    finish()

def storm_ray():
    """Штормовой скат: бирюзово-синие «крылья» с жёлтыми молниями, шипастый хвост с искрой"""
    P.clear()
    part("body", "root", (0, 18, 0), (0, 0, 0), (-4, -2.5, -6), (8, 5, 12), ("lightning", "NAVY"))
    part("wing_l", "root", (4, 18, 0), (0, 0, 0.15), (0, -1.5, -6), (11, 2, 12), ("lightning", "NAVY"))
    part("wing_r", "root", (-4, 18, 0), (0, 0, -0.15), (-11, -1.5, -6), (11, 2, 12), ("lightning", "NAVY"))
    part("eye_l", "body", (0, 0, 0), (0, 0, 0), (2, -3.5, -5), (2, 1, 2), ("iris", "GOLD"))
    part("eye_r", "body", (0, 0, 0), (0, 0, 0), (-4, -3.5, -5), (2, 1, 2), ("iris", "GOLD"))
    part("horn_l", "body", (0, 0, 0), (0, 0, 0), (3, -2.5, -6.5), (1, 1, 3), ("glow", "GOLD"))
    part("horn_r", "body", (0, 0, 0), (0, 0, 0), (-4, -2.5, -6.5), (1, 1, 3), ("glow", "GOLD"))
    part("tail1", "root", (0, 18, 6), (0, 0, 0), (-1.5, -1.5, 0), (3, 3, 8), ("lightning", "NAVY"))
    part("tail2", "tail1", (0, 0, 8), (0, 0, 0), (-1, -1, 0), (2, 2, 8), ("lightning", "NAVY"))
    part("spark", "tail2", (0, 0, 8), (0, 0, 0), (-1.5, -1.5, 0), (3, 3, 3), ("glow", "GOLD"))
    finish()

CREATURES = [("1_kraken", kraken, (0, 14, 0), 9), ("2_wyrm", wyrm, (0, 14, 10), 6.5), ("3_eel", eel, (0, 14, 10), 6.5),
             ("4_crab", crab, (0, 16, 0), 12), ("5_puffer", puffer, (0, 14, 0), 11), ("6_seahorse", seahorse, (0, 18, 0), 7), ("7_storm_ray", storm_ray, (0, 18, 2), 11)]

def sheet(img, title, center, scale):
    views = [g.render(img, 30, -14, scale=scale, center=center), g.render(img, 90, 6, scale=scale, center=center),
             g.render(img, 0, 4, scale=scale, center=center), g.render(img, 150, 28, scale=scale, center=center)]
    im = Image.new("RGB", (600, 630), (22, 24, 34))
    for i, v in enumerate(views):
        im.paste(v, ((i % 2) * 300, 30 + (i // 2) * 300))
    ImageDraw.Draw(im).text((10, 8), title, fill=(240, 240, 240))
    return im

def main():
    prefix = sys.argv[1]
    for name, fn, center, scale in CREATURES:
        fn()
        img = paint()
        sheet(img, name, center, scale).save(f"{prefix}_{name}.png")
        print("ok", name, len(P))

if __name__ == "__main__":
    main()
