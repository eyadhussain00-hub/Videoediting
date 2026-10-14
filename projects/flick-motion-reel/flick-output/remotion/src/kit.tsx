import React from 'react';
import {AbsoluteFill, Audio, Sequence, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

export const FPS = 25;
export const W = 1080;
export const H = 1920;

export const C = {
  gold: '#E9C46A',
  goldDeep: '#C9963B',
  emerald: '#2BD18B',
  red: '#FF4D4D',
  ink: '#07110D',
  glass: 'rgba(10, 16, 14, 0.62)',
  line: 'rgba(233, 196, 106, 0.35)',
  white: '#F7F4EC',
  dim: 'rgba(247, 244, 236, 0.62)',
};

export const fontCss = `
@font-face { font-family: 'Anton'; src: url('${staticFile('fonts/Anton.ttf')}') format('truetype'); }
@font-face { font-family: 'InterTight'; src: url('${staticFile('fonts/InterTight.ttf')}') format('truetype'); font-weight: 100 900; }
`;
export const Fonts: React.FC = () => <style>{fontCss}</style>;
export const HEAD = "'Anton', Impact, sans-serif";
export const UI = "'InterTight', 'Inter', system-ui, sans-serif";

// Seconds on the reel's timeline → frame inside a scene that starts at `start` seconds.
export const useT = (start: number) => {
  const frame = useCurrentFrame();
  const at = (sec: number) => Math.round((sec - start) * FPS);
  return {frame, at};
};

export const useSpring = (fromFrame: number, cfg: {damping?: number; stiffness?: number; mass?: number} = {}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - fromFrame, fps, config: {damping: 14, stiffness: 170, mass: 0.7, ...cfg}});
};

export const ease = (frame: number, a: number, b: number, from = 0, to = 1, e = Easing.bezier(0.22, 1, 0.36, 1)) =>
  interpolate(frame, [a, b], [from, to], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e});

// Whole-scene exit: everything lifts and fades in the last 8 frames.
export const SceneOut: React.FC<{end: number; children: React.ReactNode}> = ({end, children}) => {
  const frame = useCurrentFrame();
  const o = ease(frame, end - 8, end, 1, 0);
  const y = ease(frame, end - 8, end, 0, -60, Easing.in(Easing.cubic));
  const blur = ease(frame, end - 8, end, 0, 12);
  return <AbsoluteFill style={{opacity: o, transform: `translateY(${y}px)`, filter: `blur(${blur}px)`}}>{children}</AbsoluteFill>;
};

// Standalone scene renders get a backdrop so they read on their own; the merged reel passes bg={false}.
export const Backdrop: React.FC<{show?: boolean}> = ({show}) =>
  show ? (
    <AbsoluteFill style={{background: 'radial-gradient(120% 80% at 50% 30%, #12261D 0%, #050807 70%)'}} />
  ) : null;

export const Glass: React.FC<{style?: React.CSSProperties; children: React.ReactNode; glow?: string}> = ({style, children, glow}) => (
  <div
    style={{
      background: 'linear-gradient(160deg, rgba(28,36,32,0.78), rgba(8,12,10,0.72))',
      border: `2px solid ${glow ?? C.line}`,
      borderRadius: 28,
      boxShadow: `0 24px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)${glow ? `, 0 0 40px ${glow}55` : ''}`,
      backdropFilter: 'blur(18px)',
      ...style,
    }}
  >
    {children}
  </div>
);

export const Kicker: React.FC<{children: React.ReactNode; start: number; color?: string}> = ({children, start, color = C.gold}) => {
  const frame = useCurrentFrame();
  const s = useSpring(start);
  const w = ease(frame, start, start + 12, 0, 1);
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 18, opacity: s, transform: `translateY(${(1 - s) * 30}px)`}}>
      <div style={{width: 70 * w, height: 4, background: color, borderRadius: 2}} />
      <div style={{fontFamily: UI, fontWeight: 800, fontSize: 34, letterSpacing: 6, color, textTransform: 'uppercase', textShadow: '0 2px 12px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.8)'}}>{children}</div>
      <div style={{width: 70 * w, height: 4, background: color, borderRadius: 2}} />
    </div>
  );
};

export const Check: React.FC<{size?: number; color?: string; progress: number}> = ({size = 44, color = C.emerald, progress}) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="22" fill={color} opacity={0.18 * progress} stroke={color} strokeWidth="3" strokeDasharray={140} strokeDashoffset={140 * (1 - progress)} />
    <path d="M14 25 L21 32 L35 17" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={40} strokeDashoffset={40 * (1 - Math.min(1, progress * 1.4))} />
  </svg>
);

export const Cross: React.FC<{size?: number; progress: number}> = ({size = 44, progress}) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="22" fill={C.red} opacity={0.2 * progress} stroke={C.red} strokeWidth="3" />
    <path d="M15 15 L33 33 M33 15 L15 33" stroke={C.red} strokeWidth="5" strokeLinecap="round" strokeDasharray={60} strokeDashoffset={60 * (1 - progress)} />
  </svg>
);

// Light sweep across gold text.
export const sheen = (frame: number, start: number, dur = 18): React.CSSProperties => {
  const p = ease(frame, start, start + dur, -30, 130);
  return {
    backgroundImage: `linear-gradient(100deg, ${C.goldDeep} 0%, ${C.gold} ${p - 15}%, #FFF6D8 ${p}%, ${C.gold} ${p + 15}%, ${C.goldDeep} 100%)`,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
  };
};

// Lower-half stage: graphics live on the black shirt, below the face and caption bar.
export const Stage: React.FC<{children: React.ReactNode; top?: number}> = ({children, top = 1080}) => (
  <AbsoluteFill style={{top, bottom: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30, padding: '0 70px'}}>
    {children}
  </AbsoluteFill>
);

export const Sfx: React.FC<{at: number; src: string; volume?: number}> = ({at, src, volume = 0.3}) =>
  at < 0 ? null : (
    <Sequence from={at} layout="none">
      <Audio src={staticFile(`sounds/${src}`)} volume={volume} />
    </Sequence>
  );
