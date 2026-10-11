"""What if we terraformed Mars? (Blend: isometric + tilt-shift) — original score (same design as the Tilt-Shift score, its own events).
Run from the library root:  $LIB/.venv/bin/python <project>/tiltshift/music/score.py
Reads ../events.json; writes score.wav (48 kHz stereo), stems/*.wav and CREDITS.txt next to this file.

Design (TREATMENT.md §6): 100 BPM, 16th = 0.15 s = one time-lapse world step.
- Red Mars (0–26.4 s): D minor. An additive marimba ensemble: one voice joins at each time jump
  (marimba A → phased marimba B → vibraphone chords → high marimba 8ths). Domes and factories gate notes.
- 26.4–28.8: tape-stop into near-silence (only wind), then the rain.
- Living Mars (28.8–45.6): D major. Kalimba + harp take the theme; tree pops gate glockenspiel notes.
- 45.6–50.4: the whole ensemble tape-stops as time slows to ×1; silence for the real-time moment.
- 52.8–60: a music-box version of the theme in D major; the final bell lands on the end card (55.2).
"""
import sys, os, json
import numpy as np, soundfile as sf
LIB = os.environ.get('LIB', os.path.expanduser('~/lemo-opuscar'))
sys.path.insert(0, LIB)
from core.audio import sampler as S, pluck as P
from core.audio.sfx import SR, add, limit

HERE = os.path.dirname(os.path.abspath(__file__))
E = json.load(open(os.path.join(HERE, '..', 'events.json')))
EV, DUR = E['ev'], E['dur']
TL = json.load(open(os.path.join(HERE, '..', 'timeline.json')))
SEC = {s['id']: s['t'] for s in TL['sections']}
BEAT, BAR, ST = .6, 2.4, .15
S.seed(20261011)
N = int((DUR + 2) * SR)
stems = {k: np.zeros((N, 2), np.float32) for k in ['marA', 'marB', 'low', 'vib', 'glock', 'kal', 'harp', 'box', 'hits', 'drone']}
used = set()
_cache = {}

def note(inst, p, dur, vel, release=None, attack=0.0):
    k = (inst, p, round(dur, 3), round(vel, 2), release, attack)
    if k not in _cache:
        if inst.startswith('pluck:'): _cache[k] = P.pluck(inst[6:], p, dur, vel=vel)
        else: _cache[k] = S.note(inst, p, dur, vel, release=release, attack=attack)
    used.add(inst.split(':')[-1] if not inst.startswith('pluck:') else 'pluck')
    return _cache[k]

def put(stem, inst, p, t, dur=.6, vel=.7, pan=0., gain=1., **kw):
    if p is None or t < 0 or t > DUR + 1: return
    add(stems[stem], note(inst, p, dur, vel, **kw), t, gain, pan)

def ev(ty): return sorted(e['t'] for e in EV if e['type'] == ty)
def evs(ty): return [e for e in EV if e['type'] == ty]

# —— material ——
SK_MIN = ['D5', 'A4', 'F5', 'E5', None, 'A4', 'C5', 'D5', 'A5', None, 'F5', 'E5']      # 12-step skeleton over 16-step bars
SK_MAJ = ['D5', 'A4', 'F#5', 'E5', None, 'A4', 'C#5', 'D5', 'A5', None, 'F#5', 'E5']
MIN_CH = [('D2', ['D4', 'F4', 'A4', 'C5', 'E5']), ('Bb1', ['D4', 'F4', 'A4', 'Bb4', 'C5']), ('G1', ['D4', 'F4', 'G4', 'Bb4', 'C5']), ('A1', ['C#4', 'E4', 'G4', 'A4', 'D5'])]
MAJ_CH = [('D2', ['D4', 'F#4', 'A4', 'C#5', 'E5']), ('B1', ['D4', 'F#4', 'A4', 'B4', 'E5']), ('G1', ['D4', 'F#4', 'G4', 'B4', 'E5']), ('A1', ['C#4', 'E4', 'G4', 'A4', 'D5'])]
PENTA = ['D6', 'E6', 'F#6', 'A6', 'B6', 'D7']
THEME = ['A4', 'D5', 'E5', 'F#5', 'E5', 'D5', 'A4', 'B4', 'D5', None, 'E5', 'D5']           # music-box / kalimba line (8ths)

