#!/usr/bin/env python3
"""Ресурспак «Bat Colors»: расцветки летучей мыши (случайные по биому) для 1.21.1.
Работает через случайные текстуры мобов (Entity Texture Features / OptiFine); без них виден только запасной цвет.
Запуск из resourcepack/:  python3 make_bat_pack.py"""
import glob, io, os, shutil, zipfile
from PIL import Image, ImageDraw

jar = zipfile.ZipFile(glob.glob("/root/.gradle/caches/fabric-loom/minecraftMaven/net/minecraft/minecraft-merged/*/*.jar")[0])
van = Image.open(io.BytesIO(jar.read("assets/minecraft/textures/entity/bat.png"))).convert("RGBA")
def hx(s): return tuple(int(s[i:i+2], 16) for i in (0, 2, 4))

# (название, шкура тела тёмный→светлый, акцент (уши/лапы), глаза, вес)
V = [
 ("classic", None, None, None, 36),
 ("shadow",  "0c0a12 14101c 1c1626 2a2038 3c3050", "5a2a6a 7a3a8a a050b0", "ff3040", 14),
 ("albino",  "a8a4b4 c4c0cc d8d4de ece8f0 fffafc", "d89aa8 e8aab8 f6c4cc", "e02030", 6),
 ("crimson", "3a0a10 560e18 781824 9a2430 bc3a44", "d86a70 f08a90 ffb0b4", "ffd040", 10),
 ("ocean",   "0e2238 163450 204a6c 2c6288 3c7ea6", "60c0d0 88dce8 b8f0f4", "ffffff", 8),
 ("forest",  "14281a 1e3a24 2c5232 3c6e42 52905a", "a0c860 c4e080 e4f4a8", "fff4a0", 8),
 ("amber",   "4a2c0a 6a4010 8c5a18 b0781f d49a2c", "f0c860 ffe088 fff0b0", "ffffff", 6),
 ("violet",  "28143c 3a1e58 50307a 6c4698 8c64b8", "e080c0 f4a0d8 ffc8ec", "ffe0ff", 6),
 ("cherry",  "6a3a4a 8a5064 a86a80 c88aa0 e4aabe", "ffd0dc ffe4ec fff4f8", "3a1a2a", 4),
 ("frost",   "5a7890 7a98b0 9ab6cc bcd4e4 e0f0fa", "c8f0ff e0f8ff ffffff", "20a0e0", 6),
]
BROWN = {"1b1715": 0, "1e1b19": 0, "26211f": 1, "27221f": 1, "312822": 2, "43372f": 3, "5f5046": 4}
PURP = {"5a3f58": 0, "664964": 1, "825f7f": 2}

def recolor(body, accent, eye):
    out = van.copy(); px = out.load(); b = [hx(c) for c in body.split()]; a = [hx(c) for c in accent.split()]
    for y in range(out.height):
        for x in range(out.width):
            r, g, bl, al = px[x, y]
            if not al: continue
            key = "%02x%02x%02x" % (r, g, bl)
            if key in BROWN: px[x, y] = b[BROWN[key]] + (al,)
            elif key in PURP: px[x, y] = a[PURP[key]] + (al,)
            elif key == "ffffff": px[x, y] = hx(eye) + (al,)
    return out

imgs = [van] + [recolor(b, a, e) for (_, b, a, e, _) in V[1:]]
root = "BatColors"
shutil.rmtree(root, ignore_errors=True)
rnd = f"{root}/assets/minecraft/optifine/random/entity"
os.makedirs(rnd); os.makedirs(f"{root}/assets/minecraft/textures/entity")
for i, im in enumerate(imgs, 1):
    im.save(f"{rnd}/bat.png" if i == 1 else f"{rnd}/bat{i}.png")
imgs[3].save(f"{root}/assets/minecraft/textures/entity/bat.png")                # запасной цвет без ETF/OptiFine: багровая

n = {name: i + 1 for i, (name, *_) in enumerate(V)}
W = {name: w for (name, _, _, _, w) in V}
def rule(i, names, biomes, weights=None):
    s = f"skins.{i}=" + " ".join(str(n[x]) for x in names) + "\n"
    s += f"weights.{i}=" + " ".join(str((weights or [W[x] for x in names])[k]) for k in range(len(names))) + "\n"
    if biomes: s += f"biomes.{i}=" + " ".join(biomes) + "\n"
    return s
