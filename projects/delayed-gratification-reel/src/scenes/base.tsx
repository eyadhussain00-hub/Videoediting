import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { CAPTION_HIDE, CUT_END, DURATION, FPS, GOLD, GROUPS, INK, KEYWORDS, SEGMENTS, SEG_OUT, T, clean } from "../data";
import { SANS } from "../fonts";
import { Abs, bump, inOutCubic, lerp, outExpo, prog, spring } from "../ui";

// One camera for the clean plate and the speaker cut-out, so the two stay pixel-aligned.
// Each jump cut changes the framing (punch-in / out); "I don't agree" snaps in; "sixteen years" pulls back slowly;
// the last line (his early journey) pushes in.
export const zoomAt = (t: number) => {
  if (t < T.s2) return lerp(1.22, 1.04, prog(t, 0, 0.6, outExpo)) + 0.03 * prog(t, 0.6, T.s2 - 0.6);
  if (t < T.s3) return lerp(1.14, 1.18, (t - T.s2) / (T.s3 - T.s2));
  if (t < T.s4) return lerp(1.04, 1.08, (t - T.s3) / (T.s4 - T.s3));
  if (t < T.s5) return lerp(1.1, 1.16, prog(t, T.s4, T.s5 - T.s4, inOutCubic));
  if (t < T.s6) {
    const punch = prog(t, T.dont3 - 0.06, 0.16, outExpo);
    return lerp(1.03, 1.3, punch);
  }
  if (t < T.s7) return lerp(1.08, 1.12, (t - T.s6) / (T.s7 - T.s6));
  if (t < T.s8) return lerp(1.16, 1.02, prog(t, T.sixteen - 0.3, 1.6, inOutCubic));
  return lerp(1.04, 1.2, prog(t, T.s8, T.endCard - T.s8, inOutCubic));
};
const CUTS = SEG_OUT.slice(1).map((f) => f / FPS);
export const camAt = (t: number) => {
  let blur = 0;
  for (const c of CUTS) blur = Math.max(blur, bump(t - c + 0.03, 0.16) * 4);
  blur = Math.max(blur, bump(t - T.dont3 + 0.05, 0.2) * 7);
  const sh = bump(t - T.free1 - 0.05, 0.3) * 6 + bump(t - T.dont3, 0.25) * 9 + bump(t - T.sixteen, 0.3) * 5;
  return { z: zoomAt(t), blur, dx: Math.sin(t * 90) * sh, dy: Math.cos(t * 77) * sh };
};

/** The edit: kept source ranges laid end to end, then a freeze of the last frame under the end card. */
export const Plate = ({ src, still, transparent = false, grade = true }: { src: string; still: string; transparent?: boolean; grade?: boolean }) => {
  const t = useCurrentFrame() / FPS;
  const { z, blur, dx, dy } = camAt(t);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `translate(${dx}px, ${dy}px) scale(${z})`,
          transformOrigin: "50% 36%",
          filter: [blur > 0.05 ? `blur(${blur}px)` : "", grade ? "contrast(1.1) saturate(0.92) brightness(1.0)" : ""].join(" ") || undefined,
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

export const Footage = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Plate src="clean.mp4" still="img/last.png" />
  </AbsoluteFill>
);
export const Person = () => <Plate src="fg.webm" still="img/last_fg.png" transparent grade />;

/** Grade over plate and speaker: cool shadows / warm highlights, top + bottom falloff for type, vignette. */
export const Shade = () => (
  <>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(255,200,140,0.12), rgba(20,40,60,0.2))", mixBlendMode: "soft-light" }} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(8,9,12,0.5) 0%, rgba(8,9,12,0.15) 16%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 62%, rgba(8,9,12,0.35) 74%, rgba(8,9,12,0.85) 100%)" }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 90% 66% at 50% 42%, rgba(0,0,0,0) 55%, rgba(4,5,8,0.55) 100%)" }} />
  </>
);

/** Background dim behind the speaker on the big type moments. */
export const BgDim = () => {
  const t = useCurrentFrame() / FPS;
  const a = Math.max(
    0.55 * (1 - prog(t, T.number - 0.2, 0.5)),
    0.45 * Math.min(prog(t, T.dont3 - 0.06, 0.12), 1 - prog(t, T.s6 - 0.15, 0.25)),
    0.5 * Math.min(prog(t, T.sixteen - 0.2, 0.3), 1 - prog(t, T.s8 - 0.2, 0.3)),
    0.45 * Math.min(prog(t, T.recommended - 0.2, 0.3), 1 - prog(t, T.felt - 0.1, 0.4)),
  );
  return <AbsoluteFill style={{ background: `rgba(6,7,10,${a})` }} />;
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

export const CAPTION_Y = 1490;

/** Word-by-word captions: bold white, the spoken word lifts into a gold pill; keywords stay gold once said. */
export const Captions = () => {
  const t = useCurrentFrame() / FPS;
  if (t >= DURATION || CAPTION_HIDE.some(([a, b]) => t >= a && t < b)) return null;
  const gi = GROUPS.findIndex((g, i) => t >= g.s - 0.08 && t < Math.min(GROUPS[i + 1]?.s ?? 99, g.e + 0.6) - 0.02);
  if (gi < 0) return null;
  const g = GROUPS[gi];
  const p = prog(t, g.s - 0.08, 0.2);
  return (
    <Abs style={{ left: 60, right: 60, top: CAPTION_Y, display: "flex", justifyContent: "center", alignItems: "center", flexWrap: "wrap", columnGap: 12, rowGap: 6 }}>
      {g.words.map((w, i) => {
        const next = g.words[i + 1];
        const active = t >= w.s - 0.04 && t < (next ? next.s - 0.04 : g.e + 0.6);
        const spoken = t >= w.s - 0.04;
        const pop = spring(t, w.s - 0.04, 3, 9);
        const key = KEYWORDS.has(clean(w.w));
        const txt = w.w.replace(/[.,]$/, "");
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              padding: "2px 16px 8px",
              borderRadius: 16,
              fontFamily: SANS,
              fontWeight: 800,
              fontSize: 70,
              letterSpacing: -1.8,
              lineHeight: "80px",
              color: active ? INK : spoken && key ? "#FFD685" : "#fff",
              opacity: p * (spoken ? 1 : 0.4),
              transform: `translateY(${(1 - p) * 26}px) scale(${active ? lerp(0.86, 1.06, Math.min(1.2, pop)) : 1}) rotate(${active ? -1.2 : 0}deg)`,
              background: active ? `linear-gradient(180deg, #FFE3A3, ${GOLD} 60%, #CE9535)` : "transparent",
              boxShadow: active ? "0 10px 30px rgba(232,176,75,0.4), inset 0 1px 0 rgba(255,255,255,0.5)" : "none",
              textShadow: active ? "none" : "0 4px 18px rgba(0,0,0,0.7), 0 2px 4px rgba(0,0,0,0.5)",
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
