import React from "react";
import { registerRoot, Composition } from "remotion";
import { BihariShort, BIHARI_FRAMES } from "./videos/bihari/Bihari";
const R: React.FC = () => <Composition id="BihariShort" component={BihariShort} durationInFrames={BIHARI_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(R);
