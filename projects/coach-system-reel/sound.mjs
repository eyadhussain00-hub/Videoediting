// Synthesises the film's score and sound effects from src/timeline.json. No samples, all seeded.
//   node sound.mjs            → out/music.wav, out/sfx.wav (48 kHz stereo)
// The mix with the voice happens in ffmpeg (see README).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const TL = JSON.parse(readFileSync(path.join(here, 'src/timeline.json'), 'utf8'));
const SR = 48000, DUR = 51.5, N = Math.ceil(DUR * SR);
const TAU = 2 * Math.PI;

let seed = 7;
const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let x = Math.imul(seed ^ seed >>> 15, 1 | seed); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296 * 2 - 1; };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

function bus() { return { L: new Float32Array(N), R: new Float32Array(N) }; }
function add(b, t0, len, fn, pan = 0, gain = 1) {
  const s0 = Math.round(t0 * SR), gl = Math.cos((pan + 1) * Math.PI / 4) * 1.41 * gain, gr = Math.sin((pan + 1) * Math.PI / 4) * 1.41 * gain;
  const n = Math.round(len * SR);
  for (let i = 0; i < n; i++) { const j = s0 + i; if (j < 0) continue; if (j >= N) break; const v = fn(i / SR, i); b.L[j] += v * gl; b.R[j] += v * gr; }
}
const lowpass = f => { let y = 0; const k = 1 - Math.exp(-TAU * f / SR); return x => (y += k * (x - y)); };
const highpass = f => { const lp = lowpass(f); return x => x - lp(x); };
function bandpass() {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x, f, q = 0.8) => {
    const w = TAU * Math.min(f, SR * 0.45) / SR, a = Math.sin(w) / (2 * q), c = Math.cos(w), a0 = 1 + a;
    const y = (a * x - a * x2 + 2 * c * y1 - (1 - a) * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y; return y;
  };
}
const sweep = (f0, f1, d) => { let ph = 0; return t => { const f = f1 + (f0 - f1) * Math.exp(-t / d); ph += TAU * f / SR; return Math.sin(ph); }; };

// ── score ───────────────────────────────────────────────────────────────
const BPM = 96, BEAT = 60 / BPM, BAR = BEAT * 4;
// Fmaj7 · Am7 · Cmaj7 · G6, one bar each
const CHORDS = [[53, 57, 60, 64], [57, 60, 64, 67], [48, 52, 55, 59], [55, 59, 62, 64]];
const ROOTS = [29, 33, 36, 31];
const S = TL.scenes;
// where the drums sit out: the breath before each chapter card, and after the last word
const GAPS = [[14.35, S.card1[0]], [25.05, S.card2[0]], [40.0, S.card3[0]], [S.end[0] + 0.1, DUR]];
const inGap = t => GAPS.some(([a, b]) => t >= a && t < b);
const energy = t => t < 4.45 ? 0.35 : t < 8.1 ? 0.6 : t < 44.2 ? 0.85 : t < 48 ? 1 : 0.5;

