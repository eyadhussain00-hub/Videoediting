#!/usr/bin/env python3
"""Synthesise the Plot Town teaser soundtrack (music + SFX) from plan/beats.json. No samples, no licences.
Usage: python3 scripts/audio.py <house_count>   ->  cache/audio/mix_raw.wav (48 kHz stereo, not loudness-normalised)
house_count = houses in the scene incl. the home house (render.js prints it as "houses")."""
import json, sys, wave
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
B = json.loads((ROOT / 'plan/beats.json').read_text())
SR = 48000
DUR = B['duration']
N = int(DUR * SR)
rng = np.random.default_rng(9)
HOUSES = int(sys.argv[1]) if len(sys.argv) > 1 else 3000

music = np.zeros((N, 2)); sfx = np.zeros((N, 2)); verb_send = np.zeros((N, 2))

def mf(m): return 440.0 * 2 ** ((m - 69) / 12)
def tt(d): return np.arange(int(d * SR)) / SR
def env_ad(d, a, dec):
    t = tt(d); return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t * dec)
def add(bus, t0, sig, gain=1.0, pan=0.0, send=0.0):
    i = int(t0 * SR)
    if i >= N or i + len(sig) <= 0: return
    if i < 0: sig = sig[-i:]; i = 0
    sig = sig[: N - i] * gain
    k = min(240, len(sig)); sig = sig.copy(); sig[-k:] *= np.linspace(1, 0, k)   # no end clicks
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    bus[i:i + len(sig), 0] += sig * l; bus[i:i + len(sig), 1] += sig * r
    if send: verb_send[i:i + len(sig), 0] += sig * l * send; verb_send[i:i + len(sig), 1] += sig * r * send
def onepole_lp(x, fc):
    a = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); s = 0.0
    for i, v in enumerate(x): s = (1 - a) * v + a * s; y[i] = s
    return y
def hp(x, fc): return x - onepole_lp(x, fc)
def noise(d): return rng.standard_normal(int(d * SR))

# ---------- instruments ----------
def marimba(m, d=0.6, bright=1.0):
    t = tt(d); f = mf(m)
    return (np.sin(2 * np.pi * f * t) * np.exp(-t * 7) + 0.35 * bright * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 28)
            + 0.15 * np.sin(2 * np.pi * f * 10 * t) * np.exp(-t * 60)) * np.minimum(1, t / 0.002)
def bell(m, d=1.4):
    t = tt(d); f = mf(m)
    return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 3) + 0.25 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 6)) \
        * np.exp(-t * 2.6) * np.minimum(1, t / 0.003)
def pad(ms, d, att=0.6, rel=0.8):
    t = tt(d); s = np.zeros_like(t)
    for m in ms:
        for det in (-0.08, 0.0, 0.08):
            f = mf(m + det)
            s += np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t) + 0.12 * np.sin(2 * np.pi * 3 * f * t)
    e = np.minimum(1, t / att) * np.minimum(1, (d - t) / rel)
    return s * e / (len(ms) * 3)
def kick():
    t = tt(0.45); f = 45 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.tanh(1.6 * np.sin(ph) * np.exp(-t * 7.5))
def clap():
    t = tt(0.25); n = hp(noise(0.25), 900)
    e = np.exp(-t * 22) + 0.6 * np.exp(-np.maximum(0, t - 0.012) * 40) * (t > 0.012)
    return n * e * 0.5
def hat():
    return hp(noise(0.06), 6000) * np.exp(-tt(0.06) * 70) * 0.5
def bass(m, d):
    t = tt(d); f = mf(m)
    return np.tanh(1.4 * (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t))) * np.minimum(1, t / 0.005) * np.exp(-t * 2.2) * np.minimum(1, (d - t) / 0.03)

# ---------- music ----------
BEAT = 60 / B['bpm']; BAR = 4 * BEAT
CH = {'F': [53, 57, 60, 64], 'G': [55, 59, 62, 67], 'Em': [52, 55, 59, 62], 'Am': [57, 60, 64, 67], 'C': [48, 55, 60, 64]}
ROOT_ = {'F': 41, 'G': 43, 'Em': 40, 'Am': 45, 'C': 36}
prog = ['F', 'G', 'Em', 'Am', 'F', 'G', 'Em', 'Am', 'F', 'F', 'C']   # 11 bars = 22 s
night0, title = B['nightTo'] - 0.6, B['title']
drums = lambda t: (B['rainStart'] <= t < 14.0) or (title <= t < 21.0)

