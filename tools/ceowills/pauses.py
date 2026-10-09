#!/usr/bin/env python3
"""Silence-safe pause removal for long takes → the "cuts" list for edit.json.

Usage: pauses.py <mic.wav> <words.json> --blocks "3.0-33.2,50.5-75.12,76.18-118.3" [--video raw.mp4] [--layout layout.json]

Blocks = the parts of the take you keep (source seconds; put each edge somewhere in the silence around it). Inside
each block, silences ≥ min_pause_s are cut down to keep_pause_s. A cut only lands where both the full band and the
3.5–11 kHz band are quiet (so soft consonants survive), on a video-frame boundary, never inside a word. ASR words
longer than guard_long_s usually swallowed a pause (Adnan pauses mid-sentence and Whisper stretches the word over it),
so only guard_edge_s at each end of those words is protected. Block edges snap to the real speech (energy), not to
Whisper's word times — Whisper stretches first words back into the silence before them.
Prints JSON cuts [{"in","out","punch"}] (every other cut punched in, to hide the jump cuts) and a summary on stderr.
Numbers: layout.json → cuts (min_pause_s, keep_pause_s, quiet_db, hf_band_hz, min_clip_s, guard_long_s, guard_edge_s)."""
import argparse, json, subprocess, sys
from pathlib import Path
import numpy as np

HOP = 0.005
SR = 48000


def band_db(x, lo=None, hi=None):
    n, hop = int(SR * HOP) * 2, int(SR * HOP)
    frames = np.lib.stride_tricks.sliding_window_view(np.pad(x, (n // 2, n)), n)[::hop]
    spec = np.abs(np.fft.rfft(frames * np.hanning(n), axis=1)) ** 2
    f = np.fft.rfftfreq(n, 1 / SR)
    sel = np.ones_like(f, bool) if lo is None else (f >= lo) & (f <= hi)
    return 10 * np.log10(spec[:, sel].sum(1) + 1e-12)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("audio"); ap.add_argument("words")
    ap.add_argument("--blocks", required=True, help='"in-out,in-out,…" in source seconds')
    ap.add_argument("--video", help="camera file (for its frame rate); default 25 fps")
    ap.add_argument("--layout", default=str(Path(__file__).with_name("layout.json")))
    a = ap.parse_args()
    C = json.loads(Path(a.layout).read_text(encoding="utf-8"))["cuts"]
    fps = 25.0
    if a.video:
        r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate", "-of", "csv=p=0",
                            a.video], capture_output=True, text=True).stdout.strip()
        n, d = map(float, r.split("/")); fps = n / d
    x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", a.audio, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                                     capture_output=True, check=True).stdout, np.float32).astype(np.float64)
    full, hf = band_db(x), band_db(x, *C["hf_band_hz"])
    words = json.loads(Path(a.words).read_text(encoding="utf-8"))
    blocks = [tuple(map(float, b.split("-"))) for b in a.blocks.split(",")]
    edge, long_ = C.get("guard_edge_s", 0.2), C.get("guard_long_s", 0.5)
    pieces_all, removed = [], 0.0
    for t0, t1 in blocks:
        i0, i1 = int(t0 / HOP), min(int(t1 / HOP), len(full) - 1)
        seg_f, seg_h = full[i0:i1], hf[i0:i1]
        quiet = (seg_f < np.percentile(seg_f, 90) - C["quiet_db"]) & (seg_h < np.percentile(seg_h, 90) - C["quiet_db"])
        loud = np.flatnonzero(~quiet)
        if not len(loud):
            continue
        guard = quiet.copy()
        for w in words:
            if not (t0 <= w["start"] < t1):
                continue
            spans = [(w["start"], w["end"])]
            if w["end"] - w["start"] > long_:
                spans = [(w["start"], w["start"] + edge), (w["end"] - edge, w["end"])]
            for ws, we in spans:
                guard[max(0, int(ws / HOP) - i0): max(0, min(int(we / HOP), i1) - i0)] = False
        energy = seg_f + seg_h

        def boundary(lo, hi, mask):
            """Quietest frame boundary in [lo, hi] that lies in silence."""
            c = [k / fps for k in range(int(np.ceil(lo * fps)), int(np.floor(hi * fps)) + 1)]
            c = [t for t in c if 0 <= int(t / HOP) - i0 < len(mask) and mask[int(t / HOP) - i0]]
            return min(c, key=lambda t: energy[int(t / HOP) - i0]) if c else None

        first, last = (i0 + loud[0]) * HOP, (i0 + loud[-1] + 1) * HOP        # real speech edges (energy)
        # at least pad_before/pad_after of air, so soft onsets and final consonants survive ("sorted" has a quiet "d"
        # release 0.15 s after its voiced part), then the quietest frame within the next 0.25 s
        pb, pa = C.get("pad_before_s", 0.1), C.get("pad_after_s", 0.12)
        s = boundary(max(t0, first - pb - 0.25), first - pb, quiet) or max(t0, np.floor((first - pb) * fps) / fps)
        e = boundary(last + pa, min(t1, last + pa + 0.25), quiet) or min(t1, np.ceil((last + pa) * fps) / fps)
        pieces, cur, k, n = [], s, 0, len(guard)
        while k < n:
            if guard[k]:
                j = k
                while j < n and guard[j]: j += 1
                p0, p1 = (i0 + k) * HOP, (i0 + j) * HOP
                if p1 - p0 >= C["min_pause_s"] and p0 > s and p1 < e:
                    half = C["keep_pause_s"] / 2
                    cin, cout = boundary(p0 + 0.02, p0 + half + 0.03, guard), boundary(p1 - half - 0.03, p1 - 0.02, guard)
                    if cin and cout and cout - cin > 0.05:
                        pieces.append((cur, cin)); removed += cout - cin; cur = cout
                k = j
            else:
                k += 1
        pieces.append((cur, e))
        merged = []
        for p in pieces:          # fold micro-clips back into their neighbour
            if merged and (p[1] - p[0] < C["min_clip_s"] or merged[-1][1] - merged[-1][0] < C["min_clip_s"]):
                removed -= p[0] - merged[-1][1]; merged[-1] = (merged[-1][0], p[1])
            else:
                merged.append(p)
        pieces_all += merged
    cuts = [{"in": round(p, 2), "out": round(q, 2), **({"punch": True} if i % 2 else {})} for i, (p, q) in enumerate(pieces_all)]
    print(json.dumps(cuts))
    print(f"{len(cuts)} cuts, {sum(c['out'] - c['in'] for c in cuts):.1f} s kept, {removed:.1f} s of pauses removed", file=sys.stderr)


if __name__ == "__main__":
    main()
