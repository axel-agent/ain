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
import { SHOTS, TITLES, DURATION } from './shots.js';

const params = new URLSearchParams(location.search);
const W = parseInt(params.get('w') || '1920'), H = parseInt(params.get('h') || '1080');
const PORTRAIT = H > W, NOTITLES = params.get('notitles') === '1';
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
const intLights = [];
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
  box(w, 0.4, 0.2, M.glulam, xc, gy - 0.05, gz1 - 0.1, interior); // Randträger
  [x0 + 0.15, xc, x1 - 0.15].forEach(x => {
    box(0.2, gy, 0.2, M.glulam, x, gy / 2, gz1 - 0.1, interior);
    box(0.22, 0.12, 0.012, M.steel, x, gy - 0.32, gz1 + 0.006, interior); // Stahlverbinder
    for (const bx of [-0.06, 0.06]) for (const by of [-0.34, -0.29]) { const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 10), M.inox); bolt.rotation.x = Math.PI / 2; bolt.position.set(x + bx, gy + by, gz1 + 0.016); interior.add(bolt); }
  });
  B1.connector = new THREE.Vector3(xc, gy - 0.32, gz1 + 0.01);
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
  const ox0 = x0, ox1 = x1, oz1 = z0 + 4.0;
  // LED-Lichtbänder
  for (let z = z0 + 1.6; z < z1; z += 2.1) box(w * 0.7, 0.04, 0.12, M.ledOn, xc, ceil - 0.45, z + 1.05, interior, false);
  // Innenlicht
  const hallL = new THREE.PointLight(0xfff1dd, 0, 22, 1.5); hallL.position.set(xc, 5.6, -5.5); interior.add(hallL); intLights.push({ l: hallL, i: 60 });
  const offL = new THREE.PointLight(0xffd9a8, 0, 7, 1.6); offL.position.set((ox0 + ox1) / 2, oy + 2.6, z0 + 2.2); interior.add(offL); intLights.push({ l: offL, i: 14 });
  const galL = new THREE.PointLight(0xfff1dd, 0, 12, 1.6); galL.position.set(xc, 5.8, z0 + 3); interior.add(galL); intLights.push({ l: galL, i: 22 });
  B1.office = { desk: new THREE.Vector3(dx, oy + 0.9, dz), ox0, ox1, oz1, oy };
  B1.int = { x0, x1, z0, z1, xc, gz1, gy: ry };
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
buildB1(); buildInterior(); buildSite(); setupLampLights(); // Bauteil 2 vorerst nicht gebaut
scene.traverse(o => { if (o.isMesh && o.material && o.material.map) { /* ok */ } });

// ---------------------------------------------------------------- Kamera-/Zeitachse
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeIO = t => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, t)));
function evalPath(pts, t) {
  if (pts.length === 2) return new THREE.Vector3().lerpVectors(new THREE.Vector3(...pts[0]), new THREE.Vector3(...pts[1]), t);
  const c = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)), false, 'centripetal'); return c.getPoint(t);
}
const ctx = { heroXC, B1, B2, UW, heroX0, heroX1 };
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

window.renderAt = function (t) {
  const { s, lt, k } = shotAt(t);
  applyLook(s.look);
  const kk = (s.ease || easeIO)(k);
  camera.position.copy(evalPath(s.pos, kk));
  const tgt = evalPath(s.target, kk);
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
