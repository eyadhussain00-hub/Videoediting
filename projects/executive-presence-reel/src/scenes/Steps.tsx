import React from "react";
import { C, P, E, SANS, SERIF, GOLD_GRAD, win, wt, clamp01 } from "../theme";

// "Step back. Listen. Identify an emerging theme and say it." — a 4-step tracker with the current step huge above it.
const STEPS = [
  { big: "Step back.", lab: "STEP BACK", at: wt(154) },
  { big: "Listen.", lab: "LISTEN", at: wt(156) },
  { big: "Find the theme.", lab: "FIND THE THEME", at: wt(157) },
  { big: "Say it.", lab: "SAY IT", at: wt(162) },
];
const XS = [170, 410, 650, 890], Y = 1420;

export const Steps: React.FC<{ t: number }> = ({ t }) => {
  const a = STEPS[0].at - 0.15, b = 58.15;
  if (t < a || t > b) return null;
  const o = win(t, a, b, 0.25, 0.3);
  let cur = 0;
  STEPS.forEach((s, i) => { if (t >= s.at - 0.05) cur = i; });
  // progress line: reaches node i at its time
  let fill = 0;
  for (let i = 1; i < 4; i++) fill += P(t, STEPS[i].at - 0.35, 0.35, E.inOutCubic);
  const lineW = (XS[3] - XS[0]) * (fill / 3);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: o }}>
      {STEPS.map((s, i) => {
        const pin = P(t, s.at - 0.05, 0.3, E.outCubic);
        const pout = i < 3 ? P(t, STEPS[i + 1].at - 0.08, 0.18, E.inCubic) : 0;
        if (pin <= 0 || pout >= 1) return null;
        return (
          <div key={i} style={{
            position: "absolute", left: 0, right: 0, top: 1160, textAlign: "center",
            fontFamily: SERIF, fontStyle: "italic", fontSize: s.big.length > 10 ? 118 : 150, lineHeight: 1.1,
            backgroundImage: GOLD_GRAD, WebkitBackgroundClip: "text", color: "transparent",
            opacity: pin * (1 - pout), transform: `translateY(${(1 - pin) * 40 - pout * 40}px)`,
            filter: `blur(${(1 - pin) * 14 + pout * 12}px) drop-shadow(0 8px 26px rgba(0,0,0,0.55))`,
          }}>{s.big}</div>
        );
      })}
      <div style={{ position: "absolute", left: XS[0], top: Y - 2, width: XS[3] - XS[0], height: 4, borderRadius: 2, background: "rgba(255,255,255,0.18)" }} />
      <div style={{ position: "absolute", left: XS[0], top: Y - 2, width: lineW, height: 4, borderRadius: 2, background: C.gold, boxShadow: `0 0 14px ${C.gold}` }} />
      {STEPS.map((s, i) => {
        const on = P(t, s.at - 0.05, 0.3, E.outBack);
        const ring = i === 1 ? t - s.at : -1;   // "Listen": sound rings
        return (
          <React.Fragment key={i}>
            {ring > 0 && ring < 1.3 && [0, 0.35, 0.7].map((d, k) => {
              const r = clamp01((ring - d) / 0.8);
              return r > 0 && r < 1 ? <div key={k} style={{
                position: "absolute", left: XS[i] - 20 - r * 50, top: Y - 20 - r * 50, width: 40 + r * 100, height: 40 + r * 100,
                borderRadius: "50%", border: `2px solid ${C.gold}`, opacity: 1 - r,
              }} /> : null;
            })}
            <div style={{
              position: "absolute", left: XS[i] - 20, top: Y - 20, width: 40, height: 40, borderRadius: 20,
              background: on > 0 ? C.gold : "rgba(18,12,8,0.8)", border: `2px solid ${on > 0 ? C.goldHi : "rgba(255,255,255,0.35)"}`,
              transform: `scale(${0.8 + 0.25 * on})`, boxShadow: on > 0 ? `0 0 ${24 * on}px ${C.gold}` : "none",
              display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 700, fontSize: 18, color: on > 0 ? C.ink : C.cream,
            }}>{i + 1}</div>
            <div style={{
              position: "absolute", left: XS[i] - 110, width: 220, top: Y + 36, textAlign: "center",
              fontFamily: SANS, fontWeight: 600, fontSize: 21, letterSpacing: "0.16em",
              color: i === cur ? C.cream : "rgba(244,237,226,0.45)",
            }}>{s.lab}</div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
