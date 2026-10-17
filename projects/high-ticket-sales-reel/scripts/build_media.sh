#!/usr/bin/env bash
# Footage + mix for the edit, from cache/: public/clean.mp4, public/fg.webm, freeze frames, beats, mix.
# Needs cache/clean.mp4 (clean_title.py), cache/matte.mp4 (matte.py), cache/demucs/htdemucs/orig/vocals.wav.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/img
rm -f public/clean.mp4; ln cache/clean.mp4 public/clean.mp4          # hardlink: Remotion can't follow symlinks out of public/
ffmpeg -v error -y -i cache/clean.mp4 -i cache/matte.mp4 -filter_complex \
  "[1:v]format=gray,lut=y='clip((val-60)*1.4\,0\,255)',erosion,gblur=sigma=1.2[m];[0:v][m]alphamerge,format=yuva420p" \
  -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 20 -row-mt 1 -an public/fg.webm
python3 scripts/last_frames.py
npx tsx scripts/beats.ts > plan/beats.json
python3 scripts/audio.py cache/demucs/htdemucs/orig/vocals.wav public/mix.wav
