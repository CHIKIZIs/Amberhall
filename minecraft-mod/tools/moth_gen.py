#!/usr/bin/env python3
"""Светящийся мотылёк: маленькое летающее существо в ванильной манере (по духу как пчела и тихоня).

Простая форма (тело, голова, усики, два крыла-пластины с прозрачностью), мало тонов, чёткие пятна на крыльях.
Светящийся слой: «глазки» на крыльях и огонёк на брюшке, как у светлячка.
Генерирует Java-модель, текстуру, светящийся слой, файл Blockbench и превью.

Запуск из папки minecraft-mod:  python3 tools/moth_gen.py [preview.png] [--no-write]
"""
import json, math, os, random, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import beetle_gen as g

g.TEX_W, g.TEX_H = 64, 32
P = g.P
P.clear()
def part(name, parent, pivot, rot, origin, size, kind):
    P.append(dict(name=name, parent=parent, pivot=pivot, rot=rot, origin=origin, size=size, kind=kind))

# ---------------------------------------------------------------- части (y вниз, перед — в -z, земля на y=24)
part("body",      "root", (0, 18, 0),   (0.25, 0, 0),    (-1.5, -1.5, -3),  (3, 3, 6), "fur")
part("head",      "body", (0, 0, -3),   (-0.25, 0, 0),   (-1.5, -1.5, -3),  (3, 3, 3), "head")
part("antenna_l", "head", (1, -1.5, -2.5), (-0.5, 0, -0.3), (-0.5, -4, -0.5), (1, 4, 1), "antenna")
part("antenna_r", "head", (-1, -1.5, -2.5), (-0.5, 0, 0.3), (-0.5, -4, -0.5), (1, 4, 1), "antenna")
part("wing_l",    "body", (1.5, -1.5, -1.5), (0, 0, -0.3), (0, -0.25, -0.5), (8, 0.5, 6), "wing_l")
part("wing_r",    "body", (-1.5, -1.5, -1.5), (0, 0, 0.3), (-8, -0.25, -0.5), (8, 0.5, 6), "wing_r")
g.BY.clear(); g.BY.update({p["name"]: p for p in P})
g.UV = g.pack()
UV = g.UV

# ---------------------------------------------------------------- палитра (приглушённая, как у тихони: 3–4 близких тона на деталь)
def hx(s): return g.hx(s)
FUR = [hx(c) for c in ("8a7ab0", "9c8cc4", "b0a2d6", "c8bce6")]          # пушистое тело
HEADC = [hx(c) for c in ("6a5a98", "7a6aa8", "8c7cba")]
WING = [hx(c) for c in ("3e2f78", "5a48a0", "7c68c8", "a090e4", "c8bcf4")]  # крыло: от кромки к середине
SPOT = [hx(c) for c in ("0c6a6c", "18a0a0", "3ce0d8", "b8fff8")]            # «глазок» на крыле
GLOWY = [hx(c) for c in ("9ac820", "d4f040", "f6ff9a")]                      # огонёк светлячка
DARK = hx("1c1230")

def H(*a):
    import hashlib
    return int.from_bytes(hashlib.md5(repr(a).encode()).digest()[:4], 'big') / 4294967296.0

def wing_face(p, a, b, fw, fh, glow=False):
    """форма и узор крыла на плоскости 9×7 (a — наружу, b — назад); None вне формы"""
    left = p["name"] == "wing_l"
    x = a if left else fw - 1 - a                                           # x=0 у тела, x=8 на кончике
    # крыло — скруглённая «капля»: у тела уже, к середине шире, кончик закруглён
    cx, cy = 3.3, (fh - 1) / 2
    rx, ry = 4.4, 3.1
    d = ((x - cx) / rx) ** 2 + ((b - cy) / ry) ** 2
    if x < 0.5 and abs(b - cy) > 1.6: return None                           # у основания узко
    if d > 1.0: return None
    # «глазок»: кольцо и тёмный центр
    ex, ey = 4.2, 2.3
    de = math.hypot(x - ex, b - ey)
    if de < 0.8: return (SPOT[3] if (x, b) == (4, 2) else DARK) if not glow else (SPOT[3] if (x, b) == (4, 2) else None)
    if de < 1.7: return SPOT[2] if glow or True else None
    if de < 2.4: return SPOT[1] if not glow else SPOT[1]
    if glow: return None
    # фон: тёмная кромка снаружи, светлее к центру
    t = 1 - d
    i = 0 if d > .78 else (1 if d > .55 else (2 if d > .3 else 3))
    if H(p["name"], x, b) > .9: i = min(4, i + 1)
    return WING[min(4, i + 1)] if d <= .78 else WING[0]

