# Ton für Film 2 „Licht an.“ (gleiche Zeitachse für 16:9 und 9:16)
import sys; sys.path.insert(0, '.')
from sound import *
L = 50.6
C, INS = 2.25, 10.0   # Vorschaubild-Länge, eingeschobener Rundumschwenk + Tor
def A(t): return t + C if t < 15.5 else t + C + INS   # Aufbau-Zeit -> Video-Zeit
tt = lambda d: np.arange(T(d)) / SR
def click():  # Lichtschalter
    t = tt(0.12); s = bp(rng.standard_normal(len(t)), 1500, 6000) * np.exp(-t * 90) * 0.9 + np.sin(2 * np.pi * 110 * t) * np.exp(-t * 60) * 0.5
    return np.stack([s, s], 1)
def tink(f=2600):  # Leuchtstoff-Zünden
    t = tt(0.35); s = (np.sin(2 * np.pi * f * t) * 0.5 + np.sin(2 * np.pi * f * 2.7 * t) * 0.2) * np.exp(-t * 18) + bp(rng.standard_normal(len(t)), 3000, 9000) * np.exp(-t * 60) * 0.3
    return np.stack([s, s], 1) * 0.5
def clank(f=480):  # Regalstütze
    t = tt(0.7); s = sum(np.sin(2 * np.pi * f * r * t + rng.uniform(0, 6)) * np.exp(-t * (5 + 3 * k)) / (k + 1) for k, r in enumerate([1, 2.76, 5.4, 8.93]))
    s += bp(rng.standard_normal(len(t)), 800, 5000) * np.exp(-t * 80) * 0.6
    return np.stack([s, s], 1) * 0.35
def thud():  # Palette landet
    t = tt(0.4); s = np.sin(2 * np.pi * (70 + 40 * np.exp(-t * 30)) * t) * np.exp(-t * 14) + lp(rng.standard_normal(len(t)), 900) * np.exp(-t * 35) * 0.8
    return np.stack([s, s], 1) * 0.55
def pop():  # Möbel erscheint
    t = tt(0.25); f = 300 + 900 * np.exp(-t * 25); s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 22) * 0.5 + bp(rng.standard_normal(len(t)), 600, 4000) * np.exp(-t * 40) * 0.25
    return np.stack([s, s], 1) * 0.45
def chime():
    t = tt(1.2); s = sum(np.sin(2 * np.pi * hz(m) * t) * np.exp(-t * 4) for m in [84, 88, 91]) * 0.12
    return np.stack([s, s], 1)
def grinder():  # Kaffeemühle
    t = tt(0.9); s = bp(rng.standard_normal(len(t)), 200, 2500) * (0.6 + 0.4 * np.sin(2 * np.pi * 37 * t)) * np.minimum(1, t / 0.05) * np.minimum(1, (0.9 - t) / 0.15)
    return np.stack([s, s], 1) * 0.25

def motor(d):  # Torantrieb
    t = tt(d); s = (signal.sawtooth(2 * np.pi * 96 * t) * 0.25 + bp(rng.standard_normal(len(t)), 120, 900) * 0.5) * np.minimum(1, t / 0.2) * np.minimum(1, (d - t) / 0.3)
    s = lp(s, 1200); return np.stack([s, s], 1) * 0.35
def engine(d):  # Transporter fährt herein (wird lauter, Diesel-Brummen)
    t = tt(d); f = 38 + 10 * np.minimum(1, t / d); ph = 2 * np.pi * np.cumsum(f) / SR
    s = (np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.3 * signal.sawtooth(3 * ph)) * 0.4 + lp(rng.standard_normal(len(t)), 500) * 0.5
    g = np.minimum(1, t / (d * 0.55)) ** 1.5 * np.minimum(1, (d - t) / 0.6); s = lp(s * g, 900); return np.stack([s * 0.9, s], 1) * 0.55