const music = bus();
const kicks = [];
for (let b = 0; b * BEAT < DUR; b++) {
  const t = b * BEAT;
  const bar = Math.floor(t / BAR), beatIn = b % 4;
  const ch = CHORDS[bar % 4], root = ROOTS[bar % 4];
  const e = energy(t);
  const drums = t >= 8.1 && !inGap(t) && t < S.end[0] + 0.1;
  if (drums) {
    kicks.push(t);
    const s = sweep(150, 46, 0.035);
    add(music, t, 0.5, (u, i) => s(u) * Math.exp(-u * 7) * 0.85 + (i < 90 ? rnd() * 0.12 * (1 - i / 90) : 0), 0, 0.9 * e);
    if (beatIn === 1 || beatIn === 3) { // clap
      const bp = bandpass();
      add(music, t, 0.35, u => { const burst = u < 0.03 ? (Math.floor(u / 0.01) % 2 ? 0.7 : 1) : Math.exp(-(u - 0.03) * 16); return bp(rnd(), 1500, 0.9) * burst * 0.5; }, 0.1, 0.55 * e);
    }
  }
  // hats, 16ths, from the old-way cutaway on
  if (t >= 4.45 && !inGap(t) && t < S.end[0] + 0.1) {
    for (let s16 = 0; s16 < 4; s16++) {
      const th = t + s16 * BEAT / 4, open = t >= 44.2 && s16 === 2;
      const hp = highpass(7000), vel = [0.55, 0.25, 0.8, 0.3][s16];
      add(music, th, open ? 0.3 : 0.06, u => hp(rnd()) * Math.exp(-u * (open ? 14 : 70)) * vel * 0.5, s16 % 2 ? 0.35 : -0.25, 0.7 * e);
    }
  }
  // sub: 8th-note pulse on the root
  if (!(t >= S.end[0] + 2.5)) {
    for (let h = 0; h < 2; h++) {
      const ts = t + h * BEAT / 2, f = mtof(root + 12);
      add(music, ts, BEAT / 2, u => { const env = Math.min(1, u / 0.008) * Math.exp(-u * 5); return (Math.sin(TAU * f * u) + 0.25 * Math.sin(TAU * f * 2 * u)) * env * 0.42; }, 0, (inGap(ts) ? 0.35 : 1) * (0.6 + 0.4 * e));
    }
  }
  // arp: 16ths over the chord, from the system scene on
  if (t >= 8.1 && t < DUR - 0.6) {
    for (let s16 = 0; s16 < 4; s16++) {
      const ta = t + s16 * BEAT / 4, note = ch[(b * 4 + s16) % 4] + 12 + (s16 === 3 ? 12 : 0), f = mtof(note);
      add(music, ta, 0.4, u => { const env = Math.min(1, u / 0.003) * Math.exp(-u * 11); return (Math.sin(TAU * f * u + 0.6 * Math.sin(TAU * f * 2 * u) * Math.exp(-u * 20))) * env * 0.12; }, (s16 - 1.5) * 0.3, 0.75 + 0.25 * e);
    }
  }
}
// pad: one chord a bar, detuned saws through a slowly opening filter
for (let bar = 0; bar * BAR < DUR; bar++) {
  const t0 = bar * BAR, ch = bar * BAR >= S.end[0] - 0.01 ? [53, 57, 60, 64, 67] : CHORDS[bar % 4];
  const last = (bar + 1) * BAR > DUR - 0.01 || t0 >= S.end[0] - 0.01;
  const len = last ? DUR - t0 : BAR + 0.4;
  for (const [ni, n] of ch.entries()) {
    const f = mtof(n - 12 * (ni === 0 ? 1 : 0));
    const st = [0, 0]; // two one-pole stages, so the cutoff can move per sample
    const phs = [rnd(), rnd(), rnd()].map(x => (x + 1) / 2);
    const det = [-0.11, 0, 0.12];
    add(music, t0, len, (u) => {
      const t = t0 + u;
      const cut = 500 + 1700 * energy(t) * (0.8 + 0.2 * Math.sin(t * 0.7));
      let v = 0;
      for (let d = 0; d < 3; d++) { phs[d] = (phs[d] + f * Math.pow(2, det[d] / 12) / SR) % 1; v += phs[d] * 2 - 1; }
      const kk = 1 - Math.exp(-TAU * cut / SR);
      st[0] += kk * (v / 3 - st[0]); st[1] += kk * (st[0] - st[1]);
      const env = Math.min(1, u / 0.35) * (last ? Math.max(0, 1 - Math.max(0, u - (len - 2.2)) / 2.2) : Math.min(1, Math.max(0, (len - u) / 0.4)));
      return st[1] * env * 0.16;
    }, (ni - 2) * 0.25);
  }
}

// sidechain pump on everything but the kick itself
{
  let ki = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    while (ki + 1 < kicks.length && kicks[ki + 1] <= t) ki++;
    const d = kicks.length && t >= kicks[ki] ? t - kicks[ki] : 9;
    const g = 1 - 0.45 * Math.exp(-d / 0.11) * (d < 0.004 ? d / 0.004 : 1);
    music.L[i] *= g; music.R[i] *= g;
  }
}

