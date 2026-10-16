"""Voice + sound design → public/mix.wav (48 kHz stereo, -14 LUFS, -1.5 dBTP).
NO MUSIC (owner's rule): the voice is the Demucs vocal stem of the reel (its music bed is dropped), cut with the
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

# hook
put(impact(1.2), 0.0, 0.45); put(whoosh(0.4, False), 0.0, 0.35)
put(whoosh(0.35), T["tiktok"] - 0.3, 0.35); put(pop(), T["tiktok"] - 0.05, 0.5)
put(whoosh(0.25), T["locked"] - 0.28, 0.3); put(lock(), T["locked"] + 0.08, 0.95); put(impact(0.9), T["locked"] + 0.1, 0.35)
put(whoosh(0.4, False), T["salah1"] - 0.3, 0.3); put(click(0.04, 1500, 7000, 0.01), T["salah1"] - 0.05, 0.45)
# pray for us / right?
put(whoosh(0.3), T["s2"] - 0.05, 0.22)
for k, dt in enumerate([-0.08, 0.2]): put(pop(), T["pray"] + dt, 0.28, -0.3 + 0.3 * k)
put(pop(0.09), T["right"] - 0.06, 0.55, 0.35)
# guess what
put(whoosh(0.3), T["guess"] - 0.3, 0.45); put(impact(0.8), T["guess"] - 0.04, 0.55); put(thump(0.3, 80, 0.08), T["what"] - 0.03, 0.6)
# blueprint drawing: little drafting ticks
for k in range(10): put(click(0.02, 3500, 11000, 0.003), T["thats"] + 0.05 + k * 0.11, 0.18, rng.uniform(-0.6, 0.6))
# reveal
put(riser(0.75), T["focusdeen1"] - 0.75, 0.55); put(impact(1.6), T["focusdeen1"] - 0.04, 0.85); put(whoosh(0.6, False), T["focusdeen1"], 0.4)
put(pop(0.09), T["focusdeen1"] + 0.2, 0.4, 0.5)
# apps in, locks one by one, fold into Salah Focus, toggle
for i in range(6): put(pop(), T["s5"] + 0.1 + i * 0.07, 0.3, -0.5 + 0.2 * i)
step = (T["salah2"] - 0.35 - T["block"]) / 6
for i in range(6): put(lock(), T["block"] + 0.07 + i * step, 0.55, -0.5 + 0.2 * i)
put(whoosh(0.4), T["salah2"] - 0.3, 0.35); put(toggle(), T["time2"] - 0.03, 0.9); put(thump(0.25, 140, 0.05), T["time2"], 0.3)
# focus beat: soft air, autofocus servo ticks, a swell for khushu'
put(whoosh(0.7, False), T["s6"] - 0.1, 0.3)
for k in range(5): put(click(0.02, 4000, 11000, 0.002), T["focus"] - 0.2 + k * 0.06, 0.25)
put(click(0.04, 2000, 8000, 0.006), T["focus"] + 0.28, 0.45)
put(swell(1.6), T["pray2"] - 0.3, 0.35)
# CTA: card in, typing, result, tap, download, link
put(whoosh(0.4, False), T["try"] - 0.4, 0.3)
for k in range(9): put(click(0.025, 2500, 9000, 0.004), T["search"] + k * 0.069, 0.32, rng.uniform(-0.2, 0.2))
put(pop(), T["store"] - 0.42, 0.4); put(click(0.04, 1500, 6000, 0.008), T["store"], 0.6); put(thump(0.2, 160, 0.04), T["store"], 0.3)
put(pop(), T["store"] + 1.15, 0.3)
put(whoosh(0.3), T["link"] - 0.3, 0.25); put(click(0.04, 1500, 6000, 0.008), T["link"] + 0.35, 0.5)
# end card
put(whoosh(0.6), T["endCard"] - 0.45, 0.45); put(impact(1.3), T["endCard"] - 0.05, 0.5); put(pop(0.09), T["endCard"] + 0.2, 0.4)

# light room tone under the cuts so silences don't drop to digital zero
tone = band(N, 80, 1800) * 0.0025

mix = np.stack([voice + tone, voice + tone]) + sfx * 0.5
mix /= np.abs(mix).max() + 1e-9
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-",
                "-af", "loudnorm=I=-14:TP=-1.5:LRA=9", "-ar", str(SR), "-c:a", "pcm_s16le", dst],
               input=mix.T.astype(np.float32).tobytes(), check=True)
print("wrote", dst)
