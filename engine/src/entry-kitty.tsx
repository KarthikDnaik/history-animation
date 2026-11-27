import React from "react";
import { registerRoot, Composition } from "remotion";
import { KittyShort, KITTY_FRAMES } from "./videos/kitty/Kitty";
const R: React.FC = () => <Composition id="KittyShort" component={KittyShort} durationInFrames={KITTY_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(R);
