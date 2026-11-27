import React from "react";
import { registerRoot, Composition } from "remotion";
import { PigShort, PIG_FRAMES } from "./videos/pig/Pig";
const R: React.FC = () => <Composition id="PigShort" component={PigShort} durationInFrames={PIG_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(R);
