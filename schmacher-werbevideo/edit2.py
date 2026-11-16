# Schnitt Film 2 „Licht an.“: python3 edit2.py
import sys, os, subprocess
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'audio'))
os.chdir(os.path.dirname(os.path.abspath(__file__)))
from edit import compose, run, FPS, OUT
from sound import *
L, LAST = 42.4, 32.2   # Bilder bis 32,2 s, danach steht das letzte Bild unter der Endcard
TT = [('cover', 0.0, 2.5), ('stell', 2.6, 4.6), ('deins', 5.0, 8.4), ('lager2', 9.4, 15.2), ('buero2', 19.9, 24.3), ('kueche', 24.8, 27.9),
      ('hallen2', 28.3, 30.9), ('end2', 31.0, L + 1), ('endcta', 32.8, L + 1)]
N = 'Schmacher_Gewerbepark_LichtAn'
def full(fr, tdir, name, crf):
    compose(['-framerate', '24', '-i', f'3d/{fr}/f%05d.jpg'], tdir, TT, L, 'audio/out_film2.wav', f'{OUT}/{name}.mp4', crf,
            pre=f'trim=end={LAST}:start=0,setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration={L - LAST + 0.5:.2f}')
def teaser():
    segs = [(0.0, 4.4), (11.0, 14.4), (21.0, 24.0)]; frames = []; cuts = []
    for a, b in segs:
        cuts.append(len(frames) / FPS); frames += [f'3d/frames2V/f{f:05d}.jpg' for f in range(round(a * FPS), round(b * FPS))]
    te = len(frames) / FPS; frames += [frames[-1]] * round(4.8 * FPS); LT = len(frames) / FPS
    with open(f'{OUT}/teaser2.ffconcat', 'w') as fh:
        fh.write('ffconcat version 1.0\n')
        for p in frames: fh.write(f"file '../{p}'\nduration {1 / FPS:.6f}\n")
        fh.write(f"file '../{frames[-1]}'\n")
    sys.path.insert(0, 'audio'); import importlib
    mu = music(LT, t_pulse=0.5, t_drop=cuts[1], t_break=te, t_logo=te, t_cta=te + 1.6); mu *= np.clip((np.arange(len(mu)) / SR - 1.1) / 1.2, 0, 1)[:, None]
    fx = ambience(LT, [(0.8, te + 0.5, 'interior')])
    from mix_film2 import click, tink, thud, pop, clank
    add(fx, click(), 0.95)
    for i in range(7): add(fx, tink(2400 + i * 90), 1.05 + i * 0.2, 0.8)
    for k in range(10): add(fx, thud(), cuts[1] + 0.1 + k * 0.17, 0.5)
    for k in range(10): add(fx, pop(), cuts[2] + 0.05 + k * 0.22, 0.6)
    for t in cuts[1:] + [te]: add(fx, whoosh(0.7, 0.65), t - 0.45, 0.3)
    V = 'audio/vo/raw_%s.wav'
    vo = [(V % 'f2_01', 2.6, 1.0), (V % 'f2_02', cuts[1] + 0.3, 1.0), (V % 'f2_05', cuts[2] + 0.3, 1.0), (V % 'f2_08', te + 0.3, 1.0), (V % '09', te + 2.4, 1.05)]
    wav = mix(LT, mu, fx, vo, f'{OUT}/{N}_Teaser15s.wav')
    T2 = [('cover', 0.0, 2.5), ('stell', 2.6, cuts[1] - 0.05), ('lager2', cuts[1] + 0.3, cuts[2] - 0.05), ('buero2', cuts[2] + 0.2, te), ('end2', te, LT + 1), ('endcta', te + 1.6, LT + 1)]
    compose(['-f', 'concat', '-safe', '0', '-i', f'{OUT}/teaser2.ffconcat'], '3d/titlesV', T2, LT, wav, f'{OUT}/{N}_9x16_Teaser15s.mp4', 18)
if __name__ == '__main__':
    subprocess.run([sys.executable, 'mix_film2.py'], cwd='audio', check=True)
    full('frames2', '3d/titles16', f'{N}_16x9', 17)
    full('frames2V', '3d/titlesV', f'{N}_9x16', 18)
    run(['ffmpeg', '-y', '-v', 'error', '-i', f'{OUT}/{N}_9x16.mp4', '-vf', 'crop=1080:1350:0:285', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-c:a', 'copy', '-movflags', '+faststart', f'{OUT}/{N}_4x5.mp4'])
    teaser()
    for n in ['16x9', '9x16', '4x5', '9x16_Teaser15s']:
        run(['ffmpeg', '-y', '-v', 'error', '-i', f'{OUT}/{N}_{n}.mp4', '-frames:v', '1', '-q:v', '2', f'{OUT}/Vorschaubild_LichtAn_{n}.jpg'])
        run(['ffmpeg', '-nostdin', '-y', '-v', 'error', '-i', f'{OUT}/{N}_{n}.mp4', '-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-maxrate', '6M', '-bufsize', '12M', '-c:a', 'copy', '-movflags', '+faststart', f'{OUT}/{N}_{n}_web.mp4'])
    print('EDIT2 DONE')
