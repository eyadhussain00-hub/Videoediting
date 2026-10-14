#!/usr/bin/env python3
"""Where Adnan's head is: top of his hair and bottom of his beard, per frame (YuNet face detector, models/yunet.onnx).

Used by render.py (how much room each cut can get above his head: the fill above the shot must never cut into his hair)
and qa.py (title/cards stay above his hair, captions stay below his beard — Sofian 30 Sep: "captions never on his chin,
they have to be below"). Calibrated 30 Sep on #2/#6/#12/#16 frames at 1080×1920: the YuNet box top sits 0.17–0.27
box-heights under the top of his hair and the box bottom 0.12–0.18 above the tip of his beard → layout.json qa.hair_k /
qa.beard_k add a margin on top of that.

Usage: heads.py <video> [--rotate ccw] [--from s --to s --fps 4]   → prints t, hair top, beard bottom (1080×1920 px)"""
import argparse, json, subprocess
from functools import lru_cache
from pathlib import Path
import numpy as np

HERE = Path(__file__).resolve().parent
L = json.loads((HERE / "layout.json").read_text(encoding="utf-8"))
MODEL = HERE / "models" / "yunet.onnx"
MODEL_URL = "https://huggingface.co/opencv/face_detection_yunet/resolve/main/face_detection_yunet_2023mar.onnx"
DW, DH = 540, 960   # detection size (half of the 1080×1920 canvas: fast, still ~0.95 confidence on his face)


@lru_cache(None)
def detector():
    import cv2
    if not MODEL.exists():
        MODEL.parent.mkdir(parents=True, exist_ok=True); subprocess.run(["curl", "-sL", "-o", str(MODEL), MODEL_URL], check=True)
    return cv2.FaceDetectorYN.create(str(MODEL), "", (DW, DH), 0.6)


def head(img_bgr):
    """→ (hair_top, beard_bottom, face box) in the image's own pixels, or None if no face. Largest face wins."""
    import cv2
    h0, w0 = img_bgr.shape[:2]; small = cv2.resize(img_bgr, (DW, DH), interpolation=cv2.INTER_AREA) if (w0, h0) != (DW, DH) else img_bgr
    _, f = detector().detect(np.ascontiguousarray(small))
    if f is None or not len(f): return None
    # his face is 0.2–0.45 of the frame width and taller than wide; anything else is a hand, the plant or a reflection
    f = [r for r in f if 0.12 * DW <= r[2] <= 0.6 * DW and 0.9 <= r[3] / r[2] <= 1.8 and r[-1] >= 0.75]
    if not f: return None
    x, y, w, h = max(f, key=lambda r: r[2] * r[3])[:4] * np.array([w0 / DW, h0 / DH, w0 / DW, h0 / DH])
    Q = L["qa"]
    return float(y - Q["hair_k"] * h), float(y + h + Q["beard_k"] * h), (float(x), float(y), float(w), float(h))


def frames(video, t0, t1, fps, vf):
    """Decoded frames (bgr, 1080×1920 after `vf`) about every 1/fps s from t0 to t1 → [(t, img)]. Every k-th real frame
    (not the fps filter, whose rounding labelled a frame of the next cut with this cut's time — #10, 30 Sep)."""
    n_, d_ = map(int, subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate",
                                      "-of", "csv=p=0", str(video)], capture_output=True, text=True).stdout.strip().split("/"))
    vfps = n_ / d_; k = max(1, round(vfps / fps))
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t0:.3f}", "-i", str(video), "-t", f"{max(0.05, t1 - t0):.3f}",
                          "-vf", f"{vf}select='not(mod(n\\,{k}))',scale={DW}:{DH}", "-fps_mode", "passthrough",
                          "-f", "rawvideo", "-pix_fmt", "bgr24", "-"], capture_output=True).stdout
    n = len(raw) // (DW * DH * 3)
    return [(t0 + i * k / vfps, np.frombuffer(raw, np.uint8, DW * DH * 3, i * DW * DH * 3).reshape(DH, DW, 3)) for i in range(n)]


def track(video, t0, t1, rot="", fps=4):
    """Hair top / beard bottom of the raw shot (rotated, scaled to fill 1080×1920, no zoom) → [(t, hair, beard)]; frames
    without a face are left out."""
    W, H = L["canvas"]["w"], L["canvas"]["h"]
    vf = f"{rot}scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},"
    out = []
    for t, img in frames(video, t0, t1, fps, vf):
        r = head(img)
        if r: out.append((t, r[0] * H / DH, r[1] * H / DH))
    return despike(out)


def despike(tr):
    """3-sample running median: a one-frame false detection (hand, plant) vanishes, real movement (smooth) stays."""
    if len(tr) < 3: return tr
    med = lambda i, k: float(np.median([tr[j][k] for j in range(max(0, i - 1), min(len(tr), i + 2))]))
    return [(t, med(i, 1), med(i, 2)) for i, (t, *_ ) in enumerate(tr)]


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("video"); ap.add_argument("--rotate", default="")
    ap.add_argument("--from", dest="t0", type=float, default=0); ap.add_argument("--to", dest="t1", type=float, default=10)
    ap.add_argument("--fps", type=float, default=4)
    a = ap.parse_args()
    rot = {"ccw": "transpose=2,", "cw": "transpose=1,"}.get(a.rotate, "")
    for t, hair, beard in track(a.video, a.t0, a.t1, rot, a.fps): print(f"{t:7.2f}  hair {hair:6.0f}  beard {beard:6.0f}")


if __name__ == "__main__":
    main()
