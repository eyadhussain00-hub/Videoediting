# Coach reel template

The house style of the coach-system reel (`projects/coach-system-reel`) as a reusable Remotion template. Give it a talking-head clip and a
short job file; it renders a 1080×1920, 30 fps Instagram reel with sound.

What every reel gets:

- **Snap-zoom hook**: the first frame opens blurred and wide and springs onto the face, with a mono hook tag.
- **Punch-in cuts**: a virtual camera that cuts between wide and tight framings at sentence and pause boundaries,
  each cut springing in and then drifting tighter.
- **Colour grade**: an ffmpeg grade (contrast, cooler shadows, warmer highlights, sharpening) plus a soft-light
  pass that keeps the skin warm, film grain and a vignette.
- **Voice cleanup**: high-pass, de-mud, presence lift, compression, limiting; mixed to −14 LUFS / −1.2 dBTP.
- **Captions**: word by word, up to three words a page, with chosen words set in the accent serif italic.
- **Chapter cards**: full-screen accent wipes with a giant numeral; the lines rise on the words as they're said.
  A chapter rail under the captions tracks them.
- **End card**: a recap (kicker, title, accent line, numbered points), the handle, fade to black.
- **Sound**: a synthesised score (96 BPM pad, sub, arp, drums that sit out before each card) and effects on
  every cut, card and end-card beat. No samples.
- **Covers** for burned-in text in the source (old captions, a title box), drawn in footage space so they ride
  every zoom.

## Run it

```bash
cd projects/coach-reel-template
npm ci
bash scripts/reel.sh jobs/tomhutch-sample.json     # → renders/tomhutch-sample.mp4
```

The sample takes about 15 minutes in a 4-core container, most of it the picture render. `reel.sh` runs five steps
and skips any whose output already exists (`FRESH=1` redoes them all):

1. **prep**: trims the source, scales and crops it to 9:16, grades it → `public/jobs/<name>/footage.mp4`;
   cleans the voice → `work/<name>/voice.wav`.
2. **words**: copies the job's transcript, or runs `scripts/transcribe.py` (faster-whisper `small.en`;
   needs `pip install faster-whisper` and access to huggingface.co for the first model download).
3. **props**: `scripts/props.mjs` turns the job and the words into `work/<name>/props.json`: cuts, card timings,
   end-card beats, sound cues.
4. **render**: `remotion render CoachReel --props=work/<name>/props.json --muted`. Extra arguments after the
   job file go to Remotion (`--concurrency=4`, `--frames=0-90` for a quick check).
5. **sound + mix**: `scripts/sound.mjs` writes the score and effects; ffmpeg ducks the music under the voice,
   brings it up for the end card, normalises, and muxes → `renders/<name>.mp4`.

To check a frame before a full render: run steps 1–3 once (`reel.sh` with `--frames=0-1`), then
`npx remotion still CoachReel out.png --props=work/<name>/props.json --frame=150`. `npm run studio` opens
the sample in Remotion Studio (`src/sample-props.json`).

## The job file

`jobs/<name>.json`. Only `name`, `source` and `end` are needed; everything else has the coach-reel default.
Times are seconds from the start of the trimmed clip; positions are pixels on the 1080×1920 frame.

| key | default | what it does |
|---|---|---|
| `name` | | output name: `renders/<name>.mp4` |
| `source` | | the clip, relative to the job file (any size or aspect; it's cropped to fill 9:16) |
| `trim` | whole clip | `[in, out]` in source seconds |
| `words` | transcribe | a transcript file next to the job: `[{"w","s","e"}]` (what `transcribe.py` writes) or `[[w, s, e]]`, in source seconds |
| `fixes` | `{}` | `{"heard": "meant"}` spelling fixes applied to the transcript |
| `theme` | volt on black | `accent`, `bg`, `ink`, `mute` colours (`#RRGGBB`) |
| `focusY` | `700` | the height of the face: the camera zooms about it |
| `hook` | | `tag` (the mono pill), `y` (`210`), `until` (end of the first sentence), `scale` of the opening frame (`1.16`) |
| `speaker` | none | `{"name", "role"}`: a name chip after the hook |
| `cuts` | automatic | `[{"t", "scale"}]`. Automatic: a cut at a sentence, comma or pause boundary every `cutEvery` (`2.2`) s, cycling `cutScales` (`[1.12, 1.26, 1.16, 1.3]`), plus one as each card wipes off |
| `covers` | none | burned-in text to hide, in footage space: `{"mode": "band", "y"}` darkens everything below `y` (the original coach reel); `{"mode": "blur", "x", "y", "w", "h"}` a feathered blur; `{"mode": "patch", …, "color"}` a soft solid box. Optional `from` / `to` |
| `captions` | | `y` (`1385`, the centre of the caption line), `maxWords` (`3`), `maxChars` (`17`) |
| `emphasis` | `[]` | words set in the accent serif italic (matched without case or punctuation) |
| `cards` | none | `[{"at", "dur" (2.2), "lines": ["Niche", "down."], "sub", "size"}]`. Each line rises on the word it starts with if that word is said during the card |
| `cardLabel` | `"Part"` | the label over the card count (`PART 01 / 03`) |
| `chapters` | `true` | the chapter rail (shown with two or more cards) |
| `end` | | `kicker`, `title`, `accent` (one line or a list), `points` (defaults to the card titles), `handle`, `cta` (`"Follow for more"`), `dur` (`3.5`) |
| `music` | on | `{"on", "gain" (0.38), "bpm" (96)}`. Turn it off when the source already has a music bed |
| `sfxGain` | `0.5` | effects level in the mix |
| `sfx` | | extra cues `[{"t", "kind", "g", "d"}]`, kinds as in `scripts/sound.mjs` (impact, whoosh, riser, pop, stamp, chime, check, notify…) |
| `grade` / `voice.clean` | on | `false` skips the ffmpeg grade / the voice chain |

Cards cover the speaker, so put them where the line itself is the point and keep them to two or three seconds.

## The sample

`jobs/tomhutch-sample.json` runs on the Tom Hutcheson reel already in the repo
(`projects/tomhutch-10k-mindset/assets/footage/source.mp4`), with the transcript from that project. It shows
both cover modes: a patch over the white title box for its first 8.85 s and a blur strip over his burned-in
captions. Music is off because the source has its own bed. It's a test piece: the footage is his, so don't
publish it.

## What's not here

The original's bespoke graphics (the cold-DM thread, the lead pipeline, the dot crowd, the charts, the split
screen) were drawn for that one script. Build those per video in the reel's own project and add them to
`src/Reel.tsx`; the timing helpers in `src/theme.ts` (`k`, `spr`, `lerp`) and `Cutaway`, `Rise` and `Ground` in
`src/ui.tsx` are the pieces they were made from.
