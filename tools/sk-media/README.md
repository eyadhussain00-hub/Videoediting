# tools/sk-media

SK Media funnel-breakdown reel pipeline. Shared with other clients: `../tg.sh` (Telegram), `../common/stutters.py` (verbatim stutter check, must PASS), `../common/preview.sh`, `../common/pack.sh`. Scripts only — never commit video (`output/` is git-excluded).
Python runs through `uv` (see PRESET.md for the exact `--with` flags). Worked example: `jobs/tjr-v3.json`.

| Script | Does |
|---|---|
| `setup.sh` | Fresh-container setup: ffmpeg, uv envs, secrets check, reachability report (idempotent) |
| `fetch.sh` | Parallel Drive downloads, rejects HTML sign-in pages, caches |
| `sync.py` | Every screen recording × every webcam, audio NCC → match + offset (≥ 0.9 or flagged) |
| `transcribe.py` | Local faster-whisper word timings (medium.en default), cached by file hash |
| `facetrack.py` | OpenCV face track every 0.5 s for face framing |
| `plan.py` | **job.json → plan.json**: cuts, pause removal, voice master, captions, timed graphics, SFX mix |
| `pauses.py` | Two-band silence detection → frame-aligned stutter-free EDL (`--word-guard edges` for loose ASR timings) |
| `audio.sh` | Voice master: HPF → denoise → comp → gain + limiter → linear loudnorm −14 LUFS / −2 dBTP |
| `sfx.py` | Noise-based whoosh / pop / tick (no music) mixed −18 dB under the voice, then limited |
| `render.py` | plan.json → 1080×1920 mp4 in parallel chunks (+ boxes.json, face_track.json); `--stills` for quick checks, `--draft` for 540p |
| `graphics.py` | TJR-V2 house style: headline, numbered section tag + progress, pills, badges/count-ups, quote cards, chips, flow, Follow/comment CTA |
| `qa.py` | Encode, loudness, black/frozen, empty cards, layout lint, face centring/jitter, captions, contact sheet |
| `deliver.sh` | Preview < 29 MB → Telegram (via `../tg.sh`, with the session link) + chat; full quality → Drive (rclone, or the Make new-file / replace-in-place route) with size check |
| `layout.json` | Single source of truth: coordinates, style, motion, audio, cut and QA thresholds |
| `glossary.json` | ASR fixes; QA fails if any wrong form appears in captions |
| `fonts/` | Inter Tight (captions/UI) + Anton (headlines, tags, badges) — both OFL |

Verified end-to-end on TJR – Video 3 v2 (92.1 s, QA ALL PASS, stutters PASS, delivered to Drive).
