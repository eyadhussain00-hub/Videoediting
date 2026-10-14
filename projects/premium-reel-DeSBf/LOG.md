# LOG – premium-reel-DeSBf
- 2026-10-13 21:47 Downloaded reel, conformed to 24 fps, transcribed. Captions sit on his white shirt → top-hat mask instead of near-white mask; QA'd on 12 frames.
- 21:58 LaMa caption removal started (2 × 2 threads). Demucs vocal split. Matte started then paused (CPU contention: LaMa dropped to ~12 s/frame).
- 22:10 Remotion scenes + synthesized mix written; layout QA'd with stills on the raw plate (cache/qa1.jpg, qa2.jpg); moved First/≠/You up, letterbox opens for the finale.
- 22:21 Switched LaMa to half-res crops (--scale 0.5, 4 chunks × 1 thread): ~3.6× faster, fill nearly identical (cache/frames/lamascale.jpg). Matte restricted to behind-type windows.
- 22:50 Plates done. QA: behind-type 'First', '≠', '×100', 'You.' mostly hidden behind his head in tight shots → hook + finale moved to the front layer, ≠ dropped, ×100 moved into the lever card. Matte holes on his white shirt filled (scripts/fillholes.py).
- 23:18 v1 rendered (Remotion, concurrency 4, ~20 min). -14.1 LUFS / -1.4 dBTP. Preview (41 MB) sent to Telegram.
