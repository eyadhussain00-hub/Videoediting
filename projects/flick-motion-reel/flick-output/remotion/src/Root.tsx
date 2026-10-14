import React from 'react';
import {Composition} from 'remotion';
import {FPS, H, W} from './kit';
import {DURATION, FinalReel, SCENES} from './FinalReel';

// One named composition per approved Flick scene (standalone, with backdrop), plus the merged reel Eyad asked for.
export const RemotionRoot: React.FC = () => (
  <>
    {SCENES.map(({id, C: Scene, t}) => (
      <Composition key={id} id={id} component={() => <Scene bg />} durationInFrames={Math.round((t.end - t.start) * FPS)} fps={FPS} width={W} height={H} />
    ))}
    <Composition id="final-reel" component={FinalReel} durationInFrames={DURATION} fps={FPS} width={W} height={H} />
  </>
);
