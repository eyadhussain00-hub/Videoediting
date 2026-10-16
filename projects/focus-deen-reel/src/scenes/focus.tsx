import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CORAL, CREAM, FPS, T } from "../data";
import { ARABIC, MONO, SERIF } from "../fonts";
import { Abs, inOutCubic, lerp, outExpo, prog, win } from "../ui";
import { dofAt } from "./base";

// "So you can focus on salah and pray with concentration": the room falls out of focus behind him (base.tsx dof),
// a focus reticle locks onto his face, "salah" and then خشوع (khushūʿ, presence in prayer) rise behind his head.

/** Behind the speaker: the words, plus soft light from above. */
export const FocusType = () => {
  const t = useCurrentFrame() / FPS;
  const d = dofAt(t);
  if (d <= 0) return null;
  const salah = Math.min(prog(t, T.salah3 - 0.1, 0.5, outExpo), 1 - prog(t, T.pray2 - 0.05, 0.3, inOutCubic));
  const kh = prog(t, T.pray2 + 0.05, 0.7, outExpo);
  const rays = d * (0.6 + 0.4 * Math.sin(t * 1.3));
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background: "conic-gradient(from 180deg at 50% -8%, rgba(255,226,200,0) 0deg, rgba(255,226,200,0.32) 12deg, rgba(255,226,200,0) 24deg, rgba(255,226,200,0.24) 40deg, rgba(255,226,200,0) 52deg, rgba(255,226,200,0.3) 300deg, rgba(255,226,200,0) 318deg, rgba(255,226,200,0.22) 336deg, rgba(255,226,200,0) 348deg)",
          mixBlendMode: "screen",
          opacity: rays * 0.8,
          filter: "blur(18px)",
        }}
      />
      <Abs
        style={{
          left: 0,
          right: 0,
          top: 150,
          textAlign: "center",
          fontFamily: SERIF,
          fontStyle: "italic",
          fontSize: 300,
          lineHeight: "300px",
          letterSpacing: -4,
          color: CREAM,
          opacity: salah,
          transform: `translateY(${(1 - salah) * 60}px) scale(${lerp(1.08, 1, salah)})`,
          filter: `blur(${(1 - salah) * 16}px) drop-shadow(0 14px 40px rgba(20,6,10,0.5))`,
        }}
      >
        salah
      </Abs>
      <Abs
        style={{
          left: 0,
          right: 0,
          top: 150,
          textAlign: "center",
          fontFamily: ARABIC,
          fontWeight: 700,
          fontSize: 250,
          lineHeight: "330px",
          direction: "rtl",
          color: CREAM,
          opacity: kh * d,
          transform: `translateY(${(1 - kh) * 50}px)`,
          filter: `blur(${(1 - kh) * 16}px) drop-shadow(0 0 40px rgba(255,200,170,0.35)) drop-shadow(0 14px 40px rgba(20,6,10,0.5))`,
        }}
      >
        خشوع
      </Abs>
      <Abs style={{ left: 0, right: 0, top: 82, textAlign: "center", fontFamily: MONO, fontSize: 28, letterSpacing: 8, color: "#FFE6DC", opacity: prog(t, T.concentration - 0.1, 0.4) * d }}>
        KHUSHŪʿ · PRESENCE IN PRAYER
      </Abs>
    </AbsoluteFill>
  );
};

/** In front: autofocus brackets that hunt, then lock onto his face. */
export const Reticle = () => {
  const t = useCurrentFrame() / FPS;
  const a = win(t, T.focus - 0.2, T.pray2 + 0.1, 0.15, 0.35);
  if (a <= 0) return null;
  const lock = prog(t, T.focus - 0.15, 0.45, inOutCubic);
  const hunt = (1 - lock) * Math.sin(t * 40) * 10;
  const cx = 600;
  const cy = 930;
  const w = lerp(900, 560, lock) + hunt;
  const h = lerp(1080, 660, lock) + hunt;
  const locked = prog(t, T.focus + 0.28, 0.12);
  const c = locked > 0.5 ? CORAL : CREAM;
  const L = 74;
  const corner = (sx: number, sy: number, k: number) => (
    <path
      key={k}
      d={`M${cx + (sx * w) / 2} ${cy + (sy * h) / 2 - sy * L} V${cy + (sy * h) / 2} H${cx + (sx * w) / 2 - sx * L}`}
      fill="none"
      stroke={c}
      strokeWidth={7}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
  return (
    <AbsoluteFill style={{ opacity: a }}>
      <svg width="1080" height="1920" style={{ position: "absolute", inset: 0, filter: `drop-shadow(0 0 ${8 + locked * 14}px ${locked > 0.5 ? "rgba(255,90,95,0.8)" : "rgba(0,0,0,0.5)"})` }}>
        {corner(-1, -1, 0)}
        {corner(1, -1, 1)}
        {corner(-1, 1, 2)}
        {corner(1, 1, 3)}
        <circle cx={cx} cy={cy} r={10} fill="none" stroke={c} strokeWidth={4} opacity={0.8} />
      </svg>
      <Abs
        style={{
          left: cx + w / 2 - 230,
          top: cy + h / 2 + 18,
          width: 230,
          textAlign: "right",
          fontFamily: MONO,
          fontSize: 26,
          letterSpacing: 5,
          color: c,
          textShadow: "0 2px 10px rgba(0,0,0,0.6)",
        }}
      >
        {locked > 0.5 ? "● FOCUS" : "AF ···"}
      </Abs>
    </AbsoluteFill>
  );
};
