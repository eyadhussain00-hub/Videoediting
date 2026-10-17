"""Person matte for the depth layer (type that sits behind the speaker).
Usage: python3 scripts/matte.py cache/raw.mp4 cache/matte.mp4 [model] [--limit N]
rembg per frame on a 540x960 copy, upscaled with a guided refine against the full-res frame,
then temporally smoothed (3-frame median + EMA) so the edge doesn't boil. Output: grayscale H.264 (white = person)."""
import sys, subprocess, numpy as np, cv2
from rembg import new_session, remove

src, dst = sys.argv[1], sys.argv[2]
model = sys.argv[3] if len(sys.argv) > 3 and not sys.argv[3].startswith("--") else "u2net_human_seg"
limit = int(sys.argv[sys.argv.index("--limit") + 1]) if "--limit" in sys.argv else None
W, H = 1080, 1920
seg = new_session(model)
cap = cv2.VideoCapture(src)
out = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "gray", "-s", f"{W}x{H}", "-r", "30", "-i", "-",
                        "-c:v", "libx264", "-crf", "10", "-pix_fmt", "yuv420p", dst], stdin=subprocess.PIPE)
hist, ema, i = [], None, 0
while True:
    ok, f = cap.read()
    if not ok or (limit and i >= limit):
        break
    small = cv2.resize(f, (540, 960), interpolation=cv2.INTER_AREA)
    m = remove(small, session=seg, only_mask=True).astype(np.float32) / 255
    m = cv2.resize(m, (W, H), interpolation=cv2.INTER_CUBIC)
    # edge-aware refine: guided filter against the luminance of the full frame
    g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255
    try:
        m = cv2.ximgproc.guidedFilter(g, m, 8, 1e-3)
    except AttributeError:
        m = cv2.GaussianBlur(m, (0, 0), 1.5)
    m = np.clip((m - 0.5) * 1.6 + 0.5, 0, 1)  # tighten the soft band
    hist.append(m); hist = hist[-3:]
    med = np.median(np.stack(hist), 0) if len(hist) == 3 else m
    ema = med if ema is None else 0.65 * med + 0.35 * ema
    out.stdin.write((np.clip(ema, 0, 1) * 255).astype(np.uint8).tobytes())
    if i % 100 == 0:
        print("frame", i, flush=True)
    i += 1
out.stdin.close(); out.wait()
print("frames", i)