// ── sound effects ───────────────────────────────────────────────────────
const sfx = bus();
const V = {
  impact: (e, g) => { const s = sweep(95, 34, 0.18), lp = lowpass(4000); add(sfx, e.t, 2.6, (u, i) => s(u) * Math.exp(-u * 2.2) * 1.0 + (i < 2400 ? lp(rnd()) * 0.5 * Math.exp(-i / 500) : 0), 0, g); },
  tick: (e, g) => { const s = sweep(4200, 2600, 0.004); add(sfx, e.t, 0.05, u => s(u) * Math.exp(-u * 120) * 0.35, 0.2, g); },
  pop: (e, g) => { const s = sweep(900, 420, 0.025); add(sfx, e.t, 0.2, u => s(u) * Math.exp(-u * 30) * 0.45, (rnd()) * 0.4, g); },
  stamp: (e, g) => { const s = sweep(200, 55, 0.05), bp = bandpass(); add(sfx, e.t, 0.6, (u, i) => s(u) * Math.exp(-u * 9) * 0.8 + bp(rnd(), 900, 0.6) * Math.exp(-u * 30) * 0.6, -0.1, g); },
  whoosh: (e, g) => { const bp = bandpass(); add(sfx, e.t, e.d, u => { const k = u / e.d; return bp(rnd(), 250 + 2600 * k * k, 1.1) * Math.pow(Math.sin(Math.PI * k), 2) * 0.5; }, -0.2, g); },
  shimmer: (e, g) => add(sfx, e.t, 1.6, u => [1568, 2093, 2637, 3136].reduce((a, f, j) => a + Math.sin(TAU * f * u) * Math.exp(-u * (2.4 + j)) * (0.5 + 0.5 * Math.sin(TAU * (6 + j) * u)), 0) * 0.06 * Math.min(1, u / 0.02), 0.1, g),
  count: (e, g) => { for (let u = 0; u < e.d; u += 0.045 + 0.04 * (u / e.d)) V.tick({ t: e.t + u }, g * 0.6); },
  chime: (e, g) => add(sfx, e.t, 2.2, u => (Math.sin(TAU * 1760 * u + 1.2 * Math.sin(TAU * 3520 * u) * Math.exp(-u * 6)) * Math.exp(-u * 2.6) * 0.16 + Math.sin(TAU * 2637 * u) * Math.exp(-u * 4) * 0.07) * Math.min(1, u / 0.002), 0.15, g),
  riser: (e, g) => { const bp = bandpass(); let ph = 0; add(sfx, e.t, e.d, u => { const k = u / e.d; ph += TAU * (180 + 700 * k * k) / SR; return (bp(rnd(), 500 + 5000 * k * k, 1.4) * 0.6 + Math.sin(ph) * 0.12) * k * k; }, 0, g); },
  sparkle: (e, g) => { for (let j = 0; j < 14; j++) { const f = 2400 + (rnd() + 1) * 1800; add(sfx, e.t + j * e.d / 14, 0.25, u => Math.sin(TAU * f * u) * Math.exp(-u * 26) * 0.07, rnd() * 0.7, g); } },
  swell: (e, g) => { const lp = lowpass(500); let ph = 0; add(sfx, e.t, 1.1, u => { ph += TAU * (60 + 30 * Math.exp(-u * 4)) / SR; return (Math.sin(ph) * 0.7 + lp(rnd()) * 0.8) * Math.sin(Math.PI * Math.min(1, u / 1.1)) ** 1.5; }, 0, g); },
  drop: (e, g) => { let ph = 0; add(sfx, e.t, 0.9, u => { ph += TAU * (600 * Math.exp(-u * 3.5) + 60) / SR; return Math.sin(ph) * Math.exp(-u * 3) * 0.3; }, 0, g); },
  lock: (e, g) => { add(sfx, e.t, 0.12, u => Math.sin(TAU * 1320 * u) * Math.exp(-u * 30) * 0.25, 0.2, g); add(sfx, e.t + 0.1, 0.4, u => Math.sin(TAU * 1980 * u) * Math.exp(-u * 9) * 0.25, 0.2, g); V.tick({ t: e.t + 0.32 }, g); },
  wobble: (e, g) => { const bp = bandpass(); add(sfx, e.t, e.d, u => bp(rnd(), 300 + 120 * Math.sin(TAU * 1.7 * u), 2.5) * 0.35 * Math.min(1, u / 0.3, (e.d - u) / 0.1), 0, g * 0.8); },
  snap: (e, g) => { let ph = 0; add(sfx, e.t, 0.35, (u, i) => { ph += TAU * (400 + 5000 * Math.min(1, u / 0.06)) / SR; return Math.sin(ph) * Math.exp(-u * 14) * 0.2 + (i < 500 ? rnd() * 0.4 * (1 - i / 500) : 0); }, 0, g); V.chime({ t: e.t + 0.03 }, g * 0.6); },
  bar: (e, g) => { const bp = bandpass(); add(sfx, e.t, 0.35, u => bp(rnd(), 800 + 3000 * (u / 0.35), 1.2) * Math.sin(Math.PI * u / 0.35) * 0.25, 0.25, g); V.pop({ t: e.t }, g * 0.5); },
  error: (e, g) => { for (const d of [0, 0.13]) add(sfx, e.t + d, 0.11, u => (((u * 160) % 1) * 2 - 1) * 0.16 * Math.min(1, u / 0.005, (0.11 - u) / 0.01), 0, g); },
  check: (e, g) => add(sfx, e.t, 0.35, u => Math.sin(TAU * 1175 * u * (1 + 0.5 * Math.min(1, u / 0.04))) * Math.exp(-u * 14) * 0.25, 0.1, g),
  hit: (e, g) => { const s = sweep(160, 50, 0.04); add(sfx, e.t, 0.7, (u, i) => s(u) * Math.exp(-u * 6) * 0.8 + (i < 600 ? rnd() * 0.25 * (1 - i / 600) : 0), 0, g); },
  notify: (e, g) => { for (const [d, f] of [[0, 1318.5], [0.11, 1975.5]]) add(sfx, e.t + d, 1.0, u => Math.sin(TAU * f * u) * Math.exp(-u * 5) * 0.2 * Math.min(1, u / 0.003), 0.1, g); },
};
for (const e of TL.sfx) V[e.kind](e, e.g ?? 1);

