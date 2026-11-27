import React from "react";
import { registerRoot, Composition } from "remotion";
import { BakerShort, BONNIE_FRAMES } from "./videos/baker/Baker";
const R: React.FC = () => <Composition id="BakerShort" component={BakerShort} durationInFrames={BONNIE_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(R);
