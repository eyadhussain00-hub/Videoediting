import { AbsoluteFill, Audio, staticFile } from "remotion";
import "./fonts";
import { Accents } from "./scenes/accents";
import { BgDim, Captions, Footage, Grain, Person, Shade } from "./scenes/base";
import { ChapterCards, ProgressRail } from "./scenes/chapters";
import { Flash, LightLeaks, RecapDim } from "./scenes/fx";
import { HookArabic, HookBehind, HookFront } from "./scenes/hook";
import { EndCard, Recap } from "./scenes/outro";
import { PatternWorld } from "./scenes/pattern";
import { RefCards } from "./scenes/refs";

// Back to front: room (soft-focus during quotes) → dim → emerald pattern world and the hook's "7"/رزق behind him →
// the speaker → grade → titles, rail, source cards, accents, captions → recap → chapter cards → light FX → end card.
export const Reel = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Footage />
    <BgDim />
    <PatternWorld />
    <HookBehind />
    <Person />
    <Shade />
    <HookFront />
    <HookArabic />
    <ProgressRail />
    <RefCards />
    <Accents />
    <Captions />
    <RecapDim />
    <Recap />
    <ChapterCards />
    <LightLeaks />
    <Flash />
    <EndCard />
    <Grain />
    <Audio src={staticFile("mix.wav")} />
  </AbsoluteFill>
);
