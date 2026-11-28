#!/bin/bash
# Runde 4: Startbild als Vorschaubild (kein Schwarz), Titel im Schnitt, lange Endcard mit „Jetzt anrufen“, Flimmern behoben, Außen 1,5x Supersampling
cd "$(dirname "$0")"
H() { QS='&notitles=1' node render.cjs frames "$@"; }
V() { VW=1080 VH=1920 QS='&notitles=1' node render.cjs framesV "$@"; }
( H 0 20 24 1.5 1 > out/h1.log 2>&1; V 0 5.2 24 1.5 1 >> out/h1.log 2>&1 ) &
( H 32 40.5 24 1.5 1 > out/h2.log 2>&1; for r in "6.9 9.7" "11 14" "14.2 19.7" "32.6 35.6"; do V $r 24 1.5 1 >> out/h2.log 2>&1; done ) & wait
echo "FRAMES DONE"
cd .. && python3 edit.py all && cd export && rm -f *.raw.wav && for f in Schmacher_Gewerbepark_16x9 Schmacher_Gewerbepark_9x16 Schmacher_Gewerbepark_4x5 Schmacher_Gewerbepark_9x16_Teaser15s; do ffmpeg -nostdin -y -v error -i $f.mp4 -c:v libx264 -preset slow -crf 22 -maxrate 6M -bufsize 12M -c:a copy -movflags +faststart ${f}_web.mp4; done; ls -la; echo ALL DONE
