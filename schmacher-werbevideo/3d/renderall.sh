#!/bin/bash
# Rendert den 45-s-Master in 2 Workern und setzt ihn zusammen
cd "$(dirname "$0")"; mkdir -p frames out
node render.cjs frames 0 22.5 24 1 1 > out/r1.log 2>&1 & P1=$!
node render.cjs frames 22.5 45 24 1 1 > out/r2.log 2>&1 & P2=$!
wait $P1 $P2
n=$(ls frames | wc -l); echo "frames: $n"
ffmpeg -y -loglevel error -framerate 24 -i frames/f%05d.jpg -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -movflags +faststart out/mietpark_16x9_45s_stumm.mp4 && echo "VIDEO OK"