// one shared room for the effects
function reverb(x, delays, wet) {
  const combs = delays.map(d => ({ buf: new Float32Array(d), i: 0 })), aps = [347, 113].map(d => ({ buf: new Float32Array(d), i: 0 }));
  const y = new Float32Array(x.length);
  for (let n = 0; n < x.length; n++) {
    let s = 0;
    for (const c of combs) { const v = c.buf[c.i]; c.buf[c.i] = x[n] + v * 0.8; c.i = (c.i + 1) % c.buf.length; s += v; }
    s /= combs.length;
    for (const a of aps) { const v = a.buf[a.i]; const o = -s + v; a.buf[a.i] = s + v * 0.5; a.i = (a.i + 1) % a.buf.length; s = o; }
    y[n] = x[n] + s * wet;
  }
  return y;
}
// the arp's dotted-eighth echo lives on the music bus
function delay(b, time, fb, wet) {
  const d = Math.round(time * SR);
  for (const ch of [b.L, b.R]) for (let i = d; i < N; i++) ch[i] += ch[i - d] * fb * wet;
}
delay(music, BEAT * 0.75, 0.35, 0.6);
const room = (b, wet) => ({ L: reverb(b.L, [1557, 1617, 1491, 1422], wet), R: reverb(b.R, [1580, 1640, 1514, 1445], wet) });

function write(b, file, peakDb) {
  let peak = 0; for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(b.L[i]), Math.abs(b.R[i]));
  const g = Math.pow(10, peakDb / 20) / peak, buf = Buffer.alloc(44 + N * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28);
  buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
  for (let i = 0; i < N; i++) {
    buf.writeInt16LE(Math.round(clamp(b.L[i] * g, -1, 1) * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(clamp(b.R[i] * g, -1, 1) * 32767), 46 + i * 4);
  }
  writeFileSync(file, buf);
}
mkdirSync(path.join(here, 'out'), { recursive: true });
write(room(music, 0.25), path.join(here, 'out/music.wav'), -3);
write(room(sfx, 0.3), path.join(here, 'out/sfx.wav'), -3);
console.log(`music + ${TL.sfx.length} effects, ${DUR} s`);
