"""Voice + sound design → public/mix.wav (48 kHz stereo, -14 LUFS, -1.5 dBTP).
NO MUSIC (owner's rule): the voice is the Demucs vocal stem of the reel (its music bed is dropped), cut with the
edit's own cut list; every SFX is synthesised noise/transient design (whooshes, clicks, locks, impacts, taps),
nothing tonal or melodic. Cue times come from plan/beats.json (npx tsx scripts/beats.ts > plan/beats.json).
Usage: python3 scripts/audio.py cache/demucs/htdemucs/orig/vocals.wav public/mix.wav
(Heartbeats are sub-bass transients, not notes.)"""
import json, subprocess, sys, numpy as np

SR = 48000
B = json.load(open("plan/beats.json"))
T, FPS = B["T"], B["fps"]
N = int(B["duration"] * SR)
rng = np.random.default_rng(7)
src, dst = sys.argv[1], sys.argv[2]

# ---- voice: the edit's cut list, 12 ms fades at each cut, light EQ + compression
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-ac", "1", "-ar", str(SR),
                      "-af", "highpass=f=75,equalizer=f=3200:t=q:w=1.2:g=2,acompressor=threshold=-20dB:ratio=2.6:attack=5:release=80:makeup=2.5",
                      "-f", "f32le", "-"], capture_output=True, check=True).stdout
v_src = np.frombuffer(raw, np.float32).astype(np.float64)
voice = np.zeros(N)
fade = int(0.012 * SR)
for (a, b), o in zip(B["segments"], B["segOut"]):
    s0, s1, o0 = int(a / FPS * SR), int(b / FPS * SR), int(o / FPS * SR)
    seg = v_src[s0:s1].copy()
    ramp = np.linspace(0, 1, fade)
    seg[:fade] *= ramp; seg[-fade:] *= ramp[::-1]
    n = min(len(seg), N - o0)
    voice[o0:o0 + n] += seg[:n]

# ---- SFX building blocks (all noise / transients)
def band(n, lo, hi):
    X = np.fft.rfft(rng.standard_normal(n)); f = np.fft.rfftfreq(n, 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    x = np.fft.irfft(X, n); return x / (np.abs(x).max() + 1e-9)
def env(n, a, r):
    t = np.arange(n) / SR; return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / r)
def whoosh(d=0.5, up=True):
    n = int(d * SR); k = np.arange(n) / n
    lo, hi = band(n, 200, 1400), band(n, 1400, 9000)
    mix = lo * (1 - k) + hi * k if up else lo * k + hi * (1 - k)
    return mix * np.sin(np.pi * k) ** 1.8 * 0.9
def click(d=0.03, lo=2500, hi=11000, r=0.004):
    n = int(d * SR); return band(n, lo, hi) * env(n, 0.0003, r)
def thump(d=0.35, f0=95, r=0.09):
    n = int(d * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * f0 * t * (1 + 0.5 * np.exp(-t / 0.02))) * np.exp(-t / r)
def impact(d=1.6):
    n = int(d * SR); t = np.arange(n) / SR
    sub = np.sin(2 * np.pi * (38 + 80 * np.exp(-t / 0.04)) * t) * np.exp(-t / 0.45)
    hit = band(n, 80, 5000) * env(n, 0.001, 0.06)
    tail = band(n, 300, 3000) * env(n, 0.01, 0.5) * 0.15
    return 0.9 * sub + 0.5 * hit + tail
def lock():
    n = int(0.4 * SR); x = np.zeros(n)
    c = click(0.05, 1800, 9000, 0.008); x[:len(c)] += c * 0.9            # shackle
    o = int(0.035 * SR); k = click(0.08, 900, 6000, 0.016); x[o:o + len(k)] += k   # bolt
    th = thump(0.3, 120, 0.06); x[o:o + len(th)] += th * 0.7
    return x
def riser(d=0.9):
    n = int(d * SR); k = np.arange(n) / n
    x = band(n, 600, 12000) * k ** 2.4 + band(n, 120, 600) * k ** 3 * 0.5
    return x * (1 - np.clip((k - 0.96) / 0.04, 0, 1)) * 0.8
