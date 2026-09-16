"""System Profile portrait card, rebuilt from the same final-frame subject as the hero:
original photograph interior + the clip's clean gray-sweep matte, near-native scale, no grain."""
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
import make_still as ms
import make_turn as mt

CW, CH = 880, 1100
subject = mt.build_subject(0, [1], 1.0)                 # raw frame 0 with the photo cross-fade at 100 %
bbox = subject.getbbox()
sub = subject.crop(bbox)
target_h = int(CH * 1.22)   # head-and-shoulders framing; waist falls below the card
s = target_h / sub.height
sub = sub.resize((int(sub.width * s), target_h), Image.LANCZOS)
sub = sub.filter(ImageFilter.UnsharpMask(radius=0.8, percent=26, threshold=3))
px = int(CW * 0.5 - sub.width * 0.5)
py = int(CH * 0.035)

bg = ms.backdrop((CW, CH), glow=1.1, vignette=55).convert("RGB")   # corners stay in the frame's tone, never black
bga = np.asarray(bg).astype(np.float32)
arr = np.asarray(sub).astype(np.float32)
sa = arr[..., 3] / 255.0
band = ndimage.gaussian_filter(np.clip(sa - ndimage.minimum_filter(sa, size=11), 0, 1), 3) * 0.22
crop = np.zeros((sub.height, sub.width, 3), np.float32)
y0, x0 = max(py, 0), max(px, 0)
y1, x1 = min(py + sub.height, CH), min(px + sub.width, CW)
crop[y0 - py:y1 - py, x0 - px:x1 - px] = bga[y0:y1, x0:x1]
arr[..., :3] = arr[..., :3] * (1 - band[..., None]) + np.maximum(crop, arr[..., :3]) * band[..., None]
sub = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGBA")

card = bg.convert("RGBA")
sh_a = sub.getchannel("A").filter(ImageFilter.GaussianBlur(26))
shadow = Image.new("RGBA", sub.size, (0, 0, 0, 0)); shadow.putalpha(sh_a.point(lambda v: int(v * 0.5)))
card.alpha_composite(shadow, (px + 8, py + 16))
card.alpha_composite(sub, (px, py))
card = ms.add_grain(card, amount=1.0, seed=3)           # dither only, not texture
card.save("out/profile_card.webp", quality=88, method=6)
card.save("out/profile_card.png")
print("card", card.size, "subject", sub.size)
