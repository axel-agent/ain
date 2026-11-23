#!/bin/bash
cd "$(dirname "$0")/.."
Q='&notitles=1&film=2&daily=2026-11-23&sign=gpe&branche=versand'
for r in "0 9" "9 18" "18 27"; do set -- $r
  ( VW=1080 VH=1920 QS=$Q node render.cjs out/d5 $1 $2 24 1 1 > out/d5_$1.log 2>&1 ) &
done; wait; echo RENDER DONE
