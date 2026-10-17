#!/usr/bin/env bash
# Footage for the edit, from cache/ (after clean_text.py chunks a = frames 0-879, b = 880-1757):
# public/clean.mp4, speaker matte + public/fg.webm, freeze frames, beats.json, mix.
set -euo pipefail
cd "$(dirname "$0")/.."
printf 'file %s\n' clean_a.mp4 clean_b.mp4 > cache/concat.txt
ffmpeg -v error -y -f concat -safe 0 -i cache/concat.txt -c copy cache/clean.mp4
rm -f public/clean.mp4; ln cache/clean.mp4 public/clean.mp4          # hardlink: Remotion can't follow symlinks out of public/
[ -f cache/matte.mp4 ] || python3 -I scripts/matte.py cache/clean.mp4 cache/matte.mp4
ffmpeg -v error -y -i cache/clean.mp4 -i cache/matte.mp4 -filter_complex \
  "[1:v]format=gray,lut=y='clip((val-60)*1.4\,0\,255)',erosion,gblur=sigma=1.2[m];[0:v][m]alphamerge,format=yuva420p" \
  -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 20 -row-mt 1 -an public/fg.webm
python3 -I scripts/last_frames.py
npx tsx scripts/beats.ts > plan/beats.json
python3 -I scripts/audio.py cache/demucs/htdemucs/orig/vocals.wav public/mix.wav
