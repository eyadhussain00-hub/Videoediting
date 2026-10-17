import type { ReactNode } from "react";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { BLUE, CAPTION_HIDE, CH, CUT_END, DURATION, FPS, GOLD, GROUPS, INK, KEYWORDS, RED, SEGMENTS, SEG_OUT, T, clean } from "../data";
import { SANS } from "../fonts";
import { Abs, bump, inOutCubic, lerp, outExpo, prog } from "../ui";

// One camera for the clean plate, the speaker cut-out and anything pinned to the glasses, so they stay aligned.
// Each chapter has its own framing; the jump cuts punch in; the catch pushes in slowly; the verdict pulls back.
export const zoomAt = (t: number) => {
  if (t < CH.isa) return lerp(1.22, 1.04, prog(t, 0, 0.6, outExpo)) + 0.03 * prog(t, 0.6, CH.isa - 0.6);
  if (t < CH.sipp) return lerp(1.0, 1.05, prog(t, CH.isa, CH.sipp - CH.isa, inOutCubic));
  if (t < CH.catch) return lerp(1.1, 1.04, prog(t, CH.sipp, 0.5, outExpo)) + 0.03 * prog(t, CH.sipp + 0.5, CH.catch - CH.sipp);
  if (t < CH.verdict) return lerp(1.04, 1.16, prog(t, CH.catch, 1.2, outExpo)) + 0.03 * prog(t, CH.catch + 1.2, CH.verdict - CH.catch);
  if (t < T.ideally - 0.06) return lerp(1.0, 1.04, prog(t, CH.verdict, T.ideally - CH.verdict));
  if (t < CH.outro) return lerp(1.0, 1.04, prog(t, T.ideally - 0.06, CH.outro - T.ideally));
  return lerp(1.0, 1.05, prog(t, CH.outro, T.endCard - CH.outro));
};
const CUTS = [...SEG_OUT.slice(1).map((f) => f / FPS), CH.isa, CH.sipp, CH.catch, CH.verdict, T.ideally - 0.06, CH.outro];
export const camAt = (t: number) => {
  let blur = 0;
  for (const c of CUTS) blur = Math.max(blur, bump(t - c + 0.04, 0.18) * 5);
  const sh = bump(t - T.catch, 0.35) * 8 + bump(t - T.ideally, 0.3) * 6;
  return { z: zoomAt(t), blur, dx: Math.sin(t * 90) * sh, dy: Math.cos(t * 77) * sh };
};
export const ORIGIN = { x: 540, y: 820 };
/** Where a source pixel lands on screen at time t (for graphics pinned to the footage). */
export const toScreen = (t: number, x: number, y: number) => {
  const { z, dx, dy } = camAt(t);
  return { x: ORIGIN.x + (x - ORIGIN.x) * z + dx, y: ORIGIN.y + (y - ORIGIN.y) * z + dy, z };
};

/** Children laid out in source pixels, moved with the camera. */
export const Cam = ({ children }: { children: ReactNode }) => {
  const t = useCurrentFrame() / FPS;
  const { z, dx, dy } = camAt(t);
  return (
    <AbsoluteFill style={{ transform: `translate(${dx}px, ${dy}px) scale(${z})`, transformOrigin: `${ORIGIN.x}px ${ORIGIN.y}px` }}>{children}</AbsoluteFill>
  );
};

export const Plate = ({ src, still, transparent = false, grade = true }: { src: string; still: string; transparent?: boolean; grade?: boolean }) => {
  const t = useCurrentFrame() / FPS;
  const { blur } = camAt(t);
  return (
    <Cam>
      <AbsoluteFill style={{ filter: [blur > 0.05 ? `blur(${blur}px)` : "", grade ? "contrast(1.08) saturate(1.04) brightness(0.97)" : ""].join(" ") || undefined }}>
        {SEGMENTS.map(([s, e], i) => (
          <Sequence key={i} from={SEG_OUT[i]} durationInFrames={e - s} layout="none">
            <OffthreadVideo src={staticFile(src)} startFrom={s} muted transparent={transparent} style={{ position: "absolute", width: 1080, height: 1920 }} />
          </Sequence>
        ))}
        <Sequence from={CUT_END} layout="none">
          <Img src={staticFile(still)} style={{ position: "absolute", width: 1080, height: 1920 }} />
        </Sequence>
      </AbsoluteFill>
    </Cam>
  );
};

