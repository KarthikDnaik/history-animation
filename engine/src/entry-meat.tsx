import React from "react";
import { registerRoot, Composition } from "remotion";
import { MeatShort, MEAT_FRAMES } from "./videos/meat/Meat";
const R: React.FC = () => <Composition id="MeatShort" component={MeatShort} durationInFrames={MEAT_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(R);
