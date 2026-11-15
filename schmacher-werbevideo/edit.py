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
    # Titel + Endcard
    inputs = ['-f', 'concat', '-safe', '0', '-i', f'{OUT}/{name}.ffconcat']
    fl = []; last_lbl = '0:v'
    allt = titles(cuts, t_end) + [('end', t_end, L + 1)]
    for k, (tid, a, b) in enumerate(allt, 1):
        inputs += ['-loop', '1', '-t', f'{L:.3f}', '-i', f'{TV}/{tid}.png']
        fi = 0.6 if tid == 'end' else 0.45
        fl.append(f'[{k}:v]format=rgba,fade=t=in:st={a:.3f}:d={fi}:alpha=1' + (f',fade=t=out:st={b - 0.4:.3f}:d=0.4:alpha=1' if tid != 'end' else '') + f'[t{k}]')
        fl.append(f'[{last_lbl}][t{k}]overlay=0:0:enable=\'between(t,{a:.3f},{b:.3f})\'[v{k}]'); last_lbl = f'v{k}'
    fl.append(f'[{last_lbl}]fade=t=out:st={L - 0.35:.3f}:d=0.35,format=yuv420p[vout]')
    vid = f'{OUT}/{name}.mp4'
    run(['ffmpeg', '-y', '-v', 'error'] + inputs + ['-i', wav, '-filter_complex', ';'.join(fl), '-map', '[vout]', '-map', f'{len(allt) + 1}:a',
         '-r', str(FPS), '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-profile:v', 'high', '-c:a', 'aac', '-b:a', '192k', '-t', f'{L:.3f}', '-movflags', '+faststart', vid])
    return vid, L

# ---------------------------------------------------------------- 9:16 (≈32 s) + 4:5
def v916():
    segs = [(0.3, 3.8), (6.9, 9.7), (11.0, 14.0), (14.2, 19.7), (20.8, 24.8), (26.2, 30.4), (32.6, 35.6)]
    def titles(c, te): return [('hook', c[0] + 0.5, c[1] - 0.1), ('slogan', c[1] + 0.2, c[2]), ('code', c[2] + 0.4, c[3] - 0.1),
                               ('lager', c[3] + 1.6, c[4] - 0.1), ('hoehe', c[4] + 0.3, c[5] - 0.1), ('buero', c[5] + 0.4, c[6] - 0.1), ('hallen', c[6] + 0.3, te)]
    def vo(c, te): return [('01', c[0] + 0.3, 1), ('02', c[1] - 0.3, 1.05), ('03', c[2] + 1.85, 1.08), ('04', c[3] + 0.5, 1),
                           ('05k', c[4] + 0.2, 1), ('06', c[5] + 0.1, 1.1), ('07', c[6] + 0.5, 1.1), ('08', te + 0.95, 1.05), ('09', te + 3.75, 1.08)]
    def mk(te): return dict(t_pulse=3.5, t_drop=9.5, t_break=te - 3.0, t_logo=te)
    def sfx(L, c, te):
        fx = ambience(L, [(0, c[3] + 5.5, 'morning'), (c[4], c[6], 'interior'), (c[6], te + 0.6, 'night')])
        add(fx, whoosh(1.4, 0.5, 200, 2500), 0, 0.5)
        for t in c[1:] + [te]: add(fx, whoosh(0.7, 0.65), t - 0.45, 0.3)
        keypad(fx, c[2] + 0.45, c[2] + 1.6); gate(fx, c[3] + 0.2, c[3] + 4.4); return fx
    vid, L = build_vertical('Schmacher_Gewerbepark_9x16', segs, 6.4, titles, vo, mk, sfx)
    run(['ffmpeg', '-y', '-v', 'error', '-i', vid, '-vf', 'crop=1080:1350:0:285', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-c:a', 'copy', '-movflags', '+faststart', f'{OUT}/Schmacher_Gewerbepark_4x5.mp4'])

def teaser():
    segs = [(0.3, 2.8), (14.2, 19.2), (20.8, 22.8), (26.2, 28.4)]
    def titles(c, te): return [('hook', c[0] + 0.3, c[1] - 0.05), ('lager', c[1] + 1.2, c[2] - 0.05), ('buero', c[3] + 0.1, te)]
    def vo(c, te): return [('01', c[0] + 0.2, 1.08), ('04', c[1] + 0.6, 1.0), ('08', te + 0.3, 1.0)]
    def mk(te): return dict(t_pulse=0.0, t_drop=c_drop[0], t_break=te, t_logo=te)
    c_drop = [2.7]
    def sfx(L, c, te):
        fx = ambience(L, [(0, c[2], 'morning'), (c[2], te + 0.5, 'interior')])
        for t in c[1:] + [te]: add(fx, whoosh(0.7, 0.65), t - 0.45, 0.3)
        gate(fx, c[1] + 0.2, c[1] + 4.4); return fx
    build_vertical('Schmacher_Gewerbepark_9x16_Teaser15s', segs, 3.8, titles, vo, mk, sfx)

# ---------------------------------------------------------------- 16:9 Master (45 s)
def master():
    subprocess.run([sys.executable, 'mix_16x9.py'], cwd='audio', check=True)
    run(['ffmpeg', '-y', '-v', 'error', '-framerate', '24', '-i', '3d/frames/f%05d.jpg', '-i', 'audio/out_16x9_45s.wav', '-map', '0:v', '-map', '1:a',
         '-vf', 'fade=t=out:st=44.6:d=0.4,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', f'{OUT}/Schmacher_Gewerbepark_16x9.mp4'])

if __name__ == '__main__':
    w = sys.argv[1] if len(sys.argv) > 1 else 'all'
    if w in ('16x9', 'all'): master()
    if w in ('9x16', 'all'): v916()
    if w in ('teaser', 'all'): teaser()
