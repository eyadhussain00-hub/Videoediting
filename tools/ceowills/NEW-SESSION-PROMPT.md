# Paste this into every new CEOwills session

Same text every time; add one line saying **batch** or **one at a time** (and which videos, if not the next ones in the
tracker). Everything else — house style, Drive rules, Telegram rules — lives in `tools/ceowills/PRESET.md`, so this
prompt never goes stale when the style changes.

```
CEOwills: edit Adnan's videos — <batch | one at a time>, <"next in the tracker" | which ones>.

1. Setup: git fetch origin claude/ceo1-video-sync-cleanup-s1cq6n && git merge origin/claude/ceo1-video-sync-cleanup-s1cq6n
   That branch is the shared home of the video toolkit and tracker. You have my permission to push your commits to it
   as well as to your own branch, so the next session starts where you finished.
2. Read tools/ceowills/PRESET.md in full and follow .claude/skills/ceowills-reel/SKILL.md.
3. Telegram: only finished previews (and real blockers), each ending with this session's link (SESSION_URL=… for deliver.sh).
```
