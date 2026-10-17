import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FPS, GOLD, GOLD_HI, ITEMS, IVORY, T } from "../data";
import { ARABIC, MONO, SANS, SERIF } from "../fonts";
import { Abs, foil, glass, inOutCubic, lerp, outBackSoft, outExpo, prog } from "../ui";
import { Lattice, Rosette, starPts } from "./pattern";

/** All seven, ticked off one by one over the dimmed last frame. */
export const Recap = () => {
  const t = useCurrentFrame() / FPS;
  if (t < T.recap - 0.1 || t > T.endCard + 0.5) return null;
  const p = prog(t, T.recap, 0.5, outBackSoft);
  const o = prog(t, T.endCard - 0.05, 0.4, inOutCubic);
  return (
    <Abs style={{ left: 60, right: 60, top: 330, opacity: Math.min(1, p * 1.4) * (1 - o), transform: `translateY(${(1 - p) * 80 - o * 60}px) scale(${lerp(0.95, 1, p)})` }}>
      <div style={{ textAlign: "center", marginBottom: 26 }}>
        <div style={{ fontFamily: MONO, fontSize: 28, letterSpacing: 9, color: GOLD_HI }}>SEVEN ACTIONS</div>
        <div style={{ fontFamily: SERIF, fontSize: 92, color: IVORY, lineHeight: 1.05, marginTop: 8 }}>
          that increase your <span style={{ ...foil, fontStyle: "italic" }}>Rizq</span>
        </div>
      </div>
      <div style={{ ...glass, borderRadius: 36, padding: "18px 36px" }}>
        {ITEMS.map((it, i) => {
          const at = T.recap + 0.35 + i * 0.2;
          const q = prog(t, at, 0.35, outExpo);
          const tick = prog(t, at + 0.12, 0.25, outBackSoft);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 22, padding: "15px 0", borderTop: i ? "1px solid rgba(226,188,114,0.18)" : "none", opacity: lerp(0.15, 1, q), transform: `translateX(${(1 - q) * 40}px)` }}>
              <svg width={46} height={46} viewBox="0 0 46 46">
                <polygon points={starPts(23, 23, 22, 15, Math.PI / 8).map((x) => x.join(",")).join(" ")} fill={tick > 0.5 ? GOLD : "none"} stroke={GOLD} strokeWidth={2} />
                <path d="M15 23.5l5.5 5.5 10-11" fill="none" stroke="#1B1406" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - tick} />
              </svg>
              <span style={{ fontFamily: MONO, fontSize: 26, color: GOLD, width: 44 }}>{String(it.n).padStart(2, "0")}</span>
              <span style={{ flex: 1, fontFamily: SANS, fontWeight: 700, fontSize: 44, color: IVORY, letterSpacing: -0.5 }}>{it.name}</span>
              <span style={{ fontFamily: ARABIC, fontWeight: 700, fontSize: 44, color: GOLD_HI }}>{it.ar}</span>
            </div>
          );
        })}
      </div>
    </Abs>
  );
};

/** End card: the emerald world, rosette, a save/share line and the speaker's credit. */
export const EndCard = () => {
  const t = useCurrentFrame() / FPS;
  if (t < T.endCard - 0.1) return null;
  const k = t - T.endCard;
  const p = prog(t, T.endCard, 0.6, inOutCubic);
  const a = prog(t, T.endCard + 0.25, 0.6, outExpo);
  const b = prog(t, T.endCard + 0.55, 0.5, outExpo);
  const c = prog(t, T.endCard + 0.85, 0.5, outExpo);
  return (
    <AbsoluteFill style={{ opacity: p }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 60% at 50% 42%, #145A45 0%, #0A3127 50%, #03120D 100%)" }} />
      <Lattice cell={150} draw={p} opacity={0.14} drift={k * 0.2} />
      <Abs style={{ left: 540 - 470, top: 700 - 470 }}>
        <Rosette size={940} t={k * 2} draw={prog(t, T.endCard, 1.4, inOutCubic)} opacity={0.5} />
      </Abs>
      <Abs style={{ left: 0, right: 0, top: 520, textAlign: "center", direction: "rtl", opacity: a, transform: `scale(${lerp(1.2, 1, a)})`, filter: `blur(${(1 - a) * 12}px)` }}>
        <span style={{ ...foil, fontFamily: ARABIC, fontWeight: 700, fontSize: 260, lineHeight: "380px", padding: "0 30px" }}>رِزْق</span>
      </Abs>
      <Abs style={{ left: 60, right: 60, top: 1040, textAlign: "center", opacity: b, transform: `translateY(${(1 - b) * 30}px)` }}>
        <div style={{ fontFamily: SERIF, fontSize: 84, color: IVORY, lineHeight: 1.08 }}>
          Save this. <span style={{ ...foil, fontStyle: "italic" }}>Share it</span>
          <br />
          with someone who needs it.
        </div>
      </Abs>
      <Abs style={{ left: 0, right: 0, top: 1330, display: "flex", justifyContent: "center", opacity: c, transform: `translateY(${(1 - c) * 20}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 30px", borderRadius: 999, border: `1.5px solid rgba(226,188,114,0.5)`, background: "rgba(4,20,15,0.5)" }}>
          <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, color: IVORY }}>Shohaib Ahmed</span>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: GOLD }} />
          <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 30, color: GOLD_HI }}>@shohaibahmedofficial</span>
        </div>
      </Abs>
    </AbsoluteFill>
  );
};
