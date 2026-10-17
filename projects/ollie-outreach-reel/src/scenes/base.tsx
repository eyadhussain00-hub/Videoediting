import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { CAPTION_HIDE, CUT_END, DURATION, FPS, GOLD, GOLD_HI, GROUPS, KEYWORDS, SEGMENTS, SEG_OUT, SHOTS, T, clean } from "../data";
import { SANS } from "../fonts";
import { Abs, bump, inOutCubic, lerp, outExpo, prog, spring } from "../ui";

// One camera for the clean plate and the speaker cut-out, so the two stay pixel-aligned.
// Each shot opens on a settle-in from a slight punch, drifts in slowly, and snaps in on the big numbers.
const PUNCH: [number, number][] = [
  [T.k5, 0.07],
  [T.n19, 0.08],
  [T.hundreds, 0.06],
  [T.n100, 0.08],
  [T.question, 0.06],
  [T.hard, 0.07],
];
const shotOf = (t: number) => {
  let k = 0;
  SHOTS.forEach((s, i) => t >= s - 0.001 && (k = i));
  return k;
};
export const zoomAt = (t: number) => {
  const k = shotOf(t);
  const s0 = SHOTS[k];
  const s1 = SHOTS[k + 1] ?? DURATION;
  const settle = lerp(k === 0 ? 0.16 : 0.08, 0, prog(t, s0, 0.55, outExpo));
  const drift = 0.06 * prog(t, s0, s1 - s0, inOutCubic);
  let p = 0;
  for (const [w, a] of PUNCH) p = Math.max(p, a * Math.min(prog(t, w - 0.05, 0.12, outExpo), 1 - prog(t, w + 0.55, 0.45, inOutCubic)));
  return 1.03 + settle + drift + p;
};
/** Zoom centre per shot (keeps his face in frame: high in the lounger shot, low in the garden shot). */
const ORIGIN = ["50% 30%", "50% 30%", "45% 22%", "50% 45%", "35% 62%"];
const CUTS = SEG_OUT.slice(1).map((f) => f / FPS);
export const camAt = (t: number) => {
  let blur = 0;
  for (const c of [...CUTS, ...SHOTS.slice(1)]) blur = Math.max(blur, bump(t - c + 0.03, 0.16) * 5);
  let sh = 0;
  for (const [w] of PUNCH) sh = Math.max(sh, bump(t - w, 0.22) * 6);
  return { z: zoomAt(t), blur, dx: Math.sin(t * 90) * sh, dy: Math.cos(t * 77) * sh, origin: ORIGIN[shotOf(t)] };
};

/** The edit: kept source ranges laid end to end, then a freeze of the last frame under the end card. */
export const Plate = ({ src, still, transparent = false, until }: { src: string; still?: string; transparent?: boolean; until?: number }) => {
  const t = useCurrentFrame() / FPS;
  const { z, blur, dx, dy, origin } = camAt(t);
  const endBlur = prog(t, T.endCard - 0.1, 0.6) * 18;
  const b = blur + endBlur;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `translate(${dx}px, ${dy}px) scale(${z})`,
          transformOrigin: origin,
          filter: [b > 0.05 ? `blur(${b}px)` : "", "contrast(1.08) saturate(1.08) brightness(0.97)"].join(" "),
        }}
      >
        {SEGMENTS.map(([s, e], i) =>
          until !== undefined && SEG_OUT[i] / FPS > until ? null : (
            <Sequence key={i} from={SEG_OUT[i]} durationInFrames={e - s} layout="none">
              <OffthreadVideo src={staticFile(src)} startFrom={s} muted transparent={transparent} style={{ position: "absolute", width: 1080, height: 1920 }} />
            </Sequence>
          ),
        )}
        {still && (
          <Sequence from={CUT_END} layout="none">
            <Img src={staticFile(still)} style={{ position: "absolute", width: 1080, height: 1920 }} />
          </Sequence>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Footage = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Plate src="clean.mp4" still="img/last.png" />
  </AbsoluteFill>
);
/** The speaker cut out, only for the hook (the $5K sits behind his head). */
export const Person = () => {
  const t = useCurrentFrame() / FPS;
  if (t >= SHOTS[1]) return null;
  return <Plate src="fg.webm" transparent until={SHOTS[1]} />;
};

/** Grade: warm night tint, falloff top and bottom for type, vignette. */
export const Shade = () => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(255,190,120,0.14), rgba(20,30,60,0.2))", mixBlendMode: "soft-light" }} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(6,7,10,0.5) 0%, rgba(6,7,10,0.18) 16%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 64%, rgba(6,7,10,0.35) 78%, rgba(6,7,10,0.72) 100%)" }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 90% 68% at 50% 46%, rgba(0,0,0,0) 55%, rgba(4,5,8,0.5) 100%)" }} />
  </>
);

/** Dim behind graphics-heavy beats so the cards read. */
export const BgDim = ({ windows }: { windows: [number, number, number][] }) => {
  const t = useCurrentFrame() / FPS;
  let a = 0;
  for (const [s, e, v] of windows) a = Math.max(a, v * Math.min(prog(t, s - 0.15, 0.35), 1 - prog(t, e - 0.2, 0.4)));
  if (a < 0.005) return null;
  return <AbsoluteFill style={{ background: `rgba(6,7,10,${a})` }} />;
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

export const CAPTION_Y = 1560;

/** Word-by-word captions: bold cream, the spoken word lifts into a gold pill; keywords stay gold once said. */
export const Captions = () => {
  const t = useCurrentFrame() / FPS;
  if (t >= DURATION || CAPTION_HIDE.some(([a, b]) => t >= a && t < b)) return null;
  const gi = GROUPS.findIndex((g, i) => t >= g.s - 0.08 && t < Math.min(GROUPS[i + 1]?.s ?? 99, g.e + 0.6) - 0.02);
  if (gi < 0) return null;
  const g = GROUPS[gi];
  const p = prog(t, g.s - 0.08, 0.2);
  return (
    <Abs style={{ left: 50, right: 50, top: CAPTION_Y, display: "flex", justifyContent: "center", alignItems: "center", flexWrap: "wrap", columnGap: 12, rowGap: 4 }}>
      {g.words.map((w, i) => {
        const next = g.words[i + 1];
        const active = t >= w.s - 0.04 && t < (next ? next.s - 0.04 : g.e + 0.6);
        const spoken = t >= w.s - 0.04;
        const pop = spring(t, w.s - 0.04, 3, 9);
        const key = KEYWORDS.has(clean(w.w));
        const txt = w.w.replace(/[.,]$/, "").replace(/^5k$/, "5K");
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              padding: "0px 14px 6px",
              borderRadius: 16,
              fontFamily: SANS,
              fontWeight: 800,
              fontSize: 64,
              letterSpacing: -1.4,
              lineHeight: "74px",
              color: active ? "#17120A" : spoken && key ? GOLD_HI : "#FFFFFF",
              opacity: p * (spoken ? 1 : 0.4),
              transform: `translateY(${(1 - p) * 24}px) scale(${active ? lerp(0.88, 1.05, Math.min(1.2, pop)) : 1}) rotate(${active ? -1.5 : 0}deg)`,
              background: active ? `linear-gradient(180deg, #FFE7B0, ${GOLD} 58%, #C99A4C)` : "transparent",
              boxShadow: active ? "0 10px 28px rgba(200,150,60,0.45), inset 0 1px 0 rgba(255,255,255,0.6)" : "none",
              textShadow: active ? "none" : "0 4px 18px rgba(0,0,0,0.7), 0 2px 4px rgba(0,0,0,0.45)",
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
