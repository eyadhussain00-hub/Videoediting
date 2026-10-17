# PROGRESS – ollie-outreach-reel   (updated 2026-10-17)
Phase: preview (v2 = trimmed cut)

Done:
- Source: tiktok.com/@0llielund2/video/7472099732920290582 (Ollie, 19, appointment setting outreach tips, 60.9 s).
  Spec edit: a showcase piece, not for publishing without his permission.
- Captions removed (scripts/clean_captions.py + splice.py), transcript, cut list, vocal stem, all scenes, SFX mix.
- **No music anywhere** (owner's halal rule): voice + synthesised non-musical SFX only.
- Plan: plan/storyboard.md.

Versions: v1 = full 60.6 s (all 5 chapters, rendered 17 Oct, not sent). v2 = 34.3 s, chapters 01-03 only, after
  Eyad's 17 Oct rule "only edit half or a third of the video": ends on "…I admire what you do for people." (source
  33.3 s of 60.9, right before the pool shot) + 2 s end card. renders/final/ollie-outreach_v2.mp4 (not committed).
  Chapters 04/05 (src/scenes/system.tsx, the Conversation in close.tsx) are built but not in the Reel; the cut
  point is END_SRC in src/data.ts.

Next step: Eyad's notes on v2.

Rebuild from scratch (fresh container), from this folder:
  npm ci · pip install yt-dlp curl_cffi faster-whisper opencv-python-headless rembg onnxruntime scipy easyocr ·
  pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu ·
  pip install --force-reinstall --no-deps torchvision --index-url https://download.pytorch.org/whl/cpu ·
  pip install demucs soundfile · pip install --no-deps simple-lama-inpainting ·
  yt-dlp --impersonate chrome -o cache/src.mp4 https://www.tiktok.com/@0llielund2/video/7472099732920290582 ·
  ffmpeg -i cache/src.mp4 -vn -ac 1 -ar 16000 cache/voice16k.wav · python3 scripts/transcribe.py cache/voice16k.wav plan/words.json ·
  python3 scripts/fix_words.py · ffmpeg -i cache/src.mp4 -vn -ac 2 -ar 44100 cache/orig.wav ·
  python3 -m demucs --two-stems=vocals -n htdemucs -o cache/demucs cache/orig.wav ·
  python3 scripts/cuts.py cache/demucs/htdemucs/orig/vocals.wav ·
  clean_captions.py chunks (setsid nohup, --threads 1 each): a 0 610, b 609 1220, c 1219 1827 (box mask) and
    --tight: b2 101 331, d1 1000 1192, d2 1192 1384, d3 1384 1574 → cache/clean_<name>.mp4 ·
  bash scripts/build_media.sh (concat, splice.py, fix_residue.py, upscale, matte, mix) · bash scripts/render.sh v2 (~12 min).
  Stills: bash scripts/stills.sh 0.6 4.3 … → cache/stills/sheet.jpg. Layout preview before the clean plate exists:
  CLEAN=cache/src.mp4 bash scripts/build_media.sh.

Key decisions: night-villa luxe look (smoked glass, champagne gold, cream) to match the pool-villa footage;
  his advice turned into a 5-chapter playbook with a chapter rail; the DM he describes is typed out live; the
  tracker numbers (Opener A/B/C, 4/17/9 %) are illustrative; end card recaps the five steps + "Save this".
Key files: src/data.ts (timings, palette, chapters), src/scenes/{base,hook,outreach,message,system,close,fx}.tsx, scripts/*.
