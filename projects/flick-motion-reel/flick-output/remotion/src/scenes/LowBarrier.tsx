import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Backdrop, C, ease, Fonts, Glass, HEAD, SceneOut, Sfx, Stage, UI, useSpring, useT} from '../kit';

export const LOW = {start: 48.6, end: 55.96};

const Meter: React.FC<{label: string; f: number; drain: number}> = ({label, f, drain}) => {
  const {frame} = useT(LOW.start);
  const s = useSpring(f);
  const v = ease(frame, drain, drain + 14, 1, 0.12);
  const low = v < 0.3;
  return (
    <div style={{opacity: s, transform: `translateX(${(1 - s) * -100}px)`, width: '100%'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12}}>
        <div style={{fontFamily: UI, fontWeight: 800, fontSize: 40, letterSpacing: 5, color: C.white}}>{label}</div>
        <div style={{fontFamily: HEAD, fontSize: 52, color: low ? C.emerald : C.dim}}>{low ? 'LOW' : 'HIGH'}</div>
      </div>
      <div style={{height: 26, borderRadius: 13, background: 'rgba(255,255,255,0.1)', overflow: 'hidden'}}>
        <div style={{height: '100%', width: `${v * 100}%`, borderRadius: 13, background: low ? C.emerald : `linear-gradient(90deg, ${C.gold}, ${C.red})`}} />
      </div>
    </div>
  );
};

const Tool: React.FC<{d: string; f: number}> = ({d, f}) => {
  const s = useSpring(f, {damping: 10, stiffness: 240});
  return (
    <div style={{width: 120, height: 120, borderRadius: 30, border: `2px solid ${C.line}`, background: 'rgba(10,16,14,0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', opacity: s, transform: `scale(${s})`}}>
      <svg width={64} height={64} viewBox="0 0 48 48" fill="none" stroke={C.gold} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
    </div>
  );
};

export const LowBarrier: React.FC<{bg?: boolean}> = ({bg}) => {
  const {frame, at} = useT(LOW.start);
  const btn = useSpring(at(54.8), {damping: 12});
  const press = frame >= at(55.25) && frame < at(55.25) + 5 ? 0.92 : 1;
  const ring = ease(frame, at(55.25), at(55.25) + 14);
  const arrow = Math.sin(frame / 4) * 8;
  return (
    <AbsoluteFill>
      <Fonts />
      <Backdrop show={bg} />
      <SceneOut end={at(LOW.end) + 12}>
        <Stage top={1090}>
          <Glass style={{width: 900, padding: '34px 44px', display: 'flex', flexDirection: 'column', gap: 34}}>
            <Meter label="MONEY NEEDED" f={at(48.85)} drain={at(49.9)} />
            <Meter label="TIME NEEDED" f={at(50.45)} drain={at(51.5)} />
          </Glass>
          <div style={{display: 'flex', gap: 26}}>
            <Tool f={at(54.2)} d="M8 12 h32 v20 H8 Z M4 36 h40" />
            <Tool f={at(54.35)} d="M15 5 h18 a2 2 0 0 1 2 2 v34 a2 2 0 0 1 -2 2 H15 a2 2 0 0 1 -2 -2 V7 a2 2 0 0 1 2 -2 Z M22 38 h4" />
            <Tool f={at(54.5)} d="M24 6 l4 12 l12 4 l-12 4 l-4 12 l-4 -12 l-12 -4 l12 -4 Z" />
            <Tool f={at(54.65)} d="M6 14 h36 v24 H6 Z M6 14 l18 13 l18 -13" />
          </div>
          <div style={{position: 'relative', opacity: btn, transform: `scale(${(0.7 + 0.3 * btn) * press})`}}>
            <div style={{position: 'absolute', inset: -10, borderRadius: 999, border: `3px solid ${C.gold}`, opacity: 1 - ring, transform: `scale(${1 + ring * 0.25})`}} />
            <div style={{fontFamily: HEAD, fontSize: 64, letterSpacing: 3, color: C.ink, padding: '22px 56px', borderRadius: 999,
              background: `linear-gradient(180deg, #F5D98B, ${C.goldDeep})`, boxShadow: `0 20px 50px ${C.gold}55`, display: 'flex', gap: 22, alignItems: 'center'}}>
              START RIGHT AWAY <span style={{transform: `translateX(${arrow}px)`}}>→</span>
            </div>
          </div>
        </Stage>
      </SceneOut>
      <Sfx at={at(49.9)} src="Zoomin-OR-out.mp3" volume={0.25} />
      <Sfx at={at(51.5)} src="Zoomin-OR-out.mp3" volume={0.25} />
      <Sfx at={at(54.2)} src="Popups.mp3" volume={0.2} />
      <Sfx at={at(55.25)} src="Click.mp3" volume={0.35} />
    </AbsoluteFill>
  );
};
