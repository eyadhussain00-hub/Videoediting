import React from "react";
import { C, P, E, SANS, SERIF, glass, win, wt, lerp } from "../theme";

// Three outcomes, each with a tiny animated diagram.
const Tension: React.FC<{ t: number; at: number }> = ({ t, at }) => {
  const calm = P(t, at + 0.3, 1.0, E.inOutCubic);
  const pts: string[] = [];
  for (let i = 0; i <= 40; i++) {
    const x = 4 + i * 1.8;
    const jag = (i % 2 ? 1 : -1) * 20 * (0.6 + 0.4 * Math.sin(i * 1.7 + t * 6));
    const y = 40 + lerp(jag, 6 * Math.sin(i / 40 * Math.PI * 2 + t * 2), calm);
    pts.push(`${x},${y.toFixed(1)}`);
  }
  return <svg width={80} height={80}><polyline points={pts.join(" ")} fill="none" stroke={C.gold} strokeWidth={3.5} strokeLinejoin="round" strokeLinecap="round" /></svg>;
};
const Venn: React.FC<{ t: number; at: number }> = ({ t, at }) => {
  const m = P(t, at + 0.2, 0.9, E.inOutCubic);
  return (
    <svg width={80} height={80}>
      <circle cx={lerp(18, 31, m)} cy={40} r={17} fill="rgba(233,184,114,0.25)" stroke={C.gold} strokeWidth={3} />
      <circle cx={lerp(62, 49, m)} cy={40} r={17} fill="rgba(233,184,114,0.25)" stroke={C.goldHi} strokeWidth={3} />
    </svg>
  );
};
const Forward: React.FC<{ t: number; at: number; loop: number }> = ({ t, at, loop }) => {
  const u = P(t, loop, 0.8, E.inOutCubic);      // loop unwinds into a straight arrow
  const pts: string[] = [];
  for (let i = 0; i <= 50; i++) {
    const s = i / 50;
    const a = s * Math.PI * 1.7 - Math.PI * 0.35;
    const lx = 40 + Math.cos(a) * 20, ly = 40 + Math.sin(a) * 20;
    const sx = 10 + s * 56, sy = 40;
    pts.push(`${lerp(lx, sx, u).toFixed(1)},${lerp(ly, sy, u).toFixed(1)}`);
  }
  const end = pts[pts.length - 1].split(",").map(Number);
  const ang = u > 0.5 ? 0 : 75;
  const nudge = u >= 1 ? Math.sin((t - loop) * 6) * 3 : 0;
  return (
    <svg width={80} height={80} opacity={P(t, at, 0.3)}>
      <g transform={`translate(${nudge},0)`}>
        <polyline points={pts.join(" ")} fill="none" stroke={C.gold} strokeWidth={3.5} strokeLinecap="round" />
        <path d="M -9 -8 L 2 0 L -9 8" transform={`translate(${end[0]},${end[1]}) rotate(${ang})`} fill="none" stroke={C.goldHi} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
};

export const Benefits: React.FC<{ t: number }> = ({ t }) => {
  const a = 41.5, b = 49.45;
  if (t < a || t > b) return null;
  const o = win(t, a, b, 0.25, 0.3);
  const rows = [
    { n: "01", l: "Lowers tension", at: wt(121) - 0.1, icon: (at: number) => <Tension t={t} at={at} /> },
    { n: "02", l: "Shared understanding", at: wt(128) - 0.1, icon: (at: number) => <Venn t={t} at={at} /> },
    { n: "03", l: "Moves forward", at: wt(135) - 0.1, icon: (at: number) => <Forward t={t} at={at} loop={wt(139)} />, sub: true },
  ];
  const head = P(t, a, 0.5);
  return (
    <div style={{ position: "absolute", left: 100, right: 100, top: 1010, opacity: o }}>
      <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 22, letterSpacing: "0.26em", color: C.gold, marginBottom: 18, marginLeft: 8, opacity: head }}>
        WHAT COALESCING DOES
      </div>
      {rows.map((r, i) => {
        const p = P(t, r.at, 0.5, E.outExpo);
        const strike = r.sub ? P(t, wt(139) + 0.1, 0.4, E.inOutCubic) : 0;
        return (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 22, height: 118, padding: "0 30px 0 24px", borderRadius: 28, marginBottom: 16,
            ...glass, opacity: p, transform: `translateX(${(1 - p) * -60}px)`, filter: `blur(${(1 - p) * 8}px)`,
          }}>
            <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 24, color: C.gold, letterSpacing: "0.1em", width: 38 }}>{r.n}</span>
            <div style={{ width: 80, height: 80, borderRadius: 20, background: "rgba(233,184,114,0.08)", border: "1px solid rgba(233,184,114,0.25)" }}>{r.icon(r.at)}</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 44, color: C.cream, letterSpacing: -0.5 }}>{r.l}</span>
              {r.sub && (
                <span style={{ position: "relative", alignSelf: "flex-start", fontFamily: SERIF, fontStyle: "italic", fontSize: 32, color: "rgba(244,237,226,0.6)", opacity: P(t, wt(137) - 0.05, 0.3), marginTop: -4 }}>
                  instead of looping
                  <span style={{ position: "absolute", left: -4, top: "55%", height: 3, width: `calc((100% + 8px) * ${strike})`, background: C.gold }} />
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
