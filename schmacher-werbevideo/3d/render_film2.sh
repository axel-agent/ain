#!/bin/bash
# Film 2 „Licht an.“ – alle Bilder (16:9 + 9:16), danach Schnitt
cd "$(dirname "$0")"
( QS='&notitles=1&film=2' node render.cjs frames2 0 28 24 1 1 > out/l1.log 2>&1; QS='&notitles=1&film=2' node render.cjs frames2 28 32.25 24 1.5 1 >> out/l1.log 2>&1 ) &
( VW=1080 VH=1920 QS='&notitles=1&film=2' node render.cjs frames2V 0 28 24 1 1 > out/l2.log 2>&1; VW=1080 VH=1920 QS='&notitles=1&film=2' node render.cjs frames2V 28 32.25 24 1.5 1 >> out/l2.log 2>&1 ) & wait
echo "FRAMES DONE"
cd .. && python3 edit2.py && ls -la export | grep LichtAn; echo ALL DONE
