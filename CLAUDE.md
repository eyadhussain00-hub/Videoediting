# Videoediting: the home of all video work

Every video job — editing footage, motion graphics, ads, reels, product demos, remakes of reference
videos — is done in **this repository**, and only here. Don't put video projects in `rsv-studio` or `EGNS`.
A session for video work needs only this repo; the one exception is below (recording new RSV dashboard
footage).

## The skill

Use **Motion Video Director** for every job: `skills/motion-video-director/SKILL.md`. It's linked into
`.claude/skills/` so it loads automatically; if it isn't listed, read the file and follow it anyway. Its
golden rules apply: send the kickoff message on a new project, run preflight, get approval at each gate,
and keep `PROGRESS.md` current. Don't build or render scenes before the voiceover MP3 arrives, unless the
user asks for a temporary guide track or the video has no voiceover (keeping the original audio counts).

Also here: `playwright-cli` (browsing, grabbing reference frames and assets, recording web UIs) and
`design-taste-frontend` (for frames drawn in HTML/CSS). Both are pinned in `skills-lock.json`.

## Layout

```
skills/motion-video-director/   the skill (from the upstream fork; README.md describes it)
projects/<name>/                one folder per video, laid out as the skill's §1 says
projects/rsv-demo-video/        RSV's Remotion project: the clinic demo ad and the Command Centre film
brand/rsv/                      RSV Studio's DESIGN.md, PRODUCT.md, backgrounds and icons
```

Start a new video with a new `projects/<name>/` folder. Read `projects/README.md` for what's there.

## What gets committed

The container is wiped when a session ends, so commit and push anything worth keeping: scripts, plans,
`PROGRESS.md`, `LOG.md`, `manifest.json`, scene code and small assets. Don't commit renders, caches,
model weights, `node_modules` or `.env` (all gitignored). GitHub rejects files over 100 MB, so keep big
footage out of git: ask the user where it lives (Google Drive is connected), and note its location
in `PROGRESS.md`. Send finished renders and previews to the user with `SendUserFile`.

## Cloud sessions

- `ffmpeg`/`ffprobe` are in `/usr/bin`, Node 22 and Python 3 are installed, and Playwright's Chromium
  is at `/opt/pw-browsers` (never run `playwright install`).
- Remotion finds that Chromium through `remotion.config.ts`; use `--gl=swangle` for WebGL.
- Each project installs its own packages: `npm ci` inside `projects/<name>/`.

## RSV footage

`projects/rsv-demo-video` renders and edits on its own. **Recording new dashboard takes** drives the
real app and database, so only then attach `eyadhussain00-hub/rsv-studio`, clone it to
`/home/user/rsv-studio` (next to this repo), and run `npm ci` and the recorder as its README says.
When the app's look changes, refresh `brand/rsv/` and `src/command/vendor/` from it.

## Command Centre

`.claude/settings.json` reports this session's activity to the RSV Command Centre, as `rsv-studio`
does, when `RSV_COMMAND_TOKEN` is set in the environment. Without the token, the hooks do nothing.
