#!/usr/bin/env python3
"""Сталкер: описание частей -> Java-модель, текстура, светящийся слой, превью.

Использует каркас tools/beetle_gen.py (раскладка UV, трассировка для превью).
Координаты как в ModelPart: y вниз, земля на y=24, перёд смотрит в -z. Размеры кубоидов — целые.
Запуск из minecraft-mod:  python3 tools/stalker_gen.py [preview.png]
"""
import hashlib, math, os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import beetle_gen as g

g.TEX_W, g.TEX_H = 128, 64
P = g.P; P.clear()
def part(name, parent, pivot, rot, origin, size, kind):
    P.append(dict(name=name, parent=parent, pivot=pivot, rot=rot, origin=origin, size=size, kind=kind))

# ---------------------------------------------------------------- части
part("torso", "root", (0, 13, 0), (0.15, 0, 0), (-3, -5, -2), (6, 5, 4), "waist")
part("chest", "torso", (0, -5, 0), (0.15, 0, 0), (-4, -7, -2), (8, 7, 4), "chest")
for n, y in (("a", -6), ("b", -4), ("c", -2)):
    part(f"rib_{n}", "chest", (0, y, -2), (0, 0, 0), (-3, 0, -1), (6, 1, 1), "rib")
part("spine_a", "chest", (0, -6.5, 2), (0.55, 0, 0), (-0.5, -3, -0.5), (1, 3, 1), "spine")
part("spine_b", "chest", (0, -4, 2), (0.45, 0, 0), (-0.5, -3, -0.5), (1, 3, 1), "spine")
part("spine_c", "chest", (0, -1.5, 2), (0.35, 0, 0), (-0.5, -2, -0.5), (1, 2, 1), "spine")
part("pad_l", "chest", (4.5, -6.5, 0), (0, 0, -0.25), (-1.5, -1.5, -2), (4, 2, 4), "pad")
part("pad_r", "chest", (-4.5, -6.5, 0), (0, 0, 0.25), (-2.5, -1.5, -2), (4, 2, 4), "pad")
part("neck", "chest", (0, -6.5, -0.5), (-0.1, 0, 0), (-1, -3, -1), (2, 3, 2), "neck")
part("head", "neck", (0, -3, 0), (0.25, 0, 0), (-3.5, -6, -4), (7, 6, 6), "head")
part("brow", "head", (0, -4.5, -4), (0, 0, 0), (-4, -0.5, -1.5), (8, 1, 2), "brow")
part("jaw", "head", (0, 0, 0.5), (0, 0, 0), (-3, 0, -5.5), (6, 2, 5), "jaw")
for s, sx in (("l", 1), ("r", -1)):
    part(f"horn_{s}", "head", (2.5 * sx, -6, -1), (-0.4, 0, 0.5 * sx), (-0.5, -4, -0.5), (1, 4, 1), "horn")
    part(f"horn_{s}2", f"horn_{s}", (0, -4, 0), (-0.6, 0, 0.3 * sx), (-0.5, -3, -0.5), (1, 3, 1), "horn_tip")
    part(f"ear_{s}", "head", (3.5 * sx, -3.5, 0), (0, 0.3 * sx, 0.6 * sx), (0 if sx > 0 else -3, -1, -0.5), (3, 2, 1), "ear")
for s, sx in (("l", 1), ("r", -1)):
    part(f"arm_{s}", "chest", (5.5 * sx, -5.5, 0), (0.05, 0, -0.07 * sx), (-1.5, 0, -1.5), (3, 7, 3), "arm")
    part(f"forearm_{s}", f"arm_{s}", (0, 7, 0), (-0.35, 0, 0), (-1, 0, -1), (2, 7, 2), "forearm")
    part(f"hand_{s}", f"forearm_{s}", (0, 7, 0), (0.1, 0, 0), (-1.5, 0, -1.5), (3, 2, 3), "hand")
    for i in range(3):
        part(f"claw_{s}{i}", f"hand_{s}", (-1 + i, 2, -1), (0.25, 0, 0), (-0.5, 0, -0.5), (1, 3, 1), "claw")
    part(f"thigh_{s}", "root", (2.5 * sx, 13, 0), (-0.35, 0, 0), (-1.5, 0, -1.5), (3, 6, 3), "thigh")
    part(f"shin_{s}", f"thigh_{s}", (0, 6, 0), (0.7, 0, 0), (-1, 0, -1), (2, 5, 2), "shin")
    part(f"foot_{s}", f"shin_{s}", (0, 5, 0), (-0.35, 0, 0), (-1.5, -1, -3), (3, 2, 4), "foot")
