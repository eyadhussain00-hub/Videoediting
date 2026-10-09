# Product
<!-- impeccable:product-schema 1 -->

Scope: the operator's Command Centre (`/command`), which is growing into the console's replacement. The rest of RSV Studio (public site, client dashboards, the legacy `/console`) is described in `README.md` and `docs/`.

Facts marked *(inferred)* were not confirmed in an interview: the operator asked for the work to go ahead overnight without stopping, so they come from the operator's own messages and the repository. Confirm or correct them.

## Platform
web

## Users
One person: the RSV Studio operator (owner sign-in). They run the business from a phone for most of the day, sit at a desktop for focused work, and want the same screen on a TV across the room *(inferred from requests for phone, desktop and 50-inch TV)*. Two phone browsers may be open side by side.

## Product Purpose
A single, calm place that says what the operator's AI is doing and what needs them. It covers every Claude Code session, the app's own agents (Jarvis, Rasid, Rafiq, Amin) and the business's pulse (leads, clients, payments, spend). Success is glancing at it and knowing, without reading, whether anything needs attention; and acting from it when something does.

## Positioning
The status is one particle orb that changes shape and colour, with one word under it. It is not a dashboard of cards. Detail is always one gesture away and never on the home view.

## Operating Context
- Claude Code sessions on the operator's computers and in claude.ai/code cloud environments report through hooks (`src/lib/command.ts`).
- The operator is reachable on Telegram through their own bot; alerts and sign-in codes go there.
- The legacy console (`/console`) stays in service while its parts move over, one at a time.
- English and Arabic, like the rest of the app (`src/lib/i18n`).

## Capabilities and Constraints
- Owner-only. Every route checks the owner session; reporting endpoints check a bearer token.
- Hosted on Vercel (hobby plan: a limited number of daily cron jobs, one build at a time) with Neon Postgres shared with production client data. Schema changes must be additive and created by the code on first use.
- Nothing a session says is stored beyond its state, its folder name and its current tool's name.

## Brand Commitments
- The orb, its seven states and their colours, and the "Command Centre." title in Inter 500 come from Ship Notes' Signal Orb (MIT) and were chosen by the operator; keep them.
- The state word is a terminal-style monospace word in the orb's colour. The operator asked for this.
- Home view: the title, the orb, one word. Anything else must earn its place and stay quiet.

## Evidence on Hand
No customer quotes, metrics or case studies exist for the Command Centre. Never invent them.

## Product Principles
1. One glance first, detail on request.
2. Calm by default, loud only when the operator is needed.
3. The same screen everywhere: phone, desktop and TV are one product at three distances.
4. Personal, not generic: it's one person's room, not a SaaS product.
5. Ship in small pieces the operator can judge on their phone.

## Accessibility & Inclusion
State is never carried by colour alone: the word names it. Reduced motion is honoured (static orb, no pans). Arabic runs right-to-left.
