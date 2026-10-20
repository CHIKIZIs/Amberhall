#!/usr/bin/env python3
"""Анимированные скримеры: для каждого из 3 существ — серия кадров (рывок на камеру, раскрывающаяся пасть, финальный крик).
Файлы textures/gui/scare_<существо>_<кадр>.png.  Запуск из horror-mod:  python3 tools/make_scares.py [preview.png]"""
import math, os, random, sys
import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

OUT = "src/main/resources/assets/dread/textures/gui"
os.makedirs(OUT, exist_ok=True)
S = 384            # рисуем в 384, сохраняем 256 (дешевле по весу, зернистость от этого только лучше)
OUTS = 256
FRAMES = 8

def smooth(a, b, x): t = min(1, max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t)
def lerp(a, b, t): return a + (b - a) * t

def fnoise(size, seed, scales=(4, 8, 16, 32)):
    r = np.random.default_rng(seed); out = np.zeros((size, size))
    for k, sc in enumerate(scales):
        n = r.standard_normal((sc, sc)); im = Image.fromarray(((n - n.min()) / (n.max() - n.min()) * 255).astype(np.uint8)).resize((size, size), Image.BICUBIC)
        out += np.asarray(im).astype(float) * (0.5 ** k)
    return out / out.max()

def nz_for(w, h, seed, amp):
    n = fnoise(int(max(w, h)) + 1, seed); return (n[:int(h), :int(w)] * amp).astype(np.int16)

def radial(w, h, c_in, c_out, power=1.4):
    y, x = np.mgrid[0:h, 0:w]; d = np.clip(np.hypot((x - w / 2) / (w / 2), (y - h * 0.45) / (h / 2)), 0, 1) ** power
    a = np.zeros((h, w, 3))
    for i in range(3): a[..., i] = c_in[i] * (1 - d) + c_out[i] * d
    return Image.fromarray(a.astype(np.uint8))

def teeth(d, x0, x1, y, h, n, up, seed, col=(214, 204, 176), rot=0):
    r = random.Random(seed); w = (x1 - x0) / n
    for i in range(n):
        xx = x0 + i * w + r.uniform(-1.5, 1.5); hh = h * r.uniform(0.55, 1.3)
        tip = (xx + w / 2 + r.uniform(-3, 3), y + (hh if up else -hh))
        d.polygon([(xx, y), (xx + w, y), tip], fill=col, outline=(30, 16, 10))
        d.line([(xx + w * 0.25, y), tip], fill=(255, 250, 230), width=1)

def finish(im, t, seed, tint=(1.0, 0.85, 0.85), shake=0.0):
    """общая «грязь» кадра: зерно, виньетка, расслоение каналов, помехи, красные прожилки по краям"""
    r = np.random.default_rng(seed); a = np.asarray(im.convert("RGB")).astype(np.float32)
    a *= np.array(tint, np.float32)
    a += r.normal(0, 20 + 14 * shake, a.shape[:2])[..., None]
    y, x = np.mgrid[0:S, 0:S]; d = np.hypot(x - S / 2, y - S / 2) / (S * 0.7)
    v = np.clip(1.08 - d ** 2.1, 0, 1)[..., None]; a *= v
    a[..., 0] += np.clip(d - 0.45, 0, 1) * (80 + 90 * t)                   # кровавые края
    out = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    rr = random.Random(seed)
    for _ in range(int(3 + 9 * shake)):                                        # сдвинутые полосы
        yy = rr.randrange(0, S - 12); hh = rr.randrange(3, 22); dx = rr.randrange(-int(10 + 40 * shake), int(10 + 40 * shake) + 1)
        out.paste(ImageChops.offset(out.crop((0, yy, S, yy + hh)), dx, 0), (0, yy))
    ch = np.asarray(out).copy(); sh = int(2 + 7 * shake)
    ch[..., 0] = np.roll(ch[..., 0], sh, axis=1); ch[..., 2] = np.roll(ch[..., 2], -sh, axis=1)
    return Image.fromarray(ch)

