# „POV: Dein erster Tag“ – Komposition (3D-Ich-Perspektive + Handkamera + HUD) und Endfertigung
# python3 d1_build.py [frames|audio|video|all]
import os, sys, subprocess, math
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance, ImageChops
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
FR3D = os.path.join(HERE, '..', 'out', 'd9'); TT = os.path.join(HERE, 'd9_titles')
OUTF = os.path.join(HERE, '..', 'out', 'd9_comp'); os.makedirs(OUTF, exist_ok=True)
EXP = os.path.join(ROOT, 'export', 'daily', '2026-11-27'); os.makedirs(EXP, exist_ok=True)
FPS, W, H = 24, 1080, 1920
TEND, L = 40.5, 47.7
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
FB = ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-Bold.otf', 34)
_vig = None
def vignette(im):
    global _vig
    if _vig is None:
        y, x = np.mgrid[0:H, 0:W].astype(np.float32); r = np.sqrt(((x - W / 2) / (W * 0.62)) ** 2 + ((y - H / 2) / (H * 0.62)) ** 2)
        _vig = np.clip(1 - 0.38 * np.clip(r - 0.55, 0, 1) ** 1.4, 0, 1)[..., None]
    return Image.fromarray((np.asarray(im).astype(np.float32) * _vig).astype('uint8'))
def shake(im, t, amp):
    """Handkamera: leicht vergrößert, ruhiges Wackeln + Gehschritt-Wippen."""
    z = 1.045; dx = amp * (9 * math.sin(t * 1.7) + 5 * math.sin(t * 3.1 + 1)); dy = amp * (7 * math.sin(t * 2.3 + 2) + 6 * abs(math.sin(t * 4.2)))
    cw, ch = W / z, H / z; x0 = (W - cw) / 2 + dx; y0 = (H - ch) / 2 + dy
    return im.resize((W, H), Image.LANCZOS, box=(x0, y0, x0 + cw, y0 + ch))
def hud(im, t):
    d = ImageDraw.Draw(im)
    if int(t * 2) % 2 == 0: d.ellipse((70, 92, 100, 122), fill=(226, 72, 59))
    d.text((114, 86), 'REC · POV', font=FB, fill=(255, 255, 255))
    s = int(t); d.text((W - 260, 86), f'07:{s // 60:02d}:{s % 60:02d}'.replace('07:00:', '07:00:'), font=FB, fill=(255, 255, 255))
    for (x, y, sx, sy) in [(50, 60, 1, 1), (W - 50, 60, -1, 1), (50, H - 60, 1, -1), (W - 50, H - 60, -1, -1)]:
        d.line((x, y, x + 70 * sx, y), fill=(255, 255, 255), width=5); d.line((x, y, x, y + 70 * sy), fill=(255, 255, 255), width=5)
    return im

CUTS = [7.0, 12.0, 17.0]
def frame(t):
    if t < 22.0:
        amp = 0.6 if t < 7 else 1.0
        im = vignette(shake(at(t), t, amp))
        for c in CUTS:
            if c - 0.12 < t < c + 0.12: im = ImageEnhance.Brightness(im).enhance(abs(t - c) / 0.12)  # Blinzeln
        for tid, a, b in [('p1', 0.15, 3.5), ('p2', 3.7, 6.85), ('p3', 7.4, 11.85), ('p4', 12.4, 16.85), ('p5', 17.4, 21.85)]:
            im = over(im, tid, env(t, a, b, 0.25, 0.2))
        return hud(im, t)
    if t < 28.0:
        im = at(t)
        if t < 22.12: im = Image.blend(im, Image.new('RGB', im.size, 'white'), 0.6 * (1 - (t - 22) / 0.12))
        return over(im, 'p6', env(t, 22.4, 27.9, 0.3, 0.25))
    if t < 35.0:
        lt = t - 28.0; bg = at(27.9).filter(ImageFilter.GaussianBlur(14)); im = ImageEnhance.Brightness(bg).enhance(0.65)
        return over(im, 'p7', env(lt, 0.0, 7.0, 0.35, 0.3))
    lt = t - 35.0; bg = at(21.8); z = 1 + 0.05 * lt / 5; cw, ch = W / z, H / z
    bg = bg.resize((W, H), Image.LANCZOS, box=((W - cw) / 2, (H - ch) / 2, (W + cw) / 2, (H + ch) / 2)).filter(ImageFilter.GaussianBlur(10))
    im = ImageEnhance.Brightness(bg).enhance(0.45)
    return over(im, 'p8', env(lt, 0.1, 6.0, 0.3, 0.0))

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
    sound.CH = [(45, [64, 69, 72, 76]), (41, [65, 69, 72, 77]), (48, [64, 67, 72, 76]), (43, [62, 67, 71, 74])]  # Am · F · C · G – Aufbruch, treibend
    mu = music(L, t_pulse=0.0, t_drop=7.0, t_break=TEND - 4.5, t_logo=TEND, bar=2.0, t_cta=TEND + 1.0)
    fx = ambience(L, [(0, 7.0, 'morning'), (7.0, 22.0, 'interior'), (22.0, 28.0, 'morning')])
    add(fx, engine(7.2), 0.0, 0.9)
    for t in CUTS: add(fx, whoosh(0.4, 0.3), t - 0.15, 0.25)
    add(fx, whoosh(0.7, 0.6), 21.7, 0.45); add(fx, whoosh(0.6, 0.6), 27.7, 0.3); add(fx, whoosh(0.6, 0.6), 34.7, 0.3)
    for t in [3.7, 7.4, 12.4, 17.4]: add(fx, pop(), t, 0.7)
    V = os.path.join(ROOT, 'audio', 'vo', 'raw_%s.wav')
    tail = [('09', TEND + 0.5, 1.0), ('10', TEND + 2.8, 1.1)] if brand == 's' else [('m09', TEND + 0.5, 1.0), ('m10', TEND + 2.8, 1.12)]
    vo = [('u01', 0.2, 1.0), ('u02', 3.65, 1.0), ('u03', 7.4, 1.0), ('u04', 12.4, 1.0), ('u05', 17.3, 1.0), ('u06', 22.3, 1.0), ('u07', 28.9, 1.0), ('u08', 35.4, 1.0)] + tail
    return mix(L, mu, fx, [(V % n, t, sp) for n, t, sp in vo], os.path.join(OUTF, f'audio_{brand}.wav'))

def video(brand):
    name = {'s': 'Schmacher', 'r': 'Russinov'}[brand]
    endimg = os.path.join(TT, f'end_{brand}.png')
    last = os.path.join(OUTF, f'f{int(round(TEND * FPS)) - 1:05d}.jpg')
    out = os.path.join(EXP, f'{name}_POV_9x16_ohneStartbild.mp4')
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
    print('D9 DONE')
