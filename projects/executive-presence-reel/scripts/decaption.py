"""Remove the burned-in white captions from the source reel (band y≈1205-1265) by masked inpainting.
Usage: python3 scripts/decaption.py cache/source.mp4 cache/clean.mp4 [--test N]"""
import cv2, numpy as np, sys, subprocess
src, dst = sys.argv[1], sys.argv[2]
test = int(sys.argv[4]) if len(sys.argv) > 4 and sys.argv[3] == '--test' else None
Y0, Y1, X0, X1 = 1190, 1285, 40, 1040

def clean(f):
    band = f[Y0:Y1, X0:X1]
    hsv = cv2.cvtColor(band, cv2.COLOR_BGR2HSV)
    m = ((hsv[..., 2] > 215) & (hsv[..., 1] < 40)).astype(np.uint8)
    m[:12] = 0; m[-12:] = 0
    cols = np.where(m.sum(0) >= 2)[0]
    if len(cols) < 6: return f, 0
    # caption text is one centred run: take its full extent, merge gaps
    xa, xb = X0 + cols.min() - 14, X0 + cols.max() + 18
    ya, yb = 1200, 1272                       # glyphs + drop shadow
    out = f.astype(np.float32)
    top = out[ya-6:ya, xa:xb].mean(0)         # rows just above / below
    bot = out[yb:yb+6, xa:xb].mean(0)
    hgt = yb - ya
    t = np.linspace(0, 1, hgt)[:, None, None]
    fill = top[None] * (1 - t) + bot[None] * t
    fill = cv2.GaussianBlur(fill, (0, 0), sigmaX=3, sigmaY=0.1)
    # borrow real fabric grain from the band just above (high-pass)
    src_tex = out[ya-hgt-8:ya-8, xa:xb]
    tex = src_tex - cv2.GaussianBlur(src_tex, (0, 0), 3)
    fill = fill + tex * 0.9
    # feathered rectangle mask
    mk = np.zeros(f.shape[:2], np.float32); mk[ya:yb, xa:xb] = 1
    mk = cv2.GaussianBlur(mk, (0, 0), 3)[..., None]
    full = out.copy(); full[ya:yb, xa:xb] = fill
    res = out * (1 - mk) + full * mk
    return np.clip(res, 0, 255).astype(np.uint8), 1

cap = cv2.VideoCapture(src)
if test is not None:
    cap.set(cv2.CAP_PROP_POS_FRAMES, test); ok, f = cap.read()
    o, _ = clean(f)
    cv2.imwrite(dst, np.vstack([f[1100:1400], o[1100:1400]])); sys.exit()
w, h = int(cap.get(3)), int(cap.get(4))
p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{w}x{h}', '-r', '24',
                      '-i', '-', '-i', src, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-crf', '14', '-preset', 'medium',
                      '-pix_fmt', 'yuv420p', '-c:a', 'copy', dst], stdin=subprocess.PIPE)
n = 0
while True:
    ok, f = cap.read()
    if not ok: break
    o, _ = clean(f); p.stdin.write(o.tobytes()); n += 1
p.stdin.close(); p.wait(); print('frames', n)
