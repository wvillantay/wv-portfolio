"""Portrait treatment: cutout -> dark premium studio composite.

Outputs (in ./out):
  subject_clean.png      decontaminated RGBA cutout (source resolution)
  hero_still_1920.png    16:9 studio composite, subject centered, waist at frame bottom
  hero_still_1920.webp   same, web-ready
  profile_card.png       4:5 crop for the System Profile card
"""
import os, math
import numpy as np
from PIL import Image, ImageFilter, ImageChops, ImageEnhance, ImageDraw

os.makedirs("out", exist_ok=True)
SRC = "cutout_isnet-general-use.png"

# ---------- 1. Clean the cutout: soften alpha, decontaminate bright fringe ----------
im = Image.open(SRC).convert("RGBA")
rgb = np.asarray(im.convert("RGB")).astype(np.float32) / 255.0
a = np.asarray(im.getchannel("A")).astype(np.float32) / 255.0

# erode alpha by ~1px then feather, so sky-colored edge pixels drop out
a_img = Image.fromarray((a * 255).astype(np.uint8))
a_img = a_img.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
a = np.asarray(a_img).astype(np.float32) / 255.0

# decontaminate: where alpha is partial, pull bright/blue fringe toward the local subject color
lum = rgb @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
edge = (a > 0.02) & (a < 0.95)
blueish = (rgb[..., 2] > rgb[..., 0] + 0.08) & (lum > 0.45)
fringe = edge & blueish
# darken and desaturate fringe pixels
gray = np.stack([lum, lum, lum], axis=-1)
rgb_fixed = rgb.copy()
rgb_fixed[fringe] = (gray[fringe] * 0.35 + rgb[fringe] * 0.15)
# generic edge premultiply softening
w = np.clip((0.95 - a) / 0.93, 0, 1)[..., None] * edge[..., None]
rgb_fixed = rgb_fixed * (1 - 0.35 * w) + gray * (0.35 * w) * 0.6

subject = Image.fromarray(np.concatenate([(np.clip(rgb_fixed, 0, 1) * 255).astype(np.uint8),
                                          (a * 255).astype(np.uint8)[..., None]], axis=-1), "RGBA")

# ---------- 2. Grade the subject: slightly cooler, calmer saturation, a touch more contrast ----------
def grade(img):
    r, g, b, al = img.split()
    rgb_img = Image.merge("RGB", (r, g, b))
    rgb_img = ImageEnhance.Color(rgb_img).enhance(0.86)
    rgb_img = ImageEnhance.Contrast(rgb_img).enhance(1.07)
    arr = np.asarray(rgb_img).astype(np.float32)
    # lift shadows a hair, cool the shadows, keep skin warm in the mids
    arr = arr * 0.96 + 8
    arr[..., 2] += 4  # blue
    arr[..., 0] -= 1
    rgb_img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    return Image.merge("RGBA", (*rgb_img.split(), al))

subject = grade(subject)
subject.save("out/subject_clean.png")

# ---------- 3. Studio backdrop ----------
W, H = 1920, 1080

def radial(size, center, radii, color, power=1.6):
    """Soft elliptical glow as an RGBA layer."""
    w, h = size
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    dx = (x - center[0]) / radii[0]
    dy = (y - center[1]) / radii[1]
    d = np.sqrt(dx * dx + dy * dy)
    m = np.clip(1 - d, 0, 1) ** power
    layer = np.zeros((h, w, 4), dtype=np.float32)
    layer[..., :3] = np.array(color, dtype=np.float32)
    layer[..., 3] = m * 255
    return Image.fromarray(layer.astype(np.uint8), "RGBA")

def backdrop(size=(W, H), glow=1.0, vignette=170):
    w, h = size
    # vertical gradient sweep
    top, bottom = np.array([15, 15, 18], np.float32), np.array([4, 4, 5], np.float32)
    t = np.linspace(0, 1, h, dtype=np.float32)[:, None, None]
    base = top * (1 - t) ** 1.3 + bottom * (1 - (1 - t) ** 1.3)
    base = np.repeat(base, w, axis=1)
    bg = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8), "RGB").convert("RGBA")
    # main backlight behind head/shoulders (neutral-warm), plus a faint teal wash to echo the shirt
    g1 = radial(size, (w * 0.5, h * 0.34), (w * 0.34, h * 0.62), (92, 92, 100), power=1.9)
    g1.putalpha(g1.getchannel("A").point(lambda v: int(v * 0.95 * glow)))
    g2 = radial(size, (w * 0.5, h * 0.42), (w * 0.22, h * 0.40), (150, 150, 160), power=2.4)
    g2.putalpha(g2.getchannel("A").point(lambda v: int(v * 0.55 * glow)))
    g3 = radial(size, (w * 0.62, h * 0.55), (w * 0.5, h * 0.7), (30, 70, 78), power=2.2)
    g3.putalpha(g3.getchannel("A").point(lambda v: int(v * 0.35 * glow)))
    bg.alpha_composite(g3); bg.alpha_composite(g1); bg.alpha_composite(g2)
    # floor sweep
    floor = radial(size, (w * 0.5, h * 1.05), (w * 0.9, h * 0.32), (22, 22, 26), power=1.4)
    bg.alpha_composite(floor)
    # vignette
    vig = radial(size, (w * 0.5, h * 0.5), (w * 0.78, h * 0.85), (0, 0, 0), power=1.0)
    va = np.asarray(vig.getchannel("A")).astype(np.float32) / 255.0
    vig.putalpha(Image.fromarray(((1 - va) * vignette).astype(np.uint8)))
    bg.alpha_composite(vig)
    return bg

