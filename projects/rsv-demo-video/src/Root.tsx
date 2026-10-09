import { Composition, staticFile } from "remotion";
import { DemoAd, type DemoAdProps } from "./DemoAd";
import { sources } from "./sources";
import { buildTimeline, type CueSheet } from "./timeline";

async function sheet(name: string): Promise<CueSheet> {
  const res = await fetch(staticFile(`recordings/${name}.json`));
  if (!res.ok) throw new Error(`public/recordings/${name}.json is missing. Record it first: npm run record`);
  return res.json();
}

// One composition for every source and language: pass {"source": "clinic", "lang": "en"} as props.
// Its length comes from the storyboard and the recordings, so it is worked out before rendering.
export function Root() {
  return (
    <Composition
      id="DemoAd"
      component={DemoAd}
      width={1920}
      height={1080}
      fps={30}
      durationInFrames={1800}
      defaultProps={{ source: "clinic", lang: "ar", timeline: null } satisfies DemoAdProps}
      calculateMetadata={async ({ props }) => {
        const entry = sources[props.source];
        if (!entry) throw new Error(`Unknown source "${props.source}". Known: ${Object.keys(sources).join(", ")}`);
        const [desktop, mobile] = await Promise.all([
          sheet(`${props.source}-${props.lang}-desktop`),
          sheet(`${props.source}-${props.lang}-mobile`),
        ]);
        const timeline = buildTimeline(entry.storyboard, desktop, mobile);
        return { durationInFrames: timeline.total, fps: timeline.fps, props: { ...props, timeline } };
      }}
    />
  );
}
