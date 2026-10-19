#!/usr/bin/env python3
"""Бронированная доисторическая рыба (дунклеостей): модель Java, текстура с прозрачными рваными плавниками,
исходник Blockbench и превью. По референсу: оливковая броня со швами, красная пасть с оранжевым дном,
бледные клинки-зубы, маленький красный глаз, раздвоённый хвост.

Использует трассировщик/упаковщик из beetle_gen.py.
Запуск из папки minecraft-mod:  python3 tools/dunk_gen.py [preview.png]
"""
import json, math, os, random, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import beetle_gen as g

g.TEX_W, g.TEX_H = 128, 64
P = g.P
P.clear()
def part(name, parent, pivot, rot, origin, size, kind):
    P.append(dict(name=name, parent=parent, pivot=pivot, rot=rot, origin=origin, size=size, kind=kind))

# ---------------------------------------------------------------- части (y вниз, перед — в -z)
part("head",       "root", (0, 13.5, -5),  (0, 0, 0),        (-4.5, -4.5, -9), (9, 7, 9),   "head")
part("lower_jaw",  "root", (0, 17, -5),    (0.2, 0, 0),      (-4, -1.5, -9),   (8, 3, 9),   "jaw")
# верхние зубы-клинки спереди (две большие бледные пластины) и мелкие зубчики по боковым кромкам
part("blade_l",    "head", (0, 0, 0),      (0, 0, 0),        (1.2, 1.5, -9.4), (2.2, 3.5, 0.8), "blade")
part("blade_r",    "head", (0, 0, 0),      (0, 0, 0),        (-3.4, 1.5, -9.4), (2.2, 3.5, 0.8), "blade")
for i, z in enumerate((-7, -5, -3)):
    part(f"tooth_ul{i}", "head", (0, 0, 0), (0, 0, 0), (-4.4, 1.6, z), (0.7, 1.6 + (i % 2) * .6, 0.7), "tooth")
    part(f"tooth_ur{i}", "head", (0, 0, 0), (0, 0, 0), (3.7, 1.6, z), (0.7, 1.6 + ((i + 1) % 2) * .6, 0.7), "tooth")
for i, x in enumerate((-3, -1, 1, 2.6)):
    part(f"tooth_lf{i}", "lower_jaw", (0, 0, 0), (0, 0, 0), (x, -3, -8.8), (0.7, 1.5 + (i % 2) * .5, 0.7), "tooth")
for i, z in enumerate((-6.5, -4, -1.5)):
    part(f"tooth_ll{i}", "lower_jaw", (0, 0, 0), (0, 0, 0), (-3.9, -3, z), (0.7, 1.5 + (i % 2) * .5, 0.7), "tooth")
    part(f"tooth_lr{i}", "lower_jaw", (0, 0, 0), (0, 0, 0), (3.2, -3, z), (0.7, 1.5 + ((i + 1) % 2) * .5, 0.7), "tooth")
part("eye_l",      "head", (0, 0, 0),      (0, 0, 0),        (4.5, -2.5, -7.5), (1, 2, 2),  "eye")
part("eye_r",      "head", (0, 0, 0),      (0, 0, 0),        (-5.5, -2.5, -7.5), (1, 2, 2), "eye")
part("body",       "root", (0, 14, -5),    (0, 0, 0),        (-4.5, -4.5, 0),  (9, 9, 11),  "body")
part("dorsal",     "root", (0, 9.5, -2),   (-0.35, 0, 0),    (-0.5, -8, -2.5), (1, 8, 5),   "dorsal")
part("body2",      "root", (0, 14.5, 6),   (0, 0, 0),        (-3.5, -3.5, 0),  (7, 7, 6),   "body")
part("tail1",      "body2", (0, 0, 6),     (0, 0, 0),        (-2, -2, 0),      (4, 4, 6),   "tail")
part("tail_up",    "tail1", (0, -1, 6),    (0.55, 0, 0),     (-0.5, -2.5, 0),  (1, 5, 11),  "lobe")
part("tail_dn",    "tail1", (0, 1, 6),     (-0.55, 0, 0),    (-0.5, -2.5, 0),  (1, 5, 11),  "lobe")
part("fin_l",      "root", (4.5, 18.5, -1), (0.35, 0, -0.5),  (0, 0, -2.5),    (1, 6, 6),   "pect")
part("fin_r",      "root", (-4.5, 18.5, -1), (0.35, 0, 0.5),   (-1, 0, -2.5),   (1, 6, 6),   "pect")
part("pelvic_l",   "body2", (2, 3.5, 0),   (0.3, 0, -0.35),  (0, 0, -1.5),     (1, 4, 3),   "pect")
part("pelvic_r",   "body2", (-2, 3.5, 0),  (0.3, 0, 0.35),   (-1, 0, -1.5),    (1, 4, 3),   "pect")
g.BY.clear(); g.BY.update({p["name"]: p for p in P})
g.UV = g.pack()
UV = g.UV

