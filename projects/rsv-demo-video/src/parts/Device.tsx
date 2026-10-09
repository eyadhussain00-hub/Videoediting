import type { CSSProperties } from "react";
import { AbsoluteFill, Easing, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { mockups } from "../../config/mockups";
import type { BuiltClip, Rect, Track } from "../timeline";

// A device frame with the recording playing inside its screen, and a camera that pushes softly into the
// part of the screen each moment is about. The zoom targets are the screen areas the recorder saved, so
// the camera follows the real interface rather than guessed coordinates.

export type Placement = { left: number; top: number; scale: number };

type Cam = { cx: number; cy: number; s: number };
const smooth = Easing.bezier(0.45, 0, 0.2, 1);
const lerp = (a: Cam, b: Cam, t: number): Cam => ({ cx: a.cx + (b.cx - a.cx) * t, cy: a.cy + (b.cy - a.cy) * t, s: a.s + (b.s - a.s) * t });

// Frame geometry for one device: the recording's size, how much it is scaled on screen, and the frame
// point the camera centres on.
type Geo = { W: number; H: number; k: number; ax: number; ay: number };
const FRAME = { w: 1920, h: 1080 };

// Where to push: centred on the focus area, then slid back so the screen still fills the frame. When a
// soft push leaves the screen smaller than the frame, it stays whole inside the frame instead, so one
// side is never left empty.
function target(rect: Rect, scale: number | undefined, g: Geo): Cam {
  const s = scale ?? Math.min(1.9, Math.max(1, Math.min((0.8 * g.W) / rect.w, (0.75 * g.H) / rect.h)));
  const fit = (want: number, size: number, anchor: number, frame: number) => {
    const low = anchor / (g.k * s);
    const high = size - (frame - anchor) / (g.k * s);
    return Math.min(Math.max(low, high), Math.max(Math.min(low, high), want));
  };
  return {
    cx: fit(rect.x + rect.w / 2, g.W, g.ax, FRAME.w),
    cy: fit(rect.y + rect.h / 2, g.H, g.ay, FRAME.h),
    s,
  };
}

function camera(clip: BuiltClip | undefined, local: number, g: Geo, fps: number): Cam {
  const { W, H } = g;
  const rest: Cam = { cx: W / 2, cy: H / 2, s: 1 };
  if (!clip || !clip.zooms.length) return rest;
  const ramp = Math.round(0.7 * fps);
  const release = Math.round(0.45 * fps);
  let from = rest;
  let state = rest;
  for (const z of clip.zooms) {
    if (local < z.frame) break;
    const to = target(z.rect, z.scale, g);
    state = lerp(from, to, smooth(Math.min(1, (local - z.frame) / ramp)));
    from = to;
  }
  // Ease back out before the cut, so clips always meet at the full-screen view.
  const tail = clip.frames - local;
  return tail < release ? lerp(rest, state, smooth(Math.max(0, tail / release))) : state;
}

export function Device({
  kind,
  track,
  trackFrom,
  place,
  tail,
  style,
}: {
  kind: "laptop" | "phone";
  track: Track;
  trackFrom: number;
  place: Placement;
  // Frames the last clip keeps playing after the track ends, while the device leaves the frame.
  tail: number;
  style?: CSSProperties;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const m = mockups[kind];
  const { sheet } = track;
  const W = sheet.width;
  const H = sheet.height;

  // Where the screen sits in the frame, and how much the recording is scaled to fill it.
  const x0 = place.left + m.screen.x * place.scale;
  const y0 = place.top + m.screen.y * place.scale;
  const k = (m.screen.w * place.scale) / W;

  const anchor = { x: x0 + (W * k) / 2, y: y0 + (H * k) / 2 };
  const local = frame - trackFrom;
  const clip = track.clips.find((c) => local >= c.from && local < c.from + c.frames);
  const cam = camera(clip, clip ? local - clip.from : 0, { W, H, k, ax: anchor.x, ay: anchor.y }, fps);
  const focus = { x: x0 + cam.cx * k, y: y0 + cam.cy * k };
  const last = track.clips[track.clips.length - 1];

  return (
    <AbsoluteFill style={style}>
      <AbsoluteFill
        style={{
          transformOrigin: "0 0",
          transform: `translate(${anchor.x - focus.x * cam.s}px, ${anchor.y - focus.y * cam.s}px) scale(${cam.s})`,
        }}
      >
        {/* A shadow on its own layer, so it can't fall across the screen through the transparent hole. */}
        <div
          style={{
            position: "absolute", left: place.left + 20, top: place.top + 30,
            width: m.width * place.scale - 40, height: m.height * place.scale - 40,
            borderRadius: kind === "phone" ? 70 : 30, boxShadow: "0 50px 120px rgba(0,0,0,0.65), 0 18px 40px rgba(0,0,0,0.4)",
          }}
        />
        <div
          style={{
            position: "absolute", left: x0, top: y0, width: W, height: H, overflow: "hidden",
            transformOrigin: "0 0", transform: `scale(${k})`, background: "#f7f8fa",
          }}
        >
          {track.clips.flatMap((c) =>
            c.pieces.map((p, i) => {
              const isLast = c === last && i === c.pieces.length - 1;
              return (
                <Sequence
                  key={`${c.from}-${i}`}
                  from={trackFrom + c.from + p.outFrom}
                  durationInFrames={p.frames + (isLast ? tail : 0)}
                  layout="none"
                >
                  <OffthreadVideo
                    src={staticFile(`recordings/${sheet.video}`)}
                    trimBefore={Math.round(p.srcFrom * fps)}
                    playbackRate={c.speed}
                    muted
                    style={{ position: "absolute", left: 0, top: 0, width: W, height: H }}
                  />
                </Sequence>
              );
            }),
          )}
        </div>
        <Img
          src={staticFile(m.src)}
          style={{ position: "absolute", left: place.left, top: place.top, width: m.width * place.scale, height: m.height * place.scale }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