def color(p, face, a, b, fw, fh, rnd, glow=False):
    k = p["kind"]
    if k in ("wing_l", "wing_r"):
        if face in ("up", "down"):
            return wing_face(p, a, b, fw, fh, glow)
        return None                                                          # тонкие торцы — прозрачны
    if glow:
        if k == "fur" and face in ("south", "down") and b >= fh - 2 and (face == "south" or a in (1,)):
            return GLOWY[1] if (a + b) % 2 else GLOWY[2]
        if k == "head" and face == "north" and b == 1 and a in (0, fw - 1):
            return hx("fff8d0")
        return None
    if k == "fur":
        i = 1 + (1 if face == "up" else 0) - (1 if face == "down" else 0) + (1 if H(p["name"], face, a, b) > .75 else 0) - (1 if H(p["name"], face, a, b, 1) < .2 else 0)
        c = FUR[max(0, min(3, i))]
        if face in ("east", "west", "north", "south") and b == fh // 2 and p["name"] == "body": c = FUR[0]       # поперечные полоски брюшка
        return c
    if k == "head":
        c = HEADC[1 + (1 if H("h", face, a, b) > .7 else 0) - (1 if H("h", face, a, b, 2) < .2 else 0)]
        if face == "north":
            if (a, b) in ((0, 1), (2, 1)): return DARK                          # большие тёмные глаза
            if (a, b) in ((0, 0), (2, 0)): return hx("4a3a78")
        return c
    if k == "antenna":
        return DARK if b > 0 else HEADC[2]                                    # тёмные усики со светлым кончиком
    return (255, 0, 255, 255)

def paint(glow=False):
    img = np.zeros((g.TEX_H, g.TEX_W, 4), np.uint8)
    for p in P:
        w, h, d = (g.ceil(s) for s in p["size"])
        u0, v0 = UV[p["name"]]
        rnd = random.Random(hash(p["name"]) & 0xffff)
        faces = {"east": (u0, v0 + d, d, h), "north": (u0 + d, v0 + d, w, h), "west": (u0 + d + w, v0 + d, d, h),
                 "south": (u0 + 2 * d + w, v0 + d, w, h), "up": (u0 + d, v0, w, d), "down": (u0 + d + w, v0, w, d)}
        for fname, (x, y, fw, fh) in faces.items():
            for b in range(fh):
                for a in range(fw):
                    c = color(p, fname, a, b, fw, fh, rnd, glow)
                    if c is not None:
                        img[y + b, x + a] = tuple(c[:3]) + (255,)
    return img

