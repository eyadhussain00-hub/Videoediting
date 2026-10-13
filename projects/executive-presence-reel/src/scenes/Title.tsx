import React from "react";
import { C, P, E, SANS, SERIF, GOLD_GRAD, glass, rnd, win, wt, lerp, clamp01 } from "../theme";

// "...a powerful meeting move called — coalescing."  The background drops away, scattered gold
// particles (the scattered ideas) drift, then converge into the word, which lands behind his head.
const T_HIT = wt(81) - 0.02;          // "coalescing" (24.44)
const TITLE_Y = 330;                  // centre line of the word
const N = 90;
const parts = Array.from({ length: N }, (_, i) => {
  const ang = rnd(i * 3 + 1) * Math.PI * 2;
  const r = 380 + rnd(i * 7 + 2) * 620;
  return {
    sx: 540 + Math.cos(ang) * r, sy: 860 + Math.sin(ang) * r * 1.25,
    tx: 140 + rnd(i * 11 + 3) * 800, ty: TITLE_Y + (rnd(i * 13 + 4) - 0.5) * 150,
    size: 3 + rnd(i * 5 + 9) * 7, delay: rnd(i * 17 + 6) * 0.25, ph: rnd(i) * 6.28,
  };
});

export const TitleBehind: React.FC<{ t: number }> = ({ t }) => {
  if (t < 22.3 || t > 28.4) return null;
  const o = win(t, 22.3, 28.3, 0.8, 0.5);
  const letters = "Coalescing".split("");
  const glow = P(t, T_HIT, 0.25) * (1 - P(t, T_HIT + 0.3, 1.8, E.outCubic));
  return (
    <div style={{ position: "absolute", inset: 0, opacity: o }}>
      {/* soft gold bloom on the hit */}
      <div style={{
        position: "absolute", left: -200, right: -200, top: TITLE_Y - 420, height: 840,
        background: "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(233,184,114,0.55), rgba(233,184,114,0) 70%)",
        opacity: 0.25 + 0.75 * glow,
      }} />
      {parts.map((q, i) => {
        const conv = P(t, T_HIT - 0.35 + q.delay * 0.6, 0.75, E.inOutCubic);
        const drift = (t - 22.3) * 14;
        const x = lerp(q.sx + Math.sin(t * 0.9 + q.ph) * 30 + Math.cos(q.ph) * drift, q.tx, conv);
        const y = lerp(q.sy + Math.cos(t * 0.8 + q.ph) * 30 + Math.sin(q.ph) * drift, q.ty, conv);
        const fade = 1 - P(t, T_HIT + 0.35 + q.delay, 0.5);
        const s = q.size * (1 - 0.5 * conv);
        return <div key={i} style={{
          position: "absolute", left: x - s / 2, top: y - s / 2, width: s, height: s, borderRadius: s,
          background: C.goldHi, boxShadow: `0 0 ${10 + s * 2}px ${C.gold}`, opacity: P(t, 22.4 + q.delay * 2, 0.6) * fade * 0.95,
        }} />;
      })}
      <div style={{ position: "absolute", left: 0, right: 0, top: TITLE_Y - 150, display: "flex", justifyContent: "center",
        transform: `scale(${1.06 - 0.06 * P(t, T_HIT, 2.5, E.outCubic)})` }}>
        {letters.map((ch, i) => {
          const p = P(t, T_HIT + 0.05 + i * 0.03, 0.5, E.outExpo);
          return (
            <span key={i} style={{
              fontFamily: SERIF, fontStyle: "italic", fontSize: 250, lineHeight: 1.2, letterSpacing: -4, paddingRight: 2,
              backgroundImage: GOLD_GRAD, WebkitBackgroundClip: "text", color: "transparent", display: "inline-block",
              opacity: p, filter: `blur(${(1 - p) * 16}px) drop-shadow(0 0 30px rgba(233,184,114,${0.2 + 0.4 * glow}))`,
              transform: `translateY(${(1 - p) * 30}px) scale(${1.2 - 0.2 * p})`,
            }}>{ch}</span>
          );
        })}
      </div>
    </div>
  );
};

/** Label above + dictionary card below (screen space, in front of him). */
export const TitleFront: React.FC<{ t: number }> = ({ t }) => {
  if (t < 22.3 || t > 28.35) return null;
  const lab = win(t, T_HIT + 0.3, 28.3, 0.5, 0.3);
  const card = win(t, T_HIT + 0.55, 28.3, 0.45, 0.25);
  const cp = P(t, T_HIT + 0.55, 0.6, E.outExpo);
  const line = P(t, T_HIT + 0.9, 0.8, E.inOutCubic);
  return (
    <>
      <div style={{ position: "absolute", top: 196, left: 0, right: 0, textAlign: "center", opacity: lab,
        fontFamily: SANS, fontWeight: 600, fontSize: 24, letterSpacing: `${0.6 - 0.32 * P(t, T_HIT + 0.3, 1.2)}em`, color: C.cream }}>
        THE MEETING MOVE
      </div>
      <div style={{
        position: "absolute", left: 110, right: 110, top: 1120, borderRadius: 30, padding: "32px 42px 36px", ...glass,
        opacity: card, transform: `translateY(${(1 - cp) * 50}px)`,
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
          <span style={{ fontFamily: SERIF, fontSize: 64, color: C.cream }}>co·a·lesc·ing</span>
          <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 38, color: C.gold }}>verb</span>
        </div>
        <div style={{ fontFamily: SANS, fontSize: 26, color: "rgba(244,237,226,0.55)", letterSpacing: "0.06em", marginTop: 4 }}>
          /ˌkō-ə-ˈle-siŋ/
        </div>
        <div style={{ height: 1.5, margin: "20px 0 20px", width: `${line * 100}%`, background: `linear-gradient(90deg, ${C.gold}, rgba(233,184,114,0))` }} />
        <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 38, lineHeight: 1.3, color: C.cream, opacity: clamp01((t - T_HIT - 0.9) * 3) }}>
          Pulling scattered ideas together into <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 46, color: C.gold }}>one clear picture.</span>
        </div>
      </div>
    </>
  );
};
