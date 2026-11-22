# „7 Hallen. 7 Gründe.“ – Komposition (3D + Uhr + Checkliste) und Endfertigung
# python3 d1_build.py [frames|audio|video|all]
import os, sys, subprocess, math
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance, ImageChops
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
FR3D = os.path.join(HERE, '..', 'out', 'd4'); TT = os.path.join(HERE, 'd4_titles')
OUTF = os.path.join(HERE, '..', 'out', 'd4_comp'); os.makedirs(OUTF, exist_ok=True)
EXP = os.path.join(ROOT, 'export', 'daily', '2026-11-22'); os.makedirs(EXP, exist_ok=True)
FPS, W, H = 24, 1080, 1920
TEND, L = 39.5, 46.7
P = lambda n: os.path.join(ROOT, n)


def f3d(i):
    p = os.path.join(FR3D, f'f{i:05d}.jpg')
    return Image.open(p).convert('RGB') if os.path.exists(p) else Image.new('RGB', (W, H), (40, 40, 40))
def at(t): return f3d(min(839, int(round(t * FPS))))

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

from PIL import ImageDraw, ImageFont
FB = ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-Black.otf', 76)
FS = ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-Bold.otf', 26)
KEYS = [(0, 418), (4.5, 420), (10.5, 425), (16, 432), (21, 440), (26, 447), (31, 450)]
def clock(t):
    for (a, ma), (b, mb) in zip(KEYS, KEYS[1:]):
        if t <= b: return ma + (mb - ma) * max(0, (t - a)) / (b - a)
    return KEYS[-1][1]
def draw_clock(im, t, a=1.0):
    m = int(clock(t)); txt = f'{m // 60:02d}{":" if (t * 2) % 2 < 1.4 else " "}{m % 60:02d}'
    ov = Image.new('RGBA', im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    x1, y0 = W - 60, 130; w = 330; d.rounded_rectangle((x1 - w, y0, x1, y0 + 150), 34, fill=(15, 24, 42, int(225 * a)))
    d.text((x1 - w + 34, y0 + 16), 'UHRZEIT', font=FS, fill=(242, 179, 27, int(255 * a)))
    d.text((x1 - w + 30, y0 + 46), txt, font=FB, fill=(255, 255, 255, int(255 * a)))
    b = im.convert('RGBA'); b.alpha_composite(ov); return b.convert('RGB')

CUTS = [3.0, 19.0, 25.0, 31.0]
NUMS = [(7, 3.6), (6, 5.91), (5, 8.22), (4, 10.53), (3, 12.84), (2, 15.15), (1, 17.46)]
def frame(t):
    if t < 35.0:
        im = at(t)
        for c in CUTS:
            if c - 0.06 < t < c + 0.1: im = Image.blend(im, Image.new('RGB', im.size, 'white'), 0.5 * (1 - abs(t - c) / 0.1))
        im = over(im, 'g0', env(t, 0.1, 3.2, 0.2, 0.25))
        for n, tn in NUMS: im = over(im, f'r{n}', env(t, tn - 0.95, tn + 1.25, 0.18, 0.18))
        for tid, a, b in [('tc', 19.6, 25.0), ('td', 25.6, 31.0), ('te', 31.3, 35.0)]: im = over(im, tid, env(t, a, b, 0.3, 0.25))
        return im
    lt = t - 35.0; z = 1 + 0.04 * lt / 4.5; bg = at(24.9); cw, ch = W / z, H / z
    bg = bg.resize((W, H), Image.LANCZOS, box=((W - cw) / 2, (H - ch) / 2, (W + cw) / 2, (H + ch) / 2)).filter(ImageFilter.GaussianBlur(9))
    im = ImageEnhance.Brightness(bg).enhance(0.45)
    return over(im, 'tz', env(lt, 0.1, 6.0, 0.25, 0.0))

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
    from mix_film2 import pop
    sound.CH = [(48, [64, 67, 72, 76]), (43, [62, 67, 71, 74]), (45, [64, 69, 72, 76]), (41, [65, 69, 72, 77])]  # C · G · Am · F – Countdown-Pop
    mu = music(L, t_pulse=0.0, t_drop=3.0, t_break=TEND - 5.0, t_logo=TEND, bar=2.31, t_cta=TEND + 1.0)
    fx = ambience(L, [(0, 25.0, 'morning'), (25.0, 31.0, 'interior'), (31.0, 35.0, 'morning')])
    add(fx, reverb(np.stack([impact(0.9)] * 2, 1), 2.2, wet=0.3), 0.0, 0.8)
    for n, tn in NUMS: add(fx, pop(), tn - 0.95, 0.9)
    for t in CUTS + [35.0]: add(fx, whoosh(0.6, 0.6), t - 0.3, 0.3)
    add(fx, reverb(np.stack([impact(1.0)] * 2, 1), 2.5, wet=0.35), 35.0, 0.7)
    V = os.path.join(ROOT, 'audio', 'vo', 'raw_%s.wav')
    tail = [('09', TEND + 0.5, 1.0), ('10', TEND + 2.8, 1.1)] if brand == 's' else [('m09', TEND + 0.5, 1.0), ('m10', TEND + 2.8, 1.12)]
    vo = [('g00', 0.35, 1.0), ('g7', 3.15, 1.15), ('g6', 5.55, 1.0), ('g5', 7.85, 1.0), ('g4', 10.2, 1.0), ('g3', 12.55, 1.0), ('g2', 14.8, 1.0), ('g1', 17.0, 1.05),
          ('g8', 19.6, 1.1), ('g9', 25.8, 1.0), ('g10', 31.4, 1.0), ('g11', 35.4, 1.0)] + tail
    return mix(L, mu, fx, [(V % n, t, sp) for n, t, sp in vo], os.path.join(OUTF, f'audio_{brand}.wav'))

def video(brand):
    name = {'s': 'Schmacher', 'r': 'Russinov'}[brand]
    endimg = os.path.join(TT, f'end_{brand}.png')
    last = os.path.join(OUTF, f'f{int(round(TEND * FPS)) - 1:05d}.jpg')
    out = os.path.join(EXP, f'{name}_7Gruende_9x16_ohneStartbild.mp4')
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
    print('D4 DONE')
