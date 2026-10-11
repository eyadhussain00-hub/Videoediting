// What if we terraformed Mars? — Isometric Infographic version (1080×1920)
import { Iso, PAL, tri, pin, inset, hatch, ring, iconGrid, person, haloText, clamp, lerp, seg, ss, eo, eio, back, hash, mix, hex, FONT } from './engine.js';
import { DUR, S, BEAT, BAR, HIT, RAMP0, RAMP1, counterAt, fmtNum, ERA, CAPTIONS, TITLE, ENDCARD, JUMPS, DOME_T, PANEL_T, FACTORY_T, DOME_DOWN, HOUSE_T0, HOUSE_STEP } from './story.js';

export { DUR };
const W = 1080, H = 1920;
// ---------- palette: one meaning per hue ----------
const HUE = {
  rust: tri('#C2683F'), rust2: tri('#A9573A'), dune: tri('#D4925E'), ice: tri('#E7F1F2', .12, .14), water: PAL.blue, green: PAL.green, moss: tri('#6E8A45'),
  stone: PAL.stone, cream: PAL.cream, gas: PAL.mustard, bed: tri('#7A5A4A'), hero: tri('#E8692E'), dark: tri('#55585E'),
};
const INK = PAL.ink;

// ---------- the board ----------
const N = 24, CELL = 1.5, HALF = N * CELL / 2, BED0 = -9, BED1 = -6.2, ICE0 = -6.2, ICE1 = -4.4;
const RIM = 11.5;
const RIVER = [[7, -HALF], [5, -12], [1.5, -8.5], [-2, -5.5]];
function riverD(x, y) { let b = 1e9; for (let i = 0; i < RIVER.length - 1; i++) { const [ax, ay] = RIVER[i], [bx, by] = RIVER[i + 1], dx = bx - ax, dy = by - ay; const u = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)); b = Math.min(b, Math.hypot(ax + dx * u - x, ay + dy * u - y)); } return b; }
const BASE = [5.5, 5.5], PAD = [5, 5];
function hRaw(x, y) {
  const r = Math.hypot(x, y);
  let h = 1.0 + .35 * Math.sin(x * .35 + 1) * Math.cos(y * .3);
  h += 2.4 * Math.exp(-Math.pow((r - RIM) / 2.6, 2));
  const depth = 3.2 + 3.0 * ss((-(x + y)) / 16 + .5);
  h -= ss((RIM - r) / 4.5) * depth;
  const db = Math.hypot(x - BASE[0], y - BASE[1]); h = lerp(h, -1.4, ss((5.5 - db) / 2.5));
  return h;
}
const CELLS = [];
for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
  const x = -HALF + i * CELL, y = -HALF + j * CELL, cx = x + CELL / 2, cy = y + CELL / 2;
  const h0 = Math.round(hRaw(cx, cy) * 2) / 2, rd = riverD(cx, cy);
  CELLS.push({ i, j, x, y, cx, cy, h0, rd, n: hash(i * 31 + j * 7), edge: i === N - 1 || j === N - 1 });
}
const cellAt = (x, y) => CELLS[clamp(Math.floor((x + HALF) / CELL), 0, N - 1) * N + clamp(Math.floor((y + HALF) / CELL), 0, N - 1)];
const topAt = (x, y, t) => { const c = cellAt(x, y); return cellH(c, t); };
function cellH(c, t) { const carve = ERA.river(t); return c.rd < 1.6 && carve > 0 ? lerp(c.h0, Math.min(c.h0, -4.5 + c.rd * .4), ss(carve * 1.4)) : c.h0; }
const lakeLv = t => lerp(-6, -2.7, clamp((ERA.lake(t) + 36) / 8));                 // shared lake curve → board units

// ---------- schedules ----------
const DOMES = [[5.5, 3, 1.5], [3, 5.6, 1.2], [8, 5.2, 1.2], [5.6, 8.2, 1.1], [3, 2.6, .9], [8.2, 2.4, .9], [2.6, 8.4, .9]];
const FACT = [[-6, 9], [-9, 5.5], [-3, 11.5]];
const PANELS = []; for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) PANELS.push([10 + k * 1.1, 8 + r * 1.1, r]);
const TREES = [];
{ for (const c of CELLS) for (let k = 0; k < 2; k++) {
    const x = c.x + .5 + hash(c.i * 13 + c.j * 3 + k) * 1.2, y = c.y + .5 + hash(c.i * 7 + c.j * 17 + k * 5) * 1.2;
    if (Math.hypot(x - BASE[0], y - BASE[1]) < 6 || c.h0 < -4.6 || c.rd < 1.4 || hash(c.i * 3 + c.j * 11 + k) < .35) continue;
    const near = Math.max(0, c.h0 + 5) * 4 + (hash(c.i + c.j * 29 + k) - .5) * 6;
    TREES.push({ x, y, near, pine: hash(c.i * 5 + c.j + k) < .4, s: .7 + hash(c.j * 19 + c.i + k) * .5 });
  } }
