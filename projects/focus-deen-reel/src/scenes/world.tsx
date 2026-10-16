import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CORAL, FPS, LAV, T } from "../data";
import { MONO, SANS, SERIF } from "../fonts";
import { Abs, AppIcon, Heart, Lock, bump, card, clamp01, inOutCubic, lerp, outBack, outExpo, prog, rnd, spring } from "../ui";
import { PHONE } from "./hook";
import { SOCIAL } from "./icons";

// "I built FocusDeen": the room behind him turns into the app's coral world (a circle wipe out of the wireframe
// phone). It holds through "block all of your social media at salah time", then dissolves for the focus beat.
export const worldAt = (t: number) => {
  const open = prog(t, T.focusdeen1 - 0.08, 0.55, inOutCubic);
  const close = prog(t, T.s6 - 0.05, 0.6, inOutCubic);
  return { open, a: 1 - close };
};

export const CoralWorld = () => {
  const t = useCurrentFrame() / FPS;
  const { open, a } = worldAt(t);
  if (open <= 0 || a <= 0) return null;
  const r = lerp(0, 2300, open);
  return (
    <AbsoluteFill style={{ opacity: a, clipPath: `circle(${r}px at ${PHONE.x}px ${PHONE.y}px)` }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 55% at 50% 30%, #FF8A8C 0%, ${CORAL} 45%, #D8343F 100%)` }} />
      {/* slow concentric rings behind his head */}
      {[0, 1, 2, 3, 4].map((i) => {
        const k = ((t - T.focusdeen1) * 0.35 + i / 5) % 1;
        return (
          <Abs
            key={i}
            style={{
              left: 540 - 900,
              top: 700 - 900,
              width: 1800,
              height: 1800,
              borderRadius: "50%",
              border: "3px solid rgba(255,235,228,0.22)",
              transform: `scale(${lerp(0.15, 1.2, k)})`,
              opacity: Math.sin(k * Math.PI),
            }}
          />
        );
      })}
      {/* soft bokeh */}
      {Array.from({ length: 18 }).map((_, i) => {
        const x = rnd(i * 2.3) * 1080;
        const y = (rnd(i * 5.1) * 1920 - (t - T.focusdeen1) * (20 + rnd(i) * 40) + 1920) % 1920;
        const s = 20 + rnd(i * 9.7) * 90;
        return <Abs key={i} style={{ left: x, top: y, width: s, height: s, borderRadius: "50%", background: "rgba(255,240,232,0.16)", filter: `blur(${4 + rnd(i) * 10}px)` }} />;
      })}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(120,10,25,0.0) 50%, rgba(90,8,20,0.45) 100%)" }} />
    </AbsoluteFill>
  );
};

/** Icon + wordmark + tagline above his head right after the reveal. */
export const Lockup = () => {
  const t = useCurrentFrame() / FPS;
  if (t < T.focusdeen1 - 0.1 || t > T.s5 + 0.4) return null;
  const ic = spring(t, T.focusdeen1 - 0.02, 1.8, 6.5);
  const wm = prog(t, T.focusdeen1 + 0.12, 0.45, outExpo);
  const tg = prog(t, T.focusdeen1 + 0.35, 0.45, outExpo);
  const out = prog(t, T.s5 - 0.05, 0.35, inOutCubic);
  return (
    <AbsoluteFill style={{ transform: `translateY(${-out * 140}px)`, opacity: 1 - out }}>
      <Abs style={{ left: 540 - 95, top: 70, transform: `scale(${Math.max(0, ic)}) rotate(${(1 - Math.min(1, ic)) * 10}deg)` }}>
        <AppIcon size={190} style={{ boxShadow: "0 24px 60px rgba(90,8,20,0.5), 0 0 0 5px rgba(255,255,255,0.85)" }} />
      </Abs>
      <Abs
        style={{
          left: 0,
          right: 0,
          top: 292,
          textAlign: "center",
          fontFamily: SANS,
          fontWeight: 800,
          fontSize: 132,
          letterSpacing: -5,
          lineHeight: "140px",
          color: "#fff",
          opacity: wm,
          transform: `translateY(${(1 - wm) * 40}px)`,
          filter: `blur(${(1 - wm) * 10}px)`,
          textShadow: "0 10px 34px rgba(110,8,22,0.45)",
        }}
      >
        Focus<span style={{ fontWeight: 400, fontFamily: SERIF, fontStyle: "italic", letterSpacing: -2 }}>Deen</span>
      </Abs>
      <Abs style={{ left: 0, right: 0, top: 438, textAlign: "center", fontFamily: MONO, fontSize: 28, letterSpacing: 9, color: "#FFE3DF", opacity: tg }}>
        PRAY FIRST · UNLOCK AFTER
      </Abs>
    </AbsoluteFill>
  );
};

