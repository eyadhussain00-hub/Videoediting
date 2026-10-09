# CEOwills (Adnan) — short-form reels · preset v4

> Current rules only. Numbers live in `layout.json` (if this file and the JSON disagree, the JSON wins). Why each rule
> exists is in `HISTORY.md`; you don't need to read it to edit a video. Run the scripts in `tools/ceowills/` and
> `tools/common/`, don't rebuild them from prose, and start every job from the closest `jobs/*.edit.json`.

## Who is who

- **Eyad** = editor (the person you work for). **Adnan** = client, on camera. Brand **CEOwills**: UK Islamic wills, IHT,
  inheritance, probate, for UK Muslim families and business owners. **Sofian** (SK Media) passes on Adnan's notes and
  graded the house look. Other editors' cuts are the bar to beat, not the style to copy.

## How Eyad wants the work (read first)

1. **Batch or one at a time is Eyad's call per project.** He says which when he hands the videos over. *Batch* = edit
   every video in the set, then send all the finished previews together so he can finalise them in one go. *One at a
   time* = send a preview, wait for "next". If he hasn't said, ask once before starting. Don't carry one project's
   choice over to the next.
2. **He sees finished work only.** Plan, draft and check yourself. Drafts are for looking at frames, never for sending.
   Ask mid-way only when you're genuinely blocked on a decision.
3. **Telegram (`tools/tg.sh`) = finished previews + real blockers.** `deliver.sh` sends each preview with its title,
   version, length, what changed, anything he must do (approve an upload, empty the Bin), and ends with this session's
   link (`SESSION_URL=https://claude.ai/code/session_…`). No drafts, plans or progress notes. Errors you can fix
   yourself never go to Telegram. When something needs his input: `bash tools/tg.sh msg "⚠️ <what's blocked> — <what
   you need>"`, ending with the session link. His Telegram replies don't reach the session, so he answers here.
4. **Heads-up before any approval tap.** Before a call that needs Eyad's tap in the Claude app (Make scenario runs,
   anything with credits), send `tg.sh msg "🔐 Approve <what> in the Claude app — <why>"` (or put it in the preview
   caption when it's the Drive upload). Ask before spending money (vidIQ credits, paid tools).
5. **Every new failure type gets an automatic check** (`check.py` before rendering, `qa.py` after) in the same commit
   as the fix.

## Which videos, and the Drive folders

- **Queue = `tracker.json`.** Only the rows that are **unmarked** on Adnan's board are ours (white = other editor, red =
  already edited). Work one mic part at a time: `current_mic`, first `todo` in board order; move `current_mic` on when
  that part has none left. Re-list `RSV Video/Adnan/Export/` before you pick and before you bin anything: an export
  there means done, whatever the tracker says (fix the tracker). Another session may be working in parallel — an
  `upload-session-*.txt` that isn't yours is someone's upload in progress, leave it.
- **Adnan's folder is read-only:** `CEOWILLS TikTok, Reels and Shorts` (`1lCF2F3MnaHwTmrMLrEdLW0-GviTWUimx`; raw videos
  `1q0gtI4OWvbvLpK6nKZ3J3BxbXDka3CWT`, mic files `1h2HDh8EMbqnTDCnM4SiQitc2iVeXsPDi`, CTA PNGs `CALL TO ACTIONS/`,
  nasheed list `NASHEED SOUNDS/`). Never move, rename or delete anything there. **Download from it** (`fetch.sh --map`).
- **Our folder `RSV Video/Adnan/`:** `Raw videos (22 Sep shoot)/` (`1AvNKVRAofoALNkv01yI_6aFZustyRfjn`) and `Mic files
  (22 Sep shoot)/` (`1HuBCzDNHn9sIvgMH1zsoumqzoVNQ5Npb`) hold at most one raw and one mic part — don't copy footage in
  unless Eyad asks (our Drive is small; it filled up once and blocked a delivery). `Export/`
  (`143ZMKFEg4NSxAnCI9uWsLkUlGbEt03-D`) holds **one file per video**: `CEOwills - <Title> - v<N>.mp4`.
  `Reference edits (other editors)/`, `Adnan Files/` (CTA copies, nasheed list, the toolkit zip and the session prompt).
- **Drive full** shows up as *"The caller does not have permission"*, even for a 1-byte file (folders and renames still
  work). That's storage, not access: don't retry, tell Eyad in one message, keep the file locally. Binned files count
  until the Bin is emptied.
