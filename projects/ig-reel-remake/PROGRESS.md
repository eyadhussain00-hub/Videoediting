# PROGRESS – ig-reel-remake   (updated 2026-10-12 21:55)
Phase: preview
Current version: v1 rendered → renders/final/ig-reel-remake_v1.mp4 (1080×1920, 30 fps, 62.06 s, yuv420p, AAC 48 k, −14.0 LUFS / −3 dB peak; gitignored). Compressed preview sent to Eyad.

Done:
- Source downloaded with yt-dlp (Cole DaSilva reel DbNFGUCO-jJ, 59.2 s, 720×1280 @ 24 fps), transcript with word timings (faster-whisper small.en → src/words.json)
- Burned-in captions removed by inpainting + 1080×1920 upscale → public/clean.mp4 (scripts/clean_plate.py)
- Person matte (rembg u2net_human_seg) → public/matte.mp4 (scripts/matte.py); cut-out subject → public/fg.webm (scripts/fg.sh)
- Remotion project: camera punches, big Anton words behind his head, kinetic captions, glass UI graphics per idea, clone grid, COACH end card
- Original music bed + SFX synthesised and mixed → public/mix.wav (scripts/mix.py)
- Contact sheets checked 0–62 s (renders/previews/)

Next step: Eyad reviews v1 → apply notes → v2. If no notes: optionally upload the master to Drive.

Open questions for Eyad: purpose (portfolio / pitch / Cole as client), keep the COACH CTA + @handle, accent colour (#FF6B2C),
original 4K footage available?

Key decisions & preferences:
- Original voice kept as the VO (no ElevenLabs needed). Music/SFX synthesised (Pixabay & Freesound are blocked from the container).
- Fonts are local in public/fonts (headless Chromium can't reach Google Fonts through the proxy).

Rebuild from scratch in a fresh container (media is gitignored):
  pip install yt-dlp faster-whisper "av<16" "rembg[cpu]" onnxruntime opencv-python-headless
  yt-dlp -o "assets/footage/ref_%(id)s.%(ext)s" https://www.instagram.com/reel/DbNFGUCO-jJ/
  python3 scripts/clean_plate.py && python3 scripts/matte.py && bash scripts/fg.sh && python3 scripts/mix.py
  (clones + last frame: see LOG.md 21:14) · npm ci · node scripts/sheet.mjs <from> <to> · npx remotion render Reel <out.mp4>

Key files: src/beats.ts (all timings), src/parts/*.tsx, scripts/*, plan/storyboard.md
