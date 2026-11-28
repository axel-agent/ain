// „Der Trailer“ – Kino-Trailer-Parodie im Morgengold (Sonnenaufgang, Breitbild-Balken, Trailerstimme)
//  A 0–6   Morgengrauen: tiefer Anflug über die Wiese auf die Bürofront, Sonne geht auf
//  B 6–11  Heldenperspektive von unten: Gleitfahrt an der Bürofront im Gegenlicht
//  C 11–16 Torseite bodennah: Sektionaltor öffnet sich, Transporter steht drin
//  D 16–21 Innen von ganz unten: Fahrt unter die Lagerbühne, Blick hinauf zum Büro
//  E 21–28 Kran hoch und weg: ganze Anlage im Morgenlicht vor den Karawanken
const DAWN = { elev: 0.5, azim: 98, sunI: 1.0, exposure: 0.78, night: 0.6, sunColor: 0xffa860, hemiI: 0.34, hemiSky: 0x9fb3d6, rayleigh: 2.6, turbidity: 5, bloom: 0.32, envI: 1.0, fog: 0xd8c4b4, fogD: 0.00026, mie: 0.005, intI: 1.3 };
const GOLD = { elev: 8, azim: 102, sunI: 2.3, exposure: 0.62, night: 0.2, sunColor: 0xffc27a, hemiI: 0.42, hemiSky: 0xaab9d8, rayleigh: 2.0, turbidity: 4, bloom: 0.28, envI: 1.0, fog: 0xd8c6b2, fogD: 0.00022, mie: 0.005, intI: 1.3 };
const INTG = { ...GOLD, exposure: 0.48, hemiI: 0.25, fogD: 0.0001 };
const lerpC = (a, b, t) => { let r = 0; for (const s of [16, 8, 0]) r |= Math.round(((a >> s) & 255) + (((b >> s) & 255) - ((a >> s) & 255)) * t) << s; return r; };
const mix = (a, b, t) => { const o = {}; for (const f of Object.keys(a)) o[f] = /Color|Sky|fog$/.test(f) ? lerpC(a[f], b[f], t) : a[f] + (b[f] - a[f]) * t; o.elev = Math.round(o.elev * 4) / 4; return o; };
export const DURATION = 28;
export const SHOTS = (c) => {
  const X = c.heroX0 + 4.3, V = [-8.3, -8.3], io = k => k * k * (3 - 2 * k);
  return [
    { dur: 6, lookFn: k => mix(DAWN, GOLD, k), ease: k => k, pos: [[30, 1.3, -78], [27, 2.4, -44]], target: [[25, 3.5, -15], [25, 3.8, -15]], fov: 46, pfov: 0.8, shadowC: [24, 0, -20], shadowR: 40 },
    { dur: 5, look: GOLD, ease: k => k, pos: [[35, 0.7, -20.5], [27, 0.8, -20]], target: [[32, 5.2, -15], [24, 5.6, -15]], fov: 62, pfov: 0.8, shadowC: [30, 0, -16], shadowR: 22 },
    { dur: 5, look: GOLD, door: [0.5, 3.6], van: V, ease: io, pos: [[X + 2.2, 0.45, 9.5], [X + 0.8, 0.55, 6]], target: [[X, 2.7, 0], [X, 2.3, -5]], fov: 62, pfov: 0.8, shadowC: [X, 0, 0], shadowR: 20 },
    { dur: 5, look: INTG, doorOpen: 1, van: V, ease: io, pos: [[X - 2.5, 0.5, -3.6], [X - 2.5, 0.8, -7.4]], target: [[X - 2.5, 3.2, -12], [X - 2.2, 4.6, -14]], fov: 66, pfov: 0.8, shadowC: [X, 0, -8], shadowR: 12, ao: 0.9 },
    { dur: 7, look: GOLD, doorOpen: 1, van: V, ease: io, pos: [[X + 6, 2, 14], [X + 16, 16, 34], [X + 22, 30, 54]], target: [[X, 2.2, 0], [24, 0.5, -8], [24, 0, -8]], fov: [54, 46], pfov: 0.8, shadowC: [24, 0, -6], shadowR: 50 },
  ];
};
