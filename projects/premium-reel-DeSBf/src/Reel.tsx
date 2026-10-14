import { AbsoluteFill, Audio, staticFile } from "remotion";
import "./fonts";
import { Captions, Footage, Grain, Shade } from "./scenes/base";
import { BehindType, BgDim, Dust, Person, Rays } from "./scenes/depth";
import { ChromaKick, Flares, Flash, Letterbox, LightLeaks } from "./scenes/fx";
import {
  AttentionVs, ChapterTag, EffortResult, FollowCopyRespect, Lever, MillionCounter, Playbooks, Reticle, SignOff,
  SpeakWriteSeen, StrategyLeverage, SunClock, ThreeThings, Tracker,
} from "./scenes/graphics";

// Back to front: plate → pushed-back background → light, dust and type behind him → the speaker → grade →
// graphics → captions → light FX → letterbox → flash/fades → grain.
export const Reel = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Footage />
    <BgDim />
    <Rays />
    <Dust />
    <BehindType />
    <Person />
    <Shade />
    <Tracker />
    <MillionCounter />
    <ThreeThings />
    <ChapterTag />
    <FollowCopyRespect />
    <Playbooks />
    <SunClock />
    <EffortResult />
    <StrategyLeverage />
    <Reticle />
    <Lever />
    <AttentionVs />
    <SpeakWriteSeen />
    <SignOff />
    <Captions />
    <Dust front />
    <LightLeaks />
    <Flares />
    <ChromaKick />
    <Letterbox />
    <Flash />
    <Grain />
    <Audio src={staticFile("mix.wav")} />
  </AbsoluteFill>
);
