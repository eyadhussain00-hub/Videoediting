#!/usr/bin/env python3
"""Synthesised sound design (no samples, no licences) under the source audio → public/mix.wav.
Usage: sfx.py source.mp4 plan/sfx.json out.wav total_seconds
The source keeps its own voice + music bed; it fades over its last 0.25 s and the end card rides on SFX tails.
Final mix is two-pass loudnorm to -14 LUFS / -1.5 dBTP."""
import json, subprocess, sys, wave
import numpy as np
SR = 48000; rng = np.random.default_rng(11)

def bandnoise(n, lo, hi):
    X = np.fft.rfft(rng.standard_normal(n)); f = np.fft.rfftfreq(n, 1 / SR); X[(f < lo) | (f > hi)] = 0
    x = np.fft.irfft(X, n); return x / (np.abs(x).max() + 1e-9)
def T(d): return np.arange(int(d * SR)) / SR
def sweep(f0, f1, d, curve=3.0):
    t = T(d); f = f1 + (f0 - f1) * np.exp(-curve * t / d); return np.sin(2 * np.pi * np.cumsum(f) / SR)
def whoosh(d=0.5):
    n = int(d * SR); k = np.arange(n) / n
    return (bandnoise(n, 250, 1600) * (1 - k) + bandnoise(n, 1400, 8000) * k) * np.sin(np.pi * k) ** 2
def swish(): return whoosh(0.26) * 0.8
def pop():
    t = T(0.1); return (bandnoise(len(t), 500, 3200) * 0.6 + np.sin(2 * np.pi * 420 * t) * 0.6) * np.exp(-t / 0.02) * np.minimum(1, t / 0.002)
def tick():
    t = T(0.03); return bandnoise(len(t), 2500, 9000) * np.exp(-t / 0.005)
def blip():
    t = T(0.14); return sweep(880, 1500, 0.14, 2) * np.exp(-t / 0.05) * np.minimum(1, t / 0.003)
def click():
    t = T(0.06); return (bandnoise(len(t), 1500, 7000) * np.exp(-t / 0.006) + np.sin(2 * np.pi * 1800 * t) * np.exp(-t / 0.012) * 0.5)
def boom(d=1.6):
    t = T(d); body = sweep(110, 38, d, 6) * np.exp(-t / 0.45)
    hit = bandnoise(len(t), 60, 2500) * np.exp(-t / 0.03); tail = bandnoise(len(t), 30, 400) * np.exp(-t / 0.5) * 0.25
    return body * 1.0 + hit * 0.5 + tail
def rumble():
    t = T(0.9); return bandnoise(len(t), 30, 220) * np.sin(np.pi * t / 0.9) * 0.9
def shimmer(d=1.4):
    t = T(d); x = sum(np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) * a for f, a in [(1568, .5), (2093, .45), (2637, .4), (3136, .35), (4186, .25), (5274, .15)])
    x = x * (1 + 0.3 * np.sin(2 * np.pi * 7 * t)) + bandnoise(len(t), 5000, 12000) * 0.3
    return x * np.exp(-t / 0.45) * np.minimum(1, t / 0.015) * 0.45
def riser(d=0.5):
    t = T(d); k = t / d
    return (bandnoise(len(t), 800, 9000) * 0.5 + sweep(1400, 200, d, 1.5)[::-1] * 0.35) * k ** 2.2
def plane():
    n = int(0.95 * SR); k = np.arange(n) / n
    return (bandnoise(n, 120, 900) * 0.8 + bandnoise(n, 900, 5000) * 0.4) * np.sin(np.pi * k) ** 1.5
def stamp():
    t = T(0.25); return sweep(160, 55, 0.25, 4) * np.exp(-t / 0.07) + bandnoise(len(t), 200, 3000) * np.exp(-t / 0.015) * 0.6
def seq(times, f):
    d = times[-1] + 0.2; out = np.zeros(int(d * SR))
    for s in times:
        x = f(); i = int(s * SR); out[i:i + len(x)] += x[: len(out) - i]
    return out
def counter():  # accelerating → decelerating ticks under the $10,000 roll
    ts = np.cumsum(0.022 + 0.06 * np.linspace(0, 1, 16) ** 2); return seq(list(ts - ts[0]), tick)
def likes(): return seq(list(np.cumsum(np.linspace(0.03, 0.08, 10))), tick) * 0.8
def coins():
    def ding():
        t = T(0.35); f = rng.uniform(2200, 3400)
        return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.76 * t)) * np.exp(-t / 0.08)
    return seq(sorted(rng.uniform(0, 0.8, 9)), ding) * 0.5

GEN = dict(whoosh=whoosh, swish=swish, pop=pop, blip=blip, click=click, boom=boom, rumble=rumble, shimmer=shimmer,
           riser=lambda: riser(0.5), riser_s=lambda: riser(0.55) * 0.7, plane=plane, stamp=stamp, counter=counter, likes=likes, coins=coins)
LEAD = dict(whoosh=0.25, swish=0.1, plane=0.0, riser=0.5, riser_s=0.0)   # whooshes peak on the cue, risers end on it

def main():
    src, cues, out, total = sys.argv[1], json.load(open(sys.argv[2])), sys.argv[3], float(sys.argv[4])
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-ac", "2", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout
    v = np.frombuffer(raw, np.int16).astype(np.float64).reshape(-1, 2) / 32768
    fade = int(0.25 * SR); v[-fade:] *= np.linspace(1, 0, fade)[:, None]
    n = int(total * SR); mix = np.zeros((n, 2)); mix[: len(v)] = v[:n]
    vref = np.percentile(np.abs(v[np.abs(v) > 1e-3]), 99)
    fx = np.zeros((n, 2))
    for k, (t, kind, g) in enumerate(cues):
        x = GEN[kind](); x = x / (np.abs(x).max() + 1e-9)
        pan = np.clip(np.sin(k * 2.1) * 0.35, -0.35, 0.35)  # light stereo spread
        i = max(0, int((t - LEAD.get(kind, 0)) * SR)); seg = x[: max(0, n - i)] * g * vref * 0.38
        fx[i:i + len(seg), 0] += seg * (1 - pan); fx[i:i + len(seg), 1] += seg * (1 + pan)
    tmp = out + ".pre.wav"
    with wave.open(tmp, "w") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix + fx, -1, 1) * 32767).astype(np.int16).tobytes())
    m = subprocess.run(["ffmpeg", "-hide_banner", "-i", tmp, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
    j = json.loads(m[m.rindex("{"):m.rindex("}") + 1])
    af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
          f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-af", af, "-ar", str(SR), out], check=True)
    import os; os.remove(tmp); print(f"sfx: {len(cues)} cues → {out}")

if __name__ == "__main__": main()