for b, name in enumerate(prog):
    t0 = b * BAR; notes = CH[name]
    pv = 0.10 if t0 < 6 else (0.08 if t0 < 14 else 0.13)
    add(music, t0, pad(notes, BAR + 0.6), pv, 0, send=0.4)
    # arpeggio (marimba)
    for s in range(8):
        ts = t0 + s * BEAT / 2
        if ts < 3.0 and s % 2: continue                  # sparse while the town is empty
        if 14.0 <= ts < title and s % 2: continue        # calmer at night
        m = notes[[0, 2, 1, 3, 2, 1, 3, 2][s]] + 12
        g = 0.16 if ts < 3 else (0.2 if ts < 6 else 0.24)
        if 14.0 <= ts < title: g = 0.15
        add(music, ts, marimba(m), g, pan=[-0.3, 0.3][s % 2], send=0.25)
    # drums + bass
    for q in range(4):
        tq = t0 + q * BEAT
        if not drums(tq): continue
        add(music, tq, kick(), 0.55)
        if q in (1, 3): add(music, tq, clap(), 0.32, pan=0.05, send=0.15)
        add(music, tq + BEAT / 2, hat(), 0.18, pan=0.35)
        add(music, tq + BEAT * 0.75, hat(), 0.08, pan=0.35)
        bm = ROOT_[name] + (12 if q == 2 else 0)
        add(music, tq, bass(bm, BEAT * 0.9), 0.30)
# counter-melody bells while the town grows, and gently at night
mel = [(10.0, 77), (10.5, 76), (11.0, 72), (11.5, 74), (12.0, 76), (12.5, 79), (13.0, 81), (13.5, 79),
       (14.5, 72), (15.5, 74), (16.5, 76), (17.25, 79)]
for ts, m in mel: add(music, ts, bell(m), 0.10, pan=0.2, send=0.5)
# title stab + resolution
for m in CH['F'] + [65, 69]: add(music, title, bell(m, 2.5), 0.07, send=0.6)
for m in [72, 76, 79, 84]: add(music, 20.0 + (m - 72) * 0.012, bell(m, 2.0), 0.06, send=0.6)

# ---------- SFX ----------
def blip(f0, f1, d, dec=30):
    t = tt(d); f = np.linspace(f0, f1, len(t)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * dec) * np.minimum(1, t / 0.002)
def whoosh(d, f0=400, f1=3000, peak=0.6):
    t = tt(d); n = noise(d); out = np.zeros_like(n); s = 0.0
    fc = f0 * (f1 / f0) ** (t / d)
    a = np.exp(-2 * np.pi * fc / SR)
    for i in range(len(n)): s = (1 - a[i]) * n[i] + a[i] * s; out[i] = s
    e = np.where(t < d * peak, (t / (d * peak)) ** 2, ((d - t) / (d * (1 - peak))) ** 1.5)
    return out * e * 3
def thud():
    t = tt(0.5); f = 50 + 70 * np.exp(-t * 18)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
    knock = np.sin(2 * np.pi * 310 * t) * np.exp(-t * 35) * 0.5
    dust = onepole_lp(noise(0.5), 1200) * np.exp(-t * 14) * 1.5
    return np.tanh(1.3 * (body + knock + dust))
def boom():
    t = tt(2.5); f = 38 + 60 * np.exp(-t * 6)
    return np.tanh(1.5 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)) + onepole_lp(noise(2.5), 500) * np.exp(-t * 4) * 1.2
def crackle(d=1.3):
    out = np.zeros(int(d * SR))
    for _ in range(70):
        i = int(rng.uniform(0, 1) ** 0.7 * (len(out) - 600)); c = hp(noise(0.004), 3000) * np.exp(-tt(0.004) * 900)
        out[i:i + len(c)] += c * rng.uniform(0.3, 1) * (1 - i / len(out))
    return out

