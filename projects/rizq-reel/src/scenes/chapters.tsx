import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FPS, GOLD, GOLD_HI, ITEMS, IVORY, T, cardWin, itemAt } from "../data";
import { ARABIC, MONO, SANS, SERIF } from "../fonts";
import { Abs, foil, inOutCubic, lerp, outBackSoft, outExpo, prog, spring } from "../ui";
import { Lattice, Rosette, starPts } from "./pattern";

/** CSS clip-path for an 8-point star iris of radius R centred at (cx, cy). */
const starClip = (R: number, cx = 540, cy = 860, rot = 0) =>
  `polygon(${starPts(cx, cy, R, R * 0.72, rot).map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(",")})`;

/** Full-screen chapter card for "Number N, <name>": a star iris opens on the emerald world, the Arabic name
 * writes on in gold, the English name rises under it; the iris closes onto the speaker's new framing. */
export const ChapterCards = () => {
  const t = useCurrentFrame() / FPS;
  const it = ITEMS.find((x) => { const [a, b] = cardWin(x); return t >= a && t < b + 0.3; });
  if (!it) return null;
  const [a, b] = cardWin(it);
  const open = prog(t, a, 0.34, outExpo);
  const close = prog(t, b - 0.02, 0.3, Easing_inCubic);
  const R = lerp(0, 1500, open) * (1 - close);
  if (R < 1) return null;
  const local = t - a;
  const num = String(it.n).padStart(2, "0");
  const arP = prog(t, a + 0.1, 0.5, outExpo);
  const enP = prog(t, a + 0.22, 0.45, outExpo);
  const mP = prog(t, a + 0.36, 0.4);
  return (
    <AbsoluteFill style={{ clipPath: starClip(R, 540, 860, local * 0.6) }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 60% at 50% 45%, #14583F 0%, #0A3127 48%, #03120D 100%)" }} />
      <Lattice cell={135} draw={prog(t, a, 0.8, inOutCubic)} opacity={0.16} drift={local * 0.4} />
      {/* giant outline numeral */}
      <Abs style={{ left: 0, right: 0, top: 230, textAlign: "center", fontFamily: SERIF, fontSize: 1120, lineHeight: "1120px", color: "transparent", WebkitTextStroke: "2px rgba(226,188,114,0.22)", transform: `translateY(${lerp(80, 0, prog(t, a, 0.9, outExpo))}px) scale(${lerp(1.12, 1, prog(t, a, 1.2, outExpo))})` }}>
        {it.n}
      </Abs>
      <Abs style={{ left: 540 - 430, top: 860 - 430 }}>
        <Rosette size={860} t={local * 2 + it.n} draw={prog(t, a + 0.05, 0.9, inOutCubic)} opacity={0.55} />
      </Abs>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, rgba(242,212,146,0.22), rgba(0,0,0,0) 45%)" }} />
      {/* counter */}
      <Abs style={{ left: 0, right: 0, top: 380, display: "flex", justifyContent: "center", alignItems: "center", gap: 22, opacity: prog(t, a + 0.05, 0.3), transform: `translateY(${lerp(-20, 0, prog(t, a + 0.05, 0.4, outExpo))}px)` }}>
        <div style={{ width: lerp(0, 120, prog(t, a + 0.1, 0.5, outExpo)), height: 1.5, background: `linear-gradient(90deg, rgba(226,188,114,0), ${GOLD})` }} />
        <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 8, color: GOLD_HI, fontWeight: 500 }}>
          ACTION {num} <span style={{ opacity: 0.45 }}>/ 07</span>
        </div>
        <div style={{ width: lerp(0, 120, prog(t, a + 0.1, 0.5, outExpo)), height: 1.5, background: `linear-gradient(90deg, ${GOLD}, rgba(226,188,114,0))` }} />
      </Abs>
      {/* Arabic name */}
      <Abs style={{ left: 0, right: 0, top: 600, textAlign: "center", direction: "rtl" }}>
        <span
          style={{
            ...foil,
            display: "inline-block",
            fontFamily: ARABIC,
            fontWeight: 700,
            fontSize: it.ar.length > 10 ? 168 : 210,
            lineHeight: "330px",
            padding: "0 30px",
            filter: `blur(${(1 - arP) * 14}px) drop-shadow(0 10px 40px rgba(226,188,114,0.35))`,
            opacity: arP,
            transform: `scale(${lerp(1.25, 1, arP)})`,
            clipPath: `inset(0 0 0 ${(1 - arP) * 100}%)`,
          }}
        >
          {it.ar}
        </span>
      </Abs>
      {/* English name */}
      <Abs style={{ left: 40, right: 40, top: 1000, textAlign: "center", fontFamily: SERIF, fontSize: it.name.length > 12 ? 104 : 132, lineHeight: 1, color: IVORY, letterSpacing: -2 }}>
        {it.name.split("").map((ch, i) => {
          const p = prog(t, a + 0.2 + i * 0.022, 0.42, outBackSoft);
          return (
            <span key={i} style={{ display: "inline-block", whiteSpace: "pre", opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * 60}px)`, filter: `blur(${(1 - Math.min(1, p)) * 6}px)` }}>
              {ch}
            </span>
          );
        })}
      </Abs>
      <Abs style={{ left: 0, right: 0, top: 1170, textAlign: "center", opacity: mP, transform: `translateY(${(1 - mP) * 16}px)` }}>
        <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 44, color: GOLD_HI, opacity: 0.9 }}>{it.tr}</span>
        <div style={{ marginTop: 18, fontFamily: SANS, fontWeight: 600, fontSize: 30, letterSpacing: 5, color: "rgba(247,240,225,0.72)", textTransform: "uppercase" }}>{it.meaning}</div>
      </Abs>
      {/* iris rim */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: enP * (1 - close) }}>
        <polygon points={starPts(540, 860, R - 4, (R - 4) * 0.72, local * 0.6).map((p) => p.join(",")).join(" ")} fill="none" stroke={GOLD} strokeWidth={6} />
      </svg>
    </AbsoluteFill>
  );
};
const Easing_inCubic = (x: number) => x * x * x;

/** Top rail: seven stars on a hairline, filled as each action is reached; the current one glows and is named. */
export const ProgressRail = () => {
  const t = useCurrentFrame() / FPS;
  const k = itemAt(t);
  if (k === 0 || t >= T.endCard) return null;
  const vis = prog(t, cardWin(ITEMS[0])[1] - 0.1, 0.5, outExpo) * (1 - prog(t, T.endCard - 0.3, 0.3));
  const it = ITEMS[k - 1];
  const [, out] = cardWin(it);
  const lab = prog(t, out - 0.05, 0.45, outExpo);
  const recap = prog(t, T.recap, 0.5);
  const x0 = 210, x1 = 870, gap = (x1 - x0) / 6;
  return (
    <Abs style={{ left: 0, top: 0, width: 1080, height: 420, opacity: vis * (1 - recap) }}>
      <svg width={1080} height={300} style={{ position: "absolute", top: 0 }}>
        <line x1={x0} y1={262} x2={x1} y2={262} stroke="rgba(247,240,225,0.25)" strokeWidth={2} />
        <line x1={x0} y1={262} x2={x0 + gap * Math.max(0, k - 2 + prog(t, out - 0.2, 0.6, inOutCubic))} y2={262} stroke={GOLD} strokeWidth={2.5} />
        {ITEMS.map((x, i) => {
          const done = i < k - 1;
          const cur = i === k - 1;
          const pop = cur ? spring(t, out - 0.1, 2.2, 6) : 1;
          const r = cur ? 19 * Math.min(1.3, pop) : 12;
          return (
            <g key={i}>
              {cur && <circle cx={x0 + gap * i} cy={262} r={34} fill="rgba(226,188,114,0.22)" />}
              <polygon points={starPts(x0 + gap * i, 262, r, r * 0.62, Math.PI / 8).map((p) => p.join(",")).join(" ")} fill={done || cur ? GOLD : "rgba(4,20,15,0.6)"} stroke={done || cur ? GOLD_HI : "rgba(247,240,225,0.45)"} strokeWidth={1.5} />
            </g>
          );
        })}
      </svg>
      <Abs style={{ left: 0, right: 0, top: 310, display: "flex", justifyContent: "center", opacity: lab, transform: `translateY(${(1 - lab) * -14}px)` }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 18, padding: "10px 28px 12px", borderRadius: 999, background: "rgba(4,20,15,0.55)", border: "1.5px solid rgba(226,188,114,0.45)", backdropFilter: "blur(14px)" }}>
          <span style={{ fontFamily: MONO, fontSize: 26, color: GOLD, letterSpacing: 3 }}>{String(it.n).padStart(2, "0")}</span>
          <span style={{ fontFamily: SERIF, fontSize: 46, color: IVORY, lineHeight: 1 }}>{it.name}</span>
          <span style={{ fontFamily: ARABIC, fontWeight: 700, fontSize: 38, color: GOLD_HI, lineHeight: 1 }}>{it.ar}</span>
        </div>
      </Abs>
    </Abs>
  );
};
