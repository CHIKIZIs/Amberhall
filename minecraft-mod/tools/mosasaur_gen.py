#!/usr/bin/env python3
"""Мозазавр: большой морской хищник (по референсу: синее пятнистое тело, огромная пасть с мелкими зубами).

Генерирует Java-модель, текстуру, файл Blockbench и превью; использует трассировщик из beetle_gen.py.
Запуск из папки minecraft-mod:  python3 tools/mosasaur_gen.py [preview.png]
"""
import json, math, os, random, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import beetle_gen as g

g.TEX_W, g.TEX_H = 128, 128
P = g.P
P.clear()
def part(name, parent, pivot, rot, origin, size, kind):
    P.append(dict(name=name, parent=parent, pivot=pivot, rot=rot, origin=origin, size=size, kind=kind))

# ---------------------------------------------------------------- части (y вниз, перед — в -z)
part("head",       "root", (0, 14, -8),    (0, 0, 0),        (-5, -4, -8),      (10, 6, 10), "head")
part("lower_jaw",  "root", (0, 18, -6),    (0.2, 0, 0),      (-4.5, -2, -10),   (9, 3, 10),  "jaw")
# зубы: тонкие шипы по кромкам обеих челюстей (спереди и по бокам), разной длины
for i, x in enumerate((-4.5, -2.5, -0.5, 1.5, 3.5)):
    part(f"tooth_uf{i}", "head", (0, 0, 0), (0, 0, 0), (x + 0.15, 1.8, -8.3), (0.7, 2 + i % 2, 0.7), "tooth")
for i, z in enumerate((-6.5, -4.5, -2.5, -0.5)):
    part(f"tooth_ul{i}", "head", (0, 0, 0), (0, 0, 0), (-4.9, 1.8, z), (0.7, 2 + i % 2, 0.7), "tooth")
    part(f"tooth_ur{i}", "head", (0, 0, 0), (0, 0, 0), (4.2, 1.8, z), (0.7, 2 + (i + 1) % 2, 0.7), "tooth")
for i, x in enumerate((-3.5, -1.5, 0.5, 2.5)):
    part(f"tooth_lf{i}", "lower_jaw", (0, 0, 0), (0, 0, 0), (x + 0.15, -4.5 + (i % 2) * 0.5, -9.8), (0.7, 2.5 - (i % 2) * 0.5, 0.7), "tooth")
for i, z in enumerate((-8, -6, -4, -2)):
    part(f"tooth_ll{i}", "lower_jaw", (0, 0, 0), (0, 0, 0), (-4.3, -4.5 + (i % 2) * 0.5, z), (0.7, 2.5 - (i % 2) * 0.5, 0.7), "tooth")
    part(f"tooth_lr{i}", "lower_jaw", (0, 0, 0), (0, 0, 0), (3.6, -4.5 + ((i + 1) % 2) * 0.5, z), (0.7, 2.5 - ((i + 1) % 2) * 0.5, 0.7), "tooth")
part("eye_l",      "head", (0, 0, 0),      (0, 0, 0),        (5, -3, -5.5),     (1, 2, 2),   "eye")
part("eye_r",      "head", (0, 0, 0),      (0, 0, 0),        (-6, -3, -5.5),    (1, 2, 2),   "eye")
part("body",       "root", (0, 14.5, 0),   (0, 0, 0),        (-5, -4.5, -6),    (10, 9, 12), "body")
part("dorsal",     "body", (0, -4.5, 0),   (0, 0, 0),        (-0.5, -4, -2),    (1, 4, 7),   "fin")
part("body2",      "root", (0, 14.5, 6),   (0, 0, 0),        (-4, -4, 0),       (8, 8, 9),   "body")
part("tail1",      "body2", (0, 0, 9),     (0, 0, 0),        (-3, -3, 0),       (6, 6, 8),   "tail")
part("tail2",      "tail1", (0, 0, 8),     (0, 0, 0),        (-2, -2, 0),       (4, 4, 7),   "tail")
part("tail_fin",   "tail2", (0, 0, 7),     (0, 0, 0),        (-0.5, -6, 0),     (1, 12, 6),  "fin")
part("fin_l",      "root", (5, 18.5, -3),  (0, 0, 0.55),     (0, -0.5, -2.5),   (7, 1, 5),   "fin")
part("fin_r",      "root", (-5, 18.5, -3), (0, 0, -0.55),    (-7, -0.5, -2.5),  (7, 1, 5),   "fin")
part("hind_l",     "body2", (4, 3.5, 3),   (0, 0, 0.5),      (0, -0.5, -1.5),   (4, 1, 3),   "fin")
part("hind_r",     "body2", (-4, 3.5, 3),  (0, 0, -0.5),     (-4, -0.5, -1.5),  (4, 1, 3),   "fin")
g.BY.clear(); g.BY.update({p["name"]: p for p in P})
g.UV = g.pack()
UV = g.UV

