# LOG – delayed-gratification-reel

2026-10-17
- Eyad's standing rule (via the project chat): a bare TikTok/IG link means turn it into a premium high-end video with
  motion graphics, merge to main, preview on Telegram. No music.
- Source vt.tiktok.com/ZSg2xyv3U: yt-dlp needs `--impersonate chrome` (pip install curl_cffi), otherwise
  "Unexpected response from webpage request".
- Burned in: white title boxes (frames 0 to ~65) and one line of glowing coloured words (y ~900-948 at 720p).
  Caption mask = letter cores by colour as text-line components (skips the white pen, which crosses the band edge),
  dilated + the line's padded box + tinted glow pixels (not skin). LaMa at native 720p is ~2-6 s/frame on shared cores.
- Demucs: no_vocals is -48 dB mean, i.e. no music bed; the vocal stem is used anyway (cleaner room).
- Cut list from vocal-stem silences: 36.6 → 33.6 s of speech + 2.2 s end card.
- v1 rendered (~8 min at concurrency 4), QA'd, preview sent on Telegram, copy in project files.
