#!/usr/bin/env python3
"""Новые подводные существа в ванильном стиле: смесь стража, черепахи, аксолотля, дельфина и светящегося спрута.
Простые формы, мало кубиков, чёткие цвета, одна яркая «фишка».

Только превью. Запуск из папки minecraft-mod:  python3 tools/vanilla_style.py out_prefix
"""
import math, os, random, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
import beetle_gen as g
from PIL import Image, ImageDraw

g.TEX_W, g.TEX_H = 128, 64
P = g.P
def hx(s): return g.hx(s)
def H(*a): return (hash(a) & 0xffffff) / float(0x1000000)

def part(name, parent, pivot, rot, origin, size, style):
    P.append(dict(name=name, parent=parent, pivot=pivot, rot=rot, origin=origin, size=size, style=style))

def noisy(c, rnd, amt=.08):
    k = 1 + (rnd.random() - .5) * 2 * amt
    return g.shade(c, k)

def pat(p, face, a, b, fw, fh, rnd):
    s = p["style"]; kind = s[0]
    if kind == "flat":                      # ровный цвет с лёгким шумом, как у ванильных мобов
        return noisy(hx(s[1]), rnd, s[2] if len(s) > 2 else .07)
    if kind == "hex":                       # панцирь черепахи: шестиугольные пластины
        base, edge, hi = hx(s[1]), hx(s[2]), hx(s[3])
        if face in ("up", "east", "west", "north", "south"):
            row = b // 3 if face != "up" else b // 3
            off = (row % 2) * 2
            ax = (a + off) % 4
            by = b % 3
            if by == 0 or ax == 0: return noisy(edge, rnd, .05)
            if ax == 1 and by == 1: return noisy(hi, rnd, .04)
            return noisy(base, rnd, .06)
        return noisy(edge, rnd, .06)
    if kind == "guard":                     # кожа стража: бирюзовые пятна и тёмные трещинки
        base, dark, light = hx(s[1]), hx(s[2]), hx(s[3])
        n = H(p["name"], face, a // 2, b // 2)
        c = base
        if n < .22: c = dark
        elif n > .82: c = light
        if H(p["name"], a, b, 3) < .06: c = dark
        return noisy(c, rnd, .05)
    if kind == "spots":                     # фон + светлые пятна (как у светящегося спрута)
        base, spot = hx(s[1]), hx(s[2])
        if H(p["name"], face, a // 2, b // 2, 5) < s[3]: return noisy(spot, rnd, .05)
        return noisy(base, rnd, .05)
    if kind == "gill":                      # жабры аксолотля: тонкие нити с зубчатым краем (прозрачность)
        ln = [fh, int(fh * .6), fh, int(fh * .75), fh][a % 5]
        if face not in ("east", "west"): return None
        if b >= ln: return None
        c = hx(s[1]) if b % 2 == 0 else hx(s[2])
        return noisy(c, rnd, .04)
    if kind == "eye":                       # большой глаз стража: белок, красная радужка, чёрный зрачок
        if face == s[1]:
            cx, cy = (fw - 1) / 2, (fh - 1) / 2
            d = max(abs(a - cx), abs(b - cy))
            if d < 0.7: return hx("0a0a0a")
            if d < 1.8: return hx("c01818")
            if d < 2.6: return hx("e8e0d0")
            return noisy(hx(s[2]), rnd, .05)
        return noisy(hx(s[2]), rnd, .05)
    if kind == "face":                      # аксолотль: большие тёмные глаза и улыбка на передней грани
        if face == "north":
            if (a, b) in s[2]: return hx("1a0c18")
            if (a, b) in s[3]: return hx("c05a78")
        return noisy(hx(s[1]), rnd, .05)
    return hx("ff00ff")

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
                    c = pat(p, fname, a, b, fw, fh, rnd)
                    if c is not None:
                        img[y + b, x + a] = tuple(c[:3]) + (255,)
    return img

def finish():
    g.BY.clear(); g.BY.update({p["name"]: p for p in P})
    g.UV = g.pack()

# ================================================================ A: янтарный панцирник (черепаха + страж + аксолотль)
def shellback():
    P.clear()
    # панцирь и брюшная пластина как у черепахи, но янтарные; шипы — от стража; жабры — от аксолотля
    part("shell",   "root", (0, 18, 0),   (0, 0, 0), (-6, -4, -8),   (12, 4, 16), ("hex", "e08a18", "8a4a08", "ffd060"))
    part("shell2",  "root", (0, 14, 0),   (0, 0, 0), (-4.5, -2, -6), (9, 2, 12),  ("hex", "f0a020", "9a5a0c", "ffe080"))
    part("belly",   "root", (0, 20.5, 0), (0, 0, 0), (-5.5, -1, -7), (11, 2, 14), ("flat", "d8c890", .06))
    part("head",    "root", (0, 18, -9),  (0, 0, 0), (-3.5, -3, -5), (7, 6, 6),   ("eye", "north", "4a8a80"))
    for i, (x, z) in enumerate(((-3.5, -9), (3.5, -9), (-4.5, 0), (4.5, 0), (0, 6))):
        part(f"spike{i}", "root", (x, 14.5, z), (0, 0, 0), (-0.5, -3, -0.5), (1, 3, 1), ("flat", "f06a10", .05))
    for i, off in enumerate((-1.5, 0.5, 2.5)):
        part(f"gill_l{i}", "head", (3.5, 0, off), (0, 0, -0.6 - i * .25), (0, -0.5, -0.5), (4, 1, 1), ("gill", "f0647c", "ff9aa8"))
        part(f"gill_r{i}", "head", (-3.5, 0, off), (0, 0, 0.6 + i * .25), (-4, -0.5, -0.5), (4, 1, 1), ("gill", "f0647c", "ff9aa8"))
    part("fl_l", "root", (6, 21, -5),  (0, -0.5, 0.3),  (0, -0.5, -2), (7, 1, 4), ("guard", "3f8a80", "2a6a62", "5cb0a4"))
    part("fl_r", "root", (-6, 21, -5), (0, 0.5, -0.3),  (-7, -0.5, -2), (7, 1, 4), ("guard", "3f8a80", "2a6a62", "5cb0a4"))
    part("hl_l", "root", (4, 21, 7),   (0, 0.4, 0.2),   (0, -0.5, -1.5), (4, 1, 3), ("guard", "3f8a80", "2a6a62", "5cb0a4"))
    part("hl_r", "root", (-4, 21, 7),  (0, -0.4, -0.2), (-4, -0.5, -1.5), (4, 1, 3), ("guard", "3f8a80", "2a6a62", "5cb0a4"))
    part("tail", "root", (0, 19, 8),   (0, 0, 0), (-1.5, -1, 0), (3, 2, 4), ("guard", "3f8a80", "2a6a62", "5cb0a4"))
    finish()

# ================================================================ B: спрут-страж (светящийся спрут + страж)
def squidguard():
    P.clear()
    part("body", "root", (0, 8, 0), (0, 0, 0), (-6, -8, -6), (12, 16, 12), ("spots", "1c4a58", "5fe8e0", .16))
    part("eye_front", "root", (0, 6, -6.2), (0, 0, 0), (-4, -3, -0.6), (8, 6, 1), ("eye", "north", "1c4a58"))
    for i, (x, z, ry, rz) in enumerate(((-5, 0, 0, 0.5), (5, 0, 0, -0.5), (0, -5, -0.5, 0), (0, 5, 0.5, 0))):
        part(f"spike{i}", "body", (x, -2, z), (ry, 0, rz), (-0.5, -4, -0.5), (1, 5, 1), ("flat", "f06a10", .05))
    for i in range(8):
        ang = 2 * math.pi * i / 8
        part(f"t{i}", "root", (math.cos(ang) * 4, 16, math.sin(ang) * 4), (0.25 * math.sin(ang), 0, -0.25 * math.cos(ang)), (-1, 0, -1), (2, 16, 2), ("spots", "1c4a58", "5fe8e0", .2))
    finish()

# ================================================================ C: морской аксолотль (дельфин + аксолотль)
def axodolphin():
    P.clear()
    part("body", "root", (0, 15, 0), (0, 0, 0), (-4, -3.5, -6), (8, 7, 13), ("flat", "e88cb4", .06))
    part("head", "root", (0, 15, -6), (0, 0, 0), (-3.5, -3, -6), (7, 6, 6), ("face", "f09cc0", ((1, 2), (5, 2)), ((2, 4), (3, 4), (4, 4))))
    part("snout", "head", (0, 1, -6), (0, 0, 0), (-1.5, -1, -3), (3, 2, 3), ("flat", "f6b0cc", .05))
    for i, off in enumerate((-1.5, 0.5, 2.5)):
        part(f"gill_l{i}", "head", (3.5, 0, off - 1), (0, 0, -0.5 - i * .3), (0, -0.5, -0.5), (5, 1, 1), ("gill", "d8386a", "f06a90"))
        part(f"gill_r{i}", "head", (-3.5, 0, off - 1), (0, 0, 0.5 + i * .3), (-5, -0.5, -0.5), (5, 1, 1), ("gill", "d8386a", "f06a90"))
    part("dorsal", "body", (0, -3.5, 0), (-0.3, 0, 0), (-0.5, -6, -1), (1, 6, 6), ("gill", "e0508a", "f080a8"))
    part("tail1", "root", (0, 15, 7), (0, 0, 0), (-3, -2.5, 0), (6, 5, 6), ("flat", "e88cb4", .06))
    part("tail2", "tail1", (0, 0, 6), (0, 0, 0), (-2, -2, 0), (4, 4, 5), ("flat", "e88cb4", .06))
    part("fluke", "tail2", (0, 0, 5), (0, 0, 0), (-6, -0.5, 0), (12, 1, 5), ("gill", "e0508a", "f080a8"))
    part("fin_l", "root", (4, 17, -3), (0, 0, -0.7), (0, -0.5, -1.5), (6, 1, 4), ("gill", "e0508a", "f080a8"))
    part("fin_r", "root", (-4, 17, -3), (0, 0, 0.7), (-6, -0.5, -1.5), (6, 1, 4), ("gill", "e0508a", "f080a8"))
    finish()

CREATURES = [("A_shellback", shellback, (0, 16, 0), 14), ("B_squidguard", squidguard, (0, 10, 0), 9), ("C_axodolphin", axodolphin, (0, 15, 2), 13)]

def sheet(img, title, center, scale):
    views = [g.render(img, 35, 24, size=380, scale=scale, center=center), g.render(img, 110, 8, size=280, scale=scale * .75, center=center),
             g.render(img, 0, 10, size=280, scale=scale * .75, center=center)]
    im = Image.new("RGB", (700, 700), (150, 190, 235))
    im.paste(views[0], (0, 30)); im.paste(views[1], (380, 30)); im.paste(views[2], (380, 330))
    ImageDraw.Draw(im).text((10, 8), title, fill=(10, 10, 10))
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
