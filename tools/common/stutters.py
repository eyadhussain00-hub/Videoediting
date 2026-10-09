#!/usr/bin/env python3
"""Stutter / restart / filler check (all clients). Normal ASR smooths disfluencies away, so this runs Whisper in verbatim
mode (a disfluency prompt, no context carried between segments).

Usage: stutters.py <audio-or-video> [--from 0 --to 999] [--ok 12.3,40.1] [--model medium.en]
  Run it on the source (mic.wav) before planning cuts, and on the final render before delivering — it must PASS.
  --ok  times (s) of hits you checked and that are really what he meant ("very very"); a hit within 0.4 s is accepted.
Flags fillers (um/uh/erm), 'okay'/'alright' restarts, cut-off words ('re-'), immediate word repeats and a 2–4-word phrase
said twice within 6 s ("one of the, one of the reasons"). Prints the verbatim words, then PASS or each hit with its time.
Needs faster-whisper (pip install faster-whisper, or: uv run --with faster-whisper python stutters.py …)."""
import argparse, re, subprocess, sys
from pathlib import Path

ap = argparse.ArgumentParser()
ap.add_argument("media"); ap.add_argument("--from", dest="t0", type=float, default=0); ap.add_argument("--to", dest="t1", type=float, default=1e9)
ap.add_argument("--ok", default="", help="comma-separated times of hits you checked and accept")
ap.add_argument("--model", default="medium.en")
a = ap.parse_args()
from faster_whisper import WhisperModel

FILL = {"um", "uh", "erm", "er", "ah", "hmm", "mm"}; RESTART = {"okay", "alright", "ok"}
OK_REPEAT = {"that", "very", "had", "is"}   # legitimate doubles ("that that", "very very")
if True:   # samples straight from ffmpeg: faster-whisper's own file loader breaks on PyAV ≥ 15 (7 Oct, 'metadata_errors')
    import numpy as np
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(a.t0), "-i", a.media, "-t", str(min(a.t1 - a.t0, 1e6)),
                          "-vn", "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], check=True, capture_output=True).stdout
    m = WhisperModel(a.model, device="cpu", compute_type="int8")
    segs, _ = m.transcribe(np.frombuffer(pcm, np.float32), language="en", word_timestamps=True, beam_size=5, condition_on_previous_text=False,
                           initial_prompt="Umm, so, so like, he he's, uh, the the, I-I mean, re- reaching out, um, you know, like, yeah.")
    W = [(w.word.strip(), w.start + a.t0) for s in segs for w in s.words]
n = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())
hits = []
SLATE = {"go", "action", "rolling"}   # 30 Sep, Sofian: "you can hear me say 'go' at the start"
for w, t in W[:2]:
    if n(w) in SLATE and t - a.t0 < 1.5: hits.append((t, f"slate word '{w}' at the start — cut in after it"))
for i, (w, t) in enumerate(W):
    lw = n(w)
    if lw in FILL: hits.append((t, f"filler '{w}'"))
    if lw in RESTART and 0 < i < len(W) - 1: hits.append((t, f"restart marker '{w}' — check for a repeated line around it"))
    if w.endswith("-") or w == "-" or (w.startswith("-") and len(w) > 1): hits.append((t, f"cut-off word '{w}'"))
    if i and lw and lw == n(W[i - 1][0]) and lw not in OK_REPEAT and t - W[i - 1][1] < 1.2: hits.append((t, f"repeat '{W[i - 1][0]} {w}'"))
    for k in (2, 3, 4):   # the same phrase said twice within 6 s = a restart
        if i >= 2 * k - 1:
            p1 = [n(x) for x, _ in W[i - 2 * k + 1:i - k + 1]]; p2 = [n(x) for x, _ in W[i - k + 1:i + 1]]
            if p1 == p2 and all(p1) and W[i - k + 1][1] - W[i - 2 * k + 1][1] < 6: hits.append((W[i - k + 1][1], f"repeated phrase '{' '.join(p2)}'"))
ok = [float(x) for x in a.ok.split(",") if x.strip()]
print(" ".join(f"{w}@{t:.2f}" for w, t in W))
hits = sorted(set(hits))
bad = [(t, h) for t, h in hits if not any(abs(t - o) <= 0.4 for o in ok)]
for t, h in hits:
    if (t, h) not in bad: print(f"OK    {t:6.2f}s  {h}  (accepted with --ok)")
if bad:
    for t, h in bad: print(f"FAIL  {t:6.2f}s  {h}")
    sys.exit(1)
print("PASS  stutters: none found")
