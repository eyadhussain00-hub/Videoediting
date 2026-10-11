# CEOwills — history and post-mortems

> Why each rule in `PRESET.md` exists, in the order it was learned. **Sessions don't need to read this** — PRESET.md
> and layout.json hold the current rules. Read a section here only when you're about to change the rule it explains.
> Some lines below describe looks that were later dropped (Pinyon script, red title bars, 807 px cards): PRESET.md wins.

## Style spec (why it beats the other two edits)

Type system — taken from the other editor's 1-minute edit (the best-looking of the two) and made calmer:

| Job | Face | Size @1080 | Colour |
|---|---|---|---|
| Filler words (the, you, to, and…) | Inter Tight 700 | 62 px | white |
| The word that carries the meaning | Pinyon Script (copperplate) | 150 px | white |
| Acronyms and numbers (IHT, £19,000, 40%) | Playfair Display 800 | 118 px | white + red underline that draws in |
| Hook eyebrow | Inter Tight 700, caps, +6 px tracking | 32 px | white |
| Logo | Arimo 700 (Arial-metric), tight tracking | 97 px, 392 px wide | `#EB1519` |

- Words appear **as he says them** (160 ms fade + 14 px rise; script words also settle from 106 %). The chunk is laid out once, so nothing shifts as words arrive.
- Script needs air: spacing uses the ink bounds, plus 16 px extra either side of a script word. Two soft shadows (3 px and 14 px) keep thin script readable on bright windows.
- Caption baseline y = 1235, hook eyebrow baseline y = 143 (text top ≈ 120 from the edge) over a soft top gradient (no box), logo baseline y = 1600. Title and iMessage cards stay off Adnan's face (rule 3b): his hair top sits at y ≈ 335–440 depending on how far he leans, eyes ≈ 565.

| | Sofian's edit | Other editor (1 min) | **Ours** |
|---|---|---|---|
| Captions | one ALL-CAPS word, 5 colours | sans + script, one word at a time | same pairing, 1–3 words building in sync, red serif for acronyms |
| Extras | none | colour flashes, light leaks, dust/scratch overlay | none — the type does the work |
| Logo | big red wordmark | red wordmark, 37 px off-centre | same wordmark, same size and height, centred |
| Hook | text flashes | none | two-line hook (eyebrow + script/serif) for the first sentence |
| Cuts | hard | glow transitions | invisible: alternating 1.00/1.08 punch-ins, slow 3 % drift |
| Audio | camera-ish | music-like bed | lav mic, −15 LUFS, voice-only nasheed ducked under him |
| CTA | said, not shown | said, not shown | "Comment **IHT** *below*" held to the end, underline draws under IHT |

The competitor (@mohammadmarria, 17k followers, best posts 30k–121k views) wins on natural full-frame footage, a
persistent hook and 2–3 word captions with one highlighted word. We keep that rhythm and dress it more premium.

## Why these rules exist (Adnan – "business owner juggling", v1)

