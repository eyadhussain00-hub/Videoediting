import { AbsoluteFill, Easing, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { mockups } from "../config/mockups";
import { fontFor } from "./fonts";
import { Background } from "./parts/Background";
import { Captions } from "./parts/Captions";
import { Device, type Placement } from "./parts/Device";
import { EndCard } from "./parts/EndCard";
import { Intro } from "./parts/Intro";
import { TelegramCard } from "./parts/TelegramCard";
import { sources } from "./sources";
import { isRtl, type Lang } from "./theme";
import type { Timeline } from "./timeline";

export type DemoAdProps = { source: string; lang: Lang; timeline: Timeline | null };

const W = 1920;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// The ad: an opening line, the laptop landing with the desktop recording, the laptop sliding out as the
// phone slides in with the mobile recording, and an end card. Everything is timed by the timeline, which
// comes from the storyboard and the recorder's cue sheets (see Root.tsx).
export function DemoAd({ source, lang, timeline }: DemoAdProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!timeline) return null;
  const { captions } = sources[source];
  const rtl = isRtl(lang);
  const { laptop, phone, transition: T, end } = timeline;

  // The laptop fills the width under the captions; the phone stands to one side of its caption, on the
  // side a reader of that language finishes on.
  const laptopScale = 0.84;
  const laptopPlace: Placement = { left: (W - mockups.laptop.width * laptopScale) / 2, top: 196, scale: laptopScale };
  const phonePlace: Placement = { left: (rtl ? W * 0.34 : W * 0.66) - mockups.phone.width / 2, top: 100, scale: 1 };

  // In: rises from below and tips back upright. Out: slides away towards where the story came from, as the
  // phone arrives from where it's going — left to right in English, right to left in Arabic.
  const away = rtl ? 1 : -1;
  const landing = spring({ frame: frame - laptop.from, fps, config: { damping: 17, stiffness: 85, mass: 0.9 } });
  const leaving = interpolate(frame, [T.from, T.from + T.frames], [0, 1], { ...clamp, easing: Easing.bezier(0.55, 0, 0.8, 0.3) });
  const arriving = spring({ frame: frame - T.from, fps, config: { damping: 16, stiffness: 75, mass: 0.9 } });
  const closing = interpolate(frame, [end.from - 4, end.from + 12], [0, 1], clamp);

  const showLaptop = frame >= laptop.from && frame < T.from + T.frames;
  const showPhone = frame >= T.from && frame < end.from + 12;

  return (
    <AbsoluteFill lang={lang} dir={rtl ? "rtl" : "ltr"} style={{ fontFamily: fontFor(lang) }}>
      <Background />

      <Sequence from={timeline.intro.from} durationInFrames={timeline.intro.frames + 6}>
        <Intro captions={captions} lang={lang} frames={timeline.intro.frames + 6} />
      </Sequence>

      {showLaptop && (
        <Device
          kind="laptop"
          track={laptop.track}
          trackFrom={laptop.from}
          place={laptopPlace}
          tail={T.frames}
          style={{
            opacity: Math.min(1, landing * 1.4),
            transform:
              `perspective(2600px) translateX(${away * leaving * 2200}px) translateY(${(1 - landing) * 180}px) ` +
              `rotateX(${(1 - landing) * 18}deg) rotateY(${away * leaving * -14}deg) scale(${0.9 + 0.1 * landing})`,
          }}
        />
      )}

      {showPhone && (
        <Device
          kind="phone"
          track={phone.track}
          trackFrom={phone.from}
          place={phonePlace}
          tail={14}
          style={{
            opacity: 1 - closing,
            transform:
              `perspective(2600px) translateX(${-away * (1 - arriving) * 1500}px) rotateY(${away * (1 - arriving) * 16}deg) ` +
              `scale(${1 - closing * 0.06})`,
          }}
        />
      )}

      <Captions timeline={timeline} text={captions} lang={lang} />

      {timeline.telegram.map((t, i) => {
        const onPhone = t.device === "phone";
        const left = onPhone
          ? rtl ? phonePlace.left - 420 : phonePlace.left + mockups.phone.width + 30
          : rtl ? W - 60 - 390 : 60;
        const sheet = onPhone ? phone.track.sheet : laptop.track.sheet;
        return (
          <Sequence key={i} from={t.from} durationInFrames={Math.round(3.6 * fps)} layout="none">
            <TelegramCard sheet={sheet} text={captions} lang={lang} frames={Math.round(3.6 * fps)} position={{ left, top: onPhone ? 170 : 300 }} />
          </Sequence>
        );
      })}

      <Sequence from={end.from} durationInFrames={end.frames}>
        <EndCard text={captions} lang={lang} />
      </Sequence>
    </AbsoluteFill>
  );
}
