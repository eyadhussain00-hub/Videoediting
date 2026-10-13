import React from "react";
import { Composition } from "remotion";
import { Reel } from "./Reel";
import { H, W } from "./theme";
import type { ReelProps } from "./types";
import sample from "./sample-props.json";

// Renders always pass --props (scripts/reel.sh). The sample props let Studio open without a job.
export const RemotionRoot: React.FC = () => (
  <Composition
    id="CoachReel"
    component={Reel}
    defaultProps={sample as unknown as ReelProps}
    fps={30}
    width={W}
    height={H}
    durationInFrames={300}
    calculateMetadata={({ props }) => ({
      fps: props.fps,
      durationInFrames: Math.round(props.duration * props.fps),
    })}
  />
);
