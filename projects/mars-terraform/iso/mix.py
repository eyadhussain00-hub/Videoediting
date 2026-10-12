"""Mix (Isometric version): ambience + foley from events.json + the score → out/mix.wav (48 kHz stereo).
Run: LIB=<library> $LIB/.venv/bin/python <project>/tiltshift/mix.py

Sound design (TREATMENT.md §7): thin Mars wind and a granular "sped-up world" hiss in time-lapse;
retro-rocket roar and a touchdown thump; a pop per dome, clacks per factory and house; ice cracks; the rain bed
starts half a bar before the rain caption (J-cut) after a near-silence; thunder; leaf rustles per tree burst;
birds start under the tape-stop (J-cut); at real speed: breeze, the helmet seal, one breath, lapping water.
"""
import sys, os, json
import numpy as np, soundfile as sf
LIB = os.environ.get('LIB', os.path.expanduser('~/lemo-opuscar'))
sys.path.insert(0, os.path.join(LIB, 'core', 'audio'))
from sfx import *

HERE = os.path.dirname(os.path.abspath(__file__))
E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur']; EV = E['ev']; N = int(DUR * SR)
TL = json.load(open(os.path.join(HERE, 'timeline.json'))); SEC = {s['id']: s['t'] for s in TL['sections']}
T = lambda ty: [e for e in EV if e['type'] == ty]
rng = np.random.default_rng(11)
amb, fx = np.zeros((N, 2)), np.zeros((N, 2))
tt = np.arange(N) / SR
def seg(t, a, b): return np.clip((t - a) / (b - a), 0, 1)
def envw(a, b, fi=.3, fo=.3): return np.minimum(seg(tt, a, a + fi), 1 - seg(tt, b - fo, b))
def colored(lo, hi, o=2): return bp(rng.standard_normal(N), lo, hi, o)
def stereo(x, w=.15): return np.stack([x * (1 + w), x * (1 - w)], 1)

# —— beds ——
wind = lp(np.cumsum(rng.standard_normal(N)) * .01, 500); wind = hp(wind, 40); wind /= np.abs(wind).max()
gust = .6 + .4 * np.sin(2 * np.pi * .13 * tt) * np.sin(2 * np.pi * .05 * tt + 1)
w_lvl = np.interp(tt, [0, .6, SEC['rain'], SEC['rain'] + 1, SEC['rain'] + 2.4, SEC['green'], SEC['breathe'], SEC['real'], DUR], [0, .09, .07, .1, .05, .03, .02, .03, .03])
amb += stereo(wind * gust * w_lvl)
grain = colored(700, 6000) * (.5 + .5 * np.sin(2 * np.pi * (6.67) * tt) ** 2)       # sped-up world, pulsing on 16ths
g_lvl = np.interp(tt, [0, SEC['crew'], SEC['crew'] + .3, SEC['rain'] + .1, SEC['rain'] + .4, SEC['rain'] + 2.4, SEC['rain'] + 2.6, SEC['breathe'], SEC['real'] - .4, SEC['real']], [0, 0, .5, .7, 0, 0, .5, .7, .15, 0])
amb += stereo(grain * g_lvl * .008, .3)   # iso: only a trace of the sped-up hiss
hum = sum(np.sin(2 * np.pi * f * tt) for f in (48, 96.5, 145)) / 3                       # factories
amb += stereo(lp(hum, 300) * envw(SEC['warm'], SEC['rain'] + .2, .6, 1.2) * .03)
rain = colored(900, 9000) * .7 + colored(200, 900) * .3                                    # J-cut: in before the caption
r0 = T('rainStart')[0]['t']
amb += stereo(rain * np.interp(tt, [r0, r0 + .8, SEC['green'] - .3, SEC['green'] + 1.2], [0, .09, .08, 0], left=0, right=0) , .25)
breeze = lp(colored(150, 2500), 1800)
amb += stereo(breeze * np.interp(tt, [SEC['real'] - .8, SEC['real'], DUR - 1.2, DUR], [0, .03, .03, 0], left=0, right=0))
lap = hp(lp(rng.standard_normal(N), 900), 120) * (.4 + .6 * np.maximum(0, np.sin(2 * np.pi * .45 * tt)) ** 3)
amb += stereo(lap * np.interp(tt, [SEC['rise'], SEC['rise'] + 1.5, DUR], [0, .02, .02], left=0, right=0))

# —— foley ——
def chirp(d=.09, f0=4200, f1=5600):
    t = t_(d); f = np.linspace(f0, f1, len(t)); ph = np.cumsum(2 * np.pi * f / SR)
    return np.sin(ph) * np.sin(np.pi * t / d) ** 2
