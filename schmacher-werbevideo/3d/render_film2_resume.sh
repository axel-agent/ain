#!/bin/bash
# Fortsetzung Film 2 nach Container-Neustart
cd "$(dirname "$0")"
( QS='&notitles=1&film=2' node render.cjs frames2 $(python3 -c "print(583/24)") 28 24 1 1 > out/l1.log 2>&1; QS='&notitles=1&film=2' node render.cjs frames2 28 32.25 24 1.5 1 >> out/l1.log 2>&1 ) &
( VW=1080 VH=1920 QS='&notitles=1&film=2' node render.cjs frames2V $(python3 -c "print(603/24)") 28 24 1 1 > out/l2.log 2>&1; VW=1080 VH=1920 QS='&notitles=1&film=2' node render.cjs frames2V 28 32.25 24 1.5 1 >> out/l2.log 2>&1 ) & wait
echo "FRAMES DONE"
cd .. && python3 edit2.py && ls -la export | grep LichtAn; echo ALL DONE
