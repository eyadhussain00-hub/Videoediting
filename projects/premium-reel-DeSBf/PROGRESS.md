# PROGRESS – premium-reel-DeSBf   (updated 2026-10-13)
Phase: preview (v1 sent on Telegram 13 Oct 23:25), awaiting Eyad's notes.
Current version: v1 → renders/final/first-millionaire_v1.mp4 (1080×1920, 24 fps, H.264 crf 17, AAC 48 kHz, -14.1 LUFS / -1.4 dBTP, 99 MB)
  + first-millionaire_v1_preview.mp4 (41 MB, sent to Telegram). Not committed (renders are gitignored).
Brief (Eyad, 13 Oct): "use your full capability to turn this into a premium high-end video with motion graphics … then merge and
send preview on telegram". Source: instagram.com/reel/DeSBf-Dt_yV — "How to become your family's first millionaire"
(talking head, three points: beliefs, leverage, attention; 91 s). The reel's own voice is kept, so no ElevenLabs step.

Done:
- yt-dlp → cache/raw.mp4 (1080×1920, 23.976 fps). Conformed to exactly 24 fps (+0.1 % speed, atempo) → cache/src24.mov.
- Transcribed (faster-whisper small.en) → plan/words.json (copied to src/words.json); every timing comes from it (src/data.ts).
- Captions + title plate removal: scripts/capmask.py (white top-hat mask — captions sit on his WHITE shirt, so plain
  near-white masking can't work) + scripts/clean_captions.py (LaMa, neighbour-frame mask union) → cache/clean_[ab].mp4 → public/clean.mp4.
- Voice: Demucs htdemucs two-stem → cache/demucs/htdemucs/orig/vocals.wav (the reel's own music bed is dropped).
- Mix: scripts/audio.py → public/mix.wav (original synthesized score + SFX, -14 LUFS / -1.5 dBTP).
- Speaker matte: scripts/matte.py (rembg u2net_human_seg) → cache/matte.mp4 → public/fg.webm (alpha) for type behind him.
- Remotion scenes: src/scenes/{base,depth,graphics,fx}.tsx. Plan: plan/storyboard.md.

Next step: apply Eyad's notes, render v2.

Rebuild from scratch (fresh container):
  npm ci · pip install yt-dlp faster-whisper soundfile opencv-contrib-python-headless rembg demucs scipy torch (CPU) ·
  pip install --no-deps simple-lama-inpainting ·
  yt-dlp -o cache/raw.mp4 https://www.instagram.com/reel/DeSBf-Dt_yV/ ·
  ffmpeg -i cache/raw.mp4 -vf "setpts=PTS*1001/1000" -r 24 -af "atempo=1.001,aresample=48000" -c:v libx264 -crf 10 -c:a pcm_s16le cache/src24.mov ·
  (cd scripts && python3 clean_captions.py ../cache/src24.mov ../cache/pN.mp4 --range A B --threads 1 --scale 0.5) in 4 parallel chunks → concat → public/clean.mp4 ·
  python3 scripts/matte.py cache/src24.mov cache/matte.mp4 --ranges 1.0-5.2,6.3-11.0,28.8-35.0,58.9-65.7,83.2-91.4 ·
  python3 scripts/fillholes.py cache/matte.mp4 cache/matte_filled.mp4 · ffmpeg alphamerge clean+matte_filled → public/fg.webm (vp9 yuva420p) ·
  python3 -m demucs --two-stems=vocals -n htdemucs -o cache/demucs cache/orig.wav · python3 scripts/audio.py cache/demucs/htdemucs/orig/vocals.wav public/mix.wav ·
  npx remotion render Reel cache/v1_raw.mp4 → ffmpeg re-encode (crf 18, yuv420p, aac 192k, +faststart)
  QA: node scripts/stills.mjs out.jpg <seconds…> (one bundle, many stills).

Gotchas: in the tight A-roll shots there is no headroom above him, so the hook ("First / Millionaire / $1,000,000")
  and the finale ("Let it be / You.") sit in FRONT over his chest with a dark radial backing; behind-type is only used in the side
  columns (chapter numerals + vertical words) and for the cycle ring. rembg drops parts of his white shirt → fillholes.py.
Gotchas (cont.): LaMa is ~3 s/frame/process on this CPU; don't run the matte (onnxruntime grabs every core) at the same time.
Key decisions: champagne gold + ivory, muted red only for negatives; Instrument Serif italic / Inter Tight / JetBrains Mono;
24 fps; music + SFX synthesized (no licences); B-roll from the original kept (no depth layer over it).
Open issues / user feedback not yet fixed: none yet.
