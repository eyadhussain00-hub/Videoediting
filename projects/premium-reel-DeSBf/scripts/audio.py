"""Sound design + mix → public/mix.wav (48 kHz stereo, -14 LUFS, -1.5 dBTP).
Voice: Demucs (htdemucs) vocal stem of the reel — its own music bed is dropped — HPF, light compression, presence.
Music: an original synthesized cinematic score (no licensing): Dm9 – Bbmaj7 – F6/9 – C6 at 84 BPM, building by chapter,
dropping to a drone on "Listen," and resolving on "Let it be you."
SFX: synthesized whooshes, pops, ticks, thuds, booms, shimmer, stamp, shatter. All cue times come from plan/words.json.
Usage: python3 scripts/audio.py cache/demucs/htdemucs/orig/vocals.wav public/mix.wav"""
import json, subprocess, sys, numpy as np
from scipy.signal import butter, lfilter

SR = 48000
DUR = 91.375
N = int(DUR * SR)
rng = np.random.default_rng(7)
words = json.load(open("plan/words.json"))
cl = lambda w: "".join(ch for ch in w.lower() if ch.isalnum() or ch == "'")
def at(w, nth=1):
    k = 0
    for x in words:
        if cl(x["w"]) == w:
            k += 1
            if k == nth: return x["s"]
    raise KeyError(w)

exec(open("scripts/_gens.py").read())  # band, env, whoosh, pop, tick, boom, riser, shutter, stamp, paper, shimmer, thud, swell, braam

def shatter(d=1.6):
    n = int(d * SR); t = np.arange(n) / SR
    burst = band(n, 2000, 14000) * env(n, 0.0005, 0.06)
    out = burst * 0.9
    for i in range(26):  # glassy tinkles
        s = int(rng.uniform(0.0, 0.9) * SR); f = rng.uniform(2500, 7000); tt = t[: n - s]
        out[s:] += np.sin(2 * np.pi * f * tt) * np.exp(-tt / rng.uniform(0.04, 0.12)) * rng.uniform(0.1, 0.3)
    return out
def deflate(d=1.1):
    n = int(d * SR); t = np.arange(n) / SR; k = t / d
    return np.sin(2 * np.pi * (520 * np.exp(-k * 2.2)) * t) * (1 - k) ** 1.5 * 0.5 + band(n, 300, 2000) * (1 - k) * 0.15

src, dst = sys.argv[1], sys.argv[2]
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-vn", "-ac", "1", "-ar", str(SR),
                      "-af", "highpass=f=75,equalizer=f=3200:t=q:w=1.2:g=2,acompressor=threshold=-22dB:ratio=2.6:attack=6:release=90:makeup=2",
                      "-f", "f32le", "-"], capture_output=True, check=True).stdout
voice = np.frombuffer(raw, np.float32).astype(np.float64)[:N]
voice = np.pad(voice, (0, N - len(voice)))

fx = np.zeros(N)
def put(sig, t, gain_db):
    i = int(t * SR)
    if i >= N: return
    if i < 0: sig, i = sig[-i:], 0
    seg = sig[: N - i] * 10 ** (gain_db / 20)
    fx[i: i + len(seg)] += seg

CH = [6.5, 28.95, 61.55]
# open
put(swell(1.0), -0.2, -20); put(whoosh(0.6), 0.0, -20)
# hook
put(swell(0.6), at("first") - 0.6, -18); put(thud(), at("first") - 0.02, -11); put(shimmer(), at("first") + 0.05, -22)
s = at("millionaire") - 0.1
for k in range(22): put(tick(), s + 0.1 + 1.5 * (k / 22) ** 0.8, -24 + (k % 3))
put(pop(0.14, 1800), s + 1.62, -16); put(shimmer(0.9), s + 1.62, -20)
for k in range(3): put(pop(f=700 + k * 140), at("three") - 0.05 + k * 0.14, -14)
# chapters: riser → boom + whoosh + shimmer
for c in CH:
    put(riser(1.2), c - 1.2, -19); put(boom(1.8), c - 0.02, -10); put(whoosh(0.6), c - 0.25, -16); put(shimmer(1.0), c + 0.2, -23)
    for k in range(len("leverage")): put(tick(0.04, 2500), c + k * 0.045, -26)
# chapter 1
put(thud(), at("wrong") - 0.02, -13)
for w, f in (("follow", 420), ("copy", 380)):
    put(whoosh(0.35), at(w) - 0.3, -20); put(pop(0.12, f), at(w) + 0.12, -14)
