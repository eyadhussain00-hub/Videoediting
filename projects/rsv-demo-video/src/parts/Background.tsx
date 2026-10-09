import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ink } from "../theme";

// A dark, neutral stage with two soft glows that drift very slowly, so the frame is never quite still
// without anything competing with the footage.
export function Background() {
  const frame = useCurrentFrame();
  const drift = (speed: number, range: number) => Math.sin(frame / speed) * range;
  return (
    <AbsoluteFill style={{ background: ink.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute", width: 1500, height: 1500, borderRadius: "50%",
          left: -420 + drift(90, 60), top: -760 + drift(120, 40),
          background: `radial-gradient(circle, ${ink.accent}40 0%, ${ink.accent}00 62%)`,
        }}
      />
      <div
        style={{
          position: "absolute", width: 1300, height: 1300, borderRadius: "50%",
          right: -460 + drift(110, 50), bottom: -720 + drift(80, 40),
          background: `radial-gradient(circle, ${ink.teal}33 0%, ${ink.teal}00 62%)`,
        }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)" }} />
    </AbsoluteFill>
  );
}
