#!/usr/bin/env bash
# Resumable chunked runs of the slow per-frame jobs (a container restart only loses the chunk in flight).
#   bash scripts/run_chunks.sh clean   → cache/clean/NNNN.mp4 (150-frame chunks, 3 in parallel)
#   bash scripts/run_chunks.sh matte   → cache/matte/NNNN.mp4 (500-frame chunks)
# Run it again after an interruption; finished chunks are skipped. Then scripts/build_media.sh concatenates them.
set -uo pipefail
cd "$(dirname "$0")/.."
JOB=$1; N=3011
case $JOB in clean) STEP=150; P=3;; matte) STEP=500; P=1;; esac
mkdir -p cache/$JOB
seq 0 $STEP $((N - 1)) | xargs -P $P -I{} bash -c '
  a={}; b=$((a + '$STEP')); out=cache/'$JOB'/$(printf %04d $a).mp4
  [ -s "$out" ] && exit 0
  if [ '$JOB' = clean ]; then python3 scripts/clean_captions.py cache/src.mp4 "${out%.mp4}.tmp.mp4" --range $a $b --threads 1 > "${out%.mp4}.log" 2>&1
  else python3 scripts/matte.py cache/src.mp4 "${out%.mp4}.tmp.mp4" --range $a $b > "${out%.mp4}.log" 2>&1; fi \
    && mv "${out%.mp4}.tmp.mp4" "$out" && echo "done $out"'
