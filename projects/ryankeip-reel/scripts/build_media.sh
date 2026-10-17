#!/usr/bin/env bash
# Footage + mix for the edit, from cache/ (after scripts/run_chunks.sh clean + matte):
# public/clean.mp4, public/fg.webm (speaker with alpha), end-hold freeze frames, plan/beats.json, public/mix.wav.
set -euo pipefail
cd "$(dirname "$0")/.."
for j in clean matte; do
  ls cache/$j/[0-9][0-9][0-9][0-9].mp4 | sed 's|cache/||; s|^|file |' > cache/$j.txt
  ffmpeg -v error -y -f concat -safe 0 -i cache/$j.txt -c copy cache/$j.mp4
done
mkdir -p public/img
rm -f public/clean.mp4; ln cache/clean.mp4 public/clean.mp4          # hardlink: Remotion can't follow symlinks out of public/
# speaker cut-out: matte choked slightly so the painting doesn't halo his hair
ffmpeg -v error -y -i cache/clean.mp4 -i cache/matte.mp4 -filter_complex \
  "[1:v]format=gray,lut=y='clip((val-50)*1.3\,0\,255)',erosion,gblur=sigma=1.2[m];[0:v][m]alphamerge,format=yuva420p" \
  -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 22 -row-mt 1 -deadline good -cpu-used 4 -an public/fg.webm
python3 scripts/last_frames.py
npx tsx scripts/beats.ts > plan/beats.json
python3 scripts/audio.py cache/demucs/htdemucs/orig/vocals.wav public/mix.wav
