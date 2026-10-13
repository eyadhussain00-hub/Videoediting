import { useCurrentFrame } from "remotion";
import { FPS, GOLD, T } from "../data";
import { MONO, SANS } from "../fonts";
import { Abs, glass, goldText, lerp, outBack, outCubic, prog } from "../ui";

/** Instagram-style comment bar: COACH types in on "coach", sends on "below", DM chip on "send". */
export const CTA = () => {
  const t = useCurrentFrame() / FPS;
  if (t < T.cta) return null;
  const inP = prog(t, T.cta + 0.05, 0.5, outBack);
  const word = "COACH";
  const typed = Math.max(0, Math.min(word.length, Math.floor((t - T.coach + 0.02) / 0.055)));
  const focused = t >= T.comment - 0.1;
  const press = t > T.below + 0.12 && t < T.below + 0.3 ? 0.88 : 1;
  const sent = prog(t, T.below + 0.25, 0.6, outCubic);
  const dm = prog(t, T.send - 0.05, 0.45, outBack);
  const caret = Math.floor(t * 2.2) % 2 === 0;
  return (
    <>
      <Abs style={{ left: 0, right: 0, top: 852, textAlign: "center", fontFamily: MONO, fontWeight: 700, fontSize: 30, letterSpacing: 8, color: GOLD, textShadow: "0 2px 14px rgba(0,0,0,0.8)", opacity: prog(t, T.cta + 0.2, 0.4) }}>
        WANT TO CLOSE MORE?
      </Abs>
      <Abs style={{ ...glass, left: 70, top: 930, width: 940, height: 136, borderRadius: 68, transform: `scale(${inP})`, display: "flex", alignItems: "center", padding: "0 18px", boxSizing: "border-box", borderColor: focused ? "rgba(242,196,109,0.55)" : "rgba(255,255,255,0.13)", boxShadow: focused ? "0 0 50px rgba(242,196,109,0.25), 0 30px 80px rgba(0,0,0,0.45)" : glass.boxShadow }}>
        <div style={{ width: 96, height: 96, borderRadius: 48, background: "linear-gradient(135deg,#F58529,#DD2A7B,#8134AF)", padding: 4, boxSizing: "border-box" }}>
          <div style={{ width: "100%", height: "100%", borderRadius: 44, background: "radial-gradient(circle at 50% 35%, #55555c, #1b1b1e)", border: "3px solid #111" }} />
        </div>
        <div style={{ marginLeft: 26, flex: 1, fontFamily: SANS, fontWeight: typed ? 800 : 500, fontSize: typed ? 58 : 40, color: typed ? "#fff" : "rgba(255,255,255,0.45)", letterSpacing: typed ? 2 : 0 }}>
          {typed ? word.slice(0, typed) : "Add a comment…"}
          {focused && sent < 0.5 && <span style={{ color: GOLD, opacity: caret ? 1 : 0, fontWeight: 400 }}>|</span>}
        </div>
        <div style={{ width: 100, height: 100, borderRadius: 50, background: typed === word.length ? "linear-gradient(180deg,#FFE3A3,#E9B85C 55%,#C8902E)" : "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${press})`, boxShadow: typed === word.length ? "0 0 30px rgba(242,196,109,0.6)" : "none" }}>
          <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke={typed === word.length ? "#1A1408" : "#fff"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </div>
      </Abs>
      {/* posted comment floats up */}
      {sent > 0 && (
        <Abs style={{ left: 170, top: lerp(930, 760, sent), opacity: 1 - prog(t, T.below + 0.6, 0.5), fontFamily: SANS, fontWeight: 800, fontSize: 44, ...goldText }}>COACH ✓</Abs>
      )}
      {/* bouncing chevrons: "below" */}
      <Abs style={{ left: 0, right: 0, top: 1100 + Math.abs(Math.sin((t - T.below) * 7)) * 18, display: "flex", flexDirection: "column", alignItems: "center", opacity: prog(t, T.below - 0.05, 0.25) * (1 - prog(t, T.send, 0.3)) }}>
        {[0, 1].map((k) => (
          <svg key={k} width="70" height="36" viewBox="0 0 70 36" style={{ marginTop: -8, opacity: 1 - k * 0.45 }}>
            <path d="M8 6 35 30 62 6" stroke={GOLD} strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ))}
      </Abs>
      {/* DM chip */}
      <Abs style={{ ...glass, left: 300, top: 1110, width: 480, height: 90, borderRadius: 45, transform: `scale(${dm})`, opacity: Math.min(1, dm * 1.5), display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
        </svg>
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, color: "#fff" }}>Details sent to your DMs</span>
      </Abs>
    </>
  );
};
