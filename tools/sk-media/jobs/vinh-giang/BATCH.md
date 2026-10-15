# Vinh Giang batch: SK Media funnel breakdowns, Parts 1 to 4

A separate group from the TJR videos. Planned from all four recordings on 15 Oct 2026 and edited one at a time
(Video 1 first). The four parts walk Vinh Giang's funnel in order, so they read as one series.

## Sources

Sofian's `FUNNEL BREAKDOWNS/VINH GIANG/` was copied to Eyad's `RSV Video/SK/Vinh Giang/` (same subfolders).
All recorded 10 Sep 2026; times from the macOS clock in the Loom.

| Part | Topic | Folder | Loom (screen) | OBS webcam | Sync |
|---|---|---|---|---|---|
| 1 | Short-form (IG + TikTok) | `vinh vid 2 shortform good` | 6:58 pm, 3:00 | **missing** (OBS was recording, `2026-09-10 18-58-xx.mov` never uploaded) | face = OBS preview inside the Loom (Chrome covers its left edge, so his face sits left of centre) |
| 2 | Long-form (YouTube) | `longform vinh vid 3` | 7:04 pm, 3:11 | `2026-09-10 19-04-27.mov`, 3:27 | one offset: webcam_t = loom_t + 14.527 (5 s probes every 6 s across the Loom, NCC 0.85 to 0.92, no drift) |
| 3 | Landing pages + webinar | `landing pages vinh vid 5` | 7:39 pm, 8:32 | `2026-09-10 19-38-53.mov` | NCC 0.917, offset +12.59 s |
| 4 | Newsletter + email | `vinh vid 5 newsletter` | 7:54 pm, 5:59 | `2026-09-10 19-54-12.mov` | one offset: webcam_t = loom_t + 10.204 (checked at 5 points, no drift) |

`scrap/How Vin Yang Uses Short-Form Marketing.mp4` (6:44 pm, 7:19) is an earlier, rambling take of Part 1. Not used.

## Consistency rules (every part)

- `"theme": "premium"` (tools/sk-media/premium.py): living background, card shadows and borders, screen push-in,
  gradient badges and pills with a light sweep, quote underline, and the stat3 / funnel / dm beats.
- `"series": "Part N/4 · <Topic>"`, shown as a kicker on the opening screen card.
- `"face_frame": "wide"` (Eyad, 15 Oct): the webcam card is as wide as the screen card and taller (layout.json
  `variants.wide_face`), zoomed out to the full webcam width with no black edges, face as centred as the frame allows.
  Run QA with `--variant wide_face`. qa.py skips the jitter check on a punch-in where the edge-pinned crop changes size
  by more than 5%, because the wide card re-centres on the face there.
- Headline formula: line 1 white `VINH GIANG'S …`, line 2 yellow, the part's angle. P1 `VINH GIANG'S $12M / SHORT-FORM MACHINE`,
  P2 `… / YOUTUBE PLAYBOOK`, P3 `… / $12M FUNNEL PAGES`, P4 `… / EMAIL MACHINE`.
- CTA keyword **VINH** in all four ("comment VINH for the full breakdown" is said in P1, P2 and P4; P3 borrows the CTA take if it has none).
- 95 to 115 s each. Sections numbered through "Follow For More". One graphic at a time, and graphics say only what's said.
- Each part gets at least one signature graphic: P1 7-11-4 stat tiles + TOF/MOF/BOF funnel + ManyChat DM;
  P2 4M subs / 1,400 videos stats + Schwartz awareness funnel; P3 webinar countdown + $2,999 → $997 price-anchor
  count-up; P4 1.5M readers count-up + newsletter value chips.
- Captions: `Vinh Giang` (ASR writes Vinang / Vin Yang / Vinayang / Vinyang), `ManyChat`, `TikTok`, `VINH`.

## Outlines

**P1 Short-form (edited, `v1.json`)**: hook $12M a year → 01 The Bio → 02 Backstage → 03 The 7-11-4 Rule →
04 Story Highlights → 05 3 Pinned Posts → 06 Keyword Replies → 07 ManyChat Bot → 08 Fan Accounts → 09 Follow.

**P2 Long-form (as built, `v2.json`, 1:46)**: 01 The Banner → 02 The Numbers (4M / 1,400 stat tiles) → 03 No Flexing →
04 Awareness Stages (Schwartz's 5 levels as a pyramid: premium funnel `"shape": "pyramid"`) → 05 Every Stage (TOF/MOF/BOF) →
06 Titles & Thumbnails → 07 Description Links → 08 Clips & Podcasts → 09 Follow For More.

**P3 Landing pages** (8.5 min raw, the hardest trim): hook "4 links, 3 landing pages, 1 newsletter" (stat tiles) →
01 Fake-Live Webinar (WebinarJam, "starts in 6 minutes", countdown) → 02 Why It Works (scarcity, urgency, social
proof) → 03 Authority + Bandwagon (Fortune 500, 50k+ professionals) → 04 Unique Mechanism ("3-part video shortcut",
name + email only) → 05 Price Anchoring ($2,999 → $997) → 06 Risk Reversal (guarantee → straight to checkout) → 07 Follow.
If it won't fit in 115 s without losing the webinar or the pricing, it splits into 3a (webinar) and 3b (sales page).

**P4 Newsletter (as built, `v4.json`, 1:44)**: hook "1.5 million other readers… but you don't" → 01 The Sign-Up Page →
02 Value Stack → 03 Lower Resistance → 04 The Story Email → 05 Inner Circle → 06 Ugly Ads (incl. kayfabe) →
07 Subject Lines (inbox graphic + Eugene Schwartz quote) → 08 Follow For More.
"comment VINH" is at Loom 354.98 to 355.84 (cam +10.204); ASR hears it as "comment and".

## Overlap

P2 and P4 open by saying "we've looked at his long-form / short-form…": cut those recaps, each part stands alone.
P1's "backstage / inner circle" also appears in P4: keep it short in P4.

## Rebuilding P1's workspace

`v1.json` expects the workspace layout `vinh/{src,extra,words}` with the job in `vinh/v1/job.json`.
- Webcam from the Loom: `ffmpeg -i <loom> -an -vf "crop=316:338:584:84,hqdn3d=1.5:1.5:3:3,scale=948:1014:flags=lanczos,unsharp=5:5:0.6:5:5:0.0,eq=contrast=1.04:saturation=1.06" -c:v libx264 -crf 12 extra/v2_cam.mp4`
- Avatar (for the DM graphics): the photo on the Miro board at 8 s, `crop=60:60:314:246,scale=256:256` → `extra/vinh_avatar.png`
- Words: `transcribe.py <loom> words/v2good.json medium.en`; face track: `facetrack.py extra/v2_cam.mp4 ft_v2.json 0 180`
