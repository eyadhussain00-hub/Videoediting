import React from "react";
import { AbsoluteFill } from "remotion";
import { alpha, ease, k, lerp, useReel, useT } from "./theme";

/** The graphics ground: near-black, a faint 90 px grid, and a slow accent glow. */
export const Ground: React.FC = () => {
  const t = useT();
  const { theme: C } = useReel();
  const gx = 540 + Math.sin(t * 0.31) * 220;
  const gy = 760 + Math.cos(t * 0.23) * 260;
  const line = "rgba(255,255,255,0.09)";
  const mask = "radial-gradient(ellipse 80% 60% at 50% 45%, black 20%, transparent 80%)";
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`,
          backgroundSize: "90px 90px",
          backgroundPosition: `${-15 + ((t * 6) % 90)}px -30px`,
          opacity: 0.38,
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      />
      <AbsoluteFill style={{ background: `radial-gradient(circle 620px at ${gx}px ${gy}px, ${alpha(C.accent, 0.085)}, ${alpha(C.accent, 0)} 70%)` }} />
      <AbsoluteFill style={{ background: `radial-gradient(circle 700px at ${1080 - gx}px ${1920 - gy}px, rgba(110,90,255,0.07), rgba(0,0,0,0) 70%)` }} />
    </AbsoluteFill>
  );
};

/** A full-screen cutaway that arrives with a blurred push and leaves with a blurred settle. */
export const Cutaway: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => {
  const t = useT();
  if (t < from - 0.01 || t > to + 0.01) return null;
  const p = k(t, from, from + 0.34);
  const q = k(t, to - 0.26, to, ease.in);
  return (
    <AbsoluteFill
      style={{
        opacity: Math.min(1, p * 1.6) * (1 - q),
        scale: String(lerp(1.06, 1, p) * lerp(1, 0.965, q)),
        translate: `0 ${lerp(70, 0, p) + lerp(0, -40, q)}px`,
        filter: `blur(${lerp(18, 0, p) + lerp(0, 16, q)}px)`,
      }}
    >
      <Ground />
      {children}
    </AbsoluteFill>
  );
};

/** Text that rises out of a mask. */
export const Rise: React.FC<{ at: number; children: React.ReactNode; dur?: number; style?: React.CSSProperties }> = ({
  at,
  children,
  dur = 0.5,
  style,
}) => {
  const t = useT();
  const p = k(t, at, at + dur);
  return (
    <div style={{ overflow: "hidden", paddingBottom: "0.08em", ...style }}>
      <div style={{ translate: `0 ${lerp(110, 0, p)}%`, opacity: p > 0 ? 1 : 0 }}>{children}</div>
    </div>
  );
};
