#!/usr/bin/env python3
"""Текстура глубинной акулы: перекраска ванильной текстуры дельфина (та же раскладка UV, поэтому подходит ванильная модель).

Запуск:  python3 tools/shark_texture.py <dolphin.png из клиента Minecraft> <куда сохранить>
Ванильную текстуру можно достать из клиентского jar: assets/minecraft/textures/entity/dolphin.png
"""
import sys
from PIL import Image

def lerp(a, b, t): return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

RAMP = [(0.0, (14, 22, 38)), (0.35, (34, 52, 78)), (0.6, (72, 96, 126)), (0.82, (176, 192, 206)), (1.0, (232, 238, 240))]

def ramp(t):
    t = max(0.0, min(1.0, t))
    for (t0, c0), (t1, c1) in zip(RAMP, RAMP[1:]):
        if t <= t1:
            return lerp(c0, c1, (t - t0) / (t1 - t0))
    return RAMP[-1][1]

def main(src, dst):
    im = Image.open(src).convert("RGBA")
    px = im.load()
    lums = [(0.3 * r + 0.59 * g + 0.11 * b) / 255 for x in range(im.width) for y in range(im.height)
            for (r, g, b, a) in [px[x, y]] if a > 0]
    lo, hi = min(lums), max(lums)
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            l = (0.3 * r + 0.59 * g + 0.11 * b) / 255
            if l < lo + (hi - lo) * 0.18:                       # самые тёмные пиксели ванильной текстуры — глаза: делаем янтарными
                px[x, y] = (255, 176, 32, 255)
                continue
            t = (l - lo) / max(1e-6, hi - lo)
            # растягиваем контраст: спина тёмная, брюхо светлое
            t = max(0.0, min(1.0, (t - 0.45) * 1.9))
            px[x, y] = ramp(t) + (a,)
    im.save(dst)

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
