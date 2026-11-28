import sys; sys.path.insert(0, '.')
from sound import *
import os; MK = 'm' if os.environ.get('MAKLER') else ''  # Makler-Version: Russinov-Abbinder
L = 50.5
mu = music(L, t_pulse=5.5, t_drop=14.4, t_break=32.0, t_logo=39.3, t_cta=41.1)
fx = ambience(L, [(0, 14, 'morning'), (14, 20, 'morning'), (20, 32, 'interior'), (32, 40.5, 'night')])
add(fx, whoosh(1.6, 0.5, 200, 2500), 2.6, 0.4)
for t in [5.2, 10.7, 19.7, 25.7, 31.6]: add(fx, whoosh(0.8, 0.6), t, 0.35)

gate(fx, 14.4, 18.6)
V = 'vo/raw_%s.wav'
vo = [(V % '01', 3.0, 1), (V % '02', 5.7, 1), (V % '03', 11.6, 1.05), (V % '04', 15.0, 1), (V % '05', 19.6, 1.1),
      (V % '06', 26.7, 1), (V % '07', 32.7, 1), (V % '08', 39.6, 1), (V % (MK + '09'), 42.8, 1.0), (V % (MK + '10'), 45.4, 1.08)]
mix(L, mu, fx, vo, 'out_16x9' + ('_mk' if MK else '') + '.wav')
print('ok')
