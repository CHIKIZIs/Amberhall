#!/usr/bin/env python3
"""Набор блоков «как у ванили»: берём настоящие ванильные blockstate, модели, рецепты и таблицы добычи
(для дуба или каменных кирпичей), подменяя названия, и перекрашиваем ванильные PNG с сохранением их структуры.
Всё выглядит как настоящее, а не нарисованное мной.

Использование (из папки minecraft-mod):
    python3 tools/make_set.py wood      # деревянный набор «glow» по образцу дуба
    python3 tools/make_set.py brick     # янтарные кирпичи по образцу каменных кирпичей
Нужен клиентский jar Minecraft 1.21.1 (берётся из кэша Gradle после первой сборки).
"""
import glob, io, json, os, re, sys, zipfile
from PIL import Image

M = "amberhall"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "src/main/resources/assets", M)
DATA = os.path.join(ROOT, "src/main/resources/data")

def find_jar():
    for pat in ("/root/.gradle/caches/fabric-loom/minecraftMaven/net/minecraft/minecraft-merged/*/*.jar",
                os.path.expanduser("~/.gradle/caches/fabric-loom/minecraftMaven/net/minecraft/minecraft-merged/*/*.jar")):
        for j in glob.glob(pat):
            if "sources" not in j: return j
    sys.exit("не найден jar Minecraft (сначала соберите проект)")
JAR = zipfile.ZipFile(find_jar())
NAMES = JAR.namelist()

