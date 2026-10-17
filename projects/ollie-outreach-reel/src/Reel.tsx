import { AbsoluteFill, Audio, staticFile } from "remotion";
import "./fonts";
import { T } from "./data";
import { BgDim, Captions, Footage, Grain, Person, Shade } from "./scenes/base";
import { EndCard } from "./scenes/close";
import { ChapterRail, Flash, LightLeaks } from "./scenes/fx";
import { AgeBlock, HookMoney, MonthsAgo, PlaybookChip, SkillCard } from "./scenes/hook";
import { DmCard } from "./scenes/message";
import { GoalChip, OutreachHub, Streak } from "./scenes/outreach";

// Back to front: footage → $5K behind him → the speaker (hook only) → grade → dim under card-heavy beats →
// graphics → chapter rail → captions → light FX → end card → grain.
export const Reel = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Footage />
    <HookMoney />
    <Person />
    <Shade />
    <BgDim
      windows={[
        [T.outreaching, T.way1, 0.22],
        [T.structured, T.tips, 0.3],
      ]}
    />
    <PlaybookChip />
    <MonthsAgo />
    <SkillCard />
    <AgeBlock />
    <GoalChip />
    <Streak />
    <OutreachHub />
    <DmCard />
    <ChapterRail />
    <Captions />
    <LightLeaks />
    <Flash />
    <EndCard />
    <Grain />
    <Audio src={staticFile("mix.wav")} />
  </AbsoluteFill>
);
