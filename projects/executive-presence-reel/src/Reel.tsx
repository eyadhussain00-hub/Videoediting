import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { camAt, ORIGIN } from "./camera";
import { FPS, SRC_END, P, E, clamp01, win } from "./theme";
import { Captions } from "./scenes/Captions";
import { TopChip, BehindClarity } from "./scenes/Hook";
import { Chaos } from "./scenes/Chaos";
import { QuoteCards } from "./scenes/QuoteCards";
import { TitleBehind, TitleFront } from "./scenes/Title";
import { Tangle, Nods } from "./scenes/Tangle";
import { Badge } from "./scenes/Badge";
import { Benefits } from "./scenes/Benefits";
import { Steps } from "./scenes/Steps";
import { OutroBehind } from "./scenes/Outro";
import { EndCard } from "./scenes/EndCard";
import { Grain } from "./scenes/Grain";

// Windows where the cut-out subject is layered over "behind" graphics.
const FG: [number, number][] = [[2.5, 4.3], [22.2, 28.4], [59.4, 63.0]];

/** how much the background (not the subject) is dimmed */
const dimAt = (t: number) =>
  0.38 * win(t, 2.8, 4.25, 0.3, 0.3) + 0.62 * win(t, 22.6, 28.2, 1.6, 0.6) + 0.32 * win(t, 59.8, 62.9, 0.8, 0.5);

export const Reel: React.FC<{ audio: boolean; fg?: boolean }> = ({ audio, fg = true }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const cam = camAt(t);
  const chaosDesat = win(t, 4.4, 8.3, 0.5, 0.4);
  const outBlur = P(t, SRC_END - 0.45, 0.45, E.inCubic);
  const camStyle: React.CSSProperties = {
    position: "absolute", inset: 0,
    transformOrigin: `${ORIGIN.x}px ${ORIGIN.y}px`,
    transform: `translate(${cam.dx}px, ${cam.dy}px) rotate(${cam.rot}deg) scale(${cam.scale})`,
    filter: `contrast(1.07) saturate(${1.04 - 0.3 * chaosDesat}) brightness(0.98) blur(${outBlur * 14}px)`,
  };
  const dim = dimAt(t);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Sequence durationInFrames={Math.round(SRC_END * FPS)}>
        <div style={camStyle}>
          <OffthreadVideo src={staticFile("clean.mp4")} muted style={{ width: 1080, height: 1920 }} />
          {dim > 0.001 && <AbsoluteFill style={{ background: `rgba(6,4,3,${dim})` }} />}
          <OutroBehind t={t} />
          <BehindClarity t={t} />
          <TitleBehind t={t} />
          {fg && FG.map(([a, b]) => (
            <Sequence key={a} from={Math.round(a * FPS)} durationInFrames={Math.round((b - a) * FPS)} layout="none">
              <OffthreadVideo src={staticFile("fg.webm")} transparent muted startFrom={Math.round(a * FPS)}
                style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920 }} />
            </Sequence>
          ))}
        </div>
      </Sequence>

      {/* finishing: vignette + text-safe gradient */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 60% at 50% 38%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 14%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.38) 100%)" }} />

      <TopChip t={t} />
      <Chaos t={t} />
      <QuoteCards t={t} />
      <TitleFront t={t} />
      <Tangle t={t} />
      <Nods t={t} />
      <Badge t={t} />
      <Benefits t={t} />
      <Steps t={t} />
      <Captions t={t} />

      {t >= SRC_END - 0.05 && <EndCard t={t} />}
      <Grain f={f} />
      {audio && <Audio src={staticFile("mix.wav")} />}
    </AbsoluteFill>
  );
};
