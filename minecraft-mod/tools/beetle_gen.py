#!/usr/bin/env python3
"""Источник истины для янтарного жука.

Из одного описания частей генерирует:
  * Java-модель      src/main/java/com/amberhall/mod/AmberBeetleModel.java
  * текстуру         src/main/resources/assets/amberhall/textures/entity/amber_beetle.png
  * файл Blockbench  blockbench/amber_beetle.bbmodel
  * превью           (путь передаётся аргументом, по желанию)

Координаты — как в ModelPart: y вниз, земля на y=24, перед зверя смотрит в -z.
Запуск из папки minecraft-mod:  python3 tools/beetle_gen.py [preview.png]
"""
import base64, json, math, os, random, struct, sys, uuid, zlib
import numpy as np

TEX_W, TEX_H = 128, 64

# (имя, родитель, pivot, поворот(pitch,yaw,roll), [кубоиды: (origin, size)])
# Порядок важен только для чтения; uv раскладываются автоматически.
P = []
def part(name, parent, pivot, rot, origin, size, kind):
    P.append(dict(name=name, parent=parent, pivot=pivot, rot=rot, origin=origin, size=size, kind=kind))

part("body",       "root", (0, 20, 1),      (0, 0, 0),       (-3.5, -3, -3),    (7, 5, 8),   "body")
part("abdomen",    "body", (0, 0, 0),       (0, 0, 0),       (-2.5, -2.5, 5),   (5, 4, 3),   "body")
part("thorax",     "root", (0, 20, -2),     (0, 0, 0),       (-3, -3.5, -3),    (6, 5, 3),   "thorax")
part("head",       "root", (0, 20.5, -5),   (0, 0, 0),       (-3, -2, -4),      (6, 4, 4),   "head")
part("eye_l",      "head", (0, 0, 0),       (0, 0, 0),       (3, -1.5, -3.5),   (1, 2, 2),   "eye")
part("eye_r",      "head", (0, 0, 0),       (0, 0, 0),       (-4, -1.5, -3.5),  (1, 2, 2),   "eye")
part("mandible_l", "head", (1.2, 1, -4),    (0, 0.15, 0),    (0, -0.5, -3),     (1, 1, 3),   "mandible")
part("mandible_r", "head", (-1.2, 1, -4),   (0, -0.15, 0),   (-1, -0.5, -3),    (1, 1, 3),   "mandible")
part("antenna_l",  "head", (2, -1.5, -3.5), (-0.7, 0, -0.35), (-0.5, -3, -0.5), (1, 3, 1),  "antenna")
part("antenna_l2", "antenna_l", (0, -3, 0), (-0.55, 0, -0.2), (-0.5, -3, -0.5), (1, 3, 1),   "antenna_tip")
part("antenna_r",  "head", (-2, -1.5, -3.5), (-0.7, 0, 0.35), (-0.5, -3, -0.5), (1, 3, 1), "antenna")
part("antenna_r2", "antenna_r", (0, -3, 0), (-0.55, 0, 0.2),  (-0.5, -3, -0.5), (1, 3, 1),   "antenna_tip")
part("elytra_l",   "root", (0.2, 17, -2),   (0, 0, -0.07),   (0, -2, 0),        (3.8, 3, 9), "shell")
part("elytra_r",   "root", (-0.2, 17, -2),  (0, 0, 0.07),    (-3.8, -2, 0),     (3.8, 3, 9), "shell")
part("crystal_a",  "root", (0, 15.4, 0.5),  (-0.25, 0, 0),   (-1, -4, -1),      (2, 4, 2),  "crystal")
part("crystal_b",  "root", (1.4, 15.6, 3.5), (0.15, 0, 0.35), (-0.75, -3, -0.75), (1.5, 3, 1.5), "crystal")
part("crystal_c",  "root", (-1.4, 15.6, 4), (0.2, 0, -0.4),  (-0.75, -2.5, -0.75), (1.5, 2.5, 1.5), "crystal")
for i, z in enumerate((-2.5, 0.5, 3.5)):
    part(f"leg_l{i}",     "root",       (3, 21.5, z),  (0, 0, -0.25), (0, -0.5, -0.5),  (3.5, 1, 1), "leg")
    part(f"leg_l{i}_low", f"leg_l{i}",  (3.5, 0, 0),   (0, 0, -0.45), (-0.5, 0, -0.5),  (1, 3.5, 1), "leg_low")
    part(f"leg_r{i}",     "root",       (-3, 21.5, z), (0, 0, 0.25),  (-3.5, -0.5, -0.5), (3.5, 1, 1), "leg")
    part(f"leg_r{i}_low", f"leg_r{i}",  (-3.5, 0, 0),  (0, 0, 0.45),  (-0.5, 0, -0.5),  (1, 3.5, 1), "leg_low")
