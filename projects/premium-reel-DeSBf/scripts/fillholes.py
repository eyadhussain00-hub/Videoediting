"""Fill interior holes in the speaker matte (rembg drops parts of his white shirt as "background", which showed
the dimmed plate through him). Per frame: largest blobs' outer contours filled, OR-ed with the soft matte.
Usage: python3 scripts/fillholes.py cache/matte.mp4 cache/matte_filled.mp4"""
import sys, subprocess, numpy as np, cv2
src, dst = sys.argv[1], sys.argv[2]
W, H = 1080, 1920
cap = cv2.VideoCapture(src)
out = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "gray", "-s", f"{W}x{H}", "-r", "24", "-i", "-",
                        "-c:v", "libx264", "-crf", "10", "-pix_fmt", "yuv420p", dst], stdin=subprocess.PIPE)
n = 0
while True:
    ok, f = cap.read()
    if not ok: break
    m = f[..., 0]
    if m.max() > 40:
        b = (m > 110).astype(np.uint8)
        cs, _ = cv2.findContours(b, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        fill = np.zeros_like(b)
        cv2.drawContours(fill, [c for c in cs if cv2.contourArea(c) > 5000], -1, 1, thickness=-1)
        fill = cv2.erode(fill, np.ones((5, 5), np.uint8))
        fill = cv2.GaussianBlur(fill.astype(np.float32), (0, 0), 2) * 255
        m = np.maximum(m, fill.astype(np.uint8))
    out.stdin.write(np.ascontiguousarray(m).tobytes()); n += 1
out.stdin.close(); out.wait(); print("frames", n)
