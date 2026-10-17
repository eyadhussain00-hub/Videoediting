import { useCurrentFrame } from "remotion";
import { CREAM, FPS, GOLD, GOLD_HI, T } from "../data";
import { MONO, SERIF } from "../fonts";
import { Abs, IconBriefcase, IconFlame, IconSend, IconTarget, IconUser, eyebrow, glass, goldText, lerp, outBack, outExpo, prog, spring, win } from "../ui";

// Chapter 02 sits in the lounger shot's empty deck (lower half).
const E = () => T.way1 - 0.1;

/** "To land my first role as an appointment setter": the goal chip. */
export const GoalChip = () => {
  const t = useCurrentFrame() / FPS;
  const s = T.first1 - 0.15;
  const e = T.every1 - 0.15;
  if (t < s || t > e + 0.3) return null;
  const p = spring(t, s, 2.2, 7);
  return (
    <Abs style={{ left: 0, right: 0, top: 860, display: "flex", justifyContent: "center", opacity: win(t, s, e + 0.2, 0.15, 0.25) }}>
      <div style={{ ...glass, borderRadius: 999, padding: "14px 30px", display: "flex", alignItems: "center", gap: 16, transform: `scale(${lerp(0.6, 1, Math.min(1.1, p))})` }}>
        <IconTarget size={42} color={GOLD} sw={1.8} />
        <span style={{ ...eyebrow, fontSize: 22, color: "rgba(251,244,232,0.7)" }}>Goal</span>
        <span style={{ fontWeight: 700, fontSize: 36 }}>Land your first role</span>
      </div>
    </Abs>
  );
};

const NODE = { x: 540, y: 1150 };
const TARGETS = [
  { label: "Coaches", Icon: IconUser, x: 250, y: 1360, t: () => T.coaches1 },
  { label: "Online businesses", Icon: IconBriefcase, x: 800, y: 1360, t: () => T.businesses1 },
];

/** "Outreaching to coaches and online businesses … hundreds of times": a send hub firing DMs at two targets. */
export const OutreachHub = () => {
  const t = useCurrentFrame() / FPS;
  const s = T.outreaching - 0.15;
  if (t < s || t > E() + 0.3) return null;
  const a = win(t, s, E() + 0.2, 0.2, 0.25);
  const hub = spring(t, s, 2, 7);
  const firing = t > T.coaches1 - 0.1;
  const count = Math.round(prog(t, T.hundreds - 0.1, T.role2 - T.hundreds + 0.2, (x) => 1 - Math.pow(1 - x, 2)) * 300);
  return (
    <Abs style={{ left: 0, top: 0, width: 1080, height: 1920, opacity: a }}>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="ln" x1="0" x2="1">
            <stop offset="0" stopColor={GOLD} stopOpacity="0.9" />
            <stop offset="1" stopColor={GOLD_HI} stopOpacity="0.4" />
          </linearGradient>
        </defs>
        {TARGETS.map((g, i) => {
          const d = prog(t, g.t() - 0.2, 0.45, outExpo);
          const len = Math.hypot(g.x - NODE.x, g.y - NODE.y);
          return <line key={i} x1={NODE.x} y1={NODE.y} x2={g.x} y2={g.y} stroke="url(#ln)" strokeWidth={3} strokeDasharray={`${len * d} ${len}`} />;
        })}
        {firing &&
          Array.from({ length: 18 }).map((_, k) => {
            // little packets travelling hub → target, faster once "hundreds" lands
            const rate = t > T.hundreds ? 5 : 2;
            const ph = ((t - T.coaches1) * rate + k / 18 * 3) % 1;
            const g = TARGETS[k % 2];
            if (k % 2 === 1 && t < T.businesses1) return null;
            if (k > (t > T.hundreds ? 18 : 6)) return null;
            const x = lerp(NODE.x, g.x, ph);
            const y = lerp(NODE.y, g.y, ph);
            return <circle key={k} cx={x} cy={y} r={7} fill={GOLD_HI} opacity={Math.sin(ph * Math.PI)} style={{ filter: "drop-shadow(0 0 8px #E8C27A)" }} />;
          })}
      </svg>
      <Abs style={{ left: NODE.x - 70, top: NODE.y - 70, width: 140, height: 140, borderRadius: 70, ...glass, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${Math.min(1.1, hub)})` }}>
        <div style={{ position: "absolute", inset: -14, borderRadius: 90, border: `2px solid ${GOLD}`, opacity: 0.6 * (1 - ((t * 1.4) % 1)), transform: `scale(${1 + ((t * 1.4) % 1) * 0.5})` }} />
        <IconSend size={64} color={GOLD} sw={1.8} />
      </Abs>
      {TARGETS.map((g, i) => {
        const p = spring(t, g.t() - 0.1, 2.2, 7);
        if (t < g.t() - 0.1) return null;
        return (
          <Abs key={i} style={{ left: g.x - 190, top: g.y - 2, width: 380, display: "flex", justifyContent: "center", transform: `scale(${lerp(0.5, 1, Math.min(1.1, p))})` }}>
            <div style={{ ...glass, borderRadius: 26, padding: "16px 26px", display: "flex", alignItems: "center", gap: 14 }}>
              <g.Icon size={40} color={GOLD} sw={1.8} />
              <span style={{ fontWeight: 700, fontSize: 34, whiteSpace: "nowrap" }}>{g.label}</span>
            </div>
          </Abs>
        );
      })}
      {t > T.hundreds - 0.1 && (
        <Abs style={{ left: 0, right: 0, top: 880, display: "flex", justifyContent: "center", alignItems: "baseline", gap: 14, opacity: prog(t, T.hundreds - 0.1, 0.2) }}>
          <span style={{ fontFamily: SERIF, fontSize: 150, lineHeight: "150px", ...goldText, transform: `scale(${lerp(0.7, 1, Math.min(1.1, spring(t, T.hundreds - 0.1, 2.4, 7)))})` }}>{count}+</span>
          <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 56, color: CREAM }}>DMs sent</span>
        </Abs>
      )}
    </Abs>
  );
};

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
/** "Every single day": a week streak lights up. */
export const Streak = () => {
  const t = useCurrentFrame() / FPS;
  const s = T.every1 - 0.15;
  const e = T.hundreds - 0.15;
  if (t < s || t > e + 0.3) return null;
  const a = win(t, s, e + 0.2, 0.15, 0.25);
  return (
    <Abs style={{ left: 0, right: 0, top: 860, display: "flex", justifyContent: "center", opacity: a }}>
      <div style={{ ...glass, borderRadius: 30, padding: "18px 26px", display: "flex", alignItems: "center", gap: 14 }}>
        <IconFlame size={44} color={GOLD} sw={1.8} />
        {DAYS.map((d, i) => {
          const on = prog(t, s + 0.1 + i * 0.09, 0.18, outBack);
          return (
            <div
              key={i}
              style={{
                width: 62,
                height: 62,
                borderRadius: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: MONO,
                fontWeight: 700,
                fontSize: 26,
                color: on > 0.5 ? "#17120A" : "rgba(251,244,232,0.6)",
                background: on > 0.5 ? `linear-gradient(180deg, #FFE7B0, ${GOLD})` : "rgba(255,255,255,0.08)",
                transform: `scale(${lerp(0.8, 1, on)})`,
                boxShadow: on > 0.5 ? "0 6px 18px rgba(232,194,122,0.4)" : "none",
              }}
            >
              {d}
            </div>
          );
        })}
      </div>
    </Abs>
  );
};
