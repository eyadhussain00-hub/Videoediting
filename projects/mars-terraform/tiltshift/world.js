// The crater: terrain (heightfield recoloured per era), ice/lake, river, base, factories, trees, town,
// clouds, rain and the hero figure. Every update is a pure function of the stepped world time.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, seg, ss, hash, mulberry, spring } from '/core/lib.js';
import { ERA, S, BEAT, BAR, DOME_T, PANEL_T, FACTORY_T, DOME_DOWN, HOUSE_T0, HOUSE_STEP, HIT, STEP } from './story.js';

// ---------- noise ----------
const h2 = (x, z) => { const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return n - Math.floor(n); };
function vn(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi, u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  return lerp(lerp(h2(xi, zi), h2(xi + 1, zi), u), lerp(h2(xi, zi + 1), h2(xi + 1, zi + 1), u), v);
}
const fbm = (x, z, o = 4) => { let a = 0, f = 1, s = 0, w = .5; for (let i = 0; i < o; i++) { a += vn(x * f, z * f) * w; s += w; f *= 2.03; w *= .5; } return a / s; };

// ---------- layout ----------
export const R = 165;                                     // crater rim radius (m)
export const PAD = new THREE.Vector3(18, 0, 64);          // landing pad (y filled in later)
export const BASE_C = [22, 66];
export const VIEW = [PAD.x - 13, PAD.z - 17];               // where the hero figure stands at the end
const RIVER = (() => {                                    // west highlands → rim notch → lake
  const P = [[-430, -150], [-330, -120], [-240, -95], [-175, -70], [-140, -55], [-110, -45], [-80, -38], [-55, -30]];
  const out = []; for (let i = 0; i < P.length - 1; i++) for (let k = 0; k < 12; k++) { const u = k / 12; out.push([lerp(P[i][0], P[i + 1][0], u), lerp(P[i][1], P[i + 1][1], u)]); }
  out.push(P[P.length - 1]);
  const s = [0]; for (let i = 1; i < out.length; i++) s.push(s[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]));
  return { P: out, s, L: s[s.length - 1] };
})();
const bedAt = s => lerp(4, -31, Math.pow(s / RIVER.L, 1.15));
function riverNear(x, z) {
  let best = 1e9, bs = 0; const P = RIVER.P;
  for (let i = 0; i < P.length - 1; i++) {
    const ax = P[i][0], az = P[i][1], bx = P[i + 1][0], bz = P[i + 1][1], dx = bx - ax, dz = bz - az;
    const u = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)), px = ax + dx * u - x, pz = az + dz * u - z, d = px * px + pz * pz;
    if (d < best) { best = d; bs = lerp(RIVER.s[i], RIVER.s[i + 1], u); }
  }
  return [Math.sqrt(best), bs];
}

const SMALL = [[-95, 40, 22, 5], [80, -60, 16, 4], [120, 70, 12, 3], [-40, -110, 14, 3.5], [210, 180, 40, 8], [-240, 120, 30, 6], [260, -120, 26, 5], [-60, 230, 34, 6], [150, -230, 20, 4], [55, 130, 9, 2.4]];
// Base height of the land (no river).
export function h0(x, z) {
  const r = Math.hypot(x, z);
  let h = 7 * fbm(x * .0035 + 3, z * .0035 + 7) + 2.2 * fbm(x * .018, z * .018) - 4;
  h += 17 * Math.exp(-Math.pow((r - R) / (r > R ? 70 : 24), 2));                 // rim
  const depth = lerp(18, 44, ss((95 - z) / 210));                                  // floor tilts: south high, north low
  h -= ss((R - r) / 68) * depth;
  h += 1.4 * (fbm(x * .06, z * .06) - .5) * (1 - .6 * ss((R - r) / 40));
  for (const [cx, cz, cr, cd] of SMALL) {                                          // small impact craters
    const q = Math.hypot(x - cx, z - cz) / cr; h += cd * (.55 * Math.exp(-Math.pow((q - 1) / .28, 2)) - ss((1 - q) / .55) * 1.0);
  }
  const db = Math.hypot(x - BASE_C[0], z - BASE_C[1]);                            // graded base platform
  const hb = -12.4; h = lerp(h, hb, ss((62 - db) / 30));
  return h;
}
PAD.y = h0(PAD.x, PAD.z);
export const groundY = (x, z) => h0(x, z);

// ---------- colours ----------
const C = s => new THREE.Color(s);
const COL = {
  rust: C('#a45d3b'), ochre: C('#bf8a5e'), basalt: C('#5b3628'), dune: C('#cf9a68'), frost: C('#efe9e2'), wetMul: .62,
  moss: C('#4d6230'), grass: C('#5e8c3e'), meadow: C('#86a052'), pave: C('#a59585'),
};

