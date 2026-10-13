import React from "react";
import { Composition } from "remotion";
import { Reel } from "./Reel";
import { FPS, TOTAL } from "./theme";

export const Root: React.FC = () => (
  <Composition id="Reel" component={Reel} width={1080} height={1920} fps={FPS}
    durationInFrames={Math.round(TOTAL * FPS)} defaultProps={{ audio: true }} />
);