# ---------------------------------------------------------------- Java
def java_model():
    f = g.f
    lines = []
    for p in P:
        w, h, d = p["size"]; u, v = UV[p["name"]]; ox, oy, oz = p["origin"]; px, py, pz = p["pivot"]; rx, ry, rz = p["rot"]
        tr = (f"ModelTransform.of({f(px)}, {f(py)}, {f(pz)}, {f(rx)}, {f(ry)}, {f(rz)})"
              if (rx or ry or rz) else f"ModelTransform.pivot({f(px)}, {f(py)}, {f(pz)})")
        parent = "rootData" if p["parent"] == "root" else p["parent"] + "Data"
        lines.append(f'ModelPartData {p["name"]}Data = {parent}.addChild("{p["name"]}", ModelPartBuilder.create().uv({u}, {v}).cuboid({f(ox)}, {f(oy)}, {f(oz)}, {f(w)}, {f(h)}, {f(d)}), {tr});')
    build = "\n\t\t".join(lines)
    return f'''package com.amberhall.mod;

import net.minecraft.client.model.ModelData;
import net.minecraft.client.model.ModelPart;
import net.minecraft.client.model.ModelPartBuilder;
import net.minecraft.client.model.ModelPartData;
import net.minecraft.client.model.ModelTransform;
import net.minecraft.client.model.TexturedModelData;
import net.minecraft.client.render.entity.model.EntityModelLayer;
import net.minecraft.client.render.entity.model.SinglePartEntityModel;
import net.minecraft.util.math.MathHelper;

/**
 * Модель светящегося мотылька. Части и текстуры генерирует tools/moth_gen.py,
 * исходник для Blockbench: blockbench/glow_moth.bbmodel.
 */
public class GlowMothModel extends SinglePartEntityModel<GlowMothEntity> {{
	public static final EntityModelLayer LAYER = new EntityModelLayer(AmberhallMod.id("glow_moth"), "main");

	private final ModelPart root;
	private final ModelPart body, head, antennaL, antennaR, wingL, wingR;

	public GlowMothModel(ModelPart root) {{
		this.root = root;
		this.body = root.getChild("body");
		this.head = body.getChild("head");
		this.antennaL = head.getChild("antenna_l");
		this.antennaR = head.getChild("antenna_r");
		this.wingL = body.getChild("wing_l");
		this.wingR = body.getChild("wing_r");
	}}

	public static TexturedModelData getTexturedModelData() {{
		ModelData data = new ModelData();
		ModelPartData rootData = data.getRoot();
		{build}
		return TexturedModelData.of(data, {g.TEX_W}, {g.TEX_H});
	}}

	@Override
	public void setAngles(GlowMothEntity entity, float limbAngle, float limbDistance, float animationProgress, float headYaw, float headPitch) {{
		// мягкие взмахи крыльев вокруг сложенного положения; в полёте — быстрее
		float flap = MathHelper.sin(animationProgress * 0.9f) * 0.75f;
		wingL.roll = -0.3f - flap;
		wingR.roll = 0.3f + flap;
		// тело слегка покачивается, усики дрожат
		body.pitch = 0.25f + MathHelper.sin(animationProgress * 0.45f) * 0.06f;
		float sway = MathHelper.sin(animationProgress * 0.25f) * 0.12f;
		antennaL.roll = -0.3f + sway;
		antennaR.roll = 0.3f - sway;
		head.yaw = headYaw * MathHelper.RADIANS_PER_DEGREE * 0.6f;
		head.pitch = -0.25f + headPitch * MathHelper.RADIANS_PER_DEGREE * 0.6f;
		root.pivotY = 0;
	}}

	@Override
	public ModelPart getPart() {{
		return root;
	}}
}}
'''

def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    img = paint(False); glow = paint(True)
    png = g.png_bytes(img)
    bb = g.bbmodel(png); bb["name"] = bb["model_identifier"] = "glow_moth"
    files = {
        "src/main/java/com/amberhall/mod/GlowMothModel.java": java_model().encode(),
        "src/main/resources/assets/amberhall/textures/entity/glow_moth.png": png,
        "src/main/resources/assets/amberhall/textures/entity/glow_moth_glow.png": g.png_bytes(glow),
        "blockbench/glow_moth.bbmodel": json.dumps(bb, ensure_ascii=False, indent=1).encode(),
    }
    if "--no-write" not in sys.argv:
        for rel, data in files.items():
            full = os.path.join(root, rel); os.makedirs(os.path.dirname(full), exist_ok=True); open(full, "wb").write(data)
        print("written:", ", ".join(files))
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if args:
        from PIL import Image
        comb = img.copy(); m = glow[..., 3] > 0; comb[m] = glow[m]
        for p in P:
            if p["name"] == "wing_l": p["rot"] = (0, 0, -0.9)
            if p["name"] == "wing_r": p["rot"] = (0, 0, 0.9)
        c = (0, 16, 0)
        views = [g.render(comb, 40, 25, size=460, scale=26, center=c), g.render(comb, 90, 5, size=460, scale=26, center=c),
                 g.render(comb, 0, 8, size=460, scale=26, center=c), g.render(comb, 180, 40, size=460, scale=26, center=c)]
        sheet = Image.new("RGB", (920, 920), (150, 190, 235))
        for i, v in enumerate(views): sheet.paste(v, ((i % 2) * 460, (i // 2) * 460))
        sheet.save(args[0])
        Image.fromarray(img).resize((g.TEX_W * 8, g.TEX_H * 8), Image.NEAREST).save(args[0].replace(".png", "_tex.png"))

if __name__ == "__main__":
    main()
