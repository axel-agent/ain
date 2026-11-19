#!/bin/bash
cd "$(dirname "$0")/.."
Q='&notitles=1&film=2&daily=2026-11-19&sign=gpe'
for r in "0 8.3333" "8.3333 16.6667" "16.6667 25"; do set -- $r
  ( VW=1080 VH=1920 QS=$Q node render.cjs out/d1 $1 $2 24 1 1 > out/d1_$1.log 2>&1 ) &
done; wait; echo RENDER DONE
