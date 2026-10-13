# PROGRESS – five-currencies   (updated 2026-10-13)
Phase: preview (v1 delivered, awaiting feedback)
Current version: v1 → renders/final/five-currencies_v1.mp4 (1080×1920, 30 fps, H.264 yuv420p, AAC 48 kHz, -14 LUFS / -1.5 dBTP; not committed, sent to the user)

Done:
- Downloaded both reels with yt-dlp. Source footage: instagram.com/reel/DcHh55Rz8TG (sales coach, 37 s, 1080×1920 30 fps).
  Style reference: instagram.com/reel/DeY3eWhElMO (Web Lab, "5 Claude video skills").
- Read the five skills' READMEs (HyperFrames, onetake, Collage B-roll, Claude Animation Base, Lemo-Opuscar) and folded
  their techniques into this build (plan/storyboard.md). Cloning/running their code was blocked by the session's
  permission policy, so nothing from them is installed.
- Transcribed with faster-whisper small.en → plan/words.json (all timings come from it, via src/data.ts).
- Removed the burned-in captions: scripts/clean_captions.py (mask the white words + shadow, LaMa inpaint) → cache/clean.mp4
  (copied to public/clean.mp4). About 2 s per frame on CPU, so roughly 40 min for the clip.
- Collage cut-out: scripts/halftone.py (rembg u2net_human_seg + 45° dot screen) → public/halftone.mp4.
- Sound: scripts/audio.py → public/mix.wav (voice + synthesized pad/pulse + synthesized SFX, -14 LUFS / -1.5 dBTP).
- Remotion scenes in src/ (base, list, card, collage, proof, cta). Contact sheets checked (scripts/sheet.sh).

Next step: review v1 with the user. Apply their notes, then render v2.

Rebuild from scratch (fresh container):
  npm ci · pip install yt-dlp faster-whisper opencv-python-headless rembg onnxruntime scipy torch (CPU) ·
  pip install --no-deps simple-lama-inpainting · yt-dlp -o cache/raw.mp4 <source url> ·
  python3 scripts/clean_captions.py cache/raw.mp4 cache/clean.mp4 && cp cache/clean.mp4 public/clean.mp4 ·
  python3 scripts/halftone.py cache/raw.mp4 public/halftone.mp4 11.0 13.95 ·
  python3 scripts/audio.py cache/raw.mp4 public/mix.wav ·
  npx remotion render Reel renders/final/five-currencies_v1.mp4

Open issues / user feedback not yet fixed: none yet.
Key decisions: one accent colour (gold, from his watch); captions = Inter Tight + gold Instrument Serif keywords;
  music and SFX synthesized (no licences needed); the reel's own audio is the voice, so no ElevenLabs step.
Key files: src/data.ts (timings), src/scenes/*.tsx, scripts/*.py, plan/storyboard.md
