import React from "react";
import { registerRoot, Composition } from "remotion";
import { DexterShort, DEXTER_FRAMES } from "./videos/dexter/Dexter";
const R: React.FC = () => <Composition id="DexterShort" component={DexterShort} durationInFrames={DEXTER_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(R);
