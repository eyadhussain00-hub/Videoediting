import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BONE, FPS, GOLD, T } from "../data";
import { SANS, SERIF } from "../fonts";
import { Abs, IconUser, goldText, inOutCubic, lerp, outCubic, outExpo, prog, rnd, spring, win } from "../ui";

// Layers that sit BEHIND the speaker cut-out (between the plate and fg.webm): his head overlaps the type.

/** Hook (in front, on his chest): "Delayed / GRATIFICATION", then it gives way to the giant "#1" behind him. */
export const HookType = () => {
  const t = useCurrentFrame() / FPS;
  if (t > T.s2 + 0.1) return null;
  const out = prog(t, T.number - 0.12, 0.35, inOutCubic);
  const d = "Delayed".split("");
  const g = "GRATIFICATION".split("");
  return (
    <AbsoluteFill style={{ opacity: 1 - out, transform: `translateY(${-out * 120}px) scale(${1 + out * 0.08})`, filter: `blur(${out * 10}px)` }}>
      <Abs style={{ top: 930, left: 0, right: 0, textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: 250, lineHeight: "260px", letterSpacing: -4 }}>
        {d.map((c, i) => {
          const p = prog(t, T.delayed - 0.05 + i * 0.035, 0.45, outExpo);
          return (
            <span key={i} style={{ display: "inline-block", ...goldText, opacity: p, transform: `translateY(${(1 - p) * 70}px) rotate(${(1 - p) * 8}deg)`, filter: `blur(${(1 - p) * 10}px)` }}>
              {c}
            </span>
          );
        })}
      </Abs>
      <Abs style={{ top: 1190, left: 0, right: 0, textAlign: "center", fontFamily: SANS, fontWeight: 900, fontSize: 124, letterSpacing: -3, color: BONE, textShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        {g.map((c, i) => {
          const p = prog(t, T.gratification - 0.05 + i * 0.022, 0.35, outExpo);
          return (
            <span key={i} style={{ display: "inline-block", opacity: p, transform: `translateY(${(1 - p) * -60}px) scaleY(${lerp(1.6, 1, p)})` }}>
              {c}
            </span>
          );
        })}
      </Abs>
    </AbsoluteFill>
  );
};

/** "#1 reason businesses win": a huge serif numeral on the wall with a chart line that climbs on "win". */
export const NumberOne = () => {
  const t = useCurrentFrame() / FPS;
  const a = win(t, T.number - 0.1, T.s2 + 0.05, 0.3, 0.2);
  if (a <= 0) return null;
  const p = spring(t, T.number - 0.05, 1.4, 6);
  const line = prog(t, T.businesses - 0.2, 0.9, inOutCubic);
  const pts = Array.from({ length: 9 }, (_, i) => [60 + i * 120, 860 - Math.pow(i / 8, 2.2) * 620 - (i % 2 ? 30 : 0) * (1 - i / 8)]);
  const path = pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
  return (
    <AbsoluteFill style={{ opacity: a }}>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="ln" x1="0" x2="1">
            <stop offset="0" stopColor={GOLD} stopOpacity="0" />
            <stop offset="1" stopColor="#FFD685" />
          </linearGradient>
        </defs>
        <path d={path} fill="none" stroke="url(#ln)" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - line} style={{ filter: "drop-shadow(0 0 18px rgba(232,176,75,0.8))" }} />
      </svg>
      {/* the two glyphs flank his head */}
      <Abs style={{ top: 120, left: 30, fontFamily: SERIF, fontSize: 560, lineHeight: "560px", ...goldText, transform: `translateX(${(1 - Math.min(1, p)) * -120}px)`, opacity: Math.min(1, p * 1.5) }}>#</Abs>
      <Abs style={{ top: 120, right: 50, fontFamily: SERIF, fontSize: 600, lineHeight: "560px", ...goldText, transform: `translateX(${(1 - Math.min(1, p)) * 120}px)`, opacity: Math.min(1, p * 1.5) }}>1</Abs>
    </AbsoluteFill>
  );
};

/** "Sixteen years": a giant counter on the wall. */
export const Years = () => {
  const t = useCurrentFrame() / FPS;
  const a = win(t, T.sixteen - 0.15, T.s8 + 0.1, 0.25, 0.25);
  if (a <= 0) return null;
  const n = Math.max(1, Math.round(lerp(1, 16, prog(t, T.sixteen - 0.1, 0.75, outCubic))));
  const p = prog(t, T.sixteen - 0.15, 0.5, outExpo);
  return (
    <AbsoluteFill style={{ opacity: a }}>
      {/* the digits flank his head */}
      {String(n).padStart(2, " ").split("").map((d, i) => (
        <Abs key={i} style={{ top: 90, [i ? "right" : "left"]: i ? 20 : 40, fontFamily: SERIF, fontSize: 680, lineHeight: "680px", ...goldText, transform: `translate(${(1 - p) * (i ? 120 : -120)}px, ${(1 - p) * 60}px)`, fontVariantNumeric: "tabular-nums" }}>
          {d}
        </Abs>
      ))}
    </AbsoluteFill>
  );
};

/** "Recommended me to everybody": a referral network radiating from behind him. */
const HUB = [540, 640];
const L1 = [
  [170, 330], [880, 300], [120, 820], [960, 800], [330, 120], [760, 110],
];
const L2 = L1.flatMap(([x, y], i) => [0, 1, 2].map((k) => {
  const ang = Math.atan2(y - HUB[1], x - HUB[0]) + (k - 1) * 0.55;
  const r = 170 + rnd(i * 3 + k) * 70;
  return [x + Math.cos(ang) * r, y + Math.sin(ang) * r, i] as [number, number, number];
}));
export const Network = () => {
  const t = useCurrentFrame() / FPS;
  const a = win(t, T.s8 - 0.05, T.felt + 0.3, 0.3, 0.45);
  if (a <= 0) return null;
  const t1 = T.recommended - 0.1;
  const t2 = T.everybody - 0.2;
  const node = (x: number, y: number, s: number, p: number, big: boolean, k: string) => (
    <Abs key={k} style={{ left: x - s / 2, top: y - s / 2, width: s, height: s, borderRadius: s, transform: `scale(${Math.min(1.15, p)})`, opacity: Math.min(1, p * 2),
      background: big ? "radial-gradient(circle at 35% 30%, #FFE3A3, #E8B04B 60%, #9E6E22)" : "rgba(20,22,27,0.85)",
      border: big ? "none" : `3px solid ${GOLD}`, boxShadow: `0 0 ${big ? 40 : 24}px rgba(232,176,75,${big ? 0.7 : 0.45})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <IconUser size={s * 0.56} color={big ? "#1A1206" : "#FFD685"} sw={2.2} />
    </Abs>
  );
  return (
    <AbsoluteFill style={{ opacity: a }}>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        {L1.map(([x, y], i) => {
          const p = prog(t, t1 + i * 0.08, 0.35, inOutCubic);
          return <line key={i} x1={HUB[0]} y1={HUB[1]} x2={lerp(HUB[0], x, p)} y2={lerp(HUB[1], y, p)} stroke={GOLD} strokeWidth={4} strokeOpacity={0.8} />;
        })}
        {L2.map(([x, y, i], k) => {
          const p = prog(t, t2 + k * 0.025, 0.3, inOutCubic);
          const [px, py] = L1[i];
          return <line key={k} x1={px} y1={py} x2={lerp(px, x, p)} y2={lerp(py, y, p)} stroke={GOLD} strokeWidth={2.5} strokeOpacity={0.55} />;
        })}
      </svg>
      {L1.map(([x, y], i) => node(x, y, 112, spring(t, t1 + i * 0.08 + 0.25, 2.2, 7), true, `a${i}`))}
      {L2.map(([x, y], k) => node(x, y, 64, spring(t, t2 + k * 0.025 + 0.22, 2.4, 8), false, `b${k}`))}
    </AbsoluteFill>
  );
};
