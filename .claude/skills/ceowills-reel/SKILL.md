---
name: ceowills-reel
description: Edit CEOwills (Adnan) short-form reels end to end — pick the videos from the tracker, fetch the raw and its lav-mic part, sync, transcribe, cut, render the CEOwills house style (sans + red-underlined serif captions, no title, red logo over a black gradient, one of Adnan's CTA PNGs at the end, voice-only nasheed, follow card), QA and deliver. Use when Eyad says "CEOwills", "Adnan", "new video for Adnan", names a CEOwills raw file, or asks to set up a new video-editing client the same way.
---

# CEOwills reels

1. **Read `tools/ceowills/PRESET.md` in full.** It is the only rules file: how Eyad wants the work, the Drive map, hard
   rules, house style and pipeline. `tools/ceowills/layout.json` holds every number (it wins over the prose).
   `HISTORY.md` explains why each rule exists — only read it when you're about to change a rule.
2. **Batch or one at a time:** do what Eyad said for this project; if he didn't say, ask once.
3. **Which videos:** `tools/ceowills/tracker.json` (unmarked board rows only, one mic part at a time), cross-checked
   against `RSV Video/Adnan/Export/`.
4. Run the scripts (`tools/ceowills/`, `tools/common/`); never rebuild them inline. Start from the closest `jobs/*.edit.json`.
   Gates you must pass: `check.py` (before rendering), `qa.py` ALL PASS and `stutters.py` PASS (after).
5. Eyad sees finished previews only (`deliver.sh`, Telegram, ending with this session's link) and blockers that need him.
6. Wrap up in one commit: `jobs/`, `tracker.json`, new rules → PRESET.md/layout.json/a check, new lessons → HISTORY.md.
   Push your branch and merge it into `main` (this repo's `main` is the shared home of every client's video tools).

## Setting up another video-editing client the same way

1. Collect: where raw + mic files live, 2–3 previous edits (theirs or other editors'), one competitor account, brand
   colour (sample their watermark), music policy (both current clients: no music), CTA style, who gives feedback.
2. Analyse the previous edits with contact sheets (`ffmpeg -vf "fps=1/2,scale=180:-1,tile=8x6"`) and transcripts; write
   what to keep and what to beat.
3. Copy `tools/ceowills/` to `tools/<client>/`; change `layout.json`, `glossary.json`, the Drive map and the rules in
   `PRESET.md`. Shared helpers (`tools/tg.sh`, `tools/common/`) stay shared — don't copy them.
4. Edit the first video, fix what the first render shows, put the lessons in `HISTORY.md` and the rules in `PRESET.md`.
5. Commit, then `bash tools/common/pack.sh <client>` and put the zip + session prompt in the client's Drive "Files" folder.
