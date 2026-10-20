#!/usr/bin/env python3
"""Текстура ледяного крипера (перекраска ванильного крипера по яркости в ледяную гамму) и иконка осколка.
Запуск из minecraft-mod:  python3 tools/frost_assets.py"""
import glob, io, random, zipfile
from PIL import Image, ImageDraw

OUT = "src/main/resources/assets/amberhall/textures"
jar = glob.glob("/root/.gradle/caches/fabric-loom/minecraftMaven/net/minecraft/minecraft-merged/*/*.jar")[0]
src = Image.open(io.BytesIO(zipfile.ZipFile(jar).read("assets/minecraft/textures/entity/creeper/creeper.png"))).convert("RGBA")

def hx(s): return tuple(int(s[i:i+2], 16) for i in (0, 2, 4))
RAMP = [hx(c) for c in ("12304f", "245c8a", "3f8fc2", "74c0e8", "b0e2f6", "e8f9ff")]
def lerp(a, b, t): return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))

px = src.load()
lums = [0.299*px[x, y][0] + 0.587*px[x, y][1] + 0.114*px[x, y][2] for y in range(src.height) for x in range(src.width) if px[x, y][3]]
lo, hi = min(lums), max(lums)
rnd = random.Random(11)
for y in range(src.height):
    for x in range(src.width):
        r, g, b, a = px[x, y]
        if not a: continue
        t = ((0.299*r + 0.587*g + 0.114*b) - lo) / (hi - lo)
        t = t ** 0.85 * (len(RAMP) - 1)
        i = min(len(RAMP) - 2, int(t))
        c = lerp(RAMP[i], RAMP[i + 1], t - i)
        if t > 2.2 and rnd.random() < 0.05: c = RAMP[5]          # редкие блики инея
        px[x, y] = c + (a,)
src.save(f"{OUT}/entity/frost_creeper.png")

# иконка осколка 16x16
S = 16
im = Image.new("RGBA", (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
d.polygon([(2, 14), (5, 7), (11, 1), (13, 2), (14, 9), (8, 14)], fill=RAMP[1])           # контур-тень
d.polygon([(3, 13), (6, 7), (11, 2), (12, 3), (13, 8), (8, 13)], fill=RAMP[3])           # тело
d.polygon([(6, 7), (11, 2), (12, 3), (9, 8)], fill=RAMP[4])                              # светлая грань
d.polygon([(9, 8), (12, 3), (13, 8), (8, 13)], fill=RAMP[2])                             # тёмная грань
im.putpixel((10, 3), RAMP[5]); im.putpixel((9, 4), RAMP[5])
im.save(f"{OUT}/item/ice_shard.png")
print("ok")
