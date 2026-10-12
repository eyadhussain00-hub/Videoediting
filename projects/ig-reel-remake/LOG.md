# LOG – ig-reel-remake

- 2026-10-12 21:04 Downloaded the reel + info.json with yt-dlp. 59.17 s, VP9 720×1280 24 fps, AAC. Caption: Comment "COACH".
- 21:05 Reference analysis: one take, no cuts (scene detect empty), burned-in white captions at y≈655–735/1280, voice only (spectrogram gaps reach −90 dB), −14.2 LUFS.
- 21:06 Transcribed (faster-whisper small.en, word timestamps) → cache/words.json → src/words.json. 287 words.
- 21:07 Caption removal test: HSV mask (V>170, S<70) in the band, 17 px dilation, Telea inpaint r=9 → clean on the shirt. Full run → public/clean.mp4.
- 21:08 Matte: rembg u2net_human_seg, 540×960, EMA 0.65 → public/matte.mp4 (~25 min on CPU under load).
- 21:14 Clone stills: 9 frames of clean.mp4 (3.5, 9, 14.2, 21, 25, 33, 38, 44, 50.5 s) at 360×640, hue s=0.15 → public/clones/; last frame → public/last.jpg.
- 21:20 Remotion scaffold (4.0.526): Reel = Clones + Camera(plate, BigWords, fg) + Look + Hook + Story + Captions + EndCard + mix.wav.
- 21:27 scripts/mix.py: synthesised ambient pad (84 BPM Am9–Fmaj7–Cmaj7–G6, sub pulse, hats) ducked −9 dB under voice, 85 SFX cues; loudnorm −14.
- 21:28 Google Fonts unreachable from headless Chromium (proxy CA) → fonts vendored into public/fonts, loaded with FontFace + delayRender.
- 21:30 Sheets 0–11, 11–33, 33–62: fixed big words into the top UI zone, "3" clipped, chapter labels colliding with the HUD, book/pay card too low; added the complicated→simple scribble (14.4–17 s).
