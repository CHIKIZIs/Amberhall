#!/usr/bin/env python3
"""Глубинный левиафан: оригинальный крупный морской хищник (не ванильная модель).

Тело размером с кита, широкая голова с огромной пастью, ряды зубов-пластин с рваным краем (прозрачность),
горизонтальный хвостовой плавник-«плица», длинные ласты, спинные янтарные кристаллы, светящиеся янтарные глаза.
Рисуется в игре с увеличением (см. LeviathanRenderer). Генерирует Java-модель, текстуру, светящийся слой,
файл Blockbench и превью.

Запуск из папки minecraft-mod:  python3 tools/leviathan_gen.py [preview.png] [--no-write]
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
part("head",       "root", (0, 12, -12),   (0, 0, 0),        (-7, -5, -11),    (14, 8, 12), "head")
part("lower_jaw",  "root", (0, 16.5, -12), (0.25, 0, 0),     (-6.5, -1.5, -12), (13, 4, 12), "jaw")
# зубы: пластины с рваным краем
part("tooth_uf",   "head", (0, 0, 0),      (0, 0, 0),        (-6.5, 2.4, -11.6), (13, 3, 0.6), "saw_down")
part("tooth_ul",   "head", (0, 0, 0),      (0, 0, 0),        (6.4, 2.6, -11),  (0.6, 2, 11), "saw_down")
part("tooth_ur",   "head", (0, 0, 0),      (0, 0, 0),        (-7, 2.6, -11),   (0.6, 2, 11), "saw_down")
part("tooth_lf",   "lower_jaw", (0, 0, 0), (0, 0, 0),        (-6, -3.6, -12.6), (12, 2, 0.6), "saw_up")
part("tooth_ll",   "lower_jaw", (0, 0, 0), (0, 0, 0),        (5.5, -3.6, -12), (0.6, 2, 12), "saw_up")
part("tooth_lr",   "lower_jaw", (0, 0, 0), (0, 0, 0),        (-6.1, -3.6, -12), (0.6, 2, 12), "saw_up")
part("eye_l",      "head", (0, 0, 0),      (0, 0, 0),        (7, -3.5, -8),    (1, 3, 3),   "eye")
part("eye_r",      "head", (0, 0, 0),      (0, 0, 0),        (-8, -3.5, -8),   (1, 3, 3),   "eye")
part("crest_a",    "head", (0, -5, -5),    (-0.35, 0, 0),    (-1, -5, -1),     (2, 5, 2),   "crystal")
part("crest_b",    "head", (3, -5, -3),    (-0.2, 0, 0.35),  (-1, -4, -1),     (2, 4, 2),   "crystal")
part("crest_c",    "head", (-3, -5, -3),   (-0.2, 0, -0.35), (-1, -4, -1),     (2, 4, 2),   "crystal")
part("body",       "root", (0, 12, -12),   (0, 0, 0),        (-7.5, -6.5, 0),  (15, 13, 16), "body")
for i, z in enumerate((2, 6, 10)):
    part(f"spine{i}", "body", (0, -6.5, z), (0, 0, 0),       (-1, -5 + i, -1), (2, 5 - i, 2),   "crystal")
part("body2",      "root", (0, 12, 4),     (0, 0, 0),        (-6, -5.5, 0),    (12, 11, 10), "body")
part("dorsal",     "body2", (0, -5.5, 2),  (-0.25, 0, 0),    (-0.5, -8, -1),   (1, 8, 6),   "fin_tri")
part("tail1",      "body2", (0, 0, 10),    (0, 0, 0),        (-4, -4, 0),      (8, 8, 10),  "tail")
part("tail2",      "tail1", (0, 0, 10),    (0, 0, 0),        (-2.5, -2.5, 0),  (5, 5, 8),   "tail")
part("fluke",      "tail2", (0, 0, 8),     (0, 0, 0),        (-11, -0.5, 0),   (22, 1, 9),  "fluke")
part("fin_l",      "root", (7.5, 17, -6),  (0.3, 0, -0.5),   (0, -0.5, -3.5),  (12, 1, 7),  "flipper")
part("fin_r",      "root", (-7.5, 17, -6), (0.3, 0, 0.5),    (-12, -0.5, -3.5), (12, 1, 7), "flipper")
g.BY.clear(); g.BY.update({p["name"]: p for p in P})
g.UV = g.pack()
UV = g.UV

# ---------------------------------------------------------------- палитра и приятная, спокойная текстура
def hx(s): return g.hx(s)
# единая «глубинная» шкала от спины к брюху: плавный переход вместо шума
BODY = [hx(c) for c in ("0a1840", "122e6a", "1c4894", "2f68c0", "5a8ccc", "98b8de", "cfe0f2")]
AMB = [hx(c) for c in ("b85c00", "f08a10", "ffb828", "ffe27a")]          # янтарь
RED = [hx(c) for c in ("4e0e18", "7e1a26", "a82836", "cc3c4c")]          # пасть
CREAM = [hx(c) for c in ("b8b098", "e2dcc0", "fbf6e4")]                  # зубы
BAYER = [[0, 2], [3, 1]]                                                  # упорядоченное сглаживание границ тонов
TEAL = [hx(c) for c in ("0a2c3e", "0e4a60", "16708a", "2a98ac", "5cbcc8", "a0dcdc", "d4f0ec")]   # бирюзовый оттенок для боков

def H(*a): return (hash(a) & 0xffffff) / float(0x1000000)
def tone(t, a, b, rnd, patch=0.0, teal=0.0):
    """t∈[0,1] сверху вниз → тон шкалы BODY (синий), на боках плавно уходит в бирюзовый; границы сглажены дизерингом"""
    v = t * (len(BODY) - 1) + patch + (BAYER[b % 2][a % 2] - 1.5) * 0.11
    if rnd.random() < .04: v += rnd.choice((-1, 1)) * 0.6
    i = max(0, min(len(BODY) - 1, int(round(v))))
    return g.mix(BODY[i], TEAL[i], teal) if teal > 0 else BODY[i]
def patch(name, face, a, b):
    """низкоконтрастные крупные пятна 4×4: смещают тон не более чем на 0.4"""
    return (H(name, face, (a + (b // 4 % 2) * 2) // 4, b // 4) - .5) * 0.8

def hull(p, face, a, b, fw, fh, rnd):
    name = p["name"]
    if face == "up":
        t = 0.1 + 0.1 * abs(a - fw / 2) / max(1, fw / 2)
        c = tone(t, a, b, rnd, patch(name, face, a, b) + (0.3 if (a + b) % 5 == 0 else 0), 0.0)   # блик вдоль спины
        if a == fw // 2 and b % 2 == 0: c = BODY[0]                                                # тёмный гребень
        return c
    if face == "down":
        c = tone(0.86, a, b, rnd, patch(name, face, a, b) * .4, 0.0)
        if a % 2 == 0: c = g.shade(c, .93)                                                         # продольные складки брюха
        return c
    t = b / max(1, fh - 1)
    w = max(0.0, 1 - abs(t - 0.45) / 0.3) * 0.85                                                  # бирюзовый пояс на боках
    sc = 0.28 if ((a + b) % 4 == 0 or (a - b) % 4 == 0) and 0.12 < t < 0.7 else 0.0               # мягкая чешуя ромбиками
    c = tone(0.1 + 0.8 * t ** 1.15, a, b, rnd, patch(name, face, a, b) + sc, w)
    if t > 0.74 and b % 2 == 0: c = g.shade(c, .93)                                               # складки на нижней части боков
    return c

def color(p, face, a, b, fw, fh, rnd):
    k = p["kind"]
    if k in ("fin_tri", "flipper", "fluke") and face not in ("east", "west", "up", "down"):
        return None
    if k == "head":
        if face == "down":
            r = ((a - (fw - 1) / 2) / (fw / 2)) ** 2 + ((b - (fh - 1) / 2) / (fh / 2)) ** 2
            return RED[2] if r < .35 else (RED[1] if r < .75 else RED[0])
        c = hull(p, face, a, b, fw, fh, rnd)
        if face in ("east", "west") and a >= fw - 3 and b >= fh - 3: c = RED[1]               # уголок пасти
        if face == "north" and b >= fh - 2: c = RED[1]
        return c
    if k == "body":
        c = hull(p, face, a, b, fw, fh, rnd)
        if face in ("east", "west"):
            t = b / max(1, fh - 1)
            if p["name"] == "body":
                if a in (2, 4, 6) and 2 <= b <= 6: c = BODY[0]                                # четыре тонкие жаберные щели
                for s_ in range(3):                                                           # три чётких следа когтей
                    if 9 <= a <= 13 and b == 3 + (a - 9) + s_ * 3: c = AMB[1]
            if abs(t - 0.52) < 0.04 and a % 3 == 1: c = AMB[2]                               # ровная линия светящихся точек по боку
        return c
    if k == "tail":
        c = hull(p, face, a, b, fw, fh, rnd)
        return c
    if k == "jaw":
        if face == "up":                                                                      # дно пасти: радиальный янтарный градиент
            r = max(abs(a - (fw - 1) / 2) / (fw / 2), abs(b - (fh - 1) / 2) / (fh / 2))
            if r > .88: return RED[3] if (a + b) % 2 else RED[2]
            if r > .72: return AMB[0]
            if r > .45: return AMB[1]
            return AMB[2] if (a + b) % 3 else AMB[3]
        c = hull(p, face, a, b, fw, fh, rnd)
        if b == 0 and face in ("north", "east", "west", "south"): c = BODY[3]
        return c
    if k in ("saw_down", "saw_up"):
        if face in ("up", "down"): return None
        if face in ("north", "south") and p["size"][2] > p["size"][0]: return None
        if face in ("east", "west") and p["size"][0] > p["size"][2]: return None
        lens = [3, 2, 3, 2]
        n = lens[a % len(lens)] * fh / 3.0
        if k == "saw_down":
            if b >= max(1, int(round(n * .75))): return None
            t = b
        else:
            if b < fh - max(1, int(round(n * .75))): return None
            t = fh - 1 - b
        return CREAM[2] if t == 0 else (CREAM[1] if t == 1 else CREAM[0])
    if k == "eye":
        if face in ("east", "west") and fw >= 2 and fh >= 2:
            if a == fw // 2 or (fw % 2 == 0 and a == fw // 2 - 1): return hx("140a06")      # вертикальный зрачок
            return AMB[3] if (a, b) == (0, 0) else (AMB[2] if b < fh - 1 else AMB[1])
        return AMB[0]
    if k == "crystal":
        t = b / max(1, fh - 1)
        c = AMB[3] if t < .25 else (AMB[2] if t < .6 else AMB[1])                             # гладкий вертикальный градиент
        if a == 0 and face not in ("up", "down"): c = AMB[3] if t < .6 else AMB[2]            # светлая грань
        if a == fw - 1 and face not in ("up", "down"): c = AMB[0] if t > .3 else AMB[1]       # тёмная грань
        if face == "up": c = AMB[3]
        return c
    if k == "fin_tri":
        if face in ("east", "west"):
            s = a / max(1, fw - 1) if face == "east" else 1 - a / max(1, fw - 1)
            if b < int(s * fh * .55): return None
            return tone(0.16 + 0.35 * (b / max(1, fh - 1)), a, b, rnd, 0)
        return None
    if k in ("flipper", "fluke"):
        if k == "flipper" and face in ("up", "down"):
            s = a / max(1, fw - 1) if p["name"].endswith("_l") else 1 - a / max(1, fw - 1)
            if b > fh * (1 - 0.85 * s): return None
            c = tone(0.14 + 0.45 * s if face == "up" else 0.8, a, b, rnd, 0)
            if (a + b) % 4 == 0 and face == "up": c = BODY[min(len(BODY) - 1, BODY.index(c) + 1)]        # светлые прожилки
            return c
        if k == "fluke" and face in ("up", "down"):
            u = abs(a - (fw - 1) / 2) / ((fw - 1) / 2)
            depth = 3 + 5.5 * u - (2.5 * (1 - u) if u < .25 else 0)
            if b > depth: return None
            c = tone((0.14 + 0.4 * b / max(1, depth)) if face == "up" else 0.82, a, b, rnd, 0)
            if face == "up" and a % 4 == 0 and b > 0: c = BODY[min(len(BODY) - 1, BODY.index(c) + 1)]   # прожилки
            return c
        return None
    return (255, 0, 255, 255)

def glow_color(p, face, a, b, fw, fh, rnd):
    k = p["kind"]
    if k in ("eye", "crystal"):
        return color(p, face, a, b, fw, fh, rnd)
    if k == "jaw" and face == "up":
        c = color(p, face, a, b, fw, fh, rnd)
        return c if c in (AMB[1], AMB[2]) else None
    c = color(p, face, a, b, fw, fh, rnd)
    if k in ("body", "head") and c in (AMB[1], AMB[2]): return c
    return None

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
                    c = fn(p, fname, a, b, fw, fh, rnd)
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
 * Модель глубинного левиафана. Части и текстуры генерирует tools/leviathan_gen.py,
 * исходник для Blockbench: blockbench/leviathan.bbmodel.
 */
public class LeviathanModel extends SinglePartEntityModel<LeviathanEntity> {{
	public static final EntityModelLayer LAYER = new EntityModelLayer(AmberhallMod.id("leviathan"), "main");

	private final ModelPart root;
	private final ModelPart lowerJaw;
	private final ModelPart tail1, tail2, fluke;
	private final ModelPart finL, finR;

	public LeviathanModel(ModelPart root) {{
		this.root = root;
		this.lowerJaw = root.getChild("lower_jaw");
		ModelPart body2 = root.getChild("body2");
		this.tail1 = body2.getChild("tail1");
		this.tail2 = tail1.getChild("tail2");
		this.fluke = tail2.getChild("fluke");
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
	public void setAngles(LeviathanEntity entity, float limbAngle, float limbDistance, float animationProgress, float headYaw, float headPitch) {{
		// пасть: в бою раскрывается во всю ширь и захлопывается, в покое чуть приоткрыта
		if (entity.isAttacking()) {{
			lowerJaw.pitch = 0.8f + MathHelper.sin(animationProgress * 0.4f) * 0.35f;
		}} else {{
			lowerJaw.pitch = 0.22f + MathHelper.sin(animationProgress * 0.07f) * 0.05f;
		}}

		// хвост бьёт по-китовьему: волна вверх-вниз (pitch) от туловища к плавнику
		float speed = 0.6f + limbDistance * 1.4f;
		float amp = 0.08f + limbDistance * 0.22f;
		float t = animationProgress * 0.12f * speed;
		tail1.pitch = MathHelper.sin(t) * amp;
		tail2.pitch = MathHelper.sin(t - 0.9f) * amp * 1.3f;
		fluke.pitch = MathHelper.sin(t - 1.8f) * amp * 1.6f;

		// ласты медленно гребут
		float flap = MathHelper.sin(animationProgress * 0.1f) * 0.18f;
		finL.roll = -0.5f - flap;
		finR.roll = 0.5f + flap;
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
    glow = paint(glow_color)
    png = g.png_bytes(img)
    bb = g.bbmodel(png)
    bb["name"] = bb["model_identifier"] = "leviathan"
    files = {
        "src/main/java/com/amberhall/mod/LeviathanModel.java": java_model().encode(),
        "src/main/resources/assets/amberhall/textures/entity/leviathan.png": png,
        "src/main/resources/assets/amberhall/textures/entity/leviathan_glow.png": g.png_bytes(glow),
        "blockbench/leviathan.bbmodel": json.dumps(bb, ensure_ascii=False, indent=1).encode(),
    }
    if "--no-write" not in sys.argv:
        for rel, data in files.items():
            full = os.path.join(root, rel)
            os.makedirs(os.path.dirname(full), exist_ok=True)
            open(full, "wb").write(data)
        print("written:", ", ".join(files))
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if args:
        from PIL import Image
        comb = img.copy(); m = glow[..., 3] > 0; comb[m] = glow[m]
        for p in P:
            if p["name"] == "lower_jaw": p["rot"] = (0.85, 0, 0)
        c = (0, 12, 6)
        views = [g.render(comb, 40, 14, size=460, scale=7.5, center=c), g.render(comb, 90, 5, size=460, scale=7.5, center=c),
                 g.render(comb, 0, 6, size=460, scale=7.5, center=c), g.render(comb, 150, 24, size=460, scale=7.5, center=c)]
        sheet = Image.new("RGB", (920, 920), (28, 34, 52))
        for i, v in enumerate(views):
            sheet.paste(v, ((i % 2) * 460, (i // 2) * 460))
        sheet.save(args[0])

if __name__ == "__main__":
    main()
