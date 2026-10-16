import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CORAL, CREAM, FPS, INK, T } from "../data";
import { MONO, SANS, SERIF } from "../fonts";
import { Abs, AppIcon, IconMoon, Lock, bump, clamp01, inOutCubic, lerp, outBack, outExpo, prog, spring, win } from "../ui";
import { TikTok } from "./icons";

/** 0 → 3.8 s: a TikTok icon pops above his head, a padlock slams onto it, and FocusDeen's prayer notification drops in. */
export const HookLock = () => {
  const t = useCurrentFrame() / FPS;
  const a = 1 - prog(t, T.s2 - 0.12, 0.12);
  if (t > T.s2 || t < 0.25) return null;
  const pop = spring(t, 0.3, 2.2, 7); // on screen early: the hook needs a picture before he names it
  const lockIn = prog(t, T.locked - 0.08, 0.2, outBack);
  const slam = bump(t - T.locked - 0.1, 0.22);
  const dead = prog(t, T.locked + 0.08, 0.35);
  const ring = prog(t, T.locked + 0.1, 0.55, outExpo);
  const S = 230;
  return (
    <AbsoluteFill style={{ opacity: a }}>
      {/* shockwave from the slam */}
      <Abs
        style={{
          left: 540 - 260,
          top: 345 - 260,
          width: 520,
          height: 520,
          borderRadius: "50%",
          border: `${lerp(10, 1, ring)}px solid rgba(255,120,125,${(1 - ring) * 0.9})`,
          transform: `scale(${lerp(0.4, 1.25, ring)})`,
          opacity: ring > 0 ? 1 : 0,
        }}
      />
      <Abs style={{ left: 540 - S / 2, top: 345 - S / 2, transform: `scale(${Math.max(0, pop) * (1 - slam * 0.07)}) rotate(${(1 - Math.min(1, pop)) * -14}deg)` }}>
        <TikTok size={S} style={{ filter: `saturate(${1 - dead * 0.85}) brightness(${1 - dead * 0.45})` }} />
        {/* frosted lock-out over the icon */}
        <Abs style={{ inset: 0, borderRadius: S * 0.225, background: `rgba(30,8,14,${dead * 0.35})`, border: `3px solid rgba(255,120,125,${dead * 0.9})` }} />
      </Abs>
      <Abs
        style={{
          left: 540 + 115 - 72,
          top: 345 + 105 - 72 + (1 - lockIn) * -420,
          opacity: clamp01(lockIn * 3),
          transform: `scale(${1 + slam * 0.18}) rotate(${(1 - lockIn) * 20}deg)`,
          filter: "drop-shadow(0 18px 30px rgba(60,5,15,0.55))",
        }}
      >
        <Lock size={144} body={CORAL} color="#fff" open={1 - prog(t, T.locked + 0.02, 0.12)} />
      </Abs>
      <Abs
        style={{
          left: 0,
          width: 540 - 115 - 34,
          top: 326,
          textAlign: "right",
          fontFamily: MONO,
          fontSize: 30,
          letterSpacing: 8,
          fontWeight: 600,
          color: "#FFC2C4",
          opacity: dead * (1 - prog(t, T.salah1 - 0.1, 0.2)),
          textShadow: "0 3px 12px rgba(0,0,0,0.6)",
        }}
      >
        LOCKED
      </Abs>
    </AbsoluteFill>
  );
};

