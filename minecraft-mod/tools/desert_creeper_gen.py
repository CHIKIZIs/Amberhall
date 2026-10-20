#!/usr/bin/env python3
"""Пустынный крипер-кактусёнок: своя модель (не ванильный крипер) + текстура + превью.
Маленький (≈1.1 блока), обугленный чёрный кактус: злые светящиеся глаза, пасть с зубами, шипы на голове, тлеющие трещины.
Запуск из minecraft-mod:  python3 tools/desert_creeper_gen.py [preview.png]"""
import hashlib, os, sys
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import beetle_gen as g

g.TEX_W, g.TEX_H = 64, 64
P = g.P; P.clear()
def part(name, parent, pivot, rot, origin, size, kind):
    P.append(dict(name=name, parent=parent, pivot=pivot, rot=rot, origin=origin, size=size, kind=kind))

# Силуэт саговой кактус-«пугалки»: один высокий ствол с лицом, две руки-«Г», две низкие лапы — всего 7 крупных кубоидов, как у ванильных мобов.
part("trunk", "root", (0, 22, 0), (0, 0, 0), (-3, -16, -3), (6, 16, 6), "trunk")
for s_, x in (("l", 1), ("r", -1)):
    part(f"arm_{s_}", "trunk", (3 * x, -7, 0), (0, 0, 0), (0 if x > 0 else -3, -1.5, -1.5), (3, 3, 3), "arm")
    part(f"arm_{s_}_up", f"arm_{s_}", (4.5 * x, 0, 0), (-0.25, 0, 0), (-1.5, -8, -1.5), (3, 8, 3), "arm_up")
    part(f"foot_{s_}", "root", (2 * x, 22, 0), (0, 0, 0), (-2, 0, -2), (4, 2, 4), "foot")
g.BY.clear(); g.BY.update({p["name"]: p for p in P})
g.UV = g.pack(); UV = g.UV

hx = g.hx
BK = [hx(c) for c in ("0c0d0e", "151617", "1f2123", "2a2d30")]            # обугленный чёрный кактус
SP = hx("7a7e78")                                                           # серые колючки
TOOTH = [hx("d8d4c4"), hx("a8a493")]
EMB = hx("5a1a06"); EMB_G = [hx("ff5a0c"), hx("ff9a2a"), hx("ffd060")]      # тлеющие угли (светятся)
EYE_D = hx("7a1408"); EYE_G = [hx("ff2a10"), hx("ff7030")]
MAW = hx("3a0808")
CLAW = [hx(c) for c in ("3a3d3f", "5a5e60", "8a8e8c")]
def H(*a): return int.from_bytes(hashlib.md5(repr(a).encode()).digest()[:4], "big") / 4294967296.0

