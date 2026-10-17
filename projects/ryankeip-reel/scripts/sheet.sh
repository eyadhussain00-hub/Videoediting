#!/usr/bin/env bash
# Contact sheet for a time range: scripts/sheet.sh FROM TO [every_nth=4] [scale=0.25]
# Renders the range small with Remotion, tiles every nth frame with a timestamp → renders/previews/sheet_FROM-TO.jpg
set -euo pipefail
cd "$(dirname "$0")/.."
A=$1; B=$2; N=${3:-4}; S=${4:-0.25}
F0=$(python3 -c "print(round($A*30))"); F1=$(python3 -c "print(round($B*30)-1)")
D=cache/seq_${A//./p}_${B//./p}; rm -rf "$D"; mkdir -p "$D" renders/previews
npx remotion render Reel "$D" --sequence --frames=$F0-$F1 --scale=$S --image-format=jpeg --log=error --concurrency=2 >/dev/null
python3 - "$D" "$N" "$F0" "renders/previews/sheet_${A}-${B}.jpg" <<'PY'
import sys, os, re
from PIL import Image, ImageDraw
d, n, f0, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
fs = sorted(f for f in os.listdir(d) if f.endswith(".jpeg"))[::n]
nums = [int(re.findall(r"\d+", f)[-1]) for f in fs]
off = 0 if nums and min(nums) >= f0 else f0  # Remotion names frames absolutely or from 0
ims = [Image.open(os.path.join(d, f)) for f in fs]
w, h = ims[0].size; cols = 8; rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (cols * w, rows * h), "black")
for k, (im, num) in enumerate(zip(ims, nums)):
    x, y = (k % cols) * w, (k // cols) * h
    sheet.paste(im, (x, y))
    ImageDraw.Draw(sheet).rectangle([x, y, x + 70, y + 22], fill="black")
    ImageDraw.Draw(sheet).text((x + 4, y + 4), f"{(num + off) / 30:.2f}", fill="yellow")
sheet.save(out, quality=88)
print(out, len(ims), "frames")
PY
