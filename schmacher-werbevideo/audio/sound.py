# Musik, Sounddesign und Mischung für das Werbevideo (alles synthetisch erzeugt, keine Fremdrechte)
import numpy as np, subprocess, json
from scipy import signal
SR = 48000
rng = np.random.default_rng(7)

def T(sec): return int(round(sec * SR))
def buf(L): return np.zeros((T(L), 2))
def add(dst, src, t, gain=1.0, pan=0.0):
    i = T(t); n = min(len(src), len(dst) - i)
    if n <= 0: return
    s = src[:n] if src.ndim == 2 else np.stack([src[:n] * np.sqrt(0.5 * (1 - pan)) * 1.414, src[:n] * np.sqrt(0.5 * (1 + pan)) * 1.414], 1) / 1.414
    if src.ndim == 2: s = src[:n]
    dst[i:i + n] += s * gain
def env_adsr(n, a, r, curve=1.0):
    e = np.ones(n); na = max(1, T(a)); nr = max(1, T(r))
    e[:na] = np.linspace(0, 1, na) ** curve; e[-nr:] *= np.linspace(1, 0, nr) ** curve; return e
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def lp(x, f, o=2): b, a = signal.butter(o, f / (SR / 2)); return signal.lfilter(b, a, x, axis=0)
def hp(x, f, o=2): b, a = signal.butter(o, f / (SR / 2), 'high'); return signal.lfilter(b, a, x, axis=0)
def bp(x, f1, f2, o=2): b, a = signal.butter(o, [f1 / (SR / 2), f2 / (SR / 2)], 'band'); return signal.lfilter(b, a, x, axis=0)

def reverb(x, dur=2.6, pre=0.02, damp=4000, wet=0.3):
    n = T(dur); t = np.arange(n) / SR
    out = np.zeros((len(x) + n - 1, 2))
    for c in range(2):
        ir = rng.standard_normal(n) * np.exp(-t * 6.9 / dur); ir = lp(ir, damp, 1); ir[:T(pre)] = 0; ir /= np.sqrt((ir ** 2).sum())
        out[:, c] = signal.fftconvolve(x[:, c] if x.ndim == 2 else x, ir)
    y = np.zeros_like(out); y[:len(x)] = x if x.ndim == 2 else np.stack([x, x], 1)
    return y * (1 - wet) + out * wet

# ------------------------------------------------------------- Instrumente
def pad(notes, dur, bright=1.0):
    n = T(dur); t = np.arange(n) / SR; out = np.zeros((n, 2))
    for m in notes:
        for k, det in enumerate([-7, 0, 6]):
            f = hz(m) * 2 ** (det / 1200); ph = rng.uniform(0, 6.28)
            s = sum(np.sin(2 * np.pi * f * h * t + ph * h) / h * np.exp(-h / (3.2 * bright)) for h in range(1, 10))
            lfo = 1 + 0.15 * np.sin(2 * np.pi * (0.13 + 0.05 * k) * t + k)
            out[:, k % 2] += s * lfo; out[:, 1 - k % 2] += s * lfo * 0.6
    return out * env_adsr(n, min(1.2, dur * 0.4), min(1.5, dur * 0.45))[:, None] / (len(notes) * 3)

def pluck(m, dur=1.6, bright=1.0):
    n = T(dur); t = np.arange(n) / SR; f = hz(m); s = np.zeros(n)
    for h in range(1, 14):
        fh = f * h * np.sqrt(1 + 0.0004 * h * h)
        s += np.sin(2 * np.pi * fh * t) / h ** 1.1 * np.exp(-t * (1.6 + h * 0.9 / bright))
    s *= np.minimum(1, t / 0.004); return s * 0.5

def kick():
    n = T(0.5); t = np.arange(n) / SR
    f = 46 + 90 * np.exp(-t * 28); ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t * 7) + 0.25 * lp(rng.standard_normal(n), 3000) * np.exp(-t * 120)
    return np.tanh(s * 1.5) * 0.9

def clap():
    n = T(0.35); t = np.arange(n) / SR; e = np.zeros(n)
    for d in [0, 0.011, 0.022]: e += (t >= d) * np.exp(-np.clip(t - d, 0, None) * (45 if d < 0.02 else 14))
    return bp(rng.standard_normal(n), 900, 4500) * e * 0.6

