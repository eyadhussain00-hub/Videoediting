# What if we terraformed Mars? — progress

Made with the `lemo-opuscar` skill (library cloned to `~/lemo-opuscar` per session).
Reference: an Instagram "what if humans disappeared" timelapse reel (format only).

**Brief** (agreed 2026-10-11): topic "What if we terraformed Mars?", English captions, music + sound only (no voice),
9:16 1080×1920, ~60 s. Three versions, Tilt-Shift first: `tiltshift/` → `iso/` → `blend/` (iso diorama + tilt-shift lens).

| Version | Status |
|---|---|
| Tilt-Shift (`tiltshift/`) | scene, HUD, captions, score and mix built; full render next |
| Isometric Infographic (`iso/`) | not started |
| Blend (`blend/`) | not started |

## Files
- `TREATMENT.md`: structures, shots, beat sheet, cue map, sound design (shared story)
- `shared/timeline.json`: sections, counter, captions, hits (every version reads it); `shared/srt.py`
- `tiltshift/`: `main.js` (camera, lens band, HUD), `world.js` (crater, eras), `story.js` (clock), `post.js` (lens, from the library),
  `music/score.py`, `mix.py`, `build.sh`

Renders (`out/`, `*.mp4`) are gitignored; send them with SendUserFile.
