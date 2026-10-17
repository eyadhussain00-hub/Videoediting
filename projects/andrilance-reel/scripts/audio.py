"""Voice + sound design → public/mix.wav (48 kHz stereo, -14 LUFS, -1.5 dBTP).
NO MUSIC (owner's halal rule): the voice is the reel's own track (it has no music bed), cut with the edit's cut list;
every SFX is synthesised noise/transient design (whooshes, clicks, pops, impacts, typing), nothing tonal or melodic.
Cue times come from plan/beats.json (npx tsx scripts/beats.ts > plan/beats.json).
Usage: python3 scripts/audio.py cache/orig.wav public/mix.wav"""
import json, subprocess, sys, numpy as np

SR = 48000
B = json.load(open("plan/beats.json"))
C, FPS = B["cues"], B["fps"]
N = int(B["duration"] * SR)
rng = np.random.default_rng(7)
src, dst = sys.argv[1], sys.argv[2]

# ---- voice: the edit's cut list, 15 ms fades at each cut, light EQ + compression
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-ac", "1", "-ar", str(SR),
                      "-af", "highpass=f=70,equalizer=f=250:t=q:w=1:g=-1.5,equalizer=f=3500:t=q:w=1.2:g=1.5,acompressor=threshold=-20dB:ratio=2.4:attack=5:release=90:makeup=2",
                      "-f", "f32le", "-"], capture_output=True, check=True).stdout
v_src = np.frombuffer(raw, np.float32).astype(np.float64)
voice = np.zeros(N)
fade = int(0.015 * SR)
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

def typing(t, n, gap=0.07, g=0.22):
    for k in range(n): put(click(0.025, 2500, 9000, 0.004), t + k * gap * rng.uniform(0.8, 1.25), g, rng.uniform(-0.3, 0.3))
def enter(t, g=0.28): put(whoosh(0.35), t - 0.28, g)
def exit_(t, g=0.18): put(whoosh(0.3, False), t, g)

