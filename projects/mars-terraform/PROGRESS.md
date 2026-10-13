# What if we terraformed Mars? — progress

Made with the `lemo-opuscar` skill (library cloned to `~/lemo-opuscar` per session).
Reference: an Instagram "what if humans disappeared" timelapse reel (format only).

**Brief** (agreed 2026-10-11): topic "What if we terraformed Mars?", English captions, music + sound only (no voice),
9:16 1080×1920, ~60 s. Three versions, Tilt-Shift first: `tiltshift/` → `iso/` → `blend/` (iso diorama + tilt-shift lens).

| Version | Status |
|---|---|
| Tilt-Shift (`tiltshift/`) | **delivered** 2026-10-12 on Telegram: `mars-tiltshift.mp4` (60 s, −13.9 LUFS, peak −3.8 dB, no black frames). Rendered with `shared/chunks.mjs` (2 workers, ssaa 1.25, ~1 h 55 min) |
| Isometric Infographic (`iso/`) | rendered and sent in the app 2026-10-11 (before the mix limiter fix: re-mix + re-mux before reusing it) |
| Blend (`blend/`) | **on hold** (user: only the first video for now). Scene, score and mix built; not rendered |

## Files
- `TREATMENT.md`: structures, shots, beat sheet, cue map, sound design (shared story)
- `shared/timeline.json`: sections, counter, captions, hits (every version reads it); `shared/srt.py`
- `tiltshift/`: `main.js` (camera, lens band, HUD), `world.js` (crater, eras), `story.js` (clock), `post.js` (lens, from the library),
  `music/score.py`, `mix.py`, `build.sh`

Renders (`out/`, `*.mp4`) are gitignored; send them with SendUserFile.

## Notes
- Cloud container has no GPU: the 3D Tilt-Shift frames take ~5–6 s each at ssaa 1.5; never run more than 2 WebGL workers
  alongside other renders, or page screenshots hit the 30 s timeout.
- Samples: `sh tools/fetch.sh instruments vcsl` and `freepats` in the library; `setup.sh deps music` for the music box (numba).
