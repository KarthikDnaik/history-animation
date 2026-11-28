// "Tipu's Iron Rockets": ~68 s short in the flat-characters-in-a-3D-toon-world style (post chain from the bridge short).
// One three.js world (world.ts) posed per frame from the story timeline (story.ts). Post chain (look-match pass):
//   InkPass (world ink lines, own pass) -> lens blur pre + main (thin-lens DOF per shot from dofAt) ->
//   [bloom (emissive only) + NEUTRAL tone mapping + colour grade] (one merged EffectPass), MSAA 4.
// Ink runs before the DOF so lines blur with what they belong to; bloom after the DOF so glows defocus with their
// source; the grade is display-referred, so it comes after tone mapping. Every pixel-sized parameter is specified at
// 1080x1920 and scaled with the output size, so stills at --scale 0.5 and the 1440x2560 final match.
// Place changes crossfade by stacking a second canvas for the fade frames; the hook ends on a 4-frame white flash.
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, getInputProps, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { World, loadKit } from "./world";
import { dofAt } from "./cams";
import { InkPass, noInkFallback } from "./ink";
import { LensBlur, GrainEffect } from "./lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH, gradeFor } from "./grade";
import { Kit } from "./build";
import { TOTAL, FLASH_AT, SHOTS, layersAt, at, fr } from "./story";
import { Captions } from "./captions";
import { transAt, TAGS, IMPACT, MOOD } from "./edit";

export const BATBOMB_FRAMES = TOTAL;

/** A/B switches for test stills only (Remotion inputProps `{ post: { ink: false, ... } }`); everything is on by default. */
type PostToggles = { ink: boolean; lens: boolean; pre: boolean; bloom: boolean; grade: boolean; grain: boolean };
const toggles = (): PostToggles => ({ ink: true, lens: true, pre: true, bloom: true, grade: true, grain: false, ...((getInputProps() as { post?: Partial<PostToggles> }).post ?? {}) });

/** Bloom for emissive sources only (depth.md 6.4). Its MIP chain always starts at 540x960 (half of 1080x1920),
 *  whatever the output size, so the glow keeps the same size relative to the frame (e-fold ~30 px at 1080p,
 *  ~1.5 % of the frame height) at 540, 1080 and 1440 widths. ADD blend: HDR-safe (SCREEN darkens values > 1). */
const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 });
  const mip = b.mipmapBlurPass;
  const setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};

const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();

const useKit = () => {
  const [kit, setKit] = useState<Kit | null>(null);
  const [handle] = useState(() => delayRender("emu kit"));
  useEffect(() => { loadKit().then((k) => { setKit(k); continueRender(handle); }); }, [handle]);
  return kit;
};

const Inner: React.FC<{ id: number; kit: Kit }> = ({ id, kit }) => {
  const f = useCurrentFrame();
  const { camera, scene } = useThree();
  const world = useMemo(() => new World(kit, id), [kit, id]);
  // free this shot's GPU memory when its canvas unmounts (long renders mount ~17 worlds)
  useEffect(() => () => {
    world.root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mats = (Array.isArray(m.material) ? m.material : m.material ? [m.material] : []) as THREE.Material[];
      for (const mt of mats) { for (const v of Object.values(mt)) if (v && (v as THREE.Texture).isTexture) (v as THREE.Texture).dispose(); mt.dispose(); }
    });
  }, [world]);
  const target = useMemo(() => new THREE.Vector3(), []);
  const on = useMemo(toggles, []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
    grain: new GrainEffect({ amount: 0.025, cellPx: 1.5 }), // film grain, OFF by default (inputProps post.grain): the reference measures no grain and it quadruples the file size
  }), [camera, scene]);
  useEffect(() => () => { (fx.ink as unknown as { dispose?: () => void }).dispose?.(); }, [fx]);
  const post = useMemo(() => (
    <EffectComposer multisampling={4}>
      {on.ink ? <primitive object={fx.ink} dispose={null} /> : null}
      {on.lens && on.pre ? <primitive object={fx.lens.pre} dispose={null} /> : null}
      {on.lens ? <primitive object={fx.lens.main} dispose={null} /> : null}
      {on.bloom ? <primitive object={fx.bloom} dispose={null} /> : null}
      <primitive object={fx.tone} dispose={null} />
      {on.grade ? <primitive object={fx.grade} dispose={null} /> : null}
      {on.grain ? <primitive object={fx.grain} dispose={null} /> : null}
    </EffectComposer>
  ), [fx, on]);
  const cam = camera as THREE.PerspectiveCamera;
  target.copy(world.update(f, cam, scene));
  noInkFallback(world.root);
  // thin-lens focus: distance along the view axis to the shot's focus point (default: the camera's look target)
  const d = dofAt(id, f);
  cam.getWorldDirection(fwd);
  if (d.focus) fpt.set(...d.focus(f)); else fpt.copy(target);
  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = d.cInf;
  gradeFor(fx.grade, SHOTS[id - 1].light);
  fx.grain.seed = f; // deterministic per frame
  return (
    <>
      <primitive object={world.root} dispose={null} />
      {(getInputProps() as any).post?.nocomp ? null : post}
    </>
  );
};

