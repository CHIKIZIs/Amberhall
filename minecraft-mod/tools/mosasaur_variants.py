#!/usr/bin/env python3
"""Три варианта морского хищника для выбора. Только превью, ничего не пишет в проект.

Запуск из папки minecraft-mod:  python3 tools/mosasaur_variants.py out_prefix
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
import mosasaur_gen as m
import beetle_gen as g
from PIL import Image, ImageDraw

P = g.P
def part(*a): m.part(*a)

def teeth(head, hx0, hx1, hz0, hz1, hy, jaw, jx0, jx1, jz0, jz1, jy, nf=5, ns=4):
    """тонкие шипы по кромкам: спереди и по бокам; у верхней челюсти висят вниз, у нижней торчат вверх"""
    for i in range(nf):
        x = hx0 + (hx1 - hx0) * (i + 0.5) / nf - 0.35
        part(f"tooth_uf{i}", head, (0, 0, 0), (0, 0, 0), (x, hy, hz0 - 0.3), (0.7, 2 + i % 2, 0.7), "tooth")
    for i in range(ns):
        z = hz0 + (hz1 - hz0) * (i + 0.5) / ns
        part(f"tooth_ul{i}", head, (0, 0, 0), (0, 0, 0), (hx0 + 0.1, hy, z), (0.7, 2 + i % 2, 0.7), "tooth")
        part(f"tooth_ur{i}", head, (0, 0, 0), (0, 0, 0), (hx1 - 0.8, hy, z), (0.7, 2 + (i + 1) % 2, 0.7), "tooth")
    for i in range(nf - 1):
        x = jx0 + (jx1 - jx0) * (i + 0.5) / (nf - 1) - 0.35
        part(f"tooth_lf{i}", jaw, (0, 0, 0), (0, 0, 0), (x, jy - 2.5 + (i % 2) * 0.5, jz0 + 0.2), (0.7, 2.5 - (i % 2) * 0.5, 0.7), "tooth")
    for i in range(ns):
        z = jz0 + (jz1 - jz0) * (i + 0.5) / ns
        part(f"tooth_ll{i}", jaw, (0, 0, 0), (0, 0, 0), (jx0 + 0.1, jy - 2.5 + (i % 2) * 0.5, z), (0.7, 2.5 - (i % 2) * 0.5, 0.7), "tooth")
        part(f"tooth_lr{i}", jaw, (0, 0, 0), (0, 0, 0), (jx1 - 0.8, jy - 2.5 + ((i + 1) % 2) * 0.5, z), (0.7, 2.5 - ((i + 1) % 2) * 0.5, 0.7), "tooth")

def finish():
    g.BY.clear(); g.BY.update({p["name"]: p for p in P})
    g.UV = g.pack(); m.UV = g.UV

def hx(s): return g.hx(s)

# ---------------------------------------------------------------- A: как на картинке
def variant_a():
    P.clear()
    part("head", "root", (0, 12, -9), (0, 0, 0), (-6, -4, -9), (12, 7, 12), "head")
    part("lower_jaw", "root", (0, 18, -6), (0.55, 0, 0), (-5.5, -2, -12), (11, 6, 12), "jaw")
    teeth("head", -6, 6, -9, 3, 2.7, "lower_jaw", -5.5, 5.5, -12, 0, -2)
    part("eye_l", "head", (0, 0, 0), (0, 0, 0), (6, -3, -7), (1, 2, 2), "eye")
    part("eye_r", "head", (0, 0, 0), (0, 0, 0), (-7, -3, -7), (1, 2, 2), "eye")
    part("body", "root", (0, 14, 0), (0, 0, 0), (-6, -5, -6), (12, 10, 16), "body")
    part("dorsal", "body", (0, -5, 0), (0, 0, 0), (-0.5, -4, 0), (1, 4, 8), "fin")
    part("body2", "root", (0, 14, 10), (0, 0, 0), (-4.5, -4.5, 0), (9, 9, 8), "body")
    part("tail1", "body2", (0, 0, 8), (0, 0, 0), (-3, -3, 0), (6, 6, 8), "tail")
    part("tail2", "tail1", (0, 0, 8), (0, 0, 0), (-2, -2, 0), (4, 4, 7), "tail")
    part("tail_fin", "tail2", (0, 0, 7), (0, 0, 0), (-0.5, -7, 0), (1, 14, 6), "fin")
    part("fin_l", "root", (6, 18.5, -2), (0, 0, 0.6), (0, -0.5, -3), (8, 1, 6), "fin")
    part("fin_r", "root", (-6, 18.5, -2), (0, 0, -0.6), (-8, -0.5, -3), (8, 1, 6), "fin")
    m.BLUE = [hx(c) for c in ("1b3b86", "2858b8", "3a76dc", "5b95ee")]
    m.SLATE = [hx(c) for c in ("27394c", "34495f", "425b75", "56728f")]
    m.PALE = [hx(c) for c in ("7d95ad", "9ab0c6", "b4c6d8")]
    finish()

# ---------------------------------------------------------------- B: акула
def variant_b():
    P.clear()
    part("head", "root", (0, 13, -8), (0, 0, 0), (-4, -3.5, -8), (8, 6, 9), "head")
    part("snout", "head", (0, 0, -8), (0, 0, 0), (-3, -3, -5), (6, 4, 5), "head")
    part("lower_jaw", "root", (0, 17.5, -5), (0.45, 0, 0), (-3.5, -1.5, -11), (7, 3, 11), "jaw")
    teeth("snout", -3, 3, -5, 0, 1.0, "lower_jaw", -3.5, 3.5, -11, -1, -1.5, nf=4, ns=3)
    part("eye_l", "head", (0, 0, 0), (0, 0, 0), (4, -2.5, -6.5), (1, 2, 2), "eye")
    part("eye_r", "head", (0, 0, 0), (0, 0, 0), (-5, -2.5, -6.5), (1, 2, 2), "eye")
    part("body", "root", (0, 14, 0), (0, 0, 0), (-4.5, -4, -6), (9, 8, 14), "body")
    part("dorsal", "body", (0, -4, 0), (0, 0, 0), (-0.5, -6, -1), (1, 6, 6), "fin")
    part("body2", "root", (0, 14, 8), (0, 0, 0), (-3.5, -3.5, 0), (7, 7, 8), "body")
    part("tail1", "body2", (0, 0, 8), (0, 0, 0), (-2.5, -2.5, 0), (5, 5, 7), "tail")
    part("tail2", "tail1", (0, 0, 7), (0, 0, 0), (-1.5, -1.5, 0), (3, 3, 6), "tail")
    part("tail_fin", "tail2", (0, 0, 6), (0, 0, 0), (-0.5, -8, 0), (1, 16, 5), "fin")
    part("fin_l", "root", (4.5, 18, -2), (0, 0, 0.8), (0, -0.5, -3), (9, 1, 6), "fin")
    part("fin_r", "root", (-4.5, 18, -2), (0, 0, -0.8), (-9, -0.5, -3), (9, 1, 6), "fin")
    m.BLUE = [hx(c) for c in ("3b4756", "4d5d70", "627790", "7b92ac")]          # серая акулья спина
    m.SLATE = [hx(c) for c in ("5a6a7c", "6f8196", "8499b0", "9db2c8")]
    m.PALE = [hx(c) for c in ("c4d0dc", "d8e2ec", "ecf2f7")]                    # белое брюхо
    finish()

# ---------------------------------------------------------------- C: ящер (длинная морда, четыре ласта, шипы)
def variant_c():
    P.clear()
    part("head", "root", (0, 13, -7), (0, 0, 0), (-4, -3.5, -12), (8, 6, 14), "head")
    part("lower_jaw", "root", (0, 17.5, -4), (0.35, 0, 0), (-3.5, -1.5, -15), (7, 3, 15), "jaw")
    teeth("head", -4, 4, -12, 0, 2.2, "lower_jaw", -3.5, 3.5, -15, 0, -1.5, nf=4, ns=6)
    part("eye_l", "head", (0, 0, 0), (0, 0, 0), (4, -3.5, -5), (1, 2, 2), "eye")
    part("eye_r", "head", (0, 0, 0), (0, 0, 0), (-5, -3.5, -5), (1, 2, 2), "eye")
    part("body", "root", (0, 14, 0), (0, 0, 0), (-5, -4.5, -5), (10, 9, 14), "body")
    for i, z in enumerate((-2, 2, 6)):
        part(f"spike{i}", "body", (0, -4.5, z), (0, 0, 0), (-0.5, -3, -1), (1, 3, 2), "fin")
    part("body2", "root", (0, 14, 9), (0, 0, 0), (-4, -4, 0), (8, 8, 8), "body")
    part("tail1", "body2", (0, 0, 8), (0, 0, 0), (-3, -3, 0), (6, 6, 8), "tail")
    part("tail2", "tail1", (0, 0, 8), (0, 0, 0), (-2, -2, 0), (4, 4, 7), "tail")
    part("tail_fin", "tail2", (0, 0, 7), (0, 0, 0), (-0.5, -5, 0), (1, 10, 6), "fin")
    part("fin_l", "root", (5, 18.5, -3), (0, 0, 0.5), (0, -0.5, -2), (6, 1, 4), "fin")
    part("fin_r", "root", (-5, 18.5, -3), (0, 0, -0.5), (-6, -0.5, -2), (6, 1, 4), "fin")
    part("hind_l", "body2", (4, 3.5, 3), (0, 0, 0.5), (0, -0.5, -1.5), (5, 1, 3), "fin")
    part("hind_r", "body2", (-4, 3.5, 3), (0, 0, -0.5), (-5, -0.5, -1.5), (5, 1, 3), "fin")
    m.BLUE = [hx(c) for c in ("1f4a3c", "2d6b57", "3f8c73", "5fae92")]          # морской зелёный
    m.SLATE = [hx(c) for c in ("2b3a35", "3b5048", "4d675d", "658176")]
    m.PALE = [hx(c) for c in ("a8b89c", "c2d0b4", "dae4cc")]
    finish()

VARIANTS = {"A": variant_a, "B": variant_b, "C": variant_c}

# ---------------------------------------------------------------- D: гигантский краб
def variant_d():
    P.clear()
    part("body", "root", (0, 18, 0), (0, 0, 0), (-7, -3, -5), (14, 6, 10), "body")
    part("shell", "root", (0, 15.5, 0), (0, 0, 0), (-6, -2, -4), (12, 3, 8), "body")
    part("head", "root", (0, 17, -5), (0, 0, 0), (-3, -2, -2), (6, 4, 3), "head")
    part("eye_l", "head", (0, 0, 0), (0, 0, 0), (1.5, -4, -1), (1, 2, 1), "eye")
    part("eye_r", "head", (0, 0, 0), (0, 0, 0), (-2.5, -4, -1), (1, 2, 1), "eye")
    part("claw_arm_l", "root", (7, 18, -4), (0, -0.5, 0), (0, -1, -5), (3, 3, 6), "tail")
    part("claw_l", "claw_arm_l", (0, 0, -5), (0, 0, 0), (-1, -2.5, -6), (5, 5, 6), "claw")
    part("claw_arm_r", "root", (-7, 18, -4), (0, 0.5, 0), (-3, -1, -5), (3, 3, 6), "tail")
    part("claw_r", "claw_arm_r", (0, 0, -5), (0, 0, 0), (-4, -2.5, -6), (5, 5, 6), "claw")
    for i, z in enumerate((-3, 0, 3)):
        part(f"leg_l{i}", "root", (7, 19, z), (0, 0, -0.5), (0, -0.5, -0.5), (6, 1, 1), "tail")
        part(f"leg_r{i}", "root", (-7, 19, z), (0, 0, 0.5), (-6, -0.5, -0.5), (6, 1, 1), "tail")
    m.BLUE = [hx(c) for c in ("8a2a14", "b4381c", "d6502a", "ee7a40")]          # красно-оранжевый панцирь
    m.SLATE = [hx(c) for c in ("6a2410", "8a3418", "a8482a", "c46438")]
    m.PALE = [hx(c) for c in ("d8b090", "e6c8a8", "f2dcc2")]
    finish()

# ---------------------------------------------------------------- E: морской змей
def variant_e():
    P.clear()
    part("head", "root", (0, 14, -22), (0, 0, 0), (-3.5, -3, -7), (7, 5, 8), "head")
    part("lower_jaw", "root", (0, 17, -18), (0.45, 0, 0), (-3, -1, -9), (6, 2, 9), "jaw")
    teeth("head", -3.5, 3.5, -7, 1, 1.9, "lower_jaw", -3, 3, -9, 0, -1, nf=4, ns=3)
    part("eye_l", "head", (0, 0, 0), (0, 0, 0), (3.5, -2.5, -4.5), (1, 2, 2), "eye")
    part("eye_r", "head", (0, 0, 0), (0, 0, 0), (-4.5, -2.5, -4.5), (1, 2, 2), "eye")
    part("body", "root", (0, 14, -14), (0, 0, 0), (-3.5, -3.5, 0), (7, 7, 8), "body")
    prev = "root"; z = -6
    for i in range(1, 6):
        w = max(2, 7 - i)
        part(f"seg{i}", "root", (0, 14, z), (0, 0, 0), (-w / 2, -w / 2, 0), (w, w, 8), "body" if i < 3 else "tail")
        z += 8
    part("dorsal", "root", (0, 10.5, -14), (0, 0, 0), (-0.5, -3, 0), (1, 3, 30), "fin")
    part("tail_fin", "root", (0, 14, 34), (0, 0, 0), (-0.5, -4, 0), (1, 8, 6), "fin")
    m.BLUE = [hx(c) for c in ("2a2a58", "3d3d84", "5252a8", "7070cc")]          # глубоководный индиго
    m.SLATE = [hx(c) for c in ("2a3050", "3a4470", "4c5890", "6572b0")]
    m.PALE = [hx(c) for c in ("8c90c8", "a8acd8", "c4c8e8")]
    finish()

# ---------------------------------------------------------------- F: медуза
def variant_f():
    P.clear()
    part("bell", "root", (0, 8, 0), (0, 0, 0), (-6, -2, -6), (12, 6, 12), "body")
    part("bell2", "root", (0, 12, 0), (0, 0, 0), (-5, 0, -5), (10, 3, 10), "body")
    part("eye_l", "bell", (0, 0, 0), (0, 0, 0), (2, 1, -6.3), (2, 2, 1), "eye")
    part("eye_r", "bell", (0, 0, 0), (0, 0, 0), (-4, 1, -6.3), (2, 2, 1), "eye")
    for i, (x, z) in enumerate(((-3, -3), (0, -3), (3, -3), (-3, 0), (3, 0), (-3, 3), (0, 3), (3, 3))):
        part(f"tent{i}", "root", (x, 15, z), (0, 0, 0), (-0.5, 0, -0.5), (1, 9 + (i % 3) * 2, 1), "tail")
    for i, x in enumerate((-2, 2)):
        part(f"arm{i}", "root", (x, 15, 0), (0, 0, 0), (-1, 0, -1), (2, 12, 2), "claw")
    m.BLUE = [hx(c) for c in ("5a2a88", "7a3cb4", "9a56d8", "b87af0")]          # фиолетовый
    m.SLATE = [hx(c) for c in ("4a2a7a", "603a9a", "7850b8", "9468d4")]
    m.PALE = [hx(c) for c in ("d8b8f4", "e6d0fa", "f4e6ff")]
    finish()

# ---------------------------------------------------------------- G: скат
def variant_g():
    P.clear()
    part("body", "root", (0, 18, 0), (0, 0, 0), (-4, -2, -6), (8, 4, 12), "body")
    part("wing_l", "root", (4, 18, 0), (0, 0, 0.1), (0, -1.5, -6), (11, 2, 12), "body")
    part("wing_r", "root", (-4, 18, 0), (0, 0, -0.1), (-11, -1.5, -6), (11, 2, 12), "body")
    part("eye_l", "body", (0, 0, 0), (0, 0, 0), (2, -3, -5), (2, 1, 2), "eye")
    part("eye_r", "body", (0, 0, 0), (0, 0, 0), (-4, -3, -5), (2, 1, 2), "eye")
    part("tail1", "root", (0, 18, 6), (0, 0, 0), (-1.5, -1.5, 0), (3, 3, 8), "tail")
    part("tail2", "tail1", (0, 0, 8), (0, 0, 0), (-1, -1, 0), (2, 2, 8), "tail")
    part("stinger", "tail2", (0, 0, 8), (0, 0, 0), (-0.5, -0.5, 0), (1, 1, 5), "fin")
    m.BLUE = [hx(c) for c in ("30495c", "416378", "567c94", "6e96b0")]
    m.SLATE = [hx(c) for c in ("3a5060", "4c6678", "627f94", "7c9bb0")]
    m.PALE = [hx(c) for c in ("c8d4d8", "dce6e8", "eef4f4")]
    finish()

VARIANTS.update({"D": variant_d, "E": variant_e, "F": variant_f, "G": variant_g})

def sheet(img, title):
    views = [g.render(img, 30, -12, scale=8), g.render(img, 90, 6, scale=8), g.render(img, 0, 4, scale=8), g.render(img, 150, 28, scale=8)]
    im = Image.new("RGB", (600, 630), (24, 26, 34))
    for i, v in enumerate(views):
        im.paste(v, ((i % 2) * 300, 30 + (i // 2) * 300))
    ImageDraw.Draw(im).text((10, 8), title, fill=(240, 240, 240))
    return im

def main():
    prefix = sys.argv[1]
    for key, fn in VARIANTS.items():
        fn()
        img = m.paint(m.color)
        sheet(img, f"Variant {key}").save(f"{prefix}_{key}.png")
        print("variant", key, "parts:", len(P), "ok")

if __name__ == "__main__":
    main()
