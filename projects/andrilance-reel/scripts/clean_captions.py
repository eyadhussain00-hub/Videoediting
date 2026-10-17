"""Remove the burned-in word captions from the source reel (1080x1920, 30 fps, 4024 frames).

The captions are white condensed caps on his black hoodie (y ~1060-1190), one short group at a time. Per frame:
mask of near-white, low-saturation pixels glued into word lines, then LaMa on a crop at half resolution (the hoodie
is low-detail, so half-res fill is invisible and 4x cheaper) pasted back through a soft mask.
Not touched here, the edit covers them with its own graphics: the title pill (frames 0-102), the car photo inset
(344-368) and the full-screen prompt screenshot (1800-1838).
Usage: python3 scripts/clean_captions.py cache/src.mp4 cache/clean_X.mp4 --range A B [--threads N]
"""
import sys, subprocess, numpy as np, cv2

src, dst = sys.argv[1], sys.argv[2]
A, B = (int(sys.argv[sys.argv.index("--range") + 1]), int(sys.argv[sys.argv.index("--range") + 2])) if "--range" in sys.argv else (0, 10**9)
import torch
if "--threads" in sys.argv:
    torch.set_num_threads(int(sys.argv[sys.argv.index("--threads") + 1]))
W, H = 1080, 1920
BY0, BY1, BX0, BX1 = 1030, 1230, 140, 940        # where caption text is searched
CY0, CY1, CX0, CX1 = 960, 1312, 48, 1032          # crop LaMa may see (multiples of 8)


def caption_mask(f):
    band = f[BY0:BY1, BX0:BX1].astype(np.int16)
    mn, mx = band.min(2), band.max(2)
    m = ((mn > 185) & (mx - mn < 60)).astype(np.uint8) * 255
    # drop the zipper (a white vertical run far taller than a letter) so it can't merge with a word line
    m = cv2.subtract(m, cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((80, 1), np.uint8)))
    box = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_RECT, (31, 11)))
    num, lab, stats, _ = cv2.connectedComponentsWithStats(box)
    keep = np.zeros_like(m)
    for i in range(1, num):
        x, y, w, h, area = stats[i]
        dens = (m[lab == i] > 0).mean()
        if w >= 70 and 24 <= h <= 110 and area >= 1800 and dens > 0.12:   # word lines (not the zipper, not a watch glint)
            keep[(lab == i) & (m > 0)] = 255
    full = np.zeros((H, W), np.uint8)
    full[BY0:BY1, BX0:BX1] = keep
    # the letters carry a wide dark drop shadow: cover each line's padded box, rounded off
    return cv2.dilate(full, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (111, 87)))


from simple_lama_inpainting import SimpleLama
from PIL import Image
lama = SimpleLama()


def fill(f, m):
    mc = m[CY0:CY1, CX0:CX1]
    if not mc.any():
        return f
    ys, xs = np.where(mc.any(1))[0], np.where(mc.any(0))[0]
    a = max(0, (ys[0] - 40) // 16 * 16); b = min(CY1 - CY0, -(-(ys[-1] + 40) // 16) * 16)
    c = max(0, (xs[0] - 48) // 16 * 16); d = min(CX1 - CX0, -(-(xs[-1] + 48) // 16) * 16)
    y0, y1, x0, x1 = CY0 + a, CY0 + b, CX0 + c, CX0 + d
    mc = m[y0:y1, x0:x1]
    hard = ((mc > 8) * 255).astype(np.uint8)
    crop = cv2.cvtColor(f[y0:y1, x0:x1], cv2.COLOR_BGR2RGB)
    hw, hh = (x1 - x0) // 2, (y1 - y0) // 2
    small = cv2.resize(crop, (hw, hh), interpolation=cv2.INTER_AREA)
    hs = (cv2.resize(hard, (hw, hh), interpolation=cv2.INTER_AREA) > 0).astype(np.uint8) * 255
    small[hs > 0] = 0
    res = np.array(lama(Image.fromarray(small), Image.fromarray(hs)))[:hh, :hw]
    res = cv2.resize(res, (x1 - x0, y1 - y0), interpolation=cv2.INTER_CUBIC)
    res = cv2.cvtColor(res, cv2.COLOR_RGB2BGR).astype(np.float32)
    # fine grain back in (half-res fill is a touch soft)
    res += np.random.default_rng(len(res)).normal(0, 1.6, res.shape[:2])[..., None]
    soft = np.clip(cv2.GaussianBlur(mc.astype(np.float32) / 255, (0, 0), 2.5), 0, 1)[..., None]
    g = f.copy()
    g[y0:y1, x0:x1] = np.clip(np.rint(res * soft + f[y0:y1, x0:x1] * (1 - soft)), 0, 255).astype(np.uint8)
    return g


cap = cv2.VideoCapture(src)
if A:
    cap.set(cv2.CAP_PROP_POS_FRAMES, A)
out = subprocess.Popen(
    ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}",
     "-r", "30", "-i", "-", "-c:v", "libx264", "-crf", "12", "-preset", "medium",
     "-pix_fmt", "yuv420p", dst], stdin=subprocess.PIPE)
i = A
while i < B:
    ok, f = cap.read()
    if not ok:
        break
    if not (1800 <= i <= 1838):
        cm = caption_mask(f)
        if i % 150 == 0:
            cv2.imwrite(dst.replace(".mp4", f"_mask_{i}.png"), cm[CY0:CY1])
        f = fill(f, cm)
    out.stdin.write(f.tobytes())
    if i % 50 == 0:
        print("frame", i, flush=True)
    i += 1
out.stdin.close()
out.wait()
print("frames", i - A)
