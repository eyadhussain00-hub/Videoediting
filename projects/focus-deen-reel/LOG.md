# LOG – focus-deen-reel

2026-10-16
- Eyad: turn instagram.com/reel/DbmGj1eOZhz into a premium high-end motion-graphics video, merge to main, preview on
  Telegram. House rule from the owner: no music, only voice and non-musical SFX.
- Source: @buildwithcheick (Cheick), 23.8 s, promoting his app FocusDeen (locks apps at prayer time). yt-dlp works
  without login. Burned-in: a white title pill (frames 0–238) and white subtitles on his sweater.
- Brand pulled from the App Store listing (id6762575973): real icon (pink heart mascot on lavender), coral #FF5A5F,
  cream UI, copy ("Pray first. Unlock after.", "Isha time · Take a moment to reconnect with Allah", Salah Focus rule).
  The heart was cut out of the icon with rembg isnet-general-use → public/img/heart.png.
- Demucs: the original has a music bed under his voice (no_vocals ≈ -25 dB) → only the vocal stem is used.
- clean_captions.py: the camera is locked off and the pill is gone after frame 238, so the ceiling behind it is the
  median of later frames (no inpainting); the pill's shadow ring is kept off his hair with the speaker matte, and the
  "time" tab that hid the top of his hair is regrown per frame with LaMa. Subtitles: per-frame mask + LaMa.
  ~10 s/frame on 4 CPU cores; run in chunks with setsid/nohup (one chunk died with the session once, unfinalised mp4).
- Cut list trims 6 pauses (23.8 → 20.5 s) + 1.2 s end card = 21.7 s. Words remapped onto the edit in src/data.ts.
- audio.py: vocal stem cut on the same list, light EQ/compression, synthesised SFX (whooshes, locks, clicks,
  impacts, typing, toggles; nothing tonal), loudnorm -14 LUFS / -1.5 dBTP.
- v1 rendered (Remotion concurrency 4, ~12 min), QA'd, preview sent on Telegram, full file in project files.
