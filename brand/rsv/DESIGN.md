---
name: RSV Command Centre
description: One particle orb, one word, and everything else one gesture away.
colors:
  night: "#080a0e"
  panel: "#11141a"
  well: "#0b0d12"
  pressed: "#292d36"
  ink: "#eeeff4"
  ink-soft: "#a7aab6"
  ink-faint: "#7f8390"
  focus: "#adbdff"
  state-listening: "#ffb969"
  state-thinking: "#b297ff"
  state-searching: "#61dbf9"
  state-done: "#88efc2"
  state-editing: "#ff8cd4"
  state-running: "#daec70"
  state-waiting: "#ff7078"
typography:
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "max(26px, min(clamp(34px, 7vw, 58px), 8.5vh))"
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: "-2px"
  state-word:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "clamp(13px, 2.7cqmin, 20px)"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.16em"
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "clamp(11px, 1.8cqmin, 14px)"
    fontWeight: 400
    letterSpacing: "0.08em"
  eyebrow-mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "10px"
    fontWeight: 500
    letterSpacing: "0.2em"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.55
rounded:
  control: "12px"
  segment: "14px"
  panel: "21px"
  round: "50%"
spacing:
  gutter: "24px"
  panel: "20px"
  group: "22px"
  tight: "6px"
components:
  panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "20px"
  segment:
    backgroundColor: "{colors.well}"
    rounded: "{rounded.segment}"
    padding: "6px"
  segment-pressed:
    backgroundColor: "{colors.pressed}"
    textColor: "{colors.ink}"
  control-quiet:
    backgroundColor: "#ffffff0a"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.control}"
    size: "40px"
  nav-button:
    backgroundColor: "#ffffff0a"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.round}"
    size: "44px"
---

# RSV Command Centre

## Overview

A dark room with one light in it. The home view is the title, a particle orb (Ship Notes' Signal Orb, WebGL, up to 12,000 particles) and one word saying what the operator's AI is doing. The orb changes shape and colour with the state; the word is typed like a terminal, in the orb's colour. Everything else (which sessions to follow, details, business pages, Jarvis, settings) sits behind a gesture and comes back out of the way when done. Mode: Operate, for one person, at three distances (phone in hand, desk, TV across the room).

## Colors

- **Night `#080a0e`** is the only page background. The orb's own halo (`rgba(state, .075)` fading to 0 at 305/720 of the canvas) is the only light on it; never add gradients or vignettes of our own.
- **State colours** belong to the orb and anything that names a state (the word, dots, history bands). Nothing else uses them: no state colour on buttons, links or borders.
- **Ink** is text on night; **ink-soft** is secondary copy and quiet controls; **ink-faint** is labels and timestamps. Panels are **panel** on night, wells inside panels are **well**, and the selected segment is **pressed**.
- **Focus `#adbdff`** is the focus ring everywhere, 2px, offset 4px.

## Typography

- **Title**: Inter 500 at the demo's `clamp(34px, 7vw, 58px)`, held down on short screens, tracking -2px (0 in Arabic). Ends with a full stop: "Command Centre."
- **State word**: JetBrains Mono 500, lowercase, tracked 0.16em, in the live orb colour with a soft glow, followed by a block caret that blinks when idle and holds while typing.
- **Labels** (which session, counts, times): JetBrains Mono, ink-faint, small. Monospace is used for data and status, never as decoration on prose.
- **Panel copy**: Inter 12.5–14px. Arabic falls back to IBM Plex Sans Arabic with no tracking.

## Layout

- One screen that never scrolls: `position: fixed; inset: 0`. The title sits in a 672px column (1180px on TV-size screens); the orb takes the largest square left under it (`min(100cqw, 100cqh)`, max 820px, 1400px on TVs).
- Tall phones: the orb sits just under the title. Short screens: the title shrinks with the height.
- Side controls (previous and next) sit at the orb frame's edges, vertically centred on the orb, phones and tablets only.
- Panels open as a bottom sheet under 600px wide and as a centred panel above.
- Desktop view on phones lays the page out at 1440px and turns it sideways.

## Elevation & Depth

Depth comes from light, not shadows: the orb's particles are brighter and larger toward the viewer, with a white spark in front. Panels are the only raised surfaces: a 1px `#ffffff12` hairline plus one soft drop shadow (`0 30px 80px #000c`) over a dimmed, blurred backdrop. Pressed segments get an inset top highlight (`0 1px 0 #ffffff15 inset`).

## Shapes

Panels 21px, segments 14px, controls 12px, round nav buttons 50%. No borders heavier than 1px, and no coloured side borders.

## Components

- **Orb**: `SignalOrb` in `src/components/command/signal-orb.ts`. Seven states, 7/s exponential blending between them. Reduced motion shows a still shape.
- **State word + caret**: `useTyped` backspaces the old word and types the new one (28ms per deletion, 55ms per letter).
- **Session label**: which page is showing and where (`rsv-studio · 2/5`).
- **Nav buttons**: 44px round, Phosphor carets, `#ffffff0a` fill with a 1px ring. Moving pans the orb out one side (220ms, ease-in) and in from the other (420ms, `cubic-bezier(0.23, 1, 0.32, 1)`).
- **Sheet**: `dialog` on panel colour; sections have a mono eyebrow-style label, notes in ink-soft, segmented choices in a well.
- **Quiet control**: 40px, 12px radius, `#ffffff0a`, ink-soft icon; pressed state uses **pressed**.

## Do's and Don'ts

- Do keep the home view to title, orb, word and the quietest possible controls.
- Do say state in words as well as colour.
- Do theme browser surfaces: selection, caret and scrollbars follow the palette.
- Don't add cards, stat tiles, charts or gradients to the home view; they belong behind a gesture.
- Don't use state colours for anything that isn't a state.
- Don't show a number without saying what it counts.
