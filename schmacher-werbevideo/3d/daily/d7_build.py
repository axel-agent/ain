# „Quiz: Was passt in eine Halle?“ – Komposition (3D + Uhr + Checkliste) und Endfertigung
# python3 d1_build.py [frames|audio|video|all]
import os, sys, subprocess, math
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance, ImageChops
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
FR3D = os.path.join(HERE, '..', 'out', 'd7'); TT = os.path.join(HERE, 'd7_titles')
OUTF = os.path.join(HERE, '..', 'out', 'd7_comp'); os.makedirs(OUTF, exist_ok=True)
EXP = os.path.join(ROOT, 'export', 'daily', '2026-11-25'); os.makedirs(EXP, exist_ok=True)
FPS, W, H = 24, 1080, 1920
TEND, L = 38.5, 45.7
P = lambda n: os.path.join(ROOT, n)


def f3d(i):
    p = os.path.join(FR3D, f'f{i:05d}.jpg')
    return Image.open(p).convert('RGB') if os.path.exists(p) else Image.new('RGB', (W, H), (40, 40, 40))
def at(t): return f3d(min(623, int(round(t * FPS))))

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
CUTS = [4.0, 9.0, 14.0, 19.0]
def frame(t):
    if t < 26.0:
        im = at(t)
        for c in CUTS:
            if c - 0.06 < t < c + 0.1: im = Image.blend(im, Image.new('RGB', im.size, 'white'), 0.5 * (1 - abs(t - c) / 0.1))
        for tid, a, b in [('qa', 0.15, 6.0), ('q0', 6.0, 9.0), ('q1', 9.4, 14.0), ('q2', 14.4, 19.0), ('qd', 20.0, 26.0)]:
            im = over(im, tid, env(t, a, b, 0.2 if tid != 'q0' else 0.0, 0.2))
        return im
    if t < 33.0:
        lt = t - 26.0; bg = at(25.9).filter(ImageFilter.GaussianBlur(14)); im = ImageEnhance.Brightness(bg).enhance(0.6)
        return over(im, 'qf', env(lt, 0.0, 7.0, 0.35, 0.3))
    lt = t - 33.0; bg = at(22.0); z = 1 + 0.05 * lt / 5; cw, ch = W / z, H / z
    bg = bg.resize((W, H), Image.LANCZOS, box=((W - cw) / 2, (H - ch) / 2, (W + cw) / 2, (H + ch) / 2)).filter(ImageFilter.GaussianBlur(9))
    im = ImageEnhance.Brightness(bg).enhance(0.45)
    return over(im, 'qz', env(lt, 0.1, 6.0, 0.3, 0.0))

def frames():
    from multiprocessing import Pool
    n = int(round(TEND * FPS))
    with Pool(int(os.environ.get('NP', '3'))) as pool: pool.map(_one, range(n), chunksize=8)
def _one(i):
    p = os.path.join(OUTF, f'f{i:05d}.jpg')
    if not os.path.exists(p) or os.environ.get('FORCE'): frame(i / FPS).save(p, quality=93)

def audio(brand):
    sys.path.insert(0, os.path.join(ROOT, 'audio')); import sound
    from sound import music, ambience, add, whoosh, impact, reverb, mix, beep, gate
    from mix_film2 import pop, chime
    sound.CH = [(45, [64, 69, 72, 76]), (41, [65, 69, 72, 77]), (48, [64, 67, 72, 76]), (43, [62, 67, 71, 74])]  # Am · F · C · G – Spannung
    mu = music(L, t_pulse=0.0, t_drop=19.0, t_break=TEND - 4.0, t_logo=TEND, bar=2.4, t_cta=TEND + 1.0)
    fx = ambience(L, [(0, 9.0, 'morning'), (9.0, 19.0, 'interior'), (19.0, 26.0, 'morning')])
    for k in range(10): add(fx, np.stack([beep(900, 0.04)] * 2, 1), 0.6 + k * 0.5, 0.35)  # Quiz-Ticken
    gate(fx, 4.4, 7.4)
    for t in [6.0, 9.4, 14.4]: add(fx, chime(), t, 0.7)
    add(fx, reverb(np.stack([impact(1.0)] * 2, 1), 2.5, wet=0.35), 20.0, 0.8); add(fx, chime(), 20.0, 1.0)
    for t in CUTS + [26.0, 33.0]: add(fx, whoosh(0.6, 0.6), t - 0.3, 0.3)
    V = os.path.join(ROOT, 'audio', 'vo', 'raw_%s.wav')
    tail = [('09', TEND + 0.5, 1.0), ('10', TEND + 2.8, 1.1)] if brand == 's' else [('m09', TEND + 0.5, 1.0), ('m10', TEND + 2.8, 1.12)]
    vo = [('q01', 0.3, 1.0), ('q02', 5.4, 1.0), ('q03', 9.6, 1.0), ('q04', 14.6, 1.0), ('q05', 20.2, 1.0), ('q06', 26.4, 1.0), ('q07', 33.4, 1.0)] + tail
    return mix(L, mu, fx, [(V % n, t, sp) for n, t, sp in vo], os.path.join(OUTF, f'audio_{brand}.wav'))

def video(brand):
    name = {'s': 'Schmacher', 'r': 'Russinov'}[brand]
    endimg = os.path.join(TT, f'end_{brand}.png')
    last = os.path.join(OUTF, f'f{int(round(TEND * FPS)) - 1:05d}.jpg')
    out = os.path.join(EXP, f'{name}_Quiz_9x16_ohneStartbild.mp4')
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
    print('D7 DONE')
