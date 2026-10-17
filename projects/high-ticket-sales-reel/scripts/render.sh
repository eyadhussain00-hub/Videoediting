#!/usr/bin/env bash
# Full render → renders/final/hts_<v>.mp4 (H.264 crf 17, AAC 192k) + a Telegram-size preview (<50 MB).
set -euo pipefail
cd "$(dirname "$0")/.."
V=${1:-v1}; mkdir -p renders/final renders/previews
npx remotion render Reel cache/${V}_raw.mp4 --concurrency=${CONC:-4} --log=error
ffmpeg -v error -y -i cache/${V}_raw.mp4 -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 192k renders/final/hts_${V}.mp4
ffmpeg -v error -y -i cache/${V}_raw.mp4 -c:v libx264 -preset slow -b:v 9M -maxrate 11M -bufsize 18M -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 160k renders/previews/hts_${V}_preview.mp4
ls -la renders/final renders/previews
