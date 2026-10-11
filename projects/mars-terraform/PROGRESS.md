# What if we terraformed Mars? — progress

Made with the `lemo-opuscar` skill (library cloned to `~/lemo-opuscar` per session).
Reference: an Instagram "what if humans disappeared" timelapse reel (format only).

**Brief** (agreed 2026-10-11): topic "What if we terraformed Mars?", English captions, music + sound only (no voice),
9:16 1080×1920, ~60 s. Three versions, Tilt-Shift first: `tiltshift/` → `iso/` → `blend/` (iso diorama + tilt-shift lens).

| Version | Status |
|---|---|
| Tilt-Shift (`tiltshift/`) | scene, HUD, captions, score and mix built; first full render timed out (3 WebGL workers on 4 CPU cores); re-render with 2 workers |
| Isometric Infographic (`iso/`) | built (Canvas 2D, ~0.3 s/frame); rendering |
| Blend (`blend/`) | built (iso board + tilt-shift lens band, 16th-note stutter, speed readout); score and mix done; render after Tilt-Shift |

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
