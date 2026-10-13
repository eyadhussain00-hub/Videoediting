import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { C, P, E, SANS, SERIF, goldText, SRC_END } from "../theme";

export const EndCard: React.FC<{ t: number }> = ({ t }) => {
  const l = t - SRC_END;
  const bg = P(l, 0, 0.5);
  const a = P(l, 0.25, 0.6, E.outExpo), b = P(l, 0.55, 0.7, E.outExpo), c = P(l, 1.0, 0.5, E.outBack);
  const line = P(l, 0.45, 0.9, E.inOutCubic);
  return (
    <AbsoluteFill>
      <Img src={staticFile("last.jpg")} style={{ width: 1080, height: 1920, transform: `scale(${1.04 + 0.03 * P(l, 0, 3, E.linear)})`, filter: "blur(16px) brightness(0.55) saturate(0.9)" }} />
      <AbsoluteFill style={{ background: `rgba(8,5,3,${0.35 * bg})` }} />
      <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingBottom: 140 }}>
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 24, letterSpacing: "0.3em", color: C.gold, opacity: a, marginBottom: 34 }}>
          THE 60-SECOND COMMUNICATION COACH
        </div>
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 76, color: C.cream, letterSpacing: -1.5, opacity: a, transform: `translateY(${(1 - a) * 30}px)`, filter: `blur(${(1 - a) * 10}px)` }}>
          Don't add noise.
        </div>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 150, lineHeight: 1.1, ...goldText, opacity: b, transform: `translateY(${(1 - b) * 30}px)`, filter: `blur(${(1 - b) * 12}px)` }}>
          Bring clarity.
        </div>
        <div style={{ width: 420 * line, height: 1.5, background: `linear-gradient(90deg, rgba(233,184,114,0), ${C.gold}, rgba(233,184,114,0))`, margin: "36px 0 46px" }} />
        <div style={{
          display: "flex", alignItems: "center", gap: 16, padding: "18px 34px 18px 18px", borderRadius: 999,
          background: "rgba(244,237,226,0.08)", border: "1.5px solid rgba(233,184,114,0.6)", transform: `scale(${c})`, opacity: c > 0 ? 1 : 0,
        }}>
          <div style={{ width: 48, height: 48, borderRadius: 24, background: C.gold, color: C.ink, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 700, fontSize: 32 }}>+</div>
          <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 36, color: C.cream }}>Follow <span style={{ color: C.gold }}>@hijeffdav</span></span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
