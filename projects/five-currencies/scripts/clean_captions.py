"""Remove the burned-in captions from the source reel.

The captions are white Impact-style words with a soft shadow, centred on the chest
(y ~ 900-1010 of 1080x1920). Per frame: mask near-white, low-saturation pixels in that
band, dilate to take the shadow, then fill. Fill is LaMa (big-lama,
CPU) on a crop around the band. Writes cache/clean.mp4 (video only) and cache/masks/ for QA.
Usage: python3 scripts/clean_captions.py cache/raw.mp4 cache/clean.mp4 [--limit N] [--range A B] [--threads N]
--range renders frames A..B-1 only (for running chunks in parallel; join them with ffmpeg concat).
"""
import sys, subprocess, numpy as np, cv2

src, dst = sys.argv[1], sys.argv[2]
limit = int(sys.argv[sys.argv.index("--limit") + 1]) if "--limit" in sys.argv else None
A, B = (int(sys.argv[sys.argv.index("--range") + 1]), int(sys.argv[sys.argv.index("--range") + 2])) if "--range" in sys.argv else (0, 10**9)
if "--threads" in sys.argv:
    import torch
    torch.set_num_threads(int(sys.argv[sys.argv.index("--threads") + 1]))
W, H = 1080, 1920
Y0, Y1, X0, X1 = 870, 1050, 140, 940  # search band

cap = cv2.VideoCapture(src)

def text_mask(f):
    band = f[Y0:Y1, X0:X1].astype(np.int16)
    mn = band.min(axis=2)
    mx = band.max(axis=2)
    m = ((mn > 205) & (mx - mn < 40)).astype(np.uint8) * 255
    # keep only blobs that look like letters: drop specks
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
    # glue the letters into a word box, then grow to include the shadow
    box = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_RECT, (25, 9)))
    num, lab, stats, _ = cv2.connectedComponentsWithStats(box)
    keep = np.zeros_like(m)
    for i in range(1, num):
        x, y, w, h, area = stats[i]
        if h >= 40 and w >= 60:  # a caption word line, not a highlight
            keep[lab == i] = 255
    full = np.zeros((H, W), np.uint8)
    # the whole word line (letters glued) plus the wide soft shadow around it
    full[Y0:Y1, X0:X1] = keep
    return cv2.dilate(full, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (41, 41)))


out = subprocess.Popen(
    ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}",
     "-r", "30", "-i", "-", "-c:v", "libx264", "-crf", "12", "-preset", "medium",
     "-pix_fmt", "yuv420p", dst], stdin=subprocess.PIPE)

from simple_lama_inpainting import SimpleLama
from PIL import Image
lama = SimpleLama()
CY0, CY1, CX0, CX1 = 792, 1112, 100, 980  # crop LaMa sees (multiple of 8)
i = 0
sample = None
while True:
    ok, f = cap.read()
    if not ok or (limit and i >= limit) or i >= B:
        break
    if i < A:
        i += 1
        continue
    m = text_mask(f)
    if i == 36:
        sample = m
    if m.any():
        crop = cv2.cvtColor(f[CY0:CY1, CX0:CX1], cv2.COLOR_BGR2RGB)
        mc = m[CY0:CY1, CX0:CX1]
        res = np.array(lama(Image.fromarray(crop), Image.fromarray(mc)))[: CY1 - CY0, : CX1 - CX0]
        res = cv2.cvtColor(res, cv2.COLOR_RGB2BGR)
        g = f.copy()
        soft = cv2.GaussianBlur(mc.astype(np.float32) / 255, (0, 0), 2.5)[..., None]
        g[CY0:CY1, CX0:CX1] = (res * soft + f[CY0:CY1, CX0:CX1] * (1 - soft)).astype(np.uint8)
        f = g
    if i % 25 == 0:
        print("frame", i, flush=True)
    out.stdin.write(f.tobytes())
    i += 1
out.stdin.close()
out.wait()
if sample is not None:
    cv2.imwrite(dst.replace(".mp4", "_mask_sample.png"), sample)
print("frames", i)