props = "# Расцветки летучих мышей по биомам; последнее правило — любые остальные места\n"
props += rule(1, ["frost", "albino", "classic"], ["snowy_plains", "snowy_taiga", "ice_spikes", "grove", "snowy_slopes", "frozen_peaks", "jagged_peaks", "frozen_river", "snowy_beach", "frozen_ocean", "deep_frozen_ocean"], [8, 5, 3])
props += rule(2, ["amber", "crimson", "classic"], ["desert", "badlands", "eroded_badlands", "wooded_badlands", "savanna", "savanna_plateau", "windswept_savanna"], [8, 4, 3])
props += rule(3, ["forest", "classic"], ["swamp", "mangrove_swamp", "jungle", "sparse_jungle", "bamboo_jungle"], [8, 3])
props += rule(4, ["cherry", "violet", "classic"], ["cherry_grove", "flower_forest", "meadow"], [8, 4, 3])
props += rule(5, ["ocean", "classic"], ["ocean", "deep_ocean", "cold_ocean", "lukewarm_ocean", "warm_ocean", "beach", "river"], [8, 3])
props += rule(6, ["shadow", "violet", "classic"], ["deep_dark", "dripstone_caves", "lush_caves"], [8, 3, 3])
props += rule(7, [name for (name, *_) in V], None)
open(f"{rnd}/bat.properties", "w", encoding="utf-8").write(props)
open(f"{root}/pack.mcmeta", "w", encoding="utf-8").write('{\n  "pack": {\n    "pack_format": 34,\n    "description": "§6Bat Colors§r — разные расцветки летучих мышей\\n§7Нужен мод Entity Texture Features (или OptiFine)"\n  }\n}\n')
open(f"{root}/README.txt", "w", encoding="utf-8").write(
"Bat Colors — ресурспак для Minecraft 1.21.1\n\n"
"Добавляет 10 расцветок летучей мыши: классическая, теневая, альбинос, багровая, океанская, лесная, янтарная, фиолетовая, вишнёвая, ледяная.\n"
"Цвет зависит от биома (в снегах — ледяные и белые, в пустыне — янтарные и т.д.) и случаен внутри биома.\n\n"
"Для случайных расцветок нужен мод Entity Texture Features (ETF) для Fabric 1.21.1 или OptiFine.\n"
"Без них Minecraft не умеет выбирать текстуру моба случайно: тогда все мыши будут одного цвета (багровые).\n")
# иконка пака 64x64: четыре мыши (кусок текстуры «мордочка+крылья» 8x8 каждой)
icon = Image.new("RGBA", (64, 64), (30, 34, 48, 255))
for k, im in enumerate(imgs[1:5]):
    crop = im.crop((0, 0, 16, 16)).resize((32, 32), Image.NEAREST)
    icon.alpha_composite(crop, ((k % 2) * 32, (k // 2) * 32))
icon.save(f"{root}/pack.png")
# превью: все 10 текстур
sheet = Image.new("RGBA", (5 * 32 * 5 + 24, 2 * 32 * 5 + 10), (50, 54, 70, 255)); d = ImageDraw.Draw(sheet)
for k, im in enumerate(imgs):
    bg = Image.new("RGBA", (32, 32), (50, 54, 70, 255)); bg.alpha_composite(im)
    sheet.alpha_composite(bg.resize((160, 160), Image.NEAREST), ((k % 5) * 165, (k // 5) * 165))
sheet.convert("RGB").save("/tmp/claude-0/-home-user-Amberhall/50491b7b-da0b-5e5d-9b0d-e6723e52204c/scratchpad/bat_pack_prev.png")
with zipfile.ZipFile("BatColors-1.21.1.zip", "w", zipfile.ZIP_DEFLATED) as z:
    for dp, _, fs in os.walk(root):
        for f in fs:
            full = os.path.join(dp, f); z.write(full, os.path.relpath(full, root))
print("ok", len(imgs))
