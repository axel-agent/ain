#!/bin/bash
# Fortsetzung Runde 4 (Lane 1 brach bei Bild 157 mit Screenshot-Timeout ab)
cd "$(dirname "$0")"
( QS='&notitles=1' node render.cjs frames 6.54 20 24 1.5 1 > out/h3.log 2>&1 ) &
( while kill -0 3843 2>/dev/null; do sleep 20; done; VW=1080 VH=1920 QS='&notitles=1' node render.cjs framesV 32.6 35.6 24 1.5 1 >> out/h2.log 2>&1 ) & wait
echo "FRAMES DONE"
cd .. && python3 edit.py all && cd export && rm -f *.raw.wav && for f in Schmacher_Gewerbepark_16x9 Schmacher_Gewerbepark_9x16 Schmacher_Gewerbepark_4x5 Schmacher_Gewerbepark_9x16_Teaser15s; do ffmpeg -nostdin -y -v error -i $f.mp4 -c:v libx264 -preset slow -crf 22 -maxrate 6M -bufsize 12M -c:a copy -movflags +faststart ${f}_web.mp4; done; ls -la; echo ALL DONE