/** The mascot peeks out from behind his shoulder (sits behind the speaker layer). */
export const HeartPeek = () => {
  const t = useCurrentFrame() / FPS;
  if (t < T.focusdeen1 || t > T.s6 + 0.6) return null;
  const up = spring(t, T.focusdeen1 + 0.15, 1.4, 5);
  const down = prog(t, T.s6 - 0.1, 0.5, inOutCubic);
  const bob = Math.sin((t - T.focusdeen1) * 3.2) * 10;
  const wiggle = Math.sin((t - T.focusdeen1) * 5) * 4 * (1 - down);
  // the heart winces when the apps get blocked
  const flinch = bump(t - T.block, 0.3) * 0.06;
  return (
    <Abs
      style={{
        left: 800,
        top: lerp(1500, 1010, Math.min(1.04, up)) + bob + down * 520,
        transform: `rotate(${12 + wiggle}deg) scale(${1 - flinch}, ${1 + flinch})`,
        filter: "drop-shadow(0 26px 30px rgba(90,8,20,0.45))",
      }}
    >
      <Heart size={270} />
    </Abs>
  );
};

/** "block all of your social media": six apps above his head, locked one by one, then folded into Salah Focus. */
const GRID = SOCIAL.map((_, i) => ({ x: 540 + ((i % 3) - 1) * 196, y: 196 + Math.floor(i / 3) * 196 }));
const lockTime = (i: number) => T.block + 0.05 + i * ((T.salah2 - 0.35 - T.block) / 6);
const CARD = { x: 64, y: 150, w: 952 };
const rowSlot = (i: number) => ({ x: CARD.x + 80 + i * 112, y: CARD.y + 325 });

export const AppsBlock = () => {
  const t = useCurrentFrame() / FPS;
  if (t < T.s5 - 0.05 || t > T.s6 + 0.5) return null;
  const fold = prog(t, T.salah2 - 0.22, 0.45, inOutCubic);
  const exit = prog(t, T.s6 - 0.08, 0.4, inOutCubic);
  return (
    <AbsoluteFill style={{ opacity: 1 - exit, transform: `translateY(${-exit * 160}px)` }}>
      <SalahCard t={t} />
      {SOCIAL.map((Icon, i) => {
        const g = GRID[i];
        const r = rowSlot(i);
        const inP = spring(t, T.s5 + 0.08 + i * 0.07, 2.2, 7.5);
        const lk = lockTime(i);
        const dead = prog(t, lk, 0.25);
        const shake = bump(t - lk, 0.25) * Math.sin((t - lk) * 80) * 9;
        const S = lerp(150, 80, fold);
        const x = lerp(g.x, r.x, fold);
        const y = lerp(g.y, r.y, fold);
        const lockP = prog(t, lk - 0.04, 0.2, outBack);
        return (
          <Abs key={i} style={{ left: x - S / 2 + shake, top: y - S / 2, transform: `scale(${Math.max(0, inP)})` }}>
            <Icon size={S} style={{ filter: `saturate(${1 - dead * 0.85}) brightness(${1 - dead * 0.4})` }} />
            <Abs
              style={{
                left: S - S * 0.42,
                top: S - S * 0.42,
                transform: `scale(${lockP}) rotate(${(1 - lockP) * -30}deg)`,
                filter: "drop-shadow(0 6px 10px rgba(60,5,15,0.5))",
              }}
            >
              <Lock size={S * 0.56} body={CORAL} color="#fff" open={1 - prog(t, lk + 0.04, 0.1)} />
            </Abs>
          </Abs>
        );
      })}
      <Abs
        style={{
          left: 0,
          right: 0,
          top: 400 + 16,
          textAlign: "center",
          fontFamily: MONO,
          fontSize: 26,
          letterSpacing: 8,
          color: "#FFE3DF",
          opacity: Math.min(prog(t, T.social, 0.3), 1 - fold) * 0.95,
          transform: `translateY(${GRID[5].y - 400 + 100}px)`,
        }}
      >
        {Math.min(6, Math.max(0, Math.floor((t - T.block) / ((T.salah2 - 0.35 - T.block) / 6)) + 1))}/6 BLOCKED
      </Abs>
    </AbsoluteFill>
  );
};

