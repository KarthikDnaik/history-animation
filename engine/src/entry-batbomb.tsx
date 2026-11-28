import React from "react";
import { registerRoot, Composition } from "remotion";
import { BatBombShort, BATBOMB_FRAMES } from "./videos/batbomb/BatBomb";
const R: React.FC = () => <Composition id="BatBombShort" component={BatBombShort} durationInFrames={BATBOMB_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(R);
