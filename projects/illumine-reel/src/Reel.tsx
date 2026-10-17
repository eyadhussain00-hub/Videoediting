import { AbsoluteFill, Audio, staticFile } from "remotion";
import "./fonts";
import { BgDim, Captions, Footage, Grain, Person, Shade } from "./scenes/base";
import { Flash, LightLeaks } from "./scenes/fx";
import { Acronym, BothBehind, Donut, EndCard, Follow, IsaAllowance, IsaList, SippAllowance, SippList, TaxFreeStamp, TaxRelief, TheCatch, Timeline } from "./scenes/heroes";
import { ChapterBar, GlassLock, GlassTags, TitleBehind } from "./scenes/hook";

// Back to front: room → dim → type behind him (ISA vs SIPP, BOTH.) → the speaker → grade → glass tags + lock →
// right-hand graphics (heroes, checklists, timeline, follow) → chapter bar → captions → light FX → end card → grain.
export const Reel = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Footage />
    <BgDim />
    <TitleBehind />
    <BothBehind />
    <Person />
    <Shade />
    <GlassTags />
    <GlassLock />
    <IsaAllowance />
    <IsaList />
    <TaxFreeStamp />
    <Acronym />
    <SippAllowance />
    <TaxRelief />
    <SippList />
    <TheCatch />
    <Donut />
    <Timeline />
    <Follow />
    <ChapterBar />
    <Captions />
    <LightLeaks />
    <Flash />
    <EndCard />
    <Grain />
    <Audio src={staticFile("mix.wav")} />
  </AbsoluteFill>
);
