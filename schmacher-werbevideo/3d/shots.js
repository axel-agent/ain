// Kamerafahrten & Lichtstimmungen (16:9-Master, 45 s)
const MORNING_FRONT = { elev: 9, azim: 150, turbidity: 5, rayleigh: 1.4, mie: 0.005, sunI: 3.4, sunColor: 0xffd9ac, hemiI: 0.45, exposure: 0.52, fog: 0xd6cfc6, fogD: 0.00028, envI: 0.9 };
const MORNING_BACK = { ...MORNING_FRONT, elev: 14, azim: 35 };
const DAY_INT = { ...MORNING_BACK, elev: 18, azim: 15, exposure: 0.4, hemiI: 0.2, intI: 0.7, fogD: 0.0001 };
const BLUE_HOUR = { elev: -3.5, azim: 200, turbidity: 2, rayleigh: 2.5, mie: 0.004, sunI: 0.0, hemiI: 0.22, hemiSky: 0x6f86c4, exposure: 1.15, fog: 0x2a3446, fogD: 0.00035, envI: 1.6, night: 1, intI: 1.4, bloom: 0.45 };

export const DURATION = 45;

export const SHOTS = (c, portrait = false) => {
  const X = c.heroX0 + 4.3; // Mitte des Tors
  return [
    // 01 Drohne Sonnenaufgang – Annäherung an die Anlage
    { dur: 5.5, look: MORNING_FRONT, pos: [[-95, 70, -175], [-30, 32, -78]], target: [[60, -8, 60], [36, 0, 10]], fov: 38, pfov: 0.6, shadowC: [24, 0, -8], shadowR: 60, interior: false },
    // 02 Fassaden-Gleitfahrt entlang der Hausnummern
    { dur: 5.5, look: MORNING_FRONT, pos: [[52, 1.7, -25.5], [20, 1.9, -24.5]], target: [[44, 3.2, -15], [12, 3.4, -15]], fov: 42, shadowC: [32, 0, -16], shadowR: 30, interior: false },
    // 03 Rückseite: Torfront mit elektrischen Sektionaltoren (seitliche Gleitfahrt)
    { dur: 3, look: MORNING_BACK, pos: [[X + 15, 1.5, 7.5], [X + 10, 1.6, 6.6]], target: [[X - 4, 2.4, 0], [X - 7, 2.5, 0]], fov: 40, pfov: 0.7, shadowC: [X, 0, 0], shadowR: 24, interior: false },
    // 04 Tor öffnet sich – Kamerafahrt hinein
    { dur: 6, look: DAY_INT, pos: [[X + 0.3, 1.3, 11], [X + 0.2, 1.2, 1.6]], target: [[X, 2.2, 0], [X, 3.0, -10]], fov: 52, door: [0.4, 4.6], shadowC: [X, 0, -4], shadowR: 22 },
    // 05 Halle innen – Kran nach oben zur Galerie
    { dur: 6, look: DAY_INT, doorOpen: 1, pos: [[X - 0.1, 0.7, 0.2], [X + 0.4, 4.1, -6.4]], target: [[X - 0.6, 3.6, -12], [X - 0.6, 4.0, -14]], fov: [64, 60], shadowC: [X, 0, -7], shadowR: 18, ao: 0.9 },
    // 06 Büro auf der Galerie – Schreibtisch am Fensterband, WC-Kubus mit Küchenzeile rechts
    { dur: 6, look: DAY_INT, doorOpen: 1, pos: [[c.B1.int.x0 + 1.55, c.B1.office.oy + 1.6, c.B1.int.z0 + 5.3], [c.B1.int.x0 + 1.95, c.B1.office.oy + 1.55, c.B1.int.z0 + 4.3]], target: [[c.B1.office.desk.x - 0.4, c.B1.office.oy + 1.05, c.B1.int.z0], [c.B1.office.desk.x + 1.5, c.B1.office.oy + 1.0, c.B1.int.z0 + 1.6]], fov: 60, shadowC: [X, 0, -10], shadowR: 14, ao: 0.9 },
    // 07 Blaue Stunde – Drohne zieht zurück
    { dur: 7, look: BLUE_HOUR, doorOpen: 1, pos: [[60, 14, -42], [92, 46, -95]], target: [[26, 2, -8], [24, 1, -4]], fov: 40, pfov: 0.65, shadowC: [24, 0, -8], shadowR: 60 },
    // 08 Endcard (Kamera driftet weiter, Overlay)
    { dur: 6, look: BLUE_HOUR, doorOpen: 1, pos: [[92, 46, -95], [100, 52, -104]], target: [[24, 1, -4], [24, 1, -4]], fov: 40, pfov: 0.65, shadowC: [24, 0, -8], shadowR: 60 },
  ];
};

// Titel-Einblendungen: id -> [von, bis] in Sekunden
export const TITLES = {
  't-loc': [1.0, 5.2],
  't-platz': [6.0, 10.6],
  't-code': [11.2, 13.9],
  't-hoehe': [21.0, 25.6],
  't-buero': [27.0, 31.6],
  't-units': [32.4, 35.8],
  't-tech': [36.0, 38.9],
  'end': [39.3, 45.5],
};
