#!/usr/bin/env bash
# Footage for the edit, from cache/ (after clean_captions.py chunks): public/clean.mp4, public/fg.webm, freeze frames, mix.
set -euo pipefail
cd "$(dirname "$0")/.."
ls cache/clean_a1.mp4 cache/clean_a2.mp4 cache/clean_a3.mp4 cache/clean_b.mp4 | sed 's/^/file /; s/cache\///' > cache/concat.txt
ffmpeg -v error -y -f concat -safe 0 -i cache/concat.txt -c copy cache/clean.mp4
rm -f public/clean.mp4; ln cache/clean.mp4 public/clean.mp4          # hardlink: Remotion can't follow symlinks out of public/
# speaker cut-out: matte choked (lut + erosion) so the bright ceiling doesn't halo his head on the coral world
ffmpeg -v error -y -i cache/clean.mp4 -i cache/matte.mp4 -filter_complex \
  "[1:v]format=gray,lut=y='clip((val-60)*1.4\,0\,255)',erosion,gblur=sigma=1.2[m];[0:v][m]alphamerge,format=yuva420p" \
  -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 20 -row-mt 1 -an public/fg.webm
python3 scripts/last_frames.py
npx tsx scripts/beats.ts > plan/beats.json
python3 scripts/audio.py cache/demucs/htdemucs/orig/vocals.wav public/mix.wav
