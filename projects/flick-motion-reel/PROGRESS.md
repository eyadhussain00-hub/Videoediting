# Flick motion reel: "Best business model for Muslims"

Source: https://www.instagram.com/reel/DT07wCwCHm2/ (56 s talking head). Downloaded with yt-dlp to
`flick-output/brand-assets/source.mp4` (gitignored; re-download it, then copy it into `flick-output/remotion/public/brand-assets/`).

Edited with the **Flick** skill (`skills/flick`, from Creatorberry/flick), and rendered with Remotion.
- `flick-output/transcript.json`: Whisper word timings (Flick's `transcribe.mjs`)
- `flick-output/flick-plan.md`: the 8-scene storyboard
- `flick-output/remotion/src/scenes/*`: one component per scene, each registered as its own composition
- `flick-output/remotion/src/FinalReel.tsx`: the merged reel (source + punch-ins + caption bar + scenes)
- `src/captions.ts` is generated from transcript.json, with Whisper fixes (halal, crypto, models, interest)

Rebuild: `node skills/flick/scripts/bootstrap.mjs --project flick-output --package-manager npm` (the `--package-manager`
flag is required: without it, bootstrap misreads `--project` as the package manager), then from `flick-output/remotion`:
`npx remotion render src/index.tsx final-reel <out>.mp4 --concurrency=4` (about 5.5 min).

Status (14 Oct): v1 rendered, 55.96 s, 1080×1920, −14.9 LUFS. Sent to Telegram. Waiting on Eyad's notes.

Outreach DM draft (sent to Eyad on Telegram, 14 Oct): same format as the five-currencies / $10K-mindset DMs,
with [Name] and [Drive link] placeholders.