part("rag_f", "torso", (0, -0.5, -2.2), (-0.3, 0, 0), (-3, 0, -0.5), (6, 7, 1), "cloth")
part("rag_b", "torso", (0, -0.5, 2.2), (-0.3, 0, 0), (-3, 0, -0.5), (6, 7, 1), "cloth")
g.BY.clear(); g.BY.update({p["name"]: p for p in P})
g.UV = g.pack(); UV = g.UV

# ---------------------------------------------------------------- палитра
# Ориентир — ванильные зомби/скелет/варден: большие спокойные поля одного тона (3–4 близких оттенка),
# редкий одиночный шум, чёткие плоские детали, лицо из нескольких пикселей, светящиеся акценты.
hx = g.hx
SK = [hx(c) for c in ("383c46", "444955", "525864", "616975")]          # кожа: тёмный холодный серо-синий
BN = [hx(c) for c in ("6d6958", "8d8977", "aaa692", "c4c0aa")]          # кость: контур, тень, основа, блик
CL = [hx(c) for c in ("231c2c", "2e2539", "3a2f47")]                    # лохмотья
MAW = [hx(c) for c in ("1c0c10", "34171b")]
CORE = [hx(c) for c in ("3a1f06", "6a3a08", "9a5a0c")]
AMB = [hx(c) for c in ("ff9a1e", "ffc040", "ffe58a")]
DARK = hx("121216")

def H(*a):
    return int.from_bytes(hashlib.md5(repr(a).encode()).digest()[:4], "big") / 4294967296.0

