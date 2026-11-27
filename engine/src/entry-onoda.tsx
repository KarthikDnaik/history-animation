import React from "react";
import { registerRoot, Composition } from "remotion";
import { OnodaShort, ONODA_FRAMES } from "./videos/onoda/Onoda";
const R: React.FC = () => <Composition id="OnodaShort" component={OnodaShort} durationInFrames={ONODA_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(R);
