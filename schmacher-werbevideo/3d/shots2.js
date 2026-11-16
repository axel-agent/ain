// Film 2 „Licht an.“ – startet innen im Dunkeln (keine Torfahrt). Zeiten gelten für 16:9 und 9:16 gleich.
const NIGHT_IN = { elev: -8, azim: 200, turbidity: 2, rayleigh: 2.5, mie: 0.004, sunI: 0.0, hemiI: 0.05, hemiSky: 0x6f86c4, exposure: 0.5, fog: 0x2a3446, fogD: 0.0001, envI: 0.35, night: 0, intI: 1, bloom: 0.12 };
const BLUE_HOUR = { elev: -3.5, azim: 200, turbidity: 2, rayleigh: 2.5, mie: 0.004, sunI: 0.0, hemiI: 0.22, hemiSky: 0x6f86c4, exposure: 1.15, fog: 0x2a3446, fogD: 0.00035, envI: 1.6, night: 1, intI: 1.4, bloom: 0.45 };
export const DURATION2 = 42;
export const SHOTS2 = (c, portrait = false) => {
  const sh = { shadowC: [24, 0, -8], shadowR: 14, ao: 0.9 };
  return [
    // 01 Dunkel – Klick – Lichtreihen gehen an (Blick vom Tor in die leere Halle)
    { dur: 4.5, look: NIGHT_IN, pos: [[23.8, 1.55, -1.1], [23.7, 1.55, -2.1]], target: [[24.0, 2.9, -14], [23.9, 3.0, -14]], fov: 64, pfov: 0.72, ...sh },
    // 02 Leere Halle – Fahrt hinein, Schwenk zur rechten Wand
    { dur: 4.0, look: NIGHT_IN, pos: [[23.7, 1.55, -2.1], [23.1, 1.45, -4.0]], target: [[23.9, 3.0, -14], [27.6, 2.2, -6.0]], fov: 64, pfov: 0.72, ...sh },
    // 03 Palettenregal wächst und füllt sich (seitliche Fahrt)
    { dur: 7.0, look: NIGHT_IN, pos: [[22.4, 1.2, -0.9], [22.7, 2.1, -3.4]], target: [[27.0, 2.0, -5.2], [27.2, 2.5, -6.6]], fov: 58, pfov: 0.75, ...sh },
    // 04 Die Stiege hinauf
    { dur: 4.0, look: NIGHT_IN, pos: [[21.5, 1.7, -3.9], [21.5, 3.1, -6.6], [21.6, 4.38, -9.0]], target: [[21.6, 3.3, -9.5], [22.3, 4.3, -12.5], [23.8, 3.9, -14.5]], fov: 64, pfov: 0.72, ...sh },
    // 05 Büro richtet sich ein (Blick vom Stiegenaustritt quer über die Galerie)
    { dur: 5.0, look: NIGHT_IN, pos: [[21.6, 4.4, -9.0], [23.4, 4.55, -8.75]], target: [[23.6, 3.5, -14.6], [24.6, 3.3, -14.4]], fov: 60, pfov: 0.72, ...sh },
    // 06 Seitlicher Schwenk am Fensterband entlang: Arbeitsinsel → hinter dem WC die Kaffeeküche
    { dur: 3.5, look: NIGHT_IN, pos: [[22.9, 4.45, -14.4], [25.0, 4.42, -14.45]], target: [[23.6, 3.5, -10.5], [26.85, 3.7, -11.8]], fov: 60, pfov: 0.75, ...sh },
    // 07 Außen, blaue Stunde: vom beleuchteten Fensterband zurück auf den ganzen Park
    { dur: 5.0, look: BLUE_HOUR, interior: false, pos: [[24.0, 4.7, -17.2], [10, 22, -62]], target: [[24.0, 4.4, -10], [26, 2, -6]], fov: 44, pfov: 0.7, shadowC: [24, 0, -8], shadowR: 60, ease: k => 1 - Math.pow(1 - k, 2.2) },
    // 08 Endcard (nur zur Sicherheit; im Schnitt steht das letzte Bild)
    { dur: 9.0, look: BLUE_HOUR, interior: false, pos: [[10, 22, -62], [6, 24, -66]], target: [[26, 2, -6], [26, 2, -6]], fov: 44, pfov: 0.7, shadowC: [24, 0, -8], shadowR: 60 },
  ];
};
