#!/usr/bin/env python3
"""Текстуры биома «Светящаяся чаща» в ванильном духе: мягкая мозаика из 3–5 близких тонов, без обводок и блёсток.

По манере близки к ванильным warped_wart_block, moss_block, warped_stem и shroomlight, но нарисованы заново:
мох (верх и бок), светящийся ствол (бок и торец), светящаяся шляпка-крона, папоротник и споровая луковица.
Запуск из папки minecraft-mod:  python3 tools/glow_biome_textures.py [preview.png]
"""
import hashlib, math, os, random, struct, sys, zlib

CLEAR = (0, 0, 0, 0)
def hx(s): s = s.lstrip('#'); return tuple(int(s[i:i+2], 16) for i in (0, 2, 4)) + (255,)

MOSS = [hx(c) for c in ("1c5f5c", "1d6d66", "207b72", "268a7c", "30a08a")]            # бирюзовый мох: близкие тона, как у warped_wart_block
MOSS_W = (0.26, 0.30, 0.22, 0.14, 0.08)
DIRT = [hx(c) for c in ("594030", "6a4b37", "7a5a42", "8a6a4e")]
DIRT_W = (0.22, 0.36, 0.28, 0.14)
STEM = [hx(c) for c in ("2e2148", "362753", "3e2d5c", "463564")]                    # индиго-фиолетовая кора, как у warped_stem
STEM_W = (0.22, 0.32, 0.28, 0.18)
VEIN = [hx(c) for c in ("16615b", "136c68", "118066", "14956f")]                    # тёмно-бирюзовые прожилки (≈27% поверхности)
RING = [hx(c) for c in ("1f7478", "2c8c8c", "3aa4a2", "52bcb4", "17525a")]           # торец: кольца
CAP = [hx(c) for c in ("1e3490", "2b52c4", "3f7ae6", "6aa6f6", "a2d0ff", "d8f0ff")]  # шляпка (клетки, как shroomlight)
LEAF = [hx(c) for c in ("1a6a60", "248474", "329c88", "46b49c", "68d0b4")]
STALK = [hx(c) for c in ("14423e", "1c5a52")]
PINK = [hx(c) for c in ("7a2468", "a23488", "c84aa8", "e46cc4", "f6a0dc")]

def H(*a): return int.from_bytes(hashlib.md5(repr(a).encode()).digest()[:4], 'big') / 4294967296.0

# ---------------------------------------------------------------- шум без швов (тайлится по 16×16)
def vnoise(x, y, seed, period):
    """значение-шум с интерполяцией; period — размер решётки (делит 16), результат ∈ [0,1], бесшовный"""
    gx, gy = x / period, y / period
    x0, y0 = int(math.floor(gx)), int(math.floor(gy))
    fx, fy = gx - x0, gy - y0
    n = 16 // period
    def v(i, j): return H(seed, i % n, j % n)
    sx, sy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
    a = v(x0, y0) * (1 - sx) + v(x0 + 1, y0) * sx
    b = v(x0, y0 + 1) * (1 - sx) + v(x0 + 1, y0 + 1) * sx
    return a * (1 - sy) + b * sy