def chord_at(t, maj):
    i = int(t // (BAR * 2)) % 4
    return (MAJ_CH if maj else MIN_CH)[i]

def ostinato(stem, inst, t0, t1, sk, vel, pan, shift=0, octave=0, every=1):
    k = 0; t = t0
    while t < t1 - 1e-6:
        p = sk[(k + shift) % len(sk)]
        if p is not None and k % every == 0:
            if octave: p = S.name(S.midi(p) + 12 * octave)
            v = vel * (1.12 if k % 4 == 0 else .9 + .1 * ((k * 7) % 3) / 2)
            put(stem, inst, p, t, .5, min(v, 1), pan)
        k += 1; t += ST

# —— A. landing: glock pulse + low drone, touchdown ——
for k in range(8): put('glock', 'glockenspiel', 'D6' if k % 4 else 'A6', .4 + k * BEAT * .5, 1.2, .38 - k * .02, .25)
drone_t = np.arange(N) / SR
dr = (np.sin(2 * np.pi * 73.42 * drone_t) + .45 * np.sin(2 * np.pi * 146.8 * drone_t) + .2 * np.sin(2 * np.pi * 220.2 * drone_t))
dr *= np.interp(drone_t, [0, 1.2, SEC['crew'], SEC['warm'], SEC['rain'], SEC['rain'] + .5, 99], [0, .5, .35, .25, .2, 0, 0]) * .07
stems['drone'] += np.stack([dr, dr], 1).astype(np.float32)
td = ev('touchdown')[0]
put('low', 'marimba', 'D2', td, 1.5, .95, 0); put('vib', 'vibraphone', 'A3', td, 2.5, .5, -.2); put('vib', 'vibraphone', 'D4', td, 2.5, .5, .2)

# —— B–E. red Mars, additive ——
t_crew, t_dom, t_warm, t_melt, t_rain = SEC['crew'], SEC['domes'], SEC['warm'], SEC['melt'], SEC['rain']
ostinato('marA', 'marimba', t_crew, t_rain, SK_MIN, .55, -.35)
ostinato('marB', 'marimba', t_dom, t_rain, SK_MIN, .48, .35, shift=1)                    # phased one 16th
for b in range(int(t_crew / BAR), int(t_rain / BAR)):
    t = b * BAR; root, _ = chord_at(t, False)
    put('low', 'marimba', root.replace('1', '2') if root.endswith('1') else root, t, 1.2, .7, 0)
    put('low', 'marimba', root.replace('1', '2') if root.endswith('1') else root, t + BEAT * 2.5, .8, .5, 0)
for b in range(int(t_warm / BAR), int(t_rain / BAR)):                                    # vibraphone chords, half notes
    for h in range(2):
        t = b * BAR + h * BAR / 2; _, ch = chord_at(t, False)
        for i, p in enumerate(ch[:4]): put('vib', 'vibraphone', p, t + i * .02, 1.1, .42, -.4 + i * .27)
ostinato('glock', 'marimba', t_melt, t_rain, SK_MIN, .32, .55, shift=6, octave=1, every=2)   # high 8ths
for i, t in enumerate(ev('dome')): put('glock', 'glockenspiel', ['D6', 'F6', 'A6', 'C7', 'D7', 'F7', 'A7'][i % 7], t, 1.5, .55, -.3 + i * .1)
for t in ev('panels'): put('glock', 'glockenspiel', 'A6', t, .8, .3, .5)
for t in ev('factory'): put('low', 'marimba', 'A2', t, 1, .8, -.3)
for k, t in enumerate(ev('iceCrack')): [put('glock', 'glockenspiel', p, t + j * .03, 1, .35, .4 - j * .3) for j, p in enumerate(['E7', 'F7', 'C7'][:2 + k % 2])]

# —— jumps: a bell-like hit on the downbeat ——
for e in evs('jump'):
    t = e['t']; maj = t >= SEC['rain'] + 2.4
    if t >= SEC['breathe'] - .01: maj = True
    root, ch = chord_at(t, maj)
    if abs(t - SEC['rain']) < .01:                     # the rain jump: one short bell, then the silence
        put('hits', 'glockenspiel', 'D7', t, .9, .7, 0, release=.4); continue
    put('hits', 'glockenspiel', 'D7' if not maj else 'F#6', t, 2, .75, 0)
    put('hits', 'vibraphone', ch[0], t, 2.4, .65, -.3); put('hits', 'vibraphone', ch[2], t, 2.4, .6, .3)
    put('hits', 'marimba', 'D2', t, 1.5, .9, 0)

# —— F–H. living Mars, D major ——
t_wet = t_rain + 2.4; t_green, t_forest, t_breathe = SEC['green'], SEC['forest'], SEC['breathe']
TAPE_END = SEC['real'] + 1.0
for b in range(int(t_wet / BAR), int(TAPE_END / BAR) + 1):                                 # bowed vib pad + harp arpeggio
    t = b * BAR; root, ch = chord_at(t, True)
    for i, p in enumerate(ch[:3]): put('vib', 'vibraphone_bowed', p, t, BAR * 1.02, .35, -.3 + i * .3, attack=.25, release=.6)
    dens = 2 if t < t_green else (4 if t < t_forest else 8)
    for k in range(int(4 * dens / 2)):
        put('harp', 'harp', ch[(k * 2) % 5] if k % 3 else S.name(S.midi(ch[k % 5]) + 12), t + k * BAR / (2 * dens), 1.2, .45 if t < t_forest else .55, .5 - (k % 4) * .25)
    put('low', 'marimba', root.replace('1', '2'), t, 1.4, .65, 0)
k = 0; t = t_wet
while t < TAPE_END:                                                                          # kalimba theme, 8ths
    p = THEME[k % len(THEME)]
    if p: put('kal', 'kalimba', p, t, .9, .62, -.15)
    k += 1; t += BEAT / 2
ostinato('marA', 'marimba', t_green, TAPE_END, SK_MAJ, .5, -.35)
ostinato('marB', 'marimba', t_forest, TAPE_END, SK_MAJ, .44, .35, shift=1)
for e in evs('trees'):
    t = e['t']; n = min(3, 1 + e['n'] // 25)
    for j in range(n): put('glock', 'glockenspiel', PENTA[int((t * 13 + j * 2) % len(PENTA))], t + j * .03, 1, min(.25 + e['n'] * .004, .45), (j - 1) * .4)
for i, t in enumerate(ev('house')): put('glock', 'marimba', PENTA[i % 5].replace('6', '5').replace('7', '6'), t, .6, .4, .4 - (i % 3) * .4)

# —— tape-stop: 26.4 (rain jump → silence) and 45.6 → 50.4 (time slows to ×1) ——
def tape_stop(x, t0, t1):
    """from t0 the playback rate falls 1 → .18 by t1 while fading out; silence after t1."""
    i0, i1 = int(t0 * SR), min(int(t1 * SR), len(x))
    u = np.linspace(0, 1, i1 - i0); rate = 1 - .82 * u ** 1.5
    ph = i0 + np.cumsum(rate); ph = np.clip(ph, 0, len(x) - 2)
    a = ph.astype(int); f = (ph - a)[:, None]
    seg = x[a] * (1 - f) + x[a + 1] * f
    seg *= (1 - u ** 1.2)[:, None]
    y = x.copy(); y[i0:i1] = seg; y[i1:] = 0
    return y
red = ['marA', 'marB', 'low', 'vib', 'glock', 'drone']
# split red/green material at 28.8 so the first tape-stop only touches the red ensemble
cut = int((t_rain + 2.4) * SR)
for k in red:
    early, late = stems[k].copy(), stems[k].copy(); early[cut:] = 0; late[:cut] = 0
    # red material: stop between 26.55 and 27.6 (the hit at 26.4 sounds first)
    early = tape_stop(early, t_rain + .15, t_rain + 1.2)
    stems[k] = early + late
for k in stems:
    if k in ('box',): continue
    head = stems[k].copy(); head[int(t_breathe * SR):] = 0
    tail = tape_stop(stems[k], t_breathe, SEC['real'] - .1); tail[:int(t_breathe * SR)] = 0
    stems[k] = head + tail

# —— K. music box (after the silence), final bell on the end card ——
t_box, t_end = SEC['rise'], TL['endcard']['t0']
k = 0; t = t_box
BOX = ['A5', 'D6', 'E6', 'F#6', 'E6', 'D6', 'A5', 'B5', 'D6', None, 'E6', 'D6', 'A5', None, 'F#6', 'E6']
while t < DUR - 1.4:
    p = BOX[k % len(BOX)]
    if p: put('box', 'pluck:music_box', p, t, 1.6, .5, .1 * ((k % 3) - 1))
    k += 1; t += BEAT
for i, p in enumerate(['D4', 'F#4', 'A4', 'D5']): put('box', 'vibraphone', p, t_end + i * .04, 4.5, .45, -.3 + i * .2)
put('box', 'glockenspiel', 'D7', t_end, 3, .55, 0); put('box', 'harp', 'D2', t_end, 4, .6, 0)

# —— bus ——
GAIN = {'marA': .9, 'marB': .8, 'low': .9, 'vib': .7, 'glock': .55, 'kal': .75, 'harp': .55, 'box': .8, 'hits': .85, 'drone': 1}
mix = sum(stems[k] * GAIN[k] for k in stems)
mix = S.room(mix, size=.42, mix=.2)
mix = mix[:int(DUR * SR)]
mix = limit(mix * .9)
os.makedirs(os.path.join(HERE, 'stems'), exist_ok=True)
sf.write(os.path.join(HERE, 'score.wav'), mix, SR)
for k, v in stems.items(): sf.write(os.path.join(HERE, 'stems', k + '.wav'), v[:int(DUR * SR)], SR)
names = sorted(u for u in used if u != 'pluck')
open(os.path.join(HERE, 'CREDITS.txt'), 'w').write('\n'.join(S.credits(names)) + '\nMusic box: physical model (core/audio/pluck.py)\n')
print('score.wav', mix.shape, 'instruments:', names)
