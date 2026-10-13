import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import "./fonts";
import { FPS, T } from "./data";
import { Captions, Footage, Grain, Shade } from "./scenes/base";
import { SectionCard, Notifications } from "./scenes/card";
import { Collage } from "./scenes/collage";
import { CTA } from "./scenes/cta";
import { FiveList } from "./scenes/list";
import { Proof } from "./scenes/proof";
import { prog } from "./ui";

const Flash = () => {
  const t = useCurrentFrame() / FPS;
  const a = Math.max(
    (1 - prog(t, T.look, 0.25)) * (t >= T.look ? 0.75 : 0),
    (1 - prog(t, T.million + 0.1, 0.3)) * (t >= T.million + 0.1 ? 0.35 : 0),
  );
  return <AbsoluteFill style={{ background: "#FFF6E6", opacity: a, mixBlendMode: "screen" }} />;
};

export const Reel = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Footage />
    <Shade />
    <FiveList />
    <SectionCard />
    <Notifications />
    <Proof />
    <CTA />
    <Captions />
    <Collage />
    <Flash />
    <Grain />
    <Audio src={staticFile("mix.wav")} />
  </AbsoluteFill>
);
