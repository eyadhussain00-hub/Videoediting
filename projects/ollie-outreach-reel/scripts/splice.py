"""Splice the --tight re-runs over the box-mask pass: cache/clean720.mp4 + clean_b2 (frames 101-330, close-ups)
+ clean_d1..d3 (1000-1573, pool shot) → cache/clean720s.mp4. Whole-box fills regrew his shorts/chest as bare skin there."""
import subprocess, cv2
W, H = 720, 1280
PATCH = [(101, "cache/clean_b2.mp4"), (1000, "cache/clean_d1.mp4"), (1192, "cache/clean_d2.mp4"), (1384, "cache/clean_d3.mp4")]
base = cv2.VideoCapture("cache/clean720.mp4")
out = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", "30", "-i", "-",
                        "-c:v", "libx264", "-crf", "12", "-preset", "medium", "-pix_fmt", "yuv420p", "cache/clean720s.mp4"], stdin=subprocess.PIPE)
patch, i = None, 0
while True:
    ok, f = base.read()
    if not ok:
        break
    for start, path in PATCH:
        if i == start:
            patch = cv2.VideoCapture(path)
    if patch is not None:
        okp, g = patch.read()
        if okp:
            f = g
        else:
            patch = None
    out.stdin.write(f.tobytes()); i += 1
out.stdin.close(); out.wait()
print("frames", i)
