# LOG – illumine-reel

2026-10-17
- Eyad posted tiktok.com/@officialillumine/video/7696997323389422870 (standing rule: bare link = premium motion-graphics
  re-edit, merge to main, preview on Telegram; no music). Spec piece.
- Source: @officialillumine, 75 s, 1080×1920 HEVC 30 fps: "ISA or SIPP? Which should you use?" UK personal finance,
  two glasses of cash on the desk (clear = Stocks ISA, blue = SIPP). yt-dlp needs `--impersonate chrome`
  (pip install "yt-dlp[default,curl-cffi]"), otherwise TikTok returns "Unexpected response".
- Burned-in: one-line white/yellow captions on his trousers (y ~1415-1490, some lines run edge to edge), yellow labels
  on both glasses (y ~1740-1835), a growing yellow checklist top-right (~8-56 s). Camera locked off.
- clean_captions.py: list → median plate of list-free frames (exposure-matched; components the plate doesn't explain
  go to LaMa); caption + labels → per-frame yellow/white masks + LaMa. The caption's drop shadow sits ~9 px below
  the letters, so the mask is also shifted down (a padded rectangle smeared the plaid instead). ~1.5 s/frame.
- Container restarted mid-run (lost ~4 h and both chunks): run_chunks.sh now does 150-frame chunks with .done markers.
- Demucs: no_vocals ≈ -31 LUFS under a -19 LUFS voice, i.e. a music bed → vocal stem only.
- Whisper fixes (fix_words.py): split tokens glued (£20 ,000 / tax -free / 100 %), "do not drop a follow" →
  "do want to drop a follow" and "the next is taxed" → "the rest is taxed" (his own captions).
- Cut list trims 4 pauses (75.0 → 74.2 s) + 2.2 s end card.
- v1 rendered (~14 min), -14.3 LUFS. Telegram preview needs ~4 Mb/s for 76 s to stay under 50 MB. Sent 17 Oct; full file in project files.
