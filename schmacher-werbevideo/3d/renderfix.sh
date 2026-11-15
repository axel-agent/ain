#!/bin/bash
# 1) 16:9: geänderte Bereiche neu (Titel, Innenraum, Endcard)  2) 9:16 ohne Titel (Titel kommen in der Montage)
cd "$(dirname "$0")"
node render.cjs frames 0.9 5.4 24 1 1 > out/f1.log 2>&1 &
node render.cjs frames 14 23 24 1 1 > out/f2.log 2>&1 & wait
node render.cjs frames 23 32 24 1 1 > out/f3.log 2>&1 &
node render.cjs frames 39.2 45 24 1 1 > out/f4.log 2>&1 & wait
echo "16x9 frames: $(ls frames | wc -l)"
export VW=1080 VH=1920 QS='&notitles=1'
seg() { node render.cjs framesV $1 $2 24 1 1 >> out/v.log 2>&1; }
(seg 0.3 4.6; seg 6.8 10.3; seg 11 14) &
(seg 14 20; seg 20.8 25.2) & wait
(seg 26.2 31) & (seg 32.6 36.6) & wait
echo "9x16 frames: $(ls framesV | wc -l)"; echo RENDER DONE
