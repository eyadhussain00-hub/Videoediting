#!/bin/sh
# Rebuild the Tilt-Shift version from scratch: sh projects/mars-terraform/tiltshift/build.sh
# Needs the Lemo-Opuscar library (sh .claude/skills/lemo-opuscar/scripts/setup.sh; then `deps music`
# and `sh tools/fetch.sh instruments vcsl` + `freepats` from the library root).
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$HOME/lemo-opuscar}; export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
SIZE=1080x1920; WK=${WORKERS:-3}; SSAA=${SSAA:-1.5}
cd "$LIB"
node core/render/events.mjs "$HERE" --size $SIZE --q ssaa=1
"$LIB/.venv/bin/python" "$HERE/music/score.py"
"$LIB/.venv/bin/python" "$HERE/mix.py"
"$LIB/.venv/bin/python" "$HERE/../shared/srt.py" "$HERE/timeline.json" "$HERE/mars-tiltshift.srt"
node core/render/video.mjs "$HERE" --fps 24 --workers $WK --size $SIZE --q "noev&ssaa=$SSAA" --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/mars-tiltshift.mp4" 24 1
node core/render/still.mjs "$HERE" 44 --size $SIZE --q "noev&nohud&ssaa=$SSAA" --prefix poster_ --out "$HERE/out"
cp "$HERE/out/poster_44.jpg" "$HERE/poster.jpg"
echo "done: $HERE/mars-tiltshift.mp4"
