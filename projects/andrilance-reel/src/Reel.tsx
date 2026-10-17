import { AbsoluteFill, Audio, staticFile } from "remotion";
import "./fonts";
import { Captions, Footage, Grain, Person, ProgressBar, Shade } from "./base";
import { Behind1, Front1 } from "./beats1";
import { Behind2, Cover2, Front2 } from "./beats2";
import { Behind3, Dots, EndCard, Front3 } from "./beats3";
import { Flash, LightLeaks } from "./fx";

// Back to front: takeover backdrop → room → type behind him → the speaker (cut-out) → grade → graphics → captions →
// opaque prompt takeover → light FX → progress bar → end card → grain.
export const Reel = () => (
  <AbsoluteFill style={{ background: "#0D0B0A" }}>
    <Dots />
    <Footage />
    <Behind1 />
    <Behind2 />
    <Behind3 />
    <Person />
    <Shade />
    <Front1 />
    <Front2 />
    <Front3 />
    <Cover2 />
    <Captions />
    <LightLeaks />
    <Flash />
    <ProgressBar />
    <EndCard />
    <Grain />
    <Audio src={staticFile("mix.wav")} />
  </AbsoluteFill>
);
