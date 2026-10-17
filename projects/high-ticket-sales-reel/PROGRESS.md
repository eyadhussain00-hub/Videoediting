# PROGRESS – high-ticket-sales-reel   (updated 2026-10-17)
Phase: preview (v1 rendered, sent on Telegram)
Current version: v1 → renders/final/hts_v1.mp4 (1080×1920, 30 fps, 40.0 s, -14 LUFS; not committed).
  Telegram preview: renders/previews/hts_v1_preview.mp4.

Done:
- Source: tiktok.com/@mousaibn3ssa/video/7565645712612969750 (vt.tiktok.com/ZSg29L2tp, Mousa Beaumont,
  "What is High Ticket Sales?", 39.4 s, 720p whiteboard explainer). Spec edit, not for publishing without his OK.
- Burned-in blue title pill (frames 0-293) removed with a median wall plate (scripts/clean_title.py), upscaled to 1080p.
- Speaker matte (scripts/matte.py), transcript, 4 pauses trimmed (39.4 → 38.2 s) + 1.8 s end card.
- **No music**: the source has none (Demucs no_vocals stem at -83 dB); voice + synthesised non-musical SFX only.
- Scenes: HIGH TICKET / Sales? title, product·service·online chips, $0→$1,000+ counter, price slider handing
  checkout to "a human", checkout + doubts, the human's two jobs (qualify / no buyer's remorse), receipt with a
  REFUND REQUESTED stamp, setter → closer role cards, end card. Gold-on-ink palette, gold-pill word captions.

Next step: Eyad's notes on v1.

Rebuild from scratch (fresh container), from this folder:
  npm ci · pip install "yt-dlp[default,curl-cffi]" faster-whisper opencv-python-headless rembg onnxruntime scipy soundfile ·
  pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu · pip install demucs ·
  yt-dlp --impersonate chrome -o cache/src.mp4 https://www.tiktok.com/@mousaibn3ssa/video/7565645712612969750 ·
  python3 scripts/clean_title.py cache/src.mp4 cache/clean.mp4 ·
  ffmpeg -i cache/src.mp4 -vn -ac 1 -ar 16000 cache/voice16k.wav · python3 scripts/transcribe.py cache/voice16k.wav plan/words.json ·
  python3 scripts/fix_words.py · ffmpeg -i cache/src.mp4 -vn -ac 2 -ar 44100 cache/orig.wav ·
  python3 -m demucs --two-stems=vocals -n htdemucs -o cache/demucs cache/orig.wav ·
  python3 scripts/matte.py cache/clean.mp4 cache/matte.mp4 (~15 min) · bash scripts/build_media.sh · bash scripts/render.sh v1.
  Stills: bash scripts/stills.sh 0.4 3.5 … → cache/stills/sheet.jpg.

Gotchas: yt-dlp needs --impersonate chrome (curl-cffi) for TikTok. The last line is mumbled ("So you('ve) …
  sales …"), so captions hide there and the "2 sales roles" card carries it. public/ must hold hardlinks, not symlinks.
Key files: src/data.ts (cut list, timings, palette), src/scenes/{base,graphics}.tsx, scripts/*.
