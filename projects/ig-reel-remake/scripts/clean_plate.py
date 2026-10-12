"""Remove the source reel's burned-in captions (white text band at y≈655–735 of 1280) by inpainting,
then pipe frames to ffmpeg, upscaled to 1080×1920. Output: public/clean.mp4 (no audio) + public/audio.wav."""
import cv2, numpy as np, subprocess, sys
SRC = "assets/footage/ref_DbNFGUCO-jJ.mp4"
cap = cv2.VideoCapture(SRC); fps = cap.get(cv2.CAP_PROP_FPS); w, h = 720, 1280
ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{w}x{h}", "-r", str(fps), "-i", "-",
    "-vf", "scale=1080:1920:flags=lanczos,unsharp=5:5:0.6:5:5:0.0", "-c:v", "libx264", "-crf", "14", "-preset", "slow",
    "-pix_fmt", "yuv420p", "-g", "12", "public/clean.mp4"], stdin=subprocess.PIPE)
k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (17, 17)); n = 0
while True:
    ok, f = cap.read()
    if not ok: break
    hsv = cv2.cvtColor(f, cv2.COLOR_BGR2HSV)
    m = ((hsv[..., 2] > 170) & (hsv[..., 1] < 70)).astype(np.uint8) * 255
    m[:655] = 0; m[735:] = 0
    m = cv2.dilate(m, k)
    ff.stdin.write(cv2.inpaint(f, m, 9, cv2.INPAINT_TELEA).tobytes()); n += 1
ff.stdin.close(); ff.wait(); print(n, "frames @", fps)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", SRC, "-vn", "-ar", "48000", "-ac", "2", "public/audio.wav"])
