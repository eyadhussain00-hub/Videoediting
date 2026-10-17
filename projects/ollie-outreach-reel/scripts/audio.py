"""Voice + sound design → public/mix.wav (48 kHz stereo, -14 LUFS, -1.5 dBTP).
NO MUSIC (owner's rule): the voice is the Demucs vocal stem of the TikTok (anything that isn't voice is dropped), cut with the
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

# ---- voice: the edit's cut list, 12 ms fades at each cut, light EQ + compression (the source is quiet, ~-38 dB mean;
# the bus compressor + loudnorm at the end bring it up)
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

def typing(a, b, rate=14, g=0.22):
    k = 0.0
    while a + k < b:
        put(click(0.022, 2500, 9000, 0.0035), a + k, g * rng.uniform(0.7, 1.1), rng.uniform(-0.25, 0.25)); k += 1 / rate * rng.uniform(0.8, 1.25)

# hook: open hit, the $ counter ticking up to 5K, the playbook chip
put(impact(1.2), 0.0, 0.45); put(whoosh(0.4, False), 0.0, 0.35)
k, n = 0.1, 0
while k < T["k5"]:
    put(click(0.02, 3000, 11000, 0.0025), k, 0.16 + 0.1 * k / T["k5"]); n += 1; k += max(0.035, 0.09 - 0.012 * n)
put(impact(0.9), T["k5"] - 0.02, 0.55); put(thump(0.3, 90, 0.07), T["k5"], 0.5)
put(whoosh(0.3), T["month"] - 0.2, 0.22)
put(pop(), T["exactly"] - 0.08, 0.45)
# chapter changes
for c in B["chapters"]:
    put(whoosh(0.5), c - 0.35, 0.38); put(click(0.04, 1500, 7000, 0.01), c - 0.02, 0.4)
# 01 the skill
for i in range(6): put(click(0.025, 2500, 9000, 0.004), T["six"] - 0.1 + i * 0.06, 0.22)
put(whoosh(0.45), T["high"] - 0.35, 0.3); put(pop(0.09), T["high"] - 0.1, 0.35)
put(whoosh(0.3, False), T["setting"] - 0.25, 0.25)
put(whoosh(0.35), T["money"] - 0.3, 0.25); put(impact(0.7), T["n19"] - 0.04, 0.4); put(thump(0.3, 100, 0.06), T["n19"], 0.5)
put(pop(), T["education"] - 0.2, 0.4)
# 02 the outreach
put(pop(), T["first1"] - 0.15, 0.4)
put(whoosh(0.5), T["outreaching"] - 0.4, 0.3); put(thump(0.25, 140, 0.05), T["outreaching"] - 0.1, 0.35)
put(pop(), T["coaches1"] - 0.1, 0.45, -0.4); put(pop(), T["businesses1"] - 0.1, 0.45, 0.4)
for i in range(7): put(click(0.03, 2000, 8000, 0.006), T["every1"] - 0.05 + i * 0.09, 0.32, -0.6 + 0.2 * i)
put(impact(0.7), T["hundreds"] - 0.1, 0.35)
k = T["hundreds"]
while k < T["role2"] + 0.3:
    put(click(0.018, 4000, 11000, 0.002), k, 0.12, rng.uniform(-0.7, 0.7)); k += rng.uniform(0.05, 0.11)
# 03 the message
put(whoosh(0.6, False), T["structured"] - 0.45, 0.35)
typing(T["hi"] - 0.1, T["setter2"] + 0.35)
for w in ["straight", "personalised", "about"]: put(pop(), T[w] - 0.15, 0.4, rng.uniform(-0.3, 0.3))
put(click(0.04, 1500, 6000, 0.008), T["looked"] - 0.05, 0.4)
typing(T["fitness1"] - 0.25, T["fitness2"] + 0.3)
typing(T["admire"] - 0.3, T["people"] + 0.1)
put(pop(0.05), T["setter2"] + 0.4, 0.3); put(pop(0.05), T["people"] + 0.15, 0.3)
# 04 the system
for w in ["stay", "dont"]: put(toggle(), T[w] + 0.15, 0.6)
put(riser(0.6), T["n100"] - 0.6, 0.4); put(impact(0.9), T["n100"] - 0.05, 0.5)
for i in range(12): put(click(0.02, 3000, 10000, 0.003), T["n100"] - 0.15 + i * 0.08 * (1 + i * 0.05), 0.14)
put(whoosh(0.5, False), T["track"] - 0.4, 0.35)
typing(T["saying2"], T["response"] + 0.2, rate=16, g=0.13)
put(pop(), T["response"] - 0.1, 0.35)
put(whoosh(0.35, False), T["narrow"] - 0.1, 0.25)
put(pop(0.09), T["best"] - 0.05, 0.5); put(thump(0.25, 150, 0.05), T["best"], 0.35)
put(pop(), T["efficient"] - 0.2, 0.4)
# 05 the close
put(whoosh(0.5), T["always"] - 0.4, 0.3)
typing(T["always"] - 0.05, T["question"] - 0.05)
put(pop(0.09), T["question"] - 0.05, 0.55); put(thump(0.25, 160, 0.05), T["question"], 0.3)
put(pop(), T["opens"] - 0.1, 0.45)
typing(T["conversation"] + 0.15, T["conversation"] + 0.6, g=0.18)
put(thump(0.35, 70, 0.09), T["hard"] - 0.1, 0.55); put(click(0.06, 300, 2500, 0.02), T["hard"] - 0.1, 0.35)
put(whoosh(0.25), T["no"] + 0.03, 0.35)
# end card
put(whoosh(0.6), T["endCard"] - 0.45, 0.45); put(impact(1.3), T["endCard"] - 0.05, 0.5)
for i in range(5): put(click(0.03, 2000, 8000, 0.006), T["endCard"] + 0.15 + i * 0.12, 0.25)
put(pop(0.09), T["endCard"] + 1.05, 0.45)

# light room tone under the cuts so silences don't drop to digital zero
tone = band(N, 80, 1800) * 0.0025

mix = np.stack([voice + tone, voice + tone]) + sfx * 0.5
mix /= np.abs(mix).max() + 1e-9
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-",
                "-af", "acompressor=threshold=-24dB:ratio=3:attack=5:release=120:makeup=4,loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", str(SR), "-c:a", "pcm_s16le", dst],
               input=mix.T.astype(np.float32).tobytes(), check=True)
print("wrote", dst)
