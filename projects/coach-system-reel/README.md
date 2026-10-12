# "Predictable income" — premium re-edit of a coach's talking-head reel

A spec edit of Steven Martin's reel ([@stevemartnjr](https://www.instagram.com/reel/DbhjU1iNjBY/), 48 s,
selfie video with burned-in captions) turned into a 51.5-second motion-graphics piece: 1080×1920, 30 fps,
with sound. His picture and voice are used as-is. Everything else is new: the grade, the camera, the
captions, the graphics, the score and the effects.

The finished film, `coach-system-reel.mp4` (51.5 s, 26.6 MB), isn't in git: it's on Google Drive (see
`PROGRESS.md` for where). `mix.sh` writes it to this folder, and it's gitignored here. It's a pitch piece: don't
publish it without his permission.

## What happens

| t (s) | beat | on screen |
|---|---|---|
| 0–4.45 | hook | snap zoom onto the face, "FOR ONLINE FITNESS COACHES" tag, word-by-word captions |
| 4.45–7.25 | the old way | cold-DM thread and a dead Facebook-group post, each struck through and stamped ✕ NOT NEEDED |
| 7.25–8.1 | face | tight cut |
| 8.1–12.45 | the new way | "A predictable *system.*" Content → Funnel → Calls pipeline with leads arriving on a steady beat; leads/week counts to 48 |
| 12.45–14.95 | face | chapter rail (01 Niche · 02 Numbers · 03 Funnel) builds under him |
| 14.95–17.2 | **01 card** | volt wipe, giant numeral, NICHE / DOWN land on the words |
| 17.2–20.35 | face | close-up, push on "specific" |
| 20.35–25.6 | niche | a crowd of dots: lit for "everyone", dead for "no one", a crosshair locks onto one: the ideal client |
| 25.6–26.6 | **02 card** | Know your numbers |
| 26.6–31.6 | rough → precise | a fogged, wobbling chart snaps sharp on "precise"; KPIs count in |
| 31.6–40.55 | split screen | footage in a window; below it, where clients come from (a red row for what's harming), then onboarding checks and a retention ring |
| 40.55–43.4 | **03 card** | Social funnel |
| 43.4–44.25 | face | |
| 44.25–48.0 | funnel | Run ads → Nurture on Instagram → Close light up on the words; prospects fall through; "New client signed" |
| 48.0–51.5 | end card | recap of the three moves, handle, fade to black |

The reel's own captions sit at 73–85 % of the frame height, over his black T-shirt. A black band that
feathers in just above them is drawn in footage space (`src/Footage.tsx`), so it rides every zoom and
the old captions never show; new captions sit over the feather.

## Files

- `src/`: the Remotion composition (`CoachReel`). `timeline.json` holds every scene time and sound cue,
  shared by the picture and the sound. `transcript.ts` is the word-level transcript (faster-whisper
  `small.en`) with two mishearings fixed by ear.
- `sound.mjs`: synthesises the score (96 BPM, Fmaj7–Am7–Cmaj7–G6: detuned-saw pad, pumping sub, FM
  arp with a dotted-eighth echo, drums that sit out before each chapter) and the ~65 effects. No samples.
- `mix.sh`: voice + ducked music + effects to −14 LUFS, then muxes onto the picture.
- `public/fonts/`: Inter Tight, Instrument Serif, JetBrains Mono (Google Fonts, SIL OFL).
- `public/footage.mp4`, `out/` and the finished film are not committed (see Rebuild).

## Rebuild

```bash
npm i
# 1. the source reel → graded, upscaled picture + cleaned-up voice
yt-dlp -o reel.mp4 "https://www.instagram.com/reel/DbhjU1iNjBY/"
ffmpeg -i reel.mp4 -an -vf "scale=1080:1920:flags=lanczos,eq=contrast=1.10:saturation=0.86:gamma=0.96:brightness=-0.015,colorbalance=rs=-0.03:bs=0.05:rh=0.03:bh=-0.03,unsharp=5:5:0.45,format=yuv420p" -c:v libx264 -crf 14 -preset slow -g 15 public/footage.mp4
mkdir -p out && ffmpeg -i reel.mp4 -vn -af "highpass=f=85,lowpass=f=14500,equalizer=f=250:t=q:w=1.2:g=-2.5,equalizer=f=3200:t=q:w=1.0:g=2.2,equalizer=f=9000:t=h:w=1:g=1.5,acompressor=threshold=-20dB:ratio=3.2:attack=6:release=120:makeup=4,alimiter=limit=0.9" -ar 48000 out/voice.wav
# 2. picture, sound, mix
npx remotion render CoachReel out/video.mp4 --codec=h264 --crf=15 --muted   # ~20 min on 4 cores
node sound.mjs
./mix.sh
```

Preview with `npx remotion studio`. In a cloud container, `remotion.config.ts` picks up Playwright's headless
Chromium in `/opt/pw-browsers`, so nothing needs downloading.