def hat(open_=False):
    n = T(0.25 if open_ else 0.06); t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 7000, 3) * np.exp(-t * (18 if open_ else 70)) * 0.35

def bass(m, dur):
    n = T(dur); t = np.arange(n) / SR; f = hz(m)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    return np.tanh(s * 1.2) * env_adsr(n, 0.01, 0.08) * 0.55

def riser(dur):
    n = T(dur); t = np.arange(n) / SR; k = t / dur
    nz = rng.standard_normal(n); out = np.zeros(n); seg = T(0.05)
    for i in range(0, n, seg):  # wandernder Bandpass
        fc = 300 + 7000 * k[i] ** 2; out[i:i + seg] = bp(nz[i:i + seg + 2000], fc * 0.7, min(fc * 1.4, 20000))[:len(out[i:i + seg])]
    tone = np.sin(2 * np.pi * np.cumsum(200 + 800 * k ** 2) / SR) * 0.15
    return (out * 0.8 + tone) * k ** 2.2

def impact(big=1.0):
    n = T(2.5); t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(38 + 60 * np.exp(-t * 9)) / SR) * np.exp(-t * 2.2)
    nz = lp(rng.standard_normal(n), 2500) * np.exp(-t * 9) * 0.5
    return np.tanh((boom + nz) * 1.4) * 0.9 * big

def whoosh(dur=1.0, peak=0.6, lo=300, hi=3500):
    n = T(dur); t = np.arange(n) / SR; k = t / dur
    e = np.where(k < peak, (k / peak) ** 2, ((1 - k) / (1 - peak)) ** 1.5)
    s = bp(rng.standard_normal((n, 2)), lo, hi); return s * e[:, None] * 0.5

def shimmer(dur=3.0):
    n = T(dur); t = np.arange(n) / SR; s = np.zeros(n)
    for m in [88, 93, 95, 100]:
        s += np.sin(2 * np.pi * hz(m) * t + rng.uniform(0, 6)) * np.exp(-t * 1.4) * (1 + 0.5 * np.sin(2 * np.pi * 6 * t))
    return s * 0.06 * np.minimum(1, t / 0.02)

