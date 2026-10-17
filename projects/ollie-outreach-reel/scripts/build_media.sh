#!/usr/bin/env bash
# Footage for the edit, from cache/ (after the clean_captions.py chunks a/b/c and the --tight b2/d1-d3): public/clean.mp4 (1080x1920),
# public/fg.webm (speaker cut-out for the hook only), the end-hold freeze frames, beats.json, the mix.
# CLEAN=cache/src.mp4 bash scripts/build_media.sh builds a layout preview from the uncleaned source.
set -euo pipefail
cd "$(dirname "$0")/.."
if [ -z "${CLEAN:-}" ]; then
  # chunks overlap by one frame at each seam: a = 0-609, b = 609-1219, c = 1219-end
  ffmpeg -v error -y -i cache/clean_a.mp4 -frames:v 609 -c:v libx264 -crf 12 -pix_fmt yuv420p cache/clean_at.mp4
  ffmpeg -v error -y -i cache/clean_b.mp4 -frames:v 610 -c:v libx264 -crf 12 -pix_fmt yuv420p cache/clean_bt.mp4
  printf 'file %s\n' clean_at.mp4 clean_bt.mp4 clean_c.mp4 > cache/concat.txt
  ffmpeg -v error -y -f concat -safe 0 -i cache/concat.txt -c copy cache/clean720.mp4
  python3 scripts/splice.py      # --tight re-runs: b2 = 101-330, d1..d3 = 1000-1573
  python3 scripts/fix_residue.py # two words CRAFT missed in the lounger shot
  CLEAN=cache/clean720f.mp4
fi
# 720p source → 1080p: lanczos + a light unsharp so the upscale doesn't read soft
ffmpeg -v error -y -i "$CLEAN" -vf "scale=1080:1920:flags=lanczos,unsharp=5:5:0.6:5:5:0" -c:v libx264 -crf 14 -preset medium -pix_fmt yuv420p -r 30 cache/clean.mp4
rm -f public/clean.mp4; ln cache/clean.mp4 public/clean.mp4          # hardlink: Remotion can't follow symlinks out of public/
# speaker cut-out, hook shot only (first 105 frames): the $5K sits behind his head
python3 scripts/matte.py cache/clean.mp4 cache/matte.mp4 --limit 105
ffmpeg -v error -y -i cache/clean.mp4 -i cache/matte.mp4 -filter_complex \
  "[1:v]format=gray,lut=y='clip((val-60)*1.4\,0\,255)',erosion,gblur=sigma=1.2[m];[0:v]trim=end_frame=105[v];[v][m]alphamerge,format=yuva420p" \
  -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 20 -row-mt 1 -an public/fg.webm
python3 scripts/last_frame.py
npx tsx scripts/beats.ts > plan/beats.json
python3 scripts/audio.py cache/demucs/htdemucs/orig/vocals.wav public/mix.wav
