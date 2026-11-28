#!/bin/bash
cd "$(dirname "$0")/.."
Q='&notitles=1&film=2&daily=2026-11-20&sign=gpe&branche=elektro'
for r in "5.875 10.6667" "16.6667 21.3333" "27.25 32"; do set -- $r
  ( VW=1080 VH=1920 QS=$Q node render.cjs out/d2 $1 $2 24 1 1 > out/d2b_$1.log 2>&1 ) &
done; wait; echo RENDER DONE
