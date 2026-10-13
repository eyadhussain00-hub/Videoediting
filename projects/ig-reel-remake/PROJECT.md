# PROJECT: ig-reel-remake

**Brief (from Eyad, 2026-10-12):** take the Instagram reel https://www.instagram.com/reel/DbNFGUCO-jJ/ and turn it into a
premium, high-end video with motion graphics, using every skill and tool available.

**Source:** Cole DaSilva (@coleluisdasilva), posted 2026-07-25. Caption: "Comment “COACH” to scale your online fitness coaching
business". 59.2 s, 720×1280, 24 fps, one take, burned-in word captions, voice only (no music), −14.2 LUFS.
Only the 720p Instagram copy is available; a higher-res original would sharpen the result (ask Eyad if he has it).

**Decisions so far (Claude's defaults, pending Eyad's OK):**
- Keep the original audio as the voiceover (no ElevenLabs VO needed; the CLAUDE.md "no VO yet" rule doesn't apply).
- 9:16 1080×1920, 30 fps, ≈ 62 s = the full talk + a 2.8 s "Comment COACH" end card (CTA from the post caption).
- Intensity 4, premium creator style: cinematic grade + grain, punch-in camera, huge Anton words behind his head (person matte),
  Inter Tight captions with Instrument Serif Italic accents, one accent colour #FF6B2C, glass UI cards for each idea.
- Old captions removed by inpainting (scripts/clean_plate.py); new captions sit over that band.
- Music + SFX are synthesised in code (scripts/mix.py): Pixabay and Freesound are blocked from the cloud container and
  no API keys are set, so everything in the mix is original and licence-free.

**Open questions for Eyad:** purpose (portfolio / pitch to Cole / client job?), keep the COACH CTA and @handle,
accent colour, and whether he has the original 4K footage.

**Approvals:** none yet.
