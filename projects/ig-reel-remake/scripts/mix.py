"""Sound design + mix, all synthesised here (no licensed samples needed):
original ambient music bed (ducked under the voice) + SFX on the visual beats → public/mix.wav at −14 LUFS / −1.5 dBTP.
Usage: python3 scripts/mix.py            (reads public/audio.wav, the source voice)"""
import subprocess, wave
import numpy as np

SR = 48000
TOTAL = 62.0
TALK_END = 59.17
rng = np.random.default_rng(11)
N = int(TOTAL * SR)


def read_voice(p="public/audio.wav"):
    with wave.open(p) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float64) / 32768
        x = x.reshape(-1, w.getnchannels()).mean(1)
    out = np.zeros(N); out[: len(x)] = x[:N]; return out


def bandnoise(n, lo, hi):
    X = np.fft.rfft(rng.standard_normal(n)); f = np.fft.rfftfreq(n, 1 / SR); X[(f < lo) | (f > hi)] = 0
    x = np.fft.irfft(X, n); return x / (np.abs(x).max() + 1e-9)


def env_ad(n, a, d):
    t = np.arange(n) / SR; return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)


# ---------- SFX ----------
def whoosh(d=0.5):
    n = int(d * SR); k = np.arange(n) / n
    sweep = bandnoise(n, 200, 1500) * (1 - k) + bandnoise(n, 1200, 9000) * k
    return sweep * np.sin(np.pi * k) ** 2.2 * 0.9

def pop(d=0.12):
    n = int(d * SR); t = np.arange(n) / SR
    body = np.sin(2 * np.pi * (900 * np.exp(-t * 40) + 260) * t) * np.exp(-t / 0.03)
    return 0.7 * body + 0.3 * bandnoise(n, 1500, 6000) * np.exp(-t / 0.008)

def tick(d=0.04):
    n = int(d * SR); t = np.arange(n) / SR; return bandnoise(n, 3000, 10000) * np.exp(-t / 0.005)

def click(d=0.05):
    n = int(d * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * 2200 * t) * np.exp(-t / 0.004) + 0.5 * bandnoise(n, 2000, 8000) * np.exp(-t / 0.003)

def boom(d=1.8, f0=55):
    n = int(d * SR); t = np.arange(n) / SR
    sub = np.sin(2 * np.pi * (f0 + 70 * np.exp(-t * 18)) * t) * np.exp(-t / 0.55)
    thump = bandnoise(n, 60, 400) * np.exp(-t / 0.05)
    air = bandnoise(n, 3000, 12000) * np.exp(-t / 0.25) * 0.15
    return 0.9 * sub + 0.4 * thump + air

def thud(d=0.6):
    return boom(d, 70) * 0.8

def riser(d=1.2):
    n = int(d * SR); k = np.arange(n) / n; t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * (180 * t + 600 * t * k)) * 0.25
    return (bandnoise(n, 800, 9000) * k ** 2.5 * 0.8 + tone * k ** 2) * (1 - np.exp(-(1 - k) * 60))

def glitch(d=0.35):
    n = int(d * SR); x = np.zeros(n); i = 0
    while i < n:
        L = int(rng.uniform(0.008, 0.04) * SR)
        f = rng.uniform(200, 3000); t = np.arange(min(L, n - i)) / SR
        x[i:i + len(t)] = np.sign(np.sin(2 * np.pi * f * t)) * rng.uniform(0.2, 0.7)
        i += L + int(rng.uniform(0, 0.02) * SR)
    return x * 0.6

def swish(d=0.28):
    n = int(d * SR); k = np.arange(n) / n; return bandnoise(n, 2500, 11000) * np.sin(np.pi * k) ** 3 * 0.8

def shimmer(d=1.6):
    n = int(d * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for f in (1318.5, 1760, 2093, 2637, 3136):
        x += np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) * np.exp(-t / 0.6) * (1 - np.exp(-t / 0.08))
    return x / 5

def strike(d=0.35):
    n = int(d * SR); k = np.arange(n) / n; return bandnoise(n, 1500, 7000) * np.sin(np.pi * k) * 0.7

SFX = dict(whoosh=whoosh, pop=pop, tick=tick, click=click, boom=boom, thud=thud, riser=riser,
           glitch=glitch, swish=swish, shimmer=shimmer, strike=strike)
GAIN = dict(whoosh=0.55, pop=0.5, tick=0.35, click=0.45, boom=0.9, thud=0.7, riser=0.4, glitch=0.35,
            swish=0.4, shimmer=0.25, strike=0.45)
PRE = dict(whoosh=0.25, swish=0.12, riser=1.2, strike=0.05)  # these peak at the cue, so they start earlier

