#!/usr/bin/env bash
# Usage: setup.sh [workspace]   — fresh-container setup for a CEOwills reel (idempotent, ~2 min)
set -uo pipefail
WS="${1:-${SCRATCH:-/tmp}/ceowills}"; mkdir -p "$WS"/{src,mic,words,nasheed,out}
HERE="$(cd "$(dirname "$0")" && pwd)"
log(){ printf '• %s\n' "$*"; }
command -v ffmpeg >/dev/null || { log "installing ffmpeg"; (apt-get install -y -qq ffmpeg || (apt-get update -qq && apt-get install -y -qq ffmpeg)) >/dev/null 2>&1; }
# av < 16: faster-whisper 1.2's own file loader passes av.open(metadata_errors=…), which av 19 no longer takes. Our scripts
# decode with ffmpeg first, but a quick ad-hoc Whisper call on a file (10 Oct, checking a cut) fails without the pin.
# timeout: a pip that stalls on a download hangs setup with no output (10 Oct: 17 min) — fail instead, then re-run.
python3 -c "import PIL, numpy, faster_whisper, cv2, av; assert int(av.__version__.split('.')[0]) < 16" 2>/dev/null || { log "installing pillow numpy faster-whisper opencv av<16"; timeout 900 pip install -q --progress-bar off pillow numpy faster-whisper opencv-python-headless==4.10.0.84 "av<16" 2>&1 | grep -v WARN || log "pip install failed or timed out — run setup.sh again"; }
command -v yt-dlp >/dev/null || { log "installing yt-dlp (nasheeds from SoundCloud)"; timeout 300 pip install -q --progress-bar off yt-dlp 2>&1 | grep -v WARN; }
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
