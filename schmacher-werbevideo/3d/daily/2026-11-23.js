// „Paket für dich!“ – Onlineshop/Versand-Halle (branche=versand), Weg einer Bestellung
//  A 0–4   Von oben auf den Packtisch, Kamera steigt (Bestellung eingegangen)
//  B 4–10  Fahrt zwischen Packtischen und Transporter Richtung Lagerbühne
//  C 10–15 Vogelperspektive von der Galerie: zwei Packplätze, Paketturm
//  D 15–20 Von außen durchs offene Tor: Transporter wird beladen
//  E 20–27 Drohne: Transporter fährt los zur Zustellung
const DAY = { elev: 30, azim: 200, turbidity: 3, rayleigh: 1.2, mie: 0.004, sunI: 3.2, sunColor: 0xfff0dc, hemiI: 0.55, exposure: 0.5, fog: 0xccd6e2, fogD: 0.0002, envI: 1.0, intI: 1.0 };
const INT = { ...DAY, exposure: 0.42, hemiI: 0.25, fogD: 0.0001 };
export const DURATION = 27;
export const SHOTS = (c) => {
  const X = c.heroX0 + 4.3;
  return [
    { dur: 4, look: INT, van: [-8.3, -8.3], pos: [[22.55, 2.0, -3.2], [21.95, 3.9, -2.3]], target: [[23.0, 0.9, -3.4], [23.3, 0.9, -4.4]], fov: [56, 70], pfov: 0.8, shadowC: [X, 0, -4], shadowR: 12, ao: 0.9 },
    { dur: 6, look: INT, van: [-8.3, -8.3], pos: [[23.75, 1.25, -0.6], [23.75, 1.35, -6.6]], target: [[23.2, 1.0, -5], [24.3, 1.6, -12]], fov: 66, pfov: 0.8, shadowC: [X, 0, -5], shadowR: 14, ao: 0.9 },
    { dur: 5, look: INT, van: [-8.3, -8.3], pos: [[22.0, 4.7, -9.1], [23.7, 4.8, -9.0]], target: [[22.9, 0.8, -4.2], [23.3, 0.8, -3.0]], fov: 60, pfov: 0.8, shadowC: [X, 0, -5], shadowR: 14, ao: 0.9 },
    { dur: 5, look: DAY, doorOpen: 1, van: [-8.3, -8.3], pos: [[X + 1.6, 1.6, 4.0], [X + 0.7, 1.8, 1.4]], target: [[X - 1.0, 1.2, -3], [X - 1.5, 1.3, -5]], fov: 62, pfov: 0.8, shadowC: [X, 0, -1], shadowR: 16 },
    { dur: 7, look: DAY, doorOpen: 1, van: [-3.0, 14], vanRy: Math.PI, vanEase: k => k * k * (3 - 2 * k), pos: [[X + 3, 9, 9], [X + 7, 17, 26]], target: [[X, 0.5, 1], [X, 0.5, 11]], fov: 55, pfov: 0.8, shadowC: [X, 0, 6], shadowR: 24 },
  ];
};
