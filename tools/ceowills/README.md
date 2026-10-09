# tools/ceowills

Scripts for CEOwills (Adnan) short-form reels — scripts only, never video. Rules: [`PRESET.md`](PRESET.md). Why: [`HISTORY.md`](HISTORY.md).
Shared with other clients: [`../tg.sh`](../tg.sh) (Telegram) and [`../common/`](../common/) (stutter check, preview encode, zip packer).

| File | Does |
|---|---|
| `setup.sh` | Fresh-container setup: ffmpeg, pillow, opencv, faster-whisper, yt-dlp, fonts, reachability report (idempotent) |
| `fetch.sh` | Parallel Drive downloads (names with spaces are fine), rejects HTML sign-in pages, caches. `--map <n or name>` = that raw + its mic part from Adnan's originals |
| `mic_map.json` | Every video of the 22 Sep 2026 shoot → mic part + exact offset, Drive ids |
| `match_mic.py` | Lav audio for a camera clip → `<clip>.mic.wav` (same t=0 and length); `--mux` = synced raw |
| `transcribe.py` | Word-level transcript with faster-whisper, cached by file hash |
| `pauses.py` | Blocks you keep → `edit.json` cuts: pauses cut only in silence, frame-aligned, alternating punch-ins |
| `check.py` | **Before rendering:** lints edit.json (files, cuts, title length/timing, CTA keyword spoken, cards chosen/relevant/not repeated, nasheed, length) |
| `render.py` | `edit.json` → finished reel (`--draft` for a quick look) + captions.txt, boxes.json, edl.json |
| `qa.py` | **After rendering:** encode, length, loudness, dead air, black/frozen frames, title + logo on frame 1, captions, head clearance under the title and every card (face detection), contact sheet |
| `deliver.sh` | Copy to `output/ceowills/`, <29 MB preview to Telegram, prints the Drive upload (new file, or replace in place) |
| `layout.json` | Single source of truth: fonts, positions, sizes, colours, motion, audio targets |
| `glossary.json` | Whisper fixes (CLwills → CEOwills, haf → haqq, …) |
| `nasheeds.json` | Adnan's approved voice-only nasheeds, with mood notes |
| `ctas.json` / `cta_history.json` | Adnan's iMessage cards (id, text, topic tags) / which cards each final render used |
| `sfx/` | Synthesized notification sounds (non-musical) |
| `luts/`, `models/` | Sofian's grade as a 3D LUT; RNNoise model for the voice chain |
| `jobs/` | Finished `edit.json` files — copy the nearest one to start a new video |
| `tracker.json` | The queue: which videos are ours, current mic part, status of each |
| `NEW-SESSION-PROMPT.md` | The prompt Eyad pastes into every new session |
