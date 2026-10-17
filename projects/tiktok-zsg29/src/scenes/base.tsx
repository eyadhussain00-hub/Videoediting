import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { BG, CAPTION_HIDE, CREAM, CUT_END, DURATION, EMBER, EMBER_DEEP, FPS, GROUPS, KEYWORDS, MUTED, SEGMENTS, SEG_OUT, T, clean, clockAt, segAt } from "../data";
import { MONO, SANS } from "../fonts";
import { Abs, bump, lerp, outBack, outExpo, prog, spring } from "../ui";

// The speaker lives in the top 900 px: his burned-in labels and captions all sit below y ≈ 905 of the source, so a
// top crop is clean without inpainting, and the lower half becomes our own motion-graphics stage.
export const WIN_H = 790;
const LIFT = 120; // his face sits low in the source: lift it; rows ≥ 905 (burned-in text) land below the window
const ORIGIN_Y = 260; // zoom about his face; at z ≥ 1 the window never shows source rows below 900

// Shots: [start s, zoom from, zoom to, x offset]. Hard punch-ins on each "Objection number…", reset on each close.
const SHOTS: [number, number, number, number][] = [
  [0, 1.144, 1.09, 0],
  [segAt(1), 1.03, 1.06, 0],
  [T.o1 - 0.06, 1.12, 1.15, -14],
  [T.sense - 0.06, 1.018, 1.072, 0],
  [T.o2 - 0.06, 1.12, 1.15, 14],
  [segAt(4), 1.024, 1.078, 0],
  [T.o3 - 0.06, 1.12, 1.15, -14],
  [T.absolutely - 0.06, 1.018, 1.066, 0],
  [T.o4 - 0.06, 1.12, 1.15, 14],
  [T.hear - 0.06, 1.024, 1.072, 0],
  [T.six - 0.06, 1.102, 1.132, 0],
  [T.recap, 1.048, 1.096, 0],
];
export const camAt = (t: number) => {
  let i = 0;
  while (i < SHOTS.length - 1 && t >= SHOTS[i + 1][0]) i++;
  const [a, z0, z1, dx] = SHOTS[i];
  const b = SHOTS[i + 1]?.[0] ?? DURATION;
  const z = lerp(z0, z1, Math.min(1, (t - a) / (b - a)));
  let blur = 0;
  for (const [s] of SHOTS.slice(1)) blur = Math.max(blur, bump(t - s + 0.02, 0.14) * 5);
  for (const f of SEG_OUT.slice(1)) blur = Math.max(blur, bump(t - f / FPS + 0.02, 0.12) * 3);
  return { z, dx, blur };
};