const greenInv = near => { for (let t = S.green; t < 60; t += .15) if (ERA.green(t) * 1 - 16 > near) return Math.round(t / .15) * .15; return 99; };
TREES.forEach(T => T.t0 = greenInv(T.near));
const HOUSES = [];
{ let k = 0; for (let a = 0; a < 40 && HOUSES.length < 16; a++) { const ang = hash(a * 3.3) * 6.28, r = 2 + hash(a * 7.1) * 4.5, x = BASE[0] + Math.cos(ang) * r, y = BASE[1] + Math.sin(ang) * r;
    if (Math.hypot(x - PAD[0], y - PAD[1]) < 1.8 || HOUSES.some(H => Math.hypot(H.x - x, H.y - y) < 1.6) || Math.abs(x) > HALF - 1 || Math.abs(y) > HALF - 1) continue;
    HOUSES.push({ x, y, t0: HOUSE_T0 + (k++) * HOUSE_STEP, w: .9 + hash(a) * .5, d: .8 + hash(a + 1) * .4, h: .7 + hash(a + 2) * .5 }); } }
const HERO = [PAD[0] - 1.6, PAD[1] - 1.9];
const pop = (t, t0, d = .45) => t < t0 ? 0 : back(seg(t, t0, t0 + d), 2.2);

// ---------- gauges (the numbers must add up to Earth at the end) ----------
const GA = {
  air: track([[0, .6], [S.warm, 1], [S.melt, 8], [S.rain, 24], [S.green, 45], [S.forest, 70], [S.breathe, 100]]),
  temp: track([[0, -63], [S.warm, -60], [S.melt, -35], [S.rain, -8], [S.green, 3], [S.forest, 9], [S.breathe, 14]]),
  o2: track([[0, .1], [S.green, .3], [S.forest, 4], [S.forest + 4, 12], [S.breathe, 21]]),
};
function track(keys) { return t => { if (t <= keys[0][0]) return keys[0][1]; for (let i = 0; i < keys.length - 1; i++) if (t < keys[i + 1][0]) return lerp(keys[i][1], keys[i + 1][1], ss(seg(t, keys[i][0], keys[i + 1][0]))); return keys[keys.length - 1][1]; }; }

// ---------- camera: centre + log zoom ----------
const CAMK = [
  [0, [0, 0, -2.5, 17]], [S.crew, [0, 0, -2.5, 17]], [S.melt - .2, [3, 3, -2, 21]], [S.melt + 1.2, [9, 9, -6, 27]], [S.rain - .2, [9, 9, -6, 27]],
  [S.rain + 1.4, [0, 0, -2.5, 17]], [S.green, [0, 0, -2.5, 17]], [S.forest + 5, [0, 0, -2.5, 16]], [S.breathe, [0, 0, -2.5, 16]],
  [S.breathe + 3.4, [HERO[0] - 2, HERO[1] - 2, -2, 24]], [DUR, [HERO[0] - 2, HERO[1] - 2, -2, 25]],
];
function camAt(t) {
  let i = 0; while (i < CAMK.length - 2 && t >= CAMK[i + 1][0]) i++;
  const [t0, a] = CAMK[i], [t1, b] = CAMK[i + 1], u = eio(seg(t, t0, t1));
  return { x: lerp(a[0], b[0], u), y: lerp(a[1], b[1], u), z: lerp(a[2], b[2], u), k: Math.exp(lerp(Math.log(a[3]), Math.log(b[3]), u)) };
}

// ---------- drawing ----------
let TEXTS_NOW = [];
export function render(g, t, Q) {
  const iso = new Iso(g, W, H); iso.cam = camAt(t); TEXTS_NOW = [];
  const sky = ERA.sky(t);
  // ground: pale, warm peach → pale blue as the air thickens; faint isometric dot lattice
  g.fillStyle = hex(mix('#F4E5D6', '#E6EFF2', sky)); g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(46,37,34,.07)';
  for (let a = -40; a <= 40; a += 2) for (let b = -40; b <= 40; b += 2) { const [sx, sy] = iso.P(a, b, BED0 - 3); if (sx > -5 && sx < W + 5 && sy > -5 && sy < H + 5) g.fillRect(sx - 1.2, sy - 1.2, 2.4, 2.4); }
  // soft shadow under the board
  { const [sx, sy] = iso.P(0, 0, BED0 - 3); g.save(); g.filter = `blur(${iso.cam.k * 1.6}px)`; g.fillStyle = 'rgba(46,37,34,.18)'; g.beginPath(); g.ellipse(sx, sy + iso.cam.k * 2, HALF * 1.8 * iso.cam.k, HALF * .95 * iso.cam.k, 0, 0, Math.PI * 2); g.fill(); g.restore(); }
  iso.desat = .9 * ss(seg(t, RAMP0 + .4, RAMP0 + 2.2));
  drawBoard(iso, t);
  drawThings(iso, t);
  iso.flush();
  sectionHatch(iso, t);
  labels(iso, t);
  hud(g, t);
  if (t >= RAMP1 - .2) heroInset(iso, t);
  captions(g, t);
}

