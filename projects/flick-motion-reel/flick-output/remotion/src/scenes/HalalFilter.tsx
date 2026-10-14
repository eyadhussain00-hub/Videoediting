import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Backdrop, C, Cross, ease, Fonts, Glass, HEAD, Kicker, SceneOut, Sfx, Stage, UI, useSpring, useT} from '../kit';

export const FILTER = {start: 15.5, end: 22.9};

export const HalalFilter: React.FC<{bg?: boolean}> = ({bg}) => {
  const {frame, at} = useT(FILTER.start);
  const q = useSpring(at(17.5), {damping: 12});
  const card = useSpring(at(20.5), {damping: 13, stiffness: 160});
  const x = ease(frame, at(21.4), at(21.7));
  const shake = frame >= at(21.4) && frame < at(21.4) + 8 ? Math.sin(frame * 3) * 14 * (1 - (frame - at(21.4)) / 8) : 0;
  const strike = ease(frame, at(22.05), at(22.45));
  const tint = ease(frame, at(21.4), at(21.8));
  return (
    <AbsoluteFill>
      <Fonts />
      <Backdrop show={bg} />
      <SceneOut end={at(FILTER.end)}>
        <Stage top={1090}>
          <Kicker start={at(15.7)}>Especially for Muslims</Kicker>
          <div style={{fontFamily: HEAD, fontSize: 96, lineHeight: 1.05, textAlign: 'center', color: C.white, opacity: q,
            transform: `translateY(${(1 - q) * 40}px)`, textShadow: '0 10px 30px rgba(0,0,0,0.7)'}}>
            IN LINE WITH<br /><span style={{color: C.gold}}>OUR RELIGION?</span>
          </div>
          <Glass glow={tint > 0 ? C.red : undefined} style={{marginTop: 20, width: 860, padding: '30px 40px', display: 'flex', alignItems: 'center', gap: 28,
            opacity: card, transform: `translateY(${(1 - card) * 200}px) translateX(${shake}px)`}}>
            <div style={{fontFamily: HEAD, fontSize: 84, color: C.gold, width: 90, textAlign: 'center'}}>%</div>
            <div style={{flex: 1}}>
              <div style={{position: 'relative', display: 'inline-block', fontFamily: UI, fontWeight: 800, fontSize: 60, color: C.white}}>
                Interest <span style={{color: C.dim, fontWeight: 600}}>(riba)</span>
                <div style={{position: 'absolute', left: -6, top: '52%', height: 7, borderRadius: 4, background: C.red, width: `${strike * 106}%`}} />
              </div>
              <div style={{fontFamily: UI, fontWeight: 700, fontSize: 34, color: C.red, letterSpacing: 4, opacity: strike, marginTop: 6}}>NOT IN LINE</div>
            </div>
            <div style={{opacity: x, transform: `scale(${2 - x})`}}><Cross size={96} progress={x} /></div>
          </Glass>
        </Stage>
      </SceneOut>
      <Sfx at={at(15.7)} src="transitions.mp3" volume={0.22} />
      <Sfx at={at(17.5)} src="Pop.mp3" volume={0.22} />
      <Sfx at={at(20.5)} src="Zoomin-OR-out.mp3" volume={0.25} />
      <Sfx at={at(21.4)} src="Impact.mp3" volume={0.3} />
    </AbsoluteFill>
  );
};
