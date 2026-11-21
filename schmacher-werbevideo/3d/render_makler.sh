#!/bin/bash
# Makler-Version Film 1: Bilder mit Fassadenschild neu (neutrales Schild „Gewerbepark Ebenthal“)
cd "$(dirname "$0")"
Q='&notitles=1&sign=gpe'
( QS=$Q node render.cjs out/mk16 5.5417 6.6667 24 1 1 > out/mk1.log 2>&1; QS=$Q node render.cjs out/mk16 32.0417 40.5417 24 1 1 >> out/mk1.log 2>&1 ) &
( VW=1080 VH=1920 QS=$Q node render.cjs out/mkV 5.5417 6.375 24 1 1 > out/mk2.log 2>&1; VW=1080 VH=1920 QS=$Q node render.cjs out/mkV 32.0417 35.625 24 1 1 >> out/mk2.log 2>&1 ) &
wait; echo RENDER DONE
