"""Real hero turn sequence from the generated 360° clip — v3.1 (fidelity + compositing + colour continuity).

Segment: raw frames FIRST..LAST of source.mp4, played in REVERSE, so scroll progress 0 is a
back-angled pose and progress 1 is the source photograph.

v3 vs v2:
  - the last BLEND frames cross-fade into the ORIGINAL photograph (affine-registered to the
    video's frame 0, colour-matched), using the video's clean gray-sweep matte for the edge —
    the held frame is the real photo, not the generator's re-encode of it
  - much lighter denoise (chroma-weighted); hair, skin and highlight detail preserved
  - alpha refined with a guided filter (edges follow the image) instead of erosion; 3-tap
    temporal smoothing (5-tap smeared moving edges)
  - edge colours: decontaminated against the plate first, inpainted from the core only in the
    softest fringe (a < 0.45)
  - subtle light wrap from the studio backdrop so the rim isn't a hard cut-out
  - WebP q84 / alpha_quality 92
"""
import os, json
import numpy as np
import cv2
from PIL import Image, ImageFilter
from multiprocessing import Pool
from scipy import ndimage
import make_still as ms

FIRST, LAST = 0, 118            # raw frame indices (inclusive), then reversed
BLEND = 5                       # final frames that cross-fade into the original photograph (ghost-aware)
RAW = "turn/raw"
OUT = "turn/out/sequence"
W, H = 1920, 1080
os.makedirs(OUT, exist_ok=True)
os.makedirs("turn/alpha", exist_ok=True)

# ---------------------------------------------------------------- 1. alpha mattes (cached)
_session = None
def _init():
    global _session
    from rembg import new_session
    _session = new_session("isnet-general-use")

def matte(i):
    from rembg import remove
    path = f"turn/alpha/a_{i:04d}.png"
    if os.path.exists(path):
        return i
    img = Image.open(f"{RAW}/f_{i+1:04d}.png").convert("RGB")
    out = remove(img, session=_session, alpha_matting=True,
                 alpha_matting_foreground_threshold=240, alpha_matting_background_threshold=12,
                 alpha_matting_erode_size=6)
    out.getchannel("A").save(path)
    return i

def build_alphas(indices):
    missing = [i for i in indices if not os.path.exists(f"turn/alpha/a_{i:04d}.png")]
    if not missing:
        return
    with Pool(3, initializer=_init) as p:
        for k, _ in enumerate(p.imap_unordered(matte, missing), 1):
            print(f"matte {k}/{len(missing)}", flush=True)

# ---------------------------------------------------------------- 2. clean plate (cached)
def clean_plate(indices, chunk=48):
    if os.path.exists("turn/plate.png"):
        return
    frames = np.stack([np.asarray(Image.open(f"{RAW}/f_{i+1:04d}.png").convert("RGB")) for i in indices])
    alphas = np.stack([np.asarray(Image.open(f"turn/alpha/a_{i:04d}.png")) for i in indices])
    h, w = frames.shape[1:3]
    plate = np.full((h, w, 3), np.nan, dtype=np.float32)
    for y0 in range(0, h, chunk):
        y1 = min(h, y0 + chunk)
        f = frames[:, y0:y1].astype(np.float32)
        f[alphas[:, y0:y1] >= 4] = np.nan
        with np.errstate(all="ignore"):
            plate[y0:y1] = np.nanmedian(f, axis=0)
        del f
    del frames, alphas
    known = ~np.isnan(plate[..., 0])
    kw = known.astype(np.float32)
    filled = np.zeros_like(plate)
    for c in range(3):
        num = ndimage.gaussian_filter(np.nan_to_num(plate[..., c]) * kw, sigma=60)
        den = ndimage.gaussian_filter(kw, sigma=60)
        filled[..., c] = num / np.maximum(den, 1e-4)
    plate = np.where(known[..., None], plate, filled)
    plate = ndimage.gaussian_filter(plate, sigma=(2, 2, 0))
    Image.fromarray(np.clip(plate, 0, 255).astype(np.uint8)).save("turn/plate.png")

