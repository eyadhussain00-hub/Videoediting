def band(n, lo, hi):
    X = np.fft.rfft(rng.standard_normal(n)); f = np.fft.rfftfreq(n, 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    x = np.fft.irfft(X, n); return x / (np.abs(x).max() + 1e-9)
def env(n, a, r):
    t = np.arange(n) / SR; return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / r)

def whoosh(d=0.5, up=True):
    n = int(d * SR); k = np.arange(n) / n
    lo, hi = band(n, 250, 1500), band(n, 1500, 9000)
    mix = lo * (1 - k) + hi * k if up else lo * k + hi * (1 - k)
    return mix * np.sin(np.pi * k) ** 1.6 * 0.9
def pop(d=0.12, f=900):
    n = int(d * SR); t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * (f * (1 + 0.6 * np.exp(-t / 0.02))) * t)
    return (0.7 * tone + 0.3 * band(n, 800, 4000)) * env(n, 0.002, 0.03)
def tick(d=0.04, lo=3000):
    n = int(d * SR); return band(n, lo, 11000) * env(n, 0.0005, 0.007)
def boom(d=2.2):
    n = int(d * SR); t = np.arange(n) / SR
    sub = np.sin(2 * np.pi * (42 + 70 * np.exp(-t / 0.05)) * t) * np.exp(-t / 0.7)
    hit = band(n, 60, 3000) * env(n, 0.001, 0.05)
    return 0.9 * sub + 0.45 * hit
def riser(d=1.4):
    n = int(d * SR); k = np.arange(n) / n; t = np.arange(n) / SR
    noise = band(n, 1500, 12000) * k ** 2.2
    tone = np.sin(2 * np.pi * (200 * t + 900 * t * k)) * k ** 3 * 0.25
    return (noise * 0.6 + tone) * (1 - np.clip((k - 0.97) / 0.03, 0, 1))
def shutter():
    n = int(0.16 * SR); a = band(n, 1500, 9000) * env(n, 0.0005, 0.012)
    b = np.roll(band(n, 1000, 7000) * env(n, 0.0005, 0.02), int(0.06 * SR)); return a + 0.8 * b
def stamp():
    n = int(0.5 * SR); t = np.arange(n) / SR
    return 0.9 * np.sin(2 * np.pi * (70 + 120 * np.exp(-t / 0.02)) * t) * np.exp(-t / 0.12) + 0.6 * band(n, 200, 5000) * env(n, 0.001, 0.03)
def paper(d=0.35):
    n = int(d * SR); k = np.arange(n) / n
    grain = band(n, 1200, 9000) * (0.4 + 0.6 * (rng.random(n) > 0.6))
    return grain * np.sin(np.pi * k) * 0.8
def shimmer(d=1.2):
    n = int(d * SR); t = np.arange(n) / SR; out = np.zeros(n)
    for i, f in enumerate([1318.5, 1567.98, 1975.5, 2637.0]):
        s = int(i * 0.05 * SR); tt = t[: n - s]
        out[s:] += np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.35) * 0.25
    return out

def thud(d=0.9):
    n = int(d * SR); t = np.arange(n) / SR
    body = np.sin(2 * np.pi * (55 + 60 * np.exp(-t / 0.03)) * t) * np.exp(-t / 0.22)
    click = band(n, 2000, 9000) * env(n, 0.0003, 0.004)
    return 0.9 * body + 0.25 * click
def swell(d=0.6):
    # reversed noise+tone bloom that ends exactly on the hit
    n = int(d * SR); k = np.arange(n) / n; t = np.arange(n) / SR
    x = band(n, 300, 7000) * 0.5 + np.sin(2 * np.pi * 220 * t) * 0.2
    return x * k ** 3
def braam(d=2.6):
    n = int(d * SR); t = np.arange(n) / SR
    x = np.zeros(n)
    for f in (55, 55 * 1.007, 82.4, 110 * 0.995, 110 * 1.006):
        ph = 2 * np.pi * f * t
        x += 2 / np.pi * np.arctan(4 * np.sin(ph))  # soft-clipped "saw-ish" body
    from scipy.signal import butter as _b, lfilter as _l
    bb, aa = _b(2, 900 / (SR / 2)); x = _l(bb, aa, x)
    a = np.minimum(1, t / 0.08) * np.exp(-t / 1.1)
    return x / (np.abs(x).max() + 1e-9) * a

