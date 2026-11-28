#!/bin/bash
cd "$(dirname "$0")/.."
Q='&notitles=1&film=2&daily=2026-11-28&sign=gpe&branche=neutral'
for r in "0 9.3333" "9.3333 18.6667" "18.6667 28"; do set -- $r
  ( VW=1080 VH=1920 QS=$Q node render.cjs out/d10 $1 $2 24 1 1 > out/d10_$1.log 2>&1 ) &
done; wait; echo RENDER DONE