export const Speaker = () => {
  const t = useCurrentFrame() / FPS;
  const { z, dx, blur } = camAt(t);
  const dim = prog(t, T.recap - 0.1, 0.5);
  return (
    <Abs style={{ left: 0, top: 0, width: 1080, height: WIN_H, overflow: "hidden", background: BG }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          height: 1920,
          transform: `translate(${dx}px, ${-LIFT}px) scale(${z})`,
          transformOrigin: `540px ${ORIGIN_Y}px`,
          filter: `contrast(1.08) saturate(1.04) brightness(${1 - dim * 0.45}) ${blur + dim * 10 > 0.05 ? `blur(${blur + dim * 10}px)` : ""}`,
        }}
      >
        {SEGMENTS.map(([s, e], i) => (
          <Sequence key={i} from={SEG_OUT[i]} durationInFrames={e - s} layout="none">
            <OffthreadVideo src={staticFile("src.mp4")} startFrom={s} muted style={{ position: "absolute", width: 1080, height: 1920 }} />
          </Sequence>
        ))}
        <Sequence from={CUT_END} layout="none">
          <Img src={staticFile("img/last.jpg")} style={{ position: "absolute", width: 1080, height: 1920 }} />
        </Sequence>
      </div>
      {/* warm grade, vignette and the fade into the stage */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(255,150,100,0.10), rgba(60,20,10,0.12))", mixBlendMode: "soft-light" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 70% at 50% 40%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)" }} />
      <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(11,10,9,0.55) 0%, rgba(11,10,9,0) 14%, rgba(11,10,9,0) 74%, ${BG} 100%)` }} />
    </Abs>
  );
};

export const Backdrop = () => {
  const t = useCurrentFrame() / FPS;
  const pulse = 0.5 + 0.5 * Math.sin(t * 1.3);
  return (
    <AbsoluteFill style={{ background: BG }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 30% at 50% 66%, rgba(255,90,44,${0.07 + 0.03 * pulse}) 0%, rgba(0,0,0,0) 70%)` }} />
      {/* fine grid, like a studio floor */}
      <AbsoluteFill
        style={{
          top: 900,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          backgroundPosition: `0 ${(t * 8) % 60}px`,
          maskImage: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 30%, rgba(0,0,0,0.6) 75%, rgba(0,0,0,0) 100%)",
          WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 30%, rgba(0,0,0,0.6) 75%, rgba(0,0,0,0) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

/** His 40-second countdown, rebuilt: big tabular digits + a draining ember bar. */
export const Clock = () => {
  const t = useCurrentFrame() / FPS;
  if (t < T.forty - 0.05) return null;
  const c = clockAt(t);
  const sec = Math.ceil(c - 1e-6);
  const phase = sec - c; // 0 when this digit lands
  const slam = spring(t, T.forty - 0.04, 2.6, 7);
  const tick = t > T.o1 ? 1 - prog(phase, 0, 0.18) : 0;
  const done = prog(t, T.todayEnd - 0.02, 0.25);
  const urgent = c < 5.5 && c > 0 ? 0.5 + 0.5 * Math.cos(phase * Math.PI * 2) : 0;
  const color = c <= 0 ? EMBER : CREAM;
  const y = lerp(0, -250, prog(t, T.recap - 0.1, 0.6, outExpo));
  const sc = lerp(1, 0.62, prog(t, T.recap - 0.1, 0.6, outExpo));
  return (
    <Abs style={{ left: 0, right: 0, top: 790, height: 240, transform: `translateY(${y}px) scale(${sc})`, transformOrigin: "50% 30%" }}>
      <Abs style={{ left: 0, right: 0, top: 0, display: "flex", justifyContent: "center", alignItems: "baseline", gap: 6 }}>
        <span
          style={{
            fontFamily: SANS,
            fontWeight: 800,
            fontSize: 176,
            letterSpacing: -6,
            fontVariantNumeric: "tabular-nums",
            lineHeight: "176px",
            color,
            opacity: Math.min(1, slam),
            transform: `scale(${lerp(1.5, 1, Math.min(1, slam)) + tick * 0.035 + urgent * 0.04})`,
            textShadow: `0 0 ${40 + urgent * 50 + done * 60}px rgba(255,90,44,${0.25 + urgent * 0.4 + done * 0.5}), 0 10px 30px rgba(0,0,0,0.6)`,
            display: "inline-block",
          }}
        >
          0:{String(sec).padStart(2, "0")}
        </span>
      </Abs>
      {/* draining bar */}
      <Abs style={{ left: 140, right: 140, top: 190, height: 10, borderRadius: 6, background: "rgba(255,255,255,0.1)", opacity: Math.min(1, slam) }}>
        <Abs
          style={{
            left: 0,
            top: 0,
            bottom: 0,
            width: `${(c / 40) * 100}%`,
            borderRadius: 6,
            background: `linear-gradient(90deg, ${EMBER_DEEP}, ${EMBER} 80%, #FFB089)`,
            boxShadow: "0 0 18px rgba(255,90,44,0.7)",
          }}
        />
      </Abs>
      <Abs style={{ left: 140, top: 210, fontFamily: MONO, fontSize: 22, letterSpacing: 4, color: MUTED, opacity: Math.min(1, slam) * (1 - done) }}>4 OBJECTIONS</Abs>
      <Abs style={{ right: 140, top: 210, fontFamily: MONO, fontSize: 22, letterSpacing: 4, color: MUTED, opacity: Math.min(1, slam) * (1 - done) }}>4 CLOSES</Abs>
    </Abs>
  );
};

/** Name tag on the opening shot. */
export const NameTag = () => {
  const t = useCurrentFrame() / FPS;
  const p = prog(t, 0.35, 0.5, outBack);
  const out = prog(t, T.o1 - 0.5, 0.35);
  if (out >= 1) return null;
  return (
    <Abs
      style={{
        left: 56,
        top: 640,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 26px 14px 18px",
        borderRadius: 40,
        background: "rgba(14,12,11,0.62)",
        border: "1.5px solid rgba(255,235,215,0.16)",
        backdropFilter: "blur(16px)",
        opacity: p * (1 - out),
        transform: `translateX(${(1 - p) * -40}px)`,
      }}
    >
      <div style={{ width: 14, height: 14, borderRadius: 7, background: EMBER, boxShadow: "0 0 12px rgba(255,90,44,0.9)" }} />
      <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 32, color: CREAM }}>Billy Cox</span>
      <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 26, color: MUTED }}>@therealbillycox</span>
    </Abs>
  );
};

