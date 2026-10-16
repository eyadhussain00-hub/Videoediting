#!/usr/bin/env bash
# Footage for the edit, from cache/ (after clean_captions.py chunks): public/clean.mp4, public/fg.webm, freeze frames, mix.
set -euo pipefail
cd "$(dirname "$0")/.."
# chunks: a1 = frames 0-119, a2 = 120-239 (pill + captions); c1..c3 = 239-712 (captions, 3-line band). a2 loses its last frame.
ffmpeg -v error -y -i cache/clean_a2.mp4 -frames:v 119 -c:v libx264 -crf 12 -pix_fmt yuv420p cache/clean_a2t.mp4
printf 'file %s\n' clean_a1.mp4 clean_a2t.mp4 clean_c1.mp4 clean_c2.mp4 clean_c3.mp4 > cache/concat.txt
ffmpeg -v error -y -f concat -safe 0 -i cache/concat.txt -c copy cache/clean.mp4
rm -f public/clean.mp4; ln cache/clean.mp4 public/clean.mp4          # hardlink: Remotion can't follow symlinks out of public/
# speaker cut-out: matte choked (lut + erosion) so the bright ceiling doesn't halo his head on the coral world
ffmpeg -v error -y -i cache/clean.mp4 -i cache/matte.mp4 -filter_complex \
  "[1:v]format=gray,lut=y='clip((val-60)*1.4\,0\,255)',erosion,gblur=sigma=1.2[m];[0:v][m]alphamerge,format=yuva420p" \
  -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 20 -row-mt 1 -an public/fg.webm
python3 scripts/last_frames.py
npx tsx scripts/beats.ts > plan/beats.json
python3 scripts/audio.py cache/demucs/htdemucs/orig/vocals.wav public/mix.wav