function drawBoard(iso, t) {
  const lake = lakeLv(t), ice = ERA.ice(t), G = ERA.green(t), wet = ERA.wet(t), frost = ERA.frost(t), base = ss(seg(t, S.crew, S.domes)), town = ss(seg(t, S.forest + 2, S.breathe));
  const carve = ERA.river(t), meltFront = 1 - ice;                                      // section ice turns to water, left → right
  for (const c of CELLS) {
    const h = cellH(c, t);
    let col = mix(HUE.rust[0], HUE.dune[0], c.n * .35 + (c.h0 > 1.8 ? .25 : 0));
    if (frost > 0 && c.h0 > 1.5 && c.n > .45) col = mix(col, HUE.ice[0], frost * .5);
    const db = Math.hypot(c.cx - BASE[0], c.cy - BASE[1]);
    if (db < 5.2 && base > 0) col = mix(col, HUE.stone[0], base * (1 - town * .6) * .85);
    if (wet > 0) col = mix(col, '#5B3A2C', wet * .25);
    if (G > 0) { const near = Math.max(0, h - lake) * 4 + (carve > .3 ? Math.min(99, c.rd * 3) : 99) * 0; const nn = Math.min(Math.max(0, h - lake) * 4, carve > .3 ? c.rd * 3 : 99);
      const gg = clamp((G - nn + (c.n - .5) * 8) / 7) * (db < 5.2 ? town : 1); if (gg > 0) col = mix(col, gg < .5 ? HUE.moss[0] : HUE.green[0], ss(gg * 1.6)); }
    const t3 = [hex(col), hex(mix(col, '#2E2522', .12)), hex(mix(col, '#2E2522', .26))];
    const z0 = c.edge ? ICE1 : Math.min(-2.5, h - .6);
    iso.box(c.x, c.y, z0, CELL, CELL, h - z0, t3, { cull: false });
    if (c.edge) {                                                                         // strata: ice layer then bedrock
      const u = (c.i + (N - 1 - c.j)) / (2 * N), wet2 = meltFront * 1.25 - u > 0;
      iso.box(c.x, c.y, ICE0, CELL, CELL, ICE1 - ICE0, wet2 ? HUE.water : HUE.ice, { cull: false });
      iso.box(c.x, c.y, BED0, CELL, CELL, BED1 - BED0, HUE.bed, { cull: false });
    }
    // ice sheet / lake on low cells
    if (h < lake + .01 || (ice > 0 && h < -4.2)) {
      const lv = Math.max(lake, ice > 0 ? -4.2 : -99), isIce = ice > 0 && hash(c.i * 9 + c.j * 5) < ice;
      if (lv > h) iso.box(c.x, c.y, h, CELL, CELL, lv - h, isIce ? HUE.ice : HUE.water, { cull: false, bias: .01 });
    }
    if (carve > .45 && c.rd < 1.1 && h < 0) iso.box(c.x, c.y, h, CELL, CELL, .25, HUE.water, { cull: false, bias: .02 });
  }
}

function sectionHatch(iso, t) {      // hatched bedrock on the two section faces
  const g = iso.g, P = (x, y, z) => iso.P(x, y, z);
  hatch(g, [P(HALF, -HALF, BED1), P(HALF, HALF, BED1), P(HALF, HALF, BED0), P(HALF, -HALF, BED0)]);
  hatch(g, [P(-HALF, HALF, BED1), P(HALF, HALF, BED1), P(HALF, HALF, BED0), P(-HALF, HALF, BED0)]);
}