/** test stills only: inputProps `{ post: { dpr: 0.5 } }` forces the WebGL buffer size (R3F clamps dpr to >= 1 by default) */
const dprOverride = () => (getInputProps() as { post?: { dpr?: number } }).post?.dpr;
const ShotView: React.FC<{ id: number; kit: Kit; alpha: number }> = ({ id, kit, alpha }) => (
  <AbsoluteFill style={{ opacity: alpha }}>
    <ThreeCanvas width={1080} height={1920} {...(dprOverride() ? { dpr: dprOverride() } : {})} shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
      camera={{ fov: 40, near: 0.2, far: 1500 }}>
      <Inner id={id} kit={kit} />
    </ThreeCanvas>
  </AbsoluteFill>
);

/** cut transitions (edit.ts): directional motion-blur whip (SVG blur on one axis) or a spin-blur, both scaled past the
 *  frame edge so the background never shows */
const transStyle = (f: number): { st: React.CSSProperties; blur: number } => {
  const t = transAt(f);
  if (!t) return { st: {}, blur: 0 };
  const s = (t.out ? 1 : -1) * t.dir;
  if (t.kind === "whip") return { st: { transform: `translateX(${s * 90 * t.u}px) scale(${1 + 0.2 * t.u})`, filter: "url(#whipblur)" }, blur: 70 * t.u };
  if (t.kind === "glitch") return { st: { transform: `translateX(${s * 24 * t.u}px)`, filter: "url(#glitch)" }, blur: 160 * t.u };
  return { st: { transform: `rotate(${s * 32 * t.u}deg) scale(${1.2 + 0.5 * t.u})`, filter: `blur(${16 * t.u}px)` }, blur: 0 };
};
const moodFilter = (f: number) => {
  const k = f < MOOD.a || f >= MOOD.b ? 0 : Math.min(1, (f - MOOD.a + 1) / 5);
  return k ? `saturate(${1 - 0.5 * k}) brightness(${1 - 0.2 * k}) contrast(${1 + 0.1 * k}) hue-rotate(${-8 * k}deg)` : "";
};
/** lower third in the caption slot (reference "POPE INNOCENT IV"): a thin line draws out (3 f), opens into the bar
 *  (3 f), holds, collapses back to a line (3 f). Captions give way while it is up. */
