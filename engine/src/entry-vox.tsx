import React from "react";
import { registerRoot, Composition } from "remotion";
import { VoxShort, VOX_FRAMES } from "./videos/vox/Vox";
const R: React.FC = () => <Composition id="VoxShort" component={VoxShort} durationInFrames={VOX_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(R);
