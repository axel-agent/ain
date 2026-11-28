#!/bin/bash
# Startbild (Plakat 9:16) vor ein Video setzen: prepend_cover.sh <cover.jpg> <video.mp4> <out.mp4>
# 2,2 s Plakat, 0,3 s Überblendung ins Video; Ton des Videos beginnt mit dem Video.
set -e
C=$1; V=$2; O=$3; HOLD=2.2; XF=0.3; OFF=$(python3 -c "print($HOLD-$XF)")
ffmpeg -nostdin -y -v error -loop 1 -framerate 24 -t $HOLD -i "$C" -i "$V" -filter_complex \
 "[0:v]scale=1080:1920,format=yuv420p,setsar=1,fps=24,settb=AVTB[c];[1:v]format=yuv420p,setsar=1,fps=24,settb=AVTB[v];[c][v]xfade=transition=fade:duration=$XF:offset=$OFF[vo];[1:a]adelay=${OFF}s:all=1[ao]" \
 -map "[vo]" -map "[ao]" -r 24 -c:v libx264 -pix_fmt yuv420p -profile:v high -level 4.1 -preset slow -crf 21 -maxrate 8M -bufsize 16M -c:a aac -b:a 192k -movflags +faststart "$O"
