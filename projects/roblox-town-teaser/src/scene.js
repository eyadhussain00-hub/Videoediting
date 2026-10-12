// Plot Town teaser: every frame is a pure function of t (seconds). window.setup(scale) then window.drawFrame(t).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// ---------- helpers ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, p) => a + (b - a) * p;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const smooth = x => x * x * (3 - 2 * x);
const easeOut = x => 1 - Math.pow(1 - x, 3);
const easeIn = x => x * x;
const easeInOut = x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const backOut = (x, s = 1.9) => (x <= 0 ? 0 : 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2));
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hash2 = (x, z) => { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); };
const col = h => new THREE.Color(h);

const INK = '#1D1A39';
const ROOFS = ['#FF6B5B', '#2EC4B6', '#FFC845', '#4D96FF', '#9B5DE5', '#FF8FB1', '#FF9F43'];
const WALLS = ['#FFF6E6', '#FFE9D1', '#F4F0FF', '#E8F7F0', '#FFF0F3', '#FFFFFF'];
const TOWERS = ['#9FC7EA', '#7FB0E0', '#F2C9A0', '#8ED8C8', '#B9A6EE', '#E9EEF5'];
const FW = ['#FFC845', '#FF6B5B', '#2EC4B6', '#FF8FB1', '#B98BFF', '#6FB2FF', '#FFFFFF'];

let B, W, H, S, renderer, composer, bloom, scene, camera, sky, fog;
let hemi, sun, houses, roofs, homeIdx, towersM, umbrellas, poles, palms, marker, ring, fw, fwData;
let houseList, towerList, beachList, houseMat, towerMat;
const HOME = { x: 2, z: 2 };
const DT = { x: -12.5, z: -7.5 };          // downtown centre
const LAND = 38, SAND = 41, GRID = 43;

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4; return tx;
}

