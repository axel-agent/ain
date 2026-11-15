#!/bin/bash
# Runde 3: Name „Gewerbepark Ebenthal · Schmacher Solutions“, Flimmern behoben (Z-Fighting Boden, Fassaden-Rillen), Außenaufnahmen mit 1,5-fach Supersampling
cd "$(dirname "$0")"
V() { VW=1080 VH=1920 QS='&notitles=1' node render.cjs framesV "$@"; }
( node render.cjs frames 0 20 24 1.5 1 > out/h1.log 2>&1; V 32.6 35.6 24 1.5 1 >> out/h1.log 2>&1; V 0.3 3.8 24 1.5 1 >> out/h1.log 2>&1 ) &
( node render.cjs frames 32 45 24 1.5 1 > out/h2.log 2>&1; V 6.9 9.7 24 1.5 1 >> out/h2.log 2>&1; V 11 14 24 1.5 1 >> out/h2.log 2>&1; V 14.2 19.7 24 1.5 1 >> out/h2.log 2>&1 ) & wait
echo "FRAMES DONE"
cd .. && python3 edit.py all && cd export && for f in Schmacher_Gewerbepark_16x9 Schmacher_Gewerbepark_9x16 Schmacher_Gewerbepark_4x5 Schmacher_Gewerbepark_9x16_Teaser15s; do ffmpeg -nostdin -y -v error -i $f.mp4 -c:v libx264 -preset slow -crf 22 -maxrate 6M -bufsize 12M -c:a copy -movflags +faststart ${f}_web.mp4; done; ls -la; echo ALL DONE
