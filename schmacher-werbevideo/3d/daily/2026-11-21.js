// „Draußen −5 °C. Drinnen: Fußbodenheizung.“ – Winter-Special (winter=1, branche=neutral)
//  A 0–5   Bürofront im Schneetreiben, Dämmerung, Fenster warm beleuchtet
//  B 5–10  Torseite: Sektionaltor öffnet sich ins warme Licht
//  C 10–16 Halle von oben: Boden wird durchsichtig – Heizschleifen glühen (Fußbodenheizung)
//  D 16–21 Büro auf der Galerie, draußen schneit es
//  E 21–26 Kamera steigt auf: verschneite Anlage, Tor offen und warm beleuchtet
const DUSK = { elev: -1.5, azim: 230, turbidity: 5, rayleigh: 2.8, mie: 0.005, sunI: 0.0, hemiI: 0.42, hemiSky: 0x9fb3d6, exposure: 1.05, fog: 0xaebbcc, fogD: 0.0035, envI: 1.4, night: 1, intI: 1.4, bloom: 0.4 };
const INT = { ...DUSK, exposure: 0.95, fogD: 0.0002, bloom: 0.25 };
export const DURATION = 26;
export const SHOTS = (c) => {
  const X = c.heroX0 + 4.3;
  return [
    { dur: 5, look: DUSK, pos: [[X + 14, 1.6, -34], [X + 6, 2.0, -26]], target: [[X, 3.0, -15], [X - 2, 3.2, -15]], fov: 50, pfov: 0.78, shadowC: [X, 0, -18], shadowR: 30 },
    { dur: 5, look: DUSK, door: [0.8, 4.2], pos: [[X + 0.4, 1.4, 10], [X + 0.2, 1.3, 4.6]], target: [[X, 2.2, 0], [X, 2.4, -8]], fov: 58, pfov: 0.8, shadowC: [X, 0, 0], shadowR: 22 },
    { dur: 6, look: INT, doorOpen: 1, snow: false, floorx: [1, 0.12], pos: [[X - 1.6, 3.8, -0.9], [X + 0.6, 4.4, -2.4]], target: [[X - 0.6, 0, -5.4], [X - 0.4, 0, -6.6]], fov: 66, pfov: 0.8, shadowC: [X, 0, -5], shadowR: 14, ao: 0.85 },
    { dur: 5, look: INT, doorOpen: 1, pos: [[24.8, 4.5, -8.9], [23.2, 4.5, -9.1]], target: [[23.6, 3.7, -14.6], [22.8, 3.7, -14.6]], fov: 58, pfov: 0.8, shadowC: [X, 0, -12], shadowR: 10, ao: 0.9 },
    { dur: 5, look: DUSK, doorOpen: 1, pos: [[X + 5, 3, 14], [X + 18, 24, 38]], target: [[X, 2, -2], [24, 0, -7]], fov: 50, pfov: 0.78, shadowC: [24, 0, -7], shadowR: 40, ease: k => 1 - Math.pow(1 - k, 2) },
  ];
};
