// Folge 1 „Echt jetzt.“ – 3D-Teile (werden im Schnitt mit echten Fotos verbunden)
// Zeitachse der 3D-Clips (je Clip eigener Zeitbereich):
//  A 0–8   Kran steigt vor der Bürofront auf, Morgensonne, Karawanken
//  B 8–14  Torseite flach entlang (Gegenstück zu foto_04)
//  C 14–21 Halle: Blick vom Tor nach oben zur Galerie, Kran hoch auf Galerie-Höhe (Gegenstück zu foto_09)
//  D 21–25 Bürofront schräg entlang (Gegenstück zu foto_02)
const SUNRISE = { elev: 6, azim: 125, turbidity: 6, rayleigh: 1.8, mie: 0.006, sunI: 3.6, sunColor: 0xffc890, hemiI: 0.5, exposure: 0.55, fog: 0xe0c8b0, fogD: 0.00032, envI: 1.0 };
const CLEAR = { elev: 28, azim: 200, turbidity: 2.5, rayleigh: 1.2, mie: 0.004, sunI: 3.3, sunColor: 0xfff2e0, hemiI: 0.55, exposure: 0.5, fog: 0xc8d6e6, fogD: 0.0002, envI: 1.0 };
const INT = { ...CLEAR, exposure: 0.42, hemiI: 0.25, intI: 1.0, fogD: 0.0001 };
export const DURATION = 25;
export const SHOTS = (c) => {
  const X = c.heroX0 + 4.3;
  return [
    { dur: 8, look: SUNRISE, interior: false, pos: [[30, 0.7, -24], [34, 6, -34], [40, 26, -58]], target: [[26, 4.5, -15], [25, 3, -12], [24, 1, -4]], fov: 70, pfov: 0.75, shadowC: [24, 0, -8], shadowR: 50 },
    { dur: 6, look: CLEAR, doorOpen: 0, interior: false, pos: [[X + 8, 0.5, 5.0], [X + 5.5, 0.55, 4.4]], target: [[X - 8, 4.0, -0.3], [X - 10, 4.2, -0.3]], fov: 80, pfov: 0.75, shadowC: [X - 6, 0, 0], shadowR: 26 },
    { dur: 7, look: INT, doorOpen: 1, pos: [[X - 0.2, 0.55, -1.2], [X + 0.2, 4.4, -6.2]], target: [[X - 0.3, 6.5, -13], [X - 0.6, 4.2, -14.5]], fov: [80, 66], pfov: 0.78, shadowC: [X, 0, -7], shadowR: 16, ao: 0.9 },
    { dur: 4, look: CLEAR, interior: false, pos: [[c.B1.x1 + 3, 0.5, -18.6], [c.B1.x1 + 1.6, 0.55, -19.0]], target: [[30, 4.8, -15.1], [28, 4.9, -15.1]], fov: 76, pfov: 0.78, shadowC: [36, 0, -15], shadowR: 22 },
  ];
};