# hook: impact on frame 0, the $ counter ticks, AGE 21 pop
put(impact(1.4), 0.0, 0.5); put(whoosh(0.5, False), 0.0, 0.3)
for k in range(14): put(click(0.02, 3000, 11000, 0.003), 0.15 + k * 0.14 * (1 + k * 0.03), 0.16)
put(pop(0.09), C["hook"] + 3.06, 0.5); put(thump(0.3, 80, 0.08), 3.08, 0.5)
# college / 2-3 h, then → now, freedom tiles, dream car, FREEDOM
enter(C["college"]); put(pop(), C["college"], 0.4, -0.3); put(pop(), C["work"], 0.4, 0.3)
put(whoosh(0.5), C["now2"] - 0.1, 0.3); put(pop(), C["now2"] + 0.5, 0.4)
for k, c in enumerate(["travel", "buy", "dream"]): put(pop(0.08), C[c], 0.45, -0.5 + 0.5 * k)
put(whoosh(0.3), C["dream"] - 0.25, 0.25)
put(whoosh(0.6, False), C["complete"] - 0.1, 0.4); put(impact(1.0), C["complete"], 0.35)
# social strike, gym reps
put(whoosh(0.25), C["dont"] + 0.0, 0.3); put(click(0.04, 1500, 6000, 0.01), C["dont"] + 0.25, 0.4)
for k in range(6): put(thump(0.12, 150, 0.03), C["learned"] + 0.15 + k * 0.22, 0.25); put(click(0.02, 2000, 8000, 0.003), C["learned"] + 0.15 + k * 0.22, 0.2)
# progress bar
put(whoosh(0.5), C["end"] - 0.3, 0.3); put(click(0.04, 1500, 7000, 0.006), C["end"] + 0.2, 0.4)
# 3 years, gurus, receipt, same thing
enter(C["spent"]); typing(C["spent"] + 0.6, 10, 0.12, 0.12)
for k, c in enumerate(["iman", "brez", "tjr"]): put(pop(0.08), C[c], 0.45, -0.5 + 0.5 * k)
for k in range(3): put(click(0.05, 1200, 5000, 0.012), C["all"] + k * 0.16, 0.4)
put(thump(0.3, 70, 0.1), C["struggle"], 0.5)
put(whoosh(0.6, False), C["exact"] - 0.2, 0.35); put(impact(0.9), C["exact"], 0.3)
# flow nodes
for c in ["skill2", "monetized", "highticket"]: put(pop(0.08), C[c], 0.45); put(whoosh(0.2), C[c] - 0.2, 0.15)
# without: two crosses, "?" , changed my life
for c in ["dancing", "expert"]: put(click(0.05, 1200, 6000, 0.012), C[c] + 0.25, 0.5); put(thump(0.2, 110, 0.05), C[c] + 0.25, 0.3)
put(whoosh(0.5, False), C["what3"] - 0.1, 0.3)
put(riser(0.8), C["changed"] - 0.8, 0.5); put(impact(1.8), C["changed"] - 0.03, 0.75)
# AI system, combine, step 1
enter(C["put"]); put(swell(1.2), C["majority"] - 0.1, 0.3)
put(whoosh(0.35), C["claude1"] - 0.25, 0.3, -0.5); put(whoosh(0.35), C["agent"] - 0.25, 0.3, 0.5)
put(whoosh(0.4, False), C["did3"], 0.3); put(impact(0.8), C["did3"] + 0.4, 0.35); put(pop(0.09), C["did3"] + 0.4, 0.4)
put(riser(0.5), C["step1"] - 0.5, 0.35); put(impact(1.3), C["step1"] - 0.03, 0.6)
# paste: cmd-V, send
put(whoosh(0.4), C["copy"] - 0.3, 0.3); put(click(0.04, 1500, 7000, 0.008), C["pasted"], 0.55); put(thump(0.2, 140, 0.04), C["pasted"], 0.3)
put(click(0.04, 1800, 8000, 0.006), C["claude2"] + 0.1, 0.5); put(whoosh(0.35), C["claude2"] + 0.12, 0.3)
# interview typing, package, $1,000
typing(C["interviewed"], 16, 0.05, 0.12); typing(C["couple2"], 16, 0.05, 0.12)
for c in ["skills", "knowledge", "expertise"]: put(pop(0.08), C[c], 0.4)
put(whoosh(0.5), C["into2"] - 0.05, 0.35); put(impact(0.8), C["into2"] + 0.3, 0.35)
for k in range(8): put(click(0.02, 3000, 11000, 0.003), C["k1"] + k * 0.09, 0.15)
put(whoosh(0.6, False), C["every2"] - 0.1, 0.3)
# CTA 1: bookmark, typing PROMPT, send
enter(C["if2"]); put(pop(0.1), C["save1"], 0.55); typing(C["prompt2"] - 0.2, 6, 0.065, 0.25); put(whoosh(0.3), C["prompt2"] + 0.4, 0.3)
put(riser(0.5), C["step2"] - 0.5, 0.35); put(impact(1.3), C["step2"] - 0.03, 0.6)
# topics chat, buyers/viewers, bars, quality
typing(C["asked2"], 26, 0.045, 0.1); [put(pop(0.06), C["ideal"] + k * 0.18, 0.3) for k in range(3)]
put(click(0.05, 1200, 6000, 0.012), C["viral"] + 0.2, 0.45); put(pop(0.1), C["buyers"] + 0.2, 0.55)
put(whoosh(0.5), C["million"] - 0.1, 0.3); put(whoosh(0.5), C["k3"] - 0.05, 0.3); put(pop(0.09), C["k3"] + 0.7, 0.45)
put(whoosh(0.6, False), C["its"] - 0.1, 0.3); put(impact(0.9), C["its"], 0.3)
# script typing + tags
enter(C["claude4"]); typing(C["scripted"] + 0.1, 30, 0.035, 0.08)
for c in ["mspec", "mniche", "buyers2"]: put(pop(0.08), C[c], 0.4)
# per day, month, dots takeover
enter(C["two"]); put(pop(0.09), C["k1v"], 0.4)
enter(C["over"]); [put(click(0.015, 3500, 11000, 0.002), C["month"] + k * 0.035, 0.1) for k in range(30)]
pa, pb = B["pip"][0]
put(whoosh(0.7, False), pa, 0.45); put(swell(1.4), pa + 0.1, 0.3)
for k in range(3): put(pop(0.08), C["three"] + k * 0.12, 0.5, -0.4 + 0.4 * k)
put(impact(1.3), C["pct"] - 0.03, 0.6)
put(click(0.05, 1200, 6000, 0.012), C["job95"] + 0.45, 0.5); put(pop(0.1), C["job95"] + 0.55, 0.5)
put(whoosh(0.6), pb - 0.45, 0.4)
# ceiling crack, million counter
put(impact(1.0), C["ceiling"] + 0.1, 0.5); put(click(0.08, 800, 9000, 0.02), C["ceiling"] + 0.1, 0.6); put(riser(0.5), C["ceiling"] - 0.4, 0.3)
for k in range(10): put(click(0.02, 3000, 11000, 0.003), C["million2"] - 0.2 + k * 0.09, 0.15)
# skill chips, payments
for c in ["already2", "job", "hobby", "above"]: put(pop(0.08), C[c], 0.4)
for c in ["people5", "willing", "pay"]: put(pop(0.1), C[c] - 0.1, 0.5); put(click(0.03, 3000, 9000, 0.006), C[c] - 0.05, 0.3)
# CTA 2 + end card
enter(C["as2"]); put(pop(0.1), C["save2"], 0.55); typing(C["prompt3"] - 0.2, 6, 0.065, 0.25); put(whoosh(0.3), C["prompt3"] + 0.4, 0.3)
put(whoosh(0.6), C["endCard"] - 0.45, 0.45); put(impact(1.5), C["endCard"] - 0.03, 0.55); put(pop(0.1), C["endCard"] + 0.12, 0.45)
# a soft tick on every sentence re-frame
for s in B["sentences"][1:]: put(whoosh(0.18), s - 0.12, 0.08)

# light room tone under the cuts so silences don't drop to digital zero
tone = band(N, 80, 1800) * 0.002

mix = np.stack([voice + tone, voice + tone]) + sfx * 0.5
mix /= np.abs(mix).max() + 1e-9
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-",
                "-af", "loudnorm=I=-14:TP=-1.5:LRA=9", "-ar", str(SR), "-c:a", "pcm_s16le", dst],
               input=mix.T.astype(np.float32).tobytes(), check=True)
print("wrote", dst)
