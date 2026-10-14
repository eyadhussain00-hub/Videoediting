"""Person matte for the depth layer (type behind the speaker, head breaking out of the frame).
Usage: python3 scripts/matte.py cache/band.mp4 cache/matte.mp4 [--limit N]
rembg (u2net_human_seg) per frame on a half-size copy, upscaled with a guided refine against the full frame,
then temporally smoothed (3-frame median + EMA) so the edge doesn't boil. Output: grayscale H.264 (white = person)."""
import sys, subprocess, numpy as np, cv2
from rembg import new_session, remove

src, dst = sys.argv[1], sys.argv[2]
limit = int(sys.argv[sys.argv.index("--limit") + 1]) if "--limit" in sys.argv else None
seg = new_session("u2net_human_seg")
cap = cv2.VideoCapture(src)
W, H = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
out = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "gray", "-s", f"{W}x{H}", "-r", "30", "-i", "-",
                        "-c:v", "libx264", "-crf", "10", "-pix_fmt", "yuv420p", dst], stdin=subprocess.PIPE)
hist, ema, i = [], None, 0
while True:
    ok, f = cap.read()
    if not ok or (limit and i >= limit):
        break
    small = cv2.resize(f, (W * 2 // 3, H * 2 // 3), interpolation=cv2.INTER_AREA)
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
    if i % 100 == 0:
        print("frame", i, flush=True)
    i += 1
out.stdin.close(); out.wait()
print("frames", i)
