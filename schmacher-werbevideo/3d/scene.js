// Mietpark Schmacher – maßstabsgetreues 3D-Modell nach Einreichplan (SAWE, 02.09.2025)
// Koordinaten: x = Gebäudelänge, z = Tiefe, y = oben. Einheit: Meter.
// Bauteil 1 (7 Hallen mit Büro): x 0..48.5, z -15..0, Front (Nummern) zeigt nach -z, Tore zur Durchfahrt (+z)
// Durchfahrt: z 0..8, Bauteil 2 (14 Lagerboxen): x 0..49, z 8..28
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { SHOTS as SHOTS1, TITLES as TITLES1, DURATION as DURATION1 } from './shots.js';
import { SHOTS2, DURATION2, animTime2, F2T, SW } from './shots2.js';

const params = new URLSearchParams(location.search);
const W = parseInt(params.get('w') || '1920'), H = parseInt(params.get('h') || '1080');
const PORTRAIT = H > W, NOTITLES = params.get('notitles') === '1';
const FILM2 = params.get('film') === '2'; // Film 2: „Licht an.“
if (PORTRAIT) { const st = document.getElementById('stage'); st.style.width = W + 'px'; st.style.height = H + 'px'; }
if (NOTITLES) document.getElementById('ov').style.display = 'none';
const SCALE = parseFloat(params.get('scale') || '1');
const USE_AO = params.get('ao') !== '0';

// ---------------------------------------------------------------- Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.setSize(W * SCALE, H * SCALE, false);
renderer.domElement.style.width = W + 'px';
renderer.domElement.style.height = H + 'px';
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.55;
document.getElementById('stage').prepend(renderer.domElement);
const MAXANISO = renderer.capabilities.getMaxAnisotropy();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, 0.15, 14000);

// ---------------------------------------------------------------- Helpers
let seed = 1337;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const rr = (a, b) => a + (b - a) * rnd();
function hash2(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, o = 5) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= 0.5; } return s; }

function canvasTex(size, draw, { repeat = [1, 1], srgb = true } = {}) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); draw(g, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat);
  t.anisotropy = MAXANISO; if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function noiseFill(g, s, base, amp, scale, oct = 4) {
  const img = g.getImageData(0, 0, s, s); const d = img.data;
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    const n = (fbm(x / scale, y / scale, oct) - 0.5) * amp + (rnd() - 0.5) * amp * 0.35;
    const i = (y * s + x) * 4; d[i] = base[0] + n; d[i + 1] = base[1] + n; d[i + 2] = base[2] + n; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
}