def skin(nm, face, a, b, fw, fh, base=1):
    """спокойная кожа: базовый тон + блочные пятна 2×2 + редкие одиночные пиксели; сверху светлее, снизу темнее"""
    t = base
    if H(nm, face, a // 2, b // 2, "blk") > .72: t += 1
    elif H(nm, face, a // 2, b // 2, "blk") < .22: t -= 1
    if H(nm, face, a, b, "px") > .93: t += 1
    elif H(nm, face, a, b, "px") < .05: t -= 1
    if face == "up": t += 1
    if face == "down": t -= 1
    if b >= fh - 1 and face not in ("up", "down"): t -= 1
    return SK[max(0, min(3, t))]

def bone(nm, face, a, b, fw, fh, base=2):
    """плоская кость: основа, светлая кромка сверху-слева, тёмная снизу-справа, почти без шума"""
    t = base
    if H(nm, face, a, b, "px") > .95: t += 1
    if b == 0 and face not in ("down",): t += 1
    if b == fh - 1 and face not in ("up",): t -= 1
    if a == fw - 1: t -= 1
    return BN[max(0, min(3, t))]

def color(p, face, a, b, fw, fh):
    """цвет пикселя (a,b) грани; возвращает (rgb, glow_rgb|None, alpha)"""
    k = p["kind"]; nm = p["name"]
    S = lambda base=1: skin(nm, face, a, b, fw, fh, base)
    B = lambda base=2: bone(nm, face, a, b, fw, fh, base)
    if k == "head":
        c = S(1)
        if face == "north":
            if b == 1: c = SK[0]                                                      # тень под бровью
            if (a, b) in ((1, 2), (5, 2), (2, 3), (4, 3)):                           # узкие злые глаза
                return (AMB[1], AMB[0] if (a, b) in ((1, 2), (5, 2)) else AMB[1], 255)
            if b == fh - 1:
                c = DARK                                                              # линия пасти
                if a in (2, 4): c = BN[3]                                             # два клыка
        return (c, None, 255)
    if k == "jaw":
        if face == "up": return (MAW[0] if (a, b) != (fw // 2, 1) else MAW[1], None, 255)
        c = S(0)
        if face == "north" and b == 0 and a in (1, fw - 2): c = BN[3]                 # нижние клыки
        return (c, None, 255)
    if k == "brow":
        return (B(1) if not (face == "north" and b == 1) else BN[0], None, 255)
    if k == "horn":
        return (BN[1 + min(2, (b * 3) // max(1, fh))] if b % 3 != 2 else BN[0], None, 255)
    if k == "horn_tip":
        return (BN[2 + (1 if b > fh // 2 else 0)], None, 255)
    if k == "ear":
        return (S(0), None, 255)
    if k == "neck":
        return (S(0), None, 255)
    if k == "chest":
        c = S(1)
        if face == "north":
            if 1 <= a <= fw - 2 and 1 <= b <= fh - 2: c = SK[0]                       # грудная полость
            if (a, b) in ((3, 3), (4, 3), (3, 4), (4, 4)):                            # янтарное ядро 2×2
                return (CORE[2 if (a, b) == (3, 3) else 1], AMB[0] if (a, b) in ((3, 4), (4, 4)) else AMB[1], 255)
        if face == "south" and a in (fw // 2 - 1, fw // 2): c = SK[0]                 # позвоночная борозда
        return (c, None, 255)
    if k == "waist":
        c = S(0)
        if face == "north" and b == 0: c = BN[0]                                      # костяной ремень
        return (c, None, 255)
    if k == "rib":
        return (B(2), None, 255)
    if k == "spine":
        return (BN[1 + min(2, (b * 3) // max(1, fh))], None, 255)
    if k == "pad":
        c = B(1)
        if a in (0, fw - 1) or b in (0, fh - 1): c = BN[0] if face != "up" else BN[1]
        return (c, None, 255)
    if k == "arm":
        c = S(1)
        # редкие янтарные «трещины» на плечах: светятся
        if face in ("north", "south") and (a, b) in ((1, 2), (1, 3)) and p["name"].endswith("l"): return (CORE[1], AMB[0], 255)
        if face in ("north", "south") and (a, b) in ((1, 2), (1, 3)) and p["name"].endswith("r"): return (CORE[1], AMB[0], 255)
        return (c, None, 255)
    if k == "forearm":
        c = S(0)
        if b == 0: c = BN[0]                                                           # костяная повязка у локтя
        return (c, None, 255)
    if k == "hand":
        return (S(0), None, 255)
    if k == "claw":
        t = b / max(1, fh - 1)
        return (BN[1] if t < .34 else BN[2] if t < .75 else BN[3], None, 255)
    if k == "thigh":
        return (S(1), None, 255)
    if k == "shin":
        return (S(0), None, 255)
    if k == "foot":
        c = S(0)
        if face == "north" and b == 0: c = BN[2]                                       # когти на носке
        return (c, None, 255)
    if k == "cloth":
        if face in ("north", "south"):
            hole = (b >= fh - 2 and H(nm, a, "h") < .45) or (b == fh - 3 and H(nm, a, "h2") < .15)
            if hole: return (CL[0], None, 0)
            c = CL[1 + (a % 2 == 0 and b < fh - 3)]                                    # вертикальные складки
            if b == 0: c = CL[0]
            return (c, None, 255)
        return (CL[1], None, 255)
    return ((255, 0, 255), None, 255)

def paint():
    W, Ht = g.TEX_W, g.TEX_H
    img = np.zeros((Ht, W, 4), np.uint8); glow = np.zeros((Ht, W, 4), np.uint8)
    for p in P:
        w, h, d = (int(s) for s in p["size"]); u0, v0 = UV[p["name"]]
        faces = {"east": (u0, v0 + d, d, h), "north": (u0 + d, v0 + d, w, h), "west": (u0 + d + w, v0 + d, d, h),
                 "south": (u0 + 2 * d + w, v0 + d, w, h), "up": (u0 + d, v0, w, d), "down": (u0 + d + w, v0, w, d)}
        for fname, (x, y, fw, fh) in faces.items():
            for b in range(fh):
                for a in range(fw):
                    c, gl, al = color(p, fname, a, b, fw, fh)
                    img[y + b, x + a] = tuple(c) + (al,)
                    if gl: glow[y + b, x + a] = tuple(gl) + (255,)
    return img, glow

# ---------------------------------------------------------------- Java
def camel(n):
    a = n.split("_"); return a[0] + "".join(s.capitalize() for s in a[1:])
def f(v): return ("%g" % v) + "F"

def java():
    lines = []
    for p in P:
        w, h, d = p["size"]; u, v = UV[p["name"]]; ox, oy, oz = p["origin"]; px, py, pz = p["pivot"]; rx, ry, rz = p["rot"]
        tr = (f"ModelTransform.of({f(px)}, {f(py)}, {f(pz)}, {f(rx)}, {f(ry)}, {f(rz)})" if (rx or ry or rz) else f"ModelTransform.pivot({f(px)}, {f(py)}, {f(pz)})")
        par = "r" if p["parent"] == "root" else camel(p["parent"]) + "D"
        lines.append(f'ModelPartData {camel(p["name"])}D = {par}.addChild("{p["name"]}", ModelPartBuilder.create().uv({u}, {v}).cuboid({f(ox)}, {f(oy)}, {f(oz)}, {f(w)}, {f(h)}, {f(d)}), {tr});')
    fields = "\n\t".join(f'private final ModelPart {camel(p["name"])};' for p in P)
    assign = "\n\t\t".join(f'this.{camel(p["name"])} = {"root" if p["parent"] == "root" else "this." + camel(p["parent"])}.getChild("{p["name"]}");' for p in P)
    return fields, assign, "\n\t\t".join(lines)

TEMPLATE = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "StalkerModel.java.tpl"), encoding="utf-8").read()

def main():
    img, glow = paint()
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    from PIL import Image
    Image.fromarray(img).save(f"{root}/src/main/resources/assets/amberhall/textures/entity/stalker.png")
    Image.fromarray(glow).save(f"{root}/src/main/resources/assets/amberhall/textures/entity/stalker_eyes.png")
    fields, assign, build = java()
    src = (TEMPLATE.replace("/*FIELDS*/", fields).replace("/*ASSIGN*/", assign).replace("/*BUILD*/", build)
           .replace("/*TEXW*/", str(g.TEX_W)).replace("/*TEXH*/", str(g.TEX_H)))
    open(f"{root}/src/main/java/com/amberhall/mod/StalkerModel.java", "w", encoding="utf-8").write(src)
    print("ok; низ модели по y:", lowest())
    if len(sys.argv) > 1:
        lit = img.copy(); m = glow[..., 3] > 0; lit[m] = glow[m]
        views = [g.render(lit, 35, 15, 380, 10, center=(0, 8, 0)), g.render(lit, 90, 8, 380, 10, center=(0, 8, 0)),
                 g.render(lit, 160, 15, 380, 10, center=(0, 8, 0)), g.render(lit, 0, 6, 380, 10, center=(0, 8, 0))]
        sheet = Image.new("RGB", (760, 760))
        for i, v in enumerate(views): sheet.paste(v, ((i % 2) * 380, (i // 2) * 380))
        sheet.save(sys.argv[1])
        Image.fromarray(img).resize((g.TEX_W * 6, g.TEX_H * 6), Image.NEAREST).save(sys.argv[1].replace(".png", "_tex.png"))

def lowest():
    ys = []
    for p in P:
        M = g.abs_transform(p["name"]); ox, oy, oz = p["origin"]; w, h, d = p["size"]
        for cx in (ox, ox + w):
            for cy in (oy, oy + h):
                for cz in (oz, oz + d):
                    ys.append((M @ np.array([cx, cy, cz, 1.0]))[1])
    return round(min(ys), 2), round(max(ys), 2)

if __name__ == "__main__":
    main()
