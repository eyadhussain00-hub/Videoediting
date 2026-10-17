"""Second pass over cache/clean.mp4: frames where a caption line survived the first pass (single-frame leaks on
caption changes) get the mask + LaMa fill again, with a looser white threshold. → cache/clean2.mp4
Usage: python3 scripts/second_pass.py cache/clean.mp4 cache/clean2.mp4"""
import sys, subprocess, numpy as np, cv2, importlib.util
src, dst = sys.argv[1], sys.argv[2]
sys.argv = [sys.argv[0], "cache/src.mp4", "/dev/null", "--range", "0", "0"]
spec = importlib.util.spec_from_file_location("cc", "scripts/clean_captions.py")
cc = importlib.util.module_from_spec(spec); spec.loader.exec_module(cc)

def mask(f):
    band = f[cc.BY0:cc.BY1, cc.BX0:cc.BX1].astype(np.int16)
    mn, mx = band.min(2), band.max(2)
    m = ((mn > 165) & (mx - mn < 70)).astype(np.uint8) * 255
    # drop the zipper (a white vertical run far taller than a letter) so it can't merge with a word line
    m = cv2.subtract(m, cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((80, 1), np.uint8)))
    box = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_RECT, (31, 11)))
    num, lab, stats, _ = cv2.connectedComponentsWithStats(box)
    keep = np.zeros_like(m)
    for i in range(1, num):
        x, y, w, h, area = stats[i]
        if w >= 150 and area >= 2500 and (m[lab == i] > 0).mean() > 0.15:
            keep[(lab == i) & (m > 0)] = 255
    full = np.zeros((cc.H, cc.W), np.uint8)
    full[cc.BY0:cc.BY1, cc.BX0:cc.BX1] = keep
    return cv2.dilate(full, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (111, 87)))

cap = cv2.VideoCapture(src)
out = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{cc.W}x{cc.H}", "-r", "30", "-i", "-",
                        "-c:v", "libx264", "-crf", "12", "-preset", "medium", "-pix_fmt", "yuv420p", dst], stdin=subprocess.PIPE)
i = fixed = 0
while True:
    ok, f = cap.read()
    if not ok:
        break
    if not (1800 <= i <= 1838 or 183 <= i <= 222):
        m = mask(f)
        if m.any():
            f = cc.fill(f, m); fixed += 1
    out.stdin.write(f.tobytes()); i += 1
out.stdin.close(); out.wait()
print("frames", i, "refilled", fixed)
