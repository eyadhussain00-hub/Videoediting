#!/usr/bin/env bash
# Usage: setup.sh <workspace>   — idempotent, safe to re-run after a container restart
set -uo pipefail
WS="${1:-${SCRATCH:-/tmp}/video}"; mkdir -p "$WS"/{src,words,audio,render,out}
log(){ printf '• %s\n' "$*"; }

command -v ffmpeg >/dev/null || { log "installing ffmpeg"; apt-get update -qq && apt-get install -y -qq ffmpeg >/dev/null; }
# Python deps run through uv (system python has no numpy). Pre-warm the envs so later steps start instantly.
( uv run -q --with "numpy<2.3" --with pillow --with "opencv-python-headless==4.10.0.84" python -c "import numpy, PIL, cv2" \
  && uv run -q --with faster-whisper python -c "import faster_whisper" ) && log "python envs ready" || log "uv env warm-up FAILED"
# hypit / WhisperX are NOT used (runtime init fails in this container) — transcription is local faster-whisper (transcribe.py)

# Secrets
{ [ -n "${TELEGRAM_BOT_TOKEN:-}" ] || [ -f ~/.sk-media.env ]; } && log "secrets: Telegram configured" || log "secrets: MISSING — TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID in the environment settings or ~/.sk-media.env (ask Eyad)"

# Reachability report
for d in drive.google.com drive.usercontent.google.com huggingface.co api.telegram.org raw.githubusercontent.com; do
  code=$(curl -s -o /dev/null -m 8 -w '%{http_code}' "https://$d" || true)
  # any HTTP answer (even 404 on the bare domain) means reachable; 000 = no connection, 403 = proxy block
  [[ "$code" != "000" && "$code" != "403" ]] && log "ok       $d ($code)" || log "BLOCKED  $d ($code)"
done
log "workspace: $WS"