# ---------------------------------------------------------------- 3. original photo, registered
def build_true_photo():
    """Affine-register the source portrait onto video frame 0 and colour-match it to the clip."""
    if os.path.exists("turn/photo_aligned.png"):
        return
    src = np.asarray(Image.open("portrait_src.png").convert("RGB"))
    vid = np.asarray(Image.open(f"{RAW}/f_0001.png").convert("RGB"))
    h, w = vid.shape[:2]
    src_r = cv2.resize(src, (w, h), interpolation=cv2.INTER_LANCZOS4)
    g1 = cv2.cvtColor(src_r, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
    g2 = cv2.cvtColor(vid, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
    warp = np.eye(2, 3, dtype=np.float32)
    crit = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 400, 1e-7)
    _, warp = cv2.findTransformECC(g2, g1, warp, cv2.MOTION_AFFINE, crit, None, 5)
    aligned = cv2.warpAffine(src_r, warp, (w, h), flags=cv2.INTER_LANCZOS4 + cv2.WARP_INVERSE_MAP).astype(np.float32)
    # the photo's own matte, warped the same way: photo pixels are only trusted where IT is opaque
    pa = np.asarray(Image.open("cutout_isnet-general-use.png").getchannel("A"))
    pa = cv2.resize(pa, (w, h), interpolation=cv2.INTER_LANCZOS4)
    pa = cv2.warpAffine(pa, warp, (w, h), flags=cv2.INTER_LINEAR + cv2.WARP_INVERSE_MAP)
    Image.fromarray(pa).save("turn/photo_alpha.png")
    # Colour-match to the clip LOCALLY: the low-frequency difference between the clip's frame 0
    # and the photo (computed from subject-core pixels only) is added to the photo. Skin, shirt
    # and shading then match the preceding frames region by region, while everything finer
    # than ~SIGMA px — pores, hair, highlights — stays the photograph's own.
    a0 = np.asarray(Image.open("turn/alpha/a_0000.png")).astype(np.float32) / 255.0
    core = ndimage.minimum_filter((a0 > 0.98).astype(np.float32), size=9)
    v = vid.astype(np.float32)
    SIGMA = 12
    den = ndimage.gaussian_filter(core, SIGMA)
    for c in range(3):
        num = ndimage.gaussian_filter((v[..., c] - aligned[..., c]) * core, SIGMA)
        aligned[..., c] += num / np.maximum(den, 1e-3)
    # recover the crispness lost to resample + warp (moderate: nothing like the generator's sharpening)
    out = Image.fromarray(np.clip(aligned, 0, 255).astype(np.uint8)).filter(ImageFilter.UnsharpMask(radius=1.0, percent=34, threshold=2))
    out.save("turn/photo_aligned.png")
    print("true photo registered", flush=True)

# ---------------------------------------------------------------- 4. per-frame composite
def load_alpha(i):
    return np.asarray(Image.open(f"turn/alpha/a_{i:04d}.png")).astype(np.float32) / 255.0

def denoise_light(img_u8):
    """Chroma-weighted, near-transparent on luma: takes the codec's colour noise off the skin
    without flattening hair, pores or highlights."""
    bgr = cv2.cvtColor(img_u8, cv2.COLOR_RGB2BGR)
    out = cv2.fastNlMeansDenoisingColored(bgr, None, h=1.2, hColor=5, templateWindowSize=5, searchWindowSize=15)
    return cv2.cvtColor(out, cv2.COLOR_BGR2RGB)

def box(x, r):
    return cv2.blur(x, (2 * r + 1, 2 * r + 1))

def guided_filter(guide, p, r=4, eps=3e-4):
    """He et al. — snaps a soft alpha to the image's own edges (hair, collar) without erosion."""
    mean_I, mean_p = box(guide, r), box(p, r)
    corr_I, corr_Ip = box(guide * guide, r), box(guide * p, r)
    var_I = corr_I - mean_I * mean_I
    cov_Ip = corr_Ip - mean_I * mean_p
    a = cov_Ip / (var_I + eps)
    b = mean_p - a * mean_I
    return box(a, r) * guide + box(b, r)

def normalized_blur(img, weight, sigma):
    out = np.zeros_like(img)
    den = ndimage.gaussian_filter(weight, sigma)
    for c in range(img.shape[-1]):
        out[..., c] = ndimage.gaussian_filter(img[..., c] * weight, sigma) / np.maximum(den, 1e-4)
    return out

def build_subject(i, neighbours, blend_t):
    """Graded RGBA subject in source (960x944) space for raw frame i."""
    plate = np.asarray(Image.open("turn/plate.png")).astype(np.float32)
    raw = np.asarray(Image.open(f"{RAW}/f_{i+1:04d}.png").convert("RGB"))
    img = denoise_light(raw).astype(np.float32)

    # alpha: 3-tap temporal (0.2 / 0.6 / 0.2), then guided-filter refinement on the luma
    taps = [(i, 0.6)] + [(n, 0.2) for n in neighbours]
    a = sum(load_alpha(n) * wgt for n, wgt in taps) / sum(wgt for _, wgt in taps)
    guide = cv2.cvtColor(raw, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255.0
    a = np.clip(guided_filter(guide, a.astype(np.float32), r=4, eps=3e-4), 0, 1)
    a = np.clip((a - 0.02) / 0.96, 0, 1)                    # trim the faint outer haze only
    a = np.asarray(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.45))).astype(np.float32) / 255.0
    a3 = a[..., None]

    # colours: decontaminate against the sweep; inpaint from the core only in the softest fringe
    fg = np.clip((img - (1 - a3) * plate) / np.maximum(a3, 0.08), 0, 255)
    core = ndimage.minimum_filter((a > 0.985).astype(np.float32), size=5)
    inner = normalized_blur(fg, core, sigma=4)
    w = np.clip((0.45 - a) / 0.35, 0, 1)[..., None]
    fg = fg * (1 - w) + inner * w

    # final frames: cross-fade the interior to the registered original photograph
    if blend_t > 0:
        photo = np.asarray(Image.open("turn/photo_aligned.png")).astype(np.float32)
        pa = np.asarray(Image.open("turn/photo_alpha.png")).astype(np.float32) / 255.0
        photo_ok = ndimage.minimum_filter((pa > 0.97).astype(np.float32), size=9)   # ~4 px inside the photo's silhouette
        photo_ok = ndimage.gaussian_filter(photo_ok, 1.5)
        interior = np.clip((a - 0.85) / 0.13, 0, 1) * photo_ok      # video matte edge, photo only where it is opaque
        # ghost-aware: the clip still moves in these frames (the necklace swings, the head is a
        # degree or two off), so the photo is only blended where this frame already agrees with
        # it. Anything still moving stays the clip's pixels until it settles; on the final frame
        # (registered, colour-matched) nearly everything agrees and the photo takes over.
        diff = ndimage.gaussian_filter(np.abs(img - photo).mean(axis=-1), 2.5)
        agree = np.exp(-(np.maximum(diff - 9, 0) / 14) ** 2)
        wpix = (blend_t * interior * agree)[..., None]
        fg = fg * (1 - wpix) + photo * wpix

    subject = Image.fromarray(np.concatenate([fg.astype(np.uint8), (a * 255).astype(np.uint8)[..., None]], axis=-1), "RGBA")
    return ms.grade(subject)

