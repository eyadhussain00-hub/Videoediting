import React from "react";
import { C, P, E, rnd, win, wt } from "../theme";

// "people will start looking to you" — warm light gathers behind him; rays converge on him (behind the subject).
export const OutroBehind: React.FC<{ t: number }> = ({ t }) => {
  const a = wt(170) - 0.2, b = 62.9;
  if (t < a || t > b) return null;
  const o = win(t, a, b, 0.9, 0.5);
  const conv = P(t, wt(173), 1.6, E.outCubic);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: o }}>
      <div style={{
        position: "absolute", left: 540 - 520, top: 520 - 520, width: 1040, height: 1040,
        background: "radial-gradient(circle, rgba(233,184,114,0.5), rgba(233,184,114,0.12) 45%, rgba(233,184,114,0) 70%)",
        transform: `scale(${0.8 + 0.25 * conv})`,
      }} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 16 }, (_, i) => {
          const ang = (i / 16) * Math.PI * 2 + rnd(i) * 0.2;
          const r0 = 1300, r1 = 260 + 260 * (1 - conv);
          const x0 = 540 + Math.cos(ang) * r0, y0 = 560 + Math.sin(ang) * r0;
          const x1 = 540 + Math.cos(ang) * r1, y1 = 560 + Math.sin(ang) * r1;
          return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke={C.goldHi} strokeWidth={2} opacity={0.18 + 0.12 * rnd(i + 3)} />;
        })}
      </svg>
    </div>
  );
};