# ------------------------------------------------------------- Musik
CH = [(57, [69, 72, 76, 79]), (53, [69, 72, 77, 81]), (48, [67, 72, 76, 79]), (55, [67, 71, 74, 79])]  # Am9 · Fmaj7 · C · G
def music(L, t_pulse, t_drop, t_break, t_logo, bar=2.5, t_cta=None):
    beat = bar / 4; mus = buf(L + 3); drums = buf(L + 3); bs = buf(L + 3)
    nb = int(np.ceil(L / bar)) + 1
    for b in range(nb):
        t0 = b * bar; root, notes = CH[b % 4]
        if t0 >= t_logo + bar: break
        lvl = 0.55 if t0 < t_drop else (0.8 if t0 < t_break else 0.7)
        add(mus, pad([m - 12 for m in notes[:3]] + [notes[3]], bar + 1.6, 1.0 if t0 >= t_drop else 0.7), t0, lvl)
        # Klavier-Arpeggio
        arp = [notes[0], notes[1], notes[2], notes[3], notes[2], notes[1], notes[3] + 0, notes[2]]
        step = beat / 2
        for i, m in enumerate(arp):
            tt = t0 + i * step
            if tt >= t_logo: break
            if t0 < t_pulse and i % 2: continue
            v = 0.32 if i % 2 == 0 else 0.22
            add(mus, np.stack([pluck(m), pluck(m)], 1), tt, v * (0.8 if t_break <= tt < t_logo else 1), 0)
        # Bass + Drums im Drop
        if t_drop <= t0 < t_break or (t_pulse <= t0 < t_drop):
            for i in range(8):
                tt = t0 + i * beat / 2
                if tt >= min(t_break, t_logo): break
                if t0 >= t_drop or i % 2 == 1: add(bs, np.stack([bass(root - 12, beat / 2 * 0.9)] * 2, 1), tt, 0.7 if t0 >= t_drop else 0.4)
        if t_drop <= t0 < t_break:
            for i in range(4):
                tt = t0 + i * beat
                if tt >= t_break: break
                add(drums, np.stack([kick()] * 2, 1), tt, 0.9)
                if i % 2 == 1: add(drums, np.stack([clap(), clap()], 1), tt, 0.5)
                add(drums, np.stack([hat(), hat()], 1), tt + beat / 2, 0.5)
                if i == 3 and b % 2: add(drums, np.stack([hat(True)] * 2, 1), tt + beat / 2, 0.35)
        elif t_pulse <= t0 < t_drop:
            for i in range(8): add(drums, np.stack([hat()] * 2, 1), t0 + i * beat / 2, 0.22 if i % 2 else 0.12)
    # Sidechain-Pumpen auf Pad/Bass im Drop
    n = len(mus); pump = np.ones(n); kt = np.arange(T(beat)) / SR; shape = 1 - 0.45 * np.exp(-kt * 9)
    t = t_drop
    while t < t_break: i = T(t); m = min(len(shape), n - i); pump[i:i + m] = shape[:m]; t += beat
    mus *= pump[:, None]; bs *= pump[:, None]
    mix = reverb(mus, 2.8, wet=0.35)[:n] + bs + reverb(drums, 1.2, wet=0.12)[:n]
    # Übergänge
    add(mix, np.stack([riser(t_drop - 0.0 - (t_drop - 1.9)), riser(1.9)], 1) * 0.5, t_drop - 1.9, 0.6)
    add(mix, reverb(np.stack([impact(0.8)] * 2, 1), 2.5, wet=0.3), t_drop, 0.7)
    add(mix, np.stack([riser(1.4)] * 2, 1) * 0.5, t_logo - 1.4, 0.5)
    add(mix, reverb(np.stack([impact(1.0)] * 2, 1), 3, wet=0.35), t_logo, 0.85)
    add(mix, reverb(np.stack([shimmer(4), shimmer(4)], 1), 3, wet=0.5), t_logo, 1.0)
    # Endakkord
    add(mix, reverb(pad([45, 57, 64, 69, 72, 76], L - t_logo + 0.5, 0.8), 3, wet=0.4), t_logo, 0.7)
    # lange Endcard: ruhiges Arpeggio läuft weiter, Akzent wenn Kontakt/„Jetzt anrufen“ erscheint
    tt = t_logo + bar; arp = [57, 64, 69, 72, 76, 72, 69, 64]; i = 0
    while tt < L - 1.6:
        m = arp[i % 8]; add(mix, reverb(np.stack([pluck(m), pluck(m)], 1), 2.2, wet=0.35), tt, 0.16); tt += beat / 2; i += 1
    if t_cta is not None: add(mix, reverb(np.stack([shimmer(3), shimmer(3)], 1), 3, wet=0.5), t_cta, 0.6)
    mix = mix[:T(L)]
    fo = T(1.2); mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.5
    return mix

# ------------------------------------------------------------- Sounddesign
def ambience(L, segs):
    """segs: Liste (t0, t1, art) mit art in morning, interior, night"""
    out = buf(L)
    for t0, t1, kind in segs:
        n = T(t1 - t0); e = env_adsr(n, 0.25, 0.25)[:, None]
        if kind == 'morning':
            air = lp(rng.standard_normal((n, 2)), 600) * 0.25
            birds = np.zeros((n, 2))
            for _ in range(int((t1 - t0) * 2.2)):
                s0 = rng.uniform(0, max(0.01, t1 - t0 - 0.5)); f0 = rng.uniform(2800, 5200); k = rng.integers(2, 6); ch = rng.integers(0, 2)
                for j in range(k):
                    m = T(0.07); tt = np.arange(m) / SR
                    c = np.sin(2 * np.pi * np.cumsum(f0 * (1 + 0.35 * np.sin(np.pi * tt / 0.07)) * (1 - 0.15 * j / k)) / SR) * np.sin(np.pi * tt / 0.07) ** 2
                    i = T(s0 + j * 0.095)
                    if i + m < n: birds[i:i + m, ch] += c * 0.05; birds[i:i + m, 1 - ch] += c * 0.02
            out[T(t0):T(t0) + n] += (air + birds) * e
        elif kind == 'interior':
            out[T(t0):T(t0) + n] += lp(rng.standard_normal((n, 2)), 250) * 0.18 * e
        elif kind == 'night':
            air = lp(rng.standard_normal((n, 2)), 400) * 0.18; cr = np.zeros((n, 2)); tt = np.arange(n) / SR
            for f, ph, ch in [(4300, 0, 0), (4550, 0.3, 1), (4100, 0.6, 0)]:
                gate = (np.sin(2 * np.pi * 2.3 * tt + ph * 6) > 0.3) * (np.sin(2 * np.pi * 34 * tt) > 0)
                cr[:, ch] += np.sin(2 * np.pi * f * tt) * lp(gate.astype(float), 300) * 0.015
            out[T(t0):T(t0) + n] += (air + cr) * e
    return out

