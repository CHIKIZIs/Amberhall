#!/usr/bin/env python3
"""Превью Ползуна и Улыбающегося.  python3 tools/monsters_preview.py out.png"""
import os, sys
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import beetle_gen as g
g.TEX_W, g.TEX_H = 64, 64
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def lit(n):
    t = np.array(Image.open(f"{root}/src/main/resources/assets/dread/textures/entity/{n}.png").convert("RGBA")); e = np.array(Image.open(f"{root}/src/main/resources/assets/dread/textures/entity/{n}_eyes.png").convert("RGBA"))
    m = e[..., 3] > 0; t[m] = e[m]; return t
def setup(parts, uv):
    g.P.clear()
    for (name, parent, pivot, rot, origin, size) in parts: g.P.append(dict(name=name, parent=parent, pivot=pivot, rot=rot, origin=origin, size=size, kind=name))
    g.BY.clear(); g.BY.update({p["name"]: p for p in g.P}); g.UV = uv
views = []
cr = [("body", "root", (0, 13, 0), (0, 0, 0), (-3, -2, -6), (6, 4, 12)), ("head", "body", (0, -1, -8.5), (0, 0, 3.14159), (-3, -3, -3), (6, 6, 6))]
uv = {"body": (0, 0), "head": (0, 16)}
for i, (nm, x, z) in enumerate((("fl", 3, -4), ("fr", -3, -4), ("bl", 3, 4), ("br", -3, 4))):
    sd = 1 if x > 0 else -1
    cr.append((f"u{nm}", "body", (x, 0, z), (0, 0, -1.2 * sd), (-1, 0, -1), (2, 8, 2))); cr.append((f"l{nm}", f"u{nm}", (0, 8, 0), (0, 0, 1.2 * sd), (-1, 0, -1), (2, 8, 2)))
    uv[f"u{nm}"] = (24, 16); uv[f"l{nm}"] = (32, 16)
setup(cr, uv); t = lit("crawler")
views += [g.render(t, a, 14, 380, 12, center=(0, 14, 0)) for a in (30, 90, 200)]
setup([("head", "root", (0, 14, 0), (0, 0, 0), (-5, -5, -5), (10, 10, 10))], {"head": (0, 0)}); t = lit("smile")
views += [g.render(t, a, 8, 380, 12, center=(0, 14, 0)) for a in (0, 35)]
sheet = Image.new("RGB", (380 * 5, 380))
for i, v in enumerate(views): sheet.paste(v, (i * 380, 0))
sheet.save(sys.argv[1])
