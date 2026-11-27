import React from "react";
import { registerRoot, Composition } from "remotion";
import { LarryShort, BONNIE_FRAMES } from "./videos/larry/Larry";
const R: React.FC = () => <Composition id="LarryShort" component={LarryShort} durationInFrames={BONNIE_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(R);
