import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { CAPTION_HIDE, CUT_END, DURATION, FPS, GROUPS, KEYWORDS, SEGMENTS, SEG_OUT, T, calmAt, clean, heatAt } from "../data";
import { SANS } from "../fonts";
import { Abs, accent, bump, inOutCubic, lerp, outExpo, prog } from "../ui";

// Framing per beat: [edit time, zoom]. Each change snaps (fast ease-out) and then drifts slowly, like a punch-in cut.
const KEYS: [number, number][] = [
  [0, 1.34],
  [T.thats - 0.05, 1.1],
  [T.psychological - 0.05, 1.2],
  [T.listen - 0.05, 1.04],
  [T.explain - 0.05, 1.16],
  [T.present - 0.05, 1.08],
  [T.boom - 0.04, 1.36],
  [T.fight - 0.06, 1.0],
  [T.brain - 0.05, 1.2],
  [T.sympathetic - 0.05, 1.1],
  [T.trouble - 0.3, 1.26],
  [T.understanding - 0.05, 1.06],
  [T.interrupt - 0.3, 1.16],
  [T.three - 0.05, 1.0],
  [T.first - 0.05, 1.2],
  [T.second - 0.05, 1.04],
  [T.third - 0.05, 1.22],
  [T.now2 - 0.05, 1.08],
  [T.remember - 0.3, 1.24],
  [T.anticipation - 0.05, 1.12],
  [T.elite - 0.05, 1.0],
];
export const zoomAt = (t: number) => {
  let i = 0;
  while (i + 1 < KEYS.length && t >= KEYS[i + 1][0]) i++;
  const [k0, z0] = KEYS[i];
  const prev = i > 0 ? KEYS[i - 1][1] : z0;
  const next = KEYS[i + 1]?.[0] ?? DURATION;
  const snap = lerp(prev, z0, prog(t, k0, 0.28, outExpo));
  // slow push through the beat; the breath beat pushes in with the inhale
  const drift = 0.035 * prog(t, k0, next - k0, inOutCubic);
  return snap + drift;
};
const CUTS = SEG_OUT.slice(1).map((f) => f / FPS);
export const camAt = (t: number) => {
  let blur = 0;
  for (const c of CUTS) blur = Math.max(blur, bump(t - c + 0.03, 0.14) * 3);
  for (const [k] of KEYS.slice(1)) blur = Math.max(blur, bump(t - k, 0.16) * 3.5);
  const sh = bump(t - T.boom + 0.02, 0.45) * 16 + bump(t - T.fight, 0.3) * 6 + bump(t - T.trouble, 0.3) * 5;
  return { z: zoomAt(t), blur, dx: Math.sin(t * 93) * sh, dy: Math.cos(t * 71) * sh };
};

/** The edit: kept source ranges laid end to end, then a freeze of the last frame under the end card. */
export const Plate = ({ src, still, transparent = false }: { src: string; still: string; transparent?: boolean }) => {
  const t = useCurrentFrame() / FPS;
  const { z, blur, dx, dy } = camAt(t);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `translate(${dx}px, ${dy}px) scale(${z})`,
          transformOrigin: "50% 32%",
          filter: [blur > 0.05 ? `blur(${blur}px)` : "", "contrast(1.1) saturate(0.92) brightness(0.96)"].join(" "),
        }}
      >
        {SEGMENTS.map(([s, e], i) => (
          <Sequence key={i} from={SEG_OUT[i]} durationInFrames={e - s} layout="none">
            <OffthreadVideo src={staticFile(src)} startFrom={s} muted transparent={transparent} style={{ position: "absolute", width: 1080, height: 1920 }} />
          </Sequence>
        ))}
        <Sequence from={CUT_END} layout="none">
          <Img src={staticFile(still)} style={{ position: "absolute", width: 1080, height: 1920 }} />
        </Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Footage = () => <Plate src="clean.mp4" still="img/last.png" />;
export const Person = () => <Plate src="fg.webm" still="img/last_fg.png" transparent />;

