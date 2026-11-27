import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { TipuShort, TIPU_FRAMES } from "./videos/tipu/Tipu";
import { EmuShort, EMU_FRAMES } from "./videos/emu/Emu";
import { RatsShort, RATS_FRAMES } from "./videos/rats/Rats";
import { KittyShort, KITTY_FRAMES } from "./videos/kitty/Kitty";
import { MikeShort, MIKE_FRAMES } from "./videos/mike/Mike";
export const Root: React.FC = () => (
  <>
    <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="TipuShort" component={TipuShort} durationInFrames={TIPU_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="EmuShort" component={EmuShort} durationInFrames={EMU_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="RatsShort" component={RatsShort} durationInFrames={RATS_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="KittyShort" component={KittyShort} durationInFrames={KITTY_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="MikeShort" component={MikeShort} durationInFrames={MIKE_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
