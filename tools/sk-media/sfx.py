#!/usr/bin/env python3
"""Noise-based SFX only (no music): whoosh / pop / tick, ~18 dB under the voice, then a -2.5 dBFS limiter.
Usage: sfx.py voice_master.wav mix.wav '[[t, "whoosh"|"pop"|"tick"], ...]'"""
import json, subprocess, sys, wave
from pathlib import Path
import numpy as np
SR = 48000; rng = np.random.default_rng(7)
L = json.loads((Path(__file__).resolve().parent / "layout.json").read_text())

def bandnoise(n, lo, hi):
    X = np.fft.rfft(rng.standard_normal(n)); f = np.fft.rfftfreq(n, 1 / SR); X[(f < lo) | (f > hi)] = 0
    x = np.fft.irfft(X, n); return x / (np.abs(x).max() + 1e-9)
def whoosh(d=0.42):
    n = int(d * SR); k = np.arange(n) / n
    return (bandnoise(n, 300, 1800) * (1 - k) + bandnoise(n, 1500, 7000) * k) * np.sin(np.pi * k) ** 2 * (1 - 0.3 * k)
def pop(d=0.09):
    n = int(d * SR); t = np.arange(n) / SR; return bandnoise(n, 600, 3500) * np.exp(-t / 0.018) * np.minimum(1, t / 0.002)
def tick(d=0.035):
    n = int(d * SR); t = np.arange(n) / SR; return bandnoise(n, 2500, 9000) * np.exp(-t / 0.006)

def main():
    src, out, cues = sys.argv[1], sys.argv[2], json.loads(sys.argv[3])
    with wave.open(src) as w: v = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float64) / 32768
    fx = np.zeros_like(v); vref = np.percentile(np.abs(v[np.abs(v) > 1e-3]), 99)
    lvl = vref * 10 ** (-L["audio"]["sfx_under_voice_db"] / 20) * 2.0; gain = {"whoosh": 1.0, "pop": 0.8, "tick": 0.6}
    for t, kind in cues:
        s = {"whoosh": whoosh, "pop": pop, "tick": tick}[kind]()
        i = int(max(0, t - (0.12 if kind == "whoosh" else 0)) * SR); seg = s[: max(0, len(fx) - i)] * lvl * gain[kind]; fx[i:i + len(seg)] += seg
    tmp = out + ".pre.wav"
    with wave.open(tmp, "w") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(v + fx, -1, 1) * 32767).astype(np.int16).tobytes())
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-af", "alimiter=limit=0.72:attack=2:release=50:level=disabled", "-ar", "48000", out], check=True)
    Path(tmp).unlink(); print(f"sfx: {len(cues)} cues → {out}")

if __name__ == "__main__": main()
