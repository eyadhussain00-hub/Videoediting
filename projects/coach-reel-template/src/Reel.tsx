import React from "react";
import { AbsoluteFill } from "remotion";
import "./fonts";
import { ReelContext } from "./theme";
import type { ReelProps } from "./types";
import { Footage } from "./Footage";
import { Captions } from "./Captions";
import { ChapterRail, Finish, HookTag, SpeakerChip } from "./Overlays";
import { SectionCard } from "./SectionCard";
import { EndCard } from "./EndCard";

export const Reel: React.FC<ReelProps> = (props) => (
  <ReelContext.Provider value={props}>
    <AbsoluteFill style={{ background: props.theme.bg }}>
      <Footage />
      {props.cards.map((c) => (
        <SectionCard key={c.n} card={c} />
      ))}
      <HookTag />
      <SpeakerChip />
      <ChapterRail />
      <Captions />
      <EndCard />
      <Finish />
    </AbsoluteFill>
  </ReelContext.Provider>
);
