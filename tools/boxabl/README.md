# tools/boxabl

BOXABL clipping campaign (ClipFlow × ASG) — short vertical clips from Boxabl's shared footage. Scripts only, never
video (`output/` is git-excluded). Rules: [`PRESET.md`](PRESET.md). Why: [`HISTORY.md`](HISTORY.md).
Shared with other clients: [`../tg.sh`](../tg.sh) (Telegram) and [`../common/`](../common/) (Drive downloader, preview encode, zip packer).

| File | Does |
|---|---|
| `setup.sh` | Fresh-container setup: ffmpeg (+ ffprobe shim when only pip ffmpeg is available), faster-whisper, fonts, reachability |
| `drive_index.json` / `index.py` | Every media file in ClipFlow's `BOXABL Content To Clip` folder (path → Drive id) / rebuild it |
| `fetch.py` | `--find` the index; download a job's sources to `<ws>/src/<key>.mp4` (via `../common/fetch.sh`) |
| `transcribe.py` | Word-level transcript (faster-whisper small.en), cached by file hash |
| `check.py` | **Before rendering:** brief rules — whole-home shot, hook at 0 s, BOXABL on screen, banned words in titles/posting/kept speech, @boxabl + X tracking URL, length, reuse of other jobs' moments |
| `render.py` | `job.json` → 1080×1920 clip + `.captions.txt`, `.overlays.txt`, `.post.md` (`--draft` for a quick look) |
| `qa.py` | **After rendering:** encode, length, loudness, black/frozen, spelling, banned words, BOXABL on screen, captions, posting text, contact sheet |
| `deliver.sh` | Copy to `output/boxabl/`, preview + posting captions to Telegram with the session link |
| `layout.json` | Single source of truth: canvas, band, fonts, sizes, colours, audio, length, QA thresholds |
| `glossary.json` | Whisper fixes (Boxable → BOXABL, casino → Casita…), wrong forms, the brief's banned words |
| `jobs/` | Finished jobs — copy the nearest one to start a new clip |
| `tracker.json` | Which clips exist, their angle, status and version; which angles are still open |
| `fonts/` | Anton + Montserrat Black (OFL) |
| `NEW-SESSION-PROMPT.md` | The prompt to paste into a new session |
