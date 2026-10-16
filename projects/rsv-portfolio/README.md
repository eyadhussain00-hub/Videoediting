# rsv-portfolio: before/after reels for RSV Studio's IG and TikTok

Two 9:16 reels (1080x1920, H.264, 30 fps) that show a raw clip next to our finished edit:
hook (0-2 s, over the raw) → BEFORE (raw, untouched) → AFTER (the delivered edit) → 2-3 s synced split screen → end card.

| Reel | Before (raw) | After (our edit) |
|---|---|---|
| `adnan_before-after.mp4` | Adnan's Sony file, camera audio, Drive id `1M1FpmsV6gNyknTlodY6HEOxtcFRYEUdL` | `CEOwills - HMRC can take up to 40% - v14.mp4`, id `1k5nqVYBXCG_By98avk5YkhVfeK1HRMsW` |
| `sk_before-after.mp4` | Sofian's Loom, FUNNEL BREAKDOWNS/VINH GIANG/vinh vid 2 shortform good, id `11oWxpW9ZcQsQ79Cvqua0JlhtlAbgxSAe` | `Vinh Giang - Video 1 - final preview.mp4` (project files, sk-media/vinh-giang) |

Rules: no music (voice + noise-based whoosh/pop from `tools/sk-media/sfx.py`), every segment matched to -14 LUFS
(gain, limit, re-measure), labels and end card share one style (`reels.json → style`), all overlays inside
y 160-1500 so the IG/TikTok UI covers nothing. The before footage is shown as filmed, never degraded.
Delivered to project files `RSV_Portfolio/before-after/` and Telegram (16 Oct 2026). Post captions: `captions.md`.

## Rebuild

```
W=~/work; mkdir -p $W/adnan $W/sk          # download raw + edit into these (tools/common/fetch.sh, ids above)
python3 -m pip install faster-whisper       # word timings for the BEFORE and split captions
ffmpeg -i $W/adnan/raw.MP4 -t 30 -ac 1 -ar 16000 $W/adnan/raw30.wav   # same for edit30 / sk raw40 / sk edit30
python3 transcribe.py $W/adnan/raw30.wav $W/adnan/edit30.wav $W/sk/raw40.wav $W/sk/edit30.wav
python3 build.py adnan $W out/ && python3 build.py sk $W out/
```

Fonts: Inter / Inter Display from `/usr/share/fonts/opentype/inter` (installed in the cloud image).
Split-screen sync: the raw pieces in `split.left` were found by audio cross-correlation against the edit
(Adnan: raw = edit + 3.704 s up to the edit's cut at 13.0 s, then + 4.161 s; Vinh: raw = edit + 14.103 s).
