"""Last pass over cache/clean720s.mp4 → cache/clean720f.mp4: two lounger-shot words CRAFT never boxed ("day" at
frames 512-536, "try" at 566-592, white on the wicker). There a plain white-letter mask is safe (nothing else in
x 150-570, y 500-720 is that white) and LaMa fills it. Other frames pass through untouched."""
import subprocess, numpy as np, cv2
from simple_lama_inpainting import SimpleLama
from PIL import Image
W, H = 720, 1280
RANGES = [(512, 537), (566, 593)]
Y0, Y1, X0, X1 = 496, 720, 144, 576
lama = SimpleLama()
cap = cv2.VideoCapture("cache/clean720s.mp4")
out = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", "30", "-i", "-",
                        "-c:v", "libx264", "-crf", "12", "-preset", "medium", "-pix_fmt", "yuv420p", "cache/clean720f.mp4"], stdin=subprocess.PIPE)
i = 0
while True:
    ok, f = cap.read()
    if not ok:
        break
    if any(a <= i < b for a, b in RANGES):
        c = f[Y0:Y1, X0:X1]
        m = ((c.min(2) > 150) & (c.max(2).astype(int) - c.min(2) < 60)).astype(np.uint8) * 255   # a looser grey threshold eats the wicker
        m = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13)))
        if m.any():
            crop = cv2.cvtColor(c, cv2.COLOR_BGR2RGB); crop[m > 0] = 0
            res = cv2.cvtColor(np.array(lama(Image.fromarray(crop), Image.fromarray(m)))[: Y1 - Y0, : X1 - X0], cv2.COLOR_RGB2BGR)
            soft = np.clip(cv2.GaussianBlur(m.astype(np.float32) / 255, (0, 0), 2), 0, 1)[..., None]
            f = f.copy(); f[Y0:Y1, X0:X1] = np.rint(res * soft + c * (1 - soft)).astype(np.uint8)
    out.stdin.write(f.tobytes()); i += 1
out.stdin.close(); out.wait()
print("frames", i)
