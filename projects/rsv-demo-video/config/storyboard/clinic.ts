import type { Storyboard } from "../video";

// The clinic ad's cut list. Every clip points at a beat of the recording (and the marks the recorder wrote
// inside it), so a re-recorded take drops straight in: the cuts follow the actions, not fixed timestamps.
// Waiting is cut out, typing is sped up, and results play close to real time so they can be read.
//
// Zooms come in two strengths: soft pushes (about 1.15–1.2) that keep the whole laptop in frame, and
// close-ups (1.7 and up) where the screen fills the frame edge to edge. Anything in between leaves the
// laptop's edge half in shot, which reads as a mistake.
export const clinicStoryboard: Storyboard = {
  fps: 30,
  intro: 2.6,
  transition: 1.1,
  end: 3.8,
  laptop: [
    // Nothing moves on the overview, so slowing it costs nothing and gives the laptop time to land.
    { beat: "load", speed: 0.5, caption: "overview" },
    { beat: "search", speed: 1.5, caption: "search", zooms: [{ focus: "result", at: "typed", scale: 1.7 }] },
    {
      beat: "arrive", from: "sent", pre: -0.2, speed: 1.2, caption: "telegram", telegramAt: "sent",
      zooms: [{ focus: "row", at: "visible", scale: 1.75 }],
    },
    {
      beat: "add", from: "dialog", pre: 0.6, speed: 2.4, caption: "add",
      zooms: [{ focus: "dialog", at: "dialog", scale: 1.7 }, { focus: "row", at: "added", scale: 1.75 }],
    },
    { beat: "open", speed: 2.2, caption: "record", zooms: [{ focus: "drawer", at: "opened", scale: 1.75 }] },
    // The assistant's thinking time is cut: the question goes in, then straight to the answer.
    { beat: "draft", to: "asked", post: 0.7, speed: 1.3, caption: "draft" },
    { beat: "draft", from: "answered", pre: 0.2, to: "end", post: -0.8, speed: 1, caption: "draft", zooms: [{ focus: "assistant", scale: 1.8 }] },
    { beat: "move", from: "board", pre: 0.5, speed: 2, caption: "board", zooms: [{ focus: "board", scale: 1.15 }] },
    { beat: "ask", to: "asked", post: 0.5, speed: 1.8, caption: "ask" },
    { beat: "ask", from: "answered", pre: 0.2, to: "end", post: -0.8, speed: 1, caption: "ask", zooms: [{ focus: "assistant", scale: 1.8 }] },
    { beat: "language", to: "back", post: 0.3, speed: 1.6, caption: "language" },
    {
      beat: "report", from: "list", speed: 1.5, caption: "report",
      zooms: [
        { focus: "tiles", at: "opened", scale: 1.2 },
        { focus: "summary", at: "summary", scale: 1.7 },
        { focus: "breakdown", at: "breakdown", scale: 1.12 },
      ],
    },
  ],
  phone: [
    { beat: "load", speed: 1.4, caption: "phone" },
    { beat: "arrive", from: "sent", pre: -0.2, speed: 1.2, caption: "phone", telegramAt: "sent" },
    { beat: "open", speed: 1.3, caption: "phoneMove" },
    { beat: "move", speed: 1.6, caption: "phoneMove" },
  ],
};
