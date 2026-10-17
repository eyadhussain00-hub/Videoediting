"""Remove the burned-in title and list (masks from text_masks.py) with LaMa → clean video (no audio).
LaMa runs at half res on two crops (title band, list band) to keep CPU time near 1 s/frame; the fill is upscaled
and feathered in only where the mask is, with a little luma grain so the beard fill doesn't read as smooth.
Usage: python3 scripts/clean_text.py cache/src.mp4 cache/masks.npz cache/clean_x.mp4 [--range A B] [--threads N]
       python3 scripts/clean_text.py ... --still FRAME out.png   (one frame, for checking)"""
import sys, subprocess, numpy as np, cv2, torch

src, mpath, dst = sys.argv[1:4]
arg = lambda k, i=1: sys.argv[sys.argv.index(k) + i]
A, B = (int(arg("--range")), int(arg("--range", 2))) if "--range" in sys.argv else (0, 10**9)
if "--threads" in sys.argv:
    torch.set_num_threads(int(arg("--threads")))
W, H = 1080, 1920
CROPS = [(272, 544, 96, 1008), (944, 1648, 48, 1008)]     # (y0, y1, x0, x1) full res, multiples of 16

z = np.load(mpath)
MASKS = z["masks"]
NUMS = np.unpackbits(MASKS[-1], axis=1)[:, :540].astype(bool)
NUMS[:, 80:] = False                                         # the "1." … "7." column is on screen the whole reel

from simple_lama_inpainting import SimpleLama
from PIL import Image
lama = SimpleLama()
rng = np.random.default_rng(3)


def mask_full(i):
    m = np.unpackbits(MASKS[min(i, len(MASKS) - 1)], axis=1)[:, :540].astype(bool) | NUMS
    m = cv2.resize(m.astype(np.uint8) * 255, (W, H), interpolation=cv2.INTER_LINEAR)
    return cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))


def head_run(row):
    """Left/right edge of the skin run through the centre column of one row (None if the centre isn't skin)."""
    skin = (row[:, 2].astype(int) - row[:, 0]) > 65
    xs = np.where(~skin)[0]
    if skin[540] == 0:
        return None
    l = xs[xs < 540]; r = xs[xs > 540]
    # bridge 1-3 px specks of non-skin (glare) by requiring 4 non-skin in a row
    def edge(cands, step):
        for x in cands[::step]:
            if not skin[max(0, x - 3):x + 4].any() if step == -1 else not skin[x:x + 4].any():
                return x
        return 0 if step == -1 else 1079
    return edge(l, -1), edge(r, 1)


