import { ORB_COLORS, ORB_STATES, type OrbState } from "./vendor/command-states";

// The Command Centre's motion, as pure functions of time, so every frame renders the same however
// Remotion orders them. Times are in seconds.

export type Beat = { at: number; state: OrbState };

// The orb's per-state weights at time t: the page's own easing (src/components/command/signal-orb.ts,
// tick), stepped at 60 fps from the first beat.
export function weightsAt(t: number, beats: Beat[]): number[] {
  const dt = 1 / 60;
  const k = 1 - Math.exp(-dt * 7);
  let w: number[] = ORB_STATES.map((s) => (s === beats[0].state ? 1 : 0));
  let i = 0;
  for (let x = beats[0].at; x < t; x += dt) {
    while (i + 1 < beats.length && beats[i + 1].at <= x) i++;
    const target = beats[i].state;
    w = w.map((v, j) => v + ((ORB_STATES[j] === target ? 1 : 0) - v) * k);
  }
  return w;
}

export function stateAt(t: number, beats: Beat[]): OrbState {
  let state = beats[0].state;
  for (const b of beats) if (b.at <= t) state = b.state;
  return state;
}

// The blended colour, "r,g,b", as the orb reports it to the word under it.
export function colorOf(weights: number[]): string {
  return [0, 1, 2]
    .map((c) => Math.round(ORB_STATES.reduce((sum, s, i) => sum + ORB_COLORS[s][c] * weights[i], 0)))
    .join(",");
}

// The terminal typing of the page's word (useTyped): the old word backspaced to what they share,
// 28 ms a letter, then the new one typed, 55 ms a letter.
export type Say = { at: number; text: string };
export function typedAt(t: number, says: Say[]): { text: string; typing: boolean } {
  let i = -1;
  for (let j = 0; j < says.length; j++) if (says[j].at <= t) i = j;
  if (i < 0) return { text: "", typing: false };
  const from = i > 0 ? says[i - 1].text : "";
  const to = says[i].text;
  const e = t - says[i].at;
  let common = 0;
  while (common < from.length && common < to.length && from[common] === to[common]) common++;
  const del = from.length - common;
  if (e < del * 0.028) return { text: from.slice(0, from.length - Math.floor(e / 0.028)), typing: true };
  const n = Math.floor((e - del * 0.028) / 0.055);
  return { text: to.slice(0, Math.min(to.length, common + n)), typing: common + n < to.length };
}

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
// Smooth 0→1 between a and b.
export const ease = (t: number, a: number, b: number) => {
  const x = clamp((t - a) / (b - a), 0, 1);
  return 1 - Math.pow(1 - x, 3);
};
