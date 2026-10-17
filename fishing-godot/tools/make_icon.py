"""Собирает иконку приложения из 3D-рендера рыбы (tools/icon.gd)."""
import sys, math, random
from PIL import Image, ImageDraw, ImageFilter

src, out = sys.argv[1], sys.argv[2]
S = 1024
random.seed(4)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(len(a)))


def background(size):
    im = Image.new("RGBA", (size, size))
    d = ImageDraw.Draw(im)
    hz = int(size * 0.6)
    top, mid, low = (22, 64, 98), (236, 140, 92), (255, 210, 140)
    for y in range(hz):
        t = y / hz
        c = lerp(top, mid, t ** 1.4) if t < 0.85 else lerp(mid, low, (t - 0.85) / 0.15)
        d.line([(0, y), (size, y)], fill=c + (255,))
    sea_top, sea_low = (40, 120, 128), (10, 52, 66)
    for y in range(hz, size):
        t = (y - hz) / (size - hz)
        d.line([(0, y), (size, y)], fill=lerp(sea_top, sea_low, t ** 0.8) + (255,))
    # солнце с ореолом
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    g = ImageDraw.Draw(glow)
    cx, cy = int(size * 0.3), hz - int(size * 0.02)
    for r in range(int(size * 0.32), 0, -6):
        a = int(150 * (1 - r / (size * 0.32)) ** 2)
        g.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 205, 140, a))
    im.alpha_composite(glow)
    d = ImageDraw.Draw(im)
    rs = int(size * 0.09)
    d.ellipse([cx - rs, cy - rs, cx + rs, cy + rs], fill=(255, 238, 190, 255))
    d.rectangle([0, hz, size, size], fill=None)
    # море поверх нижней половины солнца
    for y in range(hz, size):
        t = (y - hz) / (size - hz)
        d.line([(0, y), (size, y)], fill=lerp(sea_top, sea_low, t ** 0.8) + (255,))
    # солнечная дорожка (мягкие блики)
    gl = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gd = ImageDraw.Draw(gl)
    for i in range(38):
        y = hz + 6 + int((i / 38) ** 1.5 * (size - hz - 20))
        w = int(size * (0.04 + 0.2 * i / 38) * random.uniform(0.35, 1.0))
        x = cx + random.randint(-int(size * 0.06), int(size * 0.06)) - w // 2
        gd.ellipse([x, y, x + w, y + max(3, size // 120)], fill=(255, 220, 165, random.randint(110, 210)))
    im.alpha_composite(gl.filter(ImageFilter.GaussianBlur(max(1, size // 300))))
    d = ImageDraw.Draw(im)
    # силуэт острова
    pts = [(int(size * 0.62), hz)]
    for i in range(12):
        x = size * (0.62 + i * 0.033)
        pts.append((int(x), int(hz - size * (0.05 + 0.04 * math.sin(i * 0.9)) * math.sin(math.pi * i / 11))))
    pts.append((int(size * 1.0), hz))
    d.polygon(pts, fill=(160, 98, 92, 255))
    return im


def splash(im, cx, cy, size):
    d = ImageDraw.Draw(im)
    for i in range(60):
        a = random.uniform(math.pi * 1.05, math.pi * 1.95)
        r = random.uniform(0.05, 0.22) * size
        x, y = cx + math.cos(a) * r, cy + math.sin(a) * r * 0.9
        s = random.uniform(0.006, 0.018) * size
        d.ellipse([x - s, y - s, x + s, y + s], fill=(240, 252, 250, random.randint(170, 255)))
    for k in range(3):
        rw, rh = size * (0.16 + k * 0.08), size * (0.035 + k * 0.014)
        d.ellipse([cx - rw, cy - rh, cx + rw, cy + rh], outline=(225, 248, 245, 210 - k * 60), width=max(3, size // 120))


def compose(size, fish_scale, with_bg=True):
    im = background(size) if with_bg else Image.new("RGBA", (size, size), (0, 0, 0, 0))
    fish = Image.open(src).convert("RGBA")
    fs = int(size * fish_scale)
    fish = fish.resize((fs, fs), Image.LANCZOS)
    cx, cy = size // 2, int(size * 0.5)
    splash(im, cx - int(size * 0.08), int(size * 0.68) if with_bg else int(size * 0.7), size)
    # тень-свечение под рыбой
    sh = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    sh.paste(fish.split()[3].point(lambda a: int(a * 0.55)).convert("L"), (cx - fs // 2 + size // 60, cy - fs // 2 + size // 40))
    shadow = Image.new("RGBA", (size, size), (6, 30, 40, 0))
    shadow.putalpha(sh.split()[0] if sh.mode == "L" else sh.getchannel("A"))
    im.alpha_composite(Image.merge("RGBA", (Image.new("L", (size, size), 6), Image.new("L", (size, size), 30), Image.new("L", (size, size), 40), sh.getchannel("R").filter(ImageFilter.GaussianBlur(size // 60)))))
    im.alpha_composite(fish, (cx - fs // 2, cy - fs // 2))
    # леска с поплавком
    d = ImageDraw.Draw(im)
    p0 = (int(size * 0.98), int(size * 0.02))
    p1 = (int(size * 0.72), int(size * 0.33))
    pts = [(p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t + math.sin(t * math.pi) * size * 0.04) for t in [i / 30 for i in range(31)]]
    d.line(pts, fill=(250, 248, 236, 230), width=max(2, size // 300), joint="curve")
    bx, by = int(size * 0.8), int(size * 0.235)
    r = size // 34
    d.ellipse([bx - r, by - r, bx + r, by + r], fill=(245, 240, 230, 255))
    d.pieslice([bx - r, by - r, bx + r, by + r], 180, 360, fill=(226, 64, 46, 255))
    d.line([(bx, by - r), (bx, by - int(r * 2.2))], fill=(255, 140, 40, 255), width=max(2, size // 200))
    return im


def rounded(im, rad):
    m = Image.new("L", im.size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, im.size[0] - 1, im.size[1] - 1], radius=rad, fill=255)
    o = im.copy()
    o.putalpha(m)
    return o


full = compose(S, 0.82)
rounded(full, int(S * 0.2)).save(out + "/icon.png")
background(432).save(out + "/icon_bg.png")
compose(432, 0.56, with_bg=False).save(out + "/icon_fg.png")
full.resize((512, 512), Image.LANCZOS).save(out + "/icon_preview.png")
print("ok")
