#!/usr/bin/env python3
"""Глубинный удильщик: модель (Java), текстура, светящийся слой, файл Blockbench и превью.

Использует трассировщик и упаковщик UV из beetle_gen.py (подменяя список частей).
Запуск из папки minecraft-mod:  python3 tools/angler_gen.py [preview.png]
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

# ------------------------------------------------------------------ части (y вниз, перед — в -z)
# Ваниль любит крупные простые блоки: тело, пасть с зубами, глаза-кубики, плавники-пластины.
part("head",       "root", (0, 15, -1),    (0, 0, 0),        (-4, -4, -5),     (8, 8, 7),   "head")
part("lower_jaw",  "root", (0, 18.5, 0),   (0.25, 0, 0),     (-3.5, -1, -7),   (7, 3, 7),   "jaw")
# зубы: тонкие шипы в два ряда (шахматный порядок), разной длины
for i, (x, h) in enumerate(((-3.5, 3), (-1.5, 2), (0.5, 3), (2.5, 2))):
    part(f"tooth_ua{i}", "head", (0, 0, 0), (0, 0, 0), (x + 0.15, 0.4, -5.3), (0.7, h, 0.7), "tooth")
for i, (x, h) in enumerate(((-2.5, 2), (-0.5, 3), (1.5, 2), (3.0, 3))):
    part(f"tooth_ub{i}", "head", (0, 0, 0), (0, 0, 0), (x + 0.15, 0.4, -4.3), (0.7, h, 0.7), "tooth")
for i, (x, h) in enumerate(((-3, 2), (-1, 3), (1, 2), (2.5, 3))):
    part(f"tooth_la{i}", "lower_jaw", (0, 0, 0), (0, 0, 0), (x + 0.15, -1 - h, -6.6), (0.7, h, 0.7), "tooth")
for i, (x, h) in enumerate(((-2, 3), (0, 2), (2, 3))):
    part(f"tooth_lb{i}", "lower_jaw", (0, 0, 0), (0, 0, 0), (x + 0.15, -1 - h, -5.6), (0.7, h, 0.7), "tooth")
part("eye_l",      "head", (0, 0, 0),      (0, 0, 0),        (4, -3.5, -4.5),  (1, 3, 3),   "eye")
part("eye_r",      "head", (0, 0, 0),      (0, 0, 0),        (-5, -3.5, -4.5), (1, 3, 3),   "eye")
part("stalk1",     "root", (0, 11, -4),    (0.5, 0, 0),      (-0.5, -4, -0.5), (1, 4, 1),   "stalk")
part("stalk2",     "stalk1", (0, -4, 0),   (0.9, 0, 0),      (-0.5, -4, -0.5), (1, 4, 1),   "stalk")
part("lure",       "stalk2", (0, -4, 0),   (0, 0, 0),        (-1.5, -1.5, -1.5), (3, 3, 3), "lure")
part("body",       "root", (0, 15, 1),     (0, 0, 0),        (-3, -3, 0),      (6, 6, 5),   "body")
part("dorsal",     "root", (0, 12, 2),     (0, 0, 0),        (-0.5, -3, 0),    (1, 3, 5),   "fin")
part("tail",       "root", (0, 15, 6),     (0, 0, 0),        (-2, -2, 0),      (4, 4, 4),   "tail")
part("tail_fin",   "tail", (0, 0, 4),      (0, 0, 0),        (-0.5, -4, 0),    (1, 8, 4),   "fin")
part("fin_l",      "root", (3, 18, 1.5),   (0, 0, 0.4),      (0, -0.5, -1.5),  (3, 1, 3),   "fin")
part("fin_r",      "root", (-3, 18, 1.5),  (0, 0, -0.4),     (-3, -0.5, -1.5), (3, 1, 3),   "fin")
g.BY.clear(); g.BY.update({p["name"]: p for p in P})
g.UV = g.pack()
UV = g.UV

# ------------------------------------------------------------------ палитра: приглушённая, с пиксельным шумом, как у ванильных рыб
def hx(s): return g.hx(s)
TOP = [hx(c) for c in ("27363f", "33474f", "40575f", "4f6a72")]       # спина и бока (шумные оттенки одной гаммы)
BEL = [hx(c) for c in ("808b80", "9aa598", "b2bba9")]                 # брюхо
RED = [hx(c) for c in ("5a101a", "8c1826", "b82434", "d23a48")]          # пасть: насыщенный красный с шумом
TEETH = [hx(c) for c in ("a9a9a4", "e4e4dc", "ffffff")]                   # зубы: белые тонкие шипы
BONE = [hx(c) for c in ("a39b7c", "cfc8a6", "e6e0c4")]                # зубы: пожелтевшая кость
SPOT = [hx(c) for c in ("a85f22", "c47a2c", "e09a40")]                # фотофоры
AMB = g.AMB
ORANGE = SPOT[1]
def sh(c, k): return g.shade(c, k)

def pick(ramp, i, rnd, bias=0):
    """шум как в ванили: чаще средний тон, иногда соседний"""
    r = rnd.random()
    j = i + (-1 if r < .2 else (1 if r > .82 else 0)) + bias
    return ramp[max(0, min(len(ramp) - 1, j))]

def body_like(p, face, a, b, fw, fh, rnd, lower_split=0.62):
    if face == "up":
        return pick(TOP, 1, rnd, 0 if a not in (0, fw - 1) else -1)
    if face == "down":
        return pick(BEL, 1, rnd)
    edge = int(fh * lower_split) + ((a * 5 + len(p["name"])) % 3 - 1)      # неровная граница спина/брюхо
    if b < 1: return pick(TOP, 3, rnd)                                      # светлая кромка сверху
    if b < edge: return pick(TOP, 1 + (1 if b < edge // 2 else 0) - (1 if b == edge - 1 else 0), rnd)
    return pick(BEL, 1 if b < fh - 1 else 0, rnd)

def color(p, face, a, b, fw, fh, rnd):
    k = p["kind"]
    if k == "head":
        c = body_like(p, face, a, b, fw, fh, rnd, 0.7)
        if face == "down":                                  # нёбо: красное, зубы по передней и боковым кромкам
            c = pick(RED, 2, rnd)
            edge = min(a, b, fw - 1 - a)                    # b=0 — передний край (перед головы)
            if edge == 0: c = TEETH[2] if (a + b) % 2 == 0 else TEETH[0]
            elif edge == 1 and (a + b) % 3 == 0: c = TEETH[1]
        if face == "north":                             # лицо: верхняя губа, ниже красная пасть с рядом верхних зубов
            c = pick(TOP, 1, rnd) if b < 4 else pick(RED, 2, rnd)
            if b == 3: c = pick(RED, 0, rnd)                                   # линия дёсен
            if b >= 4 and fw > 2 and a in (0, fw - 1): c = pick(RED, 1, rnd)
        if face in ("east", "west") and b >= 5 and (a >= fw - 2 if face == "east" else a <= 1): c = pick(RED, 1, rnd)    # уголок пасти
        return c
    if k == "body":
        c = body_like(p, face, a, b, fw, fh, rnd)
        if face in ("east", "west") and b == int(fh * .62) - 2 and a % 3 == 1: c = SPOT[1]
        if face in ("east", "west") and b == int(fh * .62) - 3 and a % 3 == 1: c = SPOT[2]
        return c
    if k == "tail":
        return body_like(p, face, a, b, fw, fh, rnd, 0.7)
    if k == "tooth":
        c = TEETH[1]
        if b >= fh - 1: c = TEETH[0]                    # кончик чуть темнее
        if a == 0 and face in ("north", "west"): c = TEETH[2]
        return c
    if k == "jaw":
        c = pick(TOP, 1, rnd) if face != "down" else pick(BEL, 1, rnd)
        if face in ("north", "east", "west", "south") and b >= fh - 1 and face != "north": c = pick(TOP, 0, rnd)
        if face == "north" and b == 0: c = TEETH[1] if a % 2 == 0 else pick(RED, 2, rnd)         # зубы на передней кромке челюсти
        if face == "up":
            c = pick(RED, 2, rnd)
            edge = min(a, b, fw - 1 - a)                    # расстояние до левого/правого/переднего края
            if edge == 0: c = TEETH[2] if (b + a) % 2 == 0 else TEETH[0]
            elif edge == 1 and (a + b) % 2 == 1: c = TEETH[1]
        return c
    if k == "eye":
        c = hx("bfae5c")
        if face in ("east", "west"):
            if (a, b) == (fw // 2, fh // 2): c = hx("0b0b0e")                  # зрачок
            elif (a, b) == (fw // 2 - 1, fh // 2 - 1): c = hx("e6dc9a")         # блик
            else: c = pick([hx("8a7b3a"), hx("a69648"), hx("bfae5c")], 1, rnd)
        else:
            c = hx("8a7b3a")
        return c
    if k == "stalk":
        return pick(TOP, 0 if b % 2 else 1, rnd)
    if k == "lure":
        t = b / max(1, fh - 1)
        c = g.mix(AMB[5], AMB[3], t)
        if face == "up": c = AMB[5]
        if face in ("east", "south"): c = sh(c, .85)
        if a == fw // 2 and b == fh // 2 and face in ("north", "west", "east", "south"): c = hx("fff6c8")   # раскалённое ядро
        return c
    if k == "fin":
        c = pick(TOP, 0, rnd)
        if (a + b) % 3 == 0: c = pick(TOP, 2, rnd)                  # лучи плавника
        if b == 0 or a == 0: c = pick(TOP, 3, rnd)
        return c
    return (255, 0, 255, 255)

def glow_color(p, face, a, b, fw, fh, rnd):
    """что светится: приманка и оранжевые точки на боках"""
    k = p["kind"]
    if k == "lure": return color(p, face, a, b, fw, fh, rnd)
    c = color(p, face, a, b, fw, fh, rnd)
    if c in (SPOT[1], SPOT[2]): return c
    return None

def paint(fn, with_alpha):
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

# ------------------------------------------------------------------ Java
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
 * Модель глубинного удильщика. Части и текстуры генерирует tools/angler_gen.py,
 * исходник для Blockbench: blockbench/deep_angler.bbmodel.
 */
public class AnglerModel extends SinglePartEntityModel<AnglerEntity> {{
	public static final EntityModelLayer LAYER = new EntityModelLayer(AmberhallMod.id("deep_angler"), "main");

	private final ModelPart root;
	private final ModelPart lowerJaw;
	private final ModelPart stalk1, stalk2;
	private final ModelPart tail, tailFin;
	private final ModelPart finL, finR;

	public AnglerModel(ModelPart root) {{
		this.root = root;
		this.lowerJaw = root.getChild("lower_jaw");
		this.stalk1 = root.getChild("stalk1");
		this.stalk2 = stalk1.getChild("stalk2");
		this.tail = root.getChild("tail");
		this.tailFin = tail.getChild("tail_fin");
		this.finL = root.getChild("fin_l");
		this.finR = root.getChild("fin_r");
	}}

	public static TexturedModelData getTexturedModelData() {{
		ModelData data = new ModelData();
		ModelPartData rootData = data.getRoot();
		{build}
		return TexturedModelData.of(data, {g.TEX_W}, {g.TEX_H});
	}}

	@Override
	public void setAngles(AnglerEntity entity, float limbAngle, float limbDistance, float animationProgress, float headYaw, float headPitch) {{
		// хвост: волна идёт от туловища к плавнику; чем быстрее плывёт, тем сильнее взмахи
		float speed = 0.8f + limbDistance * 1.5f;
		float amp = 0.18f + limbDistance * 0.35f;
		float t = animationProgress * 0.18f * speed;
		tail.yaw = MathHelper.sin(t) * amp;
		tailFin.yaw = MathHelper.sin(t - 0.9f) * amp * 1.4f;

		// плавники машут
		float flap = MathHelper.sin(animationProgress * 0.22f) * 0.35f;
		finL.roll = 0.35f + flap;
		finR.roll = -0.35f - flap;

		// приманка покачивается, как живая
		stalk1.pitch = 0.55f + MathHelper.sin(animationProgress * 0.09f) * 0.1f;
		stalk2.pitch = 0.9f + MathHelper.sin(animationProgress * 0.09f + 1.0f) * 0.16f;

		// пасть: в бою широко раскрывается и щёлкает, в покое чуть приоткрыта
		if (entity.isAttacking()) {{
			lowerJaw.pitch = 0.55f + MathHelper.sin(animationProgress * 0.7f) * 0.35f;
		}} else {{
			lowerJaw.pitch = 0.1f + MathHelper.sin(animationProgress * 0.12f) * 0.04f;
		}}
	}}

	@Override
	public ModelPart getPart() {{
		return root;
	}}
}}
'''

def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    img = paint(color, True)
    glow = paint(glow_color, True)
    png = g.png_bytes(img)
    bb = g.bbmodel(png)
    bb["name"] = bb["model_identifier"] = "deep_angler"
    files = {
        "src/main/java/com/amberhall/mod/AnglerModel.java": java_model().encode(),
        "src/main/resources/assets/amberhall/textures/entity/deep_angler.png": png,
        "src/main/resources/assets/amberhall/textures/entity/deep_angler_glow.png": g.png_bytes(glow),
        "blockbench/deep_angler.bbmodel": json.dumps(bb, ensure_ascii=False, indent=1).encode(),
    }
    for rel, data in files.items():
        full = os.path.join(root, rel)
        os.makedirs(os.path.dirname(full), exist_ok=True)
        open(full, "wb").write(data)
    print("written:", ", ".join(files))
    if len(sys.argv) > 1:
        from PIL import Image
        # превью: для светящегося слоя дорисовываем glow поверх
        comb = img.copy()
        m = glow[..., 3] > 0
        comb[m] = glow[m]
        g.UV = UV
        views = [g.render(comb, 35, 18, scale=11), g.render(comb, 90, 10, scale=11), g.render(comb, 0, 8, scale=11), g.render(comb, 200, 25, scale=11)]
        sheet = Image.new("RGB", (600, 600))
        for i, v in enumerate(views):
            sheet.paste(v, ((i % 2) * 300, (i // 2) * 300))
        sheet.save(sys.argv[1])

if __name__ == "__main__":
    main()
