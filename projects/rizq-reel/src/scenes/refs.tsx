import { useCurrentFrame } from "remotion";
import { FPS, GOLD, GOLD_HI, ITEMS, IVORY } from "../data";
import { ARABIC, MONO, SANS, SERIF } from "../fonts";
import { Abs, foil, glass, lerp, outBackSoft, outExpo, prog } from "../ui";
import { starPts } from "./pattern";

/** Source card for the verse / hadith he quotes: badge + reference, the Arabic in gold, the meaning in serif. */
export const RefCards = () => {
  const t = useCurrentFrame() / FPS;
  const it = ITEMS.find((x) => t >= x.ref.at - 0.1 && t < x.ref.until + 0.35);
  if (!it) return null;
  const r = it.ref;
  const p = prog(t, r.at - 0.1, 0.5, outBackSoft);
  const out = prog(t, r.until, 0.3);
  const ar = prog(t, r.at + 0.15, 0.7, outExpo);
  const words = r.en.split(" ");
  const span = Math.max(0.9, r.until - r.at - 0.9);
  return (
    <Abs style={{ left: 54, right: 54, top: 1120, opacity: Math.min(1, p * 1.3) * (1 - out), transform: `translateY(${(1 - p) * 60 + out * 30}px) scale(${lerp(0.94, 1, p)})`, transformOrigin: "50% 0%" }}>
      <div style={{ ...glass, borderRadius: 34, padding: "30px 40px 34px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, background: `linear-gradient(180deg, ${GOLD_HI}, ${GOLD} 60%, rgba(226,188,114,0))` }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <svg width={34} height={34} viewBox="0 0 34 34">
              <polygon points={starPts(17, 17, 16, 11.5, Math.PI / 8 + t).map((q) => q.join(",")).join(" ")} fill="none" stroke={GOLD} strokeWidth={2} />
              <circle cx={17} cy={17} r={4} fill={GOLD} />
            </svg>
            <span style={{ fontFamily: MONO, fontSize: 25, letterSpacing: 6, color: GOLD, fontWeight: 600 }}>{r.kind === "QURAN" ? "QUR'AN" : "HADITH"}</span>
          </div>
          <span style={{ fontFamily: SANS, fontSize: 26, fontWeight: 600, color: "rgba(247,240,225,0.7)", letterSpacing: 0.5 }}>{r.src}</span>
        </div>
        <div style={{ marginTop: 14, direction: "rtl", textAlign: "center", clipPath: `inset(-20px 0 -20px ${(1 - ar) * 100}%)` }}>
          <span style={{ ...foil, fontFamily: ARABIC, fontWeight: 700, fontSize: r.ar.length > 26 ? 60 : 72, lineHeight: "118px", padding: "0 6px" }}>{r.ar}</span>
        </div>
        <div style={{ marginTop: 4, textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: 44, lineHeight: "54px", color: IVORY }}>
          {words.map((w, i) => {
            const q = prog(t, r.at + 0.35 + (i / words.length) * span, 0.35);
            return (
              <span key={i} style={{ opacity: lerp(0.18, 1, q), filter: `blur(${(1 - q) * 3}px)` }}>
                {w}{" "}
              </span>
            );
          })}
        </div>
      </div>
    </Abs>
  );
};
