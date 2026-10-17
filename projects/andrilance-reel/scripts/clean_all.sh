#!/usr/bin/env bash
# Runs clean_captions.py over the whole source in 200-frame chunks, two at a time, skipping chunks already done
# (a container restart only loses the chunks in flight), then concatenates → cache/clean.mp4.
set -uo pipefail
cd "$(dirname "$0")/.."
N=4024; STEP=200
run() {
  local a=$1 b=$(( $1 + STEP )); local o=cache/chunks/c_$(printf %05d $a).mp4
  [ -f "$o.ok" ] && return
  python3 scripts/clean_captions.py cache/src.mp4 "$o" --range $a $b --threads 2 > "$o.log" 2>&1 && touch "$o.ok"
}
starts=$(seq 0 $STEP $((N-1)))
set -- $starts
while [ $# -gt 0 ]; do
  run $1 & 
  if [ $# -gt 1 ]; then run $2 & fi
  wait; shift; [ $# -gt 0 ] && shift
done
ls cache/chunks/*.mp4 | sort | sed 's|cache/chunks/|file chunks/|' | sed "s|^file |file |" > cache/chunks.txt
sed -i 's|^file chunks/|file chunks/|' cache/chunks.txt
ffmpeg -v error -y -f concat -safe 0 -i cache/chunks.txt -c copy cache/clean.mp4 && echo concat-done
