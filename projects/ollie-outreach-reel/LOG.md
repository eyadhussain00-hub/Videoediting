# LOG – ollie-outreach-reel

2026-10-17
- Eyad's standing rule (via the project coordinator): a bare TikTok/IG link means "turn this into a premium high-end
  video with motion graphics, merge to main, preview on Telegram". No music (halal): voice + non-musical SFX only.
- Source: vt.tiktok.com/ZSg29BLys → @0llielund2 "How to outreach as an appointment setter" (60.9 s, 720x1280).
  yt-dlp needs `--impersonate chrome` (pip install curl_cffi) and the resolved tiktok.com URL; the short link 403s.
- Burned-in word-by-word captions (white Montserrat, some fading in grey) sit mid-frame over walls, pillars and him.
  Pixel-threshold masks failed (white pillars/bottles fire, grey fades don't), so clean_captions.py uses the
  EasyOCR/CRAFT detector for word boxes (+ neighbour frames' boxes for fades) and LaMa on the band.
  ~5 s/frame per process on 4 cores; ran as 3 setsid chunks. Whole-box fills over his black shorts (pool shot) and
  chest (close-ups) regrew them as skin, so those two shots were re-run with --tight (letter-shaped mask) and
  spliced in (scripts/splice.py). easyocr pulls a torchvision that doesn't match the CPU torch: reinstall
  torchvision from the PyTorch CPU index with --no-deps.
- Demucs: the non-vocal stem is ~-60 dB (no real music bed); the vocal stem is used anyway. Source voice is quiet
  (~-38 dB mean): audio.py ends with a bus compressor before loudnorm, or it lands at -16.5 LUFS.
- Cut list (scripts/cuts.py): only 1.4 s of pauses to trim, 58.4 s kept + 2.2 s end card.
- v1 (full 60.6 s) rendered. Then Eyad's new rule (via the coordinator): only edit the opening third to half of a
  video, ending on a natural sentence end. Cut after chapter 03 ("…I admire what you do for people.", 53% of the
  source, the last line before the pool shot) and the end card recap shortened to 3 steps → v2, 34.3 s.
- QA of v2 found "day" and "try" still burned in over the lounger wicker (CRAFT never boxed them):
  scripts/fix_residue.py masks plain white letters in that region for those frames only. A looser grey threshold
  there ate the wicker texture and left a seam, so one faint fade-in frame of "day" stays.
- Folder renamed tiktok-zsg29 → ollie-outreach-reel before merging: another thread had already merged a different
  video (Billy Cox, vt.tiktok.com/ZSg29XHHs) as projects/tiktok-zsg29. Name folders after the video, not the link.
