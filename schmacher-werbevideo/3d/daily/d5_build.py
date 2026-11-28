# „Paket für dich!“ – Onlineshop – Komposition (3D + Uhr + Checkliste) und Endfertigung
# python3 d1_build.py [frames|audio|video|all]
import os, sys, subprocess, math
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance, ImageChops
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
FR3D = os.path.join(HERE, '..', 'out', 'd5'); TT = os.path.join(HERE, 'd5_titles')
OUTF = os.path.join(HERE, '..', 'out', 'd5_comp'); os.makedirs(OUTF, exist_ok=True)
EXP = os.path.join(ROOT, 'export', 'daily', '2026-11-23'); os.makedirs(EXP, exist_ok=True)
FPS, W, H = 24, 1080, 1920
TEND, L = 38.5, 45.7
P = lambda n: os.path.join(ROOT, n)


def f3d(i):
    p = os.path.join(FR3D, f'f{i:05d}.jpg')
    return Image.open(p).convert('RGB') if os.path.exists(p) else Image.new('RGB', (W, H), (40, 40, 40))
def at(t): return f3d(min(647, int(round(t * FPS))))

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
def draw_clock(im, t, a=1.0):
    n = int(min(128, 128 * ((t - 4.0) / 22.0) ** 0.8)) if t > 4.0 else 0
    ov = Image.new('RGBA', im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    x1, y0, w = W - 60, 130, 380; d.rounded_rectangle((x1 - w, y0, x1, y0 + 150), 34, fill=(15, 24, 42, int(225 * a)))
    d.text((x1 - w + 34, y0 + 16), 'BESTELLUNGEN HEUTE', font=FS, fill=(242, 179, 27, int(255 * a)))
    d.text((x1 - w + 30, y0 + 46), f'{n}', font=FB, fill=(255, 255, 255, int(255 * a)))
    b = im.convert('RGBA'); b.alpha_composite(ov); return b.convert('RGB')

CUTS = [4.0, 10.0, 15.0, 20.0]
def frame(t):
    if t < 27.0:
        im = at(t)
        for c in CUTS:
            if c - 0.06 < t < c + 0.1: im = Image.blend(im, Image.new('RGB', im.size, 'white'), 0.5 * (1 - abs(t - c) / 0.1))
        for tid, a, b in [('s1', 0.15, 3.9), ('s2', 1.9, 3.9), ('s3', 5.4, 14.8), ('s4', 15.4, 19.85), ('s5', 20.6, 27.0)]:
            im = over(im, tid, env(t, a, b, 0.25, 0.25))
        return draw_clock(im, t) if 4.0 <= t < 20.0 else im
    if t < 34.0:
        lt = t - 27.0; bg = at(26.9).filter(ImageFilter.GaussianBlur(14)); im = ImageEnhance.Brightness(bg).enhance(0.6)
        return over(im, 's6', env(lt, 0.0, 7.0, 0.35, 0.3))
    lt = t - 34.0; bg = at(12.0); z = 1 + 0.05 * lt / 5; cw, ch = W / z, H / z
    bg = bg.resize((W, H), Image.LANCZOS, box=((W - cw) / 2, (H - ch) / 2, (W + cw) / 2, (H + ch) / 2)).filter(ImageFilter.GaussianBlur(9))
    im = ImageEnhance.Brightness(bg).enhance(0.45)
    return over(im, 's7', env(lt, 0.1, 6.0, 0.3, 0.0))

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
    sound.CH = [(50, [62, 66, 69, 74]), (47, [62, 66, 71, 74]), (43, [62, 67, 71, 74]), (45, [64, 69, 73, 76])]  # D · Bm · G · A – fröhlich
    mu = music(L, t_pulse=0.6, t_drop=4.0, t_break=TEND - 4.5, t_logo=TEND, bar=2.0, t_cta=TEND + 1.0)
    fx = ambience(L, [(0, 15.0, 'interior'), (15.0, 27.0, 'morning')])
    add(fx, np.stack([beep(1320, 0.09), beep(1320, 0.09)], 1), 0.15, 0.6); add(fx, np.stack([beep(1760, 0.12), beep(1760, 0.12)], 1), 0.3, 0.6)  # Pling
    for k in range(12): add(fx, pop(), 4.2 + k * 1.3, 0.35)
    for t in CUTS + [27.0, 34.0]: add(fx, whoosh(0.6, 0.6), t - 0.3, 0.3)
    add(fx, engine(6.5), 20.3, 1.0)
    V = os.path.join(ROOT, 'audio', 'vo', 'raw_%s.wav')
    tail = [('09', TEND + 0.5, 1.0), ('10', TEND + 2.8, 1.1)] if brand == 's' else [('m09', TEND + 0.5, 1.0), ('m10', TEND + 2.8, 1.12)]
    vo = [('v01', 0.45, 1.0), ('v02', 1.9, 1.05), ('v03', 5.4, 1.0), ('v04', 15.5, 1.0), ('v05', 21.0, 1.0), ('v06', 27.3, 1.0), ('v07', 34.4, 1.0)] + tail
    return mix(L, mu, fx, [(V % n, t, sp) for n, t, sp in vo], os.path.join(OUTF, f'audio_{brand}.wav'))

def video(brand):
    name = {'s': 'Schmacher', 'r': 'Russinov'}[brand]
    endimg = os.path.join(TT, f'end_{brand}.png')
    last = os.path.join(OUTF, f'f{int(round(TEND * FPS)) - 1:05d}.jpg')
    out = os.path.join(EXP, f'{name}_PaketFuerDich_9x16_ohneStartbild.mp4')
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
    print('D5 DONE')
