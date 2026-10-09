#!/usr/bin/env bash
# Usage: SESSION_URL=<this session's link> deliver.sh final.mp4 "<Title>" v<ver> "<what changed>" [<existing export file id>]
# Copies to output/ceowills/ (git-ignored), makes a <29 MB preview if needed, sends it to Telegram (tools/tg.sh)
# with one caption Eyad can act on from his phone, and prints the Drive upload step:
#   no 5th argument  → first version of this video: a new file in Export
#   5th argument     → a new version of a video already in Export: replace that file in place (same link, nothing binned)
set -euo pipefail
F="$1"; TITLE="$2"; VER="$3"; MSG="${4:-}"; EXISTING="${5:-}"
HERE="$(cd "$(dirname "$0")" && pwd)"; REPO="${REPO:-$(cd "$HERE/../.." && pwd)}"; OUT="$REPO/output/ceowills"; mkdir -p "$OUT"
ffprobe -v error -show_entries format=duration -of csv=p=0 "$F" | grep -q '[0-9]' \
  || { echo "deliver: $F has no duration (render died?) — re-render first" >&2; exit 1; }
NAME="CEOwills - $TITLE - $VER.mp4"; cp "$F" "$OUT/$NAME"; PREV="$OUT/$NAME"
SIZE=$(stat -c %s "$F")
if [ "$SIZE" -gt $((29*1024*1024)) ]; then
  PREV="$OUT/preview - $TITLE - $VER.mp4"
  bash "$HERE/../common/preview.sh" "$F" "$PREV" 29
fi
echo "file: $OUT/$NAME ($(du -h "$OUT/$NAME" | cut -f1)) — send it with SendUserFile"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$F" | awk '{printf "%d:%02d", $1/60, $1%60}')
[ -n "${SESSION_URL:-}" ] || echo "deliver: SESSION_URL not set — the caption won't link back to this session" >&2
bash "$HERE/../tg.sh" video "$PREV" "✓ CEOwills – ${TITLE} · ${VER} · ${DUR}
${MSG}
Reply in the session: \"upload\" or the changes you want${SESSION_URL:+
${SESSION_URL}}" || echo "telegram: preview not sent — see the error above; the file is still in $OUT"
if [ -z "$EXISTING" ]; then cat <<DRIVE
drive (new video): upload "$NAME" to RSV Video / Adnan / Export / (folder 143ZMKFEg4NSxAnCI9uWsLkUlGbEt03-D)
  Make "Drive: start resumable upload (any file)" (7630409) with name="$NAME", parentId=143ZMKFEg4NSxAnCI9uWsLkUlGbEt03-D,
  size=$SIZE, mime=video/mp4 → it writes upload-session-$NAME.txt in Export → LOCATION = its URL (read it with download_file_content: read_file_content escapes & and _ in the URL) →
  curl -X PUT -H "Content-Type: video/mp4" --data-binary @"$F" "<LOCATION>"
DRIVE
else cat <<DRIVE
drive (new version, same link): replace file $EXISTING in place and rename it to "$NAME"
  Make "Drive: replace file (resumable, keeps the link)" (7680385) with fileId=$EXISTING, name="$NAME",
  parentId=143ZMKFEg4NSxAnCI9uWsLkUlGbEt03-D, size=$SIZE, mime=video/mp4 → it writes upload-session-$NAME.txt in Export → LOCATION as above →
  curl -X PUT -H "Content-Type: video/mp4" --data-binary @"$F" "<LOCATION>"
  (free Make plan: 2 active scenarios — 7630409 + 7680385; the old SK-only 7619259 was switched off 29 Sep)
DRIVE
fi
cat <<DRIVE
  then: Drive get_file_metadata → fileSize must be $SIZE; trash only the upload-session-*.txt.
  Make runs need Eyad's tap in the Claude app → tg.sh msg "🔐 …" first (or say it in the preview caption).
  Drive full? ("caller does not have permission" even for a tiny file) → don't retry: one tg.sh msg to Eyad, keep the
  file here; the Telegram preview stands in until there's space.
DRIVE
