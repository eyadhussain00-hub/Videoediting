import { Composition, registerRoot } from "remotion";
import { CommandShowcase, SHOWCASE_SECONDS } from "./CommandShowcase";

// Its own entry point, apart from the clinic ad's (src/index.ts), so rendering it loads nothing but the
// Command Centre: npm run render:command.
function ShowcaseRoot() {
  return <Composition id="CommandShowcase" component={CommandShowcase} width={1920} height={1080} fps={30} durationInFrames={SHOWCASE_SECONDS * 30} />;
}

registerRoot(ShowcaseRoot);