# ---------------------------------------------------------------- палитра (оливковая броня, как на референсе)
def hx(s): return g.hx(s)
OL = [hx(c) for c in ("26240a", "3a3810", "52501a", "686822", "828230", "9c9c44", "b8b860")]
CREAM = [hx(c) for c in ("c4bd92", "e2dcb6", "f6f2d8")]
RED = [hx(c) for c in ("501016", "7e1a1e", "a8281f", "cc3c2a")]
ORG = [hx(c) for c in ("d4560e", "f0801a", "ffa92e", "ffd46a")]

def H(*a): return (hash(a) & 0xffffff) / float(0x1000000)

def olive(name, face, a, b, rnd, bias=0):
    """мягкая пятнистость: клетки 3×3 + шум пикселей, в основном средние тона"""
    cell = H(name, face, (a + (b % 2)) // 3, b // 3)
    i = 3 + (-1 if cell < .28 else (1 if cell > .78 else 0)) + bias
    r = rnd.random()
    if r < .12: i -= 1
    elif r > .9: i += 1
    return OL[max(1, min(5, i))]

def armor(p, face, a, b, fw, fh, rnd):
    """броневые пластины: тёмные швы поперёк, светлое брюхо, бледные пятна на боках"""
    name = p["name"]
    if face == "down":
        return olive(name, face, a, b, rnd, 2)
    c = olive(name, face, a, b, rnd)
    if face == "up":
        if a == fw // 2: return OL[0] if rnd.random() < .9 else OL[1]            # продольный шов по спине
        if b in (fh // 3, 2 * fh // 3) and rnd.random() < .85: return OL[0]    # поперечные швы
        return c
    # боковые и торцевые грани
    seam1, seam2 = max(1, int(fh * .22)), int(fh * .5)
    if b in (seam1, seam2) and rnd.random() < .88: return OL[0] if b == seam1 else OL[1]
    if b > fh * .62:                                                         # брюхо светлее
        c = olive(name, face, a, b, rnd, 2)
        if H(name, face, a // 2, b // 2) < .16: c = CREAM[1] if rnd.random() < .7 else CREAM[0]   # бледные пятна
    if a == 0 or a == fw - 1:
        c = OL[2] if c[0] > OL[2][0] else c
    if b == fh - 1: c = OL[2]
    return c

def color(p, face, a, b, fw, fh, rnd):
    k = p["kind"]
    if k == "head":
        if face == "down":                                      # нёбо: красное, тёмная кромка
            c = RED[1] if H("pal", a // 2, b // 2) < .55 else RED[2]
            if a in (0, fw - 1) or b == 0: c = RED[0]
            return c
        c = armor(p, face, a, b, fw, fh, rnd)
        if face == "north" and b >= fh - 2: c = RED[1]          # тёмный зев под передней губой
        return c
    if k in ("body",):
        return armor(p, face, a, b, fw, fh, rnd)
    if k == "tail":
        return olive(p["name"], face, a, b, rnd, 0 if face != "down" else 1)
    if k == "jaw":
        if face == "up":                                        # дно пасти: красная рамка и оранжевое светящееся поле
            edge = min(a, b, fw - 1 - a, fh - 1 - b)
            if edge == 0: return RED[1] if (a + b) % 2 else RED[2]
            if edge == 1: return ORG[0]
            c = ORG[2] if edge >= 3 else ORG[1]
            if a == fw // 2 or a == fw // 2 - 1 and fw % 2 == 0: c = ORG[0]       # шов посередине
            if edge >= 3 and (a + b) % 3 == 0: c = ORG[3]
            return c
        c = armor(p, face, a, b, fw, fh, rnd)
        if face in ("north", "east", "west", "south") and b == 0: c = CREAM[0] if rnd.random() < .5 else OL[2]   # светлая кромка
        return c
    if k == "blade":
        c = CREAM[1]
        if face in ("east", "west"): c = CREAM[2] if a < fw // 2 else CREAM[1]
        if b == fh - 1: c = CREAM[0]
        return c
    if k == "tooth":
        c = CREAM[1]
        if b >= fh - 1: c = CREAM[0]
        return c
    if k == "eye":
        if face in ("east", "west") and fw >= 2 and fh >= 2:
            if (a, b) == (0, 0) or (a, b) == (fw - 1, 0): return ORG[2]       # красно-оранжевый блик
            return RED[3] if (a + b) % 2 == 0 else RED[2]
        return OL[0]
    if k == "dorsal":
        if face in ("east", "west"):
            c = OL[1] if a % 2 == 0 else OL[4]                                # вертикальные полосы
            if rnd.random() < .12: c = OL[3]
            return c
        return OL[2]
    if k == "lobe":
        # раздвоенный хвост: лопасть сужается к кончику, рваный край (прозрачность)
        if face in ("east", "west"):
            t = (fw - 1 - a) / max(1, fw - 1) if face == "west" else a / max(1, fw - 1)
            keep = int(round(fh * (1 - 0.75 * t))) + (1 if (a % 3 == 0) else 0)
            if b >= keep: return None
            c = OL[1] if (a + b) % 3 == 0 else (OL[3] if rnd.random() < .7 else OL[4])
            return c
        return OL[2]
    if k == "pect":
        if face in ("east", "west"):
            spikes = [8, 5, 7, 4, 8, 5, 6]
            ln = spikes[a % len(spikes)] * fh / 8.0
            if b >= int(round(ln)): return None
            c = OL[1] if b % 3 == 0 else OL[3]
            if a % 2 == 0 and b > 1: c = OL[4]
            return c
        return OL[2]
    return (255, 0, 255, 255)

def paint():
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
                    c = color(p, fname, a, b, fw, fh, rnd)
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
 * Модель бронированной рыбы. Части и текстуру генерирует tools/dunk_gen.py,
 * исходник для Blockbench: blockbench/dunkleosteus.bbmodel.
 */
public class DunkleosteusModel extends SinglePartEntityModel<DunkleosteusEntity> {{
	public static final EntityModelLayer LAYER = new EntityModelLayer(AmberhallMod.id("dunkleosteus"), "main");

	private final ModelPart root;
	private final ModelPart lowerJaw;
	private final ModelPart body2, tail1, tailUp, tailDn;
	private final ModelPart finL, finR, pelvicL, pelvicR;

	public DunkleosteusModel(ModelPart root) {{
		this.root = root;
		this.lowerJaw = root.getChild("lower_jaw");
		this.body2 = root.getChild("body2");
		this.tail1 = body2.getChild("tail1");
		this.tailUp = tail1.getChild("tail_up");
		this.tailDn = tail1.getChild("tail_dn");
		this.finL = root.getChild("fin_l");
		this.finR = root.getChild("fin_r");
		this.pelvicL = body2.getChild("pelvic_l");
		this.pelvicR = body2.getChild("pelvic_r");
	}}

	public static TexturedModelData getTexturedModelData() {{
		ModelData data = new ModelData();
		ModelPartData rootData = data.getRoot();
		{build}
		return TexturedModelData.of(data, {g.TEX_W}, {g.TEX_H});
	}}

	@Override
	public void setAngles(DunkleosteusEntity entity, float limbAngle, float limbDistance, float animationProgress, float headYaw, float headPitch) {{
		// пасть: в бою раскрывается широко и щёлкает, в покое приоткрыта
		if (entity.isAttacking()) {{
			lowerJaw.pitch = 0.75f + MathHelper.sin(animationProgress * 0.5f) * 0.3f;
		}} else {{
			lowerJaw.pitch = 0.2f + MathHelper.sin(animationProgress * 0.1f) * 0.05f;
		}}

		// волна по телу и хвосту: чем быстрее плывёт, тем сильнее изгиб
		float speed = 0.7f + limbDistance * 1.6f;
		float amp = 0.1f + limbDistance * 0.3f;
		float t = animationProgress * 0.15f * speed;
		body2.yaw = MathHelper.sin(t) * amp * 0.6f;
		tail1.yaw = MathHelper.sin(t - 0.9f) * amp;
		tailUp.yaw = MathHelper.sin(t - 1.7f) * amp * 0.7f;
		tailDn.yaw = tailUp.yaw;

		// грудные и брюшные плавники гребут
		float flap = MathHelper.sin(animationProgress * 0.2f) * 0.25f;
		finL.roll = -0.45f - flap;
		finR.roll = 0.45f + flap;
		pelvicL.roll = -0.35f - flap * 0.6f;
		pelvicR.roll = 0.35f + flap * 0.6f;
	}}

	@Override
	public ModelPart getPart() {{
		return root;
	}}
}}
'''

def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    img = paint()
    png = g.png_bytes(img)
    bb = g.bbmodel(png)
    bb["name"] = bb["model_identifier"] = "dunkleosteus"
    files = {
        "src/main/java/com/amberhall/mod/DunkleosteusModel.java": java_model().encode(),
        "src/main/resources/assets/amberhall/textures/entity/dunkleosteus.png": png,
        "blockbench/dunkleosteus.bbmodel": json.dumps(bb, ensure_ascii=False, indent=1).encode(),
    }
    for rel, data in files.items():
        full = os.path.join(root, rel)
        os.makedirs(os.path.dirname(full), exist_ok=True)
        open(full, "wb").write(data)
    print("written:", ", ".join(files))
    if len(sys.argv) > 1:
        from PIL import Image
        for p in P:
            if p["name"] == "lower_jaw": p["rot"] = (0.75, 0, 0)
        c = (0, 14, 2)
        views = [g.render(img, 35, -8, scale=9, center=c), g.render(img, 90, 4, scale=9, center=c),
                 g.render(img, 0, 4, scale=9, center=c), g.render(img, 145, 24, scale=9, center=c)]
        sheet = Image.new("RGB", (600, 600), (235, 235, 235))
        for i, v in enumerate(views):
            sheet.paste(v, ((i % 2) * 300, (i // 2) * 300))
        sheet.save(sys.argv[1])
        Image.fromarray(img).resize((g.TEX_W * 6, g.TEX_H * 6), Image.NEAREST).save(sys.argv[1].replace(".png", "_tex.png"))

if __name__ == "__main__":
    main()
