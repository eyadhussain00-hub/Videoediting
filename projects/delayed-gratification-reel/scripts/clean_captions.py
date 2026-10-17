"""Remove the burned-in text from the source reel (720x1280, 24 fps, 880 frames), at native resolution.

Two overlays:
  title    white rounded boxes "Why Delayed Gratification is the Secret to Business Success" (y ~595-755,
           frames 0 to ~65) over his chest and moving hand. Per-frame mask of the white boxes; LaMa fill.
  caption  one line of glowing words (white / red / green / yellow, y ~900-948) on his sweater, every frame.
           Letter cores by colour, kept only as text-line components inside the band (the white pen that
           crosses the band touches its edges and is skipped), dilated over the glow; LaMa fill on a tight crop.
Writes video only. Usage:
  python3 scripts/clean_captions.py cache/src.mp4 cache/clean720.mp4 [--range A B] [--threads N]
"""
import sys, subprocess, numpy as np, cv2

src, dst = sys.argv[1], sys.argv[2]
A, B = (int(sys.argv[sys.argv.index("--range") + 1]), int(sys.argv[sys.argv.index("--range") + 2])) if "--range" in sys.argv else (0, 10**9)
import torch
if "--threads" in sys.argv:
    torch.set_num_threads(int(sys.argv[sys.argv.index("--threads") + 1]))
W, H = 720, 1280
TY0, TY1 = 576, 776                    # title rows searched
BY0, BY1, BX0, BX1 = 884, 1000, 60, 660  # caption band searched
CY0, CY1, CX0, CX1 = 832, 1040, 0, 720  # caption crop LaMa sees (multiples of 8)


def title_mask(f):
    band = f[TY0:TY1].astype(np.int16)
    m = ((band.min(2) > 225) & (band.max(2) - band.min(2) < 30)).astype(np.uint8) * 255
    if m.sum() / 255 < 8000:
        return None
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((17, 17), np.uint8))   # swallow the black letters
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    keep = np.zeros_like(m)
    for c in cs:
        if cv2.contourArea(c) > 3000:
            cv2.drawContours(keep, [c], -1, 255, -1)
    full = np.zeros((H, W), np.uint8)
    full[TY0:TY1] = keep
    return cv2.dilate(full, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (17, 17)))   # + the box's soft shadow


def caption_mask(f):
    b = f[BY0:BY1, BX0:BX1].astype(np.int16)
    bl, gr, rd = b[..., 0], b[..., 1], b[..., 2]
    mn, mx = b.min(2), b.max(2)
    core = ((mn > 195) & (mx - mn < 60)) | ((rd > 180) & (gr < 100) & (bl < 100)) \
        | ((gr > 180) & (rd < 190) & (bl < 150)) | ((rd > 185) & (gr > 185) & (bl < 120))
    core = core.astype(np.uint8) * 255
    box = cv2.dilate(core, cv2.getStructuringElement(cv2.MORPH_RECT, (21, 9)))
    num, lab, stats, _ = cv2.connectedComponentsWithStats(box)
    keep = np.zeros_like(core)
    for i in range(1, num):
        x, y, w, h, area = stats[i]
        if y <= 1:                                # crosses the band's top edge: the pen or his hand, not text
            continue
        if w >= 30 and 14 <= h <= 80 and area >= 400:
            keep[(lab == i)] = 255
    full = np.zeros((H, W), np.uint8)
    full[BY0:BY1, BX0:BX1] = keep
    # glow: coloured halo around the letters
    halo = cv2.dilate(full, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31)))
    # the red/green/yellow glow reaches further than that: tinted pixels near the letters
    near = cv2.dilate(full, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (121, 91))) > 0
    g = f.astype(np.int16); bl, gr, rd = g[..., 0], g[..., 1], g[..., 2]
    tint = (((rd - np.maximum(gr, bl) > 9) & (gr < 0.62 * rd)) | ((gr - np.maximum(rd, bl) > 14) & (rd < 0.8 * gr))) & near   # not skin
    ys, xs = np.where(full > 0)
    if len(ys):                                   # plus the line's own box, padded: the glow's faint outer ring
        halo[max(0, ys.min() - 28):ys.max() + 28, max(0, xs.min() - 40):xs.max() + 40] = 255
    tint = cv2.dilate(tint.astype(np.uint8) * 255, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11)))
    return np.maximum(halo, tint)


from simple_lama_inpainting import SimpleLama
from PIL import Image
lama = SimpleLama()


def fill(f, m, y0, y1, x0, x1):
    mc = m[y0:y1, x0:x1]
    if not mc.any():
        return f
    ys = np.where(mc.any(1))[0]          # shrink the crop to the mask's rows (LaMa cost scales with area)
    a = max(0, (ys[0] - 40) // 8 * 8); b = min(y1 - y0, -(-(ys[-1] + 40) // 8) * 8)
    y0, y1 = y0 + a, y0 + b
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
     "-r", "24", "-i", "-", "-c:v", "libx264", "-crf", "10", "-preset", "medium",
     "-pix_fmt", "yuv420p", dst], stdin=subprocess.PIPE)
i = A
while i < B:
    ok, f = cap.read()
    if not ok:
        break
    tm = title_mask(f)
    if tm is not None:
        f = fill(f, tm, 552, 800, 40, 680)
    cm = caption_mask(f)
    if i % 60 == 0:
        cv2.imwrite(dst.replace(".mp4", f"_cap_mask_{i}.png"), np.hstack([f[CY0:CY1, CX0:CX1, 1], cm[CY0:CY1, CX0:CX1]]))
    f = fill(f, cm, CY0, CY1, CX0, CX1)
    out.stdin.write(f.tobytes())
    if i % 25 == 0:
        print("frame", i, flush=True)
    i += 1
out.stdin.close()
out.wait()
print("frames", i - A)