# ------------------------------------------------------------------ 1. Бледный кричащий: лицо несётся на камеру, челюсть отваливается
def scream_face(t, seed):
    im = Image.new("RGB", (S, S), (3, 2, 2)); sz = lerp(70, 410, smooth(0, 1, t) ** 0.8); jaw = smooth(0.25, 0.75, t)
    cx, cy = S / 2 + math.sin(t * 40) * 3 * t, S * 0.40 + lerp(0, 8, t)
    fw, fh = sz * 0.62, sz * 0.86
    skin = radial(int(fw), int(fh), (208, 202, 190), (86, 80, 76)).resize((int(fw), int(fh)))
    nz = nz_for(fw, fh, 5, 70)
    sa = np.asarray(skin).astype(np.int16) - nz[..., None] + 25; skin = Image.fromarray(np.clip(sa, 0, 255).astype(np.uint8))
    mask = Image.new("L", skin.size, 0); ImageDraw.Draw(mask).ellipse((0, 0, skin.width - 1, skin.height - 1), fill=255)
    # волосы: длинные чёрные пряди сзади
    d = ImageDraw.Draw(im); rr = random.Random(seed)
    for _ in range(60):
        x0 = cx + rr.uniform(-fw * 0.55, fw * 0.55); d.line([(x0, cy - fh * 0.45), (x0 + rr.uniform(-30, 30) * (1 + t), cy + fh * rr.uniform(0.3, 1.1))], fill=(8, 6, 6), width=rr.randrange(2, 6))
    im.paste(skin, (int(cx - fw / 2), int(cy - fh / 2)), mask)
    d = ImageDraw.Draw(im)
    for sx in (-1, 1):                                                         # глазницы, постепенно круглеют
        ex, ey = cx + sx * fw * 0.22, cy - fh * 0.12; ew, eh = fw * 0.2, fh * lerp(0.07, 0.12, t)
        d.ellipse((ex - ew, ey - eh, ex + ew, ey + eh), fill=(0, 0, 0))
        d.ellipse((ex - 3, ey - 3, ex + 3, ey + 3), fill=(255, 255, 255))
        for k in range(5):                                                      # кровавые слёзы
            d.line([(ex + k * 3 - 6, ey + eh), (ex + k * 3 - 6 + rr.uniform(-4, 4), ey + eh + fh * rr.uniform(0.08, 0.3) * (0.4 + t))], fill=(120, 6, 8), width=2)
    d.polygon([(cx - fw * 0.04, cy + fh * 0.02), (cx + fw * 0.04, cy + fh * 0.02), (cx, cy + fh * 0.14)], fill=(40, 26, 26))
    # пасть: открывается вниз
    my = cy + fh * 0.22; mw = fw * 0.4; mh = fh * (0.03 + 0.33 * jaw)
    d.ellipse((cx - mw, my - fh * 0.02, cx + mw, my + mh), fill=(6, 0, 0))
    d.ellipse((cx - mw * 0.6, my + mh * 0.45, cx + mw * 0.6, my + mh * 0.95), fill=(110, 12, 18))                # язык
    teeth(d, cx - mw * 0.9, cx + mw * 0.9, my, fh * 0.1, 12, True, seed); teeth(d, cx - mw * 0.8, cx + mw * 0.8, my + mh, fh * 0.09, 11, False, seed + 1)
    return finish(im.filter(ImageFilter.GaussianBlur(0.8 + 1.6 * (1 - t) * 0)), t, seed, (1.0, 0.9, 0.9), shake=t)

