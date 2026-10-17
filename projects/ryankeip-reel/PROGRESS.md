# PROGRESS – ryankeip-reel   (updated 2026-10-17)
Phase: preview (v1 rendering / sent on Telegram 17 Oct)
Current version: v1 → renders/final/ryankeip_v1.mp4 (1080×1920, 30 fps, ~100.3 s, -14 LUFS; not committed).
  Telegram preview: renders/previews/ryankeip_v1_preview.mp4.

Done:
- Source: tiktok.com/@theryankeip/video/7697469893448371470 (Ryan Keip, sales coach, 100.4 s talking head:
  "the rush of anxiety on a sales call" → 3 steps: recognize, regulate, redirect). Spec edit, a pitch piece,
  not for publishing without his permission.
- Burned-in hook box (frames 0-112) and one-word captions removed with LaMa (scripts/clean_captions.py, two passes),
  speaker matte (MediaPipe), Demucs vocal stem (the source's quiet music bed dropped), transcript, cut list.
- **No music anywhere** (owner's halal rule): voice + synthesised non-musical SFX (heartbeats are sub transients).

Next step: Eyad's notes on v1.

Rebuild from scratch (fresh container), from this folder:
  npm ci · pip install yt-dlp curl_cffi faster-whisper opencv-contrib-python-headless scipy mediapipe ·
  apt-get install -y libegl1 libgles2 (MediaPipe needs EGL) ·
  pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu · pip install demucs soundfile ·
  pip install --no-deps simple-lama-inpainting ·
  yt-dlp --impersonate chrome -o cache/src.mp4 https://www.tiktok.com/@theryankeip/video/7697469893448371470 ·
  model: curl -sSL -o cache/models/selfie_multiclass.tflite https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite ·
  ffmpeg -i cache/src.mp4 -vn -ac 1 -ar 16000 cache/voice16k.wav · python3 scripts/transcribe.py cache/voice16k.wav plan/words.json ·
  python3 scripts/fix_words.py · ffmpeg -i cache/src.mp4 -vn -ac 2 -ar 44100 cache/orig.wav ·
  python3 -m demucs --two-stems=vocals -n htdemucs -o cache/demucs cache/orig.wav · python3 scripts/cuts.py && cp plan/segments.json src/ ·
  bash scripts/run_chunks.sh clean (~45 min, resumable: run again after a restart) · bash scripts/run_chunks.sh matte (~20 min) ·
  bash scripts/build_media.sh · bash scripts/render.sh v1 (~30 min).  Stills: bash scripts/stills.sh 1.5 7.6 …

Key decisions: a biometric HUD that runs hot (ember/red, heat wash, embers, heartbeat) while his body panics and turns
  cool cyan once he takes the breath (calmAt/heatAt in src/data.ts drive colour + grade); type behind him for HEAT,
  THREAT, FIGHT/FLIGHT; breath ring behind his head; three-step chapter system; Ryan Keip end card (@theryankeip).
  Only ~2 s of pauses trimmed (he's already tight). Overlays sit above his head or on his chest, never on his face.
Gotchas: the source scales some caption words up (letters ~84 px): the second clean pass catches those.
  MediaPipe matte is rough below the chest, so it's forced solid below y 1050 (nothing sits behind him there).
Key files: src/data.ts (cut list, timings, palette), src/scenes/{base,hud,hook,mid,steps,fx}.tsx, scripts/*.
