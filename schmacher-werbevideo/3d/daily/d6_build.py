# „Ein Tag. 30 Sekunden.“ – Zeitraffer – Komposition (3D + Uhr + Checkliste) und Endfertigung
# python3 d1_build.py [frames|audio|video|all]
import os, sys, subprocess, math
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance, ImageChops
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
FR3D = os.path.join(HERE, '..', 'out', 'd6'); TT = os.path.join(HERE, 'd6_titles')
OUTF = os.path.join(HERE, '..', 'out', 'd6_comp'); os.makedirs(OUTF, exist_ok=True)
EXP = os.path.join(ROOT, 'export', 'daily', '2026-11-24'); os.makedirs(EXP, exist_ok=True)
FPS, W, H = 24, 1080, 1920
TEND, L = 42.3, 49.5
P = lambda n: os.path.join(ROOT, n)


def f3d(i):
    p = os.path.join(FR3D, f'f{i:05d}.jpg')
    return Image.open(p).convert('RGB') if os.path.exists(p) else Image.new('RGB', (W, H), (40, 40, 40))
def at(t): return f3d(min(719, int(round(t * FPS))))

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
PH = [(0, 7.6, 'MORGEN', 0), (7.6, 10.8, 'MITTAG', 0), (10.8, 13.2, 'ABEND', 0), (13.2, 26.0, 'NACHT', None), (26.0, 30.0, 'MORGEN', 0.05)]
def draw_clock(im, t, a=1.0):
    lab, pos = 'MORGEN', 0.05
    for t0, t1, l, p in PH:
        if t0 <= t < t1: lab = l; pos = (0.05 + 0.9 * min(1, t / 12.6)) if (p is not None and t < 13.2) else p
    ov = Image.new('RGBA', im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    x1, y0, w = W - 60, 130, 360; d.rounded_rectangle((x1 - w, y0, x1, y0 + 170), 34, fill=(15, 24, 42, int(225 * a)))
    cx, cy, r = x1 - w / 2, y0 + 130, 120
    d.arc((cx - r, cy - r * 0.8, cx + r, cy + r * 0.8), 180, 360, fill=(255, 255, 255, 120), width=4)
    if pos is not None:
        import math; ang = math.pi * (1 - pos); sx, sy = cx + r * math.cos(ang), cy - r * 0.8 * math.sin(ang)
        d.ellipse((sx - 18, sy - 18, sx + 18, sy + 18), fill=(242, 179, 27, 255))
    else:
        d.ellipse((cx - 16, y0 + 40, cx + 16, y0 + 72), fill=(230, 236, 245, 255)); d.ellipse((cx - 6, y0 + 36, cx + 22, y0 + 64), fill=(15, 24, 42, 255))
    tw = d.textlength(lab, font=FS); d.text((cx - tw / 2, cy + 4), lab, font=FS, fill=(255, 255, 255, int(255 * a)))
    b = im.convert('RGBA'); b.alpha_composite(ov); return b.convert('RGB')

CUTS = [14.0, 20.0, 26.0]
def frame(t):
    if t < 30.0:
        im = at(t)
        for c in CUTS:
            if c - 0.06 < t < c + 0.1: im = Image.blend(im, Image.new('RGB', im.size, 'white'), 0.4 * (1 - abs(t - c) / 0.1))
        for tid, a, b in [('z1', 0.2, 4.1), ('z2', 4.3, 7.5), ('z3', 7.7, 11.0), ('z4', 11.2, 19.85), ('z5', 20.4, 25.85), ('z6', 26.4, 30.0)]:
            im = over(im, tid, env(t, a, b, 0.3, 0.25))
        return draw_clock(im, t) if t < 26.0 else im
    if t < 37.8:
        lt = t - 30.0; bg = at(13.9).filter(ImageFilter.GaussianBlur(14)); im = ImageEnhance.Brightness(bg).enhance(0.7)
        return over(im, 'z7', env(lt, 0.0, 7.8, 0.35, 0.3))
    lt = t - 37.8; bg = at(29.9); z = 1 + 0.05 * lt / 5; cw, ch = W / z, H / z
    bg = bg.resize((W, H), Image.LANCZOS, box=((W - cw) / 2, (H - ch) / 2, (W + cw) / 2, (H + ch) / 2)).filter(ImageFilter.GaussianBlur(9))
    im = ImageEnhance.Brightness(bg).enhance(0.45)
    return over(im, 'z8', env(lt, 0.1, 6.0, 0.3, 0.0))

def frames():
    from multiprocessing import Pool
    n = int(round(TEND * FPS))
    with Pool(int(os.environ.get('NP', '3'))) as pool: pool.map(_one, range(n), chunksize=8)
def _one(i):
    p = os.path.join(OUTF, f'f{i:05d}.jpg')
    if not os.path.exists(p) or os.environ.get('FORCE'): frame(i / FPS).save(p, quality=93)

def audio(brand):
    sys.path.insert(0, os.path.join(ROOT, 'audio')); import sound
    from sound import music, ambience, add, whoosh, impact, reverb, mix, shimmer
    sound.CH = [(53, [65, 69, 72, 76]), (50, [65, 69, 74, 77]), (46, [65, 70, 74, 77]), (48, [64, 67, 72, 76])]  # F · Dm · Bb · C – ruhig, filmisch
    mu = music(L, t_pulse=0.0, t_drop=4.2, t_break=TEND - 6.0, t_logo=TEND, bar=2.6, t_cta=TEND + 1.0)
    fx = ambience(L, [(0, 12.0, 'morning'), (12.0, 20.0, 'night'), (20.0, 26.0, 'interior'), (26.0, 30.0, 'morning')])
    add(fx, np.stack([shimmer(4), shimmer(4)], 1), 12.3, 0.4)
    for t in CUTS + [30.0, 37.8]: add(fx, whoosh(0.6, 0.6), t - 0.3, 0.3)
    V = os.path.join(ROOT, 'audio', 'vo', 'raw_%s.wav')
    tail = [('09', TEND + 0.5, 1.0), ('10', TEND + 2.8, 1.1)] if brand == 's' else [('m09', TEND + 0.5, 1.0), ('m10', TEND + 2.8, 1.12)]
    vo = [('z01', 0.3, 1.08), ('z02', 4.3, 1.0), ('z03', 7.65, 1.0), ('z04', 11.4, 1.0), ('z05', 20.5, 1.0), ('z06', 26.6, 1.0), ('z07', 30.3, 1.1), ('z08', 38.1, 1.0)] + tail
    return mix(L, mu, fx, [(V % n, t, sp) for n, t, sp in vo], os.path.join(OUTF, f'audio_{brand}.wav'))

def video(brand):
    name = {'s': 'Schmacher', 'r': 'Russinov'}[brand]
    endimg = os.path.join(TT, f'end_{brand}.png')
    last = os.path.join(OUTF, f'f{int(round(TEND * FPS)) - 1:05d}.jpg')
    out = os.path.join(EXP, f'{name}_EinTag_9x16_ohneStartbild.mp4')
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
    print('D6 DONE')