put(whoosh(0.35), at("respect") - 0.3, -20); put(pop(0.14, 1300), at("respect") + 0.12, -15); put(shimmer(0.8), at("respect") + 0.15, -21)
put(paper(0.4), at("playbook") - 0.25, -12); put(thud(), at("survival") - 0.02, -14)
put(whoosh(0.5, up=False), at("different") - 0.3, -17); put(stamp() * 0.4, at("different") + 0.3, -18)
put(swell(0.6), at("wealth") - 0.6, -17); put(boom(1.4), at("wealth") - 0.02, -14); put(shimmer(1.2), at("wealth"), -18)
# chapter 2
put(thud(), at("not") - 0.02, -12); put(thud(), at("rich", 2) - 0.02, -14)
put(whoosh(0.7), 34.6, -17)
s = at("farmer") - 0.2
for k in range(int((at("12") - s) / 0.18)): put(tick(0.04, 1800), s + 0.3 + k * 0.18, -24)
put(pop(0.14, 1500), at("12"), -14); put(shimmer(0.9), at("12") + 0.05, -21)
put(thud(), at("real") - 0.02, -17); put(thud(), at("painful") - 0.02, -14)
put(deflate(), at("barely"), -14)
put(whoosh(0.5), at("strategy") - 0.35, -15); put(thud(), at("strategy") - 0.02, -15)
put(pop(0.12, 900), at("leverage") - 0.5, -18); put(whoosh(0.5), at("leverage") - 0.3, -16); put(thud(), at("leverage") - 0.02, -14)
for k in range(2): put(tick(0.05, 1500), at("where") - 0.05 + k * 0.09, -12)
put(pop(0.12, 1000), at("where") + 0.25, -16)
put(whoosh(0.5), at("leverage", 2) - 0.3, -18); put(riser(1.1) * 0.7, at("effort", 2) - 0.05, -22)
s = at("hundred") - 0.45
for k in range(18): put(tick(), s + 1.0 * (k / 18) ** 0.7, -22)
put(boom(2.0), s + 1.0, -9); put(shimmer(1.2), s + 1.0, -19)
# chapter 3
put(swell(0.5), at("attention") - 0.5, -20); put(thud(), at("attention") - 0.02, -15)
put(whoosh(0.5), at("best") - 0.45, -17); put(pop(0.12, 1200), at("best"), -16)
for k in range(5): put(pop(0.08, 1400 + k * 120), at("best") + 0.05 + k * 0.13, -21)
put(tick(0.05, 900), at("zero") + 0.05, -14)
put(stamp(), at("lose") - 0.01, -9)
put(pop(0.12, 1000), at("average") - 0.1, -16)
put(riser(1.0) * 0.8, at("lots") - 0.1, -20)
put(pop(0.14, 1700), at("attention", 3) + 0.02, -14); put(shimmer(1.1), at("attention", 3) + 0.05, -18)
put(whoosh(0.5), at("speak") - 0.8, -18)
for k, w in enumerate(("speak", "write", "seen")): put(pop(0.12, 900 + k * 260), at(w) - 0.1, -13); put(whoosh(0.35), at(w) - 0.35, -21)
# close
put(whoosh(0.8, up=False), at("listen") - 0.2, -14); put(thud(1.2), at("listen") - 0.02, -15)
put(swell(2.2) * 0.8, at("break") - 2.2, -17)
put(boom(2.4), at("break") + 0.04, -7); put(shatter(), at("break") + 0.04, -12)
put(swell(0.8), at("you", 7) - 0.8, -16); put(braam(), at("you", 7) - 0.02, -13); put(boom(2.2), at("you", 7) - 0.02, -11); put(shimmer(1.6), at("you", 7) + 0.1, -16)