# caption whooshes + counter pop
for c in B['captions']: add(sfx, c['from'] - 0.08, whoosh(0.32, 600, 4000, 0.7), 0.06, pan=0, send=0.2)
add(sfx, 0.15, blip(700, 1300, 0.12, 35), 0.18)
# plot marker sparkle
for i, m in enumerate([88, 91, 96]): add(sfx, 2.5 + i * 0.05, bell(m, 0.8), 0.05, pan=0.1, send=0.4)
# home house drop
hd = B['houseDrop']
add(sfx, hd - 0.32, blip(1500, 500, 0.32, 3), 0.07, send=0.2)
add(sfx, hd, thud(), 0.75)
for i, m in enumerate([84, 88, 91]): add(sfx, hd + 0.06 + i * 0.06, bell(m, 1.0), 0.08, pan=0.15, send=0.4)
# riser into the rain
add(sfx, B['rainStart'] - 1.0, whoosh(1.05, 200, 6000, 0.95), 0.12, send=0.3)
# house plinks (same schedule as scene.js)
Nh = HOUSES - 1; rs, re, ex = B['rainStart'], B['rainEnd'], B['rainExp']
land = rs + (re - rs) * ((np.arange(1, Nh + 1) / Nh) ** (1 / ex)) + 0.24
penta = [65, 67, 69, 72, 74, 77, 79, 81, 84]
last = -1.0
for i, tl in enumerate(land):
    gap = 1 / 18 if i > 40 else 0.0                      # cap at ~18 plinks/s once it gets dense
    if tl - last < gap: continue
    last = tl
    g = 0.09 if i < 40 else 0.05 * max(0.35, 1 - (tl - rs) / (re - rs + 1))
    add(sfx, tl, marimba(int(rng.choice(penta)) + 12, 0.25, 0.5), g, pan=float(rng.uniform(-0.7, 0.7)), send=0.2)
# join-feed notifications
for f in B['feed']:
    add(sfx, f['t'], blip(1250, 1250, 0.07, 40), 0.07, pan=-0.5)
    add(sfx, f['t'] + 0.06, blip(1660, 1660, 0.1, 30), 0.06, pan=-0.5)
# district unlocks
for ch in B['chips']:
    for i, m in enumerate([84, 88, 91, 96]): add(sfx, ch['from'] + i * 0.07, bell(m, 1.2), 0.07, pan=0.0, send=0.5)
add(sfx, B['downtown'], whoosh(1.6, 80, 400, 0.4), 0.25)                       # towers rumble up
# night falls
add(sfx, B['nightFrom'], whoosh(1.2, 3000, 300, 0.3), 0.06, send=0.4)
# fireworks
for k, tb in enumerate(B['fireworks']):
    pan = float(rng.uniform(-0.6, 0.6)); far = 0.75 if tb < title else 0.45
    add(sfx, tb - 0.6, blip(500, 1700, 0.6, 1.5) * np.linspace(0.3, 1, int(0.6 * SR)), 0.025 * far, pan=pan, send=0.3)
    add(sfx, tb, onepole_lp(noise(1.0), 900) * np.exp(-tt(1.0) * 6) * 1.6, 0.22 * far, pan=pan, send=0.5)
    add(sfx, tb + 0.12, crackle(), 0.14 * far, pan=pan, send=0.4)
# title
add(sfx, title - 1.0, whoosh(1.0, 300, 9000, 0.98), 0.16, send=0.3)
add(sfx, title, boom(), 0.6, send=0.3)
for i in range(9): add(sfx, title + 0.12 + i * 0.045 + 0.2, blip(900 + i * 60, 600, 0.05, 60), 0.05, pan=-0.4 + i * 0.1)
add(sfx, B['cta'], blip(500, 1100, 0.12, 25), 0.16, send=0.3)

# ---------- reverb + mix ----------
ir_len = int(1.6 * SR); tir = np.arange(ir_len) / SR
ir = np.stack([rng.standard_normal(ir_len), rng.standard_normal(ir_len)], 1) * np.exp(-tir * 4.2)[:, None]
ir[:, 0] = onepole_lp(ir[:, 0], 5000); ir[:, 1] = onepole_lp(ir[:, 1], 5000); ir /= np.sqrt((ir ** 2).sum(0))
L = 1 << int(np.ceil(np.log2(N + ir_len)))
wet = np.stack([np.fft.irfft(np.fft.rfft(verb_send[:, c], L) * np.fft.rfft(ir[:, c], L), L)[:N] for c in range(2)], 1)
mix = music * 0.9 + sfx + wet * 0.35
# fades
fi = int(0.05 * SR); mix[:fi] *= np.linspace(0, 1, fi)[:, None]
fo = int(1.2 * SR); mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.5
mix = np.tanh(mix * 1.1) / 1.1
mix /= np.abs(mix).max() / 0.89

out = ROOT / 'cache/audio'; out.mkdir(parents=True, exist_ok=True)
with wave.open(str(out / 'mix_raw.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('wrote', out / 'mix_raw.wav', f'{DUR}s', 'houses', HOUSES)
