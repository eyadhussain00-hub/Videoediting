"""Remove the burned-in text from @officialillumine's ISA vs SIPP reel (1080x1920, 30 fps, 2250 frames).

Three overlays, all yellow (or white) letters with a dark outline/shadow:
  caption  one line of white + yellow words on his trousers (y ~1415-1490), changing every second or so.
  labels   "STOCKS ISA" / "SIPP" on the two glasses (y ~1740-1835) from ~2 s on.
  list     the top-right checklist on the wall (x ~590-1060, y ~280-660), ~8-56 s.
The camera is locked off, so the wall behind the list is the median of the list-free frames (a plate),
exposure-matched per frame; a list letter whose surroundings don't match the plate (his arm in front)
goes to LaMa instead. Caption and labels: LaMa on tight crops.
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
CAP = (1384, 1528, 0, 1080)        # caption crop LaMa sees (y0, y1, x0, x1; multiples of 8)
LAB = (1704, 1864, 264, 920)       # glass labels
LST = (256, 704, 560, 1080)        # top-right list (plate region)


def yellow(f):
    b, g, r = (f[..., k].astype(np.int16) for k in range(3))
    return (r > 170) & (g > 160) & (b < 120) & (g * 4 > r * 3)


def white(f):
    f = f.astype(np.int16)
    mn, mx = f.min(2), f.max(2)
    return (mn > 200) & (mx - mn < 45)


def lines(m, minw, minh, mina, k=(29, 13)):
    box = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_RECT, k))
    num, lab, st, _ = cv2.connectedComponentsWithStats(box)
    keep = np.zeros_like(m)
    for i in range(1, num):
        x, y, w, h, a = st[i]
        if w >= minw and h >= minh and a >= mina:
            keep[(lab == i) & (m > 0)] = 255
    return keep


def region_mask(f, R, use_white, minw, minh, mina, grow, box=None, shadow=0):
    """Letter mask, dilated by `grow`; with `box` (top, bottom, side pad) the whole padded line rectangle
    instead, which also takes the soft drop shadow under the caption."""
    y0, y1, x0, x1 = R
    c = f[y0:y1, x0:x1]
    m = (yellow(c) | (white(c) if use_white else False)).astype(np.uint8) * 255
    keep = lines(m, minw, minh, mina)
    full = np.zeros((H, W), np.uint8)
    if box and keep.any():
        ys, xs = np.where(keep > 0)
        t, b, sd = box
        full[max(y0, y0 + ys.min() - t):min(y1, y0 + ys.max() + b), max(0, x0 + xs.min() - sd):min(W, x0 + xs.max() + sd)] = 255
        return full
    d = cv2.dilate(keep, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (grow, grow)))
    if shadow:                                   # the soft drop shadow sits a few px below the letters
        d = np.maximum(d, np.roll(cv2.dilate(keep, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (grow + 6, grow + 6))), shadow, 0))
    full[y0:y1, x0:x1] = d
    return full


def frames(idx):
    cap = cv2.VideoCapture(src)
    for k in idx:
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(k))
        ok, f = cap.read()
        if ok:
            yield k, f


def list_plate():
    y0, y1, x0, x1 = LST
    cand = [f[y0:y1, x0:x1] for k, f in frames(list(range(0, 230, 6)) + list(range(1700, 2160, 10)))
            if yellow(f[y0:y1, x0:x1]).sum() < 40]
    print("plate frames", len(cand), flush=True)
    return np.median(np.stack(cand), 0).astype(np.float32)


from simple_lama_inpainting import SimpleLama
from PIL import Image
lama = SimpleLama()


def fill(f, m, R):
    y0, y1, x0, x1 = R
    mc = m[y0:y1, x0:x1]
    if not mc.any():
        return f
    ys, xs = np.where(mc.any(1))[0], np.where(mc.any(0))[0]   # shrink the crop to the mask (LaMa cost scales with area)
    a = max(0, (ys[0] - 40) // 8 * 8); b = min(y1 - y0, -(-(ys[-1] + 40) // 8) * 8)
    c = max(0, (xs[0] - 64) // 8 * 8); d = min(x1 - x0, -(-(xs[-1] + 64) // 8) * 8)
    y0, y1, x0, x1 = y0 + a, y0 + b, x0 + c, x0 + d
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


plate = list_plate()
cv2.imwrite(dst.replace(".mp4", "_list_plate.png"), plate)


def fill_list(f):
    """Plate under the list letters; components the plate doesn't explain (his arm) go back as a LaMa mask."""
    y0, y1, x0, x1 = LST
    c = f[y0:y1, x0:x1]
    m = lines(yellow(c).astype(np.uint8) * 255, 20, 12, 150, k=(21, 11))
    if not m.any():
        return f, None
    core = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))
    ring = (cv2.dilate(core, np.ones((25, 25), np.uint8)) > 0) & (core == 0)
    cf = c.astype(np.float32)
    gain = (cf[ring].mean(0) + 1) / (plate[ring].mean(0) + 1)
    diff = np.abs(cf - plate * gain).max(2)
    num, lab = cv2.connectedComponents(cv2.dilate(core, np.ones((9, 9), np.uint8)))
    bad = np.zeros_like(core)
    rl = cv2.dilate(core, np.ones((25, 25), np.uint8))
    for i in range(1, num):
        comp = lab == i
        rr = (cv2.dilate(comp.astype(np.uint8), np.ones((25, 25), np.uint8)) > 0) & (core == 0)
        if rr.any() and np.median(diff[rr]) > 18:
            bad[comp & (core > 0)] = 255
    good = (core > 0) & (bad == 0)
    soft = np.clip(cv2.GaussianBlur(good.astype(np.float32), (0, 0), 2.0) * 1.3, 0, 1)[..., None]
    g = f.copy()
    g[y0:y1, x0:x1] = np.clip(np.rint(plate * gain * soft + cf * (1 - soft)), 0, 255).astype(np.uint8)
    if not bad.any():
        return g, None
    full = np.zeros((H, W), np.uint8)
    full[y0:y1, x0:x1] = bad
    return g, full


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
    cm = region_mask(f, CAP, True, 50, 20, 1200, 23, shadow=9)
    lm = region_mask(f, LAB, False, 40, 18, 600, 17)
    f, bad = fill_list(f)
    if i % 90 == 0:
        cv2.imwrite(dst.replace(".mp4", f"_mask_{i}.png"), np.vstack([cm[CAP[0]:CAP[1]], lm[LAB[0]:LAB[1]]]))
    f = fill(f, cm, CAP)
    f = fill(f, lm, LAB)
    if bad is not None:
        f = fill(f, bad, LST)
    out.stdin.write(f.tobytes())
    if i % 25 == 0:
        print("frame", i, flush=True)
    i += 1
out.stdin.close()
out.wait()
print("frames", i - A)
