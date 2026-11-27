import React from "react";
import { registerRoot, Composition } from "remotion";
import { JockeyShort, JOCKEY_FRAMES } from "./videos/jockey/Jockey";
const R: React.FC = () => <Composition id="JockeyShort" component={JockeyShort} durationInFrames={JOCKEY_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(R);