BY = {p["name"]: p for p in P}

def ceil(v): return int(math.ceil(v))

# ---------------------------------------------------------------- раскладка UV (shelf packing)
def pack():
    items = []
    for p in P:
        w, h, d = (ceil(s) for s in p["size"])
        items.append((p["name"], 2 * d + 2 * w, d + h, w, h, d))
    items.sort(key=lambda t: (-t[2], -t[1]))
    x = y = row = 0
    uv = {}
    for name, bw, bh, w, h, d in items:
        if x + bw > TEX_W:
            x, y, row = 0, y + row, 0
        uv[name] = (x, y)
        x += bw
        row = max(row, bh)
        if y + bh > TEX_H:
            raise SystemExit("текстура мала: " + name)
    return uv
UV = pack()

# ---------------------------------------------------------------- палитра
def hx(s): s = s.lstrip('#'); return tuple(int(s[i:i+2], 16) for i in (0, 2, 4))
AMB = [hx(c) for c in ("5a2c04", "8a4506", "c0680a", "ea9618", "ffbe32", "ffe27a")]   # тёмный → светлый
BRN = [hx(c) for c in ("241608", "3a2410", "553418", "73481f", "93602a")]
def clamp(v): return max(0, min(255, int(v)))
def mix(a, b, t): return tuple(clamp(a[i] + (b[i] - a[i]) * t) for i in range(3))
def shade(c, k): return tuple(clamp(v * k) for v in c)

def paint_texture():
    img = np.zeros((TEX_H, TEX_W, 4), np.uint8)
    for p in P:
        w, h, d = (ceil(s) for s in p["size"])
        u0, v0 = UV[p["name"]]
        rnd = random.Random(hash(p["name"]) & 0xffff)
        faces = {"east": (u0, v0 + d, d, h), "north": (u0 + d, v0 + d, w, h), "west": (u0 + d + w, v0 + d, d, h),
                 "south": (u0 + 2 * d + w, v0 + d, w, h), "up": (u0 + d, v0, w, d), "down": (u0 + d + w, v0, w, d)}
        for fname, (x, y, fw, fh) in faces.items():
            for b in range(fh):
                for a in range(fw):
                    img[y + b, x + a] = color(p, fname, a, b, fw, fh, rnd) + (255,)
    return img

def edge_k(a, b, fw, fh, strength=0.16):
    """лёгкая фаска: верх-лево светлее, низ-право темнее"""
    k = 1.0
    if b == 0: k += strength
    if a == 0: k += strength * 0.5
    if b == fh - 1: k -= strength
    if a == fw - 1: k -= strength * 0.5
    return k

