"""Sound design + mix → public/mix.wav (48 kHz stereo, -14 LUFS, -1.5 dBTP).
Voice: the reel's own audio (HPF + light compression). Music: a synthesized warm pad + soft pulse
(no licensing). SFX: synthesized whooshes, pops, ticks, risers, booms, shutter, stamp, typing.
Every cue time comes from plan/words.json so it lines up with the edit.
Usage: python3 scripts/audio.py cache/raw.mp4 public/mix.wav"""
import json, subprocess, sys, numpy as np

SR = 48000
DUR = 37.0
N = int(DUR * SR)
rng = np.random.default_rng(11)
words = json.load(open("plan/words.json"))
cl = lambda w: "".join(ch for ch in w.lower() if ch.isalnum() or ch == "'")
def at(w, nth=1):
    k = 0
    for x in words:
        if cl(x["w"]) == w:
            k += 1
            if k == nth:
                return x["s"]
    raise KeyError(w)

src, dst = sys.argv[1], sys.argv[2]
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-vn", "-ac", "1", "-ar", str(SR),
                      "-af", "highpass=f=80,acompressor=threshold=-22dB:ratio=2.5:attack=6:release=90:makeup=2",
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
    from scipy.signal import butter as _b, lfilter as _l
    bb, aa = _b(2, 900 / (SR / 2)); x = _l(bb, aa, x)
    a = np.minimum(1, t / 0.08) * np.exp(-t / 1.1)
    return x / (np.abs(x).max() + 1e-9) * a

fx = np.zeros(N)
def put(sig, t, gain_db):
    i = int(t * SR)
    if i >= N: return
    seg = sig[: N - i] * 10 ** (gain_db / 20)
    fx[max(0, i): i + len(seg)] += seg[max(0, -i):] if i < 0 else seg

T = dict(five=at("five"), listIn=2.36, time=5.45, identity=9.35, collageIn=11.05, collageOut=13.6, money=13.62,
         energy=17.95, reputation=22.75, proof=27.75, cta=32.2)
# hook: five chips
for k in range(5): put(pop(f=700 + k * 90), T["five"] + k * 0.06, -16)
put(whoosh(0.45), T["listIn"] - 0.2, -18)
for k, w in enumerate(["time", "identity", "money", "energy", "reputation"]):
    put(pop(f=880 + k * 110), at(w) - 0.1, -14)
# section changes: whoosh + soft shimmer
for s in ["time", "identity", "money", "energy", "reputation"]:
    put(whoosh(0.55), T[s] - 0.3, -15)
put(shimmer(), T["time"], -24)
put(whoosh(0.3), at("speed") - 0.08, -14)  # clock whip
for k in range(10): put(tick(), at("speed") + k * 0.07, -22 - k)
put(whoosh(0.4, up=False), at("shortcut") - 0.05, -18)
for k in range(5): put(tick(lo=2000), at("identity", 2) + k * 0.32, -22)
# collage: paper in, stop-motion word slaps, YES stamp, paper out
put(paper(0.4), T["collageIn"] - 0.05, -10)
for w, n_ in [("who", 1), ("they", 4), ("get", 1), ("to", 2), ("be", 1), ("once", 1)]:
    put(paper(0.12), at(w, n_) - 0.04, -12); put(pop(0.08, 400), at(w, n_) - 0.02, -16)
put(stamp(), at("yes") - 0.01, -6)
put(paper(0.45), T["collageOut"] - 0.12, -11)
# money: line draw + savings drop
put(riser(1.6) * 0.6, at("money", 2) - 0.05, -22)
put(pop(f=1200), at("return"), -16)
put(whoosh(0.5, up=False), at("cost") - 0.05, -18)
# energy: charge up on relief, notification pings, blow-away
put(riser(0.7), at("relief") - 0.05, -20); put(shimmer(0.8), at("relief") + 0.6, -20)
for k in range(6): put(pop(0.1, 1500 + 120 * (k % 3)), at("pulling") - 0.55 + k * 0.17, -15)
put(whoosh(0.7), at("away") - 0.15, -10)
# reputation: stars, shutter on look, peers pops
for k in range(5): put(pop(0.1, 1300 + k * 140), at("reputation", 2) + 0.15 + k * 0.1, -18)
put(shutter(), at("look"), -10)
for k in range(6): put(pop(0.09, 900 + k * 60), at("front") + k * 0.06, -20)
# proof: riser → boom on "million", counter ticks, coin chimes
put(whoosh(0.5), T["proof"] - 0.3, -16)
put(riser(1.0), at("23") - 1.0 + 0.35, -14)
for k in range(14): put(tick(), at("23") - 0.25 + k * 0.035 * (1 + k * 0.08), -20)
put(boom(), at("million") + 0.1, -5)
for k in range(5): put(pop(0.14, 1800 + k * 200), at("five", 2) + k * 0.08, -18)
put(shimmer(1.4), at("five", 2) + 0.4, -20)
# v2 depth beats: swell + thud on the hook's giant 5 and on every currency title / CTA word
put(swell(0.6), T["five"] - 0.6, -18)
put(boom(1.6), T["five"], -9)
put(shimmer(1.0), T["five"] + 0.1, -22)
for s_ in ["time", "identity", "money", "energy", "reputation"]:
    put(thud(), T[s_] - 0.02, -13)
put(braam(), T["proof"] - 0.02, -15)
put(thud(), T["cta"] - 0.02, -14)
# CTA
put(whoosh(0.5), T["cta"] - 0.2, -16)
for k in range(5): put(tick(0.05, 1800), at("coach") - 0.02 + k * 0.055, -14)
put(pop(0.1, 600), at("below") + 0.12, -12)
put(whoosh(0.4), at("below") + 0.25, -20)
put(pop(0.12, 1400), at("send") - 0.05, -16)