/** Background dim behind the speaker, so type placed behind him reads. */
export const BgDim = ({ a }: { a: (t: number) => number }) => {
  const t = useCurrentFrame() / FPS;
  const v = a(t);
  if (v <= 0.005) return null;
  return <AbsoluteFill style={{ background: `rgba(6,7,9,${v})` }} />;
};

/** Grade over plate and speaker: the panic runs hot (ember wash rising from below), the calm runs cool. */
export const Shade = () => {
  const t = useCurrentFrame() / FPS;
  const h = heatAt(t), c = calmAt(t);
  const pulse = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * lerp(1.1, 2.2, h)); // his heartbeat, faster when hot
  return (
    <>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(40,46,56,0.18), rgba(10,10,12,0.2))", mixBlendMode: "soft-light" }} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 120% 70% at 50% 110%, rgba(255,70,20,${0.55 * h}) 0%, rgba(255,40,30,${0.22 * h}) 45%, rgba(0,0,0,0) 75%)`,
          mixBlendMode: "screen",
          opacity: 0.75 + 0.25 * pulse,
        }}
      />
      <AbsoluteFill style={{ background: `rgba(255,60,30,${0.16 * h})`, mixBlendMode: "soft-light" }} />
      <AbsoluteFill style={{ background: `rgba(40,200,255,${0.2 * c})`, mixBlendMode: "soft-light" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(5,6,8,0.55) 0%, rgba(5,6,8,0.2) 18%, rgba(0,0,0,0) 32%, rgba(0,0,0,0) 64%, rgba(5,6,8,0.35) 76%, rgba(5,6,8,0.78) 100%)" }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 68% at 50% 42%, rgba(0,0,0,0) 55%, rgba(${Math.round(40 * h)},4,6,${0.5 + 0.12 * h * pulse}) 100%)` }} />
    </>
  );
};

export const Grain = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ mixBlendMode: "overlay", opacity: 0.13, pointerEvents: "none" }}>
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

export const CAPTION_Y = 1500;

/** Word-by-word captions: bold white; the spoken word lights in the HUD accent; keywords keep a tint once said. */
export const Captions = () => {
  const t = useCurrentFrame() / FPS;
  if (t >= T.endCard || CAPTION_HIDE.some(([a, b]) => t >= a && t < b)) return null;
  const gi = GROUPS.findIndex((g, i) => t >= g.s - 0.08 && t < Math.min(GROUPS[i + 1]?.s ?? 999, g.e + 0.5) - 0.02);
  if (gi < 0) return null;
  const g = GROUPS[gi];
  const p = prog(t, g.s - 0.08, 0.18);
  const ac = accent(t);
  return (
    <Abs style={{ left: 50, right: 50, top: CAPTION_Y, display: "flex", justifyContent: "center", alignItems: "baseline", flexWrap: "wrap", columnGap: 18, rowGap: 0 }}>
      {g.words.map((w, i) => {
        const next = g.words[i + 1];
        const active = t >= w.s - 0.04 && t < (next ? next.s - 0.04 : g.e + 0.5);
        const spoken = t >= w.s - 0.04;
        const key = KEYWORDS.has(clean(w.w));
        const pop = prog(t, w.s - 0.04, 0.16, outExpo);
        const txt = w.w.replace(/[.,]$/, "").toUpperCase();
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              fontFamily: SANS,
              fontWeight: 900,
              fontSize: key ? 84 : 74,
              letterSpacing: -1.5,
              lineHeight: "92px",
              color: active && key ? ac : "#fff",
              opacity: p * (spoken ? 1 : 0.35),
              transform: `translateY(${(1 - p) * 24 + (active ? (1 - pop) * 10 : 0)}px) scale(${active ? lerp(0.9, 1.04, pop) : 1})`,
              textShadow: active && key ? `0 0 34px ${accent(t, 0.55)}, 0 4px 14px rgba(0,0,0,0.6)` : "0 4px 18px rgba(0,0,0,0.75), 0 2px 4px rgba(0,0,0,0.5)",
              filter: `blur(${(1 - p) * 8}px)`,
              whiteSpace: "nowrap",
            }}
          >
            {txt}
          </span>
        );
      })}
    </Abs>
  );
};
