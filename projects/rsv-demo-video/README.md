# Demo video

A self-running product demo for prospects: the real dashboard, recorded doing real work, composited into a device mockup with captions. No voiceover, so it plays muted in a waiting room.

Two stages are built. **Stage 1 records the footage** (Playwright). **Stage 2 cuts, captions and renders it** (Remotion). Stage 3 replaces the stand-in device mockups with designed ones.

This project was moved here from `rsv-studio/marketing/demo-video`. Rendering, editing and the Command Centre film need nothing from the app. **Recording new footage does**: it drives the real dashboard and its database, so it needs `rsv-studio` checked out next to this repository (`<parent>/Videoediting` and `<parent>/rsv-studio`, which is how cloud sessions clone them), with its own `npm install` and `.env.local`. The recorder reaches the app's code through the `@/` alias in `tsconfig.json` and `recorder/rsv-root.ts`.

```bash
npm install                 # once, in this folder
npm run build               # in ../../../rsv-studio, whenever the app changes (recording only)
npm run serve               # here, in its own terminal: the built app on http://localhost:3100
npm run record              # every locale and viewport: four takes, ~10 minutes
npm run render:ar           # out/clinic-ar.mp4   (1080p, no audio)
npm run render:en           # out/clinic-en.mp4
npm run studio              # Remotion's editor, for changing timings by eye
npm run typecheck           # the render side; npm run typecheck:recorder also checks the recorder (needs rsv-studio)
```

## What gets recorded

A separate recording clinic, `demo-clinic-video` ("Nile Smile Dental"), is wiped and re-seeded before every take, so the public demo at `/b/nile-smile` is never touched and every take starts from the same place. It gets five months of closed patients (so the monthly report has a real trend), today's open ones, and last month's report built by the app's own report engine, summary and all.

Then Playwright drives the dashboard, in light mode, through these beats:

| Beat | Desktop | Mobile |
|---|---|---|
| `load` | The dashboard opens with its patients | Same, then scrolls to the list |
| `search` | A name is typed into the search and the list narrows | — |
| `arrive` | A real Telegram update is posted to the webhook; the new patient appears | Same |
| `add` | A walk-in is added through the dashboard's own form | — |
| `open` | Her record panel opens and a note is written | The panel opens |
| `draft` | The panel's button asks Rasid to draft the follow-up, and it answers | — |
| `move` | Dragged across the board: New → Contacted → Booked | Tapped through the panel's stage buttons (drag and drop doesn't work with touch) |
| `ask` | Rasid is asked who to contact first, and answers | — |
| `language` | The whole dashboard switches to the other language and back | — |
| `report` | Last month's report opens and is read through | — |

Each take writes `public/recordings/<source>-<locale>-<viewport>.webm` and a `.json` cue sheet: when each beat started and ended, named moments inside it (`asked`, `answered`, `booked`…), the screen area worth zooming into, and **gaps** — stretches where the recorder was only waiting on the server. The video is cut from that sheet, so a slow database makes a slower take, not a slower ad: takes of 127s and 210s both cut to the same 53-second video.

It also measures how far the video file runs ahead of the recorder's clock, by flashing one magenta frame at a known moment and finding it again in the finished file. Playwright starts filming before it hands back the page, by a different amount every time; without this the cuts land a second or so early, on a loading skeleton.

## What gets rendered

`npm run render:ar` reads the storyboard, the captions and both cue sheets, and builds the timeline before rendering: an opening line, the laptop landing with the desktop take, the laptop sliding out as the phone slides in, and an end card. Captions are timed to the beats, and the camera pushes into whatever the moment is about, using the screen areas the recorder measured.

Check a take without scrubbing: `npm run sheet` writes a contact sheet per recording, and `npm run sheet -- clinic-ar-desktop --at 12,30.5` writes full-size frames.

## Making one for another business

Nothing in `src/` is specific to a client. Four configs are:

- `config/clinic.ts` — what gets recorded: the recording clinic, its starting patients in both languages, the Telegram message, the walk-in, the history behind the report.
- `config/storyboard/clinic.ts` — the cut list: which beats, how fast, where to zoom.
- `config/captions/clinic.ts` — every word, Arabic and English.
- `config/mockups.ts` + `public/mockups/*.svg` — the devices, each with its screen rectangle.

For the property vertical: copy the three clinic configs, register them in `config/index.ts` and `src/sources.ts`, then `npm run record -- --source property` and render with a props file like `props/clinic-ar.json`.

## The Command Centre showcase

A separate 50-second film of the Command Centre (`/command`), with its own entry point
(`src/command/index.tsx`) and nothing recorded: every frame is drawn with the app's own orb
(a copy of the app's `src/components/command/signal-orb.ts` in `src/command/vendor/`, in its frame-by-frame `manual` mode) and the page's own layout
rules, so it's sharp at any size. It shows the seven states as a Claude Code session works, a permission
prompt allowed from a phone, the pan between sessions, TV mode, and a conversation with Jarvis.

```bash
npm install
npm run render:command      # out/command-centre.mp4 (1080p, 30 fps, no audio), about 3 minutes
npm run still:command -- out/frame.png --frame=690
```

Inter and JetBrains Mono are in `public/fonts` (SIL Open Font Licence), so a render needs no network.
WebGL runs on the CPU (`--gl=swangle`), which works on any machine, headless or not.

## Honest limits

- The dashboard doesn't update live, so a new lead appears when the page reloads. The reload is one of the cut gaps, so the ad shows the lead arriving without the loading flash.
- Rasid's answers are real, so their wording changes between takes, and the thinking time (10–20s) is cut out.
- Playwright records at the viewport's CSS size whatever the pixel density: 1440×900 desktop, 390×844 mobile.
- Remotion is free for individuals and companies under three people; larger teams need a licence (remotion.dev/license).
