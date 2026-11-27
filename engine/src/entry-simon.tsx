import React from "react";
import { registerRoot, Composition } from "remotion";
import { SimonShort, SIMON_FRAMES } from "./videos/simon/Simon";
const R: React.FC = () => <Composition id="SimonShort" component={SimonShort} durationInFrames={SIMON_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(R);
