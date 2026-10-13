"""Remove the burned-in text from the source reel (1080x1920).

Two overlays:
  header  "THE MUSLIM WINTER ARC ❄ / 90 DAY PLAYBOOK." — static, on the plain wall (y ~415-540).
          One mask for the whole clip (text, hard drop shadow, snowflake), built from the median of
          sampled frames; filled per frame with LaMa on a crop.
  caption white subtitle lines on the hoodie (y ~1500-1720), changing every few seconds.
          Per-frame mask of near-white, low-saturation pixels, glued into lines and dilated; LaMa fill.
Writes video only. Usage:
  python3 scripts/clean_captions.py cache/raw.mp4 cache/clean.mp4 [--range A B] [--threads N]
--range renders frames A..B-1 (run chunks in parallel, join with ffmpeg concat).
"""
import sys, subprocess, numpy as np, cv2

src, dst = sys.argv[1], sys.argv[2]
A, B = (int(sys.argv[sys.argv.index("--range") + 1]), int(sys.argv[sys.argv.index("--range") + 2])) if "--range" in sys.argv else (0, 10**9)
import torch
if "--threads" in sys.argv:
    torch.set_num_threads(int(sys.argv[sys.argv.index("--threads") + 1]))
W, H = 1080, 1920

# header: crop LaMa sees, and the search box for the text
HY0, HY1, HX0, HX1 = 376, 584, 96, 984      # multiple of 8
SY0, SY1, SX0, SX1 = 410, 545, 120, 960
# caption
CY0, CY1, CX0, CX1 = 1432, 1752, 100, 980
BY0, BY1, BX0, BX1 = 1480, 1715, 120, 960


def header_mask(src):
    cap = cv2.VideoCapture(src)
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    acc = []
    for k in np.linspace(0, n - 1, 24).astype(int):
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(k))
        ok, f = cap.read()
        if not ok:
            continue
        r = f[SY0:SY1, SX0:SX1].astype(np.float32)
        bg = cv2.medianBlur(f[SY0:SY1, SX0:SX1], 61).astype(np.float32)
        d = np.abs(r - bg).max(2)
        acc.append(d > 28)
    m = (np.mean(acc, 0) > 0.6).astype(np.uint8) * 255
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    m = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_RECT, (41, 9)))
    num, lab, stats, _ = cv2.connectedComponentsWithStats(m)
    full = np.zeros((H, W), np.uint8)
    for i in range(1, num):
        x, y, w, h, area = stats[i]
        if area > 400:
            cv2.rectangle(full, (SX0 + x - 14, SY0 + y - 12), (SX0 + x + w + 14, SY0 + y + h + 14), 255, -1)
    return cv2.GaussianBlur(full, (0, 0), 3)


def median_frame(src):
    cap = cv2.VideoCapture(src)
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fs = []
    for k in np.linspace(0, n - 1, 31).astype(int):
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(k))
        ok, f = cap.read()
        if ok:
            fs.append(f[HY0:HY1, HX0:HX1])
    return np.median(np.stack(fs), 0).astype(np.uint8)


def caption_mask(f):
    band = f[BY0:BY1, BX0:BX1].astype(np.int16)
    mn, mx = band.min(2), band.max(2)
    m = ((mn > 175) & (mx - mn < 45)).astype(np.uint8) * 255
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
    box = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_RECT, (31, 11)))
    num, lab, stats, _ = cv2.connectedComponentsWithStats(box)
    keep = np.zeros_like(m)
    for i in range(1, num):
        x, y, w, h, area = stats[i]
        if h >= 30 and w >= 40:      # a word line, not a specular highlight
            keep[lab == i] = 255
    full = np.zeros((H, W), np.uint8)
    full[BY0:BY1, BX0:BX1] = keep
    return cv2.dilate(full, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (17, 17)))


from simple_lama_inpainting import SimpleLama
from PIL import Image
lama = SimpleLama()


def fill(f, m, y0, y1, x0, x1, tight=False):
    mc = m[y0:y1, x0:x1]
    if not mc.any():
        return f
    if tight:  # shrink the crop to the mask's rows (LaMa cost scales with area)
        ys = np.where(mc.any(1))[0]
        a = max(0, (ys[0] - 56) // 8 * 8); b = min(y1 - y0, -(-(ys[-1] + 56) // 8) * 8)
        return fill(f, m, y0 + a, y0 + b, x0, x1)
    hard = ((mc > 8) * 255).astype(np.uint8)
    crop = cv2.cvtColor(f[y0:y1, x0:x1], cv2.COLOR_BGR2RGB)
    crop[hard > 0] = 0  # LaMa must not see the text it is replacing
    res = np.array(lama(Image.fromarray(crop), Image.fromarray(hard)))[: y1 - y0, : x1 - x0]
    res = cv2.cvtColor(res, cv2.COLOR_RGB2BGR)
    soft = np.clip(cv2.GaussianBlur(mc.astype(np.float32) / 255, (0, 0), 2.5), 0, 1)[..., None]
    g = f.copy()
    g[y0:y1, x0:x1] = np.rint(res * soft + f[y0:y1, x0:x1] * (1 - soft)).astype(np.uint8)
    return g


hm = header_mask(src)
cv2.imwrite(dst.replace(".mp4", "_header_mask.png"), hm[HY0:HY1])
# the header sits on a still wall: inpaint one clean plate from the median frame, reuse it every frame
med = median_frame(src)
full = np.zeros((H, W, 3), np.uint8); full[HY0:HY1, HX0:HX1] = med
plate = fill(full, hm, HY0, HY1, HX0, HX1)[HY0:HY1, HX0:HX1].astype(np.float32)
cv2.imwrite(dst.replace(".mp4", "_header_plate.png"), plate)
hsoft = np.clip(hm[HY0:HY1, HX0:HX1].astype(np.float32) / 255, 0, 1)[..., None]
ring = (cv2.dilate(hm, np.ones((41, 41), np.uint8))[HY0:HY1, HX0:HX1] > 0) & (hm[HY0:HY1, HX0:HX1] == 0)


def fill_header(f):
    r = f[HY0:HY1, HX0:HX1].astype(np.float32)
    diff = np.abs(r[ring] - med.astype(np.float32)[ring]).mean()
    if diff > 12:  # something (a hand) crossed the header: inpaint this frame properly
        return fill(f, hm, HY0, HY1, HX0, HX1)
    gain = (r[ring].mean(0) + 1) / (med.astype(np.float32)[ring].mean(0) + 1)  # follow exposure drift
    g = f.copy()
    g[HY0:HY1, HX0:HX1] = np.clip(np.rint(plate * gain * hsoft + r * (1 - hsoft)), 0, 255).astype(np.uint8)
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
    f = fill_header(f)
    cm = caption_mask(f)
    if i % 150 == 0:
        cv2.imwrite(dst.replace(".mp4", f"_cap_mask_{i}.png"), cm[CY0:CY1])
    f = fill(f, cm, CY0, CY1, CX0, CX1, tight=True)
    out.stdin.write(f.tobytes())
    if i % 25 == 0:
        print("frame", i, flush=True)
    i += 1
out.stdin.close()
out.wait()
print("frames", i - A)
