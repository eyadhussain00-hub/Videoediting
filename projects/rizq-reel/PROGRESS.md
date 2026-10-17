# PROGRESS – rizq-reel   (updated 2026-10-17)
Phase: preview (v1)
Current version: v1 → renders/final/rizq_v1.mp4 (1080×1920, 30 fps, ~63 s, -14 LUFS; not committed).
  Telegram preview: renders/previews/rizq_v1_preview.mp4.

Done:
- Source: tiktok.com/@shohaibahmedofficial/video/7696888698629016854 (Shohaib Ahmed, "7 actions that increase your
  rizq", 58.6 s). The post is age-gated for yt-dlp; downloaded through the tikwm API (see rebuild).
  Spec edit: a portfolio piece, not for publishing without his permission.
- Burned-in title ("7 Actions That INCREASE Your Rizq!") and the growing 1-7 list removed: per-frame masks
  (scripts/text_masks.py) + LaMa at half res (scripts/clean_text.py); the boxes hid the top of his head, so the
  crown is rebuilt as an ellipse fitted to the head's width and slope just below them.
- Audio: the source has no music bed (Demucs no_vocals ≈ -66 dB); the vocal stem is used as the voice.
  **No music anywhere** (owner's halal rule): voice + synthesised non-musical SFX only.
- Transcript (Whisper heard "Surah Nuh" as "Noor"; fixed in src/data.ts), 3 pauses trimmed, every scene built.

Next step: Eyad's notes on v1.

Rebuild from scratch (fresh container), from this folder:
  npm ci · pip install yt-dlp faster-whisper opencv-python-headless rembg onnxruntime scipy soundfile ·
  pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu · pip install demucs ·
  pip install --no-deps simple-lama-inpainting ·
  curl "https://www.tikwm.com/api/?url=https://www.tiktok.com/@shohaibahmedofficial/video/7696888698629016854&hd=1"
    → data.hdplay (or data.play) → curl -L -o cache/src.mp4 <that url> ·
  ffmpeg -i cache/src.mp4 -vn -ac 1 -ar 16000 cache/voice16k.wav · python3 scripts/transcribe.py cache/voice16k.wav plan/words.json ·
  ffmpeg -i cache/src.mp4 -vn -ac 2 -ar 44100 cache/orig.wav · python3 -m demucs --two-stems=vocals -n htdemucs -o cache/demucs cache/orig.wav ·
  python3 -I scripts/text_masks.py cache/src.mp4 cache/masks.npz ·
  clean_text.py in two chunks (~3 s/frame each, ~45 min; run with setsid nohup):
    --range 0 880 --threads 2 → cache/clean_a.mp4, --range 880 1800 --threads 2 → cache/clean_b.mp4 ·
  bash scripts/build_media.sh (concat, matte ~20 min, fg.webm, freeze frames, beats.json, mix) · bash scripts/render.sh v1.
  Stills: bash scripts/stills.sh 0.6 4.4 9.5 … → cache/stills/sheet.jpg.

Key decisions: night-emerald + manuscript-gold palette, Islamic geometry drawn in code (8-point star lattice, khatam
  rosette, star iris transitions); one chapter card per action (Arabic name, transliteration, meaning); every verse
  and hadith he quotes gets a source card with the Arabic and its reference (Nuh 71:10-12, At-Talaq 65:2-3,
  Bukhari 5986, Muslim 2588, Ibrahim 14:7, Tirmidhi 2517, Bukhari 2079) while the room turns into the emerald world
  behind him; "SallAllahu Alaihi Wasallam" captions as ﷺ; recap of all seven + end card crediting him.
Key files: src/data.ts (cut list, items, refs, timings), src/scenes/*, scripts/*.
