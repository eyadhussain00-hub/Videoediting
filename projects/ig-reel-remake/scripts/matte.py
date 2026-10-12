"""Person matte for every source frame (rembg u2net_human_seg) → public/matte.mp4 (grayscale, 1080×1920).
Light temporal smoothing (EMA) to cut flicker. Used for text-behind-subject moments (head over the wall)."""
import cv2, numpy as np, subprocess
from rembg import remove, new_session
from PIL import Image
s = new_session("u2net_human_seg")
cap = cv2.VideoCapture("assets/footage/ref_DbNFGUCO-jJ.mp4"); fps = cap.get(cv2.CAP_PROP_FPS)
ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "gray", "-s", "540x960", "-r", str(fps), "-i", "-",
    "-vf", "scale=1080:1920:flags=bicubic", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", "-g", "12", "public/matte.mp4"], stdin=subprocess.PIPE)
prev = None; n = 0
while True:
    ok, f = cap.read()
    if not ok: break
    m = np.array(remove(Image.fromarray(cv2.cvtColor(f, cv2.COLOR_BGR2RGB)), session=s, only_mask=True)).astype(np.float32)
    m = cv2.resize(m, (540, 960), interpolation=cv2.INTER_AREA)
    prev = m if prev is None else prev * 0.35 + m * 0.65
    ff.stdin.write(np.clip(prev, 0, 255).astype(np.uint8).tobytes()); n += 1
    if n % 200 == 0: print(n, flush=True)
ff.stdin.close(); ff.wait(); print("done", n)
