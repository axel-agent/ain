#!/bin/bash
# Finale Runde: Rückseite ohne Codetaster, größere Halle, Büro eingerichtet, WC in der Ecke – danach alle Formate schneiden
cd "$(dirname "$0")"
node render.cjs frames 11 21.5 24 1 1 > out/g1.log 2>&1 &
node render.cjs frames 21.5 32 24 1 1 > out/g2.log 2>&1 & wait
node render.cjs frames 36 39.2 24 1 1 > out/g3.log 2>&1 &
( export VW=1080 VH=1920 QS='&notitles=1'; node render.cjs framesV 11 14 24 1 1 > out/gv1.log 2>&1; node render.cjs framesV 26.2 31 24 1 1 >> out/gv1.log 2>&1 ) & wait
( export VW=1080 VH=1920 QS='&notitles=1'; node render.cjs framesV 14 20 24 1 1 > out/gv2.log 2>&1 ) &
( export VW=1080 VH=1920 QS='&notitles=1'; node render.cjs framesV 20.8 25.2 24 1 1 > out/gv3.log 2>&1 ) & wait
echo "FRAMES DONE"
cd .. && python3 edit.py all && cd export && for f in Schmacher_Gewerbepark_16x9 Schmacher_Gewerbepark_9x16 Schmacher_Gewerbepark_4x5 Schmacher_Gewerbepark_9x16_Teaser15s; do ffmpeg -nostdin -y -v error -i $f.mp4 -c:v libx264 -preset slow -crf 22 -maxrate 6M -bufsize 12M -c:a copy -movflags +faststart ${f}_web.mp4; done; ls -la; echo ALL DONE
