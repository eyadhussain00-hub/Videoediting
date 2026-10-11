// What if we terraformed Mars? — Tilt-Shift Miniature version (1080×1920, 24 fps)
import * as THREE from 'three';
import { makePost } from './post.js';
import { track, hash } from '/core/lib.js';
import { DUR, S, BEAT, BAR, STEP, HIT, RAMP0, RAMP1, stepT, counterAt, rateAt, fmtRate, fmtNum, ERA, CAPTIONS, TITLE, ENDCARD, JUMPS,
  DOME_T, PANEL_T, FACTORY_T, DOME_DOWN, clamp, lerp, seg, ss } from './story.js';
import { buildWorld, PAD, BASE_C, groundY } from './world.js';

const QS = new URLSearchParams(location.search);
const W = innerWidth || 1080, H = innerHeight || 1920, K = W / 1080;
await document.fonts.load('800 80px Overpass'); await document.fonts.load('700 40px Overpass'); await document.fonts.load('600 40px "Overpass Mono"');

const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.NeutralToneMapping; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(44, W / H, .5, 12000);
const post = makePost(renderer, scene, camera, W, H, { ssaa: +(QS.get('ssaa') ?? 2), ao: QS.has('ao'), aoAmt: .6 });
post.bloom.strength = .2; post.bloom.threshold = 1.05; post.bloom.radius = .5;
Object.assign(post.grade.material.uniforms, {});
const world = buildWorld(scene);