// ---------- water shader (ice → water) ----------
function waterMaterial() {
  const m = new THREE.MeshPhysicalMaterial({ color: '#8a6a52', roughness: .1, metalness: 0, envMapIntensity: 1.5, clearcoat: .6, clearcoatRoughness: .2 });
  m.userData.u = { uIce: { value: 1 }, uIceCol: { value: C('#e6f0f2') } };
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, m.userData.u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vW;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvW = (modelMatrix * vec4(transformed,1.)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vW; uniform float uIce; uniform vec3 uIceCol;
      float hh(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(hh(i), hh(i+vec2(1,0)), f.x), mix(hh(i+vec2(0,1)), hh(i+vec2(1,1)), f.x), f.y); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
      float n = vn2(vW.xz*.02)*.55 + vn2(vW.xz*.07)*.3 + vn2(vW.xz*.25)*.15;
      float im = smoothstep(1.02 - uIce*1.04 - .04, 1.02 - uIce*1.04 + .04, n);
      float rip = vn2(vW.xz*.35 + vec2(vW.z*.05, 0.))*.5 + vn2(vW.xz*1.3)*.5;
      diffuseColor.rgb *= .78 + .38 * rip;
      diffuseColor.rgb = mix(diffuseColor.rgb, uIceCol, im);`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, .55, im);');
  };
  return m;
}

// ---------- helpers ----------
const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V3 = new THREE.Vector3(), SC = new THREE.Vector3(), E = new THREE.Euler();
function inst(geo, mat, n, shadow = true) {
  const m = new THREE.InstancedMesh(geo, mat, n); m.castShadow = shadow; m.receiveShadow = true; m.count = 0;
  m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); return m;
}
function put(m, i, x, y, z, sx, sy, sz, ry = 0, rx = 0) {
  E.set(rx, ry, 0); Q.setFromEuler(E); M4.compose(V3.set(x, y, z), Q, SC.set(sx, sy, sz)); m.setMatrixAt(i, M4);
}
const pop = (t, t0, d = .55) => t < t0 ? 0 : Math.max(0, Math.min(1.25, spring((t - t0) / d * 1.6, 7, .38)));

// =====================================================================
export function buildWorld(scene) {
  const W = {};
  // ---- inner terrain ----
  const N = 300, SIZE = 820;
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, N, N); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, nv = pos.count;
  const col = new Float32Array(nv * 3); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const st = { h: new Float32Array(nv), d: new Float32Array(nv), bed: new Float32Array(nv), n1: new Float32Array(nv), n2: new Float32Array(nv), base: new Float32Array(nv), cs: new Float32Array(nv) };
  for (let i = 0; i < nv; i++) {
    const x = pos.getX(i), z = pos.getZ(i), h = h0(x, z), [d, s] = riverNear(x, z);
    st.h[i] = h; st.d[i] = d; st.bed[i] = bedAt(s); st.n1[i] = fbm(x * .03 + 11, z * .03 + 5); st.n2[i] = fbm(x * .011 + 2, z * .011 + 9, 3); st.cs[i] = .9 + .2 * h2(x * .37, z * .41);
    st.base[i] = ss((58 - Math.hypot(x - BASE_C[0], z - BASE_C[1])) / 14);
    pos.setY(i, h);
  }
  geo.computeVertexNormals();
  const terMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95, metalness: 0 });
  const ter = new THREE.Mesh(geo, terMat); ter.receiveShadow = true; ter.castShadow = true; scene.add(ter);
  // ---- outer ground (to the horizon) ----
  const og = new THREE.PlaneGeometry(9000, 9000, 120, 120); og.rotateX(-Math.PI / 2);
  const op = og.attributes.position, oc = new Float32Array(op.count * 3); og.setAttribute('color', new THREE.BufferAttribute(oc, 3));
  const on = new Float32Array(op.count);
  for (let i = 0; i < op.count; i++) { const x = op.getX(i), z = op.getZ(i), r = Math.max(Math.abs(x), Math.abs(z)); op.setY(i, r < 400 ? -60 : h0(x, z) + 26 * (fbm(x * .0012, z * .0012) - .4) * ss((r - 420) / 600) - .4); on[i] = fbm(x * .004, z * .004); }
  og.computeVertexNormals();
  const outer = new THREE.Mesh(og, terMat); outer.receiveShadow = true; scene.add(outer);

  let lastCarve = -1;
  W.terrain = (tq, t) => {
    const carve = ERA.river(tq);
    if (Math.abs(carve - lastCarve) > 1e-4) {
      for (let i = 0; i < nv; i++) {
        const d = st.d[i]; let h = st.h[i];
        if (d < 60 && carve > 0) { const pr = Math.exp(-Math.pow(d / 9, 2)) + .4 * Math.exp(-Math.pow(d / 28, 2)); h = lerp(h, Math.min(h, st.bed[i] - 1.5 + d * .08), clamp(carve * pr)); }
        pos.setY(i, h);
      }
      pos.needsUpdate = true; geo.computeVertexNormals(); lastCarve = carve;
    }
    const frost = ERA.frost(tq), wet = ERA.wet(tq), G = ERA.green(tq), lake = ERA.lake(tq), cl = ERA.clouds(tq), base = ss(seg(tq, S.crew, S.domes)), town = ss(seg(tq, S.forest + 2, S.breathe));
    const nrm = geo.attributes.normal, c = new THREE.Color(), wind = tq * 9;
    for (let i = 0; i < nv; i++) {
      const x = pos.getX(i), z = pos.getZ(i), h = pos.getY(i), ny = nrm.getY(i), n1 = st.n1[i], n2 = st.n2[i];
      const rock = ss((.93 - ny) / .12);
      c.copy(COL.rust).lerp(COL.ochre, n1 * .9).lerp(COL.basalt, rock * .75 + (1 - n2) * .2);
      const dn = Math.sin(x * .16 + z * .05 + n2 * 9); if (h < -14 && h > -40) c.lerp(COL.dune, ss((dn - .55) / .4) * .5);
      c.multiplyScalar(st.cs[i]);
      if (frost > 0) c.lerp(COL.frost, frost * ss((n1 * .6 + n2 * .4 - .5 + (1 - ny) * 1.6 - (h > -25 ? .3 : -.05)) / .2) * .55);
      const plaza = ss((15 - Math.hypot(x - PAD.x, z - PAD.z)) / 3);
      if (st.base[i] > 0 && base > 0) c.lerp(COL.pave, Math.max(st.base[i] * base * (1 - town), plaza * base) * .8);
      if (wet > 0) c.multiplyScalar(1 - wet * (1 - COL.wetMul));
      if (G > 0) {
        const above = Math.max(0, h - lake), near = carve > .3 ? Math.min(above, st.d[i] * .7 + Math.max(0, h - st.bed[i]) * .15) : above;
        let g = clamp((G - near + (n1 - .5) * 14) / 9) * (1 - rock * .65) * (1 - Math.max(st.base[i] * base * (1 - town), plaza) * .95);
        if (g > 0) { const k = ss(g * 2), k2 = ss(g * 2 - 1); c.lerp(COL.moss, k).lerp(n2 > .5 ? COL.meadow : COL.grass, k2 * .9); }
      }
      if (cl > 0) { const sh = ss((fbm((x - wind) * .006, z * .006 + 4, 3) - .48) / .1); c.multiplyScalar(1 - .42 * cl * sh); }
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    geo.attributes.color.needsUpdate = true;
    for (let i = 0; i < op.count; i++) {
      const g = clamp((G - 40) / 50) * ss((on[i] - .3) / .3);
      c.copy(COL.rust).lerp(COL.ochre, on[i]);
      if (frost > 0) c.lerp(COL.frost, frost * .35 * ss((on[i] - .55) / .1));
      if (wet > 0) c.multiplyScalar(1 - wet * .3);
      c.lerp(COL.grass, g * .85);
      oc[i * 3] = c.r; oc[i * 3 + 1] = c.g; oc[i * 3 + 2] = c.b;
    }
    og.attributes.color.needsUpdate = true;
  };

  // ---- boulders (model-like detail; they stay through every era) ----
  { const rnd = mulberry(909), B = [];
    for (let k = 0; k < 40000 && B.length < 2600; k++) {
      const x = (rnd() - .5) * 760, z = (rnd() - .5) * 760, h = h0(x, z), r = Math.hypot(x, z);
      const rimness = Math.exp(-Math.pow((r - R) / 34, 2)) * .9 + .06;
      if (rnd() > rimness || Math.hypot(x - BASE_C[0], z - BASE_C[1]) < 52 || riverNear(x, z)[0] < 8) continue;
      B.push([x, h, z, .35 + Math.pow(rnd(), 4) * 1.9, rnd() * 6]);
    }
    const bm = inst(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: '#6a4030', roughness: .9, flatShading: true }), B.length);
    B.forEach(([x, y, z, s, a], i) => { put(bm, i, x, y + s * .25, z, s, s * .7, s * 1.1, a, a * .5); bm.setColorAt(i, C(['#8a5539', '#74462f', '#9a6444'][i % 3])); });
    bm.count = B.length; bm.instanceMatrix.needsUpdate = true; scene.add(bm);
    let lastG = -1;
    W.boulders = tq => { const G = ERA.green(tq); if (Math.abs(G - lastG) < .5) return; lastG = G;
      B.forEach(([x, y, z, s, a], i) => { const sink = clamp((G - Math.max(0, y + 28)) / 25); put(bm, i, x, y + s * (.25 - sink * 1.05), z, s, s * .7, s * 1.1, a, a * .5); });
      bm.instanceMatrix.needsUpdate = true; };
  }

  // ---- lake / ice ----
  const wmat = waterMaterial();
  const lakeM = new THREE.Mesh(new THREE.PlaneGeometry(420, 420).rotateX(-Math.PI / 2), wmat); lakeM.receiveShadow = true; scene.add(lakeM);
  // river ribbon
  const rmat = waterMaterial(); rmat.userData.u.uIce.value = 0;
  const RP = RIVER.P, rg = new THREE.BufferGeometry(), rpos = new Float32Array(RP.length * 2 * 3), ridx = [];
  for (let i = 0; i < RP.length - 1; i++) { const a = i * 2; ridx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  rg.setIndex(ridx); rg.setAttribute('position', new THREE.BufferAttribute(rpos, 3));
  const riverM = new THREE.Mesh(rg, rmat); riverM.receiveShadow = true; scene.add(riverM);
  const wDeep = C('#7d5d47'), wMid = C('#4f6f74'), wBlue = C('#356a82');
  W.water = tq => {
    const ice = ERA.ice(tq), wv = ERA.water(tq), lv = ERA.lake(tq);
    lakeM.position.y = lv; wmat.userData.u.uIce.value = ice;
    const wc = wv < .5 ? wDeep.clone().lerp(wMid, wv * 2) : wMid.clone().lerp(wBlue, wv * 2 - 1);
    wmat.color.copy(wc); rmat.color.copy(wc);
    const carve = ERA.river(tq), vis = ss((carve - .25) / .35), w = 2.2 + 3.2 * carve;
    for (let i = 0; i < RP.length; i++) {
      const j = Math.min(i, RP.length - 2), dx = RP[j + 1][0] - RP[j][0], dz = RP[j + 1][1] - RP[j][1], L = Math.hypot(dx, dz), nx = -dz / L * w, nz = dx / L * w;
      const y = lerp(-80, bedAt(RIVER.s[i]) - .2, vis);
      rpos.set([RP[i][0] + nx, y, RP[i][1] + nz, RP[i][0] - nx, y, RP[i][1] - nz], i * 6);
    }
    rg.attributes.position.needsUpdate = true; rg.computeVertexNormals(); rg.computeBoundingSphere();
    riverM.visible = vis > .01;
  };

  // ---- lander (stays as the monument) ----
  const metal = new THREE.MeshStandardMaterial({ color: '#e8e4dc', roughness: .45, metalness: .35 });
  const gold = new THREE.MeshStandardMaterial({ color: '#c9a24a', roughness: .35, metalness: .8 });
  const dark = new THREE.MeshStandardMaterial({ color: '#2b2d31', roughness: .7 });
  const orange = new THREE.MeshStandardMaterial({ color: '#e8642c', roughness: .6 });
  const lander = new THREE.Group();
  { const body = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.9, 3.2, 6), gold); body.position.y = 3.4; lander.add(body);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 2.3, 1.8, 6), metal); top.position.y = 5.9; lander.add(top);
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(2.95, 2.95, .45, 6), orange); stripe.position.y = 2.1; lander.add(stripe);
    const dish = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8, 0, 6.3, 0, .9), metal); dish.scale.set(1.2, .5, 1.2); dish.position.set(.6, 7.2, 0); dish.rotation.z = -.5; lander.add(dish);
    for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + .4, leg = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, 4.2, 6), metal);
      leg.position.set(Math.cos(a) * 3.2, 1.6, Math.sin(a) * 3.2); leg.rotation.set(Math.sin(a) * .55, 0, -Math.cos(a) * .55); lander.add(leg);
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(.7, .8, .25, 10), metal); foot.position.set(Math.cos(a) * 4.3, .12, Math.sin(a) * 4.3); lander.add(foot); }
    lander.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  }
  lander.position.copy(PAD); scene.add(lander);
  const flameMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 2.2, .9), transparent: true, opacity: .9, depthWrite: false });
  const flame = new THREE.Mesh(new THREE.ConeGeometry(1.6, 9, 16, 1, true).translate(0, -4.5, 0).rotateX(Math.PI), flameMat); flame.rotation.x = Math.PI; scene.add(flame);
  const padM = new THREE.Mesh(new THREE.CylinderGeometry(11, 11.5, .5, 40), new THREE.MeshStandardMaterial({ color: '#3d3a38', roughness: .9 })); padM.position.copy(PAD).y += .05; padM.receiveShadow = true; scene.add(padM);
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 8, 1.2, 6), new THREE.MeshStandardMaterial({ color: '#b9b2a6', roughness: .8 })); plinth.position.copy(PAD); plinth.receiveShadow = plinth.castShadow = true; scene.add(plinth);
  // dust ring at touchdown
  const dustMat = new THREE.MeshStandardMaterial({ color: '#c98f62', roughness: 1, transparent: true, opacity: .6, depthWrite: false });
  const dust = inst(new THREE.IcosahedronGeometry(1, 1), dustMat, 48, false); scene.add(dust);
  W.lander = (t) => {
    const td = HIT.touchdown, u = seg(t, .3, td), alt = t < td ? Math.pow(1 - u, 1.8) * 75 : 0;
    const mon = ss(seg(t, S.forest + BEAT * 6, S.forest + BEAT * 8));     // plinth rises under it in the town era
    lander.position.set(PAD.x, PAD.y + .25 + alt + mon * 1.2, PAD.z);
    plinth.scale.set(1, Math.max(.001, mon), 1); plinth.position.y = PAD.y + .6 * mon; padM.visible = mon < 1;
    const burn = t < td + .15 && t > .3;
    flame.visible = burn; flame.position.set(PAD.x, lander.position.y + 1.6, PAD.z);
    const fl = .8 + .25 * Math.sin(t * 61) * Math.sin(t * 23); flame.scale.set(fl * (1 + u), (1 + u * .6) * fl, fl * (1 + u)); flameMat.opacity = .85;
    // dust: kicked up during the last seconds of descent, a ring at touchdown
    let n = 0; const dt = t - td;
    if (t > td - 1.2 && dt < 4) {
      for (let i = 0; i < 48; i++) {
        const a = i / 48 * Math.PI * 2 + hash(i) * .3, sp = 9 + hash(i + 9) * 6, age = Math.max(0, dt + 1.2 - hash(i + 3) * .6);
        const r = 3 + (dt > 0 ? sp * (1 - Math.exp(-dt * 1.4)) : (1 - (td - t) / 1.2) * 4), s = (1.2 + hash(i + 5) * 1.6) * (1 + Math.max(0, dt) * .5);
        const y = PAD.y + .8 + s * .4 + Math.max(0, dt) * .6;
        put(dust, n++, PAD.x + Math.cos(a) * r, y, PAD.z + Math.sin(a) * r, s, s * .55, s);
      }
      dustMat.opacity = .55 * (1 - ss(seg(dt, 1, 4)));
    }
    dust.count = n; dust.instanceMatrix.needsUpdate = true;
  };

  // ---- domes, corridors, panels, factories ----
  const domeMat = new THREE.MeshStandardMaterial({ color: '#e9eef0', roughness: .2, metalness: .15, envMapIntensity: 1.4 });
  const DOMES = [[22, 74, 9], [40, 60, 7], [4, 58, 7.5], [30, 46, 6], [8, 84, 6], [46, 80, 6.5], [-6, 72, 5.5]];
  const domes = inst(new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), domeMat, DOMES.length); scene.add(domes);
  const ringM = inst(new THREE.CylinderGeometry(1, 1, 1, 28), new THREE.MeshStandardMaterial({ color: '#6c6f74', roughness: .6 }), DOMES.length); scene.add(ringM);
  const corr = inst(new THREE.BoxGeometry(1, 1, 1), metal, DOMES.length); scene.add(corr);
  const panelMat = new THREE.MeshStandardMaterial({ color: '#1f2c4a', roughness: .25, metalness: .6 });
  const PANELS = []; for (let r = 0; r < 4; r++) for (let k = 0; k < 9; k++) PANELS.push([58 + k * 4.2, 92 + r * 5.5, r]);
  const panels = inst(new THREE.BoxGeometry(3.6, .15, 2.6), panelMat, PANELS.length); scene.add(panels);
  const factMat = new THREE.MeshStandardMaterial({ color: '#cfc7bb', roughness: .7 }), chimMat = new THREE.MeshStandardMaterial({ color: '#8a8f96', roughness: .5, metalness: .3 });
  const FACT = [[-46, 82, 0], [-62, 58, .5], [-30, 104, -.3]];
  const fbox = inst(new THREE.BoxGeometry(1, 1, 1), factMat, 6), fchim = inst(new THREE.CylinderGeometry(1, 1.2, 1, 12), chimMat, 9); scene.add(fbox, fchim);
  const plumeMat = new THREE.MeshStandardMaterial({ color: '#f2ede6', roughness: 1, transparent: true, opacity: .55, depthWrite: false });
  const plumes = inst(new THREE.IcosahedronGeometry(1, 1), plumeMat, 9 * 14, false); scene.add(plumes);
  W.base = (tq) => {
    let n = 0;
    DOMES.forEach(([x, z, r], i) => {
      const up = pop(tq, DOME_T[i]), down = 1 - ss(seg(tq, DOME_DOWN[i], DOME_DOWN[i] + BEAT * 1.5)), s = r * up * down;
      if (s < .01) return;
      const y = groundY(x, z) + .2; put(domes, n, x, y + .6, z, s, s * .92, s); put(ringM, n, x, y + .3, z, s * 1.04, .9, s * 1.04);
      const [x2, z2] = i ? DOMES[0] : DOMES[1], dx = x2 - x, dz = z2 - z, L = Math.hypot(dx, dz);
      put(corr, n, (x + x2) / 2, y + 1.5, (z + z2) / 2, L, 2.2 * Math.min(1, up) * down, 2.4, -Math.atan2(dz, dx)); n++;
    });
    domes.count = ringM.count = corr.count = n; domes.instanceMatrix.needsUpdate = ringM.instanceMatrix.needsUpdate = corr.instanceMatrix.needsUpdate = true;
    let p = 0; const pd = 1 - ss(seg(tq, S.forest + BAR, S.forest + BAR * 2));
    PANELS.forEach(([x, z, r], i) => { const s = pop(tq, PANEL_T[r] + (i % 9) * STEP * .5, .4) * pd; if (s < .01) return; put(panels, p++, x, groundY(x, z) + 1.1, z, s, 1, s, 0, -.35); });
    panels.count = p; panels.instanceMatrix.needsUpdate = true;
    let fb = 0, fc = 0, pl = 0; const fd = 1 - ss(seg(tq, S.green + BAR * 2, S.forest));
    const pa = ERA.plumes(tq);
    FACT.forEach(([x, z, ry], i) => {
      const s = pop(tq, FACTORY_T[i]) * fd; if (s < .01) return; const y = groundY(x, z);
      put(fbox, fb++, x, y + 4 * s, z, 22, 8 * s, 12, ry); put(fbox, fb++, x + Math.cos(ry) * 14, y + 2.5 * s, z - Math.sin(ry) * 14, 8, 5 * s, 9, ry);
      for (let k = 0; k < 3; k++) {
        const cx = x + Math.cos(ry) * (-7 + k * 7), cz = z - Math.sin(ry) * (-7 + k * 7), ch = 22 * s;
        put(fchim, fc++, cx, y + ch / 2, cz, 1.3, ch, 1.3);
        if (pa > 0 && s > .9) for (let j = 0; j < 14; j++) {     // puffs rise and swell; stepped world time
          const ph = (tq * .9 + j / 14 + hash(i * 7 + k)) % 1, a = ph * 34, r = 1.6 + ph * 7;
          put(plumes, pl++, cx + a * .55 + Math.sin(j + k) * 1.5, y + ch + 1 + a, cz - a * .2, r, r * .8, r);
        }
      }
    });
    plumeMat.opacity = .5 * pa;
    fbox.count = fb; fchim.count = fc; plumes.count = pl; fbox.instanceMatrix.needsUpdate = fchim.instanceMatrix.needsUpdate = plumes.instanceMatrix.needsUpdate = true;
  };

  // ---- rovers and people ----
  const rover = inst(new THREE.BoxGeometry(3.2, 1.6, 2), new THREE.MeshStandardMaterial({ color: '#f4f1ea', roughness: .5 }), 6); scene.add(rover);
  const suit = inst(new THREE.CapsuleGeometry(.32, 1.1, 4, 8), new THREE.MeshStandardMaterial({ color: '#f6f4ef', roughness: .55 }), 80); scene.add(suit);
  const casual = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .6 });
  const ROV = [[30, 28, 0], [26, 22, 2.1], [40, 36, 4]];
  W.actors = (tq, t) => {
    let n = 0; const on = tq >= S.crew, end = tq >= S.real;
    if (on && !end) ROV.forEach(([rx, rz, ph], i) => {
      const a = tq * .55 + ph, x = BASE_C[0] + Math.cos(a) * rx, z = BASE_C[1] + Math.sin(a) * rz;
      put(rover, n++, x, groundY(x, z) + 1.1, z, 1, 1, 1, -a - Math.PI / 2);
    });
    rover.count = n; rover.instanceMatrix.needsUpdate = true;
    let p = 0; const crowd = tq < S.domes ? 8 : tq < S.forest ? 24 : 60;
    if (on && !end) for (let i = 0; i < crowd; i++) {
      const sd = i * 13.7, a = hash(sd) * 6.28 + tq * (.3 + hash(sd + 1) * .5) * (hash(sd + 2) > .5 ? 1 : -1), r = 10 + hash(sd + 3) * (tq < S.forest ? 34 : 62);
      const x = BASE_C[0] + Math.cos(a) * r, z = BASE_C[1] + Math.sin(a) * r * .8;
      if (Math.hypot(x - PAD.x, z - PAD.z) < 9) continue;
      put(suit, p++, x, groundY(x, z) + .9, z, 1, 1, 1);
    }
    suit.count = p; suit.instanceMatrix.needsUpdate = true;
  };

  // ---- trees ----
  const pineG = new THREE.ConeGeometry(1, 2.6, 7).translate(0, 1.9, 0), leafG = new THREE.IcosahedronGeometry(1.25, 0).translate(0, 2.3, 0), trunkG = new THREE.CylinderGeometry(.18, .24, 1.4, 5).translate(0, .7, 0);
  const pineM = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .85, flatShading: true }), leafM = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .85, flatShading: true });
  const TREES = [];
  { const rnd = mulberry(77);
    for (let k = 0; k < 16000 && TREES.length < 4200; k++) {
      const x = (rnd() - .5) * 700, z = (rnd() - .5) * 640 - 30, h = h0(x, z);
      if (h < -27.2 || Math.hypot(x - BASE_C[0], z - BASE_C[1]) < 60 || Math.hypot(x, z) > 330) continue;
      const [d] = riverNear(x, z); if (d < 9) continue;
      const above = Math.max(0, h + 28), near = Math.min(above, d * .7), slope = Math.abs(h0(x + 3, z) - h) + Math.abs(h0(x, z + 3) - h); if (slope > 4.2) continue;
      if (fbm(x * .02 + 40, z * .02) < .38) continue;
      if (Math.abs(x - VIEW[0]) < 16 && z < VIEW[1] && z > VIEW[1] - 60) continue;   // keep the end shot's view open
      TREES.push({ x, z, y: h, near: near + (hash(k) - .5) * 10, s: 1.1 + rnd() * 1.3, pine: rnd() < .45, c: rnd() });
    }
  }
  const pines = inst(pineG, pineM, TREES.length), leaves = inst(leafG, leafM, TREES.length), trunks = inst(trunkG, new THREE.MeshStandardMaterial({ color: '#5a4030', roughness: .9 }), TREES.length);
  scene.add(pines, leaves, trunks);
  const tc = new THREE.Color(), pinePal = ['#2f5a33', '#3b6b3a', '#2a4f30'].map(C), leafPal = ['#5c9a3e', '#77a948', '#4d8a3a', '#8fb24d'].map(C);
  TREES.forEach(T => { T.t0 = 0; });
  // spawn time: when the green front reaches the tree (+ grow time), quantised to 16ths
  const greenInv = (near) => { for (let t = S.green; t < 60; t += STEP) if (ERA.green(t) - 18 > near) return t; return 99; };
  TREES.forEach(T => { T.t0 = Math.ceil(greenInv(T.near) / STEP) * STEP; });
  W.TREES = TREES;
  W.trees = (tq) => {
    let a = 0, b = 0, c = 0;
    for (const T of TREES) {
      if (tq < T.t0) continue;
      const g = Math.min(1, pop(tq, T.t0, .45)) * T.s, y = T.y - .2;
      if (T.pine) { put(pines, a, T.x, y, T.z, g * 1.1, g * 1.25, g * 1.1); tc.copy(pinePal[Math.floor(T.c * 3)]); pines.setColorAt(a++, tc); }
      else { put(leaves, b, T.x, y, T.z, g * 1.2, g * 1.05, g * 1.2, T.c * 6); tc.copy(leafPal[Math.floor(T.c * 4)]); leaves.setColorAt(b++, tc); }
      put(trunks, c++, T.x, y, T.z, g, g, g);
    }
    pines.count = a; leaves.count = b; trunks.count = c;
    for (const m of [pines, leaves, trunks]) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
  };

  // ---- town (replaces the domes) ----
  const HOUSES = [];
  { const rnd = mulberry(5), pal = ['#efe6d6', '#e9d3b8', '#d98e5f', '#f2efe8', '#c9d6d8', '#e7c27a'];
    for (let k = 0; k < 600 && HOUSES.length < 40; k++) {
      const a = rnd() * 6.28, r = 12 + rnd() * 46, x = BASE_C[0] + Math.cos(a) * r, z = BASE_C[1] + Math.sin(a) * r * .85;
      if (Math.hypot(x - PAD.x, z - PAD.z) < 17 || (Math.abs(x - VIEW[0]) < 14 && z < VIEW[1] + 14)) continue;
      if (HOUSES.some(H => Math.hypot(H.x - x, H.z - z) < 8)) continue;
      HOUSES.push({ x, z, w: 3.6 + rnd() * 2.6, d: 3.2 + rnd() * 2, h: 2.6 + rnd() * 2.4, ry: Math.round(rnd() * 4) * Math.PI / 2 + (rnd() - .5) * .2, wall: C(pal[Math.floor(rnd() * pal.length)]), roof: C(['#a8492f', '#7a4b3a', '#4f5a62', '#b5643a'][Math.floor(rnd() * 4)]) });
    }
    HOUSES.forEach((H, i) => { H.t0 = HOUSE_T0 + i * HOUSE_STEP * .5; });
  }
  W.HOUSES = HOUSES;
  const wallG = new THREE.BoxGeometry(1, 1, 1).translate(0, .5, 0), roofG = new THREE.CylinderGeometry(.62, .62, 1, 3).rotateZ(Math.PI / 2).rotateX(Math.PI / 2).rotateY(Math.PI / 2).translate(0, .25, 0);
  const walls = inst(wallG, new THREE.MeshStandardMaterial({ color: '#fff', roughness: .8 }), HOUSES.length), roofs = inst(roofG, new THREE.MeshStandardMaterial({ color: '#fff', roughness: .7 }), HOUSES.length);
  scene.add(walls, roofs);
  W.town = (tq) => {
    let n = 0;
    for (const H of HOUSES) {
      const s = pop(tq, H.t0, .5); if (s < .01) continue; const y = groundY(H.x, H.z) - .1;
      put(walls, n, H.x, y, H.z, H.w, H.h * s, H.d, H.ry); walls.setColorAt(n, H.wall);
      put(roofs, n, H.x, y + H.h * s, H.z, H.w * 1.08, 1.9 * s, H.d * 1.12, H.ry); roofs.setColorAt(n, H.roof); n++;
    }
    walls.count = roofs.count = n;
    for (const m of [walls, roofs]) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
  };

  // ---- clouds and rain ----
  const cloudMat = new THREE.MeshStandardMaterial({ color: '#f4f2ee', roughness: 1, transparent: true, opacity: .85, depthWrite: false });
  const clouds = inst(new THREE.IcosahedronGeometry(1, 2), cloudMat, 90, false); scene.add(clouds);
  const CL = []; { const rnd = mulberry(31); for (let k = 0; k < 18; k++) { const cx = (rnd() - .5) * 1600, cz = -250 - rnd() * 900; for (let j = 0; j < 5; j++) CL.push([cx + (rnd() - .5) * 90, 120 + rnd() * 40, cz + (rnd() - .5) * 60, 30 + rnd() * 40]); } }
  const NR = 2200, rainG = new THREE.BufferGeometry(), rp = new Float32Array(NR * 6); rainG.setAttribute('position', new THREE.BufferAttribute(rp, 3));
  const rainMat = new THREE.LineBasicMaterial({ color: '#dfe7ee', transparent: true, opacity: .5, depthWrite: false });
  const rainL = new THREE.LineSegments(rainG, rainMat); rainL.frustumCulled = false; scene.add(rainL);
  W.sky = (tq, focus) => {
    const cl = ERA.clouds(tq); let n = 0;
    if (cl > .01) CL.forEach(([x, y, z, s], i) => { const dx = (tq - S.rain) * 22; put(clouds, n++, x + dx, y, z, s * (.4 + .6 * cl), s * .35 * (.4 + .6 * cl), s * .8 * (.4 + .6 * cl)); });
    cloudMat.opacity = .8 * Math.min(1, cl * 1.5); clouds.count = n; clouds.instanceMatrix.needsUpdate = true;
    const rn = ERA.rain(tq); rainL.visible = rn > .01; rainMat.opacity = .45 * rn;
    if (rn > .01) { const rnd = mulberry(1 + Math.floor(tq / STEP));
      for (let i = 0; i < NR; i++) { const x = focus.x + (rnd() - .5) * 360, z = focus.z + (rnd() - .5) * 300, y = focus.y - 10 + rnd() * 90; rp.set([x, y, z, x - .8, y - 7, z + .3], i * 6); }
      rainG.attributes.position.needsUpdate = true; }
  };

  // ---- grass tufts and flowers near the end shot ----
  { const rnd = mulberry(12), N = 5000, tg = new THREE.ConeGeometry(.07, .26, 4).translate(0, .12, 0);
    const tufts = inst(tg, new THREE.MeshStandardMaterial({ color: '#fff', roughness: .9 }), N, false); let n = 0; const pal = ['#4f7a34', '#5f8a3c', '#6f9a44', '#d8c45a', '#e9b8c8'].map(C);
    for (let k = 0; k < N; k++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * 34, x = VIEW[0] + Math.cos(a) * r, z = VIEW[1] + 6 + Math.sin(a) * r;
      if (Math.hypot(x - PAD.x, z - PAD.z) < 15) continue; const s = .6 + rnd() * .9; put(tufts, n, x, groundY(x, z) - .05, z, s, s * (.8 + rnd()), s, rnd() * 6, (rnd() - .5) * .4); tufts.setColorAt(n++, pal[rnd() < .08 ? 3 + (rnd() < .5 ? 1 : 0) : Math.floor(rnd() * 3)]); }
    tufts.count = n; tufts.instanceMatrix.needsUpdate = true; scene.add(tufts);
    W.tufts = t => { tufts.visible = t >= S.real - .5; };
  }

  // ---- the hero figure (end) ----
  const fig = new THREE.Group();
  const suitM = new THREE.MeshPhysicalMaterial({ color: '#f1efea', roughness: .6, sheen: .8, sheenRoughness: .5, sheenColor: new THREE.Color('#ffffff') }), visor = new THREE.MeshStandardMaterial({ color: '#2a2a30', roughness: .08, metalness: .9 });
  const skin = new THREE.MeshStandardMaterial({ color: '#b07a55', roughness: .6 }), hair = new THREE.MeshStandardMaterial({ color: '#2a1d16', roughness: .8 });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.24, .55, 6, 12), suitM); torso.position.y = 1.18; fig.add(torso);
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(.255, .255, .07, 16), orange); stripe.position.y = 1.36; fig.add(stripe);
  const pack = new THREE.Mesh(new THREE.BoxGeometry(.42, .55, .2), suitM); pack.position.set(0, 1.28, .26); fig.add(pack);
  for (const sx of [-1, 1]) { const leg = new THREE.Mesh(new THREE.CapsuleGeometry(.1, .62, 4, 8), suitM); leg.position.set(sx * .11, .42, 0); fig.add(leg); }
  const head = new THREE.Group(); head.position.y = 1.72; fig.add(head);
  const face = new THREE.Mesh(new THREE.SphereGeometry(.12, 16, 12), skin); face.scale.set(1, 1.12, 1); head.add(face);
  const hairM = new THREE.Mesh(new THREE.SphereGeometry(.126, 16, 12, 0, Math.PI * 2, 0, 1.7), hair); hairM.rotation.x = .35; hairM.position.z = .012; head.add(hairM);
  const helmet = new THREE.Group(); fig.add(helmet);
  const shell = new THREE.Mesh(new THREE.SphereGeometry(.2, 20, 14), suitM); helmet.add(shell);
  const vis = new THREE.Mesh(new THREE.SphereGeometry(.205, 20, 14, -Math.PI / 2 - 1.1, 2.2, .7, 1.3), visor); helmet.add(vis);
  const arms = [-1, 1].map(sx => { const g = new THREE.Group(); g.position.set(sx * .3, 1.45, 0); const a = new THREE.Mesh(new THREE.CapsuleGeometry(.075, .5, 4, 8), suitM); a.position.y = -.3; g.add(a); const hnd = new THREE.Mesh(new THREE.SphereGeometry(.08, 10, 8), suitM); hnd.position.y = -.62; g.add(hnd); fig.add(g); return g; });
  fig.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(fig);
  W.FIG = new THREE.Vector3(VIEW[0], 0, VIEW[1]); W.FIG.y = groundY(W.FIG.x, W.FIG.z);
  W.figure = (t) => {
    fig.visible = t >= S.forest; fig.position.copy(W.FIG); fig.rotation.y = .25;   // front is -z: faces north-ish, toward the lake, back to the camera
    // helmet off: anticipation (arms up to the helmet) → lift → lower to the side, held at the hip
    const h0t = HIT.helmet, a1 = ss(seg(t, h0t - .9, h0t - .25)), lift = ss(seg(t, h0t - .2, h0t + .35)), lower = ss(seg(t, h0t + .45, h0t + 1.3));
    const breath = Math.sin(seg(t, HIT.breath, HIT.breath + 1.6) * Math.PI) * .03;
    const up = a1 * (1 - lower);
    arms.forEach((g, i) => { const sx = i ? 1 : -1, hold = i ? 0 : lower;   // left arm keeps the helmet at the hip
      g.rotation.x = up * 2.3 + hold * .35; g.rotation.z = -sx * up * .35 + sx * .1 - hold * .25; });
    const hy = 1.72 + lift * .24 * (1 - lower), side = lower;
    helmet.position.set(lerp(0, -.38, side), lerp(hy, 1.0, side), lerp(0, -.08, side)); helmet.rotation.z = side * .6;
    torso.scale.set(1 + breath, 1 + breath * .6, 1 + breath); head.position.y = 1.72 + breath * .8;
    head.visible = lift > .02;
  };
  return W;
}