# ------------------------------------------------------------------ 2. Тварь из тьмы: шесть красных глаз и горизонтальная пасть, раскрывающаяся на пол-лица
def beast_face(t, seed):
    im = Image.new("RGB", (S, S), (10, 0, 2)); sz = lerp(60, 430, smooth(0, 1, t) ** 0.8); cx, cy = S / 2 + math.sin(t * 55) * 4 * t, S * 0.44
    d = ImageDraw.Draw(im); r = random.Random(seed)
    for i in range(50):                                                         # красное зарево позади
        rr_ = S * (0.9 - i / 70); d.ellipse((S / 2 - rr_, S / 2 - rr_, S / 2 + rr_, S / 2 + rr_), fill=(int(22 + i * 2.4), 0, int(2 + i * 0.1)))
    hw, hh = sz * 0.95, sz * 0.8
    for k in range(7):                                                          # костяные шипы-корона
        ax = cx + (k - 3) * hw * 0.15; d.polygon([(ax - hw * 0.05, cy - hh * 0.42), (ax + hw * 0.05, cy - hh * 0.42), (ax + (k - 3) * 6, cy - hh * (0.62 + 0.1 * (k % 2)))], fill=(30, 24, 20))
    d.ellipse((cx - hw / 2, cy - hh / 2, cx + hw / 2, cy + hh / 2), fill=(4, 2, 2))
    for q in range(40):                                                         # борозды-трещины на коже
        x0 = cx + r.uniform(-hw * 0.4, hw * 0.4); y0 = cy + r.uniform(-hh * 0.4, hh * 0.1); d.line([(x0, y0), (x0 + r.uniform(-14, 14), y0 + r.uniform(8, 30))], fill=(26, 8, 8), width=1)
    for row, ey_ in enumerate((-0.2, -0.08, 0.02)):                             # шесть горящих глаз: две колонки по три
        for sx in (-1, 1):
            ex, ey = cx + sx * hw * (0.12 + 0.08 * row), cy + hh * ey_; w = hw * (0.1 - 0.02 * row)
            d.polygon([(ex - sx * w * 1.2, ey + w * 0.2), (ex + sx * w * 0.9, ey - w * 0.5), (ex + sx * w * 0.8, ey + w * 0.35)], fill=(255, 36, 18))
            d.ellipse((ex - 2.5, ey - 2, ex + 2.5, ey + 3), fill=(255, 235, 210))
    op = smooth(0.2, 0.8, t); my = cy + hh * 0.2; mw = hw * 0.42; mh = hh * 0.36 * op + 4
    d.ellipse((cx - mw, my - mh / 2, cx + mw, my + mh / 2), fill=(70, 4, 8))                                    # пасть
    d.ellipse((cx - mw * 0.55, my - mh * 0.05, cx + mw * 0.55, my + mh * 0.48), fill=(130, 14, 22))             # язык
    d.ellipse((cx - mw * 0.9, my - mh * 0.12, cx + mw * 0.9, my + mh * 0.12), fill=(0, 0, 0)) if op < 0.2 else None
    teeth(d, cx - mw * 0.95, cx + mw * 0.95, my - mh * 0.5, mh * 0.35, 13, True, seed, col=(210, 200, 170))
    teeth(d, cx - mw * 0.9, cx + mw * 0.9, my + mh * 0.5, mh * 0.33, 12, False, seed + 7, col=(210, 200, 170))
    teeth(d, cx - mw * 0.7, cx + mw * 0.7, my - mh * 0.42, mh * 0.2, 9, True, seed + 3, col=(236, 228, 200))
    for k in range(9):                                                          # слюна
        sx = cx + (k - 4) * mw * 0.2; d.line([(sx, my + mh * 0.5), (sx + r.uniform(-4, 4), my + mh * 0.5 + mh * r.uniform(0.2, 0.8))], fill=(170, 150, 150), width=1)
    return finish(im.filter(ImageFilter.GaussianBlur(0.9)), t, seed, (1.0, 0.7, 0.7), shake=t)

