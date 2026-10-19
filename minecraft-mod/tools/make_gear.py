#!/usr/bin/env python3
"""Янтарные инструменты, броня и яблоко: перекраска ванильных железных предметов (текстуры предметов и слои брони),
копирование ванильных рецептов (железный слиток → янтарь). Форма и пиксели остаются ванильными, меняется только палитра.

Запуск из папки minecraft-mod:  python3 tools/make_gear.py
"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import make_set as ms
from make_set import M, ASSETS, DATA, read, write, recolor, hx, JAR

# янтарная палитра: от тёмного к светлому
AMBER = [hx(c) for c in ("4a2204", "7a3d06", "b0600a", "dc8a18", "f3b43a", "ffe08a", "fff6c8")]

TOOLS = ["sword", "pickaxe", "axe", "shovel", "hoe"]
ARMOR = ["helmet", "chestplate", "leggings", "boots"]

def main():
    # --- предметы-инструменты и броня
    for t in TOOLS + ARMOR:
        recolor(read(f"assets/minecraft/textures/item/iron_{t}.png"), AMBER, f"item/amber_{t}")
        parent = "minecraft:item/handheld" if t in TOOLS else "minecraft:item/generated"
        write(f"{ASSETS}/models/item/amber_{t}.json", json.dumps({"parent": parent, "textures": {"layer0": f"{M}:item/amber_{t}"}}, indent=2) + "\n")
        # рецепт: как у железного, но из янтаря
        try:
            rc = read(f"data/minecraft/recipe/iron_{t}.json").decode()
            rc = rc.replace("minecraft:iron_ingot", f"{M}:amber_gem").replace(f"minecraft:iron_{t}", f"{M}:amber_{t}")
            write(f"{DATA}/{M}/recipe/amber_{t}.json", rc)
        except KeyError:
            print("нет рецепта", t)
    # --- слои брони (то, что рисуется на игроке)
    for n in (1, 2):
        recolor(read(f"assets/minecraft/textures/models/armor/iron_layer_{n}.png"), AMBER, f"models/armor/amber_layer_{n}")
    # --- янтарное яблоко: перекрашенное золотое
    recolor(read("assets/minecraft/textures/item/golden_apple.png"), [hx(c) for c in ("5a2c04", "9a5208", "d4820e", "f6b03a", "ffe08a", "fff6c8")], "item/amber_apple")
    write(f"{ASSETS}/models/item/amber_apple.json", json.dumps({"parent": "minecraft:item/generated", "textures": {"layer0": f"{M}:item/amber_apple"}}, indent=2) + "\n")
    rc = read("data/minecraft/recipe/golden_apple.json").decode().replace("minecraft:gold_ingot", f"{M}:amber_gem").replace("minecraft:golden_apple", f"{M}:amber_apple")
    write(f"{DATA}/{M}/recipe/amber_apple.json", rc)
    # --- теги предметов
    for tag, items in (("swords", ["amber_sword"]), ("pickaxes", ["amber_pickaxe"]), ("axes", ["amber_axe"]), ("shovels", ["amber_shovel"]), ("hoes", ["amber_hoe"]),
                       ("head_armor", ["amber_helmet"]), ("chest_armor", ["amber_chestplate"]), ("leg_armor", ["amber_leggings"]), ("foot_armor", ["amber_boots"])):
        ms.add_tag(f"tags/item/{tag}.json", [f"{M}:{i}" for i in items])
    ms.add_tag("tags/item/trimmable_armor.json", [f"{M}:amber_{a}" for a in ARMOR])
    # --- названия
    ru = {"amber_axe": "Янтарный топор", "amber_shovel": "Янтарная лопата", "amber_hoe": "Янтарная мотыга", "amber_helmet": "Янтарный шлем",
          "amber_chestplate": "Янтарный нагрудник", "amber_leggings": "Янтарные поножи", "amber_boots": "Янтарные ботинки", "amber_apple": "Янтарное яблоко"}
    en = {"amber_axe": "Amber Axe", "amber_shovel": "Amber Shovel", "amber_hoe": "Amber Hoe", "amber_helmet": "Amber Helmet",
          "amber_chestplate": "Amber Chestplate", "amber_leggings": "Amber Leggings", "amber_boots": "Amber Boots", "amber_apple": "Amber Apple"}
    for lang, names in (("ru_ru", ru), ("en_us", en)):
        pth = f"{ASSETS}/lang/{lang}.json"; d = json.load(open(pth, encoding="utf-8"))
        for k, v in names.items(): d[f"item.{M}.{k}"] = v
        write(pth, json.dumps(d, ensure_ascii=False, indent=2) + "\n")
    print("снаряжение готово")

if __name__ == "__main__":
    main()