function buildWorld() {
  scene = new THREE.Scene();
  fog = new THREE.Fog(0xCFEBFF, 50, 400); scene.fog = fog;

  // sky dome (follows camera)
  sky = new THREE.Mesh(new THREE.SphereGeometry(3000, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: col('#5BB5F0') }, hor: { value: col('#CFEBFF') }, night: { value: 0 } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform vec3 top; uniform vec3 hor; uniform float night; varying vec3 vD;
      float h3(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719)))*43758.5453); }
      void main(){ float h = vD.y; vec3 c = mix(hor, top, smoothstep(0.0, 0.5, h));
        vec3 g = floor(vD*420.); float s = step(0.9975, h3(g)) * night * smoothstep(0.03, 0.25, h);
        c += vec3(s) * (0.6 + 0.4*h3(g+1.)); gl_FragColor = vec4(c, 1.); }`,
  }));
  sky.renderOrder = -1; scene.add(sky);

  hemi = new THREE.HemisphereLight(0xD8F1FF, 0x7A9A5E, 1.25); scene.add(hemi);
  sun = new THREE.DirectionalLight(0xFFF0D6, 2.1); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);

  // water + island base
  const water = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.MeshLambertMaterial({ color: 0x3FB2E6 }));
  water.rotation.x = -Math.PI / 2; water.position.y = -0.7; water.receiveShadow = true; scene.add(water);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(SAND + 0.6, SAND + 1.6, 1.2, 64), new THREE.MeshLambertMaterial({ color: 0xE6CC8E }));
  base.position.y = -0.66; base.receiveShadow = true; scene.add(base);

  // cells
  const grass = [], road = [], sand = [], trees = [];
  houseList = []; towerList = []; beachList = [];
  const r = rng(7);
  const isRoad = v => ((v % 5) + 5) % 5 === 0;
  for (let x = -GRID; x <= GRID; x++) for (let z = -GRID; z <= GRID; z++) {
    const d = Math.hypot(x, z) + (hash2(x * 0.13, z * 0.13) - 0.5) * 3.2;
    if (d > SAND) continue;
    if (d > LAND) { sand.push([x, z]); if (hash2(x, z) > 0.74) beachList.push({ x, z, a: Math.atan2(z, x), k: hash2(z, x) }); continue; }
    if (isRoad(x) || isRoad(z)) { road.push([x, z]); continue; }
    grass.push([x, z]);
    const bx = Math.floor(x / 5), bz = Math.floor(z / 5);
    if (Math.abs(x - DT.x) < 5 && Math.abs(z - DT.z) < 5) { towerList.push({ x, z, d: Math.hypot(x - DT.x, z - DT.z) }); continue; }
    if (x === HOME.x && z === HOME.z) { homeIdx = houseList.length; houseList.push({ x, z, home: true }); continue; }
    if (hash2(bx + 0.5, bz + 0.5) < 0.09 && !(bx === 0 && bz === 0)) { trees.push([x, z]); continue; }
    houseList.push({ x, z });
  }

  // tiles
  const tile = (list, w, h, y, color, jitter) => {
    const m = new THREE.InstancedMesh(new THREE.BoxGeometry(w, h, w), new THREE.MeshLambertMaterial({ color: 0xffffff }), list.length);
    const o = new THREE.Object3D(), c = new THREE.Color();
    list.forEach(([x, z], i) => { o.position.set(x, y - h / 2, z); o.updateMatrix(); m.setMatrixAt(i, o.matrix);
      c.set(color).offsetHSL(0, 0, (hash2(x, z) - 0.5) * jitter); m.setColorAt(i, c); });
    m.receiveShadow = true; scene.add(m); return m;
  };
  tile(grass, 0.94, 0.14, 0, '#7CC96B', 0.05);
  tile(road, 1.0, 0.08, -0.04, '#6B7282', 0.02);
  tile(sand, 1.0, 0.1, -0.08, '#F2DDA4', 0.03);
  // dark green under-layer shows between grass tiles as plot borders
  const under = new THREE.Mesh(new THREE.CylinderGeometry(LAND + 1.5, LAND + 1.5, 0.1, 96), new THREE.MeshLambertMaterial({ color: 0x5FAE55 }));
  under.position.y = -0.12; under.receiveShadow = true; scene.add(under);

  // trees (always there)
  const treeM = new THREE.InstancedMesh(new THREE.ConeGeometry(0.34, 0.85, 6).translate(0, 0.62, 0), new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true }), trees.length * 2);
  const trunkM = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.06, 0.08, 0.3, 5).translate(0, 0.15, 0), new THREE.MeshLambertMaterial({ color: 0x8A5A44 }), trees.length * 2);
  { const o = new THREE.Object3D(), c = new THREE.Color(); let i = 0;
    for (const [x, z] of trees) for (let k = 0; k < 2; k++) {
      const s = 0.75 + r() * 0.5; o.position.set(x + (r() - 0.5) * 0.5, 0, z + (r() - 0.5) * 0.5); o.scale.set(s, s, s); o.rotation.y = r() * 6; o.updateMatrix();
      treeM.setMatrixAt(i, o.matrix); trunkM.setMatrixAt(i, o.matrix); c.set(['#3E9A4F', '#4CAF5A', '#2F8A47'][Math.floor(r() * 3)]); treeM.setColorAt(i, c); i++; } }
  treeM.castShadow = trunkM.castShadow = true; scene.add(treeM, trunkM);

  // houses
  const winMap = canvasTex(64, 64, (g) => { g.fillStyle = '#fff'; g.fillRect(0, 0, 64, 64);
    g.fillStyle = '#8FCFEA'; g.fillRect(9, 12, 16, 16); g.fillRect(39, 12, 16, 16);
    g.fillStyle = '#9C6B52'; g.fillRect(26, 36, 12, 28); });
  const winEm = canvasTex(64, 64, (g) => { g.fillStyle = '#000'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#fff'; g.fillRect(9, 12, 16, 16); g.fillRect(39, 12, 16, 16); });
  houseMat = new THREE.MeshLambertMaterial({ map: winMap, emissiveMap: winEm, emissive: new THREE.Color('#FFC86B'), emissiveIntensity: 0 });
  houses = new THREE.InstancedMesh(new THREE.BoxGeometry(0.64, 0.5, 0.64).translate(0, 0.25, 0), houseMat, houseList.length);
  roofs = new THREE.InstancedMesh(new THREE.ConeGeometry(0.54, 0.38, 4).rotateY(Math.PI / 4).translate(0, 0.19, 0), new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true }), houseList.length);
  houses.castShadow = roofs.castShadow = true; houses.receiveShadow = true;
  // spawn order: outward from home, with noise
  const N = houseList.length - 1, rr = rng(11);
  const order = houseList.map((h, i) => ({ i, k: Math.hypot(h.x - HOME.x, h.z - HOME.z) + rr() * 4 })).filter(o => o.i !== homeIdx).sort((a, b) => a.k - b.k);
  order.forEach((o, n) => { houseList[o.i].spawn = B.rainStart + (B.rainEnd - B.rainStart) * Math.pow((n + 1) / N, 1 / B.rainExp); });
  houseList[homeIdx].spawn = B.houseDrop - 0.32;
  const c = new THREE.Color(), rh = rng(3);
  houseList.forEach((h, i) => {
    h.rot = Math.floor(rh() * 4) * Math.PI / 2; h.fl = rh() < 0.25 ? 1.7 : 1; h.fs = 0.85 + rh() * 0.18;
    if (h.home) { h.fl = 1.25; h.fs = 1.05; h.rot = 0; }
    c.set(WALLS[Math.floor(rh() * WALLS.length)]); houses.setColorAt(i, c);
    c.set(h.home ? '#FF6B5B' : ROOFS[Math.floor(rh() * ROOFS.length)]); roofs.setColorAt(i, c);
  });
  scene.add(houses, roofs);

  // downtown towers
  const twMap = canvasTex(64, 128, (g) => { g.fillStyle = '#fff'; g.fillRect(0, 0, 64, 128); g.fillStyle = '#35587E';
    for (let y = 0; y < 10; y++) for (let x = 0; x < 4; x++) g.fillRect(5 + x * 15, 6 + y * 12, 9, 7); });
  const twEm = canvasTex(64, 128, (g) => { g.fillStyle = '#000'; g.fillRect(0, 0, 64, 128); const q = rng(5);
    for (let y = 0; y < 10; y++) for (let x = 0; x < 4; x++) { g.fillStyle = q() < 0.45 ? '#fff' : '#000'; g.fillRect(5 + x * 15, 6 + y * 12, 9, 7); } });
  towerMat = new THREE.MeshLambertMaterial({ map: twMap, emissiveMap: twEm, emissive: new THREE.Color('#FFD58A'), emissiveIntensity: 0 });
  towersM = new THREE.InstancedMesh(new THREE.BoxGeometry(0.86, 1, 0.86).translate(0, 0.5, 0), towerMat, towerList.length);
  towersM.castShadow = towersM.receiveShadow = true;
  const rt = rng(21), maxD = Math.max(...towerList.map(t => t.d));
  towerList.forEach((tw, i) => { tw.h = 3 + Math.pow(1 - tw.d / maxD, 1.3) * 13 + rt() * 4; tw.at = B.downtown + 0.15 + (tw.d / maxD) * 1.1 + rt() * 0.2;
    c.set(TOWERS[Math.floor(rt() * TOWERS.length)]); towersM.setColorAt(i, c); });
  scene.add(towersM);

  // beach props: umbrellas + palms
  const rb = rng(31);
  beachList.forEach(b => { b.palm = rb() < 0.45; b.at = B.beach + 0.1 + ((b.a + Math.PI) / (2 * Math.PI)) * 0.9; b.ox = (rb() - 0.5) * 0.4; b.oz = (rb() - 0.5) * 0.4; b.c = ROOFS[Math.floor(rb() * ROOFS.length)]; });
  umbrellas = new THREE.InstancedMesh(new THREE.ConeGeometry(0.5, 0.22, 8).translate(0, 0.72, 0), new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true }), beachList.length);
  poles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 4).translate(0, 0.35, 0), new THREE.MeshLambertMaterial({ color: 0xffffff }), beachList.length);
  palms = new THREE.InstancedMesh(new THREE.ConeGeometry(0.6, 0.25, 6).translate(0, 1.15, 0), new THREE.MeshLambertMaterial({ color: 0x3E9A4F, flatShading: true }), beachList.length);
  beachList.forEach((b, i) => { c.set(b.palm ? '#8A5A44' : '#FFFFFF'); poles.setColorAt(i, c); c.set(b.c); umbrellas.setColorAt(i, c); });
  umbrellas.castShadow = palms.castShadow = poles.castShadow = true;
  scene.add(umbrellas, poles, palms);

  // home plot marker + landing ring
  const mk = canvasTex(256, 256, (g) => { g.strokeStyle = '#FFC845'; g.lineWidth = 18; g.setLineDash([34, 22]); g.lineCap = 'round';
    g.beginPath(); g.roundRect(18, 18, 220, 220, 40); g.stroke(); g.fillStyle = 'rgba(255,200,69,.28)'; g.fill(); });
  marker = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.05), new THREE.MeshBasicMaterial({ map: mk, transparent: true, depthWrite: false, toneMapped: false }));
  marker.rotation.x = -Math.PI / 2; marker.position.set(HOME.x, 0.02, HOME.z); scene.add(marker);
  ring = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.6, 40), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(HOME.x, 0.03, HOME.z); scene.add(ring);

  // fireworks
  const rf = rng(41), PER = 120, TRAIL = 10;
  fwData = B.fireworks.map((tb, k) => { const a = rf() * Math.PI * 2, rad = 6 + rf() * 22;
    return { tb, o: new THREE.Vector3(-4 + Math.cos(a) * rad, 15 + rf() * 10, -3 + Math.sin(a) * rad), c: col(FW[k % FW.length]), c2: col(FW[(k + 3) % FW.length]),
      p: Array.from({ length: PER }, () => { const u = rf() * 2 - 1, th = rf() * Math.PI * 2, s = Math.sqrt(1 - u * u);
        return { d: new THREE.Vector3(s * Math.cos(th), u, s * Math.sin(th)), v: 9 + rf() * 5, ph: rf() * 6, alt: rf() < 0.3 }; }) }; });
  const total = fwData.length * (PER + TRAIL);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(total * 3), 3));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(total * 3), 3));
  g.setAttribute('alpha', new THREE.BufferAttribute(new Float32Array(total), 1));
  fw = new THREE.Points(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
    uniforms: { uSize: { value: 0.6 }, uScale: { value: 1 } },
    vertexShader: `attribute float alpha; varying float vA; varying vec3 vC; uniform float uSize; uniform float uScale;
      void main(){ vA = alpha; vC = color; vec4 mv = modelViewMatrix*vec4(position,1.); gl_PointSize = uSize*uScale/-mv.z; gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `varying float vA; varying vec3 vC; void main(){ float d = length(gl_PointCoord-.5); float a = smoothstep(.5,.0,d);
      gl_FragColor = vec4(vC*1.6, a*vA); }` }));
  fw.frustumCulled = false; fw.userData = { PER, TRAIL }; scene.add(fw);
}

