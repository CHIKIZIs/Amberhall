#!/usr/bin/env python3
"""Светящееся рагу (перекраска ванильного грибного супа), рецепт, достижения."""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_set import M, ASSETS, DATA, read, write, recolor, hx

recolor(read("assets/minecraft/textures/item/mushroom_stew.png"), [hx(c) for c in ("1c2a3a", "2a5a6a", "3a9a8a", "6ad0a0", "b6f2c0", "f0ffe0")], "item/glow_stew")
write(f"{ASSETS}/models/item/glow_stew.json", json.dumps({"parent": "minecraft:item/generated", "textures": {"layer0": f"{M}:item/glow_stew"}}, indent=2) + "\n")
write(f"{DATA}/{M}/recipe/glow_stew.json", json.dumps({
    "type": "minecraft:crafting_shapeless", "category": "misc",
    "ingredients": [{"item": "minecraft:bowl"}, {"item": f"{M}:spore_bulb"}, {"item": f"{M}:glow_fern"}],
    "result": {"count": 1, "id": f"{M}:glow_stew"}}, indent=2) + "\n")

def adv(name, parent, icon, trigger, title_key, desc_key, frame="task"):
    d = {"display": {"icon": {"id": icon}, "title": {"translate": title_key}, "description": {"translate": desc_key},
                     "frame": frame, "show_toast": True, "announce_to_chat": True, "hidden": False},
         "criteria": {"c": trigger}, "requirements": [["c"]]}
    if parent: d["parent"] = parent
    else: d["display"]["background"] = "minecraft:textures/block/stone.png"
    write(f"{DATA}/{M}/advancement/{name}.json", json.dumps(d, indent=2) + "\n")
inv = lambda item: {"trigger": "minecraft:inventory_changed", "conditions": {"items": [{"items": item}]}}
adv("root", None, f"{M}:amber_gem", inv(f"{M}:amber_gem"), "adv.amberhall.root.title", "adv.amberhall.root.desc")
adv("amber_armor", f"{M}:root", f"{M}:amber_chestplate", inv(f"{M}:amber_chestplate"), "adv.amberhall.armor.title", "adv.amberhall.armor.desc")
adv("glow_stew", f"{M}:root", f"{M}:glow_stew", inv(f"{M}:glow_stew"), "adv.amberhall.stew.title", "adv.amberhall.stew.desc")
adv("thicket", f"{M}:root", f"{M}:glow_log", {"trigger": "minecraft:location", "conditions": {"player": [{"condition": "minecraft:location_check", "predicate": {"biomes": f"{M}:glowing_thicket"}}]}},
    "adv.amberhall.thicket.title", "adv.amberhall.thicket.desc", "goal")
T = {"ru_ru": {"root": ("Янтарный век", "Добудьте янтарь"), "armor": ("Золото леса", "Наденьте янтарный нагрудник"),
                "stew": ("Тёплый свет", "Сварите светящееся рагу"), "thicket": ("Светящаяся чаща", "Найдите редкий светящийся лес")},
     "en_us": {"root": ("Age of Amber", "Obtain amber"), "armor": ("Forest Gold", "Craft an amber chestplate"),
               "stew": ("Warm Glow", "Cook glow stew"), "thicket": ("Glowing Thicket", "Find the rare glowing forest")}}
for lang, names in T.items():
    pth = f"{ASSETS}/lang/{lang}.json"; d = json.load(open(pth, encoding="utf-8"))
    for k, (t, ds) in names.items():
        d[f"adv.{M}.{k}.title"] = t; d[f"adv.{M}.{k}.desc"] = ds
    d[f"item.{M}.glow_stew"] = "Светящееся рагу" if lang == "ru_ru" else "Glow Stew"
    write(pth, json.dumps(d, ensure_ascii=False, indent=2) + "\n")
print("ok")
