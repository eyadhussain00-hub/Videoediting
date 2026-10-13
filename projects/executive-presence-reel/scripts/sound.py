"""Sound design + mix (all SFX synthesised here — no licences needed).
voice = Demucs vocals stem, music = the reel's own music stem (Demucs no_vocals), rebalanced, ducked,
dropped out before the title hit and extended under the end card. Output: public/mix.wav (48 kHz stereo).
Usage: python3 scripts/sound.py   (then loudness is normalised with ffmpeg loudnorm, two-pass)"""
import json, numpy as np, soundfile as sf
from scipy import signal

SR = 48000
TOTAL = 1578 / 24 + 2.9
rng = np.random.default_rng(11)
W = json.load(open('src/data.json'))['words']
wt = lambda i: W[i]['t']

def load(p):
    a, sr = sf.read(p, dtype='float32')
    if a.ndim == 1: a = np.stack([a, a], 1)
    if sr != SR: a = signal.resample_poly(a, SR, sr, axis=0).astype(np.float32)
    return a

def env(n, a, d):  # attack / exp decay
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)

def bp_noise(dur, f0, f1, q=1.2):
    """noise through a band-pass whose centre glides f0→f1 (overlap-add of short filtered blocks)."""
    n = int(dur * SR); out = np.zeros(n); blk = 1024; hop = 512
    win = np.hanning(blk)
    for s in range(0, n - blk, hop):
        fc = f0 * (f1 / f0) ** (s / n)
        lo, hi = max(30, fc / (1 + 1 / q)), min(SR / 2 - 100, fc * (1 + 1 / q))
        sos = signal.butter(2, [lo, hi], 'band', fs=SR, output='sos')
        out[s:s + blk] += signal.sosfilt(sos, rng.standard_normal(blk)) * win
    return out / (np.abs(out).max() + 1e-9)

def verb(x, secs=1.0, mix=0.25):
    n = int(secs * SR)
    ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR / (secs / 5))
    ir = signal.sosfilt(signal.butter(2, 6000, 'low', fs=SR, output='sos'), ir)
    wet = signal.fftconvolve(x, ir)[:len(x) + n]
    wet = np.pad(wet, (0, len(x) + n - len(wet)))
    wet /= np.abs(wet).max() + 1e-9
    dry = np.concatenate([x, np.zeros(n)])
    return dry * (1 - mix) + wet * mix * np.abs(x).max()

def whoosh(dur=0.6, up=True):
    x = bp_noise(dur, 300 if up else 3500, 3500 if up else 300, 0.9)
    t = np.linspace(0, 1, len(x)); e = np.sin(np.pi * t) ** 1.6
    return verb(x * e, 0.6, 0.2)

def boom(gain=1.0, dur=2.2):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 38 + 70 * np.exp(-t / 0.09)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.7)
    thump = signal.sosfilt(signal.butter(2, 180, 'low', fs=SR, output='sos'), rng.standard_normal(n)) * env(n, 0.002, 0.08) * 3
    click = signal.sosfilt(signal.butter(2, 2500, 'high', fs=SR, output='sos'), rng.standard_normal(n)) * env(n, 0.0005, 0.012) * 0.4
    x = body + thump + click
    return verb(x / np.abs(x).max() * gain, 1.6, 0.3)

def shimmer(gain=0.35, dur=2.2, base=880):
    n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for k, r in enumerate([1, 1.25, 1.5, 2, 2.5, 3, 4]):
        d = int(rng.uniform(0, 0.12) * SR)
        f = base * r * (1 + rng.uniform(-0.002, 0.002))
        tone = np.sin(2 * np.pi * f * t) * np.exp(-t / (0.9 - 0.08 * k)) * (0.9 ** k)
        x[d:] += tone[:n - d]
    x *= np.minimum(1, t / 0.01)
    return verb(x / np.abs(x).max() * gain, 2.0, 0.45)

def riser(dur=2.1, gain=0.6):
    n = int(dur * SR); t = np.arange(n) / SR
    nz = bp_noise(dur, 400, 6000, 1.5)
    f = 180 * (6 ** (t / dur))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.35 * (1 + 0.3 * np.sin(2 * np.pi * (4 + 10 * t / dur) * t))
    e = (t / dur) ** 2.2
    x = (nz + tone) * e
    x[-int(0.02 * SR):] *= np.linspace(1, 0, int(0.02 * SR))
    return x / np.abs(x).max() * gain

def pop(freq=900, gain=0.3):
    n = int(0.12 * SR); t = np.arange(n) / SR
    f = freq * (1 + 0.8 * np.exp(-t / 0.012))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.03)
    return verb(x * gain, 0.4, 0.15)

def tick(gain=0.18):
    n = int(0.05 * SR)
    x = signal.sosfilt(signal.butter(2, [2500, 6000], 'band', fs=SR, output='sos'), rng.standard_normal(n)) * env(n, 0.0003, 0.006)
    return x / np.abs(x).max() * gain

def swish(gain=0.3, dur=0.3):
    x = bp_noise(dur, 1500, 7000, 1.0); t = np.linspace(0, 1, len(x))
    return x * np.sin(np.pi * t) ** 2 * gain

def ping(freq=1318.5, gain=0.3):
    n = int(1.6 * SR); t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * freq * r * t) * np.exp(-t / d) * a for r, d, a in [(1, 0.6, 1), (2.76, 0.25, 0.3), (5.4, 0.1, 0.12)])
    return verb(x * np.minimum(1, t / 0.002) / 1.4 * gain, 1.2, 0.35)