/** iOS-style banner from FocusDeen (copy from its App Store screens). */
export const Notification = () => {
  const t = useCurrentFrame() / FPS;
  if (t < T.salah1 - 0.25 || t > T.s2) return null;
  const p = spring(t, T.salah1 - 0.2, 1.7, 8);
  return (
    <Abs
      style={{
        left: 40,
        right: 40,
        top: lerp(-220, 58, Math.min(1.05, p)),
        height: 150,
        borderRadius: 44,
        background: "rgba(250,246,242,0.86)",
        backdropFilter: "blur(30px) saturate(1.6)",
        boxShadow: "0 30px 70px rgba(30,8,14,0.45)",
        display: "flex",
        alignItems: "center",
        gap: 26,
        padding: "0 34px",
        fontFamily: SANS,
        color: INK,
      }}
    >
      <AppIcon size={92} style={{ boxShadow: "none" }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 36, fontWeight: 700, letterSpacing: -0.6 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <IconMoon size={34} color="#E9434C" sw={2.4} /> Asr time
          </span>
          <span style={{ fontWeight: 500, fontSize: 30, color: "#8a8085" }}>now</span>
        </div>
        <div style={{ fontSize: 33, fontWeight: 500, marginTop: 4, color: "#3a2c31", letterSpacing: -0.4 }}>Take a moment to reconnect with Allah.</div>
      </div>
    </Abs>
  );
};

/** 3.8 → 5.35 s: "pray for us" behind him, then a "right?" sticker. */
export const PrayForUs = () => {
  const t = useCurrentFrame() / FPS;
  if (t < T.s2 - 0.05 || t > T.s3) return null;
  const words = [
    ["pray", T.pray - 0.08],
    ["for", T.pray + 0.2],
    ["us", T.right - 0.25],
  ] as const;
  const out = 1 - prog(t, T.s3 - 0.1, 0.1);
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <Abs style={{ left: 0, right: 0, top: 150, display: "flex", justifyContent: "center", gap: 34 }}>
        {words.map(([w, s], i) => {
          const p = prog(t, s, 0.35, outExpo);
          return (
            <span
              key={i}
              style={{
                fontFamily: SERIF,
                fontStyle: "italic",
                fontSize: 210,
                lineHeight: "230px",
                color: CREAM,
                opacity: p,
                transform: `translateY(${(1 - p) * 70}px)`,
                filter: `blur(${(1 - p) * 14}px) drop-shadow(0 10px 30px rgba(30,8,14,0.55))`,
              }}
            >
              {w}
            </span>
          );
        })}
      </Abs>
    </AbsoluteFill>
  );
};

export const RightSticker = () => {
  const t = useCurrentFrame() / FPS;
  if (t < T.right - 0.1 || t > T.s3) return null;
  const p = spring(t, T.right - 0.08, 2.6, 7);
  return (
    <Abs
      style={{
        left: 690,
        top: 470,
        padding: "8px 34px 14px",
        borderRadius: 30,
        background: `linear-gradient(180deg, #FF7378, ${CORAL})`,
        fontFamily: SANS,
        fontWeight: 900,
        fontSize: 82,
        letterSpacing: -2,
        color: "#fff",
        transform: `scale(${Math.max(0, p)}) rotate(${lerp(-24, -8, Math.min(1, p))}deg)`,
        boxShadow: "0 22px 50px rgba(120,10,25,0.45), inset 0 2px 0 rgba(255,255,255,0.35)",
        border: "4px solid #fff",
      }}
    >
      right?
    </Abs>
  );
};

/** "Well, guess what?" over the snap zoom. */
export const GuessWhat = () => {
  const t = useCurrentFrame() / FPS;
  if (t < T.guess - 0.15 || t > T.thats + 0.1) return null;
  const out = 1 - prog(t, T.thats - 0.12, 0.18);
  const line = (txt: string, s: number, top: number, coral: boolean) => {
    const p = spring(t, s, 2.4, 8);
    return (
      <Abs
        style={{
          left: 0,
          right: 0,
          top,
          textAlign: "center",
          fontFamily: SANS,
          fontWeight: 900,
          fontSize: 205,
          lineHeight: "200px",
          letterSpacing: -8,
          color: coral ? CORAL : CREAM,
          transform: `scale(${lerp(1.6, 1, Math.min(1, Math.max(0, p)))})`,
          opacity: clamp01(p * 3) * out,
          textShadow: coral ? "0 0 40px rgba(255,90,95,0.45), 0 12px 30px rgba(20,4,8,0.6)" : "0 12px 30px rgba(20,4,8,0.6)",
        }}
      >
        {txt}
      </Abs>
    );
  };
  return (
    <AbsoluteFill>
      {line("GUESS", T.guess - 0.06, 120, false)}
      {line("WHAT?", T.what - 0.04, 312, true)}
    </AbsoluteFill>
  );
};

