# BOXABL (ClipFlow × ASG clipping campaign) — short clips · preset v1

> Current rules only. Numbers live in `layout.json` (if this file and the JSON disagree, the JSON wins); Whisper fixes
> and the banned list live in `glossary.json`. Why each rule exists is in `HISTORY.md`. Run the scripts in
> `tools/boxabl/`; don't rebuild them inline. Start every clip from the closest `jobs/*.json`.

## Who is who

- **Eyad** = editor (the person you work for). **Mohanad** = handles the accounts and posts the clips.
- **ClipFlow × ASG** = the agency running the campaign. All payouts, approvals and questions go through them, not Boxabl.
- **Boxabl** = the brand paying: foldable, factory-built homes; flagship product the **Casita** (also Baby Box, 2-story).
  Founder/CEO Galiano Tiramani (optional tag: @GalianoTiramani on X, @box_pusher on Instagram); co-founder Paolo Tiramani.
- Pay: **$2 per 1,000 views**, earns from 2,500 views ($5), capped at 250,000 views ($500) per clip. Budget $17,500.
  Views are the goal, so **volume + variety**: many different clips, each built to hold attention.

## How Eyad wants the work

1. **Batch by default** for this campaign (clips are short and independent): edit the whole set, then send all the
   finished previews together. If Eyad says "one at a time", send one and wait for "next".
2. **He sees finished work only.** Plan, draft and check yourself. Telegram (`tools/tg.sh`) = finished previews + real
   blockers, each ending with this session's link (`SESSION_URL=https://claude.ai/code/session_…` for `deliver.sh`).
   His Telegram replies don't reach the session — he answers here.
3. **Also hand every clip + its posting text over in the session** (`SendUserFile`), so Mohanad can post from there.
4. **Every new failure type gets an automatic check** (`check.py` before rendering, `qa.py` after) in the same commit.

## Hard rules (from the brief — breaking one = the clip is rejected or unpaid)

1. **No Kanye, anywhere.** Not in a frame, not in audio, not in text.
2. **Never mention Boxabl's stock, ticker (BXBL/FGMC), investing, crowdfunding, the IPO/SPAC or NYSE/Nasdaq** — in
   captions, titles, posting text, or kept speech. Sources are full of investor talk (NYSE interview, Reddit AMA, factory
   updates ending in "invest from $1,000"): cut around it. `check.py` scans the kept speech against `glossary.json`.
3. **"BOXABL" spelled right** in every caption and title. Whisper writes "Boxable" — `glossary.json` fixes it; `qa.py`
   fails on any wrong form. Tell Mohanad to turn the app's auto-captions **off** (ours are burned in).
4. **Show the whole home.** Every clip has at least one shot of the entire house (exterior, unfold, drone), marked
   `"home": true`, with BOXABL on screen at the same time. The car-review rule: whole car first, then the cup holder.
   A celebrity/feature moment must lead into the house — never a raw talking clip on its own (Elon talking → b-roll of
   the Casita).
5. **Real edits, not raw rips:** hook title in frame 1, burned captions, cuts, b-roll. **Positive only** — never trash the
   product or the talent (Elon, Post Malone, FaZe Rug…). **Nothing political or controversial.**
6. **No other brands' watermarks added**; avoid shots dominated by another brand (e.g. the rental-counter scene in the
   car-drop video). Crop out burned-in source captions (`"hf": 0.74`) so they don't double up or misspell BOXABL.
