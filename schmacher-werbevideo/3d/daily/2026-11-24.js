// „Ein Tag in 30 Sekunden“ – Zeitraffer Morgen → Mittag → Abend → Nacht → Morgen
//  A 0–14  Zeitraffer außen: Kamera kreist langsam, Sonne wandert, Schatten ziehen, Lichter gehen an
//  B 14–20 Nacht: Fahrt an der beleuchteten Bürofront
//  C 20–26 Nacht innen: Büro auf der Galerie im warmen Licht
//  D 26–30 Morgengrauen: Kamera hebt ab, der nächste Tag beginnt
const K = [
  { k: 0.0, elev: 1, azim: 95, sunI: 1.2, exposure: 0.75, night: 0.6, sunColor: 0xffb070, hemiI: 0.35, hemiSky: 0x9fb3d6, rayleigh: 2.5, turbidity: 5, bloom: 0.3, envI: 1.0, fog: 0xd8c8b8, fogD: 0.00025 },
  { k: 0.45, elev: 16, azim: 125, sunI: 2.8, exposure: 0.55, night: 0, sunColor: 0xffe0b8, hemiI: 0.5, hemiSky: 0xbcd3ff, rayleigh: 1.4, turbidity: 3.5, bloom: 0.2, envI: 1.0, fog: 0xd2d6dc, fogD: 0.0002 },
  { k: 0.64, elev: 38, azim: 165, sunI: 3.3, exposure: 0.5, night: 0, sunColor: 0xfff4e6, hemiI: 0.55, hemiSky: 0xbcd3ff, rayleigh: 1.0, turbidity: 2.4, bloom: 0.18, envI: 1.0, fog: 0xc6d4e4, fogD: 0.00018 },
  { k: 0.86, elev: 2, azim: 250, sunI: 1.6, exposure: 0.7, night: 0.4, sunColor: 0xff9a50, hemiI: 0.4, hemiSky: 0xb7a6c8, rayleigh: 2.6, turbidity: 5, bloom: 0.3, envI: 1.1, fog: 0xd8b8a0, fogD: 0.00025 },
  { k: 1.0, elev: -6, azim: 270, sunI: 0.0, exposure: 1.15, night: 1, sunColor: 0xff9a50, hemiI: 0.22, hemiSky: 0x6f86c4, rayleigh: 2.5, turbidity: 2, bloom: 0.45, envI: 1.6, fog: 0x2a3446, fogD: 0.00035 },
];
const lerpC = (a, b, t) => { const ch = (c, s) => (c >> s) & 255; let r = 0; for (const s of [16, 8, 0]) r |= Math.round(ch(a, s) + (ch(b, s) - ch(a, s)) * t) << s; return r; };
function look(k, keys = K) {
  let i = 0; while (i < keys.length - 2 && k > keys[i + 1].k) i++;
  const a = keys[i], b = keys[i + 1], t = Math.min(1, Math.max(0, (k - a.k) / (b.k - a.k))), o = { mie: 0.005, intI: 1.3 };
  for (const f of Object.keys(a)) if (f !== 'k') o[f] = /Color|Sky|fog$/.test(f) ? lerpC(a[f], b[f], t) : a[f] + (b[f] - a[f]) * t;
  o.elev = Math.round(o.elev * 4) / 4; o.azim = Math.round(o.azim * 2) / 2; return o;
}
export { look };
const NIGHT = look(1), INTN = { ...look(1), exposure: 1.0, fogD: 0.0002, bloom: 0.3 };
const DAWN = [{ ...K[3], k: 0 }, { ...K[0], k: 1 }];
export const DURATION = 30;
export const SHOTS = (c) => {
  const X = c.heroX0 + 4.3;
  return [
    { dur: 14, lookFn: k => look(k), ease: k => k, interior: true, pos: [[50, 9, -36], [42, 8.5, -44], [31, 8, -47]], target: [[25, 2.5, -12], [24, 2.5, -12], [23, 2.5, -12]], fov: 50, pfov: 0.75, shadowC: [24, 0, -8], shadowR: 45 },
    { dur: 6, look: NIGHT, pos: [[34, 2.2, -21.5], [16, 2.4, -22.0]], target: [[30, 3.6, -15], [12, 3.8, -15]], fov: 56, pfov: 0.8, shadowC: [24, 0, -15], shadowR: 25 },
    { dur: 6, look: INTN, pos: [[22.6, 4.4, -9.6], [24.6, 4.45, -9.4]], target: [[23.3, 3.6, -14.6], [24.4, 3.6, -14.6]], fov: 60, pfov: 0.8, shadowC: [X, 0, -12], shadowR: 10, ao: 0.9 },
    { dur: 4, lookFn: k => look(k, DAWN), ease: k => k * k * (3 - 2 * k), pos: [[16, 2.4, -22.0], [10, 14, -40]], target: [[12, 3.8, -15], [24, 1, -8]], fov: [56, 50], pfov: 0.78, shadowC: [24, 0, -10], shadowR: 40 },
  ];
};
