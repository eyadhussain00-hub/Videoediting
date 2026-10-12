# PROGRESS – roblox-town-teaser   (updated 2026-10-12)
Phase: final (v1 render)
Current version: v1 → renders/final/plot-town-teaser_v1.mp4 (55 MB, not committed) + _v1_tg.mp4 (25 MB, sent on Telegram)
Done:
- Brief: teaser for a Roblox game idea ("every player gets a permanent house in one shared town"), inspired by
  @notarealcity's "Internet Town" reel. 9:16, 22 s, music + SFX only (no VO), working title PLOT TOWN.
- Storyboard + timings: plan/storyboard.md, plan/beats.json (single source for scene and audio).
- Scene: Three.js low-poly island in headless Chromium (src/scene.js, src/index.html), DOM overlay for text.
- Audio: fully synthesised in scripts/audio.py (no samples, no licences), loudnorm to -14 LUFS.
In progress: -
Next step: get the user's feedback on v1 (name, wording, pacing, music); then v2.
Open issues / user feedback not yet fixed: -
Key decisions & preferences:
- Name is a placeholder (user chose "placeholder name"). To rename: the letters array in buildOverlay() in src/scene.js.
- No VO (user chose music + SFX). Purpose left open → defaulted to the 9:16 social hook.
Key files: src/scene.js, src/index.html, src/render.js, scripts/audio.py, plan/beats.json
How to render:
  npm ci
  node src/render.js --from 0 --to 22 --fps 30 --scale 1 --out cache/frames --jpg
  python3 scripts/audio.py 2565   # house count printed by render.js
  then loudnorm two-pass to cache/audio/mix.wav and mux (see LOG.md)
Preview loop: node scripts/preview.mjs <from> <to> [--fps 4 --scale 0.25]
