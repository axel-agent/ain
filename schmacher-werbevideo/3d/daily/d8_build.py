# „Miniatur-Welt“ – Tilt-Shift – Komposition (3D + Uhr + Checkliste) und Endfertigung
# python3 d1_build.py [frames|audio|video|all]
import os, sys, subprocess, math
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance, ImageChops
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
FR3D = os.path.join(HERE, '..', 'out', 'd8'); TT = os.path.join(HERE, 'd8_titles')
OUTF = os.path.join(HERE, '..', 'out', 'd8_comp'); os.makedirs(OUTF, exist_ok=True)
EXP = os.path.join(ROOT, 'export', 'daily', '2026-11-26'); os.makedirs(EXP, exist_ok=True)
FPS, W, H = 24, 1080, 1920
TEND, L = 40.0, 47.2
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

from PIL import ImageDraw, ImageFont
FB = ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-Black.otf', 76)
FS = ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-Bold.otf', 26)
_mask = None
def tilt(im):
    """Tilt-Shift: scharfer Streifen in der Mitte, oben/unten weich + kräftige Farben (Miniatur-Look)."""
    global _mask
    if _mask is None:
        y = np.arange(H, dtype=np.float32); c, half, fall = H * 0.55, H * 0.12, H * 0.22
        m = np.clip((np.abs(y - c) - half) / fall, 0, 1) ** 1.3
        _mask = Image.fromarray((np.repeat(m[:, None], W, 1) * 255).astype('uint8'))
    bl = im.filter(ImageFilter.GaussianBlur(9)); out = Image.composite(bl, im, _mask)
    out = ImageEnhance.Color(out).enhance(1.35); return ImageEnhance.Contrast(out).enhance(1.12)

CUTS = [6.0, 12.0, 18.0, 23.0]
def frame(t):
    if t < 28.0:
        im = tilt(at(t))
        for c in CUTS:
            if c - 0.06 < t < c + 0.1: im = Image.blend(im, Image.new('RGB', im.size, 'white'), 0.45 * (1 - abs(t - c) / 0.1))
        for tid, a, b in [('m1', 0.2, 2.8), ('m2', 3.0, 5.9), ('m3', 6.5, 11.85), ('m4', 12.5, 17.85), ('m5', 18.5, 22.85)]:
            im = over(im, tid, env(t, a, b, 0.25, 0.25))
        return im
    if t < 34.5:
        lt = t - 28.0; bg = at(27.9).filter(ImageFilter.GaussianBlur(14)); im = ImageEnhance.Brightness(bg).enhance(0.65)
        return over(im, 'm6', env(lt, 0.0, 6.5, 0.35, 0.3))
    lt = t - 34.5; bg = tilt(at(15.0)); z = 1 + 0.05 * lt / 5; cw, ch = W / z, H / z
    bg = bg.resize((W, H), Image.LANCZOS, box=((W - cw) / 2, (H - ch) / 2, (W + cw) / 2, (H + ch) / 2)).filter(ImageFilter.GaussianBlur(9))
    im = ImageEnhance.Brightness(bg).enhance(0.45)
    return over(im, 'm7', env(lt, 0.1, 6.0, 0.3, 0.0))

def frames():
    from multiprocessing import Pool
    n = int(round(TEND * FPS))
    with Pool(int(os.environ.get('NP', '3'))) as pool: pool.map(_one, range(n), chunksize=8)
def _one(i):
    p = os.path.join(OUTF, f'f{i:05d}.jpg')
    if not os.path.exists(p) or os.environ.get('FORCE'): frame(i / FPS).save(p, quality=93)

def audio(brand):
    sys.path.insert(0, os.path.join(ROOT, 'audio')); import sound
    from sound import music, ambience, add, whoosh, impact, reverb, mix, pluck
    from mix_film2 import engine, pop
    sound.CH = [(55, [67, 71, 74, 79]), (52, [67, 71, 76, 79]), (48, [67, 72, 76, 79]), (50, [66, 69, 74, 78])]  # G · Em · C · D – verspielt
    mu = music(L, t_pulse=0.0, t_drop=6.0, t_break=TEND - 4.0, t_logo=TEND, bar=1.8, t_cta=TEND + 1.0)
    fx = ambience(L, [(0, 28.0, 'morning')])
    for k, m in enumerate([79, 83, 86, 91]): add(fx, np.stack([pluck(m, 0.6)] * 2, 1), 0.1 + k * 0.12, 0.4)  # Spieluhr
    add(fx, engine(5.0), 0.5, 0.6); add(fx, engine(4.5), 18.2, 0.6)
    for t in CUTS + [28.0, 34.5]: add(fx, whoosh(0.6, 0.6), t - 0.3, 0.3)
    for t in [6.5, 12.5, 18.5]: add(fx, pop(), t, 0.8)
    V = os.path.join(ROOT, 'audio', 'vo', 'raw_%s.wav')
    tail = [('09', TEND + 0.5, 1.0), ('10', TEND + 2.8, 1.1)] if brand == 's' else [('m09', TEND + 0.5, 1.0), ('m10', TEND + 2.8, 1.12)]
    vo = [('t01', 0.4, 1.0), ('t02', 2.6, 1.0), ('t03', 6.8, 1.0), ('t04', 12.6, 1.0), ('t05', 19.0, 1.0), ('t06', 28.3, 1.0), ('t07', 34.8, 1.0)] + tail
    return mix(L, mu, fx, [(V % n, t, sp) for n, t, sp in vo], os.path.join(OUTF, f'audio_{brand}.wav'))

def video(brand):
    name = {'s': 'Schmacher', 'r': 'Russinov'}[brand]
    endimg = os.path.join(TT, f'end_{brand}.png')
    last = os.path.join(OUTF, f'f{int(round(TEND * FPS)) - 1:05d}.jpg')
    out = os.path.join(EXP, f'{name}_Miniatur_9x16_ohneStartbild.mp4')
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
    print('D8 DONE')
