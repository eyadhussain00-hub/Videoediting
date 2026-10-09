#!/usr/bin/env bash
# Telegram notifications for video work (all clients). Silent no-op if no credentials.
# Usage:
#   tg.sh msg   "<text>"                       step done / blocked / needs Eyad's input or approval
#   tg.sh video <file.mp4> "<caption>"         preview video (<50 MB — the Bot API upload limit)
#   tg.sh photo <file.jpg> "<caption>"         contact sheet / still
#   tg.sh doc   <file>     "<caption>"         any file (<50 MB)
#   tg.sh wait  <minutes> [since_epoch]         print Eyad's next Telegram reply (only from TELEGRAM_CHAT_ID); exit 3 = no reply
# Credentials: TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID from the environment settings, or ~/.sk-media.env.
# Prints "telegram: ok" or Telegram's own error text; exits 1 on failure so callers notice.
set -uo pipefail
# strip stray quotes/whitespace pasted into the environment settings
TELEGRAM_BOT_TOKEN="$(printf %s "${TELEGRAM_BOT_TOKEN:-}" | tr -d " \t\r\n\"'<>")"
TELEGRAM_CHAT_ID="$(printf %s "${TELEGRAM_CHAT_ID:-}" | tr -d " \t\r\n\"'<>")"
ok(){ [ -n "$TELEGRAM_BOT_TOKEN" ] && curl -s -m 8 "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe" | grep -q '"ok":true'; }
if ! ok && [ -f ~/.sk-media.env ]; then   # env token missing or rejected → fall back to the saved one
  [ -n "$TELEGRAM_BOT_TOKEN" ] && echo "telegram: environment token rejected — using ~/.sk-media.env" >&2
  set -a; . ~/.sk-media.env; set +a
fi
[ -n "${TELEGRAM_BOT_TOKEN:-}" ] && [ -n "${TELEGRAM_CHAT_ID:-}" ] || { echo "telegram: skipped (no credentials)"; exit 0; }
API="https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}"
kind="${1:?msg|video|photo|doc}"; shift

send(){   # send <method> <curl form args…> — prints ok or Telegram's error description
  local r; r=$(curl -s -m 600 -X POST "$API/$1" --form-string "chat_id=${TELEGRAM_CHAT_ID}" "${@:2}")
  if printf %s "$r" | grep -q '"ok":true'; then echo "telegram: ok"; return 0; fi
  echo "telegram: FAILED $1 — $(printf %s "$r" | sed -n 's/.*"description":"\([^"]*\)".*/\1/p' | head -c 300)" >&2
  [ -z "$r" ] && echo "telegram: no response (network/proxy) — check api.telegram.org is reachable" >&2
  return 1
}
file_arg(){   # curl -F needs the path quoted when it contains , or ;
  local f="$1"
  [ -f "$f" ] || { echo "telegram: no such file: $f" >&2; exit 1; }
  local sz; sz=$(stat -c %s "$f")
  [ "$sz" -le $((50*1024*1024)) ] || { echo "telegram: $(basename "$f") is $((sz/1024/1024)) MB — Bot API limit is 50 MB; send a preview or a Drive link" >&2; exit 1; }
  printf '@"%s"' "${f//\"/\\\"}"
}

case "$kind" in
  msg)   send sendMessage --form-string "text=${1:0:4000}" ;;
  video) f=$(file_arg "$1") || exit 1
         # width/height/duration as displayed (after any rotation flag) so vertical videos show upright and uncropped
         read -r w h rot d < <(ffprobe -v error -select_streams v:0 -show_entries stream=width,height:stream_side_data=rotation:format=duration \
           -of default=nw=1:nk=1 "$1" 2>/dev/null | tr '\n' ' '; echo)
         case "${rot#-}" in 90|270) t=$w; w=$h; h=$t ;; esac
         [[ "$rot" =~ ^-?[0-9]+$ ]] || d="$rot"   # no rotation side data → third value is the duration
         extra=(); [[ "$w" =~ ^[0-9]+$ ]] && extra+=(-F "width=$w" -F "height=$h")
         [[ "${d%.*}" =~ ^[0-9]+$ ]] && extra+=(-F "duration=${d%.*}")
         send sendVideo -F "supports_streaming=true" "${extra[@]}" -F "video=$f" --form-string "caption=${2:0:1000}" ;;
  photo) f=$(file_arg "$1") || exit 1; send sendPhoto -F "photo=$f" --form-string "caption=${2:0:1000}" ;;
  doc)   f=$(file_arg "$1") || exit 1; send sendDocument -F "document=$f" --form-string "caption=${2:0:1000}" ;;
  wait)  # wait <minutes> [since_epoch]: print Eyad's first Telegram message sent after since (default: now); exit 3 on timeout
         MIN="${1:-30}"; SINCE="${2:-$(date +%s)}"; END=$(( $(date +%s) + MIN * 60 ))
         hook=$(curl -s -m 10 "$API/getWebhookInfo" | python3 -c "import json,sys; print(json.load(sys.stdin).get('result',{}).get('url',''))" 2>/dev/null)
         [ -n "$hook" ] && { echo "telegram: this bot delivers replies to a webhook — can't read them here; ask in the Claude app" >&2; exit 4; }
         while [ "$(date +%s)" -lt "$END" ]; do
           r=$(curl -s -m 60 "$API/getUpdates?timeout=50&allowed_updates=%5B%22message%22%5D")
           got=$(printf %s "$r" | CHAT="$TELEGRAM_CHAT_ID" SINCE="$SINCE" python3 -c "
import json, os, sys
d = json.load(sys.stdin)
for u in d.get('result', []):
    m = u.get('message') or {}
    if str(m.get('chat', {}).get('id')) == os.environ['CHAT'] and m.get('date', 0) > int(os.environ['SINCE']) and m.get('text'):
        print(m['text']); break" 2>/dev/null)
           [ -n "$got" ] && { printf '%s\n' "$got"; exit 0; }
           sleep 5
         done
         echo "telegram: no reply within ${MIN} min" >&2; exit 3 ;;
  *) echo "usage: tg.sh msg|video|photo|doc|wait …" >&2; exit 2 ;;
esac