export const Footage = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Plate src="clean.mp4" still="img/last.png" />
  </AbsoluteFill>
);
export const Person = () => <Plate src="fg.webm" still="img/last_fg.png" transparent />;

/** Colour of the current chapter (captions, accents). */
export const chapterColor = (t: number) => (t >= CH.sipp && t < CH.catch ? BLUE : t >= CH.catch && t < T.when - 0.1 ? RED : t >= T.when - 0.1 && t < CH.verdict ? BLUE : GOLD);

/** Room dim behind the speaker: the wall is pale, so cream type and glass panels need it darker. */
export const BgDim = () => {
  const t = useCurrentFrame() / FPS;
  const catchA = 0.22 * Math.min(prog(t, CH.catch, 0.4), 1 - prog(t, T.when - 0.3, 0.5));
  return <AbsoluteFill style={{ background: `rgba(6,8,18,${0.3 + catchA})` }} />;
};

/** Grade over plate and speaker: cool shadows / warm skin, top + bottom falloff for type, vignette. */
export const Shade = () => {
  const t = useCurrentFrame() / FPS;
  const red = 0.18 * Math.min(prog(t, T.catch - 0.05, 0.3), 1 - prog(t, T.when - 0.3, 0.5));
  return (
    <>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(120,150,255,0.10), rgba(255,170,90,0.12))", mixBlendMode: "soft-light" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(5,7,16,0.62) 0%, rgba(5,7,16,0.3) 14%, rgba(0,0,0,0) 26%, rgba(0,0,0,0) 64%, rgba(5,7,16,0.35) 78%, rgba(5,7,16,0.72) 100%)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 90% 66% at 45% 44%, rgba(0,0,0,0) 55%, rgba(4,6,14,0.5) 100%)" }} />
      {red > 0.005 && <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 70% at 50% 50%, rgba(0,0,0,0) 40%, rgba(255,40,30,${red}) 100%)`, mixBlendMode: "screen" }} />}
    </>
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

export const CAPTION_Y = 1300;

/** Word-by-word captions: bold white, the spoken word lifts into a pill in the chapter's colour. */
export const Captions = () => {
  const t = useCurrentFrame() / FPS;
  if (t >= DURATION || CAPTION_HIDE.some(([a, b]) => t >= a && t < b)) return null;
  const gi = GROUPS.findIndex((g, i) => t >= g.s - 0.08 && t < Math.min(GROUPS[i + 1]?.s ?? 99, g.e + 0.6) - 0.02);
  if (gi < 0) return null;
  const g = GROUPS[gi];
  const p = prog(t, g.s - 0.08, 0.2);
  const col = chapterColor(t);
  return (
    <Abs style={{ left: 50, right: 50, top: CAPTION_Y, display: "flex", justifyContent: "center", alignItems: "center", flexWrap: "wrap", columnGap: 12, rowGap: 6 }}>
      {g.words.map((w, i) => {
        const next = g.words[i + 1];
        const active = t >= w.s - 0.04 && t < (next ? next.s - 0.04 : g.e + 0.6);
        const spoken = t >= w.s - 0.04;
        const pop = Math.min(1.2, 1 - Math.exp(-9 * Math.max(0, t - w.s + 0.04)) * Math.cos(2 * Math.PI * 3 * Math.max(0, t - w.s + 0.04)));
        const key = KEYWORDS.has(clean(w.w));
        const txt = w.w.replace(/[.,?]$/, "");
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              padding: "2px 15px 8px",
              borderRadius: 16,
              fontFamily: SANS,
              fontWeight: 800,
              fontSize: 64,
              letterSpacing: -1.4,
              lineHeight: "74px",
              color: active ? INK : spoken && key ? col : "#fff",
              opacity: p * (spoken ? 1 : 0.4),
              transform: `translateY(${(1 - p) * 24}px) scale(${active ? lerp(0.86, 1.06, pop) : 1})`,
              background: active ? col : "transparent",
              boxShadow: active ? `0 10px 30px ${col}66, inset 0 1px 0 rgba(255,255,255,0.45)` : "none",
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
