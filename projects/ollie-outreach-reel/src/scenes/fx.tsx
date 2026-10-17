import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CHAPTERS, CREAM, FPS, GOLD, SHOTS, T } from "../data";
import { MONO, SANS } from "../fonts";
import { Abs, bump, inOutCubic, lerp, outExpo, prog, rnd, win } from "../ui";

/** Short exposure flashes on the big moments. */
export const Flash = () => {
  const t = useCurrentFrame() / FPS;
  const a = Math.max(
    0.8 * (1 - prog(t, 0, 0.28)),
    ...SHOTS.slice(1).map((s) => bump(t - s + 0.05, 0.22) * 0.32),
    bump(t - T.k5 + 0.03, 0.18) * 0.28,
    bump(t - T.endCard + 0.1, 0.3) * 0.35,
  );
  if (a <= 0.005) return null;
  return <AbsoluteFill style={{ background: "#FFF1D8", opacity: a }} />;
};

/** Warm gold light leaks sweeping across on chapter changes. */
const LEAKS = [0.05, ...CHAPTERS.map((c) => c.t), T.endCard - 0.1];
export const LightLeaks = () => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
      {LEAKS.map((p, i) => {
        const d = 0.85;
        const k = (t - (p - 0.15)) / d;
        if (k < 0 || k > 1) return null;
        const dir = i % 2 ? -1 : 1;
        const x = lerp(-500, 1580, inOutCubic(k));
        return (
          <Abs
            key={i}
            style={{
              left: dir > 0 ? x - 600 : 1080 - x - 600,
              top: -200 + rnd(i) * 900,
              width: 1200,
              height: 1500,
              opacity: Math.sin(k * Math.PI) * 0.4,
              background: "radial-gradient(ellipse 40% 50% at 50% 50%, rgba(255,214,150,0.95), rgba(232,170,90,0.45) 40%, rgba(220,140,60,0) 72%)",
              filter: "blur(40px)",
              transform: `rotate(${dir * 20}deg)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Chapter rail at the top: five ticks, the current chapter's number and name. */
export const ChapterRail = () => {
  const t = useCurrentFrame() / FPS;
  if (t < CHAPTERS[0].t - 0.2 || t >= T.endCard) return null;
  let k = 0;
  CHAPTERS.forEach((c, i) => t >= c.t - 0.05 && (k = i));
  const c = CHAPTERS[k];
  const a = win(t, CHAPTERS[0].t - 0.2, T.endCard, 0.35, 0.25);
  const sw = prog(t, c.t - 0.05, 0.5, outExpo);
  return (
    <Abs style={{ left: 0, right: 0, top: 150, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, opacity: a }}>
      <div style={{ display: "flex", gap: 10 }}>
        {CHAPTERS.map((_, i) => {
          const on = i < k ? 1 : i === k ? sw : 0;
          return (
            <div key={i} style={{ width: 64, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.22)", overflow: "hidden" }}>
              <div style={{ width: `${on * 100}%`, height: "100%", background: `linear-gradient(90deg, ${GOLD}, #FFE3A6)`, boxShadow: `0 0 12px ${GOLD}` }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, transform: `translateY(${(1 - sw) * 16}px)`, opacity: sw }}>
        <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 26, color: GOLD, letterSpacing: 3 }}>{c.n}</span>
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 30, color: CREAM, letterSpacing: 4, textTransform: "uppercase", textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}>{c.title}</span>
      </div>
    </Abs>
  );
};
