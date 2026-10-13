import React from "react";
import { C, P, E, SANS, SERIF, GOLD_GRAD, win, wt } from "../theme";

/** Series tag at the top during the hook. */
export const TopChip: React.FC<{ t: number }> = ({ t }) => {
  const o = win(t, 0.15, 2.85, 0.5, 0.25);
  if (o <= 0) return null;
  const p = P(t, 0.15, 0.7);
  return (
    <div style={{ position: "absolute", top: 236, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: o }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 16, padding: "14px 28px", borderRadius: 999,
        background: "rgba(14,10,7,0.5)", border: `1px solid rgba(233,184,114,0.45)`, backdropFilter: "blur(12px)",
        transform: `translateY(${(1 - p) * -20}px)`, clipPath: `inset(0 ${(1 - p) * 50}% 0 ${(1 - p) * 50}% round 999px)`,
      }}>
        <div style={{ width: 10, height: 10, borderRadius: 5, background: C.gold, boxShadow: `0 0 12px ${C.gold}` }} />
        <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 24, letterSpacing: "0.22em", color: C.cream }}>
          MEETING MOVES
        </span>
        <span style={{ fontFamily: SANS, fontWeight: 400, fontSize: 24, letterSpacing: "0.22em", color: "rgba(244,237,226,0.55)" }}>
          · EXECUTIVE PRESENCE
        </span>
      </div>
    </div>
  );
};

/** "clarity" — huge, behind the subject, on the word. */
export const BehindClarity: React.FC<{ t: number }> = ({ t }) => {
  const a = wt(15) - 0.04;
  const o = win(t, a, 4.25, 0.05, 0.3);
  if (o <= 0) return null;
  const letters = "clarity".split("");
  const grow = 1 + 0.05 * P(t, a, 1.6, E.linear);
  return (
    <div style={{
      position: "absolute", left: 0, right: 0, top: 205, display: "flex", justifyContent: "center",
      transform: `scale(${grow})`, opacity: o,
    }}>
      {letters.map((ch, i) => {
        const p = P(t, a + i * 0.035, 0.42, E.outExpo);
        return (
          <span key={i} style={{
            fontFamily: SERIF, fontStyle: "italic", fontSize: 330, lineHeight: 1, letterSpacing: -6,
            backgroundImage: GOLD_GRAD, WebkitBackgroundClip: "text", color: "transparent", display: "inline-block",
            opacity: p, transform: `translateY(${(1 - p) * 60}px)`, filter: `blur(${(1 - p) * 18}px) drop-shadow(0 0 40px rgba(233,184,114,0.35))`,
            paddingRight: 4,
          }}>{ch}</span>
        );
      })}
    </div>
  );
};
export { C };