# ------------------------------------------------------------------ 3. Улыбающийся: растянутая до ушей улыбка и выпученные глаза
def smiler_face(t, seed):
    im = Image.new("RGB", (S, S), (2, 3, 2)); sz = lerp(70, 430, smooth(0, 1, t) ** 0.8); cx, cy = S / 2 + math.sin(t * 47) * 3 * t, S * 0.42
    fw, fh = sz * 0.7, sz * 0.78
    skin = radial(int(fw), int(fh), (186, 196, 150), (64, 78, 50)); nz = nz_for(fw, fh, 8, 60)
    sa = np.asarray(skin).astype(np.int16) - nz[..., None] + 20; skin = Image.fromarray(np.clip(sa, 0, 255).astype(np.uint8))
    mask = Image.new("L", skin.size, 0); ImageDraw.Draw(mask).ellipse((0, 0, skin.width - 1, skin.height - 1), fill=255)
    im.paste(skin, (int(cx - fw / 2), int(cy - fh / 2)), mask); d = ImageDraw.Draw(im)
    for sx in (-1, 1):                                                          # выпученные глаза с крошечными зрачками
        ex, ey = cx + sx * fw * 0.22, cy - fh * 0.13; er = fw * 0.15
        d.ellipse((ex - er, ey - er, ex + er, ey + er), fill=(238, 232, 214), outline=(60, 10, 10))
        for k in range(9):
            a = k * 0.7; d.line([(ex + math.cos(a) * er, ey + math.sin(a) * er), (ex + math.cos(a) * er * 0.4, ey + math.sin(a) * er * 0.4)], fill=(170, 24, 24), width=1)
        d.ellipse((ex - 4, ey - 4, ex + 4, ey + 4), fill=(0, 0, 0))
    # улыбка от уха до уха: дуга с множеством мелких зубов, растягивается
    sm = smooth(0.15, 0.8, t); mw = fw * (0.34 + 0.2 * sm); my = cy + fh * 0.18; depth = fh * (0.08 + 0.2 * sm)
    pts_top = [(cx + (i / 20 - 0.5) * 2 * mw, my + math.sin(i / 20 * math.pi) * depth * 0.4 - depth * 0.1) for i in range(21)]
    pts_bot = [(cx + (i / 20 - 0.5) * 2 * mw, my + math.sin(i / 20 * math.pi) * depth) for i in range(21)][::-1]
    d.polygon(pts_top + pts_bot, fill=(8, 0, 0))
    for i in range(1, 20):
        x = cx + (i / 20 - 0.5) * 2 * mw; ytop = my + math.sin(i / 20 * math.pi) * depth * 0.4 - depth * 0.1; ybot = my + math.sin(i / 20 * math.pi) * depth
        d.polygon([(x - 3.5, ytop), (x + 3.5, ytop), (x, ytop + (ybot - ytop) * 0.42)], fill=(226, 218, 190)); d.polygon([(x - 3.5, ybot), (x + 3.5, ybot), (x, ybot - (ybot - ytop) * 0.42)], fill=(226, 218, 190))
    return finish(im.filter(ImageFilter.GaussianBlur(0.9)), t, seed, (0.9, 1.0, 0.85), shake=t)

FACES = [scream_face, beast_face, smiler_face]
if __name__ == "__main__":
    for ci, f in enumerate(FACES, 1):
        for k in range(FRAMES):
            t = k / (FRAMES - 1)
            f(t, ci * 100 + k).resize((OUTS, OUTS), Image.LANCZOS).save(f"{OUT}/scare_{ci}_{k}.png", optimize=True)
    if len(sys.argv) > 1:
        sheet = Image.new("RGB", (S * 4, S * 3))
        for ci in range(3):
            for j, k in enumerate((0, 3, 5, 7)):
                sheet.paste(Image.open(f"{OUT}/scare_{ci+1}_{k}.png").resize((S, S)), (j * S, ci * S))
        sheet.resize((S * 4 * 2 // 3, S * 3 * 2 // 3)).save(sys.argv[1])
    print("ok")
