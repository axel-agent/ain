#!/bin/bash
cd "$(dirname "$0")/.."
Q='&notitles=1&film=2&daily=2026-11-20&sign=gpe&branche=elektro'
for r in "0 10.6667" "10.6667 21.3333" "21.3333 32"; do set -- $r
  ( VW=1080 VH=1920 QS=$Q node render.cjs out/d2 $1 $2 24 1 1 > out/d2_$1.log 2>&1 ) &
done; wait; echo RENDER DONE