- **Tracker:** status `edited` when the preview is sent, `exported` once it's in Export, plus `version`, in the same
  commit as the job.

## Hard rules

1. **Audio = Adnan's voice + a voice-only nasheed in Adnan's rotation.** No music, no instruments, ever (halal). SFX only
   non-musical and rare. (4–6 Oct the set went out voice only; 7 Oct Adnan asked for nasheeds again, with a rotation — see
   Nasheeds below. `tracker.json` names each video's nasheed and check.py fails a job that differs.)
2. **Lav mic, never the camera audio.** `match_mic.py` gives the synced `<clip>.mic.wav`. `NO MATCH` = the mic part is
   missing: ask Eyad, never fall back to camera audio silently. Check the camera file's rotation (Sony files are often
   sideways → `"rotate": "ccw"`).
3. **Captions say exactly what he says.** Fix Whisper spellings through `glossary.json`, never paraphrase. A take with
   no spoken CTA gets no end CTA (`qa.py --no-cta`, say so in the caption).
4. **Cut clean and fast (ExamQA pace).** Drop the slate ("two, one, go" — cut in at the silence after "go"; the
   director's countdown is faint on the lav, so check the energy map, not just Whisper — #12 had it inside the first
   cut until 30 Sep; `stutters.py` now fails a leftover "go"), the tail ("good, good"), false
   starts, lines said twice, and **every stutter** ("one of the, one of the…", "a blueprint, blueprint") — stutters are
   always Eyad's first note. When the director asks for a different take between tries, use the last one he asked for.
   Don't cut inside a ≤0.5 s breath straight after a key line. Every pause ≥ 0.16 s is cut to 0.08 s (`pauses.py`;
   `tighten.py` re-cuts an existing job that way and moves its cards onto the new timeline).
