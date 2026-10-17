# PROGRESS – illumine-reel   (updated 2026-10-17)
Phase: preview (v1 sent on Telegram 17 Oct, awaiting notes)
Current version: v1 → renders/final/illumine_v1.mp4 (1080×1920, 30 fps, 76.4 s, -14.3 LUFS / -1.5 dBTP; not committed).
  Telegram preview: renders/previews/illumine_v1_preview.mp4 (4 Mb/s, 39 MB). Full v1 in project files illumine-reel/.
  QA: stutters.py flags only whisper's split tokens ("tax -free", "self -invested"), not cuts.

Source: tiktok.com/@officialillumine/video/7696997323389422870 (@officialillumine, "ISA or SIPP?", 75 s).
  Spec edit: a pitch piece, not for publishing without his permission. Footage is on TikTok, not in git.

Next step: Eyad's notes on v1.

Done:
- Burned-in captions, glass labels and the top-right checklist removed (scripts/clean_captions.py via run_chunks.sh),
  speaker matte, Demucs vocal stem (music bed dropped), transcript + fixes, cut list, all scenes, SFX mix.
- **No music anywhere** (owner's halal rule): voice + synthesised non-musical SFX only.

Look: his two glasses set the palette. ISA = gold (clear glass of £50s), SIPP = sapphire (blue glass of £10s),
  ink + cream elsewhere, red for "the catch". Instrument Serif metallic numerals, Inter Tight UI, JetBrains Mono kickers.
Beats: ISA vs SIPP title behind him · name tags pinned to the glasses all video · chapter bar (01 ISA / 02 SIPP /
  THE CATCH / 03 VERDICT) · £20,000 counter → ISA checklist (4 ticks) + TAX-FREE stamp · S-I-P-P acronym ·
  £60,000 or 100% of earnings · £80 → £100 tax-relief bar · THE CATCH slam, padlock + chain on the SIPP glass,
  55 rolls to 57 "from 2028" · 25% tax-free donut · BOTH. behind him · life timeline (ISA now→57, SIPP 57→retirement) ·
  follow card tap · "Stay invested." end card with a two-line summary and "not financial advice".

Rebuild from scratch (fresh container), from this folder:
  npm ci · pip install "yt-dlp[default,curl-cffi]" faster-whisper opencv-python-headless rembg onnxruntime scipy soundfile ·
  pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu · pip install demucs ·
  pip install --no-deps simple-lama-inpainting ·
  yt-dlp --impersonate chrome -o cache/src.mp4 https://www.tiktok.com/@officialillumine/video/7696997323389422870 ·
  ffmpeg -i cache/src.mp4 -vn -ac 1 -ar 16000 cache/voice16k.wav · python3 scripts/transcribe.py cache/voice16k.wav plan/words.json ·
  python3 scripts/fix_words.py · ffmpeg -i cache/src.mp4 -vn -ac 2 -ar 44100 cache/orig.wav ·
  python3 -m demucs --two-stems=vocals -n htdemucs -o cache/demucs cache/orig.wav ·
  setsid nohup bash scripts/run_chunks.sh & (~1 h clean + ~30 min matte; rerun to resume) · bash scripts/run_chunks.sh join ·
  bash scripts/build_media.sh · bash scripts/render.sh v1.
  Stills: bash scripts/stills.sh 3 9.5 23 … → cache/stills/sheet.jpg.
Key files: src/data.ts (cut list, timings, palette), src/scenes/{base,hook,heroes,fx}.tsx, scripts/*.
