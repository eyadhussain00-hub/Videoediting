import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { CAPTION_HIDE, CUT_END, EMBER, EMBER_SOFT, FPS, GROUPS, IVORY, KEYWORDS, PIP, SEGMENTS, SEG_OUT, SENTENCES, T, at, clean } from "./data";
import { SANS, SERIF } from "./fonts";
import { Abs, bump, inOutCubic, lerp, outExpo, prog, spring } from "./ui";

// One camera for the clean plate and the speaker cut-out, so the two stay pixel-aligned.
// Every sentence re-frames (wide ↔ tight, a snap with a touch of motion blur) and drifts in slowly; the hook starts
// tight and pulls out; takeovers shrink the footage into a card at the bottom.
const zoomAt = (t: number) => {
  let k = 0;
  while (k + 1 < SENTENCES.length && SENTENCES[k + 1] <= t + 0.02) k++;
  const base = (i: number) => (i < 0 ? 1.2 : i % 2 ? 1.14 : 1.03);
  const s = SENTENCES[k];
  const dur = (SENTENCES[k + 1] ?? T.endCard) - s;
  const snap = prog(t, s - 0.04, 0.24, outExpo);
  return lerp(base(k - 1), base(k), snap) + 0.035 * prog(t, s, Math.max(dur, 1), inOutCubic);
};
export const pipAt = (t: number) => Math.max(0, ...PIP.map(([a, b]) => Math.min(prog(t, a, 0.5, inOutCubic), 1 - prog(t, b - 0.45, 0.45, inOutCubic))));
const SHAKES = () => [at("changed") , at("step") , at("now", 3), at("0.01%")];
export const camAt = (t: number) => {
  let blur = 0;
  for (const s of SENTENCES) blur = Math.max(blur, bump(t - s + 0.04, 0.2) * 3.5);
  for (const c of SEG_OUT.slice(1)) blur = Math.max(blur, bump(t - c / FPS + 0.03, 0.18) * 5);
  let sh = 0;
  for (const s of SHAKES()) sh += bump(t - s, 0.3) * 8;
  return { z: zoomAt(t), blur, dx: Math.sin(t * 90) * sh, dy: Math.cos(t * 77) * sh, pip: pipAt(t) };
};

/** The edit: kept source ranges end to end, then a freeze of the last frame under the end card. */
export const Plate = ({ src, still, transparent = false }: { src: string; still: string; transparent?: boolean }) => {
  const t = useCurrentFrame() / FPS;
  const { z, blur, dx, dy, pip } = camAt(t);
  const s = lerp(1, 0.5, pip);
  const ty = lerp(0, 470, pip);
  return (
    <AbsoluteFill style={{ transform: `translateY(${ty}px) scale(${s})`, transformOrigin: "50% 50%" }}>
      <AbsoluteFill style={{ overflow: "hidden", borderRadius: pip * 64, boxShadow: pip > 0 && !transparent ? `0 50px 120px rgba(0,0,0,${0.7 * pip})` : undefined }}>
        <AbsoluteFill
          style={{
            transform: `translate(${dx}px, ${dy}px) scale(${z})`,
            transformOrigin: "50% 33%",
            filter: [blur > 0.05 ? `blur(${blur}px)` : "", "contrast(1.07) saturate(0.96) brightness(0.99)"].join(" "),
          }}
        >
          {SEGMENTS.map(([a, b], i) => (
            <Sequence key={i} from={SEG_OUT[i]} durationInFrames={b - a} layout="none">
              <OffthreadVideo src={staticFile(src)} startFrom={a} muted transparent={transparent} style={{ position: "absolute", width: 1080, height: 1920 }} />
            </Sequence>
          ))}
          <Sequence from={CUT_END} layout="none">
            <Img src={staticFile(still)} style={{ position: "absolute", width: 1080, height: 1920 }} />
          </Sequence>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
export const Footage = () => <Plate src="clean.mp4" still="img/last.png" />;
export const Person = () => <Plate src="fg.webm" still="img/last_fg.png" transparent />;

/** Grade: warm-neutral filmic tint, darker ceiling for the top-zone graphics, floor falloff, vignette. */
export const Shade = () => {
  const t = useCurrentFrame() / FPS;
  const pip = pipAt(t);
  if (pip > 0.999) return null;
  return (
    <AbsoluteFill style={{ opacity: 1 - pip }}>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(255,190,150,0.12), rgba(40,30,60,0.14))", mixBlendMode: "soft-light" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(13,11,10,0.62) 0%, rgba(13,11,10,0.38) 20%, rgba(0,0,0,0) 34%, rgba(0,0,0,0) 60%, rgba(10,8,7,0.25) 72%, rgba(10,8,7,0.72) 100%)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 90% 68% at 50% 42%, rgba(0,0,0,0) 55%, rgba(8,6,5,0.5) 100%)" }} />
    </AbsoluteFill>
  );
};

