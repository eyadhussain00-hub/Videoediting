import type { CSSProperties } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FPS, GOLD } from "../data";
import { sacredAt } from "./base";

// Islamic geometry drawn in code: eight-point stars (two squares at 45°) on a square grid, the khatam rosette,
// and a star-shaped iris for transitions.

/** Points of an 8-point star: 16 vertices alternating outer radius R and inner radius r. */
export const starPts = (cx: number, cy: number, R: number, r: number, rot = 0) =>
  Array.from({ length: 16 }, (_, i) => {
    const a = rot + (i * Math.PI) / 8 - Math.PI / 2;
    const rad = i % 2 ? r : R;
    return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad] as [number, number];
  });
export const starPath = (cx: number, cy: number, R: number, r: number, rot = 0) =>
  "M" + starPts(cx, cy, R, r, rot).map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L") + "Z";
/** Rub el Hizb outline: two overlapping squares. */
const squares = (cx: number, cy: number, R: number, rot = 0) =>
  [0, Math.PI / 4]
    .map((o) => "M" + [0, 1, 2, 3].map((k) => { const a = rot + o + (k * Math.PI) / 2 - Math.PI / 4; return `${(cx + Math.cos(a) * R).toFixed(1)} ${(cy + Math.sin(a) * R).toFixed(1)}`; }).join("L") + "Z")
    .join(" ");

/** Star-and-cross lattice. `draw` 0..1 opens it from the centre; `drift` slides it slowly. */
export const Lattice = ({ cell = 150, draw = 1, opacity = 0.22, drift = 0, color = GOLD, style }: { cell?: number; draw?: number; opacity?: number; drift?: number; color?: string; style?: CSSProperties }) => {
  const cols = Math.ceil(1080 / cell) + 2, rows = Math.ceil(1920 / cell) + 2;
  let d = "";
  for (let i = -1; i < cols; i++)
    for (let j = -1; j < rows; j++) {
      const cx = i * cell + cell / 2, cy = j * cell + cell / 2;
      d += starPath(cx, cy, cell * 0.5, cell * 0.31, Math.PI / 8) + squares(cx, cy, cell * 0.2, 0);
    }
  const off = (drift * cell) % cell;
  return (
    <svg
      width={1080}
      height={1920}
      style={{
        position: "absolute", inset: 0, opacity, ...style,
        WebkitMaskImage: `radial-gradient(circle at 50% 40%, #000 ${draw * 120}%, transparent ${draw * 120 + 18}%)`,
        maskImage: `radial-gradient(circle at 50% 40%, #000 ${draw * 120}%, transparent ${draw * 120 + 18}%)`,
      }}
    >
      <path d={d} transform={`translate(${-off * 0.5} ${-off})`} fill="none" stroke={color} strokeWidth={1.6} />
    </svg>
  );
};

/** Khatam rosette: nested rotating stars and rings. */
export const Rosette = ({ size = 900, t = 0, draw = 1, opacity = 1, color = GOLD }: { size?: number; t?: number; draw?: number; opacity?: number; color?: string }) => {
  const c = size / 2;
  const ring = (R: number, sw: number, rot: number, k = 1) => (
    <g key={R}>
      <path d={starPath(c, c, R, R * 0.76, rot)} fill="none" stroke={color} strokeWidth={sw} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - Math.min(1, draw * k)} />
      <path d={squares(c, c, R * 0.86, rot + Math.PI / 8)} fill="none" stroke={color} strokeWidth={sw * 0.6} opacity={0.6} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - Math.min(1, draw * k * 0.9)} />
    </g>
  );
  return (
    <svg width={size} height={size} style={{ opacity, overflow: "visible" }}>
      <circle cx={c} cy={c} r={c * 0.98} fill="none" stroke={color} strokeWidth={1.4} opacity={0.5} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
      <circle cx={c} cy={c} r={c * 0.93} fill="none" stroke={color} strokeWidth={0.8} opacity={0.35} strokeDasharray="2 10" />
      {ring(c * 0.88, 2.2, t * 0.12, 1)}
      {ring(c * 0.62, 1.8, -t * 0.18, 1.2)}
      {ring(c * 0.38, 1.5, t * 0.25, 1.5)}
      <circle cx={c} cy={c} r={c * 0.16} fill="none" stroke={color} strokeWidth={1.2} opacity={0.7} />
    </svg>
  );
};

/** The emerald world that shows behind the speaker while a verse or hadith is on screen. */
export const PatternWorld = () => {
  const t = useCurrentFrame() / FPS;
  const a = sacredAt(t);
  if (a < 0.01) return null;
  return (
    <AbsoluteFill style={{ opacity: a }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 55% at 50% 38%, #145A45 0%, #0A3328 45%, #04140F 100%)" }} />
      <Lattice cell={170} draw={a} opacity={0.2} drift={t * 0.12} />
      <AbsoluteFill style={{ alignItems: "center", top: -40 }}>
        <div style={{ position: "absolute", top: 140, left: 540 - 520 }}>
          <Rosette size={1040} t={t} draw={a} opacity={0.32} />
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 40% at 50% 40%, rgba(242,212,146,0.16), rgba(0,0,0,0) 70%)" }} />
    </AbsoluteFill>
  );
};