# ---------------- score ----------------
bpm = 84; beat = 60 / bpm; bar = 4 * beat
t = np.arange(N) / SR
mtof = lambda m: 440 * 2 ** ((m - 69) / 12)
chords = [[50, 53, 57, 60, 64], [46, 50, 53, 57, 62], [53, 57, 60, 62, 67], [48, 52, 55, 57, 62]]  # Dm9 Bbmaj7 F6/9 C6/9
LISTEN, BREAK, YOU = at("listen"), at("break"), at("you", 7)
def chord_at(tb):
    if tb >= YOU - 0.05: return [50, 57, 60, 64, 69]  # resolve: Dm(add9) open
    return chords[int(tb // (2 * bar)) % 4]
pad = np.zeros(N)
for ci in range(int(DUR / (2 * bar)) + 2):
    st = ci * 2 * bar; en = st + 2 * bar
    i0, i1 = int(st * SR), min(N, int((en + 0.8) * SR))
    if i0 >= N: break
    tt = t[i0:i1] - st
    a = np.minimum(1, tt / 0.8) * np.minimum(1, np.maximum(0, (2 * bar + 0.8 - tt) / 0.8))
    for m in chord_at(st):
        f = mtof(m)
        for det in (-0.13, 0.13):
            pad[i0:i1] += a * (np.sin(2 * np.pi * f * (1 + det / 100) * tt) + 0.3 * np.sin(2 * np.pi * 2 * f * tt)) * 0.055
    pad[i0:i1] += a * np.sin(2 * np.pi * mtof(chord_at(st)[0] - 24) * tt) * 0.2
b_, a_ = butter(2, 1700 / (SR / 2)); pad = lfilter(b_, a_, pad)
# final resolve chord: long swell after "you"
i0 = int((YOU - 0.02) * SR); tt = t[i0:] - (YOU - 0.02)
for m in [38, 50, 57, 62, 64, 69, 74]:
    pad[i0:] += np.sin(2 * np.pi * mtof(m) * tt) * np.minimum(1, tt / 0.3) * np.exp(-tt / 2.4) * 0.07

def sec(tb):  # 0 intro, 1..3 chapters, 4 listen-drone, 5 end
    if tb < CH[0]: return 0
    if tb < CH[1]: return 1
    if tb < CH[2]: return 2
    if tb < LISTEN: return 3
    if tb < YOU: return 4
    return 5
pulse = np.zeros(N); arp = np.zeros(N)
kn = int(0.4 * SR); kt = np.arange(kn) / SR
kick = np.sin(2 * np.pi * (48 + 90 * np.exp(-kt / 0.03)) * kt) * np.exp(-kt / 0.18)
def add(dstarr, sig, tsec, g):
    j = int(tsec * SR)
    if 0 <= j < N:
        seg = sig[: N - j]; dstarr[j: j + len(seg)] += seg * g
for i in range(int(DUR / beat) + 1):
    tb = i * beat; s_ = sec(tb)
    if s_ in (0, 4, 5): continue
    if s_ >= 1: add(pulse, kick, tb, 0.5 if i % 4 == 0 else (0.28 if i % 2 == 0 else 0.0))
    if s_ >= 2: add(pulse, tick(0.05, 6000), tb + beat / 2, 0.09)
    if s_ >= 3: add(pulse, tick(0.03, 8000), tb + beat / 4, 0.04); add(pulse, tick(0.03, 8000), tb + 3 * beat / 4, 0.04)
pl_n = int(0.7 * SR); pt = np.arange(pl_n) / SR
for i in range(int(DUR / (beat / 2)) + 1):
    tb = i * beat / 2; s_ = sec(tb)
    if s_ in (4, 5) or (s_ == 0 and tb < 2.0): continue
    notes = chord_at(tb)
    m = notes[[0, 2, 4, 3, 1, 2, 4, 3][i % 8]] + 12
    f = mtof(m)
    pl = (np.sin(2 * np.pi * f * pt) + 0.25 * np.sin(4 * np.pi * f * pt)) * np.exp(-pt / 0.17)
    g = {0: 0.6, 1: 0.8, 2: 1.0, 3: 1.1}[s_]
    for dly, gg in ((0.0, 1.0), (0.75 * beat, 0.35), (1.5 * beat, 0.12)):
        add(arp, pl, tb + dly, gg * 0.05 * g)
# listen section: a low drone + sparse high bell
drone = np.zeros(N); i0, i1 = int(LISTEN * SR), int(YOU * SR); tt = t[i0:i1] - LISTEN
drone[i0:i1] = (np.sin(2 * np.pi * mtof(38) * tt) * 0.25 + np.sin(2 * np.pi * mtof(45) * tt) * 0.12) * np.minimum(1, tt / 1.2)
for k, tb in enumerate([LISTEN + 0.3, LISTEN + 2.1, LISTEN + 3.9]):
    add(arp, np.sin(2 * np.pi * mtof(81 - 2 * k) * pt) * np.exp(-pt / 0.5), tb, 0.06)

music = pad * 1.0 + pulse + arp + drone
gain = np.ones(N)
def ramp(t0, t1, g0, g1):
    i0, i1 = int(t0 * SR), min(N, int(t1 * SR)); gain[i0:i1] = np.linspace(g0, g1, i1 - i0)
ramp(0, 0.6, 0, 0.8); ramp(0.6, CH[0], 0.8, 1)
ramp(at("lose") - 0.3, at("lose") - 0.02, 1, 0.3); ramp(at("lose") + 0.3, at("lose") + 1.0, 0.3, 1)
ramp(LISTEN - 0.3, LISTEN + 0.1, 1, 0.7)
ramp(BREAK + 0.05, BREAK + 0.06, 0.7, 0.35); ramp(BREAK + 0.06, YOU - 0.3, 0.35, 0.6)
ramp(YOU - 0.1, YOU + 0.1, 0.6, 1.4); ramp(DUR - 1.4, DUR, 1.4, 0)
music *= gain
# sidechain duck under the voice
venv = np.abs(voice); w = int(0.08 * SR)
venv = np.convolve(venv, np.ones(w) / w, mode="same")
duck = 1 - 0.5 * np.clip(venv / (np.percentile(venv, 90) + 1e-9), 0, 1)

vref = np.percentile(np.abs(voice), 99.5)
mono = voice + vref * (0.24 * music * duck + 0.85 * fx)
st = np.stack([mono, mono], 1)
st[:, 0] += vref * 0.035 * np.roll(music, 260); st[:, 1] -= vref * 0.035 * np.roll(music, 260)
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
