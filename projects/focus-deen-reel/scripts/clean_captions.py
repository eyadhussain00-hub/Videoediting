"""Remove the burned-in text from the source reel (1080x1920, 30 fps, 713 frames).

Two overlays:
  pill     white title pill "Imagine TikTok locked itself everytime at salah time" (y ~265-565, frames 0-238)
           on the still ceiling. The camera is locked off and the pill is gone from frame 239 on, so the real
           ceiling behind it is the median of the later frames: no inpainting, just that plate (exposure-matched).
  caption  white subtitle lines on his sweater (y ~1390-1500), changing every few seconds.
           Per-frame mask of near-white, low-saturation pixels glued into lines; LaMa fill on a tight crop.
Writes video only. Usage:
  python3 scripts/clean_captions.py cache/src.mp4 cache/clean.mp4 [--range A B] [--threads N]
"""
import sys, subprocess, numpy as np, cv2

src, dst = sys.argv[1], sys.argv[2]
A, B = (int(sys.argv[sys.argv.index("--range") + 1]), int(sys.argv[sys.argv.index("--range") + 2])) if "--range" in sys.argv else (0, 10**9)
import torch
if "--threads" in sys.argv:
    torch.set_num_threads(int(sys.argv[sys.argv.index("--threads") + 1]))
W, H = 1080, 1920
PILL_END = 239                                   # first frame without the pill
PY0, PY1 = 240, 600                              # pill rows (plate region)
CY0, CY1, CX0, CX1 = 1272, 1560, 120, 960        # caption crop LaMa sees (multiples of 8)
BY0, BY1, BX0, BX1 = 1320, 1520, 170, 915        # where caption text is searched (3-line captions start at y ~1340)


def frames(idx):
    cap = cv2.VideoCapture(src)
    for k in idx:
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(k))
        ok, f = cap.read()
        if ok:
            yield f


def pill_mask():
    acc = [((f[PY0:PY1].min(2) > 228)) for f in frames(np.linspace(0, PILL_END - 2, 12).astype(int))]
    m = (np.mean(acc, 0) > 0.5).astype(np.uint8) * 255
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((25, 25), np.uint8))   # swallow the black letters
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    full = np.zeros((PY1 - PY0, W), np.uint8)
    for c in cs:
        if cv2.contourArea(c) > 2000:
            cv2.drawContours(full, [c], -1, 255, -1)
    core = cv2.dilate(full, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
    shadow = cv2.dilate(full, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (21, 21)))   # soft drop shadow
    return cv2.GaussianBlur(core, (0, 0), 1.5), cv2.GaussianBlur(shadow, (0, 0), 2.5)


pm, pshadow = pill_mask()
cv2.imwrite(dst.replace(".mp4", "_pill_mask.png"), pm)
pshadow = pshadow.astype(np.float32) / 255
mcap = cv2.VideoCapture(src.replace("src.mp4", "matte.mp4"))   # speaker matte: the shadow ring never paints over his hair
if A:
    mcap.set(cv2.CAP_PROP_POS_FRAMES, A)
plate = np.median(np.stack([f[PY0:PY1] for f in frames(np.linspace(PILL_END + 5, 700, 41).astype(int))]), 0).astype(np.float32)
cv2.imwrite(dst.replace(".mp4", "_pill_plate.png"), plate)
pcore = pm.astype(np.float32) / 255
ring = (cv2.dilate(pm, np.ones((61, 61), np.uint8)) > 0) & (pm == 0)
ring[200:] = False                                # ceiling only (his head is below)


tab = np.zeros((H, W), np.uint8)               # where the pill's "time" tab overlaps his head
tab[PY0:PY1] = (pm > 10) * 255
tab[:500] = 0; tab[:, :380] = 0; tab[:, 716:] = 0
tab = cv2.dilate(tab, np.ones((5, 5), np.uint8))


def fill_pill(f, matte):
    person = cv2.dilate(matte[PY0:PY1], np.ones((7, 7), np.uint8)).astype(np.float32) / 255
    psoft = np.maximum(pcore, pshadow * (1 - person))[..., None]
    r = f[PY0:PY1].astype(np.float32)
    gain = (r[ring].mean(0) + 1) / (plate[ring].mean(0) + 1)
    g = f.copy()
    g[PY0:PY1] = np.clip(np.rint(plate * gain * psoft + r * (1 - psoft)), 0, 255).astype(np.uint8)
    return g


def caption_mask(f):
    band = f[BY0:BY1, BX0:BX1].astype(np.int16)
    mn, mx = band.min(2), band.max(2)
    m = ((mn > 190) & (mx - mn < 55)).astype(np.uint8) * 255     # the white letter cores (the collar never gets this white)
    box = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_RECT, (29, 13)))
    num, lab, stats, _ = cv2.connectedComponentsWithStats(box)
    keep = np.zeros_like(m)
    for i in range(1, num):
        x, y, w, h, area = stats[i]
        if w >= 60 and h >= 20 and area >= 1500:   # word lines; drops collar specks and the flowers
            keep[(lab == i) & (m > 0)] = 255
    full = np.zeros((H, W), np.uint8)
    full[BY0:BY1, BX0:BX1] = keep
    return cv2.dilate(full, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (19, 19)))   # covers the lilac anti-aliasing


from simple_lama_inpainting import SimpleLama
from PIL import Image
lama = SimpleLama()


def fill(f, m, y0, y1, x0, x1):
    mc = m[y0:y1, x0:x1]
    if not mc.any():
        return f
    ys = np.where(mc.any(1))[0]          # shrink the crop to the mask's rows (LaMa cost scales with area)
    a = max(0, (ys[0] - 48) // 8 * 8); b = min(y1 - y0, -(-(ys[-1] + 48) // 8) * 8)
    y0, y1 = y0 + a, y0 + b
    mc = m[y0:y1, x0:x1]
    hard = ((mc > 8) * 255).astype(np.uint8)
    crop = cv2.cvtColor(f[y0:y1, x0:x1], cv2.COLOR_BGR2RGB)
    crop[hard > 0] = 0
    res = np.array(lama(Image.fromarray(crop), Image.fromarray(hard)))[: y1 - y0, : x1 - x0]
    res = cv2.cvtColor(res, cv2.COLOR_RGB2BGR)
    soft = np.clip(cv2.GaussianBlur(mc.astype(np.float32) / 255, (0, 0), 2.5), 0, 1)[..., None]
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
    okm, mt = mcap.read()
    if i < PILL_END:
        f = fill_pill(f, cv2.cvtColor(mt, cv2.COLOR_BGR2GRAY))
        f = fill(f, tab, 456, 624, 336, 760)   # the tab hid the top of his hair: let LaMa grow it back
    cm = caption_mask(f)
    if i % 90 == 0:
        cv2.imwrite(dst.replace(".mp4", f"_cap_mask_{i}.png"), cm[CY0:CY1])
    f = fill(f, cm, CY0, CY1, CX0, CX1)
    out.stdin.write(f.tobytes())
    if i % 25 == 0:
        print("frame", i, flush=True)
    i += 1
out.stdin.close()
out.wait()
print("frames", i - A)
