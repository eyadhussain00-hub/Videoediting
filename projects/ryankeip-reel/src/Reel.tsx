import { AbsoluteFill, Audio, staticFile } from "remotion";
import { T } from "./data";
import "./fonts";
import { BgDim, Captions, Footage, Grain, Person, Shade } from "./scenes/base";
import { Flash, LightLeaks } from "./scenes/fx";
import { CallBar, HeatType, Promise as PromiseCard, SaveShare, Symptoms, Threat, ThreatType } from "./scenes/hook";
import { Boom, CallFlow, Definition, FightFlightTag, FightFlightType, ModeFlip, Prediction, Trouble, Vitals } from "./scenes/mid";
import { Discovery, EndCard, Finale, Recognize, Redirect, Regulate, Remember, StepTags, ThreeSteps } from "./scenes/steps";
import { win } from "./ui";

/** How dark the room gets behind type that sits behind him. */
const dimAt = (t: number) =>
  Math.max(
    0.4 * win(t, T.heat - 0.15, T.palms + 0.1, 0.2, 0.3),
    0.42 * win(t, T.threat - 0.1, T.psychological - 0.05, 0.2, 0.3),
    0.45 * win(t, T.fight - 0.08, T.anticipatory - 0.1, 0.15, 0.3),
    0.35 * win(t, T.elite - 0.12, T.end, 0.6, 0.1),
  );

// Back to front: room → dim → type behind him → the speaker → grade → HUD graphics → captions → light FX → end card → grain.
export const Reel = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Footage />
    <BgDim a={dimAt} />
    <HeatType />
    <ThreatType />
    <FightFlightType />
    <Person />
    <Shade />
    <CallBar />
    <Symptoms />
    <Threat />
    <PromiseCard />
    <SaveShare />
    <CallFlow />
    <Boom />
    <FightFlightTag />
    <Definition />
    <Prediction />
    <Vitals />
    <Trouble />
    <ModeFlip />
    <ThreeSteps />
    <StepTags />
    <Recognize />
    <Regulate />
    <Redirect />
    <Discovery />
    <Remember />
    <Finale />
    <Captions />
    <LightLeaks />
    <Flash />
    <EndCard />
    <Grain />
    <Audio src={staticFile("mix.wav")} />
  </AbsoluteFill>
);
