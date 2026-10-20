#!/usr/bin/env python3
"""Иконка ледяного осколка (текстура крипера — tools/frost_creeper_tex.py).
Запуск из minecraft-mod:  python3 tools/frost_assets.py"""
from PIL import Image, ImageDraw

OUT = "src/main/resources/assets/amberhall/textures"
def hx(s): return tuple(int(s[i:i+2], 16) for i in (0, 2, 4))
RAMP = [hx(c) for c in ("12304f", "245c8a", "3f8fc2", "74c0e8", "b0e2f6", "e8f9ff")]

# иконка осколка 16x16: тонкая длинная игла по диагонали, сужается к острию (вверх-вправо)
import math
S = 16
im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
x0, y0, x1, y1 = 1.0, 14.0, 15.0, 0.0
L = math.hypot(x1 - x0, y1 - y0); ux, uy = (x1 - x0) / L, (y1 - y0) / L; nx, ny = -uy, ux   # нормаль: влево-вверх
for y in range(S):
    for x in range(S):
        dx, dy = x + 0.5 - x0, y + 0.5 - y0
        t = (dx * ux + dy * uy) / L; off = dx * nx + dy * ny
        if t < -0.03 or t > 1.0: continue
        w = 2.1 * (1 - t) ** 0.8 + 0.35
        if abs(off) > w: continue
        edge = abs(off) > w - 0.9
        if edge: c = RAMP[0] if off < 0 else RAMP[1]
        elif off > w * 0.25: c = RAMP[4] if t < .85 else RAMP[5]                      # светлая грань
        else: c = RAMP[2] if off > -w * 0.4 else RAMP[1]
        if t > 0.93: c = RAMP[5]                                                       # блестящее остриё
        im.putpixel((x, y), c + (255,))
im.save(f"{OUT}/item/ice_shard.png")
print("ok")
