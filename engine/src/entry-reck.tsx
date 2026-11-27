import React from "react";
import { registerRoot, Composition } from "remotion";
import { ReckShort, BONNIE_FRAMES } from "./videos/reck/Reck";
const R: React.FC = () => <Composition id="ReckShort" component={ReckShort} durationInFrames={BONNIE_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(R);
