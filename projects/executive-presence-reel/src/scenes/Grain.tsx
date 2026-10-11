import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { rnd } from "../theme";

/** Film grain: one noise tile, jumped to a new seeded offset every frame. */
export const Grain: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill style={{ mixBlendMode: "overlay", opacity: 0.16, overflow: "hidden", pointerEvents: "none" }}>
    <Img src={staticFile("grain.png")} style={{
      position: "absolute", width: 2048, height: 2048, imageRendering: "pixelated",
      left: -Math.floor(rnd(f) * 900), top: -Math.floor(rnd(f + 999) * 120),
    }} />
  </AbsoluteFill>
);
