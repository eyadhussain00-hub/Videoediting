#!/usr/bin/env bash
# Resumable heavy passes: caption removal and speaker matte in 150-frame chunks (cache/chunks/*.mp4, a .done marker each),
# two lanes at a time, so a container restart only loses the chunk in flight. Rerun to resume.
# Then: bash scripts/run_chunks.sh join  → cache/clean.mp4 + cache/matte.mp4
set -uo pipefail
cd "$(dirname "$0")/.."
mkdir -p cache/chunks
N=2250; C=150
if [ "${1:-}" = join ]; then
  for k in clean matte; do
    : > cache/chunks/$k.txt
    for ((a=0; a<N; a+=C)); do echo "file $k-$a.mp4" >> cache/chunks/$k.txt; done
    ffmpeg -v error -y -f concat -safe 0 -i cache/chunks/$k.txt -c copy cache/$k.mp4
  done
  exit
fi
job() {  # kind start
  local k=$1 a=$2 b=$(( $2 + C )); local o=cache/chunks/$k-$a.mp4
  [ -f $o.done ] && return
  if [ $k = clean ]; then python3 scripts/clean_captions.py cache/src.mp4 $o --range $a $b --threads 2 > $o.log 2>&1
  else python3 scripts/matte.py cache/src.mp4 $o --start $a --limit $C > $o.log 2>&1; fi
  [ $? -eq 0 ] && touch $o.done
}
lane() { for a in "$@"; do job clean $a; done; }
A=(); B=(); i=0
for ((a=0; a<N; a+=C)); do if ((i++ % 2)); then B+=($a); else A+=($a); fi; done
lane "${A[@]}" & lane "${B[@]}" & wait
for ((a=0; a<N; a+=C)); do job matte $a; done
echo ALL DONE
