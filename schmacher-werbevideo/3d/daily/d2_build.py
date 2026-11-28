# „06:58 – Ein Morgen im Elektrobetrieb“ – Komposition (3D + Uhr + Checkliste) und Endfertigung
# python3 d1_build.py [frames|audio|video|all]
import os, sys, subprocess, math
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance, ImageChops
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
FR3D = os.path.join(HERE, '..', 'out', 'd2'); TT = os.path.join(HERE, 'd2_titles')
OUTF = os.path.join(HERE, '..', 'out', 'd2_comp'); os.makedirs(OUTF, exist_ok=True)
EXP = os.path.join(ROOT, 'export', 'daily', '2026-11-20'); os.makedirs(EXP, exist_ok=True)
FPS, W, H = 24, 1080, 1920
TEND, L = 43.4, 50.6
P = lambda n: os.path.join(ROOT, n)


def f3d(i):
    p = os.path.join(FR3D, f'f{i:05d}.jpg')
    return Image.open(p).convert('RGB') if os.path.exists(p) else Image.new('RGB', (W, H), (40, 40, 40))
def at(t): return f3d(min(767, int(round(t * FPS))))

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

CUTS = [10.5, 16.0, 21.0, 26.0]
def frame(t):
    if t < 32.0:
        im = at(t)
        for c in CUTS:  # kurze Weißblende an den Schnitten
            if c - 0.08 < t < c + 0.12: im = Image.blend(im, Image.new('RGB', im.size, 'white'), 0.55 * (1 - abs(t - c) / 0.12))
        for tid, a, b in [('c1', 0.15, 4.4), ('c2', 5.0, 10.35), ('c3', 11.0, 15.85), ('c4', 16.5, 20.85), ('c5', 21.4, 25.85), ('c6', 26.6, 32.0)]:
            im = over(im, tid, env(t, a, b, 0.3, 0.25))
        return draw_clock(im, t)
    if t < 38.4:
        lt = t - 32.0; bg = at(31.9).filter(ImageFilter.GaussianBlur(16)); im = ImageEnhance.Brightness(bg).enhance(0.55)
        return over(im, 'c7', env(lt, 0.0, 6.4, 0.35, 0.3))
    lt = t - 38.4; bg = at(2.0); z = 1 + 0.05 * lt / 5; cw, ch = W / z, H / z
    bg = bg.resize((W, H), Image.LANCZOS, box=((W - cw) / 2, (H - ch) / 2, (W + cw) / 2, (H + ch) / 2)).filter(ImageFilter.GaussianBlur(8))
    im = ImageEnhance.Brightness(bg).enhance(0.45)
    return over(im, 'c8', env(lt, 0.1, 6.0, 0.3, 0.0))

def frames():
    from multiprocessing import Pool
    n = int(round(TEND * FPS))
    with Pool(int(os.environ.get('NP', '3'))) as pool: pool.map(_one, range(n), chunksize=8)
def _one(i):
    p = os.path.join(OUTF, f'f{i:05d}.jpg')
    if not os.path.exists(p) or os.environ.get('FORCE'): frame(i / FPS).save(p, quality=93)

def audio(brand):
    sys.path.insert(0, os.path.join(ROOT, 'audio')); import sound
    from sound import music, ambience, add, whoosh, impact, reverb, mix, beep
    from mix_film2 import engine, pop
    sound.CH = [(52, [64, 68, 71, 76]), (49, [61, 64, 68, 73]), (45, [64, 69, 73, 76]), (47, [63, 66, 71, 75])]  # E · C#m · A · B – flotter Dur-Groove
    mu = music(L, t_pulse=0.0, t_drop=4.5, t_break=TEND - 5.0, t_logo=TEND, bar=1.9, t_cta=TEND + 1.0)
    fx = ambience(L, [(0, 10.5, 'morning'), (10.5, 26.0, 'interior'), (26.0, 32.0, 'morning')])
    for i in range(9): add(fx, beep(2200, 0.025), 0.1 + i * 0.5, 0.25)  # Uhr tickt
    add(fx, whoosh(2.2, 0.7, 150, 2600), 4.3, 0.5)  # Sturzflug
    for t in CUTS + [32.0, 38.4]: add(fx, whoosh(0.6, 0.6), t - 0.3, 0.3)
    for t in [11.0, 16.5, 21.4, 26.6]: add(fx, pop(), t + 0.05, 0.9)  # Häkchen
    add(fx, engine(5.5), 26.3, 1.0)
    V = os.path.join(ROOT, 'audio', 'vo', 'raw_%s.wav')
    tail = [('09', TEND + 0.5, 1.0), ('10', TEND + 2.8, 1.1)] if brand == 's' else [('m09', TEND + 0.5, 1.0), ('m10', TEND + 2.8, 1.12)]
    vo = [('e01', 0.25, 1.05), ('e02', 5.6, 1.0), ('e03', 11.0, 1.0), ('e04', 16.3, 1.0), ('e05', 21.6, 1.0), ('e06', 26.7, 1.0),
          ('e07', 32.1, 1.1), ('e08', 38.7, 1.08)] + tail
    return mix(L, mu, fx, [(V % n, t, sp) for n, t, sp in vo], os.path.join(OUTF, f'audio_{brand}.wav'))

def video(brand):
    name = {'s': 'Schmacher', 'r': 'Russinov'}[brand]
    endimg = os.path.join(TT, f'end_{brand}.png')
    last = os.path.join(OUTF, f'f{int(round(TEND * FPS)) - 1:05d}.jpg')
    out = os.path.join(EXP, f'{name}_ElektroMorgen_9x16.mp4')
    fc = (f"[0:v]tpad=stop_mode=clone:stop_duration={L - TEND + 0.5:.2f}[b];[1:v]format=rgba,fade=t=in:st={TEND:.2f}:d=0.45:alpha=1[e];"
          f"[b][e]overlay=0:0:enable='gte(t,{TEND:.2f})',fade=t=out:st={L - 0.35:.2f}:d=0.35,format=yuv420p[v]")
    subprocess.run(['ffmpeg', '-nostdin', '-y', '-v', 'error', '-framerate', '24', '-i', os.path.join(OUTF, 'f%05d.jpg'), '-loop', '1', '-t', f'{L + 0.5:.2f}', '-i', endimg,
                    '-i', os.path.join(OUTF, f'audio_{brand}.wav'), '-filter_complex', fc, '-map', '[v]', '-map', '2:a', '-r', '24', '-c:v', 'libx264', '-preset', 'slow',
                    '-crf', '21', '-maxrate', '8M', '-bufsize', '16M', '-c:a', 'aac', '-b:a', '192k', '-t', f'{L:.2f}', '-movflags', '+faststart', out], check=True)
    return out

if __name__ == '__main__':
    w = sys.argv[1] if len(sys.argv) > 1 else 'all'
    if w in ('frames', 'all'): frames()
    if w in ('audio', 'all'): [audio(b) for b in 'sr']
    if w in ('video', 'all'): [video(b) for b in 'sr']
    print('D2 DONE')
