# PROGRESS – executive-presence-reel   (updated 2026-10-11)
Phase: final — v1 delivered, awaiting feedback
Current version: v1 → renders/final/coalescing_v1.mp4 (not committed; sent to the user)
Done:
- Reference pulled (yt-dlp), transcribed (faster-whisper small.en, word timings → plan/words.json)
- Burned-in captions removed (scripts/decaption.py → assets/footage/clean.mp4)
- Subject cut-out with RobustVideoMatting ONNX (scripts/matte.py → assets/footage/fg.webm, VP9 alpha)
- Voice/music split with Demucs; SFX synthesised + mixed (scripts/sound.py, scripts/loudnorm.sh → public/mix.wav, −14 LUFS)
- Remotion composition, all scenes (src/scenes/*), plan/storyboard.md
In progress: - none
Next step: get the user's feedback on v1, then v2.
Open issues / user feedback not yet fixed: - none yet
Key decisions & preferences:
- User asked for the finished video directly ("use your full capability"), so the plan/preview gates were folded into v1 review.
- Kept Jeff Davenport's own voice + music (no new VO needed). CTA "Follow @hijeffdav": change if it's for another account.
- Source footage is third-party (@hijeffdav): spec/client use; don't publish without the creator's OK.
Key files: src/Reel.tsx (layers), src/camera.ts (shot list), src/data.json (from scripts/build_data.py), src/scenes/*, scripts/*
Rebuild from scratch (fresh container):
  npm ci; pip install yt-dlp faster-whisper opencv-python-headless onnxruntime scipy soundfile demucs (+ torch cpu)
  yt-dlp -o cache/source.mp4 <reel url>; python3 scripts/decaption.py cache/source.mp4 assets/footage/clean.mp4
  curl RVM onnx → models/; python3 scripts/matte.py assets/footage/clean.mp4 assets/footage/fg.webm
  demucs two-stem → cache/stems; python3 scripts/sound.py; scripts/loudnorm.sh cache/mix_pre.wav public/mix.wav
  hard-link clean.mp4, fg.webm, fonts into public/; last frame → public/last.jpg; grain.png (see LOG.md)
  node scripts/preview.mjs <from> <to>; npx remotion render Reel renders/final/coalescing_v1.mp4
