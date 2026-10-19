#!/usr/bin/env python3
"""Текстуры предметов и блоков мода (16x16, в духе ванильных).

Запуск из папки minecraft-mod:  python3 tools/item_textures.py [preview.png]
"""
import os, random, struct, sys, zlib

def hx(s): s = s.lstrip('#'); return tuple(int(s[i:i+2], 16) for i in (0, 2, 4)) + (255,)
def clamp(v): return max(0, min(255, int(v)))
def shade(c, k): return tuple(clamp(v * k) for v in c[:3]) + (255,)
def mix(a, b, t): return tuple(clamp(a[i] + (b[i] - a[i]) * t) for i in range(3)) + (255,)

CLEAR = (0, 0, 0, 0)
# общая янтарная палитра: тёмный → светлый
A0, A1, A2, A3, A4, A5 = (hx(c) for c in ("4a2204", "7c3d06", "b4600a", "e48f16", "ffbc30", "ffe58c"))
OUT = hx("2a1405")                       # контур: тёплый почти-чёрный

def blank(): return [[CLEAR] * 16 for _ in range(16)]

def from_art(rows, pal):
    assert len(rows) == 16, len(rows)
    img = blank()
    for y, r in enumerate(rows):
        assert len(r) == 16, (y, r)
        for x, ch in enumerate(r):
            if ch != '.': img[y][x] = pal[ch]
    return img

def outline(img, col=OUT):
    """обводка: прозрачные пиксели, касающиеся непрозрачных (включая диагональ)"""
    res = [row[:] for row in img]
    for y in range(16):
        for x in range(16):
            if img[y][x][3] == 0:
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        yy, xx = y + dy, x + dx
                        if (dx or dy) and 0 <= yy < 16 and 0 <= xx < 16 and img[yy][xx][3] and (dx == 0 or dy == 0):
                            res[y][x] = col
    return res

# ------------------------------------------------------------------ янтарь (самоцвет)
def gem():
    art = [
        "................",
        "................",
        "....oooooooo....",
        "...ohHHhhhhmo...",
        "..ohHhhmmmmmMo..",
        ".ohHhmmmmmmMMMo.",
        ".ohhmmmmmmMMMDo.",
        ".ohmmmmmmmMMMDo.",
        ".ommmmmmmMMMDDo.",
        "..ommmmmMMMDDo..",
        "..oommmMMMDDoo..",
        "....ommMMDDo....",
        ".....omMDDo.....",
        "......oDDo......",
        ".......oo.......",
        "................",
    ]
    pal = {'o': hx("3a1a04"), 'D': A1, 'M': A2, 'm': A3, 'h': A4, 'H': A5}
    img = from_art(art, pal)
    # блик-искорка в левом верхнем углу
    for y in range(5, 11): img[y][7] = A4 if y < 9 else A3          # центральная грань-ребро
    for x in range(5, 10): img[6][x] = A4 if x != 7 else A5            # линия «короны»
    img[7][4] = A4; img[8][5] = A4
    img[4][4] = A5; img[5][3] = A5; img[3][4] = hx("ffffff")
    return img

# ------------------------------------------------------------------ камень (основа руды)
STONE = [hx(c) for c in ("5c5c5c", "6b6b6b", "7d7d7d", "8a8a8a", "9a9a9a")]
def stone(seed):
    rnd = random.Random(seed)
    img = blank()
    for y in range(16):
        for x in range(16):
            v = rnd.random()
            i = 2
            if v < .16: i = 1
            elif v < .24: i = 0
            elif v > .86: i = 3
            elif v > .95: i = 4
            img[y][x] = STONE[i]
    # несколько «трещинок» и светлых пятен, как у ванильного камня
    for _ in range(5):
        x, y = rnd.randrange(14), rnd.randrange(14)
        for dx, dy in ((0, 0), (1, 0), (1, 1)):
            img[y + dy][x + dx] = STONE[0]
    return img

def blob(img, cells, pal_top=A5):
    """янтарный самородок: клетки (x,y) → цвета по положению (блик слева-сверху, тень справа-снизу)"""
    s = set(cells)
    for (x, y) in cells:
        up = (x, y - 1) not in s; left = (x - 1, y) not in s
        down = (x, y + 1) not in s; right = (x + 1, y) not in s
        c = A3
        if up or left: c = A4
        if up and left: c = pal_top
        if down or right: c = A2
        if down and right: c = A1
        img[y][x] = c
    # тёмный контур вокруг самородка
    for (x, y) in cells:
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            xx, yy = x + dx, y + dy
            if (xx, yy) not in s and 0 <= xx < 16 and 0 <= yy < 16:
                img[yy][xx] = mix(STONE[0], hx("3a1a04"), .75)

