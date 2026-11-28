#!/bin/bash
cd "$(dirname "$0")/.."
Q='&notitles=1&film=2&daily=2026-11-22&sign=gpe&branche=neutral'
for r in "0 11.6667" "11.6667 23.3333" "23.3333 35"; do set -- $r
  ( VW=1080 VH=1920 QS=$Q node render.cjs out/d4 $1 $2 24 1 1 > out/d4_$1.log 2>&1 ) &
done; wait; echo RENDER DONE
