#!/usr/bin/env bash
# Stills at given times (s) → cache/stills/sheet.jpg (4 per row, 0.4 scale). Usage: scripts/stills.sh 0.5 1.9 3.2 …
set -euo pipefail
cd "$(dirname "$0")/.."
D=cache/stills; rm -rf "$D"; mkdir -p "$D"
for t in "$@"; do
  f=$(python3 -c "print(round($t*30))")
  npx remotion still Reel "$D/$(printf %06.2f "$t").jpg" --frame=$f --scale=0.4 --image-format=jpeg --log=error >/dev/null
done
python3 - "$D" <<'PY'
import sys, os
from PIL import Image, ImageDraw
d = sys.argv[1]; fs = sorted(f for f in os.listdir(d) if f.endswith(".jpg"))
ims = [Image.open(os.path.join(d, f)) for f in fs]; w, h = ims[0].size; cols = 4; rows = (len(ims) + cols - 1) // cols
s = Image.new("RGB", (cols * w, rows * h), "black")
for k, (im, f) in enumerate(zip(ims, fs)):
    x, y = (k % cols) * w, (k // cols) * h; s.paste(im, (x, y))
    ImageDraw.Draw(s).rectangle([x, y, x + 64, y + 20], fill="black"); ImageDraw.Draw(s).text((x + 4, y + 4), f[:-4], fill="yellow")
s.save(os.path.join(d, "sheet.jpg"), quality=85); print(os.path.join(d, "sheet.jpg"))
PY