- **Rotation:** the Sony file was sideways; `rotate: "ccw"` fixed it — always check a frame first.
- **Mic file:** the camera audio was roomy; the lav chunk (`wills work 60 seconds, verbal agreement sofa.wav` @ 21:43) was ~8 dB cleaner.
- **Whisper says "Muslim owner":** both models agree — captions follow the audio, the title can say "business owner".
- **Short clips land under −14 LUFS** with linear loudnorm (peak-bound) → render.py adds make-up gain + limiter.
- **3-word mechanical chunks left orphans** ("to", "back") → hand-set `chunks` or the balanced chunker.
- **v1 used a white rounded title card and red pills — Eyad: "use more premium fonts, no plain rounded rectangle, logo exactly like the 1-minute edit"** → v2 type system above, no boxes anywhere, logo measured from that edit.
- **Script swashes collided with neighbouring words** → spacing from ink bounds + extra air around script.
- **Playfair italic caps looked like script** → upright Playfair 800 for acronyms.
- **v3: adding the nasheed pushed true peak to −0.2 dBTP** → post-mix loudness trim + limiter with extra headroom; bed raised from 22 to 18 dB under so it's actually heard.
- **v4 — Sofian's notes on v2/v3:** (1) wanted "The Sins (muffled)" as the bed; (2) the cameraman's "go" was audible in the first second — Adnan's first word starts ~0.6 s after it, cut in at the silence, not at Whisper's first-word time; (3) more contrast, whites/highlights/shadows and vignette → new `grade` in layout.json; (4) "IHT" in red was hard to read on the dark suit → white bold serif + red underline; (5) the jump cut straight after "IHT" felt rushed → don't cut inside a ≤0.5 s breath after a key line, keep it.
- **Whisper stretches the first word back into the slate** → render.py keeps words that end ≤0.25 s before a cut-in, and hand-set `chunks` now match the transcript by text (a dropped word used to shift every caption by one).
- **v5 — "make the background hearable":** v4's bed measured ~21 dB under the voice (ratio-4 ducking kept it squashed the whole time he talks) → bed ≈ 11 dB under, gentle ducking. Measure it (mix − aligned voice) rather than trusting the loudnorm target.
- **CTA notifications (from v5 on, longer reels only):** Adnan's iMessage PNGs + a synthesized one-tone ping (`sfx/notify.wav`, not music), every ~30 s for ~5 s.
- **v6 — Sofian's own grade:** he graded it in Premiere (Lumetri Basic Correction: exposure +0.3, contrast 24.7, highlights +20, shadows −12.9, whites +29.4, blacks −10.6, vignette −0.5). That is now the house grade: `layout.json → lumetri` (Lumetri units), turned into a tone curve + vignette by `render.py → lumetri_vf()`; a job can override it with its own `"lumetri"` block. When Eyad/Sofian send new Lumetri numbers, paste them there — don't hand-tune ffmpeg filters.
- **v7 — grade matched to Sofian's exported frame:** found the exact source frame (edge-correlation over the raw, 0.89), fitted per-channel curves + saturation + a measured radial vignette pixel-for-pixel (MAE 6/255 incl. WhatsApp JPEG) → `layout.json → grade_fit`, which now overrides `lumetri`/`grade`. To re-match a new look: get one exported frame, rerun the fit (steps in render.py `fit_vf` / `vignette_mask` docstrings), paste the result into `grade_fit`.
- **v7 clean-up pass:** captions no longer bleed across a cut into the next shot; light de-esser on the voice. Sync check: every caption within 0.1 s of the spoken word (Whisper on the final audio).
- **v8 — "match it exactly":** per-channel curves couldn't reproduce Sofian's vibrance (strong colours like the wood frame and red vest boosted, skin left alone), so the grade is now a 33³ 3D LUT fitted to his exported frame (`luts/sofian-juggling.cube`, referenced from `layout.json → grade_fit.lut`) + his measured vignette. Held-out colour error 4.6/255, most of it WhatsApp JPEG. Lesson: judge a grade match on colour-conditioned probes / held-out pixels, not patch averages — the frames are a couple of pixels apart and patch means mix in edges.
- **v9 — mic clarity:** the MIC 3 lav is clean (no clipping) but dark/muffled (2–6 kHz 12–21 dB down), a little boomy, ~28 dB over the room, faint 50 Hz hum. New `render.py → voice_chain()`: hum notches → RNNoise (`models/sh.rnnn`) → clarity EQ → light denoise → soft expander → de-esser → compressor. Measured: broadcast balance, ~39 dB voice-to-room, ASR confidence unchanged (0.97) — i.e. crisper without artifacts. Check a new mic with the same measurements before trusting the chain blindly.

## Session 2 clean-up (26 Sep) — what session 1 got wrong and what changed

- **`fetch.sh` cut file names at the first space** (`xargs -L1` word-splitting): "business owner juggling.MP4" was saved as
  "business", and two files starting with the same word would have overwritten each other (or hit the cache as the wrong
  file) → NUL-separated read loop; names with spaces, commas and curly quotes survive.
