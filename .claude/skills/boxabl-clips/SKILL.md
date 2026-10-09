---
name: boxabl-clips
description: Edit BOXABL clipping-campaign clips (ClipFlow × ASG) end to end — pick an open angle from the tracker, fetch footage from Boxabl's shared Drive folder, transcribe, plan a job, check it against the brief (no Kanye, no stock/ticker, BOXABL spelled right, whole home on screen, @boxabl / X tracking URL), render the 9:16 house style, QA and deliver with ready-to-paste captions. Use when Eyad or Mohanad says "Boxabl", "ClipFlow", "clips for the Boxabl campaign", or names a Boxabl source video.
---

# BOXABL clips

1. **Read `tools/boxabl/PRESET.md` in full.** It holds the brief's hard rules, how Eyad wants the work, the house style
   and the pipeline. `layout.json` holds the numbers; `glossary.json` the spellings and banned words.
2. **Batch by default** for this campaign unless Eyad says one at a time.
3. **Which clips:** `tools/boxabl/tracker.json` — done clips and open angles. Every new clip = a new source moment and angle.
4. Run the scripts in `tools/boxabl/`; never rebuild them inline. Start from the closest `jobs/*.json`.
   Gates: `check.py` prints `OK` before rendering; `qa.py` prints `ALL PASS` after; then look at the contact sheet.
5. Deliver with `deliver.sh` (Telegram, ending with this session's link) **and** SendUserFile the clips + a posting pack.
6. Wrap up in one commit: `jobs/`, `tracker.json`, new rules → PRESET.md/layout.json/a check, lessons → HISTORY.md.
   Push your branch and the shared branch `claude/ceo1-video-sync-cleanup-s1cq6n`.
