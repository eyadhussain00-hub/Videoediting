# PROGRESS – tomhutch-10k-mindset   (updated 2026-10-13)
Phase: preview (v1 sent to Telegram for review; merged to main)
Current version: v1 → renders/final/tomhutch-10k-mindset_v1.mp4 (not committed; rebuild with the steps below)

Source: Instagram reel by @tomhutchmove (Thomas Hutcheson) — https://www.instagram.com/reel/DdeGMVYzACe/
31.7 s, 1080×1920, 30 fps, talking head with burned-in captions + a white title box; original audio = voice + music bed.
Eyad asked to "turn this into a premium high end video with motion graphics", then merge and send the preview on Telegram.
No voiceover needed: the original audio is kept (CLAUDE.md exception), so no VO gate.

Done:
- Downloaded with yt-dlp → assets/footage/source.mp4 (3.7 MB, committed so the project rebuilds).
- Transcribed (faster-whisper small.en, word timings) → cache/words.json → src/captions.json (43 groups, "lop" fixed to "larp").
- Burned-in captions removed (scripts/clean.py): word captions = white top-hat mask + inpaint; title box = clean plate from 9.2 s,
  ECC-aligned per frame to follow the source's punch-in zooms → cache/clean.mp4.
- Remotion build (src/): grade + vignette + grain, camera push-ins/punches, gold-serif kinetic captions, 10 graphic beats:
  $10,000 counter struck through → "nothing." · title kicker · Same bed/love/clients tiles · coins + Family/Friends chips ·
  business-class boarding pass with flight arc → posted-from-seat-2A card + LARP stamp · B&W letterbox "nothing really changes." ·
  XP bar that resets ("same game") · $10K on a pedestal that sinks, then zooms through camera · outline "mind" → solid gold "reality" ·
  emotional-state line volatile → regulated · "You're welcome." + frozen-frame end card with @tomhutchmove follow button.
- Sound: 45 synthesised SFX cues (plan/sfx.json, scripts/sfx.py) under the original audio, -14 LUFS / -1.5 dBTP.

Next step: wait for Eyad's notes on v1, fix, render v2.
Open issues: the source reel is Tom Hutcheson's — confirm it's for his own use / a spec piece before anyone posts it.
Key decisions: palette navy/black + champagne gold (#E9C27A); type = Inter Tight + Instrument Serif Italic + JetBrains Mono.

Rebuild:
  npm ci && python3 scripts/clean.py assets/footage/source.mp4 cache/clean.mp4 && cp cache/clean.mp4 public/
  cp assets/fonts/*.ttf public/ && python3 scripts/sfx.py assets/footage/source.mp4 plan/sfx.json public/mix.wav 33.1
  npx remotion render Reel renders/final/tomhutch-10k-mindset_vN.mp4 --concurrency=4
  (pip: faster-whisper opencv-python-headless yt-dlp; transcript: python3 scripts/transcribe.py … then scripts/captions.py)
Key files: src/Reel.tsx, src/scenes/Act1.tsx, src/scenes/Act2.tsx, src/Footage.tsx (camera keys), plan/sfx.json
