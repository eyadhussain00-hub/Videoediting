import { AbsoluteFill, Audio, staticFile } from "remotion";
import { Captions } from "./Captions";
import { Footage } from "./Footage";
import { loadFonts } from "./fonts";
import { Flashes, Grade, Grain, Letterbox, LightLeaks } from "./Overlays";
import { Flight, Give, Hook, Kicker, SameTiles } from "./scenes/Act1";
import { Changes, Emotions, End, GameHud, MindReality, Pedestal } from "./scenes/Act2";

loadFonts();

export const Reel = () => (
  <AbsoluteFill style={{ backgroundColor: "#05070c" }}>
    <Footage />
    <Grade />
    <LightLeaks />
    <Hook />
    <Kicker />
    <SameTiles />
    <Give />
    <Flight />
    <Changes />
    <GameHud />
    <Pedestal />
    <MindReality />
    <Emotions />
    <Captions />
    <End />
    <Letterbox />
    <Flashes />
    <Grain />
    <Audio src={staticFile("mix.wav")} />
  </AbsoluteFill>
);