// ---------------------------------------------------------------- Texturen (1 Kachel = 2 m x 2 m)
const PX = 512; // px pro Meter in Fassadentexturen (Kachel 1024 = 2 m)
function ribbed(g, s, base, grooveDark, jointEvery = 1.0, wood = false) {
  g.fillStyle = `rgb(${base})`; g.fillRect(0, 0, s, s);
  if (wood) {
    // Holzmaserung horizontal
    for (let i = 0; i < 2600; i++) {
      const y = rnd() * s, len = rr(80, 700), x = rnd() * s;
      const l = rr(-28, 22);
      g.strokeStyle = `rgba(${l > 0 ? '255,214,160' : '40,18,4'},${Math.abs(l) / 260})`;
      g.lineWidth = rr(0.6, 3.2);
      g.beginPath(); g.moveTo(x, y);
      g.bezierCurveTo(x + len * 0.3, y + rr(-3, 3), x + len * 0.6, y + rr(-3, 3), x + len, y + rr(-2, 2)); g.stroke();
      g.beginPath(); g.moveTo(x - s, y); g.lineTo(x - s + len, y); g.stroke();
    }
    // Dielenwechsel (unterschiedlich getönte Bretter)
    const board = PX * 0.145;
    for (let y = 0; y < s; y += board) { g.fillStyle = `rgba(${rnd() > .5 ? '255,200,140' : '60,25,5'},${rr(0.02, 0.09)})`; g.fillRect(0, y, s, board); }
  }
  const rib = PX * 0.024; // Rillenabstand ~2,4 cm
  for (let y = 0; y < s; y += rib) {
    g.fillStyle = `rgba(${grooveDark},0.55)`; g.fillRect(0, y, s, 2.2);
    g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(0, y + 2.2, s, 1.2);
  }
  for (let y = 0; y < s; y += PX * jointEvery) { g.fillStyle = 'rgba(0,0,0,0.75)'; g.fillRect(0, y, s, 3); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, y + 3, s, 1.5); }
}
const tex = {};
tex.wood = canvasTex(1024, (g, s) => ribbed(g, s, '150,86,40', '45,20,6', 1.0, true));
tex.woodBump = canvasTex(1024, (g, s) => { g.fillStyle = '#fff'; g.fillRect(0, 0, s, s); const rib = PX * 0.024; for (let y = 0; y < s; y += rib) { g.fillStyle = '#000'; g.fillRect(0, y, s, 3); } for (let y = 0; y < s; y += PX) { g.fillStyle = '#000'; g.fillRect(0, y, s, 5); } }, { srgb: false });
tex.anth = canvasTex(1024, (g, s) => { ribbed(g, s, '50,53,57', '8,9,10', 1.0); const im = g.getImageData(0, 0, s, s); const d = im.data; for (let i = 0; i < d.length; i += 4) { const n = (rnd() - .5) * 5; d[i] += n; d[i + 1] += n; d[i + 2] += n; } g.putImageData(im, 0, 0); });
tex.grey = canvasTex(1024, (g, s) => ribbed(g, s, '120,124,128', '50,52,55', 1.0));
tex.panelWhite = canvasTex(1024, (g, s) => { g.fillStyle = 'rgb(236,236,232)'; g.fillRect(0, 0, s, s); for (let y = 0; y < s; y += PX * 0.1) { g.fillStyle = 'rgba(0,0,0,0.05)'; g.fillRect(0, y, s, 2); } for (let y = 0; y < s; y += PX) { g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, y, s, 3); } });
tex.door = canvasTex(1024, (g, s) => { g.fillStyle = 'rgb(46,49,53)'; g.fillRect(0, 0, s, s); const sec = PX * 0.5; for (let y = 0; y < s; y += sec) { g.fillStyle = 'rgba(0,0,0,.8)'; g.fillRect(0, y, s, 5); g.fillStyle = 'rgba(255,255,255,.10)'; g.fillRect(0, y + 5, s, 2); for (let k = 1; k < 5; k++) { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, y + k * sec / 5, s, 1.5); } } });
tex.asphalt = canvasTex(1024, (g, s) => { noiseFill(g, s, [58, 59, 61], 34, 6, 3); for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${rnd() > .5 ? '200,200,200' : '10,10,10'},${rr(.05, .25)})`; g.fillRect(rnd() * s, rnd() * s, rr(1, 2.5), rr(1, 2.5)); } }, { repeat: [1, 1] });
tex.grass = canvasTex(1024, (g, s) => { const im = g.createImageData(s, s); const d = im.data; for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) { const n = fbm(x / 40, y / 40, 4), m = rnd(); const i = (y * s + x) * 4; d[i] = 52 + n * 40 + m * 22; d[i + 1] = 92 + n * 52 + m * 30; d[i + 2] = 32 + n * 16 + m * 8; d[i + 3] = 255; } g.putImageData(im, 0, 0); });
tex.gravel = canvasTex(512, (g, s) => { g.fillStyle = '#9a968d'; g.fillRect(0, 0, s, s); for (let i = 0; i < 26000; i++) { const c = rr(90, 215); g.fillStyle = `rgb(${c},${c - 4},${c - 10})`; g.beginPath(); g.arc(rnd() * s, rnd() * s, rr(1, 3.4), 0, 7); g.fill(); } });
tex.concrete = canvasTex(1024, (g, s) => { noiseFill(g, s, [176, 176, 172], 24, 90, 5); for (let i = 0; i < 30; i++) { g.strokeStyle = `rgba(80,80,80,${rr(.02, .06)})`; g.lineWidth = rr(10, 60); g.beginPath(); g.arc(rnd() * s, rnd() * s, rr(60, 300), 0, 7); g.stroke(); } });
tex.glulam = canvasTex(512, (g, s) => { g.fillStyle = 'rgb(222,186,132)'; g.fillRect(0, 0, s, s); for (let i = 0; i < 900; i++) { g.strokeStyle = `rgba(${rnd() > .5 ? '160,110,55' : '250,220,170'},${rr(.05, .22)})`; g.lineWidth = rr(.6, 2.5); const y = rnd() * s; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(s * .3, y + rr(-8, 8), s * .6, y + rr(-8, 8), s, y + rr(-4, 4)); g.stroke(); } for (let y = 0; y < s; y += s / 6) { g.fillStyle = 'rgba(120,80,30,.35)'; g.fillRect(0, y, s, 2); } for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(110,60,20,.5)'; g.beginPath(); g.ellipse(rnd() * s, rnd() * s, rr(3, 7), rr(2, 4), 0, 0, 7); g.fill(); } });
tex.plank = canvasTex(1024, (g, s) => { g.fillStyle = 'rgb(205,168,118)'; g.fillRect(0, 0, s, s); for (let y = 0; y < s; y += 72) { g.fillStyle = `rgba(${rnd() > .5 ? '255,230,190' : '120,80,30'},${rr(.05, .14)})`; g.fillRect(0, y, s, 72); g.fillStyle = 'rgba(60,35,10,.35)'; g.fillRect(0, y, s, 2); } for (let i = 0; i < 1400; i++) { g.strokeStyle = `rgba(140,95,45,${rr(.04, .14)})`; g.lineWidth = rr(.5, 2); const y = rnd() * s; g.beginPath(); g.moveTo(rnd() * s - 200, y); g.lineTo(rnd() * s + 200, y + rr(-2, 2)); g.stroke(); } });
tex.roof = canvasTex(1024, (g, s) => { g.fillStyle = 'rgb(108,111,114)'; g.fillRect(0, 0, s, s); for (let x = 0; x < s; x += PX * 0.5) { g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x, 0, 4, s); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x + 4, 0, 3, s); } });
tex.fields = canvasTex(2048, (g, s) => {
  g.fillStyle = '#5d7a3a'; g.fillRect(0, 0, s, s);
  const pal = [[96, 128, 52], [120, 146, 62], [74, 108, 44], [150, 150, 78], [176, 160, 92], [110, 136, 58], [138, 120, 70], [86, 120, 48]];
  for (let i = 0; i < 260; i++) {
    const c = pal[Math.floor(rnd() * pal.length)]; const x = rnd() * s, y = rnd() * s, w = rr(40, 260), h = rr(30, 160), a = rr(-0.4, 0.4);
    g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = `rgb(${c})`; g.fillRect(-w / 2, -h / 2, w, h);
    for (let k = -h / 2; k < h / 2; k += 3) { g.fillStyle = `rgba(0,0,0,${rr(.03, .09)})`; g.fillRect(-w / 2, k, w, 1); }
    g.restore();
  }
  const im = g.getImageData(0, 0, s, s); const d = im.data;
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) { const n = (fbm(x / 70, y / 70, 3) - .5) * 40; const i = (y * s + x) * 4; d[i] += n; d[i + 1] += n; d[i + 2] += n * .6; }
  g.putImageData(im, 0, 0);
});
tex.leaf = canvasTex(512, (g, s) => { g.fillStyle = '#2f4a22'; g.fillRect(0, 0, s, s); for (let i = 0; i < 14000; i++) { const l = rr(-30, 40); g.fillStyle = `rgba(${60 + l},${95 + l},${40 + l * .5},${rr(.4, .9)})`; g.beginPath(); g.ellipse(rnd() * s, rnd() * s, rr(2, 6), rr(1, 3), rnd() * 3, 0, 7); g.fill(); } });
tex.mountain = canvasTex(1024, (g, s) => { noiseFill(g, s, [60, 74, 64], 50, 30, 5); });

function setRep(t, rx, ry) { const c = t.clone(); c.needsUpdate = true; c.repeat.set(rx, ry); return c; }

// ---------------------------------------------------------------- Materialien
const M = {};
M.wood = new THREE.MeshStandardMaterial({ map: tex.wood, bumpMap: tex.woodBump, bumpScale: 0.35, roughness: 0.62, metalness: 0.05 });
M.anth = new THREE.MeshStandardMaterial({ map: tex.anth, bumpMap: tex.woodBump, bumpScale: 0.3, roughness: 0.5, metalness: 0.35 });
M.grey = new THREE.MeshStandardMaterial({ map: tex.grey, bumpMap: tex.woodBump, bumpScale: 0.3, roughness: 0.5, metalness: 0.3 });
M.plinth = new THREE.MeshStandardMaterial({ color: 0x232527, roughness: 0.85 });
M.frame = new THREE.MeshStandardMaterial({ color: 0x2b2e32, roughness: 0.4, metalness: 0.5 });
M.flash = new THREE.MeshStandardMaterial({ color: 0x2c2f33, roughness: 0.35, metalness: 0.7 });
M.glass = new THREE.MeshStandardMaterial({ color: 0x7f8f99, roughness: 0.03, metalness: 0.95, envMapIntensity: 1.25 });
M.glassClear = new THREE.MeshStandardMaterial({ color: 0xc8d6dc, roughness: 0.02, metalness: 0.2, transparent: true, opacity: 0.18, depthWrite: false, envMapIntensity: 1.5 });
M.door = new THREE.MeshStandardMaterial({ map: tex.door, roughness: 0.42, metalness: 0.55 });
M.number = new THREE.MeshStandardMaterial({ color: 0x141518, roughness: 0.5, metalness: 0.4 });
M.roof = new THREE.MeshStandardMaterial({ map: tex.roof, roughness: 0.55, metalness: 0.4 });
M.asphalt = new THREE.MeshStandardMaterial({ map: tex.asphalt, roughness: 0.9 });
M.grass = new THREE.MeshStandardMaterial({ map: tex.grass, roughness: 0.95 });
M.gravel = new THREE.MeshStandardMaterial({ map: tex.gravel, roughness: 1 });
M.paver = new THREE.MeshStandardMaterial({ color: 0x9c9890, roughness: 0.9 });
M.line = new THREE.MeshStandardMaterial({ color: 0xe9e9e4, roughness: 0.7 });
M.concrete = new THREE.MeshStandardMaterial({ map: tex.concrete, roughness: 0.32, metalness: 0.0, envMapIntensity: 0.6 });
M.panelWhite = new THREE.MeshStandardMaterial({ map: tex.panelWhite, roughness: 0.6, side: THREE.FrontSide });
M.glulam = new THREE.MeshStandardMaterial({ map: tex.glulam, roughness: 0.65 });
M.plank = new THREE.MeshStandardMaterial({ map: tex.plank, roughness: 0.7 });
M.steel = new THREE.MeshStandardMaterial({ color: 0x55585c, roughness: 0.35, metalness: 0.9 });
M.inox = new THREE.MeshStandardMaterial({ color: 0xc9ccd0, roughness: 0.22, metalness: 1.0 });
M.black = new THREE.MeshStandardMaterial({ color: 0x0c0d0e, roughness: 0.4, metalness: 0.2 });
M.white = new THREE.MeshStandardMaterial({ color: 0xf2f2ef, roughness: 0.55 });
M.ledOn = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff3e0, emissiveIntensity: 3.0 });
M.lampWarm = new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0xffc070, emissiveIntensity: 0 });
M.leaf = new THREE.MeshStandardMaterial({ map: tex.leaf, roughness: 0.9 });
M.trunk = new THREE.MeshStandardMaterial({ color: 0x4a3a2c, roughness: 1 });
M.fields = new THREE.MeshStandardMaterial({ map: tex.fields, roughness: 1 });
M.mountain = new THREE.MeshStandardMaterial({ map: tex.mountain, roughness: 1, flatShading: false });
M.hall = new THREE.MeshStandardMaterial({ color: 0xc9cbcc, roughness: 0.7, metalness: 0.2 });
M.hallDark = new THREE.MeshStandardMaterial({ color: 0x3d4146, roughness: 0.6, metalness: 0.3 });
for (const k of Object.keys(M)) M[k].shadowSide = THREE.DoubleSide;

// ---------------------------------------------------------------- Geometrie-Bausteine
const UP = new THREE.Vector3(0, 1, 0);
function box(w, h, d, mat, x, y, z, parent = scene, cast = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m;
}
// Box in lokalen Fassadenkoordinaten (u entlang, v hoch, n nach außen)
function fbox(F, u0, u1, v0, v1, n0, n1, mat, parent = scene) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(u1 - u0), Math.abs(v1 - v0), Math.abs(n1 - n0)), mat);
  const c = F.point((u0 + u1) / 2, (v0 + v1) / 2, (n0 + n1) / 2);
  m.position.copy(c); m.quaternion.copy(F.quat); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}

class Facade {
  constructor(origin, uDir, length, height) {
    this.o = origin.clone(); this.u = uDir.clone().normalize(); this.n = new THREE.Vector3().crossVectors(this.u, UP).normalize();
    this.L = length; this.H = height; this.bands = []; this.holes = [];
    const m = new THREE.Matrix4().makeBasis(this.u, UP, this.n); this.quat = new THREE.Quaternion().setFromRotationMatrix(m);
  }
  point(u, v, n = 0) { return this.o.clone().addScaledVector(this.u, u).addScaledVector(UP, v).addScaledVector(this.n, n); }
  band(u0, u1, mat) { this.bands.push({ u0, u1, mat }); return this; }
  hole(u0, u1, v0, v1, kind, opts = {}) { const h = { u0, u1, v0, v1, kind, ...opts }; this.holes.push(h); return h; }
  build(parent = scene, inward = false) {
    const us = new Set([0, this.L]), vs = new Set([0, this.H]);
    this.bands.forEach(b => { us.add(b.u0); us.add(b.u1); });
    this.holes.forEach(h => { us.add(h.u0); us.add(h.u1); vs.add(h.v0); vs.add(h.v1); });
    const U = [...us].filter(x => x >= 0 && x <= this.L).sort((a, b) => a - b), V = [...vs].filter(x => x >= 0 && x <= this.H).sort((a, b) => a - b);
    const per = new Map();
    for (let i = 0; i < U.length - 1; i++) for (let j = 0; j < V.length - 1; j++) {
      const u0 = U[i], u1 = U[i + 1], v0 = V[j], v1 = V[j + 1]; if (u1 - u0 < 1e-4 || v1 - v0 < 1e-4) continue;
      const cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
      if (this.holes.some(h => cu > h.u0 && cu < h.u1 && cv > h.v0 && cv < h.v1)) continue;
      let mat = M.anth; for (const b of this.bands) if (cu >= b.u0 && cu <= b.u1) mat = b.mat;
      if (inward) mat = this.inMat || M.panelWhite;
      if (!per.has(mat)) per.set(mat, []); per.get(mat).push([u0, u1, v0, v1]);
    }
    for (const [mat, cells] of per) {
      const pos = [], uv = [], nor = [], idx = []; let k = 0;
      const nn = inward ? this.n.clone().negate() : this.n;
      for (const [u0, u1, v0, v1] of cells) {
        const P = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
        for (const [u, v] of P) { const p = this.point(u, v, inward ? -0.2 : 0); pos.push(p.x, p.y, p.z); nor.push(nn.x, nn.y, nn.z); uv.push((this.uvOff || 0) + u * 0.5, v * 0.5); }
        if (inward) idx.push(k, k + 2, k + 1, k, k + 3, k + 2); else idx.push(k, k + 1, k + 2, k, k + 2, k + 3); k += 4;
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      const mesh = new THREE.Mesh(g, mat); mesh.castShadow = !inward; mesh.receiveShadow = true; parent.add(mesh);
    }
    if (!inward) this.holes.forEach(h => this.fill(h, parent));
  }
  fill(h, parent) {
    const F = this, fw = 0.065, depth = 0.16;
    if (h.kind === 'window') {
      const panes = h.panes || 2, clear = h.clear;
      // Rahmen
      fbox(F, h.u0, h.u1, h.v1 - fw, h.v1, -depth, 0.025, M.frame, parent);
      fbox(F, h.u0, h.u1, h.v0, h.v0 + fw, -depth, 0.025, M.frame, parent);
      fbox(F, h.u0, h.u0 + fw, h.v0, h.v1, -depth, 0.025, M.frame, parent);
      fbox(F, h.u1 - fw, h.u1, h.v0, h.v1, -depth, 0.025, M.frame, parent);
      for (let i = 1; i < panes; i++) { const u = h.u0 + (h.u1 - h.u0) * i / panes; fbox(F, u - fw / 2, u + fw / 2, h.v0, h.v1, -depth + 0.02, 0.0, M.frame, parent); }
      // Laibung
      fbox(F, h.u0, h.u1, h.v0 - 0.03, h.v0 + 0.002, -0.05, 0.06, M.flash, parent); // Fensterbank
      const gm = new THREE.Mesh(new THREE.PlaneGeometry(h.u1 - h.u0 - 2 * fw, h.v1 - h.v0 - 2 * fw), clear ? M.glassClear : M.glass);
      gm.position.copy(F.point((h.u0 + h.u1) / 2, (h.v0 + h.v1) / 2, -0.09)); gm.quaternion.copy(F.quat); gm.receiveShadow = true; parent.add(gm);
      // Laibungsflächen innen (Tiefe)
      if (!clear) { const back = new THREE.Mesh(new THREE.PlaneGeometry(h.u1 - h.u0, h.v1 - h.v0), M.black); back.position.copy(F.point((h.u0 + h.u1) / 2, (h.v0 + h.v1) / 2, -0.17)); back.quaternion.copy(F.quat); parent.add(back); }
    } else if (h.kind === 'door') {
      fbox(F, h.u0, h.u1, h.v1 - 0.07, h.v1, -0.14, 0.03, M.frame, parent);
      fbox(F, h.u0, h.u0 + 0.07, h.v0, h.v1, -0.14, 0.03, M.frame, parent);
      fbox(F, h.u1 - 0.07, h.u1, h.v0, h.v1, -0.14, 0.03, M.frame, parent);
      const leaf = fbox(F, h.u0 + 0.07, h.u1 - 0.07, h.v0, h.v1 - 0.07, -0.1, -0.05, M.frame, parent);
      // Glasausschnitt + Griffstange
      fbox(F, h.u0 + 0.22, h.u1 - 0.22, h.v0 + 1.0, h.v1 - 0.3, -0.049, -0.045, M.glass, parent);
      const gu = h.hingeLeft ? h.u1 - 0.2 : h.u0 + 0.2; fbox(F, gu - 0.017, gu + 0.017, h.v0 + 0.8, h.v0 + 1.7, -0.04, 0.03, M.inox, parent);
    } else if (h.kind === 'tor') {
      fbox(F, h.u0 - 0.09, h.u1 + 0.09, h.v1, h.v1 + 0.09, -0.05, 0.05, M.frame, parent);
      fbox(F, h.u0 - 0.09, h.u0, h.v0, h.v1, -0.05, 0.05, M.frame, parent);
      fbox(F, h.u1, h.u1 + 0.09, h.v0, h.v1, -0.05, 0.05, M.frame, parent);
      h.door = new SectionalDoor(F, h, parent);
    }
  }
}

// Sektionaltor mit echter Öffnungskinematik (Sektionen laufen in Schienen nach innen unter die Decke)
class SectionalDoor {
  constructor(F, h, parent) {
    this.F = F; this.h = h; this.n = 6; this.sh = (h.v1 - h.v0) / this.n; this.secs = [];
    const w = h.u1 - h.u0;
    for (let i = 0; i < this.n; i++) {
      const g = new THREE.BoxGeometry(w, this.sh - 0.006, 0.045);
      const uv = g.attributes.uv; // Paneeltextur 0.5 m pro Sektion
      for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * w * 0.5, uv.getY(k) * this.sh * 0.5);
      const m = new THREE.Mesh(g, M.door); m.castShadow = true; m.receiveShadow = true; parent.add(m); this.secs.push(m);
    }
    this.set(0);
  }
  // Schienenpfad: vertikal bis Höhe H, Radius r, dann horizontal nach innen
  track(d) {
    const H = this.h.v1 - this.h.v0, r = 0.45;
    if (d <= H) return { v: this.h.v0 + d, n: -0.08, a: 0 };
    const s = d - H; const arc = Math.PI / 2 * r;
    if (s <= arc) { const th = s / r; return { v: this.h.v0 + H + Math.sin(th) * r, n: -0.08 - (1 - Math.cos(th)) * r, a: th }; }
    return { v: this.h.v0 + H + r, n: -0.08 - r - (s - arc), a: Math.PI / 2 };
  }
  set(open) {
    this.open = open; const H = this.h.v1 - this.h.v0; const travel = open * (H + 0.6);
    const uc = (this.h.u0 + this.h.u1) / 2;
    for (let i = 0; i < this.n; i++) {
      const d = (this.n - 1 - i) * this.sh + this.sh / 2 + travel; // Sektion i=0 oben
      const p = this.track(d);
      const m = this.secs[i]; m.position.copy(this.F.point(uc, p.v, p.n));
      m.quaternion.copy(this.F.quat).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -p.a));
    }
  }
}

function numberPlane(F, n, u, v, size) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 320; const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.font = '700 300px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), 128, 172);
  const t = new THREE.CanvasTexture(c); t.anisotropy = MAXANISO;
  const mat = new THREE.MeshStandardMaterial({ color: 0x15161a, alphaMap: t, transparent: true, roughness: 0.45, metalness: 0.5, alphaTest: 0.3 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size * 0.8, size), mat); m.position.copy(F.point(u, v, 0.03)); m.quaternion.copy(F.quat); m.castShadow = true; scene.add(m);
  // leichte Plastizität: dahinterliegender Schatten-Duplikat
  const m2 = m.clone(); m2.material = mat.clone(); m2.material.color.set(0x000000); m2.material.opacity = 0.5; m2.position.copy(F.point(u + 0.015, v - 0.015, 0.012)); scene.add(m2);
}

// Wandleuchte (Up/Down) + optionale Spotlampe
const wallLamps = []; const nightLights = [];
function wallLamp(F, u, v) {
  const b = fbox(F, u - 0.06, u + 0.06, v - 0.13, v + 0.13, 0, 0.11, M.frame);
  const e1 = fbox(F, u - 0.045, u + 0.045, v + 0.13, v + 0.135, 0.01, 0.1, M.lampWarm);
  const e2 = fbox(F, u - 0.045, u + 0.045, v - 0.135, v - 0.13, 0.01, 0.1, M.lampWarm);
  wallLamps.push({ F, u, v });
}

// ---------------------------------------------------------------- Bauteil 1 (Hallen mit Büro, Nummern 1–7)
const B1 = { x0: 0, x1: 48.5, z0: -15, z1: 0, h: 7.1, units: 7 };
const UW = (B1.x1 - B1.x0) / B1.units;
const HERO = 4; // Einheit 4 wird geöffnet und innen gezeigt
const heroX0 = B1.x1 - HERO * UW, heroX1 = heroX0 + UW, heroXC = (heroX0 + heroX1) / 2;
let heroTor = null, heroKeypadLED = null;

function buildB1() {
  // Front (Nummern) – Blick aus -z: links = +x
  const F = new Facade(new THREE.Vector3(B1.x1, 0, B1.z0), new THREE.Vector3(-1, 0, 0), B1.x1 - B1.x0, B1.h);
  for (let n = 1; n <= 7; n++) {
    const u0 = (n - 1) * UW; const wood = 2.75;
    F.band(u0, u0 + wood, M.wood); F.band(u0 + wood, u0 + UW, M.anth);
    F.hole(u0 + 0.85, u0 + 1.95, 0, 2.25, 'door', { hingeLeft: false });
    F.hole(u0 + wood + 0.55, u0 + wood + 0.55 + 2.5, 0.95, 2.25, 'window', { panes: 2, clear: n === HERO });
    F.hole(u0 + 1.75, u0 + 1.75 + 4.0, 4.15, 5.2, 'window', { panes: 4, clear: n === HERO }); // Fensterband Büro (Galerie)
  }
  F.band(0, 0.001, M.wood); F.build();
  for (let n = 1; n <= 7; n++) {
    const u0 = (n - 1) * UW;
    numberPlane(F, n, u0 + 0.62, 3.25, 1.15);
    fbox(F, u0 + 0.6, u0 + 2.2, 2.42, 2.52, 0, 0.95, M.flash); // Vordach über Tür
    wallLamp(F, u0 + 2.45, 2.75);
  }
  // Rückseite zur Durchfahrt: Tore + Gehtür, Holzlisenen zwischen den Einheiten
  const R = new Facade(new THREE.Vector3(B1.x0, 0, B1.z1), new THREE.Vector3(1, 0, 0), B1.x1 - B1.x0, B1.h);
  for (let i = 0; i < 7; i++) {
    const u0 = i * UW; R.band(u0, u0 + 0.55, i === 0 ? M.anth : M.wood);
    const n = 7 - i; // Einheit-Nummer (Front-Nummern laufen gegenläufig)
    R.hole(u0 + 0.75, u0 + 1.75, 0, 2.25, 'door', { hingeLeft: false });
    const h = R.hole(u0 + 2.3, u0 + 2.3 + 4.0, 0, 4.5, 'tor');
    if (n === HERO) R.heroHole = h;
  }
  R.hole(0.0, 0.0001, 0, 0.0001, 'none');
  R.build();
  heroTor = R.heroHole.door;
  for (let i = 0; i < 7; i++) {
    const u0 = i * UW; wallLamp(R, u0 + 1.25, 3.0); wallLamp(R, u0 + 4.3, 5.1);
    if (i > 0) { fbox(R, u0 + 0.58, u0 + 0.68, 0.25, B1.h - 0.1, 0.02, 0.12, M.flash); } // Fallrohr
    // kein Codetaster – elektrische Tore
    const ku = u0 + 6.62; const led = new THREE.Mesh(new THREE.SphereGeometry(0.001), new THREE.MeshStandardMaterial());
    if (7 - i === HERO) { heroKeypadLED = led; B1.keypad = R.point(ku, 1.34, 0.035); B1.backF = R; }
  }
  // Stirnseiten
  const E1 = new Facade(new THREE.Vector3(B1.x0, 0, B1.z0), new THREE.Vector3(0, 0, 1), 15, B1.h);
  E1.band(0, 5.6, M.wood).band(5.6, 15, M.anth);
  [6.6, 8.4, 10.2].forEach(u => E1.hole(u, u + 0.75, 1.1, 5.4, 'window', { panes: 1 }));
  E1.build();
  const E2 = new Facade(new THREE.Vector3(B1.x1, 0, B1.z1), new THREE.Vector3(0, 0, -1), 15, B1.h);
  E2.band(0, 9.4, M.anth).band(9.4, 15, M.wood);
  [1.4, 3.2, 5.0].forEach(u => E2.hole(u, u + 0.75, 1.1, 5.4, 'window', { panes: 1 }));
  E2.build(); B1.E2 = E2;
  roofOf(B1.x0, B1.x1, B1.z0, B1.z1, B1.h);
  plinth(B1.x0, B1.x1, B1.z0, B1.z1);
}

// ---------------------------------------------------------------- Bauteil 2 (14 Lager-/Garagenboxen)
const B2 = { x0: 0, x1: 49, z0: 8, z1: 28, h: 7.0, units: 14 };
function buildB2() {
  const uw = (B2.x1 - B2.x0) / 14;
  // Seite zur Durchfahrt (Blick aus -z)
  const D = new Facade(new THREE.Vector3(B2.x1, 0, B2.z0), new THREE.Vector3(-1, 0, 0), 49, B2.h);
  D.band(0, 49, M.anth); D.band(36.6, 49, M.wood);
  for (let i = 0; i < 14; i++) {
    const u0 = i * uw; D.hole(u0 + 0.3, u0 + uw - 0.3, 0, 3.6, 'tor');
    D.hole(u0 + 0.35, u0 + uw - 0.35, 4.6, 5.55, 'window', { panes: 2 });
    if (i % 2 === 1 && u0 < 36) D.band(u0 + uw - 0.2, u0 + uw + 0.2, M.wood);
  }
  D.build();
  for (let i = 0; i < 14; i++) wallLamp(D, i * uw + uw / 2, 4.15);
  // Außenseite
  const O = new Facade(new THREE.Vector3(B2.x0, 0, B2.z1), new THREE.Vector3(1, 0, 0), 49, B2.h);
  O.band(0, 13.5, M.wood).band(13.5, 49, M.anth);
  O.hole(1.2, 2.2, 0, 2.25, 'door');
  for (let i = 1; i < 14; i++) { const u0 = i * uw; O.hole(u0 + 0.3, u0 + uw - 0.3, 0, 3.6, 'tor'); }
  for (let i = 0; i < 14; i++) { const u0 = i * uw; O.hole(u0 + 0.5, u0 + uw - 0.5, 4.7, 5.5, 'window', { panes: 2 }); }
  O.build();
  const E1 = new Facade(new THREE.Vector3(B2.x0, 0, B2.z0), new THREE.Vector3(0, 0, 1), 20, B2.h);
  E1.band(0, 12.4, M.anth).band(12.4, 20, M.wood); [3.5, 5.4, 9.1].forEach(u => E1.hole(u, u + 0.75, 1.1, 5.4, 'window', { panes: 1 })); E1.build();
  const E2 = new Facade(new THREE.Vector3(B2.x1, 0, B2.z1), new THREE.Vector3(0, 0, -1), 20, B2.h);
  E2.band(0, 7.6, M.wood).band(7.6, 20, M.anth); [10.6, 12.4, 14.2].forEach(u => E2.hole(u, u + 0.75, 1.1, 5.4, 'window', { panes: 1 })); E2.build(); B2.E2 = E2;
  roofOf(B2.x0, B2.x1, B2.z0, B2.z1, B2.h);
  plinth(B2.x0, B2.x1, B2.z0, B2.z1);
}

function roofOf(x0, x1, z0, z1, h) {
  const w = x1 - x0, d = z1 - z0;
  const g = new THREE.PlaneGeometry(w - 0.3, d - 0.3); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (w - 0.3) * 0.5, uv.getY(i) * (d - 0.3) * 0.5);
  const r = new THREE.Mesh(g, M.roof); r.rotation.x = -Math.PI / 2; r.position.set((x0 + x1) / 2, h - 0.25, (z0 + z1) / 2); r.receiveShadow = true; scene.add(r);
  // Deckel (Schattenwurf) + Attika-Abdeckung
  box(w - 0.12, 0.3, d - 0.12, M.flash, (x0 + x1) / 2, h - 0.42, (z0 + z1) / 2); // eingerückt: kein Z-Fighting mit der Fassade
  const t = 0.14, ah = 0.12;
  box(w + 0.06, ah, t, M.flash, (x0 + x1) / 2, h + ah / 2, z0 + t / 2 - 0.03);
  box(w + 0.06, ah, t, M.flash, (x0 + x1) / 2, h + ah / 2, z1 - t / 2 + 0.03);
  box(t, ah, d, M.flash, x0 + t / 2 - 0.03, h + ah / 2, (z0 + z1) / 2);
  box(t, ah, d, M.flash, x1 - t / 2 + 0.03, h + ah / 2, (z0 + z1) / 2);
  // Innenkante Attika
  box(w - 0.2, 0.3, 0.1, M.anth, (x0 + x1) / 2, h - 0.12, z0 + 0.15); box(w - 0.2, 0.3, 0.1, M.anth, (x0 + x1) / 2, h - 0.12, z1 - 0.15);
  box(0.1, 0.3, d - 0.2, M.anth, x0 + 0.15, h - 0.12, (z0 + z1) / 2); box(0.1, 0.3, d - 0.2, M.anth, x1 - 0.15, h - 0.12, (z0 + z1) / 2);
}
function plinth(x0, x1, z0, z1) {
  const t = 0.04, h = 0.22;
  box(x1 - x0 + 0.08, h, t, M.plinth, (x0 + x1) / 2, h / 2, z0 - t / 2, scene, false);
  box(x1 - x0 + 0.08, h, t, M.plinth, (x0 + x1) / 2, h / 2, z1 + t / 2, scene, false);
  box(t, h, z1 - z0, M.plinth, x0 - t / 2, h / 2, (z0 + z1) / 2, scene, false);
  box(t, h, z1 - z0, M.plinth, x1 + t / 2, h / 2, (z0 + z1) / 2, scene, false);
}

// ---------------------------------------------------------------- Innenraum Einheit 4 (Halle EG, Galerie mit Büro + WC)
const interior = new THREE.Group(); scene.add(interior);
const intLights = []; const ledRows = []; const anims = [];
function buildInterior() {
  const x0 = heroX0 + 0.12, x1 = heroX1 - 0.12, z0 = B1.z0 + 0.2, z1 = B1.z1 - 0.2, ceil = 6.55;
  const w = x1 - x0, d = z1 - z0, xc = (x0 + x1) / 2;
  // Boden
  const fg = new THREE.PlaneGeometry(w, d); const fuv = fg.attributes.uv; for (let i = 0; i < fuv.count; i++) fuv.setXY(i, fuv.getX(i) * w / 6, fuv.getY(i) * d / 6);
  const floor = new THREE.Mesh(fg, M.concrete); floor.rotation.x = -Math.PI / 2; floor.position.set(xc, 0.04, (z0 + z1) / 2); floor.receiveShadow = true; interior.add(floor);
  // Seitenwände (Trennwände) innen
  const wallMat = M.panelWhite;
  const side = (x, dir) => { const g = new THREE.PlaneGeometry(d, ceil); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * d * .5, uv.getY(i) * ceil * .5); const m = new THREE.Mesh(g, wallMat); m.rotation.y = dir * Math.PI / 2; m.position.set(x, ceil / 2, (z0 + z1) / 2); m.receiveShadow = true; m.castShadow = true; interior.add(m); };
  side(x0, 1); side(x1, -1);
  // Front- und Rückwand innen mit Öffnungen
  const Fi = new Facade(new THREE.Vector3(heroX1, 0, B1.z0), new THREE.Vector3(-1, 0, 0), UW, ceil);
  const u0 = 0, wood = 2.75; Fi.hole(u0 + 0.85, u0 + 1.95, 0, 2.25, 'door'); Fi.hole(u0 + wood + 0.55, u0 + wood + 3.05, 0.95, 2.25, 'window'); Fi.hole(u0 + 1.75, u0 + 5.75, 4.15, 5.2, 'window');
  Fi.build(interior, true);
  const Ri = new Facade(new THREE.Vector3(heroX0, 0, B1.z1), new THREE.Vector3(1, 0, 0), UW, ceil);
  Ri.hole(2.3, 6.3, 0, 4.5, 'tor'); Ri.hole(0.75, 1.75, 0, 2.25, 'door'); Ri.build(interior, true);
  // Decke
  const cg = new THREE.PlaneGeometry(w, d); const cuv = cg.attributes.uv; for (let i = 0; i < cuv.count; i++) cuv.setXY(i, cuv.getX(i) * w * .5, cuv.getY(i) * d * .5);
  const c = new THREE.Mesh(cg, M.panelWhite); c.rotation.x = Math.PI / 2; c.position.set(xc, ceil, (z0 + z1) / 2); interior.add(c);
  // Brettschichtholz-Binder quer + Pfetten
  for (let z = z0 + 0.6; z < z1; z += 2.1) box(w, 0.42, 0.16, M.glulam, xc, ceil - 0.21, z, interior);
  box(0.14, 0.24, d, M.glulam, x0 + 1.4, ceil - 0.54, (z0 + z1) / 2, interior); box(0.14, 0.24, d, M.glulam, x1 - 1.4, ceil - 0.54, (z0 + z1) / 2, interior);
  // Diagonalverband
  const diag = box(0.12, 0.12, Math.hypot(w, 6), M.glulam, xc, ceil - 0.5, z1 - 4, interior); diag.rotation.y = Math.atan2(w, 6);
  // Galerie (Lagerbühne) im vorderen Bereich
  const gd = 6.2, gy = 2.58, gt = 0.2, gz1 = z0 + gd;
  box(w, gt, gd, M.plank, xc, gy + gt / 2, z0 + gd / 2, interior);
  for (let x = x0 + 0.3; x < x1; x += 0.62) box(0.1, 0.24, gd, M.glulam, x, gy - 0.12, z0 + gd / 2, interior); // Balken
  box(w, 0.4, 0.2, M.glulam, xc, gy - 0.05, gz1 - 0.085, interior); // Randträger (1,5 cm vor Platte und Stützen: kein Z-Fighting)
  [x0 + 0.15, xc, x1 - 0.15].forEach(x => {
    box(0.2, gy, 0.2, M.glulam, x, gy / 2, gz1 - 0.1, interior);
    box(0.22, 0.12, 0.012, M.steel, x, gy - 0.32, gz1 + 0.021, interior); // Stahlverbinder
    for (const bx of [-0.06, 0.06]) for (const by of [-0.34, -0.29]) { const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 10), M.inox); bolt.rotation.x = Math.PI / 2; bolt.position.set(x + bx, gy + by, gz1 + 0.031); interior.add(bolt); }
  });
  B1.connector = new THREE.Vector3(xc, gy - 0.32, gz1 + 0.025);
  // Geländer (mit Öffnung an der Stiege, x0-Seite)
  const rh = 1.0, ry = gy + gt, gap = 1.15;
  for (let x = x0 + gap; x <= x1 + 0.01; x += (w - gap - 0.05) / 4) box(0.09, rh, 0.09, M.glulam, Math.min(x, x1 - 0.05), ry + rh / 2, gz1 - 0.05, interior);
  [0.35, 0.68, 1.0].forEach(hh => box(w - gap, 0.1, 0.05, M.glulam, (x0 + gap + x1) / 2, ry + hh - 0.05, gz1 - 0.02, interior));
  // Treppe entlang der Wand auf der Türseite (x0) vom Hallenboden zur Galerie
  const sw = 1.0, steps = 15, rise = (gy + gt) / steps, run = 0.27, sx = x0 + sw / 2 + 0.05;
  for (let i = 0; i < steps; i++) box(sw, 0.05, run + 0.03, M.plank, sx, rise * (i + 1) - 0.025, gz1 + steps * run - i * run - run / 2, interior);
  const sl = Math.hypot(steps * run, gy + gt);
  const st = box(0.06, 0.3, sl, M.glulam, sx + sw / 2, (gy + gt) / 2, gz1 + steps * run / 2, interior); st.rotation.x = Math.atan2(gy + gt, steps * run);
  const hr = box(0.05, 0.05, sl, M.glulam, sx + sw / 2, (gy + gt) / 2 + 0.95, gz1 + steps * run / 2, interior); hr.rotation.x = st.rotation.x;
  // Galerie = offenes Büro mit Fensterband. WC als kleiner Kubus vorne am Geländer, rechts vom Treppenaustritt.
  const oy = ry, oh = 2.25;
  box(w - 0.02, 0.02, gd - 0.02, M.plank, xc, oy + 0.01, z0 + gd / 2, interior); // Bodenbelag
  // WC-Kubus ganz rechts in der Ecke am Geländer (gegenüber der Stiege), Tür zur Raummitte
  const wx1 = x1, wx0 = x1 - 1.5, wz1 = gz1 - 0.2, wz0 = wz1 - 2.6, wxc = (wx0 + wx1) / 2, wzc = (wz0 + wz1) / 2;
  box(wx1 - wx0, oh, 0.1, M.white, wxc, oy + oh / 2, wz0, interior); box(wx1 - wx0, oh, 0.1, M.white, wxc, oy + oh / 2, wz1, interior);
  const dw = 0.8, dz0 = wzc - dw / 2;
  box(0.1, oh, dz0 - wz0, M.white, wx0, oy + oh / 2, (wz0 + dz0) / 2, interior); box(0.1, oh, wz1 - (dz0 + dw), M.white, wx0, oy + oh / 2, (dz0 + dw + wz1) / 2, interior);
  box(0.1, oh - 2.05, dw, M.white, wx0, oy + 2.05 + (oh - 2.05) / 2, dz0 + dw / 2, interior);
  box(0.04, 2.05, dw, M.frame, wx0 - 0.03, oy + 1.025, dz0 + dw / 2, interior);
  box(0.012, 0.03, 0.14, M.inox, wx0 - 0.065, oy + 1.02, dz0 + 0.12, interior);
  box(0.01, 0.14, 0.14, M.inox, wx0 - 0.055, oy + 1.6, dz0 + dw / 2, interior);
  box(wx1 - wx0 + 0.1, 0.06, wz1 - wz0 + 0.1, M.white, wxc, oy + oh + 0.03, wzc, interior); // Deckel
  // Kochecke an der Rückseite des WC-Kubus (Richtung Schreibtisch)
  const kz = wz0 - 0.05 - 0.31;
  box(1.4, 0.9, 0.62, M.white, wxc, oy + 0.45, kz, interior); box(1.42, 0.04, 0.64, M.black, wxc, oy + 0.92, kz, interior);
  box(1.4, 0.55, 0.36, M.white, wxc, oy + 1.85, wz0 - 0.05 - 0.18, interior);
  box(0.26, 0.34, 0.3, M.black, wxc - 0.4, oy + 1.11, kz - 0.02, interior); // Kaffeemaschine
  box(0.4, 0.02, 0.32, M.steel, wxc + 0.3, oy + 0.945, kz, interior); // Spüle
  // Möbel: richtiges Büro – zwei Arbeitsplätze, Aktenschränke, Sideboard mit Drucker, Whiteboard, Besprechungstisch
  const winC = heroX1 - 3.75, dz = z0 + 0.55, dx = winC;
  if (FILM2) buildFilm2(x0, x1, z0, z1, xc, gz1, oy, ceil, w); else {
  const mScr = new THREE.MeshStandardMaterial({ color: 0x0b1220, emissive: 0x9ab8e0, emissiveIntensity: 0.55, roughness: 0.2 });
  const mGrey = new THREE.MeshStandardMaterial({ color: 0x8c9096, roughness: 0.45, metalness: 0.2 });
  const mCab = new THREE.MeshStandardMaterial({ color: 0xf3f2ef, roughness: 0.55 });
  const mFab = new THREE.MeshStandardMaterial({ color: 0x2d3540, roughness: 0.9 });
  const mWb = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.15 });
  const chair = (cx, cz, ry) => {
    const g = new THREE.Group(); const b = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
    b(0.5, 0.07, 0.48, mFab, 0, 0.48, 0); const bk = b(0.46, 0.58, 0.06, mFab, 0, 0.86, 0.25); bk.rotation.x = -0.12;
    b(0.04, 0.32, 0.04, M.steel, 0, 0.3, 0); for (let i = 0; i < 5; i++) { const l = b(0.3, 0.03, 0.04, M.black, Math.cos(i * 1.2566) * 0.15, 0.06, Math.sin(i * 1.2566) * 0.15); l.rotation.y = -i * 1.2566; }
    for (const sx of [-0.27, 0.27]) { b(0.04, 0.2, 0.04, M.black, sx, 0.6, 0.02); b(0.06, 0.03, 0.26, M.black, sx, 0.71, 0.02); }
    g.position.set(cx, oy, cz); g.rotation.y = ry; interior.add(g); };
  const desk = (cx, w2) => {
    box(w2, 0.03, 0.8, M.plank, cx, oy + 0.74, dz, interior);
    for (const sx of [-1, 1]) box(0.05, 0.72, 0.7, M.black, cx + sx * (w2 / 2 - 0.05), oy + 0.36, dz, interior);
    box(w2 - 0.1, 0.3, 0.02, M.black, cx, oy + 0.55, dz - 0.36, interior); // Sichtblende
    for (const mx of [-0.33, 0.33]) { box(0.55, 0.33, 0.025, mScr, cx + mx, oy + 1.06, dz - 0.18, interior); box(0.57, 0.35, 0.02, M.black, cx + mx, oy + 1.06, dz - 0.195, interior); box(0.05, 0.16, 0.05, M.black, cx + mx, oy + 0.84, dz - 0.21, interior); box(0.2, 0.01, 0.16, M.black, cx + mx, oy + 0.76, dz - 0.2, interior); }
    box(0.44, 0.015, 0.14, M.steel, cx, oy + 0.763, dz + 0.12, interior); box(0.06, 0.02, 0.1, M.black, cx + 0.34, oy + 0.765, dz + 0.13, interior);
    box(0.15, 0.1, 0.1, M.black, cx - 0.62, oy + 0.8, dz - 0.05, interior); // Telefon
    box(0.3, 0.05, 0.22, M.white, cx + 0.62, oy + 0.78, dz - 0.02, interior); // Ablage
    chair(cx, dz + 0.7, Math.PI);
    box(0.4, 0.6, 0.55, mCab, cx - w2 / 2 + 0.3, oy + 0.3, dz + 0.0, interior); // Rollcontainer
  };
  desk(dx + 0.15, 1.6); desk(dx - 1.75, 1.6);
  // Aktenschränke an der Stiegen-Wand (x0) mit Ordnern
  const cz0 = z0 + 0.15;
  for (let i = 0; i < 3; i++) {
    const cz = cz0 + 0.42 + i * 0.84;
    box(0.45, 2.0, 0.82, mCab, x0 + 0.24, oy + 1.0, cz, interior);
    box(0.012, 0.14, 0.02, M.black, x0 + 0.475, oy + 1.05, cz + (i % 2 ? -0.3 : 0.3), interior);
    box(0.005, 1.96, 0.004, M.black, x0 + 0.47, oy + 1.0, cz, interior); // Türfuge
    if (i === 2) for (let k = 0; k < 7; k++) box(0.3, 0.32, 0.07, [M.black, mGrey, M.black, M.wood, M.black, mGrey, M.black][k], x0 + 0.24, oy + 2.18, cz - 0.3 + k * 0.09, interior); // Ordner oben
  }
  // Sideboard mit Drucker + Papier, Whiteboard darüber
  const sbz = z0 + 3.35;
  box(0.45, 0.75, 1.3, mCab, x0 + 0.24, oy + 0.375, sbz, interior); box(0.47, 0.03, 1.32, M.plank, x0 + 0.24, oy + 0.765, sbz, interior);
  box(0.42, 0.28, 0.46, mGrey, x0 + 0.26, oy + 0.92, sbz - 0.3, interior); box(0.43, 0.04, 0.3, M.black, x0 + 0.26, oy + 1.075, sbz - 0.3, interior); // Drucker
  box(0.3, 0.012, 0.22, M.white, x0 + 0.33, oy + 1.0, sbz - 0.3, interior); // Ausgabe-Papier
  box(0.3, 0.08, 0.21, M.white, x0 + 0.26, oy + 0.82, sbz + 0.25, interior); // Papierstapel
  box(0.02, 0.95, 1.5, mWb, x0 + 0.02, oy + 1.6, sbz, interior); box(0.025, 1.0, 0.03, mGrey, x0 + 0.02, oy + 1.6, sbz - 0.77, interior); box(0.025, 1.0, 0.03, mGrey, x0 + 0.02, oy + 1.6, sbz + 0.77, interior);
  box(0.025, 0.03, 1.55, mGrey, x0 + 0.02, oy + 2.1, sbz, interior); box(0.025, 0.03, 1.55, mGrey, x0 + 0.02, oy + 1.1, sbz, interior);
  for (let k = 0; k < 4; k++) box(0.005, 0.02, 0.5 - k * 0.08, M.black, x0 + 0.035, oy + 1.9 - k * 0.12, sbz - 0.3, interior); // Notizen
  // Besprechungstisch rund mit 3 Stühlen
  const tx = xc - 0.2, tz = z0 + 4.6;
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.03, 40), M.plank); top.position.set(tx, oy + 0.74, tz); top.castShadow = true; interior.add(top);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.72, 12), M.black); leg.position.set(tx, oy + 0.37, tz); interior.add(leg);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.02, 30), M.black); foot.position.set(tx, oy + 0.01, tz); interior.add(foot);
  chair(tx - 0.65, tz, -Math.PI / 2); chair(tx + 0.65, tz, Math.PI / 2); chair(tx, tz + 0.65, 0);
  const lap = box(0.32, 0.015, 0.22, M.steel, tx - 0.15, oy + 0.765, tz + 0.1, interior); lap.rotation.y = 0.4;
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.09, 16), M.white); cup.position.set(tx + 0.2, oy + 0.8, tz - 0.12); interior.add(cup);
  // Pendelleuchten über den Arbeitsplätzen
  for (const px of [dx + 0.15, dx - 1.75]) { box(0.01, 1.7, 0.01, M.black, px, oy + 3.0, dz + 0.1, interior); box(1.2, 0.05, 0.12, M.black, px, oy + 2.13, dz + 0.1, interior); box(1.15, 0.01, 0.1, M.ledOn, px, oy + 2.1, dz + 0.1, interior, false); }
  // Wanduhr
  const clk = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.03, 32), M.white); clk.rotation.z = Math.PI / 2; clk.position.set(x0 + 0.02, oy + 2.05, z0 + 2.9 + 0.0); interior.add(clk);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.42, 20), M.white); pot.position.set(x1 - 0.4, oy + 0.21, z0 + 0.45); interior.add(pot);
  const pl = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 2), M.leaf); pl.position.set(x1 - 0.4, oy + 0.85, z0 + 0.45); pl.scale.set(1, 1.3, 1); interior.add(pl);
  }
  const ox0 = x0, ox1 = x1, oz1 = z0 + 4.0;
  // LED-Lichtbänder
  for (let z = z0 + 1.6; z < z1; z += 2.1) { const mt = FILM2 ? M.ledOn.clone() : M.ledOn; if (FILM2) ledRows.push({ m: mt, z: z + 1.05 }); box(w * 0.7, 0.04, 0.12, mt, xc, ceil - 0.45, z + 1.05, interior, false); }
  // Innenlicht
  const hallL = new THREE.PointLight(0xfff1dd, 0, 22, 1.5); hallL.position.set(xc, 5.6, -5.5); interior.add(hallL); intLights.push({ l: hallL, i: 60 });
  const offL = new THREE.PointLight(0xffd9a8, 0, 7, 1.6); offL.position.set((ox0 + ox1) / 2, oy + 2.6, z0 + 2.2); interior.add(offL); intLights.push({ l: offL, i: 14 });
  const galL = new THREE.PointLight(0xfff1dd, 0, 12, 1.6); galL.position.set(xc, 5.8, z0 + 3); interior.add(galL); intLights.push({ l: galL, i: 22 });
  B1.office = { desk: new THREE.Vector3(dx, oy + 0.9, dz), ox0, ox1, oz1, oy };
  B1.int = { x0, x1, z0, z1, xc, gz1, gy: ry };
}

// ---------------------------------------------------------------- Film 2 „Licht an.“: Lager wächst, Büro richtet sich ein
const easeOutBack = k => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
const easeOutCubic = k => 1 - Math.pow(1 - k, 3);
function bounce(k) { const n1 = 7.5625, d1 = 2.75; if (k < 1 / d1) return n1 * k * k; if (k < 2 / d1) return n1 * (k -= 1.5 / d1) * k + .75; if (k < 2.5 / d1) return n1 * (k -= 2.25 / d1) * k + .9375; return n1 * (k -= 2.625 / d1) * k + .984375; }
// Gruppe mit Drehpunkt am Boden, erscheint zur Zeit t
function G(x, y, z, t, type = 'pop', dur = 0.5, ry = 0) { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; interior.add(g); anims.push({ g, t, type, dur, y }); return g; }
function GV(...a) { const g = G(...a); anims[anims.length - 1].vt = true; return g; } // Zeit = Video-Zeit (Rundumschwenk)
function gb(g, w, h, d, mat, x, y, z, cast = true) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; g.add(m); return m; }
function gc(g, rt, rb, h, mat, x, y, z, seg = 24) { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; }
function applyAnims(t, v = t) {
  for (const a of anims) {
    const k = ((a.vt ? v : t) - a.t) / a.dur; if (k <= 0) { a.g.visible = false; continue; }
    a.g.visible = true; const kk = Math.min(1, k);
    if (a.type === 'grow') a.g.scale.set(1, Math.max(0.001, easeOutCubic(kk)), 1);
    else if (a.type === 'pop') { const s = Math.max(0.001, easeOutBack(kk)); a.g.scale.set(s, s, s); }
    else if (a.type === 'drop') { a.g.position.y = a.y + (1 - bounce(kk)) * 1.3; }
  }
}
const F2 = {};
function buildFilm2(x0, x1, z0, z1, xc, gz1, oy, ceil, w) {
  const mat = (c, r = 0.6, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const mBlue = mat(0x1f4e9c, 0.45, 0.4), mOrange = mat(0xe0661b, 0.45, 0.3), mPal = mat(0xc9a678, 0.85), mCard = mat(0xb8875a, 0.85), mCard2 = mat(0xa87a4f, 0.85);
  const mWrap = mat(0xdfe3e6, 0.25, 0.05), mTape = mat(0xd9c39a, 0.5), mLabel = mat(0xf7f7f4, 0.6), mGreyS = mat(0x9ea3a8, 0.4, 0.6);
  const mOak = M.plank, mFab = mat(0x30363e, 0.92), mSage = mat(0x7d8f74, 0.95), mTerra = mat(0xb5643c, 0.9), mRug = mat(0x8d8780, 1), mRug2 = mat(0x5f6b73, 1);
  const mSofa = mat(0x56626e, 0.95), mCab = mat(0xf3f2ef, 0.55), mBlack = M.black, mArt1 = mat(0xc27a3e, 0.8), mArt2 = mat(0x2a3446, 0.8), mArt3 = mat(0xe8dccb, 0.8);
  F2.scr = new THREE.MeshStandardMaterial({ color: 0x0b1220, emissive: 0x9ab8e0, emissiveIntensity: 0, roughness: 0.2 });
  F2.lamp = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffe2b8, emissiveIntensity: 0 });

  // ------------------------------------------------ Halle unten: Palettenregal an der rechten Wand (x1)
  const rx1 = x1 - 0.05, rd = 1.1, rx0 = rx1 - rd, rxc = (rx0 + rx1) / 2, bayL = 2.7, zs = [-2.0, -4.7, -7.4], levels = [0.0, 1.75, 3.35], H = 4.9;
  zs.forEach((z, i) => { for (const x of [rx0 + 0.04, rx1 - 0.04]) { const g = G(x, 0.04, z, 8.9 + i * 0.25, 'grow', 0.7); gb(g, 0.08, H, 0.08, mBlue, 0, H / 2, 0); }
    const g = G(rxc, 0.04, z, 9.2 + i * 0.25, 'grow', 0.7); for (let y = 0.6; y < H; y += 1.1) { const d = gb(g, 0.03, 0.03, Math.hypot(rd, 1.1), mBlue, 0, y + 0.55, 0); d.rotation.x = Math.atan2(1.1, rd); d.rotation.y = Math.PI / 2; } });
  for (let b = 0; b < 2; b++) levels.slice(1).forEach((y, li) => { const g = G(rxc, y, (zs[b] + zs[b + 1]) / 2, 9.9 + b * 0.2 + li * 0.25, 'pop', 0.35);
    for (const x of [-rd / 2 + 0.05, rd / 2 - 0.05]) gb(g, 0.06, 0.13, bayL - 0.08, mOrange, x, -0.06, 0); });
  // Paletten mit Ware fallen ins Regal
  let pt = 10.6; const loads = ['card', 'wrap', 'card2', 'wrap', 'card', 'mix'];
  for (let b = 0; b < 2; b++) for (let li = 0; li < 3; li++) for (let s = 0; s < 3; s++) {
    const zc = (zs[b] + zs[b + 1]) / 2 + (s - 1) * 0.86, y = levels[li] + (li ? 0.0 : 0.04);
    if (b === 1 && li === 0 && s === 0) continue; // Lücke
    const g = G(rxc, y, zc, pt, 'drop', 0.55); pt += 0.17;
    gb(g, 1.2, 0.144, 0.8, mPal, 0, 0.072, 0);
    const kind = loads[(b * 9 + li * 3 + s) % loads.length], hh = 0.75 + ((b + li * 2 + s) % 3) * 0.18;
    if (kind === 'wrap') { gb(g, 1.16, hh, 0.78, mWrap, 0, 0.144 + hh / 2, 0); gb(g, 0.01, 0.18, 0.3, mLabel, -0.585, 0.144 + hh * 0.6, 0.1); }
    else { const n = kind === 'mix' ? 2 : 3; for (let iy = 0; iy < n; iy++) for (let ix = 0; ix < 2; ix++) for (let iz = 0; iz < 2; iz++) {
      const bh = hh / n; gb(g, 0.56, bh - 0.01, 0.37, (ix + iy + iz) % 2 ? mCard : mCard2, -0.29 + ix * 0.58, 0.144 + bh * (iy + 0.5), -0.19 + iz * 0.38);
      gb(g, 0.06, 0.003, 0.37, mTape, -0.29 + ix * 0.58, 0.144 + bh * (iy + 1) - 0.004, -0.19 + iz * 0.38, false); } }
  }
  // Fachbodenregale unter der Galerie (Wand x0) mit Kartons
  for (let i = 0; i < 3; i++) { const zc = z0 + 0.8 + i * 1.05, g = G(x0 + 0.3, 0.04, zc, 12.6 + i * 0.2, 'grow', 0.5);
    for (const dz of [-0.48, 0.48]) for (const dx of [-0.24, 0.24]) gb(g, 0.04, 2.1, 0.04, mGreyS, dx, 1.05, dz);
    [0.15, 0.75, 1.35, 1.95].forEach(y => gb(g, 0.5, 0.025, 1.0, mGreyS, 0, y, 0));
    const gB = G(x0 + 0.3, 0.04, zc, 13.0 + i * 0.2, 'pop', 0.4); [0.17, 0.77, 1.37].forEach((y, k) => { for (let j = 0; j < 2; j++) gb(gB, 0.42, 0.3 + ((i + k + j) % 2) * 0.1, 0.42, (i + j) % 2 ? mCard : mCard2, 0, y + 0.18 + ((i + k + j) % 2) * 0.05, -0.24 + j * 0.48); }); }
  // Hubwagen + Palettenstapel in der Halle
  const hw = G(xc - 1.55, 0.04, -1.25, 14.0, 'pop', 0.45, 2.2);
  for (const dx of [-0.2, 0.2]) gb(hw, 0.16, 0.08, 1.15, mOrange, dx, 0.06, 0); gb(hw, 0.56, 0.35, 0.2, mOrange, 0, 0.25, -0.62);
  const hd = gb(hw, 0.05, 1.1, 0.05, mBlack, 0, 0.85, -0.9); hd.rotation.x = -0.35; gb(hw, 0.36, 0.05, 0.05, mBlack, 0, 1.36, -1.08);
  const ps = G(xc - 1.35, 0.04, -2.9, 14.2, 'pop', 0.45, 0.15); for (let i = 0; i < 6; i++) gb(ps, 1.2, 0.144, 0.8, mPal, 0, 0.072 + i * 0.146, 0);
  // Werkbank unter der Lagerbühne an der rechten Wand (x1), Lochwand mit Werkzeug – Tür vorne bleibt frei
  const wb = GV(x1 - 0.4, 0.04, -11.7, 18.55, 'pop', 0.45, Math.PI);
  gb(wb, 0.75, 0.05, 2.0, mOak, 0, 0.9, 0); for (const dz of [-0.9, 0.9]) gb(wb, 0.7, 0.88, 0.06, mGreyS, 0, 0.44, dz); gb(wb, 0.7, 0.03, 1.9, mGreyS, 0, 0.2, 0);
  gb(wb, 0.6, 0.6, 0.55, mat(0x3d4652, 0.5, 0.3), 0, 0.55, -0.55); for (let i = 0; i < 4; i++) gb(wb, 0.01, 0.012, 0.3, M.inox, 0.305, 0.38 + i * 0.15, -0.55);
  gb(wb, 0.02, 0.85, 1.95, mat(0x6e7378, 0.5, 0.4), -0.34, 1.5, 0); for (let i = 0; i < 9; i++) gb(wb, 0.04, 0.18 + (i % 3) * 0.08, 0.05, i % 3 === 0 ? mOrange : i % 3 === 1 ? mBlack : mGreyS, -0.31, 1.4 + (i % 2) * 0.32, -0.8 + i * 0.2);
  gb(wb, 0.3, 0.15, 0.4, mOrange, 0.05, 1.0, 0.5); gb(wb, 0.14, 0.12, 0.2, mGreyS, 0.2, 0.99, -0.75); // Werkzeugkiste, Schraubstock
  const lamp = gb(wb, 0.06, 0.04, 1.6, F2.lamp, -0.1, 2.05, 0, false);
  const tc = GV(x1 - 0.32, 0.04, -9.75, 18.75, 'pop', 0.4, Math.PI); gb(tc, 0.55, 1.05, 0.65, mat(0xb52a1e, 0.4, 0.3), 0, 0.6, 0); for (let i = 0; i < 6; i++) gb(tc, 0.01, 0.012, 0.4, M.inox, 0.28, 0.22 + i * 0.16, 0); gc(tc, 0.05, 0.05, 0.06, mBlack, 0, 0.05, 0.2, 12);
  // Kleinteilemagazin mit Sichtlagerkästen unter dem Fenster (Front unter der Lagerbühne)
  const km = GV(23.15, 0.04, z0 + 0.3, 19.35, 'pop', 0.45); gb(km, 2.2, 0.86, 0.45, mGreyS, 0, 0.43, 0);
  const mBin = [mat(0x2a63c9, 0.5), mat(0xf2b31b, 0.5), mat(0xd84a26, 0.5)];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 9; c++) gb(km, 0.2, 0.2, 0.08, mBin[(r + (c > 5 ? 1 : 0)) % 3], -0.96 + c * 0.24, 0.17 + r * 0.26, 0.24);
  // Elektro-Stapler unter der Lagerbühne
  const fk = GV(24.5, 0.04, -11.6, 19.05, 'pop', 0.5, 0.25);
  gb(fk, 1.0, 0.75, 1.55, mOrange, 0, 0.55, 0); gb(fk, 1.02, 0.55, 0.45, mBlack, 0, 0.5, -0.82); gb(fk, 0.45, 0.12, 0.45, mBlack, 0, 1.0, -0.2); gb(fk, 0.45, 0.45, 0.08, mBlack, 0, 1.25, -0.42);
  for (const sx of [-0.45, 0.45]) for (const sz of [-0.62, 0.55]) gb(fk, 0.06, 1.25, 0.06, mBlack, sx, 1.55, sz); gb(fk, 1.0, 0.05, 1.25, mBlack, 0, 2.17, -0.03);
  for (const sx of [-0.3, 0.3]) { gb(fk, 0.08, 2.05, 0.1, mGreyS, sx, 1.07, 0.88); gb(fk, 0.1, 0.04, 1.0, mGreyS, sx, 0.12, 1.45); gb(fk, 0.1, 0.5, 0.04, mGreyS, sx, 0.35, 0.95); }
  gb(fk, 0.7, 0.06, 0.06, mGreyS, 0, 0.5, 0.95); gb(fk, 0.7, 0.06, 0.06, mGreyS, 0, 1.95, 0.88);
  for (const sx of [-0.5, 0.5]) for (const sz of [-0.55, 0.5]) { const w = gc(fk, 0.2, 0.2, 0.18, mBlack, sx, 0.2, sz, 18); w.rotation.z = Math.PI / 2; }
  // Gitterboxen + Palettenware auf der anderen Seite (unter / neben der Stiege)
  const ec = GV(x0 + 0.42, 0.04, -7.95, 20.35, 'pop', 0.4); for (let iy = 0; iy < 3; iy++) for (let iz = 0; iz < 2; iz++) gb(ec, 0.6, 0.31, 0.42, iy === 1 ? mBin[0] : mat(0x7b8288, 0.6), 0, 0.16 + iy * 0.32, -0.22 + iz * 0.44);
  [[22.75, -10.0, 19.5, 'wrap'], [22.75, -11.15, 19.65, 'card']].forEach(([px, pz, pt2, kind]) => { const g = GV(px, 0.04, pz, pt2, 'drop', 0.5, Math.PI / 2); gb(g, 1.2, 0.144, 0.8, mPal, 0, 0.072, 0);
    if (kind === 'wrap') { gb(g, 1.16, 1.1, 0.78, mWrap, 0, 0.144 + 0.55, 0); gb(g, 0.01, 0.18, 0.3, mLabel, -0.585, 0.8, 0.1); }
    else for (let iy = 0; iy < 3; iy++) for (let ix = 0; ix < 2; ix++) for (let iz = 0; iz < 2; iz++) gb(g, 0.56, 0.29, 0.37, (ix + iy + iz) % 2 ? mCard : mCard2, -0.29 + ix * 0.58, 0.144 + 0.3 * (iy + 0.5), -0.19 + iz * 0.38); });
  // Reifenregal an der Wand x0 beim Tor
  const tr = GV(x0 + 0.3, 0.04, -2.7, 21.45, 'grow', 0.5); const tyre = mat(0x16171a, 0.8), rimM = mat(0xa9b0b6, 0.3, 0.8);
  for (const dz of [-1.0, 1.0]) for (const dx of [-0.2, 0.2]) gb(tr, 0.04, 1.75, 0.04, mBlue, dx, 0.875, dz);
  [0.42, 1.18].forEach(y => { for (const dx of [-0.2, 0.2]) gb(tr, 0.04, 0.04, 2.04, mOrange, dx, y - 0.3, 0);
    for (let i = 0; i < 7; i++) { const t = gc(tr, 0.31, 0.31, 0.21, tyre, 0, y, -0.84 + i * 0.28, 24); t.rotation.x = Math.PI / 2; const r = gc(tr, 0.18, 0.18, 0.215, rimM, 0, y, -0.84 + i * 0.28, 16); r.rotation.x = Math.PI / 2; } });
  const fx = GV(x0 + 0.08, 0.04, -4.05, 21.6, 'pop', 0.35); gc(fx, 0.08, 0.08, 0.5, mat(0xc4161c, 0.35, 0.1), 0, 1.0, 0, 16); gb(fx, 0.02, 0.3, 0.3, mat(0xc4161c, 0.5), -0.05, 1.85, 0);

  // ------------------------------------------------ Galerie: Büro mit Raumkonzept
  const T0 = 19.75;
  const chair = (cx, cz, ry, t, fab = mFab) => { const g = G(cx, oy, cz, t, 'pop', 0.4, ry);
    gb(g, 0.5, 0.07, 0.48, fab, 0, 0.48, 0); const bk = gb(g, 0.46, 0.55, 0.06, fab, 0, 0.84, 0.24); bk.rotation.x = -0.12;
    gb(g, 0.04, 0.32, 0.04, M.steel, 0, 0.3, 0); for (let i = 0; i < 5; i++) { const l = gb(g, 0.3, 0.03, 0.04, mBlack, Math.cos(i * 1.2566) * 0.15, 0.05, Math.sin(i * 1.2566) * 0.15); l.rotation.y = -i * 1.2566; }
    for (const sx of [-0.27, 0.27]) { gb(g, 0.04, 0.2, 0.04, mBlack, sx, 0.6, 0.02); gb(g, 0.06, 0.03, 0.26, mBlack, sx, 0.71, 0.02); } };
  // Arbeitsinsel: 4 Plätze, quer zum Fensterband (blendfrei), Akustik-Trennwand
  const ix = 23.4, iz0 = z0 + 0.8, iz1 = iz0 + 2.8, izc = (iz0 + iz1) / 2;
  const rug = G(ix, oy + 0.02, izc, T0, 'pop', 0.4); gb(rug, 3.4, 0.012, 3.6, mRug, 0, 0.006, 0, false);
  const isl = G(ix, oy, izc, T0 + 0.2, 'pop', 0.45);
  gb(isl, 1.6, 0.035, 2.8, mOak, 0, 0.74, 0); for (const dz of [-1.35, 0, 1.35]) gb(isl, 1.5, 0.05, 0.06, mBlack, 0, 0.05, dz); for (const dz of [-1.35, 1.35]) for (const dx of [-0.7, 0.7]) gb(isl, 0.05, 0.7, 0.05, mBlack, dx, 0.39, dz);
  gb(isl, 0.03, 0.42, 2.7, mSage, 0, 0.97, 0);
  for (const side of [-1, 1]) for (const dz of [-0.7, 0.7]) {
    const g = G(ix + side * 0.32, oy + 0.757, izc + dz, T0 + 0.7 + (side + 1) * 0.1 + (dz > 0 ? 0.08 : 0), 'pop', 0.35, side > 0 ? -Math.PI / 2 : Math.PI / 2);
    gb(g, 0.64, 0.38, 0.025, F2.scr, 0, 0.42, 0.04); gb(g, 0.66, 0.4, 0.02, mBlack, 0, 0.42, 0.025); gb(g, 0.05, 0.2, 0.05, mBlack, 0, 0.12, 0.0); gb(g, 0.22, 0.012, 0.16, mBlack, 0, 0.006, 0.0);
    gb(g, 0.44, 0.015, 0.14, M.steel, 0, 0.008, -0.3); gb(g, 0.06, 0.02, 0.1, mBlack, 0.32, 0.01, -0.3);
    if (dz < 0) { const c = gc(g, 0.04, 0.035, 0.09, side > 0 ? mTerra : M.white, -0.45, 0.045, -0.25); }
    else { gb(g, 0.22, 0.02, 0.3, M.white, -0.42, 0.01, -0.22); }
    chair(ix + side * 1.25, izc + dz, side > 0 ? Math.PI / 2 : -Math.PI / 2, T0 + 1.05 + (side + 1) * 0.06 + (dz > 0 ? 0.1 : 0));
  }
  // Linearleuchte über der Insel
  const lin = G(ix, oy + 2.05, izc, T0 + 2.9, 'pop', 0.4); gb(lin, 0.14, 0.05, 2.6, mBlack, 0, 0, 0); gb(lin, 0.1, 0.01, 2.5, F2.lamp, 0, -0.03, 0, false); for (const dz of [-1.1, 1.1]) gb(lin, 0.008, 1.4, 0.008, mBlack, 0, 0.72, dz, false);
  // Schrankwand an der Wand x0: geschlossen + offen mit Ordnern, Büchern, Pflanzen
  const cw = 0.8; for (let i = 0; i < 4; i++) { const zc = z0 + 0.45 + i * cw, g = G(x0 + 0.23, oy, zc, T0 + 1.3 + i * 0.12, 'grow', 0.45);
    if (i % 3 === 0) { gb(g, 0.44, 2.05, cw - 0.02, mCab, 0, 1.025, 0); gb(g, 0.005, 2.0, 0.004, mBlack, 0.222, 1.02, 0); gb(g, 0.012, 0.16, 0.02, mBlack, 0.23, 1.05, 0.06); }
    else { gb(g, 0.44, 0.03, cw - 0.02, mOak, 0, 0.02, 0); [0.42, 0.84, 1.26, 1.68, 2.05].forEach(y => gb(g, 0.44, 0.03, cw - 0.02, mOak, 0, y, 0));
      for (const dzs of [-cw / 2 + 0.02, cw / 2 - 0.02]) gb(g, 0.44, 2.07, 0.02, mOak, 0, 1.03, dzs);
      [0.04, 0.46, 0.88, 1.3].forEach((y, k) => { const n = 4 + ((i + k) % 3); for (let j = 0; j < n; j++) gb(g, 0.3, 0.32 + (j % 2) * 0.04, 0.065, [mBlack, mArt2, M.white, mSage, mTerra][(j + k + i) % 5], 0.02, y + 0.18, -cw / 2 + 0.08 + j * 0.075); });
      const pp = gc(g, 0.08, 0.07, 0.14, M.white, 0.02, 1.77, 0.18); const pl = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 1), M.leaf); pl.position.set(0.02, 1.92, 0.18); g.add(pl); } }
  // Sideboard mit Drucker + großes Bild darüber
  const sbz = z0 + 4.15, sb = G(x0 + 0.23, oy, sbz, T0 + 1.8, 'pop', 0.4);
  gb(sb, 0.44, 0.72, 1.4, mCab, 0, 0.38, 0); gb(sb, 0.46, 0.03, 1.42, mOak, 0, 0.755, 0); for (const dz of [-0.35, 0.35]) gb(sb, 0.005, 0.6, 0.004, mBlack, 0.222, 0.38, dz);
  gb(sb, 0.4, 0.27, 0.45, mat(0xe9eaec, 0.45), 0.0, 0.905, -0.35); gb(sb, 0.41, 0.04, 0.3, mBlack, 0.0, 1.06, -0.35); gb(sb, 0.28, 0.012, 0.21, M.white, 0.08, 0.99, -0.35);
  gb(sb, 0.3, 0.09, 0.22, M.white, 0, 0.82, 0.3);
  const art = G(x0 + 0.02, oy + 1.2, sbz, T0 + 2.95, 'pop', 0.35); gb(art, 0.03, 1.0, 1.4, mBlack, 0, 0.5, 0); gb(art, 0.035, 0.92, 1.32, mArt3, 0, 0.5, 0);
  gb(art, 0.04, 0.5, 0.5, mArt1, 0, 0.62, -0.3); gb(art, 0.04, 0.34, 0.6, mArt2, 0, 0.3, 0.25); gb(art, 0.04, 0.14, 0.9, mSage, 0, 0.82, 0.12);
  // Besprechungsecke vor der Kaffeeküche: runder Tisch, 4 Stühle, Kugelleuchte
  const tx = x1 - 1.05, tz = z0 + 0.95, tb = G(tx, oy, tz, T0 + 2.1, 'pop', 0.4);
  gc(tb, 0.55, 0.55, 0.035, mOak, 0, 0.74, 0, 48); gc(tb, 0.04, 0.04, 0.72, mBlack, 0, 0.37, 0, 12); gc(tb, 0.3, 0.3, 0.02, mBlack, 0, 0.01, 0, 32);
  gb(tb, 0.32, 0.015, 0.22, M.steel, -0.12, 0.765, 0.08).rotation.y = 0.4; gc(tb, 0.04, 0.035, 0.09, M.white, 0.22, 0.8, -0.1, 16);
  [[0, -0.72, 0], [-0.72, 0, -Math.PI / 2], [0.72, 0, Math.PI / 2]].forEach(([dx, dz, ry], k) => chair(tx + dx, tz + dz, ry + Math.PI, T0 + 2.25 + k * 0.07, mTerra));
  const glb = G(tx, oy + 1.55, tz, T0 + 2.95, 'pop', 0.35); const sp = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 16), F2.lamp); sp.position.y = 0.2; glb.add(sp); gb(glb, 0.006, 1.3, 0.006, mBlack, 0, 1.05, 0, false);
  // Lounge zur Halle hin: Sofa, Couchtisch, Teppich, Bogenleuchte, Pflanzen
  const lz = gz1 - 1.15, lx = 23.9;
  const r2 = G(lx, oy + 0.02, lz + 0.1, T0 + 2.35, 'pop', 0.35); gb(r2, 2.5, 0.012, 1.8, mRug2, 0, 0.006, 0, false);
  const so = G(lx, oy, lz - 0.45, T0 + 2.45, 'pop', 0.45);
  gb(so, 2.0, 0.42, 0.88, mSofa, 0, 0.25, 0); gb(so, 2.0, 0.42, 0.2, mSofa, 0, 0.62, -0.34); for (const sx of [-0.92, 0.92]) gb(so, 0.18, 0.6, 0.88, mSofa, sx, 0.32, 0);
  for (const sx of [-0.45, 0.45]) gb(so, 0.86, 0.12, 0.62, mSofa, sx, 0.5, 0.08); gb(so, 0.4, 0.4, 0.12, mSage, -0.6, 0.72, -0.2).rotation.z = 0.15; gb(so, 0.38, 0.38, 0.12, mTerra, 0.62, 0.72, -0.2).rotation.z = -0.12;
  const ct = G(lx, oy, lz + 0.35, T0 + 2.6, 'pop', 0.35); gb(ct, 1.0, 0.04, 0.55, mOak, 0, 0.38, 0); for (const sx of [-0.45, 0.45]) for (const sz of [-0.22, 0.22]) gb(ct, 0.035, 0.36, 0.035, mBlack, sx, 0.18, sz);
  gb(ct, 0.28, 0.03, 0.2, mArt2, -0.2, 0.415, 0); gc(ct, 0.09, 0.07, 0.06, M.white, 0.25, 0.43, 0.05, 20);
  const fl = G(lx - 1.35, oy, lz - 0.5, T0 + 2.7, 'pop', 0.35); gc(fl, 0.15, 0.15, 0.03, mBlack, 0, 0.015, 0, 24); gb(fl, 0.025, 1.6, 0.025, mBlack, 0, 0.8, 0); const sh = gc(fl, 0.12, 0.2, 0.22, mArt3, 0, 1.62, 0, 24); const bulb = gc(fl, 0.1, 0.1, 0.01, F2.lamp, 0, 1.51, 0, 16);
  const plant = (x, z, t, s = 1) => { const g = G(x, oy, z, t, 'pop', 0.45); gc(g, 0.17 * s, 0.13 * s, 0.4 * s, mat(0xd9d4cc, 0.8), 0, 0.2 * s, 0, 20);
    for (let k = 0; k < 3; k++) { const l = new THREE.Mesh(new THREE.IcosahedronGeometry((0.3 - k * 0.05) * s, 2), M.leaf); l.position.set((k - 1) * 0.08 * s, (0.6 + k * 0.32) * s, (k % 2 ? 0.06 : -0.05) * s); l.scale.set(1, 1.15, 1); l.castShadow = true; g.add(l); } };
  plant(lx + 1.35, lz - 0.45, T0 + 2.8, 1.0); plant(x1 - 0.3, z0 + 0.32, T0 + 2.85, 1.15); plant(25.35, z0 + 0.35, T0 + 2.9, 0.8);
  // Kaffeeküche-Extras (erscheinen beim seitlichen Schwenk)
  const wx1 = x1, wx0 = x1 - 1.5, wz0 = gz1 - 0.2 - 2.6, kz = wz0 - 0.05 - 0.31, kc = (wx0 + wx1) / 2;
  const kk = G(kc, oy + 0.94, kz, 24.9, 'pop', 0.35);
  gb(kk, 1.4, 0.5, 0.015, mat(0x3f5a4e, 0.35), 0, 0.27, 0.3); // Fliesenspiegel
  gb(kk, 0.18, 0.02, 0.12, M.inox, -0.4, 0.21, -0.12); gc(kk, 0.03, 0.03, 0.06, M.white, -0.36, 0.03, -0.18, 12); gc(kk, 0.03, 0.03, 0.06, mTerra, -0.44, 0.03, -0.2, 12);
  gc(kk, 0.07, 0.08, 0.2, M.inox, 0.05, 0.1, 0.05, 20); gb(kk, 0.05, 0.12, 0.03, mBlack, 0.12, 0.12, 0.05);
  const bowl = gc(kk, 0.13, 0.08, 0.07, mOak, 0.55, 0.035, -0.1, 24); for (let k = 0; k < 4; k++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), [mOrange, mat(0x9bbf3f, 0.6), mOrange, mat(0xd8c23a, 0.6)][k]); f.position.set(0.55 + (k - 1.5) * 0.05, 0.09, -0.1 + (k % 2) * 0.04); kk.add(f); }
  gb(kk, 0.03, 0.06, 0.4, M.inox, 0.31, 0.03, 0.14); // Armatur
  const tap = gb(kk, 0.02, 0.25, 0.02, M.inox, 0.3, 0.13, 0.22);
  // Lichter Büro
  const ol = new THREE.PointLight(0xffd9a8, 0, 8, 1.6); ol.position.set(ix, oy + 1.9, izc); interior.add(ol); F2.offLights = [ol];
  const ol2 = new THREE.PointLight(0xffd9a8, 0, 6, 1.6); ol2.position.set(tx, oy + 1.4, tz); interior.add(ol2); F2.offLights.push(ol2);
  const ol3 = new THREE.PointLight(0xffd9a8, 0, 5, 1.6); ol3.position.set(lx - 1.35, oy + 1.4, lz - 0.5); interior.add(ol3); F2.offLights.push(ol3);
  const hl2 = new THREE.PointLight(0xfff1dd, 0, 16, 1.5); hl2.position.set(xc, 5.4, -3.0); interior.add(hl2); F2.hall2 = hl2;
  film2Switch(); film2Hand(); film2Van();
}
// ------------------------------------------------ Lichtschalter (Doppelwippe) neben der Gehtür
function film2Switch() {
  const mW = new THREE.MeshStandardMaterial({ color: 0xf4f3ef, roughness: 0.35 });
  const z = SW.z;
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.165, 0.088, 0.012), mW); plate.position.set(SW.x, SW.y, z - 0.006); plate.castShadow = false; plate.receiveShadow = true; interior.add(plate);
  F2.rockers = []; F2.swLed = new THREE.MeshStandardMaterial({ color: 0x331a08, emissive: 0xff8a2a, emissiveIntensity: 2.2 });
  for (const dx of [-0.04, 0.04]) {
    const piv = new THREE.Group(); piv.position.set(SW.x + dx, SW.y, z - 0.012); interior.add(piv);
    const r = new THREE.Mesh(new THREE.BoxGeometry(0.066, 0.066, 0.012), mW); r.position.z = -0.006; r.castShadow = false; r.receiveShadow = true; piv.add(r);
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.004, 0.002), F2.swLed); led.position.set(0, -0.022, -0.0125); piv.add(led);
    piv.rotation.x = -0.035; F2.rockers.push(piv);
  }
  const ledL = new THREE.PointLight(0xff9a40, 0, 0.6, 2); ledL.position.set(SW.x + 0.04, SW.y - 0.02, z - 0.06); interior.add(ledL); F2.swLedL = ledL;
  const fill = new THREE.PointLight(0x9fb4e6, 0, 3.5, 1.6); fill.position.set(23.3, 1.8, -1.2); interior.add(fill); F2.swFill = fill;
  const warm = new THREE.PointLight(0xffd2a0, 0, 2.2, 1.8); warm.position.set(23.2, 0.9, -0.75); interior.add(warm); F2.swWarm = warm;
}
// ------------------------------------------------ Hand mit Ärmel (Fingerspitze im Ursprung, Unterarm entlang -z)
function film2Hand() {
  const skin = new THREE.MeshStandardMaterial({ color: 0xd9a384, roughness: 0.55 }), sleeve = new THREE.MeshStandardMaterial({ color: 0x26344d, roughness: 0.92 }), cuffM = new THREE.MeshStandardMaterial({ color: 0x1c2638, roughness: 0.9 });
  const hand = new THREE.Group(); interior.add(hand); F2.hand = hand;
  const cap = (r, l, x, y, z, rx = 0, ry = 0, rz = 0, m = skin) => { const c = new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 6, 14), m); c.position.set(x, y, z); c.rotation.set(rx, ry, rz); c.castShadow = true; c.receiveShadow = true; hand.add(c); return c; };
  const H = Math.PI / 2;
  cap(0.0092, 0.07, 0, 0, -0.047, H);                      // Zeigefinger gestreckt
  const palm = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), skin); palm.scale.set(0.047, 0.021, 0.058); palm.position.set(0.02, -0.008, -0.135); palm.castShadow = true; hand.add(palm);
  [[0.023, 0.0098], [0.043, 0.0094], [0.061, 0.0084]].forEach(([x, r], i) => {   // eingerollte Finger
    cap(r, 0.026, x, -0.016, -0.088 - i * 0.004, H + 0.9);
    cap(r, 0.018, x, -0.037, -0.103 - i * 0.004, 0.35);
  });
  cap(0.0105, 0.04, -0.016, -0.02, -0.098, H - 0.35, 0.55, 0);   // Daumen
  const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.028, 0.07, 18), skin); wrist.rotation.x = H; wrist.scale.set(1.35, 1, 0.8); wrist.position.set(0.02, -0.01, -0.21); hand.add(wrist);
  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.043, 0.043, 0.035, 22), cuffM); cuff.rotation.x = H; cuff.position.set(0.02, -0.01, -0.245); cuff.castShadow = true; hand.add(cuff);
  const sl = new THREE.Mesh(new THREE.CylinderGeometry(0.047, 0.055, 0.6, 22), sleeve); sl.rotation.x = H; sl.position.set(0.02, -0.01, -0.56); sl.castShadow = true; hand.add(sl);
  hand.visible = false;
}
// ------------------------------------------------ Transporter (Front im Ursprung, fährt in -z)
function film2Van() {
  const mat = (c, r = 0.5, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const white = mat(0xeef0f2, 0.32, 0.15), dark = mat(0x1b1d21, 0.6), glass = mat(0x0c1118, 0.08, 0.3), orange = mat(0xe0661b, 0.45), tyre = mat(0x111111, 0.85), rim = mat(0x9aa1a8, 0.35, 0.7);
  const head = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4e0, emissiveIntensity: 4 }), tail = new THREE.MeshStandardMaterial({ color: 0x400000, emissive: 0xff2010, emissiveIntensity: 2.5 });
  const v = new THREE.Group(); scene.add(v); F2.van = v; v.visible = false;
  const b = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; v.add(o); return o; };
  b(2.0, 2.05, 4.35, white, 0, 0.38 + 1.025, 1.05 + 2.175);    // Kofferaufbau
  b(1.98, 0.92, 1.1, white, 0, 0.38 + 0.46, 0.55);             // Motorhaube
  const ws = b(1.86, 1.42, 0.05, glass, 0, 1.92, 0.62); ws.rotation.x = Math.atan2(0.85, 1.15); // Frontscheibe
  b(1.97, 1.2, 0.9, white, 0, 1.92, 1.12); const wd = b(1.97, 1.3, 0.5, white, 0, 1.84, 0.83); wd.rotation.x = Math.atan2(0.85, 1.15); // Kabine hinter der Scheibe
  for (const sx of [-1, 1]) { b(0.02, 0.62, 0.8, glass, sx * 1.0, 1.95, 1.4); b(0.02, 0.12, 4.0, orange, sx * 1.002, 1.05, 3.1); b(0.06, 0.12, 0.2, dark, sx * 1.08, 1.85, 0.95); }
  b(2.04, 0.28, 0.16, dark, 0, 0.5, 0.0); b(1.3, 0.3, 0.03, dark, 0, 0.92, -0.01);   // Stoßfänger, Grill
  for (const sx of [-1, 1]) { b(0.36, 0.13, 0.03, head, sx * 0.74, 1.04, -0.015); b(0.1, 0.32, 0.03, tail, sx * 0.94, 1.15, 5.41); }
  b(2.04, 0.22, 0.12, dark, 0, 0.48, 5.4);
  for (const sx of [-1, 1]) for (const z of [0.82, 4.35]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.26, 28), tyre); w.rotation.z = Math.PI / 2; w.position.set(sx * 0.9, 0.37, z); w.castShadow = true; v.add(w);
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.27, 20), rim); r.rotation.z = Math.PI / 2; r.position.copy(w.position); v.add(r);
  }
  F2.vanSpots = [];
  for (const sx of [-1, 1]) { const sp = new THREE.SpotLight(0xfff1dc, 0, 30, 0.5, 0.6, 1.4); sp.position.set(sx * 0.74, 1.04, -0.1); const tg = new THREE.Object3D(); tg.position.set(sx * 0.9, 0.2, -10); v.add(tg); sp.target = tg; v.add(sp); F2.vanSpots.push(sp); }
}
// Schalter, Hand, Transporter nach Video-Zeit v
function film2Extras(v) {
  const ls = v - F2T.cover; // Zeit im Schalter-Shot
  const inSw = ls >= 0 && ls < F2T.sw;
  const pressed = ls >= F2T.pressAt || v < F2T.cover;
  F2.rockers[1].rotation.x = pressed ? 0.035 : -0.035; F2.rockers[0].rotation.x = v < F2T.cover ? 0.035 : -0.035;
  F2.swLed.emissiveIntensity = pressed ? 0.25 : 2.2; F2.swLedL.intensity = inSw && !pressed ? 0.05 : 0;
  F2.swFill.intensity = inSw ? 1.4 : 0; F2.swWarm.intensity = 0;
  // Hand: von rechts unten herein, drückt, zieht zurück
  const hand = F2.hand; hand.visible = inSw && ls > 0.2 && ls < 1.58;
  if (hand.visible) {
    const dir = new THREE.Vector3(-0.5, -0.5, -1).normalize(); // Richtung zum Ellbogen
    const press = new THREE.Vector3(SW.x + 0.041, SW.y + 0.012, SW.z - 0.016);
    let d; const e = k => easeOutCubic(Math.min(1, Math.max(0, k)));
    if (ls < 0.88) d = 0.012 + (1 - e((ls - 0.2) / 0.68)) * 0.42;
    else if (ls < 0.95) d = 0.012 - 0.012 * e((ls - 0.88) / 0.07);
    else if (ls < 1.1) d = 0.0;
    else d = e((ls - 1.1) / 0.48) * 0.4;
    const pos = press.clone().addScaledVector(dir, d); if (ls >= 1.1) pos.x -= e((ls - 1.1) / 0.48) * 0.08;
    hand.position.copy(pos); hand.lookAt(pos.clone().sub(dir));
    hand.rotateZ(0.35);
  }
  // Transporter
  const g = v - F2T.gateAt; const van = F2.van; van.visible = v >= F2T.gateAt;
  if (van.visible) {
    const k = Math.min(1, Math.max(0, (g - 1.25) / 3.0)); const zf = 15 + (-4.2 - 15) * easeOutCubic(k);
    van.position.set(heroX0 + 4.3, 0.04, zf);
    F2.vanSpots.forEach(sp => sp.intensity = g < F2T.gateLen + 0.01 ? 60 : 0);
  }
}
// beleuchtete Fenster der Einheit 4 von außen (Endeinstellung)
function film2LitWindows() {
  const m = new THREE.MeshStandardMaterial({ color: 0xffe0b0, emissive: 0xffc27a, emissiveIntensity: 0.55, transparent: true, opacity: 0.6, roughness: 0.1 });
  const z = B1.z0 - 0.07; const add = (xa, xb, ya, yb) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(xb - xa - 0.13, yb - ya - 0.13), m); p.position.set((xa + xb) / 2, (ya + yb) / 2, z); p.rotation.y = Math.PI; scene.add(p); };
  add(heroX1 - 5.75, heroX1 - 1.75, 4.15, 5.2); add(heroX1 - 5.8, heroX1 - 3.3, 0.95, 2.25);
}
// Licht-Zeitplan: Reihen gehen nacheinander an (mit kurzem Flackern), Büro ab 22.6 s
function film2Light(t) {
  const rows = [...ledRows].sort((a, b) => b.z - a.z); let on = 0;
  rows.forEach((r, i) => { const ti = 1.05 + i * 0.2, d = t - ti; const v = d < 0 ? 0 : d < 0.05 ? 1 : d < 0.11 ? 0.12 : 1; r.m.emissiveIntensity = v * 3.2; r.m.emissive.set(v > 0 ? 0xfff3e0 : 0x000000); on += v; });
  const L = on / rows.length, o = Math.min(1, Math.max(0, (t - 22.6) / 0.35));
  intLights.forEach(x => x.l.intensity = x.i * L * 1.1); F2.hall2.intensity = 40 * L;
  F2.offLights.forEach((l, k) => l.intensity = [9, 5, 4][k] * o); F2.lamp.emissiveIntensity = 2.6 * o;
  F2.scr.emissiveIntensity = 0.6 * Math.min(1, Math.max(0, (t - 23.0) / 0.4));
}


// ---------------------------------------------------------------- Außenanlage
function plane(w, d, mat, x, z, y = 0, rep = 0.5) {
  const g = new THREE.PlaneGeometry(w, d); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w * rep, uv.getY(i) * d * rep);
  const m = new THREE.Mesh(g, mat); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true; scene.add(m); return m;
}
const trees = [];
function tree(x, z, h = 6, r = 2.2, young = false) {
  const g = new THREE.Group();
  const t = new THREE.Mesh(new THREE.CylinderGeometry(young ? 0.06 : 0.15, young ? 0.08 : 0.25, h * 0.55, 8), M.trunk); t.position.y = h * 0.275; t.castShadow = true; g.add(t);
  const n = young ? 3 : 5;
  for (let i = 0; i < n; i++) {
    const geo = new THREE.IcosahedronGeometry(r * rr(0.55, 0.85), 2); const p = geo.attributes.position;
    for (let k = 0; k < p.count; k++) { const v = new THREE.Vector3().fromBufferAttribute(p, k); const s = 1 + (fbm(v.x * 1.7 + i, v.y * 1.7 + v.z, 3) - 0.5) * 0.5; p.setXYZ(k, v.x * s, v.y * s, v.z * s); }
    geo.computeVertexNormals();
    const c = new THREE.Mesh(geo, M.leaf); c.position.set(rr(-r, r) * 0.45, h * 0.62 + rr(-0.3, 0.6) * r * 0.6, rr(-r, r) * 0.45); c.castShadow = true; c.receiveShadow = true; g.add(c);
  }
  g.position.set(x, 0, z); scene.add(g); trees.push(g); return g;
}
function hedge(x0, x1, z, h = 1.4, alongZ = false) {
  const len = Math.abs(x1 - x0); const g = new THREE.BoxGeometry(alongZ ? 1.0 : len, h, alongZ ? len : 1.0, Math.ceil(len), 3, 2);
  const p = g.attributes.position; for (let k = 0; k < p.count; k++) { const v = new THREE.Vector3().fromBufferAttribute(p, k); const s = (fbm(v.x * 0.9 + v.z, v.y * 1.3, 3) - 0.5) * 0.25; p.setXYZ(k, v.x + s, v.y + s * 0.6, v.z + s); }
  g.computeVertexNormals(); const m = new THREE.Mesh(g, M.leaf);
  if (alongZ) m.position.set(z, h / 2, (x0 + x1) / 2); else m.position.set((x0 + x1) / 2, h / 2, z);
  m.castShadow = true; m.receiveShadow = true; scene.add(m);
}
function lightPole(x, z) {
  box(0.12, 6, 0.12, M.frame, x, 3, z); box(0.9, 0.08, 0.25, M.frame, x + 0.4, 6, z);
  const e = box(0.6, 0.02, 0.18, M.lampWarm, x + 0.5, 5.95, z, scene, false); nightLights.push(new THREE.Vector3(x + 0.5, 5.8, z));
}
function buildSite() {
  // Weite Landschaft
  const fg = new THREE.PlaneGeometry(9000, 9000); const fuv = fg.attributes.uv; for (let i = 0; i < fuv.count; i++) fuv.setXY(i, fuv.getX(i) * 4.4, fuv.getY(i) * 4.4);
  const f = new THREE.Mesh(fg, M.fields); f.rotation.x = -Math.PI / 2; f.position.y = -0.5; f.receiveShadow = true; scene.add(f);
  // Grundstück: Asphalt
  plane(56.5, 54.2, M.asphalt, 24.25, 6.0, 0.0, 0.25);
  // Kies-Traufstreifen um die Gebäude
  [[B1.x0, B1.x1, B1.z0, B1.z1]].forEach(([x0, x1, z0, z1]) => {
    plane(x1 - x0 + 1.0, 0.5, M.gravel, (x0 + x1) / 2, z0 - 0.25, 0.03, 1); plane(x1 - x0 + 1.0, 0.5, M.gravel, (x0 + x1) / 2, z1 + 0.25, 0.03, 1);
    plane(0.5, z1 - z0, M.gravel, x0 - 0.25, (z0 + z1) / 2, 0.03, 1); plane(0.5, z1 - z0, M.gravel, x1 + 0.25, (z0 + z1) / 2, 0.03, 1);
  });
  // Pflasterflächen vor den Türen (Front B1)
  for (let n = 1; n <= 7; n++) { const xr = B1.x1 - (n - 1) * UW; plane(1.6, 1.5, M.paver, xr - 1.4, B1.z0 - 1.25, 0.035, 1); }
  // Stellplätze vor B1 (Front): Markierungen
  for (let i = 0; i <= 7; i++) { const x = B1.x1 - i * UW; plane(0.12, 5.0, M.line, x, B1.z0 - 3.2, 0.03, 1); }
  plane(48.5, 0.12, M.line, 24.25, B1.z0 - 5.7, 0.03, 1);
  // Grünflächen lt. Lageplan
  plane(4.0, 54.2, M.grass, -2.0, 6.0, 0.06, 0.5); // West 213 m²
  plane(4.4, 12.0, M.grass, 51.6, -8.5, 0.06, 0.5); // Ost-Nord
  plane(4.4, 10.0, M.grass, 51.6, 19.5, 0.06, 0.5); // Ost-Süd
  plane(56.5, 2.0, M.grass, 24.25, -22.0, 0.06, 0.5);
  // Straße außen
  plane(1200, 7, M.asphalt, 0, -26, 0.0, 0.25); plane(7, 600, M.asphalt, 57.5, 0, -0.01, 0.25);
  plane(1200, 0.15, M.line, 0, -26, 0.03, 1);
  // Hecken, junge Bäume
  hedge(-21, 33, -3.2, 1.6, true);
  hedge(-21, -5, 53.6, 1.4, true); hedge(14, 33, 53.6, 1.4, true);
  [[-2, -16], [-2, -6], [-2, 4], [-2, 14], [-2, 24], [-2, 31]].forEach(([x, z]) => tree(x, z, rr(5, 6.5), rr(1.6, 2.1), true));
  [[51.6, -12], [51.6, -5], [51.6, 18], [51.6, 22]].forEach(([x, z]) => tree(x, z, rr(5, 6), rr(1.5, 1.9), true));
  // Fläche von Bauteil 2 (noch nicht gebaut): gepflegte Wiese mit Baumgruppe
  plane(50, 22, M.grass, 24.5, 19.5, 0.05, 0.5);
  [[8, 16], [14, 22], [22, 17], [31, 23], [40, 18], [45, 25]].forEach(([x, z]) => tree(x, z, rr(5.5, 7), rr(1.8, 2.3), true));
  // Laternen entlang der Zufahrt
  [[52.5, -14], [52.5, 4], [-1.2, -21.2], [-1.2, 4]].forEach(([x, z]) => lightPole(x, z));
  // Wärmepumpen-Außengeräte (lt. Lageplan zwischen den Bauteilen)
  box(1.1, 1.3, 0.5, M.white, 47.2, 0.65, 0.6); // Wärmepumpe am Gebäudeende
  // Firmenschild an der Ost-Stirnseite B1
  logoSign(B1.E2, 12.2, 4.4, 4.6);
  // Nachbar-Gewerbehallen
  seed = 77;
  const neigh = [[-46, -10, 30, 22, 8, M.hall], [-48, 30, 34, 26, 9, M.hall], [-12, 72, 44, 20, 8, M.hallDark], [42, 78, 30, 18, 7, M.hall], [96, -4, 26, 40, 9, M.hallDark], [104, 52, 34, 24, 8, M.hall], [-96, 40, 40, 30, 10, M.hall]];
  neigh.forEach(([x, z, w, d, h, mat]) => {
    box(w, h, d, mat, x, h / 2, z); const r = box(w + 0.6, 0.6, d + 0.6, M.flash, x, h + 0.3, z);
    box(w * 0.2, h * 0.5, 0.1, M.hallDark, x - w * 0.2, h * 0.25, z - d / 2 - 0.05);
    plane(w + 14, d + 14, M.asphalt, x, z, -0.02, 0.25);
  });
  // Baumreihen / Waldkanten in der Ferne
  seed = 4242;
  for (let i = 0; i < 70; i++) { const a = rr(0, Math.PI * 2), d = rr(140, 520); tree(24 + Math.cos(a) * d, 6 + Math.sin(a) * d, rr(9, 15), rr(3.5, 5.5)); }
  for (let i = 0; i < 40; i++) tree(-180 + i * 9 + rr(-2, 2), 240 + rr(-3, 3), rr(10, 15), rr(4, 5.5));
  for (let i = 0; i < 30; i++) tree(220 + rr(-3, 3), -150 + i * 10, rr(10, 14), rr(4, 5));
  // Bergkette (Karawanken-Silhouette)
  const mg = new THREE.CylinderGeometry(3200, 3200, 1, 256, 24, true); const mp = mg.attributes.position;
  const ring = new THREE.BufferGeometry(); const pos = [], uv = [], idx = []; const segs = 360, rows = 18;
  for (let j = 0; j <= rows; j++) for (let i = 0; i <= segs; i++) {
    const a = i / segs * Math.PI * 2, t = j / rows; const R = 2600 - t * 1300;
    const ridge = (fbm(a * 6, 1.3, 5) * 0.75 + 0.25) * (0.5 + 0.5 * Math.max(0, Math.sin(a + 0.6))) ;
    const hgt = Math.pow(Math.sin(t * Math.PI), 1.1) * (120 + 680 * ridge) * (1 - 0.15 * fbm(a * 30, t * 4, 3));
    pos.push(24 + Math.cos(a) * R, hgt - 4, 6 + Math.sin(a) * R); uv.push(i / segs * 40, t * 4);
  }
  for (let j = 0; j < rows; j++) for (let i = 0; i < segs; i++) { const a = j * (segs + 1) + i, b = a + 1, c = a + segs + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  ring.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); ring.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); ring.setIndex(idx); ring.computeVertexNormals();
  const mtn = new THREE.Mesh(ring, M.mountain); mtn.material.side = THREE.DoubleSide; scene.add(mtn);
}
function logoSign(F, u, v, w) {
  const img = new Image(); img.src = 'logo.png';
  const t = new THREE.Texture(img); img.onload = () => { t.needsUpdate = true; }; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = MAXANISO;
  const h = w * 0.55;
  fbox(F, u - w / 2 - 0.15, u + w / 2 + 0.15, v - h / 2 - 0.12, v + h / 2 + 0.12, 0, 0.05, M.white);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 1158 / 2160), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.5 }));
  m.position.copy(F.point(u, v, 0.055)); m.quaternion.copy(F.quat); scene.add(m);
  B1.sign = F.point(u, v, 0);
}

// ---------------------------------------------------------------- Licht, Himmel
const sky = new Sky(); sky.scale.setScalar(12000); scene.add(sky);
const sun = new THREE.DirectionalLight(0xffffff, 3); sun.castShadow = true; sun.shadow.mapSize.set(3072, 3072);
sun.shadow.bias = -0.0002; sun.shadow.normalBias = 0.03; scene.add(sun); scene.add(sun.target);
const hemi = new THREE.HemisphereLight(0xbcd3ff, 0x5a5040, 0.5); scene.add(hemi);
scene.fog = new THREE.FogExp2(0xc8cfd6, 0.00022);
const pmrem = new THREE.PMREMGenerator(renderer);
const skyScene = new THREE.Scene(); const sky2 = new Sky(); sky2.scale.setScalar(1000); skyScene.add(sky2);
let envRT = null;
// Nachtlichter (Spots an Wandleuchten), lazy angelegt
const lampLights = [];
function setupLampLights() {
  for (const L of wallLamps) {
    const p = L.F.point(L.u, L.v, 0.15);
    const sp = new THREE.SpotLight(0xffb866, 0, 9, Math.PI / 3.2, 0.7, 1.6);
    sp.position.copy(p); sp.target.position.copy(L.F.point(L.u, L.v - 3, 0.1)); scene.add(sp); scene.add(sp.target);
    const up = new THREE.SpotLight(0xffb866, 0, 6, Math.PI / 4, 0.8, 1.6); up.position.copy(p); up.target.position.copy(L.F.point(L.u, L.v + 3, 0.1)); scene.add(up); scene.add(up.target);
    lampLights.push(sp, up);
  }
  for (const p of nightLights) { const s = new THREE.SpotLight(0xffd7a0, 0, 26, Math.PI / 3, 0.6, 1.4); s.position.copy(p); s.target.position.set(p.x, 0, p.z); scene.add(s); scene.add(s.target); lampLights.push(s); }
}
let currentLook = null;
function applyLook(L) {
  const key = JSON.stringify(L); if (key === currentLook) return; currentLook = key;
  const phi = THREE.MathUtils.degToRad(90 - L.elev), theta = THREE.MathUtils.degToRad(L.azim);
  const sv = new THREE.Vector3().setFromSphericalCoords(1, phi, theta);
  for (const s of [sky, sky2]) { const u = s.material.uniforms; u.sunPosition.value.copy(sv); u.turbidity.value = L.turbidity ?? 6; u.rayleigh.value = L.rayleigh ?? 1.6; u.mieCoefficient.value = L.mie ?? 0.006; u.mieDirectionalG.value = 0.86; }
  if (envRT) envRT.dispose(); envRT = pmrem.fromScene(skyScene, 0.02); scene.environment = envRT.texture; scene.environmentIntensity = L.envI ?? 1.0;
  sun.color.set(L.sunColor ?? 0xffe2bd); sun.intensity = L.sunI ?? 3.2;
  hemi.intensity = L.hemiI ?? 0.35; hemi.color.set(L.hemiSky ?? 0xbcd3ff);
  renderer.toneMappingExposure = L.exposure ?? 0.55;
  scene.fog.color.set(L.fog ?? 0xc9c7c4); scene.fog.density = L.fogD ?? 0.00022;
  const night = L.night ?? 0;
  M.lampWarm.emissiveIntensity = night * 8; M.ledOn.emissiveIntensity = 2.5 + night * 2;
  lampLights.forEach(l => l.intensity = night * 22);
  intLights.forEach(o => o.l.intensity = o.i * (L.intI ?? 1));
  bloom.strength = L.bloom ?? 0.18;
  sun.userData.dir = sv;
}
function setShadowBox(c, r) {
  const d = sun.userData.dir || new THREE.Vector3(0, 1, 0);
  sun.position.copy(c).addScaledVector(d, 300); sun.target.position.copy(c);
  const cam = sun.shadow.camera; cam.left = -r; cam.right = r; cam.top = r; cam.bottom = -r; cam.near = 1; cam.far = 700; cam.updateProjectionMatrix();
}

// ---------------------------------------------------------------- Post
const rt = new THREE.WebGLRenderTarget(W * SCALE, H * SCALE, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, rt);
composer.setPixelRatio(1); composer.setSize(W * SCALE, H * SCALE);
composer.addPass(new RenderPass(scene, camera));
let gtao = null;
if (USE_AO) { gtao = new GTAOPass(scene, camera, W * SCALE, H * SCALE); gtao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.2, thickness: 1.5, scale: 1.0, samples: 12 }); gtao.blendIntensity = 0.85; composer.addPass(gtao); }
const bloom = new UnrealBloomPass(new THREE.Vector2(W * SCALE / 2, H * SCALE / 2), 0.18, 0.55, 0.92); composer.addPass(bloom);
composer.addPass(new OutputPass());
const grade = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, time: { value: 0 }, vig: { value: 0.32 }, fade: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float time, vig, fade; varying vec2 vUv;
    float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
    void main(){ vec2 d=vUv-.5; float ca=.0009*length(d);
      vec3 c=vec3(texture2D(tDiffuse,vUv+d*ca).r, texture2D(tDiffuse,vUv).g, texture2D(tDiffuse,vUv-d*ca).b);
      // filmischer Grade: leicht warme Lichter, kühle Schatten
      float l=dot(c,vec3(.2126,.7152,.0722));
      c=mix(c, c*vec3(1.04,1.0,.95), smoothstep(.4,1.,l)); c=mix(c, c*vec3(.95,1.0,1.05), 1.-smoothstep(0.,.35,l));
      c=(c-.5)*1.05+.5;
      c*=1.-vig*pow(length(d)*1.35,2.2);
      c+= (h(vUv*1000.+time)-.5)*.012;
      c*=1.-fade;
      gl_FragColor=vec4(c,1.);}`
}); composer.addPass(grade);

