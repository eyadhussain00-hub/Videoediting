import { AbsoluteFill, Audio, staticFile } from "remotion";
import "./fonts";
import { BgDim, Captions, Footage, Grain, Person, Shade } from "./scenes/base";
import { HookType, Network, NumberOne, Years } from "./scenes/behind";
import { EndCard } from "./scenes/end";
import { Bubbles, ChargeCard, ClientTicket, Disagree, Happy, HelpLink, Invoice, Journey, Kickers, Referrals, Relationship, YearRuler } from "./scenes/front";
import { Dust, Flash, LightLeaks } from "./scenes/fx";

// Back to front: room → dim → type and the referral network behind him → the speaker → grade → cards → captions →
// light FX → end card → grain.
export const Reel = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Footage />
    <BgDim />
    <NumberOne />
    <Years />
    <Network />
    <Person />
    <Shade />
    <HookType />
    <Kickers />
    <ChargeCard />
    <HelpLink />
    <ClientTicket />
    <Invoice />
    <Bubbles />
    <Disagree />
    <Relationship />
    <Happy />
    <YearRuler />
    <Referrals />
    <Journey />
    <Captions />
    <Dust />
    <LightLeaks />
    <Flash />
    <EndCard />
    <Grain />
    <Audio src={staticFile("mix.wav")} />
  </AbsoluteFill>
);