# ---------------- events ----------------
EV = []
def at(t, x, g=1.0, pan=0.0): EV.append((t, x * g, pan))

at(0.12, tick(0.12))
at(wt(15) - 0.03, boom(0.55)); at(wt(15) - 0.02, shimmer(0.22, base=1046.5))
at(4.15, whoosh(0.5), 0.35)
for i in range(12):
    tt = wt(16) + 0.08 + i * 0.28 + (0.3 if i > 7 else 0)
    at(tt, pop(rng.uniform(600, 1400), 0.16), pan=rng.uniform(-0.6, 0.6))
at(8.0, whoosh(0.55, up=False), 0.5)
for a in (9.7, 12.45, 17.2): at(a, whoosh(0.45), 0.3)
for a in (wt(44), wt(45), wt(54), wt(59) - 0.1, wt(67), wt(73) - 0.1): at(a, pop(1100, 0.16))
at(24.44 - 2.1, riser(2.1, 0.5))
at(24.42, boom(1.0, 3.0)); at(24.44, shimmer(0.32, 3.0, 659.25))
at(25.0, whoosh(0.5), 0.25)
at(28.2, swish(0.22, 0.6)); at(wt(89) - 0.05, whoosh(0.6), 0.4); at(wt(89) + 0.75, tick(0.2))
for k, i in enumerate((99, 100, 101)): at(wt(i), pop(800 * 1.26 ** k, 0.22))
at(39.0, whoosh(0.45), 0.3); at(39.2, shimmer(0.2, 2.0, 1318.5))
for i in (118, 119): at(wt(i), tick(0.15))
at(41.4, whoosh(0.45), 0.3)
for i in (121, 128, 135): at(wt(i) - 0.1, pop(950, 0.2))
at(wt(139) + 0.1, swish(0.2))
at(53.0, swish(0.25))
at(wt(154) - 0.12, whoosh(0.7, up=False), 0.6)
at(wt(156), ping(1318.5, 0.22))
at(wt(157), pop(1000, 0.2)); at(wt(162), pop(1250, 0.22)); at(wt(162), shimmer(0.14, 1.6, 1567.98))
at(wt(170) - 0.3, riser(1.4, 0.18))
at(62.25, swish(0.22))
at(65.6, whoosh(0.6), 0.4); at(65.95, boom(0.5, 2.5)); at(66.3, shimmer(0.25, 2.4, 880)); at(66.75, pop(900, 0.22))

# ---------------- stems ----------------
N = int(TOTAL * SR)
voc = load('cache/stems/htdemucs/ref/vocals.wav'); mus = load('cache/stems/htdemucs/ref/no_vocals.wav')
def fit(a): b = np.zeros((N, 2), np.float32); m = min(N, len(a)); b[:m] = a[:m]; return b
voc = fit(voc)
# extend music under the end card with its own last bar (3 s ≈ one bar at 80 BPM), crossfaded
L = len(mus); bar = int(3.0 * SR); xf = int(0.08 * SR)
tail = mus[L - bar:L].copy()
ext = np.concatenate([mus, np.zeros((bar, 2), np.float32)])
ramp = np.linspace(0, 1, xf)[:, None]
ext[L - xf:L] = mus[L - xf:L] * (1 - ramp) + tail[:xf] * ramp
ext[L:L + bar - xf] = tail[xf:]
mus = fit(ext)
tt = np.arange(N) / SR
# music gain automation: −3 dB overall, dropout before the title hit, gentle fade at the end
g = np.full(N, 0.72)
def ramp_to(a, b, v0, v1):
    i0, i1 = int(a * SR), int(b * SR); g[i0:i1] = np.linspace(v0, v1, i1 - i0)
ramp_to(23.3, 24.3, 0.72, 0.0); g[int(24.3 * SR):int(25.3 * SR)] = 0.0; ramp_to(25.3, 26.8, 0.0, 0.72)
ramp_to(53.55, 53.8, 0.72, 0.15); ramp_to(53.8, 54.8, 0.15, 0.72)       # "step back": the music steps back too
ramp_to(TOTAL - 2.2, TOTAL, 0.72, 0.0)
# sidechain duck from the voice envelope (−3 dB max)
e = np.abs(voc).mean(1)
e = signal.sosfilt(signal.butter(1, 6, 'low', fs=SR, output='sos'), e)
duck = 1 - 0.3 * np.clip(e / (np.percentile(e, 95) + 1e-9), 0, 1)
mus *= (g * duck)[:, None]

sfx = np.zeros((N, 2), np.float32)
for t0, x, pan in EV:
    i = int(t0 * SR); x = np.asarray(x, np.float32); m = min(len(x), N - i)
    if m <= 0: continue
    sfx[i:i + m, 0] += x[:m] * np.sqrt((1 - pan) / 2) * 1.41
    sfx[i:i + m, 1] += x[:m] * np.sqrt((1 + pan) / 2) * 1.41
# keep SFX out of the voice's way: tame 2–4 kHz a little
sfx = signal.sosfilt(signal.butter(2, 40, 'high', fs=SR, output='sos'), sfx, axis=0).astype(np.float32)

mix = voc * 1.0 + mus + sfx * 0.55
mix /= max(1.0, np.abs(mix).max() / 0.97)
sf.write('cache/mix_pre.wav', mix, SR, subtype='PCM_24')
sf.write('cache/sfx.wav', sfx, SR, subtype='PCM_24')
print('events', len(EV), 'dur', N / SR)