- **`match_mic.py`'s fixed score rule (≥0.25 and 2× the runner-up) rejected 4 of the 16 real matches** on the 22 Sep shoot
  (they scored 0.13–0.25 because a lav and a camera mic sound so different) → 3 probes spread over the clip, speech-band
  filtered, and the test is whether ≥2 probes agree on the offset. Also: each part's FFT is computed once, a clip that runs
  past the end of a part continues from the next (contiguous) part, and `NO MATCH` says what's missing instead of guessing.
- **Every session re-downloaded 1.4 GB of mic parts and re-searched them** → `mic_map.json` + `fetch.sh --map` +
  `match_mic.py --map`: one video + its one mic part in ~5 s, exact offset, no search.
- **Drive filled up** (11.5 GB of raw copies in `RSV Video/Adnan`) and the v9 upload failed; the connector reports a full
  Drive as "caller does not have permission" → download from Adnan's originals, keep only exports in our Drive, and test
  with a tiny file before a big upload.
- **An approval prompt sat unanswered** → rule 11: Telegram heads-up before any call that needs Eyad's tap.
- **`tg.sh` printed only "HTTP 400"** → it now prints Telegram's own error text and exits 1, refuses files over the 50 MB
  Bot API limit with a clear message, passes width/height/duration so vertical videos display upright, sends captions
  literally (curl read a caption starting with `@` or `<` as a file), and quotes paths containing `,` or `;`.
- **The lav is very quiet** (−40 LUFS, peaks near −14 dBFS; 32-bit float so no damage) → for "no edits" deliveries raise
  it with one flat gain (`--mux`), never compression or EQ.
- **"21years old parelegal" has no mic audio**: filmed at 15:22 camera time, before Mic 1 starts. Adnan's folder has the
  same 4 parts, so the earlier part (~15:40 mic clock) was never uploaded — Eyad to ask him. Mic clock = camera + 45:10.
- **First full video in Mic 1** = "culture leaving daughters out" (take 1:42–3:57 in the part; the camera clip starts at
  1:40.33). The first 1:40 of Mic 1 is off-camera direction plus a pickup line — not a video.

## Why these rules exist (Adnan – "culture leaving daughters out", v1, 99 s)

- **Long take (2:15 of speech):** layout's 15–45 s target was for short reels → now 15–120 s; keep the whole message.
  Structure followed Sofian's edit of the same raw (Reference edits): the first pitch ("Here's how we solve it… prescribed
  in the Quran") is said again later ("Here at CEOwills we can help…") → dropped, plus "You see" and a repeated
  "distributing it". Pause cuts with `pauses.py`: Whisper stretched words over Adnan's mid-sentence pauses ("parents"
  1.06 s, "over" 0.92 s), so a strict word guard couldn't cut them → only the edges of long words are protected now.
- **End CTA ran off both edges:** "Comment DAUGHTERS below" at CTA size was wider than the frame; the 2-line splitter
  balanced the wrong thing and never shrank → splits where the wider line is narrowest, shrinks to fit, and `qa.py` fails
  if any caption line is wider than `caption.max_w` (render.py records it in boxes.json).
- **Loudness came out −15.2 LUFS:** each stage sets its gain and then limits, and on long, peaky speech the limiter ate
  1–2 dB → a final loudness lock (measure, correct, re-limit, up to 3×) lands −14.3 after AAC.
- **A 0.08 s caption flash:** Whisper gave "Allah" 80 ms before "subhanahu" → its own chunk flashed for two frames →
  merge a very short word into the next chunk (QA: every chunk ≥ 0.25 s).
- **"SWT" drew a red underline** (all caps = acronym style) → `caption.plain_caps` keeps honorifics plain; this job
  writes "subhanahu wa ta'ala" out, which is also what he actually says.
- **Hook for a topic reel:** eyebrow + two markup lines fit where one long line would overflow: `["Muslim parents?",
  "*Don't leave out*", "your _DAUGHTERS_"]`.
