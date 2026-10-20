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
# Ванильный подход: мало крупных кубоидов (как у зомби/эндермена: 7–9), голова 8×8×8, туловище 8×12×4,
# конечности — толстые параллелепипеды; все детали (одежда, лицо, когти) рисуются текстурой, а не геометрией.
part("body", "root", (0, 12, 0), (0.3, 0, 0), (-4, -12, -2), (8, 12, 4), "body")
part("hump", "body", (0, -3, 2), (0.1, 0, 0), (-3, -6, 0), (6, 6, 3), "hump")
part("head", "body", (0, -12, -1), (-0.15, 0, 0), (-4, -8, -4), (8, 8, 8), "head")
part("horn_l", "head", (3, -8, -1), (-0.25, 0, 0.45), (-1, -6, -1), (2, 6, 2), "horn")
part("horn_r", "head", (-3, -8, -1), (-0.25, 0, -0.45), (-1, -6, -1), (2, 6, 2), "horn")
part("arm_l", "body", (5.5, -10, 0), (0.05, 0, -0.06), (-1.5, 0, -1.5), (3, 18, 3), "arm")
part("arm_r", "body", (-5.5, -10, 0), (0.05, 0, 0.06), (-1.5, 0, -1.5), (3, 18, 3), "arm")
part("leg_l", "root", (2.2, 12, 0), (0, 0, 0), (-2, 0, -2), (4, 12, 4), "leg")
part("leg_r", "root", (-2.2, 12, 0), (0, 0, 0), (-2, 0, -2), (4, 12, 4), "leg")
g.BY.clear(); g.BY.update({p["name"]: p for p in P})
g.UV = g.pack(); UV = g.UV

# ---------------------------------------------------------------- палитра
# Ванильные зомби/пиллагеры/хаск: 4–5 тонов на материал, заметные пятна (мотли), крупные плоские области одежды,
# лицо крупное и простое, контраст между материалами сильнее, чем внутри материала.
hx = g.hx
SK = [hx(c) for c in ("4c585c", "5c6a6e", "6c7b80", "7d8d92", "90a0a4")]; SKW = [2, 4, 4, 2, 1]     # кожа: холодная серо-зелёная
CL = [hx(c) for c in ("1d1626", "281e33", "33283f", "3f324d")]; CLW = [2, 4, 3, 1]                  # тёмно-фиолетовая роба
BN = [hx(c) for c in ("7f7b69", "9a9680", "b4b09a", "ccc8b2")]; BNW = [2, 4, 3, 1]                  # кость
SHELL = [hx(c) for c in ("2c3236", "363d42", "40484d", "4b5459")]
AMB = [hx(c) for c in ("ff8f1a", "ffbd3a", "ffe48a")]
DARK = hx("141218")

def H(*a):
    return int.from_bytes(hashlib.md5(repr(a).encode()).digest()[:4], "big") / 4294967296.0

def mottle(pal, wts, nm, face, a, b, shift=0, blk=2):
    """пятнистый материал, как у ванильных мобов: взвешенный выбор тона + крупные пятна"""
    r = H(nm, face, a, b, "px") * 0.6 + H(nm, face, a // blk, b // blk, "bk") * 0.4
    t = r * sum(wts); i = 0
    for i, w in enumerate(wts):
        t -= w
        if t <= 0: break
    i += shift
    return pal[max(0, min(len(pal) - 1, i))]

def color(p, face, a, b, fw, fh):
    """цвет пикселя (a,b) грани; возвращает (rgb, glow_rgb|None, alpha)"""
    k = p["kind"]; nm = p["name"]
    sk = lambda sh=0: mottle(SK, SKW, nm, face, a, b, sh)
    cl = lambda sh=0: mottle(CL, CLW, nm, face, a, b, sh)
    if k == "head":
        if face == "up": return (mottle(SK, SKW, nm, face, a, b, -1), None, 255)
        if face == "north":
            if (a, b) in ((1, 3), (2, 3), (5, 3), (6, 3)): return (AMB[1], AMB[1], 255)        # глаза 2×2
            if (a, b) in ((1, 4), (2, 4), (5, 4), (6, 4)): return (AMB[0], AMB[0], 255)
            if (a, b) in ((1, 2), (2, 2), (5, 2), (6, 2)): return (SK[0], None, 255)             # тяжёлая бровь
            if (a, b) in ((0, 2), (7, 2), (3, 2), (4, 2)): return (SK[1], None, 255)
            if (a, b) in ((3, 5), (4, 5)): return (SK[0], None, 255)                             # нос
            if b == 6 and 1 <= a <= 6: return (DARK, None, 255)                                  # пасть
            if (a, b) in ((2, 7), (5, 7)): return (BN[3], None, 255)                             # клыки
            return (sk(), None, 255)
        if face == "south": return (mottle(SK, SKW, nm, face, a, b, -1), None, 255)
        return (sk(), None, 255)
    if k == "horn":
        return (BN[min(3, 1 + (b * 3) // fh)] if b % 3 != 2 else BN[0], None, 255)
    if k == "body":
        # роба с вырезом на груди и разорванным подолом
        if face == "north":
            if b <= 1 and 2 <= a <= 5: return (sk(), None, 255)                                  # шея и грудь
            if 2 <= b <= 5 and 2 <= a <= 5:                                                      # прореха с ядром
                if (a, b) in ((3, 3), (4, 3), (3, 4), (4, 4)): return (CORE_C(a, b), AMB[1] if b == 3 else AMB[0], 255)
                return (SK[0], None, 255)
            if b == 9: return (CL[0], None, 255)                                                 # ремень
            if b >= 10 and H(nm, a, b, "t") < .35: return (sk(-1), None, 255)                   # рваный подол
            return (cl(), None, 255)
        if face == "south":
            if b == 9: return (CL[0], None, 255)
            if b >= 10 and H(nm, a, b, "t") < .35: return (sk(-1), None, 255)
            return (cl(-0 if a not in (3, 4) else -1), None, 255)
        if face == "up": return (sk(), None, 255)
        return (cl(), None, 255)
    if k == "hump":
        c = mottle(SHELL, [2, 4, 3, 1], nm, face, a, b)
        if face in ("north", "south", "east", "west") and b == 2: c = BN[0]
        if face == "up" and b % 2 == 0 and 1 <= a < fw - 1: c = BN[1]
        return (c, None, 255)
    if k == "arm":
        if b <= 6 or (b == 7 and H(nm, face, a, "r") < .5): return (cl(), None, 255)           # рукав
        if b >= fh - 3:                                                                          # кисть
            c = mottle(SK, SKW, nm, face, a, b, -2)
            if b == fh - 1 and face not in ("up", "down"): c = BN[2]                             # когти
            return (c, None, 255)
        return (sk(), None, 255)
    if k == "leg":
        if b <= 6 or (b == 7 and H(nm, face, a, "r") < .5): return (cl(), None, 255)
        if b >= fh - 2:
            c = mottle(SK, SKW, nm, face, a, b, -2)
            if b == fh - 1 and face == "north": c = BN[2] if a % 2 == 0 else c                   # когти на ногах
            return (c, None, 255)
        return (sk(-1), None, 255)
    return ((255, 0, 255), None, 255)

def CORE_C(a, b):
    return (hx("a85a0c") if b == 3 else hx("7a4208"))

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
        views = [g.render(lit, 35, 15, 380, 10, center=(0, 10, 0)), g.render(lit, 90, 8, 380, 10, center=(0, 10, 0)),
                 g.render(lit, 160, 15, 380, 10, center=(0, 10, 0)), g.render(lit, 0, 6, 380, 10, center=(0, 10, 0))]
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
