import { AbsoluteFill, Audio, staticFile } from "remotion";
import "./fonts";
import { BgDim, Captions, Footage, Grain, Person, Shade } from "./scenes/base";
import { Checkout, Definition, EndCard, Flash, HookTitle, LightLeaks, Price, Reasons, Refund, Roles, Threshold } from "./scenes/graphics";

// Back to front: wall + board → dim → hook title (behind his head) → speaker → grade → cards → captions → FX → end card.
export const Reel = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Footage />
    <BgDim />
    <HookTitle />
    <Person />
    <Shade />
    <Definition />
    <Price />
    <Threshold />
    <Checkout />
    <Reasons />
    <Refund />
    <Roles />
    <Captions />
    <LightLeaks />
    <Flash />
    <EndCard />
    <Grain />
    <Audio src={staticFile("mix.wav")} />
  </AbsoluteFill>
);