7. **No added music** (Eyad's rule for all clients). Source audio + voice only. Some third-party sources have music
   under the speech — see the open question at the end of HISTORY.md.
8. **Attribution in the posting text:** TikTok / Reels / Shorts → `@boxabl` tag + a Boxabl/Casita mention; **X → the
   tracking URL** (`[TRACKING URL]` placeholder, never the tag alone). `check.py` enforces both.
9. **No boosting, paid promotion, story boosting or bots** — say it in every hand-over; posting is Mohanad's.
10. **Read the transcript around every kept line.** `check.py` only catches banned *words*; negative outcomes (the car
    drop that breaks the roof), swearing, investor/stock framing and politics (zoning law, government orders) are
    phrasing — cut them by reading.

## House style (numbers in layout.json)

| Element | Now |
|---|---|
| Frame | 1080×1920. Source in a 4:3 band (y 520, 810 tall) over a blurred, darkened copy of itself |
| Hook title | Anton 116, white + yellow `*accent*`, 1–2 lines ≤ 22 chars, sits just above the band, **starts at 0 s**. Changes per beat (hook → context → payoff), always naming BOXABL when the home is on screen |
| Captions | Montserrat Black 84, ALL CAPS, ≤ 3 words, active word yellow, below the band. From the transcript (never paraphrased), brand spellings via `glossary.json` |
| Tag | Optional boxed label (e.g. `KITCHEN • BATHROOM • BEDROOM`) |
| Audio | −14 LUFS, TP ≤ −1.5. Speech from the source; b-roll can carry another source's speech (`"a"`) with its own sound as a bed |
| Length | 15–60 s, sweet spot 25–45 s |

### What a good clip is (the brief's "success" section, as edit decisions)

- **Hook in 2 s:** strong visual (house unfolding, car on the roof) or a celebrity face + a title that makes a claim
  ("ELON MUSK OWNS A *BOXABL*", "THIS HOUSE SHOWED UP *FOLDED*").
- **Story arc:** hook → context (who/where) → the whole home → one feature/moment → payoff line.
- **Vary:** each clip a different source *moment* and angle (celebrity, unfold, factory, price, strength test, 2-story,
  Baby Box, backyard ADU). `check.py` warns when a job reuses > 3 s of a moment another job used.

## Where things are

- **Footage (read-only):** ClipFlow's shared Drive folder `BOXABL Content To Clip` (root
  `14hsa8iKW0kFY9yAZBTsTUvxr_lgoGelk`; ~2,900 media files, indexed in `drive_index.json`). Main folders:
  `1. Most Viewed YouTube`, `2. 3rd Party Videos`, `3. BOXABL YouTube`, `4. Most Viewed Shorts`, `BOXABL Casita`,
  `BOXABL MEDIA ASSETS` (product videos, renders), `Casita Installs`, `Factory`, `News Segments`, `YouTube Uncut` (raw
  camera files), `zPR`. The brief's YouTube links are the same videos — **YouTube blocks this container; use Drive.**
- **ClipFlow's content doc** (`BOXABL Content`, shared with Eyad) links the folder + the Elon clip
  (`1OnH2B5N-TaGyHqPdmT0uxdCeA-38FXry`, Full Send podcast).
- **Output:** `output/boxabl/` (git-ignored) + Telegram + SendUserFile. No client Export folder.

## Pipeline

```bash
T=tools/boxabl; W=$SCRATCH/boxabl                     # $SCRATCH = the session scratchpad
bash $T/setup.sh $W                                   # ffmpeg (+ ffprobe shim), faster-whisper, fonts, reachability
```

1. **Pick** — read `tracker.json` (what's done, which angles are left). `python3 $T/fetch.py --find "<words>"` searches
   the index. Pick sources for a *new* angle.
2. **Fetch** — write the job's `sources` (`{key: "<index path>"}`), then `python3 $T/fetch.py $W/job.json --ws $W`
   (or `--get "<path>" <key> --ws $W`). 4 parallel, cached.
3. **Transcribe** — `python3 $T/transcribe.py $W/src/<key>.mp4` (small.en, cached by hash; Turkish/Russian sources:
   `--lang tr --model small`). Run it in the background right after the download.
4. **Look** — contact sheet: `ffmpeg -i $W/src/<key>.mp4 -vf "fps=1/<step>,scale=200:-1,tile=8x6" -frames:v 1 sheet.jpg`.
   Find the whole-home shots, the hook moment, other brands, burned-in captions (→ `hf`), and where the person sits
   in frame (→ `cx`).
5. **Plan** — copy the nearest `jobs/*.json` to `$W/job.json`: `segments` (source seconds; read exact word times from
   `$W/words/<key>.json`), `overlays` (output seconds), `post` (short + x), `home` flags. Then
   **`python3 $T/check.py $W/job.json --ws $W`** must print `OK` (read every WARN).
6. **Draft (for you)** — `python3 $T/render.py $W/job.json --ws $W --draft`; pull 6–8 stills and look at the hook frame,
   each title against the picture, a whole-home frame, and the last frame.
7. **Final** — `python3 $T/render.py $W/job.json --ws $W` → `$W/out/<name>.mp4` (+ captions/overlays/post files).
8. **QA** — `python3 $T/qa.py $W/out/<name>.mp4 --job $W/job.json` must print `ALL PASS`, then **look at** the contact
   sheet.
9. **Deliver** — `SESSION_URL=… bash $T/deliver.sh $W/out/<name>.mp4 "<Title>" v1 "<one line: angle + hook>"`, and
   `SendUserFile` the mp4s + a combined posting pack (all `*.post.md`, with the posting order).
10. **Wrap up** — copy the job to `jobs/`, add it to `tracker.json` (`status`, `version`, `angle`), lessons →
    `HISTORY.md`, rules → this file / layout.json / a check; commit; push your branch and the shared branch
    `claude/ceo1-video-sync-cleanup-s1cq6n`; `bash tools/common/pack.sh boxabl` if the toolkit changed.
