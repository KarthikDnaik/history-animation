import React from "react";
import { registerRoot, Composition } from "remotion";
import { LustigLong, LUSTIG_FRAMES } from "./videos/lustig/Lustig";
const R: React.FC = () => <Composition id="LustigLong" component={LustigLong} durationInFrames={LUSTIG_FRAMES} fps={30} width={1920} height={1080} />;
registerRoot(R);
