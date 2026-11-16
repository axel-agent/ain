# Ton für Film 2 „Licht an.“ (gleiche Zeitachse für 16:9 und 9:16)
import sys; sys.path.insert(0, '.')
from sound import *
L = 42.4
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

if __name__ == '__main__':
    mu = music(L, t_pulse=4.5, t_drop=8.9, t_break=28.0, t_logo=31.0, t_cta=32.8)
    fade = np.clip((np.arange(len(mu)) / SR - 1.1) / 1.6, 0, 1); mu *= fade[:, None]
    fx = ambience(L, [(0.8, 28.2, 'interior'), (28.0, 42.4, 'night')])
    fx[:T(1.0)] *= 0.25
    add(fx, click(), 0.95, 1.0)
    for i in range(7): add(fx, tink(2400 + i * 90), 1.05 + i * 0.2, 0.8)
    for i in range(3): add(fx, clank(420 + i * 30), 8.9 + i * 0.25 + 0.15, 0.9); add(fx, clank(520), 9.2 + i * 0.25 + 0.2, 0.6)
    for b in range(2):
        for li in range(2): add(fx, clank(700 + li * 60), 9.9 + b * 0.2 + li * 0.25 + 0.05, 0.5)
    pt = 10.6
    for k in range(17): add(fx, thud(), pt + 0.2, 0.6 + 0.1 * (k % 3)); pt += 0.17
    for k in range(3): add(fx, clank(600), 12.6 + k * 0.2 + 0.2, 0.35); add(fx, pop(), 13.0 + k * 0.2, 0.6)
    for t0 in [14.0, 14.2, 14.4]: add(fx, thud(), t0 + 0.15, 0.5)
    T0 = 19.75
    for d in [0, 0.2, 0.7, 0.78, 0.86, 0.94, 1.05, 1.17, 1.3, 1.42, 1.54, 1.66, 1.8, 2.1, 2.25, 2.35, 2.45, 2.6, 2.7, 2.8, 2.9, 2.95]: add(fx, pop(), T0 + d + 0.08, 0.7)
    add(fx, click(), 22.55, 0.6); add(fx, chime(), 23.0, 1.0)
    for d in [0, 0.1, 0.2]: add(fx, pop(), 24.9 + d, 0.6)
    add(fx, grinder(), 25.9, 1.0)
    add(fx, whoosh(1.0, 0.6), 27.6, 0.4); add(fx, whoosh(0.7, 0.65), 15.1, 0.25); add(fx, whoosh(0.7, 0.65), 19.25, 0.25); add(fx, whoosh(0.7, 0.65), 24.2, 0.25)
    V = 'vo/raw_%s.wav'
    vo = [(V % 'f2_01', 2.7, 1.0), (V % 'f2_02', 5.3, 1.0), (V % 'f2_03', 9.6, 1.0), (V % 'f2_04', 16.6, 1.0), (V % 'f2_05', 19.9, 1.0),
          (V % 'f2_06', 25.0, 1.0), (V % 'f2_07', 28.4, 1.0), (V % 'f2_08', 32.2, 1.0), (V % '09', 34.8, 1.0), (V % '10', 37.4, 1.08)]
    mix(L, mu, fx, vo, 'out_film2.wav')
    print('ok')
