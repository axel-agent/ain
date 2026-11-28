// „Quiz: Was passt in eine Halle?“ – A Transporter · B Werkstatt · C Büro · D Alles
//  A 0–4   Torseite, Tor zu – Kamera nähert sich (Rätsel)
//  B 4–9   Tor öffnet sich: Transporter steht drin (A)
//  C 9–14  Werkbank + Werkzeugschrank unter der Lagerbühne (B)
//  D 14–19 Büro auf der Galerie (C)
//  E 19–26 Röntgenblick von oben (Dach auf), Kamera kreist: alles in einer Halle (D)
const DAY = { elev: 32, azim: 25, turbidity: 2.6, rayleigh: 1.1, mie: 0.004, sunI: 3.2, sunColor: 0xfff2e2, hemiI: 0.55, exposure: 0.5, fog: 0xc8d6e6, fogD: 0.0002, envI: 1.0, intI: 1.0 };
const INT = { ...DAY, exposure: 0.42, hemiI: 0.25, fogD: 0.0001 };
const XR = { ...DAY, azim: 160, elev: 40 };
export const DURATION = 26;
export const SHOTS = (c) => {
  const X = c.heroX0 + 4.3, V = [-8.3, -8.3];
  return [
    { dur: 4, look: DAY, doorOpen: 0, van: V, pos: [[X + 5, 1.5, 14], [X + 1.5, 1.5, 7]], target: [[X, 2.3, 0], [X, 2.3, 0]], fov: 56, pfov: 0.8, shadowC: [X, 0, 2], shadowR: 20 },
    { dur: 5, look: DAY, door: [0.4, 3.4], van: V, pos: [[X + 1, 1.5, 6.5], [X + 0.3, 1.5, 3.0]], target: [[X, 2.0, 0], [X, 1.8, -6]], fov: 60, pfov: 0.8, shadowC: [X, 0, -2], shadowR: 18 },
    { dur: 5, look: INT, doorOpen: 1, van: V, pos: [[25.0, 1.5, -10.0], [25.5, 1.35, -11.2]], target: [[27.6, 1.2, -11.2], [27.6, 1.15, -11.9]], fov: 64, pfov: 0.8, shadowC: [X, 0, -11], shadowR: 10, ao: 0.9 },
    { dur: 5, look: INT, doorOpen: 1, van: V, pos: [[22.8, 4.4, -12.8], [24.6, 4.45, -12.2]], target: [[24.0, 3.8, -14.6], [26.0, 3.7, -14.0]], fov: 60, pfov: 0.8, shadowC: [X, 0, -12], shadowR: 10, ao: 0.9 },
    { dur: 7, look: XR, doorOpen: 1, clip: 5.7, van: V, pos: [[X - 9, 15, 0], [X, 16, 3], [X + 9, 15, -1]], target: [[X - 0.5, 0, -7.5], [X - 0.5, 0, -7.5]], fov: 52, pfov: 0.8, shadowC: [X, 0, -7.5], shadowR: 14 },
  ];
};
