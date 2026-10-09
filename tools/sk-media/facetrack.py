"""Face track for face framing. Usage: facetrack.py <webcam.mov> <out.json> <t0> <t1>   (sample every 0.5 s)
Run: uv run --with "opencv-python-headless==4.10.0.84" --with "numpy<2.3" python facetrack.py ..."""
import cv2, json, sys
src, out, t0, t1 = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
cc = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
cap = cv2.VideoCapture(src); res = []
t = t0
while t < t1:
    cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000); ok, fr = cap.read()
    if not ok: break
    g = cv2.cvtColor(fr, cv2.COLOR_BGR2GRAY)
    f = cc.detectMultiScale(g, 1.1, 6, minSize=(120, 120))
    if len(f):
        x, y, w, h = max(f, key=lambda r: r[2] * r[3])
        res.append({"t": round(t, 2), "cx": int(x + w / 2), "cy": int(y + h / 2), "w": int(w), "h": int(h)})
    t += 0.5
json.dump({"src": src, "W": fr.shape[1] if res else None, "H": fr.shape[0] if res else None, "track": res}, open(out, "w"))
print(out, len(res))