5. **Frame 1 carries the title and the logo.**
6. **Nothing covers Adnan's head.** The title and the iMessage cards sit high; his hair top is at y ≈ 325–440 depending
   on how far he leans, and grazing the top of his hair is the limit. `qa.py` checks it on real frames; when a card
   would touch his hair, move it (`"ctas": [{"key", "at_out"}]`) to where he's lower or shrink it for that job
   (`"notify": {"width": 540}`). Moving it is the default (29 Sep final pass: #2/#7 second card 55 → 62 s, #16 card 25 → 32 s, #6 card
   25 → 20 s because he leans in from 22–38 s). When the title touches his hair as he leans in, end it sooner
   (`hook_until`; #9's title now ends ≈7 s). Try card times against the finished render before re-rendering: run
   `python3 cardfit.py <render.mp4> <card bottom> 55 58 62 …`.
7. **Captions never on his chin** (Sofian, 30 Sep) — they sit below his beard; `qa.py` checks every 0.5 s on real
   frames. **His head never reaches into the blurred fill above the shot** (the red circle on #14) — `qa.py` checks it;
   a job without cards where he leans in sets `"frame": {"shift_y": 0}` (zoom kept, no move-down).
8. **Premium and minimal.** Real full-frame footage. No boxes or pills behind text, no emojis, glow/flash transitions,
   light leaks or dust overlays. White + CEOwills red only.

## House style (all numbers in layout.json)

| Element | Now |
|---|---|
| Captions | Baseline y 1430, below his chin. Inter Tight 700, 72 px, white, strong 3-pass drop shadow. ALL-CAPS and numbers → Playfair 800 white with a red underline that draws in (honorifics SWT/SAW/PBUH stay plain). **Never the Pinyon script.** 1–3 words per chunk, broken on phrases; each word appears as he says it; the chunk is laid out once so nothing shifts |
| Title (hook) | Top of frame over a soft black scrim: every line — the question included — **one sans size, 64 px** (Sofian 30 Sep: "the question mark and text are different size"; `hook.uniform`); `_MARKED_` words keep a red underline. ≤ 22 characters a line. Fades at `hook_until` (end of the first sentence, before the first card at 25 s) |
| Logo | Red `CEOwills` (Arimo 700, `#EB1519`, 392 px wide, baseline 1600), centred on its ink, every frame, over a black bottom gradient from y 1300 (30 Sep, Sofian: "the gradient is so high" — it started at 1000, doubled) |
| Frame | **Zoomed 1.08× and moved down 190 px** (Sofian, 30 Sep) so there's room above his head; the space above is the same shot zoomed + blurred, faded in over 70 px (190–260; was 170, it smeared his hair). No move-down in a reel without cards where he leans in (#14) |
| iMessage cards | **Off** (Eyad, 5 Oct: "send them again without the ctas" → `"ctas": []`; 7 Oct: "remove call to action" = these cards, the spoken "Comment … below" stays; ask before putting them back. Adnan also sent a new headshot "for the iMessage picture" — Eyad: ignore it, the cards are off). When on: **Real-size iPhone banners** (Sofian/Eyad, 30 Sep: "so small it looks unrealistic"): 1000 px wide at y 100, Adnan's contact photo (his face from the video) with the Messages badge, "Adnan · now", frosted glass, ceowills.com in red, drawn by render.py (`notify.style: ios`). Slide down, 6 s each, first at 25 s then every 30 s, never over the end CTA, none in reels under 30 s, notification sound on each. **Text written for what he's saying at that moment, different in every video** — see below |
| End CTA | From "Comment" to the end, 1.12× size, the keyword in the job's spelling with the red underline. Two keywords (#10) is fine when he says two |
| End card | **Every video** (Adnan, 7 Oct: "add it at the end of every video please"): his "Welcome to the Great Wealth Transfer / follow me on social media" card (`endcard/great-wealth-transfer.jpg`) for 3 s after the last frame — 0.3 s cross-fade in, slow 1.03 push-in, no logo or captions on it, the nasheed carries on under it and fades out at the very end (`endcard` in layout.json; a job opts out with `"endcard": null`). qa.py checks it's the last thing on screen |
| Motion | Alternating 1.00/1.08 punch-ins at cuts, slow 3 % drift, one in-shot punch-in where he says the CTA |
| Grade | Sofian's Premiere look: **safe** 33³ LUT (`luts/sofian-juggling-safe.cube`) + measured vignette (`grade_fit`). The raw fitted LUT made grey/red blotches on bright skin (#14, a red cheek in #2) — 30 Sep: its difference from the curves is now smoothed and capped. Look at his face in close, bright shots on every contact sheet. New numbers from him go in layout.json, never hand-tuned filters |
| Audio | Lav through `voice_chain()` (hum notches, RNNoise, clarity EQ, de-esser, compressor), master **−15 LUFS**. Nasheed from the rotation (below), ≈ 11 dB under him, gentle duck; `nasheed.from` (source s) starts it later (#14: after "each pause") |
| Length | Keep the whole message: 15–120 s |

### iMessage cards: written for the moment, never repeated (Eyad, 29–30 Sep, "always remember this")

Good cards make Adnan money. Before the final render, read the transcript around each card time and write the card's
text for what he's saying there, in his voice ("hey brother / hey friend / hey CEO …", one idea, one ask, ending on
ceowills.com), ≤ 3 lines at 1000 px: `"ctas": [{"text": "…", "at_out": 25}, …]`. Every card in every video is
different — no copy-paste between videos. Adnan's seven PNG texts (`ctas.json`) are the tone to match; `{"key": …}`
still works and draws that text in the new style. `cardfit.py` / qa.py still check the card against his head.

## Pipeline

```bash
T=tools/ceowills; C=tools/common; W=$SCRATCH/ceowills      # $SCRATCH = the session scratchpad
bash $T/setup.sh $W                                         # ffmpeg, pillow, opencv, faster-whisper, yt-dlp, fonts, reachability
```

1. **Fetch** — 22 Sep shoot: `bash $T/fetch.sh --map <tracker n | name> $W` → raw in `$W/src`, its mic part in `$W/mic`.
   New shoot: find the video and the mic parts recorded that day in Drive (BWF start time: `ffprobe <wav>`), write
   `ids.txt` (`<id> <name>` per line), `bash $T/fetch.sh ids.txt $W/src` (mic parts to `$W/mic`), and add the clips to
   `mic_map.json` after matching.
2. **Sync** — `python3 $T/match_mic.py $W/src/<clip> --mics $W/mic --out $W/mic --map` → `<clip>.mic.wav`.
3. **Transcribe** — `python3 $T/transcribe.py $W/mic/<clip>.mic.wav --out $W/words`. Then the **verbatim pass**:
   `python3 $C/stutters.py $W/mic/<clip>.mic.wav` lists repeats, restarts and fillers Whisper smoothed away. Arabic
   words come out as English lookalikes ("fitness" = fitnas): re-transcribe that spot with an `initial_prompt`. Fixes
   go in `$W/words/<clip>.fixed.json` — one entry per displayed word; delete cut words rather than trimming them;
   merge "40 %" into "40%".
4. **Look** — `ffmpeg -i <raw> -vf "transpose=2,fps=2,scale=135:-1,tile=13x3" sheet.jpg` for rotation and what happens.
5. **Plan** — copy the nearest `jobs/*.edit.json` to `$W/edit.json` (schema at the top of `render.py`):
   `cuts` (long takes: pick the blocks and run `python3 $T/pauses.py <mic.wav> <words.json> --blocks "3.0-33.2,…"
   --video <raw>`; extend the last cut ~1.3 s if he holds after "…below"), `punch_at`, `hook` + `hook_until`,
   hand-set `chunks`, `cta` (`at` = source time of "Comment", `keyword`, `underline`), `ctas` (chosen, see above),
   `nasheed`, `name`. Then **`python3 $T/check.py $W/edit.json`** must print `OK` (warnings: read them).
6. **Draft (for you)** — `python3 $T/render.py $W/edit.json --draft` and look at the title against his head, the
   captions, each card and the last frame (red underline under the CTA keyword).
7. **Final** — `python3 $T/render.py $W/edit.json --out $W/out/<name>-v1.mp4`. `ffprobe` it (a render killed by an idle
   container leaves an mp4 with no duration → re-render).
8. **QA** — `python3 $T/qa.py $W/out/<name>-v1.mp4 --captions $W/out/captions.txt --boxes $W/out/boxes.json` must print
   `ALL PASS` (includes the head-clearance check on real frames), then `python3 $C/stutters.py $W/out/<name>-v1.mp4`
   must PASS (or every hit is a real word he meant — list them with `--ok`). Stop it at the end card (`--to` = `boxes.json` endcard[0]): Whisper hears the nasheed's singing there. Then **look at** `contact.jpg`.
9. **Deliver** — `SESSION_URL=… bash $T/deliver.sh $W/out/<name>-v1.mp4 "<Title>" v1 "<what changed>"` sends the
   preview to Telegram and prints the Drive upload. First version of a video → Make **"Drive: start resumable upload
   (any file)"** (7630409). A new version of a video already in Export → Make **"Drive: replace file (resumable, keeps
   the link)"** (see `deliver.sh`) so the link Adnan has never changes and nothing goes to the Bin. Check the Drive
   `fileSize` equals the local size, then trash the `upload-session-*.txt`.
10. **Wrap up** — save `edit.json` (+ fixed words) to `jobs/`, update `tracker.json`, add any new lesson to `HISTORY.md`
    and any new rule to this file / layout.json / a check, commit, push your branch and the shared branch
    (`claude/ceo1-video-sync-cleanup-s1cq6n`). If the prompt or house style changed, rebuild the client zip
    (`bash tools/common/pack.sh ceowills`) and refresh `Adnan Files/`.

Bump the version after every delivered render.

### Synced raw ("just sync it, no edits")

`bash $T/fetch.sh --map "<video>" $W` → `python3 $T/match_mic.py "$W/src/<video>" --mics $W/mic --out $W/out --map --mux`
→ `<clip>.synced.mp4` (camera video copied + the lav at one flat gain, upright). Send `bash $C/preview.sh <file> <out> 46`
of it and of the raw, plus `<clip>.mic.wav` as a document; say which mic part it came from.

### Nasheeds

`nasheeds.json` lists Adnan's approved voice-only nasheeds. Drive copies of 11 of them: `RSV Video/SK/SK Files/nasheeds/`
(download with `fetch.sh`); otherwise `yt-dlp -x --audio-format mp3 "<soundcloud url>"` (YouTube blocks the container).
Never substitute music.

**Rotation (Adnan, 7 Oct):** "every 3 or 4 videos use a separate nasheed — then after 12 videos are done you can use the
same 3 nasheeds again, rinse and repeat". In board order, 3 videos per nasheed, cycling **the-sins → bika-moulhimi →
hona-marro**: #2, #6, #7 the-sins · #9, #10, #12 bika-moulhimi · #14, #16, #17 hona-marro. The next three videos start the
cycle again on the-sins. Write the nasheed into the video's `tracker.json` row when you pick it up.