def beep(f, d=0.075):
    n = T(d); t = np.arange(n) / SR; return np.sin(2 * np.pi * f * t) * env_adsr(n, 0.004, 0.015) * 0.18

def keypad(out, t_first, t_ok):
    for i, f in enumerate([1180, 1180, 1180, 1180]): add(out, np.stack([beep(f)] * 2, 1), t_first + i * 0.27, 1)
    add(out, np.stack([beep(1320, 0.09)] * 2, 1), t_ok, 1); add(out, np.stack([beep(1760, 0.14)] * 2, 1), t_ok + 0.1, 1)
    clk = hp(rng.standard_normal(T(0.03)), 1500) * np.exp(-np.arange(T(0.03)) / SR * 200) * 0.3
    add(out, np.stack([clk] * 2, 1), t_ok + 0.25, 1)

def gate(out, t0, t1):
    n = T(t1 - t0); t = np.arange(n) / SR
    motor = (signal.sawtooth(2 * np.pi * 100 * t) * 0.5 + np.sin(2 * np.pi * 50 * t)) ; motor = lp(motor, 400) * 0.10
    rattle = bp(rng.standard_normal(n), 800, 3500) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 7.5 * t))) * 0.035
    roll = lp(rng.standard_normal(n), 900) * 0.06
    s = (motor + rattle + roll) * env_adsr(n, 0.15, 0.3)
    add(out, reverb(np.stack([s, s * 0.9], 1), 1.4, wet=0.25), t0, 1)
    for tt, g in [(t0, 0.35), (t1, 0.45)]:
        c = lp(rng.standard_normal(T(0.15)), 1200) * np.exp(-np.arange(T(0.15)) / SR * 35) * g
        add(out, reverb(np.stack([c, c], 1), 1.2, wet=0.3), tt, 1)

# ------------------------------------------------------------- Stimme
def load_wav(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).astype(float)

def voice_chain(x):
    x = hp(x, 85, 2)
    b, a = signal.iirpeak(180 / (SR / 2), 1.0); x = x + 0.25 * signal.lfilter(b, a, x)   # Wärme
    b, a = signal.iirpeak(3200 / (SR / 2), 1.2); x = x + 0.35 * signal.lfilter(b, a, x)  # Präsenz
    # einfacher Kompressor
    env = np.sqrt(lp(x ** 2, 30, 1).clip(1e-9)); g = np.minimum(1, (0.12 / env) ** 0.6); x = x * g
    return x / (np.abs(x).max() + 1e-9) * 0.9

def mix(L, music_, sfx_, vo_items, out_path, music_gain=0.5, sfx_gain=1.0, vo_gain=1.0):
    vo = buf(L)
    for path, t, spd in vo_items:
        x = load_wav(path)
        if spd != 1.0:
            raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-af', f'atempo={spd}', '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
            x = np.frombuffer(raw, np.float32).astype(float)
        x = voice_chain(x); add(vo, np.stack([x, x], 1), t, 1)
    vo = reverb(vo, 0.6, wet=0.06)[:len(vo)]
    # Ducking der Musik unter der Stimme
    ve = lp(np.abs(vo[:, 0]), 6, 1); duck = 1 - 0.55 * np.clip(ve / 0.08, 0, 1)
    m = music_[:T(L)] * duck[:, None] * music_gain + sfx_[:T(L)] * sfx_gain + vo * vo_gain * 0.8
    m = np.tanh(m * 1.1) / 1.1
    tmp = out_path + '.raw.wav'; import wave
    pcm = (np.clip(m, -1, 1) * 32767).astype('<i2')
    with wave.open(tmp, 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', tmp, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=9', '-ar', str(SR), out_path], check=True)
    return out_path
