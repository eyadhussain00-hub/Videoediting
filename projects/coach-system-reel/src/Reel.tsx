import React from "react";
import { AbsoluteFill } from "remotion";
import "./fonts";
import { C } from "./theme";
import TL from "./timeline.json";
import { Footage } from "./Footage";
import { Captions } from "./Captions";
import { ChapterRail, Finish, HookTag } from "./Overlays";
import { OldWay } from "./scenes/OldWay";
import { System } from "./scenes/System";
import { SectionCard } from "./scenes/SectionCard";
import { Niche } from "./scenes/Niche";
import { Numbers } from "./scenes/Numbers";
import { SplitGround, SplitPanel } from "./scenes/SplitPanel";
import { Funnel } from "./scenes/Funnel";
import { EndCard } from "./scenes/EndCard";

const S = TL.scenes;

export const Reel: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    <SplitGround />
    <Footage />
    <SplitPanel />

    <OldWay />
    <System />
    <Niche />
    <Numbers />
    <Funnel />

    <SectionCard
      from={S.card1[0]}
      to={S.card1[1]}
      n="01"
      lines={[
        { text: "Niche", at: 16.42 },
        { text: "down.", at: 16.62 },
      ]}
      sub="Speak to one person."
      subAt={16.95}
    />
    <SectionCard
      from={S.card2[0]}
      to={S.card2[1]}
      n="02"
      size={150}
      lines={[
        { text: "Know your", at: 25.72 },
        { text: "numbers.", at: 25.84 },
      ]}
      sub="Precision over guesswork."
      subAt={26.0}
    />
    <SectionCard
      from={S.card3[0]}
      to={S.card3[1]}
      n="03"
      lines={[
        { text: "Social", at: 42.34 },
        { text: "funnel.", at: 42.64 },
      ]}
      sub="Ads → DMs → clients."
      subAt={42.95}
    />

    <HookTag />
    <ChapterRail />
    <Captions />
    <EndCard />
    <Finish />
  </AbsoluteFill>
);
