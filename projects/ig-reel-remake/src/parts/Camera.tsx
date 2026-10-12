import { AbsoluteFill, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { B, easeIO, lerp, ramp } from "../beats";
import { BigWords } from "./BigWords";

// Camera segments [start, z0, z1]: a segment starts with a hard punch to z0, then drifts to z1 until the next one.
const SEG: [number, number, number][] = [
  [0, 1.16, 1.1],
  [1.56, 1.0, 1.04],
  [4.1, 1.09, 1.11],
  [7.16, 1.0, 1.07],
  [B.three - 0.02, 1.14, 1.15],
  [B.ch1, 1.0, 1.05],
  [17.0, 1.1, 1.12],
  [B.ch2, 1.0, 1.05],
  [23.22, 1.07, 1.09],
  [B.nice, 1.14, 1.15],
  [B.ch3, 1.0, 1.05],
  [31.5, 1.07, 1.09],
  [33.62, 1.0, 1.04],
  [38.56, 1.06, 1.08],
  [40.3, 1.14, 1.15],
  [42.72, 1.0, 1.03],
  [48.84, 1.02, 1.12],
  [53.36, 1.1, 1.14],
  [55.22, 1.0, 1.04],
];

export const zoomAt = (t: number) => {
  let i = SEG.length - 1;
  while (i > 0 && SEG[i][0] > t) i--;
  const [a, z0, z1] = SEG[i];
  const b = SEG[i + 1]?.[0] ?? 59.2;
  // The punch lands over 3 frames instead of 1, which reads as a cut but keeps the eye.
  const prev = i > 0 ? SEG[i - 1][2] : z0;
  const punch = ramp(t, a, 0.1, easeIO);
  const drift = interpolate(t, [a, b], [z0, z1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeIO });
  return lerp(prev, drift, punch);
};

// The cut-out subject (scripts/fg.sh). Off only while the matte is still being generated.
const HAS_FG = true;

const GRADE = "contrast(1.1) saturate(0.86) brightness(0.96)";

/** The talking-head plate: graded footage, big words behind the subject, the cut-out subject on top. */
export const Camera = () => {
  const { fps } = useVideoConfig();
  const t = useCurrentFrame() / fps;
  const z = zoomAt(t);
  // Clone grid: the live frame shrinks into the centre tile of a 3×3 grid.
  const g = ramp(t, B.clone, 0.55, easeIO);
  const scale = lerp(z, 1 / 3, g);
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: `50% ${lerp(27, 50, g)}%` }}>
      <AbsoluteFill style={{ overflow: "hidden", borderRadius: g * 28 * 3 }}>
        <OffthreadVideo src={staticFile("clean.mp4")} muted style={{ width: "100%", height: "100%", filter: GRADE }} />
        <BigWords />
        {HAS_FG && <OffthreadVideo
          src={staticFile("fg.webm")}
          muted
          transparent
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", filter: GRADE }}
        />}
      </AbsoluteFill>
      {g > 0 && (
        <AbsoluteFill
          style={{ borderRadius: 28 * 3, boxShadow: `inset 0 0 0 ${9 * g}px #FF6B2C`, opacity: g }}
        />
      )}
    </AbsoluteFill>
  );
};
