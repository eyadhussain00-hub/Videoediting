import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { FPS, TALK_END } from "./beats";
import { C } from "./theme";
import { Camera } from "./parts/Camera";
import { Captions } from "./parts/Captions";
import { Hook } from "./parts/Hook";
import { Look } from "./parts/Look";
import { Clones, EndCard } from "./parts/Outro";
import { Story } from "./parts/Story";

export const Reel = () => (
  <AbsoluteFill style={{ background: C.ink }}>
    <Clones />
    <Sequence durationInFrames={Math.floor(TALK_END * FPS)}>
      <Camera />
    </Sequence>
    <Look />
    <Hook />
    <Story />
    <Captions />
    <EndCard />
    <Audio src={staticFile("mix.wav")} />
  </AbsoluteFill>
);