def composite(args):
    out_index, i, neighbours, blend_t = args
    subject = build_subject(i, neighbours, blend_t)

    # fixed placement identical for every frame
    target_h = int(H * 1.06)
    s = target_h / subject.height
    subject = subject.resize((int(subject.width * s), target_h), Image.LANCZOS)
    subject = subject.filter(ImageFilter.UnsharpMask(radius=0.8, percent=28, threshold=3))
    px = int(W * 0.5 - subject.width * 0.5)
    py = H - subject.height + int(H * 0.09)

    # light wrap: let the backdrop glow bleed a few px into the rim so the edge reads as lit, not cut
    bg = np.asarray(ms.backdrop((W, H), glow=1.0).convert("RGB")).astype(np.float32)
    sub = np.asarray(subject).astype(np.float32)
    sa = sub[..., 3] / 255.0
    band = np.clip(sa - ndimage.minimum_filter(sa, size=11), 0, 1)
    band = ndimage.gaussian_filter(band, 3) * 0.22
    bg_crop = np.zeros((subject.height, subject.width, 3), np.float32)
    y0, x0 = max(py, 0), max(px, 0)
    y1, x1 = min(py + subject.height, H), min(px + subject.width, W)
    bg_crop[y0 - py:y1 - py, x0 - px:x1 - px] = bg[y0:y1, x0:x1]
    sub[..., :3] = sub[..., :3] * (1 - band[..., None]) + np.maximum(bg_crop, sub[..., :3]) * band[..., None]
    subject = Image.fromarray(np.clip(sub, 0, 255).astype(np.uint8), "RGBA")

    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sh_a = subject.getchannel("A").filter(ImageFilter.GaussianBlur(30))
    shadow = Image.new("RGBA", subject.size, (0, 0, 0, 0))
    shadow.putalpha(sh_a.point(lambda v: int(v * 0.5)))
    canvas.alpha_composite(shadow, (px + 10, py + 20))
    canvas.alpha_composite(subject, (px, py))
    canvas.save(f"{OUT}/frame_{out_index:04d}.webp", quality=84, method=6, alpha_quality=92)
    return out_index

