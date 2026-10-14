#!/usr/bin/env python3
"""Finds voices that aren't Adnan's inside kept audio: the director's "three, two, one, go", "good", off-camera notes.

30 Sep, Sofian: "you can hear me say the word 'go' in the start of videos as well". Whisper can't be trusted with this —
in #14 it wrote the director's "go" and Adnan's "so" 0.6 s later as one stretched word "so". The lav tells them apart:
Adnan is on it, the director is not. A voice that is loud on the camera mic but ≥ `offmic.db` quieter on the lav than
Adnan's own camera/lav balance is someone else.

Usage: offmic.py <camera video> <lav.wav> [--from s --to s]         → prints each off-mic voice (source seconds)
Used by pauses.py --edit (the first cut starts after it) and check.py (FAIL if one is in the first or last second of the
video). Only the head and tail of a take are judged: that's where the director talks, and mid-take the camera mic's
room sound gives false hits (checked 30 Sep on #2, #10, #12, #17)."""
import argparse, json, subprocess
from functools import lru_cache
from pathlib import Path
import numpy as np

HERE = Path(__file__).resolve().parent
O = json.loads((HERE / "layout.json").read_text(encoding="utf-8"))["offmic"]
SR, HOP = 16000, 0.02


@lru_cache(None)
def levels(path):
    x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-vn", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                                     capture_output=True, check=True).stdout, np.float32)
    n = int(SR * HOP); m = len(x) // n
    return 10 * np.log10((x[:m * n].reshape(m, n) ** 2).mean(1) + 1e-12)


def voices(video, lav, t0=0.0, t1=None):
    """[(start, end)] source seconds where someone other than Adnan speaks, between t0 and t1."""
    cam, mic = levels(str(video)), levels(str(lav)); n = min(len(cam), len(mic)); cam, mic = cam[:n], mic[:n]
    his = mic > np.percentile(mic, 97) - O["his_db"]                 # frames where Adnan is clearly talking
    base = float(np.median(cam[his] - mic[his]))                      # his camera-vs-lav balance
    loud = cam > np.percentile(cam, 97) - O["cam_db"]                 # someone is talking near the camera…
    other = loud & (cam - mic > base + O["db"]) & ~his                # …and it isn't on Adnan's lav
    i0, i1 = int(t0 / HOP), int((t1 if t1 is not None else n * HOP) / HOP)
    out, k = [], i0
    while k < min(i1, n):
        if other[k]:
            j = k
            while j < n and (other[j] or (j + 1 < n and other[j + 1])): j += 1   # bridge 1-frame dips
            if (j - k) * HOP >= O["min_s"]:
                # the word's own onset and decay are quieter than its core: widen while it still isn't Adnan
                tail = (cam > np.percentile(cam, 97) - O["cam_db"] - O.get("tail_db", 10)) & (cam - mic > base + O["db"] / 2) & ~his
                a0, a1 = k, j
                while a0 > 0 and tail[a0 - 1]: a0 -= 1
                while a1 < n and tail[a1]: a1 += 1
                out.append((round(a0 * HOP, 2), round(a1 * HOP, 2))); j = max(j, a1)
            k = j
        else: k += 1
    return out


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("video"); ap.add_argument("lav")
    ap.add_argument("--from", dest="t0", type=float, default=0); ap.add_argument("--to", dest="t1", type=float)
    a = ap.parse_args()
    for s, e in voices(a.video, a.lav, a.t0, a.t1): print(f"off-mic voice {s:7.2f}–{e:7.2f}")


if __name__ == "__main__":
    main()
