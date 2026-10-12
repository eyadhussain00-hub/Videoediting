# LOG – roblox-town-teaser

- 2026-10-12 Kickoff. Reference: instagram.com/reel/DeVxv6-TOq2 (@notarealcity, "Day 1 in Internet Town… every
  follower = a house"). User picked: placeholder name, music + SFX only, no purpose preference → 9:16 hook.
- Preflight: node 22, python 3.13 + numpy, ffmpeg 6.1, Chromium 1194 (playwright 1.56.1). No faster-whisper/demucs
  (not needed: no VO, no reference audio analysis).
- Font: Fredoka (OFL, google/fonts) → assets/fonts/Fredoka.ttf + OFL-Fredoka.txt.
- Built scene + overlay + render CLI. Contact-sheet loops: fixed sky shader include, tight opening (now starts at
  d=95 over the empty grid), houses dropping onto the lens at 7 s (faster pull-out), @you pin vs counter (subject
  lowered, captions moved to y=1190), tower glow blob (fewer lit windows, emissive 1.0), title wordmark clipped (168 px).
- Audio: scripts/audio.py 2565 → cache/audio/mix_raw.wav; 5 ms end ramps against clicks; two-pass loudnorm
  (I=-14, TP=-1.5, linear) → cache/audio/mix.wav, measured -13.8 LUFS.
- Full render: 660 frames at 1080×1920 → mux with mix.wav → renders/final/plot-town-teaser_v1.mp4.