function drawThings(iso, t) {
  // lander (falls in, then stays as the monument)
  const td = HIT.touchdown, alt = t < td ? Math.pow(1 - seg(t, .3, td), 1.8) * 18 : 0, pz = topAt(PAD[0], PAD[1], t) + alt;
  const mon = ss(seg(t, S.forest + BEAT * 6, S.forest + BEAT * 8));
  if (t > .3) {
    iso.cyl(PAD[0], PAD[1], pz - alt + .0, 1.05, .12, HUE.dark, { n: 18 });
    if (mon > 0) iso.cyl(PAD[0], PAD[1], pz - alt, 1.0, .5 * mon, HUE.stone, { n: 6 });
    const z = pz + .5 * mon;
    for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + .78; iso.box(PAD[0] + Math.cos(a) * .55 - .06, PAD[1] + Math.sin(a) * .55 - .06, z, .12, .12, .5, HUE.stone); }
    iso.cyl(PAD[0], PAD[1], z + .45, .45, .55, HUE.cream, { n: 6 }); iso.cone(PAD[0], PAD[1], z + 1.0, .38, .5, HUE.stone, { n: 6 });
    if (t < td + .1) { const fl = .6 + .2 * Math.sin(t * 50); iso.cone(PAD[0], PAD[1], z + .45, .25, -1.2 * fl, tri('#F6C552')); }
    if (t > td && t < td + 1.6) { const u = seg(t, td, td + 1.6); for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, r = .8 + u * 2.4; iso.sphere(PAD[0] + Math.cos(a) * r, PAD[1] + Math.sin(a) * r, pz + .3, .35 * (1 - u), HUE.dune); } }
  }
  // domes: stepped hemispheres + corridors
  DOMES.forEach(([x, y, r], i) => {
    const s = Math.min(1.15, pop(t, DOME_T[i])) * (1 - ss(seg(t, DOME_DOWN[i], DOME_DOWN[i] + BEAT * 1.5))); if (s < .02) return;
    const z = topAt(x, y, t), R = r * s;
    iso.cyl(x, y, z, R, .45 * s, HUE.cream, { n: 20 }); iso.cyl(x, y, z + .45 * s, R * .8, .35 * s, HUE.cream, { n: 20 }); iso.cyl(x, y, z + .8 * s, R * .5, .25 * s, HUE.cream, { n: 16 });
  });
  PANELS.forEach(([x, y, r], i) => { const s = pop(t, PANEL_T[r] + (i % 4) * .075) * (1 - ss(seg(t, S.forest + BAR, S.forest + BAR * 2))); if (s < .02) return; iso.box(x, y, topAt(x, y, t), .9 * s, .9 * s, .12, HUE.dark); });
  // factories + greenhouse gas
  const fd = 1 - ss(seg(t, S.green + BAR * 2, S.forest)), gas = ERA.plumes(t);
  FACT.forEach(([x, y], i) => {
    const s = Math.min(1.1, pop(t, FACTORY_T[i])) * fd; if (s < .02) return; const z = topAt(x, y, t);
    iso.box(x - 1, y - .7, z, 2, 1.4, 1.1 * s, HUE.stone);
    for (let k = 0; k < 2; k++) { const cx = x - .5 + k, cy = y; iso.cyl(cx, cy, z, .18, 2.4 * s, HUE.stone, { n: 10 });
      if (gas > 0 && s > .9) for (let j = 0; j < 5; j++) { const ph = (t * .55 + j / 5 + k * .3) % 1; iso.sphere(cx + ph * 1.4, cy - ph * .6, z + 2.6 + ph * 4, (.25 + ph * .55) * gas, HUE.gas); } }
  });
  // trees
  for (const T of TREES) { if (t < T.t0) continue; const s = Math.min(1.1, pop(t, T.t0, .4)) * T.s, z = topAt(T.x, T.y, t);
    iso.box(T.x - .06, T.y - .06, z, .12, .12, .35 * s, PAL.soil);
    if (T.pine) iso.cone(T.x, T.y, z + .25 * s, .38 * s, 1.1 * s, tri('#4E7A45'), { n: 6 }); else iso.sphere(T.x, T.y, z + .65 * s, .42 * s, HUE.green); }
  // town
  for (const Hs of HOUSES) { const s = Math.min(1.1, pop(t, Hs.t0)); if (s < .02) continue; const z = topAt(Hs.x, Hs.y, t);
    iso.box(Hs.x, Hs.y, z, Hs.w, Hs.d, Hs.h * s, HUE.cream); iso.roof(Hs.x, Hs.y, z + Hs.h * s, Hs.w, Hs.d, .45 * s, HUE.stone, { ridge: Hs.w > Hs.d ? 'x' : 'y', over: .06 }); }
  // people (step at 12 fps); suits are stone-white, the hero alone is orange
  const tp = Math.floor(t * 12) / 12;
  if (t >= S.crew && t < S.real) { const n = t < S.domes ? 4 : t < S.forest ? 9 : 16;
    for (let i = 0; i < n; i++) { const a = hash(i * 3.1) * 6.28 + tp * (.25 + hash(i) * .3) * (i % 2 ? 1 : -1), r = 1.8 + hash(i * 5.7) * 4.2, x = BASE[0] + Math.cos(a) * r, y = BASE[1] + Math.sin(a) * r * .9;
      if (Math.hypot(x - PAD[0], y - PAD[1]) < 1.2 || Math.abs(x) > HALF - .5 || Math.abs(y) > HALF - .5) continue;
      iso.bill(x, y, topAt(x, y, t), g => person(g, { h: .9, body: '#E9E4DA', skin: '#E9E4DA', legs: '#B8B2A6' })); } }
  if (t >= S.forest) { iso.keep = true; iso.bill(HERO[0], HERO[1], topAt(HERO[0], HERO[1], t), g => heroBill(g, t), { bias: .5 }); iso.keep = false; }
  // clouds + rain
  const cl = ERA.clouds(t);
  if (cl > .02) for (let k = 0; k < 6; k++) { const x = -14 + k * 5.5 + (t - S.rain) * .8, y = -10 + hash(k) * 12, s = cl;
    iso.box(x, y, 9, 4 * s, 2.4 * s, .9 * s, HUE.cream, { bias: 50 }); iso.box(x + 1, y + .6, 9.9, 2.2 * s, 1.4 * s, .6 * s, HUE.cream, { bias: 50 }); }
  const rn = ERA.rain(t);
  if (rn > .02) { const tq = Math.floor(t * 12) / 12; for (let k = 0; k < 120; k++) { const x = -14 + hash(k * 1.3) * 28, y = -14 + hash(k * 2.7) * 28, z = 9 - ((tq * 9 + hash(k) * 9) % 9);
    iso.line3([[x, y, z], [x, y, z - .7]], '#7FA7C6', 1.6, { a: rn * .8, bias: 40 }); } }
}

