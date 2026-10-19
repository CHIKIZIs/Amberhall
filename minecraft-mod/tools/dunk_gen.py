#!/usr/bin/env python3
"""Бронированная доисторическая рыба (дунклеостей) по референсу.

Что взято с референса: золотисто-оливковая палитра (#665a2a и соседние тона), толстые тёмные швы поперёк туловища,
кремовые пятна на боках и брюхе, красная пасть с оранжевым светящимся дном нижней челюсти, зубы-клинки с рваным краем
(прозрачные вырезы в текстуре), узкий спинной плавник в полоску, серповидный хвост-пластина и ласты-веера с зубчатыми краями.

Генерирует Java-модель, текстуру, файл Blockbench и превью (рядом с референсом, если он есть).
Запуск из папки minecraft-mod:  python3 tools/dunk_gen.py [preview.png [reference.png]]
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
part("head",       "root", (0, 12.5, -5),  (0, 0, 0),        (-5.5, -4, -9),   (11, 7, 9),  "head")
part("lower_jaw",  "root", (0, 17, -5),    (0.2, 0, 0),      (-5, -1.5, -9),   (10, 3, 9),  "jaw")
# зубы: тонкие пластины с рваным (пилообразным) краем — форму зубов задаёт прозрачность текстуры
part("tooth_uf",   "head", (0, 0, 0),      (0, 0, 0),        (-5, 2.2, -9.6),  (10, 3, 0.6), "blade_down")
part("tooth_ul",   "head", (0, 0, 0),      (0, 0, 0),        (5.1, 2.4, -9),   (0.6, 2, 9), "saw_down")
part("tooth_ur",   "head", (0, 0, 0),      (0, 0, 0),        (-5.7, 2.4, -9),  (0.6, 2, 9), "saw_down")
part("tooth_lf",   "lower_jaw", (0, 0, 0), (0, 0, 0),        (-5, -3.7, -9.6), (10, 2, 0.6), "saw_up")
part("tooth_ll",   "lower_jaw", (0, 0, 0), (0, 0, 0),        (4.5, -3.7, -9),  (0.6, 2, 9), "saw_up")
part("tooth_lr",   "lower_jaw", (0, 0, 0), (0, 0, 0),        (-5.1, -3.7, -9), (0.6, 2, 9), "saw_up")
part("eye_l",      "head", (0, 0, 0),      (0, 0, 0),        (5.5, -3.2, -7.5), (1, 2, 2), "eye")
part("eye_r",      "head", (0, 0, 0),      (0, 0, 0),        (-6.5, -3.2, -7.5), (1, 2, 2), "eye")
part("body",       "root", (0, 14, -5),    (0, 0, 0),        (-5.5, -5, 0),    (11, 10, 11), "body")
part("dorsal",     "root", (0, 9, -1),     (-0.3, 0, 0),     (-0.5, -8, -2),   (1, 8, 5),  "dorsal")
part("body2",      "root", (0, 14, 6),     (0, 0, 0),        (-4, -4, 0),      (8, 8, 6),  "body")
part("tail1",      "body2", (0, 0, 6),     (0, 0, 0),        (-2.5, -2.5, 0),  (5, 5, 6),  "tail")
part("tail_fin",   "tail1", (0, 0, 6),     (0, 0, 0),        (-0.5, -10, 0),   (1, 20, 12), "crescent")
part("fin_l",      "root", (5.5, 17.5, 0), (0.75, 0, -0.55), (0, 0, -4),       (1, 9, 8),  "fan")
part("fin_r",      "root", (-5.5, 17.5, 0), (0.75, 0, 0.55),  (-1, 0, -4),      (1, 9, 8),  "fan")
part("pelvic_l",   "body2", (3, 3.5, 1),   (0.3, 0, -0.4),   (0, 0, -2),       (1, 6, 4),  "fan")
part("pelvic_r",   "body2", (-3, 3.5, 1),  (0.3, 0, 0.4),    (-1, 0, -2),      (1, 6, 4),  "fan")
g.BY.clear(); g.BY.update({p["name"]: p for p in P})
g.UV = g.pack()
UV = g.UV

# ---------------------------------------------------------------- палитра, снятая с референса
def hx(s): return g.hx(s)
#          0 шов       1 тёмный    2 тень      3 основной  4 светлее   5 верх      6 блик      7 кремовый  8 бледный
OL = [hx(c) for c in ("2c2210", "46391a", "5a4e1e", "665a2a", "7e7236", "948a44", "b0a860", "cdc88a", "e6e2b4")]
RED = [hx(c) for c in ("4a1612", "6e2420", "8e3228", "b04838")]
ORG = [hx(c) for c in ("c8503c", "e86e20", "f89a2c", "ffc05a")]
EYE = [hx(c) for c in ("3a2410", "e8906a", "f6b08a")]

def H(*a): return (hash(a) & 0xffffff) / float(0x1000000)

def mottle(name, face, a, b, rnd, bias=0):
    """тёплый оливковый с пятнами 2×2 (как на референсе): тени, основной, посветлее"""
    cell = H(name, face, (a + (b % 2)) // 2, b // 2)
    i = 3 + (-1 if cell < .3 else (1 if cell > .72 else 0)) + bias
    if rnd.random() < .1: i += rnd.choice((-1, 1))
    return OL[max(1, min(6, i))]

def armor(p, face, a, b, fw, fh, rnd, seams=True):
    """туловище: толстые неровные тёмные швы, кремовые пятна, светлое брюхо"""
    name = p["name"]
    if face == "down":
        return mottle(name, face, a, b, rnd, 1)
    if face == "up":
        c = mottle(name, face, a, b, rnd, 2)
        if a == fw // 2: return OL[1] if rnd.random() < .85 else c               # продольный шов по спине
        if b == fh // 2 and rnd.random() < .7: return OL[2]                      # один поперечный шов
        return c
    c = mottle(name, face, a, b, rnd, 0 if b < fh * .65 else 1)
    if seams:
        s1, s2 = int(fh * .3), int(fh * .55)
        for sb, col in ((s1, OL[0]), (s2, OL[1])):
            if b == sb and rnd.random() < .8: return col
            if b == sb + 1 and rnd.random() < .35: return OL[2]                   # шов толщиной 2 пикселя местами
    if b > fh * .55 and H(name, face, a // 2, b // 2, 7) < .2:                      # кремовые пятна на боках и брюхе
        return OL[7] if rnd.random() < .7 else OL[6]
    if a == 0 or a == fw - 1: c = OL[2] if rnd.random() < .6 else c
    if b == fh - 1: c = OL[2]
    return c

def saw(a, fw, b, fh, lens, up=False):
    """зубчатый край: колонка a оставляет lens[a % n] строк у кромки (вниз — от верха, вверх — от низа)"""
    n = lens[a % len(lens)]
    return (b >= fh - n) if up else (b < n)

def color(p, face, a, b, fw, fh, rnd):
    k = p["kind"]
    if k in ("crescent", "fan", "dorsal") and face not in ("east", "west"):
        return None                                                          # у плоских пластин только боковые грани
    if k == "head":
        if face == "down":                                                  # нёбо: тёмно-красное, пятнистое
            return RED[1 + (1 if H("pal", a // 2, b // 2) > .55 else 0)] if not (a in (0, fw - 1) or b == 0) else RED[0]
        c = armor(p, face, a, b, fw, fh, rnd)
        if face == "north" and b >= fh - 2: c = RED[1]                      # зев под передней губой
        return c
    if k == "body":
        return armor(p, face, a, b, fw, fh, rnd)
    if k == "tail":
        return mottle(p["name"], face, a, b, rnd, 0 if face != "down" else 1)
    if k == "jaw":
        if face == "up":                                                    # дно пасти: розово-красная рамка и оранжевое поле
            edge = min(a, b, fw - 1 - a, fh - 1 - b)
            if edge == 0: return ORG[0] if (a + b) % 3 else RED[3]
            if edge == 1: return RED[3] if rnd.random() < .6 else ORG[0]
            c = ORG[2] if edge >= 3 else ORG[1]
            if a in (fw // 2 - 1, fw // 2): c = ORG[1]                       # шов посередине
            if edge >= 3 and (a * 2 + b) % 5 == 0: c = ORG[3]
            return c
        c = armor(p, face, a, b, fw, fh, rnd, seams=(face != "down"))
        if b == 0 and face in ("north", "east", "west", "south"): c = OL[7] if rnd.random() < .4 else OL[1]
        return c
    if k in ("blade_down", "saw_down", "saw_up"):
        # пластина-зубы: две большие пары клинков спереди, мелкие зубчики по бокам; всё остальное прозрачно
        if face in ("up", "down"): return None
        lens = {"blade_down": [1, 2, 3, 3, 2, 2, 3, 3, 2, 1], "saw_down": [2, 1, 2, 1], "saw_up": [2, 1, 2, 1]}[k]
        if face in ("east", "west") and k == "blade_down": return None
        if face in ("north", "south") and k in ("saw_down", "saw_up"): return None
        if not saw(a, fw, b, fh, lens, up=(k == "saw_up")): return None
        t = (b if k != "saw_up" else fh - 1 - b)
        return OL[8] if t == 0 else (OL[7] if t == 1 else OL[6])
    if k == "eye":
        if face in ("east", "west") and fw >= 2 and fh >= 2:
            if b == 0: return EYE[0]                                        # тёмная кромка сверху
            return EYE[2] if (a, b) == (0, 1) else EYE[1]                   # розово-оранжевый глаз с бликом
        return OL[1]
    if k == "dorsal":
        if face in ("east", "west"):
            stripe = ((a * 2 + b // 3) // 2) % 2                             # диагональные тёмные полосы, как на референсе
            c = OL[1] if stripe == 0 else OL[4]
            if rnd.random() < .12: c = OL[2]
            # рваный верх: срезаем вершину по диагонали
            if b < (a * 2) // 3 - 1: return None
            return c
        return OL[2]
    if k == "crescent":
        # серповидный хвост: вертикальный «стебель» спереди и две зубчатые лопасти, уходящие назад вверх и вниз
        if face in ("east", "west"):
            s = a if face == "west" else fw - 1 - a                         # s=0 — у основания, s=fw-1 — кончик
            top_c = 6.5 - s * 0.5                                           # центр верхней лопасти поднимается к кончику
            bot_c = fh - 1 - top_c
            in_stem = s <= 3 and 2 <= b <= fh - 3
            in_top = s >= 2 and abs(b - top_c) <= 3.0 - s * 0.13 + (0.6 if s % 2 == 0 else -0.2)
            in_bot = s >= 2 and abs(b - bot_c) <= 3.0 - s * 0.13 + (0.6 if s % 2 == 1 else -0.2)
            if not (in_stem or in_top or in_bot): return None
            c = OL[1] if (a + b) % 4 == 0 else (OL[3] if rnd.random() < .65 else OL[4])
            if in_stem and (a + b) % 5 == 0: c = OL[0]
            return c
        return OL[2]
    if k == "fan":
        # веер-плавник: зубчатый нижний край, тёмные жилки
        if face in ("east", "west"):
            spikes = [1.0, .82, .96, .72, 1.0, .8]
            ln = int(round(spikes[a % len(spikes)] * fh))
            if b >= ln: return None
            c = OL[1] if (a + b // 2) % 3 == 0 else OL[3]
            if rnd.random() < .15: c = OL[4]
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
	private final ModelPart body2, tail1, tailFin;
	private final ModelPart finL, finR, pelvicL, pelvicR;

	public DunkleosteusModel(ModelPart root) {{
		this.root = root;
		this.lowerJaw = root.getChild("lower_jaw");
		this.body2 = root.getChild("body2");
		this.tail1 = body2.getChild("tail1");
		this.tailFin = tail1.getChild("tail_fin");
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
		// пасть: в бою широко раскрывается и щёлкает, в покое приоткрыта
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
		tailFin.yaw = MathHelper.sin(t - 1.7f) * amp * 0.8f;

		// грудные и брюшные плавники гребут
		float flap = MathHelper.sin(animationProgress * 0.2f) * 0.25f;
		finL.roll = -0.5f - flap;
		finR.roll = 0.5f + flap;
		pelvicL.roll = -0.4f - flap * 0.6f;
		pelvicR.roll = 0.4f + flap * 0.6f;
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
    if "--no-write" not in sys.argv:
        for rel, data in files.items():
            full = os.path.join(root, rel)
            os.makedirs(os.path.dirname(full), exist_ok=True)
            open(full, "wb").write(data)
        print("written:", ", ".join(files))
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if args:
        from PIL import Image
        for p in P:
            if p["name"] == "lower_jaw": p["rot"] = (0.8, 0, 0)
        c = (0, 14, 2)
        # главный ракурс — как на референсе (слева-спереди-сверху)
        main_view = g.render(img, 40, -22, size=420, scale=12, center=c)
        views = [g.render(img, 90, 4, scale=8, center=c), g.render(img, 0, 4, scale=8, center=c),
                 g.render(img, 145, 24, scale=8, center=c)]
        W = 420 + 300 * 1
        sheet = Image.new("RGB", (840, 720), (232, 232, 232))
        sheet.paste(main_view, (0, 0))
        if len(args) > 1 and os.path.exists(args[1]):
            ref = Image.open(args[1]).convert("RGB")
            ref.thumbnail((420, 420))
            sheet.paste(ref, (420, 0))
        for i, v in enumerate(views):
            sheet.paste(v.resize((280, 280)), (i * 280, 440))
        sheet.save(args[0])
        Image.fromarray(img).resize((g.TEX_W * 6, g.TEX_H * 6), Image.NEAREST).save(args[0].replace(".png", "_tex.png"))

if __name__ == "__main__":
    main()
