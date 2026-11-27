import React from "react";
import { registerRoot, Composition } from "remotion";
import { ChurchillShort, CHURCHILL_FRAMES } from "./videos/churchill/Churchill";
const R: React.FC = () => <Composition id="ChurchillShort" component={ChurchillShort} durationInFrames={CHURCHILL_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(R);
