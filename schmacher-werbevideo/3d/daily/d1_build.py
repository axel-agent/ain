# Folge 1 „Echt jetzt.“ – Bildkomposition (3D-Clips + echte Fotos + Titel) und Endfertigung
# python3 d1_build.py [frames|audio|video|all]
import os, sys, subprocess, math
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance, ImageChops
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
FR3D = os.path.join(HERE, '..', 'out', 'd1'); TT = os.path.join(HERE, 'd1_titles')
OUTF = os.path.join(HERE, '..', 'out', 'd1_comp'); os.makedirs(OUTF, exist_ok=True)
EXP = os.path.join(ROOT, 'export', 'daily', '2026-11-19'); os.makedirs(EXP, exist_ok=True)
FPS, W, H = 24, 1080, 1920
TEND, L = 42.8, 49.5
P = lambda n: os.path.join(ROOT, n)

def grade(im, c=1.08, s=1.12, b=1.02):
    im = ImageEnhance.Contrast(im).enhance(c); im = ImageEnhance.Color(im).enhance(s); return ImageEnhance.Brightness(im).enhance(b)
PH = {k: grade(Image.open(P(v)).convert('RGB')) for k, v in {
    'front': 'retusche/out/d1_foto01.jpg', 'front2': 'retusche/out/test02.jpg', 'tor': 'retusche/out/test04.jpg',
    'hall': 'retusche/out/test09.jpg', 'wood': 'referenz-fotos/stand-2026-11/foto_07.jpg', 'door': 'referenz-fotos/stand-2026-11/foto_06.jpg'}.items()}

def fill(im, k, z0=1.0, z1=1.08, fx0=0.5, fx1=0.5, fy0=0.5, fy1=0.5):
    """Ken-Burns: Bild deckend auf 1080x1920, Zoom z und Fokus (fx, fy) über k∈[0,1]."""
    e = k * k * (3 - 2 * k); z = z0 + (z1 - z0) * e; fx = fx0 + (fx1 - fx0) * e; fy = fy0 + (fy1 - fy0) * e
    sc = max(W / im.width, H / im.height) * z; cw, ch = W / sc, H / sc
    x0 = min(max(fx * im.width - cw / 2, 0), im.width - cw); y0 = min(max(fy * im.height - ch / 2, 0), im.height - ch)
    out = im.resize((W, H), Image.LANCZOS, box=(x0, y0, x0 + cw, y0 + ch))
    return out.filter(ImageFilter.UnsharpMask(1.6, 60, 2))

def f3d(i):
    p = os.path.join(FR3D, f'f{i:05d}.jpg')
    return Image.open(p).convert('RGB') if os.path.exists(p) else Image.new('RGB', (W, H), (40, 40, 40))
def clip(c0, lt):  # 3D-Clip ab Clip-Zeit c0 (s), lokale Zeit lt
    return f3d(min(599, int(round((c0 + lt) * FPS))))

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

def flash(im, k):  # weißer Blitz + RGB-Versatz (Glitch)
    a = np.asarray(im).astype(np.float32); sh = int(30 * k)
    if sh: a[..., 0] = np.roll(a[..., 0], sh, 1); a[..., 2] = np.roll(a[..., 2], -sh, 1)
    a = a + (255 - a) * k * 0.85; return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))

def slider(t, lt):
    a3 = clip(8.0, lt); ar = fill(PH['tor'], lt / 6, 1.0, 1.06, 0.62, 0.55, 0.55, 0.55)
    x = int(W / 2 + 330 * math.sin(lt * 1.25 - 0.5))
    out = ar.copy(); out.paste(a3.crop((0, 0, x, H)), (0, 0))
    a = np.asarray(out).copy(); a[:, max(0, x - 3):x + 3] = 255
    out = Image.fromarray(a)
    from PIL import ImageDraw
    d = ImageDraw.Draw(out); cy = int(H * 0.55); d.ellipse((x - 46, cy - 46, x + 46, cy + 46), fill=(255, 255, 255)); d.polygon([(x - 12, cy), (x - 30, cy - 16), (x - 30, cy + 16)], fill=(15, 24, 42)); d.polygon([(x + 12, cy), (x + 30, cy - 16), (x + 30, cy + 16)], fill=(15, 24, 42))
    return out

