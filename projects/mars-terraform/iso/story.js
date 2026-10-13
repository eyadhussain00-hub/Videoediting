// Story clock for the Tilt-Shift version: reads the shared timeline, gives the stepped world time,
// the counter, the speed readout and every era parameter as closed-form functions of time.
import { clamp, lerp, seg, ss, monotone } from '/core/lib.js';

export const TL = await (await fetch('timeline.json')).json();
export const DUR = TL.dur, BEAT = TL.beat, BAR = TL.bar, STEP = BEAT / 4;   // 16th note = world step (0.15 s)
export const S = Object.fromEntries(TL.sections.map(s => [s.id, s.t]));
export const RAMP0 = S.breathe, RAMP1 = S.real;                               // time-lapse → real time
export const HIT = TL.hits;

export const sectionAt = t => { let s = TL.sections[0]; for (const x of TL.sections) if (t >= x.t) s = x; return s; };
const nextT = s => { const i = TL.sections.indexOf(s); return i + 1 < TL.sections.length ? TL.sections[i + 1].t : DUR; };

// World time steps on 16ths in time-lapse, finer during the ramp, smooth in real time.
export function stepT(t) {
  if (t >= RAMP1) return t;
  if (t < RAMP0) return Math.floor(t / STEP) * STEP;
  const u = seg(t, RAMP0, RAMP1), st = u < .45 ? STEP : u < .7 ? STEP * 2 / 3 : u < .88 ? 1 / 12 : 0;
  return st ? RAMP0 + Math.floor((t - RAMP0) / st) * st : t;
}

// Counter: geometric from counter[0] to counter[1] across the section.
export function counterAt(tq) {
  const s = sectionAt(tq), [a, b] = s.counter, u = seg(tq, s.t, nextT(s));
  const v = a === b ? a : Math.exp(lerp(Math.log(a), Math.log(b), u));
  return { value: Math.round(v), unit: s.unit, s };
}
// Speed readout: Mars seconds per film second.
const SEC = { DAY: 86400, YEAR: 31557600 };
const BASE_RATE = (() => {
  const r = {};
  for (const s of TL.sections) { const d = nextT(s) - s.t; r[s.id] = Math.max(1, (s.counter[1] - s.counter[0]) * SEC[s.unit] / d); }
  r.land = 86400 / (S.crew - S.land);
  return r;
})();
export function rateAt(t) {
  if (t >= RAMP1) return 1;
  if (t >= RAMP0) return Math.exp(lerp(Math.log(BASE_RATE.forest), 0, ss(seg(t, RAMP0, RAMP1 - .4))));
  return BASE_RATE[sectionAt(t).id];
}
export function fmtRate(r) {
  if (r < 1.5) return '×1  REAL TIME';
  const f = (x, u) => `×${x >= 100 ? Math.round(x) : x.toFixed(1).replace(/\.0$/, '')} ${u}`;
  if (r >= 1e12) return f(r / 1e12, 'TRILLION');
  if (r >= 1e9) return f(r / 1e9, 'BILLION');
  if (r >= 1e6) return f(r / 1e6, 'MILLION');
  return `×${Math.round(r).toLocaleString('en-US')}`;
}
export const fmtNum = n => n.toLocaleString('en-US');

// Era parameters (all 0..1 unless noted), from stepped time tq.
const K = (keys) => monotone(keys);
export const ERA = {
  frost: K([[0, .55], [S.warm, .55], [S.melt, .12], [S.rain, 0]]),
  ice: K([[0, 1], [S.melt + .3, 1], [S.melt + 4.2, 0]]),                    // ice sheet → water
  lake: K([[0, -36], [S.melt + .3, -36], [S.rain, -33.5], [S.green, -29.5], [S.forest, -28], [DUR, -28]]),   // water level (m)
  water: K([[0, 0], [S.melt, 0], [S.rain + 2, .35], [S.green + 2, .75], [S.forest + 2, 1]]),        // muddy → blue
  sky: K([[0, 0], [S.warm, 0], [S.melt, .22], [S.rain, .34], [S.rain + 2.4, .52], [S.green, .6], [S.forest, .74], [S.forest + 5, 1], [DUR, 1]]),
  dust: K([[0, 1], [S.warm, 1], [S.melt, .6], [S.rain, .35], [S.green, .1], [S.forest, 0]]),
  wet: K([[0, 0], [S.rain + 2.2, 0], [S.rain + 3.4, 1], [S.green + 3, .55], [S.forest, .35]]),
  green: K([[0, 0], [S.rain + 4.5, 0], [S.green, 6], [S.forest, 34], [S.breathe, 90], [DUR, 96]]),  // spread front (m above water)
  river: K([[0, 0], [S.rain + 3, 0], [S.green + 1.2, .55], [S.forest, 1]]),
  clouds: K([[0, 0], [S.rain - .6, 0], [S.rain + 1.2, 1], [S.green + 1.5, .8], [S.green + 3.5, .25], [S.forest + 2, .12], [DUR, .12]]),
  rain: K([[0, 0], [S.rain + 2.35, 0], [S.rain + 2.5, 1], [S.green - .2, 1], [S.green + .6, 0]]),
  plumes: K([[0, 0], [S.warm, 0], [S.warm + .3, 1], [S.melt + 3, 1], [S.rain + 1, 0]]),
};

// Discrete appearance schedules (film time of each pop), on the beat grid.
export const DOME_T = [0, 1, 2, 3, 4, 5, 6].map(i => S.domes + BEAT * (1 + i));
export const PANEL_T = [0, 1, 2, 3].map(i => S.domes + BEAT * (1.5 + i * 1.5));
export const FACTORY_T = [0, 1, 2].map(i => S.warm + BEAT * (i * 2));
export const DOME_DOWN = [0, 1, 2, 3, 4, 5, 6].map(i => S.forest + BAR + BEAT * (i * .5));
export const HOUSE_T0 = S.forest + BAR + BEAT * 2, HOUSE_STEP = BEAT / 2;

export const CAPTIONS = TL.captions;
export const TITLE = TL.title, ENDCARD = TL.endcard;
export const JUMPS = TL.sections.filter(s => s.jump).map(s => ({ t: s.t, text: s.jump }));
export { clamp, lerp, seg, ss };
