#!/usr/bin/env bash
# Usage: audio.sh in.wav out.wav   — voice master: HPF → denoise → comp → LPF → two-pass loudnorm (-14 LUFS, TP -2)
set -euo pipefail
IN="$1"; OUT="$2"
PRE="highpass=f=80,afftdn=nf=-25,acompressor=threshold=-20dB:ratio=3:attack=5:release=80:makeup=3,lowpass=f=16000"
# Quiet recordings need more gain than the -2 dBTP ceiling allows, which silently drops loudnorm into
# "dynamic" mode and undershoots (TJR V3: -16.6 LUFS). So: gain + limiter at -2.5 dBFS, iterated until the
# limited signal sits ~1 dB above target; linear loudnorm then only trims down and stays linear.
meas(){ ffmpeg -hide_banner -nostats -i "$IN" -af "$1,ebur128" -f null - 2>&1 | grep -oP 'I:\s+\K-?[\d.]+(?= LUFS)' | tail -1; }
G=$(python3 -c "print(round(-13 - $(meas "$PRE"), 2))")
for _ in 1 2 3; do
  I1=$(meas "$PRE,volume=${G}dB,alimiter=limit=0.75:attack=3:release=60:level=disabled")
  G=$(python3 -c "d=-13-$I1; print(round($G+d*1.3, 2)) if abs(d)>0.3 else print($G)")
done
PRE="$PRE,volume=${G}dB,alimiter=limit=0.75:attack=3:release=60:level=disabled"
M=$(ffmpeg -hide_banner -nostats -i "$IN" -af "$PRE,loudnorm=I=-14:TP=-2:LRA=11:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
g(){ echo "$M" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -hide_banner -y -loglevel error -i "$IN" -af "$PRE,loudnorm=I=-14:TP=-2:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true" -ar 48000 "$OUT"
IO=$(ffmpeg -hide_banner -nostats -i "$OUT" -af ebur128 -f null - 2>&1 | grep -oP 'I:\s+\K-?[\d.]+(?= LUFS)' | tail -1)
python3 -c "import sys; sys.exit(abs($IO + 14) > 0.5)" || echo "WARNING: output is $IO LUFS, not -14"
echo "mastered → $OUT (pre-gain ${G} dB)"
