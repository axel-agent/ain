# Schnitt & Endfertigung aller Formate: python3 edit.py [16x9|9x16|teaser|all]
import sys, os, subprocess
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'audio'))
os.chdir(os.path.dirname(os.path.abspath(__file__)))
from sound import *
FPS = 24
FV, TV, OUT = '3d/framesV', '3d/titlesV', 'export'
os.makedirs(OUT, exist_ok=True)
V = 'audio/vo/raw_%s.wav'

def run(cmd): print(' '.join(cmd[:6]), '…'); subprocess.run(cmd, check=True)

def compose(vin, tdir, allt, L, wav, vid, crf, pre=''):
    """Legt transparente Titel-PNGs (tdir/<id>.png) zeitgesteuert über das Video; 'cover' steht ab Bild 1 ohne Einblendung."""
    inputs = list(vin); fl = []; last_lbl = '0:v'
    if pre: fl.append(f'[0:v]{pre}[v0]'); last_lbl = 'v0'
    for k, (tid, a, b) in enumerate(allt, 1):
        inputs += ['-loop', '1', '-t', f'{L:.3f}', '-i', f'{tdir}/{tid}.png']
        fi = 0.6 if tid in ('end', 'endcta') else 0.45
        f = f'[{k}:v]format=rgba'
        if a > 0.01: f += f',fade=t=in:st={a:.3f}:d={fi}:alpha=1'
        if tid not in ('end', 'endcta'): f += f',fade=t=out:st={b - 0.4:.3f}:d=0.4:alpha=1'
        fl.append(f + f'[t{k}]')
        fl.append(f'[{last_lbl}][t{k}]overlay=0:0:enable=\'between(t,{a:.3f},{b:.3f})\'[v{k}]'); last_lbl = f'v{k}'
    fl.append(f'[{last_lbl}]fade=t=out:st={L - 0.35:.3f}:d=0.35,format=yuv420p[vout]')
    run(['ffmpeg', '-y', '-v', 'error'] + inputs + ['-i', wav, '-filter_complex', ';'.join(fl), '-map', '[vout]', '-map', f'{len(allt) + 1}:a',
         '-r', str(FPS), '-c:v', 'libx264', '-preset', 'slow', '-crf', str(crf), '-profile:v', 'high', '-c:a', 'aac', '-b:a', '192k', '-t', f'{L:.3f}', '-movflags', '+faststart', vid])

def build_vertical(name, segs, end_len, titles, vo, mus_kw, sfx_fn):
    # Bildliste: Segmente (Master-Zeit) hintereinander, danach Endcard über letztem Bild
    frames = []; cuts = []; t = 0
    for a, b in segs:
        cuts.append(t)
        for f in range(round(a * FPS), round(b * FPS)):
            p = f'{FV}/f{f:05d}.jpg'
            if not os.path.exists(p): raise SystemExit('fehlt: ' + p)
            frames.append(p)
        t = len(frames) / FPS
    t_end = t; last = frames[-1]
    frames += [last] * round(end_len * FPS); L = len(frames) / FPS
    with open(f'{OUT}/{name}.ffconcat', 'w') as fh:
        fh.write('ffconcat version 1.0\n')
        for p in frames: fh.write(f"file '../{p}'\nduration {1 / FPS:.6f}\n")
        fh.write(f"file '../{last}'\n")
    # Ton
    mu = music(L, **mus_kw(t_end)); fx = sfx_fn(L, cuts, t_end)
    vo_items = [(V % n, at, spd) for n, at, spd in vo(cuts, t_end)]
    wav = mix(L, mu, fx, vo_items, f'{OUT}/{name}.wav')
    # Titel + Endcard (Kontaktblock „Jetzt anrufen“ erscheint 1,8 s nach der Endcard)
    allt = titles(cuts, t_end) + [('end', t_end, L + 1), ('endcta', t_end + 1.8, L + 1)]
    vid = f'{OUT}/{name}.mp4'
    compose(['-f', 'concat', '-safe', '0', '-i', f'{OUT}/{name}.ffconcat'], TV, allt, L, wav, vid, 18)
    return vid, L