export const Grain = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ mixBlendMode: "overlay", opacity: 0.1, pointerEvents: "none" }}>
      <svg width="1080" height="1920">
        <filter id="g">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={f % 12} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="1080" height="1920" filter="url(#g)" />
      </svg>
    </AbsoluteFill>
  );
};

/** White flash on the hook slam and when the clock hits zero. */
export const Flash = () => {
  const t = useCurrentFrame() / FPS;
  const a = Math.max(bump(t - T.forty + 0.03, 0.22) * 0.35, bump(t - T.todayEnd, 0.2) * 0.12);
  return a > 0.002 ? <AbsoluteFill style={{ background: `rgba(255,214,190,${a})`, mixBlendMode: "screen" }} /> : null;
};

export const CAPTION_Y = 1490;

/** Word-by-word captions: the spoken word lifts into an ember pill; keywords stay warm once said. */
export const Captions = () => {
  const t = useCurrentFrame() / FPS;
  if (t >= DURATION || CAPTION_HIDE.some(([a, b]) => t >= a && t < b)) return null;
  const gi = GROUPS.findIndex((g, i) => t >= g.s - 0.08 && t < Math.min(GROUPS[i + 1]?.s ?? 99, g.e + 0.6) - 0.02);
  if (gi < 0) return null;
  const g = GROUPS[gi];
  const p = prog(t, g.s - 0.08, 0.18);
  return (
    <Abs style={{ left: 50, right: 50, top: CAPTION_Y, display: "flex", justifyContent: "center", alignItems: "center", flexWrap: "wrap", columnGap: 10, rowGap: 4 }}>
      {g.words.map((w, i) => {
        const next = g.words[i + 1];
        const active = t >= w.s - 0.04 && t < (next ? next.s - 0.04 : g.e + 0.6);
        const spoken = t >= w.s - 0.04;
        const pop = spring(t, w.s - 0.04, 3, 9);
        const key = KEYWORDS.has(clean(w.w));
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              padding: "0px 14px 6px",
              borderRadius: 14,
              fontFamily: SANS,
              fontWeight: 800,
              fontSize: 58,
              letterSpacing: -1.2,
              lineHeight: "70px",
              color: active ? "#fff" : spoken && key ? "#FFB18F" : CREAM,
              opacity: p * (spoken ? 1 : 0.38),
              transform: `translateY(${(1 - p) * 20}px) scale(${active ? lerp(0.88, 1.05, Math.min(1.2, pop)) : 1})`,
              background: active ? `linear-gradient(180deg, #FF7A50, ${EMBER} 60%, ${EMBER_DEEP})` : "transparent",
              boxShadow: active ? "0 10px 28px rgba(226,64,26,0.45), inset 0 1px 0 rgba(255,255,255,0.3)" : "none",
              filter: `blur(${(1 - p) * 6}px)`,
              whiteSpace: "nowrap",
            }}
          >
            {w.w.replace(/[.,]$/, "")}
          </span>
        );
      })}
    </Abs>
  );
};