if __name__ == '__main__':
    mu = music(L, t_pulse=A(4.5), t_drop=A(8.9), t_break=A(28.0), t_logo=A(31.0), t_cta=44.35)
    fade = np.clip((np.arange(len(mu)) / SR - 3.3) / 1.4, 0, 1); mu *= fade[:, None]
    fx = ambience(L, [(0.0, A(28.2), 'interior'), (A(28.0), L, 'night')])
    fx[:T(3.2)] *= 0.25
    add(fx, whoosh(0.7, 0.65), 1.85, 0.3)
    add(fx, click(), A(0.95), 1.0)
    for i in range(7): add(fx, tink(2400 + i * 90), A(1.05 + i * 0.2), 0.8)
    for i in range(3): add(fx, clank(420 + i * 30), A(8.9 + i * 0.25 + 0.15), 0.9); add(fx, clank(520), A(9.2 + i * 0.25 + 0.2), 0.6)
    for b in range(2):
        for li in range(2): add(fx, clank(700 + li * 60), A(9.9 + b * 0.2 + li * 0.25 + 0.05), 0.5)
    pt = 10.6
    for k in range(17): add(fx, thud(), A(pt + 0.2), 0.6 + 0.1 * (k % 3)); pt += 0.17
    for k in range(3): add(fx, clank(600), A(12.6 + k * 0.2 + 0.2), 0.35); add(fx, pop(), A(13.0 + k * 0.2), 0.6)
    for t0 in [14.0, 14.2, 14.4]: add(fx, thud(), A(t0 + 0.15), 0.5)
    # Rundumschwenk: Lager füllt sich (Video-Zeit)
    for t0 in [18.55, 18.75, 19.05, 19.35]: add(fx, pop(), t0 + 0.1, 0.7)
    for t0 in [19.5, 19.65]: add(fx, thud(), t0 + 0.25, 0.6)
    for t0 in [20.35, 21.45, 21.6]: add(fx, pop(), t0 + 0.1, 0.6)
    add(fx, whoosh(1.0, 0.6), 17.4, 0.3)
    # Tor + Transporter
    add(fx, click(), 23.3, 0.5); add(fx, motor(2.3), 23.35, 1.0); add(fx, engine(3.6), 24.0, 1.0)
    T0 = A(19.75)
    for d in [0, 0.2, 0.7, 0.78, 0.86, 0.94, 1.05, 1.17, 1.3, 1.42, 1.54, 1.66, 1.8, 2.1, 2.25, 2.35, 2.45, 2.6, 2.7, 2.8, 2.9, 2.95]: add(fx, pop(), T0 + d + 0.08, 0.7)
    add(fx, click(), A(22.55), 0.6); add(fx, chime(), A(23.0), 1.0)
    for d in [0, 0.1, 0.2]: add(fx, pop(), A(24.9 + d), 0.6)
    add(fx, grinder(), A(25.9), 1.0)
    add(fx, whoosh(1.0, 0.6), A(27.6), 0.4); add(fx, whoosh(0.7, 0.65), A(15.1), 0.25); add(fx, whoosh(0.7, 0.65), A(19.25), 0.25); add(fx, whoosh(0.7, 0.65), A(24.2), 0.25)
    V = 'vo/raw_%s.wav'
    vo = [(V % 'f2_01', 2.45, 1.0), (V % 'f2_02', 7.55, 1.0), (V % 'f2_03', 11.85, 1.0), (V % 'f2_09', 17.95, 1.0), (V % 'f2_10', 24.6, 1.0),
          (V % 'f2_04', A(16.6), 1.0), (V % 'f2_05', A(19.9), 1.0), (V % 'f2_06', A(25.0), 1.0), (V % 'f2_07', 40.3, 1.0),
          (V % '09', 43.4, 1.0), (V % '10', 45.75, 1.08)]
    mix(L, mu, fx, vo, 'out_film2.wav')
    print('ok')