def crack(v=1.):
    d = .25; return hp(noise(d), 1800) * env_exp(d, .03) * v
def rustle(v=1.):
    d = .35; return bp(noise(d), 1500, 7000) * np.sin(np.pi * t_(d) / d) ** 2 * v
def seal(v=1.):     # helmet latch + pressure hiss
    d = .9; t = t_(d); h = hp(noise(d), 2500) * np.exp(-t / .25) * .5
    c = np.zeros_like(t); c[:int(.02 * SR)] = hp(noise(.02), 2000) * .35
    return (h + c) * v
def breath(v=1.):   # one deep inhale + exhale
    d = 2.2; t = t_(d); x = bp(noise(d), 300, 2600)
    env = np.interp(t, [0, .9, 1.05, 1.25, 2.2], [0, .8, .3, .6, 0]); return x * env * v
td = T('touchdown')[0]['t']
add(fx, lp(roar(td - .3, .9), 1600) * np.interp(np.arange(int((td - .3) * SR)) / SR, [0, td - .9, td - .3], [.2, 1, .6]), .3, .35, 0)
add(fx, thump(1, 55), td, .9, 0); add(fx, whoosh(.9, .7), td, .25, 0)
for e in T('dome'): add(fx, pop(.9), e['t'], .35, -.4 + e['i'] * .13)
for e in T('panels'): [add(fx, clack(1.4, .6), e['t'] + k * .075, .08, .4) for k in range(5)]
for e in T('factory'): add(fx, thump(.8, 90), e['t'], .3, -.4); add(fx, clack(.8, 1), e['t'] + .05, .1, -.4)
for e in T('domeDown'): add(fx, whoosh(.3, .5), e['t'], .12, .2)
for e in T('house'): add(fx, clack(1.1 + (e['i'] % 4) * .1, .8), e['t'], .12, .5 - (e['i'] % 3) * .5)
for e in T('iceCrack'): add(fx, crack(1), e['t'], .16, .3 - e['k'] * .3)
for e in T('thunder'): add(fx, rumble(2.5, .9 if not e.get('far') else .5), e['t'], .5 if not e.get('far') else .3, -.3)
for e in T('trees'): add(fx, rustle(min(1, .3 + e['n'] * .02)), e['t'], .18, rng.uniform(-.6, .6))
for e in T('jump'): add(fx, whoosh(.4, .8), e['t'] - .25, .25, 0)
b0 = SEC['real'] - .6                                                                     # birds: J-cut under the tape-stop
for k, t0 in enumerate([b0, b0 + .9, b0 + 2.6, SEC['rise'] + .4, SEC['rise'] + 2.1, SEC['rise'] + 3.4, DUR - 3.6, DUR - 2.2]):
    for j in range(rng.integers(2, 4)): add(amb, chirp(.06 + rng.random() * .04, 3600 + rng.random() * 900, 5000 + rng.random() * 1000), t0 + j * .1, .045, rng.uniform(-.8, .8))
add(fx, seal(1), T('helmet')[0]['t'] - .15, .35, -.15)
def plink(f=2400, v=1.):    # ceramic plink for each label pin
    d = .3; t = t_(d); return (np.sin(2 * np.pi * f * t) + .4 * np.sin(2 * np.pi * f * 2.76 * t)) * np.exp(-t / .05) * v
for k, e in enumerate(T('pin')): add(fx, plink(2200 + (k % 4) * 260), e['t'] + .1, .12, .3)
add(fx, whoosh(.6, .6), T('inset')[0]['t'], .2, .2)
add(fx, breath(1), T('breath')[0]['t'], .16, 0)

# —— music, ducked slightly under the key foley ——
mus, sr = sf.read(os.path.join(HERE, 'music', 'score.wav')); mus = mus[:N]
if len(mus) < N: mus = np.pad(mus, ((0, N - len(mus)), (0, 0)))
from scipy.ndimage import maximum_filter1d, uniform_filter1d
def link_limit(x, ceil, look=.006):   # stereo-linked look-ahead limiter along time
    n = int(look * SR); pk = maximum_filter1d(np.abs(x).max(1), size=2 * n + 1)
    g = uniform_filter1d(np.minimum(1, ceil / np.maximum(pk, 1e-9)), size=n); return x * g[:, None]
mix = amb * .9 + fx * .8 + mus * 1.0
rms = np.sqrt(np.mean(mix ** 2))
mix = link_limit(mix, rms * 3.4)            # crest ≤ ~11 dB so the −14 LUFS master keeps its true-peak headroom
mix = mix * (.9 / np.abs(mix).max())
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR)
print('out/mix.wav', mix.shape)
