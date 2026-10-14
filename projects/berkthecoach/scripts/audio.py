"""Sound design + mix → public/mix.wav (48 kHz stereo, -14 LUFS, -1.5 dBTP).
Voice: Demucs (htdemucs) vocal stem of the reel — its own loud music bed is dropped — HPF, de-mud, presence, compression.
Music: a synthesised score in D Hijaz (drone pad, Karplus-Strong "oud" plucks, frame drum dum/tek, a ney-like breathy lead
on the big beats). SFX: synthesised whooshes, booms, shimmers, pops, a stamp, a crack and a heartbeat. No samples.
Every cue time comes from src/words.json so it lines up with the edit.
Usage: python3 scripts/audio.py cache/demucs/htdemucs/orig/vocals.wav public/mix.wav"""
import json, subprocess, sys, wave, os, numpy as np
from scipy.signal import butter, lfilter

SR = 48000
DUR = 55.5
N = int(DUR * SR)
rng = np.random.default_rng(7)
words = json.load(open("src/words.json"))
cl = lambda w: "".join(ch for ch in w.lower() if ch.isalnum() or ch == "'")
def at(w, nth=1, end=False):
    k = 0
    for x in words:
        if cl(x["w"]) == w:
            k += 1
            if k == nth:
                return x["e"] if end else x["s"]
    raise KeyError(w)

src, dst = sys.argv[1], sys.argv[2]
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-vn", "-ac", "1", "-ar", str(SR), "-af",
                      "highpass=f=85,equalizer=f=280:t=q:w=1.2:g=-2.5,equalizer=f=3800:t=q:w=1.0:g=2.5,"
                      "acompressor=threshold=-24dB:ratio=3:attack=5:release=80:makeup=3,"
                      "agate=threshold=0.012:ratio=2:attack=5:release=120",
                      "-f", "f32le", "-"], capture_output=True, check=True).stdout
voice = np.frombuffer(raw, np.float32).astype(np.float64)[:N]
voice = np.pad(voice, (0, N - len(voice)))

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
    _b, _l = butter, lfilter
    bb, aa = _b(2, 900 / (SR / 2)); x = _l(bb, aa, x)
    a = np.minimum(1, t / 0.08) * np.exp(-t / 1.1)
    return x / (np.abs(x).max() + 1e-9) * a

fx = np.zeros(N)
def put(sig, t, gain_db):
    i = int(t * SR)
    if i >= N: return
    seg = sig[: N - i] * 10 ** (gain_db / 20)
    fx[max(0, i): i + len(seg)] += seg[max(0, -i):] if i < 0 else seg
