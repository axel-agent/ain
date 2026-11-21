#!/bin/bash
# Film 2 v2: neue Szenen 0–32,85 s rendern, Büro/Außen (alt ab 20,58 s) aus frames2 übernehmen (+294 Bilder), dann Schnitt
cd "$(dirname "$0")"
mkdir -p frames3 frames3V
for d in "frames2 frames3" "frames2V frames3V"; do set -- $d; for i in $(seq 494 773); do ln -sf "../$1/$(printf 'f%05d.jpg' $i)" "$2/$(printf 'f%05d.jpg' $((i + 294)))"; done; done
( QS='&notitles=1&film=2' node render.cjs frames3 0 32.85 24 1 1 > out/m1.log 2>&1 ) &
( VW=1080 VH=1920 QS='&notitles=1&film=2' node render.cjs frames3V 0 32.85 24 1 1 > out/m2.log 2>&1 ) & wait
echo "FRAMES DONE"
cd .. && python3 edit2.py && ls -la export | grep LichtAn; echo ALL DONE
