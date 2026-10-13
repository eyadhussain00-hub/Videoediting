import React from "react";
import { AbsoluteFill } from "remotion";
import { C, F, ease, k, lerp, useT } from "./theme";

/** The graphics ground: near-black, a faint 90 px grid, and a slow volt glow. */
export const Ground: React.FC<{ glow?: number }> = ({ glow = 1 }) => {
  const t = useT();
  const gx = 540 + Math.sin(t * 0.31) * 220;
  const gy = 760 + Math.cos(t * 0.23) * 260;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px)`,
          backgroundSize: "90px 90px",
          backgroundPosition: `${-15 + ((t * 6) % 90)}px -30px`,
          opacity: 0.38,
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 45%, black 20%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 45%, black 20%, transparent 80%)",
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle 620px at ${gx}px ${gy}px, rgba(215,255,61,${0.085 * glow}), rgba(215,255,61,0) 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle 700px at ${1080 - gx}px ${1920 - gy}px, rgba(110,90,255,${0.07 * glow}), rgba(0,0,0,0) 70%)`,
        }}
      />
    </AbsoluteFill>
  );
};

/** A full-screen cutaway that arrives with a blurred push and leaves with a blurred settle. */
export const Cutaway: React.FC<{ from: number; to: number; children: React.ReactNode; ground?: boolean }> = ({
  from,
  to,
  children,
  ground = true,
}) => {
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
      {ground && <Ground />}
      {children}
    </AbsoluteFill>
  );
};

/** Mono kicker with a status dot, e.g. "● THE OLD WAY". */
export const Kicker: React.FC<{ text: string; color?: string; at: number; y?: number }> = ({
  text,
  color = C.volt,
  at,
  y = 250,
}) => {
  const t = useT();
  const p = k(t, at, at + 0.45);
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity: p,
        translate: `0 ${lerp(16, 0, p)}px`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "14px 26px",
          borderRadius: 999,
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14)",
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <div style={{ width: 12, height: 12, borderRadius: 6, background: color, boxShadow: `0 0 18px ${color}` }} />
        <span style={{ fontFamily: F.mono, fontWeight: 500, fontSize: 26, letterSpacing: "0.18em", color: C.ink }}>
          {text}
        </span>
      </div>
    </div>
  );
};

export const cardStyle: React.CSSProperties = {
  position: "absolute",
  borderRadius: 40,
  background: "linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.02))",
  boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.09), 0 30px 80px rgba(0,0,0,0.45)",
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

/** A number that counts up between two times. */
export const Count: React.FC<{ from?: number; to: number; a: number; b: number; fmt?: (n: number) => string }> = ({
  from = 0,
  to,
  a,
  b,
  fmt = (n) => String(Math.round(n)),
}) => {
  const t = useT();
  return <>{fmt(lerp(from, to, k(t, a, b, ease.inOut)))}</>;
};
