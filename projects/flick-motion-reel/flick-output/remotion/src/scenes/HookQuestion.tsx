import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Backdrop, C, Fonts, HEAD, SceneOut, Sfx, sheen, Stage, useSpring, useT} from '../kit';

export const HOOK = {start: 0, end: 3.3};

const Line: React.FC<{text: string; f: number; gold?: boolean; size?: number}> = ({text, f, gold, size = 132}) => {
  const {frame} = useT(HOOK.start);
  const s = useSpring(f, {damping: 11, stiffness: 220});
  return (
    <div
      style={{
        fontFamily: HEAD,
        fontSize: size,
        lineHeight: 1.02,
        letterSpacing: 2,
        textTransform: 'uppercase',
        color: C.white,
        opacity: Math.min(1, s * 1.5),
        transform: `translateY(${(1 - s) * 90}px) scale(${0.7 + 0.3 * s}) rotate(${(1 - s) * -4}deg)`,
        textShadow: gold ? 'none' : '0 10px 30px rgba(0,0,0,0.6)',
        ...(gold ? sheen(frame, f + 4, 20) : {}),
        filter: gold ? 'drop-shadow(0 10px 30px rgba(0,0,0,0.6))' : undefined,
      }}
    >
      {text}
    </div>
  );
};

export const HookQuestion: React.FC<{bg?: boolean}> = ({bg}) => {
  const {at} = useT(HOOK.start);
  const end = at(HOOK.end);
  return (
    <AbsoluteFill>
      <Fonts />
      <Backdrop show={bg} />
      <SceneOut end={end}>
        <Stage top={1180}>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4}}>
            <Line text="The best" f={at(0.7)} size={96} />
            <Line text="business model" f={at(1.26)} />
            <Line text="for Muslims?" f={at(2.5)} gold size={150} />
          </div>
        </Stage>
      </SceneOut>
      <Sfx at={at(0.7)} src="Pop.mp3" volume={0.22} />
      <Sfx at={at(1.26)} src="Pop.mp3" volume={0.25} />
      <Sfx at={at(2.5)} src="Impact.mp3" volume={0.22} />
    </AbsoluteFill>
  );
};
