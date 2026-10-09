#!/usr/bin/env bash
# Shared Drive downloader (all clients). Files must be link-shared ("Anyone with the link").
# Usage: fetch.sh ids.txt <dest>     ids.txt lines: <drive_file_id> <filename>   (names may contain spaces, commas, quotes)
#        fetch.sh --pairs            reads NUL-separated "<id>\0<dest path>\0" pairs on stdin (used by client wrappers)
# 4 downloads at once, retries, rejects HTML sign-in pages, skips files already downloaded (cache = the file itself).
set -euo pipefail
dl(){
  id="$1"; out="$2"; name="$(basename "$out")"
  [ -s "$out" ] && { echo "cached  $name"; return; }
  mkdir -p "$(dirname "$out")"
  curl -sfL --retry 3 "https://drive.usercontent.google.com/download?id=$id&export=download&confirm=t" -o "$out.part" \
    || { rm -f "$out.part"; echo "FAIL    $name — download error (wrong id or no access)"; return 1; }
  if head -c 512 "$out.part" | grep -qi '<html'; then
    rm -f "$out.part"; echo "FAIL    $name — got an HTML page (not shared 'Anyone with the link'?)"; return 1
  fi
  mv "$out.part" "$out"; echo "ok      $name ($(du -h "$out" | cut -f1))"
}
export -f dl
if [ "${1:-}" = "--pairs" ]; then xargs -0 -n2 -P4 bash -c 'dl "$0" "$1"'; exit; fi
LIST="${1:?ids.txt}"; DEST="${2:?dest}"; mkdir -p "$DEST"
while read -r id name; do    # NUL-separated so names with spaces survive (xargs -L1 used to cut them at the first space)
  [ -n "$id" ] && printf '%s\0%s\0' "$id" "$DEST/$name"
done < "$LIST" | xargs -0 -n2 -P4 bash -c 'dl "$0" "$1"'