def fbm(x, y, seed):
    """изотропный зернистый шум: случайное поле + усреднение 8 соседей (тайлится) + крупные блоки 2×2"""
    r = lambda i, j: H(seed, i % 16, j % 16)
    nb = sum(r(x + dx, y + dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1) if dx or dy) / 8.0
    return 0.45 * r(x, y) + 0.35 * nb + 0.20 * H(seed + 9, x // 2, y // 2)

def quantize(values, weights):
    """values: словарь (x,y)→число; weights — доли тонов от тёмного к светлому. Возвращает (x,y)→индекс тона."""
    items = sorted(values.items(), key=lambda kv: kv[1])
    n = len(items); total = float(sum(weights)); out = {}; k = 0; acc = 0.0
    for idx, w in enumerate(weights):
        acc += w / total
        limit = int(round(acc * n))
        while k < limit:
            out[items[k][0]] = idx; k += 1
    return out

def noise_tones(seed, weights, extra=None):
    vals = {(x, y): fbm(x, y, seed) + (extra(x, y) if extra else 0) for y in range(16) for x in range(16)}
    return quantize(vals, weights)

def blank(w=16, h=16): return [[CLEAR] * w for _ in range(h)]
def put(img, x, y, c):
    if 0 <= y < len(img) and 0 <= x < len(img[0]): img[y][x] = c

# ---------------------------------------------------------------- светящийся мох: как ванильный мох, но бирюзовый
def moss_top():
    img = blank()
    t = noise_tones(11, MOSS_W)
    for y in range(16):
        for x in range(16):
            img[y][x] = MOSS[t[(x, y)]]
    return img

def moss_side():
    img = blank()
    t = noise_tones(21, DIRT_W)
    for y in range(16):
        for x in range(16):
            img[y][x] = DIRT[t[(x, y)]]
    tm = noise_tones(11, MOSS_W)
    for x in range(16):
        ln = 3 + int(H("mf", x) * 3) + (1 if H("mg", x) > .8 else 0)      # неровный нижний край полосы мха
        for y in range(ln):
            img[y][x] = MOSS[tm[(x, y)]]
    return img

# ---------------------------------------------------------------- светящийся ствол: как warped_stem, но с фиолетово-синей корой
def log_side():
    img = blank()
    t = noise_tones(31, STEM_W)
    for y in range(16):
        for x in range(16):
            img[y][x] = STEM[t[(x, y)]]
    # вертикальные прожилки: у ванильного warped_stem ≈27% пикселей, каждая 1–2 px шириной и 2–5 длиной
    covered = 0
    for i in range(40):
        x = int(H("vx", i) * 16); y = int(H("vy", i) * 16); ln = 2 + int(H("vl", i) * 4)
        for k in range(ln):
            put(img, x, (y + k) % 16, VEIN[int(H("vc", i, k) * 4) % 4])
        if H("vw", i) > .6:
            for k in range(max(1, ln - 1)):
                put(img, (x + 1) % 16, (y + k) % 16, VEIN[int(H("vd", i, k) * 3) % 3])
    return img

def log_top():
    img = blank(); rnd = random.Random(6)
    tb = noise_tones(31, (2.0, 3.0, 2.5, 1.0))
    for y in range(16):
        for x in range(16):
            d = max(abs(x - 7.5), abs(y - 7.5))                      # квадратные кольца, как у торца warped_stem
            ring = int(d)
            if d > 6.5:
                img[y][x] = STEM[tb[(x, y)]]                         # кора по краю
            elif ring in (6, 4, 2):
                img[y][x] = RING[1 if (x + y) % 5 else 0]
            elif ring in (5, 3):
                img[y][x] = RING[2 if rnd.random() < .75 else 3]
            elif ring == 1:
                img[y][x] = RING[3] if rnd.random() < .5 else RING[2]
            else:
                img[y][x] = RING[4]                                  # тёмная сердцевина
    return img

# ---------------------------------------------------------------- светящаяся шляпка: крупные «клетки», как на shroomlight, но холодных тонов
def cap():
    img = blank()
    rnd = random.Random(7)
    seeds = [((gx + 0.2 + H("cs", gx, gy, 0) * 0.6) * 16 / 3, (gy + 0.2 + H("cs", gx, gy, 1) * 0.6) * 16 / 3) for gx in range(3) for gy in range(3)]
    # плюс клетки со сдвигом, чтобы были разных размеров
    seeds += [(H("cx", i) * 16, H("cy", i) * 16) for i in range(3)]
    for y in range(16):
        for x in range(16):
            ds = []
            for (sx, sy) in seeds:
                dx = min(abs(x - sx), 16 - abs(x - sx)); dy = min(abs(y - sy), 16 - abs(y - sy))
                ds.append(math.hypot(dx, dy))
            ds.sort()
            ratio = ds[0] / max(0.01, ds[1])                                # 0 — центр клетки, 1 — граница
            i = 5 - int(ratio * 6.0) + (1 if rnd.random() < .1 else 0) - (1 if rnd.random() < .08 else 0)
            img[y][x] = CAP[max(0, min(5, i))]
    return img

# ---------------------------------------------------------------- растения: простые силуэты, как у ванильных корней и папоротника
def fern():
    img = blank()
    # центральный стебель и боковые листья, простые «веточки» в два-три тона
    def stem(x0, length, lean, top):
        for k in range(length):
            x = x0 + int(round(lean * (k / length)))
            y = 15 - k
            put(img, x, y, STALK[1] if k % 2 else STALK[0])
            if k >= 3 and k % 2 == 1 and k < length - 1:
                w = 1 if k > length - 4 else 2
                for s in range(1, w + 1):
                    c = LEAF[2 + (s > 1)] if k < length - 3 else LEAF[3]
                    put(img, x - s, y, c); put(img, x + s, y, c)
        put(img, x0 + lean, 15 - length, LEAF[4])
        put(img, x0 + lean, 14 - length, LEAF[3])
    stem(7, 12, 0, True)
    stem(5, 8, -2, False)
    stem(10, 9, 2, False)
    for x in range(4, 12):
        put(img, x, 15, LEAF[0] if x % 2 else LEAF[1])
    return img

def bulb():
    img = blank()
    for (x, y) in ((7, 15), (7, 14), (7, 13), (7, 12), (8, 11), (8, 10), (8, 9)):
        put(img, x, y, STALK[1] if y % 2 else STALK[0])
    for (x, y, c) in ((6, 14, LEAF[2]), (5, 13, LEAF[3]), (5, 14, LEAF[1]), (9, 13, LEAF[2]), (10, 12, LEAF[3]), (10, 13, LEAF[1])):
        put(img, x, y, c)
    cx, cy, rx, ry = 8.0, 5.5, 4.3, 3.9
    for y in range(16):
        for x in range(16):
            d = math.hypot((x - cx) / rx, (y - cy) / ry)
            if d <= 1.0:
                # свет слева-сверху, тень справа-снизу, светлое ядро-блик
                lit = 1 - d * .55 + ((cx - x) * .06 + (cy - y) * .08)
                i = max(0, min(4, int(lit * 5.0 - 0.6)))
                if H("bb", x, y) > .93: i = max(0, i - 1)
                put(img, x, y, PINK[i])
    put(img, 6, 3, PINK[4]); put(img, 7, 3, PINK[4]); put(img, 6, 4, PINK[4])
    for x in range(6, 11):
        put(img, x, 9, PINK[0] if x % 2 else PINK[1])                    # нижний край шляпки
    return img

TEXTURES = {
    "block/luminous_moss_top": moss_top, "block/luminous_moss_side": moss_side,
    "block/glow_log": log_side, "block/glow_log_top": log_top,
    "block/glow_cap": cap, "block/glow_fern": fern, "block/spore_bulb": bulb,
}

def png_bytes(img):
    raw = b"".join(b"\x00" + b"".join(bytes(px) for px in row) for row in img)
    def chunk(t, d): return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", len(img[0]), len(img), 8, 6, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))

def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    base = os.path.join(root, "src/main/resources/assets/amberhall/textures")
    imgs = {}
    for name, fn in TEXTURES.items():
        imgs[name] = fn()
        path = os.path.join(base, name + ".png")
        os.makedirs(os.path.dirname(path), exist_ok=True)
        open(path, "wb").write(png_bytes(imgs[name]))
    print("written:", ", ".join(TEXTURES))
    if len(sys.argv) > 1:
        from PIL import Image, ImageDraw
        S = 10
        names = list(imgs)
        W = len(names)
        sheet = Image.new("RGB", (W * (16 * S + 8) + 8, 16 * S + 16 + 48 + 20), (46, 48, 58))
        d = ImageDraw.Draw(sheet)
        for i, name in enumerate(names):
            ox, oy = 8 + i * (16 * S + 8), 8
            for y in range(16):
                for x in range(16):
                    px = imgs[name][y][x]
                    bgc = (66, 68, 80)
                    c = px[:3] if px[3] else bgc
                    d.rectangle([ox + x * S, oy + y * S, ox + x * S + S - 1, oy + y * S + S - 1], fill=c)
            # плитка 3×3 в натуральный размер: видно, как текстура стыкуется сама с собой
            if "fern" not in name and "bulb" not in name:
                for ty in range(3):
                    for tx in range(3):
                        for y in range(16):
                            for x in range(16):
                                sheet.putpixel((ox + tx * 16 + x, oy + 16 * S + 8 + ty * 16 + y), imgs[name][y][x][:3])
        sheet.save(sys.argv[1])

if __name__ == "__main__":
    main()
