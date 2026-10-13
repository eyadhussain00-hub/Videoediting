#!/bin/bash
# reel.sh <slides dir> <out.mp4>: carousel slides → 9:16 reel, slides centred on ink, 0.4 s crossfades, silent (add music in Instagram).
set -e
dir=$1; out=$2; files=($(ls $dir/[0-9]*.png | sort)); n=${#files[@]}
inputs=(); filt=""
for i in "${!files[@]}"; do
  d=4.2; [ $i -eq 0 ] && d=2.8; [ $i -eq $((n-1)) ] && d=4.6
  inputs+=(-loop 1 -t $d -framerate 30 -i ${files[$i]})
  filt+="[$i]scale=1080:1350,pad=1080:1920:0:285:color=0x14151a,setsar=1,format=yuv420p[s$i];"
  durs[$i]=$d
done
prev="s0"; off=0
for ((i=1;i<n;i++)); do
  off=$(python3 -c "print(round($off+${durs[$((i-1))]}-0.4,3))")
  filt+="[$prev][s$i]xfade=transition=slideleft:duration=0.4:offset=$off[x$i];"; prev="x$i"
done
ffmpeg -loglevel error -y "${inputs[@]}" -filter_complex "${filt%;}" -map "[$prev]" -c:v libx264 -crf 20 -preset medium -r 30 -movflags +faststart $out
