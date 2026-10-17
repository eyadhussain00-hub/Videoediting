"""Speaker matte only where type sits behind him → cache/matte.mp4 (full length, black elsewhere).
rembg is ~1 s/frame on CPU, and only ~16 s of the reel needs a cut-out, so this mattes those source ranges
(same method as scripts/matte.py: 540x960 rembg, guided refine, 3-frame median + EMA) and reuses
cache/matte_0.mp4 (frames 0-721, an earlier full-matte run) for the hook.
Usage: python3 scripts/matte_ranges.py cache/src.mp4 cache/matte.mp4"""
import sys, subprocess, numpy as np, cv2
from rembg import new_session, remove

src, dst = sys.argv[1], sys.argv[2]
FPS, W, H = 30, 1080, 1920
# source seconds (with margins) of every BehindType beat after the hook
RANGES = [(35.4, 37.1), (46.2, 49.7), (58.5, 59.7), (69.5, 72.8), (76.4, 78.5), (91.9, 94.3), (132.1, 134.2)]
want = set()
for a, b in RANGES:
    want.update(range(int(a * FPS), int(b * FPS) + 1))
seg = new_session("u2net_human_seg")
cap = cv2.VideoCapture(src)
pre = cv2.VideoCapture(src.replace("src.mp4", "matte_0.mp4"))
n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
out = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "gray", "-s", f"{W}x{H}", "-r", "30", "-i", "-",
                        "-c:v", "libx264", "-crf", "10", "-pix_fmt", "yuv420p", dst], stdin=subprocess.PIPE)
black = np.zeros((H, W), np.uint8)
hist, ema = [], None
for i in range(n):
    ok, f = cap.read()
    if not ok:
        break
    okp, pm = pre.read()
    if okp:
        out.stdin.write(cv2.cvtColor(pm, cv2.COLOR_BGR2GRAY).tobytes())
        continue
    if i not in want:
        hist, ema = [], None
        out.stdin.write(black.tobytes())
        continue
    small = cv2.resize(f, (540, 960), interpolation=cv2.INTER_AREA)
    m = remove(small, session=seg, only_mask=True).astype(np.float32) / 255
    m = cv2.resize(m, (W, H), interpolation=cv2.INTER_CUBIC)
    g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255
    try:
        m = cv2.ximgproc.guidedFilter(g, m, 8, 1e-3)
    except AttributeError:
        m = cv2.GaussianBlur(m, (0, 0), 1.5)
    m = np.clip((m - 0.5) * 1.6 + 0.5, 0, 1)
    hist.append(m); hist = hist[-3:]
    med = np.median(np.stack(hist), 0) if len(hist) == 3 else m
    ema = med if ema is None else 0.65 * med + 0.35 * ema
    out.stdin.write((np.clip(ema, 0, 1) * 255).astype(np.uint8).tobytes())
    if i % 50 == 0:
        print("frame", i, flush=True)
out.stdin.close(); out.wait()
print("done", n)
