#!/usr/bin/env bash
# Cut-out subject layer: clean plate + person matte (eroded 1 px, feathered) → VP9 WebM with alpha, drawn over the big words.
set -euo pipefail
cd "$(dirname "$0")/.."
ffmpeg -v error -y -i public/clean.mp4 -i public/matte.mp4 -filter_complex \
  "[1]format=gray,erosion,gblur=sigma=1.4[m];[0][m]alphamerge,format=yuva420p" \
  -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 26 -row-mt 1 -deadline good -cpu-used 5 -auto-alt-ref 0 public/fg.webm
echo "fg.webm ok"
