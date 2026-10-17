"""Cut list → plan/segments.json (source frames [from, to), 30 fps).
A pause is cut where the transcript has a gap > 0.25 s AND the vocal stem stays quiet (RMS 20 dB under the
speech median) across it; 0.1 s of air is kept either side. The last segment ends 0.25 s after "no".
Usage: python3 scripts/cuts.py cache/demucs/htdemucs/orig/vocals.wav"""
import json, subprocess, sys, numpy as np
SR, FPS = 16000, 30
a = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", sys.argv[1], "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                                 capture_output=True, check=True).stdout, np.float32)
hop = SR // 100
rms = np.sqrt(np.convolve(a ** 2, np.ones(hop * 3) / (hop * 3), "same")[::hop] + 1e-12)
db = 20 * np.log10(rms)
quiet = db < np.median(db[db > np.percentile(db, 40)]) - 20
w = json.load(open("src/words.json"))
segs, cur = [], 0.0
for x, y in zip(w, w[1:]):
    if y["s"] - x["e"] <= 0.25:
        continue
    # widen to where the stem actually goes quiet / comes back
    i0, i1 = int(x["e"] * 100), int(y["s"] * 100)
    while i0 > 0 and not quiet[i0] and i0 > x["e"] * 100 - 15: i0 -= 1
    q = np.where(quiet[i0:i1 + 15])[0]
    if len(q) < 15:
        continue
    qa, qb = (i0 + q[0]) / 100, (i0 + q[-1]) / 100
    a_, b_ = qa + 0.1, qb - 0.1
    if b_ - a_ < 0.12:
        continue
    segs.append([round(cur * FPS), round(a_ * FPS)]); cur = b_
segs.append([round(cur * FPS), round((w[-1]["e"] + 0.25) * FPS)])
json.dump(segs, open("plan/segments.json", "w"))
kept = sum(b - a for a, b in segs) / FPS
print(len(segs), "segments", f"{kept:.2f}s kept of {w[-1]['e'] + 0.25:.2f}s", segs)
