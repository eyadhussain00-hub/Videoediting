import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Backdrop, C, Check, ease, Fonts, Glass, Kicker, SceneOut, Sfx, Stage, UI, useSpring, useT} from '../kit';

export const GURU = {start: 6.3, end: 15.5};

const Icon: React.FC<{kind: 'box' | 'coin' | 'link'}> = ({kind}) => (
  <svg width={70} height={70} viewBox="0 0 48 48" fill="none" stroke={C.gold} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    {kind === 'box' && (<><path d="M6 15 L24 6 L42 15 L42 34 L24 43 L6 34 Z" /><path d="M6 15 L24 24 L42 15 M24 24 L24 43" /></>)}
    {kind === 'coin' && (<><circle cx="24" cy="24" r="18" /><path d="M19 15 L19 33 M19 15 H27 a5 5 0 0 1 0 9 H19 M19 24 H28 a5 5 0 0 1 0 9 H19 M22 11 V15 M22 33 V37" /></>)}
    {kind === 'link' && (<><path d="M20 28 L28 20" /><path d="M22 14 l4-4 a8 8 0 0 1 12 12 l-4 4" /><path d="M26 34 l-4 4 a8 8 0 0 1 -12 -12 l4 -4" /></>)}
  </svg>
);

const Card: React.FC<{label: string; kind: 'box' | 'coin' | 'link'; f: number; check: number; i: number}> = ({label, kind, f, check, i}) => {
  const {frame} = useT(GURU.start);
  const s = useSpring(f, {damping: 13, stiffness: 190});
  const c = ease(frame, check, check + 10);
  const float = Math.sin((frame + i * 20) / 18) * 4;
  return (
    <Glass style={{width: 900, padding: '26px 36px', display: 'flex', alignItems: 'center', gap: 30, opacity: s,
      transform: `translateX(${(1 - s) * (i % 2 ? 700 : -700)}px) rotate(${(1 - s) * (i % 2 ? 8 : -8)}deg) translateY(${float}px)`}}>
      <Icon kind={kind} />
      <div style={{flex: 1, fontFamily: UI, fontWeight: 800, fontSize: 58, color: C.white, letterSpacing: -0.5}}>{label}</div>
      <div style={{opacity: c, transform: `scale(${1.5 - 0.5 * c})`}}><Check size={64} progress={c} /></div>
    </Glass>
  );
};

export const GuruModels: React.FC<{bg?: boolean}> = ({bg}) => {
  const {frame, at} = useT(GURU.start);
  const works = ease(frame, at(14.6), at(15.0));
  return (
    <AbsoluteFill>
      <Fonts />
      <Backdrop show={bg} />
      <SceneOut end={at(GURU.end)}>
        <Stage top={1090}>
          <Kicker start={at(7.85)}>What the gurus sell</Kicker>
          <Card label="Dropshipping" kind="box" f={at(9.8)} check={at(14.7)} i={0} />
          <Card label="Crypto" kind="coin" f={at(10.7)} check={at(14.8)} i={1} />
          <Card label="Affiliate marketing" kind="link" f={at(11.3)} check={at(14.9)} i={2} />
          <div style={{fontFamily: UI, fontWeight: 700, fontSize: 40, color: C.emerald, opacity: works, letterSpacing: 2}}>…and a lot of it works</div>
        </Stage>
      </SceneOut>
      <Sfx at={at(7.85)} src="transitions.mp3" volume={0.25} />
      <Sfx at={at(9.8)} src="Popups.mp3" volume={0.22} />
      <Sfx at={at(10.7)} src="Popups.mp3" volume={0.22} />
      <Sfx at={at(11.3)} src="Popups.mp3" volume={0.22} />
      <Sfx at={at(14.7)} src="Click.mp3" volume={0.3} />
    </AbsoluteFill>
  );
};
