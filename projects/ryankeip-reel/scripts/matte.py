"""Person matte for the depth layer (type that sits behind the speaker).
Usage: python3 scripts/matte.py cache/src.mp4 cache/matte.mp4 [--range A B]
MediaPipe selfie_multiclass_256x256 (person = 1 - background confidence; model in cache/models/, see PROGRESS.md),
run on the frame's two halves stacked as squares (more pixels per person than one 256 squash), upscaled with a
guided filter against the full-res frame, then temporally smoothed so the edge doesn't boil. rembg was ~10x slower.
Output: grayscale H.264 (white = person)."""
import sys, subprocess, numpy as np, cv2, mediapipe as mp
from mediapipe.tasks.python import vision, BaseOptions

src, dst = sys.argv[1], sys.argv[2]
A, B = (int(sys.argv[sys.argv.index("--range") + 1]), int(sys.argv[sys.argv.index("--range") + 2])) if "--range" in sys.argv else (0, 10**9)
W, H = 1080, 1920
seg = vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(
    base_options=BaseOptions(model_asset_path="cache/models/selfie_multiclass.tflite"), output_confidence_masks=True))


def person(img):
    r = seg.segment(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))))
    return 1 - r.confidence_masks[0].numpy_view().astype(np.float32)


cap = cv2.VideoCapture(src)
if A:
    cap.set(cv2.CAP_PROP_POS_FRAMES, A)
out = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "gray", "-s", f"{W}x{H}", "-r", "30", "-i", "-",
                        "-c:v", "libx264", "-crf", "10", "-pix_fmt", "yuv420p", dst], stdin=subprocess.PIPE)
LOW = np.clip((np.arange(H, dtype=np.float32)[:, None] - 1050) / 150, 0, 1) * np.ones((1, W), np.float32)
ema, i = None, A
while i < B:
    ok, f = cap.read()
    if not ok:
        break
    top, bot = f[:1080], f[840:]                       # two overlapping 1080x1080 squares
    m = np.zeros((H, W), np.float32); wsum = np.zeros((H, 1), np.float32)
    ramp = np.ones((1080, 1), np.float32)
    ramp_t = ramp.copy(); ramp_t[840:] = np.linspace(1, 0, 240)[:, None]
    ramp_b = ramp.copy(); ramp_b[:240] = np.linspace(0, 1, 240)[:, None]
    m[:1080] += cv2.resize(person(top), (1080, 1080), interpolation=cv2.INTER_CUBIC) * ramp_t
    m[840:] += cv2.resize(person(bot), (1080, 1080), interpolation=cv2.INTER_CUBIC) * ramp_b
    wsum[:1080] += ramp_t; wsum[840:] += ramp_b
    m /= wsum
    g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255
    try:
        m = cv2.ximgproc.guidedFilter(g, m, 10, 1e-3)
    except AttributeError:
        m = cv2.GaussianBlur(m, (0, 0), 1.5)
    m = np.clip((m - 0.5) * 1.8 + 0.5, 0, 1)
    m = np.maximum(m, LOW)                           # below the chest nothing sits behind him: keep the plate whole
    ema = m if ema is None else 0.7 * m + 0.3 * ema
    out.stdin.write((np.clip(ema, 0, 1) * 255).astype(np.uint8).tobytes())
    if i % 100 == 0:
        print("frame", i, flush=True)
    i += 1
out.stdin.close(); out.wait()
print("frames", i - A)
