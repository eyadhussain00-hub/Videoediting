import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Backdrop, C, Check, ease, Fonts, Glass, Kicker, SceneOut, Sfx, Stage, UI, useSpring, useT} from '../kit';

export const SERVICES = {start: 38.0, end: 48.6};

const Glyph: React.FC<{kind: 'mega' | 'web' | 'seo'}> = ({kind}) => (
  <svg width={96} height={96} viewBox="0 0 48 48" fill="none" stroke={C.gold} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
    {kind === 'mega' && (<><path d="M8 20 v8 h6 l14 8 V12 l-14 8 Z" /><path d="M14 28 l2 9 h4 l-2 -9" /><path d="M34 18 a8 8 0 0 1 0 12" /><path d="M38 14 a14 14 0 0 1 0 20" /></>)}
    {kind === 'web' && (<><rect x="6" y="9" width="36" height="28" rx="4" /><path d="M6 16 h36" /><circle cx="11" cy="12.5" r="1" /><circle cx="15" cy="12.5" r="1" /><path d="M12 23 h14 M12 29 h22" /></>)}
    {kind === 'seo' && (<><circle cx="21" cy="21" r="11" /><path d="M29 29 l10 10" /><path d="M15 24 l4 -4 l3 3 l5 -6" /></>)}
  </svg>
);

const Tile: React.FC<{label: string; kind: 'mega' | 'web' | 'seo'; f: number}> = ({label, kind, f}) => {
  const {frame} = useT(SERVICES.start);
  const s = useSpring(f, {damping: 11, stiffness: 230});
  const press = frame >= f && frame < f + 6 ? 0.94 : 1;
  const lit = ease(frame, f, f + 8, 1, 0.35);
  return (
    <Glass glow={C.gold} style={{width: 280, height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22,
      opacity: s, transform: `translateY(${(1 - s) * 140}px) scale(${(0.6 + 0.4 * s) * press})`,
      boxShadow: `0 24px 60px rgba(0,0,0,0.55), 0 0 ${60 * lit}px ${C.gold}88`}}>
      <Glyph kind={kind} />
      <div style={{fontFamily: UI, fontWeight: 800, fontSize: 40, color: C.white, letterSpacing: 1}}>{label}</div>
    </Glass>
  );
};

const Pill: React.FC<{label: string; f: number}> = ({label, f}) => {
  const {frame} = useT(SERVICES.start);
  const s = useSpring(f);
  const c = ease(frame, f + 2, f + 12);
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '14px 30px 14px 18px', borderRadius: 999, background: 'rgba(43,209,139,0.14)',
      border: `2px solid ${C.emerald}`, opacity: s, transform: `scale(${0.7 + 0.3 * s})`}}>
      <Check size={48} progress={c} />
      <div style={{fontFamily: UI, fontWeight: 800, fontSize: 40, color: C.white, letterSpacing: 2}}>{label}</div>
    </div>
  );
};

export const ServicesStack: React.FC<{bg?: boolean}> = ({bg}) => {
  const {at} = useT(SERVICES.start);
  return (
    <AbsoluteFill>
      <Fonts />
      <Backdrop show={bg} />
      <SceneOut end={at(SERVICES.end)}>
        <Stage top={1090}>
          <Kicker start={at(38.5)}>Sell services to companies</Kicker>
          <div style={{display: 'flex', gap: 30, marginTop: 10}}>
            <Tile label="Marketing" kind="mega" f={at(41.3)} />
            <Tile label="Websites" kind="web" f={at(42.25)} />
            <Tile label="SEO" kind="seo" f={at(42.7)} />
          </div>
          <div style={{display: 'flex', gap: 24, marginTop: 14}}>
            <Pill label="BENEFICIAL" f={at(44.3)} />
            <Pill label="NEEDED" f={at(45.25)} />
          </div>
          <Pill label="PERFECT FOR BEGINNERS" f={at(47.6)} />
        </Stage>
      </SceneOut>
      <Sfx at={at(38.5)} src="transitions.mp3" volume={0.22} />
      <Sfx at={at(41.3)} src="Click.mp3" volume={0.32} />
      <Sfx at={at(42.25)} src="Click.mp3" volume={0.32} />
      <Sfx at={at(42.7)} src="Click.mp3" volume={0.32} />
      <Sfx at={at(44.3)} src="Pop.mp3" volume={0.22} />
      <Sfx at={at(45.25)} src="Pop.mp3" volume={0.22} />
      <Sfx at={at(47.6)} src="Pop.mp3" volume={0.22} />
    </AbsoluteFill>
  );
};
