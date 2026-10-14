# PROGRESS – winter-arc-reel   (updated 2026-10-13 22:40)
Phase: preview (v1 sent on Telegram, awaiting Eyad's notes)
Current version: v1 → renders/final/winter-arc_v1.mp4 (1080×1920, 30 fps, H.264 crf 17, AAC 192k, -14 LUFS, 62 MB; not committed).
  Telegram preview: renders/previews/winter-arc_v1_preview.mp4 (43 MB, 4.8 Mb/s). App copy: winter-arc_v1_720p.mp4 (26 MB).

Done:
- Source: instagram.com/reel/Dd9ds6kI-q9 (@big.esa, "The Muslim Winter Arc: 90-day playbook", 69.7 s). Spec edit,
  like coach-system-reel: a pitch piece, not for publishing without his permission. DM draft sent to Eyad on Telegram
  (Drive link left blank until Eyad uploads it).
- Transcript (plan/words.json → src/words.json), storyboard (plan/storyboard.md), all scene code, sound design (public/mix.wav).

- Clean plate (public/clean.mp4), speaker matte → public/fg.webm, v1 rendered (Remotion, concurrency 4: ~17 min) and sent.

Next step: Eyad's notes → v2. When he uploads the master to Drive, he fills the link into the Big Esa DM draft.
  The master is not in git: re-render it (steps below) if this container is gone.

Rebuild from scratch (fresh container):
  npm ci · pip install yt-dlp faster-whisper opencv-python-headless rembg onnxruntime scipy torch (CPU) ·
  pip install --no-deps simple-lama-inpainting ·
  yt-dlp -o cache/src_1440.mp4 https://www.instagram.com/reel/Dd9ds6kI-q9/ ·
  ffmpeg -i cache/src_1440.mp4 -vf scale=1080:1920:flags=lanczos -c:v libx264 -crf 12 -c:a copy cache/raw.mp4 ·
  python3 scripts/clean_captions.py cache/raw.mp4 cache/clean_a.mp4 --range 0 1045 --threads 2 (and 1045 2091 → clean_b) ·
  ffmpeg concat → public/clean.mp4 · python3 scripts/matte.py cache/raw.mp4 cache/matte.mp4 ·
  ffmpeg -i public/clean.mp4 -i cache/matte.mp4 -filter_complex "[1:v]format=gray[m];[0:v][m]alphamerge,format=yuva420p" -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 22 -an public/fg.webm ·
  python3 scripts/audio.py cache/raw.mp4 public/mix.wav · npx remotion render Reel cache/v1_raw.mp4 → ffmpeg re-encode.

Key decisions: winter palette (frost white / glacier blue), warm only for the dawn beat; his own audio is the voice;
  music and SFX synthesised; captions hide while a graphic says the words; "corn" kept in quotes as he captioned it.
Gotchas: public/ must hold real files (hardlinks), not symlinks: Remotion's bundler can't follow ../ links.
  Never put preserve-3d/translateZ layers in the composition (five-currencies: transparent holes in frames).
Key files: src/data.ts (timings), src/scenes/*.tsx, scripts/*.py, plan/storyboard.md