const NameTag: React.FC<{ f: number }> = ({ f }) => {
  const g = TAGS.find((x) => f >= x.a && f < x.b);
  if (!g) return null;
  const k = f - g.a, left = g.b - f - 1;
  const wide = Math.min(1, (k + 1) / 3) * Math.min(1, (left + 1) / 2), tall = Math.max(0, Math.min(1, (k - 2) / 3, left / 3));
  return (
    <AbsoluteFill style={{ alignItems: "center", pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: "73%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: 12, width: `${78 * wide}%`, justifyContent: "center" }}>
        <div style={{ width: 14, height: 8 + 70 * tall, background: g.col, borderRadius: 2, flex: "none" }} />
        <div style={{ flex: 1, background: "rgba(12,14,22,0.9)", height: 8 + 92 * tall, borderRadius: 4, overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ opacity: tall, fontFamily: "'Inter Display','Inter',sans-serif", fontWeight: 900, fontSize: 48, letterSpacing: 6, color: "#ffffff", lineHeight: 1.05, whiteSpace: "nowrap" }}>{g.name}</div>
          <div style={{ opacity: tall, fontFamily: "'Inter Display','Inter',sans-serif", fontWeight: 700, fontSize: 24, letterSpacing: 8, color: "#cfdcff", marginTop: 2 }}>{g.sub}</div>
        </div>
        <div style={{ width: 14, height: 8 + 70 * tall, background: g.col, borderRadius: 2, flex: "none" }} />
      </div>
    </AbsoluteFill>
  );
};
/** dip to black with the red punchline caption (edit.ts IMPACT) */
const Impact: React.FC<{ f: number }> = ({ f }) => {
  if (f < IMPACT.a || f >= IMPACT.b + IMPACT.up) return null;
  const k = f - IMPACT.a, black = f < IMPACT.b ? Math.min(1, (k + 1) / IMPACT.out) : 1 - (f - IMPACT.b + 1) / (IMPACT.up + 1);
  const kp = f >= IMPACT.pig ? f - IMPACT.pig : k, sc = kp < 3 ? [1.3, 0.95, 1.02][kp] : 1;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "#040304", opacity: black }} />
      {f < IMPACT.b && (
        <AbsoluteFill style={{ alignItems: "center" }}>
          <div style={{ position: "absolute", top: "73%", transform: `translateY(-50%) scale(${sc})`, fontFamily: "'Inter Display','Inter',sans-serif", fontWeight: 900, fontSize: 124, textAlign: "center", whiteSpace: "pre-line", lineHeight: 1.02, width: "92%",
            color: "#e8262f", WebkitTextStroke: "16px #0c0a0e", paintOrder: "stroke fill", letterSpacing: 1 }}>{f < IMPACT.pig ? IMPACT.pre : IMPACT.text}</div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

/** persistent context header (reference: viral talking-head reels keep a one-line "what this is" title on top, so the
 *  curiosity gap is visible from frame 0 and through the loop) */
const Header: React.FC = () => (
  <AbsoluteFill style={{ alignItems: "center", pointerEvents: "none" }}>
    <div style={{ position: "absolute", top: "6.2%", width: "88%", textAlign: "center", fontFamily: "'Inter Display', 'Inter', sans-serif", fontWeight: 900,
      fontSize: 58, lineHeight: 1.1, color: "#ffffff", textTransform: "uppercase", WebkitTextStroke: "10px #0c0a0e", paintOrder: "stroke fill", letterSpacing: 0.5 }}>
      The WW2 bomb made of <span style={{ color: "#ffd23a" }}>bats</span>
    </div>
  </AbsoluteFill>
);
/** the share prompt pill that sits under the captions for the last third (reference: "Comment AUDIT" box), gone at the
 *  hook cut so the loop frame stays identical to frame 0 */
const PILL_A = SHOTS[16].a, PILL_B = fr(at(14, "bats")) - 2;
const Pill: React.FC<{ f: number }> = ({ f }) => {
  if (f < PILL_A || f >= PILL_B || false) return null;
  const k = Math.min(1, (f - PILL_A + 1) / 6), s = k < 1 ? 0.6 + 0.5 * k - 0.1 * k * k : 1;
  return (
    <AbsoluteFill style={{ alignItems: "center", pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: "82%", transform: `translateY(-50%) scale(${s})`, background: "#ffffff", color: "#0c0a0e", borderRadius: 18,
        padding: "14px 30px", fontFamily: "'Inter Display', 'Inter', sans-serif", fontWeight: 900, fontSize: 40, textAlign: "center", boxShadow: "0 8px 20px rgba(0,0,0,0.35)" }}>
        Send this to someone who's scared of bats
      </div>
    </AbsoluteFill>
  );
};
export const BatBombShort: React.FC = () => {
  const f = useCurrentFrame();
  const kit = useKit();
  if (!kit) return null;
  const flash = f >= FLASH_AT && f < FLASH_AT + 4 ? [1, 0.75, 0.45, 0.2][f - FLASH_AT] : 0;
  const tr = transStyle(f), mood = moodFilter(f);
  const impact = (f >= IMPACT.a && f < IMPACT.b) || TAGS.some((x) => f >= x.a && f < x.b);
  return (
    <AbsoluteFill style={{ background: "#0b1430" }}>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter id="whipblur" x="-20%" y="0" width="140%" height="100%"><feGaussianBlur stdDeviation={`${tr.blur.toFixed(1)} 0`} edgeMode="duplicate" /></filter>
        <filter id="glitch" x="-10%" y="0" width="120%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.0001 0.035" numOctaves={1} seed={(f % 7) + 3} result="n" />
          <feComponentTransfer in="n" result="bands"><feFuncR type="discrete" tableValues="0.5 0.5 0 1 0.5 0.5 1 0.5" /><feFuncG type="linear" slope={0} intercept={0.5} /></feComponentTransfer>
          <feDisplacementMap in="SourceGraphic" in2="bands" scale={tr.blur.toFixed(1)} xChannelSelector="R" yChannelSelector="G" result="d" />
          <feColorMatrix in="d" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
          <feOffset in="r" dx={(tr.blur * 0.12).toFixed(1)} result="ro" />
          <feColorMatrix in="d" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="gb" />
          <feBlend in="ro" in2="gb" mode="screen" />
        </filter>
      </svg>
      <AbsoluteFill style={{ ...tr.st, ...(mood ? { filter: [tr.st.filter, mood].filter(Boolean).join(" ") } : {}) }}>
        {layersAt(f).map((l) => <ShotView key={l.id} id={l.id} kit={kit} alpha={l.alpha} />)}
      </AbsoluteFill>
      {flash > 0 && <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} />}
      <NameTag f={f} />
      {!impact && <Header />}
      {!impact && <Pill f={f} />}
      <Impact f={f} />
      {(getInputProps() as { caps?: boolean }).caps === false || impact ? null : <Captions />}
    </AbsoluteFill>
  );
};
