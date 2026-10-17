"""Cut list: trims his longer pauses (vocal-stem envelope) → plan/segments.json, source frames [from, to).
Gaps of 0.45 s or more between words keep ~0.09 s of air either side of the cut; the breath after "exhale" stays.
Usage: python3 scripts/cuts.py"""
import json, numpy as np, soundfile as sf

FPS = 30
W = json.load(open("plan/words.json"))
v, sr = sf.read("cache/demucs/htdemucs/orig/vocals.wav")
v = v.mean(1) if v.ndim > 1 else v
hop = sr // 100
rms = np.array([np.sqrt((v[i:i + hop] ** 2).mean()) for i in range(0, len(v) - hop, hop)])
db = 20 * np.log10(rms + 1e-9)
quiet = db < -44
KEEP = {"exhale."}                       # a breath he means to take
segs, start = [], 0
for a, b in zip(W, W[1:]):
    if b["s"] - a["e"] < 0.45 or a["w"] in KEEP:
        continue
    # the quiet run inside the gap
    i0, i1 = int(a["e"] * 100), int(b["s"] * 100)
    q = np.where(quiet[i0:i1])[0]
    if len(q) < 20:
        continue
    qs, qe = (i0 + q[0]) / 100, (i0 + q[-1]) / 100
    cut_a, cut_b = qs + 0.09, qe - 0.06
    if cut_b - cut_a < 0.19:
        continue
    segs.append([start, round(cut_a * FPS)])
    start = round(cut_b * FPS)
segs.append([start, 3011])
json.dump(segs, open("plan/segments.json", "w"))
tot = sum(e - s for s, e in segs)
print(len(segs), "segments,", tot / FPS, "s of", 3011 / FPS)
