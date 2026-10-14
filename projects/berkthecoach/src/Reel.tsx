import { AbsoluteFill, Audio, staticFile } from "remotion";
import "./fonts";
import { Captions } from "./scenes/captions";
import { Behind } from "./scenes/depth";
import { Front } from "./scenes/front";
import { Flares, Grain, LightLeaks, Motes, Vignette } from "./scenes/fx";
import { Backdrop, Footage, Person, WindowEdge, WindowShadow } from "./scenes/stage";

// Back to front: backdrop (blurred plate, star lattice) → window shadow → plate in the window → frame edge →
// type behind him → the speaker (breaking out of the window in the hook and finale) → front graphics → captions
// → light → grain.
export const Reel = () => (
  <AbsoluteFill style={{ background: "#07060A" }}>
    <Backdrop />
    <WindowShadow />
    <Footage />
    <WindowEdge />
    <Behind />
    <Person />
    <Motes />
    <Front />
    <Captions />
    <LightLeaks />
    <Flares />
    <Vignette />
    <Grain />
    <Audio src={staticFile("mix.wav")} />
  </AbsoluteFill>
);
