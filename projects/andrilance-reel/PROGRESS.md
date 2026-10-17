# PROGRESS – andrilance-reel   (updated 2026-10-17)
Phase: preview (v1 sent on Telegram 17 Oct, awaiting notes)
Current version: v1 → renders/final/andrilance_v1.mp4 (1080×1920, 30 fps, 133.95 s, -14.8 LUFS / -1.2 dBTP; not committed).
  Telegram preview: renders/previews/andrilance_v1_preview.mp4 (45 MB). Full v1 in project files andrilance-reel/.
Source: tiktok.com/@andrilance/video/7696549263874084110 (vt.tiktok.com/ZSg2HFE1n), "How I make $500,000 a year at 21",
  134 s talking head, voice only (no music bed). Spec re-edit, not for publishing without his permission.

Done:
- Transcript (faster-whisper small.en) + spelling fixes (Iman, DM me, numbers, high-ticket) → src/words.json.
- Cut: "There's not going to be any fancy edits in this video, but" (src 20.57–22.60 s). 133.9 s with a 1.8 s end card.
- Burned-in word captions removed (LaMa, half-res crop on the hoodie). The title pill (frames 0-102), the car-photo
  inset (344-368) and the full-screen prompt screenshot (1800-1838) are covered by the edit's own graphics instead.
- ~35 graphic beats (src/beats1-3.tsx), type behind the speaker on 12 moments (matte only on those ranges),
  30,000-dot takeover with the footage in a card, watch-till-the-end progress bar, DM "PROMPT" CTA + end card.
- **No music** (owner's halal rule): voice + synthesised non-musical SFX only (scripts/audio.py).

Look: warm ink + ivory, one ember accent #FF6A2B; Inter Tight + Instrument Serif italic + JetBrains Mono.

Rebuild (fresh container), from this folder:
  npm ci · pip install yt-dlp curl_cffi faster-whisper opencv-python-headless rembg onnxruntime scipy ·
  pip install torch --index-url https://download.pytorch.org/whl/cpu · pip install --no-deps simple-lama-inpainting ·
  yt-dlp --impersonate chrome -o cache/src.mp4 https://www.tiktok.com/@andrilance/video/7696549263874084110 ·
  ffmpeg -i cache/src.mp4 -vn -ac 1 -ar 16000 cache/voice16k.wav · ffmpeg -i cache/src.mp4 -vn -ac 2 -ar 44100 cache/orig.wav ·
  python3 scripts/transcribe.py cache/voice16k.wav plan/words.json · python3 scripts/fix_words.py ·
  python3 scripts/matte.py cache/src.mp4 cache/matte_0.mp4 --limit 722 · python3 scripts/matte_ranges.py cache/src.mp4 cache/matte.mp4 ·
  bash scripts/clean_all.sh (~40 min, resumable) · python3 scripts/second_pass.py cache/clean.mp4 cache/clean2.mp4 (catches lines the zipper hid from pass 1), then mv clean2 → clean.mp4 · bash scripts/build_media.sh · bash scripts/render.sh v1.
  Stills: node scripts/stills.mjs 1 3.2 … → cache/stills/sheet.jpg.
Gotchas: the source has its own B-roll at frames 200-221 (him at a desk, kept) besides the car inset and prompt screenshot (covered).
  TikTok needs yt-dlp --impersonate (curl_cffi). Never `pkill -f` a pattern that appears in your own command line.