def frame(t):
    # Szenen (Start, Ende)
    if t < 3.0:
        im = fill(PH['front'], t / 3.0, 1.18, 1.0, 0.42, 0.40, 0.5, 0.5); im = over(im, 'h1', env(t, 0.0, 3.0, 0.0, 0.2))
        if t > 2.85: im = flash(im, (t - 2.85) / 0.15)
    elif t < 5.5:
        lt = t - 3.0; im = clip(21.5, lt); im = over(im, 'h2', env(lt, 0.05, 2.5, 0.15, 0.25))
        if lt < 0.2: im = flash(im, 1 - lt / 0.2)
    elif t < 12.5:
        lt = t - 5.5; im = clip(1.0, lt); im = over(im, 'h3', env(lt, 0.6, 7.0, 0.4, 0.3))
    elif t < 18.5:
        lt = t - 12.5; im = slider(t, lt); im = over(im, 'h4', env(lt, 0.3, 6.0, 0.35, 0.25))
    elif t < 22.0:
        lt = t - 18.5; im = fill(PH['hall'], lt / 3.5, 1.06, 1.0, 0.5, 0.5, 0.30, 0.62); im = over(im, 'h5', env(lt, 0.2, 3.5, 0.3, 0.2))
    elif t < 28.5:
        lt = t - 22.0; im = clip(14.5, lt)
        if lt < 0.5:  # Überblendung echtes Foto -> 3D
            ph = fill(PH['hall'], 1.0, 1.0, 1.0, 0.5, 0.5, 0.62, 0.62); im = Image.blend(ph, im, lt / 0.5)
        im = over(im, 'h6', env(lt, 0.6, 6.5, 0.4, 0.3))
    elif t < 32.5:
        lt = t - 28.5; seg = min(2, int(lt / 1.3333)); k = (lt - seg * 1.3333) / 1.3333
        im = [fill(PH['wood'], k, 1.25, 1.05, 0.5, 0.5, 0.45, 0.55), fill(PH['door'], k, 1.2, 1.04, 0.55, 0.5, 0.5, 0.5), fill(PH['front2'], k, 1.15, 1.0, 0.70, 0.62, 0.55, 0.55)][seg]
        if k < 0.12: im = flash(im, (0.12 - k) / 0.12 * 0.6)
        im = over(im, ['h7a', 'h7b', 'h7c'][seg], 1.0)
    elif t < 38.3:
        lt = t - 32.5; bg = fill(PH['front2'], lt / 5.8, 1.1, 1.18, 0.6, 0.6, 0.55, 0.55).filter(ImageFilter.GaussianBlur(14))
        im = ImageEnhance.Brightness(bg).enhance(0.6); im = over(im, 'h8', env(lt, 0.0, 5.8, 0.35, 0.3))
    else:
        lt = t - 38.3; bg = clip(7.9, 0).filter(ImageFilter.GaussianBlur(10)); im = ImageEnhance.Brightness(bg).enhance(0.35 + 0.1 * math.sin(lt * 6))
        im = over(im, 'h9', env(lt, 0.15, 4.5, 0.3, 0.0))
    return im

def frames():
    from multiprocessing import Pool
    n = int(round(TEND * FPS))
    with Pool(int(os.environ.get('NP', '3'))) as pool: pool.map(_one, range(n), chunksize=8)
def _one(i):
    p = os.path.join(OUTF, f'f{i:05d}.jpg')
    if not os.path.exists(p) or os.environ.get('FORCE'): frame(i / FPS).save(p, quality=93)

def audio(brand):
    sys.path.insert(0, os.path.join(ROOT, 'audio')); import sound
    from sound import music, ambience, add, whoosh, impact, reverb, riser, mix, SR, T
    sound.CH = [(50, [62, 65, 69, 72]), (46, [62, 65, 70, 74]), (53, [60, 65, 69, 72]), (48, [60, 64, 67, 72])]  # Dm9 · Bbmaj7 · F · C – neue Stimmung für Folge 1
    mu = music(L, t_pulse=3.0, t_drop=5.5, t_break=TEND - 4.5, t_logo=TEND, bar=2.2, t_cta=TEND + 1.2)
    fx = ambience(L, [(0, 3.0, 'morning'), (5.5, 12.5, 'morning'), (18.5, 28.5, 'interior')])
    add(fx, reverb(np.stack([impact(1.0)] * 2, 1), 2.5, wet=0.3), 0.0, 0.9)
    for t in [2.95, 12.45, 18.45, 21.95, 28.45, 29.8, 31.15, 32.45, 38.25]: add(fx, whoosh(0.7, 0.6), t - 0.35, 0.35)
    add(fx, reverb(np.stack([impact(0.6)] * 2, 1), 2, wet=0.3), 3.0, 0.6)
    V = os.path.join(ROOT, 'audio', 'vo', 'raw_%s.wav')
    tail = [('09', TEND + 0.6, 1.0), ('10', TEND + 2.9, 1.08)] if brand == 's' else [('m09', TEND + 0.6, 1.0), ('m10', TEND + 2.9, 1.1)]
    vo = [('d1_01', 0.35, 1.0), ('d1_02', 3.2, 1.0), ('d1_03', 6.1, 1.0), ('d1_04', 13.3, 1.0), ('d1_05', 18.8, 1.0), ('d1_06', 22.7, 1.0),
          ('d1_07', 32.7, 1.05), ('d1_08b', 38.6, 1.0)] + tail
    return mix(L, mu, fx, [(V % n, t, s) for n, t, s in vo], os.path.join(OUTF, f'audio_{brand}.wav'))

def video(brand):
    name = {'s': 'Schmacher', 'r': 'Russinov'}[brand]
    endimg = os.path.join(TT, f'end_{brand}.png')
    last = os.path.join(OUTF, f'f{int(round(TEND * FPS)) - 1:05d}.jpg')
    out = os.path.join(EXP, f'{name}_EchtJetzt_9x16.mp4')
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
    print('D1 DONE')
