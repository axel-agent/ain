// „POV: Dein erster Tag in deiner eigenen Halle“ – alles aus der Ich-Perspektive (Augenhöhe)
//  A 0–7   Du fährst mit dem Transporter auf die Halle zu, das Tor öffnet sich, rein
//  B 7–12  Ausgestiegen: Blick durch die Halle (Transporter, Lagerbühne)
//  C 12–17 Die Stiege hinauf auf die Galerie
//  D 17–22 Im Büro: Fensterband, dann Blick übers Geländer hinunter in die Halle
//  E 22–28 Raus und hoch: Drohne zieht von der Bürofront zurück (deine Halle unter sieben)
const DAY = { elev: 30, azim: 25, turbidity: 2.4, rayleigh: 1.05, mie: 0.004, sunI: 3.3, sunColor: 0xfff0dc, hemiI: 0.55, exposure: 0.5, fog: 0xc8d6e6, fogD: 0.0002, envI: 1.0, intI: 1.0 };
const INT = { ...DAY, exposure: 0.42, hemiI: 0.25, fogD: 0.0001 };
const FR = { ...DAY, azim: 160, elev: 34 };
export const DURATION = 28;
export const SHOTS = (c) => {
  const X = c.heroX0 + 4.3, V = [-8.3, -8.3], eo = k => 1 - Math.pow(1 - k, 2.2), io = k => k * k * (3 - 2 * k);
  return [
    { dur: 7, look: DAY, door: [1.9, 4.0], ease: eo, pos: [[X - 0.45, 1.85, 17], [X - 0.45, 1.85, -2.5]], yaw: [2, 0], pitch: [-3, -2], fov: 64, pfov: 0.85, shadowC: [X, 0, 2], shadowR: 24 },
    { dur: 5, look: INT, doorOpen: 1, van: V, ease: io, pos: [[X - 1.9, 1.65, -3.2], [X - 2.3, 1.65, -4.0]], yaw: [25, -32], pitch: [-4, 10], fov: 64, pfov: 0.85, shadowC: [X, 0, -7], shadowR: 12, ao: 0.9 },
    { dur: 5, look: INT, doorOpen: 1, van: V, ease: io, pos: [[21.45, 1.65, -3.6], [21.45, 2.9, -6.2], [21.5, 4.43, -9.0], [22.2, 4.43, -10.0]], yaw: [-2, 50], pitch: [16, 0], fov: 64, pfov: 0.85, shadowC: [X, 0, -9], shadowR: 12, ao: 0.9 },
    { dur: 5, look: INT, doorOpen: 1, van: V, ease: io, pos: [[25.4, 4.43, -12.4], [25.6, 4.43, -9.5]], yaw: [-6, -172], pitch: [-2, -34], fov: 64, pfov: 0.85, shadowC: [X, 0, -11], shadowR: 12, ao: 0.9 },
    { dur: 6, look: FR, doorOpen: 0, van: V, ease: io, pos: [[X - 0.5, 5.0, -20], [X - 3, 9, -30], [X - 6, 18, -46]], target: [[X - 0.5, 4.5, -10], [X - 1, 3, -10], [X - 2, 1, -8]], fov: 48, pfov: 0.8, shadowC: [24, 0, -12], shadowR: 40 },
  ];
};
