# PROGRESS – delayed-gratification-reel   (updated 2026-10-17)
Phase: render (v1)
Current version: v1 → renders/final/delayedgrat_v1.mp4 (1080×1920, 30 fps, 35.8 s, -14 LUFS; not committed).

Done:
- Source: tiktok.com/@entrepreneurtok_/video/7697045685887159559 (vt.tiktok.com/ZSg2xyv3U, "Entrepreneur Tok" clip page,
  720×1280 @ 24 fps, 36.6 s). A founder on delayed gratification: did his agency's (Fluid) first job for free → 16-year
  client → referrals. Spec re-edit, not for publishing without permission.
- Burned-in title boxes + glowing word captions removed (scripts/clean_captions.py, LaMa, at native 720p), plate
  upscaled to 1080×1920 @ 30, speaker matte (scripts/matte.py), Demucs vocal stem, transcript, cut list (9 kept ranges).
- **No music** (owner's halal rule): the source has no music bed; voice + synthesised non-musical SFX only.

Look: "the long game": ink, bone paper, gold for what compounds, muted red for the short-term grab. Inter Tight,
  Instrument Serif italic, JetBrains Mono. Type and the referral network sit BEHIND him (depth layer).
Beats: Delayed/GRATIFICATION → giant #1 + climbing line → RULE 01 payment card "Charge now" gets a NOT YET stamp →
  RULE 02 YOU⇄THEM → CUSTOMER #001 / fluid ticket → invoice totals $0.00 + FREE stamp → internet advice bubbles blown
  away by "I DON'T agree." → relationship meter + over-delivered checklist → 5 stars "Happy client → Client for life" →
  giant 16 + YEARS + 16-tick ruler → referral network + "+24 referrals" → quote "part of my early journey." → end card
  "$0 invoice. / 16-year client. / Play the long game."

Rebuild from scratch (fresh container), from this folder:
  npm ci · pip install yt-dlp curl_cffi faster-whisper opencv-python-headless rembg onnxruntime scipy soundfile ·
  pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu · pip install demucs ·
  pip install --no-deps simple-lama-inpainting ·
  yt-dlp --impersonate chrome -o cache/src.mp4 https://vt.tiktok.com/ZSg2xyv3U/   (TikTok needs --impersonate) ·
  ffmpeg -i cache/src.mp4 -vn -ac 1 -ar 16000 cache/voice16k.wav · python3 scripts/transcribe.py cache/voice16k.wav plan/words.json ·
  cp plan/words.json src/words.json · ffmpeg -i cache/src.mp4 -vn -ac 2 -ar 44100 cache/orig.wav ·
  python3 -m demucs --two-stems=vocals -n htdemucs -o cache/demucs cache/orig.wav ·
  ffmpeg -i cache/src.mp4 -vf "fps=30,scale=1080:1920:flags=lanczos,unsharp=5:5:0.6" -an -c:v libx264 -crf 12 -pix_fmt yuv420p cache/src1080.mp4 ·
  python3 scripts/matte.py cache/src1080.mp4 cache/matte.mp4 ·
  clean_captions.py in 4 chunks (setsid nohup, --threads 1): --range 0 220 → cache/clean_a.mp4, 220 440 → b, 440 660 → c, 660 880 → d ·
  bash scripts/build_media.sh · bash scripts/render.sh v1.  Stills: bash scripts/stills.sh 0.5 2 … → cache/stills/sheet.jpg.
Key files: src/data.ts (cut list, timings, palette), src/scenes/{base,behind,front,end,fx}.tsx, scripts/*.