# music: warm pad (Am9 – Fmaj7 – C6/9 – G6, 2 bars each at 88 BPM) + soft kick/hat pulse
bpm = 88; beat = 60 / bpm
t = np.arange(N) / SR
chords = [[57, 60, 64, 67, 71], [53, 57, 60, 64, 69], [48, 55, 60, 62, 64], [55, 59, 62, 64, 67]]
mtof = lambda m: 440 * 2 ** ((m - 69) / 12)
pad = np.zeros(N)
bar = 4 * beat
for ci in range(int(DUR / (2 * bar)) + 1):
    notes = chords[ci % 4]; s = ci * 2 * bar; e = s + 2 * bar
    i0, i1 = int(s * SR), min(N, int((e + 0.6) * SR))
    if i0 >= N: break
    tt = t[i0:i1] - s
    a = np.minimum(1, tt / 0.6) * np.minimum(1, np.maximum(0, (2 * bar + 0.6 - tt) / 0.6))
    for m in notes:
        f = mtof(m)
        for det in (-0.12, 0.12):
            pad[i0:i1] += a * (np.sin(2 * np.pi * f * (1 + det / 100) * tt) + 0.3 * np.sin(2 * np.pi * 2 * f * tt)) * 0.06
    pad[i0:i1] += a * np.sin(2 * np.pi * mtof(notes[0] - 24) * tt) * 0.18
# soften the pad (one-pole low-pass)
from scipy.signal import lfilter, butter
b, a_ = butter(2, 1800 / (SR / 2)); pad = lfilter(b, a_, pad)
pulse = np.zeros(N)
k_n = int(0.4 * SR); kt = np.arange(k_n) / SR
kick = np.sin(2 * np.pi * (48 + 90 * np.exp(-kt / 0.03)) * kt) * np.exp(-kt / 0.18)
for i in range(int(DUR / beat)):
    tb = i * beat
    if tb < 0.0 or (T["collageIn"] < tb < T["collageOut"]): continue
    put_at = int(tb * SR); seg = kick[: N - put_at]; pulse[put_at: put_at + len(seg)] += seg * (0.5 if i % 2 == 0 else 0.25)
    h = tick(0.05, 6000); hi_ = int((tb + beat / 2) * SR)
    if hi_ < N: seg = h[: N - hi_]; pulse[hi_: hi_ + len(seg)] += seg * 0.08
# plucked arpeggio (eighths) with a dotted-eighth echo: movement under the voice
arp = np.zeros(N)
pl_n = int(0.6 * SR); pt = np.arange(pl_n) / SR
for i in range(int(DUR / (beat / 2))):
    tb = i * beat / 2
    if T["collageIn"] < tb < T["collageOut"]: continue
    ci = int(tb // (2 * bar)) % 4
    notes = chords[ci]
    m = notes[[0, 2, 4, 3, 1, 2, 4, 3][i % 8]] + 12
    f = mtof(m)
    pl = (np.sin(2 * np.pi * f * pt) + 0.25 * np.sin(4 * np.pi * f * pt)) * np.exp(-pt / 0.16)
    for dly, g in ((0.0, 1.0), (0.75 * beat, 0.35), (1.5 * beat, 0.12)):
        j = int((tb + dly) * SR)
        if j >= N: continue
        seg = pl[: N - j]; arp[j: j + len(seg)] += seg * g * 0.05
music = pad + pulse + arp
# music drops out for the YES stamp and swells after the boom; tail fade
gain = np.ones(N)
def ramp(t0, t1, g0, g1):
    i0, i1 = int(t0 * SR), int(t1 * SR); gain[i0:i1] = np.linspace(g0, g1, i1 - i0)
ramp(at("yes") - 0.4, at("yes") - 0.05, 1, 0.15); gain[int((at("yes") - 0.05) * SR): int((T["collageOut"]) * SR)] = 0.15
ramp(T["collageOut"], T["collageOut"] + 0.5, 0.15, 1)
ramp(at("23") - 1.0, at("million") + 0.05, 1, 0.3); ramp(at("million") + 0.1, at("million") + 0.8, 1.6, 1)
ramp(0, 0.4, 0, 1); ramp(DUR - 1.2, DUR, 1, 0)
music *= gain
# sidechain duck under the voice
venv = np.abs(voice); w = int(0.08 * SR)
venv = np.convolve(venv, np.ones(w) / w, mode="same")
duck = 1 - 0.55 * np.clip(venv / (np.percentile(venv, 90) + 1e-9), 0, 1)

vref = np.percentile(np.abs(voice), 99.5)
mix_l = voice + vref * (0.22 * music * duck + 0.9 * fx)
st = np.stack([mix_l, mix_l], 1)
# tiny stereo width on music/fx
st[:, 0] += vref * 0.03 * np.roll(music, 240); st[:, 1] -= vref * 0.03 * np.roll(music, 240)
st /= np.abs(st).max() + 1e-9
tmp = dst + ".pre.wav"
import wave
with wave.open(tmp, "w") as wf:
    wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(SR)
    wf.writeframes((st * 0.8 * 32767).astype(np.int16).tobytes())
meas = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", tmp, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
js = json.loads(meas[meas.rindex("{"): meas.rindex("}") + 1])
af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}:"
      f"measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true,alimiter=limit=0.84:level=disabled")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-af", af, "-ar", str(SR), dst], check=True)
import os; os.remove(tmp)
print("mix →", dst)
