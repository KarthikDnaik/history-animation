import React from "react";
import { registerRoot, Composition } from "remotion";
import { StubbyShort, STUBBY_FRAMES } from "./videos/stubby/Stubby";
const R: React.FC = () => <Composition id="StubbyShort" component={StubbyShort} durationInFrames={STUBBY_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(R);