- **Eyad: "move the title up so it doesn't cover his head but not too high"** — the 3-line hook at top 300 sat across his
  forehead and eyes → top 250 (eyebrow just under the platform bar at 210), gaps 96/98, sizes ~13 % smaller, shorter
  scrim (520). Check a 3-line hook against the first frames before the full render.
- **Eyad: "move title and CTA up so they don't cover his face, space above not too large, not too close to the edge"**
  — at top 250 the title still reached his hairline, and the iMessage cards (y 200, 930 px wide → 357 px tall) ran across
  his eyes once he leaned in → title text top 120 (baseline 143), cards at y 110 and native 807 px (316 px tall, sharper),
  scrim 460, new `hook.edge_margin` 100 checked by qa.py → rule 3b.

## Why these rules exist (Adnan – "hmrc can take up to 40%", #6, v1, 61 s)

- **Board names aren't file names** ("hmrc can take up to 40%" vs the raw's "…for IHT where will your family learn how to
  do.MP4") and `fetch.sh --map` wanted the exact name → it now takes the tracker number (`fetch.sh --map 7 $W`), the
  exact name, or any part of the name that picks one video (and lists them if it picks several).
- **Takes with a director's note between them:** the raw had "comment HMRC below", then off-camera "Should you mention
  the calculator instead?", then "comment calculator below" → use the take the director asked for (the last one). Same
  for a line he fumbles and restarts ("the liquidity, the fines, the funds…" → keep the second, clean pass).
- **CTA keyword lost its style:** Whisper writes "calculator" in lower case, so it never matched `cta.keyword`
  "CALCULATOR" → no serif, no underline, small sans. render.py now gives the spoken keyword the job's spelling.
  Check the last frame of every draft for the red underline.
- **"40 %" came out as two words** → merged into "40%" in the job's fixed words file (one displayed word = one entry).
- **yt-dlp wasn't installed** by setup.sh (nasheeds from SoundCloud need it) → setup.sh installs it.
- **Another session was working in parallel:** "Business owner juggling" v9 landed in Export at 10:37 while this session
  ran → re-list Export right before picking a video and before binning anything there; an `upload-session-*.txt` that
  isn't yours may be another session's upload in progress, so leave it unless its video is already in Export.
- **Drive quota:** binned files still count until the Bin is emptied, but copying one raw (620 MB) + one mic part
  (345 MB) in still worked after binning the four Mic 1 copies.

## Feedback on #6 v1 (Sofian/Adnan, SK Media chat, 27 Sep) → house style from v2 on

- "Add a black gradient like we used to do for ExamQA" → `logo.gradient` (bottom fade behind the logo, rule 3a).
- "Make the top text clearer so it's easy to read, maybe white text on a red background" → red title bars (rule 3c,
  `hook.style "bar"`). The earlier "no boxes" rule still holds for captions.
- "Put the iMessage CTA at 25 seconds" → `notify.first_s` 25; "make the call to actions a second longer" → `hold_s` 6.
  A ~60 s reel now gets one card (25 s) instead of two.
- "Make the mic volume just a little bit quieter" → master −15 LUFS and the bed 1 dB closer (`nasheed_db_under_voice`
  7), so the voice drops 1 dB and the nasheed stays put. qa.py reads the target from layout.json.
- These apply to every video from now on; a revision of an already-exported video bins its older export (Export keeps
  one file per video).
- Later the same day, on the captions: "can we just stick to this font [the bold sans], add stronger drop shadow — will
  be easier as well for you and looks clearer" → `caption.single_style "sans"` (every word Inter Tight 700, 72 px),
  `caption.shadow` = three offset passes (blur 3/9/20, alpha 235/210/150, drop 4/6/8 px), `line_h` 104 (was 150,
  sized for the script). `keywords` in edit.json no longer change the look; the CTA keyword keeps its red underline.
  #6 went to v3 and #7 to v2 with this; #7 v1 (mixed fonts) was previewed but never uploaded.
