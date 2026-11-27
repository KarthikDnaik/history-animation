import React from "react";
import { registerRoot, Composition } from "remotion";
import { SmokyShort, BONNIE_FRAMES } from "./videos/smoky/Smoky";
const R: React.FC = () => <Composition id="SmokyShort" component={SmokyShort} durationInFrames={BONNIE_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(R);