def black(nm, face, a, b, fw, fh, base=1):
    t = base + (1 if H(nm, face, a // 2, b // 2, "k") > .72 else -1 if H(nm, face, a // 2, b // 2, "k") < .2 else 0)
    if face == "up": t += 1
    if face == "down": t -= 1
    c = BK[max(0, min(3, t))]
    if a % 3 == 1 and b % 3 == 1 and face not in ("up", "down") and H(nm, face, a, b, "s") > .3: c = SP        # редкие острые колючки
    return c

def color(p, face, a, b, fw, fh):
    """возвращает (rgb, glow_rgb|None, alpha)"""
    k = p["kind"]; nm = p["name"]
    if k == "trunk":
        if face == "north":
            if (a, b) in ((0, 3), (1, 3), (1, 4), (4, 3), (5, 3), (4, 4)):                               # злые глаза-«V»
                return (EYE_D, EYE_G[0] if b == 4 else EYE_G[1], 255)
            if (a, b) in ((0, 2), (1, 2), (4, 2), (5, 2)): return (BK[0], None, 255)                      # нависшие брови
            if b == 6 and 1 <= a <= 4: return (TOOTH[0] if a % 2 else MAW, None, 255)                      # зубастая пасть
            if b == 7 and 2 <= a <= 3: return (TOOTH[1] if a == 2 else MAW, None, 255)
            if b == 5 and a in (1, 4): return (TOOTH[0], None, 255)                                       # клыки
            cr = {(2, 10), (3, 11), (2, 12), (2, 13), (3, 14)}                                            # тлеющая трещина
            if (a, b) in cr: return (EMB, EMB_G[1 if (a + b) % 2 else 0], 255)
        if face in ("east", "west") and (a, b) in ((2, 9), (3, 10), (3, 11), (2, 12)): return (EMB, EMB_G[0], 255)
        return (black(nm, face, a, b, fw, fh, 1), None, 255)
    if k in ("arm", "arm_up"):
        c = black(nm, face, a, b, fw, fh, 1)
        if k == "arm_up" and b == 0 and face not in ("up", "down"): c = CLAW[2]
        elif k == "arm_up" and b == 1 and face not in ("up", "down"): c = CLAW[1]
        if k == "arm_up" and face == "up": c = CLAW[1]                                                    # острый кончик-коготь
        return (c, None, 255)
    if k == "foot":
        c = BK[1 if H(nm, face, a, b) > .35 else 2]
        if b >= fh - 1: c = BK[0]
        if face == "north" and b == 0: c = CLAW[1 if a % 2 else 2]                                       # когти на лапах
        return (c, None, 255)
    return ((255, 0, 255), None, 255)

def paint():
    img = np.zeros((g.TEX_H, g.TEX_W, 4), np.uint8); glow = np.zeros((g.TEX_H, g.TEX_W, 4), np.uint8)
    for p in P:
        w, h, d = (int(-(-s // 1)) for s in p["size"]); u0, v0 = UV[p["name"]]
        faces = {"east": (u0, v0 + d, d, h), "north": (u0 + d, v0 + d, w, h), "west": (u0 + d + w, v0 + d, d, h),
                 "south": (u0 + 2 * d + w, v0 + d, w, h), "up": (u0 + d, v0, w, d), "down": (u0 + d + w, v0, w, d)}
        for fname, (x, y, fw, fh) in faces.items():
            for b in range(fh):
                for a in range(fw):
                    c, gl, al = color(p, fname, a, b, fw, fh)
                    img[y + b, x + a] = tuple(c) + (al,)
                    if gl: glow[y + b, x + a] = tuple(gl) + (255,)
    return img, glow

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

def main():
    img, glow = paint()
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    Image.fromarray(img).save(f"{root}/src/main/resources/assets/amberhall/textures/entity/desert_creeper.png")
    Image.fromarray(glow).save(f"{root}/src/main/resources/assets/amberhall/textures/entity/desert_creeper_eyes.png")
    fields, assign, build = java()
    tpl = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "DesertCreeperModel.java.tpl"), encoding="utf-8").read()
    src = tpl.replace("/*FIELDS*/", fields).replace("/*ASSIGN*/", assign).replace("/*BUILD*/", build).replace("/*TEXW*/", str(g.TEX_W)).replace("/*TEXH*/", str(g.TEX_H))
    open(f"{root}/src/main/java/com/amberhall/mod/DesertCreeperModel.java", "w", encoding="utf-8").write(src)
    print("ok")
    if len(sys.argv) > 1:
        lit = img.copy(); m = glow[..., 3] > 0; lit[m] = glow[m]
        views = [g.render(lit, 30, 15, 300, 14, center=(0, 13, 0)), g.render(lit, 90, 10, 300, 14, center=(0, 13, 0)),
                 g.render(lit, 160, 15, 300, 14, center=(0, 13, 0)), g.render(lit, 0, 6, 300, 14, center=(0, 13, 0))]
        sheet = Image.new("RGB", (600, 600))
        for i, v in enumerate(views): sheet.paste(v, ((i % 2) * 300, (i // 2) * 300))
        sheet.save(sys.argv[1])

if __name__ == "__main__":
    main()
