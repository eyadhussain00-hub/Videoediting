"""Masks of the burned-in text in the source reel → cache/masks.npz (per-frame bool masks at half res, packed).

Two overlays, both static once they appear (the camera moves, the text doesn't):
  title  "7 Actions That INCREASE Your Rizq!" white on two black boxes (y ~295-515), the whole reel.
  list   "1. … 7." white type with a dark stroke (y ~975-1610); the numbers are there from frame 0 and each
         item pops in when he says it, then stays.
A pixel is text at frame t when it is near-white in at least 90% of the next 1.5 s of frames (the window is clamped
to the last 1.5 s at the end): text never leaves, his face and the glasses glare do. The title is near-white or
box-black for 90% of the whole reel. The pop-in frames are caught by OR-ing the raw
per-frame white mask inside the item's dilated final shape. Masks are dilated to cover the stroke and shadow.
Usage: python3 scripts/text_masks.py cache/src.mp4 cache/masks.npz"""
import sys, numpy as np, cv2

src, dst = sys.argv[1], sys.argv[2]
W, H = 540, 960              # masks are computed and stored at half res (upscaled when used)
TY0, TY1 = 140, 265          # title band
LY0, LY1 = 480, 815          # list band

cap = cv2.VideoCapture(src)
white_t, dark_t, white_l = [], [], []
while True:
    ok, f = cap.read()
    if not ok:
        break
    f = cv2.resize(f, (W, H), interpolation=cv2.INTER_AREA)
    t = f[TY0:TY1].astype(np.int16)
    white_t.append((t.min(2) > 215) & (t.max(2) - t.min(2) < 40))
    dark_t.append(t.max(2) < 28)
    l = f[LY0:LY1].astype(np.int16)
    white_l.append((l.min(2) > 200) & (l.max(2) - l.min(2) < 45))
n = len(white_l)
white_l = np.stack(white_l); white_t = np.stack(white_t); dark_t = np.stack(dark_t)

# title: static the whole way through
title = (white_t.mean(0) > 0.9) | (dark_t.mean(0) > 0.9)
title = cv2.morphologyEx(title.astype(np.uint8) * 255, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
cs, _ = cv2.findContours(title, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
tm = np.zeros_like(title)
for c in cs:
    if cv2.contourArea(c) > 750:
        cv2.drawContours(tm, [c], -1, 255, -1)
tm = cv2.dilate(tm, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))) > 0
tm[:, :50] = False; tm[:, 500:] = False          # the boxes sit in x ~60-490; the bright wall beside them isn't text

# list: suffix persistence (share of frames t..end that are white)
WIN = 45
cs_ = np.concatenate([np.zeros((1,) + white_l.shape[1:], np.uint16), np.cumsum(white_l, 0, dtype=np.uint16)])
def persistent(i):
    a = min(i, n - WIN)
    return (cs_[a + WIN] - cs_[a]) > 0.9 * WIN
k_small = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
k_big = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (17, 17))
masks = np.zeros((n, H, W), bool)
for i in range(n):
    pers = persistent(i)
    p8 = pers.astype(np.uint8) * 255
    # pop-in: white pixels near where text will be in a moment
    j = min(n - 1, i + 10)
    soon = persistent(j).astype(np.uint8) * 255
    pop = white_l[i] & (cv2.dilate(soon, k_big) > 0)
    m = cv2.dilate(((p8 > 0) | pop).astype(np.uint8) * 255, k_small) > 0
    masks[i, LY0:LY1] = m
    masks[i, TY0:TY1] |= tm
np.savez_compressed(dst, masks=np.packbits(masks, axis=2), n=n)
for i in (0, n // 2, n - 1):
    cv2.imwrite(dst.replace(".npz", f"_{i}.png"), masks[i].astype(np.uint8) * 255)
print("frames", n, "mask px at end", int(masks[-1].sum()))
