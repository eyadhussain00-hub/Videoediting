import { AbsoluteFill, Audio, staticFile } from "remotion";
import "./fonts";
import { Captions, Footage, Grain, Shade } from "./scenes/base";
import { BehindType, BgDim, Dawn, NightSky, Person, Rays, Snow } from "./scenes/depth";
import { ChromaKick, Flares, FrostEdges, LightLeaks, Letterbox } from "./scenes/fx";
import { StepTracker, TitleLockup } from "./scenes/hud";
import { CTA, Choice, Features, Flash, Momentum, Offer, Payoff } from "./scenes/offer";
import { NonNegotiables, StepCards } from "./scenes/steps";

// Back to front: plate → pushed-back wall → sky, dawn, light, snow and type behind him → the speaker → grade →
// graphics → captions → front snow → light FX → letterbox → grain.
export const Reel = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Footage />
    <BgDim />
    <NightSky />
    <Dawn />
    <Rays />
    <Snow />
    <BehindType />
    <Person />
    <Shade />
    <TitleLockup />
    <StepTracker />
    <StepCards />
    <NonNegotiables />
    <Payoff />
    <Offer />
    <Features />
    <Choice />
    <Momentum />
    <CTA />
    <Captions />
    <Snow front />
    <FrostEdges />
    <LightLeaks />
    <Flares />
    <ChromaKick />
    <Flash />
    <Letterbox />
    <Grain />
    <Audio src={staticFile("mix.wav")} />
  </AbsoluteFill>
);
