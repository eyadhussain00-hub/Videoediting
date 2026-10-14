#!/usr/bin/env bash
# Usage: preview.sh <in.mp4> <out.mp4> [MB=29]
# 2-pass H.264 that fits in MB (Telegram's Bot API caps uploads at 50 MB — use ≤46 there). Same length, AAC 160k,
# rotation flags applied so vertical footage comes out upright, +faststart for streaming.
set -euo pipefail
IN="$(realpath "$1")"; OUT="$(realpath -m "$2")"; MB="${3:-29}"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
VB=$(python3 -c "print(max(300, int($MB * 8 * 1024 * 0.97 / $DUR - 160)))")      # kb/s for video, 3% mux overhead
X=(-c:v libx264 -preset medium -b:v "${VB}k" -maxrate "$((VB * 14 / 10))k" -bufsize "$((VB * 2))k")
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
cd "$TMP"
ffmpeg -v error -y -i "$IN" -map 0:v:0 "${X[@]}" -pass 1 -an -f mp4 /dev/null
ffmpeg -v error -y -i "$IN" -map 0:v:0 -map '0:a:0?' "${X[@]}" -pass 2 -c:a aac -b:a 160k -movflags +faststart "$OUT"
echo "preview: $OUT ($(du -h "$OUT" | cut -f1), video ${VB} kb/s)"
