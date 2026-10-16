import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { CAPTION_HIDE, CORAL, CUT_END, DURATION, FPS, GROUPS, KEYWORDS, SEGMENTS, SEG_OUT, T, clean } from "../data";
import { SANS } from "../fonts";
import { Abs, bump, inOutCubic, lerp, outExpo, prog, spring } from "../ui";

// One camera for the clean plate and the speaker cut-out, so the two stay pixel-aligned.
// Jump cuts change the framing (punch-in / out); "guess what" is a snap zoom; the FocusDeen reveal dollies out
// as the coral world opens; the focus beat pushes in slowly.
export const zoomAt = (t: number) => {
  if (t < T.s2) return lerp(1.2, 1.03, prog(t, 0, 0.55, outExpo)) + 0.02 * prog(t, 0.5, 3.3);
  if (t < T.s3) return lerp(1.12, 1.15, (t - T.s2) / (T.s3 - T.s2));
  if (t < T.s4) {
    const punch = Math.min(prog(t, T.guess - 0.06, 0.14, outExpo), 1 - prog(t, T.thats - 0.12, 0.22, inOutCubic));
    return lerp(1.02, 1.27, punch) + 0.03 * prog(t, T.thats, 1.3);
  }
  if (t < T.s5) return lerp(1.13, 1.0, Math.min(1, spring(t, T.focusdeen1 - 0.06, 1.6, 7)));
  if (t < T.s6) return lerp(1.0, 1.03, (t - T.s5) / (T.s6 - T.s5));
  if (t < T.s7) return lerp(1.07, 1.17, prog(t, T.s6, T.s7 - T.s6, inOutCubic));
  return lerp(1.0, 1.04, prog(t, T.s7, T.endCard - T.s7));
};
const CUTS = SEG_OUT.slice(1).map((f) => f / FPS);
export const camAt = (t: number) => {
  let blur = 0;
  for (const c of CUTS) blur = Math.max(blur, bump(t - c + 0.03, 0.16) * 4);
  blur = Math.max(blur, bump(t - T.guess + 0.06, 0.2) * 7, bump(t - T.focusdeen1 + 0.05, 0.3) * 6);
  // a small shake on the lock slam and the snap zoom
  const sh = bump(t - T.locked - 0.12, 0.3) * 7 + bump(t - T.guess, 0.25) * 9;
  return { z: zoomAt(t), blur, dx: Math.sin(t * 90) * sh, dy: Math.cos(t * 77) * sh };
};

/** Background softness (shallow focus) during the "focus on salah" beat. */
export const dofAt = (t: number) => Math.min(prog(t, T.s6 + 0.05, 0.9, inOutCubic), 1 - prog(t, T.s7 - 0.25, 0.35, inOutCubic));

/** The edit: kept source ranges laid end to end, then a freeze of the last frame under the end card. */
export const Plate = ({ src, still, transparent = false, grade = true, dof = false }: { src: string; still: string; transparent?: boolean; grade?: boolean; dof?: boolean }) => {
  const t = useCurrentFrame() / FPS;
  const { z, blur, dx, dy } = camAt(t);
  const b = blur + (dof ? dofAt(t) * 16 : 0);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `translate(${dx}px, ${dy}px) scale(${z})`,
          transformOrigin: "50% 42%",
          filter: [b > 0.05 ? `blur(${b}px)` : "", grade ? "contrast(1.08) saturate(1.06) brightness(0.98)" : ""].join(" ") || undefined,
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
    <Plate src="clean.mp4" still="img/last.png" dof />
  </AbsoluteFill>
);
export const Person = () => <Plate src="fg.webm" still="img/last_fg.png" transparent />;

/** How dark the ceiling gets behind the top-of-frame graphics (cream type on a pale ceiling needs it). */
const topDarkAt = (t: number) => {
  if (t < T.s5) return 0.5;
  if (t < T.s6) return 0.2;
  if (t < T.s7) return 0.55;
  return 0.5;
};

/** Grade over plate and speaker: warm filmic tint, top/bottom falloff for type, vignette. */
export const Shade = () => {
  const t = useCurrentFrame() / FPS;
  const top = topDarkAt(t);
  return (
    <>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(255,170,130,0.16), rgba(90,30,40,0.18))", mixBlendMode: "soft-light" }} />
      <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(26,10,14,${top}) 0%, rgba(26,10,14,${top * 0.55}) 22%, rgba(0,0,0,0) 36%, rgba(0,0,0,0) 62%, rgba(20,8,12,0.3) 74%, rgba(20,8,12,0.7) 100%)` }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 88% 66% at 50% 44%, rgba(0,0,0,0) 56%, rgba(20,6,10,0.48) 100%)" }} />
    </>
  );
};

/** Background dim behind the speaker (punches the graphics forward). */
export const BgDim = () => {
  const t = useCurrentFrame() / FPS;
  const a = Math.max(
    0.16 * (1 - prog(t, T.s2 - 0.1, 0.3)),
    0.32 * Math.min(prog(t, T.guess - 0.06, 0.12), 1 - prog(t, T.thats - 0.1, 0.3)),
    0.3 * Math.min(prog(t, T.thats, 0.4), 1 - prog(t, T.focusdeen1, 0.2)),
    0.38 * dofAt(t),
  );
  return <AbsoluteFill style={{ background: `rgba(24,8,12,${a})` }} />;
};

export const Grain = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ mixBlendMode: "overlay", opacity: 0.12, pointerEvents: "none" }}>
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

export const CAPTION_Y = 1530;

/** Word-by-word captions: bold white, the spoken word lifts into a coral pill; keywords stay pink once said. */
export const Captions = () => {
  const t = useCurrentFrame() / FPS;
  if (t >= DURATION || CAPTION_HIDE.some(([a, b]) => t >= a && t < b)) return null;
  const gi = GROUPS.findIndex((g, i) => t >= g.s - 0.08 && t < Math.min(GROUPS[i + 1]?.s ?? 99, g.e + 0.6) - 0.02);
  if (gi < 0) return null;
  const g = GROUPS[gi];
  const p = prog(t, g.s - 0.08, 0.2);
  return (
    <Abs style={{ left: 60, right: 60, top: CAPTION_Y, display: "flex", justifyContent: "center", alignItems: "center", flexWrap: "wrap", columnGap: 14, rowGap: 6 }}>
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
              position: "relative",
              padding: "2px 16px 8px",
              borderRadius: 18,
              fontFamily: SANS,
              fontWeight: 800,
              fontSize: 68,
              letterSpacing: -1.6,
              lineHeight: "78px",
              color: active ? "#fff" : spoken && key ? "#FFB3B6" : "#fff",
              opacity: p * (spoken ? 1 : 0.42),
              transform: `translateY(${(1 - p) * 26}px) scale(${active ? lerp(0.86, 1.06, Math.min(1.2, pop)) : 1}) rotate(${active ? -1.5 : 0}deg)`,
              background: active ? `linear-gradient(180deg, #FF6B70, ${CORAL} 60%, #E9434C)` : "transparent",
              boxShadow: active ? "0 10px 30px rgba(233,67,76,0.45), inset 0 1px 0 rgba(255,255,255,0.35)" : "none",
              textShadow: active ? "0 2px 6px rgba(120,10,20,0.35)" : "0 4px 18px rgba(0,0,0,0.65), 0 2px 4px rgba(0,0,0,0.4)",
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