function heroBill(g, t) {
  const lift = ss(seg(t, HIT.helmet - .2, HIT.helmet + .4)), side = ss(seg(t, HIT.helmet + .45, HIT.helmet + 1.2));
  person(g, { h: 1.0, body: '#E8692E', skin: '#C98B62', legs: '#9C4A22', hair: '#2E2018', arm: lerp(.2, 2.6, lift * (1 - side)) });
  if (lift < .02) { g.beginPath(); g.arc(0, -.78, .17, 0, Math.PI * 2); g.fillStyle = '#F4EFE6'; g.fill(); g.beginPath(); g.arc(.04, -.77, .11, -1.2, 1.4); g.fillStyle = '#3B3F48'; g.fill(); }
  else { const hx = lerp(0, .32, side), hy = lerp(-.78 - lift * .3, -.45, side); g.beginPath(); g.arc(hx, hy, .17, 0, Math.PI * 2); g.fillStyle = '#F4EFE6'; g.fill(); }
}

// ---------- infographic layer ----------
const PINS = [
  { key: 'lander', t0: S.crew, t1: S.domes + .6, at: () => [PAD[0], PAD[1], 2], title: 'LANDER', num: 'DAY 1', dir: 1, up: 170 },
  { key: 'habitat', t0: S.domes + 1, t1: S.melt - .2, at: () => [5.5, 3, 1.8], title: 'HABITAT', num: '7', unit: 'DOMES', dir: 1, up: 220 },
  { key: 'factories', t0: S.warm + .4, t1: S.melt - .3, at: () => [-6, 9, 3.5], title: 'GAS FACTORIES', num: 'CO₂ + PFC', dir: 1, up: 300, ns: 34 },
  { key: 'ice', t0: S.melt + 1.4, t1: S.melt + 4.4, at: () => [-4, -4, -4.6], title: 'ICE SHEET', num: 'MELTING', dir: 1, up: 160, ns: 34 },
  { key: 'lake', t0: S.rain + 2.6, t1: S.breathe, at: () => [-5, -5, -5], title: 'LAKE', dir: -1, up: 170 },
  { key: 'river', t0: S.green + 1.2, t1: S.breathe, at: () => [3.5, -10, -2.5], title: 'RIVER', dir: 1, up: 170 },
  { key: 'forest', t0: S.forest + .6, t1: S.breathe, at: () => [-9, 3, 1], title: 'FOREST', dir: -1, up: 170 },
  { key: 'town', t0: S.forest + BAR + 1.4, t1: S.breathe, at: () => [8, 8, 1], title: 'TOWN', dir: 1, up: 170 },
];
function labels(iso, t) {
  for (const p of PINS) { if (t < p.t0 || t > p.t1 + .4) continue;
    const a = seg(t, p.t0, p.t0 + .9), fade = 1 - ss(seg(t, p.t1, p.t1 + .4)), [x, y, z] = p.at();
    pin(iso, x, y, z, { title: p.title, num: p.num, unit: p.unit, dir: p.dir, up: p.up, len: 60, a, fade, ns: p.ns || 44, ts: 27 });
    const [ax, ay] = iso.P(x, y, z); TEXTS_NOW.push({ id: p.key, text: [p.title, p.num, p.unit].filter(Boolean).join(' '), x0: Math.min(ax, ax + p.dir * 330), y0: ay - p.up - 40, x1: Math.max(ax, ax + p.dir * 330), y1: ay - p.up + 60 });
  }
  // the title: extruded isometric type standing on the far rim, letters rise one by one, sink at the end
  if (t >= TITLE.t0 && t < TITLE.t1 + .6) {
    const g = iso.g, lines = ['WHAT IF WE', 'TERRAFORMED', 'MARS?'];
    lines.forEach((ln, li) => { [...ln].forEach((ch, ci) => {
      const t0 = TITLE.t0 + (li * 4 + ci) * .06, rise = back(seg(t, t0, t0 + .35), 1.6), sink = ss(seg(t, TITLE.t1, TITLE.t1 + .5));
      if (rise <= 0) return; const sc = 4.1;
      iso.text3(ch, -24 + ci * sc * .7, -HALF, 16 - li * 4.6 - (1 - rise) * 2 - sink * 14, { plane: 'xz', size: sc, extrude: .8, tri: li === 2 ? tri('#C2683F') : tri('#4A3C38', .15, .25), weight: 800, a: 1 - sink });
    }); });
    iso.flush();
    TEXTS_NOW.push({ id: 'title', text: TITLE.text, x0: 120, y0: 300, x1: 960, y1: 700 });
  }
}