/** FocusDeen's "Salah Focus" rule, rebuilt from the app's Blocking screen; the toggle flips on at "time". */
const SalahCard = ({ t }: { t: number }) => {
  const inP = spring(t, T.salah2 - 0.25, 1.8, 7.5);
  if (inP <= 0) return null;
  const on = prog(t, T.time2 - 0.05, 0.22, inOutCubic);
  return (
    <>
      <Abs
        style={{
          left: CARD.x,
          top: CARD.y,
          width: CARD.w,
          height: 400,
          ...card,
          opacity: clamp01(inP * 2),
          transform: `translateY(${(1 - Math.min(1, inP)) * -80}px) scale(${lerp(0.94, 1, Math.min(1, inP))})`,
        }}
      >
        <Abs style={{ left: 40, top: 40, width: 110, height: 110, borderRadius: 30, background: `linear-gradient(160deg, #CBBBFA, ${LAV})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Heart size={78} />
        </Abs>
        <Abs style={{ left: 176, top: 46, fontSize: 52, fontWeight: 800, letterSpacing: -1.5 }}>Salah Focus</Abs>
        <Abs style={{ left: 176, top: 112, fontSize: 31, fontWeight: 500, color: "#8B7D82" }}>Block distractions at prayer time</Abs>
        {/* toggle */}
        <Abs
          style={{
            left: CARD.w - 40 - 136,
            top: 58,
            width: 136,
            height: 80,
            borderRadius: 40,
            background: "#E4DCD6",
            boxShadow: `0 0 ${30 * on}px rgba(255,90,95,${0.55 * on}), inset 0 2px 4px rgba(0,0,0,0.08)`,
          }}
        >
          <Abs style={{ inset: 0, borderRadius: 40, background: CORAL, opacity: on }} />
          <Abs style={{ left: lerp(6, 62, on), top: 6, width: 68, height: 68, borderRadius: 34, background: "#fff", boxShadow: "0 4px 10px rgba(0,0,0,0.22)" }} />
        </Abs>
        <Abs style={{ left: 40, right: 40, top: 190, height: 2, background: "#EFE6DE" }} />
        <Abs style={{ left: 40, top: 226, fontFamily: MONO, fontSize: 24, letterSpacing: 5, color: "#A0948F" }}>BLOCKED APPS</Abs>
        <Abs style={{ right: 40, top: 222, fontFamily: MONO, fontSize: 26, letterSpacing: 3, color: CORAL, fontWeight: 700, opacity: on }}>ON</Abs>
      </Abs>
      <Abs
        style={{
          left: 0,
          right: 0,
          top: CARD.y - 74,
          textAlign: "center",
          fontFamily: MONO,
          fontSize: 28,
          letterSpacing: 6,
          color: "#FFE9E4",
          opacity: clamp01(inP * 2),
        }}
      >
        ASR · 5:21 PM · PRAYER TIME
      </Abs>
    </>
  );
};
