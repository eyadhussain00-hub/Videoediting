# BOXABL — why the rules are what they are

## 29 Sep 2026 · batch 1 (clips 01–06), first session (Mohanad)
- Mohanad pasted the ClipFlow × ASG brief and the content doc (YouTube links + a Drive folder) and asked for finished
  clips to post. Airrack's video is private now; YouTube asks this container to sign in ("confirm you're not a bot") and
  403s the media → **everything comes from the Drive folder**, which has the same videos plus ~2,900 more files.
- FaZe Rug's upload has its own burned-in captions → doubled captions and a possible "boxable" misspelling →
  `hf: 0.74` crops the band (and the blurred background) above them.
- Whisper: "Boxable" (every source), "casino" for Casita (factory update), "$50" ",000" split tokens, "400" "-foot" →
  `glossary.json` + token gluing in `render.py`; QA fails on wrong forms.
- Captions from two different moments ran together ("BY 19 NOBODY") → chunks break at every cut.
- "700+" in Anton read like "700-" at title size → write "OVER 700".
- The Elon podcast clip has other brands' boxes on the left of frame → crop centred on Elon (`cx: 0.62`) so they
  fall outside the band.
- The talking-head Elon/FaZe clips needed the house shown (brief: "Elon talking → b-roll of the house") → Elon's audio
  laid over the "Delivering Elon Musk's Casita" footage; FaZe Rug ends on the Casita exterior. → `home` flag + check.

## 30 Sep 2026 · toolkit (Eyad)
- Eyad took over from Mohanad ("same framework as SK and Adnan") → the session's scratch scripts became
  `tools/boxabl/` on the shared branch: preset, layout, glossary, index/fetch/transcribe/check/render/qa/deliver,
  jobs 01–06, tracker. The container's pip ffmpeg has no ffprobe → `setup.sh` installs a duration-only shim so
  `deliver.sh` and `../common/preview.sh` work.

## 30 Sep 2026 · batch 2 (clips 07–12), same session
- The car-drop source is a 1.6 GB 4K .mov: trimming inside the filter graph decoded from 0 s for every segment (a
  4-segment clip took > 10 min) → `render.py` seeks each input (`-ss` before `-i`) to 2 s before its range (~2 min now).
- One-pass `loudnorm` landed at −15.5/−15.8 LUFS (QA fail, same as SK's V3 lesson) → two-pass (measure, then linear).
- Whisper spellings: "Boxbull", "box book" (-cita), "Eliano" → glossary + wrong_forms.
- The pip ffmpeg has no `drawtext` → contact sheets can't be timestamped; use a fixed `fps=1/<step>` and do the maths
  (frame k ≈ start + k·step).
- A "home" segment picked from a coarse sheet showed a talking head instead (clip 10's end) → pull a 2 s-step sheet
  of the exact range before trusting a whole-home shot, and look at the contact sheet after QA.
- Hook frames: a creator's face at 0:00 is weaker than the house → put the creator's intro audio over the cleanest
  exterior shot (clip 10), or open on the most extreme visual (cars on the roof, clip 07).
- Positive-only cuts: the car-drop video's 50 ft drop breaks the roof, it has swearing and "investors might be mad" —
  all left out; the Vegas tour's government-order news, "$0.80/share" screenshot and downsides — left out; the ADU
  interview's zoning-law talk — left out as political. `check.py` caught none of these by itself (they're phrasing,
  not banned words), so read the transcript around every kept line.
- Open question for Eyad: third-party sources sometimes have music under the speech; the clips use source audio as-is.
  If the no-music rule applies to this campaign too, beds must be dropped (`"a"` from a speech-only source, no `bed`).