def color(p, face, a, b, fw, fh, rnd):
    kind = p["kind"]
    n = rnd.random()
    if kind == "shell":
        top = face == "up"
        if top:
            # соты: тёмные линии ячеек, светлые блики в центре ячейки
            cx, cy = a % 4, b % 4
            base = 3
            if cx == 0 or cy == 0: base = 1 if (a + b) % 2 else 2
            elif cx == 2 and cy == 2: base = 4
            elif n > .9: base = 4
            if a == (fw - 1 if p["name"].endswith("_l") else 0): base = 0      # шов между надкрыльями
            elif a == (fw - 2 if p["name"].endswith("_l") else 1): base = max(base, 2)
            if b == 0: base = 4
            if b >= fh - 2: base = min(base, 2)
        else:
            base = 3 - (b * 3) // max(1, fh)
            if b == 0: base = 4
            if face in ("east", "west") and a in (0, fw - 1): base -= 1
            if n > .9: base += 1
        base = max(0, min(5, base))
        if b == fh - 1 and not top: base = 0
        return AMB[base]
    if kind == "crystal":
        t = (b / max(1, fh - 1)) if face not in ("up", "down") else 0.0
        c = mix(AMB[4], AMB[2], t * 0.9)                      # у основания темнее, к острию ярче
        if face in ("east", "south"): c = shade(c, .78)
        if face == "up": c = AMB[5]
        if a == fw // 2 and face not in ("up", "down"): c = mix(c, AMB[5], .45)   # блик на грани
        return c
    if kind == "body":
        base = BRN[2 if face != "down" else 1]
        c = shade(base, edge_k(a, b, fw, fh, .12) * (0.9 + n * 0.2))
        if face in ("east", "west", "south", "north"):
            if b % 3 == 2: c = AMB[1]                                                # янтарные полосы-сегменты
            elif b % 3 == 0 and a % 2 == 0: c = shade(c, 1.15)
        if face == "up" and b % 3 == 2: c = shade(c, .85)
        if face == "down" and (a + b) % 2 == 0: c = shade(c, .9)
        return c
    if kind == "thorax":
        c = shade(BRN[3], edge_k(a, b, fw, fh, .14) * (0.92 + n * 0.16))
        if face == "up":
            c = mix(c, AMB[2], 0.45)                               # янтарный воротничок
            if a in (0, fw - 1): c = shade(c, .7)
        return c
    if kind == "head":
        c = shade(BRN[3], edge_k(a, b, fw, fh, .14) * (0.92 + n * 0.16))
        if face == "north":
            if b == 0: c = shade(BRN[3], .75)
            if b == 1 and fw >= 5 and a in (1, fw - 2): c = AMB[4]      # блестящие точки-«бровки»
            if b == fh - 1: c = shade(BRN[1], 1.0)                     # тёмная кромка рта
        if face == "up":
            c = mix(c, AMB[1], 0.35)
        return c
    if kind == "eye":
        c = shade(BRN[0], 1.0)
        if (a, b) == (0, 0): c = hx("8a5a22")                      # блик на фасетчатом глазу
        elif (a + b) % 2 == 0: c = BRN[1]
        return c
    if kind == "mandible":
        t = b / max(1, fh - 1)
        c = shade(BRN[1], 1.0 + 0.1 * (n - .5))
        if face in ("north", "up") and a == 0 and b == 0: c = AMB[3]
        return c
    if kind in ("antenna", "antenna_tip"):
        c = shade(BRN[3], 1.0 + 0.15 * (n - .5))
        if kind == "antenna_tip":
            c = mix(AMB[4], AMB[2], b / max(1, fh - 1))
        return c
    if kind == "leg":
        c = shade(BRN[3], edge_k(a, b, fw, fh, .1) * (0.9 + n * 0.2))
        if face == "up" and a in (0, fw - 1): c = mix(c, AMB[2], .55)    # янтарные суставы
        return c
    if kind == "leg_low":
        c = shade(BRN[2], edge_k(a, b, fw, fh, .1) * (0.9 + n * 0.2))
        if b >= fh - 1: c = BRN[0]                                         # тёмная лапка
        if b == 0: c = mix(c, AMB[2], .5)
        return c
    return (255, 0, 255)

# ---------------------------------------------------------------- Java
def f(v):
    s = ("%g" % v)
    return s + "F"

def java_model():
    lines = []
    for p in P:
        w, h, d = p["size"]
        u, v = UV[p["name"]]
        ox, oy, oz = p["origin"]
        px, py, pz = p["pivot"]
        rx, ry, rz = p["rot"]
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
 * Модель янтарного жука. Части и текстура генерируются скриптом tools/beetle_gen.py,
 * исходник для Blockbench лежит в blockbench/amber_beetle.bbmodel.
 */
public class AmberBeetleModel extends SinglePartEntityModel<AmberBeetleEntity> {{
	public static final EntityModelLayer LAYER = new EntityModelLayer(AmberhallMod.id("amber_beetle"), "main");

	private final ModelPart root;
	private final ModelPart head;
	private final ModelPart antennaL, antennaL2, antennaR, antennaR2;
	private final ModelPart mandibleL, mandibleR;
	private final ModelPart elytraL, elytraR;
	private final ModelPart[] legsL = new ModelPart[3];
	private final ModelPart[] legsR = new ModelPart[3];
	private final ModelPart[] lowL = new ModelPart[3];
	private final ModelPart[] lowR = new ModelPart[3];

