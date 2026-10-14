import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Backdrop, C, ease, Fonts, HEAD, SceneOut, Sfx, sheen, Stage, UI, useSpring, useT} from '../kit';

export const REVEAL = {start: 31.15, end: 38.0};

export const AnswerReveal: React.FC<{bg?: boolean}> = ({bg}) => {
  const {frame, at} = useT(REVEAL.start);
  const dim = ease(frame, at(31.1), at(32.5), 0, 0.55) * ease(frame, at(37.6), at(38.0), 1, 0);
  const k = useSpring(at(32.5));
  const k2 = useSpring(at(34.3));
  const hi = useSpring(at(36.6), {damping: 10, stiffness: 240});
  const sv = useSpring(at(37.1), {damping: 10, stiffness: 240});
  const flash = ease(frame, at(36.6), at(36.6) + 2) * ease(frame, at(36.6) + 2, at(36.6) + 10, 1, 0);
  const pre = ease(frame, at(36.4), at(36.6), 1, 0);
  const rays = (frame - at(36.6)) * 0.6;
  return (
    <AbsoluteFill>
      <Fonts />
      <Backdrop show={bg} />
      <AbsoluteFill style={{background: `radial-gradient(90% 60% at 50% 62%, rgba(0,0,0,${dim * 0.4}) 0%, rgba(0,0,0,${dim}) 80%)`}} />
      <SceneOut end={at(REVEAL.end)}>
        <Stage top={1060}>
          <div style={{opacity: Math.min(k, pre), fontFamily: UI, fontWeight: 800, fontSize: 40, letterSpacing: 8, color: C.dim, transform: `translateY(${(1 - k) * 30}px)`}}>
            THE BEST MODEL TO START
          </div>
          <div style={{opacity: Math.min(k2, pre), fontFamily: HEAD, fontSize: 92, color: C.white, transform: `scale(${0.85 + 0.15 * k2})`}}>
            AS A MUSLIM…
          </div>
          <div style={{position: 'absolute', top: 120, width: 1000, height: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
            {frame >= at(36.6) && (
              <svg width={1000} height={1000} viewBox="-500 -500 1000 1000" style={{position: 'absolute', opacity: 0.35 * hi, transform: `rotate(${rays}deg)`}}>
                {Array.from({length: 16}).map((_, i) => (
                  <path key={i} d="M0 0 L-28 -520 L28 -520 Z" fill={C.gold} opacity={0.35} transform={`rotate(${i * 22.5})`} />
                ))}
              </svg>
            )}
            <div style={{fontFamily: HEAD, fontSize: 190, lineHeight: 0.95, letterSpacing: 2, opacity: hi, transform: `scale(${2.2 - 1.2 * hi})`,
              ...sheen(frame, at(36.7), 22), filter: 'drop-shadow(0 14px 40px rgba(0,0,0,0.8))'}}>HIGH-TICKET</div>
            <div style={{fontFamily: HEAD, fontSize: 150, lineHeight: 1, letterSpacing: 10, color: C.white, opacity: sv, transform: `translateY(${(1 - sv) * 80}px)`,
              textShadow: '0 14px 40px rgba(0,0,0,0.8)'}}>SERVICES</div>
          </div>
        </Stage>
      </SceneOut>
      <AbsoluteFill style={{background: '#FFF6D8', opacity: flash * 0.55, mixBlendMode: 'screen'}} />
      <Sfx at={at(32.5)} src="transitions.mp3" volume={0.2} />
      <Sfx at={at(36.1)} src="Zoomin-OR-out.mp3" volume={0.3} />
      <Sfx at={at(36.6)} src="aha-moment.MP3" volume={0.32} />
      <Sfx at={at(37.1)} src="Impact.mp3" volume={0.22} />
    </AbsoluteFill>
  );
};
