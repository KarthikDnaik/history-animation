import React from "react";
import { registerRoot, Composition } from "remotion";
import { BonnieShort, BONNIE_FRAMES } from "./videos/bonnie/Bonnie";
const R: React.FC = () => <Composition id="BonnieShort" component={BonnieShort} durationInFrames={BONNIE_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(R);
