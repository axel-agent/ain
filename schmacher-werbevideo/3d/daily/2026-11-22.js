// „7 Hallen. 7 Gründe.“ – Countdown an den Hausnummern 7 → 1 (Sonne, blauer Himmel)
//  A 0–3   Nahaufnahme der großen „7“, schneller Zug zurück
//  B 3–19  Gleitfahrt entlang der Bürofront von Nummer 7 bis 1 (je ca. 2,3 s pro Nummer)
//  C 19–25 Kran hoch: ganze Anlage mit Karawanken
//  D 25–31 Innen: Rückwärtsflug vom Büro über das Geländer hinunter in die Halle
//  E 31–35 Torseite in der Sonne: Sektionaltore mit Lichtreihen
const SUN = { elev: 38, azim: 165, turbidity: 2.4, rayleigh: 1.0, mie: 0.004, sunI: 3.3, sunColor: 0xfff4e6, hemiI: 0.55, exposure: 0.5, fog: 0xc6d4e4, fogD: 0.00018, envI: 1.0 };
const SUNB = { ...SUN, azim: 20 };
const INT = { ...SUNB, exposure: 0.42, hemiI: 0.25, intI: 1.0, fogD: 0.0001 };
const NX = n => 48.5 - ((n - 1) * 6.928 + 0.62);
export const DURATION = 35;
export const NUMS = [7, 6, 5, 4, 3, 2, 1].map(n => ({ n, t: 3 + 16 * (NX(n) - 4.5) / 48 }));
export const SHOTS = (c) => {
  const X = c.heroX0 + 4.3, lin = k => k;
  return [
    { dur: 3, look: SUN, interior: false, ease: k => 1 - Math.pow(1 - k, 3), pos: [[NX(7) + 0.15, 3.3, -16.0], [NX(7) - 3.0, 2.3, -22.5]], target: [[NX(7), 3.25, -15], [NX(7) + 1.5, 3.0, -15]], fov: [34, 52], pfov: 0.8, shadowC: [10, 0, -15], shadowR: 20 },
    { dur: 16, look: SUN, ease: lin, pos: [[2, 2.1, -21.5], [50, 2.1, -21.5]], target: [[4.5, 3.0, -15], [52.5, 3.0, -15]], fov: 52, pfov: 0.8, shadowC: [26, 0, -16], shadowR: 32 },
    { dur: 6, look: SUN, pos: [[50, 2.1, -21.5], [58, 14, -36], [62, 30, -50]], target: [[52.5, 3.0, -15], [30, 1, -9], [24, 0, -7]], fov: [52, 48], pfov: 0.75, shadowC: [24, 0, -8], shadowR: 50 },
    { dur: 6, look: INT, doorOpen: 1, pos: [[23.0, 4.6, -9.8], [X - 0.2, 3.6, -5.0], [X + 0.3, 2.0, -1.0]], target: [[23.5, 3.6, -14.6], [X - 0.5, 3.2, -12], [X, 2.6, -12]], fov: 66, pfov: 0.8, shadowC: [X, 0, -7], shadowR: 16, ao: 0.9 },
    { dur: 4, look: SUNB, pos: [[X + 16, 1.0, 7], [X + 8, 1.2, 6]], target: [[X - 8, 2.8, 0], [X - 12, 3.0, 0]], fov: 60, pfov: 0.8, shadowC: [X, 0, 0], shadowR: 26 },
  ];
};
