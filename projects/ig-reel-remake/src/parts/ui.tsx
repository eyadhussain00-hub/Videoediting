import type { CSSProperties, ReactNode } from "react";
import { C } from "../theme";

/** Frosted glass panel used by every UI graphic. */
export const glass = (extra: CSSProperties = {}): CSSProperties => ({
  background: "linear-gradient(180deg, rgba(30,30,34,0.72), rgba(14,14,16,0.72))",
  backdropFilter: "blur(22px) saturate(1.2)",
  WebkitBackdropFilter: "blur(22px) saturate(1.2)",
  border: `1.5px solid ${C.line}`,
  boxShadow: "0 30px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)",
  ...extra,
});

/** Pop-in transform for a 0→1 progress value: scale up with a little overshoot, rise, un-blur. */
export const pop = (k: number, rise = 40): CSSProperties => {
  const o = k < 1 ? 1 + Math.sin(k * Math.PI) * 0.06 : 1;
  return {
    opacity: Math.min(1, k * 1.6),
    transform: `translateY(${(1 - k) * rise}px) scale(${(0.86 + 0.14 * k) * o})`,
    filter: k < 1 ? `blur(${(1 - k) * 10}px)` : undefined,
  };
};

export const Center = ({ y, children, style }: { y: number; children: ReactNode; style?: CSSProperties }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center", ...style }}>
    {children}
  </div>
);

export const Cursor = ({ x, y, press = 0 }: { x: number; y: number; press?: number }) => (
  <svg
    width="64"
    height="64"
    viewBox="0 0 24 24"
    style={{ position: "absolute", left: x, top: y, transform: `scale(${1 - press * 0.15})`, transformOrigin: "0 0", filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.5))" }}
  >
    <path d="M4 2 L4 19 L8.5 14.8 L11.6 21.5 L14.4 20.3 L11.3 13.7 L17.5 13.5 Z" fill="#fff" stroke="#111" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>
);
