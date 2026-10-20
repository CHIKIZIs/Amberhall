#!/usr/bin/env python3
"""Иконка ледяного осколка (текстура крипера — tools/frost_creeper_tex.py).
Запуск из minecraft-mod:  python3 tools/frost_assets.py"""
from PIL import Image, ImageDraw

OUT = "src/main/resources/assets/amberhall/textures"
def hx(s): return tuple(int(s[i:i+2], 16) for i in (0, 2, 4))
RAMP = [hx(c) for c in ("12304f", "245c8a", "3f8fc2", "74c0e8", "b0e2f6", "e8f9ff")]

# иконка осколка: ванильный аметистовый осколок (острый кристалл по диагонали), перекрашенный в светлый лёд
import glob, io, zipfile
jar = zipfile.ZipFile(glob.glob("/root/.gradle/caches/fabric-loom/minecraftMaven/net/minecraft/minecraft-merged/*/*.jar")[0])
src = Image.open(io.BytesIO(jar.read("assets/minecraft/textures/item/amethyst_shard.png"))).convert("RGBA")
ICE = [hx(c) for c in ("3f7db0", "6cb0dc", "9ad4f0", "c6ecfa", "e8f8ff", "ffffff")]
def lerp(a, b, t): return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))
px = src.load()
ls = [0.299*px[x, y][0] + 0.587*px[x, y][1] + 0.114*px[x, y][2] for y in range(16) for x in range(16) if px[x, y][3]]
lo, hi = min(ls), max(ls)
for y in range(16):
    for x in range(16):
        r, g, b, a = px[x, y]
        if not a: continue
        t = ((0.299*r + 0.587*g + 0.114*b) - lo) / (hi - lo) * (len(ICE) - 1)
        i = min(len(ICE) - 2, int(t))
        px[x, y] = lerp(ICE[i], ICE[i + 1], t - i) + (a,)
src.save(f"{OUT}/item/ice_shard.png")
print("ok")
