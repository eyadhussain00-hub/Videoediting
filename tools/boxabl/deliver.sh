#!/usr/bin/env bash
# Usage: SESSION_URL=<this session's link> deliver.sh <ws>/out/<name>.mp4 "<Title>" v<ver> "<what changed>"
# Copies the clip + its posting text to output/boxabl/ (git-ignored), makes a <29 MB preview if needed,
# and sends it to Telegram (tools/tg.sh) with the ready-to-paste captions, ending with this session's link.
# Clips are posted by the account handler (TikTok / Reels / Shorts / X), not uploaded to the client — there is no
# client Export folder. Also hand the files over in the session with SendUserFile.
set -euo pipefail
F="$1"; TITLE="$2"; VER="$3"; MSG="${4:-}"
HERE="$(cd "$(dirname "$0")" && pwd)"; REPO="${REPO:-$(cd "$HERE/../.." && pwd)}"; OUT="$REPO/output/boxabl"; mkdir -p "$OUT"
ffprobe -v error -show_entries format=duration -of csv=p=0 "$F" | grep -q '[0-9]' \
  || { echo "deliver: $F has no duration (render died?) — re-render first" >&2; exit 1; }
STEM="${F%.mp4}"; BASE="$(basename "$STEM")"
NAME="BOXABL - $BASE - $VER.mp4"; cp "$F" "$OUT/$NAME"; PREV="$OUT/$NAME"
[ -f "$STEM.post.md" ] && cp "$STEM.post.md" "$OUT/BOXABL - $BASE - $VER.post.md"
if [ "$(stat -c %s "$F")" -gt $((29*1024*1024)) ]; then
  PREV="$OUT/preview - $BASE - $VER.mp4"; bash "$HERE/../common/preview.sh" "$F" "$PREV" 29
fi
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$F" | awk '{printf "%d:%02d", $1/60, $1%60}')
POST=""; [ -f "$STEM.post.md" ] && POST="$(sed -n 's/^> //p' "$STEM.post.md" | head -2 | sed '1s/^/TikTok\/Reels\/Shorts: /;2s/^/X: /')"
[ -n "${SESSION_URL:-}" ] || echo "deliver: SESSION_URL not set — the caption won't link back to this session" >&2
bash "$HERE/../tg.sh" video "$PREV" "✓ BOXABL – ${TITLE} · ${VER} · ${DUR}
${MSG}
${POST}
X: replace [TRACKING URL] with the tracking link. Reply in the session: \"ok\" or the changes you want${SESSION_URL:+
${SESSION_URL}}" || echo "telegram: preview not sent — see the error above; the file is still in $OUT"
echo "file: $OUT/$NAME ($(du -h "$OUT/$NAME" | cut -f1)) — also send it with SendUserFile (+ the .post.md)"
