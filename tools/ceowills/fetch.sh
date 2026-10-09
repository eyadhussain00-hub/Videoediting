#!/usr/bin/env bash
# Usage: fetch.sh ids.txt <dest>          ids.txt lines: <drive_file_id> <filename>   (names may contain spaces/commas)
#        fetch.sh --map "<video>" <ws>    that video + its lav-mic part (from mic_map.json, Adnan's originals)
#                                         → <ws>/src/<video> and <ws>/mic/<part>; prints the match_mic.py line to run
# Parallel downloads from drive.usercontent.google.com (files must be link-shared), rejects HTML sign-in pages, caches.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
COMMON="$HERE/../common/fetch.sh"   # the shared downloader: parallel, retries, rejects HTML pages, caches

if [ "${1:-}" = "--map" ]; then
  VID="${2:?video name}"; WS="${3:?workspace}"
  # prints NUL-separated "<id> <dest path>" pairs for the video and its mic part
  python3 - "$HERE" "$VID" "$WS" <<'EOF' | bash "$COMMON" --pairs
import json, sys
sys.path.insert(0, sys.argv[1]); from match_mic import norm
want, ws = norm(sys.argv[2]), sys.argv[3]
# accept the exact file name, the tracker number n ("6"), or any part of the name that picks one video (board names differ)
allv = [(shoot, v) for shoot in json.load(open(f"{sys.argv[1]}/mic_map.json"))["shoots"].values() for v in shoot["videos"]]
hits = ([sv for sv in allv if norm(sv[1]["file"]) == want] or
        [sv for sv in allv if sys.argv[2].strip().isdigit() and sv[1]["n"] == int(sys.argv[2])] or
        [sv for sv in allv if want and want in norm(sv[1]["file"])])
if len(hits) > 1: sys.exit(f"'{sys.argv[2]}' matches {len(hits)} videos: " + "; ".join(v["file"] for _, v in hits))
for shoot, v in hits:
    sys.stdout.write(f"{v['client_id']}\0{ws}/src/{v['file']}\0")
    if v["mic"]:
        m = shoot["mic_parts"][v["mic"]]
        sys.stdout.write(f"{m['client_id']}\0{ws}/mic/{m['file']}\0")
        print(f"next: python3 {sys.argv[1]}/match_mic.py '{ws}/src/{v['file']}' --mics {ws}/mic --out {ws}/mic --map",
              file=sys.stderr)
    else:
        print(f"NO MIC for this video: {v.get('note', '')}", file=sys.stderr)
    sys.exit(0)
sys.exit(f"'{sys.argv[2]}' is not in mic_map.json — search Drive for it and use an ids.txt")
EOF
  exit
fi

exec bash "$COMMON" "$@"
