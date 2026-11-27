import React from "react";
import { registerRoot, Composition } from "remotion";
import { DanceShort, DANCE_FRAMES } from "./videos/dance/Dance";
const R: React.FC = () => <Composition id="DanceShort" component={DanceShort} durationInFrames={DANCE_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(R);