	public AmberBeetleModel(ModelPart root) {{
		this.root = root;
		this.head = root.getChild("head");
		this.antennaL = head.getChild("antenna_l");
		this.antennaL2 = antennaL.getChild("antenna_l2");
		this.antennaR = head.getChild("antenna_r");
		this.antennaR2 = antennaR.getChild("antenna_r2");
		this.mandibleL = head.getChild("mandible_l");
		this.mandibleR = head.getChild("mandible_r");
		this.elytraL = root.getChild("elytra_l");
		this.elytraR = root.getChild("elytra_r");
		for (int i = 0; i < 3; i++) {{
			legsL[i] = root.getChild("leg_l" + i);
			legsR[i] = root.getChild("leg_r" + i);
			lowL[i] = legsL[i].getChild("leg_l" + i + "_low");
			lowR[i] = legsR[i].getChild("leg_r" + i + "_low");
		}}
	}}

	public static TexturedModelData getTexturedModelData() {{
		ModelData data = new ModelData();
		ModelPartData rootData = data.getRoot();
		{build}
		return TexturedModelData.of(data, {TEX_W}, {TEX_H});
	}}

	@Override
	public void setAngles(AmberBeetleEntity entity, float limbAngle, float limbDistance, float animationProgress, float headYaw, float headPitch) {{
		head.yaw = headYaw * MathHelper.RADIANS_PER_DEGREE * 0.8f;
		head.pitch = headPitch * MathHelper.RADIANS_PER_DEGREE * 0.8f;

		// усики: два сустава покачиваются вразнобой
		float sway = MathHelper.sin(animationProgress * 0.11f) * 0.12f;
		float sway2 = MathHelper.sin(animationProgress * 0.11f + 1.2f) * 0.18f;
		antennaL.roll = -0.35f + sway;
		antennaR.roll = 0.35f - sway;
		antennaL2.roll = -0.2f + sway2;
		antennaR2.roll = 0.2f - sway2;
		antennaL.pitch = antennaR.pitch = -0.7f + MathHelper.sin(animationProgress * 0.07f) * 0.08f;

		// жвалы щёлкают
		float chew = MathHelper.sin(animationProgress * 0.28f) * 0.1f;
		mandibleL.yaw = 0.15f - chew;
		mandibleR.yaw = -0.15f + chew;

		// надкрылья чуть «дышат»
		float breathe = MathHelper.sin(animationProgress * 0.09f) * 0.025f;
		elytraL.roll = -0.07f - breathe;
		elytraR.roll = 0.07f + breathe;

		// ходьба «треногой»: ноги 0 и 2 с одной стороны работают в фазе с ногой 1 с другой
		for (int i = 0; i < 3; i++) {{
			float phase = (i % 2 == 0 ? 0f : MathHelper.PI);
			float swing = MathHelper.cos(limbAngle * 1.5f + phase) * 0.5f * limbDistance;
			float lift = Math.max(0f, MathHelper.sin(limbAngle * 1.5f + phase)) * 0.45f * limbDistance;
			float spread = (i - 1) * 0.35f;
			legsL[i].yaw = spread + swing;
			legsR[i].yaw = -spread + swing;
			legsL[i].roll = -0.3f - lift;
			legsR[i].roll = 0.3f + lift;
			lowL[i].roll = -0.35f + lift * 0.8f;
			lowR[i].roll = 0.35f - lift * 0.8f;
		}}
	}}

