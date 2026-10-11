import React from "react";
import { C, P, E, SANS, rnd, wt, clamp01 } from "../theme";

// "A discussion gets messy, ideas scatter, people talk over each other" — a meeting's worth of voices
// pile up around him, drift apart, overlap, then get swept away when someone finally coalesces it.
const BUBBLES = [
  { s: "Can I just add one thing?", x: 60, y: 870, c: "#7FB3D5" },
  { s: "Wait — what about Q3?", x: 520, y: 800, c: "#E59866" },
  { s: "I think we should…", x: 90, y: 1070, c: "#A9CCE3" },
  { s: "Let's circle back", x: 610, y: 1020, c: "#C39BD3" },
  { s: "What's the budget?", x: 50, y: 660, c: "#F7DC6F" },
  { s: "Actually, no—", x: 730, y: 620, c: "#82E0AA" },
  { s: "Who owns this?", x: 110, y: 1385, c: "#F1948A" },
  { s: "Another idea:", x: 610, y: 1400, c: "#85C1E9" },
  { s: "Hold on, hold on", x: 330, y: 1540, c: "#F8C471" },
  { s: "But the timeline…", x: 40, y: 1500, c: "#BB8FCE" },
  { s: "Quick thought—", x: 640, y: 1515, c: "#76D7C4" },
  { s: "I disagree.", x: 400, y: 1085, c: "#EC7063" },
];

const scribble = (seed: number, cx: number, cy: number) => {
  let x = cx, y = cy, a = rnd(seed) * 6.28;
  const pts: string[] = [];
  for (let i = 0; i < 60; i++) {
    a += (rnd(seed * 31 + i) - 0.5) * 2.2;
    x += Math.cos(a) * 26; y += Math.sin(a) * 26;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(" ");
};
const SCRIBBLES = [scribble(3, 220, 880), scribble(9, 860, 1100), scribble(17, 300, 1350)];

export const Chaos: React.FC<{ t: number }> = ({ t }) => {
  const t0 = wt(16), scatter = wt(21), over = wt(22), sweep = 8.12;
  if (t < t0 - 0.1 || t > sweep + 0.8) return null;
  const sw = P(t, sweep, 0.55, E.inCubic);          // swept away
  const sc = P(t, scatter - 0.1, 1.6, E.outCubic);  // scatter drift
  const ov = P(t, over, 1.0);                        // talk-over: crowd toward centre
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 0.7 * (1 - sw) }}>
        {SCRIBBLES.map((pts, i) => {
          const d = P(t, t0 + 0.4 + i * 0.5, 2.2, E.linear);
          return <polyline key={i} points={pts} fill="none" stroke={i === 1 ? C.gold : "rgba(255,255,255,0.7)"} strokeWidth={4}
            strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - d} />;
        })}
      </svg>
      {BUBBLES.map((b, i) => {
        const at = t0 + 0.08 + i * 0.28 + (i > 7 ? 0.3 : 0);
        const p = P(t, at, 0.32, E.outBack);
        if (p <= 0) return null;
        const vx = (b.x + 170 - 540) / 540, vy = (b.y - 1000) / 700;
        const jx = Math.sin(t * 9 + i) * 4, jy = Math.cos(t * 7 + i * 2) * 4;
        const x = b.x + vx * 70 * sc - vx * 60 * ov + jx + vx * 600 * sw;
        const y = b.y + vy * 50 * sc - vy * 40 * ov + jy + vy * 300 * sw;
        const rot = (rnd(i + 5) - 0.5) * 10 + Math.sin(t * 5 + i) * 1.5;
        return (
          <div key={i} style={{
            position: "absolute", left: x, top: y, transform: `rotate(${rot}deg) scale(${p * (1 - 0.3 * sw)})`,
            transformOrigin: "left center", opacity: clamp01(p * 1.3) * (1 - sw), filter: `blur(${sw * 10}px)`,
            display: "flex", alignItems: "center", gap: 12, padding: "16px 26px 16px 16px", borderRadius: 30,
            background: "rgba(16,11,8,0.62)", border: "1px solid rgba(255,255,255,0.14)", backdropFilter: "blur(14px)",
            boxShadow: "0 12px 34px rgba(0,0,0,0.4)", whiteSpace: "nowrap",
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 20, background: b.c, opacity: 0.9 }} />
            <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 38, color: "rgba(255,255,255,0.92)" }}>{b.s}</span>
          </div>
        );
      })}
    </div>
  );
};