// ---------- camera ----------
function camAt(t) {
  let d, el;
  const lg = (a, b, p) => a * Math.pow(b / a, p);
  if (t < 3.2) d = lg(95, 10.5, easeInOut(t / 3.2));
  else if (t < 5.6) d = lerp(10.5, 9.4, easeInOut((t - 3.2) / 2.4));
  else if (t < 13) d = lg(9.4, 118, 1 - Math.pow(1 - (t - 5.6) / 7.4, 1.8));
  else d = lerp(118, 92, easeInOut(prog(t, 13, 20)));
  if (t < 3.2) el = lerp(1.05, 0.62, easeInOut(t / 3.2));
  else if (t < 5.6) el = 0.62;
  else if (t < 13) el = lerp(0.62, 1.0, easeInOut((t - 5.6) / 7.4));
  else el = lerp(1.0, 0.36, easeInOut(prog(t, 13, 19.5)));
  const az = 0.8 + 0.045 * t;
  const pw = easeInOut(prog(t, 5.6, 13)), pe = easeInOut(prog(t, 13, 19.5));
  const tg = new THREE.Vector3(lerp(HOME.x, -4, pw), lerp(0.3, 2, pw) + pe * 4, lerp(HOME.z, -3, pw));
  return { d, el, az, tg };
}

