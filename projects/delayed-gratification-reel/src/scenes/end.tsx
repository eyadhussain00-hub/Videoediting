import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BONE, FPS, GOLD, INK, MUTE, T } from "../data";
import { MONO, SANS, SERIF } from "../fonts";
import { Abs, goldText, inOutCubic, lerp, outExpo, prog } from "../ui";

/** End card: the lesson in three lines over ink. */
export const EndCard = () => {
  const t = useCurrentFrame() / FPS;
  if (t < T.endCard - 0.35) return null;
  const wipe = prog(t, T.endCard - 0.35, 0.5, inOutCubic);
  const line = (at: number) => prog(t, T.endCard + at, 0.45, outExpo);
  const strike = prog(t, T.endCard + 0.45, 0.3, inOutCubic);
  const a = line(0.1), b = line(0.55), c = line(1.0), u = prog(t, T.endCard + 1.35, 0.5, inOutCubic);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 60% at 50% 45%, #1B1C21, ${INK} 70%)`, clipPath: `inset(${lerp(100, 0, wipe)}% 0 0 0)` }} />
      <Abs style={{ top: 560, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 8, color: MUTE, opacity: a }}>THE LESSON</div>
        <div style={{ position: "relative", display: "inline-block", marginTop: 40, fontFamily: SANS, fontWeight: 800, fontSize: 92, letterSpacing: -3, color: MUTE, opacity: a, transform: `translateY(${(1 - a) * 40}px)` }}>
          $0 invoice.
          <div style={{ position: "absolute", left: -10, top: "52%", height: 8, width: `${strike * 104}%`, background: BONE, borderRadius: 8 }} />
        </div>
        <div style={{ marginTop: 10, fontFamily: SANS, fontWeight: 900, fontSize: 116, letterSpacing: -4, ...goldText, opacity: b, transform: `translateY(${(1 - b) * 40}px)` }}>16-year client.</div>
        <div style={{ position: "relative", display: "inline-block", marginTop: 80, fontFamily: SERIF, fontStyle: "italic", fontSize: 150, lineHeight: "150px", letterSpacing: -3, color: BONE, opacity: c, transform: `translateY(${(1 - c) * 40}px)` }}>
          Play the long game.
          <svg width={900} height={40} viewBox="0 0 900 40" style={{ position: "absolute", left: "50%", marginLeft: -450, bottom: -40 }}>
            <path d="M20 26 C 240 6, 560 6, 880 22" fill="none" stroke={GOLD} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - u} />
          </svg>
        </div>
      </Abs>
    </AbsoluteFill>
  );
};
