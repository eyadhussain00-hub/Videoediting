import { AbsoluteFill, Audio, staticFile } from "remotion";
import "./fonts";
import { Backdrop, Captions, Clock, Flash, Grain, NameTag, Speaker } from "./scenes/base";
import { Beats, HookTitle, Recap } from "./scenes/stage";

// Back to front: dark studio backdrop → speaker window (top 900 px) → clock → stage cards → captions → recap → FX.
export const Reel = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Backdrop />
    <Speaker />
    <NameTag />
    <Clock />
    <HookTitle />
    <Beats />
    <Captions />
    <Recap />
    <Flash />
    <Grain />
    <Audio src={staticFile("mix.wav")} />
  </AbsoluteFill>
);
