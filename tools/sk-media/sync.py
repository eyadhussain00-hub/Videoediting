#!/usr/bin/env python3
"""Match every Loom recording to its OBS webcam file by audio cross-correlation.
Usage: sync.py <src_dir> [--sr 8000] [--probe 60]
Looms = every *.mp4/*.webm (screen recordings); webcams = every *.mov. Filenames don't matter.
Run: uv run --with "numpy<2.3" python sync.py <src_dir>   (search ALL video folders of the subject: the right webcam
for a Loom was in the previous video's folder on TJR V3).
Prints JSON: best match per Loom with offset (webcam_t = loom_t + offset_s) and NCC score."""
import argparse, json, subprocess, sys
from pathlib import Path
import numpy as np

def load(path, sr, start=0.0, dur=None):
    cmd = ["ffmpeg", "-v", "error", "-ss", str(start), "-i", str(path)]
    if dur: cmd += ["-t", str(dur)]
    cmd += ["-ac", "1", "-ar", str(sr), "-f", "f32le", "-"]
    x = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32)
    return (x - x.mean()) / (x.std() + 1e-9)

def ncc(probe, sig):
    """Max normalised cross-correlation of probe against every window of sig."""
    n, m = len(probe), len(sig)
    if m < n: return 0.0, 0
    size = 1 << int(np.ceil(np.log2(n + m)))
    c = np.fft.irfft(np.fft.rfft(sig, size) * np.conj(np.fft.rfft(probe, size)), size)[: m - n + 1]
    cs = np.concatenate([[0], np.cumsum(sig.astype(np.float64) ** 2)])
    win = np.sqrt(np.maximum(cs[n:] - cs[:-n], 1e-9))
    score = c / (np.linalg.norm(probe) * win)
    i = int(np.argmax(score))
    return float(score[i]), i

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("src"); ap.add_argument("--sr", type=int, default=8000)
    ap.add_argument("--probe", type=float, default=60); ap.add_argument("--probe-start", type=float, default=10)
    a = ap.parse_args(); src = Path(a.src)
    files = [p for p in src.rglob("*") if p.is_file()]
    looms = [p for p in files if p.suffix.lower() in (".mp4", ".webm")]
    cams = [p for p in files if p.suffix.lower() == ".mov" and p not in looms]
    if not looms or not cams:
        print(json.dumps({"error": "need Loom files and .mov webcams", "looms": len(looms), "webcams": len(cams)})); sys.exit(1)
    cam_audio = {c: load(c, a.sr) for c in cams}
    out = []
    for l in looms:
        probe = load(l, a.sr, a.probe_start, a.probe)
        scores = []
        for c, sig in cam_audio.items():
            s, i = ncc(probe, sig)
            scores.append({"webcam": c.name, "ncc": round(s, 3), "offset_s": round(i / a.sr - a.probe_start, 3)})
        scores.sort(key=lambda r: -r["ncc"]); best = scores[0]
        out.append({"loom": l.name, "match": best if best["ncc"] >= 0.9 else None,
                    "status": "ok" if best["ncc"] >= 0.9 else "NO MATCH — ask for the webcam file", "candidates": scores[:3]})
    used = [o["match"]["webcam"] for o in out if o["match"]]
    dup = {w for w in used if used.count(w) > 1}
    for o in out:
        if o["match"] and o["match"]["webcam"] in dup: o["status"] = "CONFLICT — webcam matched to multiple Looms"
    print(json.dumps(out, indent=2))

if __name__ == "__main__": main()