def pop(d=0.07):
    n = int(d * SR); return band(n, 600, 5000) * env(n, 0.0005, 0.012)
def swell(d=1.8):
    n = int(d * SR); k = np.arange(n) / n
    return band(n, 150, 2500) * np.sin(np.pi * k) ** 2 * 0.5
def toggle():
    a = click(0.03, 2000, 9000, 0.004); x = np.zeros(int(0.1 * SR)); x[:len(a)] += a
    o = int(0.045 * SR); x[o:o + len(a)] += a * 0.7; return x

sfx = np.zeros((2, N))
def put(x, t, g=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N or i + len(x) <= 0: return
    if i < 0: x, i = x[-i:], 0
    n = min(len(x), N - i)
    sfx[0, i:i + n] += x[:n] * g * np.sqrt(0.5 * (1 - pan))
    sfx[1, i:i + n] += x[:n] * g * np.sqrt(0.5 * (1 + pan))

def heartbeat(t0, t1, bpm0, bpm1, g):
    """lub-dub thumps (sub transients, nothing tonal) from t0 to t1, tempo gliding bpm0 → bpm1."""
    t = t0
    while t < t1:
        k = (t - t0) / max(t1 - t0, 1e-3); bpm = bpm0 + (bpm1 - bpm0) * k
        fade = min(1, (t - t0) / 0.6, (t1 - t) / 0.6)
        put(thump(0.25, 58, 0.07), t, g * fade); put(thump(0.2, 52, 0.05), t + 0.16, g * 0.6 * fade)
        t += 60 / bpm

# hook: a hot flash, the call HUD, symptom chips, a heartbeat that speeds up
put(impact(1.2), 0.0, 0.4); put(whoosh(0.4, False), 0.0, 0.3); put(click(0.04, 1500, 7000, 0.01), 0.15, 0.3)
put(riser(0.6), T["heat"] - 0.55, 0.35); put(whoosh(0.6, False), T["heat"], 0.35)
for k in ["palms", "sweaty"]: put(whoosh(0.3), T[k] - 0.28, 0.25); put(pop(), T[k] - 0.05, 0.35)
put(whoosh(0.3), T["heart"] - 0.28, 0.25)
heartbeat(T["heart"] - 0.1, T["thats"] + 0.2, 95, 138, 0.9)
put(impact(0.7), T["anxious"] - 0.04, 0.45); put(click(0.05, 1200, 6000, 0.012), T["anxious"] - 0.03, 0.5)
# threat: scan sweep, type slam
put(whoosh(0.5), T["nervous1"] - 0.3, 0.3); put(thump(0.3, 70, 0.08), T["threat"] - 0.03, 0.6)
for k in range(6): put(click(0.02, 3500, 11000, 0.003), T["threat"] + 0.3 + k * 0.18, 0.15, rng.uniform(-0.5, 0.5))
# promise ticks
put(whoosh(0.4, False), T["psychological"] - 0.3, 0.25); put(pop(0.09), T["why"] - 0.2, 0.45); put(pop(0.09), T["control1"], 0.45)
# save / share
put(whoosh(0.35), T["sell"] - 0.3, 0.25); put(pop(0.09), T["save"], 0.55, -0.3); put(whoosh(0.3), T["share"], 0.35, 0.3); put(pop(), T["share"] + 0.05, 0.35, 0.3)
# call flow → price → decision → boom
put(whoosh(0.5, False), T["great"] - 0.4, 0.3)
for k in ["flowing", "price", "decision"]: put(pop(), T[k] - 0.05, 0.35)
put(riser(1.4), T["boom"] - 1.4, 0.6); put(impact(1.8), T["boom"] - 0.04, 1.0); put(whoosh(0.7, False), T["boom"], 0.4)
# fight or flight
put(thump(0.35, 75, 0.09), T["fight"] - 0.05, 0.8); put(impact(0.8), T["fight"] - 0.05, 0.35); put(thump(0.3, 90, 0.08), T["flight"] - 0.05, 0.6)
put(whoosh(0.5, False), T["anticipatory"] - 0.3, 0.3); put(click(0.04, 1500, 7000, 0.01), T["anticipatory"], 0.35)
# prediction
put(whoosh(0.4), T["brain"] - 0.3, 0.25); put(whoosh(0.5), T["predicting"], 0.3); put(pop(0.09), T["predicting"] + 0.3, 0.4)
# vitals: alarm-free — a heartbeat again, chips pop
put(click(0.05, 1200, 6000, 0.01), T["kicks"], 0.5)
for k in ["adrenaline1", "increased", "sweaty2"]: put(whoosh(0.25), T[k] - 0.22, 0.2); put(pop(), T[k] - 0.03, 0.35)
heartbeat(T["increased"] - 0.2, T["troubleEnd"] + 0.3, 120, 140, 0.75)
# trouble tape + three mistakes
put(whoosh(0.4), T["trouble"] - 0.35, 0.4); put(impact(0.6), T["trouble"] - 0.05, 0.4)
for k in ["talking", "over", "filling"]: put(whoosh(0.25), T[k] - 0.25, 0.22); put(click(0.04, 1500, 6000, 0.008), T[k] - 0.02, 0.45)
put(whoosh(0.5), T["protecting"] - 0.3, 0.3); put(thump(0.25, 110, 0.05), T["protecting"], 0.5)
# three steps
put(riser(0.8), T["three"] - 0.8, 0.4); put(impact(1.2), T["three"] - 0.04, 0.55)
for k in ["recognize1", "regulate1", "redirect1"]: put(whoosh(0.3), T[k] - 0.28, 0.25); put(thump(0.22, 120, 0.05), T[k] - 0.02, 0.45)
# 01 recognize
put(whoosh(0.4, False), T["first"] - 0.3, 0.3); put(pop(0.09), T["adrenaline2"], 0.45); put(pop(0.09), T["not"], 0.45); put(click(0.06, 800, 5000, 0.02), T["danger"] + 0.1, 0.4)
# 02 regulate: the heartbeat settles, a long air swell for inhale and a longer one for the exhale
put(whoosh(0.4, False), T["second"] - 0.3, 0.3)
heartbeat(T["slow"] - 0.3, T["third"], 118, 66, 0.6)
put(swell(T["longer"] - T["breath"] + 0.3), T["breath"] - 0.3, 0.5); put(swell(T["third"] - T["longer"]), T["longer"], 0.55)
# 03 redirect
put(whoosh(0.4, False), T["third"] - 0.3, 0.3); put(pop(0.09), T["how2"] - 0.05, 0.4); put(click(0.06, 800, 5000, 0.02), T["start2"], 0.4)
put(whoosh(0.4), T["what2"] - 0.3, 0.3); put(pop(0.09), T["what2"], 0.45)
put(pop(0.09), T["discovery"] - 0.05, 0.45); put(click(0.06, 800, 5000, 0.02), T["selfp"] + 0.1, 0.35)
# remember
put(whoosh(0.5, False), T["remember"] - 0.4, 0.3); put(whoosh(0.4), T["anticipation"] - 0.3, 0.35); put(thump(0.3, 80, 0.08), T["anticipation"], 0.45)
# finale + end card
put(swell(2.0), T["elite"] - 0.3, 0.35); put(impact(1.4), T["elite"] - 0.05, 0.4)
put(whoosh(0.6), T["endCard"] - 0.45, 0.4); put(impact(1.3), T["endCard"] - 0.05, 0.45); put(pop(0.09), T["endCard"] + 0.4, 0.4)

# light room tone under the cuts so silences don't drop to digital zero
tone = band(N, 80, 1800) * 0.0025

mix = np.stack([voice + tone, voice + tone]) + sfx * 0.5
mix /= np.abs(mix).max() + 1e-9
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-",
                "-af", "loudnorm=I=-14:TP=-1.5:LRA=9", "-ar", str(SR), "-c:a", "pcm_s16le", dst],
               input=mix.T.astype(np.float32).tobytes(), check=True)
print("wrote", dst)