def ore():
    img = stone(3)
    blob(img, [(2, 2), (3, 2), (4, 2), (2, 3), (3, 3), (4, 3), (5, 3), (3, 4), (4, 4), (5, 4)])
    blob(img, [(9, 1), (10, 1), (8, 2), (9, 2), (10, 2), (11, 2), (10, 3), (11, 3)])
    blob(img, [(4, 8), (5, 8), (6, 8), (3, 9), (4, 9), (5, 9), (6, 9), (7, 9), (4, 10), (5, 10), (6, 10)])
    blob(img, [(10, 8), (11, 8), (12, 8), (10, 9), (11, 9), (12, 9), (13, 9), (11, 10), (12, 10)])
    blob(img, [(9, 13), (10, 13), (11, 13), (10, 14), (11, 14)])
    blob(img, [(1, 13), (2, 13), (1, 14)])
    for (x, y) in ((3, 3), (9, 2), (4, 9), (11, 9)): img[y][x] = A5      # искры
    return img

# ------------------------------------------------------------------ янтарный блок
def block():
    rnd = random.Random(5)
    img = blank()
    for y in range(16):
        for x in range(16):
            # диагональный градиент: светлее сверху-слева, глубже снизу-справа
            t = (x + y) / 30.0
            c = mix(A4, A2, t * 1.05)
            c = shade(c, .96 + rnd.random() * .08)
            img[y][x] = c
    # фаска по краю, как у золотого блока
    for i in range(16):
        img[0][i] = mix(img[0][i], A5, .7); img[i][0] = mix(img[i][0], A5, .55)
        img[15][i] = mix(img[15][i], A0, .65); img[i][15] = mix(img[i][15], A0, .55)
    for i in range(1, 15):
        img[1][i] = mix(img[1][i], A5, .25); img[i][1] = mix(img[i][1], A5, .2)
        img[14][i] = mix(img[14][i], A1, .3); img[i][14] = mix(img[i][14], A1, .25)
    # светлые полосы-блики (диагональ)
    for k in range(2, 8):
        x, y = k + 1, 8 - k + 1
        if 2 <= x <= 13 and 2 <= y <= 13: img[y][x] = mix(img[y][x], A5, .8)
    for k in range(0, 4):
        x, y = 9 + k, 5 - k + 3
        if 2 <= x <= 13 and 2 <= y <= 13: img[y][x] = mix(img[y][x], A5, .55)
    # жучок, застывший в янтаре (как в настоящем янтаре)
    bug = [(9, 9), (10, 9), (11, 9), (8, 10), (9, 10), (10, 10), (11, 10), (12, 10), (9, 11), (10, 11), (11, 11)]
    for (x, y) in bug: img[y][x] = hx("4a2a0e")
    for (x, y) in ((9, 10), (10, 10)): img[y][x] = hx("6a3e14")
    for (x, y) in ((8, 8), (12, 8), (7, 11), (13, 11)): img[y][x] = hx("4a2a0e")     # лапки/усики
    # тёмные трещинки-соты по сторонам
    for (x, y) in ((4, 11), (5, 12), (3, 6), (4, 5)):
        img[y][x] = mix(img[y][x], A1, .5)
    return img

# ------------------------------------------------------------------ меч
WOOD = [hx(c) for c in ("2e1a0a", "4a2c12", "6a4220", "8c5c30")]
GOLD = [hx(c) for c in ("6a4a08", "b08a12", "e8c030", "fff08a")]
def sword():
    img = blank()
    # лезвие шириной в три пикселя: светлое ребро (x+y=14), середина (15), тень (16)
    for x in range(5, 13):
        y = 14 - x
        if y >= 1: img[y][x] = A5 if x % 2 else A4
    for x in range(6, 14):
        y = 15 - x
        if y >= 1: img[y][x] = A4 if x > 9 else A3
    for x in range(7, 14):
        y = 16 - x
        img[y][x] = A2 if x < 11 else A3
    # остриё
    img[1][13] = A5; img[1][14] = A4; img[2][14] = A3; img[0][14] = A5
    # гарда
    for k in range(-3, 4):
        x, y = 5 + k, 10 + k
        if 0 <= x < 16 and 0 <= y < 16: img[y][x] = GOLD[2]
        x2, y2 = 6 + k, 10 + k
        if 0 <= x2 < 16 and 0 <= y2 < 16 and -2 <= k <= 3: img[y2][x2] = GOLD[1]
    img[10][5] = GOLD[3]; img[9][4] = GOLD[3]; img[11][6] = GOLD[0]
    # рукоять и навершие
    for x, y in ((4, 11), (3, 12), (2, 13)):
        img[y][x] = WOOD[3]
    for x, y in ((5, 12), (4, 13), (3, 14)):
        img[y][x] = WOOD[1]
    img[12][4] = WOOD[2]; img[13][3] = WOOD[2]
    img[14][1] = GOLD[2]; img[14][2] = GOLD[1]; img[13][1] = GOLD[3]; img[15][1] = GOLD[0]
    return outline(img)