def add_grain(img, amount=6, seed=7):
    rng = np.random.default_rng(seed)
    arr = np.asarray(img.convert("RGB")).astype(np.float32)
    noise = rng.normal(0, amount, arr.shape[:2]).astype(np.float32)[..., None]
    arr = np.clip(arr + noise, 0, 255)
    return Image.fromarray(arr.astype(np.uint8), "RGB")

# ---------- 4. Place subject: waist at bottom edge, centered, ~7% headroom ----------
bbox = subject.getbbox()
sub = subject.crop(bbox)
target_h = int(H * 1.06)  # chest-up framing: waist overflows the bottom edge
scale = target_h / sub.height
sub_r = sub.resize((int(sub.width * scale), target_h), Image.LANCZOS)
# mild sharpen after upscale
sub_r = sub_r.filter(ImageFilter.UnsharpMask(radius=1.2, percent=55, threshold=2))
x = int(W * 0.5 - sub_r.width * 0.5)
y = H - sub_r.height + int(H * 0.09)

def rim_light(sub_rgba, strength=1.0):
    """Edge light along the subject silhouette (top-right key + cool left rim)."""
    al = sub_rgba.getchannel("A")
    inner = al.filter(ImageFilter.MinFilter(9)).filter(ImageFilter.GaussianBlur(6))
    edge = ImageChops.subtract(al, inner)  # band along the edge
    edge = edge.filter(ImageFilter.GaussianBlur(2))
    ea = np.asarray(edge).astype(np.float32) / 255.0
    h, w = ea.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    # key from upper-right
    key = np.clip((xx / w) * 0.9 + (1 - yy / h) * 0.6 - 0.35, 0, 1)
    cool = np.clip((1 - xx / w) * 0.9 - 0.45, 0, 1)
    layer = np.zeros((h, w, 4), np.float32)
    layer[..., :3] = np.array([232, 236, 240])
    layer[..., 3] = np.clip(ea * (key * 0.8 + cool * 0.35), 0, 1) * 255 * strength
    return Image.fromarray(layer.astype(np.uint8), "RGBA")

def compose(glow=1.0, rim=0.9, subject_img=None, pos=None, size=(W, H)):
    bg = backdrop(size, glow)
    s = subject_img if subject_img is not None else sub_r
    px, py = pos if pos else (x, y)
    # contact shadow / halo behind subject
    shadow = Image.new("RGBA", size, (0, 0, 0, 0))
    sh_a = s.getchannel("A").filter(ImageFilter.GaussianBlur(28))
    sh = Image.new("RGBA", s.size, (0, 0, 0, 0)); sh.putalpha(sh_a.point(lambda v: int(v * 0.55)))
    shadow.alpha_composite(sh, (px + 10, py + 18))
    bg.alpha_composite(shadow)
    bg.alpha_composite(s, (px, py))
    bg.alpha_composite(rim_light(s, rim), (px, py))
    out = add_grain(bg)
    return out

if __name__ == "__main__":
  still = compose()
  still.save("out/hero_still_1920.png")
  still.save("out/hero_still_1920.webp", quality=88, method=6)

  # System Profile card crop (4:5) around head/shoulders
  card_w, card_h = 880, 1100
  cx = x + sub_r.width // 2
  cy = y + int(sub_r.height * 0.30)
  box = (cx - card_w // 2, max(0, cy - card_h // 2), cx + card_w // 2, max(0, cy - card_h // 2) + card_h)
  card_src = compose(glow=1.15, rim=1.0)
  card = card_src.crop(box)
  card.save("out/profile_card.png")
  card.save("out/profile_card.webp", quality=86, method=6)
  print("still", still.size, "subject", sub_r.size, "pos", (x, y), "card", card.size)