function hud(g, t) {
  const endA = 1 - ss(seg(t, ENDCARD.t0 - .4, ENDCARD.t0 + .2)); if (endA <= 0) return;
  const a = ss(seg(t, TITLE.t1 - .3, TITLE.t1 + .3)) * endA; if (a <= 0) return;
  const c = counterAt(t), unit = c.unit === 'DAY' ? (c.value === 1 ? 'DAY' : 'DAYS') : (c.value === 1 ? 'YEAR' : 'YEARS');
  g.save(); g.globalAlpha = a; const x = 64;
  haloText(g, 'TIME ON MARS', x, 128, { font: `600 26px ${FONT}`, track: 4 });
  const num = fmtNum(c.value), nw = haloText(g, num, x - 3, 214, { font: `400 92px ${FONT}` });
  haloText(g, unit, x + nw + 12, 214, { font: `500 40px ${FONT}`, track: 3 });
  g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(x, 240); g.lineTo(x + 470, 240); g.stroke();
  // Isotype gauges
  const air = GA.air(t), tmp = GA.temp(t), o2 = GA.o2(t);
  haloText(g, 'AIR', x, 290, { font: `600 22px ${FONT}`, track: 3 });
  iconGrid(g, x + 92, 266, 10, air / 10, 10, 30, (gg, X, Y, s, on) => { gg.fillStyle = on ? PAL.blue[1] : '#D9CFC0'; gg.fillRect(X - s * .3, Y - s * .4, s * .6, s * .8); gg.fillStyle = on ? PAL.blue[0] : '#E6DDCF'; gg.fillRect(X - s * .3, Y - s * .4, s * .6, s * .2); });
  haloText(g, `${air < 10 ? air.toFixed(1) : Math.round(air)}%`, x + 405, 290, { font: `500 24px ${FONT}` });
  haloText(g, 'TEMP', x, 336, { font: `600 22px ${FONT}`, track: 3 });
  haloText(g, `${tmp >= 0 ? '+' : '−'}${Math.abs(Math.round(tmp))} °C`, x + 92, 338, { font: `500 30px ${FONT}`, color: tmp >= 0 ? '#5E8C4A' : '#B3352B' });
  haloText(g, 'O₂', x, 382, { font: `600 22px ${FONT}`, track: 3 });
  iconGrid(g, x + 92, 360, 21, o2, 11, 27, (gg, X, Y, s, on) => { gg.save(); gg.translate(X, Y); gg.rotate(-.6); gg.beginPath(); gg.ellipse(0, 0, s * .38, s * .2, 0, 0, Math.PI * 2); gg.fillStyle = on ? PAL.green[1] : '#D9CFC0'; gg.fill(); gg.beginPath(); gg.ellipse(-s * .05, -s * .05, s * .28, s * .1, 0, 0, Math.PI * 2); gg.fillStyle = on ? PAL.green[0] : '#E6DDCF'; gg.fill(); gg.restore(); });
  haloText(g, `${o2 < 1 ? o2.toFixed(1) : Math.round(o2)}%`, x + 405, 382, { font: `500 24px ${FONT}` });
  g.restore();
  // big time jump
  for (const J of JUMPS) { const dt = t - J.t; if (dt < 0 || dt > 2.8) continue;
    const al = ss(seg(dt, 0, .1)) * (1 - ss(seg(dt, 2.5, 2.8))), sc = back(seg(dt, 0, .35), 2), [n, ...rest] = J.text.split(' ');
    g.save(); g.globalAlpha = al; g.translate(W - 60, 300); g.scale(sc, sc);
    haloText(g, n, 0, 0, { font: `500 ${n.length > 5 ? 92 : n.length > 4 ? 112 : 150}px ${FONT}`, align: 'right', hw: 14 });
    haloText(g, rest.join(' '), -8, 58, { font: `600 40px ${FONT}`, align: 'right', track: 10, hw: 10 });
    g.restore(); TEXTS_NOW.push({ id: 'jump' + J.t, text: J.text, x0: W - 600, y0: 160, x1: W - 40, y1: 380 }); }
}

