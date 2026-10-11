# LOG – executive-presence-reel

- 2026-10-11 16:13 Downloaded reference reel (@hijeffdav, 65.75 s, 1080×1920, 24 fps). It's a locked-off talking head with white Montserrat captions burned in at y≈1205–1265 and a music bed (−25 dB in pauses).
- 16:16 Transcribed with faster-whisper small.en (word timestamps) → plan/words.json. (PyAV/faster-whisper mismatch: pass a numpy array instead of a path.)
- 16:17 Caption removal: tried Telea inpaint on glyph mask (shadow ghosts remained) → switched to per-frame text-run rectangle filled by vertical interpolation + borrowed fabric grain. Near-invisible on the sweater.
- 16:20 Demucs htdemucs two-stem split (vocals / no_vocals). Music loop ≈ 3 s bars (80 BPM).
- 16:20 RVM mobilenetv3 ONNX matte at downsample 0.25, erode 1 px → fg.webm (VP9 yuva420p) for text-behind-subject windows (2.5–4.3, 22.2–28.4, 59.4–63.0 s).
- 16:25 Remotion project + scenes. public/grain.png = 1024² gaussian noise (seed 7); public/last.jpg = last source frame.
- 16:30 Preview sheets 0–68.6 s: fixed closing-quote placement, enlarged chaos bubbles + kept them off the caption band and inside the right safe zone, chip fades before "clarity", title card held to 28.3 s (dropped the overlapping caption group), more knotted tangle.
- 16:33 Sound: 57 synthesised SFX events, music −3 dB + 30 % sidechain duck, dropout 23.3–25.3 s before the title hit, dip on "step back", one-bar extension under the end card. Loudnorm two-pass: −14.0 LUFS, −1.5 dBTP.