// ---------- overlay ----------
const $ = s => document.querySelector(s);
let ov, capEls = [], chipEls = [], cardEls = [], letterEls = [];
const SH = (r, c) => { const a = []; for (let i = 0; i < 16; i++) { const t = i / 16 * Math.PI * 2; a.push(`${(Math.cos(t) * r).toFixed(1)}px ${(Math.sin(t) * r).toFixed(1)}px 0 ${c}`); } return a.join(','); };
function buildOverlay() {
  ov = $('#ov');
  const cap = $('#cap');
  B.captions.forEach(c => {
    const box = document.createElement('div'); box.style.position = 'absolute'; box.style.width = '1080px'; box.style.left = '0'; box.style.top = '0';
    const words = [];
    c.lines.forEach(line => { const ld = document.createElement('div'); ld.className = 'cline';
      line.split(' ').forEach(w => { const key = /^\*.*\*$/.test(w) || /^\*/.test(w); const s = document.createElement('span'); s.className = 'w' + (key ? ' key' : '');
        s.textContent = w.replace(/\*/g, ''); s.style.textShadow = SH(key ? 9 : 7, INK) + `, 0 ${key ? 14 : 10}px 0 ${INK}`; ld.appendChild(s); words.push(s); });
      box.appendChild(ld); });
    cap.appendChild(box); capEls.push({ c, box, words });
  });
  B.chips.forEach(ch => { const e = document.createElement('div'); e.className = 'chip';
    e.innerHTML = `<div class="lab"><svg viewBox="0 0 24 24" fill="none" stroke="#FFC845" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V7.5a4 4 0 0 1 7.6-1.7"/></svg>${ch.label}</div><div class="name">${ch.name}</div>`;
    $('#chips').appendChild(e); chipEls.push({ ch, e }); });
  B.feed.forEach((f, i) => { const e = document.createElement('div'); e.className = 'card';
    const rc = ROOFS[i % ROOFS.length];
    e.innerHTML = `<div class="ic" style="background:${rc}33"><svg viewBox="0 0 64 64" style="--roof:${rc}"><use href="#house"/></svg></div><span class="u">${f.user}</span><span class="m">moved in</span>`;
    $('#feed').appendChild(e); cardEls.push({ f, e }); });
  const word = $('#word');
  [['P', '#fff'], ['L', '#fff'], ['O', '#fff'], ['T', '#fff'], [' '], ['T', '#FFC845'], ['O', '#FFC845'], ['W', '#FFC845'], ['N', '#FFC845']].forEach(([ch, c]) => {
    const s = document.createElement('span'); if (ch === ' ') { s.className = 'sp'; word.appendChild(s); return; }
    s.className = 'l'; s.textContent = ch; s.style.color = c; s.style.textShadow = SH(10, INK) + `, 0 16px 0 ${INK}`; word.appendChild(s); letterEls.push(s); });
  $('#claim').style.textShadow = SH(6, INK) + `, 0 8px 0 ${INK}`;
  $('#follow').style.textShadow = SH(5, INK);
}