export const Grain = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ mixBlendMode: "overlay", opacity: 0.11, pointerEvents: "none" }}>
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

export const CAPTION_Y = 1300;

/** Word-by-word captions: ivory sans, keywords in ember serif italic; the spoken word lifts. */
export const Captions = () => {
  const t = useCurrentFrame() / FPS;
  if (pipAt(t) > 0.02 || CAPTION_HIDE.some(([a, b]) => t >= a && t < b)) return null;
  const gi = GROUPS.findIndex((g, i) => t >= g.s - 0.08 && t < Math.min(GROUPS[i + 1]?.s ?? 999, g.e + 0.5) - 0.02);
  if (gi < 0) return null;
  const g = GROUPS[gi];
  const p = prog(t, g.s - 0.08, 0.2);
  return (
    <Abs style={{ left: 50, right: 50, top: CAPTION_Y, display: "flex", justifyContent: "center", alignItems: "baseline", flexWrap: "wrap", columnGap: 18, rowGap: 0 }}>
      {g.words.map((w, i) => {
        const spoken = t >= w.s - 0.04;
        const pop = spring(t, w.s - 0.04, 3, 9);
        const key = KEYWORDS.has(clean(w.w).replace(/[,]$/, "")) || KEYWORDS.has(clean(w.w));
        const txt = w.w.replace(/[.,]$/, "");
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              fontFamily: key ? SERIF : SANS,
              fontStyle: key ? "italic" : "normal",
              fontWeight: key ? 400 : 750,
              fontSize: key ? 92 : 66,
              letterSpacing: key ? -1 : -1.8,
              lineHeight: "96px",
              color: key ? (spoken ? EMBER_SOFT : IVORY) : IVORY,
              opacity: p * (spoken ? 1 : 0.38),
              transform: `translateY(${(1 - p) * 24 + (spoken ? (1 - Math.min(1, pop)) * 10 : 0)}px) scale(${spoken ? lerp(0.9, 1, Math.min(1.08, pop)) : 0.96})`,
              textShadow: key && spoken ? `0 0 34px rgba(255,106,43,0.55), 0 4px 18px rgba(0,0,0,0.6)` : "0 4px 18px rgba(0,0,0,0.7), 0 2px 4px rgba(0,0,0,0.45)",
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

/** "Watch this until the end": a thin ember bar along the top fills with the rest of the video. */
export const ProgressBar = () => {
  const t = useCurrentFrame() / FPS;
  const a = at("end") + 0.05;
  if (t < a - 0.3 || t > T.endCard) return null;
  const p = prog(t, a - 0.3, 0.5);
  const fill = (t - (a - 0.3)) / (T.endCard - a + 0.3);
  const lab = Math.min(prog(t, a, 0.35), 1 - prog(t, a + 1.6, 0.4));
  return (
    <>
      <Abs style={{ left: 0, top: 0, width: 1080, height: 8, background: "rgba(255,255,255,0.12)", opacity: p }} />
      <Abs style={{ left: 0, top: 0, width: 1080 * fill, height: 8, background: `linear-gradient(90deg, ${EMBER}, ${EMBER_SOFT})`, boxShadow: `0 0 18px ${EMBER}`, opacity: p }} />
      <Abs style={{ left: 1080 * fill - 9, top: -5, width: 18, height: 18, borderRadius: 9, background: IVORY, boxShadow: `0 0 22px ${EMBER}`, opacity: p }} />
      {lab > 0.01 && (
        <Abs style={{ left: 40, top: 40, opacity: lab, transform: `translateY(${(1 - lab) * -16}px)`, fontFamily: SANS, fontWeight: 700, fontSize: 26, letterSpacing: 5, color: IVORY }}>
          WATCH TILL THE END →
        </Abs>
      )}
    </>
  );
};
