#!/usr/bin/env bash
# Footage for the edit, from cache/ (after the clean_captions.py chunks and matte.py): public/clean.mp4, public/fg.webm,
# freeze frames, beats, mix.
set -euo pipefail
cd "$(dirname "$0")/.."
# chunks a b c d = frames 0-219, 220-439, 440-659, 660-879 (720x1280 @ 24) → one clean plate, upscaled to 1080x1920 @ 30 like src1080.mp4
printf "file %s\n" clean_a.mp4 clean_b.mp4 clean_c.mp4 clean_d.mp4 > cache/concat.txt
ffmpeg -v error -y -f concat -safe 0 -i cache/concat.txt -vf "fps=30,scale=1080:1920:flags=lanczos,unsharp=5:5:0.6" \
  -c:v libx264 -crf 12 -pix_fmt yuv420p cache/clean.mp4
rm -f public/clean.mp4; ln cache/clean.mp4 public/clean.mp4          # hardlink: Remotion can't follow symlinks out of public/
# speaker cut-out: matte choked (lut + erosion) so the wall doesn't halo his head over the type behind him
ffmpeg -v error -y -i cache/clean.mp4 -i cache/matte.mp4 -filter_complex \
  "[1:v]format=gray,lut=y='clip((val-60)*1.4\,0\,255)',erosion,gblur=sigma=1.2[m];[0:v][m]alphamerge,format=yuva420p" \
  -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 20 -row-mt 1 -an public/fg.webm
python3 scripts/last_frames.py
npx tsx scripts/beats.ts > plan/beats.json
python3 scripts/audio.py cache/demucs/htdemucs/orig/vocals.wav public/mix.wav