def dome(f, g, m):
    """The title boxes hid the top of his (bald) head and LaMa fills it with wall. Rebuild it: fit the head's
    half-width below the boxes as an ellipse (w^2 quadratic in y), extrapolate up, and fill with the skin row just
    under the boxes, stretched to each row's width, slightly darker toward the crown."""
    col = np.where(m[272:620, 540] > 0)[0]
    if not len(col):
        return g
    yb = 272 + col.max() + 4
    ys, cs, ws = [], [], []
    for y in range(yb, yb + 120, 4):
        e = head_run(f[y])
        if e:
            ys.append(y); cs.append((e[0] + e[1]) / 2); ws.append((e[1] - e[0]) / 2)
    if len(ys) < 12:
        return g
    ys, cs, ws = map(np.array, (ys, cs, ws))
    # ellipse x^2/a^2 + (y-cy)^2/b^2 = 1 with b = K*a, pinned to the width w0 and the slope dw/dy measured just
    # under the boxes: centre depth d = s*K^2*w0 below yb, a^2 = w0^2 + d^2/K^2. Robust where a free fit isn't.
    K = 1.15
    near = ys < yb + 44
    s_, w0 = np.polyfit(ys[near], ws[near], 1)[0], np.polyval(np.polyfit(ys[near], ws[near], 1), yb)
    s_ = float(np.clip(s_, 0.3, 4.0))
    d = s_ * K * K * w0; ax = np.sqrt(w0 * w0 + d * d / (K * K)); b = K * ax; cy = yb + d
    lc = np.polyfit(ys[near], cs[near], 1); lc[0] = np.clip(lc[0], -0.5, 0.5)
    src_row = cv2.GaussianBlur(f[yb + 1:yb + 4].astype(np.float32), (0, 0), sigmaX=5, sigmaY=0.1)[1]; c0 = np.polyval(lc, yb + 2)
    w0 = ax * np.sqrt(max(1 - ((yb + 2 - cy) / b) ** 2, 1e-6))
    xs = np.arange(W, dtype=np.float32)
    out = g.astype(np.float32)
    for y in range(yb + 3, 272, -1):
        w2 = ax * ax * (1 - ((y - cy) / b) ** 2)
        if w2 <= 4:
            break
        w = np.sqrt(w2); c = np.polyval(lc, y)
        u = c0 + (xs - c) * w0 / w
        line = np.stack([np.interp(u, xs, src_row[:, k]) for k in range(3)], 1)
        line *= 1 - 0.10 * np.clip((yb - y) / 90, 0, 1)                    # crown falls off a touch
        a = np.clip(w + 0.5 - np.abs(xs - c), 0, 1.5)[:, None] / 1.5       # anti-aliased edge
        a *= (m[y] > 0)[:, None] if y < yb - 2 else (m[y] > 0)[:, None] * 0.5
        out[y] = line * a + out[y] * (1 - a)
    return np.clip(np.rint(out), 0, 255).astype(np.uint8)


def clean(f, m):
    g = f.copy()
    for y0, y1, x0, x1 in CROPS:
        mc = m[y0:y1, x0:x1]
        if not mc.any():
            continue
        hw, hh = (x1 - x0) // 2, (y1 - y0) // 2
        small = cv2.resize(f[y0:y1, x0:x1], (hw, hh), interpolation=cv2.INTER_AREA)
        ms = (cv2.resize(mc, (hw, hh), interpolation=cv2.INTER_AREA) > 8).astype(np.uint8) * 255
        ms = cv2.dilate(ms, np.ones((3, 3), np.uint8))
        rgb = cv2.cvtColor(small, cv2.COLOR_BGR2RGB); rgb[ms > 0] = 0
        res = np.array(lama(Image.fromarray(rgb), Image.fromarray(ms)))[:hh, :hw]
        res = cv2.resize(cv2.cvtColor(res, cv2.COLOR_RGB2BGR), (x1 - x0, y1 - y0), interpolation=cv2.INTER_CUBIC).astype(np.float32)
        if y0 > 600:                                                        # grain only on the beard fill
            res += rng.normal(0, 3.2, res.shape[:2])[..., None]
        soft = np.clip(cv2.GaussianBlur(mc.astype(np.float32) / 255, (0, 0), 2.0), 0, 1)[..., None]
        g[y0:y1, x0:x1] = np.clip(np.rint(res * soft + f[y0:y1, x0:x1] * (1 - soft)), 0, 255).astype(np.uint8)
    return dome(f, g, m)


cap = cv2.VideoCapture(src)
if "--still" in sys.argv:
    k = int(arg("--still"))
    cap.set(cv2.CAP_PROP_POS_FRAMES, k); ok, f = cap.read()
    cv2.imwrite(arg("--still", 2), clean(f, mask_full(k)))
    sys.exit()
if A:
    cap.set(cv2.CAP_PROP_POS_FRAMES, A)
out = subprocess.Popen(
    ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", "30", "-i", "-",
     "-c:v", "libx264", "-crf", "12", "-preset", "medium", "-pix_fmt", "yuv420p", dst], stdin=subprocess.PIPE)
i = A
while i < B:
    ok, f = cap.read()
    if not ok:
        break
    out.stdin.write(clean(f, mask_full(i)).tobytes())
    if i % 25 == 0:
        print("frame", i, flush=True)
    i += 1
out.stdin.close(); out.wait()
print("frames", i - A)