def hx(s): s = s.lstrip('#'); return tuple(int(s[i:i+2], 16) for i in (0, 2, 4))
def read(path): return JAR.read(path)
def write(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if isinstance(data, str): data = data.encode("utf-8")
    open(path, "wb").write(data)

def recolor(png_bytes, ramp, out_rel):
    """перекраска по яркости: тёмное → тёмные тона палитры, светлое → светлые; структура (швы, волокна) сохраняется"""
    im = Image.open(io.BytesIO(png_bytes)).convert("RGBA")
    px = im.load()
    lums = [0.299 * px[x, y][0] + 0.587 * px[x, y][1] + 0.114 * px[x, y][2]
            for y in range(im.height) for x in range(im.width) if px[x, y][3] > 0]
    lo, hi = min(lums), max(lums)
    n = len(ramp)
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a == 0: continue
            t = ((0.299 * r + 0.587 * g + 0.114 * b) - lo) / max(1e-6, hi - lo)
            f = t * (n - 1); i = min(n - 2, int(f)); k = f - i
            px[x, y] = tuple(int(ramp[i][j] + (ramp[i + 1][j] - ramp[i][j]) * k) for j in range(3)) + (a,)
    out = os.path.join(ASSETS, "textures", out_rel + ".png")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im.save(out)

def convert_family(vp, op, parts, tag_logs=None):
    """vp — ванильный префикс (oak / stone_brick…), op — наш; parts — суффиксы вариантов"""
    conv = lambda s: re.sub(rf'minecraft:(block|item)/{vp}', rf'{M}:\1/{op}', re.sub(rf'minecraft:{vp}', f'{M}:{op}', s))
    made = []
    for part in parts:
        v = f"{vp}_{part}"; o = f"{op}_{part}"
        try:
            write(f"{ASSETS}/blockstates/{o}.json", conv(read(f"assets/minecraft/blockstates/{v}.json").decode()))
        except KeyError:
            print("нет blockstate", v); continue
        for name in NAMES:
            if name.startswith(f"assets/minecraft/models/block/{v}") and name.endswith(".json"):
                base = os.path.basename(name)
                write(f"{ASSETS}/models/block/{base.replace(vp, op, 1)}", conv(read(name).decode()))
        try:
            write(f"{ASSETS}/models/item/{o}.json", conv(read(f"assets/minecraft/models/item/{v}.json").decode()))
        except KeyError:
            pass
        try:
            write(f"{DATA}/{M}/loot_table/blocks/{o}.json", conv(read(f"data/minecraft/loot_table/blocks/{v}.json").decode()))
        except KeyError:
            pass
        try:
            rc = conv(read(f"data/minecraft/recipe/{v}.json").decode())
            if tag_logs: rc = rc.replace(f"#{M}:{op}_logs", f"#{M}:{tag_logs}")
            write(f"{DATA}/{M}/recipe/{o}.json", rc)
        except KeyError:
            pass
        made.append(o)
    return made

def add_tag(path, values):
    f = os.path.join(DATA, "minecraft", path)
    d = json.load(open(f, encoding="utf-8")) if os.path.exists(f) else {"replace": False, "values": []}
    d["values"] = sorted(set(d["values"]) | set(values))
    write(f, json.dumps(d, ensure_ascii=False, indent=2) + "\n")

# ================================================================== деревянный набор
def wood():
    ramp = [hx(c) for c in ("1c1432", "2a1f48", "3a2c5e", "4c3c74", "62528c")]         # фиолетово-индиговое дерево
    ramp_stripped = [hx(c) for c in ("2a2250", "3a3066", "4c4080", "665a9c", "8478b6")]
    parts = ["planks", "stairs", "slab", "fence", "fence_gate", "door", "trapdoor", "button", "pressure_plate"]
    made = convert_family("oak", "glow", parts, tag_logs="glow_logs")
    # дубовые доски: рецепт из брёвен — по нашему тегу
    write(f"{DATA}/{M}/recipe/glow_planks.json", json.dumps({
        "type": "minecraft:crafting_shapeless", "category": "building", "group": "planks",
        "ingredients": [{"tag": f"{M}:glow_logs"}], "result": {"id": f"{M}:glow_planks", "count": 4}}, indent=2) + "\n")
    # обтёсанное бревно
    for part in ("stripped_oak_log",):
        for name in NAMES:
            if name.startswith(f"assets/minecraft/models/block/{part}") and name.endswith(".json"):
                s = read(name).decode().replace("stripped_oak_log", "stripped_glow_log").replace("minecraft:block/", f"{M}:block/")
                write(f"{ASSETS}/models/block/{os.path.basename(name).replace('oak', 'glow')}", s)
        write(f"{ASSETS}/blockstates/stripped_glow_log.json", read("assets/minecraft/blockstates/stripped_oak_log.json").decode()
              .replace("minecraft:block/stripped_oak_log", f"{M}:block/stripped_glow_log"))
        write(f"{ASSETS}/models/item/stripped_glow_log.json", json.dumps({"parent": f"{M}:block/stripped_glow_log"}, indent=2) + "\n")
        write(f"{DATA}/{M}/loot_table/blocks/stripped_glow_log.json", json.dumps({
            "type": "minecraft:block", "pools": [{"rolls": 1, "bonus_rolls": 0, "conditions": [{"condition": "minecraft:survives_explosion"}],
            "entries": [{"type": "minecraft:item", "name": f"{M}:stripped_glow_log"}]}], "random_sequence": f"{M}:blocks/stripped_glow_log"}, indent=2) + "\n")
    # текстуры: ванильные структуры, наша палитра
    for vtex, otex, rmp in (("block/oak_planks", "block/glow_planks", ramp), ("block/oak_door_top", "block/glow_door_top", ramp),
                            ("block/oak_door_bottom", "block/glow_door_bottom", ramp), ("block/oak_trapdoor", "block/glow_trapdoor", ramp),
                            ("block/stripped_oak_log", "block/stripped_glow_log", ramp_stripped), ("block/stripped_oak_log_top", "block/stripped_glow_log_top", ramp_stripped),
                            ("item/oak_door", "item/glow_door", ramp)):
        recolor(read(f"assets/minecraft/textures/{vtex}.png"), rmp, otex)
    # дверь: предмет-иконка обычным generated
    write(f"{ASSETS}/models/item/glow_door.json", json.dumps({"parent": "minecraft:item/generated", "textures": {"layer0": f"{M}:item/glow_door"}}, indent=2) + "\n")
    # теги
    add_tag("tags/block/planks.json", [f"{M}:glow_planks"]); add_tag("tags/item/planks.json", [f"{M}:glow_planks"])
    for tg, blk in (("wooden_stairs", "glow_stairs"), ("wooden_slabs", "glow_slab"), ("wooden_fences", "glow_fence"), ("fence_gates", "glow_fence_gate"),
                    ("wooden_doors", "glow_door"), ("wooden_trapdoors", "glow_trapdoor"), ("wooden_buttons", "glow_button"),
                    ("wooden_pressure_plates", "glow_pressure_plate")):
        add_tag(f"tags/block/{tg}.json", [f"{M}:{blk}"]); add_tag(f"tags/item/{tg}.json", [f"{M}:{blk}"])
    add_tag("tags/block/mineable/axe.json", [f"{M}:{b}" for b in ("glow_planks", "glow_stairs", "glow_slab", "glow_fence", "glow_fence_gate", "glow_door", "glow_trapdoor",
                                                                  "glow_button", "glow_pressure_plate", "stripped_glow_log")])
    add_tag("tags/block/logs.json", [f"{M}:stripped_glow_log"]); add_tag("tags/block/logs_that_burn.json", [f"{M}:stripped_glow_log"])
    add_tag("tags/item/logs.json", [f"{M}:stripped_glow_log"]); add_tag("tags/item/logs_that_burn.json", [f"{M}:stripped_glow_log"])
    write(f"{DATA}/{M}/tags/item/glow_logs.json", json.dumps({"values": [f"{M}:glow_log", f"{M}:stripped_glow_log"]}, indent=2) + "\n")
    # названия
    ru = {"glow_planks": "Светящиеся доски", "glow_stairs": "Светящиеся ступени", "glow_slab": "Светящаяся плита", "glow_fence": "Светящийся забор",
          "glow_fence_gate": "Светящаяся калитка", "glow_door": "Светящаяся дверь", "glow_trapdoor": "Светящийся люк", "glow_button": "Светящаяся кнопка",
          "glow_pressure_plate": "Светящаяся нажимная плита", "stripped_glow_log": "Обтёсанное светящееся бревно"}
    en = {"glow_planks": "Glow Planks", "glow_stairs": "Glow Stairs", "glow_slab": "Glow Slab", "glow_fence": "Glow Fence", "glow_fence_gate": "Glow Fence Gate",
          "glow_door": "Glow Door", "glow_trapdoor": "Glow Trapdoor", "glow_button": "Glow Button", "glow_pressure_plate": "Glow Pressure Plate",
          "stripped_glow_log": "Stripped Glow Log"}
    for lang, names in (("ru_ru", ru), ("en_us", en)):
        pth = f"{ASSETS}/lang/{lang}.json"; d = json.load(open(pth, encoding="utf-8"))
        for k, v in names.items():
            d[("item" if k == "glow_door" else "block") + f".{M}.{k}"] = v
        write(pth, json.dumps(d, ensure_ascii=False, indent=2) + "\n")
    print("дерево готово:", made)

# ================================================================== янтарные кирпичи
def brick():
    ramp = [hx(c) for c in ("5a2c04", "8a4506", "b8620c", "dc8a18", "f3b43a", "ffd870")]
    parts = ["stairs", "slab", "wall"]
    made = convert_family("stone_brick", "amber_brick", parts)
    made_main = convert_family("stone_bricks", "amber_bricks", [""]) if False else []
    # сами кирпичи: blockstate/модель простые
    write(f"{ASSETS}/blockstates/amber_bricks.json", json.dumps({"variants": {"": {"model": f"{M}:block/amber_bricks"}}}, indent=2) + "\n")
    write(f"{ASSETS}/models/block/amber_bricks.json", json.dumps({"parent": "minecraft:block/cube_all", "textures": {"all": f"{M}:block/amber_bricks"}}, indent=2) + "\n")
    write(f"{ASSETS}/models/item/amber_bricks.json", json.dumps({"parent": f"{M}:block/amber_bricks"}, indent=2) + "\n")
    write(f"{DATA}/{M}/loot_table/blocks/amber_bricks.json", json.dumps({
        "type": "minecraft:block", "pools": [{"rolls": 1, "bonus_rolls": 0, "conditions": [{"condition": "minecraft:survives_explosion"}],
        "entries": [{"type": "minecraft:item", "name": f"{M}:amber_bricks"}]}], "random_sequence": f"{M}:blocks/amber_bricks"}, indent=2) + "\n")
    # рецепты: кирпичи из янтарных блоков, ступени/плиты/стена из кирпичей (как у камня, но по образцу ванильных)
    write(f"{DATA}/{M}/recipe/amber_bricks.json", json.dumps({
        "type": "minecraft:crafting_shaped", "category": "building", "pattern": ["BB", "BB"],
        "key": {"B": {"item": f"{M}:amber_block"}}, "result": {"id": f"{M}:amber_bricks", "count": 4}}, indent=2) + "\n")
    # исправляем ингредиенты рецептов: у ванили «stone_bricks», у нас «amber_bricks»
    for part in parts:
        pth = f"{DATA}/{M}/recipe/amber_brick_{part}.json"
        if os.path.exists(pth):
            s = open(pth, encoding="utf-8").read().replace(f"{M}:amber_brick_{part}", f"{M}:amber_brick_{part}")
            s = re.sub(r'minecraft:stone_bricks', f'{M}:amber_bricks', s)
            write(pth, s)
    recolor(read("assets/minecraft/textures/block/stone_bricks.png"), ramp, "block/amber_bricks")
    add_tag("tags/block/mineable/pickaxe.json", [f"{M}:amber_bricks", f"{M}:amber_brick_stairs", f"{M}:amber_brick_slab", f"{M}:amber_brick_wall"])
    add_tag("tags/block/stairs.json", [f"{M}:amber_brick_stairs"]); add_tag("tags/item/stairs.json", [f"{M}:amber_brick_stairs"])
    add_tag("tags/block/slabs.json", [f"{M}:amber_brick_slab"]); add_tag("tags/item/slabs.json", [f"{M}:amber_brick_slab"])
    add_tag("tags/block/walls.json", [f"{M}:amber_brick_wall"]); add_tag("tags/item/walls.json", [f"{M}:amber_brick_wall"])
    ru = {"amber_bricks": "Янтарные кирпичи", "amber_brick_stairs": "Ступени из янтарных кирпичей", "amber_brick_slab": "Плита из янтарных кирпичей", "amber_brick_wall": "Стена из янтарных кирпичей"}
    en = {"amber_bricks": "Amber Bricks", "amber_brick_stairs": "Amber Brick Stairs", "amber_brick_slab": "Amber Brick Slab", "amber_brick_wall": "Amber Brick Wall"}
    for lang, names in (("ru_ru", ru), ("en_us", en)):
        pth = f"{ASSETS}/lang/{lang}.json"; d = json.load(open(pth, encoding="utf-8"))
        for k, v in names.items(): d[f"block.{M}.{k}"] = v
        write(pth, json.dumps(d, ensure_ascii=False, indent=2) + "\n")
    print("кирпичи готовы:", made)

if __name__ == "__main__" and sys.argv[1] in ("wood", "brick"):
    {"wood": wood, "brick": brick}[sys.argv[1]]()


# ================================================================== янтарный фонарь (по ванильному фонарю)
def lantern():
    ramp = [hx(c) for c in ("3a1c04", "6a3606", "a85a0a", "dc8a18", "f3b43a", "ffe08a", "fffadc")]
    conv = lambda s: s.replace("minecraft:block/lantern", f"{M}:block/amber_lantern").replace("minecraft:item/lantern", f"{M}:item/amber_lantern").replace("minecraft:lantern", f"{M}:amber_lantern")
    write(f"{ASSETS}/blockstates/amber_lantern.json", conv(read("assets/minecraft/blockstates/lantern.json").decode()))
    for name in ("lantern", "lantern_hanging"):
        write(f"{ASSETS}/models/block/amber_{name}.json", conv(read(f"assets/minecraft/models/block/{name}.json").decode()).replace(f"{M}:block/{name}", f"{M}:block/amber_{name}"))
    # blockstate ссылается на amber_lantern и amber_lantern_hanging
    bs = open(f"{ASSETS}/blockstates/amber_lantern.json", encoding="utf-8").read().replace(f"{M}:block/amber_lantern_hanging", f"{M}:block/amber_lantern_hanging")
    write(f"{ASSETS}/blockstates/amber_lantern.json", bs)
    write(f"{ASSETS}/models/item/amber_lantern.json", json.dumps({"parent": "minecraft:item/generated", "textures": {"layer0": f"{M}:item/amber_lantern"}}, indent=2) + "\n")
    write(f"{DATA}/{M}/loot_table/blocks/amber_lantern.json", conv(read("data/minecraft/loot_table/blocks/lantern.json").decode()))
    rc = conv(read("data/minecraft/recipe/lantern.json").decode()).replace("minecraft:torch", f"{M}:amber_gem")
    write(f"{DATA}/{M}/recipe/amber_lantern.json", rc)
    recolor(read("assets/minecraft/textures/block/lantern.png"), ramp, "block/amber_lantern")
    recolor(read("assets/minecraft/textures/item/lantern.png"), ramp, "item/amber_lantern")
    add_tag("tags/block/mineable/pickaxe.json", [f"{M}:amber_lantern"])
    for lang, name in (("ru_ru", "Янтарный фонарь"), ("en_us", "Amber Lantern")):
        pth = f"{ASSETS}/lang/{lang}.json"; d = json.load(open(pth, encoding="utf-8")); d[f"block.{M}.amber_lantern"] = name
        write(pth, json.dumps(d, ensure_ascii=False, indent=2) + "\n")
    print("фонарь готов")

if __name__ == "__main__" and len(sys.argv) > 1 and sys.argv[1] == "lantern":
    lantern()
