import React from "react";
import { registerRoot, Composition } from "remotion";
import { ZanzibarShort, ZAN_FRAMES } from "./videos/zanzibar/Zanzibar";
const R: React.FC = () => <Composition id="ZanzibarShort" component={ZanzibarShort} durationInFrames={ZAN_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(R);
