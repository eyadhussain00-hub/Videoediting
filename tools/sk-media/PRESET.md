# SK Media — Funnel Breakdown Reel · session preset v4

> New Claude Code session on `Videoediting` (its `main` is the shared home of every client's video tools — push your
> commits back to it), then say which video (e.g. "TJR video 4"). The zip in `RSV Video/SK/SK Files/` is only a fallback copy.
> **Do the whole video in one go — plan, cut, graphics, QA, deliver — without stopping for approval.**
> Only stop to ask when something is genuinely blocked (missing/ambiguous footage, a paid service, a failed upload).
> Everything repeatable is in `tools/sk-media/`. Numbers live in `layout.json`; if this file and the JSON disagree, the JSON wins.
> `jobs/tjr-v3.json` is a complete worked example — copy it and change the parts that differ.

---

## 0 · First 5 minutes

1. Merge the shared branch (above) so `tools/sk-media/`, `tools/common/` and `tools/tg.sh` are the latest.
2. `bash tools/sk-media/setup.sh "$SCRATCH/video"` — ffmpeg, uv envs (numpy / pillow / opencv / faster-whisper), reachability.

Secrets (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`) come from the environment settings or `~/.sk-media.env`, which **Eyad
creates** — the sandbox won't let Claude write credentials to disk. Never echo them. `tools/tg.sh` reads either.

## How Eyad wants the work
- **Batch or one at a time is Eyad's call per project** (he says which; if he hasn't, ask once). Batch = edit every video
  in the set, then send all the finished previews together; one at a time = send a preview, wait for "next".
- **He sees finished work only**, on Telegram: `deliver.sh` sends the preview with what changed and anything he must do,
  ending with this session's link (`SESSION_URL=https://claude.ai/code/session_…`). No "started", pause/resume or progress
  pings, no drafts. Errors you can fix never go to Telegram; a real blocker → `bash tools/tg.sh msg "⚠️ <what> — <what
  you need>"` + the session link. His Telegram replies don't reach the session — he answers in the session.
- **Before any call that needs his tap in the Claude app** (Make scenario runs, credits): `tg.sh msg "🔐 Approve <what>
  in the Claude app — <why>"` first, so it never sits unseen.

## Who / where

- **Eyad** = editor (me). **Sofian** = client, the person on camera narrating over a Miro board. Never "you/your face".
- **Raw footage** (read-only): Sofian's `FUNNEL BREAKDOWNS/<Subject>/vid N …` and Eyad's copies in `RSV Video/SK/<Subject>/Video N/`.
- **Final export goes to Eyad's folder:** `RSV Video/SK/<Subject>/Video <N>/Export/<Subject> - Video <N>.mp4` (create Export if missing).
  Never to the client's FUNNEL BREAKDOWNS folder.
- Drive search with the connector: `title contains '<Subject>' and mimeType = 'application/vnd.google-apps.folder'`, then
  `parentId = '<id>'` per folder. List **every** video folder of the subject — files get misfiled between them.

## Hard rules

1. **No music, ever (halal).** Voice + noise-based SFX only (`sfx.py`).
2. **Webcam = real camera pixels only.** No fill, blur-extend, mirror. Missing webcam → search all folders, then ask.
3. **Symmetric on x = 540, inside the safe zone.** All coordinates from `layout.json`.
4. **Opening:** Miro visible from frame 1 in the opening layout with the 2-line headline; hard switch to standard at 2.0 s.
5. **One CTA:** "comment `<KEYWORD>`" — spoken and on screen (Follow button + comment box typing the keyword).
6. **Drive:** never delete/rename until the replacement is uploaded and its size verified.
7. **Ask before spending money.**
8. **Every new failure type gets an automated check** (qa.py / plan.py warnings) before the next delivery.
9. **Telegram = finished previews + real blockers only** (see "How Eyad wants the work").

## Pipeline (one pass, ~35 min of work, renders ≈ 3 min)

| Step | Command | Notes |
|---|---|---|
| Ingest | Drive connector → `ids.txt` → `fetch.sh ids.txt $WS/src` | 4 parallel, ~6 s for 300 MB. Pull webcams from **all** video folders of the subject. |
| Sync | `uv run --with "numpy<2.3" python sync.py $WS/src` | Every .mp4 × every .mov. Accept NCC ≥ 0.9. Re-probe at 3–5 points to confirm zero drift. |
| Transcribe | `uv run --with faster-whisper python transcribe.py <file> words/<src>.json medium.en` | Run in background right after download. **medium.en** (small.en drops false starts → bad cuts). Cached by hash. |
| Overlap check | transcribe the previous video's export (`small.en` is fine) and diff | If > 30 % of the new material was already used, say so in one line and carry on (Eyad: "treat it as its own video"). |
| Face track | `uv run --with "opencv-python-headless==4.10.0.84" --with "numpy<2.3" python facetrack.py <cam> ft_<src>.json <t0> <t1>` | Background, parallel with transcription. |
| Screen region | look at 3–4 Loom frames | Crop the Miro canvas only (OBS/Loom UI covers the right side). V3: `[522,550,50,130]` on 1152×720. |
| Job file | copy `jobs/tjr-v3.json` → `$WS/job.json` | sources + offset, screen_region, headline, sections, cuts, beats, cta. |
| Plan | `uv run --with "numpy<2.3" python plan.py $WS/job.json` | cuts → pauses → voice master (−14 LUFS) → captions → timed graphics → SFX mix. Fix every `WARN`. |
| Stills | `render.py plan.json --out stills/s --graphics --stills 1,5.6,12.8,…` | ~5 s. Look at one still per section before the full render. |
| Render | `uv run --with pillow --with "numpy<2.3" python render.py $WS/plan.json --out out/final.mp4 --graphics --jobs 4` | 1080×1920, ~2.8 min for 95 s. Writes boxes.json + face_track.json. |
| QA | `uv run --with "numpy<2.3" python qa.py out/final.mp4 --boxes out/boxes.json --faces out/face_track.json --captions captions.txt` | Must print **ALL PASS**. Then **look at** `contact.jpg`. |
| Stutters | `uv run --with faster-whisper python tools/common/stutters.py out/final.mp4` | Verbatim ASR hunt for restarts ("so how does… okay, so how does"), cut-off words ("re- reality"), repeats, um/uh. Must PASS. Normal transcripts hide these. |
| Deliver | `SESSION_URL=… bash tools/sk-media/deliver.sh out/final.mp4 "<Subject>" <N> v<ver> "<what changed>" [<existing export id>]` | Preview < 29 MB → Telegram + chat; prints the Drive upload (new file, or replace in place for a new version). Verify Drive `fileSize` == local bytes; trash the temp session file. |

### Cutting (job.json → `cuts`)
- Structure: **Hook** (≤3 s to the surprising claim/number) → numbered sections → **My take** → **CTA**. Target 90–110 s.
- Each cut = `{section, src, in, last}` — `in` a bit before the first word, `last` = the last word to keep (+`occ`).
  Pick clean retakes: where Sofian restarts a sentence, keep the second attempt (check the RMS if timings disagree).
- **Stutters:** ASR merges restarts/fillers into one long "word" (V3: "optimize" spanned 13.34–15.34 and hid "— okay, so how
  does TJR"). Find them with `stutters.py` (or the verbatim prompt on a source range), read exact edges off a 20 ms RMS print,
  then cut with `in_t` / `out_t` (exact, unpadded) and fix the word list with `word_patch` so captions stay right.
  Every fix is in `jobs/tjr-v3.json` → `word_patch` with a `_why`.
- CTA usually comes from a different take (another webcam's audio): "If you want more tips like this… click the follow
  button and comment <KW> for the full breakdown video". Its screen card = dimmed Miro backdrop + CTA graphics.

### Beats (job.json → `beats`) — keyed to spoken words `"word@<SOURCE seconds>"` (time in the recording, not the edit)
Source anchors survive re-cuts: V3's stutter fix moved everything ~2 s and no beat needed touching. `word@cam1818:277.0`
picks a specific recording.
Types: `pill` (yellow, bottom-centre), `badge` (red stat, optional count-up `count`/`prefix`/`count_word`),
`quote` (dimmed card, 2 lines Anton white/yellow), `chips` (platform pills popping in on `item_words`),
`flow` (vertical chain with arrows). **Graphics say only what's said.** ~1 beat every 2–3 s, one at a time.
plan.py enforces: never cross a section/layout change, min reading time 300 ms + 250 ms/word (≥ 1 s), start earlier if needed.

## Style (must match TJR Video 2 — see `jobs/tjr-v3.json` for real values)
- Bg `#0d0d10`, cards `#17171c` r28. Stack: header → screen card → caption row → face card.
- **Opening:** 2-line headline in Anton (white line, yellow line), face card on top, screen below.
- **Section header:** red rounded tag with the number (`01`) + title in Anton white; thin progress bar (yellow) + `01/07`.
  Sections are numbered through My Take and Follow For More (e.g. `06 MY TAKE`, `07 FOLLOW FOR MORE`).
- **Captions:** Inter Tight 800, ≤ 4 words, active word yellow with 1.06 pop, brand names/numbers yellow.
- **Motion:** enter 280 ms ease-out-quint (y+24, scale .96), exit 160 ms; section tag slides up 200 ms with blur;
  count-ups ease-out-expo with tabular digits, done ≤ 400 ms after the number is spoken; face drift 1.00→1.03 per section,
  alternating 1.10 punch-in at joins between different moments.
- **SFX:** whoosh on section change, pop on graphic entry, tick on count-up end/Follow press; ≥ 1.5 s apart, −18 dB under voice.
- **Audio:** −14 LUFS, TP ≤ −2 dBTP (audio.sh handles very quiet mics now).

## Lessons (keep adding)
- **V2:** asymmetric layout, guessed crops, faked webcam fill, lingering/overflowing graphics, captions across card edges,
  flash-length graphics, mid-count numbers, black frames at joins, head twitch at cuts, clipped consonants, wrong webcam,
  early deletes, size limits (chat 30 MB, Drive connector 10 MB, Make free 5 MB, Telegram 50 MB).
- **V3:** Video 3's folder had the wrong webcam (right one was in the Video 2 folder) → sync every file across folders ·
  Video 2 had already used ~50 % of the Loom → overlap check · hypit/WhisperX don't start → faster-whisper via uv ·
  small.en dropped false starts → medium.en · ASR word spans swallow pauses → `pauses.py --word-guard edges` ·
  loudnorm silently undershot (−16.6) → audio.sh pre-gain + limiter · animated layout switch made cards overlap → hard switch ·
  QA face-jitter check mis-fired on punch-ins → normalised · badge commas drew like apostrophes → shared baseline ·
  captions lost words that straddled trimmed pauses → word ownership by cut · **don't stop at gates — deliver in one pass** ·
  v1 shipped with a stutter, a restart and an "um" in the first minute → `stutters.py` must PASS before delivery ·
  re-deliveries replace the Drive file in place so the link never changes (now the Make scenario "Drive: replace file").
- **29 Sep (merged into the shared branch):** the Drive zip was an older copy than v3 and the preset said to attach it →
  the branch is the source, the zip is rebuilt from it with `tools/common/pack.sh sk-media`. Telegram "started"/pause pings
  dropped (Eyad: previews and blockers only); `notify.sh` removed in favour of `tools/tg.sh`. A full Drive reports
  "caller does not have permission" even for a 1-byte file — that's storage, not access (CEOwills, 26 Sep).
