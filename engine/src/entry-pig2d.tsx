import React from "react";
import { registerRoot, Composition } from "remotion";
import { Pig2DShort, PIG2D_FRAMES } from "./videos/pig2d/Pig2D";
const R: React.FC = () => <Composition id="Pig2DShort" component={Pig2DShort} durationInFrames={PIG2D_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(R);