const fmt = n => n.toLocaleString('en-US');
function popCount(t) {
  if (t < B.houseDrop) return 0;
  let n = 1; if (t > B.rainStart) n += Math.min(houseList.length - 1, Math.floor((houseList.length - 1) * Math.pow(prog(t, B.rainStart, B.rainEnd), B.rainExp)));
  return n;
}

function drawOverlay(t, homeScreen) {
  // counter
  const cnt = $('#counter'), cIn = backOut(prog(t, 0.15, 0.55)), cOut = prog(t, 17.5, 17.85);
  const bump = 1 + 0.14 * Math.max(0, 1 - Math.abs(t - B.houseDrop - 0.06) / 0.18) + (t > B.rainStart && t < B.rainEnd ? 0.025 * Math.sin(t * 60) : 0);
  cnt.style.opacity = (cIn > 0 ? 1 : 0) * (1 - cOut);
  cnt.style.transform = `translateX(-50%) translateY(${(1 - cIn) * -40 - cOut * 40}px) scale(${Math.max(0, cIn) * bump})`;
  cnt.querySelector('.num').textContent = fmt(popCount(t));

  // captions
  for (const { c, box, words } of capEls) {
    const on = t >= c.from - 0.01 && t <= c.to; box.style.display = on ? 'block' : 'none'; if (!on) continue;
    const out = easeIn(prog(t, c.to - 0.22, c.to));
    box.style.opacity = 1 - out; box.style.transform = `translateY(${-out * 30}px) scale(${1 - out * 0.06})`;
    words.forEach((w, i) => { const p = prog(t, c.from + i * 0.075, c.from + i * 0.075 + 0.3), b = backOut(p);
      w.style.opacity = clamp(p * 2.2); w.style.transform = `translateY(${(1 - easeOut(p)) * 40}px) scale(${0.45 + 0.55 * b})`;
      w.style.filter = p < 1 ? `blur(${((1 - p) * 10).toFixed(1)}px)` : 'none'; });
  }

  // chips
  for (const { ch, e } of chipEls) {
    const on = t >= ch.from && t <= ch.to; e.style.display = on ? 'block' : 'none'; if (!on) continue;
    const p = backOut(prog(t, ch.from, ch.from + 0.4), 2.4), out = easeIn(prog(t, ch.to - 0.2, ch.to));
    e.style.opacity = clamp(prog(t, ch.from, ch.from + 0.12)) * (1 - out);
    e.style.transform = `translateX(-50%) scale(${p * (1 - out * 0.15)}) rotate(${(1 - clamp(p)) * -6}deg)`;
  }

  // join feed: newest on top, older ones pushed down
  const fOut = B.feedEnd;
  cardEls.forEach(({ f, e }, i) => {
    if (t < f.t || t > fOut + 0.6) { e.style.display = 'none'; return; }
    e.style.display = 'flex';
    let slot = 0; for (let j = i + 1; j < cardEls.length; j++) slot += easeOut(prog(t, cardEls[j].f.t, cardEls[j].f.t + 0.22));
    const pin = backOut(prog(t, f.t, f.t + 0.32), 1.6), ex = easeIn(prog(t, fOut - 0.3 + (cardEls.length - i) * 0.03, fOut + 0.05 + (cardEls.length - i) * 0.03));
    const x = 56 + (1 - pin) * -560 - ex * 700, y = 590 + slot * 104;
    e.style.opacity = clamp(1 - (slot - 3.2) / 1.1) * clamp(prog(t, f.t, f.t + 0.1));
    e.style.transform = `translate(${x}px, ${y}px) scale(${1 - Math.max(0, slot - 2) * 0.05})`; e.style.transformOrigin = '0 50%';
  });

  // @you pin
  const pin = $('#pin'), pp = backOut(prog(t, B.houseDrop + 0.12, B.houseDrop + 0.45), 2.2), pOut = prog(t, 6.3, 6.6);
  if (pp > 0 && pOut < 1 && homeScreen) {
    pin.style.display = 'block'; const bob = Math.sin(t * 5) * 6;
    pin.style.transform = `translate(${homeScreen.x}px, ${homeScreen.y - 16 + bob}px) translate(-50%, -100%) scale(${pp * (1 - pOut)})`;
    pin.style.opacity = 1 - pOut;
  } else pin.style.display = 'none';

  // title card
  const T = B.title, ti = $('#title');
  ti.style.display = t >= T - 0.4 ? 'block' : 'none';
  if (t >= T - 0.4) {
    $('#veil').style.opacity = smooth(prog(t, T - 0.4, T + 0.3));
    const lp = backOut(prog(t, T, T + 0.45), 2.2);
    $('#logo').style.transform = `translateY(${(1 - clamp(lp)) * 60 + Math.sin((t - T) * 2.4) * 6}px) scale(${lp}) rotate(${(1 - clamp(lp)) * -14}deg)`;
    letterEls.forEach((s, i) => { const p = backOut(prog(t, T + 0.12 + i * 0.045, T + 0.47 + i * 0.045), 2.0);
      s.style.opacity = clamp(prog(t, T + 0.12 + i * 0.045, T + 0.2 + i * 0.045)); s.style.transform = `translateY(${(1 - p) * -120}px) scale(${0.6 + 0.4 * p})`; });
    const cl = easeOut(prog(t, T + 0.55, T + 0.9)); $('#claim').style.opacity = cl; $('#claim').style.transform = `translateY(${(1 - cl) * 24}px)`;
    const cp = backOut(prog(t, B.cta, B.cta + 0.4), 2.2), pulse = 1 + 0.03 * Math.max(0, Math.sin((t - B.cta - 0.5) * 4.5));
    $('#ctaPill').style.opacity = clamp(prog(t, B.cta, B.cta + 0.1)); $('#ctaPill').style.transform = `translateX(-50%) scale(${cp * (t > B.cta + 0.5 ? pulse : 1)})`;
    const fo = easeOut(prog(t, B.cta + 0.4, B.cta + 0.8)); $('#follow').style.opacity = fo; $('#follow').style.transform = `translateY(${(1 - fo) * 20}px)`;
  }
}

