"""Remove the burned-in text from the source (1080x1920, 30 fps, 3011 frames).

Two overlays:
  hook box  white rounded box "That sudden rush of anxiety on a sales call…" (x 240-846, y 1200-1553, frames 0-112)
            over his hands and the mic. LaMa fill (the hook scene punches in on his face anyway).
  caption   one white word at a time with a black outline, centred at x 540, y ~1390-1485, from frame 113 on.
            Per-frame mask: white letter cores whose own box sits inside the caption band (the shirt's big
            "RYAN KEIP" letters reach past the band, so they are kept), dilated over the outline; LaMa fill.
Writes video only. A --second-pass over the cleaned video only touches frames that still have a caption. Usage:
  python3 scripts/clean_captions.py cache/src.mp4 cache/clean_X.mp4 [--range A B] [--threads N]
"""
import sys, subprocess, numpy as np, cv2

src, dst = sys.argv[1], sys.argv[2]
A, B = (int(sys.argv[sys.argv.index("--range") + 1]), int(sys.argv[sys.argv.index("--range") + 2])) if "--range" in sys.argv else (0, 10**9)
import torch
if "--threads" in sys.argv:
    torch.set_num_threads(int(sys.argv[sys.argv.index("--threads") + 1]))
W, H = 1080, 1920
BOX_END = 113                                   # first frame without the hook box
SY0, SY1, SX0, SX1 = 1340, 1540, 60, 1020       # where caption letters are searched
LY0, LY1 = 1365, 1506                           # a caption letter's box lies inside these rows

box = np.zeros((H, W), np.uint8)
cv2.rectangle(box, (232, 1192), (854, 1562), 255, -1)


def caption_mask(f):
    band = f[SY0:SY1, SX0:SX1].astype(np.int16)
    mn, mx = band.min(2), band.max(2)
    m = ((mn > 185) & (mx - mn < 60)).astype(np.uint8)
    seeds = cv2.erode(m, np.ones((5, 5), np.uint8))   # breaks hairline touches between a caption and a shirt letter
    num, lab, st, _ = cv2.connectedComponentsWithStats(seeds)
    keep = np.zeros_like(m)
    for i in range(1, num):
        x, y, w, h, area = st[i]
        if area < 12:
            continue
        top, bot = SY0 + y - 2, SY0 + y + h + 2
        if top >= LY0 and bot <= LY1 and h <= 100:   # the source scales some words up (letters to ~84 px)
            keep[lab == i] = 255
    keep = cv2.dilate(keep, np.ones((7, 7), np.uint8)) & (m * 255)   # grow the seeds back to the letter
    # a word is a row of letters: drop lone specks far from any other letter
    grp = cv2.dilate(keep, cv2.getStructuringElement(cv2.MORPH_RECT, (41, 15)))
    num, lab, st, _ = cv2.connectedComponentsWithStats(grp)
    out = np.zeros_like(keep)
    for i in range(1, num):
        x, y, w, h, area = st[i]
        if w >= 40 and h >= 30:
            out[(lab == i) & (keep > 0)] = 255
    full = np.zeros((H, W), np.uint8)
    full[SY0:SY1, SX0:SX1] = out
    return cv2.dilate(full, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (21, 21)))   # covers the black outline


from simple_lama_inpainting import SimpleLama
from PIL import Image
lama = SimpleLama()


def fill(f, m, pad=40):
    if not m.any():
        return f
    ys, xs = np.where(m > 0)
    y0 = max(0, (ys.min() - pad) // 8 * 8); y1 = min(H, -(-(ys.max() + pad) // 8) * 8)
    x0 = max(0, (xs.min() - pad) // 8 * 8); x1 = min(W, -(-(xs.max() + pad) // 8) * 8)
    mc = m[y0:y1, x0:x1]
    hard = ((mc > 8) * 255).astype(np.uint8)
    crop = cv2.cvtColor(f[y0:y1, x0:x1], cv2.COLOR_BGR2RGB)
    crop[hard > 0] = 0
    res = np.array(lama(Image.fromarray(crop), Image.fromarray(hard)))[: y1 - y0, : x1 - x0]
    res = cv2.cvtColor(res, cv2.COLOR_RGB2BGR)
    soft = np.clip(cv2.GaussianBlur(mc.astype(np.float32) / 255, (0, 0), 2.0), 0, 1)[..., None]
    g = f.copy()
    g[y0:y1, x0:x1] = np.rint(res * soft + f[y0:y1, x0:x1] * (1 - soft)).astype(np.uint8)
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
    cm = box if i < BOX_END and "--second-pass" not in sys.argv else caption_mask(f)
    if i % 150 == 0:
        cv2.imwrite(dst.replace(".mp4", f"_mask_{i}.png"), cm[1180:1580])
    f = fill(f, cm)
    out.stdin.write(f.tobytes())
    if i % 50 == 0:
        print("frame", i, flush=True)
    i += 1
out.stdin.close()
out.wait()
print("frames", i - A)
