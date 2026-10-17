# PROGRESS – tiktok-zsg29   (updated 2026-10-17)
Phase: preview (v1 rendered and sent on Telegram 17 Oct)
Current version: v1 → renders/final/billycox_v1.mp4 (1080×1920, 30 fps, 44.9 s, -14 LUFS; not committed).
  Telegram preview: renders/previews/billycox_v1_preview.mp4.

Source: tiktok.com/@therealbillycox/video/7668498383480409374 (vt.tiktok.com/ZSg29XHHs), Billy Cox,
  "4 objections, 4 closes, 40 seconds" (43 s, a physical 40 s countdown clock on his desk). Spec edit: a pitch piece,
  not for publishing without his permission.

Done:
- Layout: his burned-in labels/captions all sit below source y ≈ 905, so the speaker lives in a clean top window
  (lifted 120 px, clipped at 790) and the lower half is our own stage. No inpainting needed.
- His desk clock rebuilt as a big tabular countdown + draining ember bar: 0:40 on "Objection one" → 0:00 on "today".
- Hook: 4 OBJECTIONS / 4 CLOSES / 40 SECONDS rows land on each word; name tag.
- Per objection: chip + progress pips, THEY SAY serif quote (wipe), YOU SAY lines (empathy line → the close question),
  and a logic visual: cost-of-waiting vs investment bars; TIMING / MONEY / WILL IT WORK? chips with a selector;
  spouse chat bubble + typing reply; TODAY ↔ 6 MONTHS LATER timeline with the regret arc.
- End: 3.6 s "4 objections, 4 closes · SAVE THIS" cheat sheet over the blurred last frame.
- 6 pauses trimmed (43.1 → 41.3 s + recap). Punch-in on every "Objection number…", reset on each close.
- **No music** (owner's rule): Demucs vocal stem (the original had a music bed) + synthesised SFX only
  (clock ticks, whooshes, pops, impacts).

Next step: Eyad's notes on v1.

Rebuild from scratch (fresh container), from this folder:
  npm ci · pip install yt-dlp curl_cffi faster-whisper · pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu ·
  pip install demucs soundfile ·
  yt-dlp --impersonate chrome -o cache/src.mp4 https://vt.tiktok.com/ZSg29XHHs/   (plain yt-dlp gets blocked by TikTok) ·
  ffmpeg -i cache/src.mp4 -c:v libx264 -crf 14 -r 30 -an cache/src30.mp4 && ln -f cache/src30.mp4 public/src.mp4 ·
  ffmpeg -sseof -0.3 -i cache/src.mp4 -frames:v 1 -q:v 2 public/img/last.jpg ·
  ffmpeg -i cache/src.mp4 -vn -ac 1 -ar 16000 cache/voice16k.wav · python3 scripts/transcribe.py cache/voice16k.wav plan/words.json ·
  cp plan/words.json src/words.json · ffmpeg -i cache/src.mp4 -vn -ac 2 -ar 44100 cache/orig.wav ·
  python3 -m demucs --two-stems=vocals -n htdemucs -o cache/demucs cache/orig.wav ·
  npx tsx scripts/beats.ts > plan/beats.json · python3 scripts/audio.py cache/demucs/htdemucs/orig/vocals.wav public/mix.wav ·
  bash scripts/render.sh v1. Stills: bash scripts/stills.sh 0.6 5.2 11.2 … → cache/stills/sheet.jpg.

Key files: src/data.ts (cut list, beat times, palette, clock), src/scenes/base.tsx (speaker window, clock, captions),
  src/scenes/stage.tsx (hook, objection cards, visuals, recap), scripts/audio.py.
Gotchas: public/ must hold real files (hardlinks), not symlinks. Don't zoom below 1.0 or lift the footage further:
  the burned-in text (source y ≥ 905) would show at the window's bottom edge.
