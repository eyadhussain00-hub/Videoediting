"""Sound design + mix → public/mix.wav (48 kHz stereo, -14 LUFS, -1.5 dBTP).
Voice: the reel's own audio (HPF + light compression). Music: a synthesized cold minor pad, felt-piano arpeggio, sub pulse and a wind bed
(no licensing). SFX: synthesized whooshes, pops, ticks, chimes, alarm, lock, risers, booms, braam, stamp.
Every cue time comes from src/words.json so it lines up with the edit.
Usage: python3 scripts/audio.py cache/raw.mp4 public/mix.wav"""
import json, subprocess, sys, numpy as np

SR = 48000
DUR = 69.7
N = int(DUR * SR)
rng = np.random.default_rng(23)
words = json.load(open("src/words.json"))
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

w = lambda word, n=1: at(word, n)
T = dict(next=w("for"), doIt=w("this"), s1=w("number"), noEx=w("no", 1), s2=w("after"), noScroll=w("no", 2), plan=w("plan"),
         sleep=w("sleep"), s3=w("wake"), four=w("4"), five=w("5"), tahajjud=w("tahajjud"), s4=w("pray", 3), barakah=w("barakah"),
         s5=w("you're", 2), deep=w("deep"), quran=w("qur'an"), scroll=w("scroll"), s6=w("number", 2), listIn=w("that", 2),
         workout=w("45"), corn=w("no", 3), drugs=w("no", 4), social=w("aim"), payoff=w("imagine"), ninety=w("90", 3),
         locked=w("locked"), unrec=w("unrecognisable"), brotherhood=w("brotherhood"), ihsan=w("ihsan"), hosting=w("hosting"),
         winter=w("winter"), challenge=w("challenge"), youGet=w("get"), training=w("multiple"), nutrition=w("nutrition"),
         accountability=w("accountability"), community=w("community", 2), choice=w("now"), january=w("january"),
         newYear=w("new"), nonsense=w("nonsense"), orr=w("or", 3), momentum=w("build"), cta=w("comment"), link=w("link"))
T["offer"] = T["unrec"] + 0.98

# hook: the giant 90 lands on frame one, title lockup on "for the next 90 days"
put(boom(2.4), 0.02, -7); put(chime(1318.5, 2.2), 0.05, -20); put(shimmer(1.4), 0.1, -22)
put(whoosh(0.5), T["next"] - 0.3, -15); put(chime(1760), T["next"] + 0.05, -19); put(shimmer(1.0), T["next"] + 0.2, -23)
# the six steps: whoosh + thud + chime per card
for i, s_ in enumerate(["s1", "s2", "s3", "s4", "s5", "s6"]):
    put(whoosh(0.55), T[s_] - 0.32, -15); put(thud(), T[s_] - 0.02, -13); put(chime(1046.5 * 2 ** (i * 2 / 12)), T[s_] + 0.05, -21)
put(stamp(), T["noEx"] - 0.02, -6)
for k_ in ("noScroll", "scroll"):
    put(whoosh(0.3, up=False), T[k_] - 0.1, -16); put(tick(0.06, 1500), T[k_] + 0.17, -12)