# ---------------------------------------------------------------- 9:16 (≈32 s) + 4:5
def v916():
    segs = [(0.0, 5.2), (6.9, 9.7), (11.0, 14.0), (14.2, 19.7), (20.8, 24.8), (26.2, 30.4), (32.6, 35.6)]
    def titles(c, te): return [('cover', 0.0, 2.5), ('hook', 2.6, c[1] - 0.1), ('slogan', c[1] + 0.2, c[2]), ('code', c[2] + 0.4, c[3] - 0.1),
                               ('lager', c[3] + 1.6, c[4] - 0.1), ('hoehe', c[4] + 0.3, c[5] - 0.1), ('buero', c[5] + 0.4, c[6] - 0.1), ('hallen', c[6] + 0.3, te)]
    def vo(c, te): return [('01', 2.5, 1.05), ('02', c[1] - 0.2, 1.05), ('03', c[2] + 1.9, 1.08), ('04', c[3] + 1.1, 1),
                           ('05k', c[4] + 0.2, 1), ('06', c[5] + 0.1, 1.1), ('07', c[6] + 0.5, 1.1), ('08', te + 0.6, 1.05), ('09', te + 3.5, 1.0), ('10', te + 5.9, 1.1)]
    def mk(te): return dict(t_pulse=3.5, t_drop=11.0, t_break=te - 3.0, t_logo=te, t_cta=te + 1.8)
    def sfx(L, c, te):
        fx = ambience(L, [(0, c[3] + 5.5, 'morning'), (c[4], c[6], 'interior'), (c[6], te + 0.6, 'night')])
        add(fx, whoosh(1.4, 0.5, 200, 2500), 2.2, 0.4)
        for t in c[1:] + [te]: add(fx, whoosh(0.7, 0.65), t - 0.45, 0.3)
        gate(fx, c[3] + 0.2, c[3] + 4.4); return fx
    vid, L = build_vertical('Schmacher_Gewerbepark_9x16', segs, 10.6, titles, vo, mk, sfx)
    run(['ffmpeg', '-y', '-v', 'error', '-i', vid, '-vf', 'crop=1080:1350:0:285', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-c:a', 'copy', '-movflags', '+faststart', f'{OUT}/Schmacher_Gewerbepark_4x5.mp4'])

def teaser():
    segs = [(0.0, 2.4), (14.6, 18.6), (20.8, 22.4), (26.2, 28.0)]
    def titles(c, te): return [('cover', 0.0, c[1] - 0.05), ('lager', c[1] + 1.2, c[2] - 0.05), ('buero', c[3] + 0.1, te)]
    def vo(c, te): return [('01', c[0] + 0.2, 1.08), ('04', c[1] + 0.4, 1.05), ('08', te + 0.3, 1.05), ('09', te + 3.0, 1.05)]
    def mk(te): return dict(t_pulse=0.0, t_drop=c_drop[0], t_break=te, t_logo=te, t_cta=te + 1.8)
    c_drop = [2.4]
    def sfx(L, c, te):
        fx = ambience(L, [(0, c[2], 'morning'), (c[2], te + 0.5, 'interior')])
        for t in c[1:] + [te]: add(fx, whoosh(0.7, 0.65), t - 0.45, 0.3)
        gate(fx, c[1] + 0.2, c[1] + 4.4); return fx
    build_vertical('Schmacher_Gewerbepark_9x16_Teaser15s', segs, 5.5, titles, vo, mk, sfx)

# ---------------------------------------------------------------- 16:9 Master (≈50 s)
L16 = 50.5   # Bilder bis 40,5 s, danach steht die Endcard
def master():
    subprocess.run([sys.executable, 'mix_16x9.py'], cwd='audio', check=True)
    T = [('cover', 0.0, 2.8), ('hook', 3.0, 5.4), ('slogan', 6.0, 10.6), ('code', 11.2, 13.9), ('units', 32.4, 35.8), ('tech', 36.0, 38.9),
         ('end', 39.3, L16 + 1), ('endcta', 41.1, L16 + 1)]
    compose(['-framerate', '24', '-i', '3d/frames/f%05d.jpg'], '3d/titles16', T, L16, 'audio/out_16x9.wav', f'{OUT}/Schmacher_Gewerbepark_16x9.mp4', 17,
            pre=f'trim=end={40.5}:start=0,setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration={L16 - 40.5 + 0.5:.2f}')

def thumbs():
    """Vorschaubilder für Facebook/Instagram (erstes Bild jedes Videos)."""
    for n in ['16x9', '9x16', '4x5', '9x16_Teaser15s']:
        run(['ffmpeg', '-y', '-v', 'error', '-i', f'{OUT}/Schmacher_Gewerbepark_{n}.mp4', '-frames:v', '1', '-q:v', '2', f'{OUT}/Vorschaubild_{n}.jpg'])

if __name__ == '__main__':
    w = sys.argv[1] if len(sys.argv) > 1 else 'all'
    if w in ('16x9', 'all'): master()
    if w in ('9x16', 'all'): v916()
    if w in ('teaser', 'all'): teaser()
    if w in ('thumbs', 'all'): thumbs()
