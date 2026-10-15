# Vinh Giang batch: SK Media funnel breakdowns, Parts 1 to 4

A separate group from the TJR videos. Planned from all four recordings on 15 Oct 2026 and edited one at a time
(Video 1 first). The four parts walk Vinh Giang's funnel in order, so they read as one series.

## Sources

Sofian's `FUNNEL BREAKDOWNS/VINH GIANG/` was copied to Eyad's `RSV Video/SK/Vinh Giang/` (same subfolders).
All recorded 10 Sep 2026; times from the macOS clock in the Loom.

| Part | Topic | Folder | Loom (screen) | OBS webcam | Sync |
|---|---|---|---|---|---|
| 1 | Short-form (IG + TikTok) | `vinh vid 2 shortform good` | 6:58 pm, 3:00 | **missing** (OBS was recording, `2026-09-10 18-58-xx.mov` never uploaded) | face = OBS preview inside the Loom, `face_frame: square` (card centred on his face, native pixels) |
| 2 | Long-form (YouTube) | `longform vinh vid 3` | 7:04 pm, 3:11 | `2026-09-10 19-04-27.mov`, 3:27 | same take (checked by ear) but **no single offset**: the Loom looks trimmed. Sync per section |
| 3 | Landing pages + webinar | `landing pages vinh vid 5` | 7:39 pm, 8:32 | `2026-09-10 19-38-53.mov` | NCC 0.917, offset +12.59 s |
| 4 | Newsletter + email | `vinh vid 5 newsletter` | 7:54 pm, 5:59 | `2026-09-10 19-54-12.mov` | NCC 0.902, offset +10.20 s |

`scrap/How Vin Yang Uses Short-Form Marketing.mp4` (6:44 pm, 7:19) is an earlier, rambling take of Part 1. Not used.

## Consistency rules (every part)

- `"theme": "premium"` (tools/sk-media/premium.py): living background, card shadows and borders, screen push-in,
  gradient badges and pills with a light sweep, quote underline, and the stat3 / funnel / dm beats.
- `"series": "Part N/4 · <Topic>"`, shown as a kicker on the opening screen card.
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

**P2 Long-form**: hook "I spent over 20 hours analysing this guy's academy" → 01 The Banner (weekly, low-angle stage
shot) → 02 Numbers (4M subscribers, 1,400 videos: stat tiles) → 03 No Flexing, Straight Value → 04 Awareness Stages
(top/middle/bottom of funnel, Schwartz's 5 levels) → 05 Titles & Thumbnails ("crazy title LMAO" comment, 30k likes) →
06 Description Links (membership, training, video series, newsletter, mentorship: chips) → 07 Clips & Podcasts
(Jay Shetty, Diary of a CEO) → 08 Follow.

**P3 Landing pages** (8.5 min raw, the hardest trim): hook "4 links, 3 landing pages, 1 newsletter" (stat tiles) →
01 Fake-Live Webinar (WebinarJam, "starts in 6 minutes", countdown) → 02 Why It Works (scarcity, urgency, social
proof) → 03 Authority + Bandwagon (Fortune 500, 50k+ professionals) → 04 Unique Mechanism ("3-part video shortcut",
name + email only) → 05 Price Anchoring ($2,999 → $997) → 06 Risk Reversal (guarantee → straight to checkout) → 07 Follow.
If it won't fit in 115 s without losing the webinar or the pricing, it splits into 3a (webinar) and 3b (sales page).

**P4 Newsletter**: hook "1.5 million readers every week" → 01 The Sign-Up Page (bandwagon, free, video hook) →
02 Value Stack (bite-sized lesson, books/podcasts, behind the scenes, best of the year) → 03 Lower Resistance
("unsubscribe anytime, no spam ever") → 04 The Story Email ("blind leading the blind": he's just like us) →
05 Inner Circle (£1.99/month YouTube membership) → 06 Ugly Ads → 07 Follow.

## Overlap

P2 and P4 open by saying "we've looked at his long-form / short-form…": cut those recaps, each part stands alone.
P1's "backstage / inner circle" also appears in P4: keep it short in P4.

## Rebuilding P1's workspace

`v1.json` expects the workspace layout `vinh/{src,extra,words}` with the job in `vinh/v1/job.json`.
- Webcam from the Loom: `ffmpeg -i <loom> -an -vf "crop=316:338:584:84,hqdn3d=1.5:1.5:3:3,scale=948:1014:flags=lanczos,unsharp=5:5:0.6:5:5:0.0,eq=contrast=1.04:saturation=1.06" -c:v libx264 -crf 12 extra/v2_cam.mp4`
- Avatar (for the DM graphics): the photo on the Miro board at 8 s, `crop=60:60:314:246,scale=256:256` → `extra/vinh_avatar.png`
- Words: `transcribe.py <loom> words/v2good.json medium.en`; face track: `facetrack.py extra/v2_cam.mp4 ft_v2.json 0 180`
