# RSV Studio social launch

RSV Studio's own Instagram + Facebook launch: 15 posts from Wed 14 Oct to Tue 10 Nov 2026, 8:30pm Cairo.
Audience: Egyptian clinic and property-office owners, Arabic first (light Egyptian colloquial, like the
carousel README asks), English kept for LinkedIn.

**Live plan:** https://claude.ai/artifact/TDb4MY2gCQkN9jGBQkhpW9 (private to Eyad). It holds every image,
both reels, the captions, the setup checklist, and a "posted" tick per post kept in the page's database
(collections `posted` and `setup`, doc id = post id `p01`…`p15` / `s1`…`s6`).

## Status

- [x] 9 decks written (`decks/`), rendered AR + EN with rsv-studio's carousel renderer
- [x] 2 slideshow reels (reply-problem, what-you-get), silent, 9:16, AR + EN
- [x] Profile picture (RSV app icon, square)
- [x] Plan page published
- [ ] Eyad: set up accounts tonight, schedule the 12 ready posts in Meta Business Suite
- [ ] Film: p03 founder intro (17 Oct), p09 demo clinic screen recording (27 Oct), p14 demo office (8 Nov).
      Raw clips can be cut here.

## Rebuilding the assets

The carousel renderer lives in rsv-studio on branch `ccr-76d5c327-hof196` (`marketing/carousel/`), not on
main yet. Check that branch out next to this repo, then:

```bash
cd <rsv-studio>/marketing/carousel
node render.mjs /home/user/Videoediting/projects/rsv-launch/decks/<deck>.json --out <dir>/<deck>
scripts/reel.sh <dir>/<deck>/ar reel-<deck>-ar.mp4      # slides → 9:16 reel
```

Prices and the WhatsApp number come from rsv-studio's `src/lib/offer.ts` through placeholders. If they
change, re-render and republish. The captions in `page/index.html` also state the plan prices (p15) and
must be edited by hand.

`decks/reply-problem.json` is a copy of the deck already on that branch. Single-image posts are one-slide
`cta` decks, so they carry no "Swipe" label.

## Rules kept

Every chat, board and chart carries the "Example" tag; no real client, quote or result. No claim of
automatic WhatsApp/Instagram capture. Overdue rules quoted are the real sector templates from the handbook.
The website carousel's CTA says "built for you" and quotes `WEBSITE_OFFER`.
