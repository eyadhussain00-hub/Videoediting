# PROGRESS – winter-arc-reel   (updated 2026-10-13 20:10)
Phase: assets → first full render (v1)
Current version: none yet → renders/final/winter-arc_v1.mp4

Done:
- Source: instagram.com/reel/Dd9ds6kI-q9 (@big.esa, "The Muslim Winter Arc: 90-day playbook", 69.7 s). Spec edit,
  like coach-system-reel: a pitch piece, not for publishing without his permission. DM draft sent to Eyad on Telegram
  (Drive link left blank until Eyad uploads it).
- Transcript (plan/words.json → src/words.json), storyboard (plan/storyboard.md), all scene code, sound design (public/mix.wav).

In progress: caption removal (cache/clean_a.mp4 + clean_b.mp4) and speaker matte (cache/matte.mp4).

Next step: concat clean halves → public/clean.mp4; alphamerge clean + matte → public/fg.webm; contact sheets;
  render v1; send the preview on Telegram (tools/tg.sh video, <50 MB).

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
