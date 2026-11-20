// „06:58 – Ein Morgen im Elektrobetrieb“: Halle für einen Elektriker eingerichtet (branche=elektro)
//  A 0–4.5   Röntgenblick: Dach aufgeschnitten, Kamera kreist über der Anlage
//  B 4.5–10.5 Sturzflug von oben in die Halle
//  C 10.5–16 Bodennahe Fahrt an Kabeltrommeln und Material vorbei
//  D 16–21   Von der Galerie auf den Transporter mit Dachleiter
//  E 21–26   Büro auf der Galerie
//  F 26–32   Außen: Tor offen, Transporter fährt los zum Kunden
const MORN = { elev: 10, azim: 120, turbidity: 4, rayleigh: 1.5, mie: 0.005, sunI: 3.4, sunColor: 0xffd8a8, hemiI: 0.5, exposure: 0.55, fog: 0xdcd2c8, fogD: 0.00025, envI: 1.0, intI: 1.0 };
const XRAY = { ...MORN, elev: 34, azim: 150, exposure: 0.5, sunColor: 0xfff0dc };
const INT = { ...MORN, elev: 22, exposure: 0.42, hemiI: 0.25, intI: 1.0, fogD: 0.0001 };
export const DURATION = 32;
const easeOut = k => 1 - Math.pow(1 - k, 2.4);
export const SHOTS = (c) => {
  const X = c.heroX0 + 4.3, C = [24.2, 0, -7.4];
  return [
    { dur: 4.5, look: XRAY, clip: 5.7, van: [-8.3, -8.3], pos: [[C[0] - 9, 24, C[2] - 9], [C[0] + 2, 25, C[2] - 11], [C[0] + 10, 23, C[2] - 5]], target: [C, C], fov: 32, pfov: 0.8, shadowC: [24, 0, -7], shadowR: 22 },
    { dur: 6, look: XRAY, clip: 5.7, van: [-8.3, -8.3], ease: k => k * k * (3 - 2 * k), pos: [[C[0] + 10, 23, C[2] - 5], [C[0] + 3, 12, C[2] + 2], [C[0] + 0.6, 3.4, -0.8]], target: [C, [24.2, 0.5, -7.6], [24.0, 1.8, -10.5]], fov: [32, 70], pfov: 0.8, shadowC: [24, 0, -7], shadowR: 22 },
    { dur: 5.5, look: INT, van: [-8.3, -8.3], pos: [[21.9, 0.85, -0.9], [22.1, 1.0, -5.4]], target: [[22.7, 0.6, -4.5], [23.6, 1.3, -9.6]], fov: 68, pfov: 0.8, shadowC: [X, 0, -6], shadowR: 16, ao: 0.9 },
    { dur: 5, look: INT, van: [-8.3, -8.3], pos: [[22.4, 4.7, -9.3], [23.4, 4.5, -9.0]], target: [[25.1, 2.3, -5.6], [25.1, 2.0, -3.6]], fov: 64, pfov: 0.8, shadowC: [X, 0, -6], shadowR: 16, ao: 0.9 },
    { dur: 5, look: INT, van: [-8.3, -8.3], pos: [[22.4, 4.15, -12.6], [22.6, 4.2, -11.0]], target: [[23.8, 3.85, -13.8], [24.0, 3.8, -12.9]], fov: 52, pfov: 0.85, shadowC: [X, 0, -12], shadowR: 10, ao: 0.9 },
    { dur: 6, look: MORN, doorOpen: 1, van: [-3.0, 9.5], vanRy: Math.PI, vanLights: true, vanEase: k => k * k, pos: [[X + 6.5, 1.0, 9.5], [X + 5.2, 1.5, 12.5]], target: [[X, 1.7, 0], [X, 1.5, 6]], fov: 62, pfov: 0.8, shadowC: [X, 0, 3], shadowR: 20 },
  ];
};
