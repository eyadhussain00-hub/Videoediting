# LOG – five-currencies

- 2026-10-13: Downloaded the source and reference reels (yt-dlp). Contact sheets → source = talking head with burned-in
  Impact captions, reference = Web Lab skills reel. Transcribed the source (faster-whisper small.en, word timestamps).
- Tried to clone the 5 skill repos from the reference: denied by the permission policy (untrusted code). Read their
  READMEs with WebFetch instead and reproduced the techniques in our own code.
- Caption removal v1 (Telea + temporal fill): smeared blocks. v2 LaMa with letter-only mask: shadow halo left.
  v3 LaMa with word-line mask dilated 41 px: clean. Full clip running (CPU, ~2 s/frame).
- Built Remotion project (Remotion 4.0.526). Google Fonts blocked in headless Chrome by the proxy CA → fonts bundled in public/fonts (OFL).
- Halftone v1 (whole frame) too dark/busy → v2 with rembg person mask, cream sticker border, baked on mustard paper.
- Sheets 0–37 s reviewed; fixes: repeated words (identity/money/reputation/they/to/solution) need the right
  occurrence; $23M counter stopped at 22 (easing never reaches 1); Time card height; CTA label contrast; star size.
- Sound: scripts/audio.py, voice + pad + pulse + synthesized SFX on word timings, sidechain duck, loudnorm -14 LUFS.
- v1 rendered (Remotion, 5 min at concurrency 4), re-encoded to yuv420p + faststart, QA sheet clean (no old captions anywhere), -14.0 LUFS / -1.5 dBTP. Sent to the user.
- 2026-10-13 (v2): User re-sent the same reel asking for a "full capability" premium version → v2 on top of v1.
  Re-downloaded the source; transcript reused (plan/words.json). New scripts/matte.py (rembg u2net_human_seg at 540×960,
  upscaled, contrast-tightened, 3-frame median + EMA) → cache/matte.mp4, clean on head/hands/mic.
- Caption removal (LaMa) was ~10× slower when it shared 4 cores with the matte job (thread oversubscription).
  Restarted it with --threads 2 in two frame ranges (0–555, 555–1110), joined with ffmpeg concat. ~45 min total. QA band sheets clean.
- fg.webm = clean plate + matte (alphamerge, VP9 yuva420p crf 22) rendered with OffthreadVideo transparent under the same camera.
- Built depth layer (src/scenes/depth.tsx: BgDim, Rays, Dust, BehindType, Person) and fx (src/scenes/fx.tsx: LightLeaks,
  Flares, Letterbox, ChromaKick); camera punch kicks in base.tsx; extruded $23M + thick coins in proof.tsx.
- Sheets 0–9, 9–23, 23–37 reviewed on stand-in footage: alignment exact, columns clear of his head. Tweaks: hook 5 moved
  down/smaller, no flare across the face, softer punch blur, dim + rays from frame 0.
- Audio: + reverse swell/boom/shimmer on "five", thud per currency title and CTA, braam into proof, plucked arpeggio with echo.
