import React from 'react';
import {AbsoluteFill, Easing, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {CAPTIONS} from './captions';
import {C, ease, FPS, Fonts, UI} from './kit';
import {HookQuestion, HOOK} from './scenes/HookQuestion';
import {HalalRule, HALAL} from './scenes/HalalRule';
import {GuruModels, GURU} from './scenes/GuruModels';
import {HalalFilter, FILTER} from './scenes/HalalFilter';
import {EcommerceCost, ECOM} from './scenes/EcommerceCost';
import {AnswerReveal, REVEAL} from './scenes/AnswerReveal';
import {ServicesStack, SERVICES} from './scenes/ServicesStack';
import {LowBarrier, LOW} from './scenes/LowBarrier';

export const DURATION = Math.round(55.96 * FPS);

export const SCENES = [
  {id: 'hook-question', C: HookQuestion, t: HOOK},
  {id: 'halal-rule', C: HalalRule, t: HALAL},
  {id: 'guru-models', C: GuruModels, t: GURU},
  {id: 'halal-filter', C: HalalFilter, t: FILTER},
  {id: 'ecommerce-cost', C: EcommerceCost, t: ECOM},
  {id: 'answer-reveal', C: AnswerReveal, t: REVEAL},
  {id: 'services-stack', C: ServicesStack, t: SERVICES},
  {id: 'low-barrier', C: LowBarrier, t: LOW},
];

// Punch-in level per scene (alternating), eased over 6 frames at each boundary, plus a slow drift.
const ZOOMS = [1.0, 1.1, 1.0, 1.08, 1.0, 1.12, 1.03, 1.1];
const zoomAt = (frame: number) => {
  const t = frame / FPS;
  let z = ZOOMS[0];
  SCENES.forEach((s, i) => {
    const f0 = s.t.start * FPS;
    if (i > 0) z = interpolate(frame, [f0 - 3, f0 + 3], [z, ZOOMS[i]], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  });
  return z * (1 + 0.012 * Math.sin(t / 2.2));
};

const ORIGIN = '540px 520px';

const CaptionBar: React.FC = () => {
  const frame = useCurrentFrame();
  const ms = (frame / FPS) * 1000;
  if (ms < 3300) return null; // IG question sticker owns the first beat; no burned caption there
  const cap = CAPTIONS.find((c) => ms >= c.s && ms < c.e + 120) ?? null;
  return (
    <div style={{position: 'absolute', top: 890, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{minWidth: 720, height: 130, padding: '0 44px', borderRadius: 65, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
        background: 'linear-gradient(180deg, #0E1210, #050706)', border: `2px solid ${C.line}`,
        boxShadow: '0 18px 40px rgba(0,0,0,0.5)'}}>
        {cap?.w.map(([w, s], i) => {
          const f0 = (s / 1000) * FPS;
          const on = frame >= f0;
          const pop = ease(frame, f0, f0 + 4, 0.85, 1);
          return (
            <span key={i} style={{fontFamily: UI, fontWeight: 800, fontSize: 60, letterSpacing: -0.5, color: on ? C.white : 'rgba(247,244,236,0.35)',
              transform: `scale(${on ? pop : 0.92})`, display: 'inline-block', ...(on && frame < f0 + 12 ? {color: C.gold} : {})}}>{w}</span>
          );
        })}
      </div>
    </div>
  );
};

export const FinalReel: React.FC = () => {
  const frame = useCurrentFrame();
  const z = zoomAt(frame);
  const fadeIn = ease(frame, 0, 6, 0, 1);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Fonts />
      <AbsoluteFill style={{transform: `scale(${z})`, transformOrigin: ORIGIN, opacity: fadeIn}}>
        <OffthreadVideo src={staticFile('brand-assets/source.mp4')} />
        <CaptionBar />
      </AbsoluteFill>
      {/* subtle grade: vignette + bottom shade so graphics sit on a consistent dark base */}
      <AbsoluteFill style={{background: 'radial-gradient(130% 90% at 50% 35%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)'}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)'}} />
      {SCENES.map(({id, C: Scene, t}) => (
        <Sequence key={id} from={Math.round(t.start * FPS)} durationInFrames={Math.round((t.end - t.start) * FPS) + 8} name={id}>
          <Scene />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
