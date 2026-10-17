#!/usr/bin/env bash
# Full render → renders/final/ryankeip_<v>.mp4 (H.264 crf 17, AAC 192k) + a Telegram-size preview (<50 MB).
set -euo pipefail
cd "$(dirname "$0")/.."
V=${1:-v1}; mkdir -p renders/final renders/previews
npx remotion render Reel cache/${V}_raw.mp4 --concurrency=${CONC:-4} --log=error
ffmpeg -v error -y -i cache/${V}_raw.mp4 -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 192k renders/final/ryankeip_${V}.mp4
ffmpeg -v error -y -i cache/${V}_raw.mp4 -c:v libx264 -preset slow -b:v 3500k -maxrate 4500k -bufsize 7000k -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 128k renders/previews/ryankeip_${V}_tg.mp4
ls -la renders/final renders/previews
