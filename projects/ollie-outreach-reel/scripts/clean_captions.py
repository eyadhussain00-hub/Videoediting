"""Remove the burned-in word-by-word captions from the source (720x1280, 30 fps, ~1827 frames).

The captions are white Montserrat (bold words, plus a lighter 2-line variant that fades in grey), centred,
always inside rows ~470-720. Pixel thresholds failed here (white pillars, walls, bottles fire; the grey
fade-ins don't), so the EasyOCR/CRAFT text detector finds the word boxes per frame; each frame's mask is the
union with its neighbours' (fades), and LaMa fills a tight crop of the band.
Writes video only. Usage:
  python3 scripts/clean_captions.py cache/src.mp4 cache/clean_X.mp4 [--range A B] [--threads N] [--masks] [--tight]
"""
import sys, subprocess, numpy as np, cv2

src, dst = sys.argv[1], sys.argv[2]
A, B = (int(sys.argv[sys.argv.index("--range") + 1]), int(sys.argv[sys.argv.index("--range") + 2])) if "--range" in sys.argv else (0, 10**9)
import torch
if "--threads" in sys.argv:
    torch.set_num_threads(int(sys.argv[sys.argv.index("--threads") + 1]))
W, H = 720, 1280
BY0, BY1 = 440, 760                    # band where caption text is searched
TIGHT = "--tight" in sys.argv            # letter-shaped mask instead of the whole word box


import easyocr
reader = easyocr.Reader(["en"], gpu=False, recognizer=False, verbose=False)


def caption_mask(f):
    """CRAFT word boxes in the band (text_threshold low enough to catch the grey fade-ins), padded."""
    boxes, _ = reader.detect(f[BY0:BY1], text_threshold=0.4, low_text=0.25, add_margin=0.08)
    full = np.zeros((H, W), np.uint8)
    for x0, x1, y0, y1 in boxes[0]:
        if x1 - x0 < 12 or y1 - y0 < 12:
            continue
        full[max(0, BY0 + y0 - 5):BY0 + y1 + 7, max(0, x0 - 6):x1 + 6] = 255   # + the soft drop shadow below
    if TIGHT:
        # only the letters inside the boxes: pixels clearly brighter than their surroundings and nearly grey.
        # A whole-box fill over his black shorts (pool shot) or chest (close-ups) regrew them as bare skin.
        g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY).astype(np.int16)
        loc = cv2.medianBlur(f, 21).min(2).astype(np.int16)
        sat = f.max(2).astype(np.int16) - f.min(2)
        core = (f.min(2) > 185) & (sat < 60)                          # solid white letters (big bold words)
        fade = (g - loc > 14) & (sat < 70) & (f.min(2) > 95)          # grey fade-ins and thin strokes
        let = (core | fade).astype(np.uint8) * 255
        let = cv2.morphologyEx(let, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
        let = cv2.dilate(let, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13)))
        full = cv2.bitwise_and(full, let)
    return full


from simple_lama_inpainting import SimpleLama
from PIL import Image
lama = SimpleLama()


def fill(f, m):
    if not m.any():
        return f
    ys = np.where(m.any(1))[0]
    y0 = max(0, (ys[0] - 40) // 8 * 8); y1 = min(H, -(-(ys[-1] + 40) // 8) * 8)
    mc = m[y0:y1]
    hard = ((mc > 8) * 255).astype(np.uint8)
    crop = cv2.cvtColor(f[y0:y1], cv2.COLOR_BGR2RGB)
    crop[hard > 0] = 0
    res = np.array(lama(Image.fromarray(crop), Image.fromarray(hard)))[: y1 - y0, :W]
    res = cv2.cvtColor(res, cv2.COLOR_RGB2BGR)
    soft = np.clip(cv2.GaussianBlur(mc.astype(np.float32) / 255, (0, 0), 2.0), 0, 1)[..., None]
    g = f.copy()
    g[y0:y1] = np.rint(res * soft + f[y0:y1] * (1 - soft)).astype(np.uint8)
    return g


cap = cv2.VideoCapture(src)
if A:
    cap.set(cv2.CAP_PROP_POS_FRAMES, A)
out = subprocess.Popen(
    ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}",
     "-r", "30", "-i", "-", "-c:v", "libx264", "-crf", "12", "-preset", "medium",
     "-pix_fmt", "yuv420p", dst], stdin=subprocess.PIPE)
buf = []                               # (frame, mask) lookahead of one so a fading word is covered on both sides
prev = None
i = A


def nxt():
    ok, f = cap.read()
    return (f, caption_mask(f)) if ok else None


cur = nxt(); ahead = nxt()
while i < B and cur is not None:
    f, cm = cur
    cm = cm.copy()
    for o in (prev, ahead):
        if o is not None:
            cm |= o[1]
    if "--masks" in sys.argv:
        vis = f.copy(); vis[cm > 0] = (0, 0, 255)
        f = vis
    else:
        f = fill(f, cm)
    out.stdin.write(f.tobytes())
    prev, cur, ahead = cur, ahead, (nxt() if ahead is not None else None)
    if i % 50 == 0:
        print("frame", i, flush=True)
    i += 1
out.stdin.close()
out.wait()
print("frames", i - A)
