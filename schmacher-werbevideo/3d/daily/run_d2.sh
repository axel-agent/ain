#!/bin/bash
cd "$(dirname "$0")"
until grep -q "RENDER DONE" ../out/d2_render.log; do sleep 30; done
NP=4 python3 d2_build.py all || exit 1
D=/home/user/ain/schmacher-werbevideo/export/daily/2026-11-20; W=/home/user/ain/werbevideos
mkdir -p $W/tagespakete/2026-11-20 && cp $D/* $W/tagespakete/2026-11-20/ && cp $D/Schmacher_ElektroMorgen_9x16.mp4 $W/2026-11-20_ElektroMorgen_9x16.mp4
echo 2026-11-20 > $W/tagespakete/NEUESTES.txt
echo ALL D2 DONE
