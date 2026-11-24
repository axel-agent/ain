#!/bin/bash
cd "$(dirname "$0")/.."
Q='&notitles=1&film=2&daily=2026-11-24&sign=gpe&branche=neutral'
for r in "6.875 10" "16.6667 20" "24.0417 30"; do set -- $r
  ( VW=1080 VH=1920 QS=$Q node render.cjs out/d6 $1 $2 24 1 1 > out/d6b_$1.log 2>&1 ) &
done; wait; echo RENDER DONE
