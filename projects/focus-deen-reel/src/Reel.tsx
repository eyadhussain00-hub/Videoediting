import { AbsoluteFill, Audio, staticFile } from "remotion";
import "./fonts";
import { BgDim, Captions, Footage, Grain, Person, Shade } from "./scenes/base";
import { AppStore, EndCard, LinkInBio } from "./scenes/cta";
import { FocusType, Reticle } from "./scenes/focus";
import { Flash, LightLeaks } from "./scenes/fx";
import { Blueprint, GuessWhat, HookLock, Notification, PrayForUs, RightSticker } from "./scenes/hook";
import { AppsBlock, CoralWorld, HeartPeek, Lockup } from "./scenes/world";

// Back to front: room (soft-focus in the focus beat) → dim → coral world, blueprint, type behind him, peeking mascot →
// the speaker → grade → graphics → captions → light FX → end card → grain.
export const Reel = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Footage />
    <BgDim />
    <CoralWorld />
    <Blueprint />
    <PrayForUs />
    <FocusType />
    <HeartPeek />
    <Person />
    <Shade />
    <HookLock />
    <Notification />
    <GuessWhat />
    <Lockup />
    <AppsBlock />
    <Reticle />
    <AppStore />
    <LinkInBio />
    <RightSticker />
    <Captions />
    <LightLeaks />
    <Flash />
    <EndCard />
    <Grain />
    <Audio src={staticFile("mix.wav")} />
  </AbsoluteFill>
);
