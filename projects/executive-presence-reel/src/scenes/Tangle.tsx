import React from "react";
import { C, P, E, SANS, SERIF, goldText, win, wt } from "../theme";

// "taking a tangled conversation and reflecting it back" — a knotted gold line pulls straight into an arrow.
const Y = 1450, X0 = 120, X1 = 960, N = 240;
const path = (m: number) => {
  const pts: string[] = [];
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const env = Math.sin(Math.PI * s) ** 0.6;
    const k = (1 - m) * env;
    const x = X0 + (X1 - X0) * s + k * (62 * Math.sin(2 * Math.PI * 6.5 * s) + 48 * Math.sin(2 * Math.PI * 3.1 * s + 0.7));
    const y = Y + k * (58 * Math.cos(2 * Math.PI * 6.5 * s) + 34 * Math.sin(2 * Math.PI * 4.3 * s + 1) + 20 * Math.cos(2 * Math.PI * 9.7 * s));
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(" ");
};

export const Tangle: React.FC<{ t: number }> = ({ t }) => {
  const a = 28.25, un = wt(89), end = 32.2;
  if (t < a || t > end + 0.1) return null;
  const o = win(t, a, end, 0.15, 0.3);
  const draw = P(t, a, 0.8, E.inOutCubic);
  const m = P(t, un, 1.0, E.inOutCubic);
  const arrow = P(t, un + 0.75, 0.35, E.outBack);
  const lab1 = 1 - P(t, un, 0.3);
  const lab2 = P(t, un + 0.8, 0.4);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: o }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          <linearGradient id="tg" x1="0" x2="1">
            <stop offset="0" stopColor={C.goldLo} /><stop offset="0.5" stopColor={C.goldHi} /><stop offset="1" stopColor={C.gold} />
          </linearGradient>
          <filter id="tglow"><feGaussianBlur stdDeviation="6" /></filter>
        </defs>
        <polyline points={path(m)} fill="none" stroke={C.gold} strokeWidth={10} opacity={0.35} filter="url(#tglow)"
          pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
        <polyline points={path(m)} fill="none" stroke="url(#tg)" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round"
          pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
        <g transform={`translate(${X1 + 4}, ${Y}) scale(${arrow})`} opacity={arrow > 0 ? 1 : 0}>
          <path d="M -26 -20 L 4 0 L -26 20" fill="none" stroke={C.goldHi} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
      <div style={{ position: "absolute", left: X0, top: Y + 78, fontFamily: SANS, fontWeight: 600, fontSize: 22, letterSpacing: "0.24em", color: "rgba(244,237,226,0.6)", opacity: lab1 }}>
        TANGLED
      </div>
      <div style={{ position: "absolute", right: 1080 - X1, top: Y + 70, fontFamily: SERIF, fontStyle: "italic", fontSize: 40, ...goldText, opacity: lab2 }}>
        one clear line
      </div>
    </div>
  );
};

/** "huh, yeah, that's it." — the room nods: three seats light up, one per word. */
const Person: React.FC<{ p: number }> = ({ p }) => (
  <div style={{ position: "relative", width: 104, height: 104 }}>
    <div style={{
      position: "absolute", inset: 0, borderRadius: 52, border: `2.5px solid ${p > 0 ? C.gold : "rgba(255,255,255,0.3)"}`,
      background: p > 0 ? "rgba(233,184,114,0.16)" : "rgba(16,11,8,0.55)", boxShadow: p > 0 ? `0 0 ${30 * p}px rgba(233,184,114,0.5)` : "none",
      overflow: "hidden", backdropFilter: "blur(10px)",
    }}>
      <div style={{ position: "absolute", left: 36, top: 22, width: 32, height: 32, borderRadius: 16, background: "rgba(244,237,226,0.75)" }} />
      <div style={{ position: "absolute", left: 20, top: 62, width: 64, height: 60, borderRadius: 32, background: "rgba(244,237,226,0.75)" }} />
    </div>
    <div style={{
      position: "absolute", right: -6, top: -6, width: 40, height: 40, borderRadius: 20, background: C.gold, color: C.ink,
      display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 800, fontSize: 24,
      transform: `scale(${p})`, boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
    }}>✓</div>
  </div>
);

export const Nods: React.FC<{ t: number }> = ({ t }) => {
  const a = 32.22, b = 34.05;
  if (t < a || t > b) return null;
  const o = win(t, a, b, 0.2, 0.22);
  const times = [wt(99), wt(100), wt(101)];
  const phr = ["huh…", "yeah,", "that's it."];
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1150, opacity: o, display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
      <div style={{ display: "flex", gap: 22, alignItems: "baseline" }}>
        {phr.map((w, i) => {
          const p = P(t, times[i] - 0.04, 0.25);
          return <span key={i} style={{
            fontFamily: SERIF, fontStyle: "italic", fontSize: i === 2 ? 120 : 92, lineHeight: 1,
            ...(i === 2 ? goldText : { color: C.cream }), opacity: p, display: "inline-block",
            transform: `translateY(${(1 - p) * 24}px)`, filter: `blur(${(1 - p) * 10}px) drop-shadow(0 6px 20px rgba(0,0,0,0.5))`,
          }}>{w}</span>;
        })}
      </div>
      <div style={{ display: "flex", gap: 34 }}>
        {times.map((tt, i) => <Person key={i} p={P(t, tt, 0.35, E.outBack)} />)}
      </div>
    </div>
  );
};
