import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {Backdrop, C, ease, Fonts, Glass, HEAD, Kicker, SceneOut, Sfx, Stage, UI, useSpring, useT} from '../kit';

export const ECOM = {start: 22.9, end: 31.15};

const Row: React.FC<{label: string; f: number}> = ({label, f}) => {
  const s = useSpring(f);
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 22, opacity: s, transform: `translateX(${(1 - s) * -80}px)`}}>
      <div style={{width: 38, height: 38, borderRadius: 10, border: `3px solid ${C.gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{width: 16 * s, height: 16 * s, borderRadius: 4, background: C.gold}} />
      </div>
      <div style={{fontFamily: UI, fontWeight: 700, fontSize: 46, color: C.white}}>{label}</div>
    </div>
  );
};

export const EcommerceCost: React.FC<{bg?: boolean}> = ({bg}) => {
  const {frame, at} = useT(ECOM.start);
  const title = useSpring(at(25.6), {damping: 12});
  const panel = useSpring(at(26.5));
  const fill = ease(frame, at(27.3), at(28.3));
  const money = Math.round(interpolate(fill, [0, 1], [0, 10000]) / 50) * 50;
  const gaugeIn = useSpring(at(29.75));
  const needle = ease(frame, at(30.25), at(30.6), -80, 70);
  const wobble = frame > at(30.6) ? Math.sin((frame - at(30.6)) * 1.2) * 6 * Math.max(0, 1 - (frame - at(30.6)) / 10) : 0;
  return (
    <AbsoluteFill>
      <Fonts />
      <Backdrop show={bg} />
      <SceneOut end={at(ECOM.end)}>
        <Stage top={1080}>
          <Kicker start={at(24.7)}>Efficiency check</Kicker>
          <div style={{fontFamily: HEAD, fontSize: 120, color: C.white, opacity: title, transform: `scale(${0.8 + 0.2 * title})`, letterSpacing: 3,
            textShadow: '0 10px 30px rgba(0,0,0,0.7)'}}>E-COMMERCE</div>
          <Glass style={{width: 900, padding: '30px 40px', opacity: panel, transform: `translateY(${(1 - panel) * 80}px)`, display: 'flex', gap: 30}}>
            <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 20}}>
              <div style={{fontFamily: UI, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: C.dim}}>INVESTMENT</div>
              <div style={{fontFamily: HEAD, fontSize: 76, color: C.gold}}>${money.toLocaleString('en-US')}{fill >= 1 ? '+' : ''}</div>
              <div style={{height: 16, borderRadius: 8, background: 'rgba(255,255,255,0.1)', overflow: 'hidden'}}>
                <div style={{height: '100%', width: `${fill * 100}%`, background: `linear-gradient(90deg, ${C.gold}, ${C.red})`}} />
              </div>
              <Row label="Stocks" f={at(28.25)} />
              <Row label="Product research" f={at(29.0)} />
            </div>
            <div style={{width: 250, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: gaugeIn}}>
              <svg width={240} height={150} viewBox="-120 -110 240 140">
                <path d="M-95 0 A95 95 0 0 1 95 0" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={18} strokeLinecap="round" />
                <path d="M-95 0 A95 95 0 0 1 95 0" fill="none" stroke="url(#g)" strokeWidth={18} strokeLinecap="round" />
                <defs><linearGradient id="g"><stop offset="0" stopColor={C.emerald} /><stop offset="0.5" stopColor={C.gold} /><stop offset="1" stopColor={C.red} /></linearGradient></defs>
                <g transform={`rotate(${needle + wobble})`}>
                  <path d="M-6 0 L0 -82 L6 0 Z" fill={C.white} />
                </g>
                <circle r={12} fill={C.white} />
              </svg>
              <div style={{fontFamily: HEAD, fontSize: 46, color: needle > 40 ? C.red : C.dim, marginTop: 6}}>PRETTY TOUGH</div>
            </div>
          </Glass>
        </Stage>
      </SceneOut>
      <Sfx at={at(24.7)} src="transitions.mp3" volume={0.22} />
      <Sfx at={at(25.6)} src="Pop.mp3" volume={0.22} />
      <Sfx at={at(28.25)} src="Click.mp3" volume={0.3} />
      <Sfx at={at(29.0)} src="Click.mp3" volume={0.3} />
      <Sfx at={at(30.3)} src="Impact.mp3" volume={0.26} />
    </AbsoluteFill>
  );
};
