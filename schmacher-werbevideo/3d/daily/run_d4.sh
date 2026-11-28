#!/bin/bash
cd "$(dirname "$0")"
until grep -q "RENDER DONE" ../out/d4_render.log; do sleep 30; done
NP=4 python3 d4_build.py all || exit 1
D=/home/user/ain/schmacher-werbevideo/export/daily/2026-11-22; W=/home/user/ain/werbevideos
for b in Schmacher Russinov; do ./prepend_cover.sh ../out/coverV_d4_$b.jpg $D/${b}_7Gruende_9x16_ohneStartbild.mp4 $D/${b}_7Gruende_9x16.mp4 || exit 1
  ffprobe -v error -select_streams v -show_entries stream=pix_fmt -of csv=p=0 $D/${b}_7Gruende_9x16.mp4 | grep -q yuv420p || { echo PIXFMT FEHLER; exit 1; }; done
mkdir -p $W/tagespakete/2026-11-22 && for f in $D/*; do case $f in *ohneStartbild*) ;; *) cp $f $W/tagespakete/2026-11-22/;; esac; done
cp $D/Schmacher_7Gruende_9x16.mp4 $W/2026-11-22_7Gruende_9x16.mp4; echo 2026-11-22 > $W/tagespakete/NEUESTES.txt
echo ALL D4 DONE
