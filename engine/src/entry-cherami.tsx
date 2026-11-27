import React from "react";
import { registerRoot, Composition } from "remotion";
import { CherShort, CHER_FRAMES } from "./videos/cherami/Cher";
const R: React.FC = () => <Composition id="CherShort" component={CherShort} durationInFrames={CHER_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(R);
