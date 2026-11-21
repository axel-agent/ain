// Film 2 „Licht an.“ (v2) – Vorschaubild, Hand am Lichtschalter, Halle füllt sich, großes Einfahrtstor, Büro, Kaffeeküche
const NIGHT_IN = { elev: -8, azim: 200, turbidity: 2, rayleigh: 2.5, mie: 0.004, sunI: 0.0, hemiI: 0.05, hemiSky: 0x6f86c4, exposure: 0.5, fog: 0x2a3446, fogD: 0.0001, envI: 0.35, night: 0, intI: 1, bloom: 0.12 };
const BLUE_HOUR = { elev: -3.5, azim: 200, turbidity: 2, rayleigh: 2.5, mie: 0.004, sunI: 0.0, hemiI: 0.22, hemiSky: 0x6f86c4, exposure: 1.15, fog: 0x2a3446, fogD: 0.00035, envI: 1.6, night: 1, intI: 1.4, bloom: 0.45 };
// Zeitachse: Video-Zeit v → Animationszeit a (Aufbau-Animationen wie in v1)
export const F2T = { cover: 2.25, sw: 1.6, panAt: 17.75, panLen: 5.5, gateAt: 23.25, gateLen: 4.5, pressAt: 0.95 };
export function animTime2(v) {
  if (v < F2T.cover) return 999; // Vorschaubild: alles fertig eingerichtet, Licht an
  const a = v - F2T.cover;
  const ins = F2T.panLen + F2T.gateLen; // Rundumschwenk + Tor: Aufbau-Zeit steht (eigene Video-Zeit-Animationen)
  if (v < F2T.panAt) return a;
  if (v < F2T.panAt + ins) return F2T.panAt - F2T.cover;
  return a - ins;
}
export const DURATION2 = 42 + F2T.cover + F2T.panLen + F2T.gateLen;
export const SW = { x: 22.77, y: 1.08, z: -0.2 }; // Lichtschalter neben der Gehtür, Torseite
export const SHOTS2 = (c, portrait = false) => {
  const sh = { shadowC: [24, 0, -8], shadowR: 14, ao: 0.9 };
  return [
    // 00 Vorschaubild: fertig eingerichtete Halle mit Galerie-Büro (Overlay im Schnitt)
    { dur: F2T.cover, look: NIGHT_IN, cover: 1, pos: [[24.6, 2.5, -0.55], [24.55, 2.5, -0.75]], target: [[24.0, 2.75, -12.5], [24.0, 2.75, -12.5]], fov: 68, pfov: 0.8, ...sh },
    // 01 Dunkel – eine Hand drückt den Lichtschalter
    { dur: F2T.sw, look: NIGHT_IN, sw: 1, pos: [[23.12, 1.27, -0.74], [23.06, 1.24, -0.62]], target: [[SW.x - 0.02, SW.y - 0.03, SW.z], [SW.x - 0.01, SW.y - 0.03, SW.z]], fov: 44, pfov: 0.85, ...sh },
    // 02 Lichtreihen gehen an (Blick vom Tor in die leere Halle)
    { dur: 2.9, look: NIGHT_IN, pos: [[23.8, 1.55, -1.3], [23.7, 1.55, -2.1]], target: [[24.0, 2.95, -14], [23.9, 3.0, -14]], fov: 64, pfov: 0.72, ...sh },
    // 03 Leere Halle – Fahrt hinein, Schwenk zur rechten Wand
    { dur: 4.0, look: NIGHT_IN, pos: [[23.7, 1.55, -2.1], [23.1, 1.45, -4.0]], target: [[23.9, 3.0, -14], [27.6, 2.2, -6.0]], fov: 64, pfov: 0.72, ...sh },
    // 04 Palettenregal wächst und füllt sich
    { dur: 7.0, look: NIGHT_IN, pos: [[22.4, 1.2, -0.9], [22.7, 2.1, -3.4]], target: [[27.0, 2.0, -5.2], [27.2, 2.5, -6.6]], fov: 58, pfov: 0.75, ...sh },
    // 05a Rundumschwenk: Werkbank unter der Lagerbühne → Stapler → andere Seite → Lager füllt sich → zum Tor
    { dur: F2T.panLen, look: NIGHT_IN, pos: [[24.35, 1.75, -6.5], [24.1, 1.6, -7.2]], yaw: [88, -187.9], pitch: [-7, 3], fov: 66, pfov: 0.78, ...sh },
    // 05b Großes Einfahrtstor öffnet sich – Transporter fährt direkt in die Halle
    { dur: F2T.gateLen, look: NIGHT_IN, door: [0.1, 2.3], pos: [[24.1, 1.6, -7.2], [23.85, 1.5, -7.9]], target: [[25.1, 2.0, 0], [24.95, 1.8, 0]], fov: 66, pfov: 0.78, ...sh },
    // 06 Die Stiege hinauf
    { dur: 4.0, look: NIGHT_IN, doorOpen: 1, pos: [[21.5, 1.7, -3.9], [21.5, 3.1, -6.6], [21.6, 4.38, -9.0]], target: [[21.6, 3.3, -9.5], [22.3, 4.3, -12.5], [23.8, 3.9, -14.5]], fov: 64, pfov: 0.72, ...sh },
    // 07 Büro richtet sich ein
    { dur: 5.0, look: NIGHT_IN, doorOpen: 1, pos: [[21.6, 4.4, -9.0], [23.4, 4.55, -8.75]], target: [[23.6, 3.5, -14.6], [24.6, 3.3, -14.4]], fov: 60, pfov: 0.72, ...sh },
    // 08 Seitlicher Schwenk am Fensterband: Arbeitsinsel → Kaffeeküche hinter dem WC
    { dur: 3.5, look: NIGHT_IN, doorOpen: 1, pos: [[22.9, 4.45, -14.4], [25.0, 4.42, -14.45]], target: [[23.6, 3.5, -10.5], [26.85, 3.7, -11.8]], fov: 60, pfov: 0.75, ...sh },
    // 09 Außen, blaue Stunde
    { dur: 5.0, look: BLUE_HOUR, interior: false, pos: [[24.0, 4.7, -17.2], [10, 22, -62]], target: [[24.0, 4.4, -10], [26, 2, -6]], fov: 44, pfov: 0.7, shadowC: [24, 0, -8], shadowR: 60, ease: k => 1 - Math.pow(1 - k, 2.2) },
    // 10 Endcard
    { dur: 9.0, look: BLUE_HOUR, interior: false, pos: [[10, 22, -62], [6, 24, -66]], target: [[26, 2, -6], [26, 2, -6]], fov: 44, pfov: 0.7, shadowC: [24, 0, -8], shadowR: 60 },
  ];
};
