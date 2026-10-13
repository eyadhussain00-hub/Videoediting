"""Remove the burned-in captions + opening title plate (mask: scripts/capmask.py), fill with LaMa (big-lama, CPU).
Each frame's mask is OR-ed with its neighbours' so words fading in/out leave no ghost.
LaMa only sees a crop around the mask's bounding box (faster on single small words).
Usage: python3 scripts/clean_captions.py cache/src24.mov cache/clean_A.mp4 --range A B [--threads N]"""
import sys, subprocess, numpy as np, cv2, torch
from PIL import Image
from capmask import text_mask, W, H
src, dst = sys.argv[1], sys.argv[2]
A, B = (int(sys.argv[sys.argv.index("--range") + 1]), int(sys.argv[sys.argv.index("--range") + 2])) if "--range" in sys.argv else (0, 10**9)
SC = float(sys.argv[sys.argv.index("--scale") + 1]) if "--scale" in sys.argv else 1.0  # LaMa at reduced res (0.5 ≈ 3.6× faster, fill nearly identical)
if "--threads" in sys.argv:
    torch.set_num_threads(int(sys.argv[sys.argv.index("--threads") + 1]))
from simple_lama_inpainting import SimpleLama
lama = SimpleLama()
cap = cv2.VideoCapture(src)
start = max(A - 1, 0)
cap.set(cv2.CAP_PROP_POS_FRAMES, start)
out = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", "24", "-i", "-",
                        "-c:v", "libx264", "-crf", "10", "-preset", "medium", "-pix_fmt", "yuv420p", dst], stdin=subprocess.PIPE)
buf = {}  # frame index -> (frame, mask); holds i-1, i, i+1
nxt = start
def fill(upto):
    global nxt
    while nxt <= upto:
        ok, f = cap.read()
        if not ok: return
        buf[nxt] = (f, text_mask(f)); nxt += 1
i = A
while i < B:
    fill(i + 1)
    if i not in buf: break
    f, m = buf[i]; m = m.copy()
    for k in (i - 1, i + 1):
        if k in buf: m |= buf[k][1]
    if m.any():
        ys, xs = np.nonzero(m)
        y0 = max(0, ys.min() - 48) // 8 * 8; y1 = min(H, (ys.max() + 56) // 8 * 8)
        x0 = max(0, xs.min() - 48) // 8 * 8; x1 = min(W, (xs.max() + 56) // 8 * 8)
        crop = f[y0:y1, x0:x1]; mc = m[y0:y1, x0:x1]
        c = cv2.resize(crop, None, fx=SC, fy=SC, interpolation=cv2.INTER_AREA) if SC < 1 else crop
        mm = cv2.resize(mc, (c.shape[1], c.shape[0]), interpolation=cv2.INTER_NEAREST) if SC < 1 else mc
        res = np.array(lama(Image.fromarray(cv2.cvtColor(c, cv2.COLOR_BGR2RGB)), Image.fromarray(mm)))[: c.shape[0], : c.shape[1]]
        res = cv2.cvtColor(res, cv2.COLOR_RGB2BGR)
        if SC < 1: res = cv2.resize(res, (x1 - x0, y1 - y0), interpolation=cv2.INTER_CUBIC)
        soft = cv2.GaussianBlur(mc.astype(np.float32) / 255, (0, 0), 2.5)[..., None]
        f = f.copy(); f[y0:y1, x0:x1] = (res * soft + f[y0:y1, x0:x1] * (1 - soft)).astype(np.uint8)
    out.stdin.write(f.tobytes())
    buf.pop(i - 1, None)
    if i % 48 == 0: print("frame", i, flush=True)
    i += 1
out.stdin.close(); out.wait()
print("done", A, i)
