#!/usr/bin/env python3
"""Картинки для скримеров (процедурные жуткие лица), 512x512 PNG.  Запуск из horror-mod:  python3 tools/make_scares.py"""
import math, os, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageChops

OUT = "src/main/resources/assets/dread/textures/gui"
os.makedirs(OUT, exist_ok=True)
S = 512

def grain(im, amt=28, seed=1):
    r = np.random.default_rng(seed); a = np.asarray(im).astype(np.int16)
    n = r.normal(0, amt, a.shape[:2])[..., None]
    return Image.fromarray(np.clip(a + n, 0, 255).astype(np.uint8))

def vignette(im, red=0.55):
    a = np.asarray(im).astype(np.float32)
    y, x = np.mgrid[0:S, 0:S]; d = np.hypot(x - S / 2, y - S / 2) / (S * 0.72)
    v = np.clip(1 - d ** 2.2, 0, 1)[..., None]
    a *= v
    a[..., 0] += (1 - v[..., 0]) * 0 + (np.clip(d - 0.5, 0, 1) * red * 90)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))

def glitch(im, seed=3, bands=9):
    r = random.Random(seed); out = im.copy()
    for _ in range(bands):
        y = r.randrange(0, S - 20); h = r.randrange(4, 26); dx = r.randrange(-40, 40)
        strip = im.crop((0, y, S, y + h)); out.paste(ImageChops.offset(strip, dx, 0), (0, y))
    a = np.asarray(out).copy(); a[..., 0] = np.roll(a[..., 0], 6, axis=1); a[..., 2] = np.roll(a[..., 2], -6, axis=1)
    return Image.fromarray(a)

def gradient_ellipse(d, box, c_in, c_out, steps=40):
    x0, y0, x1, y1 = box
    for i in range(steps):
        t = i / steps; k = 1 - t
        c = tuple(int(c_out[j] + (c_in[j] - c_out[j]) * t) for j in range(3))
        d.ellipse((x0 + (x1 - x0) * t / 2 * 0.6, y0 + (y1 - y0) * t / 2 * 0.6, x1 - (x1 - x0) * t / 2 * 0.6, y1 - (y1 - y0) * t / 2 * 0.6), fill=c)

def teeth(d, x0, x1, y, h, n, up=True, col=(225, 215, 190), seed=0):
    r = random.Random(seed); w = (x1 - x0) / n
    for i in range(n):
        xx = x0 + i * w + r.uniform(-3, 3); hh = h * r.uniform(0.6, 1.25)
        tip = (xx + w / 2 + r.uniform(-4, 4), y + (hh if up else -hh))
        d.polygon([(xx, y), (xx + w, y), tip], fill=col, outline=(40, 20, 10))

# 1. Бледное лицо: огромный раскрытый рот, чёрные провалы глаз
def face_pale():
    im = Image.new("RGB", (S, S), (6, 4, 4)); d = ImageDraw.Draw(im)
    gradient_ellipse(d, (90, 20, 422, 500), (205, 200, 190), (70, 66, 62))
    for sx in (-1, 1):                                              # глазницы
        cx = S / 2 + sx * 82
        d.ellipse((cx - 55, 150, cx + 55, 262), fill=(0, 0, 0))
        d.ellipse((cx - 5 + sx * 2, 202, cx + 5 + sx * 2, 212), fill=(250, 250, 255))
    d.polygon([(S / 2 - 12, 268), (S / 2 + 12, 268), (S / 2, 300)], fill=(30, 22, 22))   # нос
    d.ellipse((150, 310, 362, 500), fill=(10, 0, 0))                                    # пасть
    teeth(d, 168, 345, 330, 70, 11, True, seed=2); teeth(d, 170, 342, 490, 60, 10, False, seed=5)
    d.ellipse((205, 405, 305, 470), fill=(90, 10, 15))
    im = im.filter(ImageFilter.GaussianBlur(1.2))
    return glitch(vignette(grain(im, 26, 1)), 3)

# 2. Тень: чёрный силуэт на красном, горящие глаза и оскал
def face_shadow():
    im = Image.new("RGB", (S, S), (80, 6, 8)); d = ImageDraw.Draw(im)
    for i in range(60):
        d.ellipse((S / 2 - 300 + i * 4, S / 2 - 300 + i * 4, S / 2 + 300 - i * 4, S / 2 + 300 - i * 4), fill=(int(110 - i * 1.7), 6, 8))
    d.ellipse((70, 40, 442, 560), fill=(4, 2, 2))
    for sx in (-1, 1):
        cx = S / 2 + sx * 92
        d.polygon([(cx - 58, 175 + sx * 25 + 22), (cx + 58, 175 - sx * 25 + 22), (cx + 46, 215 + 22), (cx - 46, 215 + 22)], fill=(255, 245, 235))
        d.ellipse((cx - 8, 192 + 22, cx + 8, 212 + 22), fill=(0, 0, 0))
    d.polygon([(130, 330), (382, 330), (360, 420), (152, 420)], fill=(255, 240, 230))
    for i in range(14):
        x = 152 + i * 16.2; d.polygon([(x, 330), (x + 8, 372), (x + 16, 330)], fill=(4, 2, 2)); d.polygon([(x, 420), (x + 8, 378), (x + 16, 420)], fill=(4, 2, 2))
    im = im.filter(ImageFilter.GaussianBlur(1.5))
    return glitch(vignette(grain(im, 22, 2), 0.7), 7, 12)

# 3. Многоглазое лицо в помехах
def face_eyes():
    im = Image.new("RGB", (S, S), (12, 14, 12)); d = ImageDraw.Draw(im)
    gradient_ellipse(d, (110, 10, 402, 510), (150, 160, 140), (40, 46, 38))
    r = random.Random(11)
    for i in range(11):
        cx, cy = r.randrange(160, 352), r.randrange(60, 330); rr = r.randrange(18, 46)
        d.ellipse((cx - rr * 1.4, cy - rr, cx + rr * 1.4, cy + rr), fill=(235, 230, 220), outline=(10, 0, 0))
        d.ellipse((cx - rr * 0.5, cy - rr * 0.5, cx + rr * 0.5, cy + rr * 0.5), fill=(200, 20, 20)); d.ellipse((cx - rr * 0.2, cy - rr * 0.2, cx + rr * 0.2, cy + rr * 0.2), fill=(0, 0, 0))
    d.rectangle((200, 400, 312, 470), fill=(0, 0, 0)); teeth(d, 200, 312, 400, 36, 8, True, seed=9)
    im = im.filter(ImageFilter.GaussianBlur(1.0))
    return glitch(vignette(grain(im, 30, 3), 0.4), 5, 14)

for i, f in enumerate((face_pale, face_shadow, face_eyes), 1):
    f().save(f"{OUT}/scare_{i}.png")
sheet = Image.new("RGB", (S * 3, S))
for i in range(3): sheet.paste(Image.open(f"{OUT}/scare_{i+1}.png"), (i * S, 0))
sheet.resize((S * 3 // 2, S // 2)).save("/tmp/claude-0/-home-user-Amberhall/50491b7b-da0b-5e5d-9b0d-e6723e52204c/scratchpad/scares.png")
print("ok")