- The toolkit zip for the client lives in `RSV Video/Adnan/Adnan Files/` (`ceowills-media.zip`) with the paste-in prompt
  next to it as `CEOwills session prompt.txt` — refresh both whenever the prompt or the house style changes.
- Eyad's call after #6 v3 / #7 v2: "keep the top title same as before, only use one of the two fonts for captions, and
  add black gradient for the logo on the bottom" → `hook.style "type"` again (red bars dropped), captions stay single
  sans, gradient made clearly visible (it read as nothing over the dark suit: top 1000, alpha 255, power 0.7 — the
  white desk behind the logo now goes dark). #6 → v4, #7 → v3. When a look change is "not visible" on the phone,
  judge it on the brightest background in the shot (here the desk under the logo), not the average frame.
- Final word on fonts (Eyad, 27 Sep evening, with a still of #7's title): "you can use all fonts that you've been using
  except for the overly styled one, the other three are fine" → `caption.no_script` (sans + serif, no Pinyon),
  `hook.script_as` {sans, 72 px}; `single_style` removed. Nasheed: "use the sins muffled" on #7 → the-sins is the
  default bed now.
- A take without a spoken CTA (#9 ends "…don't waste any more money. I'm going to try that again", and the next
  clip is a different script) gets no end CTA — captions stay verbatim — and `qa.py --no-cta` (prints a NOTE instead of
  failing). Say so in the preview caption.
- A background render can die when the container idles (#7 v4: a 117 MB mp4 with no moov atom, process still listed
  hours later) → `ffprobe` the file before delivering; re-render if it has no duration.
- **Stutters are Eyad's first note (#9 v1, #7 v4):** "One of the, one of the reasons…", "successful, one-plus, one-million
  owner", "why have you been setting off and putting off", "a blueprint, blueprint". Whisper (medium.en) smooths these
  away — the normal transcript showed no repeat. Before planning cuts, re-run the first ~10 s and any long-looking word
  (>0.6 s) with an `initial_prompt` asking for verbatim repeats (`condition_on_previous_text=False`), then cut on a
  20 ms energy map. After rendering, Whisper the output to confirm the fix.
- **Re-ordering words with cuts works:** "one-plus, one-million" → cuts [one million][plus][owner] = "1 million plus".
  render.py now sorts kept words by output time. Re-time the words in the job's fixed words file to the real onsets.
- **Delete cut words from the fixed words file** instead of trimming them: render.py's "Whisper drifts early" rule
  pulls a word that ends ≤0.25 s before a cut-in back into the next shot (a cut "off"/"and" came back as a caption).
- **Two keywords in one CTA (#10):** Adnan says "Comment MORE if you'd like a free blueprint… and if you want our IHT
  calculator, comment CALCULATOR below" — the director kept it ("never seen someone mention two keywords"). The end
  CTA starts at the second "comment" (CALCULATOR); the first keyword is set in caps in the fixed words so it shows as
  serif + underline in the running captions.

## Eyad's notes after #6 v5 / #10 v1 (28 Sep, "95% good") → applied to all four exports
- "Centre the CEOwills logo perfectly" → logo_layer centres the visible ink (it sat 1.5 px left by advances).
- "Slightly stronger black gradient, by duplicating the layer" → `logo.gradient.passes` 2 (alpha 1−(1−a)²).
- "Make the text above his head clearer — get rid of that serif text" → `hook.serif_as` {sans, 72}: the title is all
  sans now (the _marked_ word keeps its red underline). Captions still use the serif for caps/numbers.
- "Use the iPhone message notification sound instead of that ding" → `notify.sfx_file` sfx/notify-iphone.wav, a
  synthesized tri-tone-style chime (3 quick bell notes; not Apple's own file). Old ping kept as sfx/notify.wav.
- "On the 1:00 video the CTA covers his head" → cards 600 px wide at y 100 (end ≈ 335; his hair top in #6 ≈ 335–350).
  Check a card frame on every video: if the hair reaches the card, move the card with `"ctas": [{"key", "at_out"}]`
  to where he's lower, or shrink `notify.width` for that job.

## iMessage CTA cards: match the topic, switch them up (Eyad, 29 Sep, "always remember this")
"Don't use the exact same iMessage call to action — switch it up here and there, and pay attention to what he's
talking about; it helps choose the right CTA. Good CTAs help make more money for CEOwills (Adnan's company)."
- Before the final render, read the transcript and choose each card for what he's saying at that point. Write the
  choice into edit.json (`"ctas": [{"key", "at_out"}]`) and give the reason in `_source`.
- Don't repeat the last few videos' cards. render.py logs every final render's cards to `cta_history.json`, and the
  auto-picker scores cards by how often their topic words come up minus a penalty per use in the last 4 videos
  (`notify.recent_videos`, `notify.repeat_penalty`). The auto-pick is a starting point, not the decision.
- Topic guide (ctas.json): tax/IHT/business/property → business-properties-wealth · legacy/building/passing down →
  legacy-decades · family/inheritance/"a conversation with me" → assume-family-inherit · talking to CEOs/owners →
  got-you-thinking · family outcome/children/documents → see-for-your-family · Islam/Sharia/Quran → islamic-uk-law ·
  general → clarity.
- Batch of 29 Sep re-picked this way: #6 business-properties-wealth; #7 legacy-decades + got-you-thinking;
  #9 business-properties-wealth (property portfolios); #10 assume-family-inherit ("have a deep, dark conversation with
  me"); #12 clarity + legacy-decades; #16 see-for-your-family; #14 none (31 s).

## Toolkit consolidation (29 Sep) — why PRESET.md got short
- **The rules had drifted apart in five places** (layout.json, PRESET.md, SKILL.md, the paste-in prompt, the Drive prompt
  .txt): the skill still said "script/sans/serif captions", pipeline step 5 still said red title bars, the style table
  still listed Pinyon 150 px, rule 3b still said 807 px cards at y 110, deliver.sh said "never overwrite an earlier
  version" while the preset said bin it. → PRESET.md now holds only the current rules; this file holds the why; the
  prompt no longer repeats the house style (it just points at PRESET.md), so a style change is edited once.
- **Batch vs one at a time** is chosen by Eyad per project (29 Sep: "I'll say batch or one at a time depending on the
  projects") — not a fixed rule. The 29 Sep set (#6, #7, #9, #10, #12, #14, #16) was a batch: edit all, then send every
  preview together to finalise.
- **Stutters were still caught by hand** → the verbatim checker SK already had is now shared (`tools/common/stutters.py`)
  and must PASS on the final.
- **Card over his head, CTA keyword without underline, auto-picked repeated cards** were all found only after a render
  → `check.py` lints edit.json first (keyword spoken at `cta.at`, cards chosen/relevant/not recent, title ≤ 22 chars and
  gone before 25 s, files present, hand-set chunks match) and `qa.py` finds his face on the real frames under the title
  and every card (`qa.hair_above_face`, `head_tol_px`).
- **Re-deliveries binned the old export** (Bin still counts against the small Drive) → Make "Drive: replace file
  (resumable, keeps the link)" (7680385) PATCHes the existing file: same id, same link, renamed to the new version.
  Tested 29 Sep on a throwaway file. The free Make plan allows 2 active scenarios, so the old SK-only 7619259 (hard-coded
  name/size, superseded by 7630409) was switched off. The session .txt's URL must be read with `download_file_content`:
  `read_file_content` escapes `&` and `_`.
- **render.py composited every static layer per frame** (the 1080×920 gradient, the logo, the title converted to float
  on every frame) → folded vignette + title + gradient + logo into one precomputed gain/add pair; captions and held cards
  are converted once and cached. Tested on a 25 s cut of #6: 111 s → 79 s per render, output 50 dB PSNR against the
  previous renderer (rounding-level, visually identical). What's left is x264 (slow, CRF 16) and ffmpeg's decode/grade,
  which already use every core — so no parallel-segment mode.
- **Windows paths broke ffmpeg filters** (`arnndn=m='C:\…'`, `lut3d=file='C:\…'` split at the drive colon) → `ffpath()`;
  Linux paths are unchanged. All text files are read/written as UTF-8 (layout.json has ≈, captions have ’).
- **qa.py head check calibration (#6 frames):** OpenCV's Haar box starts at his hairline to ~0.2 face-heights below the
  top of his hair → `hair_above_face` 0.12 + 12 px passes what Eyad approved and fails a card that reaches his face.
  Needs OpenCV 4.10 (newer builds dropped the Haar detector) — setup.sh pins it.
- **SK and CEOwills had three copies of sk-media** (the Drive zip = v1/v2, the SK branch = v3, an in-between copy on this
  branch) → merged v3 here; this branch is the one home for every client's video tools; zips are built from it
  (`tools/common/pack.sh`). Shared now: `tools/tg.sh`, `tools/common/{fetch.sh, stutters.py, preview.sh, pack.sh}`.

## Sofian's notes on the 30 Sep set (SK Media chat, 30 Sep 15:32–15:36) → all 9 re-cut 4 Oct
"Bro not gonna lie you're my guy but I can't keep sugarcoating — you're not checking the videos before sending them."
- **"Captions are never on his chin, they have to be below."** After the 1.08 zoom + 190 px move-down the caption
  baseline (1235) sat on his beard → baseline 1430. qa.py now finds his face every 0.5 s and fails a caption whose top
  is above his beard (Haar box bottom + 0.2 face-heights, calibrated on #14 frames).
- **Red circle round his head (#14, "it gets worse in the videos too").** The blurred fill above the moved-down shot
  faded in over y 190–360 — right where his hair is when he stands tall or leans into the lens (#14's first 12 s). The
  fade is now 190–260, qa.py fails if his hair reaches it, and #14 (no cards, so no need for room above him) isn't moved
  down at all (`"frame": {"shift_y": 0}`; render.py then skips the fill).
- **"You can hear me say 'go' at the start."** #12 cut in at 6.6 s, inside the director's "three, two, one, go"
  (6.6–7.3 s, ~24 dB under Adnan on the lav — Whisper on the normal transcript doesn't hear it). Now 7.38. A verbatim
  Whisper pass around every first cut-in is the check; stutters.py fails a leading "go"/"action".
- **"The trimming isn't fast like ExamQA."** Pauses ≥ 0.3 → 0.2 s left 10–25 gaps of 0.3–0.57 s per video, because
  pauses.py protected the whole of each Whisper word and Whisper stretches words over the pause after them. Now pauses
  ≥ 0.16 s → 0.08 s, words ≤ 0.35 s fully protected, longer ones 0.12 s at each end, end held ≤ 0.8 s. `tighten.py`
  re-cuts an existing job (each old cut is a block, so every stutter/reorder decision stays) and moves the cards to the
  same source moment. 3–7 % shorter, a jump cut every couple of seconds (hidden by the alternating punch-ins).
  render.py's caption_words used to drop a word whose (stretched) end fell into a removed pause — now clamped to its shot.
- **"The question mark and text are different size."** The tiny tracked-caps question eyebrow over big mixed-size
  lines → every title line in one 64 px sans (`hook.uniform`); `_MARKED_` keeps the red underline.
- **"The gradient is so high and different to ExamQA."** Bottom gradient started at y 1000 and was doubled (blacked out
  his chest) → starts at 1300, single layer.
- **"Start the nasheed after he says pause" (#14)** → `nasheed.from` (source s). Then Eyad (4 Oct): upload everything
  **without any background sound** → `"nasheed": null` on all 9; the card notification ping stays.
- check.py learned the 30 Sep `{"text": …}` cards (it failed them as "card None").
- **5 Oct, Eyad: "send them again without the ctas"** → `"ctas": []` on all 8 that had iMessage cards (#14 never had one;
  #17 is under 30 s so it had none either and was left at v13). With no nasheed and no card ping, nothing re-limited the
  voice after loudnorm and AAC pushed #16 to −0.4 dBTP / #7 to −1.1 → render.py now ends every mix with a 4×-oversampled
  true-peak limiter.

## Adnan's notes, 7 Oct (SK Media chat, passed on by Eyad) → all 9 finalised
- **"Add it at the end of every video please"** (his "Great Wealth Transfer — follow me on social media" card) → render.py
  `endcard`: 3 s after the last frame, cross-fade in, slow push-in (a still trips freezedetect and reads as frozen), the
  nasheed runs on under it. qa.py stops the face/caption/freeze checks at the card and checks the last frame is the card.
- **"Change iMessage picture to this"** (a new headshot) → Eyad: ignore it ("he's confused"); the cards are off since 5 Oct.
  Eyad: "make sure you remove call to action" = the iMessage cards only; his spoken "Comment … below" stays.
- **Nasheeds: "every 3 or 4 videos use a separate nasheed… then use the same 3 again"** → back on after the 4 Oct
  voice-only set, rotation in tracker.json (3 per nasheed, board order). #14 keeps Sofian's late start (`from` 18.64).
- faster-whisper 1.2 + PyAV 19 broke (`open() got an unexpected keyword argument 'metadata_errors'`) → transcribe.py and
  stutters.py decode with ffmpeg and pass Whisper the samples, so the PyAV version no longer matters.

## Sofian's notes, 9 Oct (SK Media chat, passed on by Eyad) → all 9 re-rendered 10 Oct
- **#6: "please entirely remove 2024 caption and words/audio — only mention 2025, as 2024 is an incorrect statistic"** →
  "in the year 2024 to 2025" became "in the year 2025": the cut splits at 17.79 / 18.76 (found on the mic's 10 ms energy
  map plus a prompted Whisper pass: "year" ends 17.74, the "t" of "twenty twenty-five" bursts at 18.78), "2024" and
  "to" leave the words file, the chunk becomes "in the year 2025". A new cut inside an alternating wide/punched run
  needs every later cut flipped, or two shots in a row share a framing; that made the CTA cut the punched one, so the
  in-shot `punch_at` there (which toggles) went.
- **"ALL VIDEOS → remove the top text on all videos"** → `hook.off` in layout.json; check.py fails a job with a `hook`,
  qa.py no longer looks for title ink on frame 1.
- **"Add call to action banner at the end of all videos"** → first round with Adnan's own CTA PNGs (Eyad picked them
  from a choice of three); after seeing them, Eyad: **"nah not the png use the banner"** → the drawn iPhone banner (the
  30 Sep card look) with text written for each video's ending, over the last 5 s, gone before the follow card
  (`end_banner` {"text"}; layout end_banner.style ios, 1000 px). The mid-video iMessage cards stay off.
- **With the title gone, qa.py saw the plant behind the fill as a face** (#7 at 2.8/16.2 s: a ~300 px box at y≈120 next
  to his 370 px one; his_face takes the top-most big box, so "his hair" landed in the fill and the seam check failed on
  a render that was fine) → a box that starts above the seam is dropped when a clearly bigger box sits below it.
- **#14 has no move-down** (he leans into the lens 5–12 s), so the full banner over the last 5 s met his hair while he
  leant in at 25–26 s → that job's banner is smaller (PNG 660 px, iPhone banner 800 px) over the last 2.6 s, after he
  sits back (head top ≥ 349).
- #7's stutter hit "need to, to make sure" (51.18 s) is two words he meant (`--ok 51.18`).
- Setup: `pip install -q` stalled 17 min with no output on a fresh container (killed and re-run, it took 30 s) → setup.sh
  wraps pip in `timeout` and shows failures. PyAV 19 again: our scripts decode with ffmpeg, but an ad-hoc Whisper call on
  a file failed → setup.sh pins `av<16` (also SK Media's uv commands and BOXABL's setup, whose transcribers pass paths).
- **Make isn't connected in this account any more** (no Make connector on 10 Oct), so the Export replace-in-place
  (7680385) couldn't run from the session; the Drive connector can't upload video.
