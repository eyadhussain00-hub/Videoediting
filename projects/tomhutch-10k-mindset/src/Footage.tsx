import { AbsoluteFill, Freeze, OffthreadVideo, interpolate, staticFile, useCurrentFrame } from "remotion";
import { FPS, SRC_END, inOut, outCubic, prog, useT } from "./theme";

// Camera: [t, scale]. Gaps ≤ 0.15 s are punches (fast ease-out), longer ones slow push-ins.
const CAM: [number, number][] = [
  [0, 1.0], [1.6, 1.03], [1.72, 1.12], [2.3, 1.13], [2.42, 1.0], [8.5, 1.055], [8.62, 1.0],
  [11.7, 1.04], [11.84, 1.0], [15.6, 1.05], [16.45, 1.17], [17.35, 1.19], [17.47, 1.0],
  [19.95, 1.03], [20.08, 1.08], [20.85, 1.09], [20.97, 1.0], [22.95, 1.03], [23.5, 1.22], [23.55, 1.0],
  [26.2, 1.03], [26.32, 1.08], [27.3, 1.09], [27.42, 1.0], [30.9, 1.04], [31.02, 1.1], [33.1, 1.16],
];
const camera = (t: number) => {
  for (let i = 0; i < CAM.length - 1; i++) {
    const [a, sa] = CAM[i];
    const [b, sb] = CAM[i + 1];
    if (t <= b) return sa + (sb - sa) * (b - a <= 0.15 ? outCubic : inOut)(Math.max(0, (t - a) / (b - a)));
  }
  return CAM[CAM.length - 1][1];
};

export const Footage = () => {
  const t = useT();
  const frame = useCurrentFrame();
  const last = Math.round(SRC_END * FPS) - 1;
  // B&W on "nothing really changes", colour back on "you just keep"
  const bw = Math.min(prog(t, 16.38, 16.5), 1 - prog(t, 17.38, 17.5));
  const sat = interpolate(bw, [0, 1], [1.06, 0]);
  const hold = prog(t, SRC_END, SRC_END + 0.7);      // end card: blur + darken the frozen frame
  const video = (
    <OffthreadVideo
      src={staticFile("clean.mp4")}
      muted
      style={{
        width: "100%", height: "100%",
        filter: `contrast(${1.1 + bw * 0.18}) saturate(${sat}) brightness(${1.02 - hold * 0.45}) blur(${hold * 14}px)`,
      }}
    />
  );
  return (
    <AbsoluteFill style={{ backgroundColor: "#05070c" }}>
      <AbsoluteFill style={{ transform: `scale(${camera(t)})`, transformOrigin: "50% 40%" }}>
        {frame >= last ? <Freeze frame={last}>{video}</Freeze> : video}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