if __name__ == "__main__":
    indices = list(range(FIRST, LAST + 1))
    build_alphas(indices)
    clean_plate(list(range(0, 121)))
    build_true_photo()
    order = list(reversed(indices))                # out 0 = raw LAST ... out N-1 = raw 0
    N = len(order)
    jobs = []
    for k, i in enumerate(order):
        nb = [order[k - 1]] if k > 0 else []
        if k + 1 < N: nb.append(order[k + 1])
        rem = N - 1 - k                              # frames left until the final one
        t = 0.0 if rem >= BLEND else (1 - rem / BLEND)
        t = t * t * (3 - 2 * t)                      # smoothstep
        jobs.append((k, i, nb, t))
    import sys
    if "--blend-only" in sys.argv:
        jobs = [j for j in jobs if j[0] >= N - 10]
        print(f"blend-only: {len(jobs)} frames", flush=True)
    else:
        for f in os.listdir(OUT):
            os.remove(f"{OUT}/{f}")
    with Pool(4) as p:
        for k, _ in enumerate(p.imap_unordered(composite, jobs), 1):
            if k % 20 == 0 or k == len(jobs):
                print(f"composite {k}/{len(jobs)}", flush=True)
    Image.open(f"{OUT}/frame_{N-1:04d}.webp").save(f"{OUT}/poster.webp", quality=90, method=6, alpha_quality=100)
    manifest = {
        "version": 3,
        "type": "frames",
        "placeholder": False,
        "alpha": True,
        "source": f"360 video.mp4 — raw frames {FIRST}..{LAST} reversed; last {BLEND} frames cross-fade into the registered original photograph",
        "count": N,
        "pattern": "/sequence/frame_{index}.webp",
        "pad": 4,
        "width": W,
        "height": H,
        "poster": "/sequence/poster.webp",
        "focal": {"x": 0.5, "y": 0.32},
        "pacing": {"holdStart": 0.08, "easeIn": 1.3, "easeOut": 1.6, "holdEnd": 0.18},
    }
    json.dump(manifest, open(f"{OUT}/manifest.json", "w"), indent=2)
    total = sum(os.path.getsize(f"{OUT}/{f}") for f in os.listdir(OUT))
    print("done", N, "frames,", f"{total/1e6:.1f} MB")
