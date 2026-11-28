# „Der Trailer“ – Kino-Trailer-Parodie im Morgengold – Komposition und Endfertigung
# python3 d1_build.py [frames|audio|video|all]
import os, sys, subprocess, math
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance, ImageChops
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
FR3D = os.path.join(HERE, '..', 'out', 'd10'); TT = os.path.join(HERE, 'd10_titles')
OUTF = os.path.join(HERE, '..', 'out', 'd10_comp'); os.makedirs(OUTF, exist_ok=True)
EXP = os.path.join(ROOT, 'export', 'daily', '2026-11-28'); os.makedirs(EXP, exist_ok=True)
FPS, W, H = 24, 1080, 1920
TEND, L = 41.4, 48.6
P = lambda n: os.path.join(ROOT, n)


def f3d(i):
    p = os.path.join(FR3D, f'f{i:05d}.jpg')
    return Image.open(p).convert('RGB') if os.path.exists(p) else Image.new('RGB', (W, H), (40, 40, 40))
def at(t): return f3d(min(671, int(round(t * FPS))))

_tc = {}
def title(tid):
    if tid not in _tc: _tc[tid] = Image.open(os.path.join(TT, tid + '.png')).convert('RGBA')
    return _tc[tid]
def over(bg, tid, a):
    if a <= 0: return bg
    t = title(tid)
    if a < 1: t = t.copy(); t.putalpha(t.getchannel('A').point(lambda v: int(v * a)))
    b = bg.convert('RGBA'); b.alpha_composite(t); return b.convert('RGB')
def env(t, a, b, fi=0.3, fo=0.3):
    if t < a or t > b: return 0
    return min(1, (t - a) / fi if fi else 1, (b - t) / fo if fo else 1)

_grain = None
def grade(im, t):
    """Kino-Look: kräftiger, warm/kühl getrennt (Orange-Teal), leichtes Korn."""
    global _grain
    a = np.asarray(im).astype(np.float32) / 255
    l = a.mean(2, keepdims=True); w = np.clip((l - 0.35) * 1.6, 0, 1)
    a = a * (1 - w * 0.0) + 0
    a = a + (1 - w) * np.array([-0.03, 0.01, 0.04]) * (1 - l) + w * np.array([0.05, 0.015, -0.04]) * l
    a = np.clip((a - 0.5) * 1.12 + 0.5, 0, 1)
    if _grain is None: _grain = [np.random.default_rng(i).normal(0, 0.018, (H, W, 1)).astype(np.float32) for i in range(6)]
    a = np.clip(a + _grain[int(t * 24) % 6], 0, 1)
    return Image.fromarray((a * 255).astype('uint8'))
BAR = 250
def bars(im):
    a = np.asarray(im).copy(); a[:BAR] = 0; a[H - BAR:] = 0; return Image.fromarray(a)
BLACK = Image.new('RGB', (W, H), (0, 0, 0))
def shot(t, t0, c0, push=0.0):
    lt = t - t0; im = at(c0 + lt)
    if push: z = 1 + push * lt; cw, ch = W / z, H / z; im = im.resize((W, H), Image.LANCZOS, box=((W - cw) / 2, (H - ch) / 2, (W + cw) / 2, (H + ch) / 2))
    return bars(grade(im, t))
# Schnittplan: (Start, Ende, 3D-Startzeit)
SEG = [(2.0, 8.0, 0.0), (9.6, 14.6, 6.0), (14.6, 19.6, 11.0), (19.6, 24.6, 16.0), (24.6, 30.6, 21.0)]
CUTS = [2.0, 8.0, 9.6, 14.6, 19.6, 24.6, 30.6]
def frame(t):
    if t < 2.0: im = over(BLACK, 't1', env(t, 0.15, 2.0, 0.5, 0.25)); return im
    if 8.0 <= t < 9.6: return over(BLACK, 't3', env(t, 8.05, 9.6, 0.35, 0.2))
    if t < 30.6:
        for a, b, c0 in SEG:
            if a <= t < b: im = shot(t, a, c0); break
        if t < 2.25: im = ImageEnhance.Brightness(im).enhance((t - 2.0) / 0.25)
        for tid, a, b in [('t2', 2.4, 7.9), ('t4', 9.9, 14.5), ('t5', 15.0, 19.5), ('t6', 20.0, 24.5)]:
            im = over(im, tid, env(t, a, b, 0.35, 0.25))
        if t >= 24.6: e = env(t, 25.4, 30.6, 0.8, 0.4); im = over(ImageEnhance.Brightness(im).enhance(1 - 0.4 * e), 't7', e)
        if 30.35 < t: im = ImageEnhance.Brightness(im).enhance(max(0, (30.6 - t) / 0.25))
        return im
    if t < 37.4:
        lt = t - 30.6; bg = grade(at(26.8), t).filter(ImageFilter.GaussianBlur(14)); im = ImageEnhance.Brightness(bg).enhance(0.6)
        return over(im, 't8', env(lt, 0.0, 6.8, 0.35, 0.3))
    lt = t - 37.4; bg = grade(at(14.0), t); z = 1 + 0.05 * lt / 4; cw, ch = W / z, H / z
    bg = bg.resize((W, H), Image.LANCZOS, box=((W - cw) / 2, (H - ch) / 2, (W + cw) / 2, (H + ch) / 2)).filter(ImageFilter.GaussianBlur(10))
    im = ImageEnhance.Brightness(bg).enhance(0.4)
    return over(im, 't9', env(lt, 0.15, 4.0, 0.4, 0.0))

