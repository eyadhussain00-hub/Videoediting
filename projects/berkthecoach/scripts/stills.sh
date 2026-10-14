#!/usr/bin/env bash
# Render stills at the given seconds and tile them into cache/stills/sheet.jpg. Usage: bash scripts/stills.sh 0.5 2 6.5 …
set -e
cd "$(dirname "$0")/.."
npx remotion bundle --out-dir cache/bundle >/dev/null 2>&1 || true
files=()
for s in "$@"; do
  f=$(python3 -c "print(round($s*30))")
  npx remotion still Reel "cache/stills/s_$s.jpg" --frame="$f" --image-format=jpeg --log=error >/dev/null
  files+=("cache/stills/s_$s.jpg")
done
n=${#files[@]}
inputs=(); for f in "${files[@]}"; do inputs+=(-i "$f"); done
cols=$(( n < 4 ? n : 4 )); rows=$(( (n + cols - 1) / cols ))
ffmpeg -v error -y "${inputs[@]}" -filter_complex "$(for i in $(seq 0 $((n-1))); do printf "[%d:v]scale=360:-1[v%d];" $i $i; done)$(for i in $(seq 0 $((n-1))); do printf "[v%d]" $i; done)xstack=inputs=$n:layout=$(python3 -c "
c=$cols;n=$n
print('|'.join(f'{(i%c)*360}_{(i//c)*640}' for i in range(n)))")$( [ $n -lt $((cols*rows)) ] && echo ":fill=black" )" cache/stills/sheet.jpg
echo cache/stills/sheet.jpg
