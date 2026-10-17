import type { CSSProperties, ReactNode } from "react";
import { useCurrentFrame } from "remotion";
import { EMBER, FPS, GRAPHITE, IVORY } from "./data";
import { MONO, SANS, SERIF } from "./fonts";
import { Abs, IconCheck, IconX, bump, clamp01, enter, glass, lerp, outBack, prog, spring, win } from "./ui";

export const useT = () => useCurrentFrame() / FPS;

/** A block that exists only inside [a, b): children get the in/out progress. */
export const Beat = ({ a, b, fin = 0.35, fout = 0.3, children }: { a: number; b: number; fin?: number; fout?: number; children: (p: number, q: number, t: number) => ReactNode }) => {
  const t = useT();
  if (t < a - 0.01 || t > b + 0.01) return null;
  const p = prog(t, a, fin, outBack);
  const q = prog(t, b - fout, fout);
  return <>{children(Math.min(p, 1.04), q, t)}</>;
};

/** Pop-in for an item at time s (scale overshoot + blur off). */
export const pop = (t: number, s: number, dy = 30): CSSProperties => {
  const k = clamp01(spring(t, s - 0.03, 2.6, 7));
  const v = prog(t, s - 0.03, 0.14);
  return {
    opacity: v,
    transform: `translateY(${(1 - Math.min(1, spring(t, s - 0.03, 2.6, 7))) * dy}px) scale(${lerp(0.7, 1, Math.min(1.06, spring(t, s - 0.03, 2.6, 7)))})`,
    filter: v < 1 ? `blur(${(1 - v) * 8}px)` : undefined,
  };
  void k;
};

/** Centred top-zone container (above his head). */
export const Top = ({ children, top = 150, style }: { children: ReactNode; top?: number; style?: CSSProperties }) => (
  <Abs style={{ left: 0, right: 0, top, display: "flex", justifyContent: "center", ...style }}>{children}</Abs>
);

export const Kicker = ({ children, color = EMBER, style }: { children: ReactNode; color?: string; style?: CSSProperties }) => (
  <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 4.5, textTransform: "uppercase", color, fontWeight: 600, ...style }}>{children}</div>
);

/** Glass chip with an icon + label. */
export const Chip = ({ icon, children, style, accent = false }: { icon?: ReactNode; children: ReactNode; style?: CSSProperties; accent?: boolean }) => (
  <div
    style={{
      ...glass,
      borderRadius: 999,
      padding: "18px 34px 18px 22px",
      display: "flex",
      alignItems: "center",
      gap: 16,
      fontSize: 38,
      fontWeight: 650,
      letterSpacing: -0.6,
      whiteSpace: "nowrap",
      ...(accent ? { background: `linear-gradient(180deg, #FF7C42, ${EMBER})`, border: "1.5px solid rgba(255,220,200,0.5)", boxShadow: "0 24px 60px rgba(255,90,30,0.35), inset 0 1px 0 rgba(255,255,255,0.4)" } : {}),
      ...style,
    }}
  >
    {icon}
    {children}
  </div>
);

/** Round icon well. */
export const Well = ({ children, size = 64, accent = false }: { children: ReactNode; size?: number; accent?: boolean }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: accent ? EMBER : "rgba(255,240,225,0.1)",
      border: accent ? "none" : "1.5px solid rgba(255,240,225,0.18)",
      flex: "none",
    }}
  >
    {children}
  </div>
);

/** A line that strikes through its parent from `s`. */
export const Strike = ({ t, s, color = EMBER, top = "52%" }: { t: number; s: number; color?: string; top?: string }) => {
  const k = prog(t, s, 0.28);
  if (k <= 0) return null;
  return <Abs style={{ left: -6, top, height: 5, width: `calc(${k * 100}% + 12px)`, background: color, borderRadius: 3, boxShadow: `0 0 14px ${color}`, transform: "rotate(-2deg)" }} />;
};

export const Tick = ({ t, s, ok = true, size = 54 }: { t: number; s: number; ok?: boolean; size?: number }) => {
  const k = spring(t, s, 2.8, 8);
  if (t < s) return <div style={{ width: size, height: size }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: size / 2, background: ok ? EMBER : "rgba(255,240,225,0.12)", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${Math.min(1.15, k)})`, flex: "none" }}>
      {ok ? <IconCheck size={size * 0.62} color="#fff" /> : <IconX size={size * 0.55} color={IVORY} />}
    </div>
  );
};

/** Huge type that sits BEHIND the speaker (rendered under the Person layer). */
export const BehindType = ({ a, b, children, top = 560, size = 300, color = IVORY, italic = true, font = SERIF, ls = -6, style }: { a: number; b: number; children: ReactNode; top?: number; size?: number; color?: string; italic?: boolean; font?: string; ls?: number; style?: CSSProperties }) => (
  <Beat a={a} b={b} fin={0.45} fout={0.3}>
    {(p, q) => (
      <Abs style={{ left: -100, right: -100, top, textAlign: "center", fontFamily: font, fontStyle: italic ? "italic" : "normal", fontSize: size, lineHeight: 0.9, letterSpacing: ls, color, ...enter(Math.min(1, p), q, 80), textShadow: "0 20px 80px rgba(0,0,0,0.35)", ...style }}>
        {children}
      </Abs>
    )}
  </Beat>
);

/** Rolling number. */
export const Count = ({ t, s, dur, to, from = 0, prefix = "", suffix = "", style }: { t: number; s: number; dur: number; to: number; from?: number; prefix?: string; suffix?: string; style?: CSSProperties }) => {
  const k = prog(t, s, dur, (x) => 1 - Math.pow(1 - x, 4));
  const v = lerp(from, to, k);
  const hasDec = to % 1 !== 0;
  return (
    <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>
      {prefix}
      {hasDec ? v.toFixed(2) : Math.round(v).toLocaleString("en-US")}
      {suffix}
    </span>
  );
};

/** Typewriter: the first n characters of `text` from `s` at `cps`. */
export const typed = (t: number, s: number, text: string, cps = 28) => text.slice(0, Math.max(0, Math.floor((t - s) * cps)));
export const Caret = ({ t, color = EMBER }: { t: number; color?: string }) => (
  <span style={{ display: "inline-block", width: 4, height: "0.9em", marginLeft: 4, background: color, verticalAlign: "-0.1em", opacity: Math.floor(t * 2.4) % 2 ? 0.2 : 1 }} />
);

export const glow = (t: number, s: number) => bump(t - s, 0.5);
export { GRAPHITE, SANS, SERIF, MONO };