// ---------------------------------------------------------------- Aufbau
buildB1(); buildInterior(); buildSite(); setupLampLights(); if (FILM2) film2LitWindows(); // Bauteil 2 vorerst nicht gebaut
scene.traverse(o => { if (o.isMesh && o.material && o.material.map) { /* ok */ } });

// ---------------------------------------------------------------- Kamera-/Zeitachse
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeIO = t => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, t)));
function evalPath(pts, t) {
  if (pts.length === 2) return new THREE.Vector3().lerpVectors(new THREE.Vector3(...pts[0]), new THREE.Vector3(...pts[1]), t);
  const c = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)), false, 'centripetal'); return c.getPoint(t);
}
const ctx = { heroXC, B1, B2, UW, heroX0, heroX1 };
const SHOTS = FILM2 ? SHOTS2 : SHOTS1, TITLES = FILM2 ? {} : TITLES1, DURATION = FILM2 ? DURATION2 : DURATION1;
const shotList = SHOTS(ctx, PORTRAIT);
function shotAt(t) { let acc = 0; for (const s of shotList) { if (t < acc + s.dur) return { s, lt: t - acc, k: (t - acc) / s.dur }; acc += s.dur; } const s = shotList[shotList.length - 1]; return { s, lt: s.dur, k: 1 }; }

