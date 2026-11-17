# Makler-Version (Russinov Immobilien) beider Filme: python3 edit_makler.py
# Ohne Schmacher-Logo/-Nummer: Russinov-Logo, -Telefon, -Web; neutrales Fassadenschild „Gewerbepark Ebenthal“ (Film 1).
import sys, os, subprocess
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'audio'))
os.chdir(os.path.dirname(os.path.abspath(__file__)))
import edit
from edit import compose, run, FPS
from sound import *
from PIL import Image
OUT = 'export/makler'; os.makedirs(OUT, exist_ok=True)
N1, N2 = 'Russinov_Gewerbepark_Ebenthal', 'Russinov_Gewerbepark_Ebenthal_LichtAn'

def farm(src, new, dst):
    """Bildordner aus Original + neu gerenderten Fassadenbildern (Symlinks)."""
    os.makedirs(dst, exist_ok=True)
    for f in sorted(os.listdir(src)):
        p = os.path.join(dst, f)
        if os.path.lexists(p): os.remove(p)
        tgt = os.path.join(new, f) if os.path.exists(os.path.join(new, f)) else os.path.join(src, f)
        os.symlink(os.path.abspath(tgt), p)

def film1():
    farm('3d/frames', '3d/out/mk16', '3d/frames_mk'); farm('3d/framesV', '3d/out/mkV', '3d/framesV_mk')
    subprocess.run([sys.executable, 'mix_16x9.py'], cwd='audio', check=True, env={**os.environ, 'MAKLER': '1'})
    L16 = edit.L16
    T = [('cover', 0.0, 2.8), ('hook', 3.0, 5.4), ('slogan', 6.0, 10.6), ('code', 11.2, 13.9), ('units', 32.4, 35.8), ('tech', 36.0, 38.9),
         ('end', 39.3, L16 + 1), ('endcta', 41.1, L16 + 1)]
    compose(['-framerate', '24', '-i', '3d/frames_mk/f%05d.jpg'], '3d/titles16m', T, L16, 'audio/out_16x9_mk.wav', f'{OUT}/{N1}_16x9.mp4', 17,
            pre=f'trim=end={40.5}:start=0,setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration={L16 - 40.5 + 0.5:.2f}')
    # 9:16 wie edit.v916, aber mit Makler-Bildern, -Titeln und -Abbinder
    edit.FV, edit.TV, edit.OUT = '3d/framesV_mk', '3d/titlesVm', OUT
    segs = [(0.0, 5.2), (6.9, 9.7), (11.0, 14.0), (14.2, 19.7), (20.8, 24.8), (26.2, 30.4), (32.6, 35.6)]
    def titles(c, te): return [('cover', 0.0, 2.5), ('hook', 2.6, c[1] - 0.1), ('slogan', c[1] + 0.2, c[2]), ('code', c[2] + 0.4, c[3] - 0.1),
                               ('lager', c[3] + 1.6, c[4] - 0.1), ('hoehe', c[4] + 0.3, c[5] - 0.1), ('buero', c[5] + 0.4, c[6] - 0.1), ('hallen', c[6] + 0.3, te)]
    def vo(c, te): return [('01', 2.5, 1.05), ('02', c[1] - 0.2, 1.05), ('03', c[2] + 1.9, 1.08), ('04', c[3] + 1.1, 1),
                           ('05k', c[4] + 0.2, 1), ('06', c[5] + 0.1, 1.1), ('07', c[6] + 0.5, 1.1), ('08', te + 0.6, 1.05), ('m09', te + 3.5, 1.0), ('m10', te + 5.9, 1.1)]
    def mk(te): return dict(t_pulse=3.5, t_drop=11.0, t_break=te - 3.0, t_logo=te, t_cta=te + 1.8)
    def sfx(L, c, te):
        fx = ambience(L, [(0, c[3] + 5.5, 'morning'), (c[4], c[6], 'interior'), (c[6], te + 0.6, 'night')])
        add(fx, whoosh(1.4, 0.5, 200, 2500), 2.2, 0.4)
        for t in c[1:] + [te]: add(fx, whoosh(0.7, 0.65), t - 0.45, 0.3)
        gate(fx, c[3] + 0.2, c[3] + 4.4); return fx
    vid, L = edit.build_vertical(f'{N1}_9x16', segs, 10.6, titles, vo, mk, sfx)
    run(['ffmpeg', '-y', '-v', 'error', '-i', vid, '-vf', 'crop=1080:1350:0:285', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-c:a', 'copy', '-movflags', '+faststart', f'{OUT}/{N1}_4x5.mp4'])

def film2():
    import edit2
    subprocess.run([sys.executable, 'mix_film2.py'], cwd='audio', check=True, env={**os.environ, 'MAKLER': '1'})
    os.makedirs('3d/titles45m', exist_ok=True)
    for tid, a, b in edit2.TT:
        if tid != 'cover2': Image.open(f'3d/titlesVm/{tid}.png').crop((0, 285, 1080, 1635)).save(f'3d/titles45m/{tid}.png')
    L, LAST = edit2.L, edit2.LAST
    for fr, tdir, n, crf, crop in [('frames3', '3d/titles16m', '16x9', 17, ''), ('frames3V', '3d/titlesVm', '9x16', 18, ''),
                                   ('frames3V', '3d/titles45m', '4x5', 18, 'crop=1080:1350:0:285,')]:
        compose(['-framerate', '24', '-i', f'3d/{fr}/f%05d.jpg'], tdir, edit2.TT, L, 'audio/out_film2_mk.wav', f'{OUT}/{N2}_{n}.mp4', crf,
                pre=f'{crop}trim=end={LAST}:start=0,setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration={L - LAST + 0.5:.2f}')

def web():
    for N in (N1, N2):
        for n in ['16x9', '9x16', '4x5']:
            run(['ffmpeg', '-y', '-v', 'error', '-i', f'{OUT}/{N}_{n}.mp4', '-frames:v', '1', '-q:v', '2', f'{OUT}/Vorschaubild_{N}_{n}.jpg'])
            run(['ffmpeg', '-nostdin', '-y', '-v', 'error', '-i', f'{OUT}/{N}_{n}.mp4', '-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-maxrate', '6M', '-bufsize', '12M',
                 '-c:a', 'copy', '-movflags', '+faststart', f'{OUT}/{N}_{n}_web.mp4'])

if __name__ == '__main__':
    w = sys.argv[1] if len(sys.argv) > 1 else 'all'
    if w in ('2', 'all'): film2()
    if w in ('1', 'all'): film1()
    if w in ('web', 'all'): web()
    print('MAKLER DONE')