function heroInset(iso, t) {
  const g = iso.g, [ax, ay] = iso.P(HERO[0], HERO[1], topAt(HERO[0], HERO[1], t) + 1.1), a = seg(t, RAMP1 - .2, RAMP1 + .9);
  { const ra = ss(seg(t, RAMP0 + 1.6, RAMP0 + 2.6)); if (ra > 0) { g.save(); g.strokeStyle = '#E8692E'; g.lineWidth = 3; g.setLineDash([8, 7]); g.lineDashOffset = -t * 30; g.beginPath(); g.ellipse(ax, ay + 18, 42 * ra, 24 * ra, 0, 0, Math.PI * 2); g.stroke(); g.restore(); } }
  inset(iso, ax, ay - 30, W / 2 + 120, 1130, 300, a, (gg, cx, cy, R) => {
    const sky = ERA.sky(t); gg.fillStyle = hex(mix('#F4E5D6', '#CFE2EE', sky)); gg.fillRect(cx - R, cy - R, R * 2, R * 2);
    gg.fillStyle = PAL.green[1]; gg.fillRect(cx - R, cy + R * .35, R * 2, R); gg.fillStyle = PAL.blue[0]; gg.fillRect(cx - R, cy + R * .22, R * 2, R * .14);
    const lift = ss(seg(t, HIT.helmet - .2, HIT.helmet + .4)), side = ss(seg(t, HIT.helmet + .45, HIT.helmet + 1.2)), br = Math.sin(seg(t, HIT.breath, HIT.breath + 1.6) * Math.PI);
    const s = R / 300, X = cx - 10 * s, Y = cy + 300 * s;
    const O = tri('#E8692E');
    gg.beginPath(); gg.moveTo(X - 150 * s, Y); gg.lineTo(X - 120 * s, Y - 190 * s - br * 6 * s); gg.lineTo(X + 120 * s, Y - 190 * s - br * 6 * s); gg.lineTo(X + 150 * s, Y); gg.closePath(); gg.fillStyle = O[1]; gg.fill();
    gg.beginPath(); gg.moveTo(X + 10 * s, Y); gg.lineTo(X + 10 * s, Y - 190 * s - br * 6 * s); gg.lineTo(X + 120 * s, Y - 190 * s - br * 6 * s); gg.lineTo(X + 150 * s, Y); gg.closePath(); gg.fillStyle = O[2]; gg.fill();
    gg.fillStyle = '#F4EFE6'; gg.fillRect(X - 70 * s, Y - 205 * s - br * 6 * s, 140 * s, 22 * s);
    const hy = Y - 280 * s - br * 6 * s;
    gg.beginPath(); gg.arc(X, hy, 62 * s, 0, Math.PI * 2); gg.fillStyle = '#C98B62'; gg.fill();
    gg.beginPath(); gg.arc(X + 18 * s, hy + 6 * s, 52 * s, -1.2, 1.9); gg.fillStyle = '#A9714E'; gg.fill();
    gg.beginPath(); gg.arc(X, hy - 8 * s, 64 * s, Math.PI * 1.02, Math.PI * 1.98); gg.fillStyle = '#2E2018'; gg.fill();
    const hx = X + lerp(0, 190, side) * s, hY = lerp(hy - lift * 140 * s, Y - 120 * s, side);
    gg.beginPath(); gg.arc(hx, hY, 92 * s, 0, Math.PI * 2); gg.fillStyle = '#F4EFE6'; gg.fill();
    gg.beginPath(); gg.arc(hx + 22 * s, hY + 8 * s, 80 * s, -1.3, 1.6); gg.fillStyle = '#DAD3C7'; gg.fill();
    if (side < .5) { gg.beginPath(); gg.ellipse(hx, hY + 6 * s, 62 * s, 46 * s, 0, 0, Math.PI * 2); gg.fillStyle = lift > .05 ? 'rgba(59,63,72,.0)' : '#3B3F48'; gg.fill(); }
    if (br > .05) { gg.strokeStyle = `rgba(46,37,34,${.5 * br})`; gg.lineWidth = 3 * s; for (let k = 0; k < 3; k++) { gg.beginPath(); gg.arc(X + 90 * s + k * 26 * s, hy + 10 * s, 14 * s + k * 9 * s, -.9, .9); gg.stroke(); } }
  });
  if (a > .6) TEXTS_NOW.push({ id: 'inset', text: '', x0: 0, y0: 0, x1: 0, y1: 0 });
}

