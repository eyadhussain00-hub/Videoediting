"""Remove the burned-in blue title pill ("What is High Ticket Sales", frames 0-293, y 228-312 at 720p) by
pasting the static wall from a median plate of the later frames, gain-matched per frame, feathered edges;
then upscale 720x1280 → 1080x1920 (lanczos + light unsharp). Output: cache/clean.mp4 (H.264 crf 12, no audio).
Usage: python3 scripts/clean_title.py cache/src.mp4 cache/clean.mp4"""
import sys, subprocess, numpy as np, cv2
src, dst = sys.argv[1], sys.argv[2]
cap = cv2.VideoCapture(src); fr = []
while True:
    ok, f = cap.read()
    if not ok: break
    fr.append(f)
plate = np.median(np.stack(fr[300::30]), 0).astype(np.float32)
H, W = fr[0].shape[:2]
mask = np.zeros((H, W), np.float32); mask[218:322, :] = 1
mask = cv2.GaussianBlur(mask, (0, 0), 4)[..., None]
ref = (slice(330, 380), slice(0, 120))  # bare wall under the pill, left of his head, for exposure matching
out = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", "30", "-i", "-",
                        "-vf", "scale=1080:1920:flags=lanczos,unsharp=5:5:0.45", "-c:v", "libx264", "-crf", "12", "-pix_fmt", "yuv420p", dst],
                       stdin=subprocess.PIPE)
for i, f in enumerate(fr):
    g = f.astype(np.float32)
    if i < 296:
        gain = g[ref].mean((0, 1)) / (plate[ref].mean((0, 1)) + 1e-6)
        g = g * (1 - mask) + plate * gain * mask
    out.stdin.write(np.clip(g, 0, 255).astype(np.uint8).tobytes())
out.stdin.close(); out.wait(); print("frames", len(fr))
