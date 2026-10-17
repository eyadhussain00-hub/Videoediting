import type { CSSProperties, ReactNode } from "react";
import { MONO, SANS, SERIF } from "../fonts";
import { Abs, BONE, accent, glass, lerp, outBack, outExpo, prog, rnd, win } from "../ui";

/** A HUD chip: icon + mono label + value, slides in from its side. */
export const Chip = ({
  t, a, b, x, y, side = "left", icon, label, value, color, width = 380, style,
}: {
  t: number; a: number; b: number; x: number; y: number; side?: "left" | "right";
  icon?: ReactNode; label: string; value?: ReactNode; color: string; width?: number; style?: CSSProperties;
}) => {
  const v = win(t, a, b, 0.25, 0.25);
  if (v <= 0.001) return null;
  const p = prog(t, a, 0.45, outExpo);
  const dir = side === "left" ? -1 : 1;
  return (
    <Abs
      style={{
        left: x, top: y, width, padding: "18px 22px", borderRadius: 26, ...glass,
        borderColor: color.replace(/[\d.]+\)$/, "0.45)"),
        opacity: v, transform: `translateX(${dir * (1 - p) * 120}px) scale(${lerp(0.92, 1, p)})`,
        display: "flex", alignItems: "center", gap: 18, ...style,
      }}
    >
      {icon && (
        <div style={{ width: 64, height: 64, borderRadius: 18, background: color.replace(/[\d.]+\)$/, "0.16)"), display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
          {icon}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
        <div style={{ fontFamily: MONO, fontSize: 21, letterSpacing: 3, color: "rgba(244,239,230,0.62)", textTransform: "uppercase", whiteSpace: "nowrap" }}>{label}</div>
        {value !== undefined && <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 40, letterSpacing: -0.8, color: BONE, whiteSpace: "nowrap" }}>{value}</div>}
      </div>
      <Blink t={t} color={color} />
    </Abs>
  );
};

/** Little live dot. */
export const Blink = ({ t, color, size = 12, style }: { t: number; color: string; size?: number; style?: CSSProperties }) => (
  <div style={{ marginLeft: "auto", width: size, height: size, borderRadius: size, background: color, boxShadow: `0 0 14px ${color}`, opacity: 0.45 + 0.55 * (Math.sin(t * 9) > 0 ? 1 : 0.3), flex: "none", ...style }} />
);

/** Scrolling ECG trace; `rate` is beats per second, `amp` the spike height. */
export const Ecg = ({ t, w, h, rate, color, amp = 1, sw = 4 }: { t: number; w: number; h: number; rate: number; color: string; amp?: number; sw?: number }) => {
  const pts: string[] = [];
  const N = 140;
  for (let i = 0; i <= N; i++) {
    const x = (i / N) * w;
    const ph = ((t * rate - (1 - i / N) * 2.2) % 1 + 1) % 1; // two-ish beats across the width
    let y = 0;
    if (ph > 0.1 && ph < 0.16) y = -0.12 * Math.sin(((ph - 0.1) / 0.06) * Math.PI);
    else if (ph > 0.22 && ph < 0.25) y = 0.18 * ((ph - 0.22) / 0.03);
    else if (ph >= 0.25 && ph < 0.29) y = lerp(0.18, -1, (ph - 0.25) / 0.04);
    else if (ph >= 0.29 && ph < 0.33) y = lerp(-1, 0.32, (ph - 0.29) / 0.04);
    else if (ph >= 0.33 && ph < 0.36) y = lerp(0.32, 0, (ph - 0.33) / 0.03);
    else if (ph > 0.45 && ph < 0.58) y = -0.22 * Math.sin(((ph - 0.45) / 0.13) * Math.PI);
    pts.push(`${x.toFixed(1)},${(h / 2 + y * amp * h * 0.45).toFixed(1)}`);
  }
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`ecg${w}${h}`} x1="0" x2="1">
          <stop offset="0" stopColor={color} stopOpacity="0" />
          <stop offset="0.7" stopColor={color} stopOpacity="0.9" />
          <stop offset="1" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>
      <polyline points={pts.join(" ")} fill="none" stroke={`url(#ecg${w}${h})`} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
    </svg>
  );
};

