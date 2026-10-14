import { Composition } from "remotion";
import { Reel } from "./Reel";
import { DURATION, FPS } from "./data";

export const Root = () => (
  <Composition id="Reel" component={Reel} width={1080} height={1920} fps={FPS} durationInFrames={Math.round(DURATION * FPS)} />
);