# ---------------------------------------------------------------- палитра
def hx(s): return g.hx(s)
BLUE = [hx(c) for c in ("1b3b86", "2858b8", "3a76dc", "5b95ee")]      # спина: насыщенный «лазурный» с пятнами
SLATE = [hx(c) for c in ("27394c", "34495f", "425b75", "56728f")]     # брюхо/хвост/нижняя челюсть: серо-стальной
PALE = [hx(c) for c in ("7d95ad", "9ab0c6", "b4c6d8")]                # светлый низ
RED = [hx(c) for c in ("5c0f1c", "8c1830", "b8223c", "d63a50")]       # пасть
TEETH = [hx(c) for c in ("b4b4b0", "ececE6", "ffffff")]
CLAW = hx("c01830")

def cell_noise(name, face, a, b, size=3):
    """крупные пятна как в референсе: клетки size×size со случайным тоном, края рваные"""
    seed = (hash((name, face)) & 0xffff)
    ca, cb = (a + (b % 2)) // size, b // size
    r = random.Random(seed * 1009 + ca * 31 + cb * 17)
    return r.random()

def pick(ramp, i, rnd):
    r = rnd.random()
    j = i + (-1 if r < .15 else (1 if r > .88 else 0))
    return ramp[max(0, min(len(ramp) - 1, j))]

def back_color(p, face, a, b, fw, fh, rnd):
    """синяя спина в тёмных пятнах → серо-стальные бока → светлая кромка у брюха"""
    n = cell_noise(p["name"], face, a, b)
    if face == "up":
        i = 0 if n < .3 else (1 if n < .62 else (2 if n < .9 else 3))
        return pick(BLUE, i, rnd)
    if face == "down":
        return pick(PALE, 0 if n < .5 else 1, rnd)
    t = b / max(1, fh - 1)
    if t < .55:
        i = 0 if n < .26 else (1 if n < .6 else (2 if n < .9 else 3))
        return pick(BLUE, i, rnd)
    if t < .8:
        i = 1 if n < .55 else 2
        return pick(SLATE, i + (1 if t < .65 else 0), rnd)
    return pick(PALE, 0 if t > .92 else 1, rnd)

