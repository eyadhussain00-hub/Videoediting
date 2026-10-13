import { useCurrentFrame } from "remotion";
import { CURRENCIES, FPS, GOLD, T } from "../data";
import { MONO, SANS } from "../fonts";
import { Abs, ICONS, goldText, inOutCubic, lerp, outBack, outExpo, prog } from "../ui";

/** $23M+ counter on "23 million", then the five currencies return as gold coins on "five exact currencies". */
export const Proof = () => {
  const t = useCurrentFrame() / FPS;
  if (t < T.proof - 0.2 || t > T.cta + 0.6) return null;
  const v = lerp(0, 23, outExpo(Math.min(1, Math.max(0, (t - (T.m23 - 0.25)) / (T.million + 0.15 - (T.m23 - 0.25))))));
  const inP = prog(t, T.m23 - 0.3, 0.3);
  const land = prog(t, T.million + 0.1, 0.35, outBack);
  const lift = prog(t, T.fiveExact - 0.45, 0.5, inOutCubic);
  const out = prog(t, T.cta - 0.1, 0.45, inOutCubic);
  const glow = 1 - prog(t, T.million + 0.15, 1.2);
  return (
    <>
      {/* dark pool behind the number */}
      <Abs style={{ left: -200, right: -200, top: 760, height: 760, background: "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(0,0,0,0.62), rgba(0,0,0,0))", opacity: inP * (1 - out) }} />
      <Abs style={{ left: 0, right: 0, top: lerp(880, 800, lift), textAlign: "center", opacity: inP * (1 - out), transform: `scale(${lerp(1, 0.72, lift) * (1 + 0.06 * (1 - land) * (land > 0 ? 1 : 0))})`, filter: `blur(${out * 12}px)` }}>
        <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 8, color: "rgba(255,255,255,0.7)" }}>I'VE CLOSED MORE THAN</div>
        {/* extruded gold: 14 darker copies stepped down-right under the gradient face */}
        <div style={{ position: "relative", display: "inline-block", fontFamily: SANS, fontWeight: 800, fontSize: 250, lineHeight: 1.05, letterSpacing: -12, paddingRight: 14 }}>
          {Array.from({ length: 14 }).map((_, k) => (
            <div key={k} style={{ position: "absolute", left: (k + 1) * 0.9 * (0.4 + 0.6 * land), top: (k + 1) * 1.3 * (0.4 + 0.6 * land), color: k === 13 ? "rgba(0,0,0,0.55)" : `rgb(${110 - k * 4},${72 - k * 3},${16 - k})`, filter: k === 13 ? "blur(10px)" : undefined }}>
              ${Math.min(23, Math.floor(v + 0.03))}M+
            </div>
          ))}
          <div style={{ position: "relative", ...goldText, filter: `drop-shadow(0 0 ${20 + 50 * glow}px rgba(242,196,109,${0.35 + 0.4 * glow}))` }}>
            ${Math.min(23, Math.floor(v + 0.03))}M+
          </div>
          {/* specular sweep across the face after it lands */}
          <div style={{ position: "absolute", inset: 0, ...goldText, backgroundImage: `linear-gradient(105deg, rgba(255,255,255,0) ${lerp(-30, 130, prog(t, T.million + 0.15, 0.9, inOutCubic)) - 12}%, rgba(255,250,235,0.95) ${lerp(-30, 130, prog(t, T.million + 0.15, 0.9, inOutCubic))}%, rgba(255,255,255,0) ${lerp(-30, 130, prog(t, T.million + 0.15, 0.9, inOutCubic)) + 12}%)` }}>
            ${Math.min(23, Math.floor(v + 0.03))}M+
          </div>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 8, color: GOLD, opacity: land }}>IN SALES</div>
      </Abs>
      {/* coins */}
      <Abs style={{ left: 0, right: 0, top: 1150, display: "flex", justifyContent: "center", gap: 22, opacity: 1 - out, perspective: 800 }}>
        {CURRENCIES.map((c, i) => {
          const Icon = ICONS[i];
          const p = prog(t, T.fiveExact + i * 0.08, 0.5, outBack);
          return (
            <div key={c.n} style={{ textAlign: "center", transform: `rotateY(${(1 - p) * 180}deg) translateY(${(1 - p) * 60}px)`, opacity: Math.min(1, p * 2), transformStyle: "preserve-3d" }}>
              <div style={{ position: "relative", width: 150, height: 150, transformStyle: "preserve-3d" }}>
                {/* coin edge: stacked darker discs give it thickness while it flips */}
                {[1, 2, 3, 4, 5, 6, 7, 8].map((z) => (
                  <div key={z} style={{ position: "absolute", inset: 0, borderRadius: 75, background: z === 8 ? "#6E4A12" : "#9A6B1E", transform: `translateZ(${-z * 1.6}px)` }} />
                ))}
              <div style={{ position: "relative", width: 150, height: 150, borderRadius: 75, background: "radial-gradient(circle at 35% 30%, #FFF1C9, #F2C46D 45%, #A9741F 100%)", boxShadow: "0 0 30px rgba(242,196,109,0.45), inset 0 -8px 16px rgba(110,70,10,0.5), inset 0 6px 10px rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center", border: "4px solid #E2AE52" }}>
                <Icon size={76} color="#5A3A0A" />
              </div>
              </div>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 26, color: "#fff", marginTop: 12, letterSpacing: -0.3 }}>{c.name}</div>
            </div>
          );
        })}
      </Abs>
    </>
  );
};
