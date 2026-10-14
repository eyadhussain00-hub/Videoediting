#!/usr/bin/env bash
# Usage: SESSION_URL=<this session's link> deliver.sh final.mp4 "<Subject>" <N> v<ver> "<what changed>" [<existing export file id>]
# Preview < 29 MB → Telegram (tools/tg.sh, caption ends with the session link) + chat; full quality → Drive
# (Eyad's RSV Video/SK/<Subject>/Video <N>/Export/, never the client's FUNNEL BREAKDOWNS) with a size check.
# 6th argument = the export already in Drive → replace it in place (same link) instead of adding a file.
set -euo pipefail
F="$1"; SUBJ="$2"; N="$3"; VER="$4"; MSG="${5:-}"; EXISTING="${6:-}"
HERE="$(cd "$(dirname "$0")" && pwd)"; REPO="${REPO:-$(cd "$HERE/../.." && pwd)}"; OUT="$REPO/output/sk-media"; mkdir -p "$OUT"
ffprobe -v error -show_entries format=duration -of csv=p=0 "$F" | grep -q '[0-9]' \
  || { echo "deliver: $F has no duration (render died?) — re-render first" >&2; exit 1; }
NAME="$SUBJ - Video $N.mp4"; SIZE=$(stat -c %s "$F"); cp "$F" "$OUT/$NAME"
PREV="$OUT/preview - $SUBJ - Video $N - $VER.mp4"
bash "$HERE/../common/preview.sh" "$F" "$PREV" 29
echo "preview → attach in chat: $PREV"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$F" | awk '{printf "%d:%02d", $1/60, $1%60}')
[ -n "${SESSION_URL:-}" ] || echo "deliver: SESSION_URL not set — the caption won't link back to this session" >&2

tg(){ bash "$HERE/../tg.sh" video "$PREV" "✓ ${SUBJ} – Video ${N} · ${VER} · ${DUR}
${MSG}
Reply in the session: \"upload\" or the changes you want${SESSION_URL:+
${SESSION_URL}}" || echo "telegram: preview not sent — see the error above"; }

drive(){ if [ -n "${RCLONE_REMOTE:-}" ] && command -v rclone >/dev/null; then
    DEST="${RCLONE_REMOTE}:RSV Video/SK/${SUBJ_FOLDER:-$SUBJ}/Video ${N}/Export/${NAME}"
    rclone copyto "$F" "$DEST" --drive-chunk-size 64M
    R=$(rclone size --json "$DEST" | python3 -c "import json,sys;print(json.load(sys.stdin)['bytes'])")
    [ "$SIZE" = "$R" ] && echo "drive: uploaded + verified ($SIZE bytes)" || echo "drive: SIZE MISMATCH local $SIZE remote $R — do not delete anything"
  elif [ -z "$EXISTING" ]; then cat <<MAKE
drive (new video): RSV Video / SK / ${SUBJ_FOLDER:-$SUBJ} / Video ${N} / Export / "${NAME}"  (create Export with the Drive connector if missing)
  Make "Drive: start resumable upload (any file)" (7630409) with name="${NAME}", parentId=<Export id>, size=$SIZE,
  mime=video/mp4 → it writes upload-session-${NAME}.txt in Export → LOCATION = its URL (read it with download_file_content: read_file_content escapes & and _ in the URL) →
  curl -X PUT -H "Content-Type: video/mp4" --data-binary @"$F" "<LOCATION>"
MAKE
  else cat <<MAKE
drive (new version, same link): replace $EXISTING in place
  Make "Drive: replace file (resumable, keeps the link)" (7680385) with fileId=$EXISTING, name="${NAME}",
  parentId=<Export id>, size=$SIZE, mime=video/mp4 → upload-session-${NAME}.txt in Export → LOCATION as above →
  curl -X PUT -H "Content-Type: video/mp4" --data-binary @"$F" "<LOCATION>"
MAKE
  fi
  [ -n "${RCLONE_REMOTE:-}" ] || echo "  then: get_file_metadata fileSize must be $SIZE; trash only the upload-session-*.txt. Make runs need Eyad's tap → tg.sh msg \"🔐 …\" first."; }

tg & drive & wait
echo "done — bump the version after this ($VER delivered)"