def frames():
    from multiprocessing import Pool
    n = int(round(TEND * FPS))
    with Pool(int(os.environ.get('NP', '3'))) as pool: pool.map(_one, range(n), chunksize=8)
def _one(i):
    p = os.path.join(OUTF, f'f{i:05d}.jpg')
    if not os.path.exists(p) or os.environ.get('FORCE'): frame(i / FPS).save(p, quality=93)

def audio(brand):
    sys.path.insert(0, os.path.join(ROOT, 'audio')); import sound
    from sound import music, ambience, add, whoosh, impact, reverb, mix
    from mix_film2 import engine, pop
    sound.CH = [(38, [62, 65, 69, 74]), (34, [62, 65, 70, 74]), (41, [60, 65, 69, 72]), (36, [60, 64, 67, 72])]  # Dm · Bb · F · C – episch, tief
    mu = music(L, t_pulse=2.0, t_drop=9.6, t_break=TEND - 4.0, t_logo=TEND, bar=2.5, t_cta=TEND + 1.0)
    fx = ambience(L, [(2.0, 8.0, 'morning'), (9.6, 19.6, 'morning'), (19.6, 24.6, 'interior'), (24.6, 30.6, 'morning')])
    boom = reverb(np.stack([impact(1.0)] * 2, 1), 3.0, wet=0.45)
    for t in [0.1, 8.0, 24.6]: add(fx, boom, t, 1.0)  # Trailer-Schläge
    for t in [2.0, 9.6, 14.6, 19.6, 30.6, 37.4]: add(fx, whoosh(0.8, 0.6), t - 0.4, 0.35)
    add(fx, engine(5.0), 14.8, 0.5)
    V = os.path.join(ROOT, 'audio', 'vo', 'raw_%s.wav')
    tail = [('09', TEND + 0.5, 1.0), ('10', TEND + 2.8, 1.1)] if brand == 's' else [('m09', TEND + 0.5, 1.0), ('m10', TEND + 2.8, 1.12)]
    vo = [('v01', 0.25, 1.0), ('v02', 8.05, 1.0), ('v03', 9.9, 1.0), ('v04', 15.0, 1.0), ('v05', 20.0, 1.0), ('v06', 26.0, 1.0), ('v07', 30.8, 1.0), ('v08', 37.6, 1.0)] + tail
    return mix(L, mu, fx, [(V % n, t, sp) for n, t, sp in vo], os.path.join(OUTF, f'audio_{brand}.wav'))

def video(brand):
    name = {'s': 'Schmacher', 'r': 'Russinov'}[brand]
    endimg = os.path.join(TT, f'end_{brand}.png')
    last = os.path.join(OUTF, f'f{int(round(TEND * FPS)) - 1:05d}.jpg')
    out = os.path.join(EXP, f'{name}_Trailer_9x16_ohneStartbild.mp4')
    fc = (f"[0:v]tpad=stop_mode=clone:stop_duration={L - TEND + 0.5:.2f}[b];[1:v]format=rgba,fade=t=in:st={TEND:.2f}:d=0.45:alpha=1[e];"
          f"[b][e]overlay=0:0:enable='gte(t,{TEND:.2f})',fade=t=out:st={L - 0.35:.2f}:d=0.35,format=yuv420p[v]")
    subprocess.run(['ffmpeg', '-nostdin', '-y', '-v', 'error', '-framerate', '24', '-i', os.path.join(OUTF, 'f%05d.jpg'), '-loop', '1', '-t', f'{L + 0.5:.2f}', '-i', endimg,
                    '-i', os.path.join(OUTF, f'audio_{brand}.wav'), '-filter_complex', fc, '-map', '[v]', '-map', '2:a', '-r', '24', '-c:v', 'libx264', '-preset', 'slow',
                    '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-crf', '21', '-maxrate', '8M', '-bufsize', '16M', '-c:a', 'aac', '-b:a', '192k', '-t', f'{L:.2f}', '-movflags', '+faststart', out], check=True)
    return out

if __name__ == '__main__':
    w = sys.argv[1] if len(sys.argv) > 1 else 'all'
    if w in ('frames', 'all'): frames()
    if w in ('audio', 'all'): [audio(b) for b in 'sr']
    if w in ('video', 'all'): [video(b) for b in 'sr']
    print('D10 DONE')