/** Chapter tag, top-left: "01 / RECOGNIZE". */
export const Tag = ({ t, a, b, n, label, color }: { t: number; a: number; b: number; n?: string; label: string; color: string }) => {
  const v = win(t, a, b, 0.2, 0.3);
  if (v <= 0.001) return null;
  const p = prog(t, a, 0.5, outExpo);
  return (
    <Abs style={{ left: 64, top: 150, opacity: v, display: "flex", alignItems: "center", gap: 18, transform: `translateY(${(1 - p) * -30}px)` }}>
      {n && <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 30, color, letterSpacing: 2 }}>{n}</div>}
      <div style={{ width: lerp(0, 60, p), height: 3, background: color, boxShadow: `0 0 10px ${color}` }} />
      <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 30, letterSpacing: 6, color: BONE }}>{label}</div>
    </Abs>
  );
};

/** Big letters that sit behind the speaker (render before <Person/>). Letters rise in one by one. */
export const BigType = ({
  t, a, b, text, y, size, color, stroke = false, font = SANS, weight = 900, italic = false, spacing = -6, stagger = 0.04, glow = true,
}: {
  t: number; a: number; b: number; text: string; y: number; size: number; color: string; stroke?: boolean; font?: string; weight?: number; italic?: boolean; spacing?: number; stagger?: number; glow?: boolean;
}) => {
  const v = win(t, a, b, 0.15, 0.3);
  if (v <= 0.001) return null;
  return (
    <Abs style={{ left: -100, right: -100, top: y, display: "flex", justifyContent: "center", opacity: v }}>
      {[...text].map((ch, i) => {
        const p = prog(t, a + i * stagger, 0.5, outBack);
        return (
          <span
            key={i}
            style={{
              display: "inline-block", fontFamily: font, fontWeight: weight, fontStyle: italic ? "italic" : "normal", fontSize: size, lineHeight: 1, letterSpacing: spacing,
              color: stroke ? "transparent" : color, WebkitTextStroke: stroke ? `3px ${color}` : undefined,
              transform: `translateY(${(1 - p) * size * 0.5}px)`, opacity: Math.min(1, p * 1.5),
              textShadow: glow && !stroke ? `0 0 60px ${color.replace(/[\d.]+\)$/, "0.45)")}` : undefined,
              whiteSpace: "pre",
            }}
          >
            {ch}
          </span>
        );
      })}
    </Abs>
  );
};

/** Serif line with words that light up as he says them. `times` are the start times of each word. */
export const LitLine = ({ t, words, times, size, color, dim = 0.22, style, italic = true }: { t: number; words: string[]; times: number[]; size: number; color: string | ((i: number) => string); dim?: number; style?: CSSProperties; italic?: boolean }) => (
  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: size * 0.26, ...style }}>
    {words.map((w, i) => {
      const p = prog(t, times[i] - 0.05, 0.25);
      const c = typeof color === "function" ? color(i) : color;
      return (
        <span key={i} style={{ fontFamily: SERIF, fontStyle: italic ? "italic" : "normal", fontSize: size, lineHeight: 1.08, color: c, opacity: lerp(dim, 1, p), filter: `blur(${(1 - p) * 3}px)`, textShadow: p > 0.5 ? "0 6px 30px rgba(0,0,0,0.55)" : undefined }}>
          {w}
        </span>
      );
    })}
  </div>
);

/** Floating embers that drift up while he is hot. */
export const Embers = ({ t, amount }: { t: number; amount: number }) => {
  if (amount <= 0.01) return null;
  return (
    <Abs style={{ inset: 0, mixBlendMode: "screen" }}>
      {Array.from({ length: 36 }, (_, i) => {
        const sp = 90 + rnd(i) * 160;
        const y = 1960 - (((t * sp + rnd(i + 7) * 2000) % 2100));
        const x = rnd(i + 3) * 1080 + Math.sin(t * (0.6 + rnd(i)) + i) * 30;
        const s = 3 + rnd(i + 9) * 7;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: s, height: s, borderRadius: s, background: "#FFB070", boxShadow: "0 0 12px #FF6A20", opacity: amount * (0.3 + 0.7 * rnd(i + 5)) * Math.min(1, y / 600) }} />;
      })}
    </Abs>
  );
};

export const accentFor = accent;
