import { E, clamp01, lerp } from "./theme";

// Shot list: [start s, scale from, scale to, ease-over seconds (optional: fast move, else slow drift to next shot)].
// Scale is around the face (ORIGIN). A jump in scale between shots reads as a cut-in / cut-out.
export const ORIGIN = { x: 545, y: 560 };
const SHOTS: [number, number, number, number?][] = [
  [0.0, 1.0, 1.07],
  [2.5, 1.16, 1.22],          // "brought clarity?" punch
  [4.3, 1.05, 1.08],          // messy (handheld)
  [8.12, 1.0, 1.03],
  [9.86, 1.1, 1.13],          // card 1
  [12.6, 1.0, 1.03],          // card 2
  [17.36, 1.1, 1.13],         // card 3
  [22.2, 1.0, 1.12],          // slow push while the tension builds
  [24.44, 1.0, 1.04],         // title: wide
  [28.3, 1.12, 1.15],
  [29.1, 1.04, 1.07],
  [32.3, 1.2, 1.22],          // "huh, yeah, that's it"
  [34.14, 1.06, 1.09],
  [37.04, 1.0, 1.05],
  [41.52, 1.14, 1.16],        // lowers tension
  [43.58, 1.03, 1.07],
  [49.66, 1.1, 1.12],
  [51.54, 1.17, 1.19],        // don't rush
  [53.8, 1.22, 1.0, 0.7],     // "step back" = the camera steps back
  [54.92, 1.12, 1.14],        // listen
  [56.1, 1.03, 1.08],
  [58.16, 1.0, 1.06],
  [60.9, 1.13, 1.15],
  [62.96, 1.04, 1.11],
  [99, 1, 1],
];

export const camAt = (t: number) => {
  let i = 0;
  while (i < SHOTS.length - 2 && SHOTS[i + 1][0] <= t) i++;
  const [a, s0, s1, fast] = SHOTS[i];
  const b = SHOTS[i + 1][0];
  const p = fast ? E.outCubic(clamp01((t - a) / fast)) : E.inOutSine(clamp01((t - a) / (b - a)));
  let scale = lerp(s0, s1, p);
  // handheld shake during the messy discussion
  let dx = 0, dy = 0, rot = 0;
  const shake = t > 4.3 && t < 8.12 ? Math.min(1, (t - 4.3) / 0.6, (8.12 - t) / 0.3) : 0;
  if (shake > 0) {
    dx = shake * (Math.sin(t * 7.3) * 6 + Math.sin(t * 13.1) * 3);
    dy = shake * (Math.cos(t * 6.1) * 5 + Math.sin(t * 11.7) * 3);
    rot = shake * Math.sin(t * 3.7) * 0.5;
  }
  return { scale, dx, dy, rot };
};
