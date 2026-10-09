#!/usr/bin/env bash
# Usage: setup.sh [workspace]   — fresh-container setup for Boxabl clips (idempotent, ~1 min)
set -uo pipefail
WS="${1:-${SCRATCH:-/tmp}/boxabl}"; mkdir -p "$WS"/{src,words,work,out}
HERE="$(cd "$(dirname "$0")" && pwd)"
log(){ printf '• %s\n' "$*"; }
if ! command -v ffmpeg >/dev/null || ! ffmpeg -hide_banner -filters 2>/dev/null | grep -qw subtitles; then
  log "installing ffmpeg"
  (apt-get install -y -qq ffmpeg || (apt-get update -qq && apt-get install -y -qq ffmpeg)) >/dev/null 2>&1 \
    || { pip install -q imageio-ffmpeg 2>&1 | grep -v WARN; ln -sf "$(python3 -c 'import imageio_ffmpeg as i; print(i.get_ffmpeg_exe())')" /usr/local/bin/ffmpeg; }
fi
if ! command -v ffprobe >/dev/null; then   # pip ffmpeg has no ffprobe: shim the one call the scripts make (format=duration)
  log "no ffprobe — installing a duration-only shim"
  cat > /usr/local/bin/ffprobe <<'SH'
#!/usr/bin/env bash
# shim: supports `ffprobe ... -show_entries format=duration -of csv=p=0 <file>` only (tools/boxabl/setup.sh)
f="${@: -1}"; ffmpeg -hide_banner -i "$f" 2>&1 | sed -n 's/.*Duration: \([0-9]*\):\([0-9]*\):\([0-9.]*\).*/\1 \2 \3/p' | awk '{printf "%.6f\n", $1*3600+$2*60+$3}'
SH
  chmod +x /usr/local/bin/ffprobe
fi
python3 -c "import faster_whisper" 2>/dev/null || { log "installing faster-whisper"; pip install -q faster-whisper 2>&1 | grep -v WARN; }
ls "$HERE/fonts"/*.ttf >/dev/null 2>&1 && log "fonts ok ($(ls "$HERE/fonts" | tr '\n' ' '))" || log "FONTS MISSING in $HERE/fonts"
( python3 -c "from faster_whisper import WhisperModel; WhisperModel('small.en', device='cpu', compute_type='int8')" >/dev/null 2>&1 & )
[ -n "${TELEGRAM_BOT_TOKEN:-}" ] || [ -f ~/.sk-media.env ] && log "secrets: Telegram configured" || log "secrets: no Telegram — previews only in the session"
for d in drive.usercontent.google.com drive.google.com huggingface.co api.telegram.org; do
  code=$(curl -s -o /dev/null -m 8 -w '%{http_code}' "https://$d" || true)
  [[ "$code" =~ ^[234] ]] && log "ok       $d" || log "BLOCKED  $d ($code)"
done
log "YouTube blocks cloud containers — every source comes from Boxabl's Drive folder (drive_index.json)"
log "workspace: $WS   (export BOXABL_WS=$WS)"
