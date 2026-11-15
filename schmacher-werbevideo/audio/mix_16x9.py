import sys; sys.path.insert(0, '.')
from sound import *
L = 45.0
mu = music(L, t_pulse=5.5, t_drop=14.4, t_break=32.0, t_logo=39.3)
fx = ambience(L, [(0, 14, 'morning'), (14, 20, 'morning'), (20, 32, 'interior'), (32, 39.6, 'night')])
add(fx, whoosh(1.6, 0.5, 200, 2500), 0.0, 0.5)
for t in [5.2, 10.7, 19.7, 25.7, 31.6]: add(fx, whoosh(0.8, 0.6), t, 0.35)
keypad(fx, 11.45, 12.6)
gate(fx, 14.4, 18.6)
V = 'vo/raw_%s.wav'
vo = [(V % '01', 1.0, 1), (V % '02', 5.7, 1), (V % '03', 11.6, 1.05), (V % '04', 15.0, 1), (V % '05', 20.4, 1),
      (V % '06', 26.7, 1), (V % '07', 32.7, 1), (V % '08', 39.6, 1), (V % '09', 42.5, 1.05)]
mix(L, mu, fx, vo, 'out_16x9_45s.wav')
print('ok')
