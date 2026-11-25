#!/bin/bash
cd "$(dirname "$0")/.."
Q='&notitles=1&film=2&daily=2026-11-25&sign=gpe&branche=neutral'
for r in "0 8.6667" "8.6667 17.3333" "17.3333 26"; do set -- $r
  ( VW=1080 VH=1920 QS=$Q node render.cjs out/d7 $1 $2 24 1 1 > out/d7_$1.log 2>&1 ) &
done; wait; echo RENDER DONE
