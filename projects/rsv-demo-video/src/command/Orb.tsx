import { useLayoutEffect, useRef } from "react";
import { SignalOrb } from "./vendor/signal-orb";

// The Command Centre's own orb, drawn one frame at a time: no animation loop, just the frame Remotion
// asks for (time in seconds, a weight per state).
export function Orb({ size, time, weights, particles = 12000 }: { size: number; time: number; weights: number[]; particles?: number }) {
  const host = useRef<HTMLDivElement>(null);
  const halo = useRef<HTMLCanvasElement>(null);
  const dots = useRef<HTMLCanvasElement>(null);
  const orb = useRef<SignalOrb | null>(null);

  useLayoutEffect(() => {
    orb.current = new SignalOrb(host.current!, halo.current!, dots.current!, "listening", { manual: true, particles });
    return () => {
      orb.current?.destroy();
      orb.current = null;
    };
  }, [particles]);

  useLayoutEffect(() => {
    orb.current?.renderFrame(time, weights);
  });

  const fill = { position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" } as const;
  return (
    <div ref={host} style={{ position: "absolute", inset: 0, width: size, height: size }}>
      <canvas ref={halo} style={fill} />
      <canvas ref={dots} style={fill} />
    </div>
  );
}