def color(p, face, a, b, fw, fh, rnd):
    k = p["kind"]
    if k == "head":
        if face == "down":                                  # нёбо: красное, пятнистое
            n = cell_noise("pal", face, a, b, 2)
            return pick(RED, 1 if n < .5 else 2, rnd)
        c = back_color(p, face, a, b, fw, fh, rnd)
        if face == "north":
            c = pick(BLUE, 1, rnd) if cell_noise("hn", face, a, b) > .35 else pick(BLUE, 0, rnd)
        return c
    if k == "jaw":
        if face == "up":                                    # дно пасти: красное
            n = cell_noise("jw", face, a, b, 2)
            return pick(RED, 1 if n < .5 else 2, rnd)
        n = cell_noise(p["name"], face, a, b)
        return pick(SLATE, 0 if n < .3 else (1 if n < .7 else 2), rnd)
    if k == "body":
        c = back_color(p, face, a, b, fw, fh, rnd)
        if p["name"] == "body" and face in ("east", "west") and b < fh - 2:
            # три красные царапины наискосок
            for s in range(3):
                x0 = 3 + 3 * s
                if 1 <= b <= 6 and a == x0 + (b // 2):
                    c = CLAW
        return c
    if k == "tail":
        n = cell_noise(p["name"], face, a, b)
        if face == "up": return pick(SLATE, 1 if n < .6 else 2, rnd)
        return pick(SLATE, 0 if n < .3 else (1 if n < .75 else 2), rnd)
    if k == "claw":
        n = cell_noise(p["name"], face, a, b, 2)
        return pick(BLUE, 1 if n < .5 else 2, rnd)
    if k == "tooth":
        c = TEETH[1]
        if b >= fh - 1: c = TEETH[0]
        if a == 0 and face in ("north", "west"): c = TEETH[2]
        return c
    if k == "eye":
        c = hx("0a0a10")
        if face in ("east", "west"):
            if (a, b) == (fw - 1, 0) or (a, b) == (0, 0): c = hx("3a4a78")        # блик
        return c
    if k == "fin":
        n = cell_noise(p["name"], face, a, b, 2)
        c = pick(SLATE, 1 if n < .6 else 2, rnd)
        if (a + b) % 3 == 0: c = pick(SLATE, 3, rnd)                  # лучи
        return c
    return (255, 0, 255, 255)

def paint(fn):
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
                    col = fn(p, fname, a, b, fw, fh, rnd)
                    if col is not None:
                        img[y + b, x + a] = tuple(col[:3]) + (255,)
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
 * Модель мозазавра. Части и текстуру генерирует tools/mosasaur_gen.py,
 * исходник для Blockbench: blockbench/mosasaur.bbmodel.
 */
public class MosasaurModel extends SinglePartEntityModel<MosasaurEntity> {{
	public static final EntityModelLayer LAYER = new EntityModelLayer(AmberhallMod.id("mosasaur"), "main");

	private final ModelPart root;
	private final ModelPart head, lowerJaw;
	private final ModelPart body2, tail1, tail2, tailFin;
	private final ModelPart finL, finR, hindL, hindR;

	public MosasaurModel(ModelPart root) {{
		this.root = root;
		this.head = root.getChild("head");
		this.lowerJaw = root.getChild("lower_jaw");
		this.body2 = root.getChild("body2");
		this.tail1 = body2.getChild("tail1");
		this.tail2 = tail1.getChild("tail2");
		this.tailFin = tail2.getChild("tail_fin");
		this.finL = root.getChild("fin_l");
		this.finR = root.getChild("fin_r");
		this.hindL = body2.getChild("hind_l");
		this.hindR = body2.getChild("hind_r");
	}}

	public static TexturedModelData getTexturedModelData() {{
		ModelData data = new ModelData();
		ModelPartData rootData = data.getRoot();
		{build}
		return TexturedModelData.of(data, {g.TEX_W}, {g.TEX_H});
	}}

	@Override
	public void setAngles(MosasaurEntity entity, float limbAngle, float limbDistance, float animationProgress, float headYaw, float headPitch) {{
		// голова поворачивается за целью
		head.yaw = headYaw * MathHelper.RADIANS_PER_DEGREE * 0.5f;
		lowerJaw.yaw = head.yaw;

		// пасть: в бою раскрывается широко и щёлкает, в покое приоткрыта
		if (entity.isAttacking()) {{
			lowerJaw.pitch = 0.6f + MathHelper.sin(animationProgress * 0.5f) * 0.3f;
		}} else {{
			lowerJaw.pitch = 0.2f + MathHelper.sin(animationProgress * 0.1f) * 0.05f;
		}}

		// волна по телу и хвосту: чем быстрее плывёт, тем сильнее изгиб
		float speed = 0.7f + limbDistance * 1.6f;
		float amp = 0.1f + limbDistance * 0.3f;
		float t = animationProgress * 0.15f * speed;
		body2.yaw = MathHelper.sin(t) * amp * 0.6f;
		tail1.yaw = MathHelper.sin(t - 0.8f) * amp;
		tail2.yaw = MathHelper.sin(t - 1.6f) * amp * 1.3f;
		tailFin.yaw = MathHelper.sin(t - 2.4f) * amp * 1.5f;

		// ласты гребут
		float flap = MathHelper.sin(animationProgress * 0.2f) * 0.3f;
		finL.roll = 0.55f + flap;
		finR.roll = -0.55f - flap;
		hindL.roll = 0.5f - flap * 0.6f;
		hindR.roll = -0.5f + flap * 0.6f;
	}}

	@Override
	public ModelPart getPart() {{
		return root;
	}}
}}
'''

def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    img = paint(color)
    png = g.png_bytes(img)
    bb = g.bbmodel(png)
    bb["name"] = bb["model_identifier"] = "mosasaur"
    files = {
        "src/main/java/com/amberhall/mod/MosasaurModel.java": java_model().encode(),
        "src/main/resources/assets/amberhall/textures/entity/mosasaur.png": png,
        "blockbench/mosasaur.bbmodel": json.dumps(bb, ensure_ascii=False, indent=1).encode(),
    }
    for rel, data in files.items():
        full = os.path.join(root, rel)
        os.makedirs(os.path.dirname(full), exist_ok=True)
        open(full, "wb").write(data)
    print("written:", ", ".join(files))
    if len(sys.argv) > 1:
        from PIL import Image
        for p in P:
            if p["name"] == "lower_jaw": p["rot"] = (0.55, 0, 0)
        views = [g.render(img, 30, -12, scale=9), g.render(img, 90, 5, scale=9), g.render(img, 0, 5, scale=9), g.render(img, 150, 25, scale=9)]
        sheet = Image.new("RGB", (600, 600))
        for i, v in enumerate(views):
            sheet.paste(v, ((i % 2) * 300, (i // 2) * 300))
        sheet.save(sys.argv[1])

if __name__ == "__main__":
    main()
