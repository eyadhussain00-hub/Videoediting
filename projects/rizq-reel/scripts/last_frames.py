"""Freeze frames for the end hold: public/img/last.png (clean plate) and last_fg.png (speaker with alpha)."""
import cv2, numpy as np
def last(path):
    cap = cv2.VideoCapture(path); n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)); f = None
    cap.set(cv2.CAP_PROP_POS_FRAMES, n - 3)
    while True:
        ok, g = cap.read()
        if not ok: return f
        f = g
c = last("public/clean.mp4"); m = cv2.cvtColor(last("cache/matte.mp4"), cv2.COLOR_BGR2GRAY)
m = np.clip((m.astype(np.float32) - 60) * 1.4, 0, 255).astype(np.uint8)
m = cv2.GaussianBlur(cv2.erode(m, np.ones((3, 3), np.uint8)), (0, 0), 1.2)
cv2.imwrite("public/img/last.png", c)
cv2.imwrite("public/img/last_fg.png", np.dstack([c, m]))
