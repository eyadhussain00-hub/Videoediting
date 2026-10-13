import React from "react";
import { Composition } from "remotion";
import { Reel } from "./Reel";
import { DURATION, FPS, H, W } from "./theme";

export const RemotionRoot: React.FC = () => (
  <Composition id="CoachReel" component={Reel} durationInFrames={Math.round(DURATION * FPS)} fps={FPS} width={W} height={H} />
);
