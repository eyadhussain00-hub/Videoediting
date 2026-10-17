import type { ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FPS, GOLD, GOLD_HI, ITEMS, IVORY, T } from "../data";
import { ARABIC, SANS, SERIF } from "../fonts";
import { Abs, bump, foil, glass, lerp, outBackSoft, outExpo, prog, rnd, spring } from "../ui";
import { starPts } from "./pattern";

// Line icons, 24-unit viewBox, gold.
const Ico = ({ children, size = 54 }: { children: ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={GOLD_HI} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
const Coins = () => (
  <Ico>
    <ellipse cx="9" cy="6" rx="6" ry="2.5" />
    <path d="M3 6v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V6M3 10v4c0 1.4 2.7 2.5 6 2.5 1 0 2-.1 2.8-.3" />
    <ellipse cx="16" cy="15" rx="5" ry="2.2" />
    <path d="M11 15v3.5c0 1.2 2.2 2.2 5 2.2s5-1 5-2.2V15" />
  </Ico>
);
const Family = () => (
  <Ico>
    <circle cx="7" cy="6" r="2.4" /><circle cx="17" cy="6" r="2.4" /><circle cx="12" cy="11.5" r="1.9" />
    <path d="M3 20v-4.5A3.5 3.5 0 0 1 6.5 12h1M21 20v-4.5a3.5 3.5 0 0 0-3.5-3.5h-1M8.5 20v-2.5a3.5 3.5 0 0 1 7 0V20" />
  </Ico>
);
const Link = () => (
  <Ico>
    <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2" />
  </Ico>
);
const Give = () => (
  <Ico>
    <path d="M12 9.5s-3.5-2.2-3.5-4.4a2 2 0 0 1 3.5-1.3 2 2 0 0 1 3.5 1.3c0 2.2-3.5 4.4-3.5 4.4z" />
    <path d="M2.5 14.5h3l3.5 2h4a1.5 1.5 0 0 0 0-3h-3M5.5 14.5V21M9 16.5l7.2 2.6 5.3-3.6a1.5 1.5 0 0 0-1.8-2.4L16 15" />
  </Ico>
);
const Loop = () => (
  <Ico>
    <path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.7 5.6L4 15.5M4 20v-4.5h4.5" />
  </Ico>
);
const Knot = () => (
  <Ico>
    <path d="M3 8c4 0 5 3 9 3s5-3 9-3M3 16c4 0 5-3 9-3s5 3 9 3" />
    <circle cx="12" cy="12" r="2.6" />
  </Ico>
);
const Scale = () => (
  <Ico>
    <path d="M12 3v18M7 21h10M4 7h16M12 4.5l-.01 0" />
    <path d="M6 7l-3 6a3 3 0 0 0 6 0zM18 7l-3 6a3 3 0 0 0 6 0z" />
  </Ico>
);

/** A glass sticker that springs in at `at` and leaves at `until`. */
const Chip = ({ at, until, x, y, rot = 0, icon, label, sub }: { at: number; until: number; x: number; y: number; rot?: number; icon: ReactNode; label: string; sub?: string }) => {
  const t = useCurrentFrame() / FPS;
  if (t < at - 0.1 || t > until + 0.4) return null;
  const p = spring(t, at - 0.06, 2.2, 7);
  const o = prog(t, until, 0.3);
  return (
    <Abs style={{ left: x, top: y, opacity: Math.min(1, p * 2) * (1 - o), transform: `scale(${lerp(0.4, 1, Math.min(1.12, p)) * (1 - o * 0.2)}) rotate(${rot * (2 - Math.min(1, p))}deg)`, transformOrigin: "50% 50%" }}>
      <div style={{ ...glass, display: "flex", alignItems: "center", gap: 16, padding: "14px 26px 14px 18px", borderRadius: 26 }}>
        {icon}
        <div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 38, color: IVORY, letterSpacing: -0.5, lineHeight: 1.05, whiteSpace: "nowrap" }}>{label}</div>
          {sub && <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 22, color: GOLD, letterSpacing: 3, marginTop: 4, whiteSpace: "nowrap" }}>{sub}</div>}
        </div>
      </div>
    </Abs>
  );
};

