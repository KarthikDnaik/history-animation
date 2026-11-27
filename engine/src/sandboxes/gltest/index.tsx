import React from "react";
import { Composition, registerRoot, AbsoluteFill } from "remotion";
import { ThreeCanvas } from "@remotion/three";
const T: React.FC = () => {
  let info = "no webgl";
  try { const c = document.createElement("canvas"); const g = c.getContext("webgl2") as any; info = g ? "webgl2 " + g.getParameter(g.VERSION) + " | " + g.getParameter(g.RENDERER) : "no webgl2"; } catch (e) { info = String(e); }
  console.log("GLINFO", info);
  return (<AbsoluteFill style={{ background: "#222" }}>
    <ThreeCanvas width={1080} height={1920} camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={2} /><mesh rotation={[0.5, 0.5, 0]}><boxGeometry args={[2, 2, 2]} /><meshStandardMaterial color="red" /></mesh>
    </ThreeCanvas></AbsoluteFill>);
};
registerRoot(() => <Composition id="BridgeShort" component={T} durationInFrames={10} fps={30} width={1080} height={1920} />);