// ---------- frame ----------
const o3 = new THREE.Object3D(), Z = new THREE.Matrix4().makeScale(0, 0, 0), cc = new THREE.Color();
window.drawFrame = (t) => {
  const n = smooth(prog(t, B.nightFrom, B.nightTo));
  // lighting / sky
  sky.material.uniforms.top.value.copy(col('#5BB5F0')).lerp(col('#0A1036'), n);
  sky.material.uniforms.hor.value.copy(col('#CFEBFF')).lerp(col('#3B2F72'), n);
  sky.material.uniforms.night.value = n;
  fog.color.copy(sky.material.uniforms.hor.value);
  hemi.color.copy(col('#D8F1FF')).lerp(col('#4A5BB0'), n); hemi.groundColor.copy(col('#7A9A5E')).lerp(col('#1C2240'), n);
  hemi.intensity = lerp(1.25, 0.55, n);
  sun.color.copy(col('#FFF0D6')).lerp(col('#9DB4FF'), n); sun.intensity = lerp(2.1, 0.5, n);
  houseMat.emissiveIntensity = n * 1.8; towerMat.emissiveIntensity = n * 1.0;
  bloom.strength = lerp(0.12, 0.95, n);

  // camera
  const { d, el, az, tg } = camAt(t);
  camera.position.set(tg.x + Math.cos(az) * Math.cos(el) * d, tg.y + Math.sin(el) * d, tg.z + Math.sin(az) * Math.cos(el) * d);
  camera.lookAt(tg); camera.near = Math.max(0.1, d * 0.05); camera.far = 5000; camera.updateProjectionMatrix();
  sky.position.copy(camera.position);
  fog.near = d * 1.2; fog.far = d * 4.5 + 60;
  const sh = Math.max(9, d * 0.8), L = new THREE.Vector3(-0.55, 1, 0.4).normalize();
  sun.position.copy(tg).addScaledVector(L, 300); sun.target.position.copy(tg);
  Object.assign(sun.shadow.camera, { left: -sh, right: sh, top: sh, bottom: -sh, near: 1, far: 600 }); sun.shadow.camera.updateProjectionMatrix();

  // houses
  houseList.forEach((h, i) => {
    const a = t - h.spawn;
    if (a < 0) { houses.setMatrixAt(i, Z); roofs.setMatrixAt(i, Z); return; }
    const fallT = h.home ? 0.32 : 0.24, hgt = h.home ? 6 : 3;
    let y = 0, sy = 1, sxz = 1;
    if (a < fallT) { y = hgt * (1 - easeIn(a / fallT)); sy = 1.12; sxz = 0.9; }
    else { const b = a - fallT, k = h.home ? 0.5 : 0.3; if (b < k) { const w = Math.sin((b / k) * Math.PI * 2.5) * Math.exp(-b / k * 3); sy = 1 - 0.32 * w; sxz = 1 + 0.18 * w; } }
    o3.position.set(h.x, y, h.z); o3.rotation.set(0, h.rot, 0); o3.scale.set(h.fs * sxz, h.fl * sy, h.fs * sxz); o3.updateMatrix(); houses.setMatrixAt(i, o3.matrix);
    o3.position.y = y + 0.5 * h.fl * sy; o3.scale.set(h.fs * sxz, sy, h.fs * sxz); o3.updateMatrix(); roofs.setMatrixAt(i, o3.matrix);
  });
  houses.instanceMatrix.needsUpdate = roofs.instanceMatrix.needsUpdate = true;

  // towers
  towerList.forEach((tw, i) => { const p = prog(t, tw.at, tw.at + 0.7); if (p <= 0) { towersM.setMatrixAt(i, Z); return; }
    const s = backOut(p, 1.4); o3.position.set(tw.x, 0, tw.z); o3.rotation.set(0, 0, 0); o3.scale.set(1, tw.h * s, 1); o3.updateMatrix(); towersM.setMatrixAt(i, o3.matrix); });
  towersM.instanceMatrix.needsUpdate = true;

  // beach props
  beachList.forEach((b, i) => { const p = backOut(prog(t, b.at, b.at + 0.4), 2.4);
    if (p <= 0) { umbrellas.setMatrixAt(i, Z); poles.setMatrixAt(i, Z); palms.setMatrixAt(i, Z); return; }
    o3.position.set(b.x + b.ox, -0.08, b.z + b.oz); o3.rotation.set(0, b.k * 6, b.palm ? 0.12 : 0);
    const q = p * 1.7; o3.scale.set(q, b.palm ? q * 1.7 : q, q); o3.updateMatrix(); poles.setMatrixAt(i, o3.matrix);
    o3.scale.set(q, q, q); o3.updateMatrix();
    umbrellas.setMatrixAt(i, b.palm ? Z : o3.matrix); palms.setMatrixAt(i, b.palm ? o3.matrix : Z); });
  umbrellas.instanceMatrix.needsUpdate = poles.instanceMatrix.needsUpdate = palms.instanceMatrix.needsUpdate = true;

  // marker + ring
  const mIn = prog(t, 2.5, 2.8), mOut = prog(t, B.houseDrop - 0.05, B.houseDrop + 0.25);
  marker.material.opacity = mIn * (1 - mOut) * (0.75 + 0.25 * Math.sin(t * 12));
  marker.scale.setScalar(1 + 0.06 * Math.sin(t * 6) + (1 - mIn) * 0.4);
  const rp = prog(t, B.houseDrop, B.houseDrop + 0.55); ring.material.opacity = rp > 0 && rp < 1 ? (1 - rp) * 0.9 : 0; ring.scale.setScalar(1 + easeOut(rp) * 2.2);

  // fireworks
  const { PER, TRAIL } = fw.userData, pos = fw.geometry.attributes.position.array, colr = fw.geometry.attributes.color.array, al = fw.geometry.attributes.alpha.array;
  let k = 0; const LIFE = 1.9;
  for (const f of fwData) {
    const tau = t - f.tb;
    for (const p of f.p) { let a = 0;
      if (tau >= 0 && tau < LIFE) { const s = p.v * (1 - Math.exp(-2.4 * tau)) / 2.4;
        pos[k * 3] = f.o.x + p.d.x * s; pos[k * 3 + 1] = f.o.y + p.d.y * s - 2.6 * tau * tau; pos[k * 3 + 2] = f.o.z + p.d.z * s;
        a = Math.pow(1 - tau / LIFE, 1.5) * (0.7 + 0.3 * Math.sin(tau * 38 + p.ph)) * (tau < 0.05 ? tau / 0.05 : 1);
        cc.copy(p.alt ? f.c2 : f.c); colr[k * 3] = cc.r; colr[k * 3 + 1] = cc.g; colr[k * 3 + 2] = cc.b; }
      al[k++] = a; }
    for (let j = 0; j < TRAIL; j++) { const rt = tau + 0.6 - j * 0.025, a = rt > 0 && tau < 0 ? (1 - j / TRAIL) : 0;
      const e = easeOut(clamp(rt / 0.6)); pos[k * 3] = f.o.x; pos[k * 3 + 1] = e * f.o.y; pos[k * 3 + 2] = f.o.z;
      colr[k * 3] = 1; colr[k * 3 + 1] = 0.85; colr[k * 3 + 2] = 0.6; al[k++] = a * 0.9; }
  }
  fw.geometry.attributes.position.needsUpdate = fw.geometry.attributes.color.needsUpdate = fw.geometry.attributes.alpha.needsUpdate = true;
  fw.material.uniforms.uScale.value = H / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
  fw.material.uniforms.uSize.value = 0.55 + d * 0.004;

  composer.render();

  // project home house top for the pin
  const hp = new THREE.Vector3(HOME.x, 1.25, HOME.z).project(camera);
  drawOverlay(t, { x: (hp.x + 1) / 2 * 1080, y: (1 - hp.y) / 2 * 1920 });
};

window.setup = async (scale = 1) => {
  B = await (await fetch('/plan/beats.json')).json();
  S = scale; W = Math.round(B.width * S); H = Math.round(B.height * S);
  const cv = document.getElementById('gl');
  renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false); cv.style.width = W + 'px'; cv.style.height = H + 'px';
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 5000);
  camera.setViewOffset(W, H, 0, Math.round(H * 0.035), W, H);   // push the subject above the captions
  buildWorld();
  composer = new EffectComposer(renderer); composer.setPixelRatio(1); composer.setSize(W, H);
  composer.addPass(new RenderPass(scene, camera));
  bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.2, 0.55, 0.62); composer.addPass(bloom);
  composer.addPass(new OutputPass());
  document.getElementById('ov').style.transform = `scale(${S})`;
  buildOverlay();
  await document.fonts.load('700 100px Fredoka'); await document.fonts.load('600 40px Fredoka'); await document.fonts.load('500 40px Fredoka');
  await document.fonts.ready;
  return { houses: houseList.length, towers: towerList.length, beach: beachList.length };
};