/** "from where he didn't expect": gold streaks fly in from every edge and land as one star. */
const Converge = ({ at }: { at: number }) => {
  const t = useCurrentFrame() / FPS;
  const k = (t - at) / 0.9;
  if (k < 0 || k > 1.6) return null;
  const cx = 540, cy = 470;
  const land = prog(t, at + 0.7, 0.4, outBackSoft);
  return (
    <AbsoluteFill style={{ opacity: 1 - prog(t, at + 1.2, 0.3) }}>
      <svg width={1080} height={1920}>
        {Array.from({ length: 9 }, (_, i) => {
          const a = rnd(i + 3) * Math.PI * 2;
          const d = 900 + rnd(i + 9) * 300;
          const sx = cx + Math.cos(a) * d, sy = cy + Math.sin(a) * d * 1.4;
          const p = outExpo(Math.min(1, Math.max(0, (k - i * 0.03) / 0.75)));
          const hx = lerp(sx, cx, p), hy = lerp(sy, cy, p);
          const tx = lerp(sx, cx, Math.max(0, p - 0.25)), ty = lerp(sy, cy, Math.max(0, p - 0.25));
          return <line key={i} x1={tx} y1={ty} x2={hx} y2={hy} stroke={GOLD_HI} strokeWidth={4} strokeLinecap="round" opacity={(1 - p) * 0.9 + 0.1} />;
        })}
        {land > 0 && (
          <g transform={`translate(${cx} ${cy}) scale(${land}) rotate(${t * 40})`}>
            <circle r={70} fill="rgba(242,212,146,0.25)" />
            <polygon points={starPts(0, 0, 46, 22).map((q) => q.join(",")).join(" ")} fill={GOLD} stroke={GOLD_HI} strokeWidth={2} />
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};

/** Gold sparkle burst (on "blessed"). */
const Burst = ({ at, x, y }: { at: number; x: number; y: number }) => {
  const t = useCurrentFrame() / FPS;
  const k = (t - at) / 1.1;
  if (k < 0 || k > 1) return null;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2 + rnd(i) * 0.3;
        const r = outExpo(k) * (180 + rnd(i + 5) * 220);
        const s = (1 - k) * (6 + rnd(i + 2) * 12);
        return <polygon key={i} points={starPts(x + Math.cos(a) * r, y + Math.sin(a) * r, s * 2, s * 0.6).map((q) => q.join(",")).join(" ")} fill={GOLD_HI} opacity={1 - k} />;
      })}
      <circle cx={x} cy={y} r={outExpo(k) * 340} fill="none" stroke={GOLD} strokeWidth={3 * (1 - k)} opacity={1 - k} />
    </svg>
  );
};

/** Floating Arabic phrase (behind-the-glass feel), e.g. الحمد لله on "what Allah has given you". */
const Phrase = ({ at, until, text, y }: { at: number; until: number; text: string; y: number }) => {
  const t = useCurrentFrame() / FPS;
  if (t < at - 0.1 || t > until + 0.5) return null;
  const p = prog(t, at, 0.6, outExpo);
  const o = prog(t, until, 0.4);
  return (
    <Abs style={{ left: 0, right: 0, top: y, textAlign: "center", direction: "rtl", opacity: p * (1 - o), transform: `translateY(${(1 - p) * 30 - o * 20}px)`, filter: `blur(${(1 - p) * 10}px)` }}>
      <span style={{ ...foil, fontFamily: ARABIC, fontWeight: 700, fontSize: 120, lineHeight: "190px", padding: "0 20px", filter: "drop-shadow(0 8px 30px rgba(0,0,0,0.6))" }}>{text}</span>
    </Abs>
  );
};

