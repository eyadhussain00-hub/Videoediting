# LOG – berkthecoach

## 2026-10-14
- Request (Eyad, project thread "berkthecoach"): turn instagram.com/reel/DdY7PJfos7B into a premium high-end video with
  motion graphics, merge, send the preview on Telegram.
- yt-dlp → cache/src.mp4 (1080×1920, 52.4 s). Footage band found at y 526–1394; cropped 528–1392 → cache/band.mp4.
- faster-whisper small.en → plan/words.json. Fixes (scripts/fix_words.py): "The reasons" → "Three sins", "members" →
  "remembrance", "won't" → "want to", Quran → Qur'an, warn → warns. Sin title-pill change times read off a 4 fps strip
  of the pill area: 6.0 s and 16.5 s and 29.0 s, matching "The Prophet", "Allah says", "And Allah warns".
- The source music bed was louder than his voice (-15.5 vs -22.5 dB RMS): Demucs htdemucs two-stem → vocals only.
- rembg u2net_human_seg matte (~25 min); choked with lut + erosion after a white halo showed in the hook breakout.
- Remotion scenes: stage (window/camera/breakout), depth (type behind him), front (cards, chips, quotes, end card),
  captions, fx. Stills checked across every beat; fixes: shrunk "3 SINS" clear of the kicker, plain رِزق / الرزّاق / بركة
  (stacked harakat rendered detached), Blessed below the citation pill, finale lockup at 100/92 px so it fits one line each.
- scripts/audio.py: D Hijaz score (drone pad, Karplus-Strong oud, frame drum, ney lead) + SFX; -14.1 LUFS / -1.5 dBTP.
- v1 sent on Telegram, merged (PR #5).
- v2 (Eyad: "only change the beginning… keep the original footage the same size, remove the baraka and rizq words…
  make it clean"): the hook uses the plain window from frame one (no breakout, no opening zoom, no shake), "3 SINS"
  sits above the window at 180 px, kicker moved up; the Arabic words, their flare/leak and their shimmer/chime/ney
  cues are gone. Finale breakout and everything else unchanged.
