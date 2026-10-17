"""Voice + sound design → public/mix.wav (48 kHz stereo, -14 LUFS, -1.5 dBTP).
NO MUSIC (owner's halal rule): the voice is the Demucs vocal stem of the reel (its music bed is dropped), cut with the
edit's own cut list; every SFX is synthesised noise/transient design (whooshes, clicks, locks, impacts, taps),
nothing tonal or melodic. Cue times come from plan/beats.json (npx tsx scripts/beats.ts > plan/beats.json).
Usage: python3 scripts/audio.py cache/demucs/htdemucs/orig/vocals.wav public/mix.wav"""
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

def ticks(t0, n, dt, g=0.2):
    for k in range(n): put(click(0.02, 3500, 11000, 0.003), t0 + k * dt, g, rng.uniform(-0.5, 0.5))

# hook: ISA / vs / SIPP slams, glass tags
put(impact(1.2), 0.0, 0.4); put(whoosh(0.4, False), 0.0, 0.3)
put(whoosh(0.3), T["isa1"] - 0.35, 0.35); put(impact(0.9), T["isa1"] - 0.1, 0.5, -0.3); put(pop(), T["isa1"] + 0.05, 0.35, -0.2)
put(whoosh(0.3), T["sipp1"] - 0.35, 0.35); put(impact(0.9), T["sipp1"] - 0.1, 0.5, 0.3); put(pop(), T["sipp1"] + 0.05, 0.35, 0.3)
# ISA chapter
put(whoosh(0.5, False), T["first"] - 0.3, 0.35)
put(riser(0.5), T["k20"] - 0.6, 0.3); ticks(T["k20"] - 0.1, 12, 0.06, 0.16); put(thump(0.3, 110, 0.07), T["k20"] + 0.65, 0.45)
put(whoosh(0.35), T["all"] - 0.1, 0.25)
for k in ["all", "completely", "withdraw", "n18"]: put(toggle(), T[k] + 0.15, 0.55, 0.4)
put(impact(0.8), T["completely"] + 0.25, 0.45); put(click(0.05, 1500, 6000, 0.012), T["completely"] + 0.27, 0.5)
put(lock()[::-1].copy(), T["withdraw"] + 0.05, 0.35, 0.4)
# SIPP chapter
put(whoosh(0.5, False), T["however"] - 0.3, 0.35)
for k, dt in enumerate([0.0, 0.3]): put(pop(), T["self"] - 0.25 + dt, 0.35, 0.4)
put(pop(), T["personal"] - 0.25, 0.35, 0.4); put(pop(), T["pension"] - 0.25, 0.35, 0.4)
put(riser(0.5), T["k60"] - 0.6, 0.3); ticks(T["k60"] - 0.1, 12, 0.06, 0.16); put(thump(0.3, 110, 0.07), T["k60"] + 0.65, 0.45)
put(pop(0.09), T["lower"] - 0.1, 0.45, 0.4)
put(swell(1.2), T["taxRelief"] - 0.2, 0.35); put(pop(0.09), T["thats20"] - 0.1, 0.5, 0.4); put(pop(), T["higher"] - 0.1, 0.4, 0.4)
put(toggle(), T["lower"] + 0.9, 0.5, 0.4); put(toggle(), T["claim"] + 1.0, 0.5, 0.4)
# the catch
put(whoosh(0.3), T["catch"] - 0.32, 0.4); put(impact(1.4), T["catch"] - 0.1, 0.8); put(thump(0.4, 70, 0.12), T["catch"] - 0.08, 0.6)
put(lock(), T["cant"] - 0.05, 0.95, 0.4); put(click(0.06, 600, 4000, 0.02), T["cant"] + 0.2, 0.4, 0.4)
put(whoosh(0.3), T["until"] - 0.2, 0.3)
ticks(T["n57"] - 0.12, 6, 0.05, 0.25); put(thump(0.25, 140, 0.05), T["n57"] + 0.3, 0.4); put(pop(), T["y2028"] - 0.1, 0.4, 0.4)
put(lock()[::-1].copy(), T["when"], 0.6, 0.4); put(whoosh(0.5, False), T["when"] - 0.2, 0.3)
put(swell(0.9), T["first25"] - 0.1, 0.3); put(pop(), T["rest"] - 0.05, 0.3, 0.4)
# verdict
put(whoosh(0.5, False), T["so"] - 0.3, 0.35)
put(riser(0.8), T["both2"] - 0.85, 0.45); put(impact(1.6), T["both2"] - 0.1, 0.8)
put(whoosh(0.4), T["use"] - 0.25, 0.3); put(swell(1.0), T["isa3"] - 0.1, 0.25); put(swell(1.0), T["sipp4"] - 0.1, 0.25)
# outro: follow tap, sign-off, end card
put(whoosh(0.4, False), T["drop"] - 0.5, 0.3); put(click(0.04, 1500, 6000, 0.008), T["follow"] + 0.15, 0.7, 0.3); put(pop(0.09), T["follow"] + 0.3, 0.4, 0.3)
put(whoosh(0.6), T["stay"] - 0.3, 0.3); put(swell(1.4), T["stay"], 0.3)
put(whoosh(0.6), T["endCard"] - 0.45, 0.4); put(impact(1.3), T["endCard"] - 0.05, 0.45)

# light room tone under the cuts so silences don't drop to digital zero
tone = band(N, 80, 1800) * 0.0025

mix = np.stack([voice + tone, voice + tone]) + sfx * 0.5
mix /= np.abs(mix).max() + 1e-9
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-",
                "-af", "loudnorm=I=-14:TP=-1.5:LRA=9", "-ar", str(SR), "-c:a", "pcm_s16le", dst],
               input=mix.T.astype(np.float32).tobytes(), check=True)
print("wrote", dst)