const titleEls = {}; for (const id of Object.keys(TITLES)) titleEls[id] = document.getElementById(id);
function applyTitles(t) {
  for (const [id, [a, b]] of Object.entries(TITLES)) {
    const el = titleEls[id]; if (!el) continue; const fi = 0.7, fo = 0.6;
    let o = 0; if (t >= a && t <= b) o = Math.min(1, (t - a) / fi, (b - t) / fo);
    o = Math.max(0, o); const y = (1 - easeIO(Math.min(1, (t - a) / 1.2))) * 26;
    el.style.opacity = o.toFixed(3); el.style.transform = id === 'end' ? `scale(${1.04 - 0.04 * easeIO(Math.min(1, (t - a) / 2))})` : `translateY(${y.toFixed(1)}px)`;
    if (id !== 'end') el.style.filter = `blur(${((1 - Math.min(1, (t - a) / fi)) * 6).toFixed(2)}px)`;
  }
}

// Schnittansicht (Vorschaubild): nur Einheit 4 innen, ohne Decke, heller Hintergrund
const CUT = params.get('cut') === '1';
const CUTLOOK = { elev: 58, azim: 215, turbidity: 3, rayleigh: 1.2, mie: 0.004, sunI: 2.2, sunColor: 0xfff1e0, hemiI: 0.9, hemiSky: 0xdfe8ff, exposure: 0.62, fog: 0xffffff, fogD: 0, envI: 0.9, intI: 0.6, bloom: 0.05 };
if (CUT) {
  for (const o of scene.children) if (!(o === interior || o.isLight || o === F2.van || heroTor.secs.includes(o))) o.visible = false;
  scene.background = new THREE.Color(0xf1f2f4);
  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: 0xeceef1, roughness: 1 })); gnd.rotation.x = -Math.PI / 2; gnd.position.y = -0.02; gnd.receiveShadow = true; scene.add(gnd);
  renderer.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, -1, 0), 5.7)];
  // Mauerkronen der beiden sichtbaren Wände
  const capM = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.8 });
  const cap = (w, d, x, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), capM); m.position.set(x, 5.67, z); scene.add(m); };
  cap(0.24, 15.0, heroX1 - 0.02, -7.5); cap(heroX1 - heroX0 + 0.2, 0.24, (heroX0 + heroX1) / 2, -0.08);
}
window.cutProject = pts => pts.map(p => { const v = new THREE.Vector3(...p).project(camera); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; });
window.renderAt = function (t) {
  if (CUT) {
    applyLook(CUTLOOK); const c = (params.get('cam') || '9.5,18.5,-25.5').split(',').map(Number), tg = (params.get('tgt') || '24.3,1.4,-7.2').split(',').map(Number);
    camera.position.set(...c); camera.up.set(0, 1, 0); camera.fov = parseFloat(params.get('fov') || '28'); camera.aspect = W / H; camera.lookAt(...tg); camera.updateProjectionMatrix();
    setShadowBox(new THREE.Vector3(24.3, 0, -7.5), 14); heroTor.set(0); interior.visible = true;
    applyAnims(999, 999); film2Light(999); film2Extras(1.0);
    F2.van.visible = true; F2.van.position.set(heroX0 + 4.3, 0.04, -5.7); F2.vanSpots.forEach(s => s.intensity = 0);
    if (gtao) gtao.blendIntensity = 0.9; grade.uniforms.fade.value = 0; composer.render(); return true;
  }
  const { s, lt, k } = shotAt(t);
  applyLook(s.look);
  const kk = (s.ease || easeIO)(k);
  camera.position.copy(evalPath(s.pos, kk));
  let tgt; if (s.yaw) { const y = THREE.MathUtils.degToRad(s.yaw[0] + (s.yaw[1] - s.yaw[0]) * kk), pt = THREE.MathUtils.degToRad(s.pitch[0] + (s.pitch[1] - s.pitch[0]) * kk);
    tgt = camera.position.clone().add(new THREE.Vector3(Math.sin(y), Math.tan(pt), -Math.cos(y)).multiplyScalar(5)); } else tgt = evalPath(s.target, kk);
  camera.fov = s.fov ? (Array.isArray(s.fov) ? s.fov[0] + (s.fov[1] - s.fov[0]) * kk : s.fov) : 40;
  camera.aspect = W / H;
  if (PORTRAIT) { // horizontalen Bildwinkel etwas enger als im Querformat, vertikal entsprechend weiter
    const hf = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * 16 / 9) * (s.pfov || 0.8);
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(hf / 2) * H / W)); }
  if (s.roll !== undefined || s.topdown) { const a = THREE.MathUtils.degToRad((s.roll || [0, 0])[0] + ((s.roll || [0, 0])[1] - (s.roll || [0, 0])[0]) * kk); camera.up.set(Math.sin(a), 0, -Math.cos(a)); } else camera.up.set(0, 1, 0);
  camera.lookAt(tgt); camera.updateProjectionMatrix();
  setShadowBox(s.shadowC ? new THREE.Vector3(...s.shadowC) : tgt, s.shadowR || 45);
  // Tor
  const doorOpen = s.door ? easeIO((lt - s.door[0]) / (s.door[1] - s.door[0])) : (s.doorOpen ?? 0);
  heroTor.set(doorOpen);
  heroKeypadLED.material.emissive.set(s.ledGreenAt !== undefined && lt > s.ledGreenAt ? 0x22ff55 : (s.doorOpen ? 0x22ff55 : 0xff2a1a));
  interior.visible = s.interior !== false;
  if (FILM2) { const a = animTime2(t); applyAnims(a, t); film2Light(a); film2Extras(t); }
  grade.uniforms.time.value = t * 13.7;
  grade.uniforms.fade.value = 0; // kein Schwarz am Anfang: erstes Bild = Vorschaubild (Facebook)
  if (gtao) gtao.blendIntensity = s.ao ?? 0.85;
  composer.render();
  applyTitles(t);
  return true;
};
window.DURATION = DURATION;
window.sceneReady = new Promise(r => setTimeout(r, 300));
// Bilder (Logo-Textur) laden lassen
await new Promise(r => { const im = new Image(); im.onload = r; im.onerror = r; im.src = 'logo.png'; });
window.READY = true;
if (params.get('t')) window.renderAt(parseFloat(params.get('t')));
