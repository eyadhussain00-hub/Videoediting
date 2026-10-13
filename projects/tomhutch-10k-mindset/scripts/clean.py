#!/usr/bin/env python3
"""Strip the source reel's burned-in captions → cache/clean.mp4 (video only, same timing).
Word captions sit in a fixed band at chest height: white thin strokes on the navy shirt, found with a
white top-hat (thin bright detail only — pillows, hands and pants are too wide to survive it) and inpainted.
The white hook-title box (top, first ~8.5 s) is inpainted as a whole rectangle; the new title card covers it.
Usage: clean.py source.mp4 out.mp4 [--frames t1,t2,...  → writes cache/clean_<t>.png instead]"""
import subprocess, sys
import cv2, numpy as np
BAND = (1120, 1310, 40, 1040)          # y0, y1, x0, x1 of the word-caption band
TITLE = (318, 516, 118, 962)           # hook-title box region
K = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25))
D = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))

def clean(f):
    y0, y1, x0, x1 = BAND
    roi = f[y0:y1, x0:x1]
    g = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    th = cv2.morphologyEx(g, cv2.MORPH_TOPHAT, K)
    white = (roi.min(axis=2) > 150) & (roi.max(axis=2).astype(int) - roi.min(axis=2) < 60)
    m = ((th > 60) & white).astype(np.uint8) * 255
    m = cv2.dilate(m, D)
    if m.any():
        f[y0:y1, x0:x1] = cv2.inpaint(roi, m, 7, cv2.INPAINT_TELEA)
    ty0, ty1, tx0, tx1 = TITLE
    box = f[ty0:ty1, tx0:tx1]
    if PLATE is not None and (box.min(axis=2) > 225).mean() > 0.25:   # title box on screen → patch from a clean plate
        f[:] = (f * (1 - FEATHER) + align(PLATE, f) * FEATHER).astype(np.uint8)
    return f

def align(plate, f):
    """Warp the clean plate onto this frame (the source has punch-in zooms). ECC affine on the top background,
    tried from identity and from the last good warp; the candidate with the lowest residual wins (ECC alone can diverge)."""
    global LAST
    s = 0.25
    a = cv2.resize(cv2.cvtColor(plate, cv2.COLOR_BGR2GRAY), None, fx=s, fy=s).astype(np.float32)
    b = cv2.resize(cv2.cvtColor(f, cv2.COLOR_BGR2GRAY), None, fx=s, fy=s).astype(np.float32)
    cands = [np.eye(2, 3, dtype=np.float32), LAST.copy()]
    for init in list(cands):
        try:
            _, w = cv2.findTransformECC(a, b, init.copy(), cv2.MOTION_AFFINE, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 100, 1e-5), ECC_MASK, 5)
            sx, sy = np.hypot(*w[:, 0]), np.hypot(*w[:, 1])
            if 0.85 < sx < 1.5 and abs(sx - sy) < 0.03 and abs(w[1, 0]) < 0.03 and abs(w[0, 1]) < 0.03:
                cands.append(w)
        except cv2.error:
            pass
    m = ECC_MASK > 0
    def err(w):
        return np.abs(cv2.warpAffine(a, w, (a.shape[1], a.shape[0]), borderMode=cv2.BORDER_REPLICATE) - b)[m].mean()
    w = min(cands, key=err); LAST = w.copy()
    w = w.copy(); w[:, 2] /= s
    return cv2.warpAffine(plate, w, (f.shape[1], f.shape[0]), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)

LAST = np.eye(2, 3, dtype=np.float32)
PLATE = None
H0, W0 = 1920, 1080
ECC_MASK = np.zeros((H0 // 4, W0 // 4), np.uint8); ECC_MASK[: 560 // 4] = 255
ECC_MASK[(TITLE[0] - 20) // 4:(TITLE[1] + 20) // 4, (TITLE[2] - 20) // 4:(TITLE[3] + 20) // 4] = 0
FEATHER = np.zeros((H0, W0), np.float32); FEATHER[TITLE[0] - 8:TITLE[1] + 8, TITLE[2] - 8:TITLE[3] + 8] = 1
FEATHER = cv2.GaussianBlur(FEATHER, (0, 0), 6)[..., None]

def main():
    src, out = sys.argv[1], sys.argv[2]
    cap = cv2.VideoCapture(src)
    global PLATE
    cap.set(cv2.CAP_PROP_POS_MSEC, 9200); PLATE = cap.read()[1]; cap.set(cv2.CAP_PROP_POS_MSEC, 0)
    if "--frames" in sys.argv:
        for t in sys.argv[sys.argv.index("--frames") + 1].split(","):
            cap.set(cv2.CAP_PROP_POS_MSEC, float(t) * 1000); ok, f = cap.read()
            orig = f.copy(); c = clean(f)
            cv2.imwrite(f"{out}/clean_{t}.jpg", np.hstack([orig, c])[::2, ::2])
        return
    W, H = int(cap.get(3)), int(cap.get(4))
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", "30",
                            "-i", "-", "-c:v", "libx264", "-crf", "12", "-preset", "medium", "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
    n = 0
    while True:
        ok, f = cap.read()
        if not ok: break
        enc.stdin.write(clean(f).tobytes()); n += 1
    enc.stdin.close(); enc.wait(); print(f"clean: {n} frames → {out}")

if __name__ == "__main__": main()
