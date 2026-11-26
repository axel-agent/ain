// „Miniatur-Welt“ – Tilt-Shift-Look (Modellbahn-Effekt), schnelle Bewegungen von hoch oben
//  A 0–6   Hoch über der Torseite: Transporter fährt durchs Tor hinein
//  B 6–12  Kreisfahrt über der Bürofront (Hausnummern)
//  C 12–18 Röntgenblick: Dach weg, Puppenhaus-Ansicht der Halle
//  D 18–23 Transporter fährt wieder hinaus
//  E 23–28 Weit: ganze Anlage mit Karawanken
const SUN = { elev: 34, azim: 150, turbidity: 2.2, rayleigh: 1.0, mie: 0.004, sunI: 3.4, sunColor: 0xfff2e2, hemiI: 0.55, exposure: 0.5, fog: 0xc6d4e4, fogD: 0.00015, envI: 1.0, intI: 1.0 };
const SUNB = { ...SUN, azim: 25 };
export const DURATION = 28;
export const SHOTS = (c) => {
  const X = c.heroX0 + 4.3, io = k => k * k * (3 - 2 * k);
  return [
    { dur: 6, look: SUNB, doorOpen: 1, van: [16, -4.2], vanEase: k => 1 - Math.pow(1 - k, 2), pos: [[X + 14, 17, 22], [X + 9, 16, 21]], target: [[X, 0, 4], [X, 0, 2]], fov: 30, pfov: 0.8, shadowC: [X, 0, 4], shadowR: 22 },
    { dur: 6, look: SUN, van: [-8.3, -8.3], ease: k => k, pos: [[44, 15, -36], [24, 16, -42], [6, 15, -36]], target: [[30, 1, -15], [24, 1, -15], [18, 1, -15]], fov: 32, pfov: 0.8, shadowC: [24, 0, -15], shadowR: 32 },
    { dur: 6, look: SUN, clip: 5.7, doorOpen: 1, van: [-8.3, -8.3], ease: k => k, pos: [[X - 11, 17, -18], [X - 13, 18, -6], [X - 10, 17, 4]], target: [[X - 0.5, 0, -7.5], [X - 0.5, 0, -7.5], [X - 0.5, 0, -7.5]], fov: 34, pfov: 0.8, shadowC: [X, 0, -7.5], shadowR: 14 },
    { dur: 5, look: SUNB, doorOpen: 1, van: [-3.0, 16], vanRy: Math.PI, vanEase: io, pos: [[X - 10, 16, 20], [X - 6, 17, 24]], target: [[X, 0, 5], [X, 0, 8]], fov: 30, pfov: 0.8, shadowC: [X, 0, 6], shadowR: 22 },
    { dur: 5, look: SUN, van: [-8.3, -8.3], ease: io, pos: [[70, 38, -70], [80, 52, -88]], target: [[24, 0, -6], [24, 0, -6]], fov: 34, pfov: 0.8, shadowC: [24, 0, -8], shadowR: 60 },
  ];
};
