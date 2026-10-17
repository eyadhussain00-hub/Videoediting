"""Voice + sound design → public/mix.wav (48 kHz stereo, -14 LUFS, -1.5 dBTP).
NO MUSIC (owner's rule): the voice is the Demucs vocal stem of the reel (its music bed is dropped), cut with the
edit's own cut list; every SFX is synthesised noise/transient design (whooshes, clock ticks, clicks, impacts, pops),
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

# hook: one hit per number
put(impact(1.0), T["four1"] + 0.0, 0.4); put(whoosh(0.35), T["four1"], 0.3)
put(thump(0.3, 90, 0.08), T["four2"] - 0.03, 0.55); put(whoosh(0.3), T["four2"] - 0.2, 0.25)
put(riser(0.6), T["forty"] - 0.6, 0.35); put(impact(1.4), T["forty"] - 0.04, 0.7); put(click(0.04, 1500, 7000, 0.01), T["forty"], 0.5)
put(whoosh(0.4, False), T["o1"] - 0.35, 0.35)

# the clock: a soft mechanical tick per second (noise transient), louder in the last five
c0, c1 = T["o1"], T["todayEnd"]
rate = 40 / (c1 - c0)
for k in range(1, 40):
    tt = c0 + k / rate
    last = k >= 35
    put(click(0.025, 3000 if k % 2 else 2200, 10000, 0.003), tt, 0.32 if last else 0.12, 0.25 if k % 2 else -0.25)
put(impact(1.6), c1, 0.75); put(click(0.06, 1200, 6000, 0.02), c1, 0.6)

# each objection: whoosh + chip pop, the quote wipe, the close lines
quotes = [T["q1"], T["q2"], T["q3"], T["q4"]]
closes = [T["sense"], T["understand"], T["absolutely"], T["hear"]]
for i, o in enumerate([T["o1"], T["o2"], T["o3"], T["o4"]]):
    if i: put(whoosh(0.45, False), o - 0.35, 0.4); put(thump(0.25, 110, 0.06), o - 0.06, 0.4)
    put(pop(0.08), o - 0.15, 0.45, -0.4)
    put(whoosh(0.5), quotes[i] - 0.1, 0.18, 0.2)
    put(whoosh(0.3, False), closes[i] - 0.15, 0.22)
for k in ["compared", "which", "whatTell", "canAsk"]:
    put(pop(0.09), T[k] - 0.25, 0.4, 0.3); put(click(0.03, 2000, 8000, 0.005), T[k] - 0.2, 0.3)
# 1: bars
put(swell(1.2), T["because1"], 0.3); put(riser(T["investment"] - T["cost"] + 0.2), T["cost"] - 0.05, 0.28)
# 2: three chips, then the selector running through them
for k in ["timing1", "money", "whether"]: put(pop(), T[k] - 0.06, 0.45, rng.uniform(-0.4, 0.4))
for n in range(7): put(click(0.02, 3500, 11000, 0.003), T["which"] + 0.1 + n * 0.28, 0.3, -0.4 + 0.4 * (n % 3))
# 3: chat bubbles
put(pop(0.09), T["ifSpouse"] - 0.05, 0.45, -0.4); put(pop(0.09), T["whatTell"] - 0.1, 0.45, 0.4)
for n in range(8): put(click(0.02, 2500, 9000, 0.004), T["whatTell"] + 0.2 + n * 0.09, 0.14, 0.4)
# 4: timeline draws, six months lands, today bursts
put(whoosh(1.4), T["because2"], 0.2); put(pop(), T["six"] - 0.05, 0.45, 0.5)
put(whoosh(0.6, False), T["wish"] - 0.1, 0.3, 0.3); put(thump(0.35, 80, 0.1), T["today"] - 0.03, 0.55)
# recap
put(whoosh(0.6), T["recap"] - 0.3, 0.45)
for k in range(4): put(pop(), T["recap"] + 0.2 + k * 0.14, 0.35, -0.3 + 0.2 * k)

# light room tone under the cuts so silences don't drop to digital zero
tone = band(N, 80, 1800) * 0.0025

mix = np.stack([voice + tone, voice + tone]) + sfx * 0.5
mix /= np.abs(mix).max() + 1e-9
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-",
                "-af", "loudnorm=I=-14:TP=-1.5:LRA=9", "-ar", str(SR), "-c:a", "pcm_s16le", dst],
               input=mix.T.astype(np.float32).tobytes(), check=True)
print("wrote", dst)
