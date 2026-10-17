import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FPS, GOLD, GOLD_HI, ITEMS, IVORY, T, cardWin } from "../data";
import { ARABIC, MONO, SANS, SERIF } from "../fonts";
import { Abs, foil, lerp, outBackSoft, outExpo, prog, spring } from "../ui";
import { Lattice } from "./pattern";

const HOOK_END = () => cardWin(ITEMS[0])[0];

/** Behind the speaker: a giant gold "7" slams in on "seven", then dissolves into رِزْق on "Rizq". */
export const HookBehind = () => {
  const t = useCurrentFrame() / FPS;
  const end = HOOK_END() + 0.2;
  if (t > end) return null;
  const seven = spring(t, T.seven - 0.06, 1.6, 7);
  const sevenOut = prog(t, T.rizq - 0.25, 0.35);
  const rz = prog(t, T.rizq - 0.1, 0.6, outExpo);
  const glow = Math.max(0.35, 1 - prog(t, T.rizq, 1.4));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `rgba(3,20,15,${0.55 * prog(t, 0, 0.4)})` }} />
      <Lattice cell={160} draw={prog(t, 0.05, 1.4)} opacity={0.14} drift={t * 0.2} />
      <Abs style={{ left: 0, right: 0, top: 120, textAlign: "center", opacity: seven * (1 - sevenOut), transform: `scale(${lerp(1.6, 1, Math.min(1.1, seven))})`, filter: `blur(${sevenOut * 20}px)` }}>
        <span style={{ ...foil, fontFamily: SERIF, fontSize: 1180, lineHeight: "1100px", filter: "drop-shadow(0 30px 80px rgba(226,188,114,0.35))" }}>7</span>
      </Abs>
      <Abs style={{ left: 0, right: 0, top: 250, textAlign: "center", direction: "rtl", opacity: rz, transform: `scale(${lerp(0.82, 1, rz) + 0.03 * prog(t, T.rizq, 2)})`, filter: `blur(${(1 - rz) * 18}px)` }}>
        <span style={{ ...foil, fontFamily: ARABIC, fontWeight: 700, fontSize: 470, lineHeight: "700px", padding: "0 40px", filter: `drop-shadow(0 0 ${60 * glow}px rgba(242,212,146,0.5))` }}>رِزْق</span>
      </Abs>
    </AbsoluteFill>
  );
};

/** In front: the title builds word by word with his line, then hands over to the first chapter card. */
export const HookFront = () => {
  const t = useCurrentFrame() / FPS;
  const end = HOOK_END();
  if (t > end + 0.1) return null;
  const out = prog(t, end - 0.15, 0.2);
  const a = prog(t, T.seven - 0.05, 0.35, outExpo);
  const b = prog(t, T.right - 0.05, 0.3, outBackSoft);
  const c = prog(t, T.increase - 0.05, 0.35, outExpo);
  const d = spring(t, T.rizq - 0.04, 2.2, 6);
  const m = prog(t, T.muslim - 0.05, 0.3, outExpo);
  return (
    <Abs style={{ left: 0, right: 0, top: 0, height: 1920, opacity: 1 - out }}>
      <Abs style={{ left: 0, right: 0, top: 236, textAlign: "center", opacity: a, transform: `translateY(${(1 - a) * -20}px)` }}>
        <span style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 9, color: GOLD_HI }}>SEVEN ACTIONS</span>
      </Abs>
      <Abs style={{ left: 0, right: 0, top: 296, display: "flex", justifyContent: "center", opacity: b, transform: `scale(${lerp(0.7, 1, b)})` }}>
        <span style={{ fontFamily: SANS, fontWeight: 800, fontSize: 44, letterSpacing: 4, color: "#1B1406", padding: "6px 22px 8px", borderRadius: 12, background: "linear-gradient(176deg, #FFF0C6, #E7C175 55%, #C99A45)" }}>RIGHT NOW</span>
      </Abs>
      <Abs style={{ left: 0, right: 0, top: 1240, textAlign: "center", opacity: c, transform: `translateY(${(1 - c) * 30}px)` }}>
        <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 66, color: IVORY, textShadow: "0 6px 30px rgba(0,0,0,0.6)" }}>that increase your</span>
      </Abs>
      <Abs style={{ left: 0, right: 0, top: 1300, textAlign: "center", opacity: Math.min(1, d * 1.5), transform: `scale(${lerp(0.6, 1, Math.min(1.15, d))})` }}>
        <span style={{ ...foil, fontFamily: SERIF, fontSize: 230, lineHeight: "250px", letterSpacing: -4, filter: "drop-shadow(0 12px 40px rgba(0,0,0,0.55))" }}>Rizq</span>
      </Abs>
      <Abs style={{ left: 0, right: 0, top: 1560, textAlign: "center", opacity: m, transform: `translateY(${(1 - m) * 16}px)` }}>
        <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 30, letterSpacing: 8, color: GOLD }}>— AS A MUSLIM —</span>
      </Abs>
    </Abs>
  );
};
