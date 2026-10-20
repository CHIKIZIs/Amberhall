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

# ---------------------------------------------------------------- палитра (ванильная скупость: 4–5 тонов, малый контраст)
hx = g.hx
SKIN = [hx(c) for c in ("2e2f36", "3a3b43", "464850", "52555e", "60646d")]; SW = [2, 4, 5, 3, 1]
BONE = [hx(c) for c in ("85806a", "a49e86", "c0b9a0", "d8d2ba")];           BW = [2, 4, 4, 1]
CLOTH = [hx(c) for c in ("29202f", "352a3e", "423650")];                      CW = [3, 4, 2]
MAW = [hx(c) for c in ("2a1014", "3c1a1e", "55262a")]
CORE = [hx(c) for c in ("4a2606", "7a4208", "a8620c")]
AMB = [hx(c) for c in ("ff9a1e", "ffc040", "ffe58a")]
DARK = hx("17171c")

def H(*a):
    return int.from_bytes(hashlib.md5(repr(a).encode()).digest()[:4], "big") / 4294967296.0

def pick(pal, wts, r):
    t = r * sum(wts)
    for c, w in zip(pal, wts):
        t -= w
        if t <= 0: return c
    return pal[-1]

def skin(r, shift=0):
    i = SKIN.index(pick(SKIN, SW, r)) + shift
    return SKIN[max(0, min(4, i))]

def bone(r, shift=0):
    i = BONE.index(pick(BONE, BW, r)) + shift
    return BONE[max(0, min(3, i))]

