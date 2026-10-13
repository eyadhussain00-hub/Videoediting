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