// ---------- sky ----------
const skyMat = new THREE.ShaderMaterial({
  uniforms: { zen: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3() }, sunCol: { value: new THREE.Color() } },
  vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p.xyww; }`,
  fragmentShader: `varying vec3 vD; uniform vec3 zen, hor, sunDir, sunCol;
    void main(){ vec3 d = normalize(vD); float t = max(d.y, 0.); vec3 c = mix(hor, zen, pow(t, .5));
      float s = max(dot(d, normalize(sunDir)), 0.); c += sunCol * (pow(s, 10.) * .25 + pow(s, 200.) * 1.2);
      if (d.y < 0.) c = hor; gl_FragColor = vec4(c, 1.); }`,
  side: THREE.BackSide, depthWrite: false, fog: false,
});
const dome = new THREE.Mesh(new THREE.SphereGeometry(10000, 32, 16), skyMat); dome.frustumCulled = false; dome.renderOrder = -1; scene.add(dome);
const sun = new THREE.DirectionalLight('#fff', 3); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .5;
scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight('#fff', '#fff', 1); scene.add(hemi);
scene.fog = new THREE.FogExp2('#d8a77c', .0012);
const envScene = new THREE.Scene(); envScene.add(new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), skyMat));
const pm = new THREE.PMREMGenerator(renderer), envCache = new Map();
// palettes along ERA.sky (0 Mars butterscotch → 1 Earth blue)
const PAL = [
  { k: 0, zen: '#b98159', hor: '#e6bd92', fog: '#d6a67d', sun: '#fff1dc', sunI: 2.7, hs: '#e7b48a', hg: '#7a4a32', hi: 1.05 },
  { k: .3, zen: '#b48474', hor: '#e9c4a6', fog: '#dbb59c', sun: '#fff0e0', sunI: 2.9, hs: '#e2bba4', hg: '#7a5040', hi: 1.0 },
  { k: .52, zen: '#8b98a8', hor: '#cfc8c0', fog: '#bdbab5', sun: '#f4f1ea', sunI: 2.0, hs: '#c4c6c8', hg: '#62584c', hi: 1.15 },
  { k: .75, zen: '#6c93c4', hor: '#d9d8d2', fog: '#c9cfd4', sun: '#fff6e8', sunI: 3.4, hs: '#bdd0e2', hg: '#6c6a50', hi: .85 },
  { k: 1, zen: '#3f82d6', hor: '#cfe0ee', fog: '#c6d6e6', sun: '#fff8ec', sunI: 3.8, hs: '#b8cfe6', hg: '#5f6a45', hi: .75 },
];
const _a = new THREE.Color(), _b = new THREE.Color();
function pal(k) {
  let i = 0; while (i < PAL.length - 2 && k > PAL[i + 1].k) i++;
  const p0 = PAL[i], p1 = PAL[i + 1], u = clamp((k - p0.k) / (p1.k - p0.k)), c = f => _a.set(p0[f]).lerp(_b.set(p1[f]), u).clone();
  return { zen: c('zen'), hor: c('hor'), fog: c('fog'), sun: c('sun'), hs: c('hs'), hg: c('hg'), sunI: lerp(p0.sunI, p1.sunI, u), hi: lerp(p0.hi, p1.hi, u) };
}
const SUN_DIR = new THREE.Vector3(-.62, .62, .48).normalize();
function applySky(tq, focus, span) {
  const k = ERA.sky(tq), p = pal(k), cl = ERA.clouds(tq);
  skyMat.uniforms.zen.value.copy(p.zen); skyMat.uniforms.hor.value.copy(p.hor); skyMat.uniforms.sunDir.value.copy(SUN_DIR); skyMat.uniforms.sunCol.value.copy(p.sun).multiplyScalar(1 - cl * .8);
  sun.color.copy(p.sun); sun.intensity = p.sunI * (1 - cl * .55);
  sun.position.copy(focus).addScaledVector(SUN_DIR, 900); sun.target.position.copy(focus); sun.target.updateMatrixWorld();
  Object.assign(sun.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 100, far: 2400 }); sun.shadow.camera.updateProjectionMatrix();
  hemi.color.copy(p.hs); hemi.groundColor.copy(p.hg); hemi.intensity = p.hi * (1 + cl * .2);
  scene.fog.color.copy(p.fog); scene.fog.density = lerp(.00018, .0006, ERA.dust(tq)) + cl * .0002;
  const key = Math.round(k * 20) / 20;
  if (!envCache.has(key)) envCache.set(key, pm.fromScene(envScene, 0, .1, 200).texture);
  scene.environment = envCache.get(key); scene.environmentIntensity = .5;
}

// ---------- camera ----------
const FIG = world.FIG;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const CAM = track([
  [0, [-14, 178, 248, 12, -14, 40, 44]],
  [S.domes, [2, 168, 236, 12, -14, 44, 44]],
  [S.melt, [14, 136, 196, 4, -14, 54, 44]],
  [S.rain, [6, 250, 236, -4, -30, -18, 44]],
  [S.green, [-24, 262, 222, -30, -30, -30, 44]],
  [S.green + 1.8, [-80, 190, 170, -90, -22, -40, 44]],
  [S.forest, [-30, 168, 210, -26, -18, 4, 44]],
  [S.breathe, [10, 150, 232, 10, -14, 40, 44]],
  [RAMP1 - .01, [FIG.x - 16, FIG.y + 26, FIG.z + 36, FIG.x, FIG.y + 1, FIG.z, 12]],
]);
const CLOSE = (() => {                       // behind the figure, on the line from the figure to the lake
  const L = V(-8, -28, -48), dh = V(L.x - FIG.x, 0, L.z - FIG.z).normalize(), side = V(-dh.z, 0, dh.x);
  return { pos: FIG.clone().addScaledVector(dh, -10.5).addScaledVector(side, -1.6).add(V(0, 5.2, 0)), look: FIG.clone().addScaledVector(dh, 100).add(V(0, -16, 0)), fov: 44 };
})();
const FOCUS = track([      // what the band sits on: pad → domes → factories → lake → river → town → figure
  [0, [PAD.x, PAD.y + 3, PAD.z]], [S.domes - .3, [PAD.x, PAD.y + 3, PAD.z]], [S.domes + .3, [BASE_C[0], -10, BASE_C[1] + 4]],
  [S.warm - .1, [BASE_C[0], -10, BASE_C[1] + 4]], [S.warm + .6, [-46, -4, 80]], [S.melt - .1, [-46, -4, 80]], [S.melt + .8, [-10, -36, -50]],
  [S.green - .2, [-10, -36, -50]], [S.green + 1, [-110, -14, -48]], [S.forest - .2, [-90, -18, -42]], [S.forest + .8, [BASE_C[0], -11, BASE_C[1]]],
  [S.breathe, [BASE_C[0], -11, BASE_C[1]]], [S.breathe + 1.6, [FIG.x, FIG.y + 1, FIG.z]],
]);
function cam(t) {
  if (t >= RAMP1) {
    const u = seg(t, RAMP1, DUR), p = CLOSE.pos.clone().add(V(0, 0, -u * .6));
    return { pos: p, look: CLOSE.look, fov: CLOSE.fov, focus: V(FIG.x, FIG.y + 1.3, FIG.z), span: 40, close: true };
  }
  const c = CAM(t), f = FOCUS(t);
  return { pos: V(c[0], c[1], c[2]), look: V(c[3], c[4], c[5]), fov: c[6], focus: V(f[0], f[1], f[2]), span: t < S.melt ? 150 : 230, close: false };
}

// ---------- render ----------
const tmp = new THREE.Vector3();
function render(t) {
  const tq = stepT(t), C = cam(t);
  camera.position.copy(C.pos); camera.fov = C.fov; camera.near = C.close ? .15 : 2; camera.far = 12000; camera.updateProjectionMatrix(); camera.lookAt(C.look); camera.updateMatrixWorld();
  applySky(tq, C.close ? C.focus : C.focus, C.span);
  world.terrain(tq, t); world.boulders(tq); world.water(tq); world.lander(t < RAMP1 ? (t < S.crew ? t : tq) : t); world.base(tq); world.actors(tq, t); world.trees(tq); world.town(tq); world.sky(tq, C.focus); world.figure(t); world.tufts(t);
  // lens: physical focus + screen band on the subject
  const d = camera.position.distanceTo(C.focus); tmp.copy(C.focus).project(camera);
  const by = clamp(tmp.y * .5 + .5, .08, .92), dof = post.dof;
  dof.focus = d; dof.maxCoc = QS.has('nodof') ? 0 : 26 * K;
  if (!C.close) {
    const narrow = ss(seg(t, RAMP0 + 1, RAMP1));                                // band narrows on the figure
    Object.assign(dof.band, { y: by, w: lerp(.07, .028, narrow), amp: 30 * K, mix: .62, tilt: 0, pow: 1.25 }); dof.aper = d * lerp(18, 6, narrow);
  } else {
    const un = ss(seg(t, S.rise, S.rise + 2.4));                               // the lens un-tilts: the model becomes a real place
    Object.assign(dof.band, { y: by, w: lerp(.05, .7, un), amp: lerp(30, 0, un) * K, mix: lerp(.5, 0, un), tilt: 0, pow: 1.3 }); dof.aper = lerp(4.5, .25, un);
  }
  const gu = post.grade.material.uniforms; gu.sat.value = lerp(1.15, 1.28, ss(seg(ERA.green(tq), 0, 40))); gu.contrast.value = .3; gu.amt.value = .26; gu.warm.value = lerp(.12, .04, ERA.sky(tq)); gu.fade.value = 1;
  post.composer.render();
  hud(t, tq);
}

// ---------- HUD, captions, titles ----------
const ov = document.getElementById('ov'); ov.width = W; ov.height = H; ov.style.width = W + 'px'; ov.style.height = H + 'px';
const g = ov.getContext('2d');
const SLATE = 'rgba(24,29,34,.86)', ORANGE = '#ec6a2e', AMBER = '#ffc04a', GREEN = '#57e38f';
const px = v => v * K;
function rr(x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function wrap(text, maxW) { const words = text.split(' '), lines = []; let cur = ''; for (const w of words) { const s = cur ? cur + ' ' + w : w; if (g.measureText(s).width > maxW && cur) { lines.push(cur); cur = w; } else cur = s; } if (cur) lines.push(cur); return lines; }
function domeIcon(x, y, s, col) { g.fillStyle = col; g.beginPath(); g.arc(x, y, s, Math.PI, 0); g.closePath(); g.fill(); g.fillRect(x - s * 1.25, y, s * 2.5, s * .22); }
let TEXTS_NOW = [];
function hud(t, tq) {
  g.clearRect(0, 0, W, H); TEXTS_NOW = [];
  if (QS.has('nohud')) return;
  const endA = 1 - ss(seg(t, ENDCARD.t0 - .4, ENDCARD.t0 + .2));
  // counter panel (top-left), from 0.4 s
  if (t > TITLE.t1 - .2 && endA > 0) {
    const a = ss(seg(t, TITLE.t1 - .2, TITLE.t1 + .3)) * endA, c = counterAt(tq), r = rateAt(t);
    const unit = c.unit === 'DAY' ? (c.value === 1 ? 'DAY' : 'DAYS') : (c.value === 1 ? 'YEAR' : 'YEARS');
    g.save(); g.globalAlpha = a;
    const x = px(56), y = px(96), w = px(470), h = px(214);
    g.fillStyle = SLATE; rr(x, y, w, h, px(16)); g.fill(); g.fillStyle = ORANGE; rr(x, y, px(10), h, [px(16), 0, 0, px(16)]); g.fill();
    g.fillStyle = 'rgba(255,255,255,.72)'; g.font = `700 ${px(24)}px Overpass`; g.textBaseline = 'alphabetic'; g.letterSpacing = px(4) + 'px'; g.fillText('TIME ON MARS', x + px(36), y + px(48)); g.letterSpacing = '0px';
    g.fillStyle = '#fff'; g.font = `600 ${px(86)}px "Overpass Mono"`; const num = fmtNum(c.value); g.fillText(num, x + px(34), y + px(132));
    const nw = g.measureText(num).width; g.font = `700 ${px(28)}px Overpass`; g.fillText(unit, x + px(44) + nw, y + px(132));
    g.font = `700 ${px(24)}px "Overpass Mono"`; g.fillStyle = r > 1.5 ? AMBER : GREEN; const rs = fmtRate(r) + (r > 1.5 ? '  TIME-LAPSE' : ''); g.fillText(rs, x + px(36), y + px(182));
    g.restore();
    TEXTS_NOW.push({ id: 'counter', text: `TIME ON MARS ${num} ${unit} ${rs}`, x0: x, y0: y, x1: x + w, y1: y + h, static: true });
  }
  // big jump punch-in
  for (const J of JUMPS) {
    const dt = t - J.t; if (dt < 0 || dt > 2.4) continue;
    const a = ss(seg(dt, 0, .08)) * (1 - ss(seg(dt, 2.1, 2.4))), sc = 1 + .35 * Math.exp(-dt * 9) * Math.cos(dt * 22);
    const [num, ...rest] = J.text.split(' ');
    g.save(); g.globalAlpha = a; g.translate(W / 2, px(720)); g.scale(sc, sc); g.textAlign = 'center';
    g.shadowColor = 'rgba(10,14,18,.55)'; g.shadowBlur = px(30); g.shadowOffsetY = px(6);
    g.fillStyle = '#fff'; g.font = `800 ${px(200)}px Overpass`; g.fillText(num, 0, 0);
    g.font = `800 ${px(52)}px Overpass`; g.letterSpacing = px(12) + 'px'; g.fillText(rest.join(' '), px(6), px(74)); g.letterSpacing = '0px';
    g.restore();
    TEXTS_NOW.push({ id: 'jump' + J.t, text: J.text, x0: W / 2 - px(330), y0: px(540), x1: W / 2 + px(330), y1: px(820) });
  }
  // title placard (hook)
  const card = (txt, t0, t1, cy, big) => {
    if (t < t0 || t > t1) return;
    const a = ss(seg(t, t0, t0 + .35)) * (t1 >= DUR ? 1 : 1 - ss(seg(t, t1 - .35, t1)));
    g.save(); g.globalAlpha = a; g.font = `800 ${px(big)}px Overpass`; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    const lines = wrap(txt, px(860)), lh = px(big * 1.12), w = Math.max(...lines.map(l => g.measureText(l).width)) + px(110), h = lines.length * lh + px(84), y = cy - h / 2;
    const rise = (1 - ss(seg(t, t0, t0 + .45))) * px(26);
    g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = px(30); g.fillStyle = SLATE; rr(W / 2 - w / 2, y + rise, w, h, px(22)); g.fill(); g.shadowColor = 'transparent';
    g.fillStyle = ORANGE; rr(W / 2 - w / 2, y + rise, w, px(12), [px(22), px(22), 0, 0]); g.fill();
    g.fillStyle = '#fff'; lines.forEach((l, i) => g.fillText(l, W / 2, y + rise + px(56) + (i + .8) * lh - px(14)));
    g.restore();
    TEXTS_NOW.push({ id: txt, text: txt, x0: W / 2 - w / 2, y0: y, x1: W / 2 + w / 2, y1: y + h });
  };
  card(TITLE.text, TITLE.t0, TITLE.t1, px(560), 92);
  card(ENDCARD.text, ENDCARD.t0, DUR, px(470), 84);
  // captions: colony signage in the lower blur band
  const cp = CAPTIONS.find(c => t >= c.t0 && t < c.t1);
  if (cp) {
    const a = ss(seg(t, cp.t0, cp.t0 + .18)) * (1 - ss(seg(t, cp.t1 - .18, cp.t1)));
    g.save(); g.globalAlpha = a; g.font = `700 ${px(46)}px Overpass`; g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    const lines = wrap(cp.text, px(800)), lh = px(58), tw = Math.max(...lines.map(l => g.measureText(l).width)), w = tw + px(150), h = lines.length * lh + px(54);
    const x = (W - w) / 2, y = H - px(330) - h;
    g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = px(22); g.shadowOffsetY = px(4); g.fillStyle = SLATE; rr(x, y, w, h, px(14)); g.fill(); g.shadowColor = 'transparent';
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = px(2.5); rr(x + px(7), y + px(7), w - px(14), h - px(14), px(9)); g.stroke();
    g.fillStyle = ORANGE; rr(x + px(30), y + h / 2 - px(26), px(52), px(52), px(10)); g.fill(); domeIcon(x + px(56), y + h / 2 + px(8), px(15), '#fff');
    g.fillStyle = '#fff'; lines.forEach((l, i) => g.fillText(l, x + px(110), y + px(27) + (i + .78) * lh));
    g.restore();
    TEXTS_NOW.push({ id: cp.text, text: cp.text, x0: x, y0: y, x1: x + w, y1: y + h });
  }
}

// ---------- events for the score and the mix ----------
function events() {
  const ev = [], add = (type, t, o = {}) => ev.push({ type, t: +t.toFixed(3), ...o });
  add('title', TITLE.t0); add('touchdown', HIT.touchdown); add('endcard', ENDCARD.t0);
  JUMPS.forEach(J => add('jump', J.t, { text: J.text }));
  DOME_T.forEach((t, i) => add('dome', t, { i })); PANEL_T.forEach((t, i) => add('panels', t, { i })); FACTORY_T.forEach((t, i) => add('factory', t, { i }));
  DOME_DOWN.forEach((t, i) => add('domeDown', t, { i }));
  [0, 1, 2].forEach(k => add('iceCrack', S.melt + .6 + k * BEAT * 2.5, { k }));
  add('rainStart', S.rain + 2.4 - BEAT); add('thunder', S.rain + 3.9); add('thunder', S.rain + 5.2, { far: 1 });
  // tree and house pops, binned to 16ths
  const bins = new Map(); for (const T of world.TREES) bins.set(T.t0, (bins.get(T.t0) || 0) + 1);
  [...bins].sort((a, b) => a[0] - b[0]).forEach(([t, n]) => { if (t < DUR) add('trees', t, { n }); });
  world.HOUSES.forEach((Hh, i) => add('house', Hh.t0, { i }));
  add('rampDown', RAMP0, { d: RAMP1 - RAMP0 }); add('real', RAMP1); add('helmet', HIT.helmet); add('breath', HIT.breath); add('untilt', S.rise);
  return ev.sort((a, b) => a.t - b.t);
}

window.render = render; window.DUR = DUR;
window.TEXTS = () => TEXTS_NOW.filter(x => !x.static);
window.EV = QS.has('noev') ? [] : events();
render(parseFloat(QS.get('t') ?? '12'));
window.READY = true;
