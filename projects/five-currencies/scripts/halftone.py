"""Halftone cut-out of the speaker for the identity collage beat (Collage B-roll look).
Usage: python3 scripts/halftone.py cache/raw.mp4 public/halftone.mp4 START END
Head and shoulders (above the old caption band) → rembg person mask → 45-degree dot screen
on cream, a cream sticker border and a soft paper shadow, baked onto the mustard paper."""
import sys, subprocess, numpy as np, cv2
from rembg import new_session, remove

src, dst, a, b = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
S, SS, CELL = 1080, 2, 12
PAPER = np.array([0x3C, 0xB1, 0xE2], np.float32)  # BGR #E2B13C
CREAM = np.array([0xD7, 0xEA, 0xF3], np.float32)  # BGR #F3EAD7
INK = np.array([0x14, 0x12, 0x11], np.float32)
seg = new_session("u2net_human_seg")
cap = cv2.VideoCapture(src)
cap.set(cv2.CAP_PROP_POS_MSEC, a * 1000)
out = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{S}x{S}", "-r", "30", "-i", "-",
                        "-c:v", "libx264", "-crf", "14", "-pix_fmt", "yuv420p", dst], stdin=subprocess.PIPE)
N = S * SS
c = CELL * SS
g = np.arange(-N, 2 * N, c)
gx, gy = np.meshgrid(g, g)
rx = ((gx - gy) / np.sqrt(2) + N / 2).ravel()
ry = ((gx + gy) / np.sqrt(2)).ravel()
keep = (rx > -c) & (rx < N + c) & (ry > -c) & (ry < N + c)
rx, ry = rx[keep], ry[keep]
for i in range(int(round((b - a) * 30))):
    ok, f = cap.read()
    if not ok:
        break
    crop = f[20:900, 100:980]  # 880x880, stays above the old caption band
    m = remove(crop, session=seg, only_mask=True)
    m = cv2.resize(m, (S, S)).astype(np.float32) / 255
    m[int(S * 0.97):] = 0
    gray = cv2.cvtColor(cv2.resize(crop, (N, N)), cv2.COLOR_BGR2GRAY).astype(np.float32) / 255
    gray = cv2.createCLAHE(2.0, (8, 8)).apply((gray * 255).astype(np.uint8)).astype(np.float32) / 255
    gray = np.clip((gray ** 0.85 - 0.5) * 1.25 + 0.55, 0, 1)
    blur = cv2.GaussianBlur(gray, (0, 0), c * 0.3)
    dots = np.full((N, N), 255, np.uint8)
    xs = np.clip(rx.astype(int), 0, N - 1); ys = np.clip(ry.astype(int), 0, N - 1)
    rad = np.sqrt(np.clip(1 - blur[ys, xs], 0, 1)) * c * 0.6
    for x, y, r in zip(rx, ry, rad):
        if r > 0.6:
            cv2.circle(dots, (int(x), int(y)), int(r), 0, -1, lineType=cv2.LINE_AA)
    dots = cv2.resize(dots, (S, S), interpolation=cv2.INTER_AREA).astype(np.float32)[..., None] / 255
    hard = (m > 0.5).astype(np.uint8)
    border = cv2.dilate(hard, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31))).astype(np.float32)
    border = cv2.GaussianBlur(border, (0, 0), 1.2)[..., None]
    shadow = cv2.GaussianBlur(np.roll(np.roll(border[..., 0], 14, 0), 10, 1), (0, 0), 10)[..., None]
    mm = cv2.GaussianBlur(m, (0, 0), 1.0)[..., None]
    img = PAPER * (1 - 0.35 * shadow)
    img = img * (1 - border) + CREAM * border
    person = CREAM * dots + INK * (1 - dots)
    img = img * (1 - mm) + person * mm
    out.stdin.write(np.clip(img, 0, 255).astype(np.uint8).tobytes())
out.stdin.close(); out.wait()
print("done")