def smooth(x, w):  # moving average via cumsum (np.convolve is O(N*w))
    c = np.concatenate([[0], np.cumsum(np.pad(x, (w // 2, w - w // 2)))])
    return (c[w:] - c[:-w])[: len(x)] / w
def beep(d=0.09, f=2093):
    n = int(d * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * f * t) * np.minimum(1, t / 0.004) * np.minimum(1, (d - t) / 0.01)
def chime(f=1760, d=1.6):
    n = int(d * SR); t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * h * t) * np.exp(-t / (0.5 / h)) * g for h, g in ((1, 1), (2.76, 0.35), (5.4, 0.15)))
    return x * np.minimum(1, t / 0.002)


def crack(d=0.5):
    n = int(d * SR); t = np.arange(n) / SR
    x = band(n, 300, 9000) * (rng.random(n) > 0.85) * np.exp(-t / 0.09)
    return x + 0.6 * np.sin(2 * np.pi * (90 + 200 * np.exp(-t / 0.01)) * t) * np.exp(-t / 0.08)
def heartbeat():
    n = int(0.9 * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for o, g in ((0, 1), (0.24, 0.7)):
        s = int(o * SR); tt = t[: n - s]
        x[s:] += g * np.sin(2 * np.pi * (48 + 40 * np.exp(-tt / 0.02)) * tt) * np.exp(-tt / 0.09)
    return x

T = dict(destroy=at("destroy"), barakah=at("barakah"), rizq=at("rizq"), s1=at("the", 1), buyer=at("buyer"), seller=at("seller"),
         trustful=at("trustful"), transparent=at("transparent"), transaction=at("transaction"), blessed=at("blessed"),
         s2=at("allah", 1), weDo=at("we", 1), q2end=at("you", 2, True), yourBusiness=at("your", 2), means=at("means"),
         provider=at("allah", 2), providerWord=at("provider"), s3=at("and", 4), letNot=at("let"), q3end=at("allah", 4, True),
         notHaving=at("and", 5), having=at("having"), disclaimer=at("wantto"), problem2=at("the", 6), heart=at("heart", 1),
         dunya=at("have"), hands=at("hands"), but=at("but"), heart2=at("heart", 2), cta=52.15)
CARD_IN = 0.32
cards = [T["s1"] - CARD_IN, T["s2"] - CARD_IN, T["s3"] - CARD_IN]

# hook: 3 SINS slams in, "destroy" cracks it
put(boom(2.4), 0.02, -6); put(braam(2.0), 0.02, -14); put(whoosh(0.4), 0.0, -18)
put(crack(), T["destroy"] - 0.01, -9); put(thud(0.6), T["destroy"], -12)
# sin cards: seam opens (whoosh + boom), numeral stamps, fold up
for i, c in enumerate(cards):
    put(riser(0.9) * 0.7, c - 0.85, -22); put(whoosh(0.5), c - 0.2, -13); put(boom(1.6), c + 0.12, -11)
    put(stamp(), c + 0.15, -14); put(chime(587.3 * 2 ** (i * 3 / 12), 1.8), c + 0.3, -20)
    put(whoosh(0.45, up=False), c + CARD_IN + 0.9, -17)
# sin 1: chips, the deal line, "blessed"
for k in ("buyer", "seller"):
    put(pop(0.12, 950), T[k] - 0.02, -14); put(whoosh(0.25), T[k] - 0.15, -22)
for k, f in (("trustful", 1300), ("transparent", 1500)):
    put(pop(0.1, f), T[k] - 0.01, -15); put(tick(), T[k] + 0.02, -17)
put(paper(0.5), T["seller"] + 0.1, -24)
put(swell(0.7), T["blessed"] - 0.7, -16); put(shimmer(1.8), T["blessed"], -14); put(chime(1760, 2.2), T["blessed"] + 0.02, -18)
# sin 2: quote card, means, the Provider
put(whoosh(0.5), T["weDo"] - 0.35, -18); put(shimmer(1.0), T["weDo"] - 0.1, -24)
put(pop(0.12, 900), T["yourBusiness"] - 0.03, -15); put(whoosh(0.3), T["means"] - 0.2, -20); put(pop(0.1, 1350), T["means"], -15)
put(swell(0.9), T["provider"] - 0.9, -14); put(boom(2.0), T["provider"] - 0.03, -12); put(shimmer(2.0), T["provider"], -15)
put(chime(1174.7, 2.4), T["providerWord"], -19)
# sin 3: quote card, wealth chip, disclaimer stamp, heart
put(whoosh(0.5), T["letNot"] - 0.35, -18); put(shimmer(1.0), T["letNot"] - 0.1, -24)
put(pop(0.12, 900), T["notHaving"] + 0.38, -15); put(stamp(), T["having"] - 0.03, -16)
put(whoosh(0.2), T["disclaimer"] - 0.12, -16); put(stamp(), T["disclaimer"] + 0.05, -8)
put(paper(0.8), T["problem2"] + 0.2, -24)
put(heartbeat(), T["heart"] - 0.05, -9); put(heartbeat(), T["heart"] + 0.8, -13)
# finale: window drops, lockup lands line by line, flare on the last "heart"
put(whoosh(0.6, up=False), T["dunya"] - 0.4, -14); put(thud(), T["dunya"] - 0.05, -14)
put(pop(0.1, 1100), T["hands"] - 0.15, -16); put(thud(0.6), T["hands"] - 0.12, -16)
put(riser(T["heart2"] - T["but"]) * 0.8, T["but"], -20)
put(boom(2.4), T["heart2"] - 0.05, -9); put(braam(2.2), T["heart2"] - 0.05, -15); put(heartbeat(), T["heart2"] + 0.05, -10)
put(shimmer(2.0), T["heart2"], -15)
# end card
put(whoosh(0.6), T["cta"] - 0.2, -16); put(shimmer(2.0), T["cta"] + 0.4, -15); put(pop(0.12, 1200), T["cta"] + 0.5, -14)
put(chime(1760, 2.6), T["cta"] + 0.55, -18); put(pop(0.1, 1500), T["cta"] + 1.2, -18)

# ---- score: D Hijaz, 84 BPM ----
bpm = 84; beat = 60 / bpm; bar = 4 * beat
t = np.arange(N) / SR
mtof = lambda m: 440 * 2 ** ((m - 69) / 12)
# chord per 2 bars: D (D F# A) · Gm (G Bb D) · Cm (C Eb G) · D (D F# A, Eb passing in the oud)
chords = [[50, 54, 57], [43, 50, 55, 58], [48, 51, 55], [50, 54, 57]]
pad = np.zeros(N)
for ci in range(int(DUR / (2 * bar)) + 1):
    notes = chords[ci % 4]; s = ci * 2 * bar
    i0, i1 = int(s * SR), min(N, int((s + 2 * bar + 1.0) * SR))
    if i0 >= N: break
    tt = t[i0:i1] - s
    a = np.minimum(1, tt / 1.0) * np.minimum(1, np.maximum(0, (2 * bar + 1.0 - tt) / 1.0))
    for m in notes:
        f = mtof(m + 12)
        for det in (-0.12, 0.12):
            pad[i0:i1] += a * (np.sin(2 * np.pi * f * (1 + det / 100) * tt) + 0.2 * np.sin(4 * np.pi * f * tt)) * 0.04
drone = (np.sin(2 * np.pi * mtof(38) * t) * 0.18 + np.sin(2 * np.pi * mtof(45) * t) * 0.08) * (0.85 + 0.15 * np.sin(2 * np.pi * t / 6.1))
b_, a_ = butter(2, 1800 / (SR / 2)); pad = lfilter(b_, a_, pad + drone)

def pluck(f, d=1.4, bright=0.5):
    """Karplus-Strong string: a short, woody oud-like pluck."""
    n = int(d * SR); p = max(2, int(SR / f)); buf = rng.uniform(-1, 1, p)
    b2, a2 = butter(1, (2000 + 6000 * bright) / (SR / 2)); buf = lfilter(b2, a2, buf)
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * 0.996
    return out * np.minimum(1, np.arange(n) / (0.002 * SR))
hijaz = [62, 63, 66, 67, 69, 70, 72, 74]  # D Eb F# G A Bb C D
plucks = {}
oud = np.zeros(N)
# a phrase per two bars: motif in eighths, resting on the chord tone
motif = [0, 1, 2, None, 1, 0, None, None, 4, 3, 2, 1, 2, None, None, None]
for i in range(int(DUR / (beat / 2))):
    tb = i * beat / 2
    deg = motif[i % 16]
    if deg is None: continue
    bi = int(tb // (2 * bar))
    m = hijaz[(deg + [0, 3, 0, 4][bi % 4]) % 8]
    if m not in plucks: plucks[m] = pluck(mtof(m))
    pl = plucks[m]; j = int(tb * SR)
    if j >= N: continue
    seg = pl[: N - j]; oud[j: j + len(seg)] += seg * (0.11 if i % 2 == 0 else 0.075)
# frame drum (maqsum-ish: D T . T D . T .) from the first card on
drum = np.zeros(N)
dn = int(0.5 * SR); dtt = np.arange(dn) / SR
dum = np.sin(2 * np.pi * (62 + 50 * np.exp(-dtt / 0.02)) * dtt) * np.exp(-dtt / 0.18)
tek = band(int(0.08 * SR), 1800, 9000) * env(int(0.08 * SR), 0.0005, 0.018)
pattern = ["D", "T", None, "T", "D", None, "T", None]
def quiet(tb):
    return any(c - 0.9 < tb < c + CARD_IN + 0.5 for c in cards) or tb < cards[0] + 1.0 or (T["dunya"] - 1.0 < tb < T["dunya"]) or tb > T["cta"] + 2.6
for i in range(int(DUR / (beat / 2))):
    tb = i * beat / 2
    hit = pattern[i % 8]
    if hit is None or quiet(tb): continue
    j = int(tb * SR); s_ = dum if hit == "D" else tek
    seg = s_[: N - j]; drum[j: j + len(seg)] += seg * (0.55 if hit == "D" else 0.16)
# ney-like breathy lead on the big moments (a held note with vibrato and breath noise)
ney = np.zeros(N)
def ney_note(m, s, d, g=0.07):
    i0, i1 = int(s * SR), min(N, int((s + d) * SR)); tt = t[i0:i1] - s
    f = mtof(m) * (1 + 0.006 * np.sin(2 * np.pi * 5.2 * tt) * np.minimum(1, tt / 0.6))
    ph = 2 * np.pi * np.cumsum(f) / SR
    a = np.minimum(1, tt / 0.25) * np.minimum(1, (d - tt) / 0.5)
    ney[i0:i1] += g * a * (np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.12 * band(i1 - i0, 400, 3000))
ney_note(75, T["blessed"] - 0.1, 1.2); ney_note(74, T["blessed"] + 1.0, 1.6)
ney_note(78, T["provider"], 2.0); ney_note(74, T["heart2"], 3.0); ney_note(69, T["cta"] + 0.5, 2.8)

music = pad * 1.0 + oud + drum + ney
gain = np.ones(N)
def ramp(t0, t1, g0, g1):
    i0, i1 = int(t0 * SR), min(N, int(t1 * SR)); gain[i0:i1] = np.linspace(g0, g1, i1 - i0)
ramp(0, 0.4, 0.4, 1)
for c in cards:  # cards: music dips under the boom, then swells
    ramp(c - 0.1, c + 0.15, 1, 0.5); ramp(c + 0.15, c + 0.9, 0.5, 1)
ramp(T["dunya"] - 1.0, T["dunya"] - 0.35, 1, 0.35); ramp(T["dunya"] - 0.35, T["dunya"] + 0.4, 0.35, 1.15); gain[int((T["dunya"] + 0.4) * SR):] = 1.15
ramp(T["cta"], T["cta"] + 0.6, 1.15, 1.6); gain[int((T["cta"] + 0.6) * SR):] = 1.6
ramp(DUR - 1.2, DUR, 1.6, 0)
music *= gain
venv = smooth(np.abs(voice), int(0.08 * SR))
duck = 1 - 0.5 * np.clip(venv / (np.percentile(venv, 90) + 1e-9), 0, 1)
vref = np.percentile(np.abs(voice), 99.5)
mono = voice + vref * (0.3 * music * duck + 0.85 * fx)
st = np.stack([mono, mono], 1)
d = int(0.012 * SR)  # a little width on music and fx
side = vref * (0.06 * np.roll(music, d) + 0.05 * np.roll(fx, d // 2))
st[:, 0] += side; st[:, 1] -= side
st /= np.abs(st).max() + 1e-9
tmp = dst + ".pre.wav"
with wave.open(tmp, "w") as wf:
    wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(SR)
    wf.writeframes((st * 0.8 * 32767).astype(np.int16).tobytes())
meas = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", tmp, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
js = json.loads(meas[meas.rindex("{"): meas.rindex("}") + 1])
af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}:"
      f"measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true,alimiter=limit=0.84:level=disabled")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-af", af, "-ar", str(SR), dst], check=True)
os.remove(tmp)
print("mix →", dst)