CUES = [
    (0.0, "boom"), (0.0, "shimmer"),
    (1.84, "whoosh"), (2.2, "pop"), (3.1, "whoosh"), (3.26, "pop"),
    (4.34, "swish"), (4.78, "thud"),
    *[(6.4 + i * 0.06, "tick") for i in range(9)],
    (9.9, "pop"), (10.02, "pop"), (10.14, "pop"), (10.52, "riser"), (10.52, "boom"),
    (11.1, "whoosh"), (13.58, "tick"), (17.6, "swish"), (18.3, "pop"),
    (19.1, "whoosh"), (20.25, "pop"), (21.2, "pop"), (22.08, "thud"), (22.08, "click"),
    (23.4, "swish"), (24.6, "click"), (24.85, "click"), (26.45, "pop"), (26.54, "whoosh"),
    (28.76, "whoosh"), (29.5, "swish"), (30.3, "click"), (30.55, "click"),
    (32.7, "pop"), (32.86, "pop"), (33.12, "pop"), (33.12, "shimmer"),
    (34.64, "whoosh"), (36.6, "pop"), (37.58, "pop"),
    *[(38.75 + i * 0.07, "tick") for i in range(18)], (40.58, "strike"), (40.58, "glitch"),
    (43.4, "swish"), (45.0, "swish"), (45.68, "swish"), (46.34, "swish"), (47.28, "swish"),
    (49.8, "shimmer"), (52.64, "whoosh"), (53.96, "boom"),
    (57.9, "riser"), (57.98, "glitch"), (58.45, "boom"),
    (59.2, "whoosh"), *[(59.75 + i * 0.09, "click") for i in range(5)], (60.4, "pop"),
]


def sfx_track():
    x = np.zeros(N)
    for t, k in CUES:
        s = SFX[k]() * GAIN[k]; i = int(max(0, t - PRE.get(k, 0)) * SR); s = s[: N - i]; x[i:i + len(s)] += s
    return x


# ---------- music: slow ambient pad, 84 BPM, Am9 – Fmaj7 – Cmaj7 – G6 ----------
def music():
    bpm = 84; bar = 4 * 60 / bpm
    chords = [[57, 64, 67, 71, 72], [53, 60, 64, 69, 72], [48, 55, 59, 64, 67], [55, 59, 62, 64, 71]]
    hz = lambda m: 440 * 2 ** ((m - 69) / 12)
    t = np.arange(N) / SR; pad = np.zeros(N); bass = np.zeros(N)
    nb = int(np.ceil(TOTAL / bar)) + 1
    for b in range(nb):
        a = b * bar; ch = chords[b % 4]; i0 = int(a * SR); i1 = min(N, int((a + bar + 1.2) * SR))
        if i0 >= N: break
        tt = t[i0:i1] - a
        e = np.minimum(1, tt / 0.9) * np.exp(-np.maximum(0, tt - bar) / 0.5)
        for m in ch:
            for det in (-0.08, 0.0, 0.07):
                pad[i0:i1] += np.sin(2 * np.pi * hz(m + det) * tt + m) * e * 0.06
        r = ch[0] - 24
        for beat in range(4):  # soft sub pulse
            j0 = int((a + beat * bar / 4) * SR); j1 = min(N, j0 + int(0.5 * SR))
            if j0 >= N: break
            u = np.arange(j1 - j0) / SR
            bass[j0:j1] += np.sin(2 * np.pi * hz(r) * u) * np.exp(-u / 0.18) * (0.5 if beat else 0.8)
    # gentle lowpass on the pad via FFT, plus a tiny tape wobble
    X = np.fft.rfft(pad); f = np.fft.rfftfreq(N, 1 / SR); X *= 1 / (1 + (f / 1800) ** 2); pad = np.fft.irfft(X, N)
    hats = np.zeros(N); step = 60 / bpm / 2
    for k in range(int(TOTAL / step)):
        if k % 2 == 1:
            i = int(k * step * SR); s = tick(0.03) * 0.25; hats[i:i + len(s)] += s[: N - i]
    m = pad + bass * 0.5 + hats * 0.4
    # arc: quieter intro, lift into the last section, out with the end card
    arc = np.interp(t, [0, 2, 40, 48.8, 57, 59.2, 61.2, TOTAL], [0.7, 0.8, 0.8, 1.0, 1.05, 1.1, 0.9, 0])
    return m / (np.abs(m).max() + 1e-9) * arc


def smooth(x, win):
    c = np.cumsum(np.concatenate([[0], x])); h = win // 2
    i = np.arange(len(x)); lo = np.clip(i - h, 0, len(x)); hi = np.clip(i + h, 0, len(x))
    return (c[hi] - c[lo]) / np.maximum(1, hi - lo)


def duck(voice, depth_db=-9):
    e = smooth(np.abs(voice), int(0.05 * SR))
    on = (e > 0.02).astype(float)
    sm = smooth(on, int(0.25 * SR))
    return 10 ** (depth_db * sm / 20)


def main():
    v = read_voice()
    vpk = np.percentile(np.abs(v[np.abs(v) > 1e-3]), 99)
    mus = music() * vpk * 10 ** (-17 / 20) * duck(v)
    fx = sfx_track() * vpk * 10 ** (-9 / 20)
    out = v + mus + fx
    tmp = "cache/mix_pre.wav"
    with wave.open(tmp, "w") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(out / max(1, np.abs(out).max()), -1, 1) * 32767).astype(np.int16).tobytes())
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-af",
                    "loudnorm=I=-14:TP=-1.5:LRA=11,aformat=channel_layouts=stereo", "-ar", "48000", "public/mix.wav"], check=True)
    print(f"mix: {len(CUES)} cues → public/mix.wav")


if __name__ == "__main__":
    main()
