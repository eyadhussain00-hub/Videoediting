import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Backdrop, C, Check, ease, Fonts, HEAD, SceneOut, Sfx, sheen, Stage, UI, useSpring, useT} from '../kit';

export const HALAL = {start: 3.3, end: 6.3};

// Eight-point star (rub el hizb): two overlapping squares.
const Star: React.FC<{p: number; size: number}> = ({p, size}) => {
  const sq = (rot: number) => (
    <rect x={-70} y={-70} width={140} height={140} transform={`rotate(${rot})`} fill="none" stroke={C.gold} strokeWidth={4}
      strokeDasharray={560} strokeDashoffset={560 * (1 - p)} strokeLinejoin="round" />
  );
  return (
    <svg width={size} height={size} viewBox="-110 -110 220 220" style={{position: 'absolute', filter: `drop-shadow(0 0 18px ${C.gold}66)`}}>
      {sq(0)}
      {sq(45)}
      <circle r={52} fill="rgba(8,12,10,0.75)" stroke={C.line} strokeWidth={2} opacity={p} />
    </svg>
  );
};

export const HalalRule: React.FC<{bg?: boolean}> = ({bg}) => {
  const {frame, at} = useT(HALAL.start);
  const chip = useSpring(at(4.1));
  const star = ease(frame, at(4.6), at(5.4));
  const word = useSpring(at(5.45), {damping: 9, stiffness: 260});
  const stamp = ease(frame, at(5.75), at(6.05));
  const rot = ease(frame, at(4.6), at(6.3), -30, 0);
  return (
    <AbsoluteFill>
      <Fonts />
      <Backdrop show={bg} />
      <SceneOut end={at(HALAL.end)}>
        <Stage top={1090}>
          <div style={{opacity: chip, transform: `scale(${0.8 + 0.2 * chip})`, fontFamily: UI, fontWeight: 800, fontSize: 36, letterSpacing: 8,
            color: C.ink, background: C.gold, padding: '12px 30px', borderRadius: 999}}>RULE #1</div>
          <div style={{position: 'relative', width: 560, height: 560, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `rotate(${rot}deg)`}}>
            <Star p={star} size={560} />
            <div style={{fontFamily: HEAD, fontSize: 150, letterSpacing: 4, transform: `rotate(${-rot}deg) scale(${0.4 + 0.6 * word})`, opacity: word, ...sheen(frame, at(5.5), 22),
              filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.7))'}}>HALAL</div>
            <div style={{position: 'absolute', right: 40, bottom: 70, transform: `rotate(${-rot}deg) scale(${1.6 - 0.6 * stamp})`, opacity: stamp}}>
              <Check size={110} progress={stamp} />
            </div>
          </div>
        </Stage>
      </SceneOut>
      <Sfx at={at(4.1)} src="Pop.mp3" volume={0.22} />
      <Sfx at={at(4.6)} src="transitions.mp3" volume={0.3} />
      <Sfx at={at(5.75)} src="Impact.mp3" volume={0.28} />
    </AbsoluteFill>
  );
};
