import { Composition } from "remotion";
import { Reel } from "./Reel";
import { FPS, TOTAL } from "./theme";

export const Root = () => (
  <Composition id="Reel" component={Reel} width={1080} height={1920} fps={FPS} durationInFrames={Math.round(TOTAL * FPS)} />
);