/** "That's exactly what I built": a phone draws itself as a wireframe above his head, then becomes the app. */
export const PHONE = { x: 540, y: 285, w: 236, h: 470 };
export const Blueprint = () => {
  const t = useCurrentFrame() / FPS;
  const a = Math.min(prog(t, T.thats - 0.05, 0.3), 1 - prog(t, T.focusdeen1 + 0.05, 0.25));
  if (a <= 0) return null;
  const draw = prog(t, T.thats, 1.1, inOutCubic);
  const inner = prog(t, T.thats + 0.55, 1.0, inOutCubic);
  const fill = prog(t, T.focusdeen1 - 0.1, 0.18);
  const { x, y, w, h } = PHONE;
  const L = 2 * (w + h);
  const line = { fill: "none", stroke: "#fff", strokeWidth: 5, strokeLinecap: "round" as const };
  return (
    <AbsoluteFill style={{ opacity: a }}>
      {/* blueprint grid on the ceiling */}
      <AbsoluteFill
        style={{
          backgroundImage: "linear-gradient(rgba(255,214,206,0.22) 2px, transparent 2px), linear-gradient(90deg, rgba(255,214,206,0.22) 2px, transparent 2px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 70% 30% at 50% 16%, #000 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 30% at 50% 16%, #000 30%, transparent 75%)",
          opacity: draw,
        }}
      />
      <svg width="1080" height="1920" style={{ position: "absolute", inset: 0, filter: "drop-shadow(0 0 10px rgba(255,90,95,0.95)) drop-shadow(0 0 30px rgba(255,90,95,0.6))" }}>
        <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={42} {...line} strokeWidth={6} strokeDasharray={L} strokeDashoffset={L * (1 - draw)} />
        <rect x={x - 44} y={y - h / 2 + 16} width={88} height={22} rx={11} {...line} opacity={inner} />
        {/* heart outline in the middle */}
        <path
          d={`M${x} ${y + 30} c -60 -40 -70 -95 -30 -110 c 20 -8 30 4 30 18 c 0 -14 10 -26 30 -18 c 40 15 30 70 -30 110 z`}
          {...line}
          strokeDasharray={400}
          strokeDashoffset={400 * (1 - inner)}
        />
        {[0, 1, 2].map((i) => (
          <line key={i} x1={x - 80} x2={x - 80 + 160 * clamp01(inner * 3 - i)} y1={y + 80 + i * 34} y2={y + 80 + i * 34} {...line} opacity={0.75} />
        ))}
        {/* coral fill as it turns into the real app */}
        <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={42} fill={CORAL} opacity={fill} />
      </svg>
      {[
        ["BUILD 1.0", x + w / 2 + 26, y - h / 2 + 20],
        ["SALAH FOCUS", x + w / 2 + 26, y - 20],
        ["BLOCK · UNLOCK", x - w / 2 - 300, y + 60],
      ].map(([s, lx, ly], i) => (
        <Abs
          key={i}
          style={{
            left: lx as number,
            top: ly as number,
            width: 280,
            textAlign: i === 2 ? "right" : "left",
            fontFamily: MONO,
            fontSize: 27,
            letterSpacing: 4,
            fontWeight: 600,
            color: "#FFE1DD",
            textShadow: "0 2px 10px rgba(0,0,0,0.6)",
            opacity: prog(t, T.thats + 0.3 + i * 0.25, 0.3) * 0.9,
          }}
        >
          {s as string}
        </Abs>
      ))}
    </AbsoluteFill>
  );
};
