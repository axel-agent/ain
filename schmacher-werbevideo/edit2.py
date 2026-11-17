# Schnitt Film 2 „Licht an.“: python3 edit2.py
import sys, os, subprocess
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'audio'))
os.chdir(os.path.dirname(os.path.abspath(__file__)))
from edit import compose, run, FPS, OUT
from sound import *
L, LAST = 50.6, 44.45   # Bilder bis 44,45 s, danach steht das letzte Bild unter der Endcard
TT = [('cover2', 0.0, 2.3), ('stell', 2.35, 4.4), ('deins', 7.25, 10.65), ('lager2', 11.65, 17.4), ('lager3', 18.0, 22.95), ('tor', 23.6, 27.6),
      ('buero2', 32.15, 36.55), ('kueche', 37.05, 40.15), ('hallen2', 40.55, 43.15), ('end3', 43.25, L + 1), ('end3cta', 44.35, L + 1)]
FR = {'frames2': 'frames3', 'frames2V': 'frames3V'}
N = 'Schmacher_Gewerbepark_LichtAn'
def titles45():  # 4:5: Titel aus 9:16 mittig beschnitten, eigenes Vorschaubild
    from PIL import Image
    os.makedirs('3d/titles45', exist_ok=True)
    for tid, a, b in TT:
        if tid == 'cover2': continue
        Image.open(f'3d/titlesV/{tid}.png').crop((0, 285, 1080, 1635)).save(f'3d/titles45/{tid}.png')
def full(fr, tdir, name, crf, crop=''):
    compose(['-framerate', '24', '-i', f'3d/{FR[fr]}/f%05d.jpg'], tdir, TT, L, 'audio/out_film2.wav', f'{OUT}/{name}.mp4', crf,
            pre=f'{crop}trim=end={LAST}:start=0,setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration={L - LAST + 0.5:.2f}')
def teaser():
    segs = [(0.0, 1.6), (2.25, 5.4), (24.3, 27.6), (33.0, 36.0)]; frames = []; cuts = []
    for a, b in segs:
        cuts.append(len(frames) / FPS); frames += [f'3d/frames3V/f{f:05d}.jpg' for f in range(round(a * FPS), round(b * FPS))]
    te = len(frames) / FPS; frames += [frames[-1]] * round(4.6 * FPS); LT = len(frames) / FPS
    with open(f'{OUT}/teaser2.ffconcat', 'w') as fh:
        fh.write('ffconcat version 1.0\n')
        for p in frames: fh.write(f"file '../{p}'\nduration {1 / FPS:.6f}\n")
        fh.write(f"file '../{frames[-1]}'\n")
    mu = music(LT, t_pulse=cuts[1] + 1.0, t_drop=cuts[2], t_break=te, t_logo=te, t_cta=te + 1.0); mu *= np.clip((np.arange(len(mu)) / SR - cuts[1] - 1.0) / 1.0, 0, 1)[:, None]
    fx = ambience(LT, [(0.0, te + 0.5, 'interior')])
    from mix_film2 import click, tink, motor, engine, pop
    sw = cuts[1] - 2.25
    add(fx, click(), sw + 3.2)
    for i in range(7): add(fx, tink(2400 + i * 90), sw + 3.3 + i * 0.2, 0.8)
    add(fx, engine(3.0), cuts[2] + 0.1, 1.0)
    for k in range(8): add(fx, pop(), cuts[3] + 0.3 + k * 0.3, 0.5)
    for t in cuts[1:] + [te]: add(fx, whoosh(0.7, 0.65), t - 0.45, 0.3)
    V = 'audio/vo/raw_%s.wav'
    vo = [(V % 'f2_01', cuts[1] + 0.2, 1.0), (V % 'f2_10', cuts[2] + 0.25, 1.0), (V % 'f2_05', cuts[3] + 0.3, 1.0), (V % 'f2_08', te + 0.2, 1.0), (V % '09', te + 2.3, 1.05)]
    wav = mix(LT, mu, fx, vo, f'{OUT}/{N}_Teaser15s.wav')
    T2 = [('cover2', 0.0, cuts[1] + 0.05), ('stell', cuts[1] + 0.1, cuts[2] - 0.05), ('tor', cuts[2] + 0.2, cuts[3] - 0.05), ('buero2', cuts[3] + 0.2, te), ('end3', te, LT + 1), ('end3cta', te + 0.9, LT + 1)]
    compose(['-f', 'concat', '-safe', '0', '-i', f'{OUT}/teaser2.ffconcat'], '3d/titlesV', T2, LT, wav, f'{OUT}/{N}_9x16_Teaser15s.mp4', 18)
if __name__ == '__main__':
    subprocess.run([sys.executable, 'mix_film2.py'], cwd='audio', check=True)
    full('frames2', '3d/titles16', f'{N}_16x9', 17)
    full('frames2V', '3d/titlesV', f'{N}_9x16', 18)
    titles45(); full('frames2V', '3d/titles45', f'{N}_4x5', 18, crop='crop=1080:1350:0:285,')
    teaser()
    for n in ['16x9', '9x16', '4x5', '9x16_Teaser15s']:
        run(['ffmpeg', '-y', '-v', 'error', '-i', f'{OUT}/{N}_{n}.mp4', '-frames:v', '1', '-q:v', '2', f'{OUT}/Vorschaubild_LichtAn_{n}.jpg'])
        run(['ffmpeg', '-nostdin', '-y', '-v', 'error', '-i', f'{OUT}/{N}_{n}.mp4', '-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-maxrate', '6M', '-bufsize', '12M', '-c:a', 'copy', '-movflags', '+faststart', f'{OUT}/{N}_{n}_web.mp4'])
    print('EDIT2 DONE')
