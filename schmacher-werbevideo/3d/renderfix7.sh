#!/bin/bash
# Fortsetzung Runde 5 mit besserer Lastverteilung
cd "$(dirname "$0")"
V() { VW=1080 VH=1920 QS='&notitles=1' node render.cjs framesV "$@"; }
( while kill -0 3148 2>/dev/null; do sleep 15; done; V 6.9 9.7 24 1.5 1 >> out/k1.log 2>&1; V 20.8 24.8 24 1 1 >> out/k1.log 2>&1 ) &
( while kill -0 3485 2>/dev/null; do sleep 15; done; V 26.2 30.4 24 1 1 >> out/k2.log 2>&1 ) & wait
echo "FRAMES DONE"
cd .. && python3 edit.py all && cd export && rm -f *.raw.wav && for f in Schmacher_Gewerbepark_16x9 Schmacher_Gewerbepark_9x16 Schmacher_Gewerbepark_4x5 Schmacher_Gewerbepark_9x16_Teaser15s; do ffmpeg -nostdin -y -v error -i $f.mp4 -c:v libx264 -preset slow -crf 22 -maxrate 6M -bufsize 12M -c:a copy -movflags +faststart ${f}_web.mp4; done; ls -la; echo ALL DONE
