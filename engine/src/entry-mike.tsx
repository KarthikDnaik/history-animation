import React from "react";
import { registerRoot, Composition } from "remotion";
import { MikeShort, MIKE_FRAMES } from "./videos/mike/Mike";
const R: React.FC = () => <Composition id="MikeShort" component={MikeShort} durationInFrames={MIKE_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(R);
