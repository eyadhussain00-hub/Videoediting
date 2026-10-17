"""Freeze frame for the end hold: public/img/last.png (last kept source frame of the clean plate)."""
import json, cv2
seg = json.load(open("plan/beats.json"))["segments"]   # the edit's own (trimmed) cut list
cap = cv2.VideoCapture("public/clean.mp4")
cap.set(cv2.CAP_PROP_POS_FRAMES, seg[-1][1] - 1)
ok, f = cap.read()
assert ok, "could not read the last kept frame"
cv2.imwrite("public/img/last.png", f)
