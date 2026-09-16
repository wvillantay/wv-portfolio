"""Placeholder scrub sequence derived from the treated still.

This exists so the hero's frame pipeline (manifest -> preload -> canvas scrub) is real
and testable before a generated turntable exists. Replace the frames + manifest with the
generated sequence later; the site code does not change.

Frame i (t = i/(N-1), eased):
  - subject brightness  0.10 -> 1.00   (rim-lit silhouette -> fully lit)
  - rim light strength  1.70 -> 0.90
  - backdrop glow       0.45 -> 1.00
  - perspective yaw     turned away (foreshortened) -> facing camera (identity)
  - dolly               scale 1.06 -> 1.00, slight x drift
Last frame == the untouched hero still, so the scroll end lands on the real photo.
"""
import os, json, sys
import numpy as np
from PIL import Image, ImageFilter
from multiprocessing import Pool
import make_still as ms

N = int(sys.argv[1]) if len(sys.argv) > 1 else 96
OUT_W, OUT_H = 1600, 900
OUT_DIR = "out/sequence"
os.makedirs(OUT_DIR, exist_ok=True)

W, H = ms.W, ms.H
sub = ms.sub_r                       # graded, upscaled RGBA subject
X0, Y0 = ms.x, ms.y                  # final placement (frame N-1)
bg_lo = ms.backdrop((W, H), glow=0.45).convert("RGB")
bg_hi = ms.backdrop((W, H), glow=1.00).convert("RGB")

def ease(t):  # smooth in/out with a brief hold at both ends
    t = min(max((t - 0.04) / 0.92, 0.0), 1.0)
    return t * t * (3 - 2 * t)

def find_coeffs(dst, src):
    m = []
    for (x, y), (u, v) in zip(dst, src):
        m.append([x, y, 1, 0, 0, 0, -u * x, -u * y])
        m.append([0, 0, 0, x, y, 1, -v * x, -v * y])
    A = np.array(m, dtype=np.float64)
    B = np.array(src, dtype=np.float64).reshape(8)
    return np.linalg.solve(A, B)

def warp_subject(img, e):
    """Fake yaw: at e=0 the subject is foreshortened (turned away) with the far side smaller."""
    w, h = img.size
    wf = 0.70 + 0.30 * e             # visible width factor
    lf = 0.91 + 0.09 * e             # left edge height factor (far side)
    tw = int(w * wf)
    # destination quad inside a canvas the size of the original
    cx = w / 2
    left = cx - tw / 2
    right = cx + tw / 2
    top_l = h * (1 - lf) * 0.55
    bot_l = h - h * (1 - lf) * 0.45
    dst = [(left, top_l), (right, 0), (right, h), (left, bot_l)]
    src = [(0, 0), (w, 0), (w, h), (0, h)]
    coeffs = find_coeffs(dst, src)
    return img.transform((w, h), Image.PERSPECTIVE, coeffs, Image.BICUBIC)

def shade_subject(img, brightness):
    r, g, b, a = img.split()
    arr = np.asarray(Image.merge("RGB", (r, g, b))).astype(np.float32)
    # keep a little cool ambient in the shadows so the silhouette isn't pure black
    arr = arr * brightness + np.array([6, 8, 11], np.float32) * (1 - brightness)
    return Image.merge("RGBA", (*Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).split(), a))

def render(i):
    t = i / (N - 1)
    e = ease(t)
    scale = 1.06 - 0.06 * e
    s = warp_subject(sub, e)
    if abs(scale - 1) > 1e-3:
        s = s.resize((int(s.width * scale), int(s.height * scale)), Image.LANCZOS)
    s = shade_subject(s, 0.10 + 0.90 * (e ** 1.15))
    # placement: keep feet/waist anchored, drift x from +38px to 0
    px = int(X0 + (sub.width - s.width) / 2 + 38 * (1 - e))
    py = int(Y0 + (sub.height - s.height))
    # backdrop blend
    bg = Image.blend(bg_lo, bg_hi, e).convert("RGBA")
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sh_a = s.getchannel("A").filter(ImageFilter.GaussianBlur(28))
    sh = Image.new("RGBA", s.size, (0, 0, 0, 0)); sh.putalpha(sh_a.point(lambda v: int(v * 0.55)))
    shadow.alpha_composite(sh, (px + 10, py + 18))
    bg.alpha_composite(shadow)
    bg.alpha_composite(s, (px, py))
    bg.alpha_composite(ms.rim_light(s, 1.70 - 0.80 * e), (px, py))
    frame = ms.add_grain(bg, amount=6, seed=100 + i)
    frame = frame.resize((OUT_W, OUT_H), Image.LANCZOS)
    frame.save(f"{OUT_DIR}/frame_{i:04d}.webp", quality=76, method=4)
    return i

if __name__ == "__main__":
    with Pool(4) as p:
        for k, _ in enumerate(p.imap_unordered(render, range(N)), 1):
            if k % 16 == 0 or k == N:
                print(f"{k}/{N}", flush=True)
    # poster = final frame at higher quality
    Image.open(f"{OUT_DIR}/frame_{N-1:04d}.webp").save(f"{OUT_DIR}/poster.webp", quality=88, method=6)
    manifest = {
        "version": 1,
        "type": "frames",
        "placeholder": True,
        "note": "Placeholder reveal derived from the still. Replace with the generated turntable frames; keep the same keys.",
        "count": N,
        "pattern": "/sequence/frame_{index}.webp",
        "pad": 4,
        "width": OUT_W,
        "height": OUT_H,
        "poster": "/sequence/poster.webp",
        "focal": {"x": 0.5, "y": 0.32},
    }
    json.dump(manifest, open(f"{OUT_DIR}/manifest.json", "w"), indent=2)
    total = sum(os.path.getsize(f"{OUT_DIR}/{f}") for f in os.listdir(OUT_DIR))
    print("done", N, "frames,", f"{total/1e6:.1f} MB total")
