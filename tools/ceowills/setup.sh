#!/usr/bin/env bash
# Usage: setup.sh [workspace]   — fresh-container setup for a CEOwills reel (idempotent, ~2 min)
set -uo pipefail
WS="${1:-${SCRATCH:-/tmp}/ceowills}"; mkdir -p "$WS"/{src,mic,words,nasheed,out}
HERE="$(cd "$(dirname "$0")" && pwd)"
log(){ printf '• %s\n' "$*"; }
command -v ffmpeg >/dev/null || { log "installing ffmpeg"; (apt-get install -y -qq ffmpeg || (apt-get update -qq && apt-get install -y -qq ffmpeg)) >/dev/null 2>&1; }
python3 -c "import PIL, numpy, faster_whisper, cv2" 2>/dev/null || { log "installing pillow numpy faster-whisper opencv"; pip install -q pillow numpy faster-whisper opencv-python-headless==4.10.0.84 2>&1 | grep -v WARN; }
command -v yt-dlp >/dev/null || { log "installing yt-dlp (nasheeds from SoundCloud)"; pip install -q yt-dlp 2>&1 | grep -v WARN; }
python3 -c "import sys; sys.path.insert(0, '$HERE'); import render; [render.face(k, 40) for k in render.L['fonts']]" \
  && log "fonts ok ($(ls "$HERE/fonts" | tr '\n' ' '))" || log "FONTS MISSING — check raw.githubusercontent.com is allowed"
# Warm the Whisper model in the background (first run downloads ~1.5 GB for medium.en)
( python3 -c "from faster_whisper import WhisperModel; WhisperModel('medium.en', device='cpu', compute_type='int8')" >/dev/null 2>&1 & )
{ [ -n "${TELEGRAM_BOT_TOKEN:-}" ] || [ -f ~/.sk-media.env ]; } && log "secrets: Telegram configured" || log "secrets: no TELEGRAM_BOT_TOKEN env var or ~/.sk-media.env — Telegram step will be skipped"
for d in drive.usercontent.google.com huggingface.co raw.githubusercontent.com www.tiktok.com api.telegram.org; do
  code=$(curl -s -o /dev/null -m 8 -w '%{http_code}' "https://$d" || true)
  [[ "$code" =~ ^[234] ]] && log "ok       $d" || log "BLOCKED  $d ($code)"
done
log "YouTube downloads are blocked from cloud containers (bot check) — nasheeds come from Drive (RSV Video/SK/SK Files/nasheeds) or SoundCloud"
log "workspace: $WS"
