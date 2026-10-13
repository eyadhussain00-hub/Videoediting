"""RobustVideoMatting (ONNX, CPU) → foreground-with-alpha WebM (VP9 yuva420p) for text-behind-subject.
Usage: python3 scripts/matte.py assets/footage/clean.mp4 assets/footage/fg.webm"""
import cv2, numpy as np, onnxruntime as ort, subprocess, sys
src, dst = sys.argv[1], sys.argv[2]
sess = ort.InferenceSession('models/rvm_mobilenetv3_fp32.onnx', providers=['CPUExecutionProvider'])
rec = [np.zeros([1, 1, 1, 1], np.float32)] * 4
ds = np.array([0.25], np.float32)
cap = cv2.VideoCapture(src); w, h = int(cap.get(3)), int(cap.get(4))
p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgra', '-s', f'{w}x{h}', '-r', '24', '-i', '-',
                      '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '0', '-crf', '24', '-row-mt', '1', '-deadline', 'good',
                      '-cpu-used', '4', '-auto-alt-ref', '0', dst], stdin=subprocess.PIPE)
n = 0
while True:
    ok, f = cap.read()
    if not ok: break
    x = (cv2.cvtColor(f, cv2.COLOR_BGR2RGB).astype(np.float32) / 255).transpose(2, 0, 1)[None]
    fgr, pha, *rec = sess.run(None, {'src': x, 'r1i': rec[0], 'r2i': rec[1], 'r3i': rec[2], 'r4i': rec[3], 'downsample_ratio': ds})
    a = pha[0, 0]
    a = np.clip((a - 0.04) / 0.92, 0, 1)                       # tighten soft edges a little
    a = cv2.erode((a * 255).astype(np.uint8), np.ones((3, 3), np.uint8))
    a = cv2.GaussianBlur(a, (3, 3), 0)
    bgra = np.dstack([f, a]); p.stdin.write(bgra.tobytes()); n += 1
    if n % 200 == 0: print(n, flush=True)
p.stdin.close(); p.wait(); print('frames', n)