function captions(g, t) {
  const card = (txt, t0, t1, y, size, id) => {
    if (t < t0 || t > t1) return;
    const a = ss(seg(t, t0, t0 + .2)) * (t1 >= DUR ? 1 : 1 - ss(seg(t, t1 - .2, t1)));
    g.save(); g.font = `500 ${size}px ${FONT}`; const words = txt.split(' '), lines = []; let cur = '';
    for (const w of words) { const s = cur ? cur + ' ' + w : w; if (g.measureText(s).width > 820 && cur) { lines.push(cur); cur = w; } else cur = s; } lines.push(cur);
    const lh = size * 1.25, tw = Math.max(...lines.map(l => g.measureText(l).width)), w = tw + 130, h = lines.length * lh + 46, x = (W - w) / 2;
    const bd = eo(seg(t, t0, t0 + .35)), wipe = ss(seg(t, t0 + .2, t0 + .6));
    g.globalAlpha = a; g.fillStyle = 'rgba(251,244,230,.96)'; g.beginPath(); g.roundRect(x, y, w, h, 10); g.fill();
    g.strokeStyle = INK; g.lineWidth = 2.5; g.beginPath(); g.roundRect(x, y, w, h, 10); g.setLineDash([2 * (w + h) * bd, 4000]); g.stroke(); g.setLineDash([]);
    const cx0 = x + 34, cy0 = y + h / 2; [['#E7DCC8', [[0, -12], [12, -5], [0, 2], [-12, -5]]], ['#C2683F', [[-12, -5], [0, 2], [0, 15], [-12, 8]]], ['#8C4A2E', [[0, 2], [12, -5], [12, 8], [0, 15]]]].forEach(([c, pts]) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(cx0 + p[0], cy0 + p[1]) : g.moveTo(cx0 + p[0], cy0 + p[1])); g.closePath(); g.fillStyle = c; g.fill(); });
    g.save(); g.beginPath(); g.rect(x + 60, y, (w - 60) * wipe, h); g.clip(); g.fillStyle = INK; g.textBaseline = 'alphabetic';
    lines.forEach((l, i) => g.fillText(l, x + 74, y + 23 + (i + .8) * lh)); g.restore(); g.restore();
    TEXTS_NOW.push({ id, text: txt, x0: x, y0: y, x1: x + w, y1: y + h });
  };
  const cp = CAPTIONS.find(c => t >= c.t0 && t < c.t1);
  if (cp) card(cp.text, cp.t0, cp.t1, H - 190 - 130, 42, cp.text);
  card(ENDCARD.text, ENDCARD.t0, DUR, 140, 56, 'end');
}

export const TEXTS = () => TEXTS_NOW.filter(x => x.text);
export function events() {
  const ev = [], add = (type, t, o = {}) => ev.push({ type, t: +t.toFixed(3), ...o });
  add('title', TITLE.t0); add('touchdown', HIT.touchdown); add('endcard', ENDCARD.t0);
  JUMPS.forEach(J => add('jump', J.t, { text: J.text }));
  DOME_T.forEach((t, i) => add('dome', t, { i })); PANEL_T.forEach((t, i) => add('panels', t, { i })); FACTORY_T.forEach((t, i) => add('factory', t, { i }));
  DOME_DOWN.forEach((t, i) => add('domeDown', t, { i }));
  [0, 1, 2].forEach(k => add('iceCrack', S.melt + .6 + k * BEAT * 2.5, { k }));
  add('rainStart', S.rain + 2.4 - BEAT); add('thunder', S.rain + 3.9); add('thunder', S.rain + 5.2, { far: 1 });
  const bins = new Map(); for (const T of TREES) bins.set(T.t0, (bins.get(T.t0) || 0) + 1);
  [...bins].sort((a, b) => a[0] - b[0]).forEach(([t, n]) => { if (t < DUR) add('trees', t, { n: n * 12 }); });
  HOUSES.forEach((Hh, i) => add('house', Hh.t0, { i }));
  PINS.forEach(p => add('pin', p.t0, { key: p.key }));
  add('rampDown', RAMP0, { d: RAMP1 - RAMP0 }); add('real', RAMP1); add('helmet', HIT.helmet); add('breath', HIT.breath); add('inset', RAMP1);
  return ev.sort((a, b) => a.t - b.t);
}
