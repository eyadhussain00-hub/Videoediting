#!/usr/bin/env python3
"""Stutter-free pause removal.
Usage: pauses.py --cutlist cutlist.json --words <dir> --audio <dir> [--layout layout.json]
cutlist.json : [{"src": "loom1", "in": 12.34, "out": 20.10, ...extra keys kept}]
words/<src>.json : WhisperX output — [{"word","start","end"}] or {"segments":[{"words":[...]}]}
audio/<src>.wav  : source audio, >= 32 kHz mono (needed for the 3.5–11 kHz band)
Output (stdout): EDL JSON [{"src","in","out"}], frame-aligned, cuts only inside silence."""
import argparse, json, sys, wave
from pathlib import Path
import numpy as np

HOP = 0.005  # 5 ms analysis hop

def read_wav(p):
    with wave.open(str(p)) as w:
        sr, ch, sw = w.getframerate(), w.getnchannels(), w.getsampwidth()
        x = np.frombuffer(w.readframes(w.getnframes()), {2: np.int16, 4: np.int32}[sw]).astype(np.float32)
    x = x.reshape(-1, ch).mean(1) / float(2 ** (8 * sw - 1))
    return x, sr

def band_db(x, sr, lo=None, hi=None):
    n = int(sr * HOP) * 2; hop = int(sr * HOP)
    frames = np.lib.stride_tricks.sliding_window_view(np.pad(x, (n // 2, n)), n)[::hop]
    spec = np.abs(np.fft.rfft(frames * np.hanning(n), axis=1)) ** 2
    f = np.fft.rfftfreq(n, 1 / sr)
    sel = np.ones_like(f, bool) if lo is None else (f >= lo) & (f <= hi)
    return 10 * np.log10(spec[:, sel].sum(1) + 1e-12)

def load_words(p):
    d = json.loads(Path(p).read_text())
    if isinstance(d, dict): d = [w for s in d.get("segments", []) for w in s.get("words", [])]
    return [w for w in d if "start" in w and "end" in w]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cutlist", required=True); ap.add_argument("--words", required=True); ap.add_argument("--audio", required=True)
    ap.add_argument("--layout", default=str(Path(__file__).with_name("layout.json")))
    ap.add_argument("--word-guard", choices=["strict", "edges"], default="edges",
                    help="strict: never cut anywhere inside an ASR word span. edges: ASR words longer than "
                         "guard_long_s usually swallowed a pause, so only their first/last guard_edge_s are protected")
    a = ap.parse_args()
    L = json.loads(Path(a.layout).read_text()); C = L["cuts"]; fps = L["canvas"]["fps"]
    cache, edl, removed = {}, [], 0.0
    for item in json.loads(Path(a.cutlist).read_text()):
        src = item["src"]
        if src not in cache:
            x, sr = read_wav(Path(a.audio) / f"{src}.wav")
            full, hf = band_db(x, sr), band_db(x, sr, *C["hf_band_hz"])
            cache[src] = (full, hf, load_words(Path(a.words) / f"{src}.json"))
        full, hf, words = cache[src]
        t0, t1 = item["in"], item["out"]
        kept = [w for w in words if w["start"] >= t0 - 0.02 and w["end"] <= t1 + 0.02]
        i0, i1 = int(t0 / HOP), min(int(t1 / HOP), len(full) - 1)
        seg_f, seg_h = full[i0:i1], hf[i0:i1]
        ref_f, ref_h = np.percentile(seg_f, 90), np.percentile(seg_h, 90)
        quiet = (seg_f < ref_f - C["quiet_db"]) & (seg_h < ref_h - C["quiet_db"])
        edge, long_ = C.get("guard_edge_s", 0.25), C.get("guard_long_s", 0.6)
        for w in kept:  # never cut inside a kept word
            spans = [(w["start"], w["end"])]
            if a.word_guard == "edges" and w["end"] - w["start"] > long_:
                spans = [(w["start"], w["start"] + edge), (w["end"] - edge, w["end"])]
            for ws, we in spans:
                quiet[max(0, int(ws / HOP) - i0): max(0, int(we / HOP) - i0)] = False
        energy = seg_f + seg_h
        def best_boundary(lo, hi):
            """Quietest video-frame boundary in [lo, hi] (seconds) that lies in silence."""
            cands = [k / fps for k in range(int(np.ceil(lo * fps)), int(np.floor(hi * fps)) + 1)]
            cands = [t for t in cands if 0 <= int(t / HOP) - i0 < len(quiet) and quiet[int(t / HOP) - i0]]
            return min(cands, key=lambda t: energy[int(t / HOP) - i0]) if cands else None
        # outer edges: snap inward into silence
        first = kept[0]["start"] if kept else t0; last = kept[-1]["end"] if kept else t1
        s = best_boundary(t0, first) or np.floor(first * fps) / fps
        e = best_boundary(last, t1) or np.ceil(last * fps) / fps
        # find pauses
        pieces, cur = [], s
        k = 0; n = len(quiet)
        while k < n:
            if quiet[k]:
                j = k
                while j < n and quiet[j]: j += 1
                p0, p1 = (i0 + k) * HOP, (i0 + j) * HOP
                if p1 - p0 >= C["min_pause_s"] and p0 > s and p1 < e:
                    half = C["keep_pause_s"] / 2
                    cin = best_boundary(p0 + 0.02, p0 + half + 0.03)
                    cout = best_boundary(p1 - half - 0.03, p1 - 0.02)
                    if cin and cout and cout - cin > 0.05:
                        pieces.append((cur, cin)); removed += cout - cin; cur = cout
                k = j
            else: k += 1
        pieces.append((cur, e))
        # merge micro-clips back into neighbours
        merged = []
        for p in pieces:
            if merged and (p[1] - p[0] < C["min_clip_s"] or merged[-1][1] - merged[-1][0] < C["min_clip_s"]):
                removed -= p[0] - merged[-1][1]; merged[-1] = (merged[-1][0], p[1])
            else: merged.append(p)
        extra = {k: v for k, v in item.items() if k not in ("src", "in", "out")}
        edl += [{"src": src, "in": round(a_, 4), "out": round(b_, 4), **extra} for a_, b_ in merged]
    total = sum(e["out"] - e["in"] for e in edl)
    print(json.dumps(edl, indent=1))
    print(f"edl: {len(edl)} clips, {total:.1f}s, removed {removed:.1f}s of pauses", file=sys.stderr)

if __name__ == "__main__": main()