# ------------------------------------------------------------------ кирка
def pickaxe():
    img = blank()
    # рукоять: диагональ от левого нижнего угла к головке
    for x in range(1, 9):
        y = 15 - x
        img[y][x] = WOOD[3] if x % 2 else WOOD[2]
        img[y + 1][x] = WOOD[1]
    # головка: парабола над хордой (2,4)-(12,14); выпуклость смотрит вверх-вправо
    head = set()
    n = 80
    for i in range(n + 1):
        k = -5 + 10 * i / n
        bulge = 4.2 * (1 - (k / 5) ** 2)
        x, y = round(7 + k + bulge), round(9 + k - bulge)
        head.add((x, y)); head.add((x - 1, y)); head.add((x, y + 1))
    head = {(x, y) for (x, y) in head if 0 <= x < 16 and 0 <= y < 16}
    for (x, y) in head:
        c = A3
        top = (x, y - 1) not in head or (x + 1, y) not in head
        inner = (x, y + 1) not in head or (x - 1, y) not in head
        if top: c = A4
        if inner and not top: c = A2
        img[y][x] = c
    for (x, y) in head:                              # блик на внешней кромке
        if (x, y - 1) not in head and (x + 1, y - 1) not in head: img[y][x] = A5
    # обух: металл-золотая вставка там, где рукоять входит в головку
    for (x, y) in ((8, 7), (9, 6)):
        img[y][x] = GOLD[1]
    img[7][9] = GOLD[2]; img[6][8] = GOLD[2]
    return outline(img)

def rage_icon():
    art = [
        "..................",
        "........oo........",
        ".......oRRo..o....",
        "..o....oRRRooRo...",
        ".oRo..oRRRRRRRRo..",
        ".oRRooRRYYYYRRRRo.",
        ".oRRRRRYYYYYYRRRo.",
        "..oRRRYYYYYYYYRRo.",
        "..oRRYYyYYYYyYYRo.",
        "..oRRYkkYYYYkkYRo.",
        "..oRRYYkkYYkkYYRo.",
        "..oRRYYWkYYkWYYRo.",
        "..oRRYYYYYYYYYYRo.",
        "...oRRYYkkkkYYRo..",
        "...oRRYkYYYYkYRRo.",
        "....oRRYYYYYYRRo..",
        ".....ooRRRRRRoo...",
        "..................",
    ]
    pal = {'o': hx("3a0d04"), 'R': hx("d8321a"), 'Y': hx("ffb02e"), 'y': hx("ffd86a"), 'k': hx("2a0a04"), 'W': hx("ffe9c0")}
    img = [[CLEAR] * 18 for _ in range(18)]
    for y, r in enumerate(art):
        assert len(r) == 18, (y, r)
        for x, ch in enumerate(r):
            if ch != '.': img[y][x] = pal[ch]
    return img

EXTRA = {"mob_effect/rage": rage_icon}

TEXTURES = {
    "item/amber_gem": gem,
    "item/amber_sword": sword,
    "item/amber_pickaxe": pickaxe,
    "block/amber_ore": ore,
    "block/amber_block": block,
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
    for name, fn in EXTRA.items():
        path = os.path.join(base, name + ".png")
        os.makedirs(os.path.dirname(path), exist_ok=True)
        open(path, "wb").write(png_bytes(fn()))
    print("written:", ", ".join(list(TEXTURES) + list(EXTRA)))
    if len(sys.argv) > 1:
        from PIL import Image
        S = 14
        sheet = Image.new("RGB", (len(imgs) * (16 * S + 12) + 12, 16 * S + 24 + 16 * 2 + 12), (60, 62, 70))
        for i, (name, img) in enumerate(imgs.items()):
            ox, oy = 12 + i * (16 * S + 12), 12
            for y in range(16):
                for x in range(16):
                    bgc = (92, 94, 104) if (x + y) % 2 else (78, 80, 90)
                    px = img[y][x]
                    c = px[:3] if px[3] else bgc
                    for dy in range(S):
                        for dx in range(S):
                            sheet.putpixel((ox + x * S + dx, oy + y * S + dy), c)
            # реальный размер 2x рядом
            for y in range(16):
                for x in range(16):
                    px = img[y][x]
                    if px[3]:
                        for dy in range(2):
                            for dx in range(2):
                                sheet.putpixel((ox + x * 2 + dx, oy + 16 * S + 8 + y * 2 + dy), px[:3])
        sheet.save(sys.argv[1])

if __name__ == "__main__":
    main()
