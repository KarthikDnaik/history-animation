import React from "react";
import { registerRoot, Composition } from "remotion";
import { MinceShort, BONNIE_FRAMES } from "./videos/mince/Mince";
const R: React.FC = () => <Composition id="MinceShort" component={MinceShort} durationInFrames={BONNIE_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(R);
