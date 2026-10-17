#!/usr/bin/env bash
# Footage for the edit, from cache/: public/clean.mp4, public/fg.webm (speaker cut-out, transparent outside the matte ranges),
# freeze frames, mix.
set -euo pipefail
# cache/clean.mp4 = scripts/clean_all.sh output after scripts/second_pass.py
cd "$(dirname "$0")/.."
rm -f public/clean.mp4; ln cache/clean.mp4 public/clean.mp4          # hardlink: Remotion can't follow symlinks out of public/
ffmpeg -v error -y -i cache/clean.mp4 -i cache/matte.mp4 -filter_complex \
  "[1:v]format=gray,lut=y='clip((val-60)*1.4\,0\,255)',erosion,gblur=sigma=1.2[m];[0:v][m]alphamerge,format=yuva420p" \
  -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 22 -row-mt 1 -deadline good -cpu-used 4 -an public/fg.webm
python3 scripts/last_frames.py
npx tsx scripts/beats.ts > plan/beats.json
python3 scripts/audio.py cache/orig.wav public/mix.wav
