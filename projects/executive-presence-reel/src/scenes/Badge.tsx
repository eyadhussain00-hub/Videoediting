import React from "react";
import { C, P, E, SANS, SERIF, goldText, win, wt } from "../theme";

// "...executive communication skill." — a rotating seal; each ring word lights up as it's spoken.
const R = 200;
export const Badge: React.FC<{ t: number }> = ({ t }) => {
  const a = 39.1, b = 41.45;
  if (t < a || t > b) return null;
  const o = win(t, a, b, 0.2, 0.25);
  const s = P(t, a, 0.55, E.outBack) * (1 - 0.15 * P(t, b - 0.25, 0.25, E.inCubic));
  const ring = P(t, a, 0.7, E.inOutCubic);
  const rot = -30 + (t - a) * 14;
  const w = [wt(117), wt(118), wt(119)].map((x) => P(t, x - 0.05, 0.3));
  const ringText = (
    <>
      <tspan opacity={0.25 + 0.75 * w[0]}>EXECUTIVE  •  </tspan>
      <tspan opacity={0.25 + 0.75 * w[1]}>COMMUNICATION  •  </tspan>
      <tspan opacity={0.25 + 0.75 * w[2]}>SKILL  •  </tspan>
    </>
  );
  return (
    <div style={{ position: "absolute", left: 540 - R - 40, top: 1080, width: 2 * R + 80, height: 2 * R + 80, opacity: o, transform: `scale(${s})` }}>
      <div style={{
        position: "absolute", left: 40, top: 40, width: 2 * R, height: 2 * R, borderRadius: R,
        background: "radial-gradient(circle at 50% 35%, rgba(52,36,24,0.85), rgba(12,8,6,0.88))",
        boxShadow: "0 30px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.1)", backdropFilter: "blur(16px)",
      }} />
      <svg width={2 * R + 80} height={2 * R + 80} style={{ position: "absolute", inset: 0 }}>
        <defs><path id="ringp" d={`M ${R + 40},${R + 40} m -${R - 34},0 a ${R - 34},${R - 34} 0 1,1 ${2 * (R - 34)},0 a ${R - 34},${R - 34} 0 1,1 -${2 * (R - 34)},0`} /></defs>
        <circle cx={R + 40} cy={R + 40} r={R} fill="none" stroke={C.gold} strokeWidth={2.5} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ring}
          transform={`rotate(-90 ${R + 40} ${R + 40})`} />
        <circle cx={R + 40} cy={R + 40} r={R - 68} fill="none" stroke="rgba(233,184,114,0.35)" strokeWidth={1.5} />
        <g transform={`rotate(${rot} ${R + 40} ${R + 40})`}>
          <text fill={C.goldHi} style={{ fontFamily: SANS, fontWeight: 600, fontSize: 25, letterSpacing: "0.2em" }}>
            <textPath href="#ringp">{ringText}</textPath>
          </text>
        </g>
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 20, letterSpacing: "0.3em", color: "rgba(244,237,226,0.6)", marginBottom: 2 }}>THE SKILL</span>
        <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 76, lineHeight: 1.05, ...goldText }}>Coalescing</span>
        <span style={{ marginTop: 8, fontSize: 26, color: C.gold, letterSpacing: 8 }}>★ ★ ★</span>
      </div>
    </div>
  );
};
