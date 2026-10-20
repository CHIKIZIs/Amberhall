#!/usr/bin/env python3
"""Превью модели Наблюдателя (4 ракурса).  python3 tools/watcher_preview.py out.png"""
import os, sys
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import beetle_gen as g
g.TEX_W, g.TEX_H = 64, 64
P = g.P; P.clear()
def part(name, parent, pivot, rot, origin, size):
    P.append(dict(name=name, parent=parent, pivot=pivot, rot=rot, origin=origin, size=size, kind=name))
part("body", "root", (0, 10, 0), (0, 0, 0), (-3, -14, -1.5), (6, 14, 3))
part("head", "body", (0, -14, 0), (0.12, 0, 0.28), (-3, -8, -3), (6, 8, 6))
part("arm_l", "body", (4, -13, 0), (0, 0, -0.03), (-1, 0, -1), (2, 22, 2))
part("arm_r", "body", (-4, -13, 0), (0, 0, 0.03), (-1, 0, -1), (2, 22, 2))
part("leg_l", "root", (1.5, 10, 0), (0, 0, 0), (-1.5, 0, -1.5), (3, 14, 3))
part("leg_r", "root", (-1.5, 10, 0), (0, 0, 0), (-1.5, 0, -1.5), (3, 14, 3))
g.BY.clear(); g.BY.update({p["name"]: p for p in P})
UVS = {"body": (24, 0), "head": (0, 0), "arm_l": (0, 16), "arm_r": (8, 16), "leg_l": (16, 20), "leg_r": (28, 20)}
g.UV = UVS
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tex = np.array(Image.open(f"{root}/src/main/resources/assets/dread/textures/entity/watcher.png").convert("RGBA"))
eyes = np.array(Image.open(f"{root}/src/main/resources/assets/dread/textures/entity/watcher_eyes.png").convert("RGBA"))
m = eyes[..., 3] > 0; lit = tex.copy(); lit[m] = eyes[m]
views = [g.render(lit, a, 8, 380, 9, center=(0, 6, 0)) for a in (0, 35, 90, 180)]
sheet = Image.new("RGB", (380 * 4, 380))
for i, v in enumerate(views): sheet.paste(v, (i * 380, 0))
sheet.save(sys.argv[1] if len(sys.argv) > 1 else "watcher_preview.png")
