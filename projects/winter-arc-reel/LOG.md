# LOG – winter-arc-reel

## 2026-10-13
- Request: turn instagram.com/reel/Dd9ds6kI-q9 into a premium motion-graphics video, send the preview on Telegram.
  Also sent Eyad a DM draft for Big Esa on Telegram, with the Drive link left blank until he uploads the video.
- yt-dlp → cache/src_1440.mp4 (1440×2560, 69.7 s) → cache/raw.mp4 at 1080×1920 (lanczos, crf 12).
- faster-whisper small.en (numpy input; PyAV in this container rejects faster-whisper's open() args) → plan/words.json.
  scripts/fix_words.py corrects screen spellings ("Isha and Blueprint" → Ihsan, "Come up Winter" → Comment “WINTER”,
  Qur'an, non-negotiables) → src/words.json.
- scripts/clean_captions.py: header "THE MUSLIM WINTER ARC / 90 DAY PLAYBOOK" is static on a still wall, so one LaMa
  clean plate from the median frame is reused per frame (exposure-matched; full LaMa only if a hand crosses it).
  Subtitles: per-frame white-text mask + LaMa on a crop tightened to the text rows. Bug found and fixed: the blend used
  a soft mask that reached 1.0000001 and truncation (astype) printed the old letters back at 1 level; now clipped + rint.
  Run as two --range halves with --threads 2 (~4.7 s/frame each while the matte shares the CPU).
- scripts/matte.py (rembg u2net_human_seg) → cache/matte.mp4 for the depth layer.
- Remotion scenes written (src/scenes: base, depth, hud, steps, offer, fx). Stills checked on the raw plate.
- scripts/audio.py: cold minor pad + felt-piano arp + sub pulse + wind bed, synthesised SFX on word cues, voice ducking,
  loudnorm -14 LUFS / -1.5 dBTP. np.convolve smoothing replaced with a cumsum moving average (was minutes → 12 s).