put(whoosh(0.6, up=False), T["sleep"] - 0.1, -20)
for k in range(4): put(beep(), T["four"] - 0.02 + k * 0.14 + (k // 2) * 0.12, -19)
put(tick(0.05, 1200), T["five"] - 0.05, -12)
put(shimmer(1.2), T["tahajjud"], -22)
put(riser(1.4) * 0.7, T["s4"] - 0.2, -22); put(swell(0.6), T["barakah"] - 0.6, -18); put(boom(1.8), T["barakah"], -14)
put(shimmer(1.6), T["barakah"] + 0.05, -17)
put(pop(f=900), T["deep"] - 0.05, -15); put(pop(f=1200), T["quran"] - 0.05, -15)
put(whoosh(0.5), T["listIn"] - 0.3, -16)
for k, s_ in enumerate(["workout", "corn", "drugs", "social"]):
    put(whoosh(0.25), T[s_] - 0.15, -22); put(pop(0.12, 1300 + 150 * k), T[s_] + 0.25, -13); put(tick(), T[s_] + 0.27, -17)
# payoff: counter ticks accelerate to 90, the lock clicks shut, UNRECOGNISABLE lands on a braam
t0, t1 = T["payoff"] + 0.3, T["ninety"] + 0.45; k = 0; tt = t0
while tt < t1:
    put(tick(0.03, 3500), tt, -22); k += 1; tt = t0 + (t1 - t0) * (k / 30) ** 0.8
put(chime(2093), t1, -18)
put(tick(0.05, 900), T["locked"] + 0.05, -8); put(thud(0.5), T["locked"] + 0.06, -14)
put(swell(0.7), T["unrec"] - 0.7, -14); put(braam(), T["unrec"] - 0.02, -10); put(boom(), T["unrec"], -8)
put(shimmer(1.6), T["unrec"] + 0.1, -20)
# offer
put(whoosh(0.5), T["offer"] - 0.25, -18)
put(whoosh(0.5), T["ihsan"] - 0.3, -15); put(thud(), T["ihsan"] - 0.02, -12); put(chime(1568), T["ihsan"] + 0.7, -18)
put(riser(T["challenge"] - T["hosting"]) * 0.6, T["hosting"], -24); put(boom(1.4), T["winter"] - 0.05, -14); put(shimmer(1.2), T["challenge"], -20)
put(whoosh(0.45), T["youGet"] - 0.25, -17)
for k, s_ in enumerate(["training", "nutrition", "accountability", "community"]):
    put(pop(0.12, 1000 + 140 * k), T[s_] - 0.05, -14); put(whoosh(0.25), T[s_] - 0.15, -23)
# the choice
put(whoosh(0.4), T["choice"] - 0.25, -18)
put(paper(0.3), T["january"] - 0.1, -12); put(pop(0.1, 700), T["january"], -16)
put(whoosh(0.3), T["newYear"] - 0.1, -20)
put(whoosh(0.25, up=False), T["nonsense"], -12); put(stamp(), T["nonsense"] + 0.02, -12); put(whoosh(0.5, up=False), T["nonsense"] + 0.3, -18)
for k in range(12): put(pop(0.09, 600 * 2 ** (k * 2 / 12)), T["momentum"] - 0.2 + k * 0.07, -20)
put(riser(1.2) * 0.8, T["cta"] - 1.2, -18)
# CTA
put(boom(2.0), T["cta"] - 0.02, -10); put(whoosh(0.5), T["cta"] - 0.3, -15)
for k in range(6): put(tick(0.05, 1800), T["cta"] + 0.2 + k * 0.1, -14)
put(whoosh(0.4), T["link"] - 0.2, -16); put(chime(2637), T["link"] - 0.05, -18); put(shimmer(1.6), T["link"] + 0.1, -20)

# music: cold minor progression (Dm9 – Bbmaj7 – Fmaj7/A – C6), 2 bars each at 76 BPM
bpm = 76; beat = 60 / bpm
t = np.arange(N) / SR
chords = [[50, 57, 60, 64, 65], [46, 53, 57, 60, 62], [45, 53, 57, 60, 64], [48, 55, 60, 62, 64]]
mtof = lambda m: 440 * 2 ** ((m - 69) / 12)
pad = np.zeros(N)
bar = 4 * beat
for ci in range(int(DUR / (2 * bar)) + 1):
    notes = chords[ci % 4]; s = ci * 2 * bar; e = s + 2 * bar
    i0, i1 = int(s * SR), min(N, int((e + 0.8) * SR))
    if i0 >= N: break
    tt = t[i0:i1] - s
    a = np.minimum(1, tt / 0.9) * np.minimum(1, np.maximum(0, (2 * bar + 0.8 - tt) / 0.8))
    for m in notes:
        f = mtof(m + 12)
        for det in (-0.15, 0.15):
            pad[i0:i1] += a * (np.sin(2 * np.pi * f * (1 + det / 100) * tt) + 0.25 * np.sin(2 * np.pi * 2 * f * tt)) * 0.05
    pad[i0:i1] += a * np.sin(2 * np.pi * mtof(notes[0] - 12) * tt) * 0.16
from scipy.signal import lfilter, butter
b, a_ = butter(2, 2200 / (SR / 2)); pad = lfilter(b, a_, pad)
# felt-piano arpeggio (eighths), dotted-eighth echo
arp = np.zeros(N)
pl_n = int(1.2 * SR); pt = np.arange(pl_n) / SR
for i in range(int(DUR / (beat / 2))):
    tb = i * beat / 2
    notes = chords[int(tb // (2 * bar)) % 4]
    m = notes[[1, 3, 4, 2, 3, 4, 1, 3][i % 8]] + 24
    f = mtof(m)
    pl = (np.sin(2 * np.pi * f * pt) + 0.3 * np.sin(4 * np.pi * f * pt) * np.exp(-pt / 0.08)) * np.exp(-pt / 0.45) * np.minimum(1, pt / 0.003)
    for dly, g in ((0.0, 1.0), (0.75 * beat, 0.3), (1.5 * beat, 0.1)):
        j = int((tb + dly) * SR)
        if j >= N: continue
        seg = pl[: N - j]; arp[j: j + len(seg)] += seg * g * 0.045 * (0.75 if i % 2 else 1)
# sub pulse (kick on 1 and 3) once the steps start; half-time in the payoff
pulse = np.zeros(N)
k_n = int(0.5 * SR); kt = np.arange(k_n) / SR
kick = np.sin(2 * np.pi * (44 + 80 * np.exp(-kt / 0.03)) * kt) * np.exp(-kt / 0.25)
for i in range(int(DUR / beat)):
    tb = i * beat
    if tb < T["s1"] - 0.05 or (T["payoff"] < tb < T["offer"] and i % 4) or (T["unrec"] - 0.5 < tb < T["unrec"] + 0.3): continue
    if i % 2: continue
    j = int(tb * SR); seg = kick[: N - j]; pulse[j: j + len(seg)] += seg * 0.5
    h = tick(0.05, 7000); hj = int((tb + beat) * SR)
    if hj < N: seg = h[: N - hj]; pulse[hj: hj + len(seg)] += seg * 0.06
# wind bed: slowly swelling band-passed noise (louder on the hook, the payoff and the CTA)
wind = band(N, 300, 2200) * (0.5 + 0.5 * np.sin(2 * np.pi * t / 7.3) ** 2)
wg = np.full(N, 0.25)
for a0, a1 in ((0, T["s1"]), (T["unrec"], T["offer"] + 1), (T["cta"], DUR)):
    wg[int(a0 * SR): int(a1 * SR)] = 0.6
wind *= smooth(wg, SR // 2) * 0.18
music = pad + arp + pulse + wind
gain = np.ones(N)
def ramp(t0, t1, g0, g1):
    i0, i1 = int(t0 * SR), int(t1 * SR); gain[i0:i1] = np.linspace(g0, g1, i1 - i0)
ramp(0, 0.6, 0.3, 1)
ramp(T["unrec"] - 0.6, T["unrec"] - 0.05, 1, 0.2); ramp(T["unrec"] - 0.05, T["unrec"] + 0.6, 1.5, 1)
ramp(T["nonsense"] + 0.2, T["orr"], 1, 0.45); ramp(T["orr"], T["cta"], 0.45, 1.25); gain[int(T["cta"] * SR):] = 1.25
ramp(DUR - 1.0, DUR, 1.25, 0)
music *= gain
# sidechain duck under the voice
venv = np.abs(voice); w = int(0.08 * SR)
venv = smooth(venv, w)
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
