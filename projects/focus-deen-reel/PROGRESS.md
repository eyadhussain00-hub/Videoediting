# PROGRESS – focus-deen-reel   (updated 2026-10-16)
Phase: preview (v1 sent on Telegram 16 Oct, awaiting notes)
Current version: v1 → renders/final/focusdeen_v1.mp4 (1080×1920, 30 fps, 21.7 s, -14 LUFS; not committed).
  Telegram preview: renders/previews/focusdeen_v1_preview.mp4 (24 MB). Full v1 also in project files focus-deen-reel/.
  QA: -13.9 LUFS / -1.5 dBTP; stutters.py flags only "I built … I built" at 7.78 s, which is his line.

Done:
- Source: instagram.com/reel/DbmGj1eOZhz (@buildwithcheick, Cheick, promoting his app FocusDeen, 23.8 s).
  Spec edit: a pitch piece, not for publishing without his permission.
- Brand from the App Store listing (apps.apple.com/app/id6762575973): icon → public/img/icon.png, mascot → heart.png.
- Burned-in title pill + subtitles removed (scripts/clean_captions.py), speaker matte (scripts/matte.py),
  Demucs vocal stem (the original's music bed dropped), transcript, cut list, all scenes, SFX mix, stills checked.
- **No music anywhere** (owner's halal rule): voice + synthesised non-musical SFX only.

Next step: Eyad's notes on v1.

Rebuild from scratch (fresh container), from this folder:
  npm ci · pip install yt-dlp faster-whisper opencv-python-headless rembg onnxruntime scipy ·
  pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu · pip install demucs soundfile ·
  pip install --no-deps simple-lama-inpainting ·
  yt-dlp -o cache/src.mp4 https://www.instagram.com/reel/DbmGj1eOZhz/ ·
  ffmpeg -i cache/src.mp4 -vn -ac 1 -ar 16000 cache/voice16k.wav · python3 scripts/transcribe.py cache/voice16k.wav plan/words.json ·
  python3 scripts/fix_words.py · ffmpeg -i cache/src.mp4 -vn -ac 2 -ar 44100 cache/orig.wav ·
  python3 -m demucs --two-stems=vocals -n htdemucs -o cache/demucs cache/orig.wav ·
  python3 scripts/matte.py cache/src.mp4 cache/matte.mp4 (~8 min) ·
  clean_captions.py in chunks (~10 s/frame for the pill frames, run with setsid nohup so a session hiccup can't kill them):
    --range 0 120 → cache/clean_a1.mp4, 120 240 → clean_a2.mp4, 239 397 → clean_c1, 397 555 → clean_c2, 555 713 → clean_c3 ·
  bash scripts/build_media.sh (concat, fg.webm, freeze frames, beats.json, mix) · bash scripts/render.sh v1 (~15 min).
  Stills: bash scripts/stills.sh 0.5 2 4.7 … → cache/stills/sheet.jpg.

Key decisions: FocusDeen's own look (coral #FF5A5F, cream cards, the heart mascot) instead of a generic palette;
  the room turns into the coral "app world" on "I built FocusDeen"; the app's own copy and Salah Focus rule rebuilt
  in code; 6 pauses trimmed (23.8 → 20.5 s) + 1.2 s end card; خشوع (khushūʿ) for "pray with concentration".
Gotchas: public/ must hold real files (hardlinks), not symlinks. The 3-line captions start at y ~1340, above the
  2-line ones: the caption mask keys on the white letter cores (min channel > 190) because a looser threshold merges
  the text with his collar. The pill's "time" tab hid the top of his hair: LaMa regrows it per frame.
Key files: src/data.ts (cut list, timings, palette), src/scenes/{base,hook,world,focus,cta,fx,icons}.tsx, scripts/*.