	@Override
	public ModelPart getPart() {{
		return root;
	}}
}}
'''

# ---------------------------------------------------------------- Blockbench
def abs_transform(name):
    """4x4 матрица local→model для части (как у ModelPart: pivot, затем Rz·Ry·Rx)."""
    p = BY[name]
    px, py, pz = p["pivot"]
    rx, ry, rz = p["rot"]
    cx, sx, cy, sy, cz, sz = math.cos(rx), math.sin(rx), math.cos(ry), math.sin(ry), math.cos(rz), math.sin(rz)
    Rx = np.array([[1, 0, 0], [0, cx, -sx], [0, sx, cx]])
    Ry = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]])
    Rz = np.array([[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]])
    M = np.eye(4)
    M[:3, :3] = Rz @ Ry @ Rx
    M[:3, 3] = (px, py, pz)
    if p["parent"] != "root":
        M = abs_transform(p["parent"]) @ M
    return M

def bbmodel(png):
    # Blockbench хранит пивоты в мировых координатах (Y вверх, земля = 0) и повороты в градусах.
    elements, nodes = [], {}
    for p in P:
        M = abs_transform(p["name"])
        ax, ay, az = M[:3, 3]
        origin = [round(ax, 4), round(24 - ay, 4), round(az, 4)]
        ox, oy, oz = p["origin"]; w, h, d = p["size"]
        # у повёрнутых частей Blockbench хранит куб в «непоясном» виде + rotation самого куба
        fx, fz = ax + ox, az + oz
        fy = origin[1] - oy - h
        rx, ry, rz = (math.degrees(a) for a in p["rot"])
        eid = str(uuid.uuid4())
        el = {"name": p["name"], "box_uv": True, "rescale": False, "locked": False,
              "from": [round(fx, 4), round(fy, 4), round(fz, 4)], "to": [round(fx + w, 4), round(fy + h, 4), round(fz + d, 4)],
              "autouv": 0, "color": 0, "origin": origin, "uv_offset": list(UV[p["name"]]), "type": "cube", "uuid": eid,
              "faces": {k: {"uv": [0, 0, 0, 0], "texture": 0} for k in ("north", "east", "south", "west", "up", "down")}}
        elements.append(el)
        node = {"name": p["name"], "origin": origin, "rotation": [round(-rx, 3), round(-ry, 3), round(rz, 3)] if False else [0, 0, 0],
                "color": 0, "uuid": str(uuid.uuid4()), "export": True, "isOpen": True, "visibility": True, "autouv": 0, "children": [eid]}
        nodes[p["name"]] = node
    outliner = []
    for p in P:
        (outliner if p["parent"] == "root" else nodes[p["parent"]]["children"]).append(nodes[p["name"]])
    return {"meta": {"format_version": "4.10", "model_format": "modded_entity", "box_uv": True},
            "name": "amber_beetle", "model_identifier": "amber_beetle", "visible_box": [1, 1, 0], "variable_placeholders": "",
            "variable_placeholder_buttons": [], "timeline_setups": [], "unhandled_root_fields": {},
            "resolution": {"width": TEX_W, "height": TEX_H}, "elements": elements, "outliner": outliner,
            "textures": [{"path": "", "name": "amber_beetle.png", "folder": "", "namespace": "", "id": "0", "width": TEX_W, "height": TEX_H,
                          "uv_width": TEX_W, "uv_height": TEX_H, "particle": False, "render_mode": "default", "render_sides": "auto",
                          "frame_time": 1, "frame_order_type": "loop", "frame_order": "", "frame_interpolate": False, "visible": True,
                          "internal": True, "saved": True, "uuid": str(uuid.uuid4()),
                          "source": "data:image/png;base64," + base64.b64encode(png).decode()}]}

# ---------------------------------------------------------------- PNG
def png_bytes(img):
    raw = b"".join(b"\x00" + img[y].tobytes() for y in range(img.shape[0]))
    def chunk(t, d): return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", img.shape[1], img.shape[0], 8, 6, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))

# ---------------------------------------------------------------- превью (трассировка лучей по кубоидам)
def render(img, yaw_deg, pitch_deg, size=300, scale=15, anim=None, center=(0, 17.0, 1.5)):
    from PIL import Image
    yaw, pitch = math.radians(yaw_deg), math.radians(pitch_deg)
    eye = np.array([math.sin(yaw) * math.cos(pitch), -math.sin(pitch), -math.cos(yaw) * math.cos(pitch)])
    fwd = -eye / np.linalg.norm(eye)
    up_w = np.array([0, -1.0, 0])
    right = np.cross(fwd, up_w); right /= np.linalg.norm(right)
    up = np.cross(right, fwd)
    c = np.array(center, dtype=float)
    xs, ys = np.meshgrid(np.arange(size), np.arange(size))
    sx = (xs - size / 2) / scale
    sy = (size / 2 - ys) / scale
    o = c[None, None, :] - fwd * 80 + sx[..., None] * right + sy[..., None] * up
    dirn = np.broadcast_to(fwd, o.shape)
    best = np.full((size, size), 1e9)
    out = np.zeros((size, size, 4), np.float64)
    light = np.array([-0.4, -0.8, -0.45]); light /= np.linalg.norm(light)
    for p in P:
        M = abs_transform(p["name"])
        if anim and p["name"] in anim:
            pass
        Mi = np.linalg.inv(M)
        ol = o @ Mi[:3, :3].T + Mi[:3, 3]
        dl = dirn @ Mi[:3, :3].T
        ox, oy, oz = p["origin"]; w, h, d = p["size"]
        lo = np.array([ox, oy, oz]); hi = lo + np.array([w, h, d])
        with np.errstate(divide="ignore", invalid="ignore"):
            t1 = (lo - ol) / dl; t2 = (hi - ol) / dl
        tmin = np.minimum(t1, t2); tmax = np.maximum(t1, t2)
        tn = tmin.max(axis=-1); tf = tmax.min(axis=-1)
        axis = tmin.argmax(axis=-1)
        hit = (tn <= tf) & (tf > 0) & (tn < best)
        if not hit.any():
            continue
        pt = ol + dl * tn[..., None]
        u0, v0 = UV[p["name"]]
        W, H, D = ceil(w), ceil(h), ceil(d)
        rel = (pt - lo) / np.array([w, h, d])
        rel = np.clip(rel, 0, 0.9999)
        # какая грань: по оси входа и знаку направления
        sign = np.take_along_axis(dl, axis[..., None], -1)[..., 0] > 0
        tx = np.zeros((size, size)); ty = np.zeros((size, size))
        # east(+x) west(-x) | up(-y в MC) down(+y) | north(-z) south(+z); по раскладке Blockbench
        fx = rel[..., 0] * W; fy = rel[..., 1] * H; fz = rel[..., 2] * D
        # ось x
        m = axis == 0
        east = m & ~sign                    # луч идёт в -x → попали в грань +x
        west = m & sign
        tx[east] = (u0 + (D - fz[east]))
        ty[east] = v0 + D + fy[east]
        tx[west] = u0 + D + W + fz[west]
        ty[west] = v0 + D + fy[west]
        m = axis == 1
        up_ = m & sign                      # луч идёт в +y → попали в грань -y (верх в MC)
        dn = m & ~sign
        tx[up_] = u0 + D + fx[up_]
        ty[up_] = v0 + fz[up_]
        tx[dn] = u0 + D + W + fx[dn]
        ty[dn] = v0 + (D - fz[dn])
        m = axis == 2
        north = m & sign                    # луч идёт в +z → попали в грань -z (перед)
        south = m & ~sign
        tx[north] = u0 + D + (W - fx[north])
        ty[north] = v0 + D + fy[north]
        tx[south] = u0 + 2 * D + W + fx[south]
        ty[south] = v0 + D + fy[south]
        ix = np.clip(tx.astype(int), 0, TEX_W - 1); iy = np.clip(ty.astype(int), 0, TEX_H - 1)
        col = img[iy, ix].astype(np.float64)
        # освещение по нормали в мировых координатах
        nl = np.zeros(o.shape)
        for ax_i in range(3):
            sel = (axis == ax_i)
            sg = np.take_along_axis(dl, axis[..., None], -1)[..., 0]
            vec = np.zeros(3); vec[ax_i] = 1
            nl[sel] = (-np.sign(sg[sel])[:, None]) * vec
        nw = nl @ M[:3, :3].T
        lam = np.clip(-(nw @ light), 0, 1)
        k = 0.55 + 0.5 * lam
        col[..., :3] *= k[..., None]
        sel = hit & (col[..., 3] > 0)
        out[sel] = col[sel]
        best[sel] = tn[sel]
    bg = np.zeros((size, size, 3)) + np.array([34, 36, 44])
    a = (out[..., 3:4] > 0).astype(float)
    res = bg * (1 - a) + out[..., :3] * a
    return Image.fromarray(np.clip(res, 0, 255).astype(np.uint8))

def main():
    img = paint_texture()
    png = png_bytes(img)
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    paths = {
        "src/main/java/com/amberhall/mod/AmberBeetleModel.java": java_model().encode(),
        "src/main/resources/assets/amberhall/textures/entity/amber_beetle.png": png,
        "blockbench/amber_beetle.bbmodel": json.dumps(bbmodel(png), ensure_ascii=False, indent=1).encode(),
    }
    for rel, data in paths.items():
        full = os.path.join(root, rel)
        os.makedirs(os.path.dirname(full), exist_ok=True)
        open(full, "wb").write(data)
    print("written:", ", ".join(paths))
    if len(sys.argv) > 1:
        from PIL import Image
        views = [render(img, 35, 22), render(img, 90, 15), render(img, 180, 20), render(img, 0, 70)]
        sheet = Image.new("RGB", (600, 600))
        for i, v in enumerate(views):
            sheet.paste(v, ((i % 2) * 300, (i // 2) * 300))
        sheet.save(sys.argv[1])
        Image.fromarray(img).resize((TEX_W * 6, TEX_H * 6), Image.NEAREST).save(sys.argv[1].replace(".png", "_tex.png"))

if __name__ == "__main__":
    main()