def color(p, face, a, b, fw, fh):
    """цвет пикселя (a,b) грани; возвращает (rgb, glow_rgb|None, alpha)"""
    k = p["kind"]; nm = p["name"]
    r = H(nm, face, a, b)
    edge = (b == 0) - (b == fh - 1)
    if k == "head":
        c = skin(r, 1 if face == "up" else 0)
        if face == "north":
            c = skin(r)
            if b == 1: c = skin(r, -1)                              # тень под бровью
            if (a, b) in ((1, 2), (5, 2), (2, 3), (4, 3)):          # узкие «злые» глаза, наклон к носу
                return (AMB[1], AMB[1] if (a, b) in ((2, 3), (4, 3)) else AMB[0], 255)
            if (a, b) in ((0, 2), (6, 2), (2, 2), (4, 2), (1, 3), (5, 3), (3, 3), (3, 2)): c = DARK   # глазницы и ноздри
            if b == fh - 1:                                         # верхние зубы
                c = bone(r, 1) if a % 2 == 0 else DARK
        if face in ("east", "west") and b == 3 and a in (2, 3): c = skin(r, -1)
        return (c, None, 255)
    if k == "jaw":
        if face == "up":
            c = MAW[(a + b) % 2 if r > .3 else 2]
            if 1 <= a <= fw - 2 and b == 1: c = MAW[2]               # язык
            return (c, None, 255)
        c = skin(r, -1)
        if face == "north" and b == 0: c = bone(r, 1) if a % 2 == 1 else DARK  # нижние зубы
        if face == "north" and b == 1: c = skin(r, -2)
        return (c, None, 255)
    if k == "brow":
        c = bone(r, -1 if (face == "north" and b == 1) else 0)
        if face == "north" and a in (0, fw - 1): c = skin(r, -1)
        return (c, None, 255)
    if k == "horn":
        c = bone(r, -1 + (b * 3) // max(1, fh))
        if b % 2 == 1 and face not in ("up", "down"): c = bone(r, -1)  # кольца
        return (c, None, 255)
    if k == "horn_tip":
        c = bone(r, min(1 + (b * 2) // max(1, fh), 3) - 1 + 1)
        return (c, None, 255)
    if k == "ear":
        c = skin(r, -1 if face != "north" else 0)
        if face in ("north", "south") and 0 < a < fw - 1: c = skin(r, -2)
        return (c, None, 255)
    if k == "neck":
        return (skin(r, -1), None, 255)
    if k == "chest":
        c = skin(r)
        if face == "north":
            # грудная полость: тёмное нутро и янтарное «ядро» между рёбрами
            if 2 <= a <= fw - 3 and 1 <= b <= fh - 2:
                c = CORE[0] if r < .5 else DARK
                if 3 <= a <= fw - 4 and 2 <= b <= fh - 3:
                    return (CORE[1 + (r > .6)], AMB[0] if r < .5 else AMB[1], 255)
            elif b in (0, fh - 1): c = skin(r, -1)
        if face == "south":
            if a in (fw // 2 - 1, fw // 2): c = skin(r, -2)               # позвоночная борозда
            if b % 2 == 1 and 1 <= a <= fw - 2: c = skin(r, -1)
        if face == "up" and (a in (0, fw - 1)): c = skin(r, -1)
        return (c, None, 255)
    if k == "waist":
        c = skin(r, -1)
        if face == "north" and b == 0: c = bone(r, -1)                  # ремень-кость
        if face == "north" and b == 0 and a % 3 == 1: c = bone(r, 1)
        return (c, None, 255)
    if k == "rib":
        c = bone(r, 1 if edge > 0 else 0)
        if face == "north": c = bone(r, 1)
        if face in ("east", "west") and b == 0: c = bone(r, -1)
        return (c, None, 255)
    if k == "spine":
        c = bone(r, -1 + (b * 3) // max(1, fh))
        if b == fh - 1: c = bone(r, 2) if face not in ("up", "down") else c
        return (c, None, 255)
    if k == "pad":
        c = bone(r, -1)
        if face == "up": c = bone(r, 0 if r < .8 else 1)
        if a in (0, fw - 1) or b in (0, fh - 1): c = bone(r, -2) if face not in ("up",) else bone(r, -1)
        if face == "up" and (a, b) in ((1, 1), (fw - 2, fh - 2), (1, fh - 2), (fw - 2, 1)): c = bone(0.99, 2)
        return (c, None, 255)
    if k == "arm":
        c = skin(r, 0 if face != "south" else -1)
        if b >= fh - 2: c = skin(r, -1)
        return (c, None, 255)
    if k == "forearm":
        c = skin(r, -1)
        if b >= 3 and face != "down" and face != "up": c = bone(r, -1 if b != 3 else 0)   # костяной браслет
        return (c, None, 255)
    if k == "hand":
        c = bone(r, -1)
        if face == "up": c = skin(r, -1)
        return (c, None, 255)
    if k == "claw":
        t = b / max(1, fh - 1)
        c = bone(r, 0 if t < .4 else 1 if t < .8 else 2) if face not in ("down",) else bone(r, 2)
        if t < .2: c = bone(r, -1)
        return (c, None, 255)
    if k == "thigh":
        c = skin(r, 0 if face in ("north", "up") else -1)
        if face == "north" and b == 0: c = skin(r, -1)
        return (c, None, 255)
    if k == "shin":
        c = skin(r, -1)
        if face == "north" and 1 <= b <= fh - 2: c = bone(r, -1)         # костяной наголенник
        return (c, None, 255)
    if k == "foot":
        c = skin(r, -2)
        if face == "north": c = bone(r, 0) if b == 0 else skin(r, -2)    # когти на носке
        if face == "north" and a % 2 == 0 and b == 0: c = bone(r, 2)
        return (c, None, 255)
    if k == "cloth":
        c = pick(CLOTH, CW, r)
        if face in ("north", "south"):
            # рваный низ: чем ниже, тем больше дыр
            hole = (b >= fh - 3 and H(nm, a, "h") < (b - (fh - 4)) * 0.28) or (b == fh - 1 and a % 2 == 0)
            if hole: return (c, None, 0)
            if a in (0, fw - 1) and H(nm, b, "s") < .4: c = CLOTH[0]
            if b % 3 == 0: c = CLOTH[0] if r < .5 else c
        return (c, None, 255)
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
