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
| `pauses.py` | Blocks you keep → `edit.json` cuts: pauses cut only in silence (or deep silence Whisper stretched a word over), frame-aligned, alternating punch-ins. `--edit job.edit.json` re-tightens a finished job with today's numbers, starts it after the director's "go" and remaps card times |
| `offmic.py` | Voices that aren't Adnan's (loud on the camera mic, quiet on his lav): the director's "go"/"good" at the head and tail of a take |
| `heads.py` | His hair top and beard tip per frame (YuNet, `models/yunet.onnx`): used by render.py (headroom per cut) and qa.py (title/cards/captions/fill vs his head) |
| `check.py` | **Before rendering:** lints edit.json (files, cuts, title length/timing, CTA keyword spoken, cards chosen/relevant/not repeated, nasheed, length) |
| `render.py` | `edit.json` → finished reel (`--draft` for a quick look) + captions.txt, boxes.json, edl.json |
| `qa.py` | **After rendering:** encode, length, loudness, dead air, black/frozen frames, title + logo on frame 1, captions, and on real frames every 0.5 s: title and cards above his hair, captions below his beard, the fill above the shot clear of his hair; contact sheet |
| `deliver.sh` | Copy to `output/ceowills/`, <29 MB preview to Telegram, prints the Drive upload (new file, or replace in place) |
| `layout.json` | Single source of truth: fonts, positions, sizes, colours, motion, audio targets |
| `glossary.json` | Whisper fixes (CLwills → CEOwills, haf → haqq, …) |
| `nasheeds.json` | Adnan's approved voice-only nasheeds, with mood notes |
| `ctas.json` / `cta_history.json` | Adnan's iMessage cards (id, text, topic tags) / which cards each final render used |
| `sfx/` | Synthesized notification sounds (non-musical) |
| `luts/`, `models/` | Sofian's grade as a 3D LUT; RNNoise model for the voice chain; YuNet face detector (heads.py) |
| `jobs/` | Finished `edit.json` files — copy the nearest one to start a new video |
| `tracker.json` | The queue: which videos are ours, current mic part, status of each |
| `NEW-SESSION-PROMPT.md` | The prompt Eyad pastes into every new session |
