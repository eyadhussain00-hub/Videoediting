import { useCurrentFrame } from "remotion";
import { FPS, STEPS, T } from "../data";
import { MONO, SANS, SERIF } from "../fonts";
import { Abs, IconSnow, iceText, lerp, outBack, outExpo, prog, win } from "../ui";
import { dawnAt } from "./base";

/** Hook title lockup: "THE MUSLIM / Winter Arc / 90-DAY PLAYBOOK", lands on "for the next 90 days". */
export const TitleLockup = () => {
  const t = useCurrentFrame() / FPS;
  const a = win(t, T.next - 0.1, T.s1 + 0.15, 0.3, 0.35);
  if (a <= 0) return null;
  const p = prog(t, T.next - 0.1, 0.7, outExpo);
  const lineW = prog(t, T.next + 0.25, 0.6);
  const sub = prog(t, T.doIt, 0.45);
  const spin = (1 - p) * -120;
  return (
    <Abs style={{ left: 0, right: 0, top: 1170, textAlign: "center", opacity: a }}>
      <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 28, letterSpacing: 18, color: "rgba(230,245,255,0.92)", opacity: p, transform: `translateY(${(1 - p) * 20}px)` }}>THE MUSLIM</div>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 18, marginTop: 6 }}>
        <span
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontSize: 168,
            lineHeight: 1.05,
            ...iceText,
            filter: `blur(${(1 - p) * 14}px) drop-shadow(0 6px 30px rgba(0,10,25,0.6)) drop-shadow(0 0 26px rgba(150,210,255,0.35))`,
            transform: `scale(${lerp(1.18, 1, p)})`,
            letterSpacing: -2,
            paddingRight: 10,
          }}
        >
          Winter Arc
        </span>
        <span style={{ display: "inline-block", transform: `rotate(${spin}deg) scale(${p})`, filter: "drop-shadow(0 0 16px rgba(170,220,255,0.9))" }}>
          <IconSnow size={78} color="#DDF2FF" sw={1.4} />
        </span>
      </div>
      <div style={{ margin: "10px auto 0", width: 560 * lineW, height: 2, background: "linear-gradient(90deg, rgba(190,230,255,0), rgba(220,242,255,0.95), rgba(190,230,255,0))" }} />
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 34, letterSpacing: 12, color: "#fff", marginTop: 18, opacity: sub, transform: `translateY(${(1 - sub) * 14}px)` }}>
        90-DAY PLAYBOOK
      </div>
    </Abs>
  );
};

/** Persistent header during the six steps: the title chip and a 6-segment progress tracker. */
export const StepTracker = () => {
  const t = useCurrentFrame() / FPS;
  const a = win(t, T.s1 - 0.1, T.payoff + 0.1, 0.4, 0.4);
  if (a <= 0) return null;
  const warm = dawnAt(t);
  const accent = warm > 0.5 ? "#FFD7A0" : "#CDEBFF";
  return (
    <Abs style={{ left: 0, right: 0, top: 64, display: "flex", flexDirection: "column", alignItems: "center", opacity: a, transform: `translateY(${(1 - prog(t, T.s1 - 0.1, 0.5, outExpo)) * -40}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: 8, color: "rgba(235,246,255,0.92)" }}>
        <IconSnow size={26} color={accent} sw={1.8} />
        THE MUSLIM WINTER ARC
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        {STEPS.map((s, i) => {
          const fill = prog(t, s.s - 0.05, Math.max(0.3, s.e - s.s), (x) => x);
          const active = t >= s.s - 0.05 && t < s.e;
          const pop = prog(t, s.s - 0.05, 0.35, outBack);
          return (
            <div key={i} style={{ position: "relative", width: 92, height: 6, borderRadius: 3, background: "rgba(220,240,255,0.18)", overflow: "hidden", transform: `scaleY(${active ? lerp(1.8, 1.3, pop) : 1})` }}>
              <div style={{ width: `${fill * 100}%`, height: "100%", background: `linear-gradient(90deg, ${accent}, #FFFFFF)`, boxShadow: `0 0 12px ${accent}` }} />
            </div>
          );
        })}
      </div>
    </Abs>
  );
};