/** "Trust → work → result" builds as three linked steps. */
const Steps = () => {
  const t = useCurrentFrame() / FPS;
  const steps: [string, number][] = [["Trust Allah", ITEMS[5].ref.until + 0.15], ["Do the work", T.work - 0.1], ["Get the result", T.result - 0.1]];
  const until = ITEMS[6].start - 0.2;
  if (t < steps[0][1] - 0.1 || t > until + 0.4) return null;
  const o = prog(t, until, 0.3);
  return (
    <Abs style={{ left: 60, right: 60, top: 1210, display: "flex", flexDirection: "column", gap: 16, opacity: 1 - o }}>
      {steps.map(([s, at], i) => {
        const p = prog(t, at, 0.4, outBackSoft);
        const last = i === steps.length - 1;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 20, opacity: Math.min(1, p * 1.5), transform: `translateX(${(1 - p) * -80}px)` }}>
            <div style={{ width: 62, height: 62, borderRadius: 31, display: "flex", alignItems: "center", justifyContent: "center", background: last && p > 0.5 ? GOLD : "rgba(4,20,15,0.7)", border: `2px solid ${GOLD}`, fontFamily: SERIF, fontSize: 38, color: last && p > 0.5 ? "#1B1406" : GOLD_HI }}>{i + 1}</div>
            <div style={{ ...glass, padding: "10px 26px 12px", borderRadius: 20, fontFamily: SANS, fontWeight: 800, fontSize: 40, color: IVORY }}>{s}</div>
          </div>
        );
      })}
    </Abs>
  );
};

export const Accents = () => {
  const t = useCurrentFrame() / FPS;
  const glint = bump(t - T.blessed, 0.6);
  return (
    <>
      {/* 1 · wealth and children */}
      <Chip at={T.wealth1} until={ITEMS[0].ref.until} x={46} y={500} rot={-4} icon={<Coins />} label="Wealth" sub="AMWĀL" />
      <Chip at={T.children} until={ITEMS[0].ref.until} x={666} y={560} rot={4} icon={<Family />} label="Children" sub="BANĪN" />
      {/* 2 · from where he didn't expect */}
      <Converge at={T.where - 0.15} />
      {/* 3 · don't break the ties */}
      <Chip at={T.dont} until={ITEMS[3].start - 0.2} x={250} y={1210} rot={-2} icon={<Link />} label="Keep the ties" sub="DON'T BREAK THEM" />
      {/* 4 · releasing wealth to get more */}
      <Chip at={T.releasing - 0.1} until={ITEMS[4].start - 0.2} x={210} y={1210} rot={2} icon={<Loop />} label="Give to receive" sub="RELEASE · RETURN" />
      <Chip at={ITEMS[3].ref.at + 0.3} until={ITEMS[3].ref.until} x={680} y={520} rot={4} icon={<Give />} label="−0%" sub="WEALTH LOST" />
      {/* 5 · what Allah has given you */}
      <Phrase at={T.forgotten} until={ITEMS[5].start - 0.25} text="الْحَمْدُ لِلَّه" y={1170} />
      {/* 6 · tie your camel, then the three steps */}
      <Chip at={T.tie} until={ITEMS[5].ref.until} x={600} y={520} rot={4} icon={<Knot />} label="Tie your camel" />
      <Steps />
      {/* 7 · buyer and seller, blessed */}
      <Chip at={T.buyer} until={ITEMS[6].ref.until} x={46} y={540} rot={-4} icon={<Scale />} label="Buyer" sub="TRUTHFUL" />
      <Chip at={T.seller} until={ITEMS[6].ref.until} x={700} y={600} rot={4} icon={<Scale />} label="Seller" sub="TRUTHFUL" />
      <Burst at={T.blessed - 0.05} x={540} y={1300} />
      {glint > 0 && <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 70%, rgba(247,226,174,0.35), rgba(0,0,0,0) 60%)", opacity: glint }} />}
    </>
  );
};
